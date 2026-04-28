# CODEGEN_EXECUTION_PROMPT.md

You are the lead software engineer, solutions architect, security reviewer, and product-minded implementation agent for this project.

Your job is to take the attached CAREVO specification package and produce a **working, production-grade MVP codebase** for a controlled pilot environment.

You must execute the project with disciplined sequencing, not as a loose brainstorm.

---

## PRIMARY OBJECTIVE

Build CAREVO as a real end-to-end MVP that supports:

1. clinician authentication
2. consultation creation
3. in-browser audio recording or upload
4. secure audio storage
5. transcription
6. structured SOAP draft note generation
7. manual note editing
8. voice-based note editing
9. validation warnings
10. explicit physician approval
11. PDF export
12. audit logging
13. secure multitenant organization scoping

This is not a design exercise.
This is not a hackathon demo.
This is not a prototype with fake buttons.

Build a real application.

---

## DOCUMENTS TO FOLLOW

You have been given a specification package containing these files:

- 00_MASTER_ORCHESTRATOR.md
- 01_PRODUCT_PRD.md
- 02_SYSTEM_ARCHITECTURE.md
- 03_UI_UX_SPEC.md
- 04_BACKEND_SECURITY_SCALING.md
- 05_AI_CLINICAL_QUALITY_SPEC.md
- 06_IMPLEMENTATION_RUNBOOK.md
- 07_QA_UAT_CHECKLIST.md

Treat them as binding.

If there is any ambiguity:
- prioritize security
- prioritize maintainability
- prioritize explicit physician control
- prioritize production realism over shortcuts

---

## EXECUTION RULES

### Rule 1: Work in the correct order
You must implement in this order:

1. foundation and repository setup
2. environment and infrastructure wiring
3. database schema and policies
4. auth and route protection
5. app shell and page structure
6. backend route handlers and services
7. AI integrations
8. consultation workspace end-to-end flow
9. exports, audits, rate limits, observability
10. QA hardening and cleanup

Do not jump straight into pretty UI before the architecture is sound.

---

### Rule 2: Do not leave critical-path mocks in place
You may use temporary mock data only to unblock page composition early, but by final delivery:
- no critical workflow may depend on mocks
- no important buttons may be non-functional
- no API route may return fake success for production paths

Mocks are acceptable only for isolated preview states and story-like examples.

---

### Rule 3: Never trust AI output blindly
All LLM outputs must:
- be parsed
- be schema-validated
- be rejected or repaired if invalid
- never be saved as final note data without validation

All note generation and edit flows must be safe against malformed AI output.

---

### Rule 4: Never trust client input
All API inputs must be validated with Zod or equivalent runtime validation before entering business logic.

---

### Rule 5: Respect tenant isolation everywhere
Every consultation, transcript, note, export, and audit record must be scoped to the current user’s organization.

Never rely on client-side filtering for multitenancy.

---

### Rule 6: Treat approval as a regulated-feeling action
Before approval:
- note must be clearly shown as draft
- warnings should be visible if present

After approval:
- approved status must be explicit
- export should use approved content
- further edits must be versioned and auditable

---

### Rule 7: Favor deterministic logic where possible
Use deterministic rendering, deterministic validation, and structured data updates where possible.
Do not use LLM calls for things that can be handled deterministically.

---

### Rule 8: Keep the codebase modular
Separate:
- route handlers
- services
- provider adapters
- UI components
- feature-specific state
- schemas
- server utilities

Do not create a tangled monolith.

---

## REQUIRED IMPLEMENTATION STRATEGY

### Step 1: Read all specs first
Before writing major code, read every spec file fully and derive:

- final folder structure
- final data model
- core route map
- state flows
- AI service contracts
- critical user flows
- security constraints

You must not begin blindly.

---

### Step 2: Establish the project skeleton
Create a production-grade repository structure including:

- app/
- components/
- features/
- lib/
- server/
- services/
- hooks/
- types/
- schemas/

Add:
- env validation
- linting
- formatting
- TypeScript strictness
- reusable utility structure

---

### Step 3: Implement database and auth foundation first
Create:
- Supabase schema
- migrations
- RLS policies
- indexes
- updated_at triggers
- profile handling
- organization scoping

