import { startMatch, type CombatBroadcast, type PlayerScoreBroadcast } from "./battle";
import { FINISH_DELAY_MS } from "./game/rules";
import { createClient } from "./supabase/client";
import type { Player, TeamId } from "./types";

// ข้อมูลทั้งหมดที่จอ master (TV ในบูธ) ใช้ — ทุกจอดึงจากตาราง teams + players

export type MasterTeam = {
  id: number;
  name: string;
  slot: TeamId;
  status: "waiting" | "playing" | "finished";
  score: number;
  currentStage: number;
  monsterHp: number;
  // จำนวนคนตอนกด Start — HP เต็มของมอนสเตอร์คิดจากค่านี้ (monsterMaxHp) ไม่ใช่จำนวนคนที่เหลืออยู่ตอนนี้
  teamSize: number;
  endsAt: number | null; // ms — null = ยังไม่เคยเริ่ม
  players: Player[];
};

export type MasterState = {
  // ทีมที่รอเริ่มของแต่ละ slot — ต้องเลือกแบบเดียวกับ anonLogin (waiting ที่ใหม่สุด) ไม่งั้นจอโชว์คนละทีมกับที่ผู้เล่นเข้า
  waiting: Record<TeamId, MasterTeam | null>;
  // ทีมในแมตช์ล่าสุด (start_match ให้ ends_at เดียวกันทุกทีมที่เริ่มพร้อมกัน)
  lastMatch: MasterTeam[];
};

export const MASTER_VIEWS = ["prepare", "battle", "winner", "leaderboard"] as const;
export type MasterView = (typeof MASTER_VIEWS)[number];

// จอ winner ค้างกี่ ms ก่อนไปจอถัดไป
export const WINNER_SHOW_MS = 15_000;

export function isMasterView(value: unknown): value is MasterView {
  return MASTER_VIEWS.includes(value as MasterView);
}

// เลือกจอจากข้อมูลล้วน ๆ (ไม่ยุ่ง DB) จะได้เทสได้ — now ต้องเป็นเวลาของ server
// ดูจาก ends_at ไม่ใช่ status: ถ้าผู้เล่นปิดมือถือหมด ไม่มีใครเรียก record_match_result ทีมจะค้าง 'playing' ตลอดไป
export function pickView(state: MasterState, now: number): MasterView {
  const endsAt = state.lastMatch[0]?.endsAt ?? null;
  if (endsAt !== null) {
    // ช่วง TIME'S UP บนมือถือ (FINISH_DELAY_MS) ยังนับเป็นจอ battle
    if (now < endsAt + FINISH_DELAY_MS) return "battle";
    if (now < endsAt + FINISH_DELAY_MS + WINNER_SHOW_MS) return "winner";
  }
  return startableTeamIds(state).length > 0 ? "prepare" : "leaderboard";
}

// ทีมที่กด Start แล้วจะได้เริ่ม — ทีมที่ไม่มีคนไม่ต้องเริ่ม
export function startableTeamIds(state: MasterState): number[] {
  return [state.waiting[1], state.waiting[2]]
    .filter((team): team is MasterTeam => team !== null && team.players.length > 0)
    .map((team) => team.id);
}

// ทีมที่กด Cancel match แล้วจะโดนหยุด — เฉพาะแมตช์ที่ยังไม่หมดเวลา
// หลังหมดเวลามือถือกำลังบันทึกผลลง leaderboard อยู่ ไม่ให้ยกเลิกแล้ว (จะชนกับการบันทึก)
export function cancellableTeamIds(state: MasterState, now: number): number[] {
  return state.lastMatch
    .filter((team) => team.status === "playing" && team.endsAt !== null && now < team.endsAt)
    .map((team) => team.id);
}

type TeamRow = {
  id: number;
  name: string;
  slot: TeamId;
  status: MasterTeam["status"];
  score: number;
  current_stage: number;
  monster_hp: number;
  team_size: number;
  ends_at: string | null;
};

type PlayerRow = {
  id: string;
  name: string;
  team_id: number;
  is_ready: boolean;
};

