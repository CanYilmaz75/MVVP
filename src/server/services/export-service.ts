import { AppError } from "@/lib/errors";
import { renderNotePdf } from "@/lib/pdf/render-note-pdf";
import { createAuditLog } from "@/server/services/audit-service";
import { ensureConsultationAccess, updateConsultationStatus } from "@/server/services/consultation-service";
import { requireApiAuthContext } from "@/server/auth/context";
import { adminSupabase } from "@/server/supabase/admin";

const bucket = "exported-pdfs";

export async function exportNote(input: {
  consultationId: string;
  noteId: string;
  exportType: "pdf" | "clipboard";
}) {
  const { organisationId, userId, supabase } = await requireApiAuthContext();
  const consultation = await ensureConsultationAccess(input.consultationId);

  const { data: note } = await supabase
    .from("clinical_notes")
    .select("*")
    .eq("id", input.noteId)
    .eq("consultation_id", input.consultationId)
    .single();

  if (!note || note.status !== "approved" || !note.approved_at) {
    throw new AppError("NOTE_NOT_APPROVED", "Nur freigegebene Notizen koennen exportiert werden.", 400);
  }

  if (input.exportType === "clipboard") {
    const exportRecord = await supabase
      .from("exports")
      .insert({
        organisation_id: organisationId,
        consultation_id: input.consultationId,
        clinical_note_id: input.noteId,
        note_version_number: note.current_version,
        export_type: "clipboard",
        created_by: userId
      })
      .select("*")
      .single();

    await createAuditLog(supabase, {
      organisationId,
      actorId: userId,
      entityType: "export",
      entityId: exportRecord.data?.id,
      action: "note_exported",
      metadata: {
        exportType: "clipboard",
        versionNumber: note.current_version
      }
    });

    return {
      id: exportRecord.data?.id,
      exportType: "clipboard" as const,
      content: note.rendered_text
    };
  }

  const pdfBytes = await renderNotePdf({
    title: "CAREVO Klinische Notiz",
    patientReference: consultation.patient_reference,
    specialty: consultation.specialty,
    createdAt: new Date().toISOString(),
    approvedAt: note.approved_at,
    noteText: note.rendered_text
  });

  const storagePath = `${organisationId}/${input.consultationId}/${input.noteId}-v${note.current_version}.pdf`;

  const uploadResult = await adminSupabase.storage.from(bucket).upload(storagePath, pdfBytes, {
    contentType: "application/pdf",
    upsert: true
  });

  if (uploadResult.error) {
    throw new AppError("PDF_UPLOAD_FAILED", "PDF-Export konnte nicht gespeichert werden.", 500);
  }

  const { data: exportRecord, error } = await supabase
    .from("exports")
    .insert({
      organisation_id: organisationId,
      consultation_id: input.consultationId,
      clinical_note_id: input.noteId,
      note_version_number: note.current_version,
      export_type: "pdf",
      storage_path: storagePath,
      created_by: userId
    })
    .select("*")
    .single();

  if (error || !exportRecord) {
    throw new AppError("EXPORT_RECORD_FAILED", "Export-Metadaten konnten nicht gespeichert werden.", 500);
  }

  const signed = await adminSupabase.storage.from(bucket).createSignedUrl(storagePath, 300);
  if (signed.error || !signed.data) {
    throw new AppError("PDF_SIGN_URL_FAILED", "PDF-Download-URL konnte nicht erstellt werden.", 500);
  }

  await updateConsultationStatus(input.consultationId, "exported", supabase);
  await createAuditLog(supabase, {
    organisationId,
    actorId: userId,
    entityType: "export",
    entityId: exportRecord.id,
    action: "note_exported",
    metadata: {
      exportType: "pdf",
      versionNumber: note.current_version
    }
  });

  return {
    id: exportRecord.id,
    exportType: "pdf" as const,
    downloadUrl: signed.data.signedUrl
  };
}

export async function listExports() {
  const { organisationId, supabase } = await requireApiAuthContext();
  const { data, error } = await supabase
    .from("exports")
    .select("id, consultation_id, clinical_note_id, note_version_number, export_type, created_at, storage_path")
    .eq("organisation_id", organisationId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError("EXPORTS_FETCH_FAILED", "Exporte konnten nicht geladen werden.", 500);
  }

  return data;
}
