import Link from "next/link";
import { formatSeedBalance } from "@/lib/live/emotes";
import {
  getEventTicketTier,
  getMerchProduct,
  SEED_ECONOMY_PACKS,
} from "@/lib/merch/catalog";

export type DashboardOrderRow = {
  id: string;
  product_type: string;
  amount_total: number;
  status: string;
  created_at: string;
};

type RegisteredDashboardViewProps = {
  userId: string;
  userEmail: string;
  memberSince: string;
  seedBalance: number;
  orders: DashboardOrderRow[];
};

function resolveProductLabel(productType: string): string {
  const ticketTier = getEventTicketTier(productType);
  if (ticketTier) return ticketTier.name;

  const merchProduct = getMerchProduct(productType);
  if (merchProduct) return merchProduct.title;

  const seedPack = SEED_ECONOMY_PACKS.find((pack) => pack.productId === productType);
  if (seedPack) return seedPack.title;

  return productType;
}

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatMemberSince(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const SHORTCUTS = [
  { href: "/dashboard/live", label: "Live Stream Stage", detail: "Concert hub + emotes" },
  { href: "/dashboard/merch", label: "Event Store", detail: "Merch + ticket tiers" },
  { href: "/dashboard/vital-seed", label: "Vital Seed Portal", detail: "Harvest + giving" },
] as const;

export default function RegisteredDashboardView({
  userId,
  userEmail,
  memberSince,
  seedBalance,
  orders,
}: RegisteredDashboardViewProps) {
  return (
    <main className="min-h-dvh w-full bg-[#0B090A] pt-safe pb-safe text-white">
      <div className="grid w-full grid-cols-1 gap-6 p-6 md:grid-cols-12">
        <header className="md:col-span-12">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#1E40AF]">
            Registered Command Center
          </p>
          <h1 className="mt-2 text-xl font-bold uppercase tracking-widest md:text-2xl">
            Your Awakening Dashboard
          </h1>
        </header>

        <section className="rounded-2xl border border-[#1E40AF]/35 bg-[#111111]/80 p-6 md:col-span-4">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.24em] text-[#1E40AF]">
            User Analytics Profile
          </p>
          <p className="mt-4 text-sm text-zinc-400">Account</p>
          <p className="mt-1 break-all text-sm font-semibold text-white">{userEmail}</p>
          <p className="mt-4 text-sm text-zinc-400">Member ID</p>
          <p className="mt-1 break-all font-mono text-xs text-zinc-300">{userId}</p>
          <p className="mt-4 text-sm text-zinc-400">Member Since</p>
          <p className="mt-1 text-sm text-white">{formatMemberSince(memberSince)}</p>
          <span className="mt-5 inline-flex rounded-full border border-[#1E40AF]/50 bg-[#1E40AF]/10 px-4 py-2 text-sm font-bold text-white shadow-[0_0_16px_rgba(30,64,175,0.35)]">
            {formatSeedBalance(seedBalance)}
          </span>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#111111]/80 p-6 md:col-span-4">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.24em] text-zinc-400">
            Platform Shortcuts
          </p>
          <ul className="mt-4 space-y-3">
            {SHORTCUTS.map((shortcut) => (
              <li key={shortcut.href}>
                <Link
                  href={shortcut.href}
                  className="block rounded-xl border border-white/10 bg-[#0B090A]/80 px-4 py-3 transition hover:border-[#1E40AF]/50 hover:bg-[#1E40AF]/10"
                >
                  <p className="text-sm font-semibold text-white">{shortcut.label}</p>
                  <p className="mt-1 text-xs text-zinc-500">{shortcut.detail}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#111111]/80 p-6 md:col-span-4">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.24em] text-zinc-400">
            Live Database Activity
          </p>
          {orders.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-white/15 bg-[#0B090A]/80 px-4 py-8 text-center">
              <p className="text-sm font-semibold text-zinc-300">No paid receipts yet</p>
              <p className="mt-2 text-xs text-zinc-500">
                Your micro-transaction ledger will populate after your first checkout.
              </p>
              <Link
                href="/dashboard/merch"
                className="mt-4 inline-flex rounded-full border border-[#1E40AF]/50 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#93c5fd]"
              >
                Visit Event Store
              </Link>
            </div>
          ) : (
            <ul className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {orders.map((order) => (
                <li
                  key={order.id}
                  className="rounded-xl border border-white/10 bg-[#0B090A]/80 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {resolveProductLabel(order.product_type)}
                      </p>
                      <p className="mt-1 font-mono text-[0.65rem] text-zinc-500">
                        {new Date(order.created_at).toLocaleString("en-US")}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-[#1E40AF]">
                      {formatCurrency(order.amount_total)}
                    </span>
                  </div>
                  <p className="mt-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-emerald-400">
                    {order.status}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
