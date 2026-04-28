# 07_QA_UAT_CHECKLIST.md

## Purpose

Use this checklist before considering the MVP pilot-ready.

---

## Authentication

- [ ] user can sign in with valid credentials
- [ ] invalid credentials show safe error
- [ ] signed-out user cannot access protected routes
- [ ] user session persists correctly after refresh
- [ ] sign out works cleanly

---

## Tenant Isolation

- [ ] user only sees own organisation consultations
- [ ] cross-org direct URL access is blocked
- [ ] exports are org-scoped
- [ ] templates are org-scoped
- [ ] storage objects cannot be accessed without signed URL

---

## Consultation Flow

- [ ] clinician can create consultation
- [ ] consultation appears in lists
- [ ] consultation status updates correctly
- [ ] consultation workspace loads full aggregate state

---

## Audio

- [ ] browser recording starts and stops
- [ ] audio upload persists record
- [ ] unsupported file type is rejected clearly
- [ ] oversized file is rejected clearly
- [ ] stored audio is not public

---

## Transcription

- [ ] transcription can be triggered
- [ ] transcript persists correctly
- [ ] transcript state shows loading and ready transitions
- [ ] failed transcription shows retry option
- [ ] empty transcript does not falsely succeed

---

## Note Generation

- [ ] note generation can be triggered after transcript exists
- [ ] generated note validates against schema
- [ ] draft badge is visible before approval
- [ ] note rendering matches structured JSON
- [ ] invalid provider output does not corrupt DB
- [ ] regeneration works safely

---

## Manual Editing

- [ ] clinician can edit note sections
- [ ] save behavior is stable
- [ ] versioning increments
- [ ] rendered note updates correctly

---

## Voice Edit

- [ ] user can record voice instruction
- [ ] instruction preview is shown before apply
- [ ] targeted edit updates note
- [ ] failed edit preserves previous version
- [ ] edit action is audited

---

## Validation Warnings

- [ ] warnings display when relevant
- [ ] warnings map to correct sections
- [ ] no fake warning appears on clean cases
- [ ] dismiss behavior is non-destructive

---

## Approval

- [ ] approval requires explicit action
- [ ] approved status is visible
- [ ] approval timestamp persists
- [ ] approval is audited
- [ ] exports use approved content

---

## Export

- [ ] copy export works
- [ ] PDF export works
- [ ] exported PDF contains correct approved content
- [ ] PDF is stored privately if persisted
- [ ] signed URL download works and expires correctly
- [ ] export action is audited

---

## Security

- [ ] RLS enforced on all protected tables
- [ ] service-role key never used in client
- [ ] no sensitive data in analytics payloads
- [ ] no sensitive raw text in production logs
- [ ] rate limits block abusive usage safely

---

## Observability

- [ ] core failures appear in Sentry
- [ ] structured logs include request IDs
- [ ] audit log entries created for key actions

---

## UX

- [ ] dashboard has clear empty state
- [ ] workspace has loading states
- [ ] error states have retry path
- [ ] disabled buttons reflect true state
- [ ] workflow is understandable without training

---

## Production Build

- [ ] app builds successfully
- [ ] no TypeScript blocking errors
- [ ] environment variables documented
- [ ] migrations reproducible
- [ ] README explains setup
