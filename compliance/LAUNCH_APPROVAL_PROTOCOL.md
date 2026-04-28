# CAREVO Launch Approval Protocol

Status: operational draft  
Applies to: controlled pilot launch with real users or real health data  
Last reviewed: 2026-04-28

## Launch Rule

CAREVO may not launch with real health data until all Critical and High launch blockers are closed or explicitly accepted by the accountable owner and Management Representative.

## Launch Metadata

| Field | Value |
| --- | --- |
| Launch ID | LAUNCH-YYYY-NNN |
| Launch type | Controlled pilot |
| Target organisations | TBD |
| Target date | TBD |
| Release commit/deployment | TBD |
| Staging environment | TBD |
| Production environment | TBD |
| Launch manager | TBD |
| Status | Draft |

## Required Evidence

| Evidence | Owner | Status | Link/reference |
| --- | --- | --- | --- |
| Production build passed | Engineering Lead | TBD | TBD |
| Typecheck, lint, tests passed | Engineering Lead | TBD | TBD |
| QA/UAT execution report completed | Engineering Lead / Clinical Reviewer | TBD | `../08_QA_UAT_EXECUTION_REPORT.md` |
| Clinical UAT completed | Clinical Reviewer | TBD | TBD |
| DPIA/DSFA completed or launch condition accepted | Data Protection Lead | TBD | TBD |
| DPAs/AVVs for processors filed | Supplier Owner / DPL | TBD | TBD |
| Privacy notice final | Data Protection Lead | TBD | TBD |
| Admin access review completed | Security Lead | TBD | `ADMIN_ACCESS_POLICY.md` |
| Backup/restore drill passed | Engineering Lead / Security Lead | TBD | `BACKUP_RESTORE_RUNBOOK.md` |
| Secret rotation drill passed | Security Lead | TBD | `SECRET_ROTATION_RUNBOOK.md` |
| Rollback drill passed | Engineering Lead | TBD | `ROLLBACK_RUNBOOK.md` |
| Monitoring and alerts enabled | Engineering Lead / Security Lead | TBD | `MONITORING_KPIS.md` |
| Support channel active | Incident Owner | TBD | `SUPPORT_RUNBOOK.md` |
| Incident contacts assigned | Incident Owner | TBD | `OPERATING_MODEL.md` |
| Supplier review completed | Supplier Owner | TBD | `SUPPLIER_ASSESSMENT.md` |

## Open Blockers

| ID | Blocker | Severity | Owner | Decision | Due date | Status |
| --- | --- | --- | --- | --- | --- | --- |
| TBD | TBD | Critical / High / Medium / Low | TBD | Close / accept / defer | TBD | Open |

## Accepted Residual Risks

| Risk ID | Description | Residual risk | Accepted by | Conditions | Review date |
| --- | --- | --- | --- | --- | --- |
| TBD | TBD | TBD | TBD | TBD | TBD |

## Launch Day Checklist

- [ ] Production deployment is the approved release.
- [ ] Environment variables match approved production configuration.
- [ ] Sentry enabled and scrubbed.
- [ ] Rate limiting enabled where configured.
- [ ] Supabase private buckets verified.
- [ ] Feature flags set to approved values.
- [ ] Support mailbox monitored.
- [ ] Incident Owner reachable.
- [ ] Rollback owner reachable.
- [ ] Customer launch contact confirmed.
- [ ] First pilot organisation/user access confirmed.

## Sign-Off

| Role | Name | Decision | Date | Notes |
| --- | --- | --- | --- | --- |
| Management Representative | TBD | Approve / reject | TBD | TBD |
| Data Protection Lead | TBD | Approve / reject | TBD | TBD |
| Security Lead | TBD | Approve / reject | TBD | TBD |
| AI System Owner | TBD | Approve / reject | TBD | TBD |
| Clinical Reviewer | TBD | Approve / reject | TBD | TBD |
| Engineering Lead | TBD | Approve / reject | TBD | TBD |
| Incident Owner | TBD | Approve / reject | TBD | TBD |
| Supplier Owner | TBD | Approve / reject | TBD | TBD |

## Post-Launch Watch

For the first two pilot weeks:

- Daily review of Critical/High Sentry events.
- Daily review of failed AI jobs and failed exports.
- Weekly review of validation warnings and support queue.
- Immediate review of any customer-reported clinical output concern.
