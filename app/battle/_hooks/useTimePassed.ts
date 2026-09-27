import { useEffect, useState } from "react";

// เป็น true ทันทีที่ถึงเวลา `at` (ms) — ใช้ setTimeout ให้ตรงเวลาพอดี
// ไม่รอ useNow ที่เดินทีละ 1 วิ ไม่งั้นหมดเวลาแล้วยังลากการ์ดต่อได้อีกเกือบวิ
// ถ้าเปิดหน้ามาหลังเวลานั้นแล้ว (เช่นรีเฟรช) จะเป็น true ทันทีหลัง render แรก
export function useTimePassed(at: number) {
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setPassed(true), Math.max(0, at - Date.now()));
    return () => clearTimeout(timeout);
  }, [at]);

  return passed;
}
