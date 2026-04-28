# README_AGENT_HANDOFF.md

## Purpose

This file is the **entry point for any AI coding agent** (Claude Code, Codex, Cursor).

It ensures:
- correct execution order
- no architectural shortcuts
- no broken MVP builds
- alignment with production-level expectations

---

## CRITICAL INSTRUCTION

Do NOT start coding immediately.

You must first:
1. Read ALL provided files
2. Build a mental model of the system
3. Define structure BEFORE implementation

---

## FILE READING ORDER (MANDATORY)

Read in this exact order:

1. 00_MASTER_ORCHESTRATOR.md  
2. 01_PRODUCT_PRD.md  
3. 02_SYSTEM_ARCHITECTURE.md  
4. 04_BACKEND_SECURITY_SCALING.md  
5. 05_AI_CLINICAL_QUALITY_SPEC.md  
6. 03_UI_UX_SPEC.md  
7. ENV_AND_SECRETS_SETUP.md  
8. SUPABASE_SQL_MIGRATIONS.sql  
9. CODEGEN_EXECUTION_PROMPT.md  
10. 06_IMPLEMENTATION_RUNBOOK.md  
11. 07_QA_UAT_CHECKLIST.md  

Do not skip any file.

---

## IMPLEMENTATION ORDER (MANDATORY)

You must build in this sequence:

### Phase 1 – Foundation
- Project setup (Next.js, TypeScript, Tailwind, ShadCN)
- Folder structure
- Env validation
- Dependency setup

---

### Phase 2 – Database & Auth (CRITICAL BASE)
- Run Supabase SQL migrations
- Verify schema + indexes
- Implement RLS-aware queries
- Setup auth flow
- Implement profile + organisation resolution

Do NOT continue if this is broken.

---

### Phase 3 – Backend Core
- Build API routes
- Build service layer
- Add validation (Zod)
- Add error handling

---

### Phase 4 – UI Shell
- Layout (Sidebar + Topbar)
- Navigation
- Pages scaffold

---

### Phase 5 – Consultation Flow (CORE FEATURE)
Implement FULL flow:

1. Create consultation  
2. Upload/record audio  
3. Transcribe  
4. Generate note  
5. Edit note (manual + voice)  
6. Show warnings  
7. Approve  
8. Export  

This must work end-to-end.

---

### Phase 6 – AI Integration
- Transcription
- Note generation
- Edit pipeline
- Validation + repair pass

---

### Phase 7 – Production Controls
- Rate limiting
- Audit logs
- Signed URLs
- Monitoring (Sentry)

---

### Phase 8 – QA Hardening
- Use QA checklist
- Fix all broken states
- Remove mocks
- Validate all flows

---

## NON-NEGOTIABLE RULES

You MUST:

- use real API logic (no fake success responses)
- validate all inputs
- validate all AI outputs
- enforce organisation isolation
- use private storage
- use signed URLs
- version notes
- log audit events

---

## DO NOT DO THIS

- do not skip RLS
- do not hardcode secrets
- do not expose service keys
- do not use uncontrolled AI output
- do not build UI without backend
- do not leave TODOs in core logic
- do not mock critical flows
- do not overwrite approved notes

---

## DEFINITION OF MVP COMPLETE

The system is only complete if:

A clinician can:
- log in
- create consultation
- upload or record audio
- receive transcript
- generate SOAP note
- edit note
- use voice edit
- approve note
- export PDF

AND

System has:
- multitenancy
- audit logs
- secure storage
- validated AI pipeline
- error handling

---

## EXPECTED OUTPUT

You must deliver:

- full working codebase
- migrations
- env example
- README
- working local setup
- functioning UI
- functioning backend
- working AI pipeline

---

## FINAL INSTRUCTION

Act like a senior engineer building a MedTech product.

Be:
- precise
- structured
- conservative
- production-oriented

Do NOT:
- rush
- guess
- simplify critical logic

Build it properly.
