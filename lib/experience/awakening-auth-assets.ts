/** Attendee email-gate — PNG art plate + overlay slot constants. */

export const AWAKENING_AUTH_LOGIN_ART = {
  width: 853,
  height: 1844,
} as const;

/** Native create-account plate — `/public/create-account/create-account-background.png`. */
export const AWAKENING_AUTH_SIGNUP_ART = {
  width: 1024,
  height: 1536,
} as const;

export const AWAKENING_AUTH_ASSETS = {
  attendeeLoginPlate: "/awakening/auth-attendee-login.png",
  attendeeSignupPlate: "/create-account/create-account%20-background.png",
} as const;

export type AuthLayoutRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** Percentage rects aligned to auth-attendee-login.png (853×1844). */
export const AWAKENING_AUTH_LOGIN_PANELS = {
  email: { left: 12.66, top: 50.54, width: 74.68, height: 5.2 },
  password: { left: 12.66, top: 55.31, width: 74.68, height: 5.3 },
  rememberMe: { left: 12.66, top: 60.2, width: 28, height: 3.2 },
  forgotPassword: { left: 54, top: 60.2, width: 33, height: 3.2 },
  loginButton: { left: 12.66, top: 62.91, width: 74.68, height: 5.8 },
  appleSignIn: { left: 12.66, top: 68.33, width: 74.68, height: 4.6 },
  googleSignIn: { left: 12.66, top: 73.2, width: 74.68, height: 4.6 },
  facebookSignIn: { left: 12.66, top: 78.1, width: 74.68, height: 4.6 },
  signUpLink: { left: 12.66, top: 88.2, width: 74.68, height: 4 },
} as const satisfies Record<string, AuthLayoutRect>;

/** Signup overlay slots — create-account -background.png (941×1672). */
export const AWAKENING_AUTH_SIGNUP_PANELS = {
  firstName: { left: 8.5, top: 30.5, width: 40, height: 4.5 },
  lastName: { left: 52, top: 30.5, width: 40.5, height: 4.5 },
  email: { left: 8.5, top: 37.96, width: 84, height: 4.82 },
  phone: { left: 8.5, top: 44.08, width: 84, height: 4.82 },
  city: { left: 8.5, top: 50.13, width: 42, height: 4.88 },
  state: { left: 52, top: 50.13, width: 40.5, height: 4.88 },
  password: { left: 8.5, top: 56.25, width: 84, height: 4.82 },
  confirmPassword: { left: 8.5, top: 62.3, width: 84, height: 4.75 },
  termsCheckbox: { left: 8.5, top: 67.5, width: 7, height: 2.5 },
  submitButton: { left: 8.5, top: 82.5, width: 84, height: 4.5 },
  backToLogin: { left: 8.5, top: 86.98, width: 84, height: 3.65 },
  avatarUpload: { left: 8.5, top: 74.41, width: 84, height: 12.43 },
} as const satisfies Record<string, AuthLayoutRect>;
