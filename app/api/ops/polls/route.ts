import { NextRequest, NextResponse } from "next/server";
import {
  createLivePoll,
  listLivePolls,
  setLivePollActive,
  validateCreatePollInput,
} from "@/lib/experience/polls-server";
import { requireOpsAdminApiUser } from "@/lib/ops/assert-ops-admin";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type OpsPollActionBody = {
  action?: string;
  poll_id?: string;
  question?: string;
  option_a?: string;
  option_b?: string;
  activate?: boolean;
};

export async function GET() {
  const gate = await requireOpsAdminApiUser();
  if (gate.response) return gate.response;

  try {
    const admin = getSupabaseAdmin();
    const polls = await listLivePolls(admin);
    return NextResponse.json({ polls }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[OPS_POLLS_GET_ERR]:", error);
    return NextResponse.json({ error: "Unable to load polls." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const gate = await requireOpsAdminApiUser();
  if (gate.response) return gate.response;

  try {
    const body = (await request.json()) as OpsPollActionBody;
    const action = body.action?.trim();
    const admin = getSupabaseAdmin();

    if (action === "create") {
      const validation = validateCreatePollInput(body as Record<string, unknown>);
      if (validation.ok === false) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const poll = await createLivePoll(admin, validation.input);
      return NextResponse.json({ poll });
    }

    const pollId = body.poll_id?.trim();
    if (!pollId) {
      return NextResponse.json({ error: "poll_id is required." }, { status: 400 });
    }

    if (action === "activate") {
      const poll = await setLivePollActive(admin, pollId, true);
      if (!poll) {
        return NextResponse.json({ error: "Poll not found." }, { status: 404 });
      }
      return NextResponse.json({ poll });
    }

    if (action === "deactivate") {
      const poll = await setLivePollActive(admin, pollId, false);
      if (!poll) {
        return NextResponse.json({ error: "Poll not found." }, { status: 404 });
      }
      return NextResponse.json({ poll });
    }

    if (action === "deactivate_all") {
      await admin.from("live_polls").update({ is_active: false }).eq("is_active", true);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid poll action." }, { status: 400 });
  } catch (error) {
    console.error("[OPS_POLLS_POST_ERR]:", error);
    return NextResponse.json({ error: "Unable to update polls." }, { status: 500 });
  }
}
