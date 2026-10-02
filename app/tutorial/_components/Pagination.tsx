"use client";

import React from "react";
import Image from "next/image";

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
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  return (
    <div className="flex items-center justify-center gap-5 select-none">
      {/* ปุ่มย้อนกลับ */}
      <button
        type="button"
        onClick={onPrev}
        disabled={isFirstPage}
        className={`relative w-8 h-8 sm:w-9 sm:h-9 shrink-0 transition active:scale-95 cursor-pointer ${
          isFirstPage ? "opacity-30 cursor-not-allowed active:scale-100" : ""
        }`}
      >
        <Image
          src="/tutorial/btn_back_default.png" 
          alt="Back"
          fill
          priority
          unoptimized
          className="object-contain [image-rendering:pixelated] [image-rendering:-moz-crisp-edges] [image-rendering:crisp-edges]"
        />
      </button>

      {/* ข้อความ Page X of Y */}
      <span className="text-score text-foreground tracking-widest min-w-[130px] text-center">
        Page {currentPage} of {totalPages}
      </span>

      {/* ปุ่มหน้าถัดไป */}
      <button
        type="button"
        onClick={onNext}
        disabled={isLastPage}
        className={`relative w-8 h-8 sm:w-9 sm:h-9 shrink-0 transition active:scale-95 cursor-pointer ${
          isLastPage ? "opacity-30 cursor-not-allowed active:scale-100" : ""
        }`}
      >
        <Image
          src="/tutorial/btn_next_default.png" 
          alt="Next"
          fill
          priority
          unoptimized
          className="object-contain [image-rendering:pixelated] [image-rendering:-moz-crisp-edges] [image-rendering:crisp-edges]"
        />
        
        </button>
    </div>
  );
}