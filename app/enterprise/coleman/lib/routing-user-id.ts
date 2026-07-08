const ROUTING_USER_KEY = "coleman-routing-user-id";

export function getRoutingUserId(): string {
  if (typeof window === "undefined") {
    return "global_session_user";
  }

  const existing = window.localStorage.getItem(ROUTING_USER_KEY)?.trim();
  if (existing) {
    return existing;
  }

  const created =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `coleman_${Date.now()}`;

  window.localStorage.setItem(ROUTING_USER_KEY, created);
  return created;
}
