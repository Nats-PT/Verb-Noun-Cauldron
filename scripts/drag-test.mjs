// ทดสอบลากการ์ดจริงในหน้า /battle ด้วยเมาส์และนิ้ว (จอมือถือ 390×664)
//
// วิธีใช้: เปิด `npm run dev` ไว้ก่อน แล้วรัน `npm run test:drag`
// ต้องมี Chrome หรือ Edge ในเครื่อง — ถ้าหาไม่เจอ ตั้ง BROWSER=path/to/chrome ก่อนรัน
// เปลี่ยน URL ได้ด้วย BATTLE_URL (ค่าเริ่มต้น http://localhost:3000/battle)
//
// อิงกระดานเริ่มต้นใน lib/game/mock-battle.ts (eat/read/wear/feed + apple/newspaper/jacket/rabbit)
// ถ้าเปลี่ยนกระดานเริ่มต้น ต้องแก้ขั้นตอนด้านล่างตาม
//
// TODO: ย้ายไปใช้ Playwright เมื่อต้องรันบน CI หรือหลายเบราว์เซอร์
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const URL = process.env.BATTLE_URL ?? "http://localhost:3000/battle";
const PORT = 9333;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findBrowser() {
  const candidates = [
    process.env.BROWSER,
    `${process.env["ProgramFiles(x86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`,
    `${process.env.ProgramFiles}\\Microsoft\\Edge\\Application\\msedge.exe`,
    `${process.env.ProgramFiles}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  ];
  const found = candidates.find((p) => p && existsSync(p));
  if (!found) throw new Error("ไม่เจอ Chrome/Edge — ตั้ง BROWSER=path/to/chrome แล้วรันใหม่");
  return found;
}

// ---------- เปิดเบราว์เซอร์แบบ headless แล้วต่อผ่าน DevTools Protocol ----------
const profile = mkdtempSync(join(tmpdir(), "drag-test-"));
const browser = spawn(findBrowser(), [
  "--headless=new",
  "--disable-gpu",
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  "about:blank",
]);

let ws;
let seq = 0;
const pending = new Map();
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, (m) => (m.error ? reject(new Error(`${method}: ${m.error.message}`)) : resolve(m.result)));
    ws.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (expr) =>
  (await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true })).result.value;

async function connect() {
  for (let i = 0; i < 40; i++) {
    try {
      const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })).json();
      ws = new WebSocket(target.webSocketDebuggerUrl);
      await new Promise((r) => ws.addEventListener("open", r, { once: true }));
      ws.addEventListener("message", (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id && pending.has(msg.id)) {
          pending.get(msg.id)(msg);
          pending.delete(msg.id);
        }
      });
      return;
    } catch {
      await sleep(250);
    }
  }
  throw new Error("ต่อเบราว์เซอร์ไม่ได้");
}

// ---------- อ่านสถานะจากหน้าจอ ----------
const center = (label) =>
  evaluate(`(() => {
    const el = document.querySelector('[aria-label="${label}"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  })()`);

// เล็งครึ่งบนของหม้อ — ครึ่งล่างจมอยู่หลังคอลัมน์การ์ด
const pot = () =>
  evaluate(`(() => { const r = document.querySelector('[data-pot]').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 4 }; })()`);

// มุมขวาบนของ hit box ที่มองไม่เห็น (ขอบจอ ตรงแถวข้อความ) — ห่างจากตัวหม้อ
const hitboxEdge = () =>
  evaluate(`(() => { const r = document.querySelector('[data-pot-hitbox]').getBoundingClientRect(); return { x: r.right - 25, y: r.top + 12 }; })()`);

const snapshot = () =>
  evaluate(`(() => {
    const [score, correct, wrong] = (document.querySelector('header')?.innerText.match(/\\d+/g) ?? []).map(Number);
    const label = [...document.querySelectorAll('p')].find(p => /\\+|\\.\\.\\.\\?/.test(p.textContent))?.textContent.trim();
    const potX = document.querySelector('[data-pot]').getBoundingClientRect().x;
    const card = document.querySelector('button[aria-label^="Take "][aria-label$=" back"]');
    const held = card ? { text: card.textContent.trim(), side: card.getBoundingClientRect().x < potX ? 'left' : 'right' } : null;
    const column = (name) => [...document.querySelectorAll('section[aria-label="' + name + '"] [aria-label]')].map(e => e.textContent.trim());
    const banner = document.querySelector('[data-time-up]')?.innerText.replace(/\\s+/g, ' ').trim() ?? null;
    return { score, correct, wrong, label, held, verbs: column('Verbs'), nouns: column('Nouns'), banner };
  })()`);

// รอจนเงื่อนไขเป็นจริง (เช็กทุก 200ms) — ไม่ fix เวลา sleep เพราะหน้าโหลดเร็วช้าไม่เท่ากัน
async function waitFor(check, timeoutMs) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    if (await check()) return;
    await sleep(200);
  }
}

// ---------- จำลองเมาส์ / นิ้ว ----------
async function mouseDrag(from, to) {
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: from.x, y: from.y });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: from.x, y: from.y, button: "left", clickCount: 1 });
  for (let i = 1; i <= 12; i++) {
    const x = from.x + ((to.x - from.x) * i) / 12;
    const y = from.y + ((to.y - from.y) * i) / 12;
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y, button: "left", buttons: 1 });
    await sleep(16);
  }
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: to.x, y: to.y, button: "left", clickCount: 1 });
  await sleep(500);
}

