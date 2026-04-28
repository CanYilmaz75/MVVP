import { z } from "zod";

export const sisTopicKeySchema = z.enum(["cognition", "mobility", "medical", "selfCare", "social", "housing"]);
export const sisRiskKeySchema = z.enum(["fall", "pressureUlcer", "malnutrition", "incontinence", "pain"]);
export const sisRiskLevelSchema = z.enum(["none", "monitor", "action"]);
export const sisFieldConfidenceSchema = z.enum(["high", "medium", "low", "unknown"]);

export const sisFieldReviewSchema = z.object({
  evidence: z.array(z.string()),
  confidence: sisFieldConfidenceSchema,
  needsReview: z.boolean()
});

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

export const sisTopicReviewSchema = z.object({
  personView: sisFieldReviewSchema,
  observation: sisFieldReviewSchema,
  resources: sisFieldReviewSchema,
  supportNeeds: sisFieldReviewSchema
});

export const sisRiskReviewSchema = z.object({
  relevant: sisFieldReviewSchema,
  level: sisFieldReviewSchema,
  notes: sisFieldReviewSchema
});

export const sisAssessmentReviewSchema = z.object({
  whatMatters: sisFieldReviewSchema,
  evaluationFocus: sisFieldReviewSchema,
  topics: z.record(sisTopicKeySchema, sisTopicReviewSchema),
  risks: z.record(sisRiskKeySchema, sisRiskReviewSchema)
});

export const sisAssessmentSchema = z.object({
  patientReference: z.string(),
  whatMatters: z.string(),
  topics: z.record(sisTopicKeySchema, sisTopicSchema),
  risks: z.record(sisRiskKeySchema, sisRiskSchema),
  evaluationFocus: z.string(),
  openQuestions: z.array(z.string()),
  review: sisAssessmentReviewSchema.optional()
});

const sisFieldReviewJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["evidence", "confidence", "needsReview"],
  properties: {
    evidence: { type: "array", items: { type: "string" } },
    confidence: { enum: ["high", "medium", "low", "unknown"] },
    needsReview: { type: "boolean" }
  }
} as const;

const sisTopicJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["personView", "observation", "resources", "supportNeeds"],
  properties: {
    personView: { type: "string" },
    observation: { type: "string" },
    resources: { type: "string" },
    supportNeeds: { type: "string" }
  }
} as const;

const sisRiskJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["relevant", "level", "notes"],
  properties: {
    relevant: { type: "boolean" },
    level: { enum: ["none", "monitor", "action"] },
    notes: { type: "string" }
  }
} as const;

