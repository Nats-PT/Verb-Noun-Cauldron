import type { Word } from "@/lib/game/types";

type WordCardProps = {
  word: Word;
};

// กรอบ pixel art 48×32 ตัดเป็น 9 ส่วนที่ 9px แล้วขยาย ×2 (18px)
// มุมคงลายเดิม ส่วนขอบยืดตามขนาดการ์ด การ์ดจึงปรับตามจอได้ทุกขนาด
// เส้นขอบจริงบางกว่าลาย (6px) คำยาว ๆ จึงเขียนทับลายขอบได้นิดหน่อยแทนที่จะล้นการ์ด
const FRAMES = {
  verb: "/battle/cards/verb.png",
  noun: "/battle/cards/noun.png",
};

// TODO ระยะที่ 2: ทำให้ลากได้ (draggable) ของ dnd-kit
export default function WordCard({ word }: WordCardProps) {
  return (
    <div
      style={{ borderImage: `url(${FRAMES[word.kind]}) 9 fill / 18px stretch` }}
      className="flex max-h-[72px] min-h-[52px] flex-1 items-center justify-center border-[6px] border-solid px-1 text-center text-score leading-tight break-words text-card-text [image-rendering:pixelated]"
    >
      {word.text}
    </div>
  );
}
