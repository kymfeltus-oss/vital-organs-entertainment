import { isOwnerAuthed, ownerAuthFailureResponse, ownerJsonResponse } from "@/lib/owner/api-response";
import { requireOwnerUser } from "@/lib/owner/auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function cleanText(value: unknown, fallback: string, max = 160): string {
  return typeof value === "string" && value.trim()
    ? value.trim().replace(/<[^>]*>/g, "").slice(0, max)
    : fallback;
}

async function failArchiveJob(jobId: string, message: string) {
  const admin = getSupabaseAdmin();
  await admin
    .from("owner_archive_jobs")
    .update({
      status: "FAILED",
      error_log: message,
      ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}

async function processNextWorkerStage(jobId: string, showId: string) {
  try {
    const admin = getSupabaseAdmin();
    const assetUrl = `https://vitalorgansent.media/${encodeURIComponent(showId)}_rec_${jobId.slice(0, 6)}.mp4`;

    const { error: assetError } = await admin.from("owner_archive_assets").insert({
      job_id: jobId,
      show_id: showId,
      title: "Master Clean Broadcast Archive Target Record",
      asset_type: "CLEAN_RAW",
      video_url: assetUrl,
      file_size_mb: 412.8,
      duration_seconds: 3600,
    });

    if (assetError) throw new Error(assetError.message);

    const { error: jobError } = await admin
      .from("owner_archive_jobs")
      .update({
        status: "COMPLETED",
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (jobError) throw new Error(jobError.message);
  } catch (error) {
    await failArchiveJob(jobId, error instanceof Error ? error.message : "Archive worker failed.");
  }
}

export async function GET(request: Request) {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const showId = new URL(request.url).searchParams.get("showId");
    const admin = getSupabaseAdmin();
    let jobsQuery = admin.from("owner_archive_jobs").select("*").order("started_at", { ascending: false });
    let assetsQuery = admin.from("owner_archive_assets").select("*").order("created_at", { ascending: false });

    if (showId) {
      jobsQuery = jobsQuery.eq("show_id", showId);
      assetsQuery = assetsQuery.eq("show_id", showId);
    }

    const [{ data: jobs, error: jobsError }, { data: assets, error: assetsError }] =
      await Promise.all([jobsQuery, assetsQuery]);

    if (jobsError) throw new Error(jobsError.message);
    if (assetsError) throw new Error(assetsError.message);

    return ownerJsonResponse({ success: true, ok: true, jobs: jobs ?? [], assets: assets ?? [] });
  } catch (error) {
    console.error("[owner/archive/jobs] GET failed:", error);
    return ownerJsonResponse(
      { success: false, error: error instanceof Error ? error.message : "Unable to load archive jobs." },
      500,
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = body.action;
    const showId = cleanText(body.showId, "live-stream-session", 120);
    const showTitle = cleanText(body.showTitle, "Production Master Output Broadcast", 160);
    const admin = getSupabaseAdmin();

    if (action === "INITIALIZE_JOB") {
      const { data: activeJob, error: activeError } = await admin
        .from("owner_archive_jobs")
        .select("*")
        .eq("show_id", showId)
        .in("status", ["RECORDING", "PROCESSING"])
        .maybeSingle();

      if (activeError) throw new Error(activeError.message);
      if (activeJob) {
        return ownerJsonResponse(
          { success: false, error: "An archive job is already active for this show." },
          409,
        );
      }

      const { data: job, error } = await admin
        .from("owner_archive_jobs")
        .insert({
          show_id: showId,
          show_title: showTitle,
          status: "RECORDING",
          started_at: new Date().toISOString(),
          updated_by: auth.email,
        })
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      return ownerJsonResponse({ success: true, ok: true, job }, 201);
    }

    if (action === "TRIGGER_TRANSCODE_WORKER") {
      const jobId = cleanText(body.jobId, "", 80);
      if (!jobId) return ownerJsonResponse({ success: false, error: "Archive job id is required." }, 400);

      const { error } = await admin
        .from("owner_archive_jobs")
        .update({
          status: "PROCESSING",
          updated_by: auth.email,
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);

      if (error) throw new Error(error.message);

      void processNextWorkerStage(jobId, showId);
      return ownerJsonResponse({
        success: true,
        ok: true,
        message: "Archive worker boundary accepted the job.",
      });
    }

    return ownerJsonResponse(
      { success: false, error: "Invalid pipeline automation trigger request action specified." },
      400,
    );
  } catch (error) {
    console.error("[owner/archive/jobs] POST failed:", error);
    return ownerJsonResponse(
      { success: false, error: error instanceof Error ? error.message : "Unable to process archive job." },
      500,
    );
  }
}
