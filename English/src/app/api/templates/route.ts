import { z } from "zod";

import { apiRoute, apiSuccess, parseJsonBody } from "@/server/api/route";
import { createTemplate, listTemplates } from "@/server/services/template-service";

const createTemplateSchema = z.object({
  name: z.string().min(2).max(120),
  specialty: z.string().min(2).max(120),
  templateDefinition: z.record(z.any())
});

export const GET = apiRoute(async ({ requestId }) => {
  const templates = await listTemplates();
  return apiSuccess({ templates }, requestId);
});

export const POST = apiRoute(async ({ request, requestId }) => {
  const body = await parseJsonBody(createTemplateSchema, request);
  const template = await createTemplate(body);
  return apiSuccess(template, requestId, { status: 201 });
});
