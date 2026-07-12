import { getLivLiveKitEgressReadiness } from "@/lib/enterprise/liv-golf/livekit-egress-readiness";
import { requireOwnerUser } from "@/lib/owner/auth";
import { isOwnerAuthed, ownerAuthFailureResponse, ownerJsonResponse } from "@/lib/owner/api-response";

export const dynamic = "force-dynamic";

/** Report whether LiveKit HLS egress can start (Open to Fans preflight). */
export async function GET() {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  const readiness = getLivLiveKitEgressReadiness();
  return ownerJsonResponse({
    success: true,
    ready: readiness.ready,
    blockers: readiness.blockers,
  });
}
