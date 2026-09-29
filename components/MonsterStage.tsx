import Image from "next/image";
import type { Monster } from "@/lib/game/types";

type MonsterStageProps = {
  monster: Monster;
  hp: number;
  // HP เต็มขึ้นกับจำนวนคนในทีม จึงรับจากหน้าที่เรียกใช้ (monsterMaxHp)
  maxHp: number;
  // กำลังรับ damage → ใช้ภาพ hit (ตัวแดง) แทนภาพยืนปกติ
  hit?: boolean;
  // เพิ่งตีโดนจุดอ่อน → โชว์ "weak!" แป๊บหนึ่ง
  // ไม่บอกหมวดตรง ๆ ให้ผู้เล่นที่สังเกตเดาเองว่าคำแบบไหนแรง
  weakHit?: boolean;
  // ขนาดกำหนดจากหน้าที่เรียกใช้ — ควรเป็น 120×90 (ขนาดภาพฉาก) คูณจำนวนเต็ม ภาพจะได้คม
  className?: string;
};

// pixel art ต้องไม่ถูกบีบอัดและไม่ถูกทำให้เบลอตอนขยาย
const pixelated = "[image-rendering:pixelated]";

// ตัวหนังสือบนฉาก ต้องมีเงาดำถึงจะอ่านออกบนพื้นหลังทุกด่าน
const overlayText = "text-score text-foreground [text-shadow:2px_2px_0_black]";

// ใช้ทั้งในมือถือ (battle) และจอ master — จึงอยู่ใน components/ ที่ root
export default function MonsterStage({
  monster,
  hp,
  maxHp,
  hit = false,
  weakHit = false,
  className = "",
}: MonsterStageProps) {
  const percent = monster.endless ? 100 : Math.max(0, Math.min(100, (hp / maxHp) * 100));

  return (
    <section
      aria-label={`${monster.name} battle`}
      className={`relative overflow-hidden rounded-lg ${className}`}
    >
      {/* ภาพฉากรวมตัวมอนสเตอร์ 2 แบบซ้อนกัน แล้วสลับว่าอันไหนมองเห็น
          โหลดภาพ hit ไว้ตั้งแต่แรก ตีครั้งแรกจะได้ไม่มีจังหวะภาพว่าง และ GIF ยืนเฉยไม่เริ่มขยับใหม่ทุกครั้งที่โดนตี */}
      <Image
        src={monster.scene}
        alt={monster.name}
        fill
        unoptimized
        // อยู่บนสุดของจอ โหลดทันที ไม่ต้องรอ lazy load
        loading="eager"
        data-scene="move"
        className={`object-cover ${pixelated} ${hit ? "invisible" : ""}`}
      />
      <Image
        src={monster.hitScene}
        alt=""
        fill
        unoptimized
        // อยู่บนสุดของจอ โหลดทันที ไม่ต้องรอ lazy load
        loading="eager"
        data-scene="hit"
        className={`object-cover ${pixelated} ${hit ? "" : "invisible"}`}
      />

      <div className="absolute inset-x-[20%] top-[5%] flex items-center gap-2">
        <span className={overlayText}>HP</span>
        <div
          role="progressbar"
          aria-label={`${monster.name} HP`}
          aria-valuemin={0}
          aria-valuemax={maxHp}
          aria-valuenow={monster.endless ? undefined : hp}
          className="h-4 flex-1 bg-foreground"
        >
          <div className="h-full bg-danger transition-[width] duration-300" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {/* ใต้แถบ HP: ENDLESS (เฉพาะตัวสุดท้าย) แล้วตามด้วย weak! ตอนตีโดนจุดอ่อน */}
      <div className="absolute inset-x-0 top-[17%] z-10 flex flex-col items-center">
        {monster.endless && <span className={overlayText}>ENDLESS</span>}
        {weakHit && <span className={`${overlayText} text-ready`}>weak!</span>}
      </div>
    </section>
  );
}
