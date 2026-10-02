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
    // ไฮไลต์คำว่า VERB และ NOUN ให้ตรงกับโทนสีประจำการ์ด
    descElement: (
      <span>
        PAIR A <span className="text-verb">VERB</span> WITH THE MATCHING{" "}
        <span className="text-noun">NOUN</span>.
      </span>
    ),
    image: "/tutorial/step1.png",
  },
  {
    page: 2,
    descElement: (
      <span>DROP CARDS INTO THE CAULDRON TO ATTACK THE MONSTER!</span>
    ),
    image: "/tutorial/step2.png",
  },
  {
    page: 3,
    descElement: (
      <span>CLEAR 4 MONSTERS TO SUMMON THE FINAL BOSS.</span>
    ),
    image: "/tutorial/step3.png",
  },
  {
    page: 4,
    descElement: (
      <span>
        BOSS HAS <span className="text-danger">INFINITE HP</span>! DEAL MAX
        DAMAGE BEFORE TIME OUT.
      </span>
    ),
    image: "/tutorial/step4.png",
  },
];

export default function TutorialContent({ currentPage }: TutorialContentProps) {
  const currentContent = tutorialData[currentPage - 1] || tutorialData[0];

  return (
    <div className="flex h-full w-full flex-col items-center justify-between text-center select-none py-6">
      {/* หัวข้อ: ใช้ text-head2 สีเหลืองทอง (accent) พร้อมเงาดำสไตล์เกม 8-bit */}
      <h2 className="text-head2 text-foreground tracking-wider drop-shadow-[0_3px_0_#000]">
        {currentContent.title}
      </h2>

      {/* กรอบแสดงภาพประกอบ */}
      <div className="relative my-2 aspect-[4/3] w-full max-w-[280px] flex items-center justify-center">
        {currentContent.image ? (
          <Image
            src={currentContent.image}
            alt={`Tutorial Step ${currentContent.page}`}
            fill
            priority
            unoptimized
            className="object-contain [image-rendering:pixelated] [image-rendering:-moz-crisp-edges] [image-rendering:crisp-edges]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center border-2 border-dashed border-border text-muted text-body">
            PREVIEW
          </div>
        )}
      </div>

      {/* คำอธิบาย: คุมขนาดด้วย text-score หรือ text-body สีขาว (foreground) */}
      <div className="text-body text-foreground tracking-wide max-w-[320px] px-2">
        {currentContent.descElement}
      </div>
    </div>
  );
}