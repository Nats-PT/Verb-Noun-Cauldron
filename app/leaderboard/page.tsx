"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getDetailedLeaderboard, subscribeToLeaderboard } from "@/lib/leaderboard";
import type { DetailedLeaderboardEntry } from "@/lib/types";
import LeaderboardHeader from "./_components/LeaderboardHeader";
import LeaderboardRow from "./_components/LeaderboardRow";

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<DetailedLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      const data = await getDetailedLeaderboard(50);
      setLeaderboard(data);
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const unsubscribe = subscribeToLeaderboard(() => fetchLeaderboard());
    return () => unsubscribe();
  }, []);

  return (
    <main className="relative mx-auto flex h-dvh w-full max-w-md flex-col items-center p-3 select-none overflow-hidden bg-background">
      <div className="relative flex h-full max-h-[840px] w-full flex-col overflow-hidden">
        
        <div className="pointer-events-none absolute inset-0 z-0">
          <Image
            src="/leaderboard/frame_leaderboard.png"
            alt="Leaderboard Frame"
            fill
            priority
            unoptimized
            className="object-fill [image-rendering:pixelated]"
          />
        </div>

        <div className="relative z-10 flex h-full flex-col px-7 sm:px-9 pt-10 pb-8">
          <LeaderboardHeader />

          <div className="w-full flex-1 flex flex-col justify-between py-3 overflow-hidden">
            {loading ? (
              <div className="flex h-full items-center justify-center text-muted text-score font-pixel animate-pulse">
                LOADING...
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted text-score font-pixel">
                NO RECORDS YET
              </div>
            ) : (
              leaderboard.map((entry) => (
                <LeaderboardRow key={entry.id || entry.rank} entry={entry} />
              ))
            )}
          </div>
        </div>

      </div>
    </main>
  );
}