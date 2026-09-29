export type WordKind = "verb" | "noun";

export type CefrLevel = "A2" | "B1";

// หมวดของ noun — ใช้เป็นจุดอ่อนมอนสเตอร์ (มอนสเตอร์แต่ละตัวแพ้ทางหมวดหนึ่ง)
export type NounCategory = "food" | "home" | "clothes" | "travel" | "school" | "nature";

export type Word = {
  id: string;
  text: string;
  kind: WordKind;
  level: CefrLevel;
  category?: NounCategory; // มีเฉพาะ noun
};

// คู่คำที่ถูก เก็บเป็นข้อความ [verb, noun] เช่น ["eat", "apple"]
export type WordPair = [verb: string, noun: string];

export type Monster = {
  id: string;
  name: string;
  // HP จริง = hpPerPlayer × จำนวนคนในทีม ทีมที่คนไม่เท่ากันจะได้ใช้เวลาตีพอ ๆ กัน
  hpPerPlayer: number;
  // ตัวสุดท้ายตีไม่ตาย แต่ damage ยังนับเป็น score ต่อไปจนหมดเวลา
  endless: boolean;
  // ใช้ noun หมวดนี้ตีแรงขึ้น — ปกติมีหมวดเดียว ถ้ามีหลายหมวดจะวนเปลี่ยนทุก WEAKNESS_ROTATE_MS
  weakTo: NounCategory[];
  // ภาพฉาก + มอนสเตอร์ในภาพเดียว (120×90, path ใน public/)
  // scene = ยืนเฉย ๆ (GIF ขยับ 2 เฟรม), hitScene = ตัวแดงตอนรับ damage
  scene: string;
  hitScene: string;
};

export type BattleState = {
  // จำนวนคนในทีม ล็อกตอนสตาฟฟ์กด Start — คนหลุดกลางเกม HP ก็ไม่ลด
  teamSize: number;
  verbs: Word[];
  nouns: Word[];
  // คำที่ค้างอยู่ในช่องข้างหม้อ รอคำอีกชนิดมาเข้าคู่ (การ์ดในกระดานยังอยู่ที่เดิม แค่จางลง)
  held: Word | null;
  score: number;
  correct: number;
  wrong: number;
  // ตอบถูกติดกันกี่ครั้ง — ตอบผิดเริ่มนับใหม่
  streak: number;
  monsterIndex: number;
  monsterHp: number;
};
