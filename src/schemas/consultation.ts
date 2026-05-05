import { z } from "zod";

import { CARE_PROTOCOLS } from "@/lib/care-protocols";

const careProtocolSlugSchema = z.enum(CARE_PROTOCOLS.map((protocol) => protocol.slug) as [string, ...string[]]);
const consultationTypeSchema = z.enum(["sis", "care_consultation", "medical_consultation"]);

export const consultationStatusSchema = z.enum([
  "created",
  "recording",
  "paused",
  "audio_uploaded",
  "transcribing",
  "transcript_ready",
  "note_generating",
  "draft_ready",
  "approved",
  "exported",
  "failed"
]);

export const createConsultationSchema = z.object({
  patientReference: z.string().min(2).max(120),
  specialty: z.string().min(2).max(120),
  spokenLanguage: z.string().min(2).max(16),
  noteTemplateId: z.string().uuid().optional(),
  consultationType: consultationTypeSchema.optional(),
  careProtocols: z.array(careProtocolSlugSchema).max(CARE_PROTOCOLS.length).optional()
});

export const updateConsultationSchema = z.object({
  patientReference: z.string().min(2).max(120).optional(),
  status: z.enum(["recording", "paused"]).optional()
});

export const initiateAudioUploadSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.enum(["audio/webm", "audio/wav", "audio/mpeg", "audio/mp4"]),
  fileSizeBytes: z.number().int().positive().max(52_428_800),
  source: z.enum(["browser_recording", "upload"])
});

export const completeAudioUploadSchema = z.object({
  storagePath: z.string().min(1),
  mimeType: z.enum(["audio/webm", "audio/wav", "audio/mpeg", "audio/mp4"]),
  fileSizeBytes: z.number().int().positive().max(52_428_800),
  durationSeconds: z.number().int().nonnegative().optional(),
  source: z.enum(["browser_recording", "upload"])
});

export const createAdditionalTextSchema = z.object({
  title: z.string().min(2).max(120),
  content: z.string().min(1).max(120_000),
  sourceType: z.enum(["additional_text", "previous_note", "intake_form", "chat"]).default("additional_text")
});
