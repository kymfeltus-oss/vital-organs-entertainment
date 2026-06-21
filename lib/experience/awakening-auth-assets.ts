/** Attendee email-gate — PNG art plate + overlay slot constants. */

import { MOBILE_ARTBOARD_REF } from "@/lib/responsive";

/** Bump when replacing PNG plates so browsers pick up new art. */
export const AWAKENING_AUTH_ASSET_VERSION = "20260621-auth-v6";

/** Same 1080×1920 stage as attendee dashboard. */
export const AWAKENING_AUTH_LOGIN_ART = MOBILE_ARTBOARD_REF;

/** Same 1080×1920 stage as attendee dashboard. */
export const AWAKENING_AUTH_SIGNUP_ART = MOBILE_ARTBOARD_REF;

/** Native pixel sizes of auth PNG plates (object-fit: contain, top-aligned). */
export const AWAKENING_AUTH_NATIVE = {
  login: { width: 941, height: 1672 },
  signup: { width: 941, height: 1672 },
} as const;

export const AWAKENING_AUTH_ASSETS = {
  attendeeLoginPlate: "/awakening/auth-attendee-login.png",
  /** Signup plate — edit `public/create-account/create-account -background.png` (synced to canonical copy). */
  attendeeSignupPlate: "/create-account/create-account-background.png",
} as const;

export function awakeningAuthAssetUrl(path: string): string {
  return `${path}?v=${AWAKENING_AUTH_ASSET_VERSION}`;
}

export type AuthLayoutRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** Percentage rects aligned to auth-attendee-login.png (1080×1920 stage). */
export const AWAKENING_AUTH_LOGIN_PANELS = {
  email: { left: 10, top: 48, width: 80, height: 6 },
  password: { left: 10, top: 53, width: 80, height: 5 },
  rememberMe: { left: 10, top: 58, width: 40, height: 4 },
  forgotPassword: { left: 50, top: 58, width: 40, height: 4 },
  loginButton: { left: 10, top: 61, width: 80, height: 6 },
  appleSignIn: { left: 10, top: 66, width: 26, height: 6 },
  googleSignIn: { left: 37, top: 66, width: 26, height: 6 },
  facebookSignIn: { left: 64, top: 66, width: 26, height: 6 },
  signUpLink: { left: 10, top: 85, width: 80, height: 7 },
} as const satisfies Record<string, AuthLayoutRect>;

/** Signup overlay slots — create-account background (1080×1920 stage). */
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
