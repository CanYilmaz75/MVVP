# Supplier Assessment

Status: operational draft  
Last reviewed: 2026-04-28

## Supplier Register

| Supplier | Role | Data processed | Current technical use | DPA/AVV status | Transfer status | Risk | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Supabase | Auth, Postgres, storage, RLS, server/client SDK | User profiles, tenant data, audio metadata, transcripts, notes, exports, audit logs, files | `src/server/supabase/*`, migrations, storage buckets | TBD | TBD | High | Open |
| OpenAI | AI transcription and JSON generation | Audio bytes, transcripts, prompts, generated draft notes, voice instructions | `src/server/providers/openai.ts`, `clinical-ai-provider.ts` | TBD | TBD | Critical | Open |
| Sentry | Error and performance monitoring | Error metadata, route/context data; should not contain health data | `sentry.server.config.ts`, `sentry.client.config.ts` | TBD | TBD | Medium-High | Open |
| Upstash Redis | Rate limiting | Rate-limit identifiers based on organisation/user/consultation IDs | `src/lib/rate-limit.ts` | TBD | TBD | Medium | Open |
| Vercel or hosting provider | App hosting | Request metadata, environment variables, potentially application traffic | Not explicit in repo | TBD | TBD | High | Open |

## Required Supplier Checks

For every supplier:

- [ ] Contract owner assigned.
- [ ] DPA/AVV signed where supplier processes personal data.
- [ ] Subprocessor list reviewed.
- [ ] International transfer mechanism reviewed, including SCC/TIA if applicable.
- [ ] Security documentation reviewed.
- [ ] Data retention and deletion terms reviewed.
- [ ] Support and incident notification terms reviewed.
- [ ] Exit plan documented.
- [ ] Supplier risk accepted by accountable owner.

## Supplier-Specific Notes

### Supabase

Relevant controls in CAREVO:

- RLS policies for tenant isolation.
- Private storage buckets for `consultation-audio` and `exported-pdfs`.
- Organisation-scoped paths for storage objects.
- Server-side admin client use for privileged operations.

Open questions:

- Hosting region and data residency.
- DPA/AVV and subprocessor list.
- Backup retention.
- Storage deletion guarantees.
- Production access controls for admins.

### OpenAI

Relevant controls in CAREVO:

- Central provider adapter.
- Explicit model declarations for text and transcription.
- JSON schema response format for note generation.
- Feature flags and rate limits around AI routes.

Open questions:

- DPA/AVV status for health data.
- Whether submitted data is retained, logged, or used for training under the selected plan.
- Region, transfer mechanism, and subprocessors.
- Incident notification terms.
- Model change notification and evaluation plan.

### Sentry

Relevant controls in CAREVO:

- Sentry is feature-gated by environment.
- Architecture guidance says raw transcripts and note bodies must not be attached.

Open questions:

- Scrubbing configuration.
- Whether request bodies are captured anywhere.
- DPA/AVV and data residency.
- Retention period for events.

### Upstash

Relevant controls in CAREVO:

- Used for rate limiting only.
- Analytics disabled in rate limiter.

Open questions:

- Whether identifiers are personal data in context.
- Retention and region.
- DPA/AVV status.

## Approval

Production use with real health data requires approval from:

- Data Protection Lead.
- Security Lead.
- AI System Owner for AI suppliers.
- Management Representative for critical-risk suppliers.
