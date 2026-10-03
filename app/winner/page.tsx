"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // 💡 1. อิมพอร์ต useRouter จาก next/navigation
import { getDetailedLeaderboard } from "@/lib/leaderboard";
import type { TeamId } from "@/lib/types";
import WinnerHeader from "./_components/header";
import TeamRankItem from "./_components/TeamRankItem";
import NextButton from "./_components/NextButton";

type TeamResult = {
  rank: "1st" | "2nd";
  teamId: TeamId;
  teamName: string;
  score: number;
  isWinner: boolean;
};

const fallbackResults: TeamResult[] = [
  {
    rank: "1st",
    teamId: 1,
    teamName: "THUNDER DRAGONS",
    score: 2450,
    isWinner: true,
  },
  {
    rank: "2nd",
    teamId: 2,
    teamName: "ARCANE PHOENIXES",
    score: 2180,
    isWinner: false,
  },
];

export default function WinnerPage() {
  const router = useRouter(); // 💡 2. ประกาศเรียกใช้ router
  const [results, setResults] = useState<TeamResult[]>(fallbackResults);
  const [loading, setLoading] = useState(true);

  const isVictory = results[0]?.isWinner ?? true;

  useEffect(() => {
    async function fetchBattleResult() {
      try {
        const data = await getDetailedLeaderboard(2);
        if (data && data.length >= 2) {
          setResults([
            {
              rank: "1st",
              teamId: (Number(data[0].id) || 1) as TeamId,
              teamName: data[0].name || "TEAM 1",
              score: data[0].score,
              isWinner: true,
            },
            {
              rank: "2nd",
              teamId: (Number(data[1].id) || 2) as TeamId,
              teamName: data[1].name || "TEAM 2",
              score: data[1].score,
              isWinner: false,
            },
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch battle results:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchBattleResult();
  }, []);

  // 💡 3. แก้ไขฟังก์ชัน handleNext ให้เปลี่ยนหน้าไปยัง /leaderboard
  const handleNext = () => {
    router.push("/leaderboard"); // ปรับเปลี่ยน Path ตาม Route ของหน้า Leaderboard ในโปรเจกต์ของคุณได้เลยครับ
  };

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-[390px] flex-col items-center bg-[#18121a] pt-[26px] pb-[88px] px-[26px] select-none font-pixel">
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
      <div className="w-full mt-auto pt-10">
        <NextButton onClick={handleNext} />
      </div>
    </main>
  );
}