import { apiRoute, apiSuccess, parseJsonBody } from "@/server/api/route";
import { enforceRateLimit } from "@/lib/rate-limit";
import { extractSisSchema } from "@/schemas/sis";
import { requireApiAuthContext } from "@/server/auth/context";
import { extractSisAssessment } from "@/server/services/sis-service";

export const POST = apiRoute(async ({ request, requestId }) => {
  const auth = await requireApiAuthContext();
  await enforceRateLimit({
    identifier: `${auth.organisationId}:${auth.userId}`,
    action: "sis-extract",
    limit: 20
  });

  const body = await parseJsonBody(extractSisSchema, request);
  const assessment = await extractSisAssessment(body);

  return apiSuccess(assessment, requestId);
});
