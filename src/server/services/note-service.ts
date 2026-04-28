import { AppError } from "@/lib/errors";
import { assertNoteTransition } from "@/lib/workflow-state";
import { renderSoapNote } from "@/server/services/note-renderer";
import { createAuditLog } from "@/server/services/audit-service";
import { validateNoteAgainstTranscript } from "@/server/services/validation-service";
import { soapNoteSchema, type SoapNote } from "@/schemas/note";
import { ensureConsultationAccess, updateConsultationStatus } from "@/server/services/consultation-service";
import { requireApiAuthContext } from "@/server/auth/context";
import { openai } from "@/server/providers/openai";
import { getTemplateDefinitionForGeneration } from "@/features/templates/types";

async function callJsonModel(systemPrompt: string, userPrompt: string) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    response_format: {
      type: "json_object"
    },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]
  });

  return completion.choices[0]?.message?.content ?? "";
}

async function parseSoapNoteOrRepair(raw: string) {
  try {
    return soapNoteSchema.parse(JSON.parse(raw));
  } catch {
    const repaired = await callJsonModel(
      "Du formatierst ungueltiges JSON in gueltiges JSON um, das exakt zum bereitgestellten Schema passt. Fuege keine klinischen Fakten hinzu.",
      `Schema:\n${JSON.stringify(soapNoteSchema._def, null, 2)}\n\nContent:\n${raw}`
    );
    return soapNoteSchema.parse(JSON.parse(repaired));
  }
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
    "Du bist eine Assistenz fuer klinische Dokumentation und erstellst Entwuerfe zur fachlichen Pruefung. Nutze ausschliesslich Fakten aus den bereitgestellten Quellen. Wenn etwas unsicher ist, lasse es weg und ergaenze openQuestions. Schreibe alle Inhalte auf Deutsch und gib nur gueltiges JSON zurueck.";
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

Kontext:
- Fachbereich: ${consultation.specialty}
- Ausgangssprache: ${consultation.spoken_language}
- Zielsprache: de
- Vorlage: ${JSON.stringify(getTemplateDefinitionForGeneration(template?.template_definition))}

Quellen:
${sourceText}
`;

  try {
    const raw = await callJsonModel(systemPrompt, userPrompt);
    const structured = await parseSoapNoteOrRepair(raw);
    const rendered = renderSoapNote(structured);
    const warnings = validateNoteAgainstTranscript(structured, sourceText);

    let noteId: string;
    let versionNumber: number;
    let status: "draft" | "edited";
    let changeSource: "generation" | "regeneration" | "post_approval_edit";

    if (!existingNote) {
      const inserted = await supabase
        .from("clinical_notes")
        .insert({
          organisation_id: organisationId,
          consultation_id: input.consultationId,
          current_version: 1,
          status: "draft",
          structured_json: structured,
          rendered_text: rendered
        })
        .select("*")
        .single();

      if (inserted.error || !inserted.data) {
        throw new AppError("NOTE_CREATE_FAILED", "Notizentwurf konnte nicht erstellt werden.", 500);
      }

      noteId = inserted.data.id;
      versionNumber = 1;
      status = "draft";
      changeSource = "generation";
    } else {
      noteId = existingNote.id;
      versionNumber = existingNote.current_version + 1;
      status = "edited";
      changeSource = existingNote.status === "approved" ? "post_approval_edit" : "regeneration";
      assertNoteTransition(existingNote.status, status, {
        noteId,
        consultationId: input.consultationId,
        action: "generate"
      });

      const updated = await supabase
        .from("clinical_notes")
        .update({
          current_version: versionNumber,
          status,
          structured_json: structured,
          rendered_text: rendered,
          approved_by: null,
          approved_at: null
        })
        .eq("id", noteId)
        .select("id")
        .single();

      if (updated.error) {
        throw new AppError("NOTE_UPDATE_FAILED", "Notizentwurf konnte nicht aktualisiert werden.", 500);
      }
    }

    await supabase.from("clinical_note_versions").insert({
      organisation_id: organisationId,
      clinical_note_id: noteId,
      version_number: versionNumber,
      structured_json: structured,
      rendered_text: rendered,
      change_source: changeSource,
      created_by: userId
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
      entityId: noteId,
      action: "note_generated",
      metadata: {
        versionNumber
      }
    });

    return {
      id: noteId,
      status,
      versionNumber,
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
  const versionNumber = currentNote.current_version + 1;
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

  await supabase
    .from("clinical_notes")
    .update({
      current_version: versionNumber,
      structured_json: nextStructured,
      rendered_text: rendered,
      status: nextStatus,
      approved_at: null,
      approved_by: null
    })
    .eq("id", input.noteId);

  await supabase.from("clinical_note_versions").insert({
    organisation_id: organisationId,
    clinical_note_id: input.noteId,
    version_number: versionNumber,
    structured_json: nextStructured,
    rendered_text: rendered,
    change_source: changeSource,
    created_by: userId
  });

  await supabase.from("note_edits").insert({
    organisation_id: organisationId,
    clinical_note_id: input.noteId,
    instruction_text: input.instructionText ?? "Manuelle strukturierte Bearbeitung",
    instruction_source: input.editMode,
    result_summary: `${input.editMode} Bearbeitung auf Version ${versionNumber} angewendet`,
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
      versionNumber,
      editMode: input.editMode
    }
  });

  return {
    id: input.noteId,
    status: nextStatus,
    versionNumber,
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
