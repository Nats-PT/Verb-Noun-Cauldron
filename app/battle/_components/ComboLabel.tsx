import type { Word } from "@/lib/game/types";

export type ComboFlash =
  | { kind: "hit"; verb: string; noun: string; damage: number }
  | { kind: "miss"; verb: string; noun: string };

type ComboLabelProps = {
  heldWord: Word | null;
  // ผลของการผสมล่าสุด โชว์แป๊บเดียวแล้วกลับเป็น "...?"
  flash: ComboFlash | null;
};

const Plus = () => <span className="text-muted"> + </span>;

// ข้อความเหนือหม้อ เปลี่ยนตามคำที่โยนลงไป:
// "...?" → "drive + ..." → "drive + car" (เขียว = ถูก / แดง = ผิด)
export default function ComboLabel({ heldWord, flash }: ComboLabelProps) {
  if (flash) {
    const hit = flash.kind === "hit";
    return (
      <p aria-live="polite" className={`truncate text-body ${hit ? "text-ready" : "text-danger"}`}>
        {/* ตัวเลขขึ้นก่อน ถ้าคำยาวจนโดนตัดเป็น … จะได้ตัดที่คำ ไม่ใช่ damage */}
        {hit && <span className="text-score">-{flash.damage} </span>}
        {flash.verb}
        <Plus />
        {flash.noun}
      </p>
    );
  }

  if (!heldWord) {
    return <p className="truncate text-body text-muted">...?</p>;
  }

  return (
    <p aria-live="polite" className="truncate text-body">
      {heldWord.kind === "verb" ? (
        <>
          <span className="text-verb">{heldWord.text}</span>
          <Plus />
          <span className="text-muted">...</span>
        </>
      ) : (
        <>
          <span className="text-muted">...</span>
          <Plus />
          <span className="text-noun">{heldWord.text}</span>
        </>
      )}
    </p>
  );
}
