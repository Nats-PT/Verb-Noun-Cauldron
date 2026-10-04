"use client";

import React from "react";
import Image from "next/image";

type NextButtonProps = {
  onClick: () => void;
  label?: string;
};

export default function NextButton({
  onClick,
  label = "Next",
}: NextButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full aspect-[246/56] max-w-[246px] mx-auto flex items-center justify-center transition-transform active:scale-95 cursor-pointer select-none"
    >
      {/* ภาพพื้นหลังปุ่ม Pixel (คมชัด Pixelated) */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <Image
          src="/login/btn-primary.png"
          alt="Button Frame"
          fill
          priority
          unoptimized
          style={{ imageRendering: "pixelated" }}
          className="object-fill"
        />
      </div>

      {/* ข้อความบนปุ่ม */}
      <span className="relative z-10 font-pixel text-body font-bold text-[#ffe600] uppercase tracking-wider drop-shadow-[0_2px_0_#000]">
        {label}
      </span>
    </button>
  );
}