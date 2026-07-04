export default function OwnerSoundLoading() {
  return (
    <main className="min-h-dvh bg-[#020405] p-2 text-white">
      <div className="h-12 animate-pulse border border-white/10 bg-white/[0.03]" />
      <div className="mt-2 grid gap-2 xl:grid-cols-[14rem_minmax(0,1fr)_14rem]">
        <div className="h-80 animate-pulse border border-white/10 bg-white/[0.03]" />
        <div className="h-[42rem] animate-pulse border border-white/10 bg-white/[0.03]" />
        <div className="h-80 animate-pulse border border-white/10 bg-white/[0.03]" />
      </div>
    </main>
  );
}
