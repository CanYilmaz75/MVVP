import { z } from "zod";

export const transcriptStatusSchema = z.enum(["queued", "processing", "ready", "failed"]);

export const transcriptSegmentSchema = z.object({
  speakerLabel: z.string().optional(),
  startMs: z.number().int().nonnegative().optional(),
  endMs: z.number().int().nonnegative().optional(),
  text: z.string().min(1)
});

export const normalizedTranscriptSchema = z.object({
  rawText: z.string().min(20),
  detectedLanguage: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  segments: z.array(transcriptSegmentSchema)
});

export type NormalizedTranscript = z.infer<typeof normalizedTranscriptSchema>;

export const transcribeConsultationSchema = z.object({
  audioAssetId: z.string().uuid()
});
