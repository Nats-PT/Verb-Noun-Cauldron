-- ==============================================================================
-- Verb-Noun Cauldron - Supabase PostgreSQL Schema Definition
-- ==============================================================================
-- Target Environment: Supabase (PostgreSQL 15+)
-- Features: Auth (Anonymous Sign-In), Realtime Publications, RLS, Triggers, pg_cron
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Table: public.team_words
-- Dictionary of adjectives and nouns used for procedural team name generation.
-- ------------------------------------------------------------------------------
create table if not exists public.team_words (
  id serial primary key,
  word text not null,
  type text not null check (type in ('adjective', 'noun'))
);

-- Seed procedural team words
insert into public.team_words (word, type)
values
  ('Ancient', 'adjective'),
  ('Arcane', 'adjective'),
  ('Blazing', 'adjective'),
  ('Cosmic', 'adjective'),
  ('Cursed', 'adjective'),
  ('Frosty', 'adjective'),
  ('Golden', 'adjective'),
  ('Mystic', 'adjective'),
  ('Shadow', 'adjective'),
  ('Thunder', 'adjective'),
  ('Cauldrons', 'noun'),
  ('Dragons', 'noun'),
  ('Goblins', 'noun'),
  ('Knights', 'noun'),
  ('Phoenixes', 'noun'),
  ('Potions', 'noun'),
  ('Spirits', 'noun'),
  ('Titans', 'noun'),
  ('Vipers', 'noun'),
  ('Wizards', 'noun')
on conflict do nothing;

-- ------------------------------------------------------------------------------
-- 2. Table: public.teams
-- Active match rounds and slots (Team 1 vs Team 2).
-- ------------------------------------------------------------------------------
create table if not exists public.teams (
  id serial primary key,
  name text not null,
  slot integer not null check (slot in (1, 2)),
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'finished')),
  score integer not null default 0,
  created_at timestamptz not null default now()
);

-- Ensure active teams in the same match cannot have duplicate names
create unique index if not exists idx_teams_unique_active_name 
on public.teams (name) 
where status in ('waiting', 'playing');

