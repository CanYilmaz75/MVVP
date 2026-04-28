# CAREVO QA/UAT Execution Report

Date: 2026-04-28  
Scope: local production build, automated contract tests, static security checks, HTTP smoke tests  
Result: technical release gates passed locally; staging UAT with real users/providers remains required before go-live with real health data.

## Build And Static Gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Production build | PASS | `NEXT_TELEMETRY_DISABLED=1 npm run build` completed; protected app routes render as dynamic; middleware included in build output. |
| TypeScript | PASS | `npm run typecheck` completed. |
| Automated tests | PASS | `npm test` completed: 11 tests, 11 passed. |
| Lint | PASS | `npm run lint` completed using ESLint CLI. |

## HTTP Smoke Tests

Executed against `next start -p 3100` after production build.

| Check | Result | Evidence |
| --- | --- | --- |
| Public home loads | PASS | `GET /` returned 200. |
| Login page loads | PASS | `HEAD /login` returned 200. |
| Privacy page loads | PASS | `GET /datenschutz` returned 200. |
| Imprint page loads | PASS | `GET /impressum` returned 200. |
| Demo page loads | PASS | `GET /demo-buchen` returned 200. |
| Signed-out dashboard blocked | PASS | `HEAD /dashboard` returned 307 to `/login?next=%2Fdashboard`. |
| Signed-out consultations blocked | PASS | `HEAD /consultations` returned 307 to `/login?next=%2Fconsultations`. |
| Unauthenticated API blocked | PASS | `GET /api/consultations` returned 401 with safe `UNAUTHORIZED` error payload. |

## QA Checklist Execution Summary

| Area | Local result | Remaining go-live requirement |
| --- | --- | --- |
| Authentication | PARTIAL PASS | Protected route/API blocking verified. Valid login, invalid password message, session persistence, and sign-out must be verified with staging users. |
| Tenant isolation | PARTIAL PASS | RLS migration contract tests passed. Cross-org direct URL and org-scoped list/export/template behavior must be verified with two staging organisations. |
| Consultation flow | PARTIAL PASS | Workflow state tests passed. Create/list/workspace aggregate must be verified in staging with real auth. |
| Audio | PARTIAL PASS | Schema rejects unsafe file types; signed upload URL implementation exists. Browser recording, upload persistence, file-size rejection, and private bucket behavior must be verified in staging. |
| Transcription | PARTIAL PASS | API/job paths exist. Real provider success/failure/retry and empty transcript handling must be verified in staging. |
| Note generation | PARTIAL PASS | SOAP schema and workflow tests passed. Real provider JSON validation, invalid-provider-output handling, and regeneration must be verified in staging. |
| Manual editing | PARTIAL PASS | Versioning services and workflow tests exist. UI save stability and rendered note updates must be verified in staging. |
| Voice edit | PARTIAL PASS | API routes and audit hooks exist. Recording, preview, apply, and failure-preservation behavior must be verified in staging. |
| Validation warnings | PARTIAL PASS | Validation service exists. Section mapping, clean-case behavior, and dismissal UX must be verified with clinical examples. |
| Approval | PARTIAL PASS | Workflow tests enforce explicit approval before export. Timestamp persistence and audit record must be verified in staging. |
| Export | PARTIAL PASS | Export service requires approved note and creates 300-second signed URLs. PDF content and signed URL expiry must be verified in staging. |
| Security | PARTIAL PASS | RLS tests passed; static scan found no server-only secrets imported into `src/app`, `src/components`, or `src/features`; API unauth returns 401. Staging RLS and storage tests remain required. |
| Observability | PARTIAL PASS | Structured unauthorized API log observed. Sentry delivery, request IDs across failures, and audit coverage must be verified in staging. |
| UX | PARTIAL PASS | Production pages render and redirect correctly. Full browser UAT with clinicians/Pflege/MFA is still required. |
| Production build | PASS | Build, typecheck, lint, and tests passed locally. |

## Staging UAT Scenarios Still Required

1. Clinician signs in, creates a consultation, records or uploads audio, transcribes, generates a note, manually edits, voice-edits, approves, exports PDF.
2. Pflege user completes SIS flow with audio/text input, reviews generated SIS sections and risk fields, saves version history.
3. MFA user runs a practice-style documentation flow and confirms language, templates, and export usability.
4. Cross-organisation user attempts direct URL access to another organisation's consultation/export/template.
5. AI provider failure, empty transcript, malformed JSON output, export-before-approval, oversized audio, unsupported MIME type.
6. Audit review confirms entries for create, audio upload, transcription start/finish/fail, note generation, edit, voice edit, approval, export, SIS save/extract.
7. Sentry review confirms failures appear without raw audio, transcript, note, or health data in event context.
