// ทดสอบตัวช่วยเรื่องเวลา — รันด้วย `npm test`
import { describe, expect, it } from "vitest";
import { elapsedMs, GAME_DURATION_MS, isTimeUp } from "./rules";

describe("เวลาเกม", () => {
  const endsAt = 1_000_000;

  it("หมดเวลา: ก่อน endsAt ยังเล่นได้ ตรงเวลาพอดีหรือหลังจากนั้นถือว่าหมด", () => {
    expect(isTimeUp(endsAt, endsAt - 1)).toBe(false);
    expect(isTimeUp(endsAt, endsAt)).toBe(true);
    expect(isTimeUp(endsAt, endsAt + 5000)).toBe(true);
  });

  it("เวลาที่เล่นไปแล้ว: เริ่มที่ 0 จบที่ความยาวเกม", () => {
    expect(elapsedMs(endsAt, endsAt - GAME_DURATION_MS)).toBe(0);
    expect(elapsedMs(endsAt, endsAt)).toBe(GAME_DURATION_MS);
  });
});