-- ------------------------------------------------------------------------------
-- 3. Table: public.players
-- Active lobby/match players linked to Supabase Auth anonymous guest users.
-- ------------------------------------------------------------------------------
create table if not exists public.players (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  team_id integer not null references public.teams(id) on delete cascade,
  is_ready boolean not null default false,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 4. Table: public.leaderboard
-- Permanent match history and high score records for completed games.
-- ------------------------------------------------------------------------------
create table if not exists public.leaderboard (
  id bigint generated always as identity primary key,
  team_name text not null,
  score integer not null default 0 check (score >= 0),
  stage_reached smallint not null default 1 check (stage_reached between 1 and 5),
  created_at timestamptz not null default now()
);

-- Index for instant top-N query & deterministic tie-breaking (earlier run wins ties)
create index if not exists idx_leaderboard_score_created 
on public.leaderboard (score desc, created_at asc);

-- ------------------------------------------------------------------------------
-- 5. Stored Procedures & Functions
-- ------------------------------------------------------------------------------

-- Procedurally generates a unique team name avoiding active collisions
create or replace function public.generate_team_name()
returns text
language plpgsql
set search_path = public
as $$
declare
  new_name text;
  attempts integer := 0;
begin
  loop
    select
      (select word from public.team_words where type = 'adjective' order by random() limit 1)
      || ' ' ||
      (select word from public.team_words where type = 'noun' order by random() limit 1)
    into new_name;

    -- Ensure the name is not currently in use by an active team
    if not exists (
      select 1 from public.teams 
      where status in ('waiting', 'playing') 
        and name = new_name
    ) or attempts >= 10 then
      exit;
    end if;

    attempts := attempts + 1;
  end loop;

  return new_name;
end;
$$;

-- Trigger function: Enforces maximum 5 players per team
create or replace function public.check_team_capacity()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (tg_op = 'INSERT' or (tg_op = 'UPDATE' and new.team_id <> old.team_id)) then
    if (select count(*) from public.players where team_id = new.team_id) >= 5 then
      raise exception 'Team is already full (maximum 5 players allowed)';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_team_capacity on public.players;
create trigger enforce_team_capacity
  before insert or update on public.players
  for each row
  execute function public.check_team_capacity();

-- Records match completion, updates team to 'finished', and computes 1-indexed global rank
create or replace function public.record_match_result(
  p_team_id integer default null,
  p_team_name text default null,
  p_score integer default 0,
  p_stage_reached smallint default 1
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_name text := p_team_name;
  v_new_id bigint;
  v_created_at timestamptz;
  v_rank bigint;
begin
  -- 1. If team_id is provided, resolve team name if missing and update team status to finished
  if p_team_id is not null then
    update public.teams
    set status = 'finished', score = p_score
    where id = p_team_id
    returning name into v_team_name;

    if v_team_name is null then
      v_team_name := coalesce(p_team_name, 'Team');
    end if;
  end if;

  if v_team_name is null or trim(v_team_name) = '' then
    v_team_name := 'Unknown Team';
  end if;

  -- 2. Insert into leaderboard table
  insert into public.leaderboard (team_name, score, stage_reached)
  values (v_team_name, greatest(p_score, 0), least(greatest(p_stage_reached, 1), 5))
  returning id, created_at into v_new_id, v_created_at;

  -- 3. Calculate rank (1-indexed) based on (score desc, created_at asc)
  select count(*) + 1 into v_rank
  from public.leaderboard
  where score > p_score
     or (score = p_score and created_at < v_created_at);

  return jsonb_build_object(
    'success', true,
    'id', v_new_id,
    'teamName', v_team_name,
    'score', p_score,
    'stageReached', p_stage_reached,
    'rank', v_rank,
    'createdAt', v_created_at
  );
end;
$$;

grant execute on function public.record_match_result to anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 6. Row Level Security (RLS) Policies
-- ------------------------------------------------------------------------------
alter table public.team_words enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.leaderboard enable row level security;

-- team_words: Read-only for all
drop policy if exists "Allow read team_words" on public.team_words;
create policy "Allow read team_words" on public.team_words
  for select using (true);

-- teams: Read, Insert, Update
drop policy if exists "Allow read teams" on public.teams;
create policy "Allow read teams" on public.teams
  for select using (true);

drop policy if exists "Allow insert teams" on public.teams;
create policy "Allow insert teams" on public.teams
  for insert with check (true);

drop policy if exists "Allow update teams" on public.teams;
create policy "Allow update teams" on public.teams
  for update using (true);

-- players: Read, Insert, Update, Delete
drop policy if exists "Allow read players" on public.players;
create policy "Allow read players" on public.players
  for select using (true);

drop policy if exists "Allow insert players" on public.players;
create policy "Allow insert players" on public.players
  for insert with check (true);

drop policy if exists "Allow update players" on public.players;
create policy "Allow update players" on public.players
  for update using (true);

drop policy if exists "Allow delete players" on public.players;
create policy "Allow delete players" on public.players
  for delete using (true);

-- leaderboard: Read & Insert
drop policy if exists "Allow read leaderboard" on public.leaderboard;
create policy "Allow read leaderboard" on public.leaderboard
  for select using (true);

drop policy if exists "Allow insert leaderboard" on public.leaderboard;
create policy "Allow insert leaderboard" on public.leaderboard
  for insert with check (true);

-- ------------------------------------------------------------------------------
-- 7. Supabase Realtime Setup
-- ------------------------------------------------------------------------------
alter table public.teams replica identity full;
alter table public.players replica identity full;
alter table public.leaderboard replica identity full;

alter publication supabase_realtime add table public.teams;
alter publication supabase_realtime add table public.players;
alter publication supabase_realtime add table public.leaderboard;

-- ------------------------------------------------------------------------------
-- 8. Background Cleanup Cron Job (pg_cron)
-- Automatically removes old inactive anonymous guest auth records after 2 hours
-- ------------------------------------------------------------------------------
-- select cron.schedule(
--   'cleanup-old-anonymous-users',
--   '0 * * * *',
--   $$
--     delete from auth.users
--     where is_anonymous is true
--       and last_sign_in_at < now() - interval '2 hours';
--   $$
-- );
