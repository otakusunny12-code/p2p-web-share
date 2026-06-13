/**
 * signaling.js
 * Handles all communication with Firebase Realtime Database.
 *
 * This is the ONLY place in the app that touches Firebase.
 * It stores and reads WebRTC signaling data (offer, answer, ICE candidates).
 * File content NEVER passes through here.
 *
 * Room structure in Firebase:
 * rooms/{roomId}/
 *   offer        — SDP offer from sender
 *   answer       — SDP answer from receiver
 *   senderCandidates/{id}   — ICE candidates from sender
 *   receiverCandidates/{id} — ICE candidates from receiver
 *   meta/
 *     createdAt  — timestamp
 *     fileName   — original file name (shared so receiver can display it)
 *     fileSize   — file size in bytes
 *     fileType   — MIME type
 */

import {
  ref,
  set,
  get,
  push,
  onValue,
  off,
  remove,
  serverTimestamp,
} from 'firebase/database'
import { db } from './firebase.js'
import { DB_ROOMS_PATH } from './constants.js'

// ─── Room lifecycle ──────────────────────────────────────────────────────────

/**
 * Creates a new room node in Firebase with file metadata.
 * Returns the room ID.
 */
export async function createRoom(roomId, fileMeta) {
  const roomRef = ref(db, `${DB_ROOMS_PATH}/${roomId}`)
  await set(roomRef, {
    meta: {
      createdAt: serverTimestamp(),
      fileName: fileMeta.name,
      fileSize: fileMeta.size,
      fileType: fileMeta.type,
    },
  })
  return roomId
}

/**
 * Checks whether a room exists. Returns true/false.
 */
export async function roomExists(roomId) {
  const snap = await get(ref(db, `${DB_ROOMS_PATH}/${roomId}/meta`))
  return snap.exists()
}

/**
 * Fetches the file metadata stored in a room (name, size, type).
 */
export async function getRoomMeta(roomId) {
  const snap = await get(ref(db, `${DB_ROOMS_PATH}/${roomId}/meta`))
  return snap.exists() ? snap.val() : null
}

/**
 * Deletes the entire room from Firebase.
 * Call this when transfer completes or the sender leaves.
 */
export async function deleteRoom(roomId) {
  await remove(ref(db, `${DB_ROOMS_PATH}/${roomId}`))
}

// ─── Offer / Answer ──────────────────────────────────────────────────────────

/** Sender saves their SDP offer. */
export async function saveOffer(roomId, offer) {
  await set(ref(db, `${DB_ROOMS_PATH}/${roomId}/offer`), offer)
}

/** Receiver reads the SDP offer. */
export async function getOffer(roomId) {
  const snap = await get(ref(db, `${DB_ROOMS_PATH}/${roomId}/offer`))
  return snap.exists() ? snap.val() : null
}

/** Receiver saves their SDP answer. */
export async function saveAnswer(roomId, answer) {
  await set(ref(db, `${DB_ROOMS_PATH}/${roomId}/answer`), answer)
}

/**
 * Sender listens for the receiver's answer.
 * Calls callback(answer) once when the answer appears.
 * Returns an unsubscribe function.
 */
export function onAnswer(roomId, callback) {
  const answerRef = ref(db, `${DB_ROOMS_PATH}/${roomId}/answer`)
  const handler = (snap) => {
    if (snap.exists()) callback(snap.val())
  }
  onValue(answerRef, handler)
  return () => off(answerRef, 'value', handler)
}

// ─── ICE Candidates ──────────────────────────────────────────────────────────

/** Push a single ICE candidate from the sender. */
export async function addSenderCandidate(roomId, candidate) {
  await push(ref(db, `${DB_ROOMS_PATH}/${roomId}/senderCandidates`), candidate)
}

/** Push a single ICE candidate from the receiver. */
export async function addReceiverCandidate(roomId, candidate) {
  await push(ref(db, `${DB_ROOMS_PATH}/${roomId}/receiverCandidates`), candidate)
}

/**
 * Listen for new ICE candidates from the sender (used by receiver).
 * Calls callback(candidate) for each new candidate.
 * Returns an unsubscribe function.
 */
export function onSenderCandidates(roomId, callback) {
  const candRef = ref(db, `${DB_ROOMS_PATH}/${roomId}/senderCandidates`)
  const handler = (snap) => {
    snap.forEach((child) => callback(child.val()))
  }
  onValue(candRef, handler)
  return () => off(candRef, 'value', handler)
}

/**
 * Listen for new ICE candidates from the receiver (used by sender).
 * Returns an unsubscribe function.
 */
export function onReceiverCandidates(roomId, callback) {
  const candRef = ref(db, `${DB_ROOMS_PATH}/${roomId}/receiverCandidates`)
  const handler = (snap) => {
    snap.forEach((child) => callback(child.val()))
  }
  onValue(candRef, handler)
  return () => off(candRef, 'value', handler)
}
