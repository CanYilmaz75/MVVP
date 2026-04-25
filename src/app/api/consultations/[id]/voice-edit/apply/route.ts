import { apiRoute, apiSuccess, parseJsonBody } from "@/server/api/route";
import { voiceEditApplySchema } from "@/schemas/note";
import { editDraftNote } from "@/server/services/note-service";

export const POST = apiRoute<{ id: string }>(async ({ params, request, requestId }) => {
  const body = await parseJsonBody(voiceEditApplySchema, request);
  const result = await editDraftNote({
    consultationId: params.id,
    noteId: body.noteId,
    editMode: "voice",
    instructionText: body.instructionText
  });

  return apiSuccess(result, requestId);
});
