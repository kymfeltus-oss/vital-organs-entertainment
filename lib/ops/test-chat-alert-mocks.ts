/** Mock attendee complaints for ops chat-alert diagnostics (dev simulator). */
export const MOCK_CHAT_ALERT_COMPLAINTS = [
  "Hey, the screen is totally frozen! Can anyone fix this?",
  "Is the stream muted? I can't hear anything on my phone.",
  "The screen went completely black for me just now.",
  "Audio is dead, no sound at all coming through the video player.",
  "Everything looks great from Dallas, excited for tonight!",
] as const;

export function resolveMockChatAlertComplaint(index?: number): string {
  if (
    typeof index === "number" &&
    Number.isInteger(index) &&
    index >= 0 &&
    index < MOCK_CHAT_ALERT_COMPLAINTS.length
  ) {
    return MOCK_CHAT_ALERT_COMPLAINTS[index];
  }

  const randomIndex = Math.floor(Math.random() * MOCK_CHAT_ALERT_COMPLAINTS.length);
  return MOCK_CHAT_ALERT_COMPLAINTS[randomIndex];
}
