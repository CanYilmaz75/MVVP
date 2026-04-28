import { AppError, isAppError } from "@/lib/errors";
import type { Json } from "@/types/database";
import {
  completeAsyncJob,
  failAsyncJob,
  getAsyncJob,
  getAsyncJobPayload,
  markAsyncJobProcessing,
  type AsyncJobAction
} from "@/server/services/job-service";
import { transcribeConsultationAudio } from "@/server/services/transcription-service";
import { generateDraftNote, editDraftNote } from "@/server/services/note-service";
import { exportNote } from "@/server/services/export-service";
import { extractAndPersistSisAssessment } from "@/server/services/sis-service";
import { requireApiAuthContext } from "@/server/auth/context";
import { trackProductMetric } from "@/server/services/product-metrics-service";

type JobPayload = {
  action?: AsyncJobAction;
  input?: Record<string, unknown>;
};

export async function processAsyncJob(jobId: string) {
  const job = await getAsyncJob(jobId);

  if (job.status === "completed" || job.status === "failed") {
    return job;
  }

  const claimed = job.status === "processing" ? false : await markAsyncJobProcessing(jobId);
  if (!claimed && job.status !== "processing") {
    return getAsyncJob(jobId);
  }

  try {
    const row = await getAsyncJobPayload(jobId);
    const payload = row.payload as JobPayload;
    const input = payload.input ?? {};
    const result = await runAction(job.action, row.consultation_id, input);
    await trackActionMetric(job.action, row.consultation_id);
    await completeAsyncJob(jobId, result);
  } catch (error) {
    const appError = isAppError(error)
      ? error
      : new AppError("ASYNC_JOB_FAILED", "Job konnte nicht abgeschlossen werden.", 500);
    await failAsyncJob(jobId, appError.message);
  }

  return getAsyncJob(jobId);
}

async function trackActionMetric(action: AsyncJobAction, consultationId: string | null) {
  const { organisationId, userId } = await requireApiAuthContext();
  const metricByAction = {
    transcribe: "transcript_ready",
    "generate-note": "note_generated",
    "voice-edit-apply": "voice_edit_used",
    "export-note": "export_completed",
    "sis-extract": "sis_extracted"
  } as const;

  trackProductMetric({
    organisationId,
    userId,
    consultationId: consultationId ?? undefined,
    metric: metricByAction[action],
    properties: {
      action
    }
  });
}

async function runAction(action: AsyncJobAction, consultationId: string | null, input: Record<string, unknown>): Promise<Json> {
  if (!consultationId && action !== "sis-extract") {
    throw new AppError("JOB_CONSULTATION_REQUIRED", "Job benoetigt eine Beratung.", 400);
  }

  switch (action) {
    case "transcribe": {
      const audioAssetId = requireString(input.audioAssetId, "audioAssetId");
      const transcript = await transcribeConsultationAudio(consultationId!, audioAssetId);
      return {
        transcriptId: transcript?.id,
        transcriptStatus: transcript?.status
      };
    }
    case "generate-note":
      return await generateDraftNote({
        consultationId: consultationId!,
        transcriptId: optionalString(input.transcriptId),
        templateId: optionalString(input.templateId)
      }) as Json;
    case "voice-edit-apply":
      return await editDraftNote({
        consultationId: consultationId!,
        noteId: requireString(input.noteId, "noteId"),
        editMode: "voice",
        instructionText: requireString(input.instructionText, "instructionText")
      }) as Json;
    case "export-note":
      return await exportNote({
        consultationId: consultationId!,
        noteId: requireString(input.noteId, "noteId"),
        exportType: requireExportType(input.exportType)
      }) as Json;
    case "sis-extract":
      return await extractAndPersistSisAssessment({
        consultationId: requireString(input.consultationId, "consultationId"),
        patientReference: optionalString(input.patientReference),
        liveNotes: optionalString(input.liveNotes)
      }) as Json;
  }
}

function requireString(value: unknown, key: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new AppError("INVALID_JOB_PAYLOAD", `Job-Payload ist ungueltig: ${key}.`, 400);
  }

  return value;
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function requireExportType(value: unknown) {
  if (value === "pdf" || value === "clipboard") {
    return value;
  }

  throw new AppError("INVALID_JOB_PAYLOAD", "Job-Payload ist ungueltig: exportType.", 400);
}
