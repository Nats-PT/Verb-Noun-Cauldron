import { WEAKNESS_ROTATE_MS } from "./rules";
import type { Monster, NounCategory } from "./types";

// ภาพฉาก + มอนสเตอร์ของแต่ละตัว ขนาด 120×90 ทุกไฟล์
const scenes = (id: string) => ({
  scene: `/battle/monsters/${id}-move.gif`,
  hitScene: `/battle/monsters/${id}-hit.png`,
});

// ลำดับมอนสเตอร์ที่ทีมต้องตี — HP เป็นค่าตั้งต้น ต้องปรับหลังลองเล่นจริง
// คิดจาก: คนหนึ่งตีถูกทุก ~7 วิ ได้ damage เฉลี่ย ~50 → ทีมทั่วไปถึง Dragon ราวนาทีที่ 3.5
// HP ต่อคน + KILL_BONUS ต้องตรงกับ record_hit ใน Supabase (ดู app/battle/SUPABASE.md)
export const MONSTERS: Monster[] = [
  {
    id: "slime",
    name: "Slime",
    hpPerPlayer: 200,
    endless: false,
    // food มีคู่คำเยอะสุด เหมาะกับด่านแรก
    weakTo: ["food"],
    ...scenes("slime"),
  },
  {
    id: "spider",
    name: "Spider",
    hpPerPlayer: 300,
    endless: false,
    weakTo: ["home"],
    ...scenes("spider"),
  },
  {
    id: "werewolf",
    name: "Werewolf",
    hpPerPlayer: 450,
    endless: false,
    weakTo: ["clothes"],
    ...scenes("werewolf"),
  },
  {
    id: "kraken",
    name: "Kraken",
    hpPerPlayer: 550,
    endless: false,
    weakTo: ["travel"],
    ...scenes("kraken"),
  },
  {
    id: "dragon",
    name: "Dragon",
    // ตีไม่ตาย ค่านี้มีไว้ให้แถบ HP มีตัวเลขเท่านั้น
    hpPerPlayer: 500,
    endless: true,
    // วนทุกหมวด เริ่มจาก 2 หมวดที่ตัวอื่นไม่ได้ใช้
    weakTo: ["school", "nature", "food", "home", "clothes", "travel"],
    ...scenes("dragon"),
  },
];

export function monsterMaxHp(monster: Monster, teamSize: number) {
  return monster.hpPerPlayer * teamSize;
}

// จุดอ่อนตอนนี้ — นับตามเวลาของเกม (ไม่ใช่ตั้งแต่ Dragon โผล่) ทุกทีมจึงเห็นหมวดเดียวกันพร้อมกัน
export function weaknessAt(monster: Monster, elapsedMs: number): NounCategory {
  const turn = Math.floor(elapsedMs / WEAKNESS_ROTATE_MS);
  return monster.weakTo[turn % monster.weakTo.length];
}
