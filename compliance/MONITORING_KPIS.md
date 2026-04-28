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
| AI call failure rate | Failed AI calls divided by total AI calls per feature. | App logs, audit logs, job status | Pilot target: <5% weekly; alert at >10% in 24h | Weekly in pilot | AI Owner |
| Transcription completion rate | Completed transcriptions divided by started transcriptions. | `audit_logs`, transcript status | Pilot target: >=95% weekly; alert at <90% in 24h | Weekly | Engineering |
| Note validation warning rate | Drafts with validation warnings divided by generated drafts. | `jobs.result` for validation | Baseline in first 2 pilot weeks; alert on 2x weekly baseline | Weekly | Clinical Reviewer |
| Approval rate | Approved notes divided by generated notes. | `clinical_notes`, `audit_logs` | Baseline in first month; review if <50% after generated drafts | Monthly | Product / Clinical |
| Post-approval edit rate | Post-approval edits divided by approved notes. | `audit_logs` action `post_approval_edit` | Baseline in first month; review if >20% | Monthly | Clinical Reviewer |
| Export without approval attempts | Blocked export attempts due to missing approval. | App errors/logs | 0 successful events | Weekly | Security / Engineering |
| RLS regression test status | Pass/fail of RLS and API contract tests. | `npm test` | 100% pass | Every release | Engineering |
| Sensitive logging findings | Count of confirmed raw health data log/Sentry findings. | Log review, Sentry review | 0 | Monthly | Security |
| AI incident count | Confirmed AI incidents by severity. | Incident register | Trend down | Monthly | AI Owner |
| Data subject request SLA | Requests completed within legal/customer SLA. | DSR register | 100% in SLA | Monthly | Data Protection Lead |
| Supplier incident count | Supplier incidents affecting CAREVO AI/data workflows. | Supplier notices, incident register | 0 Critical untriaged; same business day review | Monthly | Supplier Owner |

## Minimum Dashboards

Create dashboards or reports for the controlled pilot.

| Dashboard | Tool/source | Required views | Owner |
| --- | --- | --- | --- |
| Application errors | Sentry, Vercel logs | error rate by route and feature, request IDs, p95 latency, release/deployment version | Engineering |
| AI jobs | `jobs`, audit logs, app logs | queued/running/succeeded/failed by action, AI provider failures, retry/failure reasons | AI Owner / Engineering |
| Transcription flow | `audit_logs`, transcripts | started/completed/failed, empty transcript failures, duration where available | Engineering |
| Note lifecycle | `clinical_notes`, `clinical_note_versions`, `audit_logs` | generated, edited, approved, post-approval edit, exported | Clinical Reviewer |
| Validation warnings | validation job results | warning frequency, warning type, affected section, clean-case sample | Clinical Reviewer |
| Security and access | tests, app logs, Sentry | 401/403 spike, RLS test status, export-without-approval attempts, sensitive logging findings | Security |
| Storage/export | Supabase storage, exports | signed URL failures, PDF export failures, storage errors, private bucket checks | Engineering / Security |
| Supplier health | supplier dashboards/notices | OpenAI, Supabase, Sentry, Upstash, hosting incidents and status | Supplier Owner |

## Alert Candidates

Alert when:

- AI failure rate spikes above threshold.
- Any cross-tenant access test fails.
- Export approval gate fails.
- Raw health data is detected in logs or Sentry.
- A critical supplier reports a security or privacy incident.
- Feature flag disablement is triggered for an AI feature.

## Pilot Alert Rules

| Alert | Threshold | Initial route | Response target |
| --- | --- | --- | --- |
| Critical app/security/privacy incident | Any confirmed or likely cross-tenant exposure, breach, harmful export, or full workflow outage | Incident Owner, Security Lead, DPL, Engineering Lead | Immediate during business hours |
| High AI failure spike | AI call failure rate >10% in 24h or repeated provider failures affecting pilot users | AI Owner, Engineering Lead | 4 business hours |
| Transcription completion drop | Completion rate <90% in 24h during active pilot use | Engineering Lead | 4 business hours |
| Export approval gate issue | Any successful unapproved export or suspected stale approved export | Security Lead, Engineering Lead | Immediate |
| Sensitive logging finding | Any raw transcript, note, audio, patient reference, or secret in Sentry/logs | Security Lead, DPL | Immediate |
| 401/403 anomaly | Unusual spike or customer access outage | Security Lead, Engineering Lead | Next business day unless customer-blocking |
| Supplier Critical notice | Supabase/OpenAI/Sentry/Upstash/hosting Critical notice | Supplier Owner, Incident Owner | Same business day |

## Current Gaps

- KPI targets are pilot defaults and must be calibrated after the first 2 pilot weeks.
- Dashboards are defined here but must be configured in Sentry/Vercel/Supabase before launch.
- Validation warning taxonomy should be expanded for clinical review.
- Sentry scrubbing and alert rules must be evidenced in `LAUNCH_APPROVAL_PROTOCOL.md`.
