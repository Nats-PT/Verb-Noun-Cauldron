"use client";

import { useEffect, useRef, useState } from "react";
import { useNow } from "@/app/battle/_hooks/useNow";
import { getServerClockOffset } from "@/lib/battle";
import {
  addHit,
  addLastHit,
  cancellableTeamIds,
  cancelMatch,
  forceStart,
  getMasterState,
  matchStandings,
  pickView,
  resetAll,
  setFinalScore,
  startableTeamIds,
  subscribeToMaster,
  subscribeToPlayerScores,
  type LastHits,
  type MasterState,
  type MasterView,
  type PlayerScores,
} from "@/lib/master";
import BattleScreen from "./BattleScreen";
import ConfirmDialog from "./ConfirmDialog";
import PrepareScreen from "./PrepareScreen";
import MvpScreen from "./MvpScreen";

type Dialog = "cancel" | "reset" | null;

// โหลดข้อมูลใหม่เองทุกเท่านี้ ถึง realtime จะเงียบ (1 รอบ = 3 query เบา ๆ)
const POLL_MS = 10_000;

// สมองของจอ master: ดึงข้อมูล + ฟัง realtime แล้วเลือกจอเองตามสถานะ (กฎอยู่ใน pickView)
// forcedView มาจาก /master?view=... ใช้ตอนพัฒนาจอที่ยังไม่ถึงคิวในเกมจริง
export default function MasterScreen({ forcedView }: { forcedView: MasterView | null }) {
  const [state, setState] = useState<MasterState | null>(null);
  const [clockOffset, setClockOffset] = useState(0);
  const [dialog, setDialog] = useState<Dialog>(null);
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

    // กันพลาดเผื่อ realtime เงียบไปโดยไม่รู้ตัว (จอ TV เปิดทั้งวัน): หน้าต่างกลับมาให้เห็น → โหลดใหม่ทันที
    // + โหลดใหม่ทุก POLL_MS — ช้าสุดจอตามทันใน 10 วิ แทนที่จะค้างจนมีคนกด refresh
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

  // คะแนนรายคน (MVP) ของแมตช์ล่าสุด จาก broadcast ของมือถือ — ฟังตั้งแต่เริ่มแมตช์ เพื่อเก็บทุกหมัดไว้สำรอง
  // ผูกกับ matchKey: เริ่มแมตช์ใหม่ = ชุดใหม่ ของแมตช์เก่าถูกทิ้งเอง (ไม่ต้อง setState ใน effect เพื่อล้าง)
  const matchKey = state?.lastMatch.map((team) => `${team.id}@${team.endsAt}`).join(",") ?? "";
  const [scores, setScores] = useState<{ key: string; byPlayer: PlayerScores }>({ key: "", byPlayer: {} });
  // หมัดล่าสุดของแต่ละทีม / แต่ละคนบนจอ battle — มาจาก broadcast เดียวกัน ผูกกับ matchKey แบบเดียวกัน
  const [lastHits, setLastHits] = useState<{ key: string } & LastHits>({ key: "", byTeam: {}, byPlayer: {} });
  // เลขประจำหมัด ไว้จุดภาพ hit บนฉาก / วลีบนแถวผู้เล่น — นับขึ้นเรื่อย ๆ ไม่ซ้ำ
  const hitCounter = useRef(0);

  useEffect(() => {
    if (!matchKey) return;
    const teamIds = matchKey.split(",").map((part) => Number(part.split("@")[0]));
    const update = (change: (byPlayer: PlayerScores) => PlayerScores) =>
      setScores((prev) => ({ key: matchKey, byPlayer: change(prev.key === matchKey ? prev.byPlayer : {}) }));

    return subscribeToPlayerScores(teamIds, {
      onHit: (teamId, hit) => {
        update((byPlayer) => addHit(byPlayer, teamId, hit));
        const key = ++hitCounter.current;
        setLastHits((prev) => ({
          key: matchKey,
          ...addLastHit(prev.key === matchKey ? prev : { byTeam: {}, byPlayer: {} }, teamId, hit, key),
        }));
      },
      onFinal: (teamId, final) => update((byPlayer) => setFinalScore(byPlayer, teamId, final)),
    });
  }, [matchKey]);

  if (!state || now === null) {
    return <p className="grid h-full place-items-center text-head2 text-muted">Loading...</p>;
  }

  const serverNow = now + clockOffset;
  const view = forcedView ?? pickView(state, serverNow);

  const canCancel = cancellableTeamIds(state, serverNow).length > 0;

  let screen: React.ReactNode;
  switch (view) {
    case "prepare":
      screen = (
        <PrepareScreen
          teams={state.waiting}
          canStart={startableTeamIds(state).length > 0}
          onStart={() => forceStart(state)}
        />
      );
      break;
    // จอหลังหมดเวลา = MVP ของรอบ (ไม่บอกทีมแพ้/ชนะ — มือถือบอกแล้ว) ชื่อจอยังเป็น "winner" ตาม pickView
    case "winner":
      screen = (
        <MvpScreen standings={matchStandings(state.lastMatch, scores.key === matchKey ? scores.byPlayer : {})} />
      );
      break;
    case "battle":
      screen = (
        <BattleScreen
          teams={state.lastMatch}
          scores={scores.key === matchKey ? scores.byPlayer : {}}
          lastHits={lastHits.key === matchKey ? lastHits : { byTeam: {}, byPlayer: {} }}
          serverNow={serverNow}
          canCancel={canCancel}
          onCancel={() => setDialog("cancel")}
        />
      );
      break;
    // TODO: feature/master-leaderboard
    case "leaderboard":
      screen = <ComingSoon />;
      break;
  }

  return (
    <>
      {screen}

      {/* ปุ่มฉุกเฉินของ staff — อยู่ทุกจอ ตัวเล็กสีจางในขอบเวที คนดูจะได้ไม่สนใจ */}
      <button
        type="button"
        onClick={() => setDialog("reset")}
        className="absolute right-12 top-0 z-40 h-12 text-score text-muted hover:text-foreground"
      >
        Reset all
      </button>

      {/* onConfirm อ่าน state / เวลา ณ ตอนกด ไม่ใช่ตอนเปิดกล่อง */}
      {dialog === "cancel" && (
        <ConfirmDialog
          title="Stop this match?"
          message="Players go back to the login screen. Nothing is saved to the leaderboard. Players waiting for the next round stay in the lobby."
          backLabel="Keep playing"
          confirmLabel="Stop match"
          onConfirm={() => cancelMatch(state, serverNow)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "reset" && (
        <ConfirmDialog
          title="Reset everything?"
          message="Everyone (lobby and match) goes back to the login screen. The leaderboard is kept."
          backLabel="Back"
          confirmLabel="Reset everything"
          onConfirm={resetAll}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  );
}

// จอชั่วคราวจนกว่าจะทำจอ leaderboard จริง
function ComingSoon() {
  return <p className="grid h-full place-items-center text-head2 text-muted">leaderboard screen — coming soon</p>;
}
