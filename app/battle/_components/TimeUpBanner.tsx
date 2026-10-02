import { CheckIcon, CrossIcon } from "./BattleHeader";

type TimeUpBannerProps = {
  teamScore: number;
  // คะแนนที่เครื่องนี้ตีได้เอง (damage + โบนัสล้มส่วนตัว) — ตัวเดียวกับที่ส่งให้จอ master จัด MVP
  myScore: number;
  correct: number;
  wrong: number;
  // นับถอยหลังไปหน้าสรุป (วินาที) — null = นับครบแล้ว รอหน้าสรุป
  secondsLeft: number | null;
};

// ป้ายทับฉากมอนสเตอร์ตอนหมดเวลา — วางใน element ที่เป็น relative (ขนาดเท่าฉาก)
// คะแนนรายคนโชว์ตรงนี้ เพราะ DB เก็บแค่คะแนนรวมทีม ตัวเลขนี้มีอยู่แค่ในมือถือเครื่องนี้
export default function TimeUpBanner({ teamScore, myScore, correct, wrong, secondsLeft }: TimeUpBannerProps) {
  return (
    <div
      role="status"
      // test:drag ใช้หาป้ายนี้ — dnd-kit ก็มี role="status" ของตัวเอง (ข้อความให้ screen reader)
      data-time-up
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg bg-background/80 text-center"
    >
      <p className="text-head2 text-foreground">TIME&apos;S UP!</p>

      <p className="text-body text-accent">you {myScore}</p>

      <div className="flex items-center gap-3 text-score">
        <span>team {teamScore}</span>
        <span className="flex items-center gap-1" aria-label={`${correct} correct`}>
          <CheckIcon />
          {correct}
        </span>
        <span className="flex items-center gap-1 text-muted" aria-label={`${wrong} wrong`}>
          <CrossIcon />
          {wrong}
        </span>
      </div>

      <p className="text-score text-muted">
        {secondsLeft === null ? "Waiting for results..." : `Results in ${secondsLeft}...`}
      </p>
    </div>
  );
}
