// ทดสอบสูตร damage — รันด้วย `npm test`
import { describe, expect, it } from "vitest";
import { calcDamage } from "./scoring";

// rng คงที่ 0.5 = ไม่มีส่วนสุ่ม ±10%
const noVariance = () => 0.5;
const damage = (streak: number, b1Words: number, weak: boolean) =>
  calcDamage({ streak, b1Words, weak }, noVariance);

describe("สูตร damage", () => {
  it("คู่ A2 ธรรมดา = 30", () => {
    expect(damage(0, 0, false)).toBe(30);
  });

  it("คำ B1 +25% ต่อคำ", () => {
    expect(damage(0, 1, false)).toBe(38); // 37.5 ปัดขึ้น
    expect(damage(0, 2, false)).toBe(45);
  });

  it("โดนจุดอ่อน +50%", () => {
    expect(damage(0, 0, true)).toBe(45);
  });

  it("โบนัสบวกกัน ไม่คูณกัน แล้วค่อยคูณ combo", () => {
    expect(damage(0, 2, true)).toBe(60); // 30 × (1 + 0.5 + 0.5)
    expect(damage(10, 2, true)).toBe(120); // สูงสุด: combo ×2
    expect(damage(50, 2, true)).toBe(120);
  });

  it("ส่วนสุ่มไม่เกิน ±10%", () => {
    expect(calcDamage({ streak: 0, b1Words: 0, weak: false }, () => 0)).toBe(27);
    expect(calcDamage({ streak: 0, b1Words: 0, weak: false }, () => 0.9999)).toBe(33);
  });
});
