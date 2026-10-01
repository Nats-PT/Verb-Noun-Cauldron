import { useDroppable } from "@dnd-kit/react";
import Image from "next/image";
import type { ReactNode } from "react";
import type { Word, WordKind } from "@/lib/game/types";
import CardFrame from "./CardFrame";

export const POT_ID = "pot";

// การ์ดที่ใช้ตีโดน "ถูกดูดลงหม้อ" 2 จังหวะ:
// 1) วางลง (LAND): ใบที่ลากมาหดจากขนาดตอนลาก (110%) กลับเป็นขนาดปกติ — ใบที่ค้างข้างหม้อรออยู่เฉย ๆ
// 2) ดูด: ทั้งสองใบเลื่อนเข้าปากหม้อ + หด + จางหาย พร้อมกัน ขนาดเท่ากันตั้งแต่เริ่ม
const SINK_MS = 380;
const LAND = 0.25; // สัดส่วนเวลาของจังหวะวางลง

// React ถอดการ์ดที่ใช้แล้วออกทันที (มีใบใหม่มาแทน) จึงถ่ายสำเนาหน้าตาการ์ด ณ จุดที่ปล่อยไว้
// แล้วเล่นอนิเมชันสำเนาแยกต่างหาก — สำเนาลอยอยู่นอกคอลัมน์ คอลัมน์จึงไม่ขยับ
// ต้องเรียกตอนปล่อย (onDragEnd) ก่อน React re-render ขณะที่การ์ดยังอยู่ตรงตำแหน่งที่ปล่อย
export function sinkIntoPot(card: Element | undefined) {
  const pot = document.querySelector("[data-pot]");
  if (!(card instanceof HTMLElement) || !pot) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const rect = card.getBoundingClientRect();
  // สำเนาใช้ขนาดปกติของการ์ด (offsetWidth/Height ไม่นับ scale ตอนลาก) วางกึ่งกลางเดิม
  const width = card.offsetWidth;
  const height = card.offsetHeight;
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  // ขนาดที่เห็นอยู่ตอนนี้เทียบกับปกติ: ใบที่ลาก ≈ 1.1, ใบที่ค้างข้างหม้อ = 1
  const startScale = width ? rect.width / width : 1;

  const potBox = pot.getBoundingClientRect();
  // จุดหมาย = ปากหม้อ (กลางแนวนอน, ค่อนไปทางขอบบน)
  const dx = potBox.left + potBox.width / 2 - centerX;
  const dy = potBox.top + potBox.height * 0.2 - centerY;

  const ghost = card.cloneNode(true) as HTMLElement;
  // เอาสิ่งที่ทำให้สำเนาถูกมองเป็นการ์ดจริงออก (dnd-kit / test / screen reader)
  for (const attr of [...ghost.attributes]) {
    if (attr.name === "popover" || attr.name === "id" || attr.name.startsWith("data-") || attr.name.startsWith("aria-")) {
      ghost.removeAttribute(attr.name);
    }
  }
  ghost.setAttribute("aria-hidden", "true");
  Object.assign(ghost.style, {
    position: "fixed",
    left: `${centerX - width / 2}px`,
    top: `${centerY - height / 2}px`,
    width: `${width}px`,
    height: `${height}px`,
    margin: "0",
    // ล้าง scale/translate ที่ติดมากับ class ตอนลาก — ขนาดตั้งต้นคุมด้วย startScale ใน keyframes แทน
    translate: "none",
    scale: "1",
    transform: "none",
    zIndex: "50",
    pointerEvents: "none",
  });
  document.body.appendChild(ghost);

  ghost
    .animate(
      [
        // วางลง: ชะลอตอนท้าย เหมือนการ์ดแตะลงบนหม้อ
        { offset: 0, transform: `translate(0, 0) scale(${startScale})`, opacity: 1, easing: "ease-out" },
        // ดูด: ช้าตอนต้น เร่งตอนท้าย เหมือนถูกดูดลงไป
        { offset: LAND, transform: "translate(0, 0) scale(1)", opacity: 1, easing: "cubic-bezier(0.5, 0, 0.75, 0)" },
        { offset: 1, transform: `translate(${dx}px, ${dy}px) scale(0.2)`, opacity: 0 },
      ],
      { duration: SINK_MS, fill: "forwards" },
    )
    .finished.finally(() => ghost.remove());
}

type CauldronProps = {
  // คำที่อยู่ในหม้อ รอคำอีกชนิดมาเข้าคู่ — การ์ดจะค้างอยู่ข้างหม้อ (verb ซ้าย, noun ขวา)
  heldWord: Word | null;
  onReturnWord: () => void;
  // หมดเวลาแล้ว — รับการ์ดไม่ได้ แตะหม้อไม่ได้
  locked: boolean;
  // ของที่อยู่เหนือหม้อ (ข้อความผสมคำ) — อยู่ใน hit box ด้วย
  children: ReactNode;
};

// คอลัมน์การ์ดทับส่วนล่างของหม้อ 49px (หม้อสูง 103px) — ตาม redline ของ art: ใต้ฉากถึงบนคอลัมน์ 100px
// ใช้ค่าเดียวกันทั้ง margin ติดลบ และขอบล่างของ hit box — ถ้าแก้ต้องแก้คู่กัน
// -mb-[57px] = จม 49px + ชดเชย gap-2 (8px) ของ main
const SINK_MARGIN = "-mb-[57px]";
const HITBOX_BOTTOM = "bottom-[49px]";

// การ์ดที่ค้างข้างหม้อ: มีคำถึงจะโผล่ ไม่มีก็ว่างเปล่า (ไม่มีกรอบช่องให้เห็น) แตะเพื่อเอาคืน
function HeldCard({ kind, word, onReturnWord }: { kind: WordKind; word: Word | null; onReturnWord: () => void }) {
  if (!word || word.kind !== kind) return <span aria-hidden />;

  return (
    <button type="button" onClick={onReturnWord} aria-label={`Take ${word.text} back`} className="h-[min(56px,7svh)] w-full">
      {/* data-held-card: ตอนตีโดน sinkHeldCard ใช้หาการ์ดใบนี้ไปดูดลงหม้อพร้อมใบที่ลากมา */}
      <CardFrame kind={kind} className="size-full" data-held-card>
        {word.text}
      </CardFrame>
    </button>
  );
}

// การ์ดที่ค้างข้างหม้อ ถูกดูดลงหม้อพร้อมกับใบที่เพิ่งลากมาเข้าคู่
export function sinkHeldCard() {
  sinkIntoPot(document.querySelector("[data-held-card]") ?? undefined);
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
