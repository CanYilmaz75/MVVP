import { randomUUID } from "node:crypto";

import { AppError } from "@/lib/errors";
import type { Json } from "@/types/database";
import { requireApiAuthContext } from "@/server/auth/context";
import { createAuditLog } from "@/server/services/audit-service";
import { trackProductMetric } from "@/server/services/product-metrics-service";

export type AsyncJobAction =
  | "transcribe"
  | "generate-note"
  | "voice-edit-apply"
  | "export-note"
  | "sis-extract";

export type AsyncJob = {
  id: string;
  jobType: string;
  action: AsyncJobAction;
  status: "queued" | "processing" | "completed" | "failed";
  result: Json | null;
  errorMessage: string | null;
};

function asyncJobType(action: AsyncJobAction, idempotencyKey?: string) {
  return `async:${action}:${idempotencyKey ?? randomUUID()}`;
}

function parseAsyncAction(jobType: string): AsyncJobAction {
  const action = jobType.split(":")[1];
  if (
    action === "transcribe"
    || action === "generate-note"
    || action === "voice-edit-apply"
    || action === "export-note"
    || action === "sis-extract"
  ) {
    return action;
  }

  throw new AppError("UNKNOWN_JOB_ACTION", "Unbekannter Job-Typ.", 400, { jobType });
}

function toAsyncJob(row: {
  id: string;
  job_type: string;
  status: "queued" | "processing" | "completed" | "failed";
  result: Json | null;
  error_message: string | null;
}): AsyncJob {
  return {
    id: row.id,
    jobType: row.job_type,
    action: parseAsyncAction(row.job_type),
    status: row.status,
    result: row.result,
    errorMessage: row.error_message
  };
}

export async function createOrReuseAsyncJob(input: {
  action: AsyncJobAction;
  consultationId: string;
  payload: Json;
  idempotencyKey?: string;
}) {
  const { organisationId, userId, supabase } = await requireApiAuthContext();
  const jobType = asyncJobType(input.action, input.idempotencyKey);

  const inserted = await supabase
    .from("jobs")
    .insert({
      organisation_id: organisationId,
      consultation_id: input.consultationId,
      job_type: jobType,
      status: "queued",
      payload: {
        action: input.action,
        input: input.payload
      },
      attempts: 0
    })
    .select("id, job_type, status, result, error_message")
    .single();

  if (inserted.data) {
    await createAuditLog(supabase, {
      organisationId,
      actorId: userId,
      entityType: "job",
      entityId: inserted.data.id,
      action: "job_queued",
      metadata: {
        action: input.action,
        consultationId: input.consultationId
      }
    });
    trackProductMetric({
      organisationId,
      userId,
      consultationId: input.consultationId,
      metric: "job_queued",
      properties: {
        action: input.action
      }
    });
    return toAsyncJob(inserted.data);
  }

  if (!input.idempotencyKey) {
    throw new AppError("JOB_CREATE_FAILED", "Job konnte nicht angelegt werden.", 500);
  }

  const { data: existing, error } = await supabase
    .from("jobs")
    .select("id, job_type, status, result, error_message")
    .eq("organisation_id", organisationId)
    .eq("consultation_id", input.consultationId)
    .eq("job_type", jobType)
    .maybeSingle();

  if (error || !existing) {
    throw new AppError("JOB_CREATE_FAILED", "Job konnte nicht angelegt oder wiederverwendet werden.", 500);
  }

  return toAsyncJob(existing);
}

export async function getAsyncJob(jobId: string) {
  const { organisationId, supabase } = await requireApiAuthContext();
  const { data, error } = await supabase
    .from("jobs")
    .select("id, job_type, status, result, error_message")
    .eq("id", jobId)
    .eq("organisation_id", organisationId)
    .single();

  if (error || !data) {
    throw new AppError("JOB_NOT_FOUND", "Job wurde nicht gefunden.", 404);
  }

  return toAsyncJob(data);
}

