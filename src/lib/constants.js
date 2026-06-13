/**
 * constants.js
 * Central place for all tunable values.
 * Change CHUNK_SIZE here to adjust transfer performance.
 */

// File is split into chunks of this size before sending over DataChannel.
// 16 KB is conservative and safe across all browsers.
// Can safely increase to 64 KB for faster transfers on modern browsers.
export const CHUNK_SIZE = 16 * 1024 // 16 KB

// How many bytes can be buffered in the DataChannel before we pause sending.
// Prevents "buffer full" errors on large files.
export const DATACHANNEL_BUFFER_THRESHOLD = 256 * 1024 // 256 KB

// How long (ms) to wait for a peer to join before showing a timeout hint.
export const PEER_JOIN_TIMEOUT_MS = 60_000 // 1 minute

// STUN servers — public Google STUN, no auth required.
// These help peers discover their public IP/port for the WebRTC handshake.
export const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

// Firebase Realtime Database paths
export const DB_ROOMS_PATH = 'rooms'
