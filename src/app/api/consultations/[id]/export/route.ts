import { apiRoute, apiSuccess, parseJsonBody } from "@/server/api/route";
import { exportNoteSchema } from "@/schemas/note";
import { exportNote } from "@/server/services/export-service";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requireApiAuthContext } from "@/server/auth/context";
import { getIdempotentJobResult, storeIdempotentJobResult } from "@/server/services/job-service";

export const POST = apiRoute<{ id: string }>(async ({ params, request, requestId }) => {
  const auth = await requireApiAuthContext();
  const body = await parseJsonBody(exportNoteSchema, request);
  await enforceRateLimit({
    identifier: `${auth.organisationId}:${auth.userId}:${params.id}`,
    action: "export-note",
    limit: 20
  });

  const cached = await getIdempotentJobResult("export-note", params.id, body.idempotencyKey);
  if (cached) {
    return apiSuccess(cached, requestId);
  }

  const result = await exportNote({
    consultationId: params.id,
    noteId: body.noteId,
    exportType: body.exportType
  });

  await storeIdempotentJobResult("export-note", params.id, result, body.idempotencyKey);
  return apiSuccess(result, requestId);
});
