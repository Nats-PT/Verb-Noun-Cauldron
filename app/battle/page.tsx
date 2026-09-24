"use client";

import { useState } from "react";
import MonsterStage from "@/components/MonsterStage";
import { createMockEndsAt, mockBattle, mockNouns, mockVerbs } from "@/lib/game/mock-battle";
import { MONSTERS } from "@/lib/game/monsters";
import type { Word } from "@/lib/game/types";
import BattleHeader from "./_components/BattleHeader";
import Cauldron from "./_components/Cauldron";
import Timer from "./_components/Timer";
import WordColumn from "./_components/WordColumn";

export default function BattlePage() {
  // TODO ระยะที่ 2: ย้ายไปเป็น state ของเกมจริง (useReducer) + ต่อ DB
  const [endsAt] = useState(createMockEndsAt);
  const [heldWord, setHeldWord] = useState<Word | null>(null);

  const monster = MONSTERS[mockBattle.monsterIndex];

  return (
    <main className="mx-auto flex h-dvh w-full max-w-md flex-col gap-2 p-3">
      <BattleHeader score={mockBattle.score} correct={mockBattle.correct} wrong={mockBattle.wrong} />

      <MonsterStage monster={monster} hp={mockBattle.monsterHp} className="shrink-0" />

      <div className="relative flex items-center justify-center">
        <p className="text-body">verbs</p>
        <div className="absolute right-0">
          <Timer endsAt={endsAt} />
        </div>
      </div>

      <Cauldron heldWord={heldWord} onReturnWord={() => setHeldWord(null)} />

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
        <WordColumn label="Verbs" words={mockVerbs} />
        <WordColumn label="Nouns" words={mockNouns} />
      </div>
    </main>
  );
}
