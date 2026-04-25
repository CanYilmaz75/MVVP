import { AppError } from "@/lib/errors";
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
    status: string;
    created_at: string;
  };
  latestTranscript: {
    id: string;
    provider: string;
    raw_text: string;
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

export async function createConsultation(input: {
  patientReference: string;
  specialty: string;
  spokenLanguage: string;
  noteTemplateId?: string;
  consultationType?: string;
}) {
  const { organisationId, userId, supabase } = await requireApiAuthContext();

  const { data, error } = await supabase
    .from("consultations")
    .insert({
      organisation_id: organisationId,
      clinician_id: userId,
      patient_reference: input.patientReference,
      specialty: input.specialty,
      spoken_language: input.spokenLanguage,
      note_template_id: input.noteTemplateId ?? null,
      consultation_type: input.consultationType ?? null,
      status: "created",
      started_at: new Date().toISOString()
    })
    .select("id, status")
    .single();

  if (error || !data) {
    throw new AppError("CONSULTATION_CREATE_FAILED", "Consultation could not be created.", 500);
  }

  await createAuditLog(supabase, {
    organisationId,
    actorId: userId,
    entityType: "consultation",
    entityId: data.id,
    action: "consultation_created",
    metadata: {
      specialty: input.specialty,
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
    .select("id, patient_reference, specialty, spoken_language, status, created_at, updated_at")
    .eq("organisation_id", organisationId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError("CONSULTATIONS_FETCH_FAILED", "Consultations could not be loaded.", 500);
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
    throw new AppError("CONSULTATION_NOT_FOUND", "Consultation could not be found.", 404);
  }

  return data;
}

export async function updateConsultationStatus(
  consultationId: string,
  status: string,
  suppliedSupabase?: Awaited<ReturnType<typeof requireApiAuthContext>>["supabase"]
) {
  const supabase = suppliedSupabase ?? (await requireApiAuthContext()).supabase;
  const { error } = await supabase
    .from("consultations")
    .update({ status })
    .eq("id", consultationId);

  if (error) {
    throw new AppError("CONSULTATION_STATUS_UPDATE_FAILED", "Consultation status could not be updated.", 500);
  }
}

export async function getConsultationWorkspace(id: string): Promise<ConsultationWorkspaceData | null> {
  const auth = await getAuthContext();
  const supabase = await createServerSupabaseClient();

  const { data: consultation } = await supabase
    .from("consultations")
    .select("id, patient_reference, specialty, spoken_language, status, created_at")
    .eq("id", id)
    .eq("organisation_id", auth.organisationId)
    .single();

  if (!consultation) {
    return null;
  }

  const [{ data: transcripts }, { data: audioAssets }, { data: note }, { data: validationJobs }] = await Promise.all([
    supabase
      .from("transcripts")
      .select("id, provider, raw_text, status")
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
    note,
    warnings: (((validationJobs?.[0]?.result as { warnings?: Warning[] } | null) ?? { warnings: [] }).warnings ?? []) as Warning[]
  };
}

export async function getConsultationWorkspaceForApi(id: string) {
  const workspace = await getConsultationWorkspace(id);
  if (!workspace) {
    throw new AppError("CONSULTATION_NOT_FOUND", "Consultation could not be found.", 404);
  }

  return workspace;
}
