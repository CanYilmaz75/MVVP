import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const migration = readFileSync(join(process.cwd(), "supabase/migrations/0005_pilot_hardening.sql"), "utf8");
const b2bMigration = readFileSync(join(process.cwd(), "supabase/migrations/0006_b2b_saas_billing.sql"), "utf8");
const productionCareBoundaryMigration = readFileSync(
  join(process.cwd(), "supabase/migrations/0010_production_care_boundaries.sql"),
  "utf8"
);
const signupTriggerFixMigration = readFileSync(
  join(process.cwd(), "supabase/migrations/0011_fix_signup_trigger_care_setting.sql"),
  "utf8"
);

test("pilot RLS migration removes broad tenant all-policies for high-risk tables", () => {
  for (const policyName of [
    "consultations_org_all",
    "audio_assets_org_all",
    "transcripts_org_all",
    "clinical_notes_org_all",
    "clinical_note_versions_org_all",
    "jobs_org_all",
    "feature_flags_org_all",
    "sis_assessments_org_all"
  ]) {
    assert.match(migration, new RegExp(`drop policy if exists ${policyName}`));
  }
});

test("pilot RLS migration introduces role-aware admin controls", () => {
  assert.match(migration, /current_user_is_admin/);
  assert.match(migration, /note_templates_admin_insert/);
  assert.match(migration, /feature_flags_admin_update/);
  assert.match(migration, /consultations_insert_own_or_admin/);
});

test("critical write chains have transactional database helpers", () => {
  assert.match(migration, /create or replace function public\.persist_clinical_note_version/);
  assert.match(migration, /for update/);
  assert.match(migration, /insert into public\.clinical_note_versions/);
  assert.match(migration, /create or replace function public\.persist_sis_assessment_version/);
  assert.match(migration, /insert into public\.sis_assessment_versions/);
});

test("idempotent async jobs are protected by a database uniqueness constraint", () => {
  assert.match(migration, /idx_jobs_async_unique/);
  assert.match(migration, /where job_type like 'async:%'/);
});

test("b2b SaaS migration adds billing and team administration tables", () => {
  for (const tableName of [
    "plans",
    "subscriptions",
    "billing_seat_events",
    "organisation_invites",
    "enterprise_requests"
  ]) {
    assert.match(b2bMigration, new RegExp(`create table if not exists public\\.${tableName}`));
    assert.match(b2bMigration, new RegExp(`alter table public\\.${tableName} enable row level security`));
  }

  assert.match(b2bMigration, /add column if not exists status text not null default 'active'/);
  assert.match(b2bMigration, /self_service_seat_limit/);
});

test("b2b SaaS migration protects team and billing writes with admin policies", () => {
  assert.match(b2bMigration, /organisation_invites_admin_insert/);
  assert.match(b2bMigration, /enterprise_requests_admin_insert/);
  assert.match(b2bMigration, /subscriptions_admin_insert/);
  assert.match(b2bMigration, /billing_seat_events_admin_insert/);
  assert.match(b2bMigration, /profiles_admin_update_org/);
  assert.match(b2bMigration, /current_user_is_admin\(\)/);
});

test("b2b SaaS signup trigger handles invites and creates first-admin subscriptions", () => {
  assert.match(b2bMigration, /new\.raw_user_meta_data->>'invite_token'/);
  assert.match(b2bMigration, /status = 'accepted'/);
  assert.match(b2bMigration, /active_seat_count >= seat_limit/);
  assert.match(b2bMigration, /'admin'/);
  assert.match(b2bMigration, /insert into public\.subscriptions/);
  assert.match(b2bMigration, /insert into public\.billing_seat_events/);
});

test("production care boundaries are enforced in the database", () => {
  assert.match(productionCareBoundaryMigration, /consultations_consultation_type_valid/);
  assert.match(productionCareBoundaryMigration, /consultations_care_protocols_valid/);
  assert.match(productionCareBoundaryMigration, /consultations_care_protocols_only_for_care/);
  assert.match(productionCareBoundaryMigration, /enforce_consultation_care_boundary/);
  assert.match(productionCareBoundaryMigration, /medical_practice' and new\.consultation_type <> 'medical_consultation'/);
  assert.match(productionCareBoundaryMigration, /care_facility' and new\.consultation_type = 'medical_consultation'/);
  assert.match(productionCareBoundaryMigration, /care protocols are only allowed for care_consultation/);
});

test("signup trigger fix preserves billing schema and adds care setting", () => {
  assert.match(signupTriggerFixMigration, /create or replace function public\.handle_new_user/);
  assert.match(signupTriggerFixMigration, /token_hash = encode\(digest/);
  assert.match(signupTriggerFixMigration, /previous_active_seats/);
  assert.match(signupTriggerFixMigration, /new_active_seats/);
  assert.match(signupTriggerFixMigration, /reason/);
  assert.match(signupTriggerFixMigration, /care_setting/);
  assert.doesNotMatch(signupTriggerFixMigration, /event_type/);
  assert.doesNotMatch(signupTriggerFixMigration, /where token =/);
});
