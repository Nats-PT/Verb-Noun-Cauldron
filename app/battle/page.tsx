"use client";

import { Feedback, PointerActivationConstraints, PointerSensor } from "@dnd-kit/dom";
import { DragDropProvider } from "@dnd-kit/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import MonsterStage from "@/components/MonsterStage";
import {
  broadcastCombatHit,
  getMyMatchStatus,
  getServerClockOffset,
  recordHit,
  subscribeToBattleTeam,
  type BattleTeam,
} from "@/lib/battle";
import { resolveDrop, swapCards } from "@/lib/game/engine";
import { createMockBattle, createMockEndsAt } from "@/lib/game/mock-battle";
import { MONSTERS, monsterMaxHp } from "@/lib/game/monsters";
import { elapsedMs, FINISH_DELAY_MS, isTimeUp } from "@/lib/game/rules";
import type { Word } from "@/lib/game/types";
import { WORD_PAIRS, WORD_POOL } from "@/lib/game/words";
import { recordMatchResult } from "@/lib/leaderboard";
import BattleHeader from "./_components/BattleHeader";
import Cauldron, { POT_ID, sinkHeldCard, sinkIntoPot } from "./_components/Cauldron";
import ComboLabel, { type ComboFlash } from "./_components/ComboLabel";
import Timer from "./_components/Timer";
import TimeUpBanner from "./_components/TimeUpBanner";
import WordColumn from "./_components/WordColumn";
import { useNow } from "./_hooks/useNow";
import { useTimePassed } from "./_hooks/useTimePassed";

// ระยะห่างอิงจาก redline ของ art (Figma 390×844 = พื้นที่ใช้งาน 797 หลังหักแถบสถานะ 47)
// แนวนอนใช้ตาม Figma ตรง ๆ (ขอบ 18) — แนวตั้ง Safari เหลือแค่ ~664 จึงบีบตามความสูงจอ:
// ขอบล่าง 40 ที่จอ 797 → 16 ที่จอ 664 (เส้นตรงระหว่าง 2 จุดนี้)
// - h-svh: สูงเท่าพื้นที่ตอนแถบ URL ขยายเต็ม จะไม่มีอะไรจมใต้แถบ
// - safe area: ถ้าเครื่องมีรอยบาก / แถบ Home ที่กว้างกว่า ใช้ค่านั้นแทน
const safeArea =
  "pt-[max(12px,env(safe-area-inset-top))] pb-[max(clamp(16px,calc(18svh_-_103px),40px),env(safe-area-inset-bottom))] " +
  "pl-[max(18px,env(safe-area-inset-left))] pr-[max(18px,env(safe-area-inset-right))]";

const FLASH_MS = 900;
// มอนสเตอร์เป็นภาพ hit (ตัวแดง) นานเท่านี้หลังโดนตี — โดนรัว ๆ จะนับใหม่ทุกครั้ง ค้างแดงไม่กระพริบ
const HIT_MS = 300;

// ฉาก: กว้างเต็มจอเหลือขอบ 18 (Figma 353) — สูง 265 ที่จอ 797 → 240 ที่จอ 664 (เส้นตรง) ไม่ต่ำกว่า 180
// และไม่เกิน (จอ − 412) = สูงสุดที่การ์ดยังได้ ≥52px (วัดจริง) จอเตี้ยกว่า 664 ฉากจึงหดเร็วขึ้นแทนการ์ด
// จอเตี้ยฉากจะเตี้ยลงแต่ยังกว้างเต็ม: ภาพขยายเต็มความกว้างแล้วตัดส่วนบน (ป่า) ออกแทน (ดู MonsterStage)
// แต่ตัดได้ไม่เกิน 25px (เท่าที่จอ 664) — เตี้ยกว่านั้นฉากแคบลงตามสัดส่วน 4:3 แทน หัวมอนสเตอร์ตัวสูง (Dragon) จะไม่หาย
const sceneSize =
  "[--scene-h:clamp(180px,min(calc(18.8svh_+_115px),calc(100svh_-_412px)),265px)] " +
  "mx-auto h-[var(--scene-h)] w-[min(100%,calc((var(--scene-h)_+_25px)*4/3))]";

