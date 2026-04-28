import type { Json } from "@/types/database";
import { logEvent } from "@/lib/logger";

type AuditAction =
  | "additional_text_added"
  | "additional_text_deleted"
  | "audio_uploaded"
  | "consultation_created"
  | "consultation_updated"
  | "job_completed"
  | "job_failed"
  | "job_queued"
  | "note_approved"
  | "note_edited"
  | "note_exported"
  | "note_generated"
  | "note_generation_started"
  | "post_approval_edit"
  | "sis_extracted"
  | "sis_saved"
  | "transcription_completed"
  | "transcription_failed"
  | "transcription_started";

type AuditSupabaseClient = {
  from(table: "audit_logs"): {
    insert(values: {
      organisation_id: string;
      actor_id: string | null;
      entity_type: string;
      entity_id: string | null;
      action: AuditAction;
      metadata: Json;
    }): PromiseLike<{ error: { message?: string } | null }>;
  };
};

export async function createAuditLog(
  supabase: AuditSupabaseClient,
  input: {
    organisationId: string;
    actorId?: string | null;
    entityType: string;
    entityId?: string | null;
    action: AuditAction;
    metadata?: Json;
  }
) {
  const result = await supabase.from("audit_logs").insert({
    organisation_id: input.organisationId,
    actor_id: input.actorId ?? null,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    action: input.action,
    metadata: input.metadata ?? {}
  });

  if (result.error) {
    logEvent({
      level: "error",
      message: "Audit log write failed",
      organisationId: input.organisationId,
      userId: input.actorId ?? undefined,
      action: input.action,
      errorCode: "AUDIT_LOG_WRITE_FAILED",
      metadata: {
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        errorMessage: result.error.message ?? "Unknown audit write error"
      }
    });
  }
}
