# GDPR Gap Assessment

Status: operational draft  
Scope: CAREVO MVP processing of personal and health data  
Last reviewed: 2026-04-28

## Important Note

This document is an engineering and operational readiness assessment. It is not legal advice and must be reviewed by qualified legal/data protection counsel before production use.

## Processing Summary

CAREVO may process:

- User account data.
- Organisation and role data.
- Patient or resident references.
- Consultation audio.
- Transcripts.
- Additional text entered by users.
- AI-generated draft notes.
- SIS assessment content.
- Exported PDFs.
- Audit logs and job metadata.

Health-related consultation data is likely special-category data under GDPR Article 9 and requires a specific legal basis and safeguards.

## Gap Register

| Area | Current state | Gap | Risk | Required action | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Controller/processor role | Not defined in repo. | Need determine whether CAREVO acts as controller, processor, or both per deployment. | High | Define role model and customer contract position. | Data Protection Lead | Open |
| Privacy notice | Placeholder page exists. | Not production-ready and says so explicitly. | High | Replace `src/app/datenschutz/page.tsx` content with final notice. | Data Protection Lead | Open |
| Legal basis | Not documented. | Need Article 6 basis. | High | Document basis per processing purpose. | Data Protection Lead | Open |
| Health data basis | Not documented. | Need Article 9 condition and safeguards. | Critical | Define health-data basis with counsel/customer. | Data Protection Lead | Open |
| DPIA/DSFA | Not completed. | Likely required due health data and AI-assisted processing. | Critical | Complete DPIA/DSFA before production. | Data Protection Lead | Open |
| Processor DPAs/AVVs | Not evidenced. | Supabase, OpenAI, Sentry, Upstash, hosting provider must be reviewed. | Critical | Complete supplier assessment and contracts. | Supplier Owner | Open |
| International transfers | Not evidenced. | Need SCC/TIA or other mechanism if applicable. | High | Review supplier regions and transfer mechanisms. | Data Protection Lead | Open |
| Data minimization | Partly implemented by scoped services. | Need purpose-by-purpose data inventory. | Medium | Create data map and verify AI payload minimization. | AI Owner / DPL | Open |
| Retention | Schema has cascades; no policy. | No retention periods or deletion workflow. | High | Define and implement retention/deletion. | DPL / Engineering | Open |
| Data subject rights | Not implemented/documented. | Need access, rectification, erasure, restriction, portability, objection process as applicable. | High | Create DSR workflow and admin support process. | DPL | Open |
| Security controls | Strong starting controls. | Need production access review, backup policy, key rotation, security testing. | Medium-High | Complete security checklist and pen-test plan. | Security Lead | Open |
| Logging | Structured logs exist. | Need prove no raw health data in logs/Sentry and configure scrubbing. | Medium-High | Add log review and Sentry scrubbing evidence. | Security Lead | Open |
| Breach response | AIMS incident process drafted. | Need GDPR breach notification procedure. | High | Add 72-hour triage workflow and contact list. | DPL / Incident Owner | Open |
| Consent/user notice | Not clear. | If relying on consent for any processing, needs valid capture and withdrawal mechanism. | High | Avoid consent unless appropriate, or implement properly. | DPL | Open |
| Records of processing | Not present. | Need RoPA/Verzeichnis Verarbeitungstaetigkeiten where required. | Medium-High | Create RoPA. | DPL | Open |

## Current Technical Measures

| Measure | Evidence |
| --- | --- |
| Authenticated protected routes | `src/server/auth/context.ts`, `middleware.ts` |
| Tenant isolation | `public.current_user_organisation_id()`, RLS migrations |
| Role-aware policies | `supabase/migrations/0005_pilot_hardening.sql` |
| Private storage buckets | `supabase/migrations/0001_initial.sql` |
| Short-lived PDF signed URLs | `src/server/services/export-service.ts` |
| Signed upload URLs | `src/server/services/audio-service.ts` |
| Audit logging | `src/server/services/audit-service.ts` |
| AI feature disablement | `src/lib/ai-guard.ts` |
| Rate limiting | `src/lib/rate-limit.ts` |
| Workflow approval gate | `src/server/services/note-service.ts` |
| Contract tests | `tests/*.test.ts` |

## Minimum GDPR Production Checklist

- [ ] Final privacy notice published.
- [ ] Controller/processor role documented.
- [ ] Article 6 legal basis documented by purpose.
- [ ] Article 9 health-data basis documented.
- [ ] DPIA/DSFA completed.
- [ ] DPAs/AVVs signed and filed.
- [ ] Transfer mechanisms reviewed.
- [ ] Retention and deletion policy implemented.
- [ ] Data subject request process implemented.
- [ ] Sentry/log scrubbing configured and tested.
- [ ] Breach response procedure approved.
- [ ] Production admin access policy approved.
- [ ] Security review completed before launch.

## Recommended Next Documents

- RoPA / Verzeichnis der Verarbeitungstaetigkeiten.
- TOMs / technical and organizational measures.
- Data retention schedule.
- Data subject request SOP.
- GDPR breach response SOP.
- Customer DPA template.
