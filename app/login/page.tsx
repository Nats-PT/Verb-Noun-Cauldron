"use client";

import { useState } from "react";
import type { TeamId } from "@/lib/types";
import TeamSelector from "./_components/TeamSelector";
import PlayButton from "./_components/PlayButton";
import NameInput from "./_components/NameInput";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [selectedTeam, setSelectedTeam] = useState<TeamId | null>(null);
  const [name, setName] = useState<string>("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedTeam) return;
    console.log("Submitting:", { name, team: selectedTeam });
    router.push("/lobby");
  };

  return (
    <main className="relative mx-auto flex h-dvh w-full max-w-md flex-col items-center px-6 overflow-hidden select-none border-x border-border">
      
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-end justify-center">
        <img
          src="/bg_login.gif"
          alt="Background Animation"
          className="h-full w-full object-cover object-bottom translate-y-[90px]" 
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
          <PlayButton disabled={!name.trim() || !selectedTeam} />
        </div>
      </form>
    </main>
  );
}