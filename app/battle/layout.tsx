import type { Viewport } from "next";

// ใช้เฉพาะหน้า battle: ให้เว็บวาดเต็มจอถึงขอบ แล้วเราเว้นขอบเองตาม safe area
// (Dynamic Island / รอยบาก / แถบ Home) — ค่า env(safe-area-inset-*) จะมีผลก็ต่อเมื่อตั้ง cover
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#14121c", // สีแถบเบราว์เซอร์บนมือถือ ให้กลืนกับพื้นหลังเกม (--background)
};

export default function BattleLayout({ children }: LayoutProps<"/battle">) {
  // ล็อกทั้งหน้าไม่ให้เลื่อน แถบ URL จะได้ไม่หดขยายจนหน้ากระตุกระหว่างลากการ์ด
  return <div className="fixed inset-0 overflow-hidden overscroll-none">{children}</div>;
}
