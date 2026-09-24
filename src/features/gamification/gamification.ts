import { supabase } from '../../lib/supabaseClient'
import type { Profile } from '../../lib/database.types'

/** Level thresholds follow xp = 100 * level^2, i.e. level = floor(sqrt(xp / 100)). */
export function levelForXp(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100))
}

export function xpForNextLevel(level: number): number {
  return 100 * (level + 1) ** 2
}

function isYesterday(dateStr: string, today: Date): boolean {
  const d = new Date(dateStr)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  return d.toDateString() === yesterday.toDateString()
}

function isToday(dateStr: string, today: Date): boolean {
  return new Date(dateStr).toDateString() === today.toDateString()
}

export interface QuizResult {
  correctCount: number
  totalCount: number
  /** XP multiplier applied to the correct-answer portion of the score (e.g. from a poker hand bonus). Defaults to 1. */
  multiplier?: number
}

export interface AwardOutcome {
  xpAwarded: number
  newXp: number
  newLevel: number
  leveledUp: boolean
  newStreak: number
  newlyEarnedBadges: string[]
}

const XP_PER_CORRECT_ANSWER = 10
const FIRST_COMPLETION_BONUS = 20

/**
 * Central entry point for awarding progress after any learning activity.
 * Every content type (flashcards today, grammar/reading/listening later)
 * should call this on completion so XP, streaks, and badges stay consistent.
 */
export async function awardQuizCompletion(
  userId: string,
  result: QuizResult,
): Promise<AwardOutcome> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    throw new Error(profileError?.message ?? 'Profile not found')
  }

  const typedProfile = profile as Profile
  const today = new Date()

  const { count: priorQuizCount } = await supabase
    .from('xp_events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const isFirstQuiz = (priorQuizCount ?? 0) === 0
  const multiplier = result.multiplier ?? 1
  const xpAwarded =
    Math.round(result.correctCount * XP_PER_CORRECT_ANSWER * multiplier) +
    (isFirstQuiz ? FIRST_COMPLETION_BONUS : 0)

  await supabase.from('xp_events').insert({
    user_id: userId,
    amount: xpAwarded,
    reason: isFirstQuiz ? 'first_quiz_completed' : 'quiz_completed',
  })

  const newXp = typedProfile.xp + xpAwarded
  const newLevel = levelForXp(newXp)
  const leveledUp = newLevel > typedProfile.level

  let newStreak = typedProfile.current_streak
  if (!typedProfile.last_active_date) {
    newStreak = 1
  } else if (isToday(typedProfile.last_active_date, today)) {
    newStreak = typedProfile.current_streak
  } else if (isYesterday(typedProfile.last_active_date, today)) {
    newStreak = typedProfile.current_streak + 1
  } else {
    newStreak = 1
  }
  const newLongestStreak = Math.max(newStreak, typedProfile.longest_streak)

  await supabase
    .from('profiles')
    .update({
      xp: newXp,
      level: newLevel,
      current_streak: newStreak,
      longest_streak: newLongestStreak,
      last_active_date: today.toISOString().slice(0, 10),
    })
    .eq('id', userId)

  const newlyEarnedBadges = await checkAndAwardBadges(userId, {
    isFirstQuiz,
    streak: newStreak,
  })

  return { xpAwarded, newXp, newLevel, leveledUp, newStreak, newlyEarnedBadges }
}

async function checkAndAwardBadges(
  userId: string,
  ctx: { isFirstQuiz: boolean; streak: number },
): Promise<string[]> {
  const candidates: string[] = []
  if (ctx.isFirstQuiz) candidates.push('first_quiz')
  if (ctx.streak >= 7) candidates.push('streak_7')

  if (candidates.length === 0) return []

  const { data: badges } = await supabase.from('badges').select('id, code').in('code', candidates)
  if (!badges || badges.length === 0) return []

  const { data: existing } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId)

  const existingIds = new Set((existing ?? []).map((b) => b.badge_id))
  const toInsert = badges.filter((b) => !existingIds.has(b.id))
  if (toInsert.length === 0) return []

  await supabase
    .from('user_badges')
    .insert(toInsert.map((b) => ({ user_id: userId, badge_id: b.id })))

  return toInsert.map((b) => b.code)
}
