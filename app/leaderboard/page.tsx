"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDetailedLeaderboard, subscribeToLeaderboard } from "@/lib/leaderboard";
import type { DetailedLeaderboardEntry } from "@/lib/types";

export default function LeaderboardPage() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<DetailedLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      const data = await getDetailedLeaderboard(20);
      setLeaderboard(data);
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();

    //ข้อมูล Realtime เมื่อจบเกม
    const unsubscribe = subscribeToLeaderboard(() => {
      fetchLeaderboard();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <main className="relative mx-auto flex h-dvh w-full max-w-md flex-col items-center px-4 overflow-hidden select-none border-x border-border bg-[#15101a]">
      {/* Title */}
      <div className="relative z-10 flex w-full flex-col items-center pt-8 pb-4">
        <h1 className="text-center text-head text-primary [-webkit-text-stroke:2px_black] leading-tight drop-shadow">
          Leaderboard
        </h1>
      </div>

      {/* Header Columns */}
      <div className="w-full flex items-center justify-between px-6 py-2 text-score--line-height ">
        <div className="w-16">Rank</div>
        <div className="flex-1 text-center">Team</div>
        <div className="w-24 text-right">Score</div>
      </div>

      {/* Leaderboard List */}
      <div className="w-full flex-1 overflow-y-auto py-2 space-y-2.5 pr-1">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-gray-400 text-sm">
            Loading scores...
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-gray-400 text-sm">
            No match records yet.
          </div>
        ) : (
          leaderboard.map((entry) => {
            const isTop1 = entry.rank === 1;
            const isTop2 = entry.rank === 2;
            const isTop3 = entry.rank === 3;

            return (
              <div
                key={entry.id || entry.rank}
                className={`flex items-center justify-between px-5 py-3 rounded-xl border-2 transition-all ${
                  isTop1
                    ? "border-[#f5be38] bg-[#2a2215]/80 shadow-[0_0_10px_rgba(245,190,56,0.2)]"
                    : isTop2
                    ? "border-[#c0c0c0] bg-[#222329]/80"
                    : isTop3
                    ? "border-[#cd7f32] bg-[#281e1a]/80"
                    : "border-border/60 bg-[#1e1926]/60"
                }`}
              >
                {/* อันดับ */}
                <div className="w-16 flex items-center">
                  <span
                    className={`font-black text-lg ${
                      isTop1
                        ? "text-[#f5be38]"
                        : isTop2
                        ? "text-[#c0c0c0]"
                        : isTop3
                        ? "text-[#cd7f32]"
                        : "text-gray-400"
                    }`}
                  >
                    #{entry.rank}
                  </span>
                </div>

                <div className="flex-1 text-center truncate font-bold text-white tracking-wide text-base px-2">
                  {entry.name || "Unknown Team"}
                </div>

                <div className="w-24 text-right font-black text-primary text-base">
                  {entry.score.toLocaleString()}{" "}
                  <span className="text-xs font-normal text-gray-400">pts</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/*<div className="w-full py-4 border-t border-border/40 flex justify-center">
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="w-full max-w-[200px] h-[45px] rounded-xl bg-primary text-black font-bold hover:brightness-110 active:scale-95 transition"
        >
          Back to Login
        </button>
      </div>*/}
    </main>
  );
}