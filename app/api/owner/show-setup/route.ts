import { requireOwnerUser } from "@/lib/owner/auth";
import {
  isOwnerAuthed,
  ownerAuthFailureResponse,
  ownerJsonResponse,
} from "@/lib/owner/api-response";
import { loadShowSetupState, saveShowSetupState } from "@/lib/owner/show-setup-state";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const state = await loadShowSetupState();
    return ownerJsonResponse({ state });
  } catch (error) {
    console.error("[owner/show-setup] GET failed:", error);
    return ownerJsonResponse({ error: "Unable to load show setup." }, 500);
  }
}

export async function POST(request: Request) {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const state = await saveShowSetupState(
      (await request.json()) as Record<string, unknown>,
      auth.email,
    );
    return ownerJsonResponse({ ok: true, message: "Show setup saved to live event state.", state });
  } catch (error) {
    console.error("[owner/show-setup] POST failed:", error);
    return ownerJsonResponse(
      { error: error instanceof Error ? error.message : "Unable to save show setup." },
      500,
    );
  }
}
