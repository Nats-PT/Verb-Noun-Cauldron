// ทดสอบกติกาเกม — รันด้วย `npm test`
import { describe, expect, it } from "vitest";
import { isValidPair, resolveDrop, type GameContext } from "./engine";
import { createMockBattle } from "./mock-battle";
import { MONSTERS } from "./monsters";
import { KILL_BONUS } from "./scoring";
import type { BattleState, Word } from "./types";
import { findWord, WORD_PAIRS, WORD_POOL } from "./words";

const ctx: GameContext = { pairs: WORD_PAIRS, pool: WORD_POOL, rng: Math.random };
const verb = (t: string) => findWord("verb", t);
const noun = (t: string) => findWord("noun", t);

// ลาก 2 คำลงหม้อติดกัน
function dropBoth(state: BattleState, first: Word, second: Word, c = ctx) {
  return resolveDrop(resolveDrop(state, first, c).state, second, c);
}

describe("ลากคำลงหม้อ", () => {
  it("คำแรกค้างอยู่ในหม้อ", () => {
    const o = resolveDrop(createMockBattle(), verb("eat"), ctx);
    expect(o.result).toBe("held");
    expect(o.state.held?.text).toBe("eat");
  });

  it("ลากคำชนิดเดียวกันซ้ำ = เปลี่ยนคำที่ค้าง", () => {
    const o = dropBoth(createMockBattle(), verb("eat"), verb("read"));
    expect(o.result).toBe("held");
    expect(o.state.held?.text).toBe("read");
  });

  it("ผิด: ❌ +1, streak หาย, การ์ดเด้งกลับทั้ง 2 ใบ", () => {
    const start = { ...createMockBattle(), streak: 3 };
    const o = dropBoth(start, verb("eat"), noun("jacket"));
    expect(o.result).toBe("miss");
    expect(o.state.wrong).toBe(1);
    expect(o.state.streak).toBe(0);
    expect(o.state.held).toBeNull();
  });

  it("ถูก: damage เข้า HP และ score, ✅ +1, หม้อว่าง", () => {
    const o = dropBoth(createMockBattle(), verb("eat"), noun("apple"));
    expect(o.result).toBe("hit");
    if (o.result !== "hit") return;
    expect(o.state.correct).toBe(1);
    expect(o.state.held).toBeNull();
    expect(o.state.monsterHp).toBe(MONSTERS[0].maxHp - o.damage);
    expect(o.state.score).toBe(o.damage);
  });

  it("ถูก: การ์ด 2 ใบที่ใช้ถูกแทนด้วยคำใหม่", () => {
    const o = dropBoth(createMockBattle(), verb("eat"), noun("apple"));
    expect(o.state.verbs.map((w) => w.text)).not.toContain("eat");
    expect(o.state.nouns.map((w) => w.text)).not.toContain("apple");
  });

  it("ลาก noun ก่อน verb ก็ผสมได้", () => {
    expect(dropBoth(createMockBattle(), noun("rabbit"), verb("feed")).result).toBe("hit");
  });
});

describe("มอนสเตอร์", () => {
  it("ล้มได้ → ตัวถัดไป HP เต็ม + โบนัส", () => {
    const start = { ...createMockBattle(), monsterHp: 1, held: verb("eat") };
    const o = resolveDrop(start, noun("apple"), ctx);
    if (o.result !== "hit") throw new Error("expected hit");
    expect(o.killed).toBe(true);
    expect(o.state.monsterIndex).toBe(1);
    expect(o.state.monsterHp).toBe(MONSTERS[1].maxHp);
    expect(o.state.score).toBe(o.damage + KILL_BONUS);
  });

  it("ตัวสุดท้าย (endless) ตีไม่ตาย แต่ score ยังขึ้น", () => {
    const last = MONSTERS.length - 1;
    const start = { ...createMockBattle(), monsterIndex: last, monsterHp: MONSTERS[last].maxHp, held: verb("eat") };
    const o = resolveDrop(start, noun("apple"), ctx);
    expect(o.state.monsterIndex).toBe(last);
    expect(o.state.monsterHp).toBe(MONSTERS[last].maxHp);
    expect(o.state.score).toBeGreaterThan(0);
  });
});

describe("damage", () => {
  // rng คงที่ 0.5 = ไม่มีส่วนสุ่ม ±10%
  const fixed: GameContext = { ...ctx, rng: () => 0.5 };
  const damageAt = (streak: number) => {
    const o = resolveDrop({ ...createMockBattle(), held: verb("eat"), streak }, noun("apple"), fixed);
    return o.result === "hit" ? o.damage : NaN;
  };

  it("combo +10% ต่อครั้ง สูงสุด ×2", () => {
    expect(damageAt(0)).toBe(30);
    expect(damageAt(5)).toBe(45);
    expect(damageAt(10)).toBe(60);
    expect(damageAt(50)).toBe(60);
  });
});

describe("กระดาน", () => {
  it("ตีสุ่ม 5,000 ครั้ง: มีคู่ถูกบนจอเสมอ และไม่มีการ์ดซ้ำ", () => {
    let state = createMockBattle();
    for (let i = 0; i < 5000; i++) {
      const pairs = state.verbs.flatMap((v) =>
        state.nouns.filter((n) => isValidPair(v, n, WORD_PAIRS)).map((n) => [v, n] as const),
      );
      expect(pairs.length).toBeGreaterThan(0);

      const [v, n] = pairs[Math.floor(Math.random() * pairs.length)];
      state = resolveDrop({ ...state, held: v }, n, ctx).state;

      const ids = [...state.verbs, ...state.nouns].map((w) => w.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});
