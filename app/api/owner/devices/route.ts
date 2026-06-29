import { isOwnerAuthed, ownerAuthFailureResponse, ownerJsonResponse } from "@/lib/owner/api-response";
import { requireOwnerUser } from "@/lib/owner/auth";
import {
  buildDeviceDisplayName,
  buildSovereignIngestArn,
  clampDeviceVolume,
  normalizeLinkedHub,
  validateDeviceDraft,
  type DeviceDraft,
  type DeviceHealthStatus,
  type DeviceKind,
  type LinkedHub,
  type PersistedDevice,
} from "@/lib/owner/device-inventory";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type OwnerDeviceInventoryRow = {
  id: string;
  event_id: string;
  display_name: string;
  device_kind: DeviceKind;
  linked_hub: LinkedHub;
  input_channel: number;
  manufacturer: string;
  model: string;
  sovereign_ingest_arn: string;
  health_status: DeviceHealthStatus;
  pre_show_active: boolean;
  muted: boolean;
  solo: boolean;
  volume: number;
  updated_by: string | null;
  updated_at: string;
};

type DevicePatchBody = Partial<{
  id: string;
  event_id: string;
  display_name: string;
  displayName: string;
  device_kind: DeviceKind;
  deviceKind: DeviceKind;
  linked_hub: LinkedHub;
  linkedHub: LinkedHub;
  input_channel: number | string;
  inputChannel: number | string;
  manufacturer: string;
  model: string;
  sovereign_ingest_arn: string;
  sovereignIngestArn: string;
  health_status: DeviceHealthStatus;
  healthStatus: DeviceHealthStatus;
  pre_show_active: boolean;
  preShowActive: boolean;
  muted: boolean;
  solo: boolean;
  volume: number | string;
}>;

function cleanText(value: unknown, fallback = "", max = 120): string {
  if (typeof value !== "string") return fallback;
  return value.trim().replace(/<[^>]*>/g, "").slice(0, max);
}

function parseChannel(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) ? parsed : Number.NaN;
}

function normalizeKind(value: unknown): DeviceKind | null {
  return value === "MIC" || value === "CAMERA" ? value : null;
}

function normalizeHealth(value: unknown): DeviceHealthStatus | null {
  return value === "LINKED" || value === "DISCONNECTED" || value === "ERROR" ? value : null;
}

function rowToDevice(row: OwnerDeviceInventoryRow): PersistedDevice {
  return {
    id: row.id,
    displayName: row.display_name,
    deviceKind: row.device_kind,
    linkedHub: row.linked_hub,
    inputChannel: row.input_channel,
    manufacturer: row.manufacturer,
    model: row.model,
    sovereignIngestArn: row.sovereign_ingest_arn,
    healthStatus: row.health_status,
    preShowActive: row.pre_show_active,
    muted: row.muted,
    solo: row.solo,
    volume: row.volume,
    updatedAt: row.updated_at,
  };
}

function bodyToDraft(body: DevicePatchBody): { draft: DeviceDraft; eventId: string } | { error: string } {
  const deviceKind = normalizeKind(body.device_kind ?? body.deviceKind);
  if (!deviceKind) return { error: "Device kind must be MIC or CAMERA." };

  const inputChannel = parseChannel(body.input_channel ?? body.inputChannel);
  const linkedHub = normalizeLinkedHub(deviceKind, (body.linked_hub ?? body.linkedHub ?? "SOUND HUB") as LinkedHub);
  const healthStatus = normalizeHealth(body.health_status ?? body.healthStatus) ?? "LINKED";
  const displayName = cleanText(body.display_name ?? body.displayName, "", 120);
  const manufacturer = cleanText(body.manufacturer, "Generic", 80);
  const model = cleanText(body.model, "Standard", 80);

  const draft: DeviceDraft = {
    displayName,
    deviceKind,
    linkedHub,
    inputChannel,
    manufacturer,
    model,
    sovereignIngestArn: cleanText(body.sovereign_ingest_arn ?? body.sovereignIngestArn, "", 200),
    healthStatus,
  };

  const validationError = validateDeviceDraft(draft, [], null);
  if (validationError) return { error: validationError };

  return {
    draft,
    eventId: cleanText(body.event_id, "300-awakening", 80) || "300-awakening",
  };
}

async function loadExistingDevices(eventId: string): Promise<PersistedDevice[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("owner_device_inventory")
    .select("*")
    .eq("event_id", eventId)
    .order("linked_hub", { ascending: true })
    .order("input_channel", { ascending: true });

  if (error) throw new Error(error.message);
  return ((data ?? []) as OwnerDeviceInventoryRow[]).map(rowToDevice);
}

