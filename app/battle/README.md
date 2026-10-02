# หน้า battle — ไฟล์ไหนทำอะไร

ผู้เล่นลาก verb + noun ลงหม้อ คู่ถูก = ตีมอนสเตอร์ 5 ตัว (ตัวที่ 5 Dragon ตีไม่ตาย) เล่น 5 นาที

**กติกาเกมอยู่ใน `lib/game/` แยกจากหน้าจอ** — แก้ตัวเลขหรือกติกาที่นั่น แล้วรัน `npm test` ทุกครั้ง

## หน้าจอ — `app/battle/`

| ไฟล์ | ทำอะไร |
| --- | --- |
| `page.tsx` | ประกอบทั้งหน้า: รับการลากการ์ด ส่งให้ `engine` คิดผล หมดเวลาแล้วล็อกกระดาน |
| `layout.tsx` | ล็อกหน้าไม่ให้เลื่อน + เว้นขอบตาม safe area (รอยบาก / แถบ Home) |
| `_components/BattleHeader.tsx` | แถบบน: score, ✓ ถูก, ✕ ผิด |
| `_components/Cauldron.tsx` | หม้อ + พื้นที่วางการ์ดที่มองไม่เห็น + การ์ดที่ค้างข้างหม้อ |
| `_components/ComboLabel.tsx` | ข้อความเหนือหม้อ `eat + ...` → `-45 eat + apple` |
| `_components/Timer.tsx` | นาฬิกานับถอยหลัง |
| `_components/WordColumn.tsx` | คอลัมน์การ์ด 4 ใบ + อนิเมชันเลื่อนตอนสลับที่ |
| `_components/WordCard.tsx` | การ์ด 1 ใบ: ลากลงหม้อได้ / ลากทับใบอื่นในคอลัมน์เดียวกันเพื่อสลับที่ |
| `_components/CardFrame.tsx` | กรอบ pixel art ของการ์ด |
| `_components/TimeUpBanner.tsx` | ป้าย TIME'S UP ตอนหมดเวลา |
| `_hooks/useNow.ts` | เวลาปัจจุบัน อัปเดตทุก 1 วิ (ใช้ร่วมกันทั้งหน้า) |
| `_hooks/useTimePassed.ts` | บอกว่าถึงเวลาที่กำหนดหรือยัง แบบตรงวินาที (ใช้ล็อกตอนหมดเวลา) |
| `components/MonsterStage.tsx` | ฉากมอนสเตอร์ + แถบ HP — อยู่นอกโฟลเดอร์นี้เพราะจอ master ใช้ด้วย |

## กติกาเกม — `lib/game/`

| ไฟล์ | ทำอะไร | แก้เมื่อ |
| --- | --- | --- |
| `rules.ts` | เวลาเกม, การเติมการ์ด, จุดอ่อน Dragon | อยากปรับความยาวเกม / ความง่ายของกระดาน |
| `scoring.ts` | สูตร damage + โบนัสล้มมอนสเตอร์ | อยากปรับความแรง |
| `monsters.ts` | มอนสเตอร์ 5 ตัว: HP ต่อคน, จุดอ่อน, ภาพ | อยากปรับ HP / เปลี่ยนจุดอ่อน / เปลี่ยนภาพ |
| `words.ts` | คลังคำ 40 verb · 60 noun · 255 คู่ | เพิ่ม/ลบคำหรือคู่ (ต้องให้คนเก่งอังกฤษตรวจ) |
| `engine.ts` | ลากลงหม้อ → ถูก/ผิด → damage → เติมการ์ดใหม่ | เปลี่ยนกติกาการเล่น |
| `types.ts` | หน้าตาข้อมูล (คำ, มอนสเตอร์, สถานะเกม) | — |
| `mock-battle.ts` | กระดานเริ่มต้นกับเวลาจบปลอม ระหว่างรอ DB | ต่อ DB แล้วเลิกใช้ |
| `*.test.ts` | test ของแต่ละไฟล์ (`npm test`) | แก้กติกาแล้วต้องแก้ test ตาม |

ภาพอยู่ใน `public/battle/` — pixel art ต้องขยายเป็นจำนวนเต็มเท่า + `[image-rendering:pixelated]`

- `monsters/<id>-move.gif` ฉาก + มอนสเตอร์ยืนเฉย (120×90, 2 เฟรม) · `monsters/<id>-hit.png` ตอนรับ damage
- `cards/card-verb.png`, `cards/card-noun.png` การ์ด 84×54 (ยืดแบบ 9-slice ใน `CardFrame.tsx`)
- `cauldron.png` หม้อ 128×160 (ตัวหม้อจริง 115×103 อยู่ล่าง ข้างบนโปร่งใส)
- `frame-boss.png` กรอบฉาก 120×90 (เท่าภาพฉาก วางทับใน `MonsterStage`)
- `hp/hp-bg.png`, `hp/hp-fill.png`, `hp/hp-frame.png` แถบ HP 76×10 ซ้อน 3 ชั้น (ช่องเติมจริง x 11–73)
- `frame-zone.png` กรอบคอลัมน์การ์ด 65×165 พื้นชมพูโปร่ง (ยืดแบบ 9-slice ด้วย `pixelFrame` ใน `lib/pixel-frame.ts`)

## ทดสอบ

- `npm test` — กติกาเกม + คลังคำ ไม่ต้องเปิดเว็บ
- `npm run test:drag` — ลากการ์ดจริงด้วยเมาส์และนิ้ว (ต้องเปิด `npm run dev` ไว้ และมี Chrome/Edge)
- เปิด `/battle?seconds=10` ตอน dev = เกมยาว 10 วิ ไว้ดูตอนหมดเวลา

## ยังไม่ได้ทำ (หา `TODO` ในโค้ด)

- ต่อ DB: เวลาจบเกม + จำนวนคนในทีมจาก server, ส่งคะแนนขึ้น DB, HP มอนสเตอร์ของทั้งทีมแบบ real-time — **ฝั่ง DB ต้องทำอะไร ดู `SUPABASE.md`**
- หมดเวลาแล้ว (`ends_at + 3 วิ`) เรียก `recordMatchResult({ teamId })` และไปหน้า winner (ยังไม่มีหน้า)
- เอฟเฟกต์ (ตัวเลข damage ลอย ฯลฯ), transition ไปหน้าสรุป
