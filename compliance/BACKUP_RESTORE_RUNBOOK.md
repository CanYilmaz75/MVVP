# CAREVO Backup And Restore Runbook

Status: operational draft  
Applies to: Supabase database and private storage in staging/production  
Last reviewed: 2026-04-28

## Purpose

CAREVO must prove that critical pilot data can be recovered before launch.
The first restore drill must use staging or a disposable restore project, never the production database.

## Scope

Included:

- Supabase Postgres data.
- Supabase Auth-linked profile and organisation records.
- Private storage buckets `consultation-audio` and `exported-pdfs`.
- Audit logs, jobs, transcripts, clinical notes, SIS assessments, exports.

Excluded:

- Local developer databases.
- Provider-side retained data at AI suppliers.
- Customer systems outside CAREVO.

## Backup Status Check

Before launch and monthly during pilot:

1. Confirm Supabase production project region and backup plan.
2. Confirm backup retention period and point-in-time restore availability.
3. Confirm who can initiate restore.
4. Confirm storage backup/export options for private buckets.
5. Record supplier documentation or dashboard evidence.

## Staging Restore Drill

Run before launch and after material schema/storage changes:

1. Select a restore point from staging or a sanitized production-like dataset.
2. Restore into staging or a disposable Supabase project.
3. Apply current migrations if needed.
4. Verify auth/profile/organisation records exist.
5. Verify representative consultations, transcripts, notes, SIS assessments, jobs, exports, and audit logs.
6. Spot-check private storage buckets:
   - bucket is private
   - org-prefixed object paths are preserved
   - signed URL access works
   - public object access fails
7. Run app smoke checks against restored project:
   - `/login` loads
   - signed-out `/dashboard` redirects
   - signed-out `/api/consultations` returns 401
   - authenticated pilot user can list own organisation data
8. Document restore duration, blockers, and result.

## Restore Decision Rules

| Situation | Action |
| --- | --- |
| Production data corruption suspected | Freeze writes if possible, notify Incident Owner and Security Lead, preserve evidence. |
| Tenant data exposure suspected | Do not restore until Data Protection Lead and Security Lead approve containment. |
| Failed migration | Stop rollout, rollback app if needed, restore only after Engineering Lead approval. |
| Supplier outage | Use supplier status and exit plan; do not improvise production restores without owner approval. |

## Restore Drill Record

| Field | Value |
| --- | --- |
| Drill ID | BDR-YYYY-NNN |
| Date | TBD |
| Environment | Staging / disposable restore project |
| Supabase project | TBD |
| Restore point | TBD |
| Initiated by | TBD |
| Database restore result | TBD |
| Storage spot-check result | TBD |
| Smoke tests run | TBD |
| Duration | TBD |
| Findings | TBD |
| Owner approval | TBD |
| Status | Open |

## Launch Gate

The first pilot launch is blocked until one staging restore drill has status `Pass` and all Critical/High findings are closed or formally accepted.
