/**
 * TransferLog.jsx
 * Shows a real-time log of transfer events — helps judges see what's
 * happening under the hood during a demo.
 */

import { useEffect, useRef } from 'react'

const LEVEL_STYLES = {
  info:    'text-ink-300',
  success: 'text-green-400',
  warn:    'text-yellow-400',
  error:   'text-red-400',
}

/**
 * @param {{
 *   entries: Array<{ id: string, level: 'info'|'success'|'warn'|'error', message: string, time: string }>
 * }} props
 */
export default function TransferLog({ entries = [] }) {
  const bottomRef = useRef(null)

  // Auto-scroll to newest entry
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries])

  if (entries.length === 0) return null

  return (
    <div className="glass-card overflow-hidden animate-fade-in">
      <div className="px-4 py-3 border-b border-space-700">
        <span className="text-xs font-semibold uppercase tracking-widest text-ink-500">
          Transfer log
        </span>
      </div>
      <div className="p-3 h-40 overflow-y-auto space-y-1 font-mono text-xs">
        {entries.map((entry) => (
          <div key={entry.id} className="flex gap-2">
            <span className="text-ink-500 flex-shrink-0">{entry.time}</span>
            <span className={LEVEL_STYLES[entry.level] ?? 'text-ink-300'}>
              {entry.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
