import { enterpriseRequestSchema } from "@/schemas/team";
import { apiRoute, apiSuccess, parseJsonBody } from "@/server/api/route";
import { recordEnterpriseRequest } from "@/server/services/billing-service";

export const POST = apiRoute(async ({ request, requestId }) => {
  const body = await parseJsonBody(enterpriseRequestSchema, request);
  const enterpriseRequest = await recordEnterpriseRequest(body);
  return apiSuccess(enterpriseRequest, requestId, { status: 201 });
});
