import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'

export function HomePage() {
  const { user } = useAuth()

  return (
    <div className="container">
      <h1>Learn English, one streak at a time</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        Build your vocabulary with quick quizzes, earn XP, keep your streak alive, and climb the
        leaderboard.
      </p>
      <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        {user ? (
          <Link to="/decks" className="btn">Continue learning</Link>
        ) : (
          <>
            <Link to="/signup" className="btn">Get started</Link>
            <Link to="/login" className="btn btn-secondary">Log in</Link>
          </>
        )}
      </div>
    </div>
  )
}
