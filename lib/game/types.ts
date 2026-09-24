export type WordKind = "verb" | "noun";

export type Word = {
  id: string;
  text: string;
  kind: WordKind;
};

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
