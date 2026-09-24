// ข้อมูลปลอมไว้วาง layout หน้า battle — ระยะที่ 2 จะแทนด้วยคลังคำจริง + state ของเกม
import { GAME_DURATION_MS } from "./rules";
import type { Word } from "./types";

export const mockBattle = {
  score: 1240,
  correct: 10,
  wrong: 2,
  monsterIndex: 0,
  monsterHp: 540,
};

// มีคำยาว (investigate, evidence) ไว้เช็คว่าการ์ดไม่ล้น
export const mockVerbs: Word[] = [
  { id: "v1", text: "eat", kind: "verb" },
  { id: "v2", text: "borrow", kind: "verb" },
  { id: "v3", text: "repair", kind: "verb" },
  { id: "v4", text: "investigate", kind: "verb" },
];

export const mockNouns: Word[] = [
  { id: "n1", text: "apple", kind: "noun" },
  { id: "n2", text: "library", kind: "noun" },
  { id: "n3", text: "bicycle", kind: "noun" },
  { id: "n4", text: "evidence", kind: "noun" },
];

// ของจริงจะมาจาก DB (เวลาที่สตาฟฟ์กด Start + 5 นาที)
export function createMockEndsAt() {
  return Date.now() + GAME_DURATION_MS;
}
