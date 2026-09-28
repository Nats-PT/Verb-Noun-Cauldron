"use client";

import { PointerActivationConstraints, PointerSensor } from "@dnd-kit/dom";
import { DragDropProvider } from "@dnd-kit/react";
import { useEffect, useState } from "react";
import MonsterStage from "@/components/MonsterStage";
import { resolveDrop, swapCards } from "@/lib/game/engine";
import { createMockBattle, createMockEndsAt } from "@/lib/game/mock-battle";
import { MONSTERS, monsterMaxHp } from "@/lib/game/monsters";
import { elapsedMs, FINISH_DELAY_MS, isTimeUp } from "@/lib/game/rules";
import type { Word } from "@/lib/game/types";
import { WORD_PAIRS, WORD_POOL } from "@/lib/game/words";
import BattleHeader from "./_components/BattleHeader";
import Cauldron, { POT_ID } from "./_components/Cauldron";
import ComboLabel, { type ComboFlash } from "./_components/ComboLabel";
import Timer from "./_components/Timer";
import TimeUpBanner from "./_components/TimeUpBanner";
import WordColumn from "./_components/WordColumn";
import { useNow } from "./_hooks/useNow";
import { useTimePassed } from "./_hooks/useTimePassed";

// ระยะห่างอิงจาก Figma (frame 390×844) แต่แปลงเป็นสัดส่วน เพราะพื้นที่จริงในเบราว์เซอร์เตี้ยกว่า frame
// - h-svh: สูงเท่าพื้นที่ตอนแถบ URL ขยายเต็ม จะไม่มีอะไรจมใต้แถบ
// - safe area: เว้นขอบอย่างน้อย 12px หรือมากกว่านั้นถ้าเครื่องมีรอยบาก / แถบ Home
const safeArea =
  "pt-[max(12px,env(safe-area-inset-top))] pb-[max(12px,env(safe-area-inset-bottom))] " +
  "pl-[max(12px,env(safe-area-inset-left))] pr-[max(12px,env(safe-area-inset-right))]";

const FLASH_MS = 900;
// มอนสเตอร์เป็นภาพ hit (ตัวแดง) นานเท่านี้หลังโดนตี — โดนรัว ๆ จะนับใหม่ทุกครั้ง ค้างแดงไม่กระพริบ
const HIT_MS = 300;

// ฉาก 120×90 ขยายเป็นจำนวนเต็ม: ×2 = 240×180, จอสูง (และกว้างพอ) ×3 = 360×270
// แยกกว้าง/สูง เพราะแถวเวลาใต้ฉากใช้ความกว้างเดียวกัน (เวลาชิดขอบขวาของฉาก)
const stageWidth = "w-[240px] [@media(min-height:800px)_and_(min-width:384px)]:w-[360px]";
const stageHeight = "h-[180px] [@media(min-height:800px)_and_(min-width:384px)]:h-[270px]";

