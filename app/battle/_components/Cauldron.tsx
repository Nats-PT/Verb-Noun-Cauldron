import { useDroppable } from "@dnd-kit/react";
import Image from "next/image";
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
  // ของที่อยู่เหนือหม้อ (ข้อความผสมคำ) — อยู่ใน hit box ด้วย
  children: ReactNode;
};

// คอลัมน์การ์ดทับส่วนล่างของหม้อ 24px (หม้อสูง 103px) — ทับน้อยกว่าใน design
// คอลัมน์จะได้อยู่ที่เดิมหลังย้ายข้อความผสมคำขึ้นไปใต้ฉาก อ่านง่าย ไม่เบียด
// ใช้ค่าเดียวกันทั้ง margin ติดลบ และขอบล่างของ hit box — ถ้าแก้ต้องแก้คู่กัน
// -mb-[32px] = จม 24px + ชดเชย gap-2 (8px) ของ main
const SINK_MARGIN = "-mb-[32px]";
const HITBOX_BOTTOM = "bottom-[24px]";

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

// hit box ที่มองไม่เห็น: ตั้งแต่ข้อความถึงครึ่งบนของหม้อ เต็มความกว้างจอ
// ลากการ์ดมาปล่อยแถวนี้ตรงไหนก็ได้ ให้ความรู้สึกเหมือนโยนคำลงหม้อ ไม่ต้องเล็งช่อง
// ไม่ลงไปถึงครึ่งล่างที่คอลัมน์ทับอยู่ — ไม่งั้นลากการ์ดใบบนสุดไปสลับที่ อาจตกลงหม้อแทน
export default function Cauldron({ heldWord, onReturnWord, locked, children }: CauldronProps) {
  const { ref, isDropTarget } = useDroppable({ id: POT_ID, disabled: locked });

  return (
    <div className={`relative flex shrink-0 flex-col items-center gap-1 ${SINK_MARGIN}`}>
      <div ref={ref} data-pot-hitbox aria-hidden className={`pointer-events-none absolute inset-x-0 top-0 ${HITBOX_BOTTOM}`} />

      {children}

      {/* การ์ดที่ค้างอยู่ข้างหม้อระดับปากหม้อ (items-start) ทับขอบบนของคอลัมน์นิดหน่อย
          z-20 ให้อยู่เหนือคอลัมน์ (z-10) ส่วนหม้อไม่มี z จึงอยู่ใต้คอลัมน์ */}
      <div className="grid w-full grid-cols-[1fr_auto_1fr] items-start px-[4%]">
        <div className="relative z-20 -mr-3">
          <HeldCard kind="verb" word={heldWord} onReturnWord={onReturnWord} />
        </div>

        {/* ปุ่ม 115×103 = ขนาดหม้อ ×1 ใช้จัดหน้า (ขนาดนี้ห้ามเปลี่ยน ไม่งั้น layout ขยับ)
            ภาพหม้อ 128×160 แสดง ×1.5 (192×240, ตัวหม้อจริง ~172×155) ปากหม้ออยู่ขอบบนปุ่มเท่าเดิม
            ส่วนที่ใหญ่ขึ้นล้นลงไปข้างหลังคอลัมน์ (คอลัมน์โปร่งแสง เลยมองทะลุเห็น) — ภาพคลิกทะลุได้
            ตำแหน่ง: ตัวหม้อในภาพ ×1.5 อยู่ที่ x 10.5–183, y 76.5 → เลื่อนให้กึ่งกลางตรงกับปุ่ม */}
        <button
          type="button"
          onClick={onReturnWord}
          disabled={!heldWord || locked}
          aria-label={heldWord ? `Take ${heldWord.text} out of the pot` : "Pot"}
          // test:drag ใช้หาหม้อ
          data-pot
          className={`relative h-[103px] w-[115px] transition-transform ${isDropTarget ? "scale-110" : ""}`}
        >
          <Image
            src="/battle/cauldron.png"
            alt=""
            width={192}
            height={240}
            unoptimized
            // ภาพใหญ่สุดที่เห็นตอนเปิดหน้า (LCP) — Next.js แนะนำให้โหลดทันที
            loading="eager"
            className={`pointer-events-none absolute top-[-76px] left-[-39px] max-w-none [image-rendering:pixelated] ${
              // มีคำค้างอยู่ในหม้อ → เรืองแสงสีเขียว (แทนขอบเขียวของวงกลมเดิม)
              heldWord ? "drop-shadow-[0_0_6px_var(--color-ready)]" : ""
            }`}
          />
        </button>

        <div className="relative z-20 -ml-3">
          <HeldCard kind="noun" word={heldWord} onReturnWord={onReturnWord} />
        </div>
      </div>
    </div>
  );
}