export default function BattlePage() {
  const [team, setTeam] = useState<BattleTeam | null>(null);
  const [endsAt, setEndsAt] = useState(createMockEndsAt);
  const [battle, setBattle] = useState(createMockBattle);
  const [flash, setFlash] = useState<ComboFlash | null>(null);
  // เวลาที่โดนตีล่าสุด (null = ไม่ได้โดนตีอยู่) — ค่าใหม่ทุกครั้งที่ตี effect ด้านล่างจึงเริ่มนับใหม่
  const [hitAt, setHitAt] = useState<number | null>(null);
  const now = useNow();
  const router = useRouter();
  const matchRecordedRef = useRef(false);

  // หมดเวลา → ล็อกกระดาน + ป้าย TIME'S UP; อีก FINISH_DELAY_MS ต่อมา → ไปหน้าสรุป
  const timeUp = useTimePassed(endsAt);
  const finished = useTimePassed(endsAt + FINISH_DELAY_MS);

  // ดึงข้อมูลทีมจาก Supabase และเทียบเวลานาฬิกากับ server
  // ถ้าเปิดเล่นตรง ๆ (ไม่ได้เข้าห้อง lobby) หรือทีมยังไม่ถูกกด Start จะ fallback ใช้ mock ต่อไปโดยอัตโนมัติ
  // ทีมที่ยังรออยู่ (waiting) มี monster_hp = 0 และไม่มี ends_at — ถ้าเอามาใช้ มอนสเตอร์จะเริ่มด้วยเลือด 0
  // ยกเว้นโดน Cancel / Reset ไปแล้ว (กดตอนหน้านี้ยังโหลดไม่เสร็จ หรือเครื่องโหลดหน้าใหม่ตอนตื่น) → กลับ login
  // ไม่งั้นจะตกไปเล่น mock ต่อคนเดียวไม่รู้จบ
  useEffect(() => {
    let isMounted = true;
    async function initBattle() {
      try {
        const [status, clockOffset] = await Promise.all([
          getMyMatchStatus(),
          getServerClockOffset(),
        ]);
        if (!isMounted) return;
        if (status.kind === "removed") {
          router.replace("/login");
          return;
        }
        if (status.kind !== "playing") return;
        const myTeam = status.team;

        setTeam(myTeam);

        if (myTeam.endsAt) {
          const serverEndMs = new Date(myTeam.endsAt).getTime();
          setEndsAt(serverEndMs - clockOffset);
        }

        const monsterIndex = Math.max(0, Math.min(MONSTERS.length - 1, myTeam.currentStage - 1));
        setBattle((b) => ({
          ...b,
          teamSize: myTeam.teamSize,
          monsterIndex,
          monsterHp: myTeam.monsterHp,
          score: myTeam.score,
        }));
      } catch (err) {
        console.warn("[BattlePage] Using mock battle state:", err);
      }
    }

    initBattle();
    return () => {
      isMounted = false;
    };
  }, [router]);

  // ซิงค์ HP, ด่าน, และคะแนนของทีมแบบ Realtime เมื่อเพื่อนในทีมตีโดน
  // + staff กด Cancel match / Reset all บนจอ master → ทีมถูกตั้ง ends_at = null → กลับหน้า login
  //   (จบเกมปกติ ends_at ยังอยู่ จึงไม่โดนเด้ง)
  useEffect(() => {
    if (!team?.id) return;

    function applyTeam(updatedTeam: BattleTeam) {
      setTeam(updatedTeam);
      const monsterIndex = Math.max(0, Math.min(MONSTERS.length - 1, updatedTeam.currentStage - 1));
      setBattle((b) => ({
        ...b,
        score: updatedTeam.score,
        monsterIndex,
        monsterHp: updatedTeam.monsterHp,
      }));
    }

    const unsubscribe = subscribeToBattleTeam(team.id, {
      onTeamChange: (updatedTeam) => {
        if (updatedTeam.endsAt === null) {
          router.replace("/login");
          return;
        }
        applyTeam(updatedTeam);
      },
      onCombatHit: () => {
        // เพื่อนร่วมทีมตีโดน → มอนสเตอร์ขึ้นภาพ hit (ตัวแดง) ชั่วขณะ
        setHitAt(Date.now());
      },
    });

    // พับจอ / สลับแอปแล้ว realtime ไม่ส่ง event ที่พลาดไปย้อนหลัง → เปิดจอกลับมาถาม DB ใหม่
    // โดน Cancel ระหว่างนั้น → กลับหน้า login, ยังเล่นอยู่ → อัปเดต HP / คะแนนที่พลาดไป
    async function onVisible() {
      if (document.visibilityState !== "visible") return;
      const status = await getMyMatchStatus();
      if (status.kind === "removed") router.replace("/login");
      else if (status.kind === "playing") applyTeam(status.team);
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [team?.id, router]);

  // เมื่อหมดเวลา + 3 วิ บันทึกคะแนนเข้า leaderboard ผ่าน atomic RPC
  // ถาม DB ก่อน: record_match_result ไม่เช็คว่าทีมยังเล่นอยู่ไหม — มือถือที่พับจอไว้ตอนโดน Cancel
  // จะตื่นมาบันทึกทีมที่ยกเลิกไปแล้วลง leaderboard (เน็ตพังจนถามไม่ได้ = บันทึกตามเดิม)
  useEffect(() => {
    if (finished && team?.id && !matchRecordedRef.current) {
      matchRecordedRef.current = true;
      const teamId = team.id;
      getMyMatchStatus()
        .then((status) => {
          if (status.kind === "removed") {
            router.replace("/login");
            return;
          }
          // finished = เพื่อนร่วมทีมบันทึกไปแล้ว
          if (status.kind === "finished") return;
          return recordMatchResult({ teamId });
        })
        .catch((err) => {
          console.error("[BattlePage] Failed to record match result:", err);
        });
    }
  }, [finished, team?.id, router]);

  // ผลการผสมโชว์แป๊บเดียว แล้วกลับไปแสดงคำในหม้อตามปกติ
  useEffect(() => {
    if (!flash) return;
    const timeout = setTimeout(() => setFlash(null), FLASH_MS);
    return () => clearTimeout(timeout);
  }, [flash]);

  // โหลดภาพมอนสเตอร์ทุกตัว (ท่ายืน + ตอนโดนตี รวม ~40KB) ไว้ตั้งแต่เปิดหน้า
  // ไม่งั้นตอนล้มตัวเก่า ฉากของตัวใหม่อาจว่างแป๊บหนึ่งระหว่างโหลด (เห็นชัดบน Wi-Fi ช้า ๆ ในงาน)
  useEffect(() => {
    for (const monster of MONSTERS) {
      for (const src of [monster.scene, monster.hitScene]) new window.Image().src = src;
    }
  }, []);

  useEffect(() => {
    if (hitAt === null) return;
    const timeout = setTimeout(() => setHitAt(null), HIT_MS);
    return () => clearTimeout(timeout);
  }, [hitAt]);

  // คืน true ถ้าตีโดน (การ์ดที่ลากมาถูกใช้ไปแล้ว)
  function dropInPot(word: Word): boolean {
    const outcome = resolveDrop(battle, word, {
      pairs: WORD_PAIRS,
      pool: WORD_POOL,
      rng: Math.random,
      // ใช้เวลา ณ ตอนปล่อยจริง ไม่ใช่ now ที่เดินทีละวิ — ปล่อยตอนจุดอ่อนเพิ่งเปลี่ยนจะได้นับถูก
      elapsedMs: elapsedMs(endsAt, Date.now()),
    });
    setBattle(outcome.state);

    if (outcome.result === "hit") {
      setFlash({
        kind: "hit",
        verb: outcome.verb.text,
        noun: outcome.noun.text,
        damage: outcome.damage,
        // หมัดที่ล้มมอนสเตอร์ไม่โชว์ weak! — ฉากเปลี่ยนเป็นตัวใหม่แล้ว จะดูเหมือนตัวใหม่แพ้คำนี้
        weak: outcome.weak && outcome.kills === 0,
      });
      // หมัดที่ล้มมอนสเตอร์ไม่โชว์ภาพ hit ด้วยเหตุผลเดียวกัน — ตัวใหม่โผล่มาในท่ายืนปกติ
      setHitAt(outcome.kills === 0 ? Date.now() : null);

      // ส่งผลการตีขึ้น Realtime Broadcast (~20ms) และบันทึกลง Database RPC
      if (team?.id) {
        broadcastCombatHit(team.id, {
          playerName: team.name,
          verb: outcome.verb.text,
          noun: outcome.noun.text,
          damage: outcome.damage,
          weak: outcome.weak,
        }).catch((err) => console.error("[broadcastCombatHit]", err));

        recordHit(team.id, outcome.damage).catch((err) =>
          console.error("[recordHit]", err)
        );
      }
    } else if (outcome.result === "miss") {
      // การ์ดเด้งกลับที่เดิมทั้ง 2 ใบ: ใบที่เพิ่งลากกลับเองเพราะไม่ได้ย้ายออกจากกระดาน ใบที่ค้างอยู่ถูกล้างใน resolveDrop
      setFlash({ kind: "miss", verb: outcome.verb.text, noun: outcome.noun.text });
    } else {
      setFlash(null);
    }
    return outcome.result === "hit";
  }

  const monster = MONSTERS[battle.monsterIndex];
  // หมดเวลาแล้วคำที่ค้างในหม้อหายไป (ไม่แก้ state — แค่ไม่แสดง)
  const held = timeUp ? null : battle.held;
  const heldId = held?.id ?? null;

  // นับถอยหลัง 3 → 2 → 1 ตาม useNow (ก่อนนาฬิกาเดินรอบแรกหลังหมดเวลา ค่าอาจเกิน 3 จึงกันไว้)
  const secondsLeft = finished
    ? null
    : Math.min(FINISH_DELAY_MS / 1000, Math.max(1, Math.ceil((endsAt + FINISH_DELAY_MS - (now ?? 0)) / 1000)));

  return (
    <DragDropProvider
      // ค่าเริ่มต้นบนจอสัมผัสต้องกดค้าง 250ms ก่อนถึงจะลากได้ (กันลากพลาดตอนเลื่อนหน้า)
      // หน้านี้ล็อกไม่ให้เลื่อนอยู่แล้ว จึงให้เริ่มลากทันทีที่นิ้วขยับ 5px — ปัดเร็ว ๆ ก็ติด
      sensors={(defaults) => [
        ...defaults.filter((sensor) => sensor !== PointerSensor),
        PointerSensor.configure({
          activationConstraints: [new PointerActivationConstraints.Distance({ value: 5 })],
        }),
      ]}
      onDragEnd={(event, manager) => {
        // อนิเมชันตอนปล่อยการ์ด: ปกติการ์ดบินกลับช่องเดิม (ค่า undefined = ใช้ค่าเริ่มต้นของ dnd-kit)
        // dnd-kit เรียก onDragEnd ก่อนเริ่มอนิเมชัน จึงตั้งค่าใหม่ทุกครั้งที่ปล่อยได้ตรงนี้
        const feedback = manager.registry.plugins.get(Feedback);
        if (feedback) feedback.dropAnimation = undefined;

        const { source, target } = event.operation;
        const word = source?.data?.word as Word | undefined;
        if (event.canceled || !word || !target) return;
        // ลากค้างไว้ตอนหมดเวลาแล้วค่อยปล่อย → ไม่นับ (เช็กเวลาจริงตอนปล่อย ไม่รอ timeUp)
        if (isTimeUp(endsAt, Date.now())) return;

        if (target.id === POT_ID) {
          // ตีโดน → การ์ดถูกดูดลงหม้อ (sinkIntoPot เล่นอนิเมชันกับสำเนา) ไม่บินกลับช่องเดิม
          // ถ้าบินกลับ dnd-kit จะค้างร่างเงาของการ์ดไว้ในคอลัมน์ ~250ms ข้างการ์ดใบใหม่
          // คอลัมน์ (ที่หุ้มการ์ดพอดี) จะยืดเป็น 5 ใบแล้วหดกลับ
          if (dropInPot(word)) {
            // ทั้ง 2 ใบลงหม้อพร้อมกัน: ใบที่ลากมา + ใบที่ค้างอยู่ข้างหม้อ
            sinkIntoPot(source?.element);
            sinkHeldCard();
            if (feedback) feedback.dropAnimation = null;
          }
          return;
        }
        // วางทับการ์ดอีกใบ (WordCard รับเฉพาะชนิดเดียวกันอยู่แล้ว) → สลับที่
        const other = target.data?.word as Word | undefined;
        if (other) setBattle((b) => swapCards(b, word, other));
      }}
    >
      <main className={`mx-auto flex h-svh w-full max-w-md flex-col gap-2 ${safeArea}`}>
        <BattleHeader score={battle.score} correct={battle.correct} wrong={battle.wrong} />

        {/* กล่อง relative ครอบไว้ให้ป้าย TIME'S UP วางทับฉากได้ โดยไม่ต้องแก้ MonsterStage (จอ master ใช้ร่วม)
            กรอบชมพูมากับ MonsterStage */}
        <div className={`relative shrink-0 ${sceneSize}`}>
          <MonsterStage
            monster={monster}
            hp={battle.monsterHp}
            maxHp={monsterMaxHp(monster, battle.teamSize)}
            hit={hitAt !== null}
            weakHit={flash?.kind === "hit" && flash.weak}
            className="size-full"
          />
          {timeUp && (
            <TimeUpBanner
              score={battle.score}
              correct={battle.correct}
              wrong={battle.wrong}
              secondsLeft={secondsLeft}
            />
          )}
        </div>

        <Cauldron heldWord={held} locked={timeUp} onReturnWord={() => setBattle((b) => ({ ...b, held: null }))}>
          {/* บรรทัดเดียวใต้ฉาก: ข้อความผสมคำกลางจอ + เวลาชิดขวา — ประหยัดที่ หม้อกับการ์ดเลื่อนขึ้นได้
              3 ช่อง: ช่องซ้ายว่างไว้ถ่วงให้ข้อความอยู่กลางจอพอดี */}
          <div className="grid w-full grid-cols-[1fr_minmax(0,auto)_1fr] items-center gap-2">
            <span aria-hidden />
            <ComboLabel heldWord={held} flash={flash} />
            <div className="justify-self-end">
              <Timer endsAt={endsAt} now={now} />
            </div>
          </div>
        </Cauldron>

        {/* Figma: ขอบซ้ายขวา 18px (มาจาก main) ช่องกลาง 83px — z-10 ทับครึ่งล่างของหม้อ (ช่องกลางเห็นขาหม้อ) */}
        <div className="relative z-10 grid min-h-0 flex-1 grid-cols-2 gap-x-[83px]">
          <WordColumn label="Verbs" words={battle.verbs} heldId={heldId} locked={timeUp} />
          <WordColumn label="Nouns" words={battle.nouns} heldId={heldId} locked={timeUp} />
        </div>
      </main>
    </DragDropProvider>
  );
}
