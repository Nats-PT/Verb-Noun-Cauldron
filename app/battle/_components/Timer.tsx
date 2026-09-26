type TimerProps = {
  // เวลาที่เกมจบ (ms) — มาจาก server ทุกเครื่องจึงเห็นเวลาตรงกัน และรีเฟรชแล้วไม่เริ่มนับใหม่
  endsAt: number;
  // จาก useNow() — null ระหว่างรอ render ครั้งแรกบนมือถือ
  now: number | null;
};

function format(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function Timer({ endsAt, now }: TimerProps) {
  return (
    <time className="text-score tabular-nums" aria-live="off">
      {now === null ? "--:--" : format(endsAt - now)}
    </time>
  );
}
