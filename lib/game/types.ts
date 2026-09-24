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
  // สีฉากชั่วคราวระหว่างรอภาพจากทีม art
  tint: string;
  // path ใน public/ เช่น "/battle/monsters/slime.png" — ยังไม่มีไฟล์ก็ปล่อยว่าง
  sprite?: string;
  background?: string;
};