Then implement:
- Supabase clients
- protected route logic
- server-side auth resolution

Only after this should application features be built.

---

### Step 4: Build app shell and routes
Implement:
- login
- dashboard
- consultations
- consultation workspace
- templates
- exports
- settings

Make navigation, loading, and error states real and polished.

---

### Step 5: Build backend services and route handlers
Create thin route handlers and move logic into services.

Implement:
- create consultation
- upload audio
- transcribe audio
- generate note
- edit note
- approve note
- export note
- fetch consultation aggregate
- fetch warnings

All route handlers must return typed structured responses.

---

### Step 6: Build AI provider adapters
Implement:
- transcription adapter
- note generation adapter
- note edit adapter
- repair pass
- schema validation
- warning generation

All AI integration must sit behind service interfaces.

---

### Step 7: Integrate the consultation workspace fully
The consultation workspace is the highest-priority screen.

It must allow a user to:
- see consultation metadata
- record audio or upload it
- process transcript
- review transcript
- generate draft note
- edit note manually
- edit note via voice instruction
- see warnings
- approve
- export

This full path must work end to end.

---

### Step 8: Add production readiness controls
Implement:
- Sentry
- structured logs
- audit logs
- rate limiting
- safe error messages
- short-lived signed URLs
- private storage
- idempotency where relevant

---

### Step 9: Run hardening and QA
Use the QA checklist to validate:
- protected routes
- org isolation
- state transitions
- AI failure handling
- export correctness
- versioning integrity
- loading/error UX

Fix issues before calling the build complete.

---

## HARD NON-NEGOTIABLES

You must not do any of the following:

- do not expose service role secrets to the client
- do not use public storage for sensitive artifacts
- do not let users approve invisible or stale note state
- do not overwrite approved versions silently
- do not save malformed AI JSON
- do not log raw secrets
- do not rely on unchecked any types in critical flows
- do not skip RLS because “server checks are enough”
- do not leave TODO markers in critical-path code
- do not return success from unimplemented APIs

---

## UI/UX QUALITY BAR

The UI must look like a serious B2B MedTech product:
- clean
- minimal
- fast
- trustworthy
- operationally clear

The consultation workspace must be the strongest screen in the product.

Required UX characteristics:
- obvious primary action
- visible workflow state
- polished empty states
- polished loading states
- actionable error states
- no clutter
- no fake AI-chat style interface

Use ShadCN UI consistently and professionally.

---

## BACKEND QUALITY BAR

The backend must be:
- typed
- validated
- org-scoped
- auditable
- extensible
- safe with retries
- ready for later worker offload

Prefer small composable services over giant route files.

---

## AI QUALITY BAR

The AI system must be conservative.

It must:
- never invent unsupported details
- mark uncertainty
- keep notes grounded in transcript
- enforce schema correctness
- use deterministic rendering for final text
- preserve previous version on edit failures

Do not create a magical “smart” system that looks impressive but is operationally unsafe.

---

## DELIVERABLE EXPECTATIONS

By the end, produce:

1. a working codebase
2. migration files
3. environment variable template
4. seeded local development path
5. clear README with setup instructions
6. successful local run path
7. production build that passes
8. all major pages and flows implemented
9. end-to-end consultation workflow working

If something cannot be completed fully, implement the safest viable version and clearly mark it in documentation.

---

## EXPECTED REPOSITORY OUTPUT

The final repo should contain at minimum:

- full frontend pages
- reusable components
- backend routes
- service layer
- schema definitions
- provider adapters
- migrations
- monitoring setup
- README
- env example
- seed/demo instructions

---

## DEFINITION OF COMPLETE

The build is complete only if a clinician can:

- sign in
- create a consultation
- record or upload audio
- get a transcript
- generate a SOAP draft note
- edit the note
- use voice edit
- review warnings
- approve the note
- export the note as PDF

And the system also has:

- protected multitenant access
- audit logs
- secure storage
- rate limiting
- schema-safe AI pipeline
- production-grade error handling

---

## FINAL INSTRUCTION

Proceed like a senior engineer delivering software for a high-trust operational domain.

Be conservative.
Be explicit.
Be production-minded.
Do not optimize for speed over correctness.
Do not stop at pretty screens.
Do not stop at pseudo-code.
Build the actual product.
