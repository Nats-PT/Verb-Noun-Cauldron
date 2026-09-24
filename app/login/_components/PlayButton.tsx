type PlayButtonProps = {
  disabled?: boolean;
  onClick?: () => void;
};

export default function PlayButton({ disabled = false, onClick }: PlayButtonProps) {
  return (
    <button
      type="submit"
      onClick={onClick}
      disabled={disabled}
      className={`w-[206px] h-[55px] rounded-2xl border-2 border-border font-black text-body shadow-md transition-all select-none [-webkit-tap-highlight-color:transparent] ${
        disabled
          ? "bg-primary text-muted cursor-not-allowed opacity-60"
          : "bg-primary text-foreground hover:bg-primary-hover active:scale-95 active:brightness-90 cursor-pointer"
      }`}
    >
      PLAY!
    </button>
  );
}

      