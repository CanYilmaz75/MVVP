import test from "node:test";
import assert from "node:assert/strict";

import { completeAudioUploadSchema, createConsultationSchema } from "../src/schemas/consultation";
import { exportNoteSchema, generateNoteSchema, soapNoteJsonSchema, soapNoteSchema } from "../src/schemas/note";
import { sisAssessmentJsonSchema, sisAssessmentSchema } from "../src/schemas/sis";

test("consultation API schemas reject invalid pilot-sensitive inputs", () => {
  assert.equal(createConsultationSchema.safeParse({ patientReference: "A", specialty: "x", spokenLanguage: "de" }).success, false);
  assert.equal(
    createConsultationSchema.safeParse({
      patientReference: "Bewohner-001",
      specialty: "Pflegeberatung",
      spokenLanguage: "de",
      consultationType: "Pflegeberatung"
    }).success,
    false
  );
  assert.equal(
    completeAudioUploadSchema.safeParse({
      storagePath: "org/consult/upload/audio.exe",
      mimeType: "application/octet-stream",
      fileSizeBytes: 100,
      source: "upload"
    }).success,
    false
  );
});

test("consultation schema separates care, medical and SIS consultation types", () => {
  assert.equal(
    createConsultationSchema.safeParse({
      patientReference: "Bewohner-001",
      specialty: "Pflegeberatung",
      spokenLanguage: "de",
      consultationType: "care_consultation",
      careProtocols: ["pain", "fall"]
    }).success,
    true
  );
  assert.equal(
    createConsultationSchema.safeParse({
      patientReference: "Patient-001",
      specialty: "Praxis / Medizin",
      spokenLanguage: "de",
      consultationType: "medical_consultation",
      careProtocols: ["unknown_protocol"]
    }).success,
    false
  );
  assert.equal(
    createConsultationSchema.safeParse({
      patientReference: "SIS-001",
      specialty: "Pflege / SIS",
      spokenLanguage: "de",
      consultationType: "sis"
    }).success,
    true
  );
});

test("idempotent AI and export contracts enforce bounded keys", () => {
  assert.equal(generateNoteSchema.safeParse({ idempotencyKey: "short" }).success, false);
  assert.equal(
    exportNoteSchema.safeParse({
      noteId: "00000000-0000-0000-0000-000000000000",
      exportType: "pdf",
      idempotencyKey: "note-version-pdf"
    }).success,
    true
  );
});

test("SOAP note schema accepts sparse but review-required draft notes", () => {
  const parsed = soapNoteSchema.parse({
    noteType: "SOAP",
    language: "de",
    sections: {
      subjective: { chiefComplaint: "", historyOfPresentIllness: "", reportedSymptoms: [] },
      objective: { examFindings: [], observations: [], vitals: [] },
      assessment: { clinicalSummary: "", possibleDiagnoses: [] },
      plan: { medications: [], followUp: "", referrals: [], testsOrdered: [], instructions: [] }
    },
    openQuestions: [],
    riskFlags: [],
    requiresReview: true
  });

  assert.equal(parsed.requiresReview, true);
  assert.deepEqual(soapNoteJsonSchema.properties.requiresReview.enum, [true]);
});

