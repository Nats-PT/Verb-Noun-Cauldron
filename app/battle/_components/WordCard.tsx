import { useDraggable } from "@dnd-kit/react";
import type { Word } from "@/lib/game/types";

type WordCardProps = {
  word: Word;
  // การ์ดใบนี้ถูกลากลงหม้อไปแล้ว — ยังอยู่ในช่องเดิมแต่จางลงและลากซ้ำไม่ได้
  inPot: boolean;
};

// กรอบ pixel art 48×32 ตัดเป็น 9 ส่วนที่ 9px แล้วขยาย ×2 (18px)
// มุมคงลายเดิม ส่วนขอบยืดตามขนาดการ์ด การ์ดจึงปรับตามจอได้ทุกขนาด
// เส้นขอบจริงบางกว่าลาย (6px) คำยาว ๆ จึงเขียนทับลายขอบได้นิดหน่อยแทนที่จะล้นการ์ด
const FRAMES = {
  verb: "/battle/cards/verb.png",
  noun: "/battle/cards/noun.png",
};

export default function WordCard({ word, inPot }: WordCardProps) {
  // data: ส่งข้อมูลคำไปให้ onDragEnd รู้ว่าลากคำอะไรมา
  const { ref, isDragging } = useDraggable({ id: word.id, data: { word }, disabled: inPot });

  return (
    <div
      ref={ref}
      aria-label={`${word.kind} ${word.text}`}
      style={{ borderImage: `url(${FRAMES[word.kind]}) 9 fill / 18px stretch` }}
      className={`flex max-h-[72px] min-h-[52px] flex-1 touch-none items-center justify-center border-[6px] border-solid px-1 text-center text-score leading-tight break-words text-card-text select-none [image-rendering:pixelated] ${
        inPot ? "opacity-40" : "cursor-grab"
      } ${isDragging ? "z-20 scale-110 cursor-grabbing" : ""}`}
    >
      {word.text}
    </div>
  );
}
