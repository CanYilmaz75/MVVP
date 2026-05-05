import { AppError } from "@/lib/errors";
import { isCareFacility } from "@/lib/care-setting";
import { normalizeCareProtocols } from "@/lib/care-protocols";
import { assertConsultationTransition, type ConsultationWorkflowStatus } from "@/lib/workflow-state";
import type { SoapNote } from "@/schemas/note";
import { createAuditLog } from "@/server/services/audit-service";
import { getAuthContext, requireApiAuthContext } from "@/server/auth/context";
import { createServerSupabaseClient } from "@/server/supabase/server";

type Warning = {
  code: string;
  severity: "low" | "medium" | "high";
  message: string;
  section: string;
};

export type ConsultationWorkspaceData = {
  consultation: {
    id: string;
    patient_reference: string;
    specialty: string;
    spoken_language: string;
    consultation_type: "sis" | "care_consultation" | "medical_consultation";
    care_protocols: string[] | null;
    status: string;
    created_at: string;
  };
  latestTranscript: {
    id: string;
    provider: string;
    raw_text: string;
    detected_language: string | null;
    status: string;
  } | null;
  latestAudioAsset: {
    id: string;
    storage_path: string;
    mime_type: string;
    file_size_bytes: number | null;
    duration_seconds: number | null;
    source: "browser_recording" | "upload" | "voice_edit";
    created_at: string;
  } | null;
  additionalTexts: {
    id: string;
    title: string;
    content: string;
    source_type: "additional_text" | "previous_note" | "intake_form" | "chat";
    created_at: string;
  }[];
  note: {
    id: string;
    rendered_text: string;
    status: string;
    current_version: number;
    approved_at: string | null;
    structured_json: SoapNote;
  } | null;
  warnings: Warning[];
};

export type PausedConsultationSummary = {
  id: string;
  patient_reference: string;
  specialty: string;
  updated_at: string;
};

export async function createConsultation(input: {
  patientReference: string;
  specialty: string;
  spokenLanguage: string;
  noteTemplateId?: string;
  consultationType?: "sis" | "care_consultation" | "medical_consultation";
  careProtocols?: string[];
}) {
  const { organisation, organisationId, userId, supabase } = await requireApiAuthContext();
  const isCare = isCareFacility(organisation.care_setting);
  const isSisConsultation = input.consultationType === "sis";

  if (isSisConsultation && !isCare) {
    throw new AppError("SIS_NOT_AVAILABLE", "SIS ist nur fuer Pflegeeinrichtungen verfuegbar.", 403);
  }

  const specialty = isSisConsultation ? "Pflege / SIS" : isCare ? "Pflegeberatung" : "Praxis / Medizin";
  const consultationType = isSisConsultation ? "sis" : isCare ? "care_consultation" : "medical_consultation";
  const careProtocols = isCare && !isSisConsultation ? normalizeCareProtocols(input.careProtocols ?? []) : [];

  const { data, error } = await supabase
    .from("consultations")
    .insert({
      organisation_id: organisationId,
      clinician_id: userId,
      patient_reference: input.patientReference,
      specialty,
      spoken_language: input.spokenLanguage,
      note_template_id: input.noteTemplateId ?? null,
      consultation_type: consultationType,
      care_protocols: careProtocols,
      status: "created",
      started_at: new Date().toISOString()
    })
    .select("id, status")
    .single();

  if (error || !data) {
    throw new AppError("CONSULTATION_CREATE_FAILED", "Beratung konnte nicht angelegt werden.", 500);
  }

  await createAuditLog(supabase, {
    organisationId,
    actorId: userId,
    entityType: "consultation",
    entityId: data.id,
    action: "consultation_created",
    metadata: {
      specialty,
      consultationType,
      careProtocols,
      spokenLanguage: input.spokenLanguage
    }
  });

  return data;
}

