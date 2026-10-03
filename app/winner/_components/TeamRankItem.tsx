import React from "react";
import Image from "next/image";
import type { TeamId } from "@/lib/types";

type TeamRankItemProps = {
  rank: "1st" | "2nd";
  teamId: TeamId;
  teamName: string;
  score: number;
  isWinner: boolean;
};

export default function TeamRankItem({
  rank,
  teamName,
  score,
}: TeamRankItemProps) {
  const formattedScore = `${score.toLocaleString()} PTS`;

  const isFirst = rank.toLowerCase() === "1st";
  const badgeIcon = isFirst ? "/one.png" : "/two.png";

  return (
    <div className="relative w-full aspect-[338/169] flex items-center justify-between p-6 sm:p-7 select-none">
      {/* พื้นหลังกรอบการ์ด */}
      <div className="pointer-events-none absolute inset-1 z-2">
        <Image
          src="/resultwinner.png"
          alt="Result Card Frame"
          fill
          priority
          unoptimized
          style={{ imageRendering: "pixelated" }}
          className="object-fill"
        />
      </div>

      {/* เนื้อหาการ์ด */}
      <div className="relative z-12 w-full flex flex-col gap-8 h-full font-pixel text-white py-1">
        {/* แถวบน: เหรียญ + อันดับ (ซ้าย) | ชื่อทีม (ขวา) */}
        <div className="flex items-center justify-between gap-1 mt-3">
          <div className="flex items-center gap-0 sm:gap-1 shrink-0">
            <div className="relative w-6 h-6 sm:w-8 sm:h-6 shrink-0 -ml-0 sm:-ml-0">
              <Image
                src={badgeIcon}
                alt={rank}
                fill
                unoptimized
                style={{ imageRendering: "pixelated" }}
                className="object-contain"
              />
            </div>
            <span className="font-bold text-white text-body uppercase">
              {rank}
            </span>
          </div>
          <span className="text-right font-bold text-white text-score max-w-[180px] break-words line-clamp-2 uppercase">
            {teamName}
          </span>
        </div>

        {/* แถวล่าง: SCORE: (ซ้าย) | คะแนน (ขวา) */}
        <div className="flex items-center justify-between text-score tracking-wider">
          <span className="text-white font-bold uppercase">SCORE:</span>
          <span className="font-bold text-white uppercase">{formattedScore}</span>
        </div>
      </div>
    </div>
  );
}