# 06_IMPLEMENTATION_RUNBOOK.md

## Goal

Execute the build in a practical order so the final system works end to end without architectural drift.

---

## Step 1 – Initialize the project

- create Next.js app with TypeScript and App Router
- install Tailwind
- install ShadCN UI
- install Zustand
- install Zod
- install React Hook Form
- install Supabase client packages
- install Sentry SDK
- install PDF generation library
- install optional rate-limit package / Upstash client
- create folder conventions:
  - app
  - components
  - features
  - lib
  - services
  - server
  - types

---

## Step 2 – Establish core infra

- add env typing
- add Supabase server and browser clients
- add auth middleware / protected route logic
- add app shell
- add logging utility
- add error utilities
- add common API response helpers

---

## Step 3 – Create database schema and RLS

- write migrations for all tables
- enable RLS
- add policies
- add indexes
- add updated_at triggers
- seed one organisation, one clinician, one template for local demo if needed

---

## Step 4 – Build frontend shell and pages

- login
- dashboard
- consultations list
- new consultation page
- consultation workspace
- templates
- exports
- settings

Do not connect every component immediately. First get page structure stable.

---

## Step 5 – Build consultation APIs

- create consultation
- get consultation workspace aggregate
- upload audio
- transcribe
- generate note
- edit note
- approve note
- export note
- fetch warnings

Add Zod validation to every route.

---

## Step 6 – Build domain services

- consultation service
- audio service
- transcription provider adapter
- note generation adapter
- note renderer
- validation engine
- export service
- audit logger

Keep route handlers thin.

---

## Step 7 – Wire UI to backend

- create start consultation flow
- connect recording/upload
- connect transcript generation
- connect note generation
- connect manual section editing
- connect voice edit
- connect approval
- connect export

---

## Step 8 – Add safety and observability

- Sentry integration
- structured logs
- audit logs
- analytics for non-sensitive usage events
- rate limiting on expensive routes

---

## Step 9 – Add QA fixtures

Create seeded test consultations:
- successful transcript and note
- transcript failure
- note generation failure
- warnings-heavy note
- approved note with export

---

## Step 10 – Final hardening

- route error boundaries
- loading states
- retries
- form validation
- signed URL TTL verification
- production build test
- local readme for running

---

## Local Development Requirements

Document:
- required env vars
- how to run migrations
- how to seed demo data
- how to start dev server
- how to test export flow
- how to simulate AI provider errors

---

## Pre-Launch Checks

- protected route behavior works
- no server-only env leaks to client
- no public storage exposure
- note approval required before official PDF export
- audit entries written for critical events
- rate limiting verified
- all core pages load without runtime errors
