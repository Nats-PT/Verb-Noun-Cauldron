// สถานะเริ่มเกมชั่วคราวระหว่างรอ DB — ของจริงจะมาจาก server ตอนสตาฟฟ์กด Start
import { MONSTERS, monsterMaxHp } from "./monsters";
import { GAME_DURATION_MS } from "./rules";
import type { BattleState } from "./types";
import { findWord } from "./words";

// กระดานเริ่มต้นคงที่ (ไม่สุ่ม) เพราะ server กับมือถือต้อง render ออกมาเหมือนกัน ไม่งั้น hydration error
// มีคำยาว (newspaper) ไว้เช็คว่าการ์ดไม่ล้น และมีคู่ถูกครบทั้ง 4 คู่
// teamSize ค่าเริ่มต้น 1 = ลองเล่นคนเดียว HP มอนสเตอร์จะน้อย ล้มได้ไว
export function createMockBattle(teamSize = 1): BattleState {
  return {
    teamSize,
    verbs: ["eat", "read", "wear", "feed"].map((t) => findWord("verb", t)),
    nouns: ["apple", "newspaper", "jacket", "rabbit"].map((t) => findWord("noun", t)),
    held: null,
    score: 0,
    correct: 0,
    wrong: 0,
    streak: 0,
    monsterIndex: 0,
    monsterHp: monsterMaxHp(MONSTERS[0], teamSize),
  };
}

// ของจริงจะมาจาก DB (เวลาที่สตาฟฟ์กด Start + 5 นาที)
export function createMockEndsAt() {
  return Date.now() + GAME_DURATION_MS;
}
