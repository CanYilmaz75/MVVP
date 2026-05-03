import { apiRoute, apiSuccess } from "@/server/api/route";
import { getTeamOverview } from "@/server/services/team-service";

export const GET = apiRoute(async ({ requestId }) => {
  const team = await getTeamOverview();
  return apiSuccess(team, requestId);
});
