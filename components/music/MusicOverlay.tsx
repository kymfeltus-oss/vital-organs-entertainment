import Link from "next/link";

const movementCards = [
  {
    label: "Sow a Vital Seed",
    href: "/experience/giving",
    left: "4.5%",
    top: "85.2%",
    width: "44%",
    height: "11.5%",
  },
  {
    label: "Join the Movement",
    href: "/experience/join-movement",
    left: "51.5%",
    top: "85.2%",
    width: "44%",
    height: "11.5%",
  },
] as const;

export default function MusicOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {movementCards.map((card) => (
        <Link
          key={card.href}
          href={card.href}
          aria-label={card.label}
          className="pointer-events-auto absolute rounded-2xl bg-transparent transition hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          style={{
            left: card.left,
            top: card.top,
            width: card.width,
            height: card.height,
          }}
        />
      ))}
    </div>
  );
}
