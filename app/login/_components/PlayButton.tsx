interface PlayButtonProps {
  disabled?: boolean;
}

export default function PlayButton({ disabled }: PlayButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={`relative flex h-[55px] w-[206px] items-center justify-center transition active:scale-95 ${
        disabled ? "cursor-not-allowed opacity-50 grayscale" : "hover:brightness-110"
      }`}
    >
      <img
        src="/btn_primary.png"
        alt=""
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-fill select-none"
      />
      <span className="relative z-10 text-body tracking-wider text-primary-foreground select-none">
        PLAY!
      </span>
    </button>
  );
}