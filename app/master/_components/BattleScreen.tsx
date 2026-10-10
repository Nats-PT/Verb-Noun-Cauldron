"use client";

import { useEffect, useState } from "react";
import MonsterStage from "@/components/MonsterStage";
import { MONSTERS, monsterMaxHp } from "@/lib/game/monsters";
import { teamStandings, type LastHit, type LastHits, type MasterTeam, type PlayerScores, type Standing } from "@/lib/master";
import { pixelFrame } from "@/lib/pixel-frame";
import { TEAM_SIZE } from "@/lib/types";

type BattleScreenProps = {
  // ทีมในแมตช์ที่กำลังเล่น (1–2 ทีม เรียงตาม slot)
  teams: MasterTeam[];
  // คะแนน / จำนวนหมัดรายคน (ชุดเดียวกับ MVP) และหมัดล่าสุด — จาก broadcast ของมือถือ
  scores: PlayerScores;
  lastHits: LastHits;
  // เวลาของ server (ms)
  serverNow: number;
  canCancel: boolean;
  onCancel: () => void;
};

// กรอบชุดเดียวกับจอ master อื่น — design ขยายลายขอบ ×12 (ชมพู 12 + ม่วงหม่น 24 ≈ 36px, ขั้นมุม 12px)
const outerFrame = pixelFrame("/lobby/frame-leader.png", { scale: 12 });

const pixelated = "[image-rendering:pixelated]";

// ภาพ hit (ตัวแดง) / weak! ค้างนานเท่ามือถือ (HIT_MS / FLASH_MS ใน app/battle/page.tsx)
const HIT_MS = 300;
const WEAK_MS = 900;
// วลีที่เพิ่งตีโชว์ต่อท้ายชื่อนานเท่านี้
const PHRASE_MS = 1500;

// วินาทีท้าย ๆ เวลาเป็นสีแดง เร่งให้คนดูลุ้น
const HURRY_SECONDS = 10;

// ---------- ตำแหน่ง / ขนาด: px บนเวที 1920×1080 วัดจาก design ของ art (battle_mas) ----------
// สีเหลืองมะนาวแบบหัวข้อจอ Prepare / Leaderboard (ไม่ใช่ accent ของทีม)
const designYellow = "text-[#ffff5b]";
// พื้นแถวผู้เล่น (มุมมน 8): ปกติ / อันดับ 1 (สีจาก design)
const rowBg = "bg-[#2b1b24]";
const leaderRowBg = "bg-[#3f2333]";

// ทีมซ้าย / ขวา (ตามลำดับ slot)
const SIDES = [
  { score: "left-[173px] items-start", scene: "left-[292px]", table: "left-[173px]" },
  { score: "right-[193px] items-end", scene: "left-[1144px]", table: "left-[1003px]" },
] as const;

// แถวผู้เล่น 744×39 ห่าง 9 — แถววางตามอันดับด้วย translateY แล้วไหลไปที่ใหม่เองตอนแซงกัน
const ROW_HEIGHT = 39;
const ROW_GAP = 9;
// คอลัมน์ในแถว: อันดับเริ่ม +45, ชื่อ +164, Correct +492, Score +637 จากขอบแถว
const rowColumns = "grid grid-cols-[119px_328px_145px_1fr] items-center pl-[45px]";

// 4 ตัวเหมือนตัวเลขในเกม pixel (0041)
const pad = (n: number) => String(n).padStart(4, "0");

