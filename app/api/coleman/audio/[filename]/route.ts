import fs from "fs";
import path from "path";

import { NextResponse } from "next/server";

import {
  initColemanStorage,
  resolveUploadPath,
} from "@/app/enterprise/coleman/lib/storage";

type RouteContext = {
  params: Promise<{ filename: string }>;
};

const MIME_BY_EXT: Record<string, string> = {
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".aiff": "audio/aiff",
  ".aac": "audio/aac",
  ".flac": "audio/flac",
  ".ogg": "audio/ogg",
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    initColemanStorage();
    const { filename } = await context.params;
    const filePath = resolveUploadPath(filename);

    if (!filePath) {
      return NextResponse.json({ error: "Audio file not found." }, { status: 404 });
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_BY_EXT[ext] ?? "application/octet-stream";
    const buffer = fs.readFileSync(filePath);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to stream audio.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
