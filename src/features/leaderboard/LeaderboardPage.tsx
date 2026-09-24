import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import type { LeaderboardRow } from '../../lib/database.types'

export function LeaderboardPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('leaderboard')
      .select('*')
      .limit(50)
      .then(({ data }) => {
        setRows(data ?? [])
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="container">Loading leaderboard…</div>

  return (
    <div className="container">
      <h1>Leaderboard</h1>
      <div className="card">
        <ol style={{ margin: 0, paddingLeft: 24 }}>
          {rows.map((row, i) => (
            <li
              key={row.user_id}
              style={{
                padding: '8px 0',
                fontWeight: row.user_id === user?.id ? 700 : 400,
                borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : undefined,
              }}
            >
              {row.display_name} — {row.xp} XP (Level {row.level})
            </li>
          ))}
        </ol>
        {rows.length === 0 && <p>No entries yet.</p>}
      </div>
    </div>
  )
}
