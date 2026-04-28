# AI Risk Register

Status: operational draft  
Risk scale: Low / Medium / High / Critical  
Last reviewed: 2026-04-28

## Risk Register

| ID | Risk | Impact | Likelihood | Current controls | Residual risk | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AI-R01 | AI draft contains hallucinated clinical facts. | High | Medium | Structured JSON output, schema parsing, validation warnings, human approval before export. Evidence: `note-service.ts`, `validation-service.ts`. | Medium | AI Owner / Clinical Reviewer | Active |
| AI-R02 | Transcription misses or changes clinically relevant statements. | High | Medium | Human review workflow, transcript storage, draft status, audit logs. | Medium | Clinical Reviewer | Active |
| AI-R03 | User treats AI output as final without review. | High | Medium | UI labels AI output as draft, approval required for export, workflow tests. Evidence: `assertApprovedForExport`, `workflow-state.test.ts`. | Medium | Product / Clinical | Active |
| AI-R04 | Personal health data is sent to an AI provider without proper legal basis or processor agreement. | Critical | Medium | Provider boundary exists; open contractual/legal gap. | High | Data Protection Lead | Open |
| AI-R05 | Tenant data leakage through database access. | Critical | Low-Medium | RLS enabled, role-aware policies, contract tests. Evidence: `0005_pilot_hardening.sql`, `rls-and-api-contracts.test.ts`. | Medium | Security Lead | Active |
| AI-R06 | Sensitive artifacts exposed through public storage or long-lived URLs. | Critical | Low-Medium | Private buckets, signed upload URLs, 300-second PDF signed URL. Evidence: `audio-service.ts`, `export-service.ts`. | Medium | Security Lead | Active |
| AI-R07 | Raw health data appears in production logs or Sentry. | High | Medium | Logging utility is structured; architecture docs warn against raw text logging. Need Sentry scrubbing policy verification. | Medium | Security Lead | Open |
| AI-R08 | Model or provider behavior changes without assessment. | High | Medium | Provider boundary and model names are centralized. Change process still needs enforcement. | Medium | AI Owner | Open |
| AI-R09 | Prompt injection or malicious transcript content influences generated note. | High | Medium | System prompts, JSON schema, validation, human approval. Need explicit adversarial tests. | Medium | Engineering / AI Owner | Open |
| AI-R10 | Bias or language limitations degrade output quality for certain users or patients. | Medium-High | Medium | Language settings, human review. Need monitoring and UAT sampling. | Medium | Clinical Reviewer | Open |
| AI-R11 | Feature misuse or excessive AI calls cause cost, abuse, or availability issues. | Medium | Medium | Feature flags, rate limits via Upstash. Evidence: `ai-guard.ts`, `rate-limit.ts`. | Low-Medium | Engineering | Active |
| AI-R12 | Incomplete deletion or retention handling violates customer/legal requirements. | High | Medium | Cascading deletes in schema for some objects. No documented retention/deletion workflow. | High | Data Protection Lead | Open |
| AI-R13 | Audit logs are incomplete for critical actions. | High | Medium | Audit service used across consultation, audio, transcription, note, SIS, job, and export services. Need audit coverage test. | Medium | Engineering | Active |
| AI-R14 | Exported PDF contains unapproved or stale content. | High | Low-Medium | Export requires approval and records version metadata. Evidence: `export-service.ts`, `assertApprovedForExport`. | Low-Medium | Engineering | Active |
| AI-R15 | Supplier outage interrupts critical workflow. | Medium | Medium | Jobs and error handling exist. Need supplier continuity and manual fallback plan. | Medium | Supplier Owner | Open |

## Risk Acceptance Rules

- Critical residual risk cannot be accepted for production without management sign-off and documented mitigation.
- High residual privacy or clinical-safety risk requires Data Protection Lead and Clinical Reviewer review.
- Any risk involving data leakage, cross-tenant access, or harmful clinical output must be treated as incident-capable.

## Review Triggers

Review this register when:

- A new AI feature is introduced.
- A model, provider, prompt, schema, or storage architecture changes.
- A privacy, security, or clinical AI incident occurs.
- Validation warnings or user reports indicate repeated quality issues.
- Before pilot expansion or production launch.
