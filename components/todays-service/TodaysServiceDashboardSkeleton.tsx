"use client";

import { TS } from "@/components/todays-service/ServiceUi";

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/8 ${className}`} aria-hidden="true" />;
}

export default function TodaysServiceDashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading today's service dashboard">
      <div className="flex items-center justify-end">
        <SkeletonBlock className="h-4 w-36" />
      </div>

      <SkeletonBlock className="min-h-[96px] w-full" />
      <SkeletonBlock className="min-h-[120px] w-full" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-7">
        {Array.from({ length: 7 }).map((_, index) => (
          <SkeletonBlock key={index} className="min-h-[132px]" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className="min-h-[220px]" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonBlock key={index} className="min-h-[200px]" />
        ))}
      </div>
    </div>
  );
}
