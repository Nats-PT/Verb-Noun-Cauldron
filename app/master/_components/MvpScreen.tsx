import Image from "next/image";
import type { MatchStanding } from "@/lib/master";
import { pixelFrame } from "@/lib/pixel-frame";

type MvpScreenProps = {
  // ทุกคนในรอบที่เพิ่งจบ (ทั้ง 2 ทีม) เรียงคะแนนแล้ว — matchStandings ใน lib/master.ts
  standings: MatchStanding[];
};

// กรอบชุดเดียวกับจอ master อื่น — design ขยายลายขอบ ×12 (ชมพู 12 + ม่วงหม่น 24 ≈ 36px, ขั้นมุม 12px)
const outerFrame = pixelFrame("/lobby/frame-leader.png", { scale: 12 });

const pixelated = "[image-rendering:pixelated]";

// ---------- ตำแหน่ง / ขนาด: px บนเวที 1920×1080 วัดจาก design ของ art (MVP_mas) ----------
// หัวข้อแบบเดียวกับจอ Leaderboard / Prepare: เหลืองมะนาว #ffff5b + เงาทองเข้มตกลงล่าง
const designYellow = "text-[#ffff5b]";
const titleStyle = `text-[96px] leading-none ${designYellow} drop-shadow-[0_6px_4px_#9a7414]`;

// แท่น: ภาพ 22×47 / 22×34 / 22×26 ขยาย ×10 (design ×9.8 — ปัดเป็นจำนวนเต็มให้ภาพคม)
// กึ่งกลางแท่นตาม design: ที่ 1 x 563 (กลาง), ที่ 2 x 327 (ซ้าย), ที่ 3 x 799 (ขวา) · ฐานเสมอกันที่ y 949
const PODIUM_BOTTOM = 949;
const PODIUMS = [
  { src: "/master/podium-1.png", center: 563, width: 220, height: 470 },
  { src: "/master/podium-2.png", center: 327, width: 220, height: 340 },
  { src: "/master/podium-3.png", center: 799, width: 220, height: 260 },
] as const;

// ป้ายอันดับบนแท่น (อันดับ 1 ใช้มงกุฎแทน) — สีจาก design + ขอบดำ 4px (วาดขอบไว้ใต้ตัวหนังสือ ไม่กินเนื้อตัวอักษร)
const RANK_LABEL_COLOR: Record<number, string> = { 2: "text-[#e7e7e7]", 3: "text-[#fdaa84]" };
const rankLabelStyle = "text-[52px] leading-none [-webkit-text-stroke:8px_black] [paint-order:stroke_fill]";

// ตารางขวา: คอลัมน์ RANK x 1167, PLAYER x 1337, SCORE x 1560 · 10 แถว ห่างกันแถวละ 68
const TABLE_ROWS = 10;
const tableColumns = "grid grid-cols-[170px_223px_auto] items-baseline";

// อันดับ / คะแนนแบบจอ Leaderboard (1ST, 001000) — ตัวเดียวกับ formatRank / formatScore ใน lib/master.ts ของ branch leaderboard
// เขียนซ้ำไว้ก่อนเพราะอยู่คนละ branch — รวมกันหลังทั้งสองเข้า main
function formatRank(rank: number) {
  return `${rank}${rank === 1 ? "ST" : rank === 2 ? "ND" : rank === 3 ? "RD" : "TH"}`;
}
const formatScore = (score: number) => String(score).padStart(6, "0");

// อันดับในตาราง: คนที่ได้ 0 ไม่มีอันดับใน matchStandings (ไม่ขึ้นแท่น) แต่ในตารางให้อันดับร่วมกันต่อท้ายคนที่มีคะแนน
// เช่น 90, 40, 0, 0 → 1ST 2ND 3RD 3RD แล้วแถวว่างเป็น 5TH ... แบบจอ Leaderboard
function tableRank(standings: MatchStanding[], player: MatchStanding) {
  return player.rank ?? standings.findIndex((p) => p.score === 0) + 1;
}

