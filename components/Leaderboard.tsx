import type { LeaderboardEntry } from "@/lib/types";
import { pixelFrame } from "@/lib/pixel-frame";

type LeaderboardProps = {
  entries: LeaderboardEntry[];
  // จำนวนแถวที่โชว์เสมอ — อันดับไม่ครบก็เติมแถวว่างให้ครบ (lobby ใช้ 3)
  rows?: number;
  title?: string;
  className?: string;
};

// อันดับกับคะแนนเขียนแบบเดียวกับหน้า /leaderboard (app/leaderboard/_components/LeaderboardRow.tsx)
// ถ้าหน้านั้นเปลี่ยนรูปแบบ ต้องตามแก้ที่นี่ด้วย
function formatRank(rank: number) {
  if (rank === 1) return "1ST";
  if (rank === 2) return "2ND";
  if (rank === 3) return "3RD";
  return `${rank}TH`;
}

function formatScore(score: number) {
  return String(score).padStart(6, "0");
}

export default function Leaderboard({
  entries,
  rows = 3,
  title = "Leaderboard",
  className = "",
}: LeaderboardProps) {
  // copy ก่อน sort เพราะ .sort() แก้ array เดิม ซึ่งเป็น props ที่ห้ามแก้
  const ranked = [...entries].sort((a, b) => b.score - a.score).slice(0, rows);

  return (
    // กรอบ pixel จาก art — ขอบ layout คง 2px เท่ากรอบ CSS เดิม ของข้างในจะได้ไม่ขยับ
    <section
      style={pixelFrame("/lobby/frame-leader.png", { borderWidth: 2 })}
      className={`p-4 [image-rendering:pixelated] ${className}`}
    >
      <h2 className="text-center text-body">{title}</h2>

      {/* ไม่มีหัวตาราง (กล่องเตี้ย) — แถวว่างใช้ *** / ___ แบบหน้า /leaderboard
          แถวกระจายเต็มที่เหลือของกล่องแบบ design (ถ้ากล่องสูงกว่าเนื้อหา) */}
      <ol className="mt-2 flex flex-1 flex-col justify-around">
        {Array.from({ length: rows }, (_, index) => {
          const entry = ranked[index];
          return (
            <li
              key={entry?.id ?? `empty-${index}`}
              className="grid grid-cols-[60px_1fr_80px] items-center text-score text-foreground"
            >
              <span className="text-left">{formatRank(index + 1)}</span>
              <span className="truncate px-2 text-center">{entry ? entry.name : "***********"}</span>
              <span className="text-right tracking-wider">{entry ? formatScore(entry.score) : "_______"}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
