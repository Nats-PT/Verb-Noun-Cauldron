// หน้าตาข้อมูลที่ทุกหน้าจอใช้ร่วมกัน — ต้องตรงกับตารางใน Supabase
// ถ้าคนทำ DB เปลี่ยนชื่อคอลัมน์ ให้แก้ที่ไฟล์นี้ก่อน แล้ว TypeScript จะชี้จุดที่ต้องตามแก้ให้เอง

export type TeamId = 1 | 2;

export const TEAM_SIZE = 5;

export type Player = {
  id: string;
  name: string;
  team: TeamId;
  isReady: boolean;
};

export type LeaderboardEntry = {
  id: string;
  name: string;
  score: number;
};