// ปัดนิ้วเร็ว ๆ (ไม่กดค้าง) — จับปัญหาค่าเริ่มต้นของ dnd-kit ที่ต้องกดค้าง 250ms บนจอสัมผัส
async function touchDrag(from, to) {
  await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: from.x, y: from.y }] });
  await sleep(50);
  for (let i = 1; i <= 12; i++) {
    const x = from.x + ((to.x - from.x) * i) / 12;
    const y = from.y + ((to.y - from.y) * i) / 12;
    await send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y }] });
    await sleep(16);
  }
  await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await sleep(500);
}

async function tap(p) {
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: p.x, y: p.y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: p.x, y: p.y, button: "left", clickCount: 1 });
  await sleep(300);
}

// ---------- ขั้นตอนทดสอบ ----------
let failed = 0;
async function step(name, action, expect) {
  await action();
  const s = await snapshot();
  const problems = Object.entries(expect).filter(([key, want]) =>
    typeof want === "function" ? !want(s[key]) : JSON.stringify(s[key]) !== JSON.stringify(want),
  );
  if (problems.length) failed++;
  const heldText = s.held ? `${s.held.text} (${s.held.side})` : "-";
  console.log(
    `${problems.length ? "FAIL" : "ok  "}  ${name.padEnd(34)} score ${String(s.score).padStart(3)}  ✅${s.correct} ❌${s.wrong}  ${String(s.label).padEnd(22)} held: ${heldText}`,
  );
  for (const [key, want] of problems) console.log(`        ${key}: got ${JSON.stringify(s[key])}, want ${typeof want === "function" ? want.toString() : JSON.stringify(want)}`);
}

