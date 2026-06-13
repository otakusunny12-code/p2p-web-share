/**
 * ProgressBar.jsx
 * Shows transfer progress as a percentage with an animated fill bar
 * and current transfer speed.
 */

/**
 * Formats bytes/s into a human-readable speed string.
 * @param {number} bps
 * @returns {string}
 */
function formatSpeed(bps) {
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(1)} MB/s`
  if (bps >= 1_000) return `${(bps / 1_000).toFixed(0)} KB/s`
  return `${Math.round(bps)} B/s`
}

/**
 * Formats raw bytes into a human-readable size.
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(2)} GB`
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(0)} KB`
  return `${bytes} B`
}

/**
 * @param {{
 *   percent: number,
 *   speedBps: number,
 *   transferred: number,
 *   total: number,
 *   label?: string
 * }} props
 */
export default function ProgressBar({ percent = 0, speedBps = 0, transferred = 0, total = 0, label }) {
  const clamped = Math.min(100, Math.max(0, percent))

  return (
    <div className="w-full animate-fade-in">
      {/* Header row: label + speed */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-ink-100">
          {label ?? 'Transferring file…'}
        </span>
        {speedBps > 0 && (
          <span className="mono-label">{formatSpeed(speedBps)}</span>
        )}
      </div>

      {/* Track */}
      <div className="w-full bg-space-700 rounded-full h-2 overflow-hidden">
        {/* Fill — transitions smoothly as percent increases */}
        <div
          className="h-full rounded-full bg-gradient-to-r from-beam-500 to-pulse-400 transition-all duration-300 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>

      {/* Footer row: bytes transferred + percentage */}
      <div className="flex justify-between items-center mt-1.5">
        <span className="text-xs text-ink-500">
          {total > 0 ? `${formatBytes(transferred)} / ${formatBytes(total)}` : ''}
        </span>
        <span className="text-xs font-semibold text-beam-400">{clamped}%</span>
      </div>
    </div>
  )
}
