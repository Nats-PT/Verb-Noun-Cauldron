import type { LeaderboardEntry } from "@/lib/types";

type LeaderboardProps = {
  entries: LeaderboardEntry[];
  // lobby ใช้ 3 อันดับ ส่วนหน้า leaderboard เต็มส่ง limit ใหญ่ ๆ หรือไม่ส่งเลยก็ได้
  limit?: number;
  title?: string;
  className?: string;
};

// คะแนนแสดงเป็นเลข 4 หลักตาม wireframe เช่น 0430
function formatScore(score: number) {
  return String(score).padStart(4, "0");
}

export default function Leaderboard({
  entries,
  limit,
  title = "Leaderboard",
  className = "",
}: LeaderboardProps) {
  // copy ก่อน sort เพราะ .sort() แก้ array เดิม ซึ่งเป็น props ที่ห้ามแก้
  const ranked = [...entries].sort((a, b) => b.score - a.score).slice(0, limit);

  return (
    <section className={`rounded-lg border-2 border-border bg-surface p-4 ${className}`}>
      <h2 className="text-center text-head2">{title}</h2>

      {ranked.length === 0 ? (
        <p className="mt-3 text-center text-score text-muted">No scores yet</p>
      ) : (
        <ol className="mt-3 flex flex-col gap-1">
          {ranked.map((entry, index) => (
            <li key={entry.id} className="flex items-baseline gap-3 text-body">
              <span className="w-8 shrink-0 text-muted">{index + 1}.</span>
              <span className="min-w-0 flex-1 truncate">{entry.name}</span>
              <span className="shrink-0 tabular-nums">{formatScore(entry.score)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
