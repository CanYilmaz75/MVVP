import { apiRoute, apiSuccess, parseJsonBody } from "@/server/api/route";
import { createAdditionalTextSchema } from "@/schemas/consultation";
import { createAdditionalText } from "@/server/services/consultation-service";

export const POST = apiRoute<{ id: string }>(async ({ params, request, requestId }) => {
  const body = await parseJsonBody(createAdditionalTextSchema, request);
  const additionalText = await createAdditionalText(params.id, body);
  return apiSuccess(additionalText, requestId, { status: 201 });
});
