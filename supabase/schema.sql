-- Ace: gamified English learning app
-- Run this in the Supabase SQL editor (or via `supabase db push`) on a fresh project.

-- ── profiles ────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  xp integer not null default 0,
  level integer not null default 0,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_active_date date,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── content: decks & words ─────────────────────────────────────────────
create table if not exists public.decks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  cefr_level text
);

create table if not exists public.words (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks (id) on delete cascade,
  term text not null,
  definition text not null,
  example_sentence text
);

alter table public.decks enable row level security;
alter table public.words enable row level security;

create policy "decks are public" on public.decks for select using (true);
create policy "words are public" on public.words for select using (true);

-- ── per-user progress on individual words ──────────────────────────────
create table if not exists public.user_word_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  word_id uuid not null references public.words (id) on delete cascade,
  correct_count integer not null default 0,
  incorrect_count integer not null default 0,
  last_reviewed_at timestamptz not null default now(),
  primary key (user_id, word_id)
);

alter table public.user_word_progress enable row level security;

create policy "users manage their own word progress"
  on public.user_word_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── XP ledger ───────────────────────────────────────────────────────────
create table if not exists public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

alter table public.xp_events enable row level security;

create policy "users manage their own xp events"
  on public.xp_events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── badges ──────────────────────────────────────────────────────────────
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text not null,
  icon text
);

create table if not exists public.user_badges (
  user_id uuid not null references auth.users (id) on delete cascade,
  badge_id uuid not null references public.badges (id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

create policy "badges are public" on public.badges for select using (true);

create policy "users manage their own badges"
  on public.user_badges for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── leaderboard view ────────────────────────────────────────────────────
create or replace view public.leaderboard as
select id as user_id, display_name, xp, level
from public.profiles
order by xp desc;

grant select on public.leaderboard to anon, authenticated;

-- ── seed content ────────────────────────────────────────────────────────
insert into public.badges (code, name, description, icon) values
  ('first_quiz', 'First Steps', 'Complete your first quiz', '🎯'),
  ('streak_7', 'On a Roll', 'Reach a 7-day streak', '🔥'),
  ('words_100', 'Word Collector', 'Answer 100 words correctly', '📚')
on conflict (code) do nothing;

with new_deck as (
  insert into public.decks (title, description, cefr_level)
  values ('Everyday Essentials', 'Common words used in daily conversation', 'A2')
  returning id
)
insert into public.words (deck_id, term, definition, example_sentence)
select id, term, definition, example_sentence from new_deck, (values
  ('journey', 'a trip from one place to another', 'Our journey to the coast took three hours.'),
  ('borrow', 'to take something and return it later', 'Can I borrow your pen for a minute?'),
  ('arrive', 'to reach a destination', 'The train will arrive at noon.'),
  ('polite', 'having good manners', 'She was polite to every guest.'),
  ('crowded', 'full of people', 'The market was crowded on Saturday.'),
  ('nervous', 'worried or anxious', 'He felt nervous before the interview.'),
  ('improve', 'to get better at something', 'Reading daily will improve your vocabulary.'),
  ('convenient', 'easy or useful for a purpose', 'The new store is convenient for me.'),
  ('appointment', 'a planned meeting at a set time', 'I have a dentist appointment tomorrow.'),
  ('exhausted', 'extremely tired', 'She was exhausted after the long shift.')
) as w(term, definition, example_sentence)
on conflict do nothing;
