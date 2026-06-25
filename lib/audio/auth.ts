import type { User } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { inspectOpsAdminAccess } from "@/lib/ops/admin-auth";
import {
  getCrewRoleFromRequest,
  isOpsRoleCheckBypassed,
} from "@/lib/ops/crew-role-auth";
import { canAccessModule } from "@/lib/ops/team-roles";
import { createServerSupabaseClient } from "@/lib/supabase/ssr-server";
import { buildAudioPermissions, mapOpsRoleToAudioRole } from "@/lib/audio/rbac";
import type { AudioPermissions } from "@/lib/audio/types";

export type AudioAuthContext = {
  user: User;
  permissions: AudioPermissions;
  tenantId: string;
};

export const DEFAULT_AUDIO_TENANT_ID = "300-awakening";

export async function requireAudioApiUser(
  request?: NextRequest,
): Promise<{ context: AudioAuthContext | null; response: NextResponse | null }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      context: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const inspection = inspectOpsAdminAccess(user);
  const { role } = await getCrewRoleFromRequest(request);
  const isOpsAdmin = inspection.allowed || isOpsRoleCheckBypassed(user);

  if (!isOpsAdmin && !canAccessModule(role, "ops_sound")) {
    return {
      context: null,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  const audioRole = mapOpsRoleToAudioRole(role, isOpsAdmin);
  const permissions = buildAudioPermissions(audioRole);

  return {
    context: {
      user,
      permissions,
      tenantId: DEFAULT_AUDIO_TENANT_ID,
    },
    response: null,
  };
}

export function audioForbiddenResponse(action: string): NextResponse {
  return NextResponse.json(
    { error: `Forbidden: insufficient permissions to ${action}.` },
    { status: 403 },
  );
}
