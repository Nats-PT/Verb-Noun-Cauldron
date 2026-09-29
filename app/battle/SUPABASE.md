# ต่อหน้า battle เข้ากับ Supabase

เอกสารนี้บอกว่าฝั่ง DB ต้องทำอะไรบ้าง และหน้า battle จะเรียกใช้ยังไง
(ไฟล์ไหนในหน้า battle ทำอะไร: ดู `README.md` ในโฟลเดอร์เดียวกัน)

## หลักการ

- **ทั้งทีมตีมอนสเตอร์ตัวเดียวกัน** — HP, ด่าน, คะแนนทีม อยู่ที่แถว `teams` บน server
- **damage คิดในมือถือ** (`lib/game/engine.ts`) ผู้เล่นเห็นผลทันทีไม่ต้องรอเน็ต แล้วส่งตัวเลขขึ้น server
- **กระดานการ์ด, คำในหม้อ, streak อยู่ในมือถือ** ไม่ต้องเก็บใน DB
- **server เป็นคนตัดสิน** HP / ด่าน / คะแนนทีม ถ้าไม่ตรงกับในเครื่อง ใช้ค่าจาก server

```
master กด Start ──► start_match()        teams: playing, ends_at, team_size, HP ตัวแรก
     │
     ▼ (lobby เห็น status = playing ทาง realtime → router.push("/battle"))
มือถือตีโดน ──────► record_hit(damage)   teams: score, current_stage, monster_hp
     │                    │
     │                    └── realtime ──► มือถือทุกเครื่องในทีมอัปเดต HP / ด่าน / คะแนน
     ▼
ends_at + 3 วิ ───► record_match_result({ teamId })   (มีแล้ว) → หน้า winner
```

## 1. คอลัมน์ที่ต้องเพิ่มใน `teams`

```sql
alter table public.teams
  add column if not exists started_at timestamptz,
  add column if not exists ends_at    timestamptz,
  add column if not exists team_size  smallint not null default 1,  -- นับตอนกด Start แล้วไม่เปลี่ยน (คนหลุดกลางเกม HP ไม่ลด)
  add column if not exists monster_hp integer  not null default 0;  -- HP ที่เหลือของมอนสเตอร์ตัวปัจจุบัน
-- score, current_stage (1–5), status มีอยู่แล้ว
```

ใช้ `alter table ... add column if not exists` ใน `supabase/schema.sql` ด้วย — `create table if not exists` ไม่เพิ่มคอลัมน์ให้ตารางที่มีอยู่แล้ว

`current_stage` 1–5 = มอนสเตอร์ตัวที่ 1–5 (ในโค้ดคือ `MONSTERS[current_stage - 1]`) ตัวที่ 5 (Dragon) ตีไม่ตาย

## 2. ตัวเลขที่ต้องตรงกับโค้ด

ถ้าแก้ตัวเลขฝั่งใดฝั่งหนึ่ง ต้องแก้อีกฝั่งด้วย

| ค่า | ในโค้ด | ค่าปัจจุบัน |
| --- | --- | --- |
| HP ต่อคน ตัวที่ 1–5 | `lib/game/monsters.ts` → `hpPerPlayer` | 200, 300, 450, 550, 500 |
| โบนัสล้มมอนสเตอร์ | `lib/game/scoring.ts` → `KILL_BONUS` | 100 |
| damage สูงสุดต่อครั้ง | `scoring.ts` (30 × 2 × 2) | 120 |
| ความยาวเกม | `lib/game/rules.ts` → `GAME_DURATION_MS` | 5 นาที |

HP จริง = HP ต่อคน × `team_size`

## 3. RPC ที่ต้องทำ

### `start_match(p_team_ids int[])` — จอ master เรียกตอนกด Start

- เฉพาะทีมที่ `status = 'waiting'`
- ตั้ง `status = 'playing'`, `started_at = now()`, `ends_at = now() + 5 นาที` (ทุกทีมได้เวลาเดียวกันเพราะอยู่ใน transaction เดียว)
- `team_size` = จำนวนแถวใน `players` ของทีม (อย่างน้อย 1)
- `current_stage = 1`, `score = 0`, `monster_hp = 200 × team_size`

### `record_hit(p_team_id int, p_damage int)` — มือถือเรียกทุกครั้งที่ตีโดน ⭐

กติกาเดียวกับ `applyDamage` ใน `lib/game/engine.ts`:

- ล็อกแถวทีมก่อน (`for update`) — หลายเครื่องตีพร้อมกันคะแนนจะไม่หาย
- ปฏิเสธถ้าทีมไม่ได้ `playing` หรือเลย `ends_at + 2 วิ` (เผื่อเน็ตช้า — มือถือล็อกเองตรง `ends_at` อยู่แล้ว)
- ตรวจว่าคนเรียกอยู่ในทีมนี้จริง และ `p_damage` อยู่ในช่วง 1–120
- ตัวที่ 5: คะแนนขึ้น แต่ HP ไม่ลด
- เลือดหมด → ตัวถัดไป + โบนัส 100, **damage ที่ล้นไปหักตัวถัดไป** (ล้มได้หลายตัวในทีเดียวก็ได้โบนัสหลายครั้ง), ขึ้นตัวที่ 5 แล้ว HP เต็มเสมอ

ตัวอย่าง (ปรับได้ตามสไตล์ schema เดิม):

