// ตรวจกติกาของคลังคำ — รันทุกครั้งหลังแก้ words.ts (`npm test`)
// ถ้าคนตรวจภาษาเผลอลบคู่จนบางคำเหลือคู่น้อยไป หรือพิมพ์ชื่อคำผิด ชุดนี้จะ FAIL ทันที
import { describe, expect, it } from "vitest";
import { isValidPair } from "./engine";
import { createMockBattle } from "./mock-battle";
import type { Word } from "./types";
import { WORD_PAIRS, WORD_POOL } from "./words";

const verbs = WORD_POOL.filter((w) => w.kind === "verb");
const nouns = WORD_POOL.filter((w) => w.kind === "noun");
const partners = (w: Word) =>
  WORD_PAIRS.filter(([v, n]) => (w.kind === "verb" ? v : n) === w.text).length;

describe("คลังคำ", () => {
  it("ขนาด: 40 verb, 60 noun, 250–300 คู่", () => {
    expect(verbs).toHaveLength(40);
    expect(nouns).toHaveLength(60);
    expect(WORD_PAIRS.length).toBeGreaterThanOrEqual(250);
    expect(WORD_PAIRS.length).toBeLessThanOrEqual(300);
  });

  it("ไม่มีคู่ซ้ำ", () => {
    const keys = WORD_PAIRS.map(([v, n]) => `${v}|${n}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("ทุกคู่ใช้คำที่มีอยู่ในคลังจริง (กันพิมพ์ผิด)", () => {
    const unknown = WORD_PAIRS.filter(
      ([v, n]) => !verbs.some((w) => w.text === v) || !nouns.some((w) => w.text === n),
    );
    expect(unknown).toEqual([]);
  });

  it("ทุกคำเข้าคู่ได้อย่างน้อย 3 คำ", () => {
    const weak = WORD_POOL.filter((w) => partners(w) < 3).map((w) => `${w.text} (${partners(w)})`);
    expect(weak).toEqual([]);
  });

  it("คำยาวไม่เกิน 12 ตัวอักษร (ไม่ล้นการ์ด)", () => {
    expect(WORD_POOL.filter((w) => w.text.length > 12).map((w) => w.text)).toEqual([]);
  });

  it("ไม่มีคำที่เป็นทั้ง verb และ noun (การ์ด 2 สีที่เขียนเหมือนกันจะงง)", () => {
    const texts = WORD_POOL.map((w) => w.text);
    expect(new Set(texts).size).toBe(texts.length);
  });

  it("noun ทุกคำมีหมวด", () => {
    expect(nouns.filter((w) => !w.category).map((w) => w.text)).toEqual([]);
  });

  it("กระดานเริ่มต้น: verb ทุกใบมีคู่บนจอ", () => {
    const { verbs: v, nouns: n } = createMockBattle();
    expect(v.every((a) => n.some((b) => isValidPair(a, b, WORD_PAIRS)))).toBe(true);
  });
});
