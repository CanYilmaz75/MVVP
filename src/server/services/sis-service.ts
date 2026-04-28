import { AppError } from "@/lib/errors";
import { createAuditLog } from "@/server/services/audit-service";
import { ensureConsultationAccess } from "@/server/services/consultation-service";
import { requireApiAuthContext } from "@/server/auth/context";
import {
  sisAssessmentJsonSchema,
  sisAssessmentSchema,
  type SisAssessment,
  type SisFieldReview,
  type SisRisk,
  type SisRiskKey,
  type SisTopic,
  type SisTopicKey
} from "@/schemas/sis";
import { clinicalAiProvider } from "@/server/providers/clinical-ai-provider";
import type { Json } from "@/types/database";

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
    openQuestions: [],
    review: emptyAssessmentReview()
  };
}

function emptyFieldReview(): SisFieldReview {
  return {
    evidence: [],
    confidence: "unknown",
    needsReview: true
  };
}

function reviewForValue(value: unknown): SisFieldReview {
  return {
    evidence: [],
    confidence: value ? "unknown" : "unknown",
    needsReview: Boolean(value)
  };
}

function emptyAssessmentReview(): NonNullable<SisAssessment["review"]> {
  return {
    whatMatters: emptyFieldReview(),
    evaluationFocus: emptyFieldReview(),
    topics: Object.fromEntries(
      topicKeys.map((key) => [
        key,
        {
          personView: emptyFieldReview(),
          observation: emptyFieldReview(),
          resources: emptyFieldReview(),
          supportNeeds: emptyFieldReview()
        }
      ])
    ) as NonNullable<SisAssessment["review"]>["topics"],
    risks: Object.fromEntries(
      riskKeys.map((key) => [
        key,
        {
          relevant: emptyFieldReview(),
          level: emptyFieldReview(),
          notes: emptyFieldReview()
        }
      ])
    ) as NonNullable<SisAssessment["review"]>["risks"]
  };
}

function mergeReviewWithDefaults(candidate: Partial<NonNullable<SisAssessment["review"]>> | undefined, assessment: Partial<SisAssessment>) {
  return {
    whatMatters: candidate?.whatMatters ?? reviewForValue(assessment.whatMatters),
    evaluationFocus: candidate?.evaluationFocus ?? reviewForValue(assessment.evaluationFocus),
    topics: Object.fromEntries(
      topicKeys.map((key) => [
        key,
        {
          personView: candidate?.topics?.[key]?.personView ?? reviewForValue(assessment.topics?.[key]?.personView),
          observation: candidate?.topics?.[key]?.observation ?? reviewForValue(assessment.topics?.[key]?.observation),
          resources: candidate?.topics?.[key]?.resources ?? reviewForValue(assessment.topics?.[key]?.resources),
          supportNeeds: candidate?.topics?.[key]?.supportNeeds ?? reviewForValue(assessment.topics?.[key]?.supportNeeds)
        }
      ])
    ) as NonNullable<SisAssessment["review"]>["topics"],
    risks: Object.fromEntries(
      riskKeys.map((key) => [
        key,
        {
          relevant: candidate?.risks?.[key]?.relevant ?? reviewForValue(assessment.risks?.[key]?.relevant),
          level: candidate?.risks?.[key]?.level ?? reviewForValue(assessment.risks?.[key]?.level !== "none"),
          notes: candidate?.risks?.[key]?.notes ?? reviewForValue(assessment.risks?.[key]?.notes)
        }
      ])
    ) as NonNullable<SisAssessment["review"]>["risks"]
  };
}

function mergeWithDefaults(candidate: Partial<SisAssessment>, patientReference?: string) {
  const baseline = emptyAssessment(patientReference);

  const normalized = {
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
    openQuestions: candidate.openQuestions ?? [],
    review: mergeReviewWithDefaults(candidate.review, candidate)
  };

  return sisAssessmentSchema.parse(normalized);
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
    openQuestions: incoming.openQuestions.length ? incoming.openQuestions : current.openQuestions,
    review: mergeReviewMetadata(current, incoming)
  });
}

function mergeFieldReview(current: SisFieldReview, incoming: SisFieldReview, incomingValue: unknown) {
  return incomingValue ? incoming : current;
}

