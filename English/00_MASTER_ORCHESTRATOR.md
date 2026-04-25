# CAREVO AI – MASTER DELIVERY ORCHESTRATOR

## Purpose

Build a **production-grade MVP** for **CAREVO**, an ambient clinical documentation platform for physicians.
The application must support this end-to-end flow:

1. authenticated clinician signs in
2. clinician starts a consultation
3. audio is recorded or uploaded
4. audio is transcribed
5. transcript is converted into a structured medical draft note
6. clinician reviews and edits the note
7. clinician approves the draft
8. note is exported as PDF and plain text

This document orchestrates execution across the full system. It is binding.

---

## Important Truths

Do **not** treat this as a demo-only build.
Do **not** leave mocked components in critical paths unless they are explicitly feature-flagged as development fallbacks.
Do **not** optimize for speed at the expense of architecture.

This package is designed for an MVP that can be used in controlled pilots.
It is **not** a claim of MDR certification or full medical-device compliance.

---

## Product Scope for This Build

### In scope
- clinician authentication
- consultation management
- audio recording in browser
- audio file upload and secure storage
- speech-to-text transcription
- structured note generation
- note editing via text
- note editing via voice instruction
- validation and warning surface
- approval workflow
- PDF export
- audit logging
- organisation-aware tenancy
- production-grade monitoring hooks
- rate limiting
- secure secret handling
- robust error handling

### Out of scope
- autonomous clinical decision-making
- direct diagnosis recommendation as final truth
- automatic medication ordering
- direct write-back into EHR/PVS/KIS
- full MDR / ISO 13485 / ISO 27001 implementation
- multi-hospital enterprise SSO beyond extensible foundation

---

## Required Technology Stack

### Frontend
- Next.js 14+ App Router
- TypeScript
- Tailwind CSS
- ShadCN UI
- Zustand
- React Hook Form
- Zod

### Backend
- Next.js route handlers and server actions where appropriate
- Supabase:
  - Postgres
  - Auth
  - Storage
  - Row-Level Security
- optional background processing abstraction through job table and worker-compatible design

### AI
- Speech-to-text:
  - OpenAI transcription API or Deepgram
- LLM:
  - OpenAI or Anthropic
- all outputs must be schema-validated

### Infra
- Vercel for app hosting
- Supabase EU region
- Sentry for application monitoring
- PostHog or equivalent for product analytics
- Upstash Redis or equivalent for rate limiting and idempotency support if needed

---

## Execution Order

### Phase 1 – Foundation
Read and execute:
- `01_PRODUCT_PRD.md`
- `02_SYSTEM_ARCHITECTURE.md`

Deliver:
- repo initialized
- environment strategy
- base application shell
- auth foundation
- database migrations
- shared types
- design tokens

### Phase 2 – Frontend UX
Read and execute:
- `03_UI_UX_SPEC.md`

Deliver:
- app shell
- all pages
- reusable components
- workflow states
- consultation workspace
- empty/loading/error states

### Phase 3 – Backend and Security
Read and execute:
- `04_BACKEND_SECURITY_SCALING.md`

Deliver:
- tables
- storage
- secure APIs
- rate limits
- audit trails
- RLS
- signed URL handling
- structured logging

### Phase 4 – AI Pipeline
Read and execute:
- `05_AI_CLINICAL_QUALITY_SPEC.md`

Deliver:
- transcription pipeline
- structured note generation
- edit pipeline
- validation engine
- fallback handling
- prompt library
- schema enforcement

### Phase 5 – Final Integration
Read and execute:
- `06_IMPLEMENTATION_RUNBOOK.md`
- `07_QA_UAT_CHECKLIST.md`

Deliver:
- end-to-end working system
- seeded demo data
- successful local run
- successful production build
- passing QA checklist

---

## Non-Negotiable Build Rules

1. All API input and output must be schema-validated with Zod.
2. Never trust AI output until validated against JSON schema.
3. All protected data access must be organization-scoped.
4. All sensitive operations must be audited.
5. Audio files must never be publicly accessible.
6. Approval must be explicit and physician-driven.
7. UI must always communicate “draft” before approval.
8. Errors must be recoverable wherever possible.
9. Feature flags must exist for experimental modules.
10. Keep code modular and production-readable.

---

## Required Deliverables

The build is complete only when all of the following are true:

- clinician can sign in and sign out
- clinician can create consultation
- clinician can record/upload audio
- audio is stored securely
- transcription returns usable text
- note generation creates structured SOAP output
- clinician can edit note text
- clinician can edit note by voice instruction
- warnings surface when note quality checks fail
- clinician can approve note
- clinician can export note as PDF
- audit logs are stored
- all protected routes are secured
- local development and production build both succeed

---

## Done Means

Done does **not** mean “screens render.”
Done means:
- end-to-end flow works
- error states are handled
- secrets are isolated
- data access is scoped
- important actions are logged
- core workflow is usable by pilot users

---

## Final Instruction to Agent

Implement the system with production-grade judgment.
When trade-offs arise:
- prefer correctness over cleverness
- prefer safety over automation
- prefer maintainability over shortcuts
