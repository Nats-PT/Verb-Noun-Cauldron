import type { Word } from "@/lib/game/types";

export type ComboFlash =
  | { kind: "hit"; verb: string; noun: string; damage: number }
  | { kind: "miss"; verb: string; noun: string };

type ComboLabelProps = {
  heldWord: Word | null;
  // ผลของการผสมล่าสุด โชว์แป๊บเดียวแล้วหายไป
  flash: ComboFlash | null;
};

// ข้อความเหนือหม้อ บอกว่ากำลังผสมคำอะไรอยู่ เช่น "eat + ?" หรือ "? + apple"
export default function ComboLabel({ heldWord, flash }: ComboLabelProps) {
  if (flash?.kind === "hit") {
    return (
      // ตัวเลขขึ้นก่อน ถ้าคำยาวจนโดนตัดเป็น … จะได้ตัดที่คำ ไม่ใช่ตัวเลข damage
      <p aria-live="polite" className="truncate text-body text-ready">
        -{flash.damage} {flash.verb} {flash.noun}
      </p>
    );
  }

  if (flash?.kind === "miss") {
    return (
      <p aria-live="polite" className="truncate text-body text-danger">
        {flash.verb} + {flash.noun}
      </p>
    );
  }

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
