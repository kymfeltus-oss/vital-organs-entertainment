/** Overlay layout for `/login` — `auth-attendee-login.png` on 1080×1920 stage. */

export type LoginOverlayRect = {
  left: string;
  top: string;
  width: string;
  height: string;
};

/** Hides baked inputs, buttons, and social row on the login PNG. */
export const LOGIN_BAKED_FORM_MASK: LoginOverlayRect = {
  left: "0%",
  top: "49%",
  width: "100%",
  height: "41%",
};

/** Native login form — below hero copy on the PNG. */
export const LOGIN_FORM_PANEL: LoginOverlayRect = {
  left: "8.5%",
  top: "49.5%",
  width: "83%",
  height: "40%",
};
