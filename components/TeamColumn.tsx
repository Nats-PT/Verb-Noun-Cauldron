import { TEAM_SIZE, type Player } from "@/lib/types";

type TeamColumnProps = {
  title: string;
  players: Player[];
  currentPlayerId: string;
};

export default function TeamColumn({ title, players, currentPlayerId }: TeamColumnProps) {
  // เติมช่องว่างให้ครบ TEAM_SIZE เสมอ คนจะได้เห็นว่ายังรับได้อีกกี่คน
  const emptySlots = Math.max(TEAM_SIZE - players.length, 0);

  return (
    <section className="flex min-h-0 flex-col rounded-lg border-2 border-border bg-surface p-3">
      <h2 className="text-center text-body">
        {title}
        <span className="block text-score text-muted">
          {players.length}/{TEAM_SIZE}
        </span>
      </h2>

      <ul className="mt-2 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {players.map((player) => {
          const isMe = player.id === currentPlayerId;
          return (
            <li
              key={player.id}
              className={`rounded border-2 px-2 py-1 ${isMe ? "border-primary" : "border-transparent"}`}
            >
              <p className="truncate text-body">{player.name}</p>
              <p className={`text-score ${player.isReady ? "text-ready" : "text-muted"}`}>
                {player.isReady ? "READY" : "waiting"}
                {isMe && <span className="text-primary"> (you)</span>}
              </p>
            </li>
          );
        })}

        {Array.from({ length: emptySlots }, (_, i) => (
          <li
            key={`empty-${i}`}
            className="rounded border-2 border-dashed border-border px-2 py-1 text-score text-muted"
          >
            Open slot
          </li>
        ))}
      </ul>
    </section>
  );
}
