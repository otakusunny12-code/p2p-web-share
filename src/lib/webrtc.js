/**
 * webrtc.js
 * Core WebRTC logic for both sender and receiver sides.
 *
 * Sender flow:
 *   1. createSenderConnection() → creates RTCPeerConnection + DataChannel
 *   2. Creates SDP offer → saves to Firebase
 *   3. Listens for answer → sets remote description
 *   4. Exchanges ICE candidates via Firebase
 *   5. Once DataChannel opens → caller can start sending chunks
 *
 * Receiver flow:
 *   1. createReceiverConnection() → creates RTCPeerConnection
 *   2. Reads SDP offer → sets remote description
 *   3. Creates SDP answer → saves to Firebase
 *   4. Exchanges ICE candidates via Firebase
 *   5. Receives DataChannel → starts collecting chunks
 */

import { ICE_SERVERS, DATACHANNEL_BUFFER_THRESHOLD, CHUNK_SIZE } from './constants.js'
import {
  saveOffer,
  saveAnswer,
  getOffer,
  onAnswer,
  addSenderCandidate,
  addReceiverCandidate,
  onSenderCandidates,
  onReceiverCandidates,
} from './signaling.js'
import { chunkFile, totalChunks } from './fileChunker.js'
import { hashFile, sha256 } from './hash.js'
import { downloadBlob } from './download.js'

// ─── Sender ──────────────────────────────────────────────────────────────────

/**
 * Sets up the sender's RTCPeerConnection and DataChannel.
 * Handles the full offer/answer/ICE exchange via Firebase.
 *
 * @param {string} roomId
 * @param {object} callbacks
 * @param {(state: string) => void} callbacks.onConnectionState
 * @param {(state: string) => void} callbacks.onChannelState
 * @returns {{ startTransfer: (file: File, onProgress: Function) => Promise<void>, close: () => void }}
 */
export async function createSenderConnection(roomId, callbacks = {}) {
  const { onConnectionState, onChannelState } = callbacks

  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })

  // Create a reliable, ordered DataChannel for file chunks
  const dataChannel = pc.createDataChannel('fileTransfer', {
    ordered: true,
  })

  // Track connection state changes for the UI
  pc.onconnectionstatechange = () => {
    onConnectionState?.(pc.connectionState)
  }

  dataChannel.onopen = () => onChannelState?.('open')
  dataChannel.onclose = () => onChannelState?.('closed')
  dataChannel.onerror = (e) => onChannelState?.('error')

  // Collect ICE candidates and push them to Firebase as they arrive
  pc.onicecandidate = async ({ candidate }) => {
    if (candidate) {
      await addSenderCandidate(roomId, candidate.toJSON())
    }
  }

  // Create and save SDP offer
  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)
  await saveOffer(roomId, { type: offer.type, sdp: offer.sdp })

  // Listen for receiver's answer
  const unsubAnswer = onAnswer(roomId, async (answer) => {
    if (pc.signalingState !== 'have-local-offer') return
    await pc.setRemoteDescription(new RTCSessionDescription(answer))
    unsubAnswer()
  })

  // Listen for receiver's ICE candidates and add them
  const unsubCandidates = onReceiverCandidates(roomId, async (candidate) => {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate))
    } catch (e) {
      // Ignore invalid candidates — can happen during race conditions
    }
  })

  /**
   * Sends a file over the DataChannel in chunks.
   * Waits for bufferedamountlow events to avoid overwhelming the channel.
   *
   * @param {File} file
   * @param {(progress: object) => void} onProgress
   */
  async function startTransfer(file, onProgress) {
    // Compute hash before sending so receiver can verify
    const fileHash = await hashFile(file)

    // Send metadata first so receiver knows what to expect
    const meta = JSON.stringify({
      type: 'meta',
      name: file.name,
      size: file.size,
      mimeType: file.type,
      hash: fileHash,
      chunks: totalChunks(file.size),
    })
    dataChannel.send(meta)

    let bytesSent = 0
    let chunksSent = 0
    const total = totalChunks(file.size)
    const startTime = Date.now()

    // Set buffering threshold so we can pause when the channel is full
    dataChannel.bufferedAmountLowThreshold = DATACHANNEL_BUFFER_THRESHOLD

    for await (const chunk of chunkFile(file)) {
      // Pause sending if DataChannel buffer is full — resume on bufferedamountlow
      if (dataChannel.bufferedAmount > DATACHANNEL_BUFFER_THRESHOLD) {
        await new Promise((resolve) => {
          dataChannel.onbufferedamountlow = resolve
        })
      }

      dataChannel.send(chunk)
      bytesSent += chunk.byteLength
      chunksSent++

      const elapsed = (Date.now() - startTime) / 1000
      const speedBps = bytesSent / elapsed
      const percent = Math.round((chunksSent / total) * 100)

      onProgress?.({ percent, bytesSent, speedBps, chunksSent, total })
    }

    // Signal end of transfer
    dataChannel.send(JSON.stringify({ type: 'done' }))
  }

  function close() {
    unsubAnswer?.()
    unsubCandidates?.()
    dataChannel.close()
    pc.close()
  }

  return { startTransfer, close, dataChannel, pc }
}

