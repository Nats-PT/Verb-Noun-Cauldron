import { useDraggable } from "@dnd-kit/react";
import type { Word } from "@/lib/game/types";
import CardFrame from "./CardFrame";

type WordCardProps = {
  word: Word;
  // การ์ดใบนี้ค้างอยู่ข้างหม้อ — ยังอยู่ที่เดิมบนกระดานแต่จางลงและลากซ้ำไม่ได้
  inPot: boolean;
};

export default function WordCard({ word, inPot }: WordCardProps) {
  // data: ส่งข้อมูลคำไปให้ onDragEnd รู้ว่าลากคำอะไรมา
  const { ref, isDragging } = useDraggable({ id: word.id, data: { word }, disabled: inPot });

  return (
    <CardFrame
      ref={ref}
      kind={word.kind}
      aria-label={`${word.kind} ${word.text}`}
      className={`max-h-[72px] min-h-[52px] flex-1 touch-none ${inPot ? "opacity-40" : "cursor-grab"} ${
        isDragging ? "z-20 scale-110 cursor-grabbing" : ""
      }`}
    >
      {word.text}
    </CardFrame>
  );
}
