import Image from "next/image";
import type { Monster } from "@/lib/game/types";

type MonsterStageProps = {
  monster: Monster;
  hp: number;
  // ขนาดกำหนดจากหน้าที่เรียกใช้ — มือถือกับจอ master ใช้สัดส่วนไม่เหมือนกัน
  className?: string;
};

// pixel art ต้องไม่ถูกบีบอัดและไม่ถูกทำให้เบลอตอนขยาย
const pixelated = "[image-rendering:pixelated]";

// ใช้ทั้งในมือถือ (battle) และจอ master — จึงอยู่ใน components/ ที่ root
export default function MonsterStage({ monster, hp, className = "" }: MonsterStageProps) {
  const percent = monster.endless ? 100 : Math.max(0, Math.min(100, (hp / monster.maxHp) * 100));
  const size = monster.spriteSize * monster.spriteScale;

  return (
    <section
      aria-label={`${monster.name} battle`}
      className={`relative overflow-hidden rounded-lg ${className}`}
    >
      <Image src={monster.background} alt="" fill unoptimized className={`object-cover ${pixelated}`} />

      <div className="absolute inset-x-[20%] top-[5%] flex items-center gap-2">
        <span className="text-score text-foreground [text-shadow:2px_2px_0_black]">HP</span>
        <div
          role="progressbar"
          aria-label={`${monster.name} HP`}
          aria-valuemin={0}
          aria-valuemax={monster.maxHp}
          aria-valuenow={monster.endless ? undefined : hp}
          className="h-4 flex-1 bg-foreground"
        >
          <div className="h-full bg-danger transition-[width] duration-300" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {monster.endless && (
        <span className="absolute inset-x-0 top-[17%] text-center text-score text-foreground [text-shadow:2px_2px_0_black]">
          ENDLESS
        </span>
      )}

      <Image
        src={monster.sprite}
        alt={monster.name}
        width={size}
        height={size}
        unoptimized
        className={`absolute bottom-[6%] left-1/2 max-h-[70%] -translate-x-1/2 object-contain ${pixelated}`}
      />
    </section>
  );
}
