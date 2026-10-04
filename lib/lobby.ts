import { createClient } from "./supabase/client";
import type { Player, TeamId } from "./types";

export type LobbyState = {
  currentPlayerId: string | null;
  team1Title: string;
  team2Title: string;
  team1Id?: number;
  team2Id?: number;
  players: Player[];
  isPlaying: boolean;
};

/**
 * Fetches the active teams (Slot 1 and Slot 2) and all players currently in the lobby.
 */
export async function getLobbyState(): Promise<LobbyState> {
  const supabase = createClient();

  // 1. Get the current authenticated user's ID
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentPlayerId = user?.id ?? null;

  // 2. Fetch waiting teams for Slot 1 and Slot 2 — must pick the same team as anonLogin
  //    (newest *waiting* team per slot). A team that is already playing must not take the slot,
  //    otherwise players queued for the next round see an empty lobby.
  //    In parallel, check whether the current player's own team has started (redirect to /battle).
  const [{ data: teamsData, error: teamsError }, isPlaying] = await Promise.all([
    supabase
      .from("teams")
      .select("id, name, slot")
      .eq("status", "waiting")
      .order("created_at", { ascending: false }),
    isMyTeamPlaying(currentPlayerId),
  ]);

  if (teamsError) {
    console.error("[getLobbyState] Error fetching teams:", teamsError.message);
  }

  const team1 = teamsData?.find((t) => t.slot === 1);
  const team2 = teamsData?.find((t) => t.slot === 2);

  const team1Title = team1?.name || "Team 1";
  const team2Title = team2?.name || "Team 2";

  const activeTeamIds = [team1?.id, team2?.id].filter(
    (id): id is number => typeof id === "number"
  );

  // 3. Fetch players on these active teams
  if (activeTeamIds.length === 0) {
    return {
      currentPlayerId,
      team1Title,
      team2Title,
      team1Id: team1?.id,
      team2Id: team2?.id,
      players: [],
      // Right after Start there may be no waiting team left at all — still redirect
      isPlaying,
    };
  }

  const { data: playersData, error: playersError } = await supabase
    .from("players")
    .select("id, name, team_id, is_ready")
    .in("team_id", activeTeamIds);

  if (playersError) {
    console.error("[getLobbyState] Error fetching players:", playersError.message);
  }

  // 4. Map DB rows to the frontend Player type
  const players: Player[] = (playersData || []).map((row) => {
    const slot: TeamId = row.team_id === team2?.id ? 2 : 1;
    return {
      id: row.id,
      name: row.name,
      team: slot,
      isReady: row.is_ready,
    };
  });

  return {
    currentPlayerId,
    team1Title,
    team2Title,
    team1Id: team1?.id,
    team2Id: team2?.id,
    players,
    isPlaying,
  };
}

/**
 * True when the given player's team has been started by the Master screen.
 * Looked up directly from the player's row, since playing teams are not part of the lobby list.
 */
async function isMyTeamPlaying(playerId: string | null): Promise<boolean> {
  if (!playerId) return false;
  const supabase = createClient();

  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("team_id")
    .eq("id", playerId)
    .maybeSingle();

  if (playerError) {
    console.error("[isMyTeamPlaying] Error fetching player:", playerError.message);
  }
  if (!player) return false;

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("status")
    .eq("id", player.team_id)
    .maybeSingle();

  if (teamError) {
    console.error("[isMyTeamPlaying] Error fetching team:", teamError.message);
  }
  return team?.status === "playing";
}

/**
 * Toggles a player's is_ready status in public.players.
 */
export async function togglePlayerReady(
  playerId: string,
  currentStatus: boolean
): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from("players")
    .update({ is_ready: !currentStatus })
    .eq("id", playerId);

  if (error) {
    console.error("[togglePlayerReady] Error:", error.message);
    return false;
  }

  return true;
}

/**
 * Removes the current player from public.players and signs them out.
 * Called when a player returns to the login page.
 */
export async function leaveLobby(): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { error } = await supabase
      .from("players")
      .delete()
      .eq("id", user.id);

    if (error) {
      console.error("[leaveLobby] Error deleting player:", error.message);
    }

    await supabase.auth.signOut();
  }
}

/**
 * Subscribes to Realtime updates on both public.players and public.teams.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeToLobby(onUpdate: () => void): () => void {
  const supabase = createClient();

  const channel = supabase
    .channel("lobby-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "players" },
      () => {
        onUpdate();
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "teams" },
      () => {
        onUpdate();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
