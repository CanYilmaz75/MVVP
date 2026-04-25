# CAREVO

CAREVO is a production-minded MVP for ambient clinical documentation. It provides clinician authentication, organisation-scoped consultations, private audio storage, transcription, schema-validated SOAP note drafting, manual and voice-driven note editing, deterministic validation warnings, explicit approval, PDF export, audit logging, and rate limiting.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- Supabase Auth, Postgres, Storage, RLS
- OpenAI transcription and note generation
- Zod validation
- Upstash rate limiting hooks
- Sentry monitoring hooks

## Implemented Core Workflow

1. Clinician signs in with Supabase email/password
2. Clinician creates a consultation
3. Clinician records audio in-browser or uploads an audio file
4. Audio is uploaded to private Supabase storage via signed upload flow
5. Clinician triggers transcription
6. Transcript is converted into a schema-validated SOAP draft note
7. Clinician edits the note manually through structured fields
8. Clinician can upload a short voice instruction clip for note edits
9. Deterministic validation warnings are surfaced
10. Clinician explicitly approves the note
11. Clinician exports approved content to clipboard or PDF

## Project Structure

- `src/app`: pages, layouts, route handlers
- `src/features`: feature-specific client UI
- `src/server`: auth, providers, services, Supabase utilities
- `src/schemas`: Zod schemas for requests and AI outputs
- `src/lib`: env validation, rate limiting, logging, PDF renderer
- `supabase/migrations`: reproducible SQL migration
- `supabase/seed.sql`: baseline seed data

## Environment Setup

Copy `.env.example` to `.env.local` and fill in the required values.

Required for local development:

```env
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

OPENAI_API_KEY=...

UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

ENABLE_VOICE_EDIT=true
ENABLE_ANALYTICS=false
ENABLE_SENTRY=false
```

Optional but supported:

- `SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`
- `PDF_SIGNING_SECRET`

## Local Run

1. Install dependencies:

```bash
npm install
```

2. Apply the migration in your Supabase project using `supabase/migrations/0001_initial.sql`.

3. Optionally run `supabase/seed.sql` to insert a baseline organisation and note template.

4. Create at least one real auth user in Supabase Auth.

5. Start the app:

```bash
npm run dev
```

6. Verify production build:

```bash
npm run build
```

## Supabase Notes

- Buckets created by migration:
  - `consultation-audio`
  - `exported-pdfs`
- Both buckets are private
- RLS is enabled across all tenant tables
- Storage access is restricted by org-prefixed object paths

## Important Product and Safety Behaviors

- All protected routes resolve the authenticated user and organisation
- All mutating API bodies are validated with Zod
- AI note output is parsed, schema-validated, and repaired once before save
- Approved notes are never silently overwritten
- Post-approval edits reset note approval and create a new version
- Export uses stored approved note content, not client-side transient state
- Audio and PDFs are stored privately and accessed by signed URLs
- Critical actions are audited

## Known Operational Assumptions

- OpenAI is used for both transcription and note generation in this MVP
- Voice edit preview currently accepts an uploaded audio clip for instruction transcription
- Pilot onboarding is provisioned through Supabase Auth rather than self-serve signup
- Upstash rate limiting becomes active when its env vars are configured

## Verification Completed

- `npm run typecheck`
- `npm run build`

Both succeeded with placeholder environment values for non-network build validation.
