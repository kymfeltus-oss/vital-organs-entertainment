import { NextResponse } from "next/server";

import { toTrackData } from "@/app/enterprise/coleman/lib/db-mappers";
import { prisma } from "@/app/enterprise/coleman/lib/prisma";
import { validateCreateTrack } from "@/app/enterprise/coleman/lib/validation";

export async function GET() {
  try {
    const activeSetlist = await prisma.track.findMany({
      include: {
        audioFiles: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(activeSetlist.map(toTrackData));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Database fetching sequence failed";
    const { formatColemanUserError } = await import(
      "@/app/enterprise/coleman/lib/user-facing-error"
    );
    return NextResponse.json({ error: formatColemanUserError(message) }, { status: 500 });
  }
}

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
    const serviceName =
      typeof payload.serviceName === "string" ? payload.serviceName.trim() : undefined;
    const notes =
      typeof payload.notes === "string" ? payload.notes.trim() : undefined;

    const createdTrackRecord = await prisma.track.create({
      data: {
        title: validation.value.title,
        artist,
        musicalKey: validation.value.musicalKey,
        bpm: validation.value.bpm > 0 ? validation.value.bpm : null,
        serviceName: serviceName || null,
        notes: notes || null,
      },
      include: {
        audioFiles: true,
      },
    });

    return NextResponse.json(toTrackData(createdTrackRecord), { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Database write operation execution rejected";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
