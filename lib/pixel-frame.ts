import type { CSSProperties } from "react";

// กรอบ pixel art แบบ 9-slice: ตัดภาพที่ `slice` px จากขอบ มุมคงลายเดิม ขอบและตรงกลางยืดตามกล่อง
// กล่องจึงขนาดเท่าไรก็ได้ แต่ลายขอบยังคม (เหมือน CardFrame ของ battle)
//
// scale = ขยายลายขอบกี่เท่า (art วาดขนาดเท่า Figma → มือถือใช้ 1)
// borderWidth = ความหนาขอบที่ใช้จัด layout — ตั้งบางกว่าลายได้ ลายจะวาดทับ padding แทน
//   ใช้ตอนเปลี่ยนกรอบ CSS เดิมเป็นภาพ แล้วไม่อยากให้ของข้างในขยับ
//
// ต้องใส่ class `[image-rendering:pixelated]` คู่กันด้วย ลายจะได้ไม่เบลอตอนขยาย
export function pixelFrame(
  src: string,
  { slice = 4, scale = 1, borderWidth }: { slice?: number; scale?: number; borderWidth?: number } = {},
): CSSProperties {
  const width = slice * scale;
  return {
    borderStyle: "solid",
    borderWidth: borderWidth ?? width,
    borderImage: `url(${src}) ${slice} fill / ${width}px stretch`,
  };
}
