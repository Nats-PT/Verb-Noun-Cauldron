import { useDroppable } from "@dnd-kit/react";
import type { ReactNode } from "react";
import type { Word, WordKind } from "@/lib/game/types";
import CardFrame from "./CardFrame";

export const POT_ID = "pot";

type CauldronProps = {
  // คำที่อยู่ในหม้อ รอคำอีกชนิดมาเข้าคู่ — การ์ดจะค้างอยู่ข้างหม้อ (verb ซ้าย, noun ขวา)
  heldWord: Word | null;
  onReturnWord: () => void;
  // หมดเวลาแล้ว — รับการ์ดไม่ได้ แตะหม้อไม่ได้
  locked: boolean;
  // ของที่อยู่เหนือหม้อ (ข้อความผสมคำ + เวลา) — อยู่ใน hit box ด้วย
  children: ReactNode;
};

// การ์ดที่ค้างข้างหม้อ: มีคำถึงจะโผล่ ไม่มีก็ว่างเปล่า (ไม่มีกรอบช่องให้เห็น) แตะเพื่อเอาคืน
function HeldCard({ kind, word, onReturnWord }: { kind: WordKind; word: Word | null; onReturnWord: () => void }) {
  if (!word || word.kind !== kind) return <span aria-hidden />;

  return (
    <button type="button" onClick={onReturnWord} aria-label={`Take ${word.text} back`} className="h-[min(56px,7svh)] w-full">
      <CardFrame kind={kind} className="size-full">
        {word.text}
      </CardFrame>
    </button>
  );
}

// hit box ที่มองไม่เห็น: ทั้งบริเวณตั้งแต่ข้อความถึงหม้อ เต็มความกว้างจอ
// ลากการ์ดมาปล่อยแถวนี้ตรงไหนก็ได้ ให้ความรู้สึกเหมือนโยนคำลงหม้อ ไม่ต้องเล็งช่อง
export default function Cauldron({ heldWord, onReturnWord, locked, children }: CauldronProps) {
  const { ref, isDropTarget } = useDroppable({ id: POT_ID, disabled: locked });

  return (
    <div ref={ref} className="flex shrink-0 flex-col items-center gap-2 py-1">
      {children}

      {/* การ์ดซ้อนทับขอบหม้อเล็กน้อยเหมือนใน wireframe */}
      <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center px-[4%]">
        <div className="relative z-10 -mr-3">
          <HeldCard kind="verb" word={heldWord} onReturnWord={onReturnWord} />
        </div>

        {/* TODO: เปลี่ยนเป็นภาพหม้อจากทีม art (ยังทำไม่เสร็จ) — ตอนนี้เป็นวงกลมตัวแทน */}
        <button
          type="button"
          onClick={onReturnWord}
          disabled={!heldWord || locked}
          aria-label={heldWord ? `Take ${heldWord.text} out of the pot` : "Pot"}
          className={`flex size-[min(96px,11svh)] items-center justify-center rounded-full border-4 bg-surface text-score text-muted transition-transform ${
            heldWord ? "border-ready" : "border-primary"
          } ${isDropTarget ? "scale-110 bg-primary/30" : ""}`}
        >
          Pot
        </button>

        <div className="relative z-10 -ml-3">
          <HeldCard kind="noun" word={heldWord} onReturnWord={onReturnWord} />
        </div>
      </div>
    </div>
  );
}
