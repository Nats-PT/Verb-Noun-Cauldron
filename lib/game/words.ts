// คลังคำของเกม: 40 verb · 60 noun · 255 คู่ (ระดับ A2–B1)
//
// ⚠️ ร่างแรก — ต้องให้คนที่เก่งภาษาอังกฤษตรวจก่อนใช้จริง โดยเฉพาะ PAIRS
// เกมนี้สอนภาษา ถ้าคู่ที่ถูกจริงแต่ไม่อยู่ในรายการ ผู้เล่นจะโดนนับว่าผิดทั้งที่ตอบถูก
//
// กติกาของคลังคำ (ตรวจด้วยสคริปต์ทุกครั้งที่แก้):
// - ทุกคำต้องเข้าคู่ได้อย่างน้อย 3 คำ ผู้เล่นจะได้ต้องคิด ไม่ใช่จำคู่ตายตัว
// - คำยาวไม่เกิน 12 ตัวอักษร ไม่ให้ล้นการ์ด
// - ไม่ใช้ verb กว้างเกินไป (take, get, buy, clean ...) เพราะเข้าได้กับแทบทุก noun
//   จนเดาถูกได้โดยไม่ต้องรู้ภาษา และไล่ใส่คู่ที่ถูกได้ไม่ครบ
import type { CefrLevel, NounCategory, Word, WordPair } from "./types";

const VERBS: Record<string, CefrLevel> = {
  eat: "A2", drink: "A2", cook: "A2", bake: "B1", boil: "B1",
  pour: "B1", slice: "B1", taste: "A2", open: "A2", close: "A2",
  lock: "B1", copy: "A2", wear: "A2", iron: "B1", fold: "B1",
  drive: "A2", ride: "A2", catch: "A2", miss: "A2", park: "A2",
  reserve: "B1", read: "A2", write: "A2", send: "A2", print: "B1",
  plan: "A2", cancel: "B1", call: "A2", answer: "A2", feed: "A2",
  plant: "B1", grow: "A2", cut: "A2", decorate: "B1", brush: "A2",
  fill: "A2", empty: "A2", hang: "A2", mark: "B1", wipe: "B1",
};

const NOUNS: Record<string, { level: CefrLevel; category: NounCategory }> = {
  // food (13)
  apple: { level: "A2", category: "food" },
  bread: { level: "A2", category: "food" },
  cake: { level: "A2", category: "food" },
  egg: { level: "A2", category: "food" },
  soup: { level: "A2", category: "food" },
  pizza: { level: "A2", category: "food" },
  rice: { level: "A2", category: "food" },
  fish: { level: "A2", category: "food" },
  coffee: { level: "A2", category: "food" },
  tea: { level: "A2", category: "food" },
  water: { level: "A2", category: "food" },
  sandwich: { level: "A2", category: "food" },
  vegetables: { level: "A2", category: "food" },
  // home (10)
  door: { level: "A2", category: "home" },
  window: { level: "A2", category: "home" },
  table: { level: "A2", category: "home" },
  plate: { level: "A2", category: "home" },
  bottle: { level: "A2", category: "home" },
  phone: { level: "A2", category: "home" },
  fridge: { level: "A2", category: "home" },
  box: { level: "A2", category: "home" },
  cup: { level: "A2", category: "home" },
  bag: { level: "A2", category: "home" },
  // clothes (10)
  shirt: { level: "A2", category: "clothes" },
  dress: { level: "A2", category: "clothes" },
  shoes: { level: "A2", category: "clothes" },
  coat: { level: "A2", category: "clothes" },
  jacket: { level: "A2", category: "clothes" },
  skirt: { level: "A2", category: "clothes" },
  trousers: { level: "A2", category: "clothes" },
  glasses: { level: "A2", category: "clothes" },
  uniform: { level: "B1", category: "clothes" },
  scarf: { level: "A2", category: "clothes" },
  // travel (10)
  car: { level: "A2", category: "travel" },
  bus: { level: "A2", category: "travel" },
  train: { level: "A2", category: "travel" },
  bicycle: { level: "A2", category: "travel" },
  taxi: { level: "A2", category: "travel" },
  ticket: { level: "A2", category: "travel" },
  map: { level: "A2", category: "travel" },
  seat: { level: "A2", category: "travel" },
  room: { level: "A2", category: "travel" },
  suitcase: { level: "B1", category: "travel" },
  // school & work (10)
  book: { level: "A2", category: "school" },
  letter: { level: "A2", category: "school" },
  email: { level: "A2", category: "school" },
  homework: { level: "A2", category: "school" },
  exam: { level: "A2", category: "school" },
  report: { level: "B1", category: "school" },
  message: { level: "A2", category: "school" },
  newspaper: { level: "A2", category: "school" },
  lesson: { level: "A2", category: "school" },
  meeting: { level: "B1", category: "school" },
  // nature (7)
  tree: { level: "A2", category: "nature" },
  flower: { level: "A2", category: "nature" },
  dog: { level: "A2", category: "nature" },
  cat: { level: "A2", category: "nature" },
  horse: { level: "A2", category: "nature" },
  rabbit: { level: "A2", category: "nature" },
  garden: { level: "A2", category: "nature" },
};

