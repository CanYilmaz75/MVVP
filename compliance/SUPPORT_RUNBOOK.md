# CAREVO Support Runbook

Status: operational draft  
Applies to: controlled pilot support  
Last reviewed: 2026-04-28

## Support Commitment

Pilot support runs during agreed business hours, Monday to Friday.
Critical and High incidents are escalated according to `OPERATING_MODEL.md`.
This runbook does not create a general 24/7 support obligation.

## Support Channels

| Priority | Channel | Purpose | Required handling |
| --- | --- | --- | --- |
| Primary | Dedicated support mailbox | Customer and user support intake. | Create an internal ticket for every actionable request. |
| Secondary | GitHub Issue or Project | Internal engineering and operations tracking. | Link to customer support record without raw health data. |
| Emergency | Phone/Signal to Incident Owner | Critical privacy, security, availability, or clinical documentation incidents. | Start incident workflow and bridge immediately. |
| Monitoring | Sentry/Vercel/Supabase alerts | System-detected failures. | Convert Critical/High alerts into incident records. |

## Severity And Response Targets

| Severity | Examples | Initial response | Owner |
| --- | --- | --- | --- |
| Critical | Cross-tenant data exposure, harmful exported note, suspected health-data breach, full workflow outage during pilot use. | Immediate during business hours; emergency escalation to Incident Owner. | Incident Owner |
| High | Repeated AI hallucinations, provider misconfiguration, sensitive log finding, export failure affecting pilot users. | Within 4 business hours. | Incident Owner / Engineering Lead |
| Medium | Local workflow failure, degraded transcription quality, dashboard issue, non-blocking export problem. | Next business day. | Engineering Lead |
| Low | UX defect, documentation question, non-sensitive request. | Weekly triage. | Support owner |

## Ticket Fields

Every support or incident ticket must include:

| Field | Requirement |
| --- | --- |
| Reporter | Name/team or customer contact. |
| Organisation | Organisation identifier or customer name. |
| Feature | Auth, audio, transcription, note generation, SIS, approval, export, admin, monitoring, supplier. |
| Severity | Critical, High, Medium, Low. |
| Patient or health data included? | Yes/No. If Yes, remove raw content and preserve only safe references. |
| Raw data copied? | Must be No unless explicitly approved by Data Protection Lead and stored in protected location. |
| Request ID | App request ID, Sentry event ID, audit log time window, or reproduction timestamp. |
| Audit log window | UTC timestamp range and action types to inspect. |
| Customer impact | Users affected, workflow affected, workaround. |
| Containment | Feature flag, provider disablement, access revocation, rate limit, rollback, or none. |
| Owner | Named person/team. |
| Status | New, Triaged, Contained, Fixing, Verifying, Closed. |
| Closure approval | Required for Critical/High by accountable owner. |

## Support Workflow

1. Intake request through support mailbox, monitoring alert, or direct emergency escalation.
2. Create an internal ticket and classify severity.
3. Remove raw transcript, note, audio, patient reference, or other health data from ticket text.
4. Attach safe evidence only: request ID, route, organisation ID, user ID, timestamps, Sentry event URL, audit action names.
5. For Critical/High, notify Incident Owner and follow `AI_INCIDENT_AND_CHANGE_PROCESS.md`.
6. For product defects, link remediation work to the ticket.
7. Verify fix with relevant smoke test, audit review, or customer confirmation.
8. Close with owner approval and record any risk-register or runbook updates.

## Customer Communication Rules

- Acknowledge Critical/High support items with severity, owner, and next update time.
- Do not speculate about breach status before Data Protection Lead triage.
- Do not include raw health data in email updates.
- For confirmed supplier incidents, coordinate with Supplier Owner before customer messaging.

## Closure Criteria

Critical/High tickets may close only when:

- Immediate risk is contained.
- Root cause or accepted unknown is documented.
- Remediation or workaround is verified.
- Required customer/privacy/security communication is complete.
- Accountable owner approves closure.