export async function listConsultations() {
  const { organisationId } = await requireApiAuthContext();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("consultations")
    .select("id, patient_reference, specialty, spoken_language, consultation_type, care_protocols, status, created_at, updated_at")
    .eq("organisation_id", organisationId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError("CONSULTATIONS_FETCH_FAILED", "Beratungen konnten nicht geladen werden.", 500);
  }

  return data;
}

export async function listPausedConsultations(): Promise<PausedConsultationSummary[]> {
  const auth = await getAuthContext();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("consultations")
    .select("id, patient_reference, specialty, updated_at")
    .eq("organisation_id", auth.organisationId)
    .eq("status", "paused")
    .order("updated_at", { ascending: false })
    .limit(8);

  if (error) {
    throw new AppError("PAUSED_CONSULTATIONS_FETCH_FAILED", "Pausierte Gespräche konnten nicht geladen werden.", 500);
  }

  return data;
}

export async function ensureConsultationAccess(consultationId: string) {
  const { organisationId, supabase } = await requireApiAuthContext();
  const { data, error } = await supabase
    .from("consultations")
    .select("*")
    .eq("id", consultationId)
    .eq("organisation_id", organisationId)
    .single();

  if (error || !data) {
    throw new AppError("CONSULTATION_NOT_FOUND", "Beratung wurde nicht gefunden.", 404);
  }

  return data;
}

export async function updateConsultationStatus(
  consultationId: string,
  status: ConsultationWorkflowStatus,
  suppliedSupabase?: Awaited<ReturnType<typeof requireApiAuthContext>>["supabase"],
  options?: {
    currentStatus?: string;
    transitionSource?: string;
  }
) {
  const supabase = suppliedSupabase ?? (await requireApiAuthContext()).supabase;
  const currentStatus =
    options?.currentStatus
    ?? (
      await supabase
        .from("consultations")
        .select("status")
        .eq("id", consultationId)
        .single()
    ).data?.status;

  if (!currentStatus) {
    throw new AppError("CONSULTATION_NOT_FOUND", "Beratung wurde nicht gefunden.", 404);
  }

  assertConsultationTransition(currentStatus, status, {
    consultationId,
    transitionSource: options?.transitionSource ?? "internal"
  });

  const { error } = await supabase
    .from("consultations")
    .update({ status })
    .eq("id", consultationId);

  if (error) {
    throw new AppError("CONSULTATION_STATUS_UPDATE_FAILED", "Beratungsstatus konnte nicht aktualisiert werden.", 500);
  }
}

export async function updateConsultation(
  consultationId: string,
  input: {
    patientReference?: string;
    status?: "recording" | "paused";
  }
) {
  const { organisationId, userId, supabase } = await requireApiAuthContext();
  const consultation = await ensureConsultationAccess(consultationId);

  const update: { patient_reference?: string; status?: "recording" | "paused" } = {};

  if (input.patientReference) {
    update.patient_reference = input.patientReference;
  }

  if (input.status) {
    update.status = input.status;
  }

  if (!Object.keys(update).length) {
    throw new AppError("CONSULTATION_UPDATE_EMPTY", "Es wurden keine Änderungen übergeben.", 400);
  }

  if (update.status) {
    assertConsultationTransition(consultation.status, update.status, {
      consultationId,
      transitionSource: "client"
    });
  }

  const { data, error } = await supabase
    .from("consultations")
    .update(update)
    .eq("id", consultationId)
    .eq("organisation_id", organisationId)
    .select("id, patient_reference, specialty, spoken_language, consultation_type, care_protocols, status, created_at")
    .single();

  if (error || !data) {
    throw new AppError("CONSULTATION_UPDATE_FAILED", "Gespräch konnte nicht aktualisiert werden.", 500);
  }

  await createAuditLog(supabase, {
    organisationId,
    actorId: userId,
    entityType: "consultation",
    entityId: consultationId,
    action: "consultation_updated",
    metadata: update
  });

  return data;
}

