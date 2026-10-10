// ตัวเลขทั้งหมดที่เกี่ยวกับ damage / score — ปรับสมดุลเกมที่ไฟล์นี้ที่เดียว
//
// damage = ฐาน × combo × (1 + โบนัส B1 + โบนัสจุดอ่อน) ± สุ่ม
// combo คูณ ส่วนโบนัสอื่นบวกกัน — ถ้าคูณหมดจะแรงได้ถึง ×6 มอนสเตอร์ตายไวเกิน (แบบนี้สูงสุด ×4)

export const BASE_DAMAGE = 30;

// ตอบถูกติดกันได้ +10% ต่อครั้ง สูงสุด ×2
export const COMBO_STEP = 0.1;
export const COMBO_MAX = 2;

// คำระดับ B1 ในคู่ ได้ +25% ต่อคำ (คู่ที่เป็น B1 ทั้ง 2 คำได้ +50%)
export const B1_BONUS = 0.25;

// noun อยู่ในหมวดจุดอ่อนของมอนสเตอร์ +50%
export const WEAK_BONUS = 0.5;

// สุ่ม ±10% ตัวเลขจะได้ไม่ซ้ำแม้ใช้คู่เดิม
export const DAMAGE_VARIANCE = 0.1;

// โบนัสเมื่อล้มมอนสเตอร์ได้หนึ่งตัว
export const KILL_BONUS = 100;

// คะแนนรายคน (MVP บนจอ master + ป้าย TIME'S UP) — คนตีหมัดที่ล้มได้แค่ส่วนน้อยของโบนัสทีม
// จังหวะปิดเป็นเรื่องดวง หมัดเดียวไม่ควรพลิกอันดับ MVP ได้ (ตีหนึ่งครั้ง ~27–130)
export const MVP_KILL_BONUS = 25;

export function personalPoints(damage: number, kills: number) {
  return damage + kills * MVP_KILL_BONUS;
}

export type DamageInput = {
  streak: number;
  // จำนวนคำ B1 ในคู่ (0–2)
  b1Words: number;
  weak: boolean;
};

// rng รับเข้ามาแทนการเรียก Math.random ตรง ๆ จะได้ทดสอบได้ว่าผลออกมาตามคาด
export function calcDamage({ streak, b1Words, weak }: DamageInput, rng: () => number) {
  const combo = Math.min(1 + streak * COMBO_STEP, COMBO_MAX);
  const bonus = 1 + b1Words * B1_BONUS + (weak ? WEAK_BONUS : 0);
  const variance = 1 + (rng() * 2 - 1) * DAMAGE_VARIANCE;
  return Math.round(BASE_DAMAGE * combo * bonus * variance);
}
