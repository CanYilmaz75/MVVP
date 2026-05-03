import { apiRoute, apiSuccess } from "@/server/api/route";
import { getSubscriptionOverview } from "@/server/services/billing-service";

export const GET = apiRoute(async ({ requestId }) => {
  const overview = await getSubscriptionOverview();
  return apiSuccess(overview, requestId);
});