// จอหลังหมดเวลา (ค้าง WINNER_SHOW_MS): ไม่บอกทีมแพ้/ชนะ (มือถือบอกแล้ว) — โชว์ว่ารอบนี้ใครทำผลงานดีสุด 2 ทีมรวมกัน
// ซ้าย = แท่น top 3, ขวา = อันดับทุกคนในรอบ
export default function MvpScreen({ standings }: MvpScreenProps) {
  // คน 0 คะแนนไม่ขึ้นแท่น — แท่นนั้นเหลือเสาเปล่า
  const podium = standings.slice(0, PODIUMS.length).filter((player) => player.score > 0);

  return (
    <>
      <div aria-hidden style={outerFrame} className={`absolute inset-12 ${pixelated}`} />

      <h1 className={`absolute top-[150px] left-[178px] ${titleStyle}`}>MVP PLAYER</h1>

      {PODIUMS.map((spot, i) => (
        <Podium key={spot.src} spot={spot} player={podium[i]} />
      ))}

      <div className={`${tableColumns} absolute top-[153px] left-[1167px] text-[48px] leading-none`}>
        <span>RANK</span>
        <span>PLAYER</span>
        <span>SCORE</span>
      </div>
      <div aria-hidden className="absolute top-[246px] left-[1138px] h-[6px] w-[604px] bg-primary" />

      <ol aria-label="Players this round" className="absolute top-[302px] left-[1167px] flex flex-col gap-[28px] text-head2">
        {Array.from({ length: Math.max(TABLE_ROWS, standings.length) }, (_, i) => {
          const player = standings[i];
          return (
            <li key={player?.playerId ?? `empty-${i}`} className={`${tableColumns} h-[40px]`}>
              <span>{formatRank(player ? tableRank(standings, player) : i + 1)}</span>
              {/* ชื่อยาวตัดด้วย … ไม่ให้ทับคอลัมน์คะแนน */}
              <span className="truncate pr-6">{player ? player.name : "***********"}</span>
              <span className="tracking-wider tabular-nums">{player ? formatScore(player.score) : "_______"}</span>
            </li>
          );
        })}
      </ol>
    </>
  );
}

// แท่น 1 อัน + ข้อความเหนือแท่น (บนลงล่าง: ป้ายอันดับ / มงกุฎ → ชื่อ → คะแนน) อยู่เหนือแท่น 17
function Podium({ spot, player }: { spot: (typeof PODIUMS)[number]; player: MatchStanding | undefined }) {
  const top = PODIUM_BOTTOM - spot.height;
  const first = player?.rank === 1;

  return (
    <>
      <div
        className="absolute"
        style={{ left: spot.center - spot.width / 2, top, width: spot.width, height: spot.height }}
      >
        <Image src={spot.src} alt="" fill unoptimized className={pixelated} />
      </div>

      {player && (
        <div
          data-podium={player.name}
          className="absolute flex -translate-x-1/2 flex-col items-center whitespace-nowrap"
          style={{ left: spot.center, bottom: 1080 - top + 17 }}
        >
          {first ? (
            // มงกุฎ 20×20 ขยาย ×5 — ภาพมีขอบใสด้านล่าง 4px (×5 = 20) ดึงลงให้ติดชื่อแบบ design
            <Image
              src="/winner/crown.png"
              alt="1st"
              width={100}
              height={100}
              unoptimized
              className={`-mb-[20px] ${pixelated}`}
            />
          ) : (
            <span className={`mb-[20px] ${rankLabelStyle} ${RANK_LABEL_COLOR[player.rank ?? 3] ?? RANK_LABEL_COLOR[3]}`}>
              {player.rank === 2 ? "2nd" : player.rank === 3 ? "3rd" : `${player.rank}th`}
            </span>
          )}
          <span className={`${first ? "text-[56px]" : "text-[44px]"} leading-none ${designYellow}`}>{player.name}</span>
          <span className="mt-[13px] text-body leading-none">score: {player.score}</span>
        </div>
      )}
    </>
  );
}
