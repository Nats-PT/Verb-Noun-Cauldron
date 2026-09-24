import type { ComponentProps } from "react";
import type { WordKind } from "@/lib/game/types";

// กรอบ pixel art 48×32 ตัดเป็น 9 ส่วนที่ 9px แล้วขยาย ×2 (18px)
// มุมคงลายเดิม ส่วนขอบยืดตามขนาดการ์ด การ์ดจึงปรับตามจอได้ทุกขนาด
// เส้นขอบจริงบางกว่าลาย (6px) คำยาว ๆ จึงเขียนทับลายขอบได้นิดหน่อยแทนที่จะล้นการ์ด
const FRAMES: Record<WordKind, string> = {
  verb: "/battle/cards/verb.png",
  noun: "/battle/cards/noun.png",
};

type CardFrameProps = ComponentProps<"div"> & {
  kind: WordKind;
};

// หน้าตาการ์ดอย่างเดียว ใช้ทั้งการ์ดบนกระดาน (ลากได้) และการ์ดที่ค้างอยู่ข้างหม้อ
export default function CardFrame({ kind, className = "", style, ...props }: CardFrameProps) {
  return (
    <div
      {...props}
      style={{ ...style, borderImage: `url(${FRAMES[kind]}) 9 fill / 18px stretch` }}
      className={`flex items-center justify-center border-[6px] border-solid px-1 text-center text-score leading-tight break-words text-card-text select-none [image-rendering:pixelated] ${className}`}
    />
  );
}
