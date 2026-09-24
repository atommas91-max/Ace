export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'

export interface Card {
  rank: number // 2-14, where 11=J, 12=Q, 13=K, 14=A
  suit: Suit
}

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades']

export const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
}

export const RED_SUITS: Suit[] = ['hearts', 'diamonds']

export function rankLabel(rank: number): string {
  if (rank === 14) return 'A'
  if (rank === 13) return 'K'
  if (rank === 12) return 'Q'
  if (rank === 11) return 'J'
  return String(rank)
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function createShuffledDeck(): Card[] {
  const cards: Card[] = []
  for (const suit of SUITS) {
    for (let rank = 2; rank <= 14; rank++) {
      cards.push({ rank, suit })
    }
  }
  return shuffle(cards)
}
