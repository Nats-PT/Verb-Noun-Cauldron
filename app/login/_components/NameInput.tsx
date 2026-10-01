interface NameInputProps {
  value: string;
  onChange: (val: string) => void;
}

export default function NameInput({ value, onChange }: NameInputProps) {
  return (
    <div className="relative mx-auto flex h-[55px] w-[206px] items-center justify-center">
      <img
        src="/login/input-bg.png"
        alt=""
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-fill select-none [image-rendering:pixelated]"
      />
      <input
        type="text"
        placeholder="Name"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={15}
        className="relative z-10 h-full w-full bg-transparent px-4 text-center text-body text-foreground placeholder:text-muted outline-none select-none"
      />
    </div>
  );
}