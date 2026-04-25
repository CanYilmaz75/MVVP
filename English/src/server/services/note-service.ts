import { AppError } from "@/lib/errors";
import { renderSoapNote } from "@/server/services/note-renderer";
import { createAuditLog } from "@/server/services/audit-service";
import { validateNoteAgainstTranscript } from "@/server/services/validation-service";
import { soapNoteSchema, type SoapNote } from "@/schemas/note";
import { ensureConsultationAccess, updateConsultationStatus } from "@/server/services/consultation-service";
import { requireApiAuthContext } from "@/server/auth/context";
import { openai } from "@/server/providers/openai";

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
      "You reformat invalid JSON into valid JSON that matches the provided schema exactly. Do not add clinical facts.",
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

export async function generateDraftNote(input: {
  consultationId: string;
  transcriptId: string;
  templateId?: string;
}) {
  const { organisationId, userId, supabase } = await requireApiAuthContext();
  const consultation = await ensureConsultationAccess(input.consultationId);

  const { data: transcript } = await supabase
    .from("transcripts")
    .select("*")
    .eq("id", input.transcriptId)
    .eq("consultation_id", input.consultationId)
    .single();

  if (!transcript || transcript.status !== "ready") {
    throw new AppError("TRANSCRIPT_NOT_READY", "A ready transcript is required before note generation.", 400);
  }

  const { data: template } = await supabase
    .from("note_templates")
    .select("*")
    .eq("id", input.templateId ?? consultation.note_template_id ?? "")
    .maybeSingle();

  await updateConsultationStatus(input.consultationId, "note_generating", supabase);
  await createAuditLog(supabase, {
    organisationId,
    actorId: userId,
    entityType: "consultation",
    entityId: input.consultationId,
    action: "note_generation_started"
  });

  const systemPrompt =
    "You are a clinical documentation assistant that creates physician-review draft notes. Use only facts grounded in the transcript. If uncertain, omit and add openQuestions. Return valid JSON only.";
  const userPrompt = `
Task: Convert the following consultation transcript into a structured SOAP draft note.

Rules:
- Use only transcript-supported facts.
- Do not fabricate diagnoses, medications, vitals, measurements, or follow-up details.
- Keep wording concise and clinically neutral.
- If a section has insufficient evidence, leave it sparse and add items to openQuestions.
- riskFlags should be used only when transcript clearly suggests a risk or missing critical detail.
- requiresReview must be true.

Context:
- Specialty: ${consultation.specialty}
- Source language: ${consultation.spoken_language}
- Target output language: ${consultation.spoken_language}
- Template: ${JSON.stringify(template?.template_definition ?? {})}

Transcript:
${transcript.raw_text}
`;

  const raw = await callJsonModel(systemPrompt, userPrompt);
  const structured = await parseSoapNoteOrRepair(raw);
  const rendered = renderSoapNote(structured);
  const warnings = validateNoteAgainstTranscript(structured, transcript.raw_text);

  const { data: existingNote } = await supabase
    .from("clinical_notes")
    .select("*")
    .eq("consultation_id", input.consultationId)
    .maybeSingle();

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
      throw new AppError("NOTE_CREATE_FAILED", "Draft note could not be created.", 500);
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
      throw new AppError("NOTE_UPDATE_FAILED", "Draft note could not be updated.", 500);
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

  await updateConsultationStatus(input.consultationId, "draft_ready", supabase);
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
}

export async function editDraftNote(input: {
  consultationId: string;
  noteId: string;
  editMode: "manual" | "voice";
  instructionText?: string;
  patch?: Partial<SoapNote>;
}) {
  const { organisationId, userId, supabase } = await requireApiAuthContext();
  await ensureConsultationAccess(input.consultationId);

  const [{ data: currentNote }, { data: transcript }] = await Promise.all([
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
      .maybeSingle()
  ]);

  if (!currentNote) {
    throw new AppError("NOTE_NOT_FOUND", "Clinical note could not be found.", 404);
  }

  const currentStructured = soapNoteSchema.parse(currentNote.structured_json);
  let nextStructured: SoapNote;

  if (input.editMode === "manual") {
    if (!input.patch) {
      throw new AppError("INVALID_PATCH", "Manual edit patch is required.", 400);
    }
    nextStructured = mergeSoapNote(currentStructured, input.patch);
  } else {
    if (!input.instructionText) {
      throw new AppError("MISSING_INSTRUCTION", "Voice edit instruction is required.", 400);
    }
    nextStructured = await applyVoiceInstruction(currentStructured, input.instructionText);
  }

  const rendered = renderSoapNote(nextStructured);
  const warnings = validateNoteAgainstTranscript(nextStructured, transcript?.raw_text ?? "");
  const versionNumber = currentNote.current_version + 1;
  const changeSource =
    currentNote.status === "approved"
      ? "post_approval_edit"
      : input.editMode === "manual"
        ? "manual_edit"
        : "voice_edit";

  const nextStatus = currentNote.status === "approved" ? "edited" : input.editMode === "manual" ? "edited" : "edited";

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
    instruction_text: input.instructionText ?? "Manual structured edit",
    instruction_source: input.editMode,
    result_summary: `${input.editMode} edit applied to version ${versionNumber}`,
    created_by: userId
  });

  await persistValidationJob(supabase, {
    organisationId,
    consultationId: input.consultationId,
    warnings
  });

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
  await ensureConsultationAccess(input.consultationId);

  const { data: note } = await supabase
    .from("clinical_notes")
    .select("*")
    .eq("id", input.noteId)
    .eq("consultation_id", input.consultationId)
    .single();

  if (!note) {
    throw new AppError("NOTE_NOT_FOUND", "Clinical note could not be found.", 404);
  }

  if (note.current_version !== input.expectedVersion) {
    throw new AppError("STALE_NOTE_VERSION", "The note has changed and must be reviewed again before approval.", 409);
  }

  const approvedAt = new Date().toISOString();
  await supabase
    .from("clinical_notes")
    .update({
      status: "approved",
      approved_by: userId,
      approved_at: approvedAt
    })
    .eq("id", input.noteId);

  await updateConsultationStatus(input.consultationId, "approved", supabase);
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
    "You are updating an existing draft clinical note. Only change content explicitly requested. Preserve everything else and return valid JSON only.",
    `Current note JSON:\n${JSON.stringify(currentNote)}\n\nInstruction:\n${instructionText}`
  );

  return parseSoapNoteOrRepair(raw);
}
