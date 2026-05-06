# 05_AI_CLINICAL_QUALITY_SPEC.md

## Current AI Scope

Last updated: 2026-05-06.

The active app includes two AI-assisted documentation paths:
- SOAP-style consultation note drafting for practice and care consultation workflows.
- SIS extraction from transcript plus live notes for care-facility workflows.

Both paths must stay review-first: AI structures documentation, but professional users remain responsible for clinical or nursing judgement.

## Objective

Implement the AI layer so that it is materially safer, more consistent, and more clinically usable than a naive “transcript to summary” pipeline.

This document governs:
- transcription normalization
- note generation
- note editing
- warning generation
- schema enforcement
- prompt design
- fallback behavior

Important:
This system produces **draft clinical documentation** for clinician review.
It must never present itself as autonomous clinical judgment.

---

## AI Design Principles

1. never hallucinate missing facts
2. prefer omission over invention
3. represent uncertainty explicitly
4. preserve traceability to transcript evidence
5. separate deterministic validation from generative drafting
6. ensure final outputs fit a strict schema
7. make edits targeted and minimal

---

## Data Flow

1. audio asset input
2. transcription provider result
3. transcript normalization
4. structured note generation
5. schema validation
6. deterministic warning checks
7. note rendering
8. user edits
9. approval

---

## Supported Note Structure

Primary note type for MVP:
SOAP

Care workflow extension:
SIS extraction for the German Strukturmodell, persisted separately from SOAP notes.

### Canonical JSON schema
```json
{
  "noteType": "SOAP",
  "language": "de",
  "sections": {
    "subjective": {
      "chiefComplaint": "",
      "historyOfPresentIllness": "",
      "reportedSymptoms": []
    },
    "objective": {
      "examFindings": [],
      "observations": [],
      "vitals": []
    },
    "assessment": {
      "clinicalSummary": "",
      "possibleDiagnoses": []
    },
    "plan": {
      "medications": [],
      "followUp": "",
      "referrals": [],
      "testsOrdered": [],
      "instructions": []
    }
  },
  "openQuestions": [],
  "riskFlags": [],
  "requiresReview": true
}
```

Use Zod or equivalent runtime validation against this schema.

---

## Transcription Layer

### Provider adapter requirements
Abstract provider behind interface:
- transcribeAudio(file)
- normalizeResult(providerResponse)

### Normalized transcript model
```ts
type NormalizedTranscript = {
  rawText: string;
  detectedLanguage?: string;
  segments: Array<{
    speakerLabel?: string;
    startMs?: number;
    endMs?: number;
    text: string;
  }>;
  confidence?: number;
}
```

### Transcription safety rules
- reject empty transcript as failure
- reject transcripts below minimum text threshold unless explicitly confirmed by UI
- store provider metadata separately if useful
- if diarization unavailable, still support plain transcript flow

---

## Note Generation Strategy

### Input package
The note generation service should construct a clean prompt input with:
- specialty
- spoken language
- target note language
- note template definition
- normalized transcript text
- optional speaker segments

Do not pass unrelated UI metadata.

### Required output behavior
The model must:
- produce only facts grounded in transcript
- avoid over-interpretation
- keep note concise and clinically readable
- put ambiguity into `openQuestions`
- never fabricate vitals, meds, diagnoses, or plan items not grounded in transcript

---

## Core Prompt Pattern

### System prompt
You are a clinical documentation assistant that creates physician-review draft notes.
You must only use information grounded in the provided transcript.
If information is uncertain, incomplete, or not explicitly supported, do not invent it.
Represent uncertainty under `openQuestions` or cautious wording.
Return valid JSON only.

### Developer prompt template
Task:
Convert the following consultation transcript into a structured SOAP draft note.

Rules:
- Use only transcript-supported facts.
- Do not fabricate diagnoses, medications, vitals, measurements, or follow-up details.
- Keep wording concise and clinically neutral.
- If a section has insufficient evidence, leave it sparse and add items to `openQuestions`.
- `riskFlags` should be used only when transcript clearly suggests a risk or missing critical detail.
- Set `requiresReview` to true.
- Output valid JSON matching the schema exactly.

Context:
- Specialty: {{specialty}}
- Source language: {{spokenLanguage}}
- Target output language: {{targetLanguage}}

Transcript:
{{transcript}}

---

## Schema Validation and Repair

### First pass
- parse AI response as JSON
- validate against Zod schema

### If invalid
Run one controlled repair pass with a repair prompt:
“Reformat the following content into valid JSON matching this schema exactly. Do not add new clinical facts.”

