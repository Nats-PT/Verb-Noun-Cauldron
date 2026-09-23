type TeamSelectorProps = {
  selectedTeam: string | null;
  onSelectTeam: (team: string) => void;
};

export default function TeamSelector({ selectedTeam, onSelectTeam }: { selectedTeam: string | null; onSelectTeam: (team: string) => void }) {
  return (
    <div className="flex flex-col items-center">
      <p className="text-white text-lg font-bold mb-4">Select Your Team</p>
      <div className="flex space-x-4">
        <button
          type="button"
          onClick={() => onSelectTeam("Team 1")}
          className={`w-[100px] h-[55px] rounded-2xl border-2 border-[#C35CEC] font-black text-xl shadow-md transition-all select-none [-webkit-tap-highlight-color:transparent] ${
            selectedTeam === "Team 1"
              ? "bg-[#B857F2] text-white border-[#C35CEC]"
              : "bg-[#3C3041] text-white border-[#C35CEC]"
          }`}
        >
          Team 1
        </button>
        <button
          type="button"
          onClick={() => onSelectTeam("Team 2")}
          className={`w-[100px] h-[55px] rounded-2xl border-2 border-[#C35CEC] font-black text-xl shadow-md transition-all select-none [-webkit-tap-highlight-color:transparent] ${
            selectedTeam === "Team 2"
              ? "bg-[#B857F2] text-white border-[#C35CEC]"
              : "bg-[#3C3041] text-white border-[#C35CEC]"
          }`}
        >
          Team 2
        </button>
      </div>
    </div>
  );
}