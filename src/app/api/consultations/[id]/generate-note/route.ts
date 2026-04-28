import { apiRoute, apiSuccess, parseJsonBody } from "@/server/api/route";
import { enforceAiRouteSafety } from "@/lib/ai-guard";
import { generateDraftNote } from "@/server/services/note-service";
import { generateNoteSchema } from "@/schemas/note";
import { requireApiAuthContext } from "@/server/auth/context";
import { getIdempotentJobResult, storeIdempotentJobResult } from "@/server/services/job-service";
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

  const cached = await getIdempotentJobResult("generate-note", params.id, body.idempotencyKey);
  if (cached) {
    return apiSuccess(cached, requestId);
  }

  const result = await generateDraftNote({
    consultationId: params.id,
    transcriptId: body.transcriptId,
    templateId: body.templateId
  });

  await storeIdempotentJobResult("generate-note", params.id, result, body.idempotencyKey);

  return apiSuccess(result, requestId);
});
