export function formatLiveStartLabel(targetDateTime: string | null | undefined): string {
  const liveStartDate = targetDateTime ? new Date(targetDateTime) : null;
  if (!liveStartDate || Number.isNaN(liveStartDate.getTime())) {
    return "No start time loaded";
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(liveStartDate);
}
