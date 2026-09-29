import type { DetailedLeaderboardEntry } from "@/lib/types";

type Props = {
  entry: DetailedLeaderboardEntry;
};

function formatRank(rank: number): string {
  if (rank === 1) return "1ST";
  if (rank === 2) return "2ND";
  if (rank === 3) return "3RD";
  return `${rank}TH`;
}

function formatScore(score: number): string {
  return String(score).padStart(6, "0");
}

export default function LeaderboardRow({ entry }: Props) {
  return (
    <div className="grid grid-cols-[60px_1fr_80px] items-center text-score text-foreground">
      <div className="text-left">{formatRank(entry.rank)}</div>
      <div className="text-left truncate px-8">{entry.name || "UNKNOWN"}</div>
      <div className="text-right tracking-wider">{formatScore(entry.score)}</div>
    </div>
  );
}