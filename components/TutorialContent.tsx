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
    image: "/tutorial/tutorial_1.gif",
  },
  {
    page: 2,
    title: "HOW TO PLAY",
    descElement: (
      <span>
        DROP CARDS INTO CAULDRON<br />
        TO ATTACK MONSTERS!
      </span>
    ),
    image: "/tutorial/tutorial_2.gif",
  },
  {
    page: 3,
    title: "HOW TO PLAY",
    descElement: (
      <span>
        CLEAR 4 MONSTERS TO<br />
        SUMMON FINAL BOSS.
      </span>
    ),
    image: "/tutorial/tutorial_3.gif",
  },
  {
    page: 4,
    title: "HOW TO PLAY",
    descElement: (
      <span>
        BOSS HAS <span className="text-danger">INFINITE HP</span>!<br />
        MAX DAMAGE BEFORE TIME UP!
      </span>
    ),
    image: "/tutorial/tutorial_4.gif",
  },
];

export default function TutorialContent({ currentPage }: TutorialContentProps) {
  const currentContent = tutorialData[currentPage - 1] || tutorialData[0];

    return (
    <div className="flex h-full w-full flex-col items-center justify-between text-center select-none py-2 gap-3">

      <div className="flex items-center justify-center pt-1">
        <h2 className="text-head2 text-foreground uppercase tracking-wider drop-shadow-[0_2px_0_#000]">
          {currentContent.title}
        </h2>
      </div>
                                  {/* กว้างโทรศัพท์     กว้างไอแพด         ปกติ     สูงไอแพด*/}     
      <div className="relative w-full max-w-[285px] sm:max-w-[300px] h-[460px] sm:h-[480px] my-1 flex items-center justify-center overflow-hidden border-2 border-primary rounded-md bg-surface/30 shadow-[0_0_12px_rgba(219,19,129,0.2)]">
        {currentContent.image ? (
          <Image
            key={currentContent.image}
            src={currentContent.image}
            alt={currentContent.title}
            fill
            priority
            unoptimized
            className="object-contain [image-rendering:pixelated] [image-rendering:-moz-crisp-edges] [image-rendering:crisp-edges]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted text-score ">
            NO IMAGE
          </div>
        )}
      </div>

      <div className="w-full max-w-[340px] h-[48px] sm:h-[54px] flex items-center justify-center px-1">
        <p className="text-score text-foreground tracking-wide leading-tight sm:leading-relaxed text-center">
          {currentContent.descElement}
        </p>
      </div>
    </div>
  );
}