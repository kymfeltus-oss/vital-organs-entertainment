import Image from "next/image";
import livGolfLogo from "./liv-golf_logo.png";

type LivGolfLogoProps = {
  className?: string;
};

export default function LivGolfLogo({ className = "" }: LivGolfLogoProps) {
  return (
    <Image
      src={livGolfLogo}
      alt="LIV Golf"
      className={`h-[34px] w-auto invert sm:h-[38px] ${className}`}
      priority
    />
  );
}
