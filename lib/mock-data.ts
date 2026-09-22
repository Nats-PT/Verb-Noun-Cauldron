// ข้อมูลปลอมไว้ทำ layout ระหว่างรอ Supabase — ลบไฟล์นี้ทิ้งได้เมื่อต่อ DB จริงแล้ว
import type { LeaderboardEntry, Player } from "./types";

// สมมติว่าคนที่ถือมือถือเครื่องนี้คือ Guy (ของจริงจะมาจากหน้า login)
export const CURRENT_PLAYER_ID = "p1";

// ตั้งใจให้ทีมไม่เต็ม และมีชื่อยาว ๆ ไว้ทดสอบว่า layout ไม่พัง
export const mockPlayers: Player[] = [
  { id: "p1", name: "Guy", team: 1, isReady: false },
  { id: "p2", name: "Tung-o", team: 1, isReady: true },
  { id: "p3", name: "Tarwaan", team: 1, isReady: true },
  { id: "p4", name: "Veiw", team: 1, isReady: false },
  { id: "p5", name: "Jeje", team: 2, isReady: true },
  { id: "p6", name: "LUNEi3", team: 2, isReady: true },
  { id: "p7", name: "Frame", team: 2, isReady: true },
];

// ใส่เกิน 3 อันดับและไม่เรียงไว้ เพื่อเช็คว่า Leaderboard เรียงและตัดเหลือ 3 ให้เองได้
export const mockLeaderboard: LeaderboardEntry[] = [
  { id: "r1", name: "Team Blaze", score: 870 },
  { id: "r2", name: "Team Frost", score: 1250 },
  { id: "r3", name: "Team Shadow", score: 430 },
  { id: "r4", name: "Team Ember", score: 990 },
  { id: "r5", name: "Team Storm", score: 610 },
];
