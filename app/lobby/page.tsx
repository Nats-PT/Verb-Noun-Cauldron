"use client";

import { useState } from "react";
import HelpModal from "@/components/HelpModal";
import Leaderboard from "@/components/Leaderboard";
import ReadyButton from "@/components/ReadyButton";
import TeamColumn from "@/components/TeamColumn";
import { CURRENT_PLAYER_ID, mockLeaderboard, mockPlayers } from "@/lib/mock-data";

export default function LobbyPage() {
  // TODO: เปลี่ยนเป็นข้อมูล real-time จาก Supabase เมื่อ DB พร้อม
  const [players, setPlayers] = useState(mockPlayers);
  const [helpOpen, setHelpOpen] = useState(false);

  const me = players.find((p) => p.id === CURRENT_PLAYER_ID);
  const isReady = me?.isReady ?? false;
  const readyCount = players.filter((p) => p.isReady).length;
  const allReady = readyCount === players.length;

  function toggleReady() {
    setPlayers((current) =>
      current.map((p) => (p.id === CURRENT_PLAYER_ID ? { ...p, isReady: !p.isReady } : p)),
    );
  }

  // เกมเริ่มเมื่อสตาฟฟ์กด Start! ที่หน้า master — lobby แค่บอกว่ากำลังรออะไรอยู่
  let status: string;
  if (!isReady) status = "Tap Ready when you're set";
  else if (!allReady) status = `Waiting for players... ${readyCount}/${players.length}`;
  else status = "Waiting for staff to start...";

  return (
    <main className="mx-auto flex h-dvh w-full max-w-md flex-col gap-3 p-4">
      <header className="flex justify-end">
        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          aria-label="How to play"
          className="size-12 rounded-lg border-2 border-border bg-surface text-body hover:border-primary"
        >
          ?
        </button>
      </header>

      <Leaderboard entries={mockLeaderboard} limit={3} />

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
        <TeamColumn
          title="Team 1"
          players={players.filter((p) => p.team === 1)}
          currentPlayerId={CURRENT_PLAYER_ID}
        />
        <TeamColumn
          title="Team 2"
          players={players.filter((p) => p.team === 2)}
          currentPlayerId={CURRENT_PLAYER_ID}
        />
      </div>

      <footer className="flex flex-col gap-2">
        <p aria-live="polite" className="text-center text-score text-muted">
          {status}
        </p>
        <ReadyButton isReady={isReady} onToggle={toggleReady} />
      </footer>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </main>
  );
}
