import { createClient } from "./supabase/client";
import type { LeaderboardEntry } from "./types";

/**
 * Fetches the top leaderboard entries ordered by score descending.
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
