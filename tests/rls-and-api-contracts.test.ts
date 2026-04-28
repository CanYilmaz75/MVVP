import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const migration = readFileSync(join(process.cwd(), "supabase/migrations/0005_pilot_hardening.sql"), "utf8");

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
