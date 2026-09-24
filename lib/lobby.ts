import { createClient } from "./supabase/client";
import type { Player, TeamId } from "./types";

export type LobbyState = {
  currentPlayerId: string | null;
  team1Title: string;
  team2Title: string;
  team1Id?: number;
  team2Id?: number;
  players: Player[];
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

  // 2. Fetch active waiting/playing teams for Slot 1 and Slot 2
  const { data: teamsData, error: teamsError } = await supabase
    .from("teams")
    .select("id, name, slot, status")
    .in("status", ["waiting", "playing"])
    .order("created_at", { ascending: false });

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
  };
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
