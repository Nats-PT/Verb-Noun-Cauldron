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
      className={`w-[206px] h-[55px] rounded-2xl border-2 border-[#B857F2] font-black text-xl shadow-md transition-all select-none [-webkit-tap-highlight-color:transparent] ${
        disabled
          ? "bg-gray-500 text-gray-300 cursor-not-allowed opacity-60" //ถ้ายังไม่กรอกชื่อหรือเลือกทีม จะเป็นสีเทาและไม่สามารถคลิกได้
          : "bg-[#B857F2] text-[#F9E943] active:scale-95 active:brightness-90 cursor-pointer"
      }`}
    >
      PLAY!
    </button>
  );
}