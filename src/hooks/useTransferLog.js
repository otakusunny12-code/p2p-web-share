/**
 * useTransferLog.js
 * Simple hook that maintains an ordered list of transfer log entries.
 * Each entry has an id, level, message, and timestamp.
 */

import { useState, useCallback } from 'react'

let counter = 0

function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

/**
 * @returns {{ entries: Array, log: Function, clear: Function }}
 */
export function useTransferLog() {
  const [entries, setEntries] = useState([])

  const log = useCallback((message, level = 'info') => {
    setEntries((prev) => [
      ...prev,
      { id: String(++counter), level, message, time: now() },
    ])
  }, [])

  const clear = useCallback(() => setEntries([]), [])

  return { entries, log, clear }
}
