import { isEncryptionConfigured } from "@/lib/streaming/encryption";
import type { StreamingWizardReadiness } from "@/lib/streaming/types";

export const TOKEN_ENCRYPTION_SETUP_MESSAGE =
  "TOKEN_ENCRYPTION_KEY is not set on this server. Add it in Vercel → Project → Settings → Environment Variables (Production), then redeploy. Stream keys and OAuth tokens cannot be saved until this is configured.";

export function getStreamingWizardReadiness(): StreamingWizardReadiness {
  const encryptionConfigured = isEncryptionConfigured();
  return {
    ready: encryptionConfigured,
    checks: {
      tokenEncryption: {
        ok: encryptionConfigured,
        message: encryptionConfigured
          ? "Token encryption is configured."
          : TOKEN_ENCRYPTION_SETUP_MESSAGE,
      },
    },
  };
}
