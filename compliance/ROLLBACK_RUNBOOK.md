# CAREVO Rollback Runbook

Status: operational draft  
Applies to: Vercel app deployments, AI feature flags, providers, and database change containment  
Last reviewed: 2026-04-28

## Purpose

Rollback must quickly restore a safe operating state without hiding evidence or increasing privacy, security, or clinical risk.

## Rollback Triggers

Start rollback or containment when:

- production build/deploy causes app outage
- protected route or tenant isolation behavior regresses
- export approval gate fails
- AI provider behavior becomes unsafe
- raw health data appears in logs or monitoring
- migration corrupts or blocks critical workflow
- supplier incident affects critical path

## Containment Options

| Risk | First containment | Owner |
| --- | --- | --- |
| Unsafe AI transcription/note/SIS/voice edit | Disable feature flag or provider key. | AI Owner / Engineering Lead |
| App deployment regression | Vercel rollback to last known good deployment. | Engineering Lead |
| Security/privacy incident | Revoke access, rotate secrets, disable feature, preserve evidence. | Security Lead / Incident Owner |
| Database migration issue | Freeze further migrations, evaluate restore, rollback app. | Engineering Lead |
| Supplier outage | Disable affected integration, use manual workaround, monitor supplier status. | Supplier Owner |

## Vercel Deployment Rollback

1. Incident Owner opens or updates incident record.
2. Engineering Lead identifies last known good deployment.
3. Confirm rollback target was built from approved commit.
4. Roll back in Vercel.
5. Run smoke tests:
   - `/` returns 200
   - `/login` returns 200
   - signed-out `/dashboard` redirects to `/login`
   - signed-out `/api/consultations` returns 401
6. Review Sentry for new errors.
7. Update incident record with deployment IDs and smoke-test result.

## AI Feature Disablement

Use feature flags or environment/provider controls to disable:

- AI transcription
- AI note generation
- SIS extraction
- voice edit

After disablement:

1. Confirm affected UI/API path fails safely.
2. Confirm users see recoverable messaging.
3. Confirm no new AI calls are made for disabled feature.
4. Document customer-facing workaround.

## Database And Migration Containment

If a migration is suspected:

1. Stop additional schema changes.
2. Preserve logs and migration identifiers.
3. Determine whether app rollback is sufficient.
4. Use restore only after Security Lead, Engineering Lead, and Data Protection Lead agree when health data may be affected.
5. Document decision and verification.

## Post-Rollback Verification

| Check | Required result |
| --- | --- |
| Build status | Last known good deployment active. |
| Auth route | `/login` loads. |
| Protected page | signed-out `/dashboard` redirects. |
| Protected API | signed-out `/api/consultations` returns 401. |
| Monitoring | No new Critical/High error spike. |
| Audit | Incident and relevant admin actions recorded. |

## Rollback Record

| Field | Value |
| --- | --- |
| Rollback ID | RB-YYYY-NNN |
| Incident/ticket | TBD |
| Trigger | TBD |
| Previous deployment | TBD |
| Rollback deployment | TBD |
| Feature flags changed | TBD |
| Secrets revoked/rotated | TBD |
| Smoke tests | TBD |
| Customer communication | TBD |
| Owner approval | TBD |
| Status | Open |

## Launch Gate

Before pilot launch, one rollback drill against a production-like deployment must pass and be recorded.