export default function BattlePage() {
  // TODO: ต่อ DB — endsAt จาก server, ส่งผลการตีขึ้น DB, HP มอนสเตอร์ของทั้งทีมแบบ real-time
  const [endsAt] = useState(createMockEndsAt);
  const [battle, setBattle] = useState(createMockBattle);
  const [flash, setFlash] = useState<ComboFlash | null>(null);
  // เวลาที่โดนตีล่าสุด (null = ไม่ได้โดนตีอยู่) — ค่าใหม่ทุกครั้งที่ตี effect ด้านล่างจึงเริ่มนับใหม่
  const [hitAt, setHitAt] = useState<number | null>(null);
  const now = useNow();

  // หมดเวลา → ล็อกกระดาน + ป้าย TIME'S UP; อีก FINISH_DELAY_MS ต่อมา → ไปหน้าสรุป
  // TODO: ตอน finished (ends_at + 3 วิ) เรียก recordMatchResult({ teamId }) จาก lib/leaderboard.ts
  //       — รอต่อ DB ให้ได้ teamId (getMyBattleTeam ใน SUPABASE.md) และให้ record_hit ที่มาช้าเข้าครบก่อน
  // TODO: แล้วสั่ง router.push ไปหน้า winner — รอหน้า winner ของเพื่อน (ชื่อ path ยังไม่ตั้ง)
  const timeUp = useTimePassed(endsAt);
  const finished = useTimePassed(endsAt + FINISH_DELAY_MS);

  // ผลการผสมโชว์แป๊บเดียว แล้วกลับไปแสดงคำในหม้อตามปกติ
  useEffect(() => {
    if (!flash) return;
    const timeout = setTimeout(() => setFlash(null), FLASH_MS);
    return () => clearTimeout(timeout);
  }, [flash]);

  // โหลดภาพมอนสเตอร์ทุกตัว (ท่ายืน + ตอนโดนตี รวม ~40KB) ไว้ตั้งแต่เปิดหน้า
  // ไม่งั้นตอนล้มตัวเก่า ฉากของตัวใหม่อาจว่างแป๊บหนึ่งระหว่างโหลด (เห็นชัดบน Wi-Fi ช้า ๆ ในงาน)
  useEffect(() => {
    for (const monster of MONSTERS) {
      for (const src of [monster.scene, monster.hitScene]) new window.Image().src = src;
    }
  }, []);

  useEffect(() => {
    if (hitAt === null) return;
    const timeout = setTimeout(() => setHitAt(null), HIT_MS);
    return () => clearTimeout(timeout);
  }, [hitAt]);

  function dropInPot(word: Word) {
    const outcome = resolveDrop(battle, word, {
      pairs: WORD_PAIRS,
      pool: WORD_POOL,
      rng: Math.random,
      // ใช้เวลา ณ ตอนปล่อยจริง ไม่ใช่ now ที่เดินทีละวิ — ปล่อยตอนจุดอ่อนเพิ่งเปลี่ยนจะได้นับถูก
      elapsedMs: elapsedMs(endsAt, Date.now()),
    });
    setBattle(outcome.state);

    if (outcome.result === "hit") {
      setFlash({
        kind: "hit",
        verb: outcome.verb.text,
        noun: outcome.noun.text,
        damage: outcome.damage,
        // หมัดที่ล้มมอนสเตอร์ไม่โชว์ weak! — ฉากเปลี่ยนเป็นตัวใหม่แล้ว จะดูเหมือนตัวใหม่แพ้คำนี้
        weak: outcome.weak && outcome.kills === 0,
      });
      // หมัดที่ล้มมอนสเตอร์ไม่โชว์ภาพ hit ด้วยเหตุผลเดียวกัน — ตัวใหม่โผล่มาในท่ายืนปกติ
      setHitAt(outcome.kills === 0 ? Date.now() : null);
    } else if (outcome.result === "miss") {
      // การ์ดเด้งกลับที่เดิมทั้ง 2 ใบ: ใบที่เพิ่งลากกลับเองเพราะไม่ได้ย้ายออกจากกระดาน ใบที่ค้างอยู่ถูกล้างใน resolveDrop
      setFlash({ kind: "miss", verb: outcome.verb.text, noun: outcome.noun.text });
    } else {
      setFlash(null);
    }
  }

  const monster = MONSTERS[battle.monsterIndex];
  // หมดเวลาแล้วคำที่ค้างในหม้อหายไป (ไม่แก้ state — แค่ไม่แสดง)
  const held = timeUp ? null : battle.held;
  const heldId = held?.id ?? null;

  // นับถอยหลัง 3 → 2 → 1 ตาม useNow (ก่อนนาฬิกาเดินรอบแรกหลังหมดเวลา ค่าอาจเกิน 3 จึงกันไว้)
  const secondsLeft = finished
    ? null
    : Math.min(FINISH_DELAY_MS / 1000, Math.max(1, Math.ceil((endsAt + FINISH_DELAY_MS - (now ?? 0)) / 1000)));

  return (
    <DragDropProvider
      // ค่าเริ่มต้นบนจอสัมผัสต้องกดค้าง 250ms ก่อนถึงจะลากได้ (กันลากพลาดตอนเลื่อนหน้า)
      // หน้านี้ล็อกไม่ให้เลื่อนอยู่แล้ว จึงให้เริ่มลากทันทีที่นิ้วขยับ 5px — ปัดเร็ว ๆ ก็ติด
      sensors={(defaults) => [
        ...defaults.filter((sensor) => sensor !== PointerSensor),
        PointerSensor.configure({
          activationConstraints: [new PointerActivationConstraints.Distance({ value: 5 })],
        }),
      ]}
      onDragEnd={(event) => {
        const { source, target } = event.operation;
        const word = source?.data?.word as Word | undefined;
        if (event.canceled || !word || !target) return;
        // ลากค้างไว้ตอนหมดเวลาแล้วค่อยปล่อย → ไม่นับ (เช็กเวลาจริงตอนปล่อย ไม่รอ timeUp)
        if (isTimeUp(endsAt, Date.now())) return;

        if (target.id === POT_ID) {
          dropInPot(word);
          return;
        }
        // วางทับการ์ดอีกใบ (WordCard รับเฉพาะชนิดเดียวกันอยู่แล้ว) → สลับที่
        const other = target.data?.word as Word | undefined;
        if (other) setBattle((b) => swapCards(b, word, other));
      }}
    >
      <main className={`mx-auto flex h-svh w-full max-w-md flex-col gap-2 ${safeArea}`}>
        <div className="px-[5%]">
          <BattleHeader score={battle.score} correct={battle.correct} wrong={battle.wrong} />
        </div>

        {/* ขนาดฉากเป็นจำนวนเต็มเท่าของภาพ (stageWidth/Height) pixel art จะได้คม
            กล่อง relative ครอบไว้ให้ป้าย TIME'S UP วางทับฉากได้ โดยไม่ต้องแก้ MonsterStage (จอ master ใช้ร่วม)
            กรอบชมพูตาม design ใช้ ring (วาดทับขอบนอก) ขนาดฉากและตำแหน่งของอย่างอื่นจึงไม่ขยับ */}
        <div className={`relative mx-auto shrink-0 rounded-lg ring-[3px] ring-primary ${stageWidth} ${stageHeight}`}>
          <MonsterStage
            monster={monster}
            hp={battle.monsterHp}
            maxHp={monsterMaxHp(monster, battle.teamSize)}
            hit={hitAt !== null}
            weakHit={flash?.kind === "hit" && flash.weak}
            className="size-full"
          />
          {timeUp && (
            <TimeUpBanner
              score={battle.score}
              correct={battle.correct}
              wrong={battle.wrong}
              secondsLeft={secondsLeft}
            />
          )}
        </div>

        <Cauldron heldWord={held} locked={timeUp} onReturnWord={() => setBattle((b) => ({ ...b, held: null }))}>
          {/* บรรทัดเดียวใต้ฉาก: ข้อความผสมคำกลางจอ + เวลาชิดขวา — ประหยัดที่ หม้อกับการ์ดเลื่อนขึ้นได้
              3 ช่อง: ช่องซ้ายว่างไว้ถ่วงให้ข้อความอยู่กลางจอพอดี */}
          <div className="grid w-full grid-cols-[1fr_minmax(0,auto)_1fr] items-center gap-2 px-[5%]">
            <span aria-hidden />
            <ComboLabel heldWord={held} flash={flash} />
            <div className="justify-self-end">
              <Timer endsAt={endsAt} now={now} />
            </div>
          </div>
        </Cauldron>

        {/* Figma: ขอบซ้ายขวา 36px ช่องกลาง 42px — z-10 ทับครึ่งล่างของหม้อ (ช่องกลางเห็นขาหม้อ) */}
        <div className="relative z-10 grid min-h-0 flex-1 grid-cols-2 gap-x-[11%] px-[6%]">
          <WordColumn label="Verbs" words={battle.verbs} heldId={heldId} locked={timeUp} />
          <WordColumn label="Nouns" words={battle.nouns} heldId={heldId} locked={timeUp} />
        </div>
      </main>
    </DragDropProvider>
  );
}
