/**
 * hash.js
 * Generates a SHA-256 hash of a file using the browser's built-in
 * Web Crypto API — no external libraries needed.
 *
 * Used by the sender before transfer, and the receiver after reassembly,
 * to verify the file arrived intact.
 */

/**
 * Computes SHA-256 hash of an ArrayBuffer.
 * @param {ArrayBuffer} buffer
 * @returns {Promise<string>} hex string e.g. "a3f1bc..."
 */
export async function sha256(buffer) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Computes SHA-256 hash of a File object.
 * Reads the entire file into memory — suitable for typical file sizes.
 * @param {File} file
 * @returns {Promise<string>} hex string
 */
export async function hashFile(file) {
  const buffer = await file.arrayBuffer()
  return sha256(buffer)
}
