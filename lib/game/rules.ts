// ตัวเลขกติกาหลักของเกม — ปรับที่นี่ที่เดียว

export const GAME_DURATION_MS = 5 * 60 * 1000;

// การ์ดที่แสดงบนจอ ฝั่งละกี่ใบ
export const CARDS_PER_KIND = 4;

// มอนสเตอร์ที่มีจุดอ่อนหลายหมวด (Dragon) เปลี่ยนหมวดทุกกี่ ms
export const WEAKNESS_ROTATE_MS = 30_000;

// ตอนเติมการ์ด noun ใบใหม่ มีโอกาสเท่านี้ที่จะสุ่มจากหมวดจุดอ่อนโดยตรง
// ถ้าสุ่มล้วน ครึ่งหนึ่งของเวลาจะไม่มีคำจุดอ่อนบนจอเลย
export const WEAK_REFILL_CHANCE = 0.5;

// ตอนเติมการ์ด: สุ่มมากี่ชุด แล้วเลือกชุดที่ทำให้การ์ดบนจอ "มีคู่" มากที่สุด แต่ไม่เกินกี่ใบ (จาก 8)
// 6 ใบ ≈ มีคู่ถูก ~4 คู่ตลอดเกม เท่ากับกระดานแรก — มากกว่านี้ลากอะไรก็ถูก น้อยกว่านี้ผู้เล่นมองแค่การ์ดใบใหม่
export const REFILL_CANDIDATES = 30;
export const LIVE_CARDS_TARGET = 6;

// เล่นไปแล้วกี่ ms — คิดจาก endsAt ของ server ทุกเครื่องจึงได้ค่าตรงกัน
export function elapsedMs(endsAt: number, now: number) {
  return Math.max(0, GAME_DURATION_MS - (endsAt - now));
}
