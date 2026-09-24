// ข้อมูลปลอมระหว่างรอคลังคำจริง (40 verb / 60 noun / 250–300 คู่ ที่คนเก่งอังกฤษตรวจแล้ว)
import { MONSTERS } from "./monsters";
import { GAME_DURATION_MS } from "./rules";
import type { BattleState, Word, WordPair } from "./types";

const verb = (text: string): Word => ({ id: `v-${text}`, text, kind: "verb" });
const noun = (text: string): Word => ({ id: `n-${text}`, text, kind: "noun" });

export const mockPool: Word[] = [
  ...["eat", "drink", "read", "cook", "wash", "drive", "borrow", "repair", "open", "write", "investigate"].map(verb),
  ...["apple", "water", "book", "dinner", "car", "bicycle", "library", "dishes", "door", "letter", "evidence", "coffee"].map(noun),
];

// "library" ไม่มีคู่เลย ตั้งใจไว้ทดสอบกรณีตอบผิด (เช่น borrow + library)
export const mockPairs: WordPair[] = [
  ["eat", "apple"], ["eat", "dinner"],
  ["drink", "water"], ["drink", "coffee"],
  ["read", "book"], ["read", "letter"],
  ["cook", "dinner"],
  ["wash", "dishes"], ["wash", "car"],
  ["drive", "car"],
  ["borrow", "book"], ["borrow", "bicycle"], ["borrow", "car"],
  ["repair", "bicycle"], ["repair", "car"], ["repair", "door"],
  ["open", "door"], ["open", "letter"], ["open", "book"],
  ["write", "letter"], ["write", "book"],
  ["investigate", "evidence"],
];

// กระดานเริ่มต้นคงที่ (ไม่สุ่ม) เพราะ server กับมือถือต้อง render ออกมาเหมือนกัน ไม่งั้น hydration error
// มีคำยาว (investigate, evidence) ไว้เช็คว่าการ์ดไม่ล้น
export function createMockBattle(): BattleState {
  return {
    verbs: ["eat", "borrow", "repair", "investigate"].map(verb),
    nouns: ["apple", "library", "bicycle", "evidence"].map(noun),
    held: null,
    score: 0,
    correct: 0,
    wrong: 0,
    streak: 0,
    monsterIndex: 0,
    monsterHp: MONSTERS[0].maxHp,
  };
}

// ของจริงจะมาจาก DB (เวลาที่สตาฟฟ์กด Start + 5 นาที)
export function createMockEndsAt() {
  return Date.now() + GAME_DURATION_MS;
}
