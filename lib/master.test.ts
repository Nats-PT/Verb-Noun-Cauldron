// ทดสอบกฎเลือกจอของ master — รันด้วย `npm test`
import { describe, expect, it } from "vitest";
import { FINISH_DELAY_MS } from "./game/rules";
import {
  addHit,
  cancellableTeamIds,
  addLastHit,
  matchStandings,
  pickView,
  setFinalScore,
  startableTeamIds,
  teamStandings,
  WINNER_SHOW_MS,
  type PlayerScores, type MasterState, type MasterTeam } from "./master";
import type { TeamId } from "./types";

function team(id: number, slot: TeamId, playerCount: number, endsAt: number | null = null): MasterTeam {
  return {
    id,
    name: `Team ${id}`,
    slot,
    status: endsAt === null ? "waiting" : "playing",
    score: 0,
    currentStage: 1,
    monsterHp: 200 * playerCount,
    teamSize: playerCount,
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

describe("ทีมที่โดนหยุดตอนกด Cancel match", () => {
  const endsAt = 1_000_000;

  it("หยุดได้เฉพาะทีมที่กำลังเล่นและยังไม่หมดเวลา", () => {
    const state: MasterState = { ...empty, lastMatch: [team(1, 1, 3, endsAt), team(2, 2, 2, endsAt)] };
    expect(cancellableTeamIds(state, endsAt - 1)).toEqual([1, 2]);
    // หมดเวลาแล้ว มือถือกำลังบันทึกผล — ห้ามยกเลิก
    expect(cancellableTeamIds(state, endsAt)).toEqual([]);
  });

  it("ไม่นับทีมที่บันทึกผลไปแล้ว (finished) หรือไม่มีแมตช์เลย", () => {
    const finished = { ...team(1, 1, 3, endsAt), status: "finished" as const };
    expect(cancellableTeamIds({ ...empty, lastMatch: [finished, team(2, 2, 2, endsAt)] }, 0)).toEqual([2]);
    expect(cancellableTeamIds(empty, 0)).toEqual([]);
  });
});

describe("MVP: คะแนนรายคน", () => {
  const hit = (playerId: string, points: number) => ({ playerId, playerName: playerId, points, verb: "eat", noun: "rice", damage: points });

  it("หมัดรวมเป็นยอดสำรอง แล้วคะแนนสุดท้ายจากมือถือมาแทน — ส่งซ้ำไม่นับเบิ้ล และหมัดที่มาทีหลังไม่บวกต่อ", () => {
    let scores: PlayerScores = {};
    scores = addHit(scores, 1, hit("ann", 40));
    scores = addHit(scores, 1, hit("ann", 35));
    expect(scores.ann).toMatchObject({ score: 75, hits: 2, final: false, teamId: 1 });

    const final = { playerId: "ann", playerName: "Ann", score: 100 };
    scores = setFinalScore(scores, 1, final);
    scores = setFinalScore(scores, 1, final);
    scores = addHit(scores, 1, hit("ann", 50));
    // คะแนนสุดท้ายไม่มีจำนวนหมัด → คงยอดที่นับไว้
    expect(scores.ann).toMatchObject({ name: "Ann", score: 100, hits: 2, final: true });
  });

  it("หมัดจากมือถือรุ่นเก่าที่ไม่มี playerId ไม่นับ", () => {
    expect(addHit({}, 1, { playerName: "Team", verb: "eat", noun: "rice", damage: 30 })).toEqual({});
  });

  function scoresOf(list: [string, number][]): PlayerScores {
    return Object.fromEntries(
      list.map(([name, score]) => [name, { playerId: name, name, teamId: 1, score, hits: 1, final: true }]),
    );
  }
  // จอ MVP (เดิมเป็นเทสของ topPlayers — ย้ายมาตรวจ matchStandings ที่ใช้แทน กรณีเดิมครบ)
  // ทีม 1 ไม่มีแถวผู้เล่นใน DB → ทุกคนมาจากคะแนนใน broadcast
  const ranks = (s: PlayerScores) => matchStandings([team(1, 1, 0, 1)], s).map((p) => [p.name, p.rank]);

  it("เรียงคะแนนมากไปน้อย คนที่ยังไม่ได้คะแนนอยู่ท้ายและยังไม่มีอันดับ", () => {
    expect(ranks(scoresOf([["a", 50], ["b", 90], ["c", 0], ["d", 70], ["e", 10]]))).toEqual([
      ["b", 1],
      ["d", 2],
      ["a", 3],
      ["e", 4],
      ["c", null],
    ]);
    expect(ranks(scoresOf([["a", 0]]))).toEqual([["a", null]]);
  });

  it("คะแนนเท่ากันได้อันดับร่วม (เรียงตามชื่อ) และอันดับถัดไปข้ามตามจำนวนคน", () => {
    expect(ranks(scoresOf([["a", 100], ["c", 90], ["b", 90], ["d", 80]]))).toEqual([
      ["a", 1],
      ["b", 2],
      ["c", 2],
      ["d", 4],
    ]);
    expect(ranks(scoresOf([["a", 100], ["b", 90], ["c", 80], ["d", 80], ["e", 70]]))).toEqual([
      ["a", 1],
      ["b", 2],
      ["c", 3],
      ["d", 3],
      ["e", 5],
    ]);
  });

  it("รวมทุกทีม: ผู้เล่นใน DB ที่ยังไม่มีคะแนนอยู่ในรายการด้วย และจำทีมของแต่ละคน", () => {
    const teams = [team(1, 1, 2, 1), team(2, 2, 1, 1)]; // p1-0, p1-1 | p2-0
    const scores = {
      "p2-0": { playerId: "p2-0", name: "Player 0", teamId: 2, score: 80, hits: 2, final: true },
      "p1-1": { playerId: "p1-1", name: "Player 1", teamId: 1, score: 40, hits: 1, final: true },
    };
    expect(matchStandings(teams, scores).map((p) => [p.playerId, p.teamId, p.score, p.rank])).toEqual([
      ["p2-0", 2, 80, 1],
      ["p1-1", 1, 40, 2],
      ["p1-0", 1, 0, null],
    ]);
  });
});

describe("จอ battle: หมัดล่าสุด", () => {
  const empty = { byTeam: {}, byPlayer: {} };
  const hit = (playerId: string | undefined, verb: string, weak?: boolean, kills?: number) => ({
    playerId,
    playerName: "Ann",
    verb,
    noun: "apple",
    damage: 40,
    weak,
    kills,
  });

  it("หมัดใหม่ทับหมัดเก่าของทีมและของคนนั้น คนอื่น/ทีมอื่นไม่โดน", () => {
    let last = addLastHit(empty, 1, hit("ann", "eat"), 1);
    last = addLastHit(last, 2, hit("bob", "read"), 2);
    last = addLastHit(last, 1, hit("ann", "cook"), 3);
    expect(last.byTeam[1]).toMatchObject({ key: 3, verb: "cook" });
    expect(last.byTeam[2]).toMatchObject({ key: 2, verb: "read" });
    expect(last.byPlayer.ann).toMatchObject({ key: 3, verb: "cook" });
    expect(last.byPlayer.bob).toMatchObject({ key: 2, verb: "read" });
  });

  it("เก็บข้อมูลที่จอต้องใช้ และ weak / kills ที่ไม่ได้ส่งมา (มือถือรุ่นเก่า) = ไม่ใช่", () => {
    expect(addLastHit(empty, 1, hit("ann", "eat"), 1).byTeam[1]).toEqual({
      key: 1,
      verb: "eat",
      noun: "apple",
      damage: 40,
      weak: false,
      knockout: false,
    });
    expect(addLastHit(empty, 1, hit("ann", "eat", true), 1).byTeam[1].weak).toBe(true);
    expect(addLastHit(empty, 1, hit("ann", "eat", false, 1), 1).byTeam[1].knockout).toBe(true);
  });

  it("หมัดที่ไม่มี playerId (มือถือรุ่นเก่า) ยังจุดฉากของทีม แต่ไม่ขึ้นแถวของใคร", () => {
    const last = addLastHit(empty, 1, hit(undefined, "eat"), 1);
    expect(last.byTeam[1].verb).toBe("eat");
    expect(last.byPlayer).toEqual({});
  });
});

describe("จอ battle: อันดับในทีม", () => {
  const t = team(1, 1, 3, 1_000_000); // Player 0, 1, 2 (เข้าเกมตามลำดับ)
  const score = (playerId: string, points: number, hits = 1, teamId = 1) => ({
    [playerId]: { playerId, name: playerId, teamId, score: points, hits, final: false },
  });

  it("เริ่มแมตช์: ทุกคนขึ้นด้วย 0 ตามลำดับเข้าเกม ยังไม่มีอันดับ", () => {
    expect(teamStandings(t, {}).map((r) => [r.name, r.hits, r.score, r.rank])).toEqual([
      ["Player 0", 0, 0, null],
      ["Player 1", 0, 0, null],
      ["Player 2", 0, 0, null],
    ]);
  });

  it("คะแนนมากขึ้นก่อน เท่ากันได้อันดับร่วมและคงลำดับเข้าเกม คนอื่นทีมไม่นับ", () => {
    const scores = { ...score("p1-2", 90, 2), ...score("p1-0", 40), ...score("p1-1", 40), ...score("p2-0", 500, 9, 2) };
    expect(teamStandings(t, scores).map((r) => [r.playerId, r.hits, r.score, r.rank])).toEqual([
      ["p1-2", 2, 90, 1],
      ["p1-0", 1, 40, 2],
      ["p1-1", 1, 40, 2],
    ]);
  });

  it("คนที่มีหมัดแต่ไม่อยู่ใน DB แล้ว ยังโชว์ด้วยชื่อจาก broadcast", () => {
    const rows = teamStandings(t, score("ghost", 30));
    expect(rows[0]).toMatchObject({ playerId: "ghost", name: "ghost", score: 30, rank: 1 });
    expect(rows).toHaveLength(4);
  });
});
