import { apiRoute, apiSuccess, parseJsonBody } from "@/server/api/route";
import { updateConsultationSchema } from "@/schemas/consultation";
import { getConsultationWorkspaceForApi, updateConsultation } from "@/server/services/consultation-service";

export const GET = apiRoute<{ id: string }>(async ({ params, requestId }) => {
  const workspace = await getConsultationWorkspaceForApi(params.id);
  return apiSuccess(workspace, requestId);
});

export const PATCH = apiRoute<{ id: string }>(async ({ params, request, requestId }) => {
  const body = await parseJsonBody(updateConsultationSchema, request);
  const consultation = await updateConsultation(params.id, body);
  return apiSuccess(consultation, requestId);
});
