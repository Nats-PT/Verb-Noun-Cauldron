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
import { pixelFrame } from "@/lib/pixel-frame";
import type { LeaderboardEntry, Player } from "@/lib/types";

// ปุ่มสี่เหลี่ยมเล็กมุมบน (< และ ?) 36×36 ตาม redline ใช้กรอบ pixel จาก art
const iconButtonFrame = pixelFrame("/lobby/frame-question.png");
const iconButton =
  "flex size-9 items-center justify-center text-score [image-rendering:pixelated] hover:brightness-125";

// ระยะแนวตั้งตาม redline ของ art (Figma 390×844 = พื้นที่ใช้งาน 797) แต่ Safari เหลือ ~664
// fluid(สั้น, สูง) = ค่าที่จอ 664 → ค่าที่จอ 797 เป็นเส้นตรง (ไม่ต่ำ/สูงเกินสองค่านี้)
// คอลัมน์ทีมจึงได้ที่ ~320 เท่า Figma ทั้งสองขนาดจอ ส่วนช่องว่างอื่นบีบลงแทน
function fluid(short: number, tall: number) {
  const perPx = (tall - short) / (797 - 664);
  return `clamp(${short}px, calc(${short}px + (100svh - 664px) * ${perPx.toFixed(4)}), ${tall}px)`;
}

export default function LobbyPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>("");
  const [team1Title, setTeam1Title] = useState("Team 1");
  const [team2Title, setTeam2Title] = useState("Team 2");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isSubscribed = true;

    async function loadLobby() {
      const state = await getLobbyState();
      if (!isSubscribed) return;

      // Staff pressed Reset all on the master screen → our player row is gone, join again
      if (state.isRemoved) {
        router.replace("/login");
        return;
      }

      // When the match is started by staff, automatically navigate to /battle
      if (state.isPlaying) {
        router.push("/battle");
        return;
      }

      setPlayers(state.players);
      if (state.currentPlayerId) {
        setCurrentPlayerId(state.currentPlayerId);
      }
      setTeam1Title(state.team1Title);
      setTeam2Title(state.team2Title);
      setLoading(false);
    }

    async function loadLeaderboard() {
      const entries = await getLeaderboard(3);
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
    <>
      {/* Background expands all over screen and sticks while scrolling */}
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 pointer-events-none bg-[url('/background/background_default.png')] bg-cover bg-center [image-rendering:pixelated]"
      />

      {/* redline (จอ 797): บน 26 · ปุ่ม 36 · 18 · Leaderboard 177 · 18 · ทีม 320 (ห่างกัน 11) · 64 · Ready 55 · ล่าง 77 */}
      <main
        className="relative mx-auto flex h-dvh w-full max-w-md flex-col px-[18px] overflow-y-auto [mask-image:linear-gradient(to_bottom,black_0%,black_calc(100%_-_64px),transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_calc(100%_-_64px),transparent_100%)]"
        style={{ paddingTop: fluid(16, 26), paddingBottom: fluid(24, 77) }}
      >
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleLeave}
            aria-label="Leave lobby"
            style={iconButtonFrame}
            className={iconButton}
          >
            &lt;
          </button>

          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            aria-label="How to play"
            style={iconButtonFrame}
            className={iconButton}
          >
            ?
          </button>
        </header>

        <div className="shrink-0" style={{ marginTop: fluid(12, 18), height: fluid(150, 177) }}>
          <Leaderboard entries={leaderboard} rows={3} className="flex h-full flex-col" />
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-2 gap-[11px]" style={{ marginTop: fluid(12, 18) }}>
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

        {/* redline มีแค่ช่องว่าง 64 กับปุ่ม — ข้อความสถานะเราเก็บไว้ (กายสั่งไม่เอาอะไรออก) วางกลางช่องว่างนั้น */}
        <footer
          className="flex flex-col items-center"
          style={{ marginTop: fluid(8, 20), rowGap: fluid(8, 20) }}
        >
          <p aria-live="polite" className="text-center text-score text-muted">
            {status}
          </p>
          <ReadyButton isReady={isReady} onToggle={handleToggleReady} />
        </footer>

        <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      </main>
    </>
  );
}
