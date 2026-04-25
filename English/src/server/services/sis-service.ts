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
    "You convert German nursing SIS conversations into structured JSON. Use only facts grounded in the transcript or live notes. Do not invent diagnoses, medication, risks, resources, or support needs. Keep output concise and in German. Return valid JSON only.";

  const userPrompt = `
Task: Extract a Strukturierte Informationssammlung (SIS) from the conversation.

Required JSON shape:
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

Rules:
- Preserve the person's perspective in whatMatters and personView.
- Put professional nursing interpretation in observation.
- Use resources for abilities, routines, helpers, and functioning aids.
- Use supportNeeds for concrete support or planning implications.
- Mark risks only when the conversation supports them.
- Risk level must be one of "none", "monitor", "action".
- Put missing but important SIS questions into openQuestions.
- If a section has no evidence, use an empty string.

Patient reference: ${input.patientReference ?? ""}

Live notes during conversation:
${input.liveNotes ?? ""}

Transcript:
${input.transcriptText}
`;

  const raw = await callSisModel(systemPrompt, userPrompt);

  try {
    return mergeWithDefaults(JSON.parse(raw) as Partial<SisAssessment>, input.patientReference);
  } catch {
    throw new AppError("SIS_EXTRACTION_FAILED", "SIS could not be extracted from the transcript.", 500);
  }
}
