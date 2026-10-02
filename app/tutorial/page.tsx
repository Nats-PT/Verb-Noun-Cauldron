"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Pagination from "./_components/Pagination";
import TutorialContent from "./_components/TutorialContent";

const TOTAL_PAGES = 4;

export default function TutorialPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, TOTAL_PAGES));
  };

  const handleGoToLobby = () => {
    router.push("/lobby");
  };

  return (
    <main className="relative mx-auto flex h-dvh w-full max-w-md flex-col items-center p-3 select-none overflow-hidden bg-background font-pixel">
      <div className="relative flex h-full max-h-[840px] w-full flex-col overflow-hidden">

        <div className="pointer-events-none absolute inset-0 z-0">
          <Image
            src="leaderboard\frame_leaderboard.png" 
            alt="Tutorial Frame"
            fill
            priority
            unoptimized
            className="object-fill [image-rendering:pixelated] [image-rendering:crisp-edges]"
          />
        </div>

        <div className="relative z-10 flex h-full flex-col justify-between px-6 pt-10 pb-8">
          {/* ส่วนเนื้อหาของหน้า 1 - 4 */}
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <TutorialContent currentPage={currentPage} />
          </div>

          {/* ส่วนคอนโทรล */}
          <div className="w-full flex flex-col items-center gap-3 pt-2">
            {/* แถบ Page 1 of 4 พร้อมปุ่มลูกศรพิกเซล */}
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