// ทดสอบกฎเลือกจอของ master — รันด้วย `npm test`
import { describe, expect, it } from "vitest";
import { FINISH_DELAY_MS } from "./game/rules";
import {
  formatRank,
  formatScore,
  LEADERBOARD_ROWS,
  leaderboardRows,
  pickView,
  startableTeamIds,
  WINNER_SHOW_MS,
  type MasterState,
  type MasterTeam,
} from "./master";
import type { TeamId } from "./types";

function team(id: number, slot: TeamId, playerCount: number, endsAt: number | null = null): MasterTeam {
  return {
    id,
    name: `Team ${id}`,
    slot,
    status: endsAt === null ? "waiting" : "playing",
    score: 0,
    currentStage: 1,
    endsAt,
    players: Array.from({ length: playerCount }, (_, i) => ({
      id: `p${id}-${i}`,
      name: `Player ${i}`,
      team: slot,
      isReady: false,
    })),
  };
}

const empty: MasterState = { waiting: { 1: null, 2: null }, lastMatch: [] };

describe("เลือกจอ master", () => {
  const endsAt = 1_000_000;
  const match = [team(1, 1, 3, endsAt), team(2, 2, 2, endsAt)];

  it("ไม่มีใครเลย → leaderboard", () => {
    expect(pickView(empty, endsAt)).toBe("leaderboard");
  });

  it("มีคนรอใน lobby → prepare แต่ทีม waiting ที่ไม่มีคนไม่นับ", () => {
    expect(pickView({ ...empty, waiting: { 1: team(3, 1, 1), 2: null } }, 0)).toBe("prepare");
    expect(pickView({ ...empty, waiting: { 1: team(3, 1, 0), 2: team(4, 2, 0) } }, 0)).toBe("leaderboard");
  });

  it("แมตช์กำลังเล่นรวมช่วง TIME'S UP → battle แม้มีคนรอคิวรอบถัดไป", () => {
    const state: MasterState = { waiting: { 1: team(3, 1, 2), 2: null }, lastMatch: match };
    expect(pickView(state, endsAt - 60_000)).toBe("battle");
    expect(pickView(state, endsAt + FINISH_DELAY_MS - 1)).toBe("battle");
  });

  it("จบแล้ว → winner ค้าง WINNER_SHOW_MS แล้วไป prepare ถ้ามีคนรอ ไม่งั้น leaderboard", () => {
    const winnerStart = endsAt + FINISH_DELAY_MS;
    const winnerEnd = winnerStart + WINNER_SHOW_MS;
    const noQueue: MasterState = { ...empty, lastMatch: match };
    const queue: MasterState = { waiting: { 1: null, 2: team(3, 2, 1) }, lastMatch: match };

    expect(pickView(noQueue, winnerStart)).toBe("winner");
    expect(pickView(queue, winnerEnd - 1)).toBe("winner");
    expect(pickView(noQueue, winnerEnd)).toBe("leaderboard");
    expect(pickView(queue, winnerEnd)).toBe("prepare");
  });
});

describe("ทีมที่ได้เริ่มตอนกด Start", () => {
  it("ส่งเฉพาะทีมที่มีคน", () => {
    expect(startableTeamIds({ ...empty, waiting: { 1: team(5, 1, 2), 2: team(6, 2, 0) } })).toEqual([5]);
    expect(startableTeamIds({ ...empty, waiting: { 1: team(5, 1, 2), 2: team(6, 2, 4) } })).toEqual([5, 6]);
    expect(startableTeamIds(empty)).toEqual([]);
  });
});

describe("จอ leaderboard", () => {
  it("อันดับเขียนแบบหน้ามือถือ 1ST 2ND 3RD แล้ว TH", () => {
    expect([1, 2, 3, 4, 10, 11].map(formatRank)).toEqual(["1ST", "2ND", "3RD", "4TH", "10TH", "11TH"]);
  });

  it("คะแนน 6 หลักเติม 0 ข้างหน้า", () => {
    expect(formatScore(1000)).toBe("001000");
    expect(formatScore(0)).toBe("000000");
    expect(formatScore(100000)).toBe("100000");
  });

  it("เติมแถวว่างให้ครบ 10 แถว ลำดับตามที่ได้มา และตัดส่วนเกิน", () => {
    const entry = (id: number) => ({ id: String(id), name: `Team ${id}`, score: 100 - id });
    const rows = leaderboardRows([entry(1), entry(2)]);
    expect(rows).toHaveLength(LEADERBOARD_ROWS);
    expect(rows.slice(0, 2).map((r) => r?.id)).toEqual(["1", "2"]);
    expect(rows.slice(2).every((r) => r === null)).toBe(true);
    expect(leaderboardRows(Array.from({ length: 12 }, (_, i) => entry(i)))).toHaveLength(LEADERBOARD_ROWS);
  });
});
