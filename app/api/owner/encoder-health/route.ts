import { requireOwnerUser } from "@/lib/owner/auth";
import { ownerAuthFailureResponse, ownerJsonResponse, isOwnerAuthed } from "@/lib/owner/api-response";
import { buildEncoderHealthReport } from "@/lib/owner/encoder-health";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const report = await buildEncoderHealthReport();
    return ownerJsonResponse(report);
  } catch (error) {
    console.error("[owner/encoder-health] GET failed:", error);
    return ownerJsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to probe encoder health.",
      },
      500,
    );
  }
}
