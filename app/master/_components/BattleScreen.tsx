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

// กรอบชุดเดียวกับ Prepare / Winner
const outerFrame = pixelFrame("/lobby/frame-leader.png", { scale: 4 });

const pixelated = "[image-rendering:pixelated]";

// ภาพ hit (ตัวแดง) / weak! ค้างนานเท่ามือถือ (HIT_MS / FLASH_MS ใน app/battle/page.tsx)
const HIT_MS = 300;
const WEAK_MS = 900;
// วลีที่เพิ่งตีโชว์บนแถวผู้เล่นนานเท่านี้
const PHRASE_MS = 1500;

// วินาทีท้าย ๆ เวลาเป็นสีแดง เร่งให้คนดูลุ้น
const HURRY_SECONDS = 10;

// แถวผู้เล่น: สูง + ระยะห่าง (px) — แถววางตามอันดับด้วย translateY แล้วไหลไปที่ใหม่เองตอนแซงกัน
const ROW_HEIGHT = 56;
const ROW_GAP = 8;

// คอลัมน์ของแถวผู้เล่น ใช้ทั้งหัวตารางและแถว: อันดับ | ชื่อ | วลีที่เพิ่งตี | hits | score
const rowColumns = "grid grid-cols-[80px_1fr_300px_80px_110px] items-center gap-4";

// 4 ตัวเหมือนตัวเลขในเกม pixel (0041)
const pad = (n: number) => String(n).padStart(4, "0");

