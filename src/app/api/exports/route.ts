import { apiRoute, apiSuccess } from "@/server/api/route";
import { listExports } from "@/server/services/export-service";

export const GET = apiRoute(async ({ requestId }) => {
  const exportsList = await listExports();
  return apiSuccess({ exports: exportsList }, requestId);
});
