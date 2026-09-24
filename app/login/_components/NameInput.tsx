"use client";

type NameInputProps = {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
};

export default function NameInput({
  value,
  onChange,
  maxLength = 10,
}: NameInputProps) {
  return (
    <div className="w-full flex justify-center mt-[47px]">
      <input
        type="text"
        placeholder="Name"
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-[206px] h-[55px] px-4 text-center text-body 
                   text-foreground border-2 border-border bg-surface 
                   rounded-2xl placeholder:text-muted focus:outline-none 
                   focus:border-primary transition shadow-sm"
      />
    </div>
  );
}


        