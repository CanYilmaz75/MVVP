import { AppError } from "@/lib/errors";

export const consultationWorkflowStatuses = [
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
] as const;

export const noteWorkflowStatuses = [
  "not_started",
  "generating",
  "draft",
  "edited",
  "approved",
  "failed"
] as const;

export type ConsultationWorkflowStatus = (typeof consultationWorkflowStatuses)[number];
export type NoteWorkflowStatus = (typeof noteWorkflowStatuses)[number];

const consultationTransitions: Record<ConsultationWorkflowStatus, ConsultationWorkflowStatus[]> = {
  created: ["recording", "audio_uploaded", "note_generating", "failed"],
  recording: ["paused", "audio_uploaded", "failed"],
  paused: ["recording", "audio_uploaded", "transcribing", "note_generating", "failed"],
  audio_uploaded: ["recording", "paused", "transcribing", "note_generating", "failed"],
  transcribing: ["transcript_ready", "failed"],
  transcript_ready: ["recording", "paused", "audio_uploaded", "note_generating", "failed"],
  note_generating: ["draft_ready", "failed"],
  draft_ready: ["recording", "paused", "audio_uploaded", "note_generating", "approved", "failed"],
  approved: ["recording", "paused", "audio_uploaded", "note_generating", "draft_ready", "exported", "failed"],
  exported: ["recording", "paused", "audio_uploaded", "note_generating", "draft_ready", "failed"],
  failed: ["recording", "audio_uploaded", "transcribing", "note_generating"]
};

const noteTransitions: Record<NoteWorkflowStatus, NoteWorkflowStatus[]> = {
  not_started: ["generating", "failed"],
  generating: ["draft", "failed"],
  draft: ["edited", "approved", "generating", "failed"],
  edited: ["edited", "approved", "generating", "failed"],
  approved: ["edited", "generating"],
  failed: ["generating"]
};

function assertKnownConsultationStatus(status: string): asserts status is ConsultationWorkflowStatus {
  if (!consultationWorkflowStatuses.includes(status as ConsultationWorkflowStatus)) {
    throw new AppError("INVALID_CONSULTATION_STATUS", "Unbekannter Beratungsstatus.", 400, { status });
  }
}

function assertKnownNoteStatus(status: string): asserts status is NoteWorkflowStatus {
  if (!noteWorkflowStatuses.includes(status as NoteWorkflowStatus)) {
    throw new AppError("INVALID_NOTE_STATUS", "Unbekannter Notizstatus.", 400, { status });
  }
}

export function assertConsultationTransition(
  currentStatus: string,
  nextStatus: string,
  details?: Record<string, unknown>
) {
  assertKnownConsultationStatus(currentStatus);
  assertKnownConsultationStatus(nextStatus);

  if (currentStatus === nextStatus) {
    return;
  }

  if (!consultationTransitions[currentStatus].includes(nextStatus)) {
    throw new AppError(
      "INVALID_CONSULTATION_TRANSITION",
      "Dieser Statuswechsel der Beratung ist nicht erlaubt.",
      409,
      {
        currentStatus,
        nextStatus,
        ...details
      }
    );
  }
}

export function assertNoteTransition(currentStatus: string, nextStatus: string, details?: Record<string, unknown>) {
  assertKnownNoteStatus(currentStatus);
  assertKnownNoteStatus(nextStatus);

  if (currentStatus === nextStatus) {
    return;
  }

  if (!noteTransitions[currentStatus].includes(nextStatus)) {
    throw new AppError(
      "INVALID_NOTE_TRANSITION",
      "Dieser Statuswechsel der Notiz ist nicht erlaubt.",
      409,
      {
        currentStatus,
        nextStatus,
        ...details
      }
    );
  }
}
