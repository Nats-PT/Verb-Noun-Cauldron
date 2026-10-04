"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getDetailedLeaderboard, subscribeToLeaderboard } from "@/lib/leaderboard";
import { leaveLobby } from "@/lib/lobby";
import type { DetailedLeaderboardEntry } from "@/lib/types";
import LeaderboardHeader from "./_components/LeaderboardHeader";
import LeaderboardRow from "./_components/LeaderboardRow";
import HomeButton from "./_components/HomeButton";

export default function LeaderboardPage() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<DetailedLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleHome = async () => {
    setLoggingOut(true);
    try {
      await leaveLobby();
    } catch (err) {
      console.error("[Leaderboard] Error during logout:", err);
    } finally {
      router.push("/login");
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      getDetailedLeaderboard(10)
        .then((data) => {
          if (!cancelled) setLeaderboard(data);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

    load();
    const unsubscribe = subscribeToLeaderboard(load);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const displayRows: DetailedLeaderboardEntry[] = Array.from({ length: 10 }, (_, index) => {
    const rank = index + 1;
    if (leaderboard[index]) {
      return leaderboard[index];
    }
    return {
      rank,
      name: "***********",
      score: "_______",
      team_id: rank,
    } as unknown as DetailedLeaderboardEntry;
  });

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col items-center p-3 pb-10 select-none overflow-y-auto border-x border-border bg-[url('/background/background_default.png')] bg-cover bg-center [image-rendering:pixelated]">
      <div className="relative flex h-[720px] w-full flex-col shrink-0 overflow-hidden">
        
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

        <div className="relative z-10 flex h-full flex-col px-10 pt-10 pb-8">
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
              displayRows.map((entry) => (
                <LeaderboardRow key={entry.id || entry.rank} entry={entry} />
              ))
            )}
          </div>
        </div>

      </div>

      <footer className="w-full mt-6 flex justify-center shrink-0">
        <HomeButton onClick={handleHome} disabled={loggingOut} />
      </footer>
    </main>
  );
}