const TEAM_COLUMNS = "id, name, slot, status, score, current_stage, monster_hp, team_size, ends_at";

export async function getMasterState(): Promise<MasterState> {
  const supabase = createClient();

  const [waitingRes, lastMatchRes] = await Promise.all([
    supabase
      .from("teams")
      .select(TEAM_COLUMNS)
      .eq("status", "waiting")
      .order("created_at", { ascending: false }),
    supabase
      .from("teams")
      .select(TEAM_COLUMNS)
      .not("ends_at", "is", null)
      .order("ends_at", { ascending: false })
      .limit(2),
  ]);

  if (waitingRes.error) console.error("[getMasterState] waiting teams:", waitingRes.error.message);
  if (lastMatchRes.error) console.error("[getMasterState] last match:", lastMatchRes.error.message);

  const waitingRows = (waitingRes.data ?? []) as TeamRow[];
  const waiting1 = waitingRows.find((t) => t.slot === 1) ?? null;
  const waiting2 = waitingRows.find((t) => t.slot === 2) ?? null;

  const lastMatchRows = (lastMatchRes.data ?? []) as TeamRow[];
  const lastMatchRowsSameRound = lastMatchRows.filter((t) => t.ends_at === lastMatchRows[0].ends_at);

  const teamIds = [waiting1, waiting2, ...lastMatchRowsSameRound]
    .filter((t): t is TeamRow => t !== null)
    .map((t) => t.id);

  let playerRows: PlayerRow[] = [];
  if (teamIds.length > 0) {
    // เรียงตามเวลาเข้า ชื่อบนจอจะได้ไม่สลับที่ทุกครั้งที่ข้อมูลอัปเดต
    const { data, error } = await supabase
      .from("players")
      .select("id, name, team_id, is_ready")
      .in("team_id", teamIds)
      .order("created_at", { ascending: true });

    if (error) console.error("[getMasterState] players:", error.message);
    playerRows = (data ?? []) as PlayerRow[];
  }

  function toTeam(row: TeamRow): MasterTeam {
    return {
      id: row.id,
      name: row.name,
      slot: row.slot,
      status: row.status,
      score: row.score,
      currentStage: row.current_stage,
      monsterHp: row.monster_hp,
      teamSize: row.team_size,
      endsAt: row.ends_at ? new Date(row.ends_at).getTime() : null,
      players: playerRows
        .filter((p) => p.team_id === row.id)
        .map((p) => ({ id: p.id, name: p.name, team: row.slot, isReady: p.is_ready })),
    };
  }

  return {
    waiting: {
      1: waiting1 && toTeam(waiting1),
      2: waiting2 && toTeam(waiting2),
    },
    lastMatch: lastMatchRowsSameRound.map(toTeam).sort((a, b) => a.slot - b.slot),
  };
}

// force start: ทุกคนที่อยู่ในทีม waiting ได้เริ่มหมด ไม่สนว่ากด Ready หรือยัง
// คืนข้อความ error (null = สำเร็จ) — lobby ของผู้เล่นจะเด้งไป /battle เองเมื่อทีมเป็น 'playing'
export async function forceStart(state: MasterState): Promise<string | null> {
  const ids = startableTeamIds(state);
  if (ids.length === 0) return "No players in the lobby yet";

  const result = await startMatch(ids);
  return result.success ? null : (result.error ?? "Failed to start the match");
}

// Cancel / Reset ทำผ่านตารางตรง ๆ ไม่มี RPC — ใช้ได้เพราะ RLS ตอนนี้เปิดให้ update teams / delete players
// ถ้าวันหนึ่งปิด RLS สองฟังก์ชันนี้จะพัง ต้องย้ายไปเป็น RPC
//
// ทีมที่โดนหยุดตั้ง ends_at = null:
// - มือถือใช้แยก "โดนยกเลิก" ออกจาก "จบปกติ" (จบปกติ ends_at ยังอยู่)
// - getMasterState ไม่นับเป็นแมตช์ล่าสุดอีก จอ master เลยกลับไป prepare / leaderboard เอง
// ทำทีมก่อนลบคน: record_hit หยุดรับหมัดทันที และมือถือได้ event ของทีมก่อนแถวตัวเองหาย

