import { z } from "zod";

export const noteStatusSchema = z.enum(["not_started", "generating", "draft", "edited", "approved", "failed"]);

const stringArray = z.array(z.string().min(1));

export const soapNoteSchema = z.object({
  noteType: z.literal("SOAP"),
  language: z.string().min(2),
  sections: z.object({
    subjective: z.object({
      chiefComplaint: z.string(),
      historyOfPresentIllness: z.string(),
      reportedSymptoms: stringArray
    }),
    objective: z.object({
      examFindings: stringArray,
      observations: stringArray,
      vitals: stringArray
    }),
    assessment: z.object({
      clinicalSummary: z.string(),
      possibleDiagnoses: stringArray
    }),
    plan: z.object({
      medications: stringArray,
      followUp: z.string(),
      referrals: stringArray,
      testsOrdered: stringArray,
      instructions: stringArray
    })
  }),
  openQuestions: stringArray,
  riskFlags: stringArray,
  requiresReview: z.literal(true)
});

export type SoapNote = z.infer<typeof soapNoteSchema>;

export const warningSchema = z.object({
  code: z.string(),
  severity: z.enum(["low", "medium", "high"]),
  message: z.string(),
  section: z.string()
});

export const warningsResponseSchema = z.object({
  warnings: z.array(warningSchema)
});

export const generateNoteSchema = z.object({
  transcriptId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  idempotencyKey: z.string().min(8).max(128).optional()
});

export const editNoteSchema = z.object({
  noteId: z.string().uuid(),
  editMode: z.enum(["manual", "voice"]),
  instructionText: z.string().min(1).max(5000).optional(),
  patch: z
    .object({
      sections: soapNoteSchema.shape.sections.partial().optional(),
      openQuestions: z.array(z.string()).optional(),
      riskFlags: z.array(z.string()).optional()
    })
    .optional()
});

export const approveNoteSchema = z.object({
  noteId: z.string().uuid(),
  expectedVersion: z.number().int().positive()
});

export const exportNoteSchema = z.object({
  noteId: z.string().uuid(),
  exportType: z.enum(["pdf", "clipboard"]),
  idempotencyKey: z.string().min(8).max(128).optional()
});

export const voiceEditApplySchema = z.object({
  noteId: z.string().uuid(),
  instructionText: z.string().min(1).max(5000)
});
