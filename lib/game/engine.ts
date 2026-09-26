// กติกาเกมล้วน ๆ ไม่ยุ่งกับหน้าจอ — รับ state เดิม คืน state ใหม่
// แยกไว้แบบนี้เพื่อให้ย้ายไปตรวจคำตอบบน server ได้ในภายหลังโดยไม่ต้องเขียนใหม่
import { MONSTERS, monsterMaxHp, weaknessAt } from "./monsters";
import { LIVE_CARDS_TARGET, REFILL_CANDIDATES, WEAK_REFILL_CHANCE } from "./rules";
import { calcDamage, KILL_BONUS } from "./scoring";
import type { BattleState, NounCategory, Word, WordKind, WordPair } from "./types";

export type GameContext = {
  pairs: WordPair[];
  pool: Word[];
  rng: () => number;
  // เล่นไปแล้วกี่ ms ณ ตอนปล่อยการ์ด — ใช้หาจุดอ่อนของ Dragon ที่เปลี่ยนตามเวลา
  elapsedMs: number;
};

export type DropOutcome =
  | { result: "held"; state: BattleState }
  | { result: "miss"; state: BattleState; verb: Word; noun: Word }
  | {
      result: "hit";
      state: BattleState;
      verb: Word;
      noun: Word;
      damage: number;
      // ตีโดนจุดอ่อนไหม — หน้าจอใช้โชว์ WEAK!
      weak: boolean;
      // ล้มได้กี่ตัว (ปกติ 0–1 แต่ damage ที่ล้นไปลงตัวถัดไปได้)
      kills: number;
    };

export function isValidPair(verb: Word, noun: Word, pairs: WordPair[]) {
  return pairs.some(([v, n]) => v === verb.text && n === noun.text);
}

// การ์ดบนจอที่มีคู่ถูกอย่างน้อย 1 ใบ มีกี่ใบ (0–8)
export function countLiveCards(verbs: Word[], nouns: Word[], pairs: WordPair[]) {
  const liveVerbs = verbs.filter((v) => nouns.some((n) => isValidPair(v, n, pairs))).length;
  const liveNouns = nouns.filter((n) => verbs.some((v) => isValidPair(v, n, pairs))).length;
  return liveVerbs + liveNouns;
}

function pickRandom<T>(items: T[], rng: () => number): T | undefined {
  return items[Math.floor(rng() * items.length)];
}

function pickReplacement(kind: WordKind, exclude: Set<string>, ctx: GameContext) {
  return pickRandom(
    ctx.pool.filter((w) => w.kind === kind && !exclude.has(w.id)),
    ctx.rng,
  );
}

// noun ใบใหม่: บางครั้งสุ่มจากหมวดจุดอ่อนโดยตรง คำจุดอ่อนจะได้โผล่บ่อยพอให้เล็งได้
// ถ้าหมวดนั้นไม่เหลือคำที่ยังไม่อยู่บนจอ ก็สุ่มจากทั้งหมดตามปกติ
function pickNoun(exclude: Set<string>, weakness: NounCategory, ctx: GameContext) {
  if (ctx.rng() < WEAK_REFILL_CHANCE) {
    const weakNoun = pickRandom(
      ctx.pool.filter((w) => w.kind === "noun" && w.category === weakness && !exclude.has(w.id)),
      ctx.rng,
    );
    if (weakNoun) return weakNoun;
  }
  return pickReplacement("noun", exclude, ctx);
}

// เปลี่ยนการ์ด 2 ใบที่เพิ่งใช้ และการันตีว่าบนจอยังมีคู่ที่ถูกอย่างน้อย 1 คู่ ผู้เล่นจะได้ไม่ติด
//
// สุ่มการ์ดใหม่มาหลายชุด แล้วเลือกชุดที่ทำให้การ์ดบนจอมีคู่มากที่สุด (ไม่เกิน LIVE_CARDS_TARGET)
// ถ้าแค่สุ่มจนมีคู่ถูก 1 คู่ การ์ดใหม่ 2 ใบมักจับคู่กันเอง การ์ดเก่าที่ไม่มีคู่ค้างบนจอไปเรื่อย ๆ
// ผู้เล่นเลยมองแค่ใบใหม่ก็พอ (จำลองแล้ว: การ์ดไม่มีคู่ 62% → 22%, คู่ถูกบนจอ ~1.6 → ~4 คู่)
function refillBoard(state: BattleState, usedVerb: Word, usedNoun: Word, weakness: NounCategory, ctx: GameContext) {
  const onBoard = new Set([...state.verbs, ...state.nouns].map((w) => w.id));

  const build = (newVerb: Word, newNoun: Word) => ({
    verbs: state.verbs.map((w) => (w.id === usedVerb.id ? newVerb : w)),
    nouns: state.nouns.map((w) => (w.id === usedNoun.id ? newNoun : w)),
  });

  let best: ReturnType<typeof build> | null = null;
  let bestLive = 0;
  for (let attempt = 0; attempt < REFILL_CANDIDATES && bestLive < LIVE_CARDS_TARGET; attempt++) {
    const board = build(
      pickReplacement("verb", onBoard, ctx) ?? usedVerb,
      pickNoun(onBoard, weakness, ctx) ?? usedNoun,
    );
    const live = Math.min(countLiveCards(board.verbs, board.nouns, ctx.pairs), LIVE_CARDS_TARGET);
    if (live > bestLive) {
      best = board;
      bestLive = live;
    }
  }
  // มีการ์ดที่มีคู่อย่างน้อย 1 ใบ = มีคู่ถูกบนจอแล้ว
  if (best) return best;

  // สุ่มครบทุกชุดแล้วยังไม่มีคู่ถูก: บังคับเลือก noun ใหม่ให้เป็นคู่ของ verb สักใบบนจอ
  const newVerb = pickReplacement("verb", onBoard, ctx) ?? usedVerb;
  const verbs = state.verbs.map((w) => (w.id === usedVerb.id ? newVerb : w));
  const partner = pickRandom(
    ctx.pool.filter(
      (n) => n.kind === "noun" && !onBoard.has(n.id) && verbs.some((v) => isValidPair(v, n, ctx.pairs)),
    ),
    ctx.rng,
  );
  return build(newVerb, partner ?? usedNoun);
}

