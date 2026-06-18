/** Attendee email-gate — PNG art plate + overlay slot constants. */

export const AWAKENING_AUTH_LOGIN_ART = {
  width: 853,
  height: 1844,
} as const;

export const AWAKENING_AUTH_ASSETS = {
  attendeeLoginPlate: "/awakening/auth-attendee-login.png",
} as const;

export type AuthLayoutRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** Percentage rects aligned to auth-attendee-login.png (853×1844). */
export const AWAKENING_AUTH_LOGIN_PANELS = {
  email: { left: 11.5, top: 50.55, width: 77, height: 4.85 },
  password: { left: 11.5, top: 57.08, width: 77, height: 4.95 },
  rememberMe: { left: 12, top: 62.45, width: 24, height: 2.8 },
  forgotPassword: { left: 56, top: 62.35, width: 32, height: 2.8 },
  loginButton: { left: 11.5, top: 68.71, width: 77, height: 3.35 },
  createAccountButton: { left: 11.5, top: 73.97, width: 77, height: 3.35 },
  joinMovement: { left: 18, top: 82.5, width: 64, height: 3 },
  guestEntry: { left: 22, top: 86.8, width: 56, height: 3 },
} as const satisfies Record<string, AuthLayoutRect>;

/** Signup uses the same plate until a dedicated PNG lands. */
export const AWAKENING_AUTH_SIGNUP_PANELS = {
  firstName: { left: 11.5, top: 48.2, width: 37, height: 3.6 },
  lastName: { left: 51, top: 48.2, width: 37.5, height: 3.6 },
  email: { left: 11.5, top: 52.8, width: 77, height: 3.6 },
  password: { left: 11.5, top: 57.08, width: 77, height: 4.95 },
  submitButton: { left: 11.5, top: 73.97, width: 77, height: 3.35 },
  backToLogin: { left: 11.5, top: 68.71, width: 77, height: 3.35 },
} as const satisfies Record<string, AuthLayoutRect>;
