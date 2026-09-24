import type { Card } from './deck'

export const HandRank = {
  HighCard: 'high_card',
  Pair: 'pair',
  TwoPair: 'two_pair',
  ThreeOfAKind: 'three_of_a_kind',
  Straight: 'straight',
  Flush: 'flush',
  FullHouse: 'full_house',
  FourOfAKind: 'four_of_a_kind',
  StraightFlush: 'straight_flush',
  RoyalFlush: 'royal_flush',
} as const

export type HandRank = (typeof HandRank)[keyof typeof HandRank]

const LABELS: Record<HandRank, string> = {
  [HandRank.HighCard]: 'High Card',
  [HandRank.Pair]: 'Pair',
  [HandRank.TwoPair]: 'Two Pair',
  [HandRank.ThreeOfAKind]: 'Three of a Kind',
  [HandRank.Straight]: 'Straight',
  [HandRank.Flush]: 'Flush',
  [HandRank.FullHouse]: 'Full House',
  [HandRank.FourOfAKind]: 'Four of a Kind',
  [HandRank.StraightFlush]: 'Straight Flush',
  [HandRank.RoyalFlush]: 'Royal Flush',
}

/** XP multiplier paid out for each hand rank. */
export const HAND_MULTIPLIERS: Record<HandRank, number> = {
  [HandRank.HighCard]: 1,
  [HandRank.Pair]: 1.2,
  [HandRank.TwoPair]: 1.5,
  [HandRank.ThreeOfAKind]: 2,
  [HandRank.Straight]: 3,
  [HandRank.Flush]: 4,
  [HandRank.FullHouse]: 5,
  [HandRank.FourOfAKind]: 8,
  [HandRank.StraightFlush]: 15,
  [HandRank.RoyalFlush]: 25,
}

export interface HandEvaluation {
  rank: HandRank
  label: string
  multiplier: number
}

/**
 * Evaluates a poker hand of 0-5 cards. A full evaluation (straight/flush)
 * only applies at exactly 5 cards; with fewer (some quiz answers were
 * wrong) only rank groupings (pair/trips/quads) are considered.
 */
export function evaluateHand(cards: Card[]): HandEvaluation {
  if (cards.length === 0) {
    return { rank: HandRank.HighCard, label: 'No cards drawn', multiplier: 1 }
  }

  const rankCounts = new Map<number, number>()
  for (const card of cards) {
    rankCounts.set(card.rank, (rankCounts.get(card.rank) ?? 0) + 1)
  }
  const counts = [...rankCounts.values()].sort((a, b) => b - a)

  let isFlush = false
  let isStraight = false
  if (cards.length === 5) {
    isFlush = cards.every((c) => c.suit === cards[0].suit)
    const uniqueRanks = [...new Set(cards.map((c) => c.rank))].sort((a, b) => a - b)
    if (uniqueRanks.length === 5) {
      const isSequential = uniqueRanks[4] - uniqueRanks[0] === 4
      const isWheel = uniqueRanks.join(',') === '2,3,4,5,14'
      isStraight = isSequential || isWheel
    }
  }

  let rank: HandRank
  if (isStraight && isFlush) {
    const uniqueRanks = [...new Set(cards.map((c) => c.rank))].sort((a, b) => a - b)
    const isRoyal = uniqueRanks.join(',') === '10,11,12,13,14'
    rank = isRoyal ? HandRank.RoyalFlush : HandRank.StraightFlush
  } else if (counts[0] === 4) {
    rank = HandRank.FourOfAKind
  } else if (counts[0] === 3 && counts[1] === 2) {
    rank = HandRank.FullHouse
  } else if (isFlush) {
    rank = HandRank.Flush
  } else if (isStraight) {
    rank = HandRank.Straight
  } else if (counts[0] === 3) {
    rank = HandRank.ThreeOfAKind
  } else if (counts[0] === 2 && counts[1] === 2) {
    rank = HandRank.TwoPair
  } else if (counts[0] === 2) {
    rank = HandRank.Pair
  } else {
    rank = HandRank.HighCard
  }

  return { rank, label: LABELS[rank], multiplier: HAND_MULTIPLIERS[rank] }
}