// ─── Receiver ────────────────────────────────────────────────────────────────

/**
 * Sets up the receiver's RTCPeerConnection.
 * Reads the sender's offer, creates an answer, and handles incoming chunks.
 *
 * @param {string} roomId
 * @param {object} callbacks
 * @param {(state: string) => void} callbacks.onConnectionState
 * @param {(meta: object) => void} callbacks.onMeta        — called when file metadata arrives
 * @param {(progress: object) => void} callbacks.onProgress
 * @param {(result: object) => void} callbacks.onComplete  — called with { success, hash, fileName }
 * @param {(error: string) => void} callbacks.onError
 * @returns {{ close: () => void }}
 */
export async function createReceiverConnection(roomId, callbacks = {}) {
  const { onConnectionState, onMeta, onProgress, onComplete, onError } = callbacks

  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })

  pc.onconnectionstatechange = () => {
    onConnectionState?.(pc.connectionState)
    if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
      onError?.('Connection lost. The sender may have disconnected.')
    }
  }

  // Collect and push receiver ICE candidates to Firebase
  pc.onicecandidate = async ({ candidate }) => {
    if (candidate) {
      await addReceiverCandidate(roomId, candidate.toJSON())
    }
  }

  // Receive the DataChannel opened by the sender
  pc.ondatachannel = ({ channel }) => {
    const chunks = []
    let fileMeta = null
    let chunksReceived = 0
    let bytesReceived = 0
    const startTime = Date.now()

    channel.onmessage = async ({ data }) => {
      // JSON messages are control signals (meta or done)
      if (typeof data === 'string') {
        const msg = JSON.parse(data)

        if (msg.type === 'meta') {
          fileMeta = msg
          onMeta?.(msg)
          return
        }

        if (msg.type === 'done') {
          // All chunks received — reassemble
          const blob = new Blob(chunks, { type: fileMeta?.mimeType || 'application/octet-stream' })
          const buffer = await blob.arrayBuffer()
          const receivedHash = await sha256(buffer)
          const hashMatch = receivedHash === fileMeta?.hash

          onComplete?.({
            success: hashMatch,
            receivedHash,
            expectedHash: fileMeta?.hash,
            fileName: fileMeta?.name,
            blob,
          })

          if (hashMatch) {
            downloadBlob(blob, fileMeta.name)
          } else {
            onError?.('File integrity check failed — hashes do not match.')
          }
          return
        }
      }

      // Binary data = a file chunk
      chunks.push(data)
      chunksReceived++
      bytesReceived += data.byteLength

      const elapsed = (Date.now() - startTime) / 1000
      const speedBps = bytesReceived / elapsed
      const total = fileMeta?.chunks ?? 1
      const percent = Math.round((chunksReceived / total) * 100)

      onProgress?.({ percent, bytesReceived, speedBps, chunksReceived, total })
    }

    channel.onerror = () => onError?.('DataChannel error — transfer may be incomplete.')
  }

  // Read the sender's offer and create an answer
  const offer = await getOffer(roomId)
  if (!offer) throw new Error('No offer found for this room. The sender may not be ready yet.')

  await pc.setRemoteDescription(new RTCSessionDescription(offer))
  const answer = await pc.createAnswer()
  await pc.setLocalDescription(answer)
  await saveAnswer(roomId, { type: answer.type, sdp: answer.sdp })

  // Listen for sender's ICE candidates and add them
  const unsubCandidates = onSenderCandidates(roomId, async (candidate) => {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate))
    } catch (e) {
      // Ignore race-condition candidates
    }
  })

  function close() {
    unsubCandidates?.()
    pc.close()
  }

  return { close, pc }
}