// จอระหว่างแมตช์ (ตามแบบที่กายวาด): ครึ่งบน = คะแนน + เวลา + ฉากมอนสเตอร์ของแต่ละทีม
// ครึ่งล่าง = ผู้เล่นแต่ละทีมเรียงตามคะแนน แซงกันแล้วแถวเลื่อนอันดับให้คนดูลุ้น
// ช่วง TIME'S UP บนมือถือ (FINISH_DELAY_MS) ยังอยู่จอนี้ เวลาเปลี่ยนเป็น TIME'S UP!
export default function BattleScreen({ teams, scores, lastHits, serverNow, canCancel, onCancel }: BattleScreenProps) {
  const [first, second] = teams;
  // เปิด /master?view=battle ตอนยังไม่เคยมีแมตช์ (dev)
  if (!first) return <p className="grid h-full place-items-center text-head2 text-muted">No match yet</p>;

  const secondsLeft = first.endsAt === null ? 0 : Math.max(0, Math.ceil((first.endsAt - serverNow) / 1000));
  // เล่นทีมเดียว: คอลัมน์เดียวอยู่กลางจอ กว้างเท่าครึ่งจอเหมือนตอน 2 ทีม
  const columns = second ? "grid-cols-2" : "grid-cols-[896px] justify-center";

  return (
    <>
      <main style={outerFrame} className={`absolute inset-12 flex flex-col ${pixelated}`}>
        <div className={`grid ${columns}`}>
          {teams.map((team, i) => (
            <TeamStage
              key={team.id}
              team={team}
              lastHit={lastHits.byTeam[team.id]}
              secondsLeft={secondsLeft}
              divider={i > 0}
            />
          ))}
        </div>

        <div className={`grid flex-1 border-t-4 border-primary ${columns}`}>
          {teams.map((team) => (
            <TeamPlayers key={team.id} team={team} standings={teamStandings(team, scores)} lastHits={lastHits} />
          ))}
        </div>
      </main>

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

// ครึ่งบนของแต่ละทีม: Score / Time แล้วฉากมอนสเตอร์ตรงกลาง
function TeamStage({
  team,
  lastHit,
  secondsLeft,
  divider,
}: {
  team: MasterTeam;
  lastHit: LastHit | undefined;
  secondsLeft: number;
  divider: boolean;
}) {
  const stage = Math.min(Math.max(team.currentStage, 1), MONSTERS.length);
  const monster = MONSTERS[stage - 1];

  // หมัดล่าสุดของทีมเป็นตัวจุดภาพ hit / weak! — หมัดที่ล้มมอนสเตอร์ไม่โชว์ (ฉากเป็นตัวใหม่แล้ว เหมือนมือถือ)
  const trigger = lastHit && !lastHit.knockout ? lastHit.key : null;
  const hit = useFlash(trigger, HIT_MS);
  const weakHit = useFlash(lastHit?.weak ? trigger : null, WEAK_MS);

  const clock = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`;

  return (
    <section
      aria-label={`${team.name} monster`}
      className={`flex flex-col gap-4 px-10 py-6 ${divider ? "border-l-4 border-primary" : ""}`}
    >
      <header className="flex items-baseline justify-between text-head2 tabular-nums">
        <p>
          Score : <span className="text-accent">{pad(team.score)}</span>
        </p>
        <p
          aria-live="off"
          className={secondsLeft === 0 ? "text-accent" : secondsLeft <= HURRY_SECONDS ? "text-danger" : ""}
        >
          {secondsLeft === 0 ? "TIME'S UP!" : `Time : ${clock}`}
        </p>
      </header>

      {/* ภาพฉาก 120×90 ขยาย ×4 = 480×360 — เหลือที่ให้ตารางผู้เล่นตัวใหญ่อ่านจากไกล ๆ ได้ */}
      <MonsterStage
        monster={monster}
        hp={team.monsterHp}
        // teamSize มาจาก start_match ตอนเริ่ม — กันหาร 0 ถ้าข้อมูลเพี้ยน
        maxHp={monsterMaxHp(monster, Math.max(team.teamSize, 1))}
        hit={hit}
        weakHit={weakHit}
        scaleText
        className="h-[360px] w-[480px] self-center"
      />
    </section>
  );
}

// ครึ่งล่างของแต่ละทีม: ชื่อทีม + ตารางผู้เล่น
function TeamPlayers({ team, standings, lastHits }: { team: MasterTeam; standings: Standing[]; lastHits: LastHits }) {
  // ปกติทีมละไม่เกิน TEAM_SIZE — เผื่อคนหลุดจาก DB แล้วยังมีหมัดค้าง กล่องจะยืดตาม ไม่ทับกัน
  const slots = Math.max(standings.length, TEAM_SIZE);

  return (
    <section className="flex min-w-0 flex-col gap-3 px-10 py-6">
      <h2 className="truncate text-head2">{team.name}</h2>

      <div aria-hidden className={`${rowColumns} px-4 text-score text-muted`}>
        <span>Rank</span>
        <span>Player</span>
        <span />
        <span className="text-right">Hits</span>
        <span className="text-right">Score</span>
      </div>

      {/* แถวทุกแถววางทับกันที่ top 0 แล้วเลื่อนลงตามอันดับ — key คือ player id แถวเดิมจึงไหลไปที่ใหม่ ไม่ใช่สร้างใหม่
          ลำดับใน DOM คงที่ (ไม่ต้องวัดตำแหน่งบนจอ) อ่านอันดับจาก aria-posinset แทน */}
      <ol aria-label={`${team.name} players`} className="relative" style={{ height: slots * (ROW_HEIGHT + ROW_GAP) - ROW_GAP }}>
        {standings.map((row, i) => (
          <PlayerRow key={row.playerId} row={row} position={i} lastHit={lastHits.byPlayer[row.playerId]} />
        ))}
      </ol>
    </section>
  );
}

function PlayerRow({ row, position, lastHit }: { row: Standing; position: number; lastHit: LastHit | undefined }) {
  const showPhrase = useFlash(lastHit?.key ?? null, PHRASE_MS);

  return (
    <li
      aria-posinset={position + 1}
      data-player={row.name}
      className={`${rowColumns} absolute inset-x-0 top-0 rounded-xl px-4 text-body transition-[transform,background-color] duration-500 ease-out ${
        showPhrase ? "bg-primary/25" : "bg-surface/60"
      }`}
      style={{ height: ROW_HEIGHT, transform: `translateY(${position * (ROW_HEIGHT + ROW_GAP)}px)` }}
    >
      <span className={row.rank === 1 ? "text-accent" : "text-muted"}>{row.rank ? ordinal(row.rank) : "-"}</span>
      <span className="truncate">{row.name}</span>
      {/* วลีที่เพิ่งทำถูก แวบขึ้นแป๊บหนึ่ง — คนดูหน้าบูธเห็นภาษาอังกฤษที่ผู้เล่นทำ */}
      <span className="truncate">
        {showPhrase && lastHit && (
          <>
            <span className="text-verb">{lastHit.verb}</span> <span className="text-noun">{lastHit.noun}</span>
            {lastHit.knockout ? (
              <span className="ml-2 text-accent">K.O.!</span>
            ) : (
              lastHit.weak && <span className="ml-2 text-ready">weak!</span>
            )}
          </>
        )}
      </span>
      <span className="text-right tabular-nums">{row.hits}</span>
      <span className="text-right text-accent tabular-nums">{pad(row.score)}</span>
    </li>
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