If still invalid:
- mark generation failed
- do not store broken note
- return recoverable error to UI

Maximum repair passes: 1

---

## Note Rendering

Create deterministic rendering from structured JSON.
Do not use the model to “pretty print” the final visible note if avoidable.

Render pattern:
- Subjective
- Objective
- Assessment
- Plan

This ensures UI consistency and export consistency.

---

## Targeted Voice Edit Strategy

Voice edit should not regenerate the whole note blindly.

### Flow
1. transcribe the edit instruction
2. pass current structured note + instruction to edit model
3. request minimal targeted update
4. validate output
5. diff vs previous version
6. persist new version

### Edit prompt
You are updating an existing draft clinical note.

Task:
Apply the clinician's instruction to the current note.

Rules:
- Only change content explicitly requested.
- Preserve everything else unless the change logically requires a dependent edit.
- Do not invent new facts beyond the instruction and existing note.
- Keep the same schema and output valid JSON only.

Current note JSON:
{{currentNoteJson}}

Instruction:
{{instructionText}}

### Repair
Same schema repair rule as note generation.

---

## Manual Edit Handling

Manual text edits in UI should update structured note through a deterministic path where possible.

Preferred:
- edit structured section fields directly
- re-render note text deterministically
- persist version without LLM call

Avoid using LLM for basic field edits unless converting freeform pasted content.

---

## Deterministic Validation Layer

Run deterministic checks after generation and after edit.

### Warning rules for MVP
1. `plan.followUp` empty and transcript suggests follow-up discussion
2. medication appears in note but not transcript text
3. diagnosis appears overly certain while transcript language is uncertain
4. subjective section empty while transcript length is above threshold
5. assessment empty while note otherwise populated
6. plan entirely empty
7. critical ambiguity terms present:
   - “unclear”
   - “to be confirmed”
   - “possible”
   - “rule out”
   and no open question recorded

### Output shape
```json
{
  "warnings": [
    {
      "code": "EMPTY_PLAN",
      "severity": "medium",
      "message": "Plan section is empty.",
      "section": "plan"
    }
  ]
}
```

Warnings inform UX but do not necessarily block approval in MVP.

---

## Clinical Quality Safeguards

### Must never invent
- vital signs
- lab values
- medication dosages
- confirmed diagnoses
- treatment decisions not explicitly discussed
- allergies not explicitly discussed

### Use careful phrasing for uncertain content
Examples:
- “Possible meniscal irritation discussed”
- “Further evaluation may be required”
- “Patient reports...”
- “Findings described in conversation suggest...”

### Avoid
- hard claims without support
- over-complete note when transcript is sparse
- filling every section artificially

---

## Language Handling

### MVP strategy
- preserve original transcript language
- allow note output in configured target language
- if transcript is multilingual, still generate note in target language
- do not translate patient quote nuances as direct quotes unless needed

### Rule
If translation uncertainty exists, prefer factual paraphrase over stylized prose.

---

## Provider Abstraction Interfaces

```ts
interface TranscriptionProvider {
  transcribe(input: { filePath: string; mimeType: string }): Promise<NormalizedTranscript>;
}

interface NoteGenerationProvider {
  generateDraft(input: DraftGenerationInput): Promise<SoapNote>;
  applyEdit(input: NoteEditInput): Promise<SoapNote>;
}
```

Keep providers swappable.

---

## Suggested Evaluation Harness

Create internal seed test cases:
- clear simple consultation
- sparse consultation
- noisy transcript
- multilingual consultation
- follow-up visit
- medication-heavy case

For each case, evaluate:
- schema validity
- hallucination absence
- section completeness
- warning relevance
- edit correctness

---

## Failure Handling

### Transcription failure
- store failed job state
- allow retry
- keep consultation intact

### Note generation failure
- do not create broken note record
- allow regenerate
- surface safe UI error

### Edit failure
- preserve previous approved/draft version
- show non-destructive error
- allow retry

---

## Observability for AI

Track provider metrics:
- provider name
- model name
- latency ms
- token usage where available
- success/failure
- repair-pass usage
- warning counts

Do not send raw transcript/note text to analytics systems.

---

## Approval Safety

Before approval:
- show note as draft
- show warnings
- require clinician action

After approval:
- mark approved version
- exports must use approved content
- post-approval edits should create a new version and be auditable

---

## Final AI Standard

A correct AI implementation for this MVP is:
- schema-safe
- reviewable
- traceable
- conservative
- minimal-hallucination
- operationally robust

It is not:
- an autonomous medical decision engine
- a substitute for clinician judgment
- a substitute for professional nursing assessment in SIS workflows
