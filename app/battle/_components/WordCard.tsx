import type { Word } from "@/lib/game/types";

type WordCardProps = {
  word: Word;
};

// TODO ระยะที่ 2: ทำให้ลากได้ (draggable) ของ dnd-kit
export default function WordCard({ word }: WordCardProps) {
  const colors =
    word.kind === "verb" ? "bg-verb border-verb-border" : "bg-noun border-noun-border";

  return (
    <div
      className={`flex min-h-12 flex-1 items-center justify-center rounded-lg border-4 px-1 text-center text-score leading-tight break-words text-card-text ${colors}`}
    >
      {word.text}
    </div>
  );
}
