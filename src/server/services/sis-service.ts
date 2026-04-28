import { AppError } from "@/lib/errors";
import { createAuditLog } from "@/server/services/audit-service";
import { ensureConsultationAccess } from "@/server/services/consultation-service";
import { requireApiAuthContext } from "@/server/auth/context";
import {
  sisAssessmentSchema,
  type SisAssessment,
  type SisRisk,
  type SisRiskKey,
  type SisTopic,
  type SisTopicKey
} from "@/schemas/sis";
import { openai } from "@/server/providers/openai";

const topicKeys: SisTopicKey[] = ["cognition", "mobility", "medical", "selfCare", "social", "housing"];
const riskKeys: SisRiskKey[] = ["fall", "pressureUlcer", "malnutrition", "incontinence", "pain"];

type SisAssessmentChangeSource = "extraction" | "manual_edit" | "regeneration";

type PersistedSisAssessment = {
  id: string;
  consultationId: string;
  currentVersion: number;
  assessment: SisAssessment;
  renderedText: string;
  transcriptText: string | null;
  sourceTranscriptId: string | null;
};

function emptyAssessment(patientReference = ""): SisAssessment {
  return {
    patientReference,
    whatMatters: "",
    topics: Object.fromEntries(
      topicKeys.map((key) => [
        key,
        {
          personView: "",
          observation: "",
          resources: "",
          supportNeeds: ""
        }
      ])
    ) as SisAssessment["topics"],
    risks: Object.fromEntries(
      riskKeys.map((key) => [
        key,
        {
          relevant: false,
          level: "none",
          notes: ""
        }
      ])
    ) as SisAssessment["risks"],
    evaluationFocus: "",
    openQuestions: []
  };
}

function mergeWithDefaults(candidate: Partial<SisAssessment>, patientReference?: string) {
  const baseline = emptyAssessment(patientReference);

  return sisAssessmentSchema.parse({
    ...baseline,
    ...candidate,
    patientReference: candidate.patientReference || patientReference || "",
    topics: {
      ...baseline.topics,
      ...(candidate.topics ?? {})
    },
    risks: {
      ...baseline.risks,
      ...(candidate.risks ?? {})
    },
    openQuestions: candidate.openQuestions ?? []
  });
}

function mergeTopic(current: SisTopic, incoming: SisTopic) {
  return {
    personView: incoming.personView || current.personView,
    observation: incoming.observation || current.observation,
    resources: incoming.resources || current.resources,
    supportNeeds: incoming.supportNeeds || current.supportNeeds
  };
}

function mergeRisk(current: SisRisk, incoming: SisRisk) {
  return {
    relevant: incoming.relevant || current.relevant,
    level: incoming.level !== "none" ? incoming.level : current.level,
    notes: incoming.notes || current.notes
  };
}

function mergeSisAssessments(current: SisAssessment, incoming: SisAssessment) {
  return sisAssessmentSchema.parse({
    patientReference: incoming.patientReference || current.patientReference,
    whatMatters: incoming.whatMatters || current.whatMatters,
    topics: Object.fromEntries(
      topicKeys.map((key) => [key, mergeTopic(current.topics[key]!, incoming.topics[key]!)])
    ) as SisAssessment["topics"],
    risks: Object.fromEntries(
      riskKeys.map((key) => [key, mergeRisk(current.risks[key]!, incoming.risks[key]!)])
    ) as SisAssessment["risks"],
    evaluationFocus: incoming.evaluationFocus || current.evaluationFocus,
    openQuestions: incoming.openQuestions.length ? incoming.openQuestions : current.openQuestions
  });
}

function buildTopicSummary(title: string, topic: SisTopic) {
  const parts = [
    topic.personView ? `Perspektive: ${topic.personView}` : null,
    topic.observation ? `Einschaetzung: ${topic.observation}` : null,
    topic.resources ? `Ressourcen: ${topic.resources}` : null,
    topic.supportNeeds ? `Unterstuetzung: ${topic.supportNeeds}` : null
  ].filter(Boolean);

  return parts.length ? `${title}: ${parts.join(" | ")}` : null;
}