export async function createAdditionalText(
  consultationId: string,
  input: {
    title: string;
    content: string;
    sourceType: "additional_text" | "previous_note" | "intake_form" | "chat";
  }
) {
  const { organisationId, userId, supabase } = await requireApiAuthContext();
  await ensureConsultationAccess(consultationId);

  const { data, error } = await supabase
    .from("consultation_additional_texts")
    .insert({
      organisation_id: organisationId,
      consultation_id: consultationId,
      title: input.title,
      content: input.content,
      source_type: input.sourceType,
      created_by: userId
    })
    .select("id, title, content, source_type, created_at")
    .single();

  if (error || !data) {
    throw new AppError("ADDITIONAL_TEXT_CREATE_FAILED", "Zusätzlicher Text konnte nicht gespeichert werden.", 500);
  }

  await createAuditLog(supabase, {
    organisationId,
    actorId: userId,
    entityType: "consultation_additional_text",
    entityId: data.id,
    action: "additional_text_added",
    metadata: {
      consultationId,
      sourceType: data.source_type,
      title: data.title
    }
  });

  return data;
}

export async function deleteAdditionalText(consultationId: string, additionalTextId: string) {
  const { organisationId, userId, supabase } = await requireApiAuthContext();
  await ensureConsultationAccess(consultationId);

  const { data, error } = await supabase
    .from("consultation_additional_texts")
    .delete()
    .eq("id", additionalTextId)
    .eq("consultation_id", consultationId)
    .eq("organisation_id", organisationId)
    .select("id, title")
    .single();

  if (error || !data) {
    throw new AppError("ADDITIONAL_TEXT_DELETE_FAILED", "Zusätzlicher Text konnte nicht gelöscht werden.", 500);
  }

  await createAuditLog(supabase, {
    organisationId,
    actorId: userId,
    entityType: "consultation_additional_text",
    entityId: additionalTextId,
    action: "additional_text_deleted",
    metadata: {
      consultationId,
      title: data.title
    }
  });

  return data;
}

export async function getConsultationWorkspace(id: string): Promise<ConsultationWorkspaceData | null> {
  const auth = await getAuthContext();
  const supabase = await createServerSupabaseClient();

  const { data: consultation } = await supabase
    .from("consultations")
    .select("id, patient_reference, specialty, spoken_language, consultation_type, care_protocols, status, created_at")
    .eq("id", id)
    .eq("organisation_id", auth.organisationId)
    .single();

  if (!consultation) {
    return null;
  }

  const [{ data: transcripts }, { data: audioAssets }, { data: additionalTexts }, { data: note }, { data: validationJobs }] = await Promise.all([
    supabase
      .from("transcripts")
      .select("id, provider, raw_text, detected_language, status")
      .eq("consultation_id", id)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("audio_assets")
      .select("id, storage_path, mime_type, file_size_bytes, duration_seconds, source, created_at")
      .eq("consultation_id", id)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("consultation_additional_texts")
      .select("id, title, content, source_type, created_at")
      .eq("consultation_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("clinical_notes")
      .select("id, rendered_text, status, current_version, approved_at, structured_json")
      .eq("consultation_id", id)
      .maybeSingle(),
    supabase
      .from("jobs")
      .select("result")
      .eq("consultation_id", id)
      .eq("job_type", "validation")
      .order("created_at", { ascending: false })
      .limit(1)
  ]);

  return {
    consultation,
    latestTranscript: transcripts?.[0] ?? null,
    latestAudioAsset: audioAssets?.[0] ?? null,
    additionalTexts: additionalTexts ?? [],
    note,
    warnings: (((validationJobs?.[0]?.result as { warnings?: Warning[] } | null) ?? { warnings: [] }).warnings ?? []) as Warning[]
  };
}

export async function getConsultationWorkspaceForApi(id: string) {
  const workspace = await getConsultationWorkspace(id);
  if (!workspace) {
    throw new AppError("CONSULTATION_NOT_FOUND", "Beratung wurde nicht gefunden.", 404);
  }

  return workspace;
}
