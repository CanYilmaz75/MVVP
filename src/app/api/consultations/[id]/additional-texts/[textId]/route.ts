import { apiRoute, apiSuccess } from "@/server/api/route";
import { deleteAdditionalText } from "@/server/services/consultation-service";

export const DELETE = apiRoute<{ id: string; textId: string }>(async ({ params, requestId }) => {
  const deleted = await deleteAdditionalText(params.id, params.textId);
  return apiSuccess(deleted, requestId);
});
