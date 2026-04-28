import { apiRoute, apiSuccess, parseJsonBody } from "@/server/api/route";
import { transcribeConsultationSchema } from "@/schemas/transcript";
import { enforceAiRouteSafety } from "@/lib/ai-guard";
import { requireApiAuthContext } from "@/server/auth/context";
import { ensureConsultationAccess } from "@/server/services/consultation-service";
import { createOrReuseAsyncJob } from "@/server/services/job-service";

export const POST = apiRoute<{ id: string }>(async ({ params, request, requestId }) => {
  const auth = await requireApiAuthContext();
  await ensureConsultationAccess(params.id);
  await enforceAiRouteSafety({
    organisationId: auth.organisationId,
    userId: auth.userId,
    consultationId: params.id,
    action: "transcribe",
    limit: 12,
    featureFlag: "aiTranscription",
    disabledMessage: "KI-Transkription ist derzeit deaktiviert."
  });

  const body = await parseJsonBody(transcribeConsultationSchema, request);
  const job = await createOrReuseAsyncJob({
    action: "transcribe",
    consultationId: params.id,
    payload: {
      audioAssetId: body.audioAssetId
    },
    idempotencyKey: body.audioAssetId
  });

  return apiSuccess(
    {
      job
    },
    requestId,
    { status: job.status === "completed" ? 200 : 202 }
  );
});
