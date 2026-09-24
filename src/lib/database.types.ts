export interface Profile {
  id: string
  display_name: string
  xp: number
  level: number
  current_streak: number
  longest_streak: number
  last_active_date: string | null
  created_at: string
}

export interface Deck {
  id: string
  title: string
  description: string | null
  cefr_level: string | null
}

export interface Word {
  id: string
  deck_id: string
  term: string
  definition: string
  example_sentence: string | null
}

export interface UserWordProgress {
  user_id: string
  word_id: string
  correct_count: number
  incorrect_count: number
  last_reviewed_at: string
}

export interface XpEvent {
  id: string
  user_id: string
  amount: number
  reason: string
  created_at: string
}

export interface Badge {
  id: string
  code: string
  name: string
  description: string
  icon: string | null
}

export interface UserBadge {
  user_id: string
  badge_id: string
  earned_at: string
}

export interface LeaderboardRow {
  user_id: string
  display_name: string
  xp: number
  level: number
}
