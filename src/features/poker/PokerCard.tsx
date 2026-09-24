import { RED_SUITS, SUIT_SYMBOLS, rankLabel, type Card } from './deck'

interface PokerCardProps {
  card?: Card
}

export function PokerCard({ card }: PokerCardProps) {
  if (!card) {
    return (
      <div
        style={{
          width: 56,
          height: 78,
          borderRadius: 8,
          border: '2px dashed var(--border)',
        }}
      />
    )
  }

  const isRed = RED_SUITS.includes(card.suit)

  return (
    <div
      style={{
        width: 56,
        height: 78,
        borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: isRed ? 'var(--danger)' : 'var(--text)',
        fontWeight: 700,
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }}
    >
      <div style={{ fontSize: 20, lineHeight: 1 }}>{rankLabel(card.rank)}</div>
      <div style={{ fontSize: 22, lineHeight: 1 }}>{SUIT_SYMBOLS[card.suit]}</div>
    </div>
  )
}
