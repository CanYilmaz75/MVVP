import { randomUUID } from "node:crypto";
import path from "node:path";

import { AppError } from "@/lib/errors";
import { createAuditLog } from "@/server/services/audit-service";
import { ensureConsultationAccess, updateConsultationStatus } from "@/server/services/consultation-service";
import { requireApiAuthContext } from "@/server/auth/context";
import { adminSupabase } from "@/server/supabase/admin";

const bucket = "consultation-audio";

export async function initiateAudioUpload(
  consultationId: string,
  input: {
    fileName: string;
    mimeType: "audio/webm" | "audio/wav" | "audio/mpeg" | "audio/mp4";
    fileSizeBytes: number;
    source: "browser_recording" | "upload";
  }
) {
  const { organisationId } = await requireApiAuthContext();
  await ensureConsultationAccess(consultationId);

  const ext = path.extname(input.fileName) || mimeExtension(input.mimeType);
  const storagePath = `${organisationId}/${consultationId}/${input.source}/${Date.now()}-${randomUUID()}${ext}`;

  const { data, error } = await adminSupabase.storage.from(bucket).createSignedUploadUrl(storagePath);

  if (error || !data) {
    throw new AppError("AUDIO_UPLOAD_INIT_FAILED", "Audio-Upload konnte nicht gestartet werden.", 500);
  }

  return {
    bucket,
    storagePath,
    token: data.token
  };
}

export async function completeAudioUpload(
  consultationId: string,
  input: {
    storagePath: string;
    mimeType: "audio/webm" | "audio/wav" | "audio/mpeg" | "audio/mp4";
    fileSizeBytes: number;
    durationSeconds?: number;
    source: "browser_recording" | "upload";
  }
) {
  const { organisationId, userId, supabase } = await requireApiAuthContext();
  await ensureConsultationAccess(consultationId);

  if (!input.storagePath.startsWith(`${organisationId}/${consultationId}/`)) {
    throw new AppError("INVALID_STORAGE_PATH", "Audiopfad ist fuer diese Beratung ungueltig.", 400);
  }

  const { data, error } = await supabase
    .from("audio_assets")
    .insert({
      organisation_id: organisationId,
      consultation_id: consultationId,
      storage_path: input.storagePath,
      mime_type: input.mimeType,
      file_size_bytes: input.fileSizeBytes,
      duration_seconds: input.durationSeconds ?? null,
      source: input.source,
      created_by: userId
    })
    .select("id, storage_path, mime_type, file_size_bytes, duration_seconds, source, created_at")
    .single();

  if (error || !data) {
    throw new AppError("AUDIO_ASSET_CREATE_FAILED", "Audio-Metadaten konnten nicht gespeichert werden.", 500);
  }

  await updateConsultationStatus(consultationId, "audio_uploaded", supabase);
  await createAuditLog(supabase, {
    organisationId,
    actorId: userId,
    entityType: "audio_asset",
    entityId: data.id,
    action: "audio_uploaded",
    metadata: {
      mimeType: data.mime_type,
      source: data.source,
      fileSizeBytes: data.file_size_bytes
    }
  });

  return data;
}

function mimeExtension(mimeType: string) {
  switch (mimeType) {
    case "audio/webm":
      return ".webm";
    case "audio/wav":
      return ".wav";
    case "audio/mpeg":
      return ".mp3";
    case "audio/mp4":
      return ".mp4";
    default:
      return "";
  }
}
