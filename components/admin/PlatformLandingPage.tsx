import Image from "next/image";
import Link from "next/link";
import PlanSelectionCta from "@/components/admin/PlanSelectionCta";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  Check,
  ChevronDown,
  Globe2,
  Headphones,
  Heart,
  LockKeyhole,
  ShieldCheck,
  Zap,
} from "lucide-react";
import styles from "./PlatformLandingPage.module.css";

const PLANS = [
  {
    id: "starter",
    name: "STARTER NODE",
    price: "$149",
    tone: "blue",
    cta: "Get Started",
    featured: false,
    features: [
      "Shared Subdomain Entry",
      "Basic Analytics",
      "720p HD Distribution",
      "Email Support",
      "1 Active Live Chat Room",
    ],
  },
  {
    id: "pro",
    name: "NETWORK PRO",
    price: "$499",
    tone: "purple",
    cta: "Deploy Now",
    featured: true,
    features: [
      "Custom Domain Mapping (//brand.com)",
      "Full Embedded Stripe Checkout",
      "1080p High-Bitrate Pipelines",
      "Advanced Analytics",
      "vMix Integrations & Hooks",
      "Priority Support",
    ],
  },
  {
    id: "enterprise",
    name: "ENTERPRISE STACK",
    price: "$1,499",
    tone: "pink",
    cta: "Contact Sales",
    featured: false,
    features: [
      "Native Mobile App Packaging (App Store & Google Play)",
      "Custom Enterprise Codebase",
      "4K Extreme Bitrate",
      "Dedicated Infrastructure",
      "Uncapped Chat Grids",
      "24/7 Priority Support",
    ],
  },
] as const;

const TRUST = [
  { icon: ShieldCheck, label: <>Broadcast Grade<br />Infrastructure</> },
  { icon: Globe2, label: <>Global CDN<br />Network</> },
  { icon: Activity, label: <>99.99% Uptime<br />Enterprise SLA</> },
  { icon: ShieldCheck, label: <>SOC 2 Type II<br />Compliant</> },
  { icon: LockKeyhole, label: <>End-to-End<br />Encrypted</> },
  { icon: Headphones, label: <>24/7 Elite<br />Support</> },
] as const;

const STAGE_IMAGE = "/300/ChatGPT Image Jun 14, 2026, 01_38_35 AM.png";

function Wordmark() {
  return (
    <div className={styles.wordmark} aria-label="Parable Streaming">
      <span>PARABLE</span>
      <small>STREAMING</small>
    </div>
  );
}

function LiveStudio() {
  return (
    <section className={styles.studio} aria-label="Live studio product preview">
      <div className={styles.studioHeader}>
        <b>LIVE STUDIO</b>
        <span className={styles.liveDot}>● LIVE</span>
        <span>00:28:45</span>
        <span className={styles.connection}>●&nbsp; vMix Connected</span>
        <span className={styles.connection}>●&nbsp; X32 Online</span>
      </div>
      <div className={styles.cameras}>
        {["CAM 1", "CAM 2", "CAM 3", "CAM 4"].map((label, index) => (
          <div className={styles.camera} key={label}>
            <span>{label}</span>
            {index === 0 ? <b>PGM</b> : null}
            <div
              className={styles.cameraImage}
              style={{
                backgroundImage: `linear-gradient(180deg, transparent 35%, rgba(4,1,14,.58)), url(\"${STAGE_IMAGE}\")`,
                backgroundPosition: `${index * 28}% bottom`,
              }}
            />
          </div>
        ))}
      </div>
      <div className={styles.mixer}>
        <b>X32 MIXER</b>
        <div className={styles.channels}>
          {Array.from({ length: 17 }).map((_, index) => (
            <div className={styles.channel} key={index}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <i style={{ height: `${18 + ((index * 7) % 22)}px` }} />
            </div>
          ))}
          <div className={styles.master}><span>MASTER</span><i /></div>
        </div>
      </div>
      <div className={styles.wallet}>
        <div><small>TOKEN WALLET</small><b>◉ 2,450.00</b></div>
        <div><small>●&nbsp; Live Cheers</small><b>342</b></div>
        <div><small>●&nbsp; Backstage Passes</small><b>128</b></div>
        <button type="button"><Heart size={13} /> Send Cheer</button>
      </div>
    </section>
  );
}

export default function PlatformLandingPage() {
  return (
    <main id="main-content" className={styles.page}>
      <div className={styles.ambient} aria-hidden="true" />
      <nav className={styles.nav} aria-label="Primary navigation">
        <Link href="/" className={styles.logoLink}><Wordmark /></Link>
        <div className={styles.navLinks}>
          <a href="#pricing">Platform <ChevronDown size={14} /></a>
          <a href="#pricing">Solutions <ChevronDown size={14} /></a>
          <a href="#pricing">Technology <ChevronDown size={14} /></a>
          <a href="#pricing">Resources <ChevronDown size={14} /></a>
          <a href="#pricing">Pricing</a>
          <a href="/contact-us">Company <ChevronDown size={14} /></a>
        </div>
        <Link href="/onboarding" className={styles.registry}>Console Registry <ArrowRight size={18} /></Link>
      </nav>

      <div className={styles.content}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}><b>PARABLE OS</b><span>SOVEREIGN MEDIA INFRASTRUCTURE</span></div>
            <h1>Own Your Stream.<br />Own Your Brand.<br />Own Your Revenue.<br /><em>Go Global.</em></h1>
            <p>Enterprise-grade infrastructure, hardware telemetry, and automated token economics — so you keep 100% of your monetization, 100% of your advertising inventory, and 100% of your brand identity.</p>
            <div className={styles.heroActions}>
              <Link href="/onboarding">Deploy Architecture <ArrowRight size={17} /></Link>
              <a href="#pricing">View Pricing Plans <ArrowDown size={16} /></a>
            </div>
          </div>

          <div className={styles.heroBrand}>
            <div className={styles.flagshipCrop}>
              <Image
                src="/tenant-default/dashboard/flagship-logo.png"
                alt="Parable Streaming globe mark"
                fill
                priority
                sizes="540px"
              />
            </div>
            <div className={styles.brandMantra}>
              <span>OWN YOUR <b>STREAM</b></span><i />
              <span>OWN YOUR <b>BRAND</b></span><i />
              <span>OWN YOUR <b>REVENUE</b></span><i />
              <span>GO <b>GLOBAL</b></span>
            </div>
          </div>

          <LiveStudio />
        </section>

        <section id="pricing" className={styles.pricing}>
          <div className={styles.pricingBanner}><Zap size={22} fill="#ffe200" /><span>0% TRANSACTION FEES — <b>RETAIN 100% OF YOUR REVENUE</b></span></div>
          <div className={styles.plans}>
            {PLANS.map((plan) => (
              <article className={`${styles.plan} ${styles[plan.tone]} ${plan.featured ? styles.featured : ""}`} key={plan.id}>
                {plan.featured ? <span className={styles.popular}>MOST POPULAR</span> : null}
                <h2>{plan.name}</h2>
                <div className={styles.price}>{plan.price}<small>/mo</small></div>
                <ul>{plan.features.map((feature) => <li key={feature}><Check size={13} />{feature}</li>)}</ul>
                <PlanSelectionCta tierId={plan.id}>{plan.cta}</PlanSelectionCta>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.trustStrip} aria-label="Platform assurances">
          {TRUST.map(({ icon: Icon, label }, index) => <div key={index}><Icon /><span>{label}</span></div>)}
        </section>
      </div>
    </main>
  );
}
