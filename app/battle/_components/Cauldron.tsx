import type { Word } from "@/lib/game/types";

type CauldronProps = {
  // คำที่ลากลงหม้อแล้ว รอคำอีกชนิดมาเข้าคู่ (คำจะแสดงที่ ComboLabel เหนือหม้อ)
  heldWord: Word | null;
  onReturnWord: () => void;
};

// TODO ระยะที่ 2: ทำเป็นจุดวาง (droppable) ของ dnd-kit
// TODO: เปลี่ยนเป็นภาพหม้อจากทีม art (ยังทำไม่เสร็จ) — ตอนนี้เป็นวงกลมตัวแทน
export default function Cauldron({ heldWord, onReturnWord }: CauldronProps) {
  return (
    <button
      type="button"
      onClick={onReturnWord}
      disabled={!heldWord}
      aria-label={heldWord ? `Take ${heldWord.text} out of the pot` : "Pot"}
      className={`mx-auto flex size-[min(96px,11svh)] shrink-0 items-center justify-center rounded-full border-4 bg-surface text-score text-muted ${
        heldWord ? "border-ready" : "border-primary"
      }`}
    >
      Pot
    </button>
  );
}
