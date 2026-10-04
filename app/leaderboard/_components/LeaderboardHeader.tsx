export default function LeaderboardHeader() {
  return (
    <div className="w-full">
      {/* Title */}
      <div className="flex w-full justify-center pt-2 pb-6">
        <h1 className="text-center font-pixel text-head font-bold text-white drop-shadow-[0_6px_12px_#f5c027]">
          Leaderboard
        </h1>
      </div>

      {/*Table Header */}
      <div className="grid grid-cols-[60px_1fr_80px] w-full pb-3 font-pixel text-score text-foreground uppercase border-b border-border">
        <div className="text-left">RANK</div>
        <div className="text-center">TEAM</div>
        <div className="text-right">SCORE</div>
      </div>
    </div>
  );
}