import type { Word } from "@/lib/game/types";
import WordCard from "./WordCard";

type WordColumnProps = {
  label: string;
  words: Word[];
};

export default function WordColumn({ label, words }: WordColumnProps) {
  return (
    <section
      aria-label={label}
      className="flex min-h-0 flex-col justify-center gap-2 rounded-xl border-2 border-primary bg-surface p-2"
    >
      {words.map((word) => (
        <WordCard key={word.id} word={word} />
      ))}
    </section>
  );
}
