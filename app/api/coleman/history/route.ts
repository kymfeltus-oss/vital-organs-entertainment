import { NextResponse } from "next/server";

import { toPlaybackHistoryEntry } from "@/app/enterprise/coleman/lib/db-mappers";
import { prisma } from "@/app/enterprise/coleman/lib/prisma";

export async function GET() {
  try {
    const history = await prisma.playbackHistory.findMany({
      include: { track: true },
      orderBy: { playedAt: "desc" },
      take: 200,
    });

    return NextResponse.json(history.map(toPlaybackHistoryEntry));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load playback history.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { trackId?: string };

    if (!body.trackId?.trim()) {
      return NextResponse.json({ error: "trackId is required." }, { status: 400 });
    }

    const track = await prisma.track.findUnique({
      where: { id: body.trackId },
      include: { audioFiles: true },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found." }, { status: 404 });
    }

    const entry = await prisma.playbackHistory.create({
      data: {
        trackId: track.id,
      },
      include: {
        track: true,
      },
    });

    return NextResponse.json(toPlaybackHistoryEntry(entry), { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to record playback.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
