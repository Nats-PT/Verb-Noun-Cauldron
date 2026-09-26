import { useEffect, useState } from "react";

// เวลาปัจจุบัน อัปเดตทุก 1 วิ — ใช้ร่วมกันทั้งหน้า (นาฬิกา, จุดอ่อนของ Dragon, หมดเวลา)
// เริ่มเป็น null เพราะเวลาบน server กับมือถือไม่ตรงกัน ถ้าคำนวณตอน render จะ hydration error
export function useNow() {
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

  return now;
}
