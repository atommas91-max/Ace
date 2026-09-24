import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { xpForNextLevel } from './gamification'
import type { Badge, Profile } from '../../lib/database.types'

export function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('user_badges').select('badge_id, badges(*)').eq('user_id', user.id),
    ]).then(([profileRes, badgesRes]) => {
      setProfile((profileRes.data as unknown as Profile) ?? null)
      const rows = (badgesRes.data ?? []) as unknown as { badges: Badge }[]
      setBadges(rows.map((r) => r.badges).filter(Boolean))
      setLoading(false)
    })
  }, [user])

  if (loading || !profile) return <div className="container">Loading profile…</div>

  const nextLevelXp = xpForNextLevel(profile.level)
  const currentLevelXp = 100 * profile.level ** 2
  const progress = Math.min(
    100,
    Math.round(((profile.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100),
  )

  return (
    <div className="container">
      <h1>{profile.display_name}</h1>
      <div className="card">
        <p>Level {profile.level}</p>
        <div style={{ background: 'var(--border)', borderRadius: 8, height: 12, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, background: 'var(--xp)', height: '100%' }} />
        </div>
        <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>
          {profile.xp} XP · {nextLevelXp - profile.xp} XP to next level
        </p>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>Streak</h2>
        <p>🔥 {profile.current_streak} day{profile.current_streak === 1 ? '' : 's'} (longest: {profile.longest_streak})</p>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>Badges</h2>
        {badges.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No badges yet — complete a quiz to earn your first one!</p>}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {badges.map((badge) => (
            <div key={badge.id} title={badge.description} style={{ textAlign: 'center', width: 80 }}>
              <div style={{ fontSize: 32 }}>{badge.icon}</div>
              <div style={{ fontSize: 13 }}>{badge.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
