"use client";

import { useState } from "react";
import type { MasterTeam } from "@/lib/master";
import { pixelFrame } from "@/lib/pixel-frame";
import { TEAM_SIZE, type Player, type TeamId } from "@/lib/types";

type PrepareScreenProps = {
  teams: Record<TeamId, MasterTeam | null>;
  canStart: boolean;
  // คืนข้อความ error หรือ null ถ้าสำเร็จ
  onStart: () => Promise<string | null>;
};

// กรอบ/ปุ่ม pixel art ชุดเดียวกับมือถือ (art วาดขนาดเท่า Figma มือถือ) ขยายลายขอบ ×3–4 ให้เข้ากับเวที 1920×1080
const outerFrame = pixelFrame("/lobby/frame-leader.png", { scale: 4 });
const teamFrame = pixelFrame("/lobby/frame-player.png", { scale: 3 });
const startFrame = pixelFrame("/login/btn-primary.png", { slice: 6, scale: 3 });
const startDisabledFrame = pixelFrame("/login/input-bg.png", { slice: 6, scale: 3 });

// จอรอเริ่ม = lobby ฉบับจอใหญ่ให้ทุกคนในบูธเห็น + ปุ่ม Start! ของ staff
// force start — ไม่ต้องรอทุกคน Ready (Ready มีไว้ให้ staff ดูว่าควรกดตอนไหน)
export default function PrepareScreen({ teams, canStart, onStart }: PrepareScreenProps) {
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setStarting(true);
    setError(null);
    setError(await onStart());
    // สำเร็จแล้ว realtime จะพาไปจอ battle เอง
    setStarting(false);
  }

  const players = [...(teams[1]?.players ?? []), ...(teams[2]?.players ?? [])];
  const readyCount = players.filter((p) => p.isReady).length;

  // ข้อความสถานะแบบเดียวกับ lobby แต่พูดกับ staff
  let status: string;
  if (players.length === 0) status = "Waiting for players to join...";
  else if (readyCount < players.length) status = `Players ready ${readyCount}/${players.length}`;
  else status = "Everyone is ready!";

  return (
    <main
      style={outerFrame}
      className="absolute inset-12 flex flex-col items-center gap-10 px-20 py-10 [image-rendering:pixelated]"
    >
      {/* โลโก้ตัวหนังสือแบบเดียวกับหน้า login */}
      <h1 className="text-center text-head leading-tight text-primary [-webkit-text-stroke:2px_black]">
        Verb-Noun
        <br />
        Cauldron
      </h1>

      <div className="grid w-full flex-1 grid-cols-2 gap-12">
        <TeamColumn slot={1} team={teams[1]} />
        <TeamColumn slot={2} team={teams[2]} />
      </div>

      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={handleStart}
          disabled={!canStart || starting}
          style={canStart && !starting ? startFrame : startDisabledFrame}
          className="px-24 py-4 text-head text-accent [image-rendering:pixelated] hover:brightness-110 active:scale-95 disabled:text-muted disabled:active:scale-100"
        >
          {starting ? "Starting..." : "Start!"}
        </button>

        <p aria-live="polite" className={`text-body ${error ? "text-danger" : "text-muted"}`}>
          {error ?? status}
        </p>
      </div>
    </main>
  );
}

// หน้าตาเดียวกับ TeamColumn ของ lobby (app/lobby/_components) แต่ขยายให้อ่านจากไกล ๆ ได้ และเรียง 2 คอลัมน์
function TeamColumn({ slot, team }: { slot: TeamId; team: MasterTeam | null }) {
  const players = team?.players ?? [];
  // เติมช่องว่างให้ครบ TEAM_SIZE เหมือน lobby จะได้เห็นว่ายังรับได้อีกกี่คน
  const emptySlots = Math.max(TEAM_SIZE - players.length, 0);

  return (
    <section style={teamFrame} className="flex flex-col gap-6 p-8 [image-rendering:pixelated]">
      <h2 className="text-center text-head2">
        {/* ยังไม่มีใครเข้าทีมนี้ = ยังไม่มีชื่อสุ่ม */}
        <span className={`block truncate ${team ? "" : "text-muted"}`}>{team?.name ?? `Team ${slot}`}</span>
        <span className="block text-body text-muted">
          {players.length}/{TEAM_SIZE}
        </span>
      </h2>

      {/* เติมลงทีละคอลัมน์: 3 คนซ้าย 2 คนขวา */}
      <ul className="grid flex-1 grid-flow-col grid-cols-2 grid-rows-3 gap-4">
        {players.map((player) => (
          <PlayerRow key={player.id} player={player} />
        ))}
        {Array.from({ length: emptySlots }, (_, i) => (
          <li
            key={`empty-${i}`}
            className="flex items-center rounded-2xl border-4 border-dashed border-border px-6 text-body text-muted"
          >
            Open slot
          </li>
        ))}
      </ul>
    </section>
  );
}

function PlayerRow({ player }: { player: Player }) {
  return (
    <li className="flex min-w-0 flex-col justify-center rounded-2xl border-4 border-transparent px-6">
      <p className="truncate text-head2">{player.name}</p>
      <p className={`text-body ${player.isReady ? "text-primary" : "text-muted"}`}>
        {player.isReady ? "READY" : "waiting"}
      </p>
    </li>
  );
}
