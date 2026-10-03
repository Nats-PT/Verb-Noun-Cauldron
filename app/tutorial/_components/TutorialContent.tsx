"use client";

import React from "react";
import Image from "next/image";

type TutorialContentProps = {
  currentPage: number;
};

const tutorialData = [
  {
    page: 1,
    title: "HOW TO PLAY",
    descElement: (
      <span>
        PAIR A <span className="text-verb">VERB</span> WITH<br />
        THE MATCHING <span className="text-noun">NOUN</span>.
      </span>
    ),
    image: "/tutorial/step1.png",
  },
  {
    page: 2,
    title: "BREW & ATTACK",
    descElement: (
      <span>
        DROP CARDS INTO CAULDRON<br />
        TO ATTACK MONSTERS!
      </span>
    ),
    image: "/tutorial/step2.png",
  },
  {
    page: 3,
    title: "DEFEAT MONSTERS",
    descElement: (
      <span>
        CLEAR 4 MONSTERS TO<br />
        SUMMON THE FINAL BOSS.
      </span>
    ),
    image: "/tutorial/step3.png",
  },
  {
    page: 4,
    title: "INFINITE BOSS",
    descElement: (
      <span>
        BOSS HAS <span className="text-danger">INFINITE HP</span>!<br />
        DEAL MAX DAMAGE BEFORE TIME OUT.
      </span>
    ),
    image: "/tutorial/step4.png",
  },
];

export default function TutorialContent({ currentPage }: TutorialContentProps) {
  const currentContent = tutorialData[currentPage - 1] || tutorialData[0];

  return (
    <div className="flex h-full w-full flex-col items-center justify-between text-center select-none font-pixel py-1">
      {/* 1. ส่วนหัวข้อ: ล็อกความสูงเพื่อไม่ให้กระทบตำแหน่งภาพ */}
      <div className="h-10 flex items-center justify-center">
        <h2 className="text-head2 text-foreground uppercase tracking-wider drop-shadow-[0_2px_0_#000]">
          {currentContent.title}
        </h2>
      </div>

      {/* 2. กรอบภาพในเกม: ล็อกสัดส่วนและขนาดคงที่ ทุกหน้าจะสูงเท่ากันเป๊ะ ไม่บีบไม่ยืด */}
      <div className="relative w-full max-w-[280px] h-[360px] flex items-center justify-center overflow-hidden border-2 border-primary rounded-md bg-surface/30">
        {currentContent.image ? (
          <Image
            src={currentContent.image}
            alt={currentContent.title}
            fill
            priority
            unoptimized
            className="object-contain [image-rendering:pixelated] [image-rendering:-moz-crisp-edges] [image-rendering:crisp-edges]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted text-score">
            ภาพในเกม
          </div>
        )}
      </div>

      {/* 3. กล่องข้อความด้านล่าง: ล็อกความสูงตายตัว (h-[64px]) รองรับ 2 บรรทัด ตัวหนังสือจะไม่ขยับเวลากดเปลี่ยนหน้า */}
      <div className="w-full max-w-[320px] h-[64px] flex items-center justify-center">
        <p className="text-score text-foreground uppercase tracking-wide leading-tight">
          {currentContent.descElement}
        </p>
      </div>
    </div>
  );
}