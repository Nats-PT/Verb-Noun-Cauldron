import { createClient } from "./supabase/client";
import type {
  DetailedLeaderboardEntry,
  LeaderboardEntry,
  MatchResult,
  MatchResultInput,
} from "./types";

/**
 * Fetches the top leaderboard entries ordered by score descending.
 * Compatible with the existing Leaderboard UI component.
 */
export async function getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("leaderboard")
    .select("id, team_name, score")
    .order("score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("[getLeaderboard] Error fetching leaderboard:", error.message);
    return [];
  }

  return (data || []).map((row) => ({
    id: String(row.id),
    name: row.team_name,
    score: row.score,
  }));
}

/**
 * Fetches the top leaderboard entries with full details (rank, stage reached, creation date).
 */
export async function getDetailedLeaderboard(
  limit = 10
): Promise<DetailedLeaderboardEntry[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("leaderboard")
    .select("id, team_name, score, stage_reached, created_at")
    .order("score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error(
      "[getDetailedLeaderboard] Error fetching detailed leaderboard:",
      error.message
    );
    return [];
  }

  return (data || []).map((row, index) => ({
    id: String(row.id),
    name: row.team_name,
    score: row.score,
    stageReached: row.stage_reached,
    createdAt: row.created_at,
    rank: index + 1,
  }));
}

/**
 * Calculates the current ranking a specific score would achieve on the global leaderboard.
 */
export async function getRankForScore(score: number): Promise<number> {
  const supabase = createClient();

  const { count, error } = await supabase
    .from("leaderboard")
    .select("*", { count: "exact", head: true })
    .gt("score", score);

  if (error) {
    console.error("[getRankForScore] Error calculating rank:", error.message);
    return 1;
  }

  return (count ?? 0) + 1;
}

/**
 * Records a completed match into public.leaderboard and marks the team as finished in public.teams.
 * Returns the final score, stage reached, and immediate global rank.
 */
export async function recordMatchResult(
  input: MatchResultInput
): Promise<MatchResult> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("record_match_result", {
    p_team_id: input.teamId ?? null,
    p_team_name: input.teamName ?? null,
    p_score: input.score,
    p_stage_reached: input.stageReached ?? 1,
  });

  if (error) {
    console.error("[recordMatchResult] RPC Error:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    id: data?.id,
    teamName: data?.teamName,
    score: data?.score,
    stageReached: data?.stageReached,
    rank: data?.rank,
    createdAt: data?.createdAt,
  };
}

/**
 * Subscribes to live updates on the public.leaderboard table.
 */
export function subscribeToLeaderboard(onUpdate: () => void): () => void {
  const supabase = createClient();

  const channel = supabase
    .channel("leaderboard-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "leaderboard" },
      () => {
        onUpdate();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
