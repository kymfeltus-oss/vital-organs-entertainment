import { NextResponse } from "next/server";

import { recognizeSong } from "@/app/enterprise/coleman/lib/recognize-song";
import type { RecognizeRequest } from "@/app/enterprise/coleman/shared/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RecognizeRequest;
    const overview = await recognizeSong(body);
    return NextResponse.json(overview);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Recognition failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
