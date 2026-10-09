import { createClient } from "./supabase/client";
import type { TeamId } from "./types";

export type MatchTeamResult = {
  rank: "1st" | "2nd";
  teamId: TeamId;
  teamName: string;
  score: number;
  isWinner: boolean; // Whether this team achieved the winning score
  isMyTeam: boolean; // Whether the current logged-in player was on this team
};

export type MatchWinnerState = {
  teams: MatchTeamResult[];
  isVictory: boolean; // true if the player's team won (or if top team won when spectating)
};

type DbTeamMatchRow = {
  id: number;
  name: string;
  slot: number;
  score: number;
  ends_at: string | null;
};

/**
 * Retrieves the battle result for the 2 teams in the current or most recent match.
 * Ranks teams by score (1st vs 2nd) and determines if the logged-in player won or lost.
 */
export async function getMatchWinnerState(): Promise<MatchWinnerState | null> {
  const supabase = createClient();

  // 1. Identify current player and their assigned team
  let myTeamId: number | null = null;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: player } = await supabase
        .from("players")
        .select("team_id")
        .eq("id", user.id)
        .maybeSingle();

      if (player?.team_id) {
        myTeamId = player.team_id;
      }
    }
  } catch (err) {
    console.warn("[getMatchWinnerState] Error fetching user:", err);
  }

  // 2. Fetch the teams from the player's match
  let matchTeams: DbTeamMatchRow[] = [];

  if (myTeamId) {
    try {
      const { data: myTeam } = await supabase
        .from("teams")
        .select("id, name, slot, score, ends_at")
        .eq("id", myTeamId)
        .maybeSingle();

      if (myTeam) {
        if (myTeam.ends_at) {
          // Both teams in the same match round share the exact same ends_at
          const { data: roundTeams } = await supabase
            .from("teams")
            .select("id, name, slot, score, ends_at")
            .eq("ends_at", myTeam.ends_at);

          if (roundTeams && roundTeams.length > 0) {
            matchTeams = roundTeams as DbTeamMatchRow[];
          }
        }

        if (matchTeams.length === 0) {
          matchTeams = [myTeam as DbTeamMatchRow];
        }
      }
    } catch (err) {
      console.warn("[getMatchWinnerState] Error fetching player team:", err);
    }
  }

  // 3. Fallback: if unauthenticated or testing directly, fetch the most recent match
  if (matchTeams.length === 0) {
    try {
      const { data: recentTeams } = await supabase
        .from("teams")
        .select("id, name, slot, score, ends_at")
        .not("ends_at", "is", null)
        .order("ends_at", { ascending: false })
        .limit(2);

      if (recentTeams && recentTeams.length > 0) {
        const latestEndsAt = recentTeams[0].ends_at;
        matchTeams = (recentTeams as DbTeamMatchRow[]).filter(
          (t) => t.ends_at === latestEndsAt
        );
      }
    } catch (err) {
      console.warn("[getMatchWinnerState] Error fetching recent match:", err);
    }
  }

  if (matchTeams.length === 0) {
    return null;
  }

  // 4. Sort teams: higher score is 1st, lower is 2nd (tie-breaker: slot)
  const sorted = [...matchTeams].sort(
    (a, b) => b.score - a.score || a.slot - b.slot
  );

  const highestScore = sorted[0]?.score ?? 0;

  const results: MatchTeamResult[] = sorted.map((t, index) => {
    const rank: "1st" | "2nd" = index === 0 ? "1st" : "2nd";
    const isWinner = t.score === highestScore;
    const isMyTeam = myTeamId !== null && t.id === myTeamId;
    const teamId: TeamId = t.slot === 2 ? 2 : 1;

    return {
      rank,
      teamId,
      teamName: t.name,
      score: t.score,
      isWinner,
      isMyTeam,
    };
  });

  // 5. Determine whether the current player is victorious
  let isVictory = true;
  if (myTeamId !== null) {
    const myResult = results.find((r) => r.isMyTeam);
    isVictory = myResult ? myResult.isWinner : results[0]?.isWinner ?? true;
  } else {
    // If not logged in, default to 1st place status
    isVictory = results[0]?.isWinner ?? true;
  }

  return {
    teams: results,
    isVictory,
  };
}
