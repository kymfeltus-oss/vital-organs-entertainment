import { NextResponse } from "next/server";

import { prisma } from "@/app/enterprise/coleman/lib/prisma";
import {
  isDatabaseUnavailable,
  readDevRoutingConfig,
  writeDevRoutingConfig,
} from "@/app/enterprise/coleman/lib/routing-dev-store";
import {
  lowPassForInputSource,
  resolveRoutingUserId,
  serializeRoutingConfig,
  validateRoutingWrite,
  type RoutingInputSource,
  type RoutingSelectedMode,
} from "@/app/enterprise/coleman/lib/routing-persistence";

function useDevRoutingStore(): boolean {
  return process.env.NODE_ENV !== "production" && !process.env.DATABASE_URL;
}

function saveDevRoutingFromValidation(
  validation: Extract<ReturnType<typeof validateRoutingWrite>, { ok: true }>,
) {
  const { userId, selectedMode, inputSource, noiseGateDb, latencyOffsetMs } = validation.value;
  const existing = readDevRoutingConfig(userId);
  const nextInputSource = (inputSource ?? existing.inputSource) as RoutingInputSource;

  return writeDevRoutingConfig(userId, {
    selectedMode: (selectedMode ?? existing.selectedMode) as RoutingSelectedMode,
    inputSource: nextInputSource,
    noiseGateDb: noiseGateDb ?? existing.noiseGateDb,
    latencyOffsetMs: latencyOffsetMs ?? existing.latencyOffsetMs,
    lowPassCutoffHz:
      validation.value.lowPassCutoffHz ?? lowPassForInputSource(nextInputSource),
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = resolveRoutingUserId(searchParams.get("userId"));

  if (useDevRoutingStore()) {
    return NextResponse.json(readDevRoutingConfig(userId), {
      headers: { "X-Coleman-Routing-Store": "dev-memory" },
    });
  }

  try {
    let config = await prisma.audioRoutingConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      config = await prisma.audioRoutingConfig.create({
        data: {
          userId,
          selectedMode: "SPEAKER",
          inputSource: "ACOUSTIC_AIR",
        },
      });
    }

    return NextResponse.json(serializeRoutingConfig(config));
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(readDevRoutingConfig(userId), {
        headers: { "X-Coleman-Routing-Store": "dev-fallback" },
      });
    }

    const message =
      error instanceof Error ? error.message : "Failed to access structural routing records.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validation = validateRoutingWrite(body);
  if (validation.ok === false) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  if (useDevRoutingStore()) {
    const saved = saveDevRoutingFromValidation(validation);
    return NextResponse.json(saved, {
      headers: { "X-Coleman-Routing-Store": "dev-memory" },
    });
  }

  try {
    const { userId, selectedMode, inputSource, noiseGateDb, latencyOffsetMs } = validation.value;

    const existing = await prisma.audioRoutingConfig.findUnique({
      where: { userId },
    });

    const nextInputSource = (inputSource ??
      existing?.inputSource ??
      "ACOUSTIC_AIR") as RoutingInputSource;
    const nextSelectedMode = (selectedMode ??
      existing?.selectedMode ??
      "SPEAKER") as RoutingSelectedMode;
    const nextNoiseGateDb = noiseGateDb ?? existing?.noiseGateDb ?? -45;
    const nextLatency = latencyOffsetMs ?? existing?.latencyOffsetMs ?? 0;
    const nextLowPass =
      validation.value.lowPassCutoffHz ?? lowPassForInputSource(nextInputSource);

    const updatedConfig = await prisma.audioRoutingConfig.upsert({
      where: { userId },
      update: {
        selectedMode: nextSelectedMode,
        inputSource: nextInputSource,
        noiseGateDb: nextNoiseGateDb,
        latencyOffsetMs: nextLatency,
        lowPassCutoffHz: nextLowPass,
      },
      create: {
        userId,
        selectedMode: nextSelectedMode,
        inputSource: nextInputSource,
        noiseGateDb: nextNoiseGateDb,
        latencyOffsetMs: nextLatency,
        lowPassCutoffHz: nextLowPass,
      },
    });

    return NextResponse.json(serializeRoutingConfig(updatedConfig));
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      const saved = saveDevRoutingFromValidation(validation);
      return NextResponse.json(saved, {
        headers: { "X-Coleman-Routing-Store": "dev-fallback" },
      });
    }

    const message =
      error instanceof Error
        ? error.message
        : "Failed to save active audio configuration transformations.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
