import type { Word } from "@/lib/game/types";

type ComboLabelProps = {
  heldWord: Word | null;
};

// ข้อความเหนือหม้อ บอกว่ากำลังผสมคำอะไรอยู่ เช่น "eat + ?" หรือ "? + apple"
export default function ComboLabel({ heldWord }: ComboLabelProps) {
  if (!heldWord) {
    return <p className="truncate text-body text-muted">verb + noun</p>;
  }

  const verb = heldWord.kind === "verb" ? heldWord.text : "?";
  const noun = heldWord.kind === "noun" ? heldWord.text : "?";

  return (
    <p aria-live="polite" className="truncate text-body">
      <span className={verb === "?" ? "text-muted" : "text-verb"}>{verb}</span>
      <span className="text-muted"> + </span>
      <span className={noun === "?" ? "text-muted" : "text-noun"}>{noun}</span>
    </p>
  );
}
