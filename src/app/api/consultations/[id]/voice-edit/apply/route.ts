import { apiRoute, apiSuccess, parseJsonBody } from "@/server/api/route";
import { enforceAiRouteSafety } from "@/lib/ai-guard";
import { voiceEditApplySchema } from "@/schemas/note";
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
    action: "voice-edit-apply",
    limit: 20,
    featureFlag: "voiceEdit",
    disabledMessage: "Sprachbearbeitung ist derzeit deaktiviert."
  });

  const body = await parseJsonBody(voiceEditApplySchema, request);
  const job = await createOrReuseAsyncJob({
    action: "voice-edit-apply",
    consultationId: params.id,
    payload: {
      noteId: body.noteId,
      instructionText: body.instructionText
    },
    idempotencyKey: `${body.noteId}:${body.instructionText.slice(0, 120)}`
  });

  return apiSuccess({ job }, requestId, { status: job.status === "completed" ? 200 : 202 });
});
