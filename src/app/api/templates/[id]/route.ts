import { z } from "zod";

import { apiRoute, apiSuccess, parseJsonBody } from "@/server/api/route";
import { updateTemplate } from "@/server/services/template-service";

const templateEntrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  type: z.enum(["text", "heading", "number", "option", "multi_option", "custom"]),
  memory: z.string().optional(),
  unit: z.string().optional(),
  options: z.array(z.string()).optional(),
  customInstructions: z.string().optional()
});

const templateDefinitionSchema = z.object({
  version: z.literal(1),
  creationMode: z.enum(["empty", "duplicate", "fixed"]),
  status: z.enum(["draft", "active", "pending_changes"]),
  primaryProfession: z.string().min(2).max(120),
  access: z.object({
    type: z.enum(["all", "roles", "private"]),
    roles: z.array(z.string())
  }),
  entries: z.array(templateEntrySchema),
  memory: z.string().optional(),
  activeSnapshot: z
    .object({
      primaryProfession: z.string(),
      access: z.object({
        type: z.enum(["all", "roles", "private"]),
        roles: z.array(z.string())
      }),
      entries: z.array(templateEntrySchema),
      memory: z.string().optional(),
      activatedAt: z.string(),
      activatedBy: z.string().optional()
    })
    .optional()
});

const updateTemplateSchema = z.object({
  name: z.string().min(2).max(120),
  specialty: z.string().min(2).max(120),
  templateDefinition: templateDefinitionSchema,
  active: z.boolean()
});

export const PATCH = apiRoute<{ id: string }>(async ({ params, request, requestId }) => {
  const body = await parseJsonBody(updateTemplateSchema, request);
  const template = await updateTemplate(params.id, body);
  return apiSuccess(template, requestId);
});
