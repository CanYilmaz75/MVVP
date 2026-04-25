import { apiRoute, apiSuccess, parseJsonBody } from "@/server/api/route";
import { generateDraftNote } from "@/server/services/note-service";
import { generateNoteSchema } from "@/schemas/note";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requireApiAuthContext } from "@/server/auth/context";
import { getIdempotentJobResult, storeIdempotentJobResult } from "@/server/services/job-service";

export const POST = apiRoute<{ id: string }>(async ({ params, request, requestId }) => {
  const auth = await requireApiAuthContext();
  const body = await parseJsonBody(generateNoteSchema, request);

  await enforceRateLimit({
    identifier: `${auth.organisationId}:${auth.userId}:${params.id}`,
    action: "generate-note",
    limit: 10
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
