import { pixelFrame } from "@/lib/pixel-frame";

type ReadyButtonProps = {
  isReady: boolean;
  onToggle: () => void;
};

// ปุ่ม pixel art จาก art: ยังไม่ Ready = ปุ่มชมพูแบบ PLAY! หน้า login, Ready แล้ว = กรอบชมพูพื้นมืด (ภาพเดียวกับช่องชื่อ)
const readyFrame = pixelFrame("/login/btn-primary.png", { slice: 6 });
const cancelFrame = pixelFrame("/login/input-bg.png", { slice: 6 });

export default function ReadyButton({ isReady, onToggle }: ReadyButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isReady}
      style={isReady ? cancelFrame : readyFrame}
      // 206×55 เท่าภาพปุ่ม (redline) — เหมือนปุ่ม PLAY! หน้า login
      className={`flex h-[55px] w-[206px] items-center justify-center text-body [image-rendering:pixelated] hover:brightness-110 active:scale-95 ${
        isReady ? "text-foreground" : "text-accent"
      }`}
    >
      {isReady ? "Cancel Ready" : "Ready"}
    </button>
  );
}
