import Image from "next/image";
import { MONSTERS } from "@/lib/game/monsters";
import type { MasterTeam, RankedPlayer } from "@/lib/master";
import { pixelFrame } from "@/lib/pixel-frame";

type WinnerScreenProps = {
  // ทีมในแมตช์ที่เพิ่งจบ (1–2 ทีม เรียงตาม slot)
  teams: MasterTeam[];
  // MVP top 3 รวม 2 ทีม (เท่ากันที่อันดับ 3 อาจเกิน 3 คน)
  mvps: RankedPlayer[];
};

// กรอบใหญ่: ลายขอบ ×12 เท่ากรอบจอ master อื่นใน design — ความหนา layout คง 16px ของข้างในจะได้ไม่ขยับ (ลายวาดทับ padding)
// กรอบทีม: art วาดขนาดเท่ามือถือ ขยาย ×3 (จอนี้ยังไม่มี design)
const outerFrame = pixelFrame("/winner/frame-result.png", { scale: 12, borderWidth: 16 });
const teamFrame = pixelFrame("/lobby/frame-player.png", { scale: 3 });

// ภาพ pixel art ขยายเป็นจำนวนเต็ม (มงกุฎ 20px ×4, เหรียญ ×3)
const pixelated = "[image-rendering:pixelated]";

// จอผลหลังหมดเวลา (ค้าง WINNER_SHOW_MS) — ทีมชนะ / เสมอ + คะแนน 2 ทีม + MVP top 3
export default function WinnerScreen({ teams, mvps }: WinnerScreenProps) {
  const [first, second] = teams;
  // เปิด /master?view=winner ตอนยังไม่เคยมีแมตช์ (dev)
  if (!first) return <p className="grid h-full place-items-center text-head2 text-muted">No match yet</p>;

  const draw = second !== undefined && first.score === second.score;
  const winnerId = second === undefined || draw ? null : first.score > second.score ? first.id : second.id;

  // เล่นทีมเดียว: ไม่มีใครแพ้ชนะ โชว์คะแนนอย่างเดียว
  const title = second === undefined ? "Time's up!" : draw ? "Draw!" : "Winner!";

  return (
    <main
      style={outerFrame}
      className={`absolute inset-12 flex flex-col items-center gap-10 px-20 py-10 ${pixelated}`}
    >
      <h1 className="text-head text-accent [-webkit-text-stroke:2px_black]">{title}</h1>

      <div className={`grid w-full gap-12 ${second ? "grid-cols-2" : "grid-cols-1 px-[25%]"}`}>
        {teams.map((team) => (
          <TeamResult key={team.id} team={team} result={resultOf(team.id, winnerId, draw, teams.length)} />
        ))}
      </div>

      <section className="flex w-full flex-1 flex-col items-center gap-6">
        <h2 className="text-head2 text-primary">MVP</h2>
        {mvps.length === 0 ? (
          <p className="text-body text-muted">No scores received</p>
        ) : (
          <ol className="flex w-[1100px] flex-col gap-4">
            {mvps.map((player) => (
              <MvpRow key={player.playerId} player={player} teamName={teams.find((t) => t.id === player.teamId)?.name} />
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}

type Result = "win" | "lose" | "draw" | "solo";

function resultOf(teamId: number, winnerId: number | null, draw: boolean, teamCount: number): Result {
  if (teamCount === 1) return "solo";
  if (draw) return "draw";
  return teamId === winnerId ? "win" : "lose";
}

function TeamResult({ team, result }: { team: MasterTeam; result: Result }) {
  const monster = MONSTERS[Math.min(Math.max(team.currentStage, 1), MONSTERS.length) - 1];

  return (
    <section
      style={teamFrame}
      className={`flex flex-col items-center gap-3 p-8 ${pixelated} ${result === "lose" ? "opacity-70" : ""}`}
    >
      {/* มงกุฎทองให้ทีมชนะ (เสมอได้ทั้งคู่) มงกุฎเทาให้ทีมแพ้ — เล่นทีมเดียวไม่มีมงกุฎ */}
      {result !== "solo" && (
        <Image
          src={result === "lose" ? "/winner/defeat.png" : "/winner/crown.png"}
          alt={result === "lose" ? "Lost" : "Winner"}
          width={80}
          height={80}
          unoptimized
          className={pixelated}
        />
      )}
      <p className="max-w-full truncate text-head2">{team.name}</p>
      <p className="text-head text-accent">{team.score}</p>
      <p className="text-body text-muted">Reached {monster.name}</p>
    </section>
  );
}

function MvpRow({ player, teamName }: { player: RankedPlayer; teamName: string | undefined }) {
  return (
    <li className="grid grid-cols-[60px_1fr_auto] items-center gap-8">
      <Medal rank={player.rank} />
      <p className="min-w-0 truncate text-head2">
        {player.name}
        {teamName && <span className="ml-4 text-body text-muted">{teamName}</span>}
      </p>
      <p className="text-head2 text-accent">{player.score}</p>
    </li>
  );
}

// art มีเหรียญแค่อันดับ 1–2 — อันดับ 3 เป็นตัวเลขในวงกลมไปก่อนจนกว่าจะได้ medal-3
// ไฟล์เหรียญเป็นภาพ 64×64 แต่ตัวเหรียญจริงแค่ 20×18 ที่ (20,20) — ขยาย ×3 แล้วครอบตัดเหลือแค่ตัวเหรียญ (60×54)
function Medal({ rank }: { rank: number }) {
  if (rank <= 2) {
    return (
      <span className="relative block h-[54px] w-[60px] overflow-hidden">
        <Image
          src={`/winner/medal-${rank}.png`}
          alt={`Rank ${rank}`}
          width={192}
          height={192}
          unoptimized
          className={`absolute left-[-60px] top-[-60px] max-w-none ${pixelated}`}
        />
      </span>
    );
  }
  return (
    <span
      aria-label={`Rank ${rank}`}
      className="grid size-[54px] place-items-center justify-self-center rounded-full border-4 border-muted text-body text-muted"
    >
      {rank}
    </span>
  );
}
