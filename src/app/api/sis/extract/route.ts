import { apiRoute, apiSuccess, parseJsonBody } from "@/server/api/route";
import { enforceAiRouteSafety } from "@/lib/ai-guard";
import { extractSisSchema } from "@/schemas/sis";
import { requireApiAuthContext } from "@/server/auth/context";
import { extractAndPersistSisAssessment } from "@/server/services/sis-service";
import { ensureConsultationAccess } from "@/server/services/consultation-service";

export const POST = apiRoute(async ({ request, requestId }) => {
  const auth = await requireApiAuthContext();
  const body = await parseJsonBody(extractSisSchema, request);
  await ensureConsultationAccess(body.consultationId);
  await enforceAiRouteSafety({
    organisationId: auth.organisationId,
    userId: auth.userId,
    consultationId: body.consultationId,
    action: "sis-extract",
    limit: 20,
    featureFlag: "sisExtraction",
    disabledMessage: "KI-gestuetzte SIS-Extraktion ist derzeit deaktiviert."
  });
  const assessment = await extractAndPersistSisAssessment(body);

  return apiSuccess(assessment, requestId);
});
