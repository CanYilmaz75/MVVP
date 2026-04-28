# CAREVO Pilot Operating Model

Status: operational draft  
Applies to: controlled CAREVO pilot before broad production rollout  
Last reviewed: 2026-04-28

## Operating Scope

CAREVO is operated for a controlled pilot with a limited number of organisations, named users, and explicitly approved workflows.
This operating model does not create a 24/7 general support commitment.

Pilot operating assumptions:

- Support hours: Monday to Friday during agreed business hours.
- Critical and High incidents escalate immediately to named owners.
- Medium incidents are triaged by the next business day.
- Low incidents are reviewed weekly.
- No real health data may be processed until the launch approval protocol is signed.
- No uncontrolled customer expansion may happen without management review.

## Launch Blockers

CAREVO must not process real health data in pilot or production if any of these are missing:

- Incident Owner is assigned.
- Data Protection Lead is assigned.
- Security Lead is assigned.
- Engineering Lead is assigned.
- Critical supplier approvals are recorded.
- Backup/restore drill has passed in staging.
- Secret rotation drill has passed in staging.
- Rollback drill has passed in staging.
- Monitoring and alert routing are enabled.
- Launch approval protocol is signed.

## Operating Roles

The role model is defined in `AI_ROLES_AND_RESPONSIBILITIES.md`.
For pilot launch, the following roles must have a named primary owner and deputy:

| Role | Launch responsibility |
| --- | --- |
| Management Representative | Accepts residual launch risk and signs pilot launch approval. |
| AI System Owner | Owns AI feature readiness, model/provider changes, and AI incident review. |
| Data Protection Lead | Owns legal basis, DPIA/DSFA, DPA/AVV evidence, breach triage, and privacy notices. |
| Security Lead | Owns access control, secrets, logging hygiene, storage exposure, and technical containment. |
| Clinical Reviewer | Owns clinical UAT, clinical wording controls, and unsafe-output review. |
| Engineering Lead | Owns deployment, rollback, technical verification, and remediation delivery. |
| Incident Owner | Runs incident triage, bridge, communications, evidence log, and closure workflow. |
| Supplier Owner | Tracks supplier status, incidents, DPA/AVV evidence, and exit plans. |

## Contact Matrix

Do not launch with placeholder owners in this table.

| Role | Person/team | Email | Phone/Signal optional | Deputy | Escalation deadline | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Management Representative | TBD | TBD | TBD | TBD | Critical: same day | Open |
| AI System Owner | TBD | TBD | TBD | TBD | Critical: immediate; High: 4 business hours | Open |
| Data Protection Lead | TBD | TBD | TBD | TBD | Critical privacy: immediate | Open |
| Security Lead | TBD | TBD | TBD | TBD | Critical: immediate; High: 4 business hours | Open |
| Clinical Reviewer | TBD | TBD | TBD | TBD | Critical clinical: immediate; High: 4 business hours | Open |
| Engineering Lead | TBD | TBD | TBD | TBD | Critical: immediate; High: 4 business hours | Open |
| Incident Owner | TBD | TBD | TBD | TBD | Critical: immediate | Open |
| Supplier Owner | TBD | TBD | TBD | TBD | Supplier incident: same business day | Open |

## Operating Channels

| Channel | Use | Owner | Minimum evidence |
| --- | --- | --- | --- |
| Dedicated support mailbox | Customer/user support entry point. | Support / Incident Owner | Ticket with request ID and organisation. |
| GitHub Issues or Project | Internal triage and remediation tracking. | Engineering Lead | Issue link in incident/support record. |
| Sentry | Application errors, performance, and backend/frontend exceptions. | Security / Engineering | Event URL without raw health data. |
| Vercel | Deployments, rollback, route health. | Engineering Lead | Deployment URL and rollback log. |
| Supabase | Database, auth, storage, backup evidence. | Engineering / Security | Project, backup, storage, and auth audit evidence. |
| Upstash | Rate limiting health. | Engineering | Usage and error evidence where configured. |

## Pilot Operating Cadence

| Cadence | Activity | Owner | Evidence |
| --- | --- | --- | --- |
| Daily during active pilot | Review Critical/High incidents and failed jobs. | Incident Owner | Triage notes or dashboard snapshot. |
| Weekly | KPI review, supplier notices, open support queue, failed exports/transcriptions. | AI Owner / Engineering | Monitoring review log. |
| Every release | Build, lint, typecheck, tests, RLS contract tests, smoke test. | Engineering Lead | Release checklist. |
| Monthly | Sensitive logging review and admin access review. | Security Lead | Review record. |
| Quarterly and before expansion | Internal audit and management review. | Management Rep | Completed audit/review templates. |

## Required Pre-Launch Drills

The following drills must pass before processing real health data:

1. Incident simulation: AI provider failure, feature disablement, ticket creation, closure approval.
2. Backup/restore test: Supabase staging restore and storage spot check.
3. Secret rotation test: rotate one non-critical staging secret and verify smoke tests.
4. Rollback test: rollback a production-like deployment and run route smoke checks.
5. Monitoring test: harmless controlled failure reaches Sentry without health data.

## Related Runbooks

- `SUPPORT_RUNBOOK.md`
- `BACKUP_RESTORE_RUNBOOK.md`
- `SECRET_ROTATION_RUNBOOK.md`
- `ADMIN_ACCESS_POLICY.md`
- `ROLLBACK_RUNBOOK.md`
- `LAUNCH_APPROVAL_PROTOCOL.md`
- `AI_INCIDENT_AND_CHANGE_PROCESS.md`
- `MONITORING_KPIS.md`
