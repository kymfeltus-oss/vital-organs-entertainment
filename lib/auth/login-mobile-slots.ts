/** Overlay layout for `/login` — `auth-attendee-login.png` (941×1672) on 1080×1920 stage. */

export type LoginOverlayRect = {
  left: string;
  top: string;
  width: string;
  height: string;
};

function slot(left: number, top: number, width: number, height: number): LoginOverlayRect {
  return {
    left: `${left}%`,
    top: `${top}%`,
    width: `${width}%`,
    height: `${height}%`,
  };
}

/** Absolute slots — measured on auth-attendee-login.png. */
export const LOGIN_FIELD_SLOTS = {
  email: slot(10, 48, 80, 6),
  password: slot(10, 53, 80, 5),
  options: slot(10, 58, 80, 4),
  submit: slot(10, 61, 80, 6),
  socialRow: slot(10, 66, 80, 6),
  signUp: slot(10, 85, 80, 7),
} as const satisfies Record<string, LoginOverlayRect>;

/** Hides baked PNG copy on options + sign-up rows — inputs use transparent overlay on glass art. */
export const LOGIN_BAKED_FIELD_MASKS: LoginOverlayRect[] = [
  LOGIN_FIELD_SLOTS.options,
  LOGIN_FIELD_SLOTS.signUp,
];

/** @deprecated Use LOGIN_BAKED_FIELD_MASKS. */
export const LOGIN_BAKED_FORM_MASK: LoginOverlayRect = {
  left: "0%",
  top: "46%",
  width: "100%",
  height: "46%",
};

/** @deprecated Flex panel — use LOGIN_FIELD_SLOTS. */
export const LOGIN_FORM_PANEL: LoginOverlayRect = {
  left: "0%",
  top: "0%",
  width: "100%",
  height: "100%",
};
