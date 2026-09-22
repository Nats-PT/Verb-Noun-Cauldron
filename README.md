# Verb-Noun Cauldron

เว็บไซต์ที่สร้างด้วย Next.js (App Router), TypeScript และ Tailwind CSS

## เริ่มใช้งาน (สำหรับสมาชิกในทีม)

ต้องมี [Node.js](https://nodejs.org) เวอร์ชัน 20 ขึ้นไปก่อน

```bash
git clone https://github.com/Nats-PT/Verb-Noun-Cauldron.git
cd Verb-Noun-Cauldron
npm install        # ติดตั้ง package ครั้งแรกครั้งเดียว
npm run dev        # เปิด dev server
```

เปิด http://localhost:3000 ในเบราว์เซอร์ แก้ไฟล์แล้ว Save หน้าเว็บจะอัปเดตเอง

หยุด dev server ด้วย `Ctrl + C`

## คำสั่งที่ใช้บ่อย

| คำสั่ง | ทำอะไร |
| --- | --- |
| `npm run dev` | รันเว็บบนเครื่องตัวเองระหว่างพัฒนา |
| `npm run build` | build เวอร์ชันจริงเพื่อเช็คว่าไม่มี error |
| `npm run lint` | ตรวจโค้ดว่าเขียนผิดหลักตรงไหน |

## โครงสร้างโปรเจกต์

```
app/
├── layout.tsx      โครงที่ครอบทุกหน้า (ฟอนต์ BoldPixels)
├── globals.css     สี + ขนาดตัวอักษรกลางของทั้งเกม
├── fonts/          ไฟล์ฟอนต์
├── page.tsx        หน้าแรก            → /
└── lobby/
    └── page.tsx    หน้า lobby         → /lobby
components/         ชิ้นส่วน UI ที่ใช้ร่วมกันหลายหน้า (Leaderboard ฯลฯ)
lib/
├── types.ts        หน้าตาข้อมูล (ต้องตรงกับ Supabase)
└── mock-data.ts    ข้อมูลปลอมระหว่างรอ DB
public/             ไฟล์รูปภาพ
```

### ใช้สีและขนาดตัวอักษรกลางเสมอ

ห้ามใส่สีตรง ๆ อย่าง `bg-purple-500` ให้ใช้ชื่อที่ตั้งไว้ใน `app/globals.css`

| สี | ขนาดตัวอักษร |
| --- | --- |
| `bg-background` `bg-surface` `border-border` | `text-head` 60px |
| `text-foreground` `text-muted` | `text-head2` 36px |
| `bg-primary` `hover:bg-primary-hover` | `text-body` 28px (text1 / ปุ่ม) |
| `text-ready` | `text-score` 20px (เวลา / คะแนน) |

การเพิ่มหน้าใหม่: สร้างโฟลเดอร์ใน `app/` แล้วใส่ไฟล์ชื่อ `page.tsx` เข้าไป
ชื่อโฟลเดอร์จะกลายเป็น URL เช่น `app/contact/page.tsx` → `/contact`

## ข้อตกลงของทีม

- ห้าม commit ไฟล์ `.env` หรือรหัสผ่านใดๆ (`.gitignore` กันไว้ให้แล้ว)
- commit บ่อยๆ พร้อมข้อความที่บอกได้ว่าทำอะไร
- แยก branch เมื่อทำฟีเจอร์ใหม่ แล้วเปิด Pull Request เข้า `main`

## เทคโนโลยีที่ใช้

- [Next.js 16](https://nextjs.org/docs) — framework และระบบ routing
- [React 19](https://react.dev) — สร้าง UI เป็น component
- [TypeScript](https://www.typescriptlang.org/docs/) — JavaScript ที่มีการตรวจ type
- [Tailwind CSS 4](https://tailwindcss.com/docs) — จัดหน้าตาด้วย utility class

## เครดิต

- ฟอนต์ [BoldPixels by YukiPixels](https://yukipixels.itch.io/boldpixels) — ใช้ภายใต้สัญญาอนุญาต
  [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) ไม่ได้ดัดแปลงตัวฟอนต์
  (รายละเอียดใน `app/fonts/BoldPixels-LICENSE.txt`)
