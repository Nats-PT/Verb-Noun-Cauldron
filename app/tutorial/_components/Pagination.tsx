"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type TutorialPaginationProps = {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
};

export default function TutorialPagination({
  currentPage,
  totalPages,
  onPrev,
  onNext,
}: TutorialPaginationProps) {
  const router = useRouter();
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  const [isPrevPressed, setIsPrevPressed] = useState(false);
  const [isNextPressed, setIsNextPressed] = useState(false);

  const handleNextClick = () => {
    if (isLastPage) {
      router.push("/lobby");
    } else {
      onNext();
    }
  };

  return (
    <div className="flex items-center justify-center gap-5 select-none touch-manipulation">
      {/* -------------------- ปุ่มย้อนกลับ (PREV) -------------------- */}
      <button
        type="button"
        onClick={onPrev}
        disabled={isFirstPage}
        onPointerDown={() => !isFirstPage && setIsPrevPressed(true)}
        onPointerUp={() => setIsPrevPressed(false)}
        onPointerLeave={() => setIsPrevPressed(false)}
        className={`relative w-8 h-8 sm:w-9 sm:h-9 shrink-0 cursor-pointer touch-manipulation transition-transform duration-75 ${
          isPrevPressed ? "scale-95" : ""
        } ${isFirstPage ? "opacity-30 cursor-not-allowed" : ""}`}
      >
        <Image
          src={
            isPrevPressed && !isFirstPage
              ? "/tutorial/btn_back_default.png"
              : "/tutorial/btn_back.png"
          }
          alt="Back"
          fill
          priority
          unoptimized
          className="object-contain [image-rendering:pixelated] pointer-events-none select-none"
        />
      </button>

      {/* -------------------- ข้อความ Page of -------------------- */}
      <span className="text-score text-foreground tracking-widest min-w-[130px] text-center font-pixel">
        Page {currentPage} of {totalPages}
      </span>

      {/* -------------------- ปุ่มหน้าถัดไป (NEXT) -------------------- */}
      <button
        type="button"
        onClick={handleNextClick}
        onPointerDown={() => setIsNextPressed(true)}
        onPointerUp={() => setIsNextPressed(false)}
        onPointerLeave={() => setIsNextPressed(false)}
        className={`relative w-8 h-8 sm:w-9 sm:h-9 shrink-0 cursor-pointer touch-manipulation transition-transform duration-75 ${
          isNextPressed ? "scale-95" : ""
        }`}
      >
        <Image
          src={
            isNextPressed
              ? "/tutorial/btn_next_default.png"
              : "/tutorial/btn_next.png"
          }
          alt="Next"
          fill
          priority
          unoptimized
          className="object-contain [image-rendering:pixelated] pointer-events-none select-none"
        />
      </button>
    </div>
  );
}