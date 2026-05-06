# CAREVO Compliance Pack

Status: operational draft  
Scope: CAREVO MVP repository as of 2026-05-06
Owner: to be assigned  
Review cadence: quarterly and before production launch

This folder contains the working documentation for CAREVO's AI Management System (AIMS) and GDPR readiness.
It is designed to be evidence-linked to the current codebase, not a certification claim.

## Important Position

These documents do not prove ISO/IEC 42001 certification or GDPR compliance by themselves.
They provide the management-system structure, control inventory, review routines, and gap register needed to prepare for legal review, customer due diligence, and future certification work.

## Documents

- [Pilot Operating Model](./OPERATING_MODEL.md)
- [Support Runbook](./SUPPORT_RUNBOOK.md)
- [Backup and Restore Runbook](./BACKUP_RESTORE_RUNBOOK.md)
- [Secret Rotation Runbook](./SECRET_ROTATION_RUNBOOK.md)
- [Admin Access Policy](./ADMIN_ACCESS_POLICY.md)
- [Rollback Runbook](./ROLLBACK_RUNBOOK.md)
- [Launch Approval Protocol](./LAUNCH_APPROVAL_PROTOCOL.md)
- [AIMS Policy](./ISO_42001_AIMS_POLICY.md)
- [Roles and Responsibilities](./AI_ROLES_AND_RESPONSIBILITIES.md)
- [AI Risk Register](./AI_RISK_REGISTER.md)
- [AI Impact Assessment Template](./AI_IMPACT_ASSESSMENT_TEMPLATE.md)
- [Supplier Assessment](./SUPPLIER_ASSESSMENT.md)
- [Monitoring KPIs](./MONITORING_KPIS.md)
- [AI Incident and Change Process](./AI_INCIDENT_AND_CHANGE_PROCESS.md)
- [Internal Audit Checklist](./INTERNAL_AUDIT_CHECKLIST.md)
- [Management Review Template](./MANAGEMENT_REVIEW_TEMPLATE.md)
- [GDPR Gap Assessment](./GDPR_GAP_ASSESSMENT.md)

## Current Technical Evidence

- Tenant isolation and RLS: `supabase/migrations/0001_initial.sql`, `supabase/migrations/0005_pilot_hardening.sql`
- Care-setting separation and care boundaries: `supabase/migrations/0008_organisation_care_setting.sql`, `supabase/migrations/0009_consultation_care_protocols.sql`, `supabase/migrations/0010_production_care_boundaries.sql`
- Signup trigger hardening: `supabase/migrations/0011_fix_signup_trigger_care_setting.sql`
- Private audio and PDF storage: `supabase/migrations/0001_initial.sql`, `src/server/services/audio-service.ts`, `src/server/services/export-service.ts`
- Audit logging: `src/server/services/audit-service.ts`
- AI feature gating and rate limits: `src/lib/ai-guard.ts`, `src/lib/rate-limit.ts`
- AI provider boundary: `src/server/providers/clinical-ai-provider.ts`
- Clinical note validation and approval workflow: `src/server/services/note-service.ts`, `src/server/services/validation-service.ts`
- SIS persistence and versioning: `src/server/services/sis-service.ts`, `supabase/migrations/0004_sis_persistence.sql`
- Contract tests: `tests/rls-and-api-contracts.test.ts`, `tests/workflow-state.test.ts`, `tests/schemas.test.ts`

## Minimum Production Gate

Before production use with real health data, CAREVO should have:

1. Signed DPAs/AVVs with all processors and subprocessors.
2. Documented legal basis for personal data and special-category health data.
3. Completed DPIA/DSFA for the AI-assisted healthcare documentation workflow.
4. Final privacy notice replacing the current placeholder.
5. Retention and deletion procedure implemented and tested.
6. Incident response contacts, severity matrix, and breach notification workflow approved.
7. Initial internal AIMS audit and management review completed.
8. Pilot operating model contacts completed with named primary owners and deputies.
9. Backup/restore, secret rotation, rollback, and monitoring drills passed in staging.
10. Launch approval protocol signed by accountable owners.
