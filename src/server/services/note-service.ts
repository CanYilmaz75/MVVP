import { AppError } from "@/lib/errors";
import { buildCareProtocolPrompt, getCareProtocolLabels } from "@/lib/care-protocols";
import { assertNoteTransition } from "@/lib/workflow-state";
import { renderSoapNote } from "@/server/services/note-renderer";
import { createAuditLog } from "@/server/services/audit-service";
import { validateNoteAgainstTranscript } from "@/server/services/validation-service";
import { soapNoteJsonSchema, soapNoteSchema, type SoapNote } from "@/schemas/note";
import { ensureConsultationAccess, updateConsultationStatus } from "@/server/services/consultation-service";
import { requireApiAuthContext } from "@/server/auth/context";
import { clinicalAiProvider } from "@/server/providers/clinical-ai-provider";
import { getTemplateDefinitionForGeneration } from "@/features/templates/types";
import type { Json } from "@/types/database";

async function callJsonModel(systemPrompt: string, userPrompt: string, schemaName = "soap_note") {
  return clinicalAiProvider.generateJson({
    schemaName,
    schema: soapNoteJsonSchema,
    systemPrompt,
    userPrompt
  });
}

async function parseSoapNoteOrRepair(raw: string) {
  try {
    return soapNoteSchema.parse(JSON.parse(raw));
  } catch {
    const repaired = await callJsonModel(
      "Du formatierst ungueltiges JSON in gueltiges JSON um, das exakt zum bereitgestellten Schema passt. Fuege keine klinischen Fakten hinzu.",
      `JSON Schema:\n${JSON.stringify(soapNoteJsonSchema, null, 2)}\n\nContent:\n${raw}`,
      "soap_note_repair"
    );
    return soapNoteSchema.parse(JSON.parse(repaired));
  }
}

async function persistClinicalNoteVersion(
  supabase: Awaited<ReturnType<typeof requireApiAuthContext>>["supabase"],
  input: {
    organisationId: string;
    consultationId: string;
    noteId: string | null;
    status: "draft" | "edited";
    structured: SoapNote;
    rendered: string;
    changeSource: "generation" | "regeneration" | "post_approval_edit" | "manual_edit" | "voice_edit";
    createdBy: string;
  }
) {
  const { data, error } = await supabase.rpc("persist_clinical_note_version", {
    p_organisation_id: input.organisationId,
    p_consultation_id: input.consultationId,
    p_note_id: input.noteId,
    p_status: input.status,
    p_structured_json: input.structured as Json,
    p_rendered_text: input.rendered,
    p_change_source: input.changeSource,
    p_created_by: input.createdBy,
    p_clear_approval: true
  });

  const persisted = data?.[0];
  if (error || !persisted) {
    throw new AppError("NOTE_VERSION_PERSIST_FAILED", "Notiz und Version konnten nicht atomar gespeichert werden.", 500);
  }

  return {
    noteId: persisted.note_id,
    versionNumber: persisted.version_number
  };
}

function mergeSoapNote(current: SoapNote, patch: Partial<SoapNote>) {
  return soapNoteSchema.parse({
    ...current,
    ...patch,
    sections: {
      ...current.sections,
      ...(patch.sections ?? {}),
      subjective: {
        ...current.sections.subjective,
        ...(patch.sections?.subjective ?? {})
      },
      objective: {
        ...current.sections.objective,
        ...(patch.sections?.objective ?? {})
      },
      assessment: {
        ...current.sections.assessment,
        ...(patch.sections?.assessment ?? {})
      },
      plan: {
        ...current.sections.plan,
        ...(patch.sections?.plan ?? {})
      }
    }
  });
}

function buildSourceText(input: {
  transcriptTexts?: string[];
  additionalTexts?: Array<{ title: string; content: string; source_type: string }>;
}) {
  const blocks: string[] = [];

  input.transcriptTexts?.forEach((transcriptText, index) => {
    if (transcriptText.trim()) {
      blocks.push(`Quelle: Beratungstranskript ${index + 1}\n${transcriptText.trim()}`);
    }
  });

  for (const additionalText of input.additionalTexts ?? []) {
    blocks.push(
      `Quelle: ${additionalText.title} (${additionalText.source_type})\n${additionalText.content.trim()}`
    );
  }

  return blocks.join("\n\n---\n\n");
}

