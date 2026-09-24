# Ace

A gamified English learning web app: vocabulary quizzes with a poker hand-building twist, XP, levels, streaks, badges, and a leaderboard.

## Stack

- React + Vite + TypeScript
- React Router
- Supabase (Postgres + Auth) for accounts and progress, synced across devices
- Deployed on Vercel

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com), then run `supabase/schema.sql` in the SQL editor (Project → SQL Editor → paste and run). This creates all tables, row-level security policies, the leaderboard view, badge definitions, and a sample "Everyday Essentials" deck.

3. **Configure environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your Supabase project's API settings.

4. **Run locally**

   ```bash
   npm run dev
   ```

5. **Build**

   ```bash
   npm run build
   ```

## Deploying

Connect the GitHub repo to a Vercel project (Vite framework preset is auto-detected) and add the same two `VITE_SUPABASE_*` environment variables in the Vercel project settings.

## How gamification works

All XP/level/streak/badge logic lives in `src/features/gamification/gamification.ts`, behind a single `awardQuizCompletion` function. Any future content type (grammar, reading, listening) should call this same function on completion so scoring stays consistent across the app.

- **Poker hands**: each quiz is a 5-question round (`src/features/flashcards/QuizPage.tsx`). A correct answer draws a card from a shuffled 52-card deck (`src/features/poker/deck.ts`); the 5 cards collected are evaluated as a poker hand (`src/features/poker/handEvaluator.ts`) — pair, flush, full house, etc. — each hand rank paying out an XP multiplier (1x for high card up to 25x for a royal flush).
- **XP & levels**: 10 XP per correct answer × the round's poker multiplier, +20 bonus on your first ever quiz. Level = `floor(sqrt(xp / 100))`.
- **Streaks**: increments once per calendar day you complete a round; resets if you miss a day.
- **Badges**: awarded automatically (first quiz, 7-day streak, more to come) — see the `badges` table.
- **Leaderboard**: a public Postgres view (`leaderboard`) ranking all profiles by total XP.

## Project structure

```
src/
  lib/               — Supabase client + shared domain types
  features/
    auth/            — signup/login, auth context
    flashcards/      — deck list, poker-round quiz flow
    gamification/    — XP/level/streak/badge engine, profile page
    leaderboard/     — leaderboard page
    poker/           — playing card deck, hand evaluator, card UI
  components/        — shared UI (NavBar, ProtectedRoute)
  routes/            — top-level pages (Home)
supabase/
  schema.sql         — full DB schema, RLS policies, seed content
```
