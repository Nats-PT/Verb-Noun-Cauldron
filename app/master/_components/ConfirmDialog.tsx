"use client";

import { useEffect, useState } from "react";
import { pixelFrame } from "@/lib/pixel-frame";

type ConfirmDialogProps = {
  title: string;
  message: string;
  backLabel: string;
  confirmLabel: string;
  // คืนข้อความ error หรือ null ถ้าสำเร็จ (แบบเดียวกับ forceStart)
  onConfirm: () => Promise<string | null>;
  onClose: () => void;
};

// กรอบ/ปุ่มชุดเดียวกับ PrepareScreen
const panelFrame = pixelFrame("/lobby/frame-leader.png", { scale: 4 });
const confirmFrame = pixelFrame("/login/btn-primary.png", { slice: 6, scale: 3 });
const backFrame = pixelFrame("/login/input-bg.png", { slice: 6, scale: 3 });

// กล่องยืนยันก่อนทำสิ่งที่ย้อนไม่ได้ (Cancel match / Reset all) วางทับทั้งเวที
// ปุ่ม "ไม่ทำ" ได้ focus ก่อน — staff กด Enter / Space พลาดจะไม่เกิดอะไร, Esc = ปิด
export default function ConfirmDialog({ title, message, backLabel, confirmLabel, onConfirm, onClose }: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [busy, onClose]);

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    const result = await onConfirm();
    setBusy(false);
    // สำเร็จแล้วปิดเลย — realtime จะพาจอ master ไปจอถัดไปเอง
    if (result === null) onClose();
    else setError(result);
  }

  return (
    <div role="presentation" className="absolute inset-0 z-50 grid place-items-center bg-background/80">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        style={panelFrame}
        className="flex w-[1000px] flex-col items-center gap-10 bg-surface px-16 py-12 text-center [image-rendering:pixelated]"
      >
        <h2 id="confirm-title" className="text-head text-accent">
          {title}
        </h2>
        <p id="confirm-message" className="text-body">
          {message}
        </p>

        <div className="flex gap-10">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            disabled={busy}
            style={backFrame}
            className="px-12 py-3 text-head2 text-foreground [image-rendering:pixelated] hover:brightness-125 active:scale-95 disabled:text-muted"
          >
            {backLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            style={confirmFrame}
            className="px-12 py-3 text-head2 text-accent [image-rendering:pixelated] hover:brightness-110 active:scale-95 disabled:text-muted"
          >
            {busy ? "Working..." : confirmLabel}
          </button>
        </div>

        {error && (
          <p role="alert" className="text-body text-danger">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
