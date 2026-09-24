"use client";

import React from "react";
import type { TeamId } from "@/lib/types"; // TeamId = 1 | 2 
type TeamSelectorProps = {
  selectedTeam: TeamId | null;
  onSelectTeam: (team: TeamId) => void;
};

export default function TeamSelector({
  selectedTeam,
  onSelectTeam,
}: TeamSelectorProps) {
  const teams: TeamId[] = [1, 2];

  return (
    <div className="flex gap-4">
      {teams.map((teamId) => {
        const isSelected = selectedTeam === teamId;

        return (
          <button
            key={teamId}
            type="button"
            onClick={() => onSelectTeam(teamId)}
            className={`w-[125px] h-[55px] flex items-center justify-center rounded-2xl border-2 text-body transition-all select-none cursor-pointer active:scale-95 active:brightness-90 ${isSelected
                ? "border-primary bg-primary text-foreground shadow-md"
                : "border-border bg-surface text-muted hover:border-primary"
            }`}
          >
            Team {teamId}
          </button>
        );
      })}
    </div>
  );
}