export const sisAssessmentJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["patientReference", "whatMatters", "topics", "risks", "evaluationFocus", "openQuestions", "review"],
  properties: {
    patientReference: { type: "string" },
    whatMatters: { type: "string" },
    topics: {
      type: "object",
      additionalProperties: false,
      required: ["cognition", "mobility", "medical", "selfCare", "social", "housing"],
      properties: {
        cognition: sisTopicJsonSchema,
        mobility: sisTopicJsonSchema,
        medical: sisTopicJsonSchema,
        selfCare: sisTopicJsonSchema,
        social: sisTopicJsonSchema,
        housing: sisTopicJsonSchema
      }
    },
    risks: {
      type: "object",
      additionalProperties: false,
      required: ["fall", "pressureUlcer", "malnutrition", "incontinence", "pain"],
      properties: {
        fall: sisRiskJsonSchema,
        pressureUlcer: sisRiskJsonSchema,
        malnutrition: sisRiskJsonSchema,
        incontinence: sisRiskJsonSchema,
        pain: sisRiskJsonSchema
      }
    },
    evaluationFocus: { type: "string" },
    openQuestions: { type: "array", items: { type: "string" } },
    review: {
      type: "object",
      additionalProperties: false,
      required: ["whatMatters", "evaluationFocus", "topics", "risks"],
      properties: {
        whatMatters: sisFieldReviewJsonSchema,
        evaluationFocus: sisFieldReviewJsonSchema,
        topics: {
          type: "object",
          additionalProperties: false,
          required: ["cognition", "mobility", "medical", "selfCare", "social", "housing"],
          properties: {
            cognition: {
              type: "object",
              additionalProperties: false,
              required: ["personView", "observation", "resources", "supportNeeds"],
              properties: {
                personView: sisFieldReviewJsonSchema,
                observation: sisFieldReviewJsonSchema,
                resources: sisFieldReviewJsonSchema,
                supportNeeds: sisFieldReviewJsonSchema
              }
            },
            mobility: {
              type: "object",
              additionalProperties: false,
              required: ["personView", "observation", "resources", "supportNeeds"],
              properties: {
                personView: sisFieldReviewJsonSchema,
                observation: sisFieldReviewJsonSchema,
                resources: sisFieldReviewJsonSchema,
                supportNeeds: sisFieldReviewJsonSchema
              }
            },
            medical: {
              type: "object",
              additionalProperties: false,
              required: ["personView", "observation", "resources", "supportNeeds"],
              properties: {
                personView: sisFieldReviewJsonSchema,
                observation: sisFieldReviewJsonSchema,
                resources: sisFieldReviewJsonSchema,
                supportNeeds: sisFieldReviewJsonSchema
              }
            },
            selfCare: {
              type: "object",
              additionalProperties: false,
              required: ["personView", "observation", "resources", "supportNeeds"],
              properties: {
                personView: sisFieldReviewJsonSchema,
                observation: sisFieldReviewJsonSchema,
                resources: sisFieldReviewJsonSchema,
                supportNeeds: sisFieldReviewJsonSchema
              }
            },
            social: {
              type: "object",
              additionalProperties: false,
              required: ["personView", "observation", "resources", "supportNeeds"],
              properties: {
                personView: sisFieldReviewJsonSchema,
                observation: sisFieldReviewJsonSchema,
                resources: sisFieldReviewJsonSchema,
                supportNeeds: sisFieldReviewJsonSchema
              }
            },
            housing: {
              type: "object",
              additionalProperties: false,
              required: ["personView", "observation", "resources", "supportNeeds"],
              properties: {
                personView: sisFieldReviewJsonSchema,
                observation: sisFieldReviewJsonSchema,
                resources: sisFieldReviewJsonSchema,
                supportNeeds: sisFieldReviewJsonSchema
              }
            }
          }
        },
        risks: {
          type: "object",
          additionalProperties: false,
          required: ["fall", "pressureUlcer", "malnutrition", "incontinence", "pain"],
          properties: {
            fall: {
              type: "object",
              additionalProperties: false,
              required: ["relevant", "level", "notes"],
              properties: { relevant: sisFieldReviewJsonSchema, level: sisFieldReviewJsonSchema, notes: sisFieldReviewJsonSchema }
            },
            pressureUlcer: {
              type: "object",
              additionalProperties: false,
              required: ["relevant", "level", "notes"],
              properties: { relevant: sisFieldReviewJsonSchema, level: sisFieldReviewJsonSchema, notes: sisFieldReviewJsonSchema }
            },
            malnutrition: {
              type: "object",
              additionalProperties: false,
              required: ["relevant", "level", "notes"],
              properties: { relevant: sisFieldReviewJsonSchema, level: sisFieldReviewJsonSchema, notes: sisFieldReviewJsonSchema }
            },
            incontinence: {
              type: "object",
              additionalProperties: false,
              required: ["relevant", "level", "notes"],
              properties: { relevant: sisFieldReviewJsonSchema, level: sisFieldReviewJsonSchema, notes: sisFieldReviewJsonSchema }
            },
            pain: {
              type: "object",
              additionalProperties: false,
              required: ["relevant", "level", "notes"],
              properties: { relevant: sisFieldReviewJsonSchema, level: sisFieldReviewJsonSchema, notes: sisFieldReviewJsonSchema }
            }
          }
        }
      }
    }
  }
} as const;

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
export type SisFieldConfidence = z.infer<typeof sisFieldConfidenceSchema>;
export type SisFieldReview = z.infer<typeof sisFieldReviewSchema>;
export type SisTopic = z.infer<typeof sisTopicSchema>;
export type SisRisk = z.infer<typeof sisRiskSchema>;
export type SisAssessment = z.infer<typeof sisAssessmentSchema>;
