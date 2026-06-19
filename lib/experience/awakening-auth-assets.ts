/** Attendee email-gate — PNG art plate + overlay slot constants. */

export const AWAKENING_AUTH_LOGIN_ART = {
  width: 853,
  height: 1844,
} as const;

export const AWAKENING_AUTH_ASSETS = {
  attendeeLoginPlate: "/awakening/auth-attendee-login.png",
  /** Reuses login plate until a dedicated signup PNG lands. */
  attendeeSignupPlate: "/awakening/auth-attendee-login.png",
} as const;

export type AuthLayoutRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** Percentage rects aligned to auth-attendee-login.png (853×1844). */
export const AWAKENING_AUTH_LOGIN_PANELS = {
  email: { left: 12.66, top: 50.43, width: 74.33, height: 1.84 },
  password: { left: 12.66, top: 55.48, width: 74.33, height: 1.57 },
  rememberMe: { left: 12.66, top: 58.6, width: 24, height: 2.0 },
  forgotPassword: { left: 56, top: 58.5, width: 31, height: 2.0 },
  loginButton: { left: 12.66, top: 64.5, width: 74.33, height: 3.2 },
  createAccountButton: { left: 12.66, top: 68.7, width: 74.33, height: 2.8 },
  joinMovement: { left: 18, top: 82.5, width: 64, height: 3 },
  guestEntry: { left: 22, top: 86.8, width: 56, height: 3 },
} as const satisfies Record<string, AuthLayoutRect>;

/** Signup overlay slots — same 853×1844 plate until dedicated signup PNG lands. */
export const AWAKENING_AUTH_SIGNUP_PANELS = {
  firstName: { left: 11.5, top: 42.5, width: 37, height: 3.6 },
  lastName: { left: 51, top: 42.5, width: 37.5, height: 3.6 },
  email: { left: 11.5, top: 47.2, width: 77, height: 3.6 },
  phone: { left: 11.5, top: 51.9, width: 77, height: 3.6 },
  city: { left: 11.5, top: 56.6, width: 40, height: 3.6 },
  state: { left: 53.5, top: 56.6, width: 35, height: 3.6 },
  password: { left: 11.5, top: 61.3, width: 77, height: 4.2 },
  confirmPassword: { left: 11.5, top: 66.5, width: 77, height: 4.2 },
  termsCheckbox: { left: 12, top: 71.2, width: 6, height: 2.8 },
  submitButton: { left: 11.5, top: 75.5, width: 77, height: 3.35 },
  backToLogin: { left: 11.5, top: 80.2, width: 77, height: 3 },
  avatarUpload: { left: 11.5, top: 84.5, width: 77, height: 5.5 },
} as const satisfies Record<string, AuthLayoutRect>;