function consultationTypeLabel(type: string | null) {
  if (type === "sis") {
    return "SIS";
  }

  if (type === "care_consultation") {
    return "Pflegeberatung";
  }

  if (type === "medical_consultation") {
    return "Beratung fuer Praxen und Mediziner";
  }

  return "-";
}

async function persistValidationJob(
  supabase: Awaited<ReturnType<typeof requireApiAuthContext>>["supabase"],
  input: {
    organisationId: string;
    consultationId: string;
    warnings: ReturnType<typeof validateNoteAgainstTranscript>;
  }
) {
  await supabase.from("jobs").insert({
    organisation_id: input.organisationId,
    consultation_id: input.consultationId,
    job_type: "validation",
    status: "completed",
    payload: {},
    result: { warnings: input.warnings }
  });
}

function ensureNoteCanBeApproved(input: {
  consultationStatus: string;
  noteStatus: string;
  note: SoapNote;
  warnings: Awaited<ReturnType<typeof getCurrentWarnings>>;
}) {
  if (input.consultationStatus !== "draft_ready") {
    throw new AppError(
      "CONSULTATION_NOT_READY_FOR_APPROVAL",
      "Die Beratung ist fachlich noch nicht bereit fuer die Freigabe.",
      409,
      { consultationStatus: input.consultationStatus }
    );
  }

  if (input.noteStatus !== "draft" && input.noteStatus !== "edited") {
    throw new AppError("NOTE_NOT_READY_FOR_APPROVAL", "Nur Entwuerfe koennen freigegeben werden.", 409, {
      noteStatus: input.noteStatus
    });
  }

  if (!input.note.requiresReview) {
    throw new AppError("NOTE_REVIEW_FLAG_MISSING", "Die Notiz ist nicht als pruefpflichtiger Entwurf markiert.", 409);
  }

  if (!input.note.sections.subjective.chiefComplaint.trim()) {
    throw new AppError("NOTE_SUBJECTIVE_REQUIRED", "Vor der Freigabe wird ein Hauptanliegen benoetigt.", 409);
  }

  if (!input.note.sections.assessment.clinicalSummary.trim()) {
    throw new AppError("NOTE_ASSESSMENT_REQUIRED", "Vor der Freigabe wird eine klinische Einschaetzung benoetigt.", 409);
  }

  const planHasContent =
    input.note.sections.plan.followUp.trim().length > 0
    || input.note.sections.plan.medications.length > 0
    || input.note.sections.plan.referrals.length > 0
    || input.note.sections.plan.testsOrdered.length > 0
    || input.note.sections.plan.instructions.length > 0;

  if (!planHasContent) {
    throw new AppError("NOTE_PLAN_REQUIRED", "Vor der Freigabe wird ein dokumentierter Plan benoetigt.", 409);
  }

  if (input.note.openQuestions.length > 0) {
    throw new AppError("NOTE_OPEN_QUESTIONS_BLOCK_APPROVAL", "Offene Fragen muessen vor der Freigabe geklaert werden.", 409, {
      openQuestions: input.note.openQuestions
    });
  }

  const blockingWarnings = input.warnings.filter((warning) => warning.severity === "high");
  if (blockingWarnings.length > 0) {
    throw new AppError(
      "NOTE_WARNINGS_BLOCK_APPROVAL",
      "Freigabe ist blockiert, solange kritische Validierungshinweise bestehen.",
      409,
      {
        warnings: blockingWarnings
      }
    );
  }
}

