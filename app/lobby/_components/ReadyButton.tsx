type ReadyButtonProps = {
  isReady: boolean;
  onToggle: () => void;
};

export default function ReadyButton({ isReady, onToggle }: ReadyButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isReady}
      className={`h-16 w-full rounded-lg text-body transition-colors ${
        isReady
          ? "border-2 border-ready bg-transparent text-ready"
          : "bg-primary text-foreground hover:bg-primary-hover"
      }`}
    >
      {isReady ? "Cancel Ready" : "Ready"}
    </button>
  );
}
