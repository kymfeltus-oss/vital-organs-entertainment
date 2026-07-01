type AttendeeAuthAwakeningCalloutProps = {
  variant?: "login" | "signup";
};

export default function AttendeeAuthAwakeningCallout({
  variant = "login",
}: AttendeeAuthAwakeningCalloutProps) {
  return (
    <div
      className="mt-6 rounded-xl border border-brand-border/80 bg-brand-panel/35 px-4 py-5 text-center shadow-[0_0_32px_rgba(0,168,255,0.06)]"
      aria-label="300 Awakening welcome message"
    >
      <p className="font-headline text-[clamp(1.1rem,4.5vw,1.35rem)] uppercase leading-tight tracking-[0.12em] text-brand-gradient">
        THE AWAKENING IS HERE
      </p>
      <p className="mt-2 font-ui text-[0.58rem] font-bold uppercase tracking-[0.22em] text-brand-blue">
        LIVE · EMPOWER · TRANSFORM
      </p>
      <p className="mt-3 font-body text-sm leading-relaxed text-brand-muted">
        {variant === "signup"
          ? "Create your account and step into the experience."
          : "Sign in with your email to continue your journey."}
      </p>
    </div>
  );
}
