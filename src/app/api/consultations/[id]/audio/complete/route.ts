import { apiRoute, apiSuccess, parseJsonBody } from "@/server/api/route";
import { completeAudioUploadSchema } from "@/schemas/consultation";
import { completeAudioUpload } from "@/server/services/audio-service";
import { requireApiAuthContext } from "@/server/auth/context";
import { enforceRateLimit } from "@/lib/rate-limit";

export const POST = apiRoute<{ id: string }>(async ({ params, request, requestId }) => {
  const auth = await requireApiAuthContext();
  await enforceRateLimit({
    identifier: `${auth.organisationId}:${auth.userId}:${params.id}`,
    action: "audio-complete",
    limit: 30
  });

  const body = await parseJsonBody(completeAudioUploadSchema, request);
  const result = await completeAudioUpload(params.id, body);

  return apiSuccess(result, requestId, { status: 201 });
});
