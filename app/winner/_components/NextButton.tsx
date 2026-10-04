"use client";

import React from "react";
import { pixelFrame } from "@/lib/pixel-frame";

type NextButtonProps = {
  onClick: () => void;
  label?: string;
};

// ใช้ pixelFrame แบบ 9-slice เหมือน ReadyButton หน้า lobby และ PLAY! หน้า login
const buttonFrame = pixelFrame("/login/btn-primary.png", { slice: 6 });

export default function NextButton({
  onClick,
  label = "Next",
}: NextButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={buttonFrame}
      className="flex h-[55px] w-[206px] mx-auto items-center justify-center text-body text-accent [image-rendering:pixelated] hover:brightness-110 active:scale-95 cursor-pointer select-none"
    >
      {label}
    </button>
  );
}