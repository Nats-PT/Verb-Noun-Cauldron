"use client";

import { useState } from "react";
import Image from "next/image"; //รอใส่หม้อ
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
      
      <div className="w-full mt-[54px] text-center">
        <h1 className="text-head font-bold text-primary [-webkit-text-stroke:2px_black] leading-tight select-none">
          Verb-Noun<br />Cauldron
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full flex flex-col items-center mt-[60px]"
      >
        {/* เลือกทีม */}
        <TeamSelector
          selectedTeam={selectedTeam}
          onSelectTeam={setSelectedTeam}
        />

        {/*ช่องกรอกชื่อ*/}
        <NameInput value={name} onChange={setName} />
        

        {/*ปุ่มPLAY*/}
        <div className="w-full flex justify-center mt-[47px]">
          <PlayButton disabled={!name.trim() || !selectedTeam} />
        </div>
      </form>
    </main>
  );
}