// หยุดแมตช์ที่กำลังเล่น → ผู้เล่นทีมนั้นเด้งไป login ไม่บันทึกลง leaderboard — ทีมที่ต่อคิวอยู่ไม่โดน
// กดซ้ำได้ถ้าครั้งแรกพังกลางทาง
export async function cancelMatch(state: MasterState, now: number): Promise<string | null> {
  const ids = cancellableTeamIds(state, now);
  if (ids.length === 0) return "No match to cancel";

  const supabase = createClient();

  // .select() คืนแถวที่แก้ได้จริง — ถ้า RLS ไม่ยอม Supabase จะแก้ 0 แถวเงียบ ๆ ไม่มี error
  const { data: stopped, error: teamsError } = await supabase
    .from("teams")
    .update({ status: "finished", ends_at: null })
    .in("id", ids)
    .select("id");
  if (teamsError || !stopped?.length) {
    console.error("[cancelMatch] teams:", teamsError?.message ?? "no rows updated (RLS?)");
    return "Failed to stop the match";
  }

  const { error: playersError } = await supabase.from("players").delete().in("team_id", ids);
  if (playersError) {
    console.error("[cancelMatch] players:", playersError.message);
    return "Match stopped, but failed to remove players — try again";
  }

  return null;
}

// ล้างทุกอย่าง: ทีมที่รอ/กำลังเล่นปิดหมด + ลบผู้เล่นทุกคน (รวมคนที่ค้างหน้าผลรอบก่อน) → ทุกเครื่องกลับ login
// leaderboard ไม่แตะ
export async function resetAll(): Promise<string | null> {
  const supabase = createClient();

  const { error: teamsError } = await supabase
    .from("teams")
    .update({ status: "finished", ends_at: null })
    .in("status", ["waiting", "playing"]);
  if (teamsError) {
    console.error("[resetAll] teams:", teamsError.message);
    return "Failed to reset teams";
  }

  // Supabase ไม่ยอมให้ delete โดยไม่มีเงื่อนไข — ใส่เงื่อนไขที่จริงทุกแถว
  const { error: playersError } = await supabase.from("players").delete().not("id", "is", null);
  if (playersError) {
    console.error("[resetAll] players:", playersError.message);
    return "Teams reset, but failed to remove players — try again";
  }

  return null;
}

