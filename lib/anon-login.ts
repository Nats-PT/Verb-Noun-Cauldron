'use server';

import { createClient } from "./supabase/server";
import type { TeamId } from "./types";

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
  error?: string;
};

/**
 * Normalizes team input (e.g. "Team 1", 1, "1" -> 1)
 */
function parseTeamId(teamInput: unknown): TeamId | undefined {
  if (teamInput === 1 || teamInput === "1" || teamInput === "Team 1") return 1;
  if (teamInput === 2 || teamInput === "2" || teamInput === "Team 2") return 2;
  return undefined;
}

/**
 * Server Action for anonymous sign-in to Supabase with username & team metadata.
 *
 * Can be called directly from Client Components or passed to `<form action={...}>`.
 *
 * @example
 * // 1. Direct call with string:
 * const res = await anonLogin("Player1");
 *
 * @example
 * // 2. Direct call with object:
 * const res = await anonLogin({ username: "Player1", team: 1 });
 *
 * @example
 * // 3. Form action:
 * <form action={anonLogin}>
 *   <input name="username" />
 *   <input name="team" value="1" type="hidden" />
 *   <button type="submit">Play</button>
 * </form>
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
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInAnonymously({
      options: {
        data: {
          username,
          display_name: username,
          team,
        },
      },
    });

    if (error) {
      console.error("[anonLogin] Supabase Auth Error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: "Failed to create anonymous user",
      };
    }

    await supabase.from("players").upsert({
      id: data.user.id,
      name: username,
      team: team,
      is_ready: false,
    });

    return {
      success: true,
      userId: data.user.id,
      username,
      team,
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