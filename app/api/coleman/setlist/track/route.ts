import { NextResponse } from "next/server";

import { toTrackData } from "@/app/enterprise/coleman/lib/db-mappers";
import { prisma } from "@/app/enterprise/coleman/lib/prisma";
import { validateCreateTrack } from "@/app/enterprise/coleman/lib/validation";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const validation = validateCreateTrack(body);

    if (validation.ok === false) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const payload = body as Record<string, unknown>;
    const artist =
      typeof payload.artist === "string" && payload.artist.trim()
        ? payload.artist.trim()
        : "Unknown Artist";

    const createdTrackRecord = await prisma.track.create({
      data: {
        title: validation.value.title,
        artist,
        musicalKey: validation.value.musicalKey,
        bpm: validation.value.bpm > 0 ? validation.value.bpm : null,
      },
      include: {
        audioFiles: true,
      },
    });

    return NextResponse.json(toTrackData(createdTrackRecord), { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create track.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
