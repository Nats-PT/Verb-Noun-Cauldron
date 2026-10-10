import Image from "next/image";
import type { Monster } from "@/lib/game/types";

type MonsterStageProps = {
  monster: Monster;
  hp: number;
  // HP เต็มขึ้นกับจำนวนคนในทีม จึงรับจากหน้าที่เรียกใช้ (monsterMaxHp)
  maxHp: number;
  // กำลังรับ damage → ใช้ภาพ hit (ตัวแดง) แทนภาพยืนปกติ
  hit?: boolean;
  // เพิ่งตีโดนจุดอ่อน → โชว์ "weak!" แป๊บหนึ่ง
  // ไม่บอกหมวดตรง ๆ ให้ผู้เล่นที่สังเกตเดาเองว่าคำแบบไหนแรง
  weakHit?: boolean;
  // ขนาดกำหนดจากหน้าที่เรียกใช้ — ควรเป็น 120×90 (ขนาดภาพฉาก) คูณจำนวนเต็ม ภาพจะได้คม
  className?: string;
  // ตัวหนังสือบนฉากขยายตามความกว้างฉาก (จอ master ฉากกว้าง 600) — ไม่ใส่ = ขนาด text-score ตายตัวแบบมือถือ
  scaleText?: boolean;
};

// pixel art ต้องไม่ถูกบีบอัดและไม่ถูกทำให้เบลอตอนขยาย
const pixelated = "[image-rendering:pixelated]";

// ตัวหนังสือบนฉาก ต้องมีเงาดำถึงจะอ่านออกบนพื้นหลังทุกด่าน
const overlayText = "text-score text-foreground [text-shadow:2px_2px_0_black]";
// แบบขยายตามฉาก: ขนาดเท่ามือถือเมื่อฉากกว้าง 353 (20px → 5.67cqw, เงา 2px → 0.57cqw)
const scaledOverlayText = "text-[5.67cqw] leading-[1.2] text-foreground [text-shadow:0.57cqw_0.57cqw_0_black]";

// ภาพแถบ HP กว้าง 76px: หัวใจกินซ้าย 11px ช่องเติมจริงคือ x 11–73 (62px) ขวาสุด 3px เป็นขอบ
// คืนค่าว่าต้องตัดสีชมพูออกจากทางขวากี่ % ของภาพ ให้ HP 0–100% ตรงกับช่องเติมพอดี
function hpFillInsetRight(percent: number) {
  const filledTo = 11 + (62 * percent) / 100;
  return ((76 - filledTo) / 76) * 100;
}

// ใช้ทั้งในมือถือ (battle) และจอ master — จึงอยู่ใน components/ ที่ root
export default function MonsterStage({
  monster,
  hp,
  maxHp,
  hit = false,
  weakHit = false,
  className = "",
  scaleText = false,
}: MonsterStageProps) {
  const text = scaleText ? scaledOverlayText : overlayText;
  const percent = monster.endless ? 100 : Math.max(0, Math.min(100, (hp / maxHp) * 100));

  return (
    // ทุกระยะข้างในคิดเป็น % ของความกว้างฉาก (cqw) ตาม redline (ฉากกว้าง 353 ใน Figma)
    // ฉากใหญ่แค่ไหน (มือถือ / จอ master) ทุกอย่างก็ขยายตามกัน
    <section
      aria-label={`${monster.name} battle`}
      className={`@container relative ${className}`}
    >
      {/* ภาพฉากรวมตัวมอนสเตอร์ 2 แบบซ้อนกัน แล้วสลับว่าอันไหนมองเห็น
          โหลดภาพ hit ไว้ตั้งแต่แรก ตีครั้งแรกจะได้ไม่มีจังหวะภาพว่าง และ GIF ยืนเฉยไม่เริ่มขยับใหม่ทุกครั้งที่โดนตี
          กล่องเตี้ยกว่า 4:3 (จอมือถือเตี้ย) → ภาพยังกว้างเต็มกล่อง แต่ตัดส่วนบน (ป่า) ออก มอนสเตอร์อยู่ล่างจึงไม่โดนตัด
          มุมมนอยู่ที่กล่องข้างใน เพราะ cqw บนตัว container เองจะไปคิดจากความกว้างจอแทนความกว้างฉาก */}
      <div className="absolute inset-0 overflow-hidden rounded-[3cqw]">
        <Image
          src={monster.scene}
          alt={monster.name}
          fill
          unoptimized
          // อยู่บนสุดของจอ โหลดทันที ไม่ต้องรอ lazy load
          loading="eager"
          data-scene="move"
          className={`object-cover object-bottom ${pixelated} ${hit ? "invisible" : ""}`}
        />
        <Image
          src={monster.hitScene}
          alt=""
          fill
          unoptimized
          // อยู่บนสุดของจอ โหลดทันที ไม่ต้องรอ lazy load
          loading="eager"
          data-scene="hit"
          className={`object-cover object-bottom ${pixelated} ${hit ? "" : "invisible"}`}
        />
      </div>

      {/* กรอบชมพูจาก art ยืดแบบ 9-slice (ตัดที่ 4px) ทับขอบฉาก — กล่องสูงต่ำแค่ไหนมุมก็ยังคม
          ขอบหนา 4px ของ art × (353/120) = 3.33% ของความกว้างฉาก */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 ${pixelated}`}
        style={{
          borderStyle: "solid",
          borderWidth: "3.33cqw",
          borderImage: "url(/battle/frame-boss.png) 4 / 3.33cqw stretch",
        }}
      />

      {/* แถบ HP จาก art 76×10 ซ้อน 3 ชั้น: พื้น → สีชมพู (ตัดตาม HP) → กรอบมีหัวใจ
          redline: กว้าง 129 สูง 17 ห่างขอบบนกรอบ 22 เริ่มที่ x 125 (ข้อความ HP อยู่ข้างหน้า) — จากฉากกว้าง 353 */}
      <div className="absolute top-[6.23cqw] left-[35.4cqw] aspect-[76/10] w-[36.5cqw]">
        <span className={`absolute top-1/2 right-full -translate-y-1/2 ${scaleText ? "mr-[1.13cqw]" : "mr-1"} ${text}`}>HP</span>
        <div
          role="progressbar"
          aria-label={`${monster.name} HP`}
          aria-valuemin={0}
          aria-valuemax={maxHp}
          aria-valuenow={monster.endless ? undefined : hp}
          className="relative size-full"
        >
          <Image src="/battle/hp/hp-bg.png" alt="" fill unoptimized loading="eager" className={pixelated} />
          <Image
            src="/battle/hp/hp-fill.png"
            alt=""
            fill
            unoptimized
            loading="eager"
            className={`${pixelated} transition-[clip-path] duration-300`}
            style={{ clipPath: `inset(0 ${hpFillInsetRight(percent)}% 0 0)` }}
          />
          <Image src="/battle/hp/hp-frame.png" alt="" fill unoptimized loading="eager" className={pixelated} />
        </div>
      </div>

      {/* ใต้แถบ HP: ENDLESS (เฉพาะตัวสุดท้าย) แล้วตามด้วย weak! ตอนตีโดนจุดอ่อน */}
      <div className="absolute inset-x-0 top-[12.5cqw] z-10 flex flex-col items-center">
        {monster.endless && <span className={text}>ENDLESS</span>}
        {weakHit && <span className={`${text} text-ready`}>weak!</span>}
      </div>
    </section>
  );
}
