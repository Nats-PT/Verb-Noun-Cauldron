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
