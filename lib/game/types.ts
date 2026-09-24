export type WordKind = "verb" | "noun";

export type Word = {
  id: string;
  text: string;
  kind: WordKind;
};

// คู่คำที่ถูก เก็บเป็นข้อความ [verb, noun] เช่น ["eat", "apple"]
export type WordPair = [verb: string, noun: string];

export type Monster = {
  id: string;
  name: string;
  maxHp: number;
  // ตัวสุดท้ายตีไม่ตาย แต่ damage ยังนับเป็น score ต่อไปจนหมดเวลา
  endless: boolean;
  // path ใน public/
  sprite: string;
  background: string;
  // ขนาดภาพต้นฉบับ (px) และขยายกี่เท่า — ต้องเป็นจำนวนเต็ม pixel art จะได้คม
  spriteSize: number;
  spriteScale: number;
};

export type BattleState = {
  verbs: Word[];
  nouns: Word[];
  // คำที่ค้างอยู่ในหม้อ รอคำอีกชนิดมาเข้าคู่ (การ์ดยังอยู่ในช่องเดิม แค่จางลง)
  held: Word | null;
  score: number;
  correct: number;
  wrong: number;
  // ตอบถูกติดกันกี่ครั้ง — ตอบผิดเริ่มนับใหม่
  streak: number;
  monsterIndex: number;
  monsterHp: number;
};
