"use client";

import { useEffect, useRef, useState } from "react";
import TutorialContent from "@/components/TutorialContent";

type HelpModalProps = {
  open: boolean;
  onClose: () => void;
};

const TOTAL_PAGES = 4;

// GIF duration in ms (measured from file frames) + 1s buffer for reading
const GIF_DURATIONS: Record<number, number> = {
  1: 2850 + 1000, // ~3.85s (tutorial_1.gif)
  2: 3990 + 1000, // ~5.0s  (tutorial_2.gif)
  3: 7380 + 1000, // ~8.38s (tutorial_3.gif)
  4: 7230 + 1000, // ~8.23s (tutorial_4.gif)
};

// Standard React modal overlay — closes ONLY when clicking "Got it"
export default function HelpModal({ open, onClose }: HelpModalProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to slide 1 whenever the modal opens
  useEffect(() => {
    if (open) {
      setCurrentPage(1);
    }
  }, [open]);

  // Auto-rotate to next step when current GIF finishes + buffer
  useEffect(() => {
    if (!open) return;

    const duration = GIF_DURATIONS[currentPage] ?? 5000;
    const timer = setTimeout(() => {
      setCurrentPage((prev) => (prev % TOTAL_PAGES) + 1);
    }, duration);

    return () => clearTimeout(timer);
  }, [open, currentPage]);

  const handleSelectPage = (page: number) => {
    setCurrentPage(page);
  };

  // If not open, do not render in DOM at all (prevents mobile background suspension)
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 select-none touch-manipulation"
    >
      <div className="relative w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-lg border-2 border-border bg-surface p-4 sm:p-5 text-foreground flex flex-col items-center">
        <TutorialContent currentPage={currentPage} />

        {/* Option A: Clickable story-style progress bars */}
        <div className="flex items-center gap-2 w-full max-w-[285px] sm:max-w-[300px] mx-auto mt-2 mb-1">
          {Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => handleSelectPage(page)}
              className="flex-1 py-2 group cursor-pointer focus:outline-none"
              aria-label={`Jump to step ${page}`}
            >
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentPage === page
                    ? "bg-primary shadow-[0_0_8px_var(--color-primary)]"
                    : currentPage > page
                    ? "bg-primary/50"
                    : "bg-white/20 group-hover:bg-white/40"
                }`}
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 h-14 w-full rounded-lg bg-primary text-body hover:bg-primary-hover active:scale-95 cursor-pointer transition-transform"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