function mergeReviewMetadata(current: SisAssessment, incoming: SisAssessment): NonNullable<SisAssessment["review"]> {
  const currentReview = current.review ?? emptyAssessmentReview();
  const incomingReview = incoming.review ?? emptyAssessmentReview();

  return {
    whatMatters: mergeFieldReview(currentReview.whatMatters, incomingReview.whatMatters, incoming.whatMatters),
    evaluationFocus: mergeFieldReview(currentReview.evaluationFocus, incomingReview.evaluationFocus, incoming.evaluationFocus),
    topics: Object.fromEntries(
      topicKeys.map((key) => [
        key,
        {
          personView: mergeFieldReview(currentReview.topics[key]!.personView, incomingReview.topics[key]!.personView, incoming.topics[key]!.personView),
          observation: mergeFieldReview(currentReview.topics[key]!.observation, incomingReview.topics[key]!.observation, incoming.topics[key]!.observation),
          resources: mergeFieldReview(currentReview.topics[key]!.resources, incomingReview.topics[key]!.resources, incoming.topics[key]!.resources),
          supportNeeds: mergeFieldReview(currentReview.topics[key]!.supportNeeds, incomingReview.topics[key]!.supportNeeds, incoming.topics[key]!.supportNeeds)
        }
      ])
    ) as NonNullable<SisAssessment["review"]>["topics"],
    risks: Object.fromEntries(
      riskKeys.map((key) => [
        key,
        {
          relevant: mergeFieldReview(currentReview.risks[key]!.relevant, incomingReview.risks[key]!.relevant, incoming.risks[key]!.relevant),
          level: mergeFieldReview(currentReview.risks[key]!.level, incomingReview.risks[key]!.level, incoming.risks[key]!.level !== "none"),
          notes: mergeFieldReview(currentReview.risks[key]!.notes, incomingReview.risks[key]!.notes, incoming.risks[key]!.notes)
        }
      ])
    ) as NonNullable<SisAssessment["review"]>["risks"]
  };
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
  return clinicalAiProvider.generateJson({
    schemaName: "sis_assessment",
    schema: sisAssessmentJsonSchema,
    systemPrompt,
    userPrompt
  });
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

  const { data: persistedRows, error: persistError } = await supabase.rpc("persist_sis_assessment_version", {
    p_organisation_id: organisationId,
    p_consultation_id: input.consultationId,
    p_assessment_id: existing?.id ?? null,
    p_structured_json: normalizedAssessment as Json,
    p_rendered_text: renderedText,
    p_source_transcript_id: input.sourceTranscriptId ?? null,
    p_change_source: input.changeSource,
    p_actor_id: userId
  });

  const persisted = persistedRows?.[0];
  if (persistError || !persisted) {
    throw new AppError("SIS_PERSIST_FAILED", "SIS und Version konnten nicht atomar gespeichert werden.", 500);
  }

  await createAuditLog(supabase, {
    organisationId,
    actorId: userId,
    entityType: "sis_assessment",
    entityId: persisted.assessment_id,
    action: input.changeSource === "manual_edit" ? "sis_saved" : "sis_extracted",
    metadata: {
      consultationId: input.consultationId,
      versionNumber: persisted.version_number,
      sourceTranscriptId: input.sourceTranscriptId ?? null,
      changeSource: input.changeSource
    }
  });

  return {
    id: persisted.assessment_id,
    consultationId: input.consultationId,
    currentVersion: persisted.version_number,
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
  "openQuestions": ["string"],
  "review": {
    "whatMatters": {"evidence": ["kurzer Originalausschnitt aus Transkript oder Live-Notizen"], "confidence": "high|medium|low|unknown", "needsReview": true},
    "evaluationFocus": {"evidence": [], "confidence": "unknown", "needsReview": true},
    "topics": {
      "cognition": {
        "personView": {"evidence": [], "confidence": "unknown", "needsReview": true},
        "observation": {"evidence": [], "confidence": "unknown", "needsReview": true},
        "resources": {"evidence": [], "confidence": "unknown", "needsReview": true},
        "supportNeeds": {"evidence": [], "confidence": "unknown", "needsReview": true}
      }
    },
    "risks": {
      "fall": {
        "relevant": {"evidence": [], "confidence": "unknown", "needsReview": true},
        "level": {"evidence": [], "confidence": "unknown", "needsReview": true},
        "notes": {"evidence": [], "confidence": "unknown", "needsReview": true}
      }
    }
  }
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
- Fuege fuer jedes gefuellte Feld im review-Block mindestens einen kurzen evidenznahen Originalausschnitt ein.
- Setze confidence nur auf "high", wenn der Inhalt direkt und eindeutig aus Transkript oder Live-Notizen stammt.
- Setze needsReview auf true bei niedriger/unklarer Evidenz, Interpretation, Risikoableitung oder wenn keine direkte Quelle vorhanden ist.
- Felder ohne Inhalt erhalten evidence: [], confidence: "unknown", needsReview: false.

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
