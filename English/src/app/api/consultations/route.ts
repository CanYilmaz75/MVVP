import { apiRoute, apiSuccess, parseJsonBody } from "@/server/api/route";
import { createConsultation, listConsultations } from "@/server/services/consultation-service";
import { createConsultationSchema } from "@/schemas/consultation";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requireApiAuthContext } from "@/server/auth/context";

export const GET = apiRoute(async ({ requestId }) => {
  const consultations = await listConsultations();
  return apiSuccess({ consultations }, requestId);
});

export const POST = apiRoute(async ({ request, requestId }) => {
  const auth = await requireApiAuthContext();
  await enforceRateLimit({
    identifier: `${auth.organisationId}:${auth.userId}`,
    action: "consultation-create",
    limit: 20
  });

  const body = await parseJsonBody(createConsultationSchema, request);
  const consultation = await createConsultation(body);

  return apiSuccess(consultation, requestId, { status: 201 });
});
