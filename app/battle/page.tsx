"use client";

import { useState } from "react";
import MonsterStage from "@/components/MonsterStage";
import { createMockEndsAt, mockBattle, mockNouns, mockVerbs } from "@/lib/game/mock-battle";
import { MONSTERS } from "@/lib/game/monsters";
import type { Word } from "@/lib/game/types";
import BattleHeader from "./_components/BattleHeader";
import Cauldron from "./_components/Cauldron";
import ComboLabel from "./_components/ComboLabel";
import Timer from "./_components/Timer";
import WordColumn from "./_components/WordColumn";

// ระยะห่างอิงจาก Figma (frame 390×844) แต่แปลงเป็นสัดส่วน เพราะพื้นที่จริงในเบราว์เซอร์เตี้ยกว่า frame
// - h-svh: สูงเท่าพื้นที่ตอนแถบ URL ขยายเต็ม จะไม่มีอะไรจมใต้แถบ
// - safe area: เว้นขอบอย่างน้อย 12px หรือมากกว่านั้นถ้าเครื่องมีรอยบาก / แถบ Home
const safeArea =
  "pt-[max(12px,env(safe-area-inset-top))] pb-[max(12px,env(safe-area-inset-bottom))] " +
  "pl-[max(12px,env(safe-area-inset-left))] pr-[max(12px,env(safe-area-inset-right))]";

export default function BattlePage() {
  // TODO ระยะที่ 2: ย้ายไปเป็น state ของเกมจริง (useReducer) + ต่อ DB
  const [endsAt] = useState(createMockEndsAt);
  const [heldWord, setHeldWord] = useState<Word | null>(null);

  const monster = MONSTERS[mockBattle.monsterIndex];

  return (
    <main className={`mx-auto flex h-svh w-full max-w-md flex-col gap-2 ${safeArea}`}>
      <div className="px-[5%]">
        <BattleHeader score={mockBattle.score} correct={mockBattle.correct} wrong={mockBattle.wrong} />
      </div>

      {/* Figma 330×257 — จอเตี้ยให้ฉากหดลงก่อน การ์ดจะได้มีที่พอ */}
      <MonsterStage
        monster={monster}
        hp={mockBattle.monsterHp}
        className="mx-auto aspect-[330/257] h-[min(257px,32svh)] max-w-full shrink-0"
      />

      {/* 3 ช่อง: ช่องซ้ายว่างไว้ถ่วงให้ข้อความอยู่กลางจอพอดี ส่วน Timer อยู่ช่องขวา */}
      <div className="grid grid-cols-[1fr_minmax(0,auto)_1fr] items-center gap-2 px-[5%]">
        <span aria-hidden />
        <ComboLabel heldWord={heldWord} />
        <div className="justify-self-end">
          <Timer endsAt={endsAt} />
        </div>
      </div>

      <Cauldron heldWord={heldWord} onReturnWord={() => setHeldWord(null)} />

      {/* Figma: ขอบซ้ายขวา 36px ช่องกลาง 42px */}
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-x-[11%] px-[6%]">
        <WordColumn label="Verbs" words={mockVerbs} />
        <WordColumn label="Nouns" words={mockNouns} />
      </div>
    </main>
  );
}
