import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type GlassButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "circle" | "capsule";
  href?: string;
};

const sizeMap = {
  sm: "h-11 min-h-11 w-11 min-w-11",
  md: "h-11 min-h-11 w-11 min-w-11",
  lg: "h-[60px] min-h-[60px] w-[60px] min-w-[60px]",
};

export default function GlassButton({
  children,
  className = "",
  size = "md",
  variant = "circle",
  type = "button",
  href,
  ...props
}: GlassButtonProps) {
  const shape = variant === "capsule" ? "rounded-full px-3 py-2.5" : "rounded-full";
  const classes = `coleman-glass-btn inline-flex items-center justify-center transition ${sizeMap[size]} ${shape} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
