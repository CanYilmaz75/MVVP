import { apiRoute, apiSuccess } from "@/server/api/route";
import { enforceAiRouteSafety } from "@/lib/ai-guard";
import { AppError } from "@/lib/errors";
import { transcribeInstructionAudio } from "@/server/services/transcription-service";
import { requireApiAuthContext } from "@/server/auth/context";
import { ensureConsultationAccess } from "@/server/services/consultation-service";

export const POST = apiRoute<{ id: string }>(async ({ params, request, requestId }) => {
  const auth = await requireApiAuthContext();
  await ensureConsultationAccess(params.id);
  await enforceAiRouteSafety({
    organisationId: auth.organisationId,
    userId: auth.userId,
    consultationId: params.id,
    action: "voice-edit-preview",
    limit: 20,
    featureFlag: "voiceEdit",
    disabledMessage: "Sprachbearbeitung ist derzeit deaktiviert."
  });

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new AppError("INVALID_VOICE_EDIT_FILE", "Audio fuer die Sprachbearbeitung ist erforderlich.", 400);
  }

  const instructionText = await transcribeInstructionAudio(file, file.type);

  return apiSuccess(
    {
      instructionText
    },
    requestId
  );
});
