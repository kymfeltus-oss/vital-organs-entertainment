import VitalSeedBackground from "@/components/vital-seed/giving/VitalSeedBackground";

export default function VitalSeedGivingPage() {
  return (
    <main className="relative h-dvh min-h-dvh w-full overflow-hidden bg-brand-black">
      <div className="vital-giving-stage">
        <VitalSeedBackground variant="mobile" />
        <VitalSeedBackground variant="desktop" />
      </div>
    </main>
  );
}
