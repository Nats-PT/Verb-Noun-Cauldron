// app/winner/_components/header.tsx
 
import Image from "next/image";
 
type WinnerHeaderProps = {
  isWinner?: boolean;
};
 
export default function WinnerHeader({ isWinner }: WinnerHeaderProps) {
  // ใส่เป็น false ถาวรตงนี้เลย
  const showVictory = true; // เปลี่ยนเป็น false เพื่อทดสอบ DEFEAT
 
  const status = showVictory
    ? {
        label: "VICTORY",
        icon: "/crown.png",
        colorClass: "text-[#f5c027]",
      }
    : {
        label: "DEFEAT",
        icon: "/defeat.png",
        colorClass: "text-white",
      };
 
  return (
    <div className="flex flex-col items-center select-none pt-5">
      <div className="flex items-center gap-[28px]">
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
          className={`text-head uppercase tracking-wider font-bold ${status.colorClass} drop-shadow-[0_4px_0_#000]`}
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
 
 