import type { Monster } from "@/lib/game/types";

type MonsterStageProps = {
  monster: Monster;
  hp: number;
  className?: string;
};

// ใช้ทั้งในมือถือ (battle) และจอ master — จึงอยู่ใน components/ ที่ root
export default function MonsterStage({ monster, hp, className = "" }: MonsterStageProps) {
  const percent = monster.endless ? 100 : Math.max(0, Math.min(100, (hp / monster.maxHp) * 100));

  return (
    <section
      className={`rounded-lg border-4 border-border bg-surface p-2 ${className}`}
      aria-label={`${monster.name} battle`}
    >
      {/* TODO: เปลี่ยนเป็นภาพฉากจริงเมื่อทีม art ส่งไฟล์ (ใช้ image-rendering: pixelated) */}
      <div
        className="relative flex aspect-[3/2] w-full flex-col items-center overflow-hidden rounded"
        style={{ background: `linear-gradient(to bottom, ${monster.tint}, #3b5d3a)` }}
      >
        <div className="mt-3 flex w-3/4 items-center gap-2">
          <span className="text-score text-card-text">HP</span>
          <div
            role="progressbar"
            aria-label={`${monster.name} HP`}
            aria-valuemin={0}
            aria-valuemax={monster.maxHp}
            aria-valuenow={monster.endless ? undefined : hp}
            className="h-4 flex-1 border-2 border-card-text bg-foreground"
          >
            <div className="h-full bg-danger transition-[width] duration-300" style={{ width: `${percent}%` }} />
          </div>
        </div>

        {/* TODO: เปลี่ยนเป็นภาพมอนสเตอร์ (PNG พื้นใส) */}
        <div className="mt-auto mb-4 flex size-24 items-center justify-center rounded-full border-4 border-card-text bg-ready/70 text-score text-card-text">
          {monster.name}
        </div>

        {monster.endless && (
          <span className="absolute top-9 text-score text-card-text">ENDLESS</span>
        )}
      </div>
    </section>
  );
}
