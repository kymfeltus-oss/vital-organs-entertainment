"use client";

import { motion } from "framer-motion";
import Link from "next/link";

type NeonButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  variant?: "primary" | "outline" | "magenta";
  className?: string;
  type?: "button" | "submit";
};

export default function NeonButton({
  children,
  onClick,
  href,
  disabled = false,
  variant = "primary",
  className = "",
  type = "button",
}: NeonButtonProps) {
  const base =
    "relative w-full overflow-hidden rounded-2xl px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-50";

  const variants = {
    primary:
      "border border-white/10 bg-gradient-to-r from-[#1E40AF] to-[#B0267A] text-white shadow-[0_0_35px_rgba(176,38,122,0.45)]",
    magenta:
      "border border-[#B0267A]/60 bg-[#111111]/80 text-white shadow-[0_0_28px_rgba(176,38,122,0.4)]",
    outline:
      "border border-white/20 bg-[#111111]/60 text-white hover:border-[#1E40AF]/50",
  };

  const content = (
    <>
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{ x: ["-120%", "220%"] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "linear", repeatDelay: 1.2 }}
      />
      <span className="relative z-10">{children}</span>
    </>
  );

  if (href && !disabled) {
    const isExternal = href.startsWith("http");
    const classes = `${base} ${variants[variant]} block text-center ${className}`;

    if (isExternal) {
      return (
        <motion.div whileTap={{ scale: 0.98 }} whileHover={{ scale: 1.01 }}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={classes}
          >
            {content}
          </a>
        </motion.div>
      );
    }

    return (
      <motion.div whileTap={{ scale: 0.98 }} whileHover={{ scale: 1.01 }}>
        <Link href={href} className={classes}>
          {content}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      whileHover={disabled ? undefined : { scale: 1.01 }}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {content}
    </motion.button>
  );
}
