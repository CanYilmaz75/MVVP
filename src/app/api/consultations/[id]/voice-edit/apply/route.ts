import { apiRoute, apiSuccess, parseJsonBody } from "@/server/api/route";
import { enforceAiRouteSafety } from "@/lib/ai-guard";
import { voiceEditApplySchema } from "@/schemas/note";
import { editDraftNote } from "@/server/services/note-service";
import { requireApiAuthContext } from "@/server/auth/context";
import { ensureConsultationAccess } from "@/server/services/consultation-service";

export const POST = apiRoute<{ id: string }>(async ({ params, request, requestId }) => {
  const auth = await requireApiAuthContext();
  await ensureConsultationAccess(params.id);
  await enforceAiRouteSafety({
    organisationId: auth.organisationId,
    userId: auth.userId,
    consultationId: params.id,
    action: "voice-edit-apply",
    limit: 20,
    featureFlag: "voiceEdit",
    disabledMessage: "Sprachbearbeitung ist derzeit deaktiviert."
  });

  const body = await parseJsonBody(voiceEditApplySchema, request);
  const result = await editDraftNote({
    consultationId: params.id,
    noteId: body.noteId,
    editMode: "voice",
    instructionText: body.instructionText
  });

  return apiSuccess(result, requestId);
});
