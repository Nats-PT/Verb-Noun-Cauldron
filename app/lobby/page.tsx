"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Leaderboard from "@/components/Leaderboard";
import HelpModal from "./_components/HelpModal";
import ReadyButton from "./_components/ReadyButton";
import TeamColumn from "./_components/TeamColumn";
import { getLeaderboard, subscribeToLeaderboard } from "@/lib/leaderboard";
import {
  getLobbyState,
  togglePlayerReady,
  subscribeToLobby,
  leaveLobby,
} from "@/lib/lobby";
import type { LeaderboardEntry, Player } from "@/lib/types";

export default function LobbyPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>("");
  const [team1Title, setTeam1Title] = useState("Team 1");
  const [team2Title, setTeam2Title] = useState("Team 2");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isSubscribed = true;

    async function loadLobby() {
      const state = await getLobbyState();
      if (!isSubscribed) return;

      setPlayers(state.players);
      if (state.currentPlayerId) {
        setCurrentPlayerId(state.currentPlayerId);
      }
      setTeam1Title(state.team1Title);
      setTeam2Title(state.team2Title);
      setLoading(false);
    }

    async function loadLeaderboard() {
      const entries = await getLeaderboard(10);
      if (!isSubscribed) return;
      setLeaderboard(entries);
    }

    loadLobby();
    loadLeaderboard();

    const unsubscribeLobby = subscribeToLobby(() => {
      loadLobby();
    });

    const unsubscribeLeaderboard = subscribeToLeaderboard(() => {
      loadLeaderboard();
    });

    return () => {
      isSubscribed = false;
      unsubscribeLobby();
      unsubscribeLeaderboard();
    };
  }, []);

  const me = players.find((p) => p.id === currentPlayerId);
  const isReady = me?.isReady ?? false;
  const readyCount = players.filter((p) => p.isReady).length;
  const allReady = players.length > 0 && readyCount === players.length;

  async function handleToggleReady() {
    if (!currentPlayerId) return;

    // Optimistic UI update
    setPlayers((current) =>
      current.map((p) =>
        p.id === currentPlayerId ? { ...p, isReady: !p.isReady } : p
      )
    );

    await togglePlayerReady(currentPlayerId, isReady);
  }

  const router = useRouter();

  async function handleLeave() {
    await leaveLobby();
    router.push("/login");
  }

  // เกมเริ่มเมื่อสตาฟฟ์กด Start! ที่หน้า master — lobby แค่บอกว่ากำลังรออะไรอยู่
  let status: string;
  if (loading) status = "Loading lobby...";
  else if (players.length === 0) status = "Waiting for players to join...";
  else if (!isReady) status = "Tap Ready when you're set";
  else if (!allReady) status = `Waiting for players... ${readyCount}/${players.length}`;
  else status = "Waiting for staff to start...";

  return (
    <main className="mx-auto flex h-dvh w-full max-w-md flex-col gap-3 p-4">
      <header className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleLeave}
          aria-label="Leave lobby"
          className="flex size-12 items-center justify-center rounded-lg border-2 border-border bg-surface text-body hover:border-primary"
        >
          &lt;
        </button>

        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          aria-label="How to play"
          className="size-12 rounded-lg border-2 border-border bg-surface text-body hover:border-primary"
        >
          ?
        </button>
      </header>

      <Leaderboard entries={leaderboard} limit={3} />

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
        <TeamColumn
          title={team1Title}
          players={players.filter((p) => p.team === 1)}
          currentPlayerId={currentPlayerId}
        />
        <TeamColumn
          title={team2Title}
          players={players.filter((p) => p.team === 2)}
          currentPlayerId={currentPlayerId}
        />
      </div>

      <footer className="flex flex-col gap-2">
        <p aria-live="polite" className="text-center text-score text-muted">
          {status}
        </p>
        <ReadyButton isReady={isReady} onToggle={handleToggleReady} />
      </footer>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </main>
  );
}