// verb → noun ที่เข้าคู่ได้ (อ่านเป็นประโยค: "eat an apple", "open the door")
const PAIRS: Record<string, string[]> = {
  eat: ["apple", "bread", "cake", "egg", "soup", "pizza", "rice", "fish", "sandwich", "vegetables"],
  drink: ["coffee", "tea", "water"],
  cook: ["egg", "soup", "rice", "fish", "vegetables"],
  bake: ["bread", "cake", "pizza", "fish", "apple"],
  boil: ["egg", "water", "rice", "vegetables"],
  pour: ["coffee", "tea", "water", "soup"],
  slice: ["bread", "cake", "apple", "pizza", "vegetables", "fish"],
  taste: ["apple", "bread", "cake", "egg", "soup", "pizza", "rice", "fish", "coffee", "tea", "water", "sandwich", "vegetables"],
  open: ["door", "window", "box", "bag", "book", "letter", "email", "suitcase", "map", "bottle", "fridge", "message", "newspaper"],
  close: ["door", "window", "box", "bag", "book", "suitcase", "bottle", "fridge"],
  lock: ["door", "window", "car", "bicycle", "bag", "suitcase", "box", "phone", "room"],
  copy: ["homework", "report", "map", "letter", "message"],
  wear: ["shirt", "dress", "shoes", "coat", "jacket", "skirt", "trousers", "glasses", "uniform", "scarf"],
  iron: ["shirt", "dress", "jacket", "skirt", "trousers", "uniform", "scarf"],
  fold: ["shirt", "dress", "jacket", "skirt", "trousers", "uniform", "scarf", "coat", "letter", "map", "glasses", "newspaper"],
  drive: ["car", "bus", "train", "taxi"],
  ride: ["bicycle", "horse", "bus", "train"],
  catch: ["bus", "train", "taxi", "fish", "rabbit"],
  miss: ["bus", "train", "lesson", "meeting", "exam"],
  park: ["car", "bicycle", "bus", "taxi"],
  reserve: ["room", "ticket", "table", "seat"],
  read: ["book", "letter", "email", "map", "report", "message", "newspaper"],
  write: ["book", "letter", "email", "report", "message"],
  send: ["letter", "email", "report", "homework", "book", "box", "flower", "message"],
  print: ["letter", "email", "report", "homework", "ticket", "map", "exam", "book", "newspaper"],
  plan: ["lesson", "meeting", "garden"],
  cancel: ["meeting", "lesson", "ticket", "taxi", "exam", "room", "seat"],
  call: ["taxi", "dog", "cat", "meeting"],
  answer: ["phone", "door", "email", "letter", "message"],
  feed: ["dog", "cat", "horse", "rabbit", "fish"],
  plant: ["tree", "flower", "garden", "rice", "vegetables"],
  grow: ["tree", "flower", "rice", "garden", "vegetables"],
  cut: ["bread", "cake", "apple", "pizza", "fish", "tree", "flower", "sandwich", "vegetables"],
  decorate: ["cake", "room", "table", "tree"],
  brush: ["dog", "cat", "horse", "rabbit", "shoes"],
  fill: ["cup", "box", "bag", "suitcase", "bottle", "fridge", "plate"],
  empty: ["cup", "box", "bag", "suitcase", "bottle", "fridge", "plate"],
  hang: ["shirt", "dress", "jacket", "scarf", "coat", "map", "uniform", "skirt", "trousers"],
  mark: ["exam", "homework", "map"],
  wipe: ["table", "window", "glasses", "cup", "shoes", "phone", "plate", "seat"],
};

export const WORD_POOL: Word[] = [
  ...Object.entries(VERBS).map(([text, level]): Word => ({ id: `v-${text}`, text, kind: "verb", level })),
  ...Object.entries(NOUNS).map(([text, { level, category }]): Word => ({
    id: `n-${text}`,
    text,
    kind: "noun",
    level,
    category,
  })),
];

export const WORD_PAIRS: WordPair[] = Object.entries(PAIRS).flatMap(([verb, nouns]) =>
  nouns.map((noun): WordPair => [verb, noun]),
);

export function findWord(kind: Word["kind"], text: string): Word {
  const word = WORD_POOL.find((w) => w.kind === kind && w.text === text);
  if (!word) throw new Error(`Unknown ${kind}: ${text}`);
  return word;
}
