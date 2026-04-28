# 02_SYSTEM_ARCHITECTURE.md

## Architectural Principles

1. protect patient-related data by default
2. keep AI orchestration isolated from route handlers
3. enforce schema validation at all boundaries
4. build asynchronous-friendly flows even if MVP uses synchronous UX in places
5. make org scoping impossible to bypass accidentally
6. maintain a clear source-of-truth chain:
   audio -> transcript -> draft note -> approved note -> export

---

## High-Level Architecture

### Frontend
Next.js app with authenticated shell:
- dashboard
- consultations
- consultation workspace
- templates
- exports
- settings

### Backend application layer
Server-side modules:
- auth guard layer
- consultation service
- audio service
- transcription service
- note generation service
- note edit service
- validation service
- export service
- audit service

### Data layer
Supabase Postgres:
- organisations
- profiles
- consultations
- audio_assets
- transcripts
- transcript_segments
- note_templates
- clinical_notes
- clinical_note_versions
- note_edits
- exports
- audit_logs
- feature_flags
- jobs

Supabase Storage:
- consultation-audio
- exported-pdfs

### AI providers
Abstract provider interfaces:
- transcriptionProvider
- llmProvider

This allows future provider replacement without rewriting product logic.

---

## Core Domain Entities

### Organisation
Tenant boundary.

### Profile
Authenticated user profile linked to organisation.

### Consultation
Root workflow entity.

### AudioAsset
Uploaded or recorded audio metadata.

### Transcript
Top-level transcript record.

### TranscriptSegment
Optional granular segmentation by speaker and time.

### ClinicalNote
Current note state.

### ClinicalNoteVersion
Immutable snapshot of note over time.

### NoteEdit
Voice or manual edit metadata.

### Export
Generated artifact record.

### AuditLog
Immutable event log.

### Job
Tracks long-running processing.

---

## Recommended Table Design

### organisations
- id uuid pk
- name text not null
- slug text unique not null
- created_at timestamptz default now()

### profiles
- id uuid pk references auth.users(id)
- organisation_id uuid not null references organisations(id)
- full_name text
- role text check role in ('clinician','admin')
- specialty text
- created_at timestamptz default now()

### consultations
- id uuid pk
- organisation_id uuid not null
- clinician_id uuid not null
- patient_reference text not null
- specialty text not null
- spoken_language text not null
- note_template_id uuid null
- status text not null
- started_at timestamptz null
- ended_at timestamptz null
- created_at timestamptz default now()
- updated_at timestamptz default now()

### audio_assets
- id uuid pk
- organisation_id uuid not null
- consultation_id uuid not null
- storage_path text not null
- mime_type text not null
- duration_seconds int null
- file_size_bytes bigint null
- source text check source in ('browser_recording','upload','voice_edit')
- created_by uuid not null
- created_at timestamptz default now()

### transcripts
- id uuid pk
- organisation_id uuid not null
- consultation_id uuid not null
- audio_asset_id uuid not null
- provider text not null
- detected_language text null
- raw_text text not null
- confidence numeric null
- status text not null
- created_at timestamptz default now()

### transcript_segments
- id uuid pk
- transcript_id uuid not null
- speaker_label text null
- start_ms int null
- end_ms int null
- text text not null
- segment_index int not null

### note_templates
- id uuid pk
- organisation_id uuid not null
- name text not null
- specialty text not null
- note_type text not null default 'SOAP'
- schema_version text not null
- template_definition jsonb not null
- active boolean default true
- created_at timestamptz default now()

### clinical_notes
- id uuid pk
- organisation_id uuid not null
- consultation_id uuid not null unique
- current_version int not null default 1
- status text not null
- structured_json jsonb not null
- rendered_text text not null
- approved_by uuid null
- approved_at timestamptz null
- created_at timestamptz default now()
- updated_at timestamptz default now()

