"use client";

import React, { useState } from "react";
import Image from "next/image";
import Pagination from "./_components/Pagination";
import TutorialContent from "@/components/TutorialContent";

const TOTAL_PAGES = 4;

export default function TutorialPage() {
  const [currentPage, setCurrentPage] = useState(1);

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, TOTAL_PAGES));
  };

  return (
    <main className="relative mx-auto flex h-dvh w-full max-w-md flex-col items-center p-3 select-none overflow-hidden bg-background">

      {/* กรอบคอนเทนเนอร์หลักความสูงสูงสุด 840px เหมือน Leaderboard */}
      <div className="relative z-10 flex h-full max-h-[840px] w-full flex-col overflow-hidden">
        {/* เลเยอร์รูปเฟรม */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <Image
            src="/leaderboard/frame_leaderboard.png"
            alt="Tutorial Frame"
            fill
            priority
            unoptimized
            className="object-fill [image-rendering:pixelated] [image-rendering:crisp-edges]"
          />
        </div>

        {/* เนื้อหาภายในเฟรม */}
        <div className="relative z-10 flex h-full flex-col justify-between px-6 pt-10 pb-8">
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <TutorialContent currentPage={currentPage} />
          </div>

          <div className="w-full flex flex-col items-center gap-2 pt-1">
            <Pagination
              currentPage={currentPage}
              totalPages={TOTAL_PAGES}
              onPrev={handlePrev}
              onNext={handleNext}
            />
          </div>
        </div>
      </div>
    </main>
  );
}