/**
 * ConnectionStatus.jsx
 * Shows the current WebRTC connection state with a color-coded dot.
 * Helps the demo evaluator see what's happening at a glance.
 */

const STATE_CONFIG = {
  idle:         { label: 'Waiting for peer',    color: 'bg-ink-500',   pulse: false },
  connecting:   { label: 'Connecting…',         color: 'bg-yellow-400', pulse: true  },
  connected:    { label: 'Connected',            color: 'bg-pulse-400', pulse: false },
  transferring: { label: 'Transferring',         color: 'bg-beam-400',  pulse: true  },
  done:         { label: 'Transfer complete',    color: 'bg-green-400', pulse: false },
  error:        { label: 'Connection error',     color: 'bg-red-400',   pulse: false },
  disconnected: { label: 'Disconnected',         color: 'bg-red-400',   pulse: false },
}

/**
 * @param {{ state: string }} props
 */
export default function ConnectionStatus({ state = 'idle' }) {
  const config = STATE_CONFIG[state] ?? STATE_CONFIG.idle

  return (
    <div className="flex items-center gap-2.5">
      <span className="relative flex h-2.5 w-2.5">
        {config.pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${config.color}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.color}`} />
      </span>
      <span className="text-sm text-ink-300">{config.label}</span>
    </div>
  )
}
