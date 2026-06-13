/**
 * RoomLinkCard.jsx
 * Displays the room link and a one-click copy button.
 * The link is what the sender shares with the receiver.
 */

import { useState } from 'react'
import { Copy, Check, Link } from 'lucide-react'

/**
 * @param {{ roomId: string }} props
 */
export default function RoomLinkCard({ roomId }) {
  const [copied, setCopied] = useState(false)

  const link = `${window.location.origin}/room/${roomId}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for browsers without clipboard API
      const input = document.createElement('input')
      input.value = link
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="glass-card p-4 animate-slide-up">
      <div className="flex items-center gap-2 mb-3">
        <Link className="w-4 h-4 text-beam-400" />
        <span className="text-xs font-semibold uppercase tracking-widest text-ink-500">
          Share this link
        </span>
      </div>

      <div className="flex gap-2">
        {/* Link display */}
        <div className="flex-1 bg-space-900 border border-space-700 rounded-xl px-3 py-2.5 overflow-hidden">
          <p className="font-mono text-xs text-pulse-400 truncate">{link}</p>
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className={`
            flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
            transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-beam-400 focus:ring-offset-2 focus:ring-offset-space-900
            ${copied
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-beam-500/20 hover:bg-beam-500/30 text-beam-400 border border-beam-500/30'
            }
          `}
          aria-label="Copy room link"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-ink-500 mt-3">
        Send this link to the person who will receive the file. They must open it in their browser.
      </p>
    </div>
  )
}
