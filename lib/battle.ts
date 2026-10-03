import { createClient } from "./supabase/client";

export type BattleTeam = {
  id: number;
  name: string;
  status: "waiting" | "playing" | "finished";
  score: number;
  currentStage: number; // 1–5
  monsterHp: number;
  teamSize: number;
  endsAt: string | null; // ISO timestamp string
  startedAt: string | null; // ISO timestamp string
};

export type HitResult = {
  accepted: boolean; // false = match finished / not playing / out of time
  score: number;
  currentStage: number;
  monsterHp: number;
  kills: number;
};

export type CombatBroadcast = {
  playerName: string;
  verb: string;
  noun: string;
  damage: number;
  weak?: boolean;
  // Monsters knocked out by this hit — the master screen skips the hit flash / weak! on a knockout, like the phone does
  kills?: number;
  // MVP on the master screen: who hit, and their personal points for this hit (damage + MVP kill bonus)
  playerId?: string;
  points?: number;
};

// Sent by each phone at TIME'S UP — its own total, counted on the phone only (never stored in the DB).
// The master screen ranks these into the MVP top 3.
export type PlayerScoreBroadcast = {
  playerId: string;
  playerName: string;
  score: number;
};

type DbTeamRow = {
  id: number;
  name: string;
  status: "waiting" | "playing" | "finished";
  score: number;
  current_stage: number;
  monster_hp: number;
  team_size: number;
  ends_at: string | null;
  started_at: string | null;
};

function mapTeam(row: DbTeamRow): BattleTeam {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    score: row.score,
    currentStage: row.current_stage,
    monsterHp: row.monster_hp,
    teamSize: row.team_size,
    endsAt: row.ends_at,
    startedAt: row.started_at,
  };
}

/**
 * Retrieves the current authenticated player's team details.
 * Looks up players.team_id for auth.uid(), then retrieves the matching teams record.
 */
export async function getMyBattleTeam(): Promise<BattleTeam | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("team_id")
    .eq("id", user.id)
    .maybeSingle();

  if (playerError || !player?.team_id) return null;

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("id, name, status, score, current_stage, monster_hp, team_size, ends_at, started_at")
    .eq("id", player.team_id)
    .single();

  if (teamError || !team) return null;

  return mapTeam(team as DbTeamRow);
}

export type MyMatchStatus =
  | { kind: "playing"; team: BattleTeam; me: { id: string; name: string } }
  | { kind: "waiting" } // still in the lobby (not started yet)
  | { kind: "finished" } // ended normally (a teammate already recorded the result)
  | { kind: "removed" } // staff pressed Cancel match / Reset all on the master screen
  | { kind: "unknown" }; // not logged in, or a network error — don't act on it

/**
 * Checks the current player's match: when the battle page opens, and again when the phone wakes up
 * and may have missed realtime events.
 * Cancel match / Reset all (lib/master.ts) set the team to 'finished' with ends_at = null and delete the player rows,
 * so "removed" = logged in but no player row, or a finished team without ends_at (a normal finish keeps ends_at).
 * Unlike getMyBattleTeam, a failed request is "unknown" rather than null — a flaky network must not kick players out.
 */
export async function getMyMatchStatus(): Promise<MyMatchStatus> {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { kind: "unknown" };

  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("team_id, name")
    .eq("id", user.id)
    .maybeSingle();
  if (playerError) return { kind: "unknown" };
  if (!player) return { kind: "removed" };

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("id, name, status, score, current_stage, monster_hp, team_size, ends_at, started_at")
    .eq("id", player.team_id)
    .maybeSingle();
  if (teamError) return { kind: "unknown" };
  if (!team) return { kind: "removed" };

  if (team.status === "playing") {
    return { kind: "playing", team: mapTeam(team as DbTeamRow), me: { id: user.id, name: player.name } };
  }
  if (team.status === "waiting") return { kind: "waiting" };
  return team.ends_at === null ? { kind: "removed" } : { kind: "finished" };
}

/**
 * Calculates clock skew in milliseconds between server time and local device clock.
 * Usage: synchronizedServerTime ≈ Date.now() + offset
 */
export async function getServerClockOffset(): Promise<number> {
  const supabase = createClient();
  const start = Date.now();

  const { data, error } = await supabase.rpc("server_now");
  if (error || !data) return 0;

  const roundTrip = Date.now() - start;
  const serverTime = new Date(data).getTime();
  // Compensate for half round-trip network latency
  const estimatedServerNow = serverTime + Math.round(roundTrip / 2);
  return estimatedServerNow - Date.now();
}

/**
 * Starts a match for one or more teams atomically in the database.
 * Sets status to 'playing', ends_at to now + 5 min, computes team_size, and sets Stage 1 HP.
 * Typically invoked by the Master screen coordinator.
 */
export async function startMatch(
  teamIds: number[]
): Promise<{ success: boolean; endsAt?: string; error?: string }> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("start_match", {
    p_team_ids: teamIds,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return data as {
    success: boolean;
    endsAt?: string;
    error?: string;
  };
}

/**
 * Submits an attack hit to the database (authoritative RPC).
 * Locks the teams row, validates damage (1-120), deducts monster HP,
 * handles stage advance / overkill overflow, and updates team score.
 */
export async function recordHit(
  teamId: number,
  damage: number
): Promise<HitResult | null> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("record_hit", {
    p_team_id: teamId,
    p_damage: damage,
  });

  if (error) {
    console.error("[recordHit] Error recording hit:", error.message);
    return null;
  }

  return data as HitResult;
}

/**
 * Broadcasts an ephemeral combat hit event to teammates (~15-30ms).
 * Teammates receive this immediately to render floating damage numbers and sound effects.
 * Note: Purely cosmetic; does not alter database state.
 */
export async function broadcastCombatHit(
  teamId: number,
  hit: CombatBroadcast
): Promise<void> {
  const supabase = createClient();
  const channel = supabase.channel(`team:${teamId}:battle`);

  await channel.send({
    type: "broadcast",
    event: "combat_hit",
    payload: hit,
  });
}

/**
 * Broadcasts this phone's final personal score at TIME'S UP (sent a few times in case one is lost).
 * Uses the same team channel as combat hits; the master screen listens on both teams' channels.
 */
export async function broadcastPlayerScore(teamId: number, score: PlayerScoreBroadcast): Promise<void> {
  const supabase = createClient();
  const channel = supabase.channel(`team:${teamId}:battle`);

  await channel.send({
    type: "broadcast",
    event: "player_score",
    payload: score,
  });
}

/**
 * Subscribes to real-time combat synchronization for a team.
 * Uses a single Supabase channel to listen for:
 * 1. Database postgres_changes (Authoritative HP, Stage, Team Score)
 * 2. Realtime Broadcast combat_hit (Teammate visual attack effects)
 *
 * Returns an unsubscribe cleanup function.
 */
export function subscribeToBattleTeam(
  teamId: number,
  callbacks: {
    onTeamChange: (team: BattleTeam) => void;
    onCombatHit?: (hit: CombatBroadcast) => void;
  }
): () => void {
  const supabase = createClient();

  const channel = supabase
    .channel(`team:${teamId}:battle`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "teams",
        filter: `id=eq.${teamId}`,
      },
      (payload) => {
        if (payload.new) {
          callbacks.onTeamChange(mapTeam(payload.new as DbTeamRow));
        }
      }
    )
    .on("broadcast", { event: "combat_hit" }, ({ payload }) => {
      callbacks.onCombatHit?.(payload as CombatBroadcast);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
