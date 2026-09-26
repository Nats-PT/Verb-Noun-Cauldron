import { WEAKNESS_ROTATE_MS } from "./rules";
import type { Monster, NounCategory } from "./types";

// ลำดับมอนสเตอร์ที่ทีมต้องตี — HP เป็นค่าตั้งต้น ต้องปรับหลังลองเล่นจริง
// คิดจาก: คนหนึ่งตีถูกทุก ~7 วิ ได้ damage เฉลี่ย ~50 → ทีมทั่วไปถึง Dragon ราวนาทีที่ 3.5
// ตัวที่ 4–5 ภาพต้นฉบับ 64px (ตั้งใจให้ใหญ่กว่า) ส่วนตัวที่ 1–3 เป็น 32px
export const MONSTERS: Monster[] = [
  {
    id: "slime",
    name: "Slime",
    hpPerPlayer: 200,
    endless: false,
    // food มีคู่คำเยอะสุด เหมาะกับด่านแรก
    weakTo: ["food"],
    sprite: "/battle/monsters/slime.png",
    background: "/battle/backgrounds/stage1.png",
    spriteSize: 32,
    spriteScale: 4,
  },
  {
    id: "spider",
    name: "Spider",
    hpPerPlayer: 300,
    endless: false,
    weakTo: ["home"],
    sprite: "/battle/monsters/spider.png",
    background: "/battle/backgrounds/stage2.png",
    spriteSize: 32,
    spriteScale: 4,
  },
  {
    id: "werewolf",
    name: "Werewolf",
    hpPerPlayer: 450,
    endless: false,
    weakTo: ["clothes"],
    sprite: "/battle/monsters/werewolf.png",
    background: "/battle/backgrounds/stage3.png",
    spriteSize: 32,
    spriteScale: 4,
  },
  {
    id: "octopus",
    name: "Octopus",
    hpPerPlayer: 550,
    endless: false,
    weakTo: ["travel"],
    sprite: "/battle/monsters/octopus.png",
    background: "/battle/backgrounds/stage4.png",
    spriteSize: 64,
    spriteScale: 3,
  },
  {
    id: "dragon",
    name: "Dragon",
    // ตีไม่ตาย ค่านี้มีไว้ให้แถบ HP มีตัวเลขเท่านั้น
    hpPerPlayer: 500,
    endless: true,
    // วนทุกหมวด เริ่มจาก 2 หมวดที่ตัวอื่นไม่ได้ใช้
    weakTo: ["school", "nature", "food", "home", "clothes", "travel"],
    sprite: "/battle/monsters/dragon.png",
    background: "/battle/backgrounds/stage5.png",
    spriteSize: 64,
    spriteScale: 3,
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
