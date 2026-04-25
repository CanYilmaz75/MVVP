import { apiRoute, apiSuccess } from "@/server/api/route";
import { getConsultationWorkspaceForApi } from "@/server/services/consultation-service";

export const GET = apiRoute<{ id: string }>(async ({ params, requestId }) => {
  const workspace = await getConsultationWorkspaceForApi(params.id);
  return apiSuccess(workspace, requestId);
});
