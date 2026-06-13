/**
 * fileChunker.js
 * Reads a File in sequential slices and yields ArrayBuffer chunks.
 * This is an async generator — callers iterate with `for await`.
 *
 * Why chunks?
 * WebRTC DataChannels have a practical message size limit (~256 KB).
 * Chunking also lets us show real-time progress.
 */

import { CHUNK_SIZE } from './constants.js'

/**
 * Async generator that yields ArrayBuffer chunks of the given file.
 *
 * Usage:
 *   for await (const chunk of chunkFile(file)) {
 *     dataChannel.send(chunk)
 *   }
 *
 * @param {File} file
 * @param {number} [chunkSize=CHUNK_SIZE]
 * @yields {ArrayBuffer}
 */
export async function* chunkFile(file, chunkSize = CHUNK_SIZE) {
  let offset = 0

  while (offset < file.size) {
    const slice = file.slice(offset, offset + chunkSize)
    const buffer = await slice.arrayBuffer()
    yield buffer
    offset += chunkSize
  }
}

/**
 * Returns the total number of chunks for a given file size.
 * Useful for calculating progress percentages.
 *
 * @param {number} fileSize
 * @param {number} [chunkSize=CHUNK_SIZE]
 * @returns {number}
 */
export function totalChunks(fileSize, chunkSize = CHUNK_SIZE) {
  return Math.ceil(fileSize / chunkSize)
}
