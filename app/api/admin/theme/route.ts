import { NextResponse } from "next/server";
import { parseTenantThemePayload } from "@/lib/theme/parse-theme-payload";
import {
  clearServerTenantTheme,
  getServerTenantTheme,
  setServerTenantThemePayload,
} from "@/lib/theme/theme-server-store";

/** Preparatory tenant theme API — in-memory store until database persistence. */

export async function GET() {
  return NextResponse.json({
    theme: getServerTenantTheme(),
    source: "server-memory",
  });
}

export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const patch = parseTenantThemePayload(body);
  if (!patch) {
    return NextResponse.json({ error: "No valid theme fields in payload" }, { status: 400 });
  }

  const theme = setServerTenantThemePayload(body);
  if (!theme) {
    return NextResponse.json({ error: "Failed to persist theme" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    theme,
    source: "server-memory",
  });
}

export async function DELETE() {
  clearServerTenantTheme();
  return NextResponse.json({ ok: true, theme: getServerTenantTheme() });
}
