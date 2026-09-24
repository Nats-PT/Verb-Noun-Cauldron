type BattleHeaderProps = {
  score: number;
  correct: number;
  wrong: number;
};

// ไอคอนวาดเองด้วย SVG เพราะฟอนต์ BoldPixels ไม่มีตัว ✓ ✕
function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" className="size-5 bg-ready p-0.5" aria-hidden>
      <path d="M2 6.5 5 9.5 10 3" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg viewBox="0 0 12 12" className="size-5 bg-danger p-0.5" aria-hidden>
      <path d="M3 3 9 9M9 3 3 9" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export default function BattleHeader({ score, correct, wrong }: BattleHeaderProps) {
  return (
    <header className="flex items-center justify-between text-score">
      <p>score: {score}</p>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1" aria-label={`${correct} correct`}>
          <CheckIcon />
          {correct}
        </span>
        <span className="h-5 w-0.5 bg-border" aria-hidden />
        <span className="flex items-center gap-1 text-muted" aria-label={`${wrong} wrong`}>
          <CrossIcon />
          {wrong}
        </span>
      </div>
    </header>
  );
}
