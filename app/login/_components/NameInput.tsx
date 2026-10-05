interface NameInputProps {
  value: string;
  onChange: (val: string) => void;
}

export default function NameInput({ value, onChange }: NameInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // กรองและลบเฉพาะตัวอักษรภาษาไทย (พยัญชนะ สระ วรรณยุกต์ เลขไทย) ออกทั้งหมด
    const noThai = e.target.value.replace(/[\u0E00-\u0E7F]/g, "");
    onChange(noThai);
  };

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
        onChange={handleChange}
        maxLength={10}
        autoComplete="off"
        spellCheck="false"
        className="relative z-10 h-full w-full bg-transparent px-4 text-center text-body text-foreground placeholder:text-muted outline-none select-none"
      />
    </div>
  );
}