export async function generateDraftNote(input: {
  consultationId: string;
  transcriptId?: string;
  templateId?: string;
}) {
  const { organisationId, userId, supabase } = await requireApiAuthContext();
  const consultation = await ensureConsultationAccess(input.consultationId);

  let transcriptTexts: string[] = [];

  if (input.transcriptId) {
    const { data } = await supabase
      .from("transcripts")
      .select("raw_text, status")
      .eq("id", input.transcriptId)
      .eq("consultation_id", input.consultationId)
      .single();

    const transcript = data;

    if (!transcript || transcript.status !== "ready") {
      throw new AppError("TRANSCRIPT_NOT_READY", "Vor der Notizerstellung wird ein fertiges Transkript benoetigt.", 400);
    }

    transcriptTexts = [transcript.raw_text];
  } else {
    const { data } = await supabase
      .from("transcripts")
      .select("raw_text")
      .eq("consultation_id", input.consultationId)
      .eq("status", "ready")
      .order("created_at", { ascending: true });

    transcriptTexts = ((data ?? []) as Array<{ raw_text: string }>).map((item) => item.raw_text);
  }

  const { data: additionalTexts } = await supabase
    .from("consultation_additional_texts")
    .select("title, content, source_type")
    .eq("consultation_id", input.consultationId)
    .order("created_at", { ascending: true });

  const sourceText = buildSourceText({
    transcriptTexts,
    additionalTexts: additionalTexts ?? []
  });

  if (!sourceText.trim()) {
    throw new AppError(
      "NOTE_SOURCE_REQUIRED",
      "Für die Notizerstellung wird ein Transkript oder zusätzlicher Text benötigt.",
      400
    );
  }

  const { data: template } = await supabase
    .from("note_templates")
    .select("*")
    .eq("id", input.templateId ?? consultation.note_template_id ?? "")
    .maybeSingle();

  const { data: existingNote } = await supabase
    .from("clinical_notes")
    .select("*")
    .eq("consultation_id", input.consultationId)
    .maybeSingle();

  await updateConsultationStatus(input.consultationId, "note_generating", supabase, {
    currentStatus: consultation.status,
    transitionSource: "note_generation"
  });
  await createAuditLog(supabase, {
    organisationId,
    actorId: userId,
    entityType: "consultation",
    entityId: input.consultationId,
    action: "note_generation_started"
  });

  const systemPrompt =
    "Du bist eine Assistenz fuer klinische und pflegerische Dokumentation und erstellst Entwuerfe zur fachlichen Pruefung. Nutze ausschliesslich Fakten aus den bereitgestellten Quellen. Wenn etwas unsicher ist, lasse es weg und ergaenze openQuestions. Schreibe alle Inhalte auf Deutsch und gib nur gueltiges JSON zurueck.";
  const selectedCareProtocolLabels = getCareProtocolLabels(consultation.care_protocols);
  const careProtocolPrompt = buildCareProtocolPrompt(consultation.care_protocols);
  const userPrompt = `
Aufgabe: Wandle die folgenden Quellen in einen strukturierten SOAP-Notizentwurf um.

Regeln:
- Nutze nur Fakten, die durch das Transkript oder zusätzlichen Text gestuetzt sind.
- Erfinde keine Diagnosen, Medikamente, Vitalwerte, Messwerte oder Nachsorgedetails.
- Formuliere knapp und klinisch neutral.
- Wenn fuer einen Abschnitt zu wenig Evidenz vorliegt, halte ihn knapp und ergaenze Punkte in openQuestions.
- riskFlags nur nutzen, wenn das Transkript klar ein Risiko oder ein fehlendes kritisches Detail nahelegt.
- requiresReview muss true sein.
- Inhaltliche Textwerte muessen Deutsch sein.
- Wenn Pflegeprotokolle ausgewaehlt sind, beruecksichtige deren Leitfragen in Assessment, Plan, riskFlags und openQuestions.
- Leite offene Themen/Fragen aus den ausgewaehlten Protokollen ab, wenn notwendige Angaben in den Quellen fehlen.
- Bei DNQP-nahen Themen wie Schmerz, Sturz, Dekubitus, chronische Wunden, Ernaehrung und Kontinenz fachlich nah an den Expertenstandards bleiben, ohne unbelegte Details zu erfinden.
- Bei Hygiene auf einrichtungsspezifische Hygieneplaene, IfSG-Pflichten und KRINKO/RKI-Empfehlungen verweisen, wenn konkrete Verfahren fehlen oder geklaert werden muessen.

Kontext:
- Fachbereich: ${consultation.specialty}
- Beratungsart: ${consultationTypeLabel(consultation.consultation_type)}
- Pflegeprotokolle: ${selectedCareProtocolLabels.length ? selectedCareProtocolLabels.join(", ") : "-"}
- Ausgangssprache: ${consultation.spoken_language}
- Zielsprache: de
- Vorlage: ${JSON.stringify(getTemplateDefinitionForGeneration(template?.template_definition))}

Pflegeprotokoll-Leitfragen:
${careProtocolPrompt}

Quellen:
${sourceText}
`;

  try {
    const raw = await callJsonModel(systemPrompt, userPrompt);
    const structured = await parseSoapNoteOrRepair(raw);
    const rendered = renderSoapNote(structured);
    const warnings = validateNoteAgainstTranscript(structured, sourceText);

    let status: "draft" | "edited";
    let changeSource: "generation" | "regeneration" | "post_approval_edit";

    if (!existingNote) {
      status = "draft";
      changeSource = "generation";
    } else {
      status = "edited";
      changeSource = existingNote.status === "approved" ? "post_approval_edit" : "regeneration";
      assertNoteTransition(existingNote.status, status, {
        noteId: existingNote.id,
        consultationId: input.consultationId,
        action: "generate"
      });
    }

    const persisted = await persistClinicalNoteVersion(supabase, {
      organisationId,
      consultationId: input.consultationId,
      noteId: existingNote?.id ?? null,
      status,
      structured,
      rendered,
      changeSource,
      createdBy: userId
    });

    await persistValidationJob(supabase, {
      organisationId,
      consultationId: input.consultationId,
      warnings
    });

    await updateConsultationStatus(input.consultationId, "draft_ready", supabase, {
      currentStatus: "note_generating",
      transitionSource: "note_generation_completed"
    });
    await createAuditLog(supabase, {
      organisationId,
      actorId: userId,
      entityType: "clinical_note",
      entityId: persisted.noteId,
      action: "note_generated",
      metadata: {
        versionNumber: persisted.versionNumber
      }
    });

    return {
      id: persisted.noteId,
      status,
      versionNumber: persisted.versionNumber,
      renderedText: rendered,
      structured,
      warnings
    };
  } catch (error) {
    await updateConsultationStatus(input.consultationId, "failed", supabase, {
      currentStatus: "note_generating",
      transitionSource: "note_generation_failed"
    });

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("NOTE_GENERATION_FAILED", "Notizentwurf konnte nicht erstellt werden.", 500);
  }
}

