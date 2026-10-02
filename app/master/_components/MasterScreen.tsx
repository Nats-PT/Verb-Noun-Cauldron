"use client";

import { useEffect, useState } from "react";
import { useNow } from "@/app/battle/_hooks/useNow";
import { getServerClockOffset } from "@/lib/battle";
import {
  addHit,
  cancellableTeamIds,
  cancelMatch,
  forceStart,
  getMasterState,
  pickView,
  resetAll,
  setFinalScore,
  startableTeamIds,
  subscribeToMaster,
  subscribeToPlayerScores,
  topPlayers,
  type MasterState,
  type MasterTeam,
  type MasterView,
  type PlayerScores,
} from "@/lib/master";
import ConfirmDialog from "./ConfirmDialog";
import PrepareScreen from "./PrepareScreen";
import WinnerScreen from "./WinnerScreen";

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

  useEffect(() => {
    if (!matchKey) return;
    const teamIds = matchKey.split(",").map((part) => Number(part.split("@")[0]));
    const update = (change: (byPlayer: PlayerScores) => PlayerScores) =>
      setScores((prev) => ({ key: matchKey, byPlayer: change(prev.key === matchKey ? prev.byPlayer : {}) }));

    return subscribeToPlayerScores(teamIds, {
      onHit: (teamId, hit) => update((byPlayer) => addHit(byPlayer, teamId, hit)),
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
    case "winner":
      screen = (
        <WinnerScreen
          teams={state.lastMatch}
          mvps={topPlayers(scores.key === matchKey ? scores.byPlayer : {})}
        />
      );
      break;
    // TODO: ทำทีละ branch — feature/master-battle, master-leaderboard
    case "battle":
    case "leaderboard":
      screen = (
        <ComingSoon
          view={view}
          lastMatch={state.lastMatch}
          serverNow={serverNow}
          canCancel={canCancel}
          onCancel={() => setDialog("cancel")}
        />
      );
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

// จอชั่วคราวจนกว่าจะทำจอจริง — โชว์เวลาที่เหลือกับคะแนน staff จะได้รู้ว่าจอไม่ได้ค้าง
type ComingSoonProps = {
  view: MasterView;
  lastMatch: MasterTeam[];
  serverNow: number;
  canCancel: boolean;
  onCancel: () => void;
};

function ComingSoon({ view, lastMatch, serverNow, canCancel, onCancel }: ComingSoonProps) {
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
      {/* ย้ายไปจอ Battle จริงตอนทำ feature/master-battle */}
      {view === "battle" && (
        <button
          type="button"
          onClick={onCancel}
          disabled={!canCancel}
          className="rounded-2xl border-4 border-danger px-10 py-3 text-body text-danger hover:bg-danger/10 disabled:border-border disabled:text-muted disabled:hover:bg-transparent"
        >
          Cancel match
        </button>
      )}
    </div>
  );
}
