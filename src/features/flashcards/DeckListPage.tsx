import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import type { Deck } from '../../lib/database.types'

export function DeckListPage() {
  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('decks')
      .select('*')
      .then(({ data }) => {
        setDecks(data ?? [])
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="container">Loading decks…</div>

  return (
    <div className="container">
      <h1>Decks</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {decks.map((deck) => (
          <Link key={deck.id} to={`/decks/${deck.id}`} className="card" style={{ textDecoration: 'none' }}>
            <h2>{deck.title}</h2>
            <p style={{ color: 'var(--text-muted)' }}>{deck.description}</p>
            {deck.cefr_level && <span className="error-text" style={{ color: 'var(--primary)' }}>CEFR {deck.cefr_level}</span>}
          </Link>
        ))}
        {decks.length === 0 && <p>No decks yet — run the Supabase schema/seed to add some.</p>}
      </div>
    </div>
  )
}
