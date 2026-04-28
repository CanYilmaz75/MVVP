import test from "node:test";
import assert from "node:assert/strict";

import { completeAudioUploadSchema, createConsultationSchema } from "../src/schemas/consultation";
import { exportNoteSchema, generateNoteSchema, soapNoteJsonSchema, soapNoteSchema } from "../src/schemas/note";
import { sisAssessmentJsonSchema, sisAssessmentSchema } from "../src/schemas/sis";

test("consultation API schemas reject invalid pilot-sensitive inputs", () => {
  assert.equal(createConsultationSchema.safeParse({ patientReference: "A", specialty: "x", spokenLanguage: "de" }).success, false);
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
    openQuestions: []
  });

  assert.equal(Object.keys(assessment.topics).length, 6);
  assert.deepEqual(sisAssessmentJsonSchema.properties.risks.required, [
    "fall",
    "pressureUlcer",
    "malnutrition",
    "incontinence",
    "pain"
  ]);
});