test("SIS schema requires all six topics and all pilot risk keys", () => {
  const assessment = sisAssessmentSchema.parse({
    patientReference: "Bewohner-001",
    whatMatters: "Moechte morgens selbst entscheiden.",
    topics: {
      cognition: { personView: "", observation: "", resources: "", supportNeeds: "" },
      mobility: { personView: "", observation: "", resources: "", supportNeeds: "" },
      medical: { personView: "", observation: "", resources: "", supportNeeds: "" },
      selfCare: { personView: "", observation: "", resources: "", supportNeeds: "" },
      social: { personView: "", observation: "", resources: "", supportNeeds: "" },
      housing: { personView: "", observation: "", resources: "", supportNeeds: "" }
    },
    risks: {
      fall: { relevant: false, level: "none", notes: "" },
      pressureUlcer: { relevant: false, level: "none", notes: "" },
      malnutrition: { relevant: false, level: "none", notes: "" },
      incontinence: { relevant: false, level: "none", notes: "" },
      pain: { relevant: false, level: "none", notes: "" }
    },
    evaluationFocus: "",
    openQuestions: [],
    review: {
      whatMatters: { evidence: ["Bewohner sagt, er möchte selbst entscheiden."], confidence: "high", needsReview: false },
      evaluationFocus: { evidence: [], confidence: "unknown", needsReview: false },
      topics: {
        cognition: {
          personView: { evidence: [], confidence: "unknown", needsReview: false },
          observation: { evidence: [], confidence: "unknown", needsReview: false },
          resources: { evidence: [], confidence: "unknown", needsReview: false },
          supportNeeds: { evidence: [], confidence: "unknown", needsReview: false }
        },
        mobility: {
          personView: { evidence: [], confidence: "unknown", needsReview: false },
          observation: { evidence: [], confidence: "unknown", needsReview: false },
          resources: { evidence: [], confidence: "unknown", needsReview: false },
          supportNeeds: { evidence: [], confidence: "unknown", needsReview: false }
        },
        medical: {
          personView: { evidence: [], confidence: "unknown", needsReview: false },
          observation: { evidence: [], confidence: "unknown", needsReview: false },
          resources: { evidence: [], confidence: "unknown", needsReview: false },
          supportNeeds: { evidence: [], confidence: "unknown", needsReview: false }
        },
        selfCare: {
          personView: { evidence: [], confidence: "unknown", needsReview: false },
          observation: { evidence: [], confidence: "unknown", needsReview: false },
          resources: { evidence: [], confidence: "unknown", needsReview: false },
          supportNeeds: { evidence: [], confidence: "unknown", needsReview: false }
        },
        social: {
          personView: { evidence: [], confidence: "unknown", needsReview: false },
          observation: { evidence: [], confidence: "unknown", needsReview: false },
          resources: { evidence: [], confidence: "unknown", needsReview: false },
          supportNeeds: { evidence: [], confidence: "unknown", needsReview: false }
        },
        housing: {
          personView: { evidence: [], confidence: "unknown", needsReview: false },
          observation: { evidence: [], confidence: "unknown", needsReview: false },
          resources: { evidence: [], confidence: "unknown", needsReview: false },
          supportNeeds: { evidence: [], confidence: "unknown", needsReview: false }
        }
      },
      risks: {
        fall: {
          relevant: { evidence: [], confidence: "unknown", needsReview: false },
          level: { evidence: [], confidence: "unknown", needsReview: false },
          notes: { evidence: [], confidence: "unknown", needsReview: false }
        },
        pressureUlcer: {
          relevant: { evidence: [], confidence: "unknown", needsReview: false },
          level: { evidence: [], confidence: "unknown", needsReview: false },
          notes: { evidence: [], confidence: "unknown", needsReview: false }
        },
        malnutrition: {
          relevant: { evidence: [], confidence: "unknown", needsReview: false },
          level: { evidence: [], confidence: "unknown", needsReview: false },
          notes: { evidence: [], confidence: "unknown", needsReview: false }
        },
        incontinence: {
          relevant: { evidence: [], confidence: "unknown", needsReview: false },
          level: { evidence: [], confidence: "unknown", needsReview: false },
          notes: { evidence: [], confidence: "unknown", needsReview: false }
        },
        pain: {
          relevant: { evidence: [], confidence: "unknown", needsReview: false },
          level: { evidence: [], confidence: "unknown", needsReview: false },
          notes: { evidence: [], confidence: "unknown", needsReview: false }
        }
      }
    }
  });

  assert.equal(Object.keys(assessment.topics).length, 6);
  assert.equal(assessment.review?.whatMatters.confidence, "high");
  assert.deepEqual(sisAssessmentJsonSchema.properties.risks.required, [
    "fall",
    "pressureUlcer",
    "malnutrition",
    "incontinence",
    "pain"
  ]);
});