### clinical_note_versions
- id uuid pk
- organisation_id uuid not null
- clinical_note_id uuid not null
- version_number int not null
- structured_json jsonb not null
- rendered_text text not null
- change_source text check change_source in ('generation','manual_edit','voice_edit','regeneration','post_approval_edit')
- created_by uuid null
- created_at timestamptz default now()

### note_edits
- id uuid pk
- organisation_id uuid not null
- clinical_note_id uuid not null
- instruction_text text not null
- instruction_source text check instruction_source in ('voice','manual')
- result_summary text null
- created_by uuid not null
- created_at timestamptz default now()

### exports
- id uuid pk
- organisation_id uuid not null
- consultation_id uuid not null
- clinical_note_id uuid not null
- export_type text check export_type in ('pdf','clipboard')
- storage_path text null
- created_by uuid not null
- created_at timestamptz default now()

### audit_logs
- id uuid pk
- organisation_id uuid not null
- actor_id uuid null
- entity_type text not null
- entity_id uuid null
- action text not null
- metadata jsonb not null default '{}'::jsonb
- created_at timestamptz default now()

### jobs
- id uuid pk
- organisation_id uuid not null
- consultation_id uuid null
- job_type text not null
- status text not null
- payload jsonb not null default '{}'::jsonb
- result jsonb null
- error_message text null
- attempts int not null default 0
- created_at timestamptz default now()
- updated_at timestamptz default now()

---

## State Machines

### Consultation status
- created
- recording
- audio_uploaded
- transcribing
- transcript_ready
- note_generating
- draft_ready
- approved
- exported
- failed

### Transcript status
- queued
- processing
- ready
- failed

### Note status
- not_started
- generating
- draft
- edited
- approved
- failed

---

## Source of Truth Rules

1. audio asset is source of truth for raw encounter input
2. transcript is derivative, but immutable per transcription run
3. structured draft note is derivative of transcript
4. approved note is final for export until explicit post-approval edit
5. exports must always reference the exact note version they were generated from

---

## Service Layer Boundaries

### auth service
- resolve current user profile
- resolve organisation scope

### consultation service
- create consultation
- update status
- load consultation workspace aggregate

### audio service
- issue signed upload details if using direct upload
- validate mime type and size
- persist audio asset

### transcription service
- call provider
- normalize output
- persist transcript and segments

### note generation service
- construct prompt input
- call LLM
- validate schema
- render text
- persist note + version

### note edit service
- accept instruction
- apply targeted edit
- validate schema
- persist version

### validation service
- run deterministic checks on note vs transcript
- return warning set

### export service
- generate PDF
- store artifact if file export
- log export

### audit service
- append structured audit entry

---

## API Shape Principles

- all request bodies validated with Zod
- all responses typed
- return machine-friendly error codes + user-safe messages
- support idempotency on mutating endpoints that may retry
- include request correlation ID header when possible

---

## Suggested Route Layout

- /api/auth/*
- /api/consultations
- /api/consultations/:id
- /api/consultations/:id/audio
- /api/consultations/:id/transcribe
- /api/consultations/:id/generate-note
- /api/consultations/:id/edit-note
- /api/consultations/:id/approve
- /api/consultations/:id/export
- /api/consultations/:id/validation
- /api/templates
- /api/exports
- /api/settings

---

## Processing Strategy

### MVP-safe strategy
Use synchronous user-triggered processing for:
- small audio uploads
- transcript generation
- note generation

But architect around a `jobs` table and service abstraction so longer flows can move to background workers later without redesign.

---

## Scalability Readiness

Even in MVP:
- isolate provider adapters
- use job records for long tasks
- keep export and AI work out of client
- keep row-level tenant isolation
- avoid route-handler business logic sprawl
- centralize prompt templates and schema definitions

---

## Security Architecture Essentials

- server-only env access for AI and service-role secrets
- browser only gets public anon key where strictly needed
- storage access via signed URLs
- no audio path leakage in client-rendered tables
- audit every export and approval
- RLS everywhere for tenant data
