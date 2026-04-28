import { apiRoute, apiSuccess, parseJsonBody } from "@/server/api/route";
import { enforceAiRouteSafety } from "@/lib/ai-guard";
import { generateNoteSchema } from "@/schemas/note";
import { requireApiAuthContext } from "@/server/auth/context";
import { createOrReuseAsyncJob } from "@/server/services/job-service";
import { ensureConsultationAccess } from "@/server/services/consultation-service";

export const POST = apiRoute<{ id: string }>(async ({ params, request, requestId }) => {
  const auth = await requireApiAuthContext();
  const body = await parseJsonBody(generateNoteSchema, request);
  await ensureConsultationAccess(params.id);
  await enforceAiRouteSafety({
    organisationId: auth.organisationId,
    userId: auth.userId,
    consultationId: params.id,
    action: "generate-note",
    limit: 10,
    featureFlag: "aiNoteGeneration",
    disabledMessage: "KI-Notizerstellung ist derzeit deaktiviert."
  });

  const job = await createOrReuseAsyncJob({
    action: "generate-note",
    consultationId: params.id,
    payload: {
      transcriptId: body.transcriptId,
      templateId: body.templateId
    },
    idempotencyKey: body.idempotencyKey
  });

  return apiSuccess({ job }, requestId, { status: job.status === "completed" ? 200 : 202 });
});
