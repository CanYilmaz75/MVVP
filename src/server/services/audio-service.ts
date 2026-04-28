import { randomUUID } from "node:crypto";
import path from "node:path";

import { AppError } from "@/lib/errors";
import { createAuditLog } from "@/server/services/audit-service";
import { ensureConsultationAccess, updateConsultationStatus } from "@/server/services/consultation-service";
import { requireApiAuthContext } from "@/server/auth/context";
import { adminSupabase } from "@/server/supabase/admin";

const bucket = "consultation-audio";
const maxSizeDifferenceBytes = 1024;

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

  await assertUploadedObjectMatches(input.storagePath, {
    mimeType: input.mimeType,
    fileSizeBytes: input.fileSizeBytes
  });

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

async function assertUploadedObjectMatches(
  storagePath: string,
  expected: {
    mimeType: string;
    fileSizeBytes: number;
  }
) {
  const pathParts = storagePath.split("/");
  const fileName = pathParts.pop();
  const directory = pathParts.join("/");

  if (!fileName || !directory) {
    throw new AppError("INVALID_STORAGE_PATH", "Audiopfad ist ungueltig.", 400);
  }

  const { data, error } = await adminSupabase.storage.from(bucket).list(directory, {
    limit: 100,
    search: fileName
  });

  if (error) {
    throw new AppError("AUDIO_STORAGE_METADATA_FAILED", "Audio-Metadaten konnten nicht geprueft werden.", 500);
  }

  const object = data?.find((item: { name: string }) => item.name === fileName);
  if (!object) {
    throw new AppError("AUDIO_OBJECT_NOT_FOUND", "Hochgeladene Audiodatei wurde im Storage nicht gefunden.", 400);
  }

  const metadata = (object.metadata ?? {}) as Record<string, unknown>;
  const storageSize = typeof metadata.size === "number" ? metadata.size : object.metadata?.["content-length"];
  const numericStorageSize =
    typeof storageSize === "number"
      ? storageSize
      : typeof storageSize === "string"
        ? Number(storageSize)
        : null;

  if (
    typeof numericStorageSize === "number"
    && Number.isFinite(numericStorageSize)
    && Math.abs(numericStorageSize - expected.fileSizeBytes) > maxSizeDifferenceBytes
  ) {
    throw new AppError("AUDIO_SIZE_MISMATCH", "Audio-Upload stimmt nicht mit der erwarteten Dateigroesse ueberein.", 400, {
      expectedFileSizeBytes: expected.fileSizeBytes,
      storageFileSizeBytes: numericStorageSize
    });
  }

  const storageMimeType =
    metadata.mimetype
    ?? metadata.mime_type
    ?? metadata.contentType
    ?? metadata["content-type"];

  if (typeof storageMimeType === "string" && storageMimeType !== expected.mimeType) {
    throw new AppError("AUDIO_MIME_MISMATCH", "Audio-Upload stimmt nicht mit dem erwarteten Dateityp ueberein.", 400, {
      expectedMimeType: expected.mimeType,
      storageMimeType
    });
  }
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
