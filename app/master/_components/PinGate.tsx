"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

// PIN ของ staff — เช็คบนหน้าเว็บเท่านั้น กันคนทั่วไปกดเล่นหน้า master ได้ แต่คนที่แกะ JS ก็หาเจอ
const MASTER_PIN = "1112";
// จำไว้ใน sessionStorage: รีเฟรชไม่ต้องกรอกใหม่ ปิดแท็บแล้วต้องกรอกใหม่
const UNLOCK_KEY = "master-unlocked";

const KEYPAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"] as const;

function readUnlocked() {
  try {
    return sessionStorage.getItem(UNLOCK_KEY) === "1";
  } catch {
    return false;
  }
}

function saveUnlocked() {
  try {
    sessionStorage.setItem(UNLOCK_KEY, "1");
  } catch {
    // โหมดส่วนตัวบางเบราว์เซอร์เขียนไม่ได้ — แค่ต้องกรอกใหม่ตอนรีเฟรช
  }
}

// sessionStorage ไม่มี event ให้ฟังในแท็บเดียวกัน — อ่านค่าครั้งเดียวพอ
const subscribeNothing = () => () => {};

export default function PinGate({ children }: { children: React.ReactNode }) {
  // null = กำลัง render บน server ยังไม่รู้ค่า → ยังไม่วาดอะไร
  const stored = useSyncExternalStore(subscribeNothing, readUnlocked, () => null);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const [digits, setDigits] = useState("");
  const dotsRef = useRef<HTMLDivElement>(null);

  const unlocked = stored === true || justUnlocked;

  function press(key: (typeof KEYPAD)[number]) {
    if (key === "clear") return setDigits("");
    if (key === "back") return setDigits((d) => d.slice(0, -1));

    const next = digits + key;
    if (next.length < MASTER_PIN.length) return setDigits(next);

    // ครบ 4 ตัว เช็คทันทีไม่ต้องกด OK
    setDigits("");
    if (next === MASTER_PIN) {
      saveUnlocked();
      setJustUnlocked(true);
    } else {
      dotsRef.current?.animate(
        [0, -24, 24, -16, 16, 0].map((x) => ({ transform: `translateX(${x}px)` })),
        { duration: 400 },
      );
    }
  }

  // พิมพ์จากคีย์บอร์ดได้ด้วย — ฟังใหม่ทุกครั้งที่ digits เปลี่ยน press จะได้เห็นค่าล่าสุด
  useEffect(() => {
    if (unlocked) return;
    function onKeyDown(e: KeyboardEvent) {
      if (/^[0-9]$/.test(e.key)) press(e.key as (typeof KEYPAD)[number]);
      else if (e.key === "Backspace") press("back");
      else if (e.key === "Escape") press("clear");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  if (stored === null) return null;
  if (unlocked) return children;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-12">
      <h1 className="text-head">Enter staff PIN</h1>

      <div ref={dotsRef} className="flex gap-8" aria-label={`${digits.length} of ${MASTER_PIN.length} digits`}>
        {Array.from({ length: MASTER_PIN.length }, (_, i) => (
          <span
            key={i}
            className={`size-10 rounded-full border-4 border-primary ${i < digits.length ? "bg-primary" : ""}`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {KEYPAD.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => press(key)}
            aria-label={key === "back" ? "Delete" : key === "clear" ? "Clear" : key}
            className="size-36 rounded-2xl border-4 border-border bg-surface text-head hover:border-primary"
          >
            {key === "back" ? "⌫" : key === "clear" ? "C" : key}
          </button>
        ))}
      </div>
    </div>
  );
}
