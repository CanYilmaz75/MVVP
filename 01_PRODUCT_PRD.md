# 01_PRODUCT_PRD.md

## Product Name
CAREVO AI

## Product Category
Ambient clinical documentation platform for physician workflows.

## Problem Statement

Clinicians lose substantial time to manual documentation after consultations.
This causes:
- reduced patient-facing time
- documentation backlog
- inconsistent note quality
- cognitive overload
- delayed follow-up documents

The product goal is to convert conversations into structured draft medical notes quickly, safely, and reviewably.

---

## Primary User

### Primary persona
Office-based physician or outpatient clinician.

Attributes:
- time-constrained
- documentation-heavy workflow
- needs fast, editable draft
- will not tolerate hidden AI behavior
- values clarity, speed, and trust

### Secondary persona
Medical practice admin or clinical operations lead who evaluates workflow efficiency and adoption.

---

## Primary Job To Be Done

“After a consultation, help me get to a clinically usable draft note quickly, without losing control over what gets documented.”

---

## MVP Goal

Enable a clinician to go from consultation audio to a reviewable SOAP draft note in under 60 seconds for common cases, then approve and export it.

---

## Core User Stories

### Authentication
- As a clinician, I want to sign in securely so I can access my organisation’s consultations.

### Start consultation
- As a clinician, I want to create a consultation quickly with minimal required fields.

### Record consultation
- As a clinician, I want to record audio in-browser so I do not need extra tools.

### View transcript
- As a clinician, I want to read the transcript and understand who said what.

### Generate note
- As a clinician, I want a structured draft note generated from the transcript.

### Edit note
- As a clinician, I want to edit the draft directly before approving it.

### Voice edit
- As a clinician, I want to make changes by speaking commands.

### Validate note
- As a clinician, I want the system to point out obvious gaps or contradictions.

### Approve note
- As a clinician, I want approval to be explicit so the final note is clearly physician-reviewed.

### Export note
- As a clinician, I want to copy or download the note for downstream use.

---

## Core Workflow

1. clinician signs in
2. clinician clicks “Start Consultation”
3. clinician enters minimal metadata:
   - patient reference
   - specialty
   - consultation language
   - template
4. clinician records or uploads audio
5. system transcribes audio
6. system generates draft structured note
7. clinician reviews transcript and draft note
8. clinician edits by text or voice
9. system shows warnings if relevant
10. clinician approves
11. clinician exports

---

## Functional Requirements

### FR-1 Authentication
- email/password auth supported for MVP
- protected routes enforced
- organization scoping required

### FR-2 Consultation creation
- create consultation record with status lifecycle
- store metadata and timestamps

### FR-3 Audio capture and upload
- browser recording supported
- upload fallback supported
- secure storage required

### FR-4 Transcription
- transcription job processes uploaded audio
- transcript stored with source metadata
- basic diarization support optional but planned

### FR-5 Note generation
- transcript converted into structured SOAP note
- result stored as structured JSON and rendered text
- note marked as draft

### FR-6 Manual editing
- note editable by clinician
- version increment on each save

### FR-7 Voice edit
- spoken instruction transcribed
- system applies targeted edit to existing structured note
- diff or update confirmation shown

### FR-8 Validation
- note checked for missing or suspicious sections
- warnings displayed without blocking approval unless severe rules are later enabled

### FR-9 Approval
- explicit physician approval action required
- approval stores approver and timestamp

### FR-10 Export
- copy-to-clipboard supported
- PDF export supported
- export event logged

### FR-11 Audit logging
- consultation start
- audio upload
- transcription complete/fail
- note generated
- note edited
- note approved
- note exported
- key failures

---

## Non-Functional Requirements

### Performance
- dashboard initial load under 2.5 seconds on reasonable connection
- transcript response handled asynchronously with clear UI state
- note generation user-perceived latency minimized with progressive state messaging

### Reliability
- idempotent APIs for repeated client retries where needed
- no silent failures
- no destructive operations without confirmation

### Security
- strict org isolation
- signed storage URLs
- secrets server-only
- RLS enabled
- logs must avoid raw secrets

### Observability
- error monitoring
- request correlation IDs
- structured logging
- feature-flag friendly

### Maintainability
- typed interfaces
- schema validation
- modular services
- no monolithic AI prompt code in route handlers

---

## Success Metrics

### Primary
- percentage of notes approved after only light editing
- average clinician time from transcript ready to approval
- consultation-to-export completion rate

### Secondary
- voice edit adoption rate
- transcript retry rate
- note regeneration rate
- severe warning frequency
- export frequency

---

## MVP Constraints

- clinician review is mandatory
- AI outputs are drafts, not final autonomous records
- no direct clinical recommendation engine
- no autonomous treatment plans beyond summarization of spoken content

---

## Risks

1. transcript quality in noisy environments
2. model hallucinations or unjustified specificity
3. clinician distrust if UI implies finality too soon
4. slow response times reducing adoption
5. poor org-level data isolation
6. storage or export leaks if signed access is mishandled

---

## Acceptance Criteria

The MVP passes product acceptance if:
- a real user can complete end-to-end workflow in one session
- the UI clearly distinguishes draft vs approved note
- core actions are fast and understandable
- failures surface with recovery paths
- data persists correctly
- exports match approved note content
