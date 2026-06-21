/** Overlay slots for `/create-account` — `create-account -background.png` (941×1672). */

export type CreateAccountOverlayRect = {
  left: string;
  top: string;
  width: string;
  height: string;
};

/** Black mask — hides baked form, footer OR strip, and baked login link on the PNG. */
export const CREATE_ACCOUNT_BAKED_FORM_MASK: CreateAccountOverlayRect = {
  left: "0%",
  top: "32%",
  width: "100%",
  height: "67%",
};

/** Native form panel — below hero title + tagline (do not overlap AWAKENING header). */
export const CREATE_ACCOUNT_FORM_PANEL: CreateAccountOverlayRect = {
  left: "8.5%",
  top: "33.2%",
  width: "83%",
  height: "58%",
};
