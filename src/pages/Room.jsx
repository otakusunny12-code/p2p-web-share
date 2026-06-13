/**
 * Room.jsx
 * The core room page — handles both sender and receiver roles.
 *
 * Role detection:
 *   - If navigation state contains { file, role: 'sender' } → sender mode
 *   - Otherwise (arrived via link) → receiver mode
 *
 * Sender flow:
 *   createSenderConnection → wait for peer → startTransfer
 *
 * Receiver flow:
 *   createReceiverConnection → receive chunks → verify → download
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { Zap, AlertTriangle, CheckCircle2, XCircle, ArrowLeft, Send } from 'lucide-react'

import ConnectionStatus from '../components/ConnectionStatus.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import RoomLinkCard from '../components/RoomLinkCard.jsx'
import Dropzone from '../components/Dropzone.jsx'
import TransferLog from '../components/TransferLog.jsx'
import { useTransferLog } from '../hooks/useTransferLog.js'
import { createSenderConnection, createReceiverConnection } from '../lib/webrtc.js'
import { roomExists } from '../lib/signaling.js'

export default function Room() {
  const { roomId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  // Determine role from navigation state
  const isSender = location.state?.role === 'sender'
  const initialFile = location.state?.file ?? null

  const { entries, log } = useTransferLog()

  // ── State ──────────────────────────────────────────────────────────────────
  const [connectionState, setConnectionState] = useState('idle')
  const [progress, setProgress] = useState({ percent: 0, speedBps: 0, transferred: 0, total: 0 })
  const [transferDone, setTransferDone] = useState(false)
  const [hashResult, setHashResult] = useState(null) // { success, receivedHash, expectedHash }
  const [error, setError] = useState(null)
  const [roomValid, setRoomValid] = useState(true)
  const [receiverFileMeta, setReceiverFileMeta] = useState(null)
  const [readyToSend, setReadyToSend] = useState(false)

  const connectionRef = useRef(null)

  // ── Helpers ────────────────────────────────────────────────────────────────

  const handleConnectionState = useCallback((state) => {
    setConnectionState(
      state === 'connected' ? 'connected' :
      state === 'connecting' ? 'connecting' :
      state === 'failed' || state === 'disconnected' ? 'error' :
      'idle'
    )
    log(`Connection state: ${state}`)
  }, [log])

  const handleError = useCallback((msg) => {
    setError(msg)
    setConnectionState('error')
    log(msg, 'error')
  }, [log])

  // ── Sender setup ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isSender) return

    log('Room created. Waiting for receiver to join…')

    let conn
    ;(async () => {
      try {
        conn = await createSenderConnection(roomId, {
          onConnectionState: handleConnectionState,
          onChannelState: (state) => {
            if (state === 'open') {
              setReadyToSend(true)
              setConnectionState('connected')
              log('Peer connected — ready to send.', 'success')
            }
            if (state === 'closed') log('Channel closed.', 'warn')
          },
        })
        connectionRef.current = conn
      } catch (err) {
        handleError('Failed to set up WebRTC connection: ' + err.message)
      }
    })()

    return () => {
      connectionRef.current?.close()
    }
  }, [roomId, isSender]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Receiver setup ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (isSender) return

    ;(async () => {
      // Verify the room actually exists before attempting to connect
      const exists = await roomExists(roomId)
      if (!exists) {
        setRoomValid(false)
        setError('Room not found. The link may be expired or incorrect.')
        return
      }

      log('Joining room — connecting to sender…')
      setConnectionState('connecting')

      try {
        const conn = await createReceiverConnection(roomId, {
          onConnectionState: handleConnectionState,
          onMeta: (meta) => {
            setReceiverFileMeta(meta)
            setProgress((p) => ({ ...p, total: meta.size }))
            log(`Receiving: ${meta.name} (${(meta.size / 1024).toFixed(0)} KB)`, 'info')
          },
          onProgress: ({ percent, bytesReceived, speedBps }) => {
            setConnectionState('transferring')
            setProgress({ percent, speedBps, transferred: bytesReceived, total: receiverFileMeta?.size ?? 0 })
          },
          onComplete: ({ success, receivedHash, expectedHash, fileName }) => {
            setHashResult({ success, receivedHash, expectedHash })
            setTransferDone(true)
            setConnectionState('done')
            if (success) {
              log(`Transfer complete. Hash verified ✓`, 'success')
              log(`SHA-256: ${receivedHash.slice(0, 20)}…`, 'info')
            } else {
              log('Hash mismatch — file may be corrupted.', 'error')
            }
          },
          onError: handleError,
        })
        connectionRef.current = conn
        log('Connected to sender.', 'success')
        setConnectionState('connected')
      } catch (err) {
        handleError('Connection failed: ' + err.message)
      }
    })()

    return () => {
      connectionRef.current?.close()
    }
  }, [roomId, isSender]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Send handler (sender clicks "Send File") ───────────────────────────────

  async function handleSend() {
    if (!connectionRef.current || !initialFile) return
    setConnectionState('transferring')
    log(`Sending: ${initialFile.name}`, 'info')

    try {
      await connectionRef.current.startTransfer(initialFile, ({ percent, bytesSent, speedBps }) => {
        setProgress({ percent, speedBps, transferred: bytesSent, total: initialFile.size })
      })
      setTransferDone(true)
      setConnectionState('done')
      log('All chunks sent. Transfer complete.', 'success')
    } catch (err) {
      handleError('Transfer failed: ' + err.message)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="border-b border-space-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-beam-400" />
            <span className="font-semibold text-ink-100 tracking-tight">P2P Web Share</span>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 py-10">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Room ID + role badge */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-ink-500 uppercase tracking-widest mb-1">Room</p>
              <p className="mono-label text-lg">{roomId}</p>
            </div>
            <span className={`
              px-3 py-1 rounded-full text-xs font-semibold border
              ${isSender
                ? 'bg-beam-500/20 text-beam-400 border-beam-500/30'
                : 'bg-pulse-400/20 text-pulse-400 border-pulse-400/30'
              }
            `}>
              {isSender ? 'Sender' : 'Receiver'}
            </span>
          </div>

          {/* Room not found error */}
          {!roomValid && (
            <div className="glass-card border-red-500/30 bg-red-500/10 p-5 flex gap-3 animate-fade-in">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-400 text-sm">Room not found</p>
                <p className="text-sm text-ink-300 mt-1">
                  This room link is expired or invalid. Ask the sender to create a new room.
                </p>
                <button onClick={() => navigate('/')} className="btn-ghost mt-3 text-sm py-2">
                  Go home
                </button>
              </div>
            </div>
          )}

          {/* Sender: share link card */}
          {isSender && <RoomLinkCard roomId={roomId} />}

          {/* Connection status */}
          <div className="glass-card p-5 space-y-4">
            <ConnectionStatus state={connectionState} />

            {/* Sender: file summary + send button */}
            {isSender && initialFile && (
              <div className="space-y-4 pt-2 border-t border-space-700">
                <Dropzone file={initialFile} onFile={() => {}} disabled />

                {!transferDone && (
                  <button
                    onClick={handleSend}
                    disabled={!readyToSend || connectionState === 'transferring'}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {connectionState === 'transferring' ? (
                      <>Sending…</>
                    ) : !readyToSend ? (
                      <>Waiting for receiver to connect…</>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send file
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Receiver: incoming file info */}
            {!isSender && receiverFileMeta && (
              <div className="pt-2 border-t border-space-700">
                <p className="text-xs text-ink-500 mb-2 uppercase tracking-widest">Incoming file</p>
                <div className="glass-card p-3 flex items-center gap-3">
                  <div>
                    <p className="text-sm font-medium text-ink-100">{receiverFileMeta.name}</p>
                    <p className="text-xs text-ink-500 mt-0.5">
                      {(receiverFileMeta.size / 1024).toFixed(0)} KB · {receiverFileMeta.mimeType || 'Unknown type'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Progress bar */}
            {(connectionState === 'transferring' || (transferDone && progress.percent > 0)) && (
              <div className="pt-2 border-t border-space-700">
                <ProgressBar
                  percent={progress.percent}
                  speedBps={progress.speedBps}
                  transferred={progress.transferred}
                  total={progress.total}
                  label={transferDone ? 'Transfer complete' : undefined}
                />
              </div>
            )}
          </div>

          {/* Hash verification result */}
          {hashResult && (
            <div className={`
              glass-card p-5 flex gap-3 animate-slide-up
              ${hashResult.success ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}
            `}>
              {hashResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`font-semibold text-sm ${hashResult.success ? 'text-green-400' : 'text-red-400'}`}>
                  {hashResult.success ? 'File integrity verified' : 'Integrity check failed'}
                </p>
                <p className="text-xs text-ink-500 mt-1">SHA-256</p>
                <p className="mono-label text-xs mt-1 break-all">{hashResult.receivedHash}</p>
                {!hashResult.success && (
                  <p className="text-xs text-red-400 mt-2">
                    The received file does not match the original. Do not use this file.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* General error */}
          {error && (
            <div className="glass-card border-red-500/30 bg-red-500/10 p-4 flex gap-3 animate-fade-in">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-400">Something went wrong</p>
                <p className="text-sm text-ink-300 mt-1">{error}</p>
                <button onClick={() => navigate('/')} className="btn-ghost mt-3 text-sm py-2">
                  Start over
                </button>
              </div>
            </div>
          )}

          {/* Transfer log */}
          <TransferLog entries={entries} />

          {/* Success CTA — receiver can go home */}
          {transferDone && !isSender && hashResult?.success && (
            <div className="text-center animate-fade-in">
              <p className="text-sm text-ink-300 mb-3">File downloaded successfully.</p>
              <button onClick={() => navigate('/')} className="btn-ghost">
                Share another file
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
