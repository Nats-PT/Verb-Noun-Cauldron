"use client";

import { useState } from "react";
import TeamSelector from "./_components/TeamSelector";
import PlayButton from "./_components/PlayButton";

export default function LoginPage() {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [name, setName] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting:", { name, team: selectedTeam });
  };

  return (
    <main className="relative mx-auto flex h-dvh w-full flex-col items-center overflow-hidden select-none"> 
        {/* ชื่อเกม(LOGO)  */}
        <div className="w-full mt-[54px] text-center">
          <h1 className="text-[60px] font-bold text-[#C35CEC] [-webkit-text-stroke:2px_black] leading-tight select-none">
            Verb-Noun<br />Cauldron
          </h1>
        </div>

        {/* 2. ฟอร์มควบคุม: ห่างจากหัวข้อลงมา 60px */}
        <form
          onSubmit={handleSubmit}
          className="w-full flex flex-col items-center mt-[60px]"
        >
          {/* เลือกทีม 1 หรือ ทีม 2 */}
          <TeamSelector
            selectedTeam={selectedTeam}
            onSelectTeam={setSelectedTeam}
          />

          {/* ช่องกรอกชื่อ: ห่าง 47px ขนาดกว้าง 206px สูง 55px */}
          <div className="w-full flex justify-center mt-[47px]">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-[206px] h-[55px] px-4 text-center text-lg text-white border-2 border-[#C35CEC] bg-[#3C3041] rounded-2xl placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C35CEC] transition shadow-sm"
            />
          </div>

          {/* ปุ่ม PLAY!: ห่างจากช่องชื่อ 47px ขนาดกว้าง 206px สูง 55px */}
          <div className="w-full flex justify-center mt-[47px]">
            <PlayButton disabled={!name.trim() || !selectedTeam} />
          </div>
        </form>

    </main>
  );
}