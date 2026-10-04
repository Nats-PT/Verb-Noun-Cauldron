"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMatchWinnerState, type MatchTeamResult } from "@/lib/winner";
import WinnerHeader from "./_components/header";
import TeamRankItem from "./_components/TeamRankItem";
import NextButton from "./_components/NextButton";

const fallbackResults: MatchTeamResult[] = [
  {
    rank: "1st",
    teamId: 1,
    teamName: "THUNDER DRAGONS",
    score: 2450,
    isWinner: true,
    isMyTeam: true,
  },
  {
    rank: "2nd",
    teamId: 2,
    teamName: "ARCANE PHOENIXES",
    score: 2180,
    isWinner: false,
    isMyTeam: false,
  },
];

export default function WinnerPage() {
  const router = useRouter();
  const [results, setResults] = useState<MatchTeamResult[]>(fallbackResults);
  const [isVictory, setIsVictory] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBattleResult() {
      try {
        const state = await getMatchWinnerState();
        if (state && state.teams.length > 0) {
          setResults(state.teams);
          setIsVictory(state.isVictory);
        }
      } catch (err) {
        console.error("Failed to fetch battle results:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchBattleResult();
  }, []);

  const handleNext = () => {
    router.push("/leaderboard");
  };

  return (
    <main className="relative mx-auto flex h-dvh w-full max-w-md flex-col items-center bg-[#18121a] pt-[26px] pb-[88px] px-[26px] select-none font-pixel">
      {/* 1. Header Section */}
      <WinnerHeader isWinner={isVictory} />

      {/* 2. Result Cards Section */}
      <section className="w-full flex flex-col gap-[40px] mt-[68px]">
        {loading ? (
          <div className="flex flex-col gap-4 text-center text-white/50 animate-pulse py-12 text-body">
            LOADING RESULT...
          </div>
        ) : (
          results.map((item) => (
            <TeamRankItem
              key={item.teamId}
              rank={item.rank}
              teamId={item.teamId}
              teamName={item.teamName}
              score={item.score}
              isWinner={item.isWinner}
            />
          ))
        )}
      </section>

      {/* 3. Footer Action Button */}
      <div className="w-full mt-2 pt-10">
        <NextButton onClick={handleNext} />
      </div>
    </main>
  );
}