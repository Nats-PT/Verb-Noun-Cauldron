'use server';

import { createClient } from "./supabase/server";
import { TEAM_SIZE, type TeamId } from "./types";

export type AnonLoginInput =
  | string
  | FormData
  | {
      username?: string;
      name?: string;
      team?: TeamId | string | number | null;
    };

export type AnonLoginResult = {
  success: boolean;
  userId?: string;
  username?: string;
  team?: TeamId;
  teamDbId?: number;
  teamName?: string;
  error?: string;
};

/**
 * Normalizes team input (e.g. 1, "1", "Team 1" -> 1)
 */
function parseTeamId(teamInput: unknown): TeamId | undefined {
  if (teamInput === 1 || teamInput === "1" || teamInput === "Team 1") return 1;
  if (teamInput === 2 || teamInput === "2" || teamInput === "Team 2") return 2;
  return undefined;
}

/**
 * Server Action for anonymous login.
 *
 * 1. Signs out any previous session to ensure a clean login.
 * 2. Signs in anonymously to Supabase Auth.
 * 3. Finds or creates the active 'waiting' team for the selected TeamId (1 or 2).
 * 4. Ensures the team has not reached max capacity (5 players).
 * 5. Saves the player to public.players linked to the team.
 */
export async function anonLogin(input?: AnonLoginInput): Promise<AnonLoginResult> {
  try {
    let username = "";
    let rawTeam: unknown = undefined;

    if (typeof input === "string") {
      username = input.trim();
    } else if (input instanceof FormData) {
      username = (
        (input.get("username") as string) ||
        (input.get("name") as string) ||
        ""
      ).trim();
      rawTeam = input.get("team");
    } else if (input && typeof input === "object") {
      username = (input.username || input.name || "").trim();
      rawTeam = input.team;
    }

    if (!username) {
      return {
        success: false,
        error: "Username cannot be empty",
      };
    }

    const team = parseTeamId(rawTeam);
    if (!team) {
      return {
        success: false,
        error: "Please select Team 1 or Team 2",
      };
    }

    const supabase = await createClient();

    // 1. Clean up any previous player from this browser session so they don't linger in the lobby
    const {
      data: { user: previousUser },
    } = await supabase.auth.getUser();

    if (previousUser) {
      const { error: deleteError } = await supabase
        .from("players")
        .delete()
        .eq("id", previousUser.id);

      if (deleteError) {
        console.error("[anonLogin] Error deleting previous player:", deleteError.message);
      }
    }

    // 2. Reset any old session
    await supabase.auth.signOut();

    // 2. Anonymous sign-in
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously({
      options: {
        data: {
          username,
          display_name: username,
          team,
        },
      },
    });

    if (authError || !authData.user) {
      console.error("[anonLogin] Supabase Auth Error:", authError?.message);
      return {
        success: false,
        error: authError?.message || "Failed to sign in anonymously",
      };
    }

    const userId = authData.user.id;

    // 3. Find active waiting team for this slot (Team 1 or Team 2)
    const { data: activeTeam, error: activeTeamError } = await supabase
      .from("teams")
      .select("id, name")
      .eq("slot", team)
      .eq("status", "waiting")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activeTeamError) {
      console.error("[anonLogin] Error querying active team:", activeTeamError.message);
    }

    let teamDbId = activeTeam?.id;
    let teamName = activeTeam?.name;

    // 4. If an active team exists, verify it is not full (< 5 players)
    if (teamDbId) {
      const { count, error: countError } = await supabase
        .from("players")
        .select("*", { count: "exact", head: true })
        .eq("team_id", teamDbId);

      if (countError) {
        console.error("[anonLogin] Error checking team count:", countError.message);
      }

      if ((count ?? 0) >= TEAM_SIZE) {
        return {
          success: false,
          error: `Team ${team} (${teamName}) is full (${count}/${TEAM_SIZE} players). Please select the other team!`,
        };
      }
    } else {
      // 5. If no waiting team in this slot, generate a new team name
      const { data: generatedName } = await supabase.rpc("generate_team_name");
      teamName = generatedName || `Team ${team}`;

      const { data: newTeam, error: newTeamError } = await supabase
        .from("teams")
        .insert({
          name: teamName,
          slot: team,
          status: "waiting",
          score: 0,
        })
        .select("id, name")
        .single();

      if (newTeamError || !newTeam) {
        console.error("[anonLogin] Error creating team:", newTeamError?.message);
        return {
          success: false,
          error: newTeamError?.message || "Failed to create team for this round",
        };
      }

      teamDbId = newTeam.id;
      teamName = newTeam.name;
    }

    // 6. Insert player into public.players
    const { error: playerError } = await supabase.from("players").upsert({
      id: userId,
      name: username,
      team_id: teamDbId,
      is_ready: false,
    });

    if (playerError) {
      console.error("[anonLogin] Error saving player:", playerError.message);
      return {
        success: false,
        error: playerError.message,
      };
    }

    return {
      success: true,
      userId,
      username,
      team,
      teamDbId,
      teamName,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[anonLogin] Unexpected error:", err);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Helper to fetch the currently authenticated user from server session.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Helper to sign out the current user session.
 */
export async function anonSignOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}