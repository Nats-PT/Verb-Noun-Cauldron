import type { Metadata } from "next";
import { isMasterView } from "@/lib/master";
import MasterScreen from "./_components/MasterScreen";
import MasterStage from "./_components/MasterStage";
import PinGate from "./_components/PinGate";

export const metadata: Metadata = {
  title: "Master — Verb-Noun Cauldron",
};

// จอ TV ในบูธ (1920×1080) — เปิด URL นี้ทิ้งไว้ จอจะสลับ prepare / battle / winner / leaderboard เองตามสถานะเกม
// ตอนพัฒนา: /master?view=prepare (หรือ battle, winner, leaderboard) บังคับโชว์จอนั้น
export default async function MasterPage({ searchParams }: PageProps<"/master">) {
  const { view } = await searchParams;

  return (
    <MasterStage>
      <PinGate>
        <MasterScreen forcedView={isMasterView(view) ? view : null} />
      </PinGate>
    </MasterStage>
  );
}
