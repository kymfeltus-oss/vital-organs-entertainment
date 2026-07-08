import { NextResponse } from "next/server";

import {
  inferStemType,
  toTrackData,
} from "@/app/enterprise/coleman/lib/db-mappers";
import { prisma } from "@/app/enterprise/coleman/lib/prisma";
import { saveUploadedFile } from "@/app/enterprise/coleman/lib/storage";
import { validateAudioUpload } from "@/app/enterprise/coleman/lib/validation";

type RouteContext = {
  params: Promise<{ trackId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { trackId } = await context.params;

    if (!trackId?.trim()) {
      return NextResponse.json({ error: "Track id is required." }, { status: 400 });
    }

    const formData = await request.formData();
    const stem = (formData as unknown as { get(name: string): File | string | null }).get(
      "stem",
    );

    if (!(stem instanceof File)) {
      return NextResponse.json(
        { error: "Missing stem file in multipart payload." },
        { status: 400 },
      );
    }

    const validation = validateAudioUpload(
      stem.name,
      stem.type || "application/octet-stream",
      stem.size,
    );

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const track = await prisma.track.findUnique({
      where: { id: trackId },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found." }, { status: 404 });
    }

    const buffer = Buffer.from(await stem.arrayBuffer());
    const filename = saveUploadedFile(stem.name, buffer);
    const stemTypeField = formData.get("stemType");
    const stemType =
      typeof stemTypeField === "string" && stemTypeField.trim()
        ? stemTypeField.trim()
        : inferStemType(stem.name);

    await prisma.audioAsset.create({
      data: {
        filename,
        originName: stem.name,
        stemType,
        fileSize: stem.size,
        trackId,
      },
    });

    const updatedTrack = await prisma.track.findUniqueOrThrow({
      where: { id: trackId },
      include: { audioFiles: true },
    });

    return NextResponse.json(toTrackData(updatedTrack));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to upload stem.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
