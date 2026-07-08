export const COLEMAN_ENTERED_KEY = "coleman-entered";

export function hasEnteredColemanSession(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return sessionStorage.getItem(COLEMAN_ENTERED_KEY) === "1";
}

export function markColemanSessionEntered(): void {
  sessionStorage.setItem(COLEMAN_ENTERED_KEY, "1");
}
