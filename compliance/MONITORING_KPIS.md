# Monitoring KPIs

Status: operational draft  
Last reviewed: 2026-04-28

## Monitoring Objectives

CAREVO monitoring should detect:

- AI quality degradation.
- Unsafe or unreviewed output.
- Security or tenant isolation issues.
- Privacy-risk events.
- Supplier failures.
- Operational bottlenecks.

## KPI Register

| KPI | Definition | Source | Target | Review cadence | Owner |
| --- | --- | --- | --- | --- | --- |
| AI call failure rate | Failed AI calls divided by total AI calls per feature. | App logs, audit logs, job status | TBD | Weekly in pilot | AI Owner |
| Transcription completion rate | Completed transcriptions divided by started transcriptions. | `audit_logs`, transcript status | TBD | Weekly | Engineering |
| Note validation warning rate | Drafts with validation warnings divided by generated drafts. | `jobs.result` for validation | TBD | Weekly | Clinical Reviewer |
| Approval rate | Approved notes divided by generated notes. | `clinical_notes`, `audit_logs` | TBD | Monthly | Product / Clinical |
| Post-approval edit rate | Post-approval edits divided by approved notes. | `audit_logs` action `post_approval_edit` | TBD | Monthly | Clinical Reviewer |
| Export without approval attempts | Blocked export attempts due to missing approval. | App errors/logs | 0 successful events | Weekly | Security / Engineering |
| RLS regression test status | Pass/fail of RLS and API contract tests. | `npm test` | 100% pass | Every release | Engineering |
| Sensitive logging findings | Count of confirmed raw health data log/Sentry findings. | Log review, Sentry review | 0 | Monthly | Security |
| AI incident count | Confirmed AI incidents by severity. | Incident register | Trend down | Monthly | AI Owner |
| Data subject request SLA | Requests completed within legal/customer SLA. | DSR register | 100% in SLA | Monthly | Data Protection Lead |
| Supplier incident count | Supplier incidents affecting CAREVO AI/data workflows. | Supplier notices, incident register | TBD | Monthly | Supplier Owner |

## Minimum Dashboards

Create dashboards or reports for:

- AI job status and failure trends.
- Validation warning frequency and type.
- Note lifecycle: generated, edited, approved, exported.
- Audit log coverage by action type.
- Storage/export activity.
- Error rate by route and feature.

## Alert Candidates

Alert when:

- AI failure rate spikes above threshold.
- Any cross-tenant access test fails.
- Export approval gate fails.
- Raw health data is detected in logs or Sentry.
- A critical supplier reports a security or privacy incident.
- Feature flag disablement is triggered for an AI feature.

## Current Gaps

- KPI targets are not calibrated.
- Dashboards are not implemented in the repo.
- Validation warning taxonomy should be expanded for clinical review.
- Sentry scrubbing and alert rules are not evidenced here.