export async function getAsyncJobPayload(jobId: string) {
  const { organisationId, supabase } = await requireApiAuthContext();
  const { data, error } = await supabase
    .from("jobs")
    .select("id, job_type, consultation_id, status, payload, attempts")
    .eq("id", jobId)
    .eq("organisation_id", organisationId)
    .single();

  if (error || !data) {
    throw new AppError("JOB_NOT_FOUND", "Job wurde nicht gefunden.", 404);
  }

  return data;
}

export async function markAsyncJobProcessing(jobId: string) {
  const { organisationId, supabase } = await requireApiAuthContext();
  const { data, error } = await supabase
    .from("jobs")
    .update({
      status: "processing",
      attempts: 1
    })
    .eq("id", jobId)
    .eq("organisation_id", organisationId)
    .eq("status", "queued")
    .select("id")
    .maybeSingle();

  if (error) {
    throw new AppError("JOB_CLAIM_FAILED", "Job konnte nicht gestartet werden.", 500);
  }

  return Boolean(data);
}

export async function completeAsyncJob(jobId: string, result: Json) {
  const { organisationId, userId, supabase } = await requireApiAuthContext();
  const { data, error } = await supabase
    .from("jobs")
    .update({
      status: "completed",
      result,
      error_message: null
    })
    .eq("id", jobId)
    .eq("organisation_id", organisationId)
    .select("id, job_type, consultation_id")
    .single();

  if (error || !data) {
    throw new AppError("JOB_COMPLETE_FAILED", "Job konnte nicht abgeschlossen werden.", 500);
  }

  const action = parseAsyncAction(data.job_type);
  await createAuditLog(supabase, {
    organisationId,
    actorId: userId,
    entityType: "job",
    entityId: jobId,
    action: "job_completed",
    metadata: {
      action,
      consultationId: data.consultation_id
    }
  });
  trackProductMetric({
    organisationId,
    userId,
    consultationId: data.consultation_id ?? undefined,
    metric: "job_completed",
    properties: { action }
  });
}

export async function failAsyncJob(jobId: string, errorMessage: string) {
  const { organisationId, userId, supabase } = await requireApiAuthContext();
  const { data, error } = await supabase
    .from("jobs")
    .update({
      status: "failed",
      error_message: errorMessage
    })
    .eq("id", jobId)
    .eq("organisation_id", organisationId)
    .select("id, job_type, consultation_id")
    .single();

  if (error || !data) {
    throw new AppError("JOB_FAIL_FAILED", "Job-Fehlerstatus konnte nicht gespeichert werden.", 500);
  }

  const action = parseAsyncAction(data.job_type);
  await createAuditLog(supabase, {
    organisationId,
    actorId: userId,
    entityType: "job",
    entityId: jobId,
    action: "job_failed",
    metadata: {
      action,
      consultationId: data.consultation_id
    }
  });
  trackProductMetric({
    organisationId,
    userId,
    consultationId: data.consultation_id ?? undefined,
    metric: "job_failed",
    properties: { action }
  });
}

export async function getIdempotentJobResult(action: string, consultationId: string, key?: string) {
  if (!key) {
    return null;
  }

  const { organisationId, supabase } = await requireApiAuthContext();
  const { data } = await supabase
    .from("jobs")
    .select("result")
    .eq("organisation_id", organisationId)
    .eq("consultation_id", consultationId)
    .eq("job_type", `idempotency:${action}:${key}`)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.result as Json) ?? null;
}

export async function storeIdempotentJobResult(
  action: string,
  consultationId: string,
  result: Json,
  key?: string
) {
  if (!key) {
    return;
  }

  const { organisationId, supabase } = await requireApiAuthContext();
  await supabase.from("jobs").insert({
    organisation_id: organisationId,
    consultation_id: consultationId,
    job_type: `idempotency:${action}:${key}`,
    status: "completed",
    result,
    payload: {}
  });
}
