// ทดสอบกติกาเกม — รันด้วย `npm test`
import { describe, expect, it } from "vitest";
import { countLiveCards, isValidPair, resolveDrop, swapCards, type GameContext } from "./engine";
import { createMockBattle } from "./mock-battle";
import { MONSTERS, monsterMaxHp, weaknessAt } from "./monsters";
import { WEAKNESS_ROTATE_MS } from "./rules";
import { KILL_BONUS } from "./scoring";
import type { BattleState, Word } from "./types";
import { findWord, WORD_PAIRS, WORD_POOL } from "./words";

const ctx: GameContext = { pairs: WORD_PAIRS, pool: WORD_POOL, rng: Math.random, elapsedMs: 0 };
const verb = (t: string) => findWord("verb", t);
const noun = (t: string) => findWord("noun", t);
const maxHp = (index: number, teamSize = 1) => monsterMaxHp(MONSTERS[index], teamSize);

// สุ่มแบบกำหนด seed ได้ (mulberry32) — ผลเหมือนเดิมทุกครั้ง test จะไม่ผ่านบ้างไม่ผ่านบ้าง
function seededRng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ลาก 2 คำลงหม้อติดกัน
function dropBoth(state: BattleState, first: Word, second: Word, c = ctx) {
  return resolveDrop(resolveDrop(state, first, c).state, second, c);
}

