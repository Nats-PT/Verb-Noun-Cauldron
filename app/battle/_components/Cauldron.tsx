import type { Word } from "@/lib/game/types";

type CauldronProps = {
  // คำที่ลากลงหม้อแล้ว รอคำอีกชนิดมาเข้าคู่
  heldWord: Word | null;
  onReturnWord: () => void;
};

// TODO ระยะที่ 2: ทำเป็นจุดวาง (droppable) ของ dnd-kit
export default function Cauldron({ heldWord, onReturnWord }: CauldronProps) {
  return (
    <button
      type="button"
      onClick={onReturnWord}
      disabled={!heldWord}
      aria-label={heldWord ? `Take ${heldWord.text} out of the pot` : "Pot"}
      className="relative mx-auto flex h-24 w-36 shrink-0 flex-col items-center"
    >
      {/* TODO: เปลี่ยนเป็นภาพหม้อจากทีม art */}
      <span className="h-5 w-32 rounded-[50%] border-2 border-card-text bg-ready" aria-hidden />
      <span className="-mt-2 h-16 w-36 rounded-b-full border-2 border-t-0 border-card-text bg-surface" aria-hidden />

      {heldWord && (
        <span
          className={`absolute top-6 rounded px-2 text-score text-card-text ${
            heldWord.kind === "verb" ? "bg-verb" : "bg-noun"
          }`}
        >
          {heldWord.text}
        </span>
      )}
    </button>
  );
}
