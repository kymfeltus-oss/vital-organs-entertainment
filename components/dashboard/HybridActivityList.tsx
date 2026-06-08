"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  formatActivityTimeAgo,
  formatAttendeeActivityMessage,
  type LiveActivityItem,
} from "@/lib/live/live-activity";

const AVATAR_COLORS = [
  "bg-[#1E40AF]",
  "bg-[#B0267A]",
  "bg-[#6366f1]",
  "bg-[#7c3aed]",
  "bg-[#1E40AF]",
] as const;

type HybridActivityListProps = {
  items: LiveActivityItem[];
  variant: "movement" | "chat" | "harvest" | "prayer";
  className?: string;
};

function avatarIndexForId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash + id.charCodeAt(i)) % AVATAR_COLORS.length;
  }
  return hash;
}

export default function HybridActivityList({
  items,
  variant,
  className = "",
}: HybridActivityListProps) {
  if (variant === "movement") {
    return (
      <div className={`space-y-2.5 overflow-hidden ${className}`}>
        <AnimatePresence initial={false} mode="popLayout">
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.28 }}
              className="flex items-start gap-2"
            >
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1E40AF] shadow-[0_0_8px_rgba(30,64,175,0.8)]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.72rem] font-bold uppercase tracking-[0.1em] text-white">
                  {item.name}
                </p>
                <p className="truncate text-[0.65rem] capitalize text-zinc-400">
                  {formatAttendeeActivityMessage(item)}
                </p>
              </div>
              <span className="shrink-0 text-[0.65rem] text-[#A1A1AA]">
                {formatActivityTimeAgo(item.createdAt)}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  if (variant === "prayer") {
    return (
      <div className={`space-y-2.5 overflow-hidden ${className}`}>
        <AnimatePresence initial={false} mode="popLayout">
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28 }}
              className="flex items-start gap-2"
            >
              <span className="mt-1 text-[#B0267A]">♥</span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[0.78rem] text-white">
                  {formatAttendeeActivityMessage(item)}
                </p>
                <p className="text-[0.65rem] text-[#A1A1AA]">
                  {formatActivityTimeAgo(item.createdAt)}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  if (variant === "harvest") {
    return (
      <div className={`space-y-2 overflow-hidden ${className}`}>
        <AnimatePresence initial={false} mode="popLayout">
          {items.map((item) => (
            <motion.p
              key={item.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.24 }}
              className="truncate text-[0.62rem] font-bold uppercase tracking-[0.12em] text-zinc-300"
            >
              {formatAttendeeActivityMessage(item)}
            </motion.p>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={`space-y-3 overflow-hidden ${className}`}>
      <AnimatePresence initial={false} mode="popLayout">
        {items.map((item) => {
          const color = AVATAR_COLORS[avatarIndexForId(item.id)];
          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="flex gap-2.5"
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-black text-white ${color}`}
              >
                {item.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[0.78rem] font-bold text-[#93c5fd]">{item.name}</p>
                <p className="text-[0.78rem] text-white">
                  {formatAttendeeActivityMessage(item)}
                </p>
                <p className="text-[0.65rem] text-[#A1A1AA]">
                  {formatActivityTimeAgo(item.createdAt)}
                </p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
