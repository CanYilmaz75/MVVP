import { z } from "zod";

export const sisTopicKeySchema = z.enum(["cognition", "mobility", "medical", "selfCare", "social", "housing"]);
export const sisRiskKeySchema = z.enum(["fall", "pressureUlcer", "malnutrition", "incontinence", "pain"]);
export const sisRiskLevelSchema = z.enum(["none", "monitor", "action"]);

export const sisTopicSchema = z.object({
  personView: z.string(),
  observation: z.string(),
  resources: z.string(),
  supportNeeds: z.string()
});

export const sisRiskSchema = z.object({
  relevant: z.boolean(),
  level: sisRiskLevelSchema,
  notes: z.string()
});

export const sisAssessmentSchema = z.object({
  patientReference: z.string(),
  whatMatters: z.string(),
  topics: z.record(sisTopicKeySchema, sisTopicSchema),
  risks: z.record(sisRiskKeySchema, sisRiskSchema),
  evaluationFocus: z.string(),
  openQuestions: z.array(z.string())
});

export const extractSisSchema = z.object({
  consultationId: z.string().uuid(),
  patientReference: z.string().max(120).optional(),
  liveNotes: z.string().max(20_000).optional()
});

export const saveSisAssessmentSchema = z.object({
  assessment: sisAssessmentSchema
});

export type SisTopicKey = z.infer<typeof sisTopicKeySchema>;
export type SisRiskKey = z.infer<typeof sisRiskKeySchema>;
export type SisRiskLevel = z.infer<typeof sisRiskLevelSchema>;
export type SisTopic = z.infer<typeof sisTopicSchema>;
export type SisRisk = z.infer<typeof sisRiskSchema>;
export type SisAssessment = z.infer<typeof sisAssessmentSchema>;
