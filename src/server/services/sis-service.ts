import { AppError } from "@/lib/errors";
import {
  sisAssessmentSchema,
  type SisAssessment,
  type SisRiskKey,
  type SisTopicKey
} from "@/schemas/sis";
import { openai } from "@/server/providers/openai";

const topicKeys: SisTopicKey[] = ["cognition", "mobility", "medical", "selfCare", "social", "housing"];
const riskKeys: SisRiskKey[] = ["fall", "pressureUlcer", "malnutrition", "incontinence", "pain"];

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

export async function extractSisAssessment(input: {
  transcriptText: string;
  patientReference?: string;
  liveNotes?: string;
}) {
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

Patientenreferenz: ${input.patientReference ?? ""}

Live-Notizen waehrend des Gespraechs:
${input.liveNotes ?? ""}

Transkript:
${input.transcriptText}
`;

  const raw = await callSisModel(systemPrompt, userPrompt);

  try {
    return mergeWithDefaults(JSON.parse(raw) as Partial<SisAssessment>, input.patientReference);
  } catch {
    throw new AppError("SIS_EXTRACTION_FAILED", "SIS konnte nicht aus dem Transkript extrahiert werden.", 500);
  }
}
