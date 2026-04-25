import { apiRoute, apiSuccess, parseJsonBody } from "@/server/api/route";
import { completeAudioUploadSchema } from "@/schemas/consultation";
import { completeAudioUpload } from "@/server/services/audio-service";

export const POST = apiRoute<{ id: string }>(async ({ params, request, requestId }) => {
  const body = await parseJsonBody(completeAudioUploadSchema, request);
  const result = await completeAudioUpload(params.id, body);

  return apiSuccess(result, requestId, { status: 201 });
});
