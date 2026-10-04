"use client";

import { useEffect, useState } from "react";
import type { TeamId } from "@/lib/types";
import TeamSelector from "./_components/TeamSelector";
import PlayButton from "./_components/PlayButton";
import NameInput from "./_components/NameInput";
import { useRouter } from "next/navigation";
import { anonLogin } from "@/lib/anon-login";
import { leaveLobby } from "@/lib/lobby";

export default function LoginPage() {
  const [selectedTeam, setSelectedTeam] = useState<TeamId | null>(null);
  const [name, setName] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    leaveLobby();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedTeam || isLoading) return;

    setIsLoading(true);
    try {
      const doLogin = async () => {
        // เรียกใช้ Supabase Anonymous Login พร้อมส่งชื่อและทีม
        const res = await anonLogin({ username: name, team: selectedTeam });
        if (res.success) {
          router.push("/lobby");
        } else {
          alert(res.error || "Failed to join team. Please try again.");
        }
      };

      if (typeof window !== "undefined" && "locks" in navigator) {
        await navigator.locks.request("cauldron_login_lock", doLogin);
      } else {
        await doLogin();
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative mx-auto flex h-dvh w-full max-w-md flex-col items-center px-6 overflow-hidden select-none border-x border-border">
      
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-end justify-center">
        {/* pixel art 180×320 — ขยายเป็นจำนวนเต็ม + pixelated ถึงจะคม
            ถ้ายืดเต็มจอ (object-cover) จะได้ ×2.1–2.6 ไม่ลงตัว เบราว์เซอร์เกลี่ยสีจนเบลอ
            จอเตี้ย ×2 (360px), จอสูงตั้งแต่ 780px ×3 (540px ล้นซ้ายขวาได้ หม้ออยู่กลาง) หม้อจะใหญ่พอ ๆ กับเดิม */}
        <img
          src="/bg_login.gif"
          alt="Background Animation"
          width={360}
          height={640}
          className="w-[360px] max-w-none shrink-0 translate-y-[90px] [image-rendering:pixelated] [@media(min-height:780px)]:w-[540px]"
        />
      </div>

      <div className="relative z-10 flex w-full flex-col items-center pt-[54px]">
        <h1 className="text-center text-head font-bold text-primary [-webkit-text-stroke:2px_black] leading-tight select-none">
          Verb-Noun<br />Cauldron
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full flex flex-col items-center mt-[60px]"
      >
        <TeamSelector
          selectedTeam={selectedTeam}
          onSelectTeam={setSelectedTeam}
        />

        <div className="mt-[47px]">
          <NameInput value={name} onChange={setName} />
        </div>

        <div className="mt-[47px]">
          <PlayButton disabled={!name.trim() || !selectedTeam || isLoading} />
        </div>
      </form>
    </main>
  );
}