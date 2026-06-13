import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth/session";
import { getProductionBrain, GoLiveBlockedError } from "@/services/broadcast/ProductionBrain";
import type { TransitionType } from "@/lib/broadcast/types";

type CommandBody = {
  action?: string;
  sourceId?: string;
  transition?: TransitionType;
  supervisorOverride?: boolean;
  supervisorReason?: string;
  rehearsalMode?: boolean;
};

export async function POST(request: NextRequest) {
  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as CommandBody;
    const brain = getProductionBrain();
    const uiOverrides = {
      supervisorOverride: body.supervisorOverride === true,
      supervisorReason: body.supervisorReason?.trim() ?? "",
      rehearsalMode: body.rehearsalMode === true,
    };

    let store;

    switch (body.action) {
      case "set_preview":
        if (!body.sourceId) {
          return NextResponse.json({ error: "sourceId required." }, { status: 400 });
        }
        store = await brain.executeCommand(
          { type: "set_preview", sourceId: body.sourceId },
          uiOverrides,
        );
        break;
      case "transition":
        if (!body.transition) {
          return NextResponse.json({ error: "transition required." }, { status: 400 });
        }
        store = await brain.executeCommand(
          { type: "transition", transition: body.transition },
          uiOverrides,
        );
        break;
      case "go_live":
        try {
          store = await brain.executeCommand({ type: "go_live" }, uiOverrides);
        } catch (error) {
          if (error instanceof GoLiveBlockedError) {
            return NextResponse.json(
              {
                ok: false,
                error: error.message,
                store: await brain.hydrateStore(uiOverrides),
              },
              { status: 409 },
            );
          }
          throw error;
        }
        break;
      case "stop_live":
      case "end_live":
        store = await brain.executeCommand({ type: "end_live" }, uiOverrides);
        break;
      default:
        return NextResponse.json({ error: "Invalid command." }, { status: 400 });
    }

    return NextResponse.json({ ok: true, store });
  } catch (error) {
    console.error("[BROADCAST_COMMAND_ERR]:", error);
    return NextResponse.json({ error: "Unable to execute command." }, { status: 500 });
  }
}
