# 04_BACKEND_SECURITY_SCALING.md

## Current Backend State

Last updated: 2026-05-06.

The root app now contains concrete service and route boundaries for consultations, audio, transcription, note generation/editing, validation, approval, exports, SIS extraction, templates, team management, billing, jobs and auth signout/signup.

Recent database/security additions:
- `organisation.care_setting` separates care facilities from medical practices.
- care protocols constrain consultation workflows by organisation type.
- SIS data persists in versioned tenant-scoped tables.
- signup trigger behavior was hardened for care-setting defaults.
- production care-boundary migrations document the separation between nursing/care workflows and medical treatment workflows.

## Objective

Implement a backend that is reliable, secure, tenant-aware, and ready for MVP pilots.
This document is binding for:
- database design
- route handlers
- auth and authorization
- storage
- validation
- logging
- monitoring
- rate limiting
- scaling readiness

---

## Security Posture for MVP

This build handles highly sensitive workflow data. Treat all consultation content as sensitive.

Required principles:
1. least privilege
2. tenant isolation
3. secure-by-default storage
4. no trust in client input
5. structured audits for sensitive actions
6. secrets only on server
7. minimize data exposure in UI and logs

---

## Environment Strategy

### Public env
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

### Server-only env
- SUPABASE_SERVICE_ROLE_KEY
- OPENAI_API_KEY or ANTHROPIC_API_KEY
- DEEPGRAM_API_KEY if used
- SENTRY_DSN
- POSTHOG_KEY if used
- UPSTASH_REDIS_REST_URL if used
- UPSTASH_REDIS_REST_TOKEN if used

Never expose server-only secrets to client bundles.

---

## Auth Strategy

### MVP auth
- Supabase email/password

### Required behavior
- create profile row on first sign-in or via post-signup hook
- every request resolves current user and profile
- every data query is org-scoped
- protected routes redirect or reject unauthenticated users

### Authorization
- clinician can access only their organisation data
- admin can access organisation-level views
- no cross-org reads
- server checks role for admin-only actions where relevant

---

## Database Migrations

Use SQL migrations or migration tool consistently.
Do not hand-edit schema in production console.

Requirements:
- explicit indexes on common filters:
  - consultations(organisation_id, created_at desc)
  - consultations(clinician_id, created_at desc)
  - transcripts(consultation_id)
  - clinical_notes(consultation_id)
  - exports(consultation_id)
  - audit_logs(organisation_id, created_at desc)
- updated_at triggers where appropriate

---

## Row-Level Security

Enable RLS on all tenant tables.

### Example policy strategy
For tables with organisation_id:
- allow select/insert/update only when organisation_id = current user's organisation_id
- forbid delete unless admin and explicit policy exists

For profiles:
- allow user to read own profile
- admin can read org profiles if needed

Do not rely only on client-side filters.

---

## Storage Security

### Buckets
- consultation-audio (private)
- exported-pdfs (private)

### Rules
- no public bucket
- signed URLs only
- keep signed URL TTL short
- do not store direct permanent public URLs in DB
- validate file type and file size before persistence

### Audio constraints
- allowed MIME types:
  - audio/webm
  - audio/wav
  - audio/mpeg
  - audio/mp4 if needed
- size limit configurable
- reject unsupported uploads clearly

---

## Rate Limiting

Add rate limits at sensitive endpoints:
- consultation creation
- audio upload initiation
- transcribe
- generate-note
- edit-note
- export

Implement with Upstash Redis or equivalent.

Minimum rule examples:
- transcribe: per user and per consultation guard
- generate-note: prevent spam regenerations
- export: reasonable short-burst control

Also use idempotency keys for:
- note generation
- export

---

## Request Validation

Every route must:
1. parse request body through Zod
2. reject invalid input with 400
3. use typed response bodies
4. never pass raw unvalidated body into service layer

---

## Route Contract Recommendations

### POST /api/consultations
Request:
- patientReference
- specialty
- spokenLanguage
- noteTemplateId optional
- consultationType optional

Response:
- consultation id
- initial status

### POST /api/consultations/:id/audio
Request:
- multipart file upload or signed upload workflow
Response:
- audio asset id
- consultation status

### POST /api/consultations/:id/transcribe
Request:
- audioAssetId
Response:
- transcript id
- transcript status
- summary metadata

### POST /api/consultations/:id/generate-note
Request:
- transcriptId
- templateId optional
Response:
- clinicalNote id
- status
- warnings

### POST /api/consultations/:id/edit-note
Request:
- noteId
- editMode ('manual'|'voice')
- instructionText or structured patch
Response:
- updated note
- version number
- warnings

### POST /api/consultations/:id/approve
Request:
- noteId
Response:
- approved status
- approvedAt

### POST /api/consultations/:id/export
Request:
- noteId
- exportType ('pdf'|'clipboard')
Response:
- export metadata
- signed download URL if pdf

---

## Error Handling Standard

Return structured errors:
```json
{
  "error": {
    "code": "TRANSCRIPTION_FAILED",
    "message": "Transcription could not be completed.",
    "requestId": "..."
  }
}
```

Requirements:
- user-safe message
- stable machine-readable code
- correlation ID where possible
- no raw provider stack traces in response

---

## Logging Standard

Use structured logs for server events.

Fields:
- level
- message
- requestId
- userId
- organisationId
- consultationId
- route
- action
- durationMs
- errorCode if any

Never log:
- raw secrets
- full authorization headers
- sensitive full audio contents

Transcript and note text should be logged only in extremely limited debug contexts and preferably never in production logs.

---

## Audit Log Requirements

Audit these actions:
- consultation_created
- recording_started if client event persisted
- audio_uploaded
- transcription_started
- transcription_completed
- transcription_failed
- note_generation_started
- note_generated
- note_generation_failed
- note_edited
- note_approved
- note_exported
- post_approval_edit if allowed
- sis_extracted
- sis_saved
- team_member_invited
- team_member_role_changed
- subscription_changed

Audit entry payload should be concise and structured.

---

## Monitoring

### Sentry
Capture:
- unhandled server errors
- route handler errors
- client rendering errors
- performance traces on core workflow pages

### Product analytics
Track non-sensitive product events:
- consultation_started
- transcript_ready
- note_generated
- note_approved
- export_completed
- voice_edit_used

Do not send raw transcript or note text to analytics.

---

## Background Processing Readiness

Even if MVP uses user-triggered processing, design for later worker offload.

Use `jobs` table with:
- type
- status
- attempts
- payload
- result
- error

This enables migration to:
- queue worker
- cron retries
- backoff processing
without changing domain interfaces.

---

## PDF Export Strategy

Generate PDFs server-side.
Requirements:
- export from exact approved note version
- include consultation metadata
- include generated timestamp
- store file in private storage
- return short-lived signed URL

Do not generate PDF from client-only transient state.

---

## Performance and Scaling Guidance

### Immediate MVP
- keep APIs lean
- avoid N+1 queries
- use selective columns
- paginate consultations and exports
- debounce search filters

### Near-term scaling
- move long AI calls behind jobs
- persist provider latency metrics
- introduce caching for templates and static settings
- use edge-safe patterns only where secure and practical

---

## Posture for Production Readiness

The backend should be production-ready in these senses:
- secure tenant isolation
- protected storage
- monitored failure surface
- typed contracts
- structured auditability
- scalable architecture seams

It does not imply formal medical compliance certification.
