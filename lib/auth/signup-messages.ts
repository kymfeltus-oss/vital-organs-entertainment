/** Anti-enumeration messaging for signup and verification resend flows. */

export const SIGNUP_SUCCESS_MESSAGE =
  "If this email is eligible, check your inbox to continue.";

export const SIGNUP_GENERIC_ERROR_MESSAGE =
  "Unable to complete registration. Please try again later.";

export const SIGNUP_RATE_LIMIT_MESSAGE =
  "Too many registration attempts. Please wait before trying again.";

export const SIGNUP_CAPTCHA_MESSAGE =
  "Security verification failed. Refresh the page and try again.";

export const SIGNUP_VALIDATION_MESSAGE =
  "Please review the highlighted fields and try again.";

export const RESEND_VERIFICATION_SUCCESS_MESSAGE =
  "If this email is eligible, check your inbox for a new confirmation link.";

export type SignupApiSuccessPayload = {
  success: true;
  message: string;
  needsVerification: boolean;
};

export type SignupApiErrorPayload = {
  success: false;
  error: string;
};

export function buildSignupSuccessResponse(needsVerification: boolean): SignupApiSuccessPayload {
  return {
    success: true,
    message: SIGNUP_SUCCESS_MESSAGE,
    needsVerification,
  };
}

export function buildSignupErrorResponse(
  error: string = SIGNUP_GENERIC_ERROR_MESSAGE,
): SignupApiErrorPayload {
  return { success: false, error };
}
