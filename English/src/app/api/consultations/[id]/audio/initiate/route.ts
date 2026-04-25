import { apiRoute, apiSuccess, parseJsonBody } from "@/server/api/route";
import { initiateAudioUploadSchema } from "@/schemas/consultation";
import { initiateAudioUpload } from "@/server/services/audio-service";
import { requireApiAuthContext } from "@/server/auth/context";
import { enforceRateLimit } from "@/lib/rate-limit";

export const POST = apiRoute<{ id: string }>(async ({ params, request, requestId }) => {
  const auth = await requireApiAuthContext();
  await enforceRateLimit({
    identifier: `${auth.organisationId}:${auth.userId}:${params.id}`,
    action: "audio-initiate",
    limit: 30
  });

  const body = await parseJsonBody(initiateAudioUploadSchema, request);
  const result = await initiateAudioUpload(params.id, body);

  return apiSuccess(result, requestId);
});
