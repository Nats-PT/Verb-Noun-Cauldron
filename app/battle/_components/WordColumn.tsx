import { useLayoutEffect, useRef } from "react";
import type { Word } from "@/lib/game/types";
import WordCard from "./WordCard";

type WordColumnProps = {
  label: string;
  words: Word[];
  heldId: string | null;
  // หมดเวลาแล้ว — การ์ดทุกใบลากไม่ได้
  locked: boolean;
};

const SLIDE_MS = 150;

// การ์ดที่ย้ายช่อง (จากการสลับที่) เลื่อนจากช่องเดิมไปช่องใหม่ แทนการวาร์ปไปทันที
//
// ดูจากลำดับ id ที่เปลี่ยน ไม่ใช่จำตำแหน่งบนจอไว้ — ระหว่างที่ dnd-kit ปล่อยการ์ด ในคอลัมน์มีทั้งการ์ดลอย
// (popover) และร่างเงาของมัน ตำแหน่งที่จำไว้จะเพี้ยนได้ แล้วการ์ดที่ไม่ได้ย้ายก็จะเลื่อนตามไปด้วย
// ใช้ element.animate() จะได้ไม่ยุ่งกับ class/style ที่ dnd-kit ใช้ขยับการ์ด
function useSlideOnReorder(ids: string[]) {
  const ref = useRef<HTMLElement>(null);
  const prevIds = useRef(ids);

  useLayoutEffect(() => {
    const before = prevIds.current;
    prevIds.current = ids;
    if (before.join() === ids.join()) return;

    const cards = [...(ref.current?.querySelectorAll<HTMLElement>("[data-word-id]") ?? [])];
    // ใบที่เพิ่งลาก dnd-kit เลื่อนกลับเข้าที่ให้เองอยู่แล้ว — ข้ามไป
    const dragged = new Set(cards.filter((el) => el.hasAttribute("popover")).map((el) => el.dataset.wordId));
    const elements = new Map(cards.filter((el) => !dragged.has(el.dataset.wordId)).map((el) => [el.dataset.wordId, el]));

    // ตำแหน่งแต่ละช่อง คิดจากการ์ด 2 ใบที่วัดได้ใน frame นี้ (การ์ดทุกใบสูงเท่ากัน ช่องห่างเท่ากัน)
    const measured = ids.flatMap((id, slot) => {
      const el = elements.get(id);
      return el ? [{ slot, top: el.offsetTop }] : [];
    });
    if (measured.length < 2) return;
    const first = measured[0];
    const last = measured[measured.length - 1];
    const pitch = (last.top - first.top) / (last.slot - first.slot);
    const slotTop = (slot: number) => first.top + (slot - first.slot) * pitch;

    ids.forEach((id, slot) => {
      const from = before.indexOf(id);
      const el = elements.get(id);
      // from = -1 คือการ์ดใหม่จากการเติม ไม่ต้องเลื่อน
      if (!el || from < 0 || from === slot) return;
      el.animate([{ transform: `translateY(${slotTop(from) - slotTop(slot)}px)` }, { transform: "none" }], {
        duration: SLIDE_MS,
        easing: "ease-out",
      });
    });
  });

  return ref;
}

export default function WordColumn({ label, words, heldId, locked }: WordColumnProps) {
  const ref = useSlideOnReorder(words.map((w) => w.id));

  return (
    <section
      ref={ref}
      aria-label={label}
      // กรอบหุ้มการ์ดพอดี (self-start = สูงเท่าการ์ด ไม่ยืดถึงล่างจอ)
      // แต่ไม่เกินพื้นที่ที่มี (max-h-full) — จอเตี้ยการ์ดจะหดลงเองแทน (ดู WordCard)
      // พื้นชมพูโปร่ง 10% / ขอบ 90% ตาม design — มองทะลุเห็นหม้อที่อยู่ข้างหลัง
      // (บนพื้นหลังปกติจะออกมาเป็นสีเดียวกับ bg-surface พอดี)
      className="flex max-h-full min-h-0 flex-col gap-2 self-start rounded-xl border-2 border-primary/90 bg-primary/10 p-2"
    >
      {words.map((word) => (
        <WordCard key={word.id} word={word} inPot={word.id === heldId} locked={locked} />
      ))}
    </section>
  );
}
