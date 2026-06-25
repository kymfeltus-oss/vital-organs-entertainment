/** Shared service date formatting — safe for server and client components. */

export function formatServiceDate(dateStr: string, timeStr: string): string {
  try {
    const d = new Date(`${dateStr}T${timeStr}`);
    const day = d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const [h, m] = timeStr.split(":");
    const hour = Number(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${day} • ${h12}:${m ?? "00"} ${ampm} Service`;
  } catch {
    return `${dateStr} • ${timeStr}`;
  }
}

export function countdownLabel(dateStr: string, timeStr: string): string | undefined {
  try {
    const start = new Date(`${dateStr}T${timeStr}`).getTime();
    const diff = start - Date.now();
    if (diff <= 0) return undefined;
    const mins = Math.floor(diff / 60000);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `Starts in ${h > 0 ? `${h}:${String(m).padStart(2, "0")}` : `${m}:00`}`;
  } catch {
    return undefined;
  }
}
