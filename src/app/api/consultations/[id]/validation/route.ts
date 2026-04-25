import { apiRoute, apiSuccess } from "@/server/api/route";
import { getCurrentWarnings } from "@/server/services/note-service";

export const GET = apiRoute<{ id: string }>(async ({ params, requestId }) => {
  const warnings = await getCurrentWarnings(params.id);
  return apiSuccess({ warnings }, requestId);
});