```sql
create or replace function public.record_hit(p_team_id integer, p_damage integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  hp_per_player constant int[] := array[200, 300, 450, 550, 500];  -- ต้องตรงกับ lib/game/monsters.ts
  kill_bonus    constant int   := 100;                               -- ต้องตรงกับ lib/game/scoring.ts
  t public.teams%rowtype;
  v_kills int := 0;
begin
  if p_damage is null or p_damage < 1 or p_damage > 120 then
    raise exception 'invalid damage %', p_damage;
  end if;

  if not exists (select 1 from public.players where id = auth.uid() and team_id = p_team_id) then
    raise exception 'player is not in team %', p_team_id;
  end if;

  select * into t from public.teams where id = p_team_id for update;

  if t.status <> 'playing' or now() > t.ends_at + interval '2 seconds' then
    return jsonb_build_object('accepted', false, 'score', t.score,
      'currentStage', t.current_stage, 'monsterHp', t.monster_hp, 'kills', 0);
  end if;

  if t.current_stage < 5 then
    t.monster_hp := t.monster_hp - p_damage;
    while t.monster_hp <= 0 and t.current_stage < 5 loop
      v_kills := v_kills + 1;
      t.current_stage := t.current_stage + 1;
      t.monster_hp := case
        when t.current_stage = 5 then hp_per_player[5] * t.team_size             -- Dragon HP เต็มเสมอ
        else t.monster_hp + hp_per_player[t.current_stage] * t.team_size          -- ที่ล้นไปหักตัวถัดไป
      end;
    end loop;
  end if;

  t.score := t.score + p_damage + v_kills * kill_bonus;

  update public.teams
  set score = t.score, current_stage = t.current_stage, monster_hp = t.monster_hp
  where id = p_team_id;

  return jsonb_build_object('accepted', true, 'score', t.score,
    'currentStage', t.current_stage, 'monsterHp', t.monster_hp, 'kills', v_kills);
end;
$$;
```

### `server_now()` — คืน `now()` ของ server

นาฬิกามือถือแต่ละเครื่องเพี้ยนได้หลายวินาที มือถือใช้ค่านี้หาว่าต่างจาก server เท่าไร แล้วนับเวลาตาม server

### `record_match_result` — มีแล้ว

- มือถือจะเรียก `recordMatchResult({ teamId })` ตอน `ends_at + 3 วิ` (หลังช่วงเผื่อ 2 วิ ของ `record_hit`) คะแนนจะครบทุกหมัด
- ถ้าทีมตกลงใช้ตัวคูณให้ทีมคนน้อย: ใส่ `× 5 / team_size` ในนี้ที่เดียว

## 4. ฟังก์ชันใน `lib/battle.ts` ที่หน้า battle อยากเรียก

เขียนแบบเดียวกับ `lib/leaderboard.ts` — หน้า battle ไม่เรียก Supabase ตรง ๆ

```ts
export type BattleTeam = {
  id: number;
  name: string;
  status: "waiting" | "playing" | "finished";
  score: number;
  currentStage: number; // 1–5
  monsterHp: number;
  teamSize: number;
  endsAt: string; // ISO timestamp
};

export type HitResult = {
  accepted: boolean; // false = หมดเวลา / ไม่ได้เล่นอยู่
  score: number;
  currentStage: number;
  monsterHp: number;
  kills: number;
};

// ทีมของผู้เล่นที่ login อยู่ (หาจาก players.team_id ของ auth.uid())
export async function getMyBattleTeam(): Promise<BattleTeam | null>;

// จอ master
export async function startMatch(teamIds: number[]): Promise<{ endsAt: string } | { error: string }>;

// ทุกครั้งที่ตีโดน
export async function recordHit(teamId: number, damage: number): Promise<HitResult | null>;

// server ช้ากว่า/เร็วกว่ามือถือกี่ ms — ใช้: เวลา server ≈ Date.now() + offset
export async function getServerClockOffset(): Promise<number>;

// แถว teams ของทีมเปลี่ยน (เพื่อนร่วมทีมตี) → เรียก onChange; คืนฟังก์ชันยกเลิก
export function subscribeToBattleTeam(teamId: number, onChange: (team: BattleTeam) => void): () => void;
```

`teams` เปิด realtime ไว้แล้วใน `schema.sql` ใช้ filter `id=eq.<teamId>`

## 5. ฝั่งหน้า battle (กายทำ) — จะเปลี่ยนตรงไหน

| ตอนนี้ | ต่อ DB แล้ว |
| --- | --- |
| `createMockEndsAt()` | `endsAt` จาก `getMyBattleTeam()` − offset จาก `getServerClockOffset()` |
| `createMockBattle()` teamSize 1 | `teamSize`, ด่าน, HP, คะแนนทีม จาก `getMyBattleTeam()` |
| ตีโดน → อัปเดตในเครื่อง | อัปเดตในเครื่องทันที + `recordHit()` แล้วใช้ค่าที่ server ตอบ |
| — | `subscribeToBattleTeam()` ให้ HP / ด่าน / คะแนนขยับตามเพื่อนร่วมทีม |
| TODO ตอนหมดเวลา | `recordMatchResult({ teamId })` ตอน `ends_at + 3 วิ` แล้วไปหน้า winner |

`mock-battle.ts` เก็บไว้ใช้ตอน dev / test ที่ไม่ต่อ DB

## 6. ต้องตกลงกันก่อน

1. **คะแนนบน header มือถือ** เป็นคะแนนทีมหรือคะแนนตัวเอง? (เสนอ: header = ทีม, ป้าย TIME'S UP = ตัวเอง) 

กูคิดว่าเป็นไปได้เพราะมึงก็ไม่ได้ต้องเก็บรายคนแค่ปล่อยให้เลขกูวิ่งไปก็ได้ มึงเก็บแค่ของ team ลง 

2. **ตัวคูณทีมคนน้อย** (× 5 / team_size) ใช้ไหม

สมการนี้ คะแนนที่บันทึก = คะแนนรวม × 5 ÷ จำนวนคนในทีม ใช้ปรับ balance คนไม่เท่ากันครับ

