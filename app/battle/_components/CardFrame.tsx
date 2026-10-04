import type { ComponentProps } from "react";
import type { WordKind } from "@/lib/game/types";

// การ์ด pixel art 84×54 ตัดเป็น 9 ส่วนที่ 4px (ขอบเทา + มุมเว้า) แล้วขยายขอบ ×2 (8px)
// มุมคงลายเดิม ส่วนขอบและตรงกลางยืดตามขนาดการ์ด การ์ดจึงปรับตามจอได้ทุกขนาด
// (ลายวงเวทตรงกลางจะยืดตามช่องด้วย แต่จางมากบนพื้นมืด)
const FRAMES: Record<WordKind, string> = {
  verb: "/battle/cards/card-verb.png",
  noun: "/battle/cards/card-noun.png",
};

type CardFrameProps = ComponentProps<"div"> & {
  kind: WordKind;
};

// หน้าตาการ์ดอย่างเดียว ใช้ทั้งการ์ดบนกระดาน (ลากได้) และการ์ดที่ค้างอยู่ข้างหม้อ
// ตัวหนังสือขาวทั้ง verb/noun ตาม design — แยกชนิดได้จากคอลัมน์ซ้าย/ขวาและลายบนการ์ด
export default function CardFrame({ kind, className = "", style, ...props }: CardFrameProps) {
  return (
    <div
      {...props}
      style={{ ...style, borderImage: `url(${FRAMES[kind]}) 4 fill / 8px stretch` }}
      className={`flex items-center justify-center border-[6px] border-solid px-1 text-center text-score leading-tight break-words select-none [image-rendering:pixelated] text-foreground ${className}`}
    />
  );
}
