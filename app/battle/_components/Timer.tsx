import { useEffect, useState } from "react";

type TimerProps = {
  // เวลาที่เกมจบ (ms) — มาจาก server ทุกเครื่องจึงเห็นเวลาตรงกัน และรีเฟรชแล้วไม่เริ่มนับใหม่
  endsAt: number;
};

function format(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function Timer({ endsAt }: TimerProps) {
  // เริ่มเป็น null เพราะเวลาบน server กับมือถือไม่ตรงกัน ถ้าคำนวณตอน render จะ hydration error
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const interval = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, []);

  return (
    <time className="text-score tabular-nums" aria-live="off">
      {now === null ? "--:--" : format(endsAt - now)}
    </time>
  );
}
