# ENV_AND_SECRETS_SETUP.md

## Purpose

This document defines the environment configuration, secrets handling, local setup, and deployment configuration for CAREVO.

It exists to reduce ambiguity during implementation and deployment.

This document is binding for:
- local development
- staging deployment
- production deployment
- secret storage
- environment validation

---

## Environment Strategy

Use three environments:

1. local
2. staging
3. production

Do not collapse staging and production into the same environment.

Each environment must have:
- isolated Supabase project or equivalent isolated database/storage setup
- isolated AI usage keys where practical
- isolated monitoring configuration
- separate deployment target

---

## Secret Handling Rules

1. Never commit secrets to git.
2. Never hardcode secrets in source files.
3. Never expose server-only secrets to the client bundle.
4. Validate all required environment variables on application startup.
5. Use separate keys per environment whenever possible.
6. Rotate secrets if exposure is suspected.
7. Limit who has access to production secrets.

---

## Public vs Server-Only Variables

### Public variables
These may be exposed to the frontend only if strictly necessary.

- NEXT_PUBLIC_APP_URL
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_POSTHOG_KEY (optional, only if used safely)
- NEXT_PUBLIC_SENTRY_DSN (client DSN only if configured)

### Server-only variables
These must never be exposed to the client.

- SUPABASE_SERVICE_ROLE_KEY
- OPENAI_API_KEY
- ANTHROPIC_API_KEY
- DEEPGRAM_API_KEY
- SENTRY_AUTH_TOKEN
- SENTRY_DSN_SERVER if separated
- POSTHOG_API_KEY if using server ingestion
- UPSTASH_REDIS_REST_URL
- UPSTASH_REDIS_REST_TOKEN
- PDF_SIGNING_SECRET if used
- INTERNAL_CRON_SECRET if used
- ENCRYPTION_KEY if custom encryption is later added

---

## Required Environment Variables

Create a `.env.local` for local development and environment-managed variables for staging and production.

### Core App
- NODE_ENV
- NEXT_PUBLIC_APP_URL

### Supabase
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

### AI Providers
At least one transcription provider and one LLM provider must be configured.

#### Option A: OpenAI only
- OPENAI_API_KEY

#### Option B: OpenAI + Deepgram
- OPENAI_API_KEY
- DEEPGRAM_API_KEY

#### Option C: Anthropic + Deepgram
- ANTHROPIC_API_KEY
- DEEPGRAM_API_KEY

### Monitoring
- SENTRY_DSN
- SENTRY_AUTH_TOKEN
- NEXT_PUBLIC_SENTRY_DSN

### Analytics
- NEXT_PUBLIC_POSTHOG_KEY
- NEXT_PUBLIC_POSTHOG_HOST

### Rate Limiting
- UPSTASH_REDIS_REST_URL
- UPSTASH_REDIS_REST_TOKEN

### Feature Flags
- ENABLE_VOICE_EDIT=true|false
- ENABLE_ANALYTICS=true|false
- ENABLE_SENTRY=true|false

---

## Example .env.local Template

```env
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_public_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

OPENAI_API_KEY=your_openai_key
DEEPGRAM_API_KEY=your_deepgram_key
ANTHROPIC_API_KEY=

SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=

NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

ENABLE_VOICE_EDIT=true
ENABLE_ANALYTICS=false
ENABLE_SENTRY=false
```

Do not store production values in `.env.local`.

---

## Environment Validation

Implement runtime environment validation with Zod or equivalent.

Create a module such as:
- `src/env.ts`
- `lib/env.ts`

Validation rules:
- required values fail fast on server start
- client-exposed variables validated separately from server variables
- feature flags parsed into booleans safely
- invalid configuration throws explicit startup error

Recommended split:
- `serverEnvSchema`
- `clientEnvSchema`

---

## Supabase Configuration Guidance

### Regions
Use an EU region for staging and production.

