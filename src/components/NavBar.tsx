import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'

export function NavBar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
      }}
    >
      <Link to="/" style={{ fontWeight: 700, fontSize: 18, textDecoration: 'none' }}>
        Ace
      </Link>
      {user ? (
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link to="/decks">Decks</Link>
          <Link to="/leaderboard">Leaderboard</Link>
          <Link to="/profile">Profile</Link>
          <button type="button" className="btn btn-secondary" onClick={handleSignOut}>
            Log out
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/login">Log in</Link>
          <Link to="/signup" className="btn">Sign up</Link>
        </div>
      )}
    </nav>
  )
}
