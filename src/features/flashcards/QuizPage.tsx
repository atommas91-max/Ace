import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { awardQuizCompletion, type AwardOutcome } from '../gamification/gamification'
import type { Word } from '../../lib/database.types'

interface Question {
  word: Word
  options: string[]
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function buildQuestions(words: Word[]): Question[] {
  return words.map((word) => {
    const distractors = shuffle(words.filter((w) => w.id !== word.id))
      .slice(0, 3)
      .map((w) => w.definition)
    return { word, options: shuffle([word.definition, ...distractors]) }
  })
}

export function QuizPage() {
  const { deckId } = useParams<{ deckId: string }>()
  const { user } = useAuth()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [outcome, setOutcome] = useState<AwardOutcome | null>(null)
  const [awarding, setAwarding] = useState(false)

  useEffect(() => {
    if (!deckId) return
    supabase
      .from('words')
      .select('*')
      .eq('deck_id', deckId)
      .then(({ data }) => {
        setQuestions(buildQuestions((data ?? []) as Word[]))
        setLoading(false)
      })
  }, [deckId])

  const question = questions[current]
  const finished = current >= questions.length && questions.length > 0

  const percent = useMemo(
    () => (questions.length ? Math.round((correctCount / questions.length) * 100) : 0),
    [correctCount, questions.length],
  )

  useEffect(() => {
    if (finished && user && !outcome && !awarding) {
      setAwarding(true)
      awardQuizCompletion(user.id, { correctCount, totalCount: questions.length })
        .then(setOutcome)
        .finally(() => setAwarding(false))
    }
  }, [finished, user, outcome, awarding, correctCount, questions.length])

  function choose(option: string) {
    if (selected) return
    setSelected(option)
    if (option === question.word.definition) setCorrectCount((c) => c + 1)
    setTimeout(() => {
      setSelected(null)
      setCurrent((c) => c + 1)
    }, 700)
  }

  if (loading) return <div className="container">Loading quiz…</div>

  if (finished) {
    return (
      <div className="container">
        <h1>Quiz complete!</h1>
        <div className="card">
          <p>
            You got <strong>{correctCount}</strong> / {questions.length} correct ({percent}%).
          </p>
          {awarding && <p>Saving your progress…</p>}
          {outcome && (
            <>
              <p style={{ color: 'var(--xp)' }}>+{outcome.xpAwarded} XP</p>
              {outcome.leveledUp && <p>🎉 You reached level {outcome.newLevel}!</p>}
              <p>Current streak: {outcome.newStreak} day{outcome.newStreak === 1 ? '' : 's'}</p>
              {outcome.newlyEarnedBadges.length > 0 && (
                <p>New badge{outcome.newlyEarnedBadges.length > 1 ? 's' : ''} unlocked: {outcome.newlyEarnedBadges.join(', ')}</p>
              )}
            </>
          )}
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <Link to="/decks" className="btn">Back to decks</Link>
            <Link to="/profile" className="btn btn-secondary">View profile</Link>
          </div>
        </div>
      </div>
    )
  }

  if (!question) return <div className="container">This deck has no words yet.</div>

  return (
    <div className="container">
      <p style={{ color: 'var(--text-muted)' }}>
        Question {current + 1} of {questions.length}
      </p>
      <div className="card">
        <h2>{question.word.term}</h2>
        {question.word.example_sentence && (
          <p style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
            “{question.word.example_sentence}”
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
          {question.options.map((option) => {
            const isCorrect = option === question.word.definition
            const showState = selected !== null
            let background: string | undefined
            if (showState && option === selected) {
              background = isCorrect ? 'var(--success)' : 'var(--danger)'
            } else if (showState && isCorrect) {
              background = 'var(--success)'
            }
            return (
              <button
                key={option}
                type="button"
                className="btn btn-secondary"
                style={background ? { background, color: 'white', borderColor: background } : undefined}
                onClick={() => choose(option)}
                disabled={selected !== null}
              >
                {option}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
