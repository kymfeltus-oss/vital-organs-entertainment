import { NextResponse } from "next/server";

import { prisma } from "@/app/enterprise/coleman/lib/prisma";
import { deleteUploadedFile } from "@/app/enterprise/coleman/lib/storage";

type RouteContext = {
  params: Promise<{ stemId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { stemId } = await context.params;

    if (!stemId?.trim()) {
      return NextResponse.json({ error: "Stem id is required." }, { status: 400 });
    }

    const asset = await prisma.audioAsset.findUnique({
      where: { id: stemId },
    });

    if (!asset) {
      return NextResponse.json({ error: "Stem not found." }, { status: 404 });
    }

    deleteUploadedFile(asset.filename);

    await prisma.audioAsset.delete({
      where: { id: stemId },
    });

    return NextResponse.json({ ok: true, id: stemId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to remove stem.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
