"use client";

import { useEffect, useState } from "react";
import { useNow } from "@/app/battle/_hooks/useNow";
import { getServerClockOffset } from "@/lib/battle";
import {
  forceStart,
  getMasterState,
  pickView,
  startableTeamIds,
  subscribeToMaster,
  type MasterState,
  type MasterTeam,
  type MasterView,
} from "@/lib/master";
import PrepareScreen from "./PrepareScreen";

// สมองของจอ master: ดึงข้อมูล + ฟัง realtime แล้วเลือกจอเองตามสถานะ (กฎอยู่ใน pickView)
// forcedView มาจาก /master?view=... ใช้ตอนพัฒนาจอที่ยังไม่ถึงคิวในเกมจริง
export default function MasterScreen({ forcedView }: { forcedView: MasterView | null }) {
  const [state, setState] = useState<MasterState | null>(null);
  const [clockOffset, setClockOffset] = useState(0);
  // เดินทุก 1 วิ ให้เปลี่ยนจอตามเวลาได้เอง (หมดเวลา → winner → leaderboard) ไม่ต้องรอ DB เปลี่ยน
  const now = useNow();

  useEffect(() => {
    let active = true;
    let loading = false;
    let reloadAgain = false;

    // ระหว่าง battle ทุกหมัดอัปเดต teams → realtime ยิงถี่ ๆ
    // ถ้ากำลังโหลดอยู่ จดไว้แล้วโหลดซ้ำรอบเดียวหลังเสร็จ — กันยิงซ้อนและกันผลเก่ามาทับผลใหม่
    async function load() {
      if (loading) {
        reloadAgain = true;
        return;
      }
      loading = true;
      try {
        do {
          reloadAgain = false;
          const next = await getMasterState();
          if (active) setState(next);
        } while (reloadAgain && active);
      } catch (error) {
        // เน็ตหลุดแป๊บเดียว → จอค้างข้อมูลเดิมไว้ realtime รอบถัดไปจะโหลดใหม่เอง
        console.error("[MasterScreen] load failed:", error);
      } finally {
        // ถ้าไม่ปลดตรงนี้ โหลดพังครั้งเดียว loading ค้าง true → ทุก event หลังจากนั้นโดนข้ามหมด จอไม่อัปเดตจนกด refresh
        loading = false;
      }
    }

    load();
    // เวลาคอมที่ต่อ TV อาจไม่ตรงกับ server — เทียบครั้งเดียวตอนเปิดหน้า
    getServerClockOffset().then((offset) => {
      if (active) setClockOffset(offset);
    });
    const unsubscribe = subscribeToMaster(load);

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  if (!state || now === null) {
    return <p className="grid h-full place-items-center text-head2 text-muted">Loading...</p>;
  }

  const serverNow = now + clockOffset;
  const view = forcedView ?? pickView(state, serverNow);

  switch (view) {
    case "prepare":
      return (
        <PrepareScreen
          teams={state.waiting}
          canStart={startableTeamIds(state).length > 0}
          onStart={() => forceStart(state)}
        />
      );
    // TODO: ทำทีละ branch — feature/master-battle, master-winner, master-leaderboard
    case "battle":
    case "winner":
    case "leaderboard":
      return <ComingSoon view={view} lastMatch={state.lastMatch} serverNow={serverNow} />;
  }
}

// จอชั่วคราวจนกว่าจะทำจอจริง — โชว์เวลาที่เหลือกับคะแนน staff จะได้รู้ว่าจอไม่ได้ค้าง
function ComingSoon({ view, lastMatch, serverNow }: { view: MasterView; lastMatch: MasterTeam[]; serverNow: number }) {
  const endsAt = lastMatch[0]?.endsAt ?? null;
  const secondsLeft = endsAt === null ? 0 : Math.max(0, Math.ceil((endsAt - serverNow) / 1000));
  const clock = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-10">
      <p className="text-head2 text-muted">{view} screen — coming soon</p>
      {view === "battle" && <p className="text-head">Match in progress · {clock}</p>}
      {view !== "leaderboard" &&
        lastMatch.map((team) => (
          <p key={team.id} className="text-head2">
            {team.name}: {team.score}
          </p>
        ))}
    </div>
  );
}
