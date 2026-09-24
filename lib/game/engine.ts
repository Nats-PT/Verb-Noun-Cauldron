// กติกาเกมล้วน ๆ ไม่ยุ่งกับหน้าจอ — รับ state เดิม คืน state ใหม่
// แยกไว้แบบนี้เพื่อให้ย้ายไปตรวจคำตอบบน server ได้ในภายหลังโดยไม่ต้องเขียนใหม่
import { MONSTERS } from "./monsters";
import { calcDamage, KILL_BONUS } from "./scoring";
import type { BattleState, Word, WordKind, WordPair } from "./types";

export type GameContext = {
  pairs: WordPair[];
  pool: Word[];
  rng: () => number;
};

export type DropOutcome =
  | { result: "held"; state: BattleState }
  | { result: "miss"; state: BattleState; verb: Word; noun: Word }
  | { result: "hit"; state: BattleState; verb: Word; noun: Word; damage: number; killed: boolean };

export function isValidPair(verb: Word, noun: Word, pairs: WordPair[]) {
  return pairs.some(([v, n]) => v === verb.text && n === noun.text);
}

function hasPlayablePair(verbs: Word[], nouns: Word[], pairs: WordPair[]) {
  return verbs.some((v) => nouns.some((n) => isValidPair(v, n, pairs)));
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

// เปลี่ยนการ์ด 2 ใบที่เพิ่งใช้ และการันตีว่าบนจอยังมีคู่ที่ถูกอย่างน้อย 1 คู่ ผู้เล่นจะได้ไม่ติด
function refillBoard(state: BattleState, usedVerb: Word, usedNoun: Word, ctx: GameContext) {
  const onBoard = new Set([...state.verbs, ...state.nouns].map((w) => w.id));

  const build = (newVerb: Word, newNoun: Word) => ({
    verbs: state.verbs.map((w) => (w.id === usedVerb.id ? newVerb : w)),
    nouns: state.nouns.map((w) => (w.id === usedNoun.id ? newNoun : w)),
  });

  for (let attempt = 0; attempt < 20; attempt++) {
    const board = build(
      pickReplacement("verb", onBoard, ctx) ?? usedVerb,
      pickReplacement("noun", onBoard, ctx) ?? usedNoun,
    );
    if (hasPlayablePair(board.verbs, board.nouns, ctx.pairs)) return board;
  }

  // สุ่ม 20 รอบแล้วยังไม่มีคู่ถูก: บังคับเลือก noun ใหม่ให้เป็นคู่ของ verb สักใบบนจอ
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

// ลากคำลงหม้อ:
// - หม้อว่าง หรือเป็นคำชนิดเดียวกับที่ค้างอยู่ → ค้างคำนี้ไว้แทน
// - คำคนละชนิด → ตรวจคู่: ถูก = damage + เปลี่ยนการ์ด, ผิด = เสีย streak (คำในหม้อยังค้างอยู่)
export function resolveDrop(state: BattleState, word: Word, ctx: GameContext): DropOutcome {
  const held = state.held;
  if (!held || held.kind === word.kind) {
    return { result: "held", state: { ...state, held: word } };
  }

  const verb = word.kind === "verb" ? word : held;
  const noun = word.kind === "noun" ? word : held;

  if (!isValidPair(verb, noun, ctx.pairs)) {
    return { result: "miss", verb, noun, state: { ...state, wrong: state.wrong + 1, streak: 0 } };
  }

  const damage = calcDamage(state.streak, ctx.rng);
  const monster = MONSTERS[state.monsterIndex];

  let { monsterIndex, monsterHp } = state;
  let killed = false;
  // ตัว endless HP ไม่ลด แต่ damage ยังเข้า score
  if (!monster.endless) {
    monsterHp -= damage;
    if (monsterHp <= 0) {
      killed = true;
      monsterIndex = Math.min(monsterIndex + 1, MONSTERS.length - 1);
      monsterHp = MONSTERS[monsterIndex].maxHp;
    }
  }

  return {
    result: "hit",
    verb,
    noun,
    damage,
    killed,
    state: {
      ...state,
      ...refillBoard(state, verb, noun, ctx),
      held: null,
      score: state.score + damage + (killed ? KILL_BONUS : 0),
      correct: state.correct + 1,
      streak: state.streak + 1,
      monsterIndex,
      monsterHp,
    },
  };
}