### Projects
Use separate Supabase projects for:
- local/dev or shared dev
- staging
- production

### Auth
Enable:
- email/password for MVP
- email confirmation flow depending on rollout policy
- password reset flow

### Storage
Create private buckets:
- consultation-audio
- exported-pdfs

Never use public buckets for these artifacts.

---

## Local Development Setup

### Required tools
- Node.js LTS
- package manager: pnpm or npm
- Supabase CLI if local migrations and local stack are used
- Vercel CLI optional
- git

### Local setup steps
1. clone repository
2. install dependencies
3. create `.env.local`
4. run database migrations
5. seed initial data if needed
6. start app locally
7. verify login page and health of environment validation

### Recommended commands
Use whatever package manager is chosen consistently, for example:

```bash
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

If Supabase local is used:
```bash
supabase start
supabase db reset
```

---

## Staging Setup

Staging must be production-like:
- real auth
- real storage
- real AI provider keys or dedicated low-risk staging keys
- monitoring enabled
- analytics optional
- rate limiting enabled in staging as closely as possible

Use staging to verify:
- uploads
- signed URLs
- AI latency
- export generation
- error tracking

---

## Production Setup

Production requirements:
- secrets managed in deployment platform
- Vercel project variables set per environment
- Supabase production project locked down
- monitoring enabled
- analytics configured safely
- rate limiting enabled
- only approved team members can modify secrets

Recommended:
- enable deployment protection and branch rules
- protect production environment changes

---

## Secret Rotation Guidance

Rotate immediately if:
- secret was committed to git
- secret was shared in plaintext insecurely
- suspicious usage appears in provider dashboard
- developer device compromise is suspected

Rotation order:
1. create new key
2. update environment
3. deploy
4. verify traffic
5. revoke old key

---

## Access Control Guidance

Production secret access should be restricted to:
- technical founder / lead engineer
- designated DevOps owner if any

Do not share production service keys broadly with contractors or non-technical stakeholders.

---

## Sentry Setup Guidance

Enable:
- frontend error reporting
- backend error reporting
- traces on critical pages and API routes if feasible

Do not attach raw transcript or note bodies as Sentry context in production.

Safe metadata examples:
- consultation id
- route
- request id
- org id
- user id
- error code

---

## Analytics Setup Guidance

If using PostHog or equivalent:
Track only safe product events:
- consultation_started
- transcript_ready
- note_generated
- note_approved
- export_completed
- voice_edit_used

Do not send:
- transcript text
- note text
- patient reference
- raw audio metadata beyond safe operational identifiers

---

## Rate Limiting Setup Guidance

Recommended:
- Upstash Redis for simple deployment-compatible rate limiting

Apply to:
- consultation creation
- upload initialization
- transcribe
- generate-note
- edit-note
- approve
- export

Keep limits configurable via environment or central config.

---

## PDF Export Secret/Integrity Guidance

If PDF generation later includes any signing or integrity verification, define:
- PDF_SIGNING_SECRET

For MVP, this may remain unused, but reserve the variable name now for future-safe design.

---

## Recommended Files to Implement

- `.env.example`
- `lib/env.ts`
- `lib/feature-flags.ts`
- `README.md` section for setup
- `vercel.json` if needed
- `sentry.client.config.ts`
- `sentry.server.config.ts`

---

## .env.example Minimum Template

```env
NODE_ENV=
NEXT_PUBLIC_APP_URL=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

OPENAI_API_KEY=
ANTHROPIC_API_KEY=
DEEPGRAM_API_KEY=

SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=

NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

ENABLE_VOICE_EDIT=
ENABLE_ANALYTICS=
ENABLE_SENTRY=
```

---

## Final Requirements

Before calling setup complete, verify:
- environment validation passes locally
- missing required variables fail clearly
- client bundle does not expose server-only secrets
- staging and production variables are separated
- uploads, AI calls, and exports all use proper environment credentials
