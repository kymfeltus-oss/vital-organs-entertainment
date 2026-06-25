import { NextRequest } from "next/server";
import { parseJsonBody, withServiceAuth } from "@/lib/todays-service/route-handlers";
import { createTeamMember, getOrCreateTodayService, listTeamMembers, loadTodaysService } from "@/lib/todays-service/service";
import type { TeamMember } from "@/lib/todays-service/types";

export async function GET(request: NextRequest) {
  return withServiceAuth(request, async (ctx) => {
    const service = await getOrCreateTodayService(ctx.tenantId);
    return { items: await listTeamMembers(service.id) };
  });
}

export async function POST(request: NextRequest) {
  return withServiceAuth(
    request,
    async (ctx) => {
      const body = await parseJsonBody<{ name: string; roleKey?: string; email?: string; phone?: string }>(request);
      if (!body.name?.trim()) throw new Error("Name is required.");
      const service = await getOrCreateTodayService(ctx.tenantId);
      const item = await createTeamMember(service.id, ctx.tenantId, {
        name: body.name,
        roleKey: (body.roleKey ?? "volunteer") as TeamMember["roleKey"],
        email: body.email,
        phone: body.phone,
      });
      await loadTodaysService(ctx.tenantId);
      return { item };
    },
    { requireEdit: true },
  );
}