// จอระหว่างแมตช์ (ตาม design ของ art): เวลากลางจอ, แต่ละทีม = คะแนน + ฉากมอนสเตอร์ + ตารางผู้เล่น
// ผู้เล่นเรียงตามคะแนน แซงกันแล้วแถวเลื่อนอันดับให้คนดูลุ้น
// ช่วง TIME'S UP บนมือถือ (FINISH_DELAY_MS) ยังอยู่จอนี้ เวลาเปลี่ยนเป็น TIME'S UP!
export default function BattleScreen({ teams, scores, lastHits, serverNow, canCancel, onCancel }: BattleScreenProps) {
  const [first] = teams;
  // เปิด /master?view=battle ตอนยังไม่เคยมีแมตช์ (dev)
  if (!first) return <p className="grid h-full place-items-center text-head2 text-muted">No match yet</p>;

  const secondsLeft = first.endsAt === null ? 0 : Math.max(0, Math.ceil((first.endsAt - serverNow) / 1000));
  const clock = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`;

  return (
    <>
      <div aria-hidden style={outerFrame} className={`absolute inset-12 ${pixelated}`} />

      <p
        aria-live="off"
        className={`absolute top-[137px] left-1/2 -translate-x-1/2 text-[56px] leading-none tabular-nums ${
          secondsLeft === 0 ? designYellow : secondsLeft <= HURRY_SECONDS ? "text-danger" : "text-foreground"
        }`}
      >
        {secondsLeft === 0 ? "TIME'S UP!" : clock}
      </p>

      {/* เส้นแบ่ง: ตั้งระหว่าง 2 ทีม (ใต้เวลา) + นอนคั่นฉากกับตาราง */}
      <div aria-hidden className="absolute top-[240px] left-[960px] h-[386px] w-[6px] bg-primary" />
      <div aria-hidden className="absolute top-[620px] left-[130px] h-[6px] w-[1659px] bg-primary" />

      {teams.slice(0, 2).map((team, i) => (
        <TeamSide key={team.id} team={team} side={SIDES[i]} scores={scores} lastHits={lastHits} />
      ))}

      {/* ปุ่มของ staff — ตัวเล็กสีจางในขอบเวทีล่างขวา แบบเดียวกับ Reset all มุมขวาบน คนดูจะได้ไม่สนใจ */}
      <button
        type="button"
        onClick={onCancel}
        disabled={!canCancel}
        className="absolute right-12 bottom-0 z-40 h-12 text-score text-muted hover:text-danger disabled:invisible"
      >
        Cancel match
      </button>
    </>
  );
}

function TeamSide({
  team,
  side,
  scores,
  lastHits,
}: {
  team: MasterTeam;
  side: (typeof SIDES)[number];
  scores: PlayerScores;
  lastHits: LastHits;
}) {
  const stage = Math.min(Math.max(team.currentStage, 1), MONSTERS.length);
  const monster = MONSTERS[stage - 1];

  // หมัดล่าสุดของทีมเป็นตัวจุดภาพ hit / weak! — หมัดที่ล้มมอนสเตอร์ไม่โชว์ (ฉากเป็นตัวใหม่แล้ว เหมือนมือถือ)
  const lastHit = lastHits.byTeam[team.id];
  const trigger = lastHit && !lastHit.knockout ? lastHit.key : null;
  const hit = useFlash(trigger, HIT_MS);
  const weakHit = useFlash(lastHit?.weak ? trigger : null, WEAK_MS);

  const standings = teamStandings(team, scores);
  // ครบ 5 แถวเสมอ (แถวที่ไม่มีคนเป็นแถบเปล่า) — เผื่อคนหลุดจาก DB แล้วยังมีหมัดค้าง กล่องจะยืดตาม
  const slots = Math.max(standings.length, TEAM_SIZE);

  return (
    <section aria-label={team.name}>
      <div className={`absolute top-[130px] flex flex-col gap-[6px] ${side.score}`}>
        <span className="text-score leading-none">Score</span>
        <span className={`text-head2 leading-none tabular-nums ${designYellow}`}>{pad(team.score)}</span>
      </div>

      {/* ภาพฉาก 120×90 ขยาย ×4 = 480×360 */}
      <div className={`absolute top-[232px] ${side.scene}`}>
        <MonsterStage
          monster={monster}
          hp={team.monsterHp}
          // teamSize มาจาก start_match ตอนเริ่ม — กันหาร 0 ถ้าข้อมูลเพี้ยน
          maxHp={monsterMaxHp(monster, Math.max(team.teamSize, 1))}
          hit={hit}
          weakHit={weakHit}
          scaleText
          className="h-[360px] w-[480px]"
        />
      </div>

      <div className={`absolute top-[651px] w-[744px] ${side.table}`}>
        <h2 className="ml-[17px] truncate text-[40px] leading-none">{team.name}</h2>

        <div aria-hidden className={`${rowColumns} mt-[14px] text-score leading-none text-muted`}>
          <span>Rank</span>
          <span>Name</span>
          <span>Correct</span>
          <span>Score</span>
        </div>

        {/* แถวทุกแถววางทับกันที่ top 0 แล้วเลื่อนลงตามอันดับ — key คือ player id แถวเดิมจึงไหลไปที่ใหม่ ไม่ใช่สร้างใหม่
            ลำดับใน DOM คงที่ (ไม่ต้องวัดตำแหน่งบนจอ) อ่านอันดับจาก aria-posinset แทน */}
        <ol
          aria-label={`${team.name} players`}
          className="relative mt-[8px]"
          style={{ height: slots * (ROW_HEIGHT + ROW_GAP) - ROW_GAP }}
        >
          {Array.from({ length: slots - standings.length }, (_, i) => (
            <li
              key={`empty-${i}`}
              aria-hidden
              className={`absolute inset-x-0 top-0 rounded-[8px] ${rowBg}`}
              style={{ height: ROW_HEIGHT, transform: `translateY(${(standings.length + i) * (ROW_HEIGHT + ROW_GAP)}px)` }}
            />
          ))}
          {standings.map((row, i) => (
            <PlayerRow key={row.playerId} row={row} position={i} lastHit={lastHits.byPlayer[row.playerId]} />
          ))}
        </ol>
      </div>
    </section>
  );
}

function PlayerRow({ row, position, lastHit }: { row: Standing; position: number; lastHit: LastHit | undefined }) {
  const showPhrase = useFlash(lastHit?.key ?? null, PHRASE_MS);
  // ไฮไลต์คนอันดับ 1 (เสมอกันไฮไลต์ทุกคน) — ยังไม่มีใครได้คะแนน = ยังไม่ไฮไลต์
  const leader = row.rank === 1;

  return (
    <li
      aria-posinset={position + 1}
      data-player={row.name}
      className={`${rowColumns} absolute inset-x-0 top-0 rounded-[8px] text-body leading-none transition-[transform,background-color] duration-500 ease-out ${
        leader ? `${leaderRowBg} ${designYellow}` : rowBg
      }`}
      style={{ height: ROW_HEIGHT, transform: `translateY(${position * (ROW_HEIGHT + ROW_GAP)}px)` }}
    >
      <span>{row.rank ? ordinal(row.rank) : "-"}</span>
      {/* วลีที่เพิ่งทำถูก แวบต่อท้ายชื่อแป๊บหนึ่ง — คนดูหน้าบูธเห็นภาษาอังกฤษที่ผู้เล่นทำ */}
      <span className="flex min-w-0 items-baseline gap-3 pr-3">
        <span className="shrink-0 truncate">{row.name}</span>
        {showPhrase && lastHit && (
          <span className="truncate text-score">
            <span className="text-verb">{lastHit.verb}</span> <span className="text-noun">{lastHit.noun}</span>
            {lastHit.knockout ? (
              <span className={`ml-2 ${designYellow}`}>K.O.!</span>
            ) : (
              lastHit.weak && <span className="ml-2 text-ready">weak!</span>
            )}
          </span>
        )}
      </span>
      <span className="flex items-center gap-[16px] tabular-nums">
        <CheckBox />
        {row.hits}
      </span>
      <span className="tabular-nums">{pad(row.score)}</span>
    </li>
  );
}

// ไอคอน ✓ ของคอลัมน์ Correct (ฟอนต์ BoldPixels ไม่มีตัว ✓) — กล่องสีเดียวกับตัวหนังสือแถว ติ๊กสีพื้น
// รูปติ๊กเดียวกับ CheckIcon ใน app/battle/_components/BattleHeader.tsx
function CheckBox() {
  return (
    <svg viewBox="0 0 12 12" className="size-[14px] shrink-0" aria-label="correct">
      <rect width="12" height="12" fill="currentColor" />
      <path d="M2 6.5 5 9.5 10 3" fill="none" stroke="#20171c" strokeWidth="2" />
    </svg>
  );
}

function ordinal(n: number) {
  return `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
}

// true นาน ms หลัง trigger เปลี่ยนเป็นค่าใหม่ (null = ไม่มีอะไร) — ค่า trigger ต้องไม่ซ้ำกันในแต่ละครั้ง
// setState อยู่ใน setTimeout เท่านั้น (ไม่ setState ตรง ๆ ใน effect)
function useFlash(trigger: number | null, ms: number) {
  const [doneFor, setDoneFor] = useState<number | null>(null);
  useEffect(() => {
    if (trigger === null) return;
    const timeout = setTimeout(() => setDoneFor(trigger), ms);
    return () => clearTimeout(timeout);
  }, [trigger, ms]);
  return trigger !== null && doneFor !== trigger;
}
