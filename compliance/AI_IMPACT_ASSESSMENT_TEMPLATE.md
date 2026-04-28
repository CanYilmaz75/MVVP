# AI Impact Assessment Template

Status: operational draft  
Use for: every new or materially changed AI use case  
Last reviewed: 2026-04-28

## Assessment Metadata

| Field | Value |
| --- | --- |
| Assessment ID | AIA-YYYY-NNN |
| AI use case | TBD |
| Feature owner | TBD |
| Assessor | TBD |
| Date | TBD |
| Version | 0.1 |
| Release / PR | TBD |
| Decision | Pending / Approved / Approved with conditions / Rejected |

## Use Case Description

Describe:

- What the AI does.
- Who uses it.
- What data enters the AI system.
- What output is produced.
- Whether output affects patients, staff, billing, documentation, or downstream systems.

## CAREVO AI Use Cases

| Use case | Current implementation evidence | Required before production |
| --- | --- | --- |
| Audio transcription | `transcription-service.ts`, `clinical-ai-provider.ts` | DPIA/DSFA, provider DPA/AVV, accuracy review |
| Clinical note generation | `note-service.ts`, `validation-service.ts` | Clinical acceptance criteria, hallucination monitoring |
| SIS extraction | `sis-service.ts`, `SIS_DOKUMENTATION.md` | SIS-specific clinical review and error taxonomy |
| Voice edit | `note-service.ts`, `clinical-ai-provider.ts` | Abuse/misinterpretation tests and user guidance |

## Data Assessment

| Question | Answer |
| --- | --- |
| Does the use case process personal data? | TBD |
| Does it process health data or special-category data? | TBD |
| What data fields are processed? | TBD |
| Is data minimized for the task? | TBD |
| Is data retained? Where and for how long? | TBD |
| Is data transferred to external processors? | TBD |
| Is production data used for model training? | No, unless separately approved and contracted. |

## Impact Areas

Rate each area Low / Medium / High / Critical and explain.

| Area | Rating | Rationale | Controls |
| --- | --- | --- | --- |
| Patient or resident safety | TBD | TBD | Human review, approval gate |
| Clinical documentation quality | TBD | TBD | Schema validation, version history |
| Privacy and confidentiality | TBD | TBD | RLS, private storage, DPAs |
| Security | TBD | TBD | Auth, RLS, signed URLs |
| Fairness and bias | TBD | TBD | Clinical sampling, language review |
| Transparency | TBD | TBD | Draft labeling, privacy notice |
| Accountability | TBD | TBD | Audit logs, assigned owners |
| Operational continuity | TBD | TBD | Manual fallback, provider monitoring |

## Required Controls Checklist

- [ ] AI output is labeled as draft.
- [ ] Human approval is required before export or downstream reliance.
- [ ] Input and output schemas are validated.
- [ ] Sensitive actions are audit logged.
- [ ] RLS or equivalent tenant isolation applies.
- [ ] Private storage and signed URLs are used for sensitive files.
- [ ] Feature flag exists for disabling the use case.
- [ ] Rate limit exists for external AI calls where applicable.
- [ ] Logs and Sentry do not contain raw health data.
- [ ] Provider, DPA/AVV, transfer mechanism, and subprocessors are reviewed.
- [ ] DPIA/DSFA is completed or explicitly deemed unnecessary by the Data Protection Lead.
- [ ] Clinical Reviewer has approved acceptance criteria.
- [ ] Rollback and incident response plan exists.

## Decision

| Decision item | Result |
| --- | --- |
| Approved for development | TBD |
| Approved for pilot | TBD |
| Approved for production | TBD |
| Conditions | TBD |
| Expiry / next review | TBD |

## Sign-Off

| Role | Name | Date | Decision |
| --- | --- | --- | --- |
| AI System Owner | TBD | TBD | TBD |
| Data Protection Lead | TBD | TBD | TBD |
| Security Lead | TBD | TBD | TBD |
| Clinical Reviewer | TBD | TBD | TBD |
| Engineering Lead | TBD | TBD | TBD |
