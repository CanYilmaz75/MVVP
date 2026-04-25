import { File } from "node:buffer";

import { AppError } from "@/lib/errors";
import { normalizedTranscriptSchema } from "@/schemas/transcript";
import { createAuditLog } from "@/server/services/audit-service";
import { ensureConsultationAccess, updateConsultationStatus } from "@/server/services/consultation-service";
import { requireApiAuthContext } from "@/server/auth/context";
import { openai } from "@/server/providers/openai";
import { adminSupabase } from "@/server/supabase/admin";

const bucket = "consultation-audio";

export async function transcribeConsultationAudio(consultationId: string, audioAssetId: string) {
  const { organisationId, userId, supabase } = await requireApiAuthContext();
  const consultation = await ensureConsultationAccess(consultationId);

  const { data: audioAsset, error: audioError } = await supabase
    .from("audio_assets")
    .select("*")
    .eq("id", audioAssetId)
    .eq("consultation_id", consultationId)
    .single();

  if (audioError || !audioAsset) {
    throw new AppError("AUDIO_ASSET_NOT_FOUND", "Audiodatei wurde nicht gefunden.", 404);
  }

  await updateConsultationStatus(consultationId, "transcribing", supabase);
  await createAuditLog(supabase, {
    organisationId,
    actorId: userId,
    entityType: "consultation",
    entityId: consultationId,
    action: "transcription_started"
  });

  const { data: blobData, error: downloadError } = await adminSupabase.storage
    .from(bucket)
    .download(audioAsset.storage_path);

  if (downloadError || !blobData) {
    throw new AppError("AUDIO_DOWNLOAD_FAILED", "Gespeichertes Audio konnte nicht gelesen werden.", 500);
  }

  const transcriptionRecord = await supabase
    .from("transcripts")
    .insert({
      organisation_id: organisationId,
      consultation_id: consultationId,
      audio_asset_id: audioAssetId,
      provider: "openai",
      raw_text: "",
      status: "processing"
    })
    .select("id")
    .single();

  if (transcriptionRecord.error || !transcriptionRecord.data) {
    throw new AppError("TRANSCRIPT_CREATE_FAILED", "Transkriptdatensatz konnte nicht erstellt werden.", 500);
  }

  try {
    const file = new File(
      [new Uint8Array(await blobData.arrayBuffer())],
      audioAsset.storage_path.split("/").pop() ?? "audio.webm",
      {
        type: audioAsset.mime_type
      }
    );

    const fixedLanguage =
      consultation.spoken_language !== "auto" && /^[a-z]{2}$/i.test(consultation.spoken_language)
        ? consultation.spoken_language.toLowerCase()
        : null;
    const response = await openai.audio.transcriptions.create({
      file,
      model: "gpt-4o-mini-transcribe",
      response_format: "verbose_json",
      ...(fixedLanguage ? { language: fixedLanguage } : {})
    });

    const normalized = normalizedTranscriptSchema.parse({
      rawText: response.text,
      detectedLanguage: response.language ?? undefined,
      confidence: typeof response.duration === "number" ? 1 : undefined,
      segments: (response.segments ?? []).map((segment) => ({
        speakerLabel: undefined,
        startMs: segment.start ? Math.round(segment.start * 1000) : undefined,
        endMs: segment.end ? Math.round(segment.end * 1000) : undefined,
        text: segment.text
      }))
    });

    const { data: transcript } = await supabase
      .from("transcripts")
      .update({
        raw_text: normalized.rawText,
        detected_language: normalized.detectedLanguage ?? null,
        confidence: normalized.confidence ?? null,
        status: "ready"
      })
      .eq("id", transcriptionRecord.data.id)
      .select("*")
      .single();

    if (normalized.segments.length) {
      await supabase.from("transcript_segments").insert(
        normalized.segments.map((segment, index) => ({
          transcript_id: transcriptionRecord.data.id,
          speaker_label: segment.speakerLabel ?? null,
          start_ms: segment.startMs ?? null,
          end_ms: segment.endMs ?? null,
          text: segment.text,
          segment_index: index
        }))
      );
    }

    await updateConsultationStatus(consultationId, "transcript_ready", supabase);
    await createAuditLog(supabase, {
      organisationId,
      actorId: userId,
      entityType: "transcript",
      entityId: transcriptionRecord.data.id,
      action: "transcription_completed",
      metadata: {
        languageSetting: consultation.spoken_language,
        detectedLanguage: normalized.detectedLanguage ?? null
      }
    });

    return transcript;
  } catch (error) {
    await supabase
      .from("transcripts")
      .update({ status: "failed", raw_text: "" })
      .eq("id", transcriptionRecord.data.id);
    await updateConsultationStatus(consultationId, "failed", supabase);
    await createAuditLog(supabase, {
      organisationId,
      actorId: userId,
      entityType: "consultation",
      entityId: consultationId,
      action: "transcription_failed"
    });

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("TRANSCRIPTION_FAILED", "Transkription konnte nicht abgeschlossen werden.", 500);
  }
}

export async function transcribeInstructionAudio(
  file: { arrayBuffer(): Promise<ArrayBuffer>; name?: string; type?: string },
  mimeType: string
) {
  const response = await openai.audio.transcriptions.create({
    file: new File([new Uint8Array(await file.arrayBuffer())], file.name || "voice-edit.webm", { type: mimeType }),
    model: "gpt-4o-mini-transcribe"
  });

  const text = response.text?.trim();
  if (!text) {
    throw new AppError("VOICE_EDIT_TRANSCRIPTION_EMPTY", "Sprachbefehl konnte nicht transkribiert werden.", 400);
  }

  return text;
}
