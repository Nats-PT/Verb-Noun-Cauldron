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
  current_stage smallint not null default 1 check (current_stage between 1 and 5),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  ends_at timestamptz,
  team_size smallint not null default 1,
  monster_hp integer not null default 0
);

-- Ensure battle columns exist on previously created tables
alter table public.teams
  add column if not exists started_at timestamptz,
  add column if not exists ends_at    timestamptz,
  add column if not exists team_size  smallint not null default 1,
  add column if not exists monster_hp integer  not null default 0;

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
  team_id integer unique references public.teams(id) on delete set null,
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
-- Idempotent: safe against concurrent calls from multiple players on the same team
-- Automatically reads authoritative score and current_stage from public.teams if not explicitly overridden
create or replace function public.record_match_result(
  p_team_id integer default null,
  p_team_name text default null,
  p_score integer default null,
  p_stage_reached smallint default null
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
  v_final_score integer;
  v_final_stage smallint;
  v_existing_id bigint;
  v_existing_name text;
  v_existing_score integer;
  v_existing_stage smallint;
  v_existing_created_at timestamptz;
begin
  -- 1. If team_id is provided, check if it was ALREADY recorded by another teammate
  if p_team_id is not null then
    select id, team_name, score, stage_reached, created_at
    into v_existing_id, v_existing_name, v_existing_score, v_existing_stage, v_existing_created_at
    from public.leaderboard
    where team_id = p_team_id;

    -- If already recorded, return the existing result and rank immediately!
    if v_existing_id is not null then
      select count(*) + 1 into v_rank
      from public.leaderboard
      where score > v_existing_score
         or (score = v_existing_score and created_at < v_existing_created_at);

      return jsonb_build_object(
        'success', true,
        'id', v_existing_id,
        'teamName', v_existing_name,
        'score', v_existing_score,
        'stageReached', v_existing_stage,
        'rank', v_rank,
        'createdAt', v_existing_created_at,
        'alreadyRecorded', true
      );
    end if;

    -- 2. Mark active team as finished in public.teams and retrieve/update authoritative score & stage
    update public.teams
    set status = 'finished',
        score = case when p_score is not null then greatest(p_score, 0) else public.teams.score end,
        current_stage = case when p_stage_reached is not null then least(greatest(p_stage_reached, 1), 5) else public.teams.current_stage end
    where id = p_team_id
    returning name, score, current_stage into v_team_name, v_final_score, v_final_stage;

    if v_team_name is null then
      v_team_name := coalesce(p_team_name, 'Team');
    end if;
  end if;

  -- Default fallbacks if team_id was not provided
  if v_team_name is null or trim(v_team_name) = '' then
    v_team_name := 'Unknown Team';
  end if;
  if v_final_score is null then
    v_final_score := greatest(coalesce(p_score, 0), 0);
  end if;
  if v_final_stage is null then
    v_final_stage := least(greatest(coalesce(p_stage_reached, 1), 1), 5);
  end if;

  -- 3. Atomic Insert with ON CONFLICT safety (handles concurrent race conditions)
  if p_team_id is not null then
    insert into public.leaderboard (team_id, team_name, score, stage_reached)
    values (p_team_id, v_team_name, v_final_score, v_final_stage)
    on conflict (team_id) do nothing
    returning id, created_at into v_new_id, v_created_at;

    -- If another concurrent transaction inserted first:
    if v_new_id is null then
      select id, team_name, score, stage_reached, created_at
      into v_new_id, v_team_name, v_final_score, v_final_stage, v_created_at
      from public.leaderboard
      where team_id = p_team_id;
    end if;
  else
    insert into public.leaderboard (team_name, score, stage_reached)
    values (v_team_name, v_final_score, v_final_stage)
    returning id, created_at into v_new_id, v_created_at;
  end if;

  -- 4. Calculate 1-indexed global rank
  select count(*) + 1 into v_rank
  from public.leaderboard
  where score > v_final_score
     or (score = v_final_score and created_at < v_created_at);

  return jsonb_build_object(
    'success', true,
    'id', v_new_id,
    'teamName', v_team_name,
    'score', v_final_score,
    'stageReached', v_final_stage,
    'rank', v_rank,
    'createdAt', v_created_at
  );
end;
$$;

grant execute on function public.record_match_result to anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 6. Combat Synchronization Functions
-- ------------------------------------------------------------------------------

-- Returns authoritative server time to calibrate client device clock skew
create or replace function public.server_now()
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select now();
$$;

grant execute on function public.server_now() to anon, authenticated, service_role;

-- Starts match for teams: computes team_size, sets started_at, ends_at (now + 5 min), and initializes Stage 1 HP
create or replace function public.start_match(p_team_ids integer[])
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ends_at timestamptz := now() + interval '5 minutes';
  v_started_at timestamptz := now();
  v_updated_count integer := 0;
  v_team_id integer;
  v_size integer;
  v_hp_per_player constant integer := 200; -- Stage 1: Slime
begin
  if p_team_ids is null or array_length(p_team_ids, 1) = 0 then
    return jsonb_build_object(
      'success', false,
      'error', 'No team IDs provided',
      'updatedCount', 0
    );
  end if;

  foreach v_team_id in array p_team_ids loop
    -- Compute team size from players table
    select count(*) into v_size
    from public.players
    where team_id = v_team_id;

    v_size := greatest(coalesce(v_size, 1), 1);

    update public.teams
    set status = 'playing',
        started_at = v_started_at,
        ends_at = v_ends_at,
        team_size = v_size,
        current_stage = 1,
        score = 0,
        monster_hp = v_hp_per_player * v_size
    where id = v_team_id and status = 'waiting';

    if found then
      v_updated_count := v_updated_count + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'success', true,
    'updatedCount', v_updated_count,
    'startedAt', to_char(v_started_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'endsAt', to_char(v_ends_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  );
end;
$$;

grant execute on function public.start_match(integer[]) to anon, authenticated, service_role;

-- Records damage hit, applies overflow damage across monsters, stage progression, and kill bonuses
create or replace function public.record_hit(p_team_id integer, p_damage integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  hp_per_player constant integer[] := array[200, 300, 450, 550, 500]; -- Matches lib/game/monsters.ts
  kill_bonus    constant integer   := 100;                             -- Matches lib/game/scoring.ts
  t public.teams%rowtype;
  v_kills integer := 0;
  v_team_size integer;
begin
  if p_damage is null or p_damage < 1 or p_damage > 120 then
    raise exception 'invalid damage %', p_damage;
  end if;

  -- Validate player membership
  if auth.uid() is not null then
    if not exists (
      select 1 from public.players
      where id = auth.uid() and team_id = p_team_id
    ) then
      raise exception 'player is not in team %', p_team_id;
    end if;
  elsif current_user = 'anon' then
    raise exception 'unauthenticated caller cannot record hit';
  end if;

  -- Lock team row to prevent concurrency races across simultaneous attacks
  select * into t from public.teams where id = p_team_id for update;
  if not found then
    raise exception 'team % not found', p_team_id;
  end if;

  -- Reject if team is not actively playing or past match end + 2s grace period
  if t.status <> 'playing' or (t.ends_at is not null and now() > t.ends_at + interval '2 seconds') then
    return jsonb_build_object(
      'accepted', false,
      'score', t.score,
      'currentStage', t.current_stage,
      'monsterHp', t.monster_hp,
      'kills', 0
    );
  end if;

  v_team_size := greatest(coalesce(t.team_size, 1), 1);

  -- Apply damage & stage transitions
  if t.current_stage < 5 then
    t.monster_hp := t.monster_hp - p_damage;
    while t.monster_hp <= 0 and t.current_stage < 5 loop
      v_kills := v_kills + 1;
      t.current_stage := t.current_stage + 1;
      t.monster_hp := case
        when t.current_stage = 5 then hp_per_player[5] * v_team_size
        else t.monster_hp + (hp_per_player[t.current_stage] * v_team_size)
      end;
    end loop;
  end if;

  -- Add damage and kill bonuses to team score
  t.score := t.score + p_damage + (v_kills * kill_bonus);

  update public.teams
  set score = t.score,
      current_stage = t.current_stage,
      monster_hp = t.monster_hp
  where id = p_team_id;

  return jsonb_build_object(
    'accepted', true,
    'score', t.score,
    'currentStage', t.current_stage,
    'monsterHp', t.monster_hp,
    'kills', v_kills
  );
end;
$$;

grant execute on function public.record_hit(integer, integer) to anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 7. Row Level Security (RLS) Policies
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
