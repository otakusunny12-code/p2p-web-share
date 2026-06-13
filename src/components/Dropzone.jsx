/**
 * Dropzone.jsx
 * File selection area that accepts drag-and-drop or a click-to-browse interaction.
 * Shows a summary card once a file is selected.
 */

import { useRef, useState, useCallback } from 'react'
import { Upload, File, X } from 'lucide-react'

/**
 * Returns a human-readable file size string.
 */
function formatBytes(bytes) {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(2)} GB`
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(0)} KB`
  return `${bytes} B`
}

/**
 * @param {{
 *   onFile: (file: File) => void,
 *   file: File | null,
 *   disabled?: boolean
 * }} props
 */
export default function Dropzone({ onFile, file, disabled = false }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setDragging(false)
      if (disabled) return
      const dropped = e.dataTransfer.files[0]
      if (dropped) onFile(dropped)
    },
    [onFile, disabled]
  )

  const handleDragOver = (e) => {
    e.preventDefault()
    if (!disabled) setDragging(true)
  }

  const handleDragLeave = () => setDragging(false)

  const handleChange = (e) => {
    const picked = e.target.files[0]
    if (picked) onFile(picked)
  }

  const clearFile = (e) => {
    e.stopPropagation()
    onFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  // File selected — show summary card
  if (file) {
    return (
      <div className="glass-card p-4 flex items-center gap-4 animate-slide-up">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-beam-500/20 flex items-center justify-center">
          <File className="w-5 h-5 text-beam-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ink-100 truncate">{file.name}</p>
          <p className="text-xs text-ink-500 mt-0.5">
            {formatBytes(file.size)} · {file.type || 'Unknown type'}
          </p>
        </div>
        {!disabled && (
          <button
            onClick={clearFile}
            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-space-700 text-ink-500 hover:text-ink-100 transition-colors"
            aria-label="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    )
  }

  // No file — show drop area
  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-beam-500 hover:bg-beam-500/5'}
        ${dragging ? 'border-beam-400 bg-beam-500/10 scale-[1.01]' : 'border-space-700'}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />

      <div className="flex flex-col items-center gap-3 pointer-events-none">
        <div className="w-12 h-12 rounded-xl bg-space-700 flex items-center justify-center">
          <Upload className={`w-6 h-6 transition-colors ${dragging ? 'text-beam-400' : 'text-ink-500'}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-ink-100">
            {dragging ? 'Drop to select' : 'Drop a file here'}
          </p>
          <p className="text-xs text-ink-500 mt-1">or click to browse</p>
        </div>
      </div>
    </div>
  )
}
