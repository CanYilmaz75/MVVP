import { apiRoute, apiSuccess, parseJsonBody } from "@/server/api/route";
import { editNoteSchema } from "@/schemas/note";
import { editDraftNote } from "@/server/services/note-service";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requireApiAuthContext } from "@/server/auth/context";

export const POST = apiRoute<{ id: string }>(async ({ params, request, requestId }) => {
  const auth = await requireApiAuthContext();
  await enforceRateLimit({
    identifier: `${auth.organisationId}:${auth.userId}:${params.id}`,
    action: "edit-note",
    limit: 30
  });

  const body = await parseJsonBody(editNoteSchema, request);
  const result = await editDraftNote({
    consultationId: params.id,
    noteId: body.noteId,
    editMode: body.editMode,
    instructionText: body.instructionText,
    patch: body.patch
  });

  return apiSuccess(result, requestId);
});
