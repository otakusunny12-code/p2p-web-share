/**
 * download.js
 * Programmatically triggers a file download in the browser.
 * Called by the receiver after all chunks are reassembled and verified.
 *
 * Technique: create a temporary object URL, click a hidden anchor, then revoke.
 */

/**
 * Triggers a browser download of the given Blob with the given filename.
 *
 * @param {Blob} blob       - The reassembled file data
 * @param {string} fileName - Original file name from sender metadata
 */
export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()

  // Clean up: revoke the object URL after a short delay
  // to ensure the download has started before we release memory.
  setTimeout(() => {
    URL.revokeObjectURL(url)
    document.body.removeChild(anchor)
  }, 1000)
}
