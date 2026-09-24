import { useDroppable } from "@dnd-kit/react";
import type { Word } from "@/lib/game/types";

export const POT_ID = "pot";

type CauldronProps = {
  // คำที่ลากลงหม้อแล้ว รอคำอีกชนิดมาเข้าคู่ (คำจะแสดงที่ ComboLabel เหนือหม้อ)
  heldWord: Word | null;
  onReturnWord: () => void;
};

// TODO: เปลี่ยนเป็นภาพหม้อจากทีม art (ยังทำไม่เสร็จ) — ตอนนี้เป็นวงกลมตัวแทน
export default function Cauldron({ heldWord, onReturnWord }: CauldronProps) {
  const { ref, isDropTarget } = useDroppable({ id: POT_ID });

  return (
    <button
      ref={ref}
      type="button"
      onClick={onReturnWord}
      disabled={!heldWord}
      aria-label={heldWord ? `Take ${heldWord.text} out of the pot` : "Pot"}
      className={`mx-auto flex size-[min(96px,11svh)] shrink-0 items-center justify-center rounded-full border-4 bg-surface text-score text-muted transition-transform ${
        heldWord ? "border-ready" : "border-primary"
      } ${isDropTarget ? "scale-110 bg-primary/30" : ""}`}
    >
      Pot
    </button>
  );
}
