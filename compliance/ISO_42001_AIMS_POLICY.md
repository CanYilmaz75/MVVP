# ISO/IEC 42001 AIMS Policy

Status: operational draft  
Applies to: CAREVO AI-assisted documentation MVP  
Policy owner: to be assigned  
Approval authority: management  
Last reviewed: 2026-04-28

## Purpose

CAREVO uses AI to support healthcare and care-documentation workflows. The AI system may transcribe audio, create structured draft notes, extract SIS assessment content, and apply guided voice edits.

The purpose of this AI Management System policy is to ensure that CAREVO's AI use remains controlled, human-reviewed, privacy-aware, auditable, and aligned with applicable customer, legal, and safety expectations.

## Scope

In scope:

- AI transcription of consultation audio.
- AI generation of clinical draft notes.
- AI-assisted SIS extraction.
- Voice instruction transcription and draft-note edits.
- AI-related provider integrations, prompts, schemas, feature flags, validations, logs, incidents, and changes.

Out of scope unless separately approved:

- Autonomous clinical diagnosis.
- Autonomous treatment recommendation.
- Direct write-back into EHR/PVS/KIS systems.
- Use of production health data for model training.
- MDR, ISO 13485, ISO 27001, or formal ISO/IEC 42001 certification claims.

## AI Principles

CAREVO shall operate AI systems according to these principles:

- Human accountability: AI output is a draft until reviewed and approved by a qualified user.
- Data minimization: AI calls receive only the information required for the specific task.
- Transparency: Users are shown that AI-generated content is a draft.
- Traceability: Sensitive actions are recorded through audit logs and version records.
- Security by design: Tenant isolation, private storage, RLS, and signed URLs are mandatory for sensitive artifacts.
- Reliability: AI output must pass schema validation and workflow checks before persistence or export.
- Controlled operation: AI capabilities can be disabled using feature flags and rate limits.
- Continual improvement: AI incidents, validation warnings, and audit findings feed into management review.

## Current Implemented Controls

| Control area | Current evidence |
| --- | --- |
| Tenant isolation | `supabase/migrations/0001_initial.sql`, `supabase/migrations/0005_pilot_hardening.sql` |
| Role-aware RLS | `supabase/migrations/0005_pilot_hardening.sql` |
| Private storage | `supabase/migrations/0001_initial.sql`, `src/server/services/audio-service.ts`, `src/server/services/export-service.ts` |
| AI provider boundary | `src/server/providers/clinical-ai-provider.ts` |
| AI feature gating | `src/lib/ai-guard.ts`, `src/lib/feature-flags.ts` |
| Rate limiting | `src/lib/rate-limit.ts` |
| AI JSON/schema validation | `src/server/services/note-service.ts`, `src/server/services/sis-service.ts`, `src/schemas/` |
| Draft approval workflow | `src/server/services/note-service.ts`, `tests/workflow-state.test.ts` |
| Version history | `clinical_note_versions`, `sis_assessment_versions` migrations |
| Audit logging | `src/server/services/audit-service.ts` |
| Monitoring hook | `sentry.server.config.ts`, `sentry.client.config.ts` |

## Required Operating Rules

1. AI output must never be presented as final clinical documentation before human approval.
2. Export of clinical notes requires approval.
3. Raw transcripts, note bodies, and health data must not be added to production logs or Sentry context.
4. Any new AI task must complete an AI impact assessment before production release.
5. Any model, provider, prompt, or schema change must follow the AI change process.
6. Any suspected harmful output, data leak, tenant isolation failure, or provider misuse must be handled as an AI incident.
7. Feature flags must remain available for disabling AI transcription, note generation, SIS extraction, and voice edit independently.
8. Management must review AI risk, incidents, supplier status, and KPI trends at least quarterly.

## Open Gaps

- Formal AIMS owner and deputy are not yet assigned.
- Supplier contracts and DPA/AVV status are not evidenced in this repository.
- DPIA/DSFA is not completed.
- Retention and deletion policy is not implemented end-to-end.
- Formal internal audit and management review have not yet occurred.

## Approval

| Role | Name | Date | Signature |
| --- | --- | --- | --- |
| Management representative | TBD | TBD | TBD |
| AI system owner | TBD | TBD | TBD |
| Data protection lead | TBD | TBD | TBD |