// หัก HP — damage ที่เกินไปลงตัวถัดไป ไม่ทิ้ง (ทีมคนเยอะตีพร้อมกันตอนใกล้ตายบ่อย จะได้ไม่เสียเปรียบ)
// ตัว endless HP ไม่ลด แต่ damage ยังเข้า score
function applyDamage(state: BattleState, damage: number) {
  let { monsterIndex, monsterHp } = state;
  let kills = 0;
  if (MONSTERS[monsterIndex].endless) return { monsterIndex, monsterHp, kills };

  monsterHp -= damage;
  // ตัวสุดท้ายเป็น endless เสมอ loop จึงหยุดก่อนเลยท้าย MONSTERS
  while (monsterHp <= 0 && !MONSTERS[monsterIndex].endless) {
    kills++;
    monsterIndex++;
    const next = MONSTERS[monsterIndex];
    // ตัว endless เริ่มที่ HP เต็มเสมอ เพราะยังไงก็ตีไม่ตาย
    monsterHp = next.endless ? monsterMaxHp(next, state.teamSize) : monsterHp + monsterMaxHp(next, state.teamSize);
  }
  return { monsterIndex, monsterHp, kills };
}

// สลับตำแหน่งการ์ด 2 ใบในคอลัมน์เดียวกัน ให้ผู้เล่นจัดเรียงเองได้ — ไม่มีผลกับคะแนน/streak
// คนละชนิด หรือใบเดียวกัน → คืน state เดิม
export function swapCards(state: BattleState, a: Word, b: Word): BattleState {
  if (a.kind !== b.kind || a.id === b.id) return state;

  const key = a.kind === "verb" ? "verbs" : "nouns";
  const cards = [...state[key]];
  const i = cards.findIndex((w) => w.id === a.id);
  const j = cards.findIndex((w) => w.id === b.id);
  if (i < 0 || j < 0) return state;

  [cards[i], cards[j]] = [cards[j], cards[i]];
  return { ...state, [key]: cards };
}

// ลากคำลงหม้อ:
// - หม้อว่าง หรือเป็นคำชนิดเดียวกับที่ค้างอยู่ → ค้างคำนี้ไว้แทน
// - คำคนละชนิด → ผสมทันที: ถูก = damage + เปลี่ยนการ์ด, ผิด = เสีย streak และการ์ดเด้งกลับทั้ง 2 ใบ
//   (ไม่ให้ค้าง verb ไว้แล้วไล่ลอง noun ทีละใบจนกว่าจะถูก)
export function resolveDrop(state: BattleState, word: Word, ctx: GameContext): DropOutcome {
  const held = state.held;
  if (!held || held.kind === word.kind) {
    return { result: "held", state: { ...state, held: word } };
  }

  const verb = word.kind === "verb" ? word : held;
  const noun = word.kind === "noun" ? word : held;

  if (!isValidPair(verb, noun, ctx.pairs)) {
    return { result: "miss", verb, noun, state: { ...state, held: null, wrong: state.wrong + 1, streak: 0 } };
  }

  const weak = noun.category === weaknessAt(MONSTERS[state.monsterIndex], ctx.elapsedMs);
  const b1Words = [verb, noun].filter((w) => w.level === "B1").length;
  const damage = calcDamage({ streak: state.streak, b1Words, weak }, ctx.rng);
  const { monsterIndex, monsterHp, kills } = applyDamage(state, damage);

  // การ์ดใหม่เล็งจุดอ่อนของตัวที่จะตีต่อ — ถ้าเพิ่งล้มตัวเก่าก็ใช้ของตัวใหม่เลย
  const nextWeakness = weaknessAt(MONSTERS[monsterIndex], ctx.elapsedMs);

  return {
    result: "hit",
    verb,
    noun,
    damage,
    weak,
    kills,
    state: {
      ...state,
      ...refillBoard(state, verb, noun, nextWeakness, ctx),
      held: null,
      score: state.score + damage + kills * KILL_BONUS,
      correct: state.correct + 1,
      streak: state.streak + 1,
      monsterIndex,
      monsterHp,
    },
  };
}
