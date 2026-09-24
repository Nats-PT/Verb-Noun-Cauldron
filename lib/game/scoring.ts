// ตัวเลขทั้งหมดที่เกี่ยวกับ damage / score — ปรับสมดุลเกมที่ไฟล์นี้ที่เดียว
//
// ตอนนี้เป็นสูตรชั่วคราว: ฐาน × combo ± สุ่ม
// TODO ระยะที่ 2 (คลังคำจริง): ฐานตามระดับคำ A2/B1 และ ×จุดอ่อนมอนสเตอร์ตามหมวดของ noun

export const BASE_DAMAGE = 30;

// ตอบถูกติดกันได้ +10% ต่อครั้ง สูงสุด ×2
export const COMBO_STEP = 0.1;
export const COMBO_MAX = 2;

// สุ่ม ±10% ตัวเลขจะได้ไม่ซ้ำแม้ใช้คู่เดิม
export const DAMAGE_VARIANCE = 0.1;

// โบนัสเมื่อล้มมอนสเตอร์ได้หนึ่งตัว
export const KILL_BONUS = 100;

// rng รับเข้ามาแทนการเรียก Math.random ตรง ๆ จะได้ทดสอบได้ว่าผลออกมาตามคาด
export function calcDamage(streak: number, rng: () => number) {
  const combo = Math.min(1 + streak * COMBO_STEP, COMBO_MAX);
  const variance = 1 + (rng() * 2 - 1) * DAMAGE_VARIANCE;
  return Math.round(BASE_DAMAGE * combo * variance);
}
