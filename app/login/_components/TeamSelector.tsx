import type { TeamId } from "@/lib/types";

interface TeamSelectorProps {
  selectedTeam: TeamId | null;
  onSelectTeam: (team: TeamId) => void;
}

export default function TeamSelector({
  selectedTeam,
  onSelectTeam,
}: TeamSelectorProps) {
  return (
    <div className="flex w-full justify-center gap-4">
      {/* Team 1 */}
      <button
        type="button"
        onClick={() => onSelectTeam(1)}
        className="relative flex h-[55px] w-[125px] items-center justify-center transition active:scale-95"
      >
        <img
          src={
            selectedTeam === 1
              ? "/btn_team_Selected.png"
              : "/btn_team_Unselected.png"
          }
          alt="Team 1"
          className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-fill select-none"
        />
        <span
          className={`relative z-10 text-body select-none ${
            selectedTeam === 1 ? "text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          Team 1
        </span>
      </button>

      {/* Team 2 */}
      <button
        type="button"
        onClick={() => onSelectTeam(2)}
        className="relative flex h-[55px] w-[125px] items-center justify-center transition active:scale-95"
      >
        <img
          src={
            selectedTeam === 2
              ? "/btn_team_Selected.png"
              : "/btn_team_Unselected.png"
          }
          alt="Team 2"
          className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-fill select-none"
        />
        <span
          className={`relative z-10 text-body select-none ${
            selectedTeam === 2 ? "text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          Team 2
        </span>
      </button>
    </div>
  );
}