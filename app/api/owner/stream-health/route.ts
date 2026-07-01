import { requireOwnerUser } from "@/lib/owner/auth";
import { ownerAuthFailureResponse, ownerJsonResponse, isOwnerAuthed } from "@/lib/owner/api-response";
import { buildStreamHealthReport } from "@/lib/owner/stream-health";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const report = await buildStreamHealthReport();
    return ownerJsonResponse(report);
  } catch (error) {
    console.error("[owner/stream-health] GET failed:", error);
    return ownerJsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to evaluate stream health.",
      },
      500,
    );
  }
}
