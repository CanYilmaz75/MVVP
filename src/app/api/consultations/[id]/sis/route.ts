import { apiRoute, apiSuccess, parseJsonBody } from "@/server/api/route";
import { saveSisAssessmentSchema } from "@/schemas/sis";
import { getSisAssessment, saveSisAssessment } from "@/server/services/sis-service";
import { requireApiAuthContext } from "@/server/auth/context";
import { enforceRateLimit } from "@/lib/rate-limit";
import { ensureConsultationAccess } from "@/server/services/consultation-service";

export const GET = apiRoute<{ id: string }>(async ({ params, requestId }) => {
  await ensureConsultationAccess(params.id);
  const assessment = await getSisAssessment(params.id);
  return apiSuccess(assessment, requestId);
});

export const PUT = apiRoute<{ id: string }>(async ({ params, request, requestId }) => {
  const auth = await requireApiAuthContext();
  await ensureConsultationAccess(params.id);
  await enforceRateLimit({
    identifier: `${auth.organisationId}:${auth.userId}:${params.id}`,
    action: "sis-save",
    limit: 30
  });

  const body = await parseJsonBody(saveSisAssessmentSchema, request);
  const assessment = await saveSisAssessment({
    consultationId: params.id,
    assessment: body.assessment
  });

  return apiSuccess(assessment, requestId);
});