export async function GET(request: Request) {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const eventId = new URL(request.url).searchParams.get("eventId") ?? "300-awakening";
    const devices = await loadExistingDevices(eventId);
    return ownerJsonResponse({ success: true, ok: true, devices });
  } catch (error) {
    console.error("[owner/devices] GET failed:", error);
    return ownerJsonResponse(
      { success: false, error: error instanceof Error ? error.message : "Unable to load devices." },
      500,
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const body = (await request.json()) as DevicePatchBody;
    const parsed = bodyToDraft(body);
    if ("error" in parsed) {
      return ownerJsonResponse({ success: false, error: parsed.error }, 400);
    }

    const existing = await loadExistingDevices(parsed.eventId);
    const validationError = validateDeviceDraft(parsed.draft, existing, null);
    if (validationError) return ownerJsonResponse({ success: false, error: validationError }, 400);

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("owner_device_inventory")
      .insert({
        event_id: parsed.eventId,
        display_name: buildDeviceDisplayName(parsed.draft),
        device_kind: parsed.draft.deviceKind,
        linked_hub: normalizeLinkedHub(parsed.draft.deviceKind, parsed.draft.linkedHub),
        input_channel: parsed.draft.inputChannel,
        manufacturer: parsed.draft.manufacturer.trim(),
        model: parsed.draft.model.trim(),
        sovereign_ingest_arn: parsed.draft.sovereignIngestArn?.trim() || buildSovereignIngestArn(parsed.draft),
        health_status: parsed.draft.healthStatus,
        pre_show_active: parsed.draft.deviceKind === "CAMERA" && parsed.draft.healthStatus === "LINKED",
        muted: Boolean(body.muted),
        solo: Boolean(body.solo),
        volume: clampDeviceVolume(parseChannel(body.volume ?? 75)),
        updated_by: auth.email,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return ownerJsonResponse({ success: true, ok: true, device: rowToDevice(data as OwnerDeviceInventoryRow) }, 201);
  } catch (error) {
    console.error("[owner/devices] POST failed:", error);
    return ownerJsonResponse(
      { success: false, error: error instanceof Error ? error.message : "Unable to save device." },
      500,
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const body = (await request.json()) as DevicePatchBody;
    const id = cleanText(body.id, "", 80);
    if (!id) return ownerJsonResponse({ success: false, error: "Device id is required." }, 400);

    const admin = getSupabaseAdmin();
    const { data: currentRow, error: currentError } = await admin
      .from("owner_device_inventory")
      .select("*")
      .eq("id", id)
      .single();

    if (currentError || !currentRow) {
      return ownerJsonResponse({ success: false, error: "Selected device no longer exists." }, 404);
    }

    const current = rowToDevice(currentRow as OwnerDeviceInventoryRow);
    const deviceKind = normalizeKind(body.device_kind ?? body.deviceKind) ?? current.deviceKind;
    const linkedHub = normalizeLinkedHub(deviceKind, (body.linked_hub ?? body.linkedHub ?? current.linkedHub) as LinkedHub);
    const inputChannel =
      body.input_channel !== undefined || body.inputChannel !== undefined
        ? parseChannel(body.input_channel ?? body.inputChannel)
        : current.inputChannel;
    const healthStatus = normalizeHealth(body.health_status ?? body.healthStatus) ?? current.healthStatus;
    const draft: DeviceDraft = {
      displayName: cleanText(body.display_name ?? body.displayName, current.displayName, 120),
      deviceKind,
      linkedHub,
      inputChannel,
      manufacturer: cleanText(body.manufacturer, current.manufacturer, 80),
      model: cleanText(body.model, current.model, 80),
      sovereignIngestArn: cleanText(body.sovereign_ingest_arn ?? body.sovereignIngestArn, current.sovereignIngestArn, 200),
      healthStatus,
    };

    const existing = await loadExistingDevices((currentRow as OwnerDeviceInventoryRow).event_id);
    const validationError = validateDeviceDraft(draft, existing, id);
    if (validationError) return ownerJsonResponse({ success: false, error: validationError }, 400);

    const patch: Record<string, unknown> = {
      display_name: buildDeviceDisplayName(draft),
      device_kind: draft.deviceKind,
      linked_hub: draft.linkedHub,
      input_channel: draft.inputChannel,
      manufacturer: draft.manufacturer.trim(),
      model: draft.model.trim(),
      sovereign_ingest_arn: draft.sovereignIngestArn?.trim() || buildSovereignIngestArn(draft),
      health_status: draft.healthStatus,
      updated_by: auth.email,
      updated_at: new Date().toISOString(),
    };

    if (body.pre_show_active !== undefined || body.preShowActive !== undefined) {
      patch.pre_show_active = draft.healthStatus === "LINKED" && Boolean(body.pre_show_active ?? body.preShowActive);
    } else if (draft.healthStatus !== "LINKED") {
      patch.pre_show_active = false;
    }
    if (body.muted !== undefined) patch.muted = Boolean(body.muted);
    if (body.solo !== undefined) patch.solo = Boolean(body.solo);
    if (body.volume !== undefined) patch.volume = clampDeviceVolume(parseChannel(body.volume));

    const { data, error } = await admin
      .from("owner_device_inventory")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return ownerJsonResponse({ success: true, ok: true, device: rowToDevice(data as OwnerDeviceInventoryRow) });
  } catch (error) {
    console.error("[owner/devices] PATCH failed:", error);
    return ownerJsonResponse(
      { success: false, error: error instanceof Error ? error.message : "Unable to update device." },
      500,
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const id = cleanText(new URL(request.url).searchParams.get("id"), "", 80);
    if (!id) return ownerJsonResponse({ success: false, error: "Device id is required." }, 400);

    const admin = getSupabaseAdmin();
    const { error } = await admin.from("owner_device_inventory").delete().eq("id", id);
    if (error) throw new Error(error.message);

    return ownerJsonResponse({ success: true, ok: true, message: "Device removed from production inventory." });
  } catch (error) {
    console.error("[owner/devices] DELETE failed:", error);
    return ownerJsonResponse(
      { success: false, error: error instanceof Error ? error.message : "Unable to delete device." },
      500,
    );
  }
}