export async function editDraftNote(input: {
  consultationId: string;
  noteId: string;
  editMode: "manual" | "voice";
  instructionText?: string;
  patch?: Partial<SoapNote>;
}) {
  const { organisationId, userId, supabase } = await requireApiAuthContext();
  const consultation = await ensureConsultationAccess(input.consultationId);

  const [{ data: currentNote }, { data: transcript }, { data: additionalTexts }] = await Promise.all([
    supabase
      .from("clinical_notes")
      .select("*")
      .eq("id", input.noteId)
      .eq("consultation_id", input.consultationId)
      .single(),
    supabase
      .from("transcripts")
      .select("raw_text")
      .eq("consultation_id", input.consultationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("consultation_additional_texts")
      .select("title, content, source_type")
      .eq("consultation_id", input.consultationId)
      .order("created_at", { ascending: true })
  ]);

  if (!currentNote) {
    throw new AppError("NOTE_NOT_FOUND", "Klinische Notiz wurde nicht gefunden.", 404);
  }

  const currentStructured = soapNoteSchema.parse(currentNote.structured_json);
  let nextStructured: SoapNote;

  if (input.editMode === "manual") {
    if (!input.patch) {
      throw new AppError("INVALID_PATCH", "Fuer die manuelle Bearbeitung wird ein Patch benoetigt.", 400);
    }
    nextStructured = mergeSoapNote(currentStructured, input.patch);
  } else {
    if (!input.instructionText) {
      throw new AppError("MISSING_INSTRUCTION", "Fuer die Sprachbearbeitung wird eine Anweisung benoetigt.", 400);
    }
    nextStructured = await applyVoiceInstruction(currentStructured, input.instructionText);
  }

  const rendered = renderSoapNote(nextStructured);
  const sourceText = buildSourceText({
    transcriptTexts: transcript?.raw_text ? [transcript.raw_text] : [],
    additionalTexts: additionalTexts ?? []
  });
  const warnings = validateNoteAgainstTranscript(nextStructured, sourceText);
  const changeSource =
    currentNote.status === "approved"
      ? "post_approval_edit"
      : input.editMode === "manual"
        ? "manual_edit"
        : "voice_edit";

  const nextStatus = "edited";
  assertNoteTransition(currentNote.status, nextStatus, {
    noteId: input.noteId,
    consultationId: input.consultationId,
    action: "edit"
  });

  const persisted = await persistClinicalNoteVersion(supabase, {
    organisationId,
    consultationId: input.consultationId,
    noteId: input.noteId,
    status: nextStatus,
    structured: nextStructured,
    rendered,
    changeSource,
    createdBy: userId
  });

  await supabase.from("note_edits").insert({
    organisation_id: organisationId,
    clinical_note_id: input.noteId,
    instruction_text: input.instructionText ?? "Manuelle strukturierte Bearbeitung",
    instruction_source: input.editMode,
    result_summary: `${input.editMode} Bearbeitung auf Version ${persisted.versionNumber} angewendet`,
    created_by: userId
  });

  await persistValidationJob(supabase, {
    organisationId,
    consultationId: input.consultationId,
    warnings
  });

  if (consultation.status !== "draft_ready") {
    await updateConsultationStatus(input.consultationId, "draft_ready", supabase, {
      currentStatus: consultation.status,
      transitionSource: "note_edit"
    });
  }

  await createAuditLog(supabase, {
    organisationId,
    actorId: userId,
    entityType: "clinical_note",
    entityId: input.noteId,
    action: currentNote.status === "approved" ? "post_approval_edit" : "note_edited",
    metadata: {
      versionNumber: persisted.versionNumber,
      editMode: input.editMode
    }
  });

  return {
    id: input.noteId,
    status: nextStatus,
    versionNumber: persisted.versionNumber,
    structured: nextStructured,
    renderedText: rendered,
    warnings
  };
}

export async function approveDraftNote(input: {
  consultationId: string;
  noteId: string;
  expectedVersion: number;
}) {
  const { organisationId, userId, supabase } = await requireApiAuthContext();
  const consultation = await ensureConsultationAccess(input.consultationId);

  const { data: note } = await supabase
    .from("clinical_notes")
    .select("*")
    .eq("id", input.noteId)
    .eq("consultation_id", input.consultationId)
    .single();

  if (!note) {
    throw new AppError("NOTE_NOT_FOUND", "Klinische Notiz wurde nicht gefunden.", 404);
  }

  if (note.current_version !== input.expectedVersion) {
    throw new AppError("STALE_NOTE_VERSION", "Die Notiz wurde geaendert und muss vor der Freigabe erneut geprueft werden.", 409);
  }

  const structuredNote = soapNoteSchema.parse(note.structured_json);
  const warnings = await getCurrentWarnings(input.consultationId);

  ensureNoteCanBeApproved({
    consultationStatus: consultation.status,
    noteStatus: note.status,
    note: structuredNote,
    warnings
  });
  assertNoteTransition(note.status, "approved", {
    noteId: input.noteId,
    consultationId: input.consultationId,
    action: "approve"
  });

  const approvedAt = new Date().toISOString();
  await supabase
    .from("clinical_notes")
    .update({
      status: "approved",
      approved_by: userId,
      approved_at: approvedAt
    })
    .eq("id", input.noteId);

  await updateConsultationStatus(input.consultationId, "approved", supabase, {
    currentStatus: consultation.status,
    transitionSource: "note_approval"
  });
  await createAuditLog(supabase, {
    organisationId,
    actorId: userId,
    entityType: "clinical_note",
    entityId: input.noteId,
    action: "note_approved",
    metadata: {
      approvedAt,
      versionNumber: note.current_version
    }
  });

  return {
    id: input.noteId,
    status: "approved" as const,
    approvedAt
  };
}

export async function getCurrentWarnings(consultationId: string) {
  const { supabase } = await requireApiAuthContext();
  const { data } = await supabase
    .from("jobs")
    .select("result")
    .eq("consultation_id", consultationId)
    .eq("job_type", "validation")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return ((data?.result as { warnings?: ReturnType<typeof validateNoteAgainstTranscript> } | null) ?? { warnings: [] })
    .warnings ?? [];
}

export async function applyVoiceInstruction(currentNote: SoapNote, instructionText: string) {
  const raw = await callJsonModel(
    "Du aktualisierst eine bestehende klinische Entwurfsnotiz. Aendere nur ausdruecklich angeforderte Inhalte. Erhalte alles andere, schreibe Textwerte auf Deutsch und gib nur gueltiges JSON zurueck.",
    `Aktuelle Notiz als JSON:\n${JSON.stringify(currentNote)}\n\nAnweisung:\n${instructionText}`
  );

  return parseSoapNoteOrRepair(raw);
}