export function renderSisAssessment(assessment: SisAssessment) {
  const relevantRisks = riskKeys
    .map((key) => ({
      key,
      state: assessment.risks[key]!
    }))
    .filter((risk) => risk.state.relevant);

  const topicText = topicKeys
    .map((key) => {
      const title = topicTitle(key);
      return buildTopicSummary(title, assessment.topics[key]!);
    })
    .filter(Boolean)
    .join("\n");

  const riskText = relevantRisks.length
    ? relevantRisks
        .map((risk) => `- ${riskLabel(risk.key)}: ${riskLevelLabel(risk.state.level)}${risk.state.notes ? ` - ${risk.state.notes}` : ""}`)
        .join("\n")
    : "- Keine vertiefte Risikobetrachtung erforderlich.";

  const measureText = topicKeys
    .flatMap((key) =>
      assessment.topics[key]!.supportNeeds
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => `- ${topicTitle(key)}: ${line}`)
    )
    .concat(
      relevantRisks
        .filter((risk) => risk.state.level !== "none" && risk.state.notes.trim())
        .map((risk) => `- ${riskLabel(risk.key)}: ${risk.state.notes}`)
    )
    .join("\n");

  const questionText = assessment.openQuestions.length
    ? assessment.openQuestions.map((question) => `- ${question}`).join("\n")
    : "- Keine offenen Fragen.";

  return [
    "SIS - Strukturierte Informationssammlung",
    assessment.patientReference ? `Patientenreferenz: ${assessment.patientReference}` : null,
    "",
    "Was ist der Person wichtig?",
    assessment.whatMatters || "Noch nicht erfasst.",
    "",
    "Themenfelder",
    topicText || "Noch keine Themenfelder erfasst.",
    "",
    "Risikoeinschaetzung",
    riskText,
    "",
    "Massnahmenplanung",
    measureText || "- Noch keine Massnahmen abgeleitet.",
    "",
    "Evaluation / Berichteblatt-Fokus",
    assessment.evaluationFocus || "Nur Abweichungen und relevante Veraenderungen dokumentieren.",
    "",
    "Offene Fragen",
    questionText
  ]
    .filter((line) => line !== null)
    .join("\n");
}

function topicTitle(key: SisTopicKey) {
  const titles: Record<SisTopicKey, string> = {
    cognition: "Kognitive und kommunikative Faehigkeiten",
    mobility: "Mobilitaet und Beweglichkeit",
    medical: "Krankheitsbezogene Anforderungen und Belastungen",
    selfCare: "Selbstversorgung",
    social: "Leben in sozialen Beziehungen",
    housing: "Wohnen / Haeuslichkeit"
  };

  return titles[key];
}

function riskLabel(key: SisRiskKey) {
  const labels: Record<SisRiskKey, string> = {
    fall: "Sturzrisiko",
    pressureUlcer: "Dekubitusrisiko",
    malnutrition: "Mangelernaehrung",
    incontinence: "Inkontinenz",
    pain: "Schmerzen"
  };

  return labels[key];
}

function riskLevelLabel(level: SisRisk["level"]) {
  switch (level) {
    case "action":
      return "Massnahme erforderlich";
    case "monitor":
      return "Beobachten";
    default:
      return "Nicht relevant";
  }
}

function assertSisConsultation(consultation: { consultation_type: string | null; specialty: string }) {
  if (consultation.consultation_type !== "sis" && consultation.specialty !== "Pflege / SIS") {
    throw new AppError("SIS_CONSULTATION_REQUIRED", "Diese Beratung ist nicht fuer den SIS-Workflow vorgesehen.", 400);
  }
}

