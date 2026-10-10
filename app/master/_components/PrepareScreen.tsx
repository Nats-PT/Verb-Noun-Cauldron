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

// กรอบใหญ่ / ปุ่ม pixel art ชุดเดียวกับจอ master อื่น
// กรอบใหญ่ design ขยายลายขอบ ×12 (ชมพู 12 + ม่วงหม่น 24 ≈ 36px, ขั้นมุม 12px)
const outerFrame = pixelFrame("/lobby/frame-leader.png", { scale: 12 });
const startFrame = pixelFrame("/login/btn-primary.png", { slice: 6, scale: 3 });
const startDisabledFrame = pixelFrame("/login/input-bg.png", { slice: 6, scale: 3 });

const pixelated = "[image-rendering:pixelated]";

// ตำแหน่ง / ขนาดทั้งหมดเป็น px บนเวที 1920×1080 วัดจาก design ของ art (Lobby_mas)
// ตัวหนังสือที่ใหญ่กว่า token ของทีม (ตั้งไว้สำหรับมือถือ) ใส่ค่า px ในไฟล์นี้ — แบบเดียวกับ LeaderboardScreen
const titleSize = "text-[96px] leading-none";
const teamNameSize = "text-[40px] leading-none";
const startSize = "text-[44px] leading-none";

// หัวข้อแบบ design: เหลืองมะนาว #ffff5b (ไม่ใช่ accent #fae05f ของทีม — design master ใช้สีนี้ทั้ง Prepare / Leaderboard)
// + เงาทองเข้มตกลงล่าง ขอบตัวอักษรคม (ไม่ใช่แสงฟุ้งรอบตัว) — ต้องตรงกับ LeaderboardScreen
const titleStyle = "text-[#ffff5b] drop-shadow-[0_6px_4px_#9a7414]";

// กล่องทีม 834×417 ที่ x 113 / 977 — เส้นชมพูมุมมนเรียบตาม design (ไม่ใช่กรอบ pixel)
const teamBoxLeft = { 1: "left-[113px]", 2: "left-[977px]" } as const;

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

  const enabled = canStart && !starting;

  return (
    <>
      <div aria-hidden style={outerFrame} className={`absolute inset-12 ${pixelated}`} />

      <h1
        className={`absolute top-[162px] left-1/2 -translate-x-1/2 whitespace-nowrap ${titleSize} ${titleStyle}`}
      >
        Verb-Noun Cauldron
      </h1>

      <TeamBox slot={1} team={teams[1]} />
      <TeamBox slot={2} team={teams[2]} />

      {/* ปุ่ม 358×92 กึ่งกลาง ห่างใต้กล่องทีม 69 */}
      <button
        type="button"
        onClick={handleStart}
        disabled={!enabled}
        style={enabled ? startFrame : startDisabledFrame}
        className={`absolute top-[817px] left-[781px] h-[92px] w-[358px] ${startSize} ${pixelated} ${
          enabled ? "text-accent hover:brightness-110 active:scale-95" : "text-muted"
        }`}
      >
        {starting ? "Starting..." : "Start!"}
      </button>

      {/* design ไม่มีข้อความใต้ปุ่ม — โชว์เฉพาะตอนกด Start แล้วพัง staff จะได้รู้ */}
      <p aria-live="polite" className="absolute inset-x-0 top-[925px] text-center text-score text-danger">
        {error}
      </p>
    </>
  );
}

// กล่องทีม: ชื่อทีม + จำนวนคน + การ์ดผู้เล่น 2 คอลัมน์ × 3 แถว
function TeamBox({ slot, team }: { slot: TeamId; team: MasterTeam | null }) {
  const players = team?.players ?? [];
  // เติมช่องว่างให้ครบ TEAM_SIZE เหมือน lobby จะได้เห็นว่ายังรับได้อีกกี่คน
  const emptySlots = Math.max(TEAM_SIZE - players.length, 0);

  return (
    <section
      aria-label={`Team ${slot}`}
      className={`absolute top-[331px] ${teamBoxLeft[slot]} h-[417px] w-[834px] rounded-[20px] border-[8px] border-primary`}
    >
      {/* ยังไม่มีใครเข้าทีมนี้ = ยังไม่มีชื่อสุ่ม */}
      <h2 className={`mt-[30px] truncate px-10 text-center ${teamNameSize} ${team ? "" : "text-muted"}`}>
        {team?.name ?? `Team ${slot}`}
      </h2>
      <p className="mt-[16px] text-center text-body leading-none">
        {players.length}/{TEAM_SIZE}
      </p>

      {/* การ์ด 293×68 ห่าง 121 / 20 — เติมลงทีละคอลัมน์: 3 คนซ้าย 2 คนขวา */}
      <ul className="absolute inset-x-0 top-[123px] grid grid-flow-col grid-cols-[293px_293px] grid-rows-[repeat(3,68px)] justify-center gap-x-[121px] gap-y-[20px]">
        {players.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
        {Array.from({ length: emptySlots }, (_, i) => (
          <li
            key={`empty-${i}`}
            className="flex items-center rounded-[12px] border-[4px] border-dashed border-primary/15 pl-[31px] text-body text-muted"
          >
            Open slot
          </li>
        ))}
      </ul>
    </section>
  );
}

// Ready = ขอบชมพูทึบ + พื้นชมพูจาง, ยังไม่ Ready = ขอบเส้นประจาง
function PlayerCard({ player }: { player: Player }) {
  return (
    <li
      data-player={player.name}
      className={`flex min-w-0 flex-col justify-center gap-[8px] rounded-[12px] border-[4px] pr-4 pl-[31px] ${
        player.isReady ? "border-primary bg-primary/5" : "border-dashed border-primary/30"
      }`}
    >
      <p className="truncate text-body leading-none">{player.name}</p>
      <p className={`text-score leading-none ${player.isReady ? "text-primary" : "text-muted"}`}>
        {player.isReady ? "Ready" : "waiting"}
      </p>
    </li>
  );
}
