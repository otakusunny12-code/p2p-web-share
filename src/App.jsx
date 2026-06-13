import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Room from './pages/Room.jsx'

/**
 * App — sets up client-side routing.
 *
 * Routes:
 *   /          → Home page (create room + file select)
 *   /room/:id  → Room page (sender view or receiver view depending on state)
 *   *          → Redirect to home
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomId" element={<Room />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
