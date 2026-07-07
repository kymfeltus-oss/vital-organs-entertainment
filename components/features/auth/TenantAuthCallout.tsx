import { PLATFORM_APP_NAME } from "@/lib/theme/brand";

type TenantAuthCalloutProps = {
  variant?: "login" | "signup";
};

export default function TenantAuthCallout({
  variant = "login",
}: TenantAuthCalloutProps) {
  return (
    <div
      className="mt-6 rounded-xl border px-4 py-5 text-center glass-panel"
      style={{ borderColor: "var(--theme-border)" }}
      aria-label={`${PLATFORM_APP_NAME} welcome message`}
    >
      <p
        className="text-[clamp(1.1rem,4.5vw,1.35rem)] font-semibold leading-tight"
        style={{ fontFamily: "var(--theme-font-headline)", color: "var(--theme-primary)" }}
      >
        Welcome to {PLATFORM_APP_NAME}
      </p>
      <p
        className="mt-2 text-[0.58rem] font-bold uppercase tracking-[0.22em]"
        style={{ color: "var(--theme-text-muted)" }}
      >
        Live · Connect · Engage
      </p>
      <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--theme-text-muted)" }}>
        {variant === "signup"
          ? "Create your account and step into the experience."
          : "Sign in with your email to continue your journey."}
      </p>
    </div>
  );
}
