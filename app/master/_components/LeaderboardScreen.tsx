"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getLeaderboard, subscribeToLeaderboard } from "@/lib/leaderboard";
import { formatRank, formatScore, LEADERBOARD_ROWS, leaderboardRows } from "@/lib/master";
import { pixelFrame } from "@/lib/pixel-frame";
import type { LeaderboardEntry } from "@/lib/types";

// กรอบชุดเดียวกับจอ master อื่น — design ขยายลายขอบ ×12 (ชมพู 12 + ม่วงหม่น 24 ≈ 36px, ขั้นมุม 12px)
const outerFrame = pixelFrame("/lobby/frame-leader.png", { scale: 12 });

const pixelated = "[image-rendering:pixelated]";

// โหลดใหม่เองทุกเท่านี้ ถึง realtime จะเงียบ (เหตุผลเดียวกับ POLL_MS ใน MasterScreen: หน้าต่างถูกบังนานแล้ว realtime หลุด)
const POLL_MS = 10_000;

// ตำแหน่ง / ขนาดทั้งหมดเป็น px บนเวที 1920×1080 วัดจาก design ของ art (Lead_Mas)
// คอลัมน์ RANK x 239, TEAM x 739, SCORE x 1237 — หัวตารางกับแถวใช้ชุดเดียวกัน
const columns = "grid grid-cols-[500px_498px_auto] items-baseline";

// ขนาดตัวหนังสือ: token ของทีม (text-head 60 ฯลฯ) ตั้งไว้สำหรับมือถือ จอนี้ใน design ใหญ่กว่านั้น
// หัวข้อ ~96px, หัวตาราง ~48px, แถว 36px (= text-head2)
const titleSize = "text-[96px] leading-none";
const headerSize = "text-[48px] leading-none";

// หัวข้อแบบ design: เหลืองมะนาว #ffff5b (ไม่ใช่ accent #fae05f ของทีม — design master ใช้สีนี้ทั้ง Prepare / Leaderboard)
// + เงาทองเข้มตกลงล่าง ขอบตัวอักษรคม (ไม่ใช่แสงฟุ้งรอบตัว) — ต้องตรงกับ PrepareScreen
const titleStyle = "text-[#ffff5b] drop-shadow-[0_6px_4px_#9a7414]";

// จอ Top 10 ตอนบูธว่าง (ไม่มีแมตช์ ไม่มีคนรอ) — ดึงเองจากตาราง leaderboard แล้วอัปเดตเมื่อมีทีมเล่นจบ
// หม้อมุมขวาล่างมีช่องไว้ใส่ QR เข้าเกม (ยังไม่ใส่ — รอลิงก์จริง)
export default function LeaderboardScreen() {
  // null = ยังโหลดครั้งแรกไม่เสร็จ (ยังไม่โชว์ *** กันกระพริบเป็นแถวว่างก่อนข้อมูลมา)
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const next = await getLeaderboard(LEADERBOARD_ROWS);
      if (active) setEntries(next);
    }

    load();
    const unsubscribe = subscribeToLeaderboard(load);
    function onVisible() {
      if (document.visibilityState === "visible") load();
    }
    document.addEventListener("visibilitychange", onVisible);
    const poll = setInterval(load, POLL_MS);

    return () => {
      active = false;
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(poll);
    };
  }, []);

  return (
    <>
      <div aria-hidden style={outerFrame} className={`absolute inset-12 ${pixelated}`} />

      <h1 className={`absolute top-[150px] left-[178px] ${titleSize} ${titleStyle}`}>
        Leaderboard
      </h1>

      <div className={`${columns} absolute top-[300px] left-[239px] ${headerSize}`}>
        <span>RANK</span>
        <span>TEAM</span>
        <span>SCORE</span>
      </div>
      <div aria-hidden className="absolute top-[368px] left-[178px] h-[6px] w-[1257px] bg-primary" />

      {entries && (
        <ol aria-label="Top 10 teams" className="absolute top-[406px] left-[239px] flex flex-col gap-[14px] text-head2">
          {leaderboardRows(entries).map((entry, i) => (
            <li key={entry?.id ?? `empty-${i}`} className={columns}>
              <span>{formatRank(i + 1)}</span>
              {/* ชื่อทีมยาวตัดด้วย … ไม่ให้ทับคอลัมน์คะแนน */}
              <span className="truncate pr-8">{entry ? entry.name : "***********"}</span>
              <span className="tracking-wider tabular-nums">{entry ? formatScore(entry.score) : "_______"}</span>
            </li>
          ))}
        </ol>
      )}

      {/* หม้อ (ภาพเดียวกับจอ battle) 128×160 ขยาย ×4 = 512×640 — ตัวหม้อจริงในภาพอยู่ที่ (7,51)–(122,154)
          design วาดตัวหม้อกว้าง ~410 (≈ ×3.6) → ×4 ใกล้สุดที่ยังเป็นจำนวนเต็ม (ภาพคม)
          วางให้ตัวหม้อชิดขวาล่างเลยกรอบออกไปแบบ design (ขอบขวาตัวหม้อ x ≈ 1880, ปลายขา y ≈ 1072) */}
      <div className="absolute top-[456px] left-[1392px] h-[640px] w-[512px]">
        <Image src="/battle/cauldron.png" alt="" fill unoptimized className={pixelated} />
        {/* ช่อง QR 169×169 กลางตัวหม้อ (ตำแหน่งตาม design) — ว่างไว้ก่อน ได้ลิงก์จริงแล้วใส่ QR ในกล่องนี้ได้เลย */}
        <div data-qr-slot className="absolute top-[434px] left-[298px] size-[169px] -translate-x-1/2 -translate-y-1/2" />
      </div>
    </>
  );
}
