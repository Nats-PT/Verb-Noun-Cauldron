import { useEffect, useRef } from "react";

type HelpModalProps = {
  open: boolean;
  onClose: () => void;
};

// ใช้ <dialog> ของเบราว์เซอร์ จะได้ปุ่ม Esc, การล็อกโฟกัส และฉากหลังมืดมาฟรี
export default function HelpModal({ open, onClose }: HelpModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      // กดที่ฉากหลังนอกกล่องเพื่อปิด
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border-2 border-border bg-surface p-5 text-foreground backdrop:bg-black/70"
    >
      <h2 className="text-center text-head2">How to Play</h2>

      {/* TODO: เนื้อหาจริงรอทีม tutorial — เวอร์ชันนี้จะต่างจากหน้า tutorial ปกติ */}
      <ol className="mt-4 flex list-decimal flex-col gap-2 pl-8 text-body">
        <li>Pick a verb</li>
        <li>Pick a noun</li>
        <li>Drop them in the pot</li>
        <li>Attack the monster!</li>
      </ol>

      <button
        type="button"
        onClick={onClose}
        className="mt-6 h-14 w-full rounded-lg bg-primary text-body hover:bg-primary-hover"
      >
        Got it
      </button>
    </dialog>
  );
}
