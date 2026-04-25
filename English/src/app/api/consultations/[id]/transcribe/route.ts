import { apiRoute, apiSuccess, parseJsonBody } from "@/server/api/route";
import { transcribeConsultationSchema } from "@/schemas/transcript";
import { transcribeConsultationAudio } from "@/server/services/transcription-service";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requireApiAuthContext } from "@/server/auth/context";

export const POST = apiRoute<{ id: string }>(async ({ params, request, requestId }) => {
  const auth = await requireApiAuthContext();
  await enforceRateLimit({
    identifier: `${auth.organisationId}:${auth.userId}:${params.id}`,
    action: "transcribe",
    limit: 12
  });

  const body = await parseJsonBody(transcribeConsultationSchema, request);
  const transcript = await transcribeConsultationAudio(params.id, body.audioAssetId);

  return apiSuccess(
    {
      transcriptId: transcript?.id,
      transcriptStatus: transcript?.status
    },
    requestId
  );
});