try {
  await connect();
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 664, deviceScaleFactor: 2, mobile: true });
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await send("Page.navigate", { url: URL });
  await sleep(5000);

  await step("start", async () => {}, { score: 0, label: "...?", held: null });
  await step("mouse: eat -> pot", async () => mouseDrag(await center("verb eat"), await pot()), {
    label: "eat + ...",
    held: { text: "eat", side: "left" },
  });
  await step("mouse: jacket -> pot (wrong)", async () => mouseDrag(await center("noun jacket"), await pot()), {
    wrong: 1,
    label: "eat + jacket",
    held: null,
  });
  await sleep(1000);
  await step("mouse: eat -> edge of hit box", async () => mouseDrag(await center("verb eat"), await hitboxEdge()), {
    held: { text: "eat", side: "left" },
  });
  await step("mouse: apple -> pot (right)", async () => mouseDrag(await center("noun apple"), await pot()), {
    correct: 1,
    score: (v) => v > 0,
    label: (v) => /^-\d+ eat \+ apple$/.test(v),
    held: null,
  });
  await sleep(1000);
  await step("mouse: read -> pot", async () => mouseDrag(await center("verb read"), await pot()), {
    held: { text: "read", side: "left" },
  });
  await step("tap pot (take read back)", async () => tap(await pot()), { held: null, label: "...?" });
  await step("mouse: wear -> far from pot", async () => {
    const c = await center("verb wear");
    await mouseDrag(c, { x: c.x, y: 40 });
  }, { held: null, label: "...?" });
  await step("touch: feed -> pot", async () => touchDrag(await center("verb feed"), await pot()), {
    held: { text: "feed", side: "left" },
  });
  await step("touch: rabbit -> pot (right)", async () => touchDrag(await center("noun rabbit"), await pot()), {
    correct: 2,
    held: null,
  });
  await step("touch: jacket -> pot", async () => touchDrag(await center("noun jacket"), await pot()), {
    label: "... + jacket",
    held: { text: "jacket", side: "right" },
  });

  // ลากการ์ดไปวางทับอีกใบในคอลัมน์เดียวกัน = สลับที่ (read / wear ยังไม่ถูกใช้ อยู่บนกระดานตั้งแต่ต้น)
  const { verbs, nouns } = await snapshot();
  const swapped = verbs.map((t) => (t === "read" ? "wear" : t === "wear" ? "read" : t));
  await step("mouse: read -> wear (swap)", async () => mouseDrag(await center("verb read"), await center("verb wear")), {
    verbs: swapped,
    held: { text: "jacket", side: "right" },
  });
  await step("touch: read -> wear (swap back)", async () => touchDrag(await center("verb read"), await center("verb wear")), {
    verbs,
  });
  await step("mouse: read -> newspaper (no swap)", async () => mouseDrag(await center("verb read"), await center("noun newspaper")), {
    verbs,
    nouns,
    held: { text: "jacket", side: "right" },
  });

  // การ์ดใบบนสุดอยู่ติดหม้อ (คอลัมน์ทับครึ่งล่างของหม้อ) — ลากไปสลับกับใบที่ 2 ต้องสลับ ไม่ตกลงหม้อ
  const top = (await snapshot()).verbs;
  await step("mouse: top verb -> 2nd verb (swap, not pot)", async () => mouseDrag(await center(`verb ${top[0]}`), await center(`verb ${top[1]}`)), {
    verbs: [top[1], top[0], ...top.slice(2)],
    held: { text: "jacket", side: "right" },
  });

  // หมดเวลา: เปิดเกมใหม่ที่ยาวแค่ 8 วิ (?seconds=8 ใช้ได้เฉพาะตอน dev)
  const bannerHas = (text) => async () => ((await snapshot()).banner ?? "").includes(text);
  await send("Page.navigate", { url: `${URL}?seconds=8` });
  await sleep(3000);
  await step("timed game: eat -> pot (still playing)", async () => mouseDrag(await center("verb eat"), await pot()), {
    held: { text: "eat", side: "left" },
    banner: null,
  });
  await step("time up: banner shows, held word cleared", async () => waitFor(bannerHas("TIME'S UP!"), 15000), {
    banner: (v) => /TIME'S UP!/.test(v ?? "") && /Results in \d/.test(v ?? ""),
    held: null,
  });
  // eat ยังค้างอยู่ใน state — ถ้าล็อกไม่ติด apple จะเข้าคู่กับ eat แล้วคะแนนขึ้น
  await step("time up: apple -> pot does nothing", async () => mouseDrag(await center("noun apple"), await pot()), {
    score: 0,
    correct: 0,
    held: null,
  });
  await step("after countdown: waiting for results", async () => waitFor(bannerHas("Waiting for results"), 6000), {
    banner: (v) => /Waiting for results/.test(v ?? ""),
  });
} catch (err) {
  failed++;
  console.error(`FAIL  ${err.message}`);
  console.error("      เปิด `npm run dev` ไว้หรือยัง?");
} finally {
  ws?.close();
  browser.kill();
  await sleep(300);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {
    // บางครั้งเบราว์เซอร์ยังปิดไฟล์ไม่ทัน — ปล่อยไว้ในโฟลเดอร์ temp ได้
  }
}

console.log(failed ? `\n${failed} step(s) failed` : "\nall steps passed");
process.exitCode = failed ? 1 : 0;
