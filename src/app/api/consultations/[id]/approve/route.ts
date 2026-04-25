import { apiRoute, apiSuccess, parseJsonBody } from "@/server/api/route";
import { approveNoteSchema } from "@/schemas/note";
import { approveDraftNote } from "@/server/services/note-service";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requireApiAuthContext } from "@/server/auth/context";

export const POST = apiRoute<{ id: string }>(async ({ params, request, requestId }) => {
  const auth = await requireApiAuthContext();
  await enforceRateLimit({
    identifier: `${auth.organisationId}:${auth.userId}:${params.id}`,
    action: "approve-note",
    limit: 20
  });

  const body = await parseJsonBody(approveNoteSchema, request);
  const result = await approveDraftNote({
    consultationId: params.id,
    noteId: body.noteId,
    expectedVersion: body.expectedVersion
  });

  return apiSuccess(result, requestId);
});
