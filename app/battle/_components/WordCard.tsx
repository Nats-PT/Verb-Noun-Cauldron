import { useDraggable, useDroppable } from "@dnd-kit/react";
import { useCallback } from "react";
import type { Word } from "@/lib/game/types";
import CardFrame from "./CardFrame";

type WordCardProps = {
  word: Word;
  // การ์ดใบนี้ค้างอยู่ข้างหม้อ — ยังอยู่ที่เดิมบนกระดานแต่จางลงและลากซ้ำไม่ได้
  inPot: boolean;
  // หมดเวลาแล้ว — ลากไม่ได้ วางทับไม่ได้ จางลง
  locked: boolean;
};

// การ์ดเป็นทั้งของที่ลากได้และที่วางได้ — ลากไปวางทับอีกใบในคอลัมน์เดียวกันเพื่อสลับที่
export default function WordCard({ word, inPot, locked }: WordCardProps) {
  // data: ส่งข้อมูลคำไปให้ onDragEnd รู้ว่าลากคำอะไรมา / วางทับคำอะไร
  // type: ชนิดคำ ใช้คู่กับ accept ด้านล่าง
  const drag = useDraggable({ id: word.id, type: word.kind, data: { word }, disabled: inPot || locked });
  // ไม่ไฮไลต์ใบปลายทาง: ลากลงหม้อผ่านการ์ดใบอื่นแล้วมันจะกระพริบทีละใบ
  // และยังไงก็โดนการ์ดที่ลากทับ (dnd-kit ยกการ์ดที่ลากขึ้น top layer ด้วย popover — z-index ไม่ช่วย)
  const drop = useDroppable({
    id: `slot-${word.id}`,
    data: { word },
    disabled: locked,
    // รับเฉพาะคำชนิดเดียวกันที่ไม่ใช่ตัวเอง — การ์ดที่กำลังลากขยับตามนิ้ว ถ้าไม่กันจะชนกับตัวเองตลอด
    accept: (source) => source.type === word.kind && source.id !== word.id,
  });

  // element เดียวกันต้องส่งให้ทั้ง 2 hook
  const { ref: dragRef } = drag;
  const { ref: dropRef } = drop;
  const ref = useCallback(
    (element: HTMLDivElement | null) => {
      dragRef(element);
      dropRef(element);
    },
    [dragRef, dropRef],
  );

  return (
    <CardFrame
      ref={ref}
      kind={word.kind}
      aria-label={`${word.kind} ${word.text}`}
      // WordColumn ใช้หาการ์ดใบนี้ตอนทำอนิเมชันเลื่อนหลังสลับที่
      data-word-id={word.id}
      className={`max-h-[72px] min-h-[52px] flex-1 touch-none ${inPot || locked ? "opacity-40" : "cursor-grab"} ${
        drag.isDragging ? "z-20 scale-110 cursor-grabbing" : ""
      }`}
    >
      {word.text}
    </CardFrame>
  );
}
