"use client";

import { useSyncExternalStore } from "react";

// จอ master วาดบนเวทีคงที่ 1920×1080 (ขนาด TV ในบูธ) แล้วย่อ/ขยายทั้งก้อนให้พอดีหน้าต่าง
// เปิดบนคอมเห็นยังไง บน TV ก็เป็นแบบนั้น — บน TV 1080p ขยาย ×1 พอดี ภาพ pixel art จึงคมชัด
export const STAGE_WIDTH = 1920;
export const STAGE_HEIGHT = 1080;

function subscribeResize(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

function getScale() {
  return Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT);
}

export default function MasterStage({ children }: { children: React.ReactNode }) {
  // บน server ไม่รู้ขนาดหน้าต่าง → null แล้วยังไม่วาดอะไร กันเวทีกระพริบจากขนาดผิด
  const scale = useSyncExternalStore(subscribeResize, getScale, () => null);

  return (
    <div className="fixed inset-0 grid place-items-center overflow-hidden bg-background">
      {scale !== null && (
        <div style={{ width: STAGE_WIDTH * scale, height: STAGE_HEIGHT * scale }}>
          <div
            className="relative origin-top-left"
            style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT, transform: `scale(${scale})` }}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
