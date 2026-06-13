/**
 * Home.jsx
 * Landing page — the sender's starting point.
 *
 * Flow:
 *   1. User drops or selects a file
 *   2. Clicks "Create Room"
 *   3. App hashes the file and creates a Firebase room
 *   4. Navigates to /room/:id as the sender
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { Zap, Shield, ArrowRight, Loader } from 'lucide-react'
import Dropzone from '../components/Dropzone.jsx'
import { createRoom } from '../lib/signaling.js'

export default function Home() {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleCreateRoom() {
    if (!file) return
    setLoading(true)
    setError(null)

    try {
      // Generate a short, URL-safe room ID
      const roomId = nanoid(10)

      // Save file metadata to Firebase so the receiver can display it
      await createRoom(roomId, {
        name: file.name,
        size: file.size,
        type: file.type,
      })

      // Navigate to the room as the sender, carrying the File object in state
      navigate(`/room/${roomId}`, { state: { file, role: 'sender' } })
    } catch (err) {
      console.error(err)
      setError('Failed to create room. Check your Firebase configuration and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Nav ── */}
      <header className="border-b border-space-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <Zap className="w-5 h-5 text-beam-400" />
          <span className="font-semibold text-ink-100 tracking-tight">P2P Web Share</span>
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg space-y-10 animate-slide-up">

          {/* Headline */}
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold text-ink-100 leading-tight tracking-tight">
              Send files{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-beam-400 to-pulse-400">
                directly
              </span>
            </h1>
            <p className="text-ink-300 text-base leading-relaxed max-w-sm mx-auto">
              Browser-to-browser transfer via WebRTC. No server storage, no sign-up.
              Your file never leaves your network.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { icon: <Shield className="w-3.5 h-3.5" />, label: 'No server storage' },
              { icon: <Zap className="w-3.5 h-3.5" />, label: 'Direct P2P transfer' },
              { icon: <Shield className="w-3.5 h-3.5" />, label: 'SHA-256 verified' },
            ].map(({ icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-space-800 border border-space-700 text-xs text-ink-300"
              >
                <span className="text-beam-400">{icon}</span>
                {label}
              </div>
            ))}
          </div>

          {/* Drop zone */}
          <div className="space-y-3">
            <Dropzone onFile={setFile} file={file} disabled={loading} />

            {/* Error message */}
            {error && (
              <div className="glass-card border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 animate-fade-in">
                {error}
              </div>
            )}

            {/* Create Room button */}
            <button
              onClick={handleCreateRoom}
              disabled={!file || loading}
              className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3.5"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Creating room…
                </>
              ) : (
                <>
                  Create room
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-center text-xs text-ink-500">
              You'll get a shareable link to send to the receiver.
            </p>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-space-800 px-6 py-4">
        <div className="max-w-4xl mx-auto text-center text-xs text-ink-500">
          Built with WebRTC + Firebase · File data never touches the server
        </div>
      </footer>
    </div>
  )
}
