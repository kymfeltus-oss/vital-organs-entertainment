import { requireOwnerUser } from "@/lib/owner/auth";
import { resolveExternalIngestCredentials } from "@/lib/owner/resolve-external-ingest-credentials";
import { resolveIvsIngestCredentials } from "@/lib/owner/resolve-ivs-config";
import {
  ownerAuthFailureResponse,
  ownerJsonResponse,
  isOwnerAuthed,
} from "@/lib/owner/api-response";

export const dynamic = "force-dynamic";

/** Returns RTMP ingest credentials for authorized ADMIN_EMAILS operators only. */
export async function GET() {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  const primary = resolveExternalIngestCredentials();
  const backup = resolveIvsIngestCredentials();
  return ownerJsonResponse({
    primary,
    backup,
    credentials: primary,
    authorizedEmail: auth.email,
  });
}