import type { Monster } from "./types";

// ลำดับมอนสเตอร์ที่ทีมต้องตี — HP เป็นค่าตั้งต้น ต้องปรับหลังลองเล่นจริง
// ตัวที่ 4–5 ภาพต้นฉบับ 64px (ตั้งใจให้ใหญ่กว่า) ส่วนตัวที่ 1–3 เป็น 32px
export const MONSTERS: Monster[] = [
  {
    id: "slime",
    name: "Slime",
    maxHp: 800,
    endless: false,
    sprite: "/battle/monsters/slime.png",
    background: "/battle/backgrounds/stage1.png",
    spriteSize: 32,
    spriteScale: 4,
  },
  {
    id: "spider",
    name: "Spider",
    maxHp: 1200,
    endless: false,
    sprite: "/battle/monsters/spider.png",
    background: "/battle/backgrounds/stage2.png",
    spriteSize: 32,
    spriteScale: 4,
  },
  {
    id: "werewolf",
    name: "Werewolf",
    maxHp: 1600,
    endless: false,
    sprite: "/battle/monsters/werewolf.png",
    background: "/battle/backgrounds/stage3.png",
    spriteSize: 32,
    spriteScale: 4,
  },
  {
    id: "octopus",
    name: "Octopus",
    maxHp: 2000,
    endless: false,
    sprite: "/battle/monsters/octopus.png",
    background: "/battle/backgrounds/stage4.png",
    spriteSize: 64,
    spriteScale: 3,
  },
  {
    id: "dragon",
    name: "Dragon",
    maxHp: 2500,
    endless: true,
    sprite: "/battle/monsters/dragon.png",
    background: "/battle/backgrounds/stage5.png",
    spriteSize: 64,
    spriteScale: 3,
  },
];
