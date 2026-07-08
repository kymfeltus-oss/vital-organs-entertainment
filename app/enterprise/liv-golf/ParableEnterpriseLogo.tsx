import Image from "next/image";
import parableLogo from "./parable_logo.png";

type ParableEnterpriseLogoProps = {
  className?: string;
};

export default function ParableEnterpriseLogo({ className = "" }: ParableEnterpriseLogoProps) {
  return (
    <div className={className}>
      <Image
        src={parableLogo}
        alt="PARABLE Enterprise"
        className="h-[54px] w-auto sm:h-[58px]"
        priority
      />
    </div>
  );
}