// เรียก onUpdate ทุกครั้งที่ teams หรือ players เปลี่ยน — คืนฟังก์ชันยกเลิก
export function subscribeToMaster(onUpdate: () => void): () => void {
  const supabase = createClient();

  const channel = supabase
    .channel("master-realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, onUpdate)
    .on("postgres_changes", { event: "*", schema: "public", table: "players" }, onUpdate)
    .subscribe((status, err) => {
      // SUBSCRIBED มาทั้งตอนต่อครั้งแรกและทุกครั้งที่ต่อกลับหลังหลุด — realtime ไม่ส่ง event ที่พลาดไปย้อนหลัง
      // เลยต้องโหลดใหม่เอง ไม่งั้นคนที่เข้ามาระหว่างหลุดไม่ขึ้นจอจนกด refresh
      // (เจอจริง: หน้าต่าง master ถูกบังนาน ๆ → Chrome หน่วง timer → heartbeat ไม่ทัน → server ตัด)
      if (status === "SUBSCRIBED") onUpdate();
      // CLOSED = ตอนเราปิดเอง (ออกจากหน้า) ไม่ต้องเตือน
      else if (status !== "CLOSED") console.warn("[subscribeToMaster]", status, err?.message ?? "");
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

// ---------- จอ battle: หมัดล่าสุด + อันดับในทีม ----------
// หมัดมาจาก broadcast combat_hit เหมือน MVP — ไม่อยู่ใน DB รีเฟรชจอกลางแมตช์แล้วเริ่มนับใหม่จากหมัดถัดไป

export type LastHit = {
  // ผู้เรียกนับเลขเอง ไม่ซ้ำกันทุกหมัด — ใช้จุดภาพ hit / วลีบนแถว (คนเดิมทำคำเดิมได้ damage เท่าเดิมได้ เลยใช้ข้อมูลหมัดแทนไม่ได้)
  key: number;
  verb: string;
  noun: string;
  damage: number;
  weak: boolean;
  // หมัดนี้ล้มมอนสเตอร์ — ฉากไม่โชว์ภาพ hit / weak! เพราะเปลี่ยนเป็นตัวใหม่แล้ว (เหมือนมือถือ)
  knockout: boolean;
};

export type LastHits = {
  // team id → หมัดล่าสุดของทีม (จุดภาพ hit บนฉาก)
  byTeam: Record<number, LastHit>;
  // player id → หมัดล่าสุดของคนนั้น (วลีแวบขึ้นบนแถวผู้เล่น)
  byPlayer: Record<string, LastHit>;
};

export function addLastHit(last: LastHits, teamId: number, hit: CombatBroadcast, key: number): LastHits {
  const entry: LastHit = {
    key,
    verb: hit.verb,
    noun: hit.noun,
    damage: hit.damage,
    weak: hit.weak ?? false,
    knockout: (hit.kills ?? 0) > 0,
  };
  return {
    byTeam: { ...last.byTeam, [teamId]: entry },
    // มือถือรุ่นเก่าไม่ส่ง playerId — ยังจุดฉากได้ แต่ไม่รู้ว่าเป็นแถวของใคร
    byPlayer: hit.playerId ? { ...last.byPlayer, [hit.playerId]: entry } : last.byPlayer,
  };
}

export type Standing = {
  playerId: string;
  name: string;
  hits: number;
  score: number;
  // อันดับในทีมแบบอันดับร่วม (100, 90, 90 → 1, 2, 2) — null = ยังไม่ได้คะแนน
  rank: number | null;
};

// แถวผู้เล่นของทีมบนจอ battle เรียงคะแนนมากไปน้อย
// ชื่อจาก DB (ขึ้นครบตั้งแต่เริ่มด้วย 0) + คะแนนจาก broadcast — คะแนนเท่ากันคงลำดับเดิม (ลำดับเข้าเกม) แถวจะได้ไม่สลับไปมา
export function teamStandings(team: MasterTeam, scores: PlayerScores): Standing[] {
  const fromScores = (id: string) => ({ hits: scores[id]?.hits ?? 0, score: scores[id]?.score ?? 0 });
  const rows = [
    ...team.players.map((p) => ({ playerId: p.id, name: p.name, ...fromScores(p.id) })),
    // คนที่มีหมัดแต่ไม่อยู่ใน DB แล้ว (แถวถูกลบกลางแมตช์) ยังโชว์ด้วยชื่อจาก broadcast
    ...Object.values(scores)
      .filter((s) => s.teamId === team.id && !team.players.some((p) => p.id === s.playerId))
      .map((s) => ({ playerId: s.playerId, name: s.name, hits: s.hits, score: s.score })),
  ];
  // sort ของ JS คงลำดับเดิมเมื่อค่าเท่ากัน
  const sorted = rows.sort((a, b) => b.score - a.score);
  return sorted.map((row) => ({
    ...row,
    rank: row.score > 0 ? sorted.findIndex((other) => other.score === row.score) + 1 : null,
  }));
}

// ---------- MVP: คะแนนรายคนของแมตช์ล่าสุด ----------
// ไม่อยู่ใน DB — มือถือแต่ละเครื่องนับเองแล้ว broadcast มา (lib/battle.ts) จอ master เก็บไว้ในหน่วยความจำ
// รีเฟรชจอ master กลางแมตช์ → ยอดสำรองจากหมัดหาย แต่คะแนนสุดท้ายตอน TIME'S UP ยังมาครบ

export type PlayerScore = {
  playerId: string;
  name: string;
  teamId: number;
  score: number;
  // จำนวนวลีที่ทำถูก — นับจากหมัดที่จอ master ได้รับ (คะแนนสุดท้ายจากมือถือไม่มีค่านี้ จึงคงยอดที่นับไว้)
  hits: number;
  // true = ค่าสุดท้ายจากมือถือเครื่องนั้นเอง (เชื่อได้), false = ยอดที่จอ master รวมจากหมัดเอง (สำรอง)
  final: boolean;
};
export type PlayerScores = Record<string, PlayerScore>;

// ทุกหมัด: บวกเข้ายอดสำรอง เผื่อมือถือปิดไปก่อนส่งคะแนนสุดท้าย — ได้ค่าสุดท้ายแล้วไม่บวกต่อ
export function addHit(scores: PlayerScores, teamId: number, hit: CombatBroadcast): PlayerScores {
  if (!hit.playerId || hit.points === undefined) return scores;
  const prev = scores[hit.playerId];
  if (prev?.final) return scores;
  return {
    ...scores,
    [hit.playerId]: {
      playerId: hit.playerId,
      name: hit.playerName,
      teamId,
      score: (prev?.score ?? 0) + hit.points,
      hits: (prev?.hits ?? 0) + 1,
      final: false,
    },
  };
}

// คะแนนสุดท้ายจากมือถือ = ค่าจริง แทนยอดสำรอง (มือถือส่งซ้ำ 3 ครั้ง ได้ค่าเดิม ไม่นับเบิ้ล)
export function setFinalScore(scores: PlayerScores, teamId: number, final: PlayerScoreBroadcast): PlayerScores {
  return {
    ...scores,
    [final.playerId]: {
      playerId: final.playerId,
      name: final.playerName,
      teamId,
      score: final.score,
      hits: scores[final.playerId]?.hits ?? 0,
      final: true,
    },
  };
}

export type MatchStanding = Standing & { teamId: number };

// จอ MVP: ทุกคนในรอบ (ทุกทีมรวมกัน) เรียงคะแนนมากไปน้อย — 3 คนแรกขึ้นแท่น ทั้งหมดอยู่ในตาราง
// ชื่อจาก DB (คนที่ได้ 0 ก็อยู่ด้วย ไว้ท้ายตาราง) + คะแนนจาก broadcast เหมือน teamStandings
// อันดับร่วม: 100, 90, 90, 80 → 1, 2, 2, 4 · คะแนนเท่ากันเรียงตามชื่อ (ลำดับคงที่) · 0 คะแนน = ยังไม่มีอันดับ (null)
export function matchStandings(teams: MasterTeam[], scores: PlayerScores): MatchStanding[] {
  const rows = teams.flatMap((team) => teamStandings(team, scores).map((row) => ({ ...row, teamId: team.id })));
  const sorted = rows.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return sorted.map((row) => ({
    ...row,
    rank: row.score > 0 ? sorted.findIndex((other) => other.score === row.score) + 1 : null,
  }));
}

// ฟังหมัด + คะแนนสุดท้ายของทุกทีมในแมตช์ — channel เดียวกับที่มือถือใช้ (team:<id>:battle) — คืนฟังก์ชันยกเลิก
export function subscribeToPlayerScores(
  teamIds: number[],
  handlers: {
    onHit: (teamId: number, hit: CombatBroadcast) => void;
    onFinal: (teamId: number, final: PlayerScoreBroadcast) => void;
  },
): () => void {
  const supabase = createClient();

  const channels = teamIds.map((teamId) =>
    supabase
      .channel(`team:${teamId}:battle`)
      .on("broadcast", { event: "combat_hit" }, ({ payload }) => handlers.onHit(teamId, payload as CombatBroadcast))
      .on("broadcast", { event: "player_score" }, ({ payload }) =>
        handlers.onFinal(teamId, payload as PlayerScoreBroadcast),
      )
      .subscribe(),
  );

  return () => {
    channels.forEach((channel) => supabase.removeChannel(channel));
  };
}