async function callSisModel(systemPrompt: string, userPrompt: string) {
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

function parseSisFromModel(raw: string, patientReference?: string) {
  try {
    return mergeWithDefaults(JSON.parse(raw) as Partial<SisAssessment>, patientReference);
  } catch {
    throw new AppError("SIS_EXTRACTION_FAILED", "SIS konnte nicht aus dem Transkript extrahiert werden.", 500);
  }
}

async function getPersistedSisRecord(consultationId: string) {
  const { supabase } = await requireApiAuthContext();
  const { data } = await supabase
    .from("sis_assessments")
    .select("id, consultation_id, current_version, structured_json, rendered_text, source_transcript_id")
    .eq("consultation_id", consultationId)
    .maybeSingle();

  return data;
}

async function persistSisAssessment(input: {
  consultationId: string;
  assessment: SisAssessment;
  changeSource: SisAssessmentChangeSource;
  sourceTranscriptId?: string | null;
}) {
  const { organisationId, userId, supabase } = await requireApiAuthContext();
  const consultation = await ensureConsultationAccess(input.consultationId);
  assertSisConsultation(consultation);

  const normalizedAssessment = sisAssessmentSchema.parse(input.assessment);
  const renderedText = renderSisAssessment(normalizedAssessment);
  const { data: existing } = await supabase
    .from("sis_assessments")
    .select("id, current_version")
    .eq("consultation_id", input.consultationId)
    .maybeSingle();

  let assessmentId: string;
  let versionNumber: number;

  if (!existing) {
    const inserted = await supabase
      .from("sis_assessments")
      .insert({
        organisation_id: organisationId,
        consultation_id: input.consultationId,
        current_version: 1,
        structured_json: normalizedAssessment,
        rendered_text: renderedText,
        source_transcript_id: input.sourceTranscriptId ?? null,
        created_by: userId,
        updated_by: userId
      })
      .select("id, current_version")
      .single();

    if (inserted.error || !inserted.data) {
      throw new AppError("SIS_CREATE_FAILED", "SIS konnte nicht gespeichert werden.", 500);
    }

    assessmentId = inserted.data.id;
    versionNumber = inserted.data.current_version;
  } else {
    versionNumber = existing.current_version + 1;
    const updated = await supabase
      .from("sis_assessments")
      .update({
        current_version: versionNumber,
        structured_json: normalizedAssessment,
        rendered_text: renderedText,
        source_transcript_id: input.sourceTranscriptId ?? null,
        updated_by: userId
      })
      .eq("id", existing.id)
      .select("id")
      .single();

    if (updated.error || !updated.data) {
      throw new AppError("SIS_UPDATE_FAILED", "SIS konnte nicht aktualisiert werden.", 500);
    }

    assessmentId = updated.data.id;
  }

  const versionInsert = await supabase.from("sis_assessment_versions").insert({
    organisation_id: organisationId,
    sis_assessment_id: assessmentId,
    version_number: versionNumber,
    structured_json: normalizedAssessment,
    rendered_text: renderedText,
    source_transcript_id: input.sourceTranscriptId ?? null,
    change_source: input.changeSource,
    created_by: userId
  });

  if (versionInsert.error) {
    throw new AppError("SIS_VERSION_CREATE_FAILED", "SIS-Version konnte nicht gespeichert werden.", 500);
  }

  await createAuditLog(supabase, {
    organisationId,
    actorId: userId,
    entityType: "sis_assessment",
    entityId: assessmentId,
    action: input.changeSource === "manual_edit" ? "sis_saved" : "sis_extracted",
    metadata: {
      consultationId: input.consultationId,
      versionNumber,
      sourceTranscriptId: input.sourceTranscriptId ?? null,
      changeSource: input.changeSource
    }
  });

  return {
    id: assessmentId,
    consultationId: input.consultationId,
    currentVersion: versionNumber,
    assessment: normalizedAssessment,
    renderedText
  };
}

export async function getSisAssessment(consultationId: string): Promise<PersistedSisAssessment | null> {
  const { supabase } = await requireApiAuthContext();
  const consultation = await ensureConsultationAccess(consultationId);
  assertSisConsultation(consultation);

  const [assessment, transcript] = await Promise.all([
    getPersistedSisRecord(consultationId),
    supabase
      .from("transcripts")
      .select("id, raw_text")
      .eq("consultation_id", consultationId)
      .eq("status", "ready")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  if (!assessment) {
    return null;
  }

  return {
    id: assessment.id,
    consultationId: assessment.consultation_id,
    currentVersion: assessment.current_version,
    assessment: sisAssessmentSchema.parse(assessment.structured_json),
    renderedText: assessment.rendered_text,
    transcriptText: transcript.data?.raw_text ?? null,
    sourceTranscriptId: assessment.source_transcript_id
  };
}

export async function saveSisAssessment(input: { consultationId: string; assessment: SisAssessment }) {
  return persistSisAssessment({
    consultationId: input.consultationId,
    assessment: input.assessment,
    changeSource: "manual_edit"
  });
}

export async function extractAndPersistSisAssessment(input: {
  consultationId: string;
  patientReference?: string;
  liveNotes?: string;
}) {
  const { supabase } = await requireApiAuthContext();
  const consultation = await ensureConsultationAccess(input.consultationId);
  assertSisConsultation(consultation);

  const [{ data: transcript }, existingAssessment] = await Promise.all([
    supabase
      .from("transcripts")
      .select("id, raw_text")
      .eq("consultation_id", input.consultationId)
      .eq("status", "ready")
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
    getSisAssessment(input.consultationId)
  ]);

  if (!transcript?.raw_text?.trim()) {
    throw new AppError("SIS_TRANSCRIPT_REQUIRED", "Fuer die SIS-Extraktion wird ein fertiges Transkript benoetigt.", 400);
  }

  const systemPrompt =
    "Du wandelst deutsche pflegerische SIS-Gespraeche in strukturiertes JSON um. Nutze nur Fakten aus Transkript oder Live-Notizen. Erfinde keine Diagnosen, Medikamente, Risiken, Ressourcen oder Unterstuetzungsbedarfe. Halte die Ausgabe knapp und deutsch. Gib nur gueltiges JSON zurueck.";

  const userPrompt = `
Aufgabe: Extrahiere eine Strukturierte Informationssammlung (SIS) aus dem Gespraech.

Erforderliche JSON-Struktur:
{
  "patientReference": "string",
  "whatMatters": "string",
  "topics": {
    "cognition": {"personView": "string", "observation": "string", "resources": "string", "supportNeeds": "string"},
    "mobility": {"personView": "string", "observation": "string", "resources": "string", "supportNeeds": "string"},
    "medical": {"personView": "string", "observation": "string", "resources": "string", "supportNeeds": "string"},
    "selfCare": {"personView": "string", "observation": "string", "resources": "string", "supportNeeds": "string"},
    "social": {"personView": "string", "observation": "string", "resources": "string", "supportNeeds": "string"},
    "housing": {"personView": "string", "observation": "string", "resources": "string", "supportNeeds": "string"}
  },
  "risks": {
    "fall": {"relevant": false, "level": "none", "notes": "string"},
    "pressureUlcer": {"relevant": false, "level": "none", "notes": "string"},
    "malnutrition": {"relevant": false, "level": "none", "notes": "string"},
    "incontinence": {"relevant": false, "level": "none", "notes": "string"},
    "pain": {"relevant": false, "level": "none", "notes": "string"}
  },
  "evaluationFocus": "string",
  "openQuestions": ["string"]
}

Regeln:
- Erhalte die Perspektive der Person in whatMatters und personView.
- Schreibe fachpflegerische Einschaetzungen in observation.
- Nutze resources fuer Faehigkeiten, Routinen, Helfende und Hilfsmittel.
- Nutze supportNeeds fuer konkrete Unterstuetzung oder Planungsfolgen.
- Markiere Risiken nur, wenn das Gespraech sie stuetzt.
- Risk level muss einer dieser Werte sein: "none", "monitor", "action".
- Schreibe fehlende, aber wichtige SIS-Fragen in openQuestions.
- Wenn ein Abschnitt keine Evidenz hat, nutze einen leeren String.

Patientenreferenz: ${input.patientReference ?? consultation.patient_reference}

Live-Notizen waehrend des Gespraechs:
${input.liveNotes ?? ""}

Transkript:
${transcript.raw_text}
`;

  const extracted = parseSisFromModel(
    await callSisModel(systemPrompt, userPrompt),
    input.patientReference ?? consultation.patient_reference
  );

  const assessment = existingAssessment
    ? mergeSisAssessments(existingAssessment.assessment, extracted)
    : extracted;

  const persisted = await persistSisAssessment({
    consultationId: input.consultationId,
    assessment,
    changeSource: existingAssessment ? "regeneration" : "extraction",
    sourceTranscriptId: transcript.id
  });

  return {
    ...persisted,
    transcriptText: transcript.raw_text,
    sourceTranscriptId: transcript.id
  };
}
