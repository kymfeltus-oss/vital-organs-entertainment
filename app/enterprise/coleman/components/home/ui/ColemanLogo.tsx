import Image from "next/image";

import colemanLogo from "@/app/enterprise/coleman/coleman_logo.png";

type ColemanLogoProps = {
  className?: string;
  height?: number;
  priority?: boolean;
};

export default function ColemanLogo({
  className = "coleman-header-logo",
  height,
  priority = false,
}: ColemanLogoProps) {
  return (
    <Image
      src={colemanLogo}
      alt=""
      width={220}
      height={72}
      className={className}
      style={height !== undefined ? { height, width: "auto" } : { width: "auto" }}
      priority={priority}
    />
  );
}
