import Link from "next/link";

const destinations = [
  {
    href: "/dashboard/live",
    label: "Live Room",
    description: "Enter the awakening live stream experience.",
  },
  {
    href: "/dashboard/vital-seed",
    label: "Vital Sound Giving",
    description: "Every gift has a frequency. Sow your seed.",
  },
  {
    href: "/dashboard/merch",
    label: "Awakening Merch",
    description: "Official apparel and album pre-orders.",
  },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen w-full bg-[#0B090A] p-6 pt-safe pb-safe text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4">
        <header className="mb-4 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#1E40AF]">
            300 Awakening
          </p>
          <h1 className="mt-2 text-2xl font-bold uppercase tracking-widest">
            Dashboard
          </h1>
        </header>

        {destinations.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-2xl border border-white/15 bg-[#111111] p-5 transition hover:border-[#1E40AF]/60 hover:shadow-[0_0_24px_rgba(30,64,175,0.25)]"
          >
            <p className="text-sm font-bold uppercase tracking-[0.2em]">
              {item.label}
            </p>
            <p className="mt-2 text-sm text-zinc-400">{item.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
