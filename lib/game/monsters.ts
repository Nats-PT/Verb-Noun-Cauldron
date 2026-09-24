import type { Monster } from "./types";

// ลำดับมอนสเตอร์ที่ทีมต้องตี — HP เป็นค่าตั้งต้น ต้องปรับหลังลองเล่นจริง
export const MONSTERS: Monster[] = [
  { id: "slime", name: "Slime", maxHp: 800, endless: false, tint: "#b7c9a8" },
  { id: "spider", name: "Spider", maxHp: 1200, endless: false, tint: "#9fb3c8" },
  { id: "croc", name: "Croc", maxHp: 1600, endless: false, tint: "#b9a3c9" },
  { id: "octopus", name: "Octopus", maxHp: 2000, endless: false, tint: "#7fd1bd" },
  { id: "bat", name: "Bat", maxHp: 2500, endless: true, tint: "#e08a8a" },
];