// สุ่มคู่ที่ถูกบนจอมาหนึ่งคู่
function randomPlayablePair(state: BattleState, rng: () => number) {
  const pairs = state.verbs.flatMap((v) =>
    state.nouns.filter((n) => isValidPair(v, n, WORD_PAIRS)).map((n) => [v, n] as const),
  );
  return pairs[Math.floor(rng() * pairs.length)];
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
    const o = dropBoth(createMockBattle(), verb("read"), noun("newspaper"));
    expect(o.result).toBe("hit");
    if (o.result !== "hit") return;
    expect(o.state.correct).toBe(1);
    expect(o.state.held).toBeNull();
    expect(o.state.monsterHp).toBe(maxHp(0) - o.damage);
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

describe("สลับการ์ด", () => {
  const texts = (words: Word[]) => words.map((w) => w.text);

  it("verb 2 ใบสลับที่กัน ที่เหลืออยู่ที่เดิม", () => {
    const s = swapCards(createMockBattle(), verb("eat"), verb("wear"));
    expect(texts(s.verbs)).toEqual(["wear", "read", "eat", "feed"]);
    expect(texts(s.nouns)).toEqual(["apple", "newspaper", "jacket", "rabbit"]);
  });

  it("คนละชนิด หรือใบเดียวกัน → ไม่เปลี่ยน", () => {
    const start = createMockBattle();
    expect(swapCards(start, verb("eat"), noun("apple"))).toBe(start);
    expect(swapCards(start, verb("eat"), verb("eat"))).toBe(start);
  });

  it("ไม่แตะคะแนน streak และคำที่ค้างในหม้อ", () => {
    const start = { ...createMockBattle(), score: 99, streak: 3, held: verb("read") };
    const s = swapCards(start, verb("read"), verb("feed"));
    expect(s).toMatchObject({ score: 99, streak: 3, held: verb("read") });
  });

  it("สลับแล้วตีต่อ การ์ดใหม่ลงช่องที่การ์ดที่ใช้อยู่ ลำดับที่จัดไว้ไม่หาย", () => {
    const sorted = swapCards(createMockBattle(), verb("eat"), verb("feed")); // feed read wear eat
    const o = dropBoth(sorted, verb("eat"), noun("apple"));
    expect(texts(o.state.verbs).slice(0, 3)).toEqual(["feed", "read", "wear"]);
    expect(o.state.verbs[3].text).not.toBe("eat");
  });
});

describe("มอนสเตอร์", () => {
  it("HP = HP ต่อคน × จำนวนคนในทีม", () => {
    expect([0, 1, 2, 3].map((i) => maxHp(i, 4))).toEqual([800, 1200, 1800, 2200]);
    expect([0, 1, 2, 3].map((i) => maxHp(i, 5))).toEqual([1000, 1500, 2250, 2750]);
    expect(createMockBattle(5).monsterHp).toBe(1000);
  });

  it("ล้มได้ → ตัวถัดไป + โบนัส, damage ที่ล้นไปลงตัวถัดไป", () => {
    const start = { ...createMockBattle(), monsterHp: 10, held: verb("read") };
    const o = resolveDrop(start, noun("newspaper"), { ...ctx, rng: () => 0.5 });
    if (o.result !== "hit") throw new Error("expected hit");
    expect(o.damage).toBe(30);
    expect(o.kills).toBe(1);
    expect(o.state.monsterIndex).toBe(1);
    expect(o.state.monsterHp).toBe(maxHp(1) - 20);
    expect(o.state.score).toBe(o.damage + KILL_BONUS);
  });

  it("ล้มตัวรองสุดท้าย → Dragon HP เต็ม ไม่รับ damage ที่ล้น", () => {
    const start = { ...createMockBattle(), monsterIndex: 3, monsterHp: 1, held: verb("eat") };
    const o = resolveDrop(start, noun("apple"), ctx);
    expect(o.state.monsterIndex).toBe(4);
    expect(o.state.monsterHp).toBe(maxHp(4));
  });

  it("ตัวสุดท้าย (endless) ตีไม่ตาย แต่ score ยังขึ้น", () => {
    const last = MONSTERS.length - 1;
    const start = { ...createMockBattle(), monsterIndex: last, monsterHp: maxHp(last), held: verb("eat") };
    const o = resolveDrop(start, noun("apple"), ctx);
    if (o.result !== "hit") throw new Error("expected hit");
    expect(o.kills).toBe(0);
    expect(o.state.monsterIndex).toBe(last);
    expect(o.state.monsterHp).toBe(maxHp(last));
    expect(o.state.score).toBeGreaterThan(0);
  });
});

describe("จุดอ่อน", () => {
  // rng คงที่ 0.5 = ไม่มีส่วนสุ่ม ±10%
  const fixed: GameContext = { ...ctx, rng: () => 0.5 };

  it("Slime แพ้ food: eat apple โดน, read newspaper ไม่โดน", () => {
    const a = dropBoth(createMockBattle(), verb("eat"), noun("apple"), fixed);
    const b = dropBoth(createMockBattle(), verb("read"), noun("newspaper"), fixed);
    if (a.result !== "hit" || b.result !== "hit") throw new Error("expected hit");
    expect(a.weak).toBe(true);
    expect(a.damage).toBe(45);
    expect(b.weak).toBe(false);
    expect(b.damage).toBe(30);
  });

  it("combo ยังคูณตามเดิม +10% ต่อครั้ง สูงสุด ×2", () => {
    const damageAt = (streak: number) => {
      const o = resolveDrop({ ...createMockBattle(), held: verb("read"), streak }, noun("newspaper"), fixed);
      return o.result === "hit" ? o.damage : NaN;
    };
    expect(damageAt(0)).toBe(30);
    expect(damageAt(5)).toBe(45);
    expect(damageAt(10)).toBe(60);
    expect(damageAt(50)).toBe(60);
  });

  it("Dragon เปลี่ยนหมวดทุก 30 วิ ตามเวลาของเกม แล้ววนกลับ", () => {
    const dragon = MONSTERS[MONSTERS.length - 1];
    const at = (ms: number) => weaknessAt(dragon, ms);
    expect(at(0)).toBe("school");
    expect(at(WEAKNESS_ROTATE_MS - 1)).toBe("school");
    expect(at(WEAKNESS_ROTATE_MS)).toBe("nature");
    expect(at(WEAKNESS_ROTATE_MS * 6)).toBe("school");
  });

  it("Dragon: noun หมวดที่เป็นจุดอ่อน ณ เวลาที่ปล่อยการ์ดเท่านั้นถึงโดน", () => {
    const last = MONSTERS.length - 1;
    const start = { ...createMockBattle(), monsterIndex: last, monsterHp: maxHp(last), held: verb("read") };
    const at = (ms: number) => resolveDrop(start, noun("newspaper"), { ...fixed, elapsedMs: ms });
    expect(at(0)).toMatchObject({ weak: true }); // school
    expect(at(WEAKNESS_ROTATE_MS)).toMatchObject({ weak: false }); // nature
  });

  it("ตัวที่มีจุดอ่อนหมวดเดียว ไม่เปลี่ยนตามเวลา", () => {
    expect(weaknessAt(MONSTERS[0], 0)).toBe("food");
    expect(weaknessAt(MONSTERS[0], 4 * 60_000)).toBe("food");
  });

  it("การ์ด noun ที่เติมใหม่เป็นหมวดจุดอ่อนบ่อยกว่าสุ่มล้วน", () => {
    const rng = seededRng(42);
    const seeded: GameContext = { ...ctx, rng };
    let state = createMockBattle();
    let weakRefills = 0;
    const rounds = 2000;
    for (let i = 0; i < rounds; i++) {
      const [v, n] = randomPlayablePair(state, rng);
      // HP เยอะ ๆ ให้อยู่กับ Slime ตลอด
      const before = { ...state, held: v, monsterHp: 1e9 };
      state = resolveDrop(before, n, seeded).state;
      const added = state.nouns.find((w) => !before.nouns.some((b) => b.id === w.id));
      if (added?.category === "food") weakRefills++;
    }
    // สุ่มล้วนจะได้ food ประมาณ 13/60 ≈ 22%
    expect(weakRefills / rounds).toBeGreaterThan(0.45);
  });
});

describe("กระดาน", () => {
  it("ตีสุ่ม 5,000 ครั้ง: มีคู่ถูกบนจอเสมอ และไม่มีการ์ดซ้ำ", () => {
    let state = createMockBattle();
    for (let i = 0; i < 5000; i++) {
      const pair = randomPlayablePair(state, Math.random);
      expect(pair).toBeDefined();

      // เวลาเดินไปเรื่อย ๆ ให้ครอบคลุมตอน Dragon เปลี่ยนจุดอ่อนด้วย
      state = resolveDrop({ ...state, held: pair[0] }, pair[1], { ...ctx, elapsedMs: i * 100 }).state;

      const ids = [...state.verbs, ...state.nouns].map((w) => w.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("เล่นไปนาน ๆ กระดานไม่อุดตัน: คู่ถูกยังมี ~4 คู่เหมือนกระดานแรก การ์ดเก่ายังใช้ได้", () => {
    const rng = seededRng(7);
    const seeded: GameContext = { ...ctx, rng };
    let pairs = 0;
    let dead = 0;
    let turns = 0;
    for (let game = 0; game < 200; game++) {
      let state = createMockBattle();
      for (let t = 0; t < 40; t++) {
        const [v, n] = randomPlayablePair(state, rng);
        state = resolveDrop({ ...state, held: v, monsterHp: 1e9 }, n, seeded).state;
        // นับเฉพาะหลังกระดานแรกถูกใช้ไปแล้ว — ตรงนี้คือช่วงที่เคยอุดตัน
        if (t < 5) continue;
        turns++;
        pairs += state.verbs.flatMap((vv) => state.nouns.filter((nn) => isValidPair(vv, nn, WORD_PAIRS))).length;
        dead += 8 - countLiveCards(state.verbs, state.nouns, WORD_PAIRS);
      }
    }
    // ก่อนแก้: คู่ถูก ~1.6 คู่ การ์ดไม่มีคู่ ~62%
    expect(pairs / turns).toBeGreaterThanOrEqual(3);
    expect(dead / (turns * 8)).toBeLessThanOrEqual(0.3);
  });
});
