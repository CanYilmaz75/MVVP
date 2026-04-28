# CAREVO Secret Rotation Runbook

Status: operational draft  
Applies to: local, staging, and production secrets  
Last reviewed: 2026-04-28

## Purpose

Secrets must be rotated safely without exposing health data, breaking production traffic, or leaking server-only credentials to clients.

## Secrets In Scope

| Supplier/system | Secrets |
| --- | --- |
| Supabase | `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| OpenAI | `OPENAI_API_KEY` |
| Sentry | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN` |
| Upstash | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| Vercel/app | environment variables, deployment protection tokens where used |
| Future PDF integrity | `PDF_SIGNING_SECRET` if activated |

## Immediate Rotation Triggers

Rotate affected secrets immediately when:

- a secret is committed to git
- a secret is sent through insecure chat/email
- suspicious provider usage appears
- a developer device is compromised
- an employee or contractor with production access leaves
- supplier requests rotation after incident

## Standard Rotation Sequence

1. Identify affected environments and dependent features.
2. Create a new key in the provider dashboard.
3. Add the new key to staging environment variables.
4. Deploy staging.
5. Run staging smoke tests for affected feature.
6. Add the new key to production environment variables.
7. Deploy production.
8. Run production smoke tests.
9. Revoke the old key.
10. Record the rotation in the rotation log.

Never revoke the old production key before the new key is deployed and smoke-tested unless active compromise requires immediate containment.

## Supplier-Specific Notes

| Supplier | Rotation notes |
| --- | --- |
| Supabase anon key | Verify browser auth and signed-out protected route behavior. |
| Supabase service role key | Verify server-only use, audio signed upload, export signed URL, admin services. |
| OpenAI | Verify transcription, note generation, voice edit, SIS extraction where enabled. |
| Sentry | Verify one safe test event reaches Sentry without raw health data. |
| Upstash | Verify rate-limited routes still respond and abuse limits are active. |
| Vercel | Verify production env separation and deployment protection settings. |

## Smoke Tests

Minimum smoke tests after rotation:

- `npm run build`
- `/login` loads
- signed-out `/dashboard` redirects to `/login`
- signed-out `/api/consultations` returns 401
- affected provider feature works in staging
- Sentry event context contains no transcript, note, audio, or patient reference

## Rotation Log

| Field | Value |
| --- | --- |
| Rotation ID | SEC-ROT-YYYY-NNN |
| Date | TBD |
| Trigger | Scheduled / incident / offboarding / supplier / other |
| Secret(s) rotated | TBD |
| Environments | Local / staging / production |
| Owner | TBD |
| Staging test result | TBD |
| Production test result | TBD |
| Old key revoked at | TBD |
| Findings | TBD |
| Status | Open |

## Launch Gate

Before pilot launch, rotate at least one non-critical staging secret end to end and record a passing drill.
