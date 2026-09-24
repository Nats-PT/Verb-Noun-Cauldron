"use client";

import { PointerActivationConstraints, PointerSensor } from "@dnd-kit/dom";
import { DragDropProvider } from "@dnd-kit/react";
import { useEffect, useState } from "react";
import MonsterStage from "@/components/MonsterStage";
import { resolveDrop } from "@/lib/game/engine";
import { createMockBattle, createMockEndsAt, mockPairs, mockPool } from "@/lib/game/mock-battle";
import { MONSTERS } from "@/lib/game/monsters";
import type { Word } from "@/lib/game/types";
import BattleHeader from "./_components/BattleHeader";
import Cauldron, { POT_ID } from "./_components/Cauldron";
import ComboLabel, { type ComboFlash } from "./_components/ComboLabel";
import Timer from "./_components/Timer";
import WordColumn from "./_components/WordColumn";

// ระยะห่างอิงจาก Figma (frame 390×844) แต่แปลงเป็นสัดส่วน เพราะพื้นที่จริงในเบราว์เซอร์เตี้ยกว่า frame
// - h-svh: สูงเท่าพื้นที่ตอนแถบ URL ขยายเต็ม จะไม่มีอะไรจมใต้แถบ
// - safe area: เว้นขอบอย่างน้อย 12px หรือมากกว่านั้นถ้าเครื่องมีรอยบาก / แถบ Home
const safeArea =
  "pt-[max(12px,env(safe-area-inset-top))] pb-[max(12px,env(safe-area-inset-bottom))] " +
  "pl-[max(12px,env(safe-area-inset-left))] pr-[max(12px,env(safe-area-inset-right))]";

const FLASH_MS = 900;

export default function BattlePage() {
  // TODO: ต่อ DB — endsAt จาก server, ส่งผลการตีขึ้น DB, HP มอนสเตอร์ของทั้งทีมแบบ real-time
  // TODO: หมดเวลาแล้วต้องล็อกการลาก + ไปหน้าสรุปผล
  const [endsAt] = useState(createMockEndsAt);
  const [battle, setBattle] = useState(createMockBattle);
  const [flash, setFlash] = useState<ComboFlash | null>(null);

  // ผลการผสมโชว์แป๊บเดียว แล้วกลับไปแสดงคำในหม้อตามปกติ
  useEffect(() => {
    if (!flash) return;
    const timeout = setTimeout(() => setFlash(null), FLASH_MS);
    return () => clearTimeout(timeout);
  }, [flash]);

  function dropInPot(word: Word) {
    const outcome = resolveDrop(battle, word, { pairs: mockPairs, pool: mockPool, rng: Math.random });
    setBattle(outcome.state);

    if (outcome.result === "hit") {
      setFlash({ kind: "hit", verb: outcome.verb.text, noun: outcome.noun.text, damage: outcome.damage });
    } else if (outcome.result === "miss") {
      // การ์ดที่เพิ่งลากมาจะเด้งกลับที่เดิมเอง เพราะเราไม่ได้ย้ายมันออกจากกระดาน
      setFlash({ kind: "miss", verb: outcome.verb.text, noun: outcome.noun.text });
    } else {
      setFlash(null);
    }
  }

  const monster = MONSTERS[battle.monsterIndex];
  const heldId = battle.held?.id ?? null;

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
        if (event.canceled || event.operation.target?.id !== POT_ID) return;
        const word = event.operation.source?.data?.word as Word | undefined;
        if (word) dropInPot(word);
      }}
    >
      <main className={`mx-auto flex h-svh w-full max-w-md flex-col gap-2 ${safeArea}`}>
        <div className="px-[5%]">
          <BattleHeader score={battle.score} correct={battle.correct} wrong={battle.wrong} />
        </div>

        {/* Figma 330×257 — จอเตี้ยให้ฉากหดลงก่อน การ์ดจะได้มีที่พอ */}
        <MonsterStage
          monster={monster}
          hp={battle.monsterHp}
          className="mx-auto aspect-[330/257] h-[min(257px,32svh)] max-w-full shrink-0"
        />

        {/* 3 ช่อง: ช่องซ้ายว่างไว้ถ่วงให้ข้อความอยู่กลางจอพอดี ส่วน Timer อยู่ช่องขวา */}
        <div className="grid grid-cols-[1fr_minmax(0,auto)_1fr] items-center gap-2 px-[5%]">
          <span aria-hidden />
          <ComboLabel heldWord={battle.held} flash={flash} />
          <div className="justify-self-end">
            <Timer endsAt={endsAt} />
          </div>
        </div>

        <Cauldron heldWord={battle.held} onReturnWord={() => setBattle((b) => ({ ...b, held: null }))} />

        {/* Figma: ขอบซ้ายขวา 36px ช่องกลาง 42px */}
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-x-[11%] px-[6%]">
          <WordColumn label="Verbs" words={battle.verbs} heldId={heldId} />
          <WordColumn label="Nouns" words={battle.nouns} heldId={heldId} />
        </div>
      </main>
    </DragDropProvider>
  );
}
