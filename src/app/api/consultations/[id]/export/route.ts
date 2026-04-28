import { apiRoute, apiSuccess, parseJsonBody } from "@/server/api/route";
import { exportNoteSchema } from "@/schemas/note";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requireApiAuthContext } from "@/server/auth/context";
import { createOrReuseAsyncJob } from "@/server/services/job-service";

export const POST = apiRoute<{ id: string }>(async ({ params, request, requestId }) => {
  const auth = await requireApiAuthContext();
  const body = await parseJsonBody(exportNoteSchema, request);
  await enforceRateLimit({
    identifier: `${auth.organisationId}:${auth.userId}:${params.id}`,
    action: "export-note",
    limit: 20
  });

  const job = await createOrReuseAsyncJob({
    action: "export-note",
    consultationId: params.id,
    payload: {
      noteId: body.noteId,
      exportType: body.exportType
    },
    idempotencyKey: body.idempotencyKey
  });

  return apiSuccess({ job }, requestId, { status: job.status === "completed" ? 200 : 202 });
});
