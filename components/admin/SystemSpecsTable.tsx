type SpecItem = {
  name: string;
  detail: string;
};

type SpecGroup = {
  groupTitle: string;
  items: SpecItem[];
};

export const SYSTEM_SPEC_GROUPS: SpecGroup[] = [
  {
    groupTitle: "01 // SANCTUARY CONTROL PLANE",
    items: [
      {
        name: "Preflight HLS Probes",
        detail:
          "Automated manifest reachability checks verify stream validity before service begins, eliminating dead air or connection dropouts.",
      },
      {
        name: "Sunday Layout Phase Routing",
        detail:
          "Attendees move from pre-service Holding Room countdowns into the Live Sanctuary Feed and post-service hubs without page reloads.",
      },
      {
        name: "Backstage Media Telemetry",
        detail:
          "Media team dashboards expose stream health, phase transitions, and sanctuary node status in one sovereign control surface.",
      },
    ],
  },
  {
    groupTitle: "02 // ALTAR INTERCESSION LAYERS",
    items: [
      {
        name: "In-Video Prayer Sheets",
        detail:
          "Congregants open an interactive panel inside the live player to submit active prayer requests without leaving the broadcast.",
      },
      {
        name: "Backstage Moderation Telemetry",
        detail:
          "Requests flow immediately to on-site intercessor dashboards for real-time response and screen updates.",
      },
      {
        name: "Sermon Archive Catalog",
        detail:
          "Luxury browse catalog for recorded messages with interactive chat replay covers that restore past event energy.",
      },
    ],
  },
  {
    groupTitle: "03 // FINΛNCIΛL SOVEREIGNTY & TΛX-FREE GIVING",
    items: [
      {
        name: "0% Transaction Fee Architecture",
        detail:
          "All platform support passes, digital ticketing, tithes, and offerings route directly to the ministry bank account. Parable takes 0.00% commission.",
      },
      {
        name: "Dynamic White-Label App Renaming",
        detail:
          "Ministries maintain total autonomy over app language. Instantly rename the primary 'PΛRΛBLE Giving' portal, token wallet counters, and sanctuary navigation tabs to match your local church identity.",
      },
      {
        name: "In-Stream Digital Offering Plates",
        detail:
          "Frictionless giving sheets processing one-time or recurring tithes securely over the active live video timeline without forcing stream reloads or browser redirects.",
      },
    ],
  },
  {
    groupTitle: "04 // HARDWARE & SCALE SYSTEMS",
    items: [
      {
        name: "vMix & X32 Integrations",
        detail:
          "Websocket pipelines sync remote dashboard operators to on-site hardware layers, tracking DVR recorders and mixer channels.",
      },
      {
        name: "Enterprise Security Posture",
        detail:
          "Sovereign account protection, encrypted routing, and ministry-owned data boundaries across every sanctuary node.",
      },
      {
        name: "Multi-Campus Scale",
        detail:
          "Built for ministries at scale with independent branding per campus while sharing one faith infrastructure core.",
      },
    ],
  },
];

export default function SystemSpecsTable() {
  return (
    <section
      id="specification"
      className="relative z-10 border-t border-white/10 bg-black"
      aria-label="System specifications"
    >
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <header className="mb-10 max-w-3xl">
          <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.38em] text-[#F5B400]">
            Procurement Specifications
          </p>
          <h2 className="text-2xl font-extrabold uppercase tracking-tight text-white md:text-3xl">
            Faith Infrastructure System Matrix
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[rgba(255,255,255,0.68)]">
            Every label, giving portal title, and navigation hub is fully customizable by your
            ministry operator through the Private Console Registry.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          {SYSTEM_SPEC_GROUPS.map((group) => (
            <article
              key={group.groupTitle}
              className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.04)] p-6 backdrop-blur-md"
            >
              <h3 className="mb-5 font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-[#F5B400]">
                {group.groupTitle}
              </h3>
              <ul className="space-y-4">
                {group.items.map((item) => (
                  <li key={item.name} className="border-b border-white/8 pb-4 last:border-0 last:pb-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-white">{item.name}</p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-[rgba(255,255,255,0.68)]">
                      {item.detail}
                    </p>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
