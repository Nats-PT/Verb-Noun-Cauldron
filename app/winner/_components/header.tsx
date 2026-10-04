// app/winner/_components/header.tsx
 
import Image from "next/image";
 
type WinnerHeaderProps = {
  isWinner?: boolean;
};
 
export default function WinnerHeader({ isWinner }: WinnerHeaderProps) {
  const showVictory = isWinner ?? true;
 
  const status = showVictory
    ? {
        label: "VICTORY",
        icon: "/crown.png",
        styleClass: "text-white drop-shadow-[0_6px_12px_#f5c027]",
      }
    : {
        label: "DEFEAT",
        icon: "/defeat.png",
        styleClass: "text-white drop-shadow-[0_6px_12px_#fff]",
      };
 
  return (
    <div className="flex flex-col items-center select-none pt-5 w-full">
      <div className="flex items-center gap-[16px] justify-center w-full">
        <div className="relative w-10 h-10 shrink-1 translate-y-1">
          <Image
            src={status.icon}
            alt={status.label}
            fill
            priority
            unoptimized
            style={{ imageRendering: "pixelated" }}
            className="object-contain"
          />
        </div>
        <h1
          className={`text-head uppercase tracking-wider font-bold ${status.styleClass}`}
        >
          {status.label}
        </h1>
      </div>
 
      <p className="text-head2 text-white uppercase tracking-widest mt-[10px] font-bold">
        BATTLE RESULT
      </p>
    </div>
  );
}
 
 