-- Pilot hardening: role-aware RLS and transactional write helpers.

begin;

create or replace function public.current_user_role()
returns text
language sql
stable
as $$
  select role
  from public.profiles
  where id = auth.uid()
$$;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

-- Replace broad tenant-level "for all" policies with operation-specific policies.
drop policy if exists note_templates_org_all on public.note_templates;
create policy note_templates_select_org
on public.note_templates
for select to authenticated
using (organisation_id = public.current_user_organisation_id());

create policy note_templates_admin_insert
on public.note_templates
for insert to authenticated
with check (organisation_id = public.current_user_organisation_id() and public.current_user_is_admin());

create policy note_templates_admin_update
on public.note_templates
for update to authenticated
using (organisation_id = public.current_user_organisation_id() and public.current_user_is_admin())
with check (organisation_id = public.current_user_organisation_id() and public.current_user_is_admin());

drop policy if exists consultations_org_all on public.consultations;
create policy consultations_select_org
on public.consultations
for select to authenticated
using (organisation_id = public.current_user_organisation_id());

create policy consultations_insert_own_or_admin
on public.consultations
for insert to authenticated
with check (
  organisation_id = public.current_user_organisation_id()
  and (clinician_id = auth.uid() or public.current_user_is_admin())
);

create policy consultations_update_own_or_admin
on public.consultations
for update to authenticated
using (
  organisation_id = public.current_user_organisation_id()
  and (clinician_id = auth.uid() or public.current_user_is_admin())
)
with check (
  organisation_id = public.current_user_organisation_id()
  and (clinician_id = auth.uid() or public.current_user_is_admin())
);

drop policy if exists audio_assets_org_all on public.audio_assets;
create policy audio_assets_select_org
on public.audio_assets
for select to authenticated
using (organisation_id = public.current_user_organisation_id());

create policy audio_assets_insert_own_or_admin
on public.audio_assets
for insert to authenticated
with check (
  organisation_id = public.current_user_organisation_id()
  and (created_by = auth.uid() or public.current_user_is_admin())
);

drop policy if exists transcripts_org_all on public.transcripts;
create policy transcripts_select_org
on public.transcripts
for select to authenticated
using (organisation_id = public.current_user_organisation_id());

create policy transcripts_insert_org
on public.transcripts
for insert to authenticated
with check (organisation_id = public.current_user_organisation_id());

create policy transcripts_update_org
on public.transcripts
for update to authenticated
using (organisation_id = public.current_user_organisation_id())
with check (organisation_id = public.current_user_organisation_id());

drop policy if exists consultation_additional_texts_org_all on public.consultation_additional_texts;
create policy consultation_additional_texts_select_org
on public.consultation_additional_texts
for select to authenticated
using (organisation_id = public.current_user_organisation_id());

create policy consultation_additional_texts_insert_own_or_admin
on public.consultation_additional_texts
for insert to authenticated
with check (
  organisation_id = public.current_user_organisation_id()
  and (created_by = auth.uid() or public.current_user_is_admin())
);

create policy consultation_additional_texts_delete_own_or_admin
on public.consultation_additional_texts
for delete to authenticated
using (
  organisation_id = public.current_user_organisation_id()
  and (created_by = auth.uid() or public.current_user_is_admin())
);

drop policy if exists clinical_notes_org_all on public.clinical_notes;
create policy clinical_notes_select_org
on public.clinical_notes
for select to authenticated
using (organisation_id = public.current_user_organisation_id());

create policy clinical_notes_insert_org
on public.clinical_notes
for insert to authenticated
with check (organisation_id = public.current_user_organisation_id());

create policy clinical_notes_update_org
on public.clinical_notes
for update to authenticated
using (organisation_id = public.current_user_organisation_id())
with check (organisation_id = public.current_user_organisation_id());

drop policy if exists clinical_note_versions_org_all on public.clinical_note_versions;
create policy clinical_note_versions_select_org
on public.clinical_note_versions
for select to authenticated
using (organisation_id = public.current_user_organisation_id());

create policy clinical_note_versions_insert_org
on public.clinical_note_versions
for insert to authenticated
with check (organisation_id = public.current_user_organisation_id());

drop policy if exists note_edits_org_all on public.note_edits;
create policy note_edits_select_org
on public.note_edits
for select to authenticated
using (organisation_id = public.current_user_organisation_id());

create policy note_edits_insert_own_or_admin
on public.note_edits
for insert to authenticated
with check (
  organisation_id = public.current_user_organisation_id()
  and (created_by = auth.uid() or public.current_user_is_admin())
);

drop policy if exists exports_org_all on public.exports;
create policy exports_select_org
on public.exports
for select to authenticated
using (organisation_id = public.current_user_organisation_id());

create policy exports_insert_own_or_admin
on public.exports
for insert to authenticated
with check (
  organisation_id = public.current_user_organisation_id()
  and (created_by = auth.uid() or public.current_user_is_admin())
);

drop policy if exists jobs_org_all on public.jobs;
create policy jobs_select_org
on public.jobs
for select to authenticated
using (organisation_id = public.current_user_organisation_id());

create policy jobs_insert_org
on public.jobs
for insert to authenticated
with check (organisation_id = public.current_user_organisation_id());

create policy jobs_update_org
on public.jobs
for update to authenticated
using (organisation_id = public.current_user_organisation_id())
with check (organisation_id = public.current_user_organisation_id());

create unique index if not exists idx_jobs_idempotency_unique
  on public.jobs (organisation_id, consultation_id, job_type)
  where job_type like 'idempotency:%';

create unique index if not exists idx_jobs_async_unique
  on public.jobs (organisation_id, consultation_id, job_type)
  where job_type like 'async:%';

drop policy if exists feature_flags_org_all on public.feature_flags;
create policy feature_flags_select_org
on public.feature_flags
for select to authenticated
using (organisation_id = public.current_user_organisation_id());

create policy feature_flags_admin_insert
on public.feature_flags
for insert to authenticated
with check (organisation_id = public.current_user_organisation_id() and public.current_user_is_admin());

create policy feature_flags_admin_update
on public.feature_flags
for update to authenticated
using (organisation_id = public.current_user_organisation_id() and public.current_user_is_admin())
with check (organisation_id = public.current_user_organisation_id() and public.current_user_is_admin());

drop policy if exists sis_assessments_org_all on public.sis_assessments;
create policy sis_assessments_select_org
on public.sis_assessments
for select to authenticated
using (organisation_id = public.current_user_organisation_id());

create policy sis_assessments_insert_org
on public.sis_assessments
for insert to authenticated
with check (organisation_id = public.current_user_organisation_id());

create policy sis_assessments_update_org
on public.sis_assessments
for update to authenticated
using (organisation_id = public.current_user_organisation_id())
with check (organisation_id = public.current_user_organisation_id());

drop policy if exists sis_assessment_versions_org_all on public.sis_assessment_versions;
create policy sis_assessment_versions_select_org
on public.sis_assessment_versions
for select to authenticated
using (organisation_id = public.current_user_organisation_id());

create policy sis_assessment_versions_insert_org
on public.sis_assessment_versions
for insert to authenticated
with check (organisation_id = public.current_user_organisation_id());

-- Transactional helper for clinical note upserts and immutable version creation.
create or replace function public.persist_clinical_note_version(
  p_organisation_id uuid,
  p_consultation_id uuid,
  p_note_id uuid,
  p_status text,
  p_structured_json jsonb,
  p_rendered_text text,
  p_change_source text,
  p_created_by uuid,
  p_clear_approval boolean default true
)
returns table (note_id uuid, version_number integer)
language plpgsql
security invoker
as $$
declare
  existing_note record;
begin
  if p_organisation_id <> public.current_user_organisation_id() then
    raise exception 'organisation scope mismatch' using errcode = '42501';
  end if;

  select id, current_version
  into existing_note
  from public.clinical_notes
  where consultation_id = p_consultation_id
    and organisation_id = p_organisation_id
  for update;

  if not found then
    insert into public.clinical_notes (
      organisation_id,
      consultation_id,
      current_version,
      status,
      structured_json,
      rendered_text
    )
    values (
      p_organisation_id,
      p_consultation_id,
      1,
      p_status,
      p_structured_json,
      p_rendered_text
    )
    returning id, current_version into note_id, version_number;
  else
    if existing_note.id <> p_note_id then
      raise exception 'clinical note id mismatch' using errcode = '23514';
    end if;

    version_number := existing_note.current_version + 1;
    note_id := existing_note.id;

    update public.clinical_notes
    set current_version = version_number,
        status = p_status,
        structured_json = p_structured_json,
        rendered_text = p_rendered_text,
        approved_by = case when p_clear_approval then null else approved_by end,
        approved_at = case when p_clear_approval then null else approved_at end
    where id = note_id
      and organisation_id = p_organisation_id;
  end if;

  insert into public.clinical_note_versions (
    organisation_id,
    clinical_note_id,
    version_number,
    structured_json,
    rendered_text,
    change_source,
    created_by
  )
  values (
    p_organisation_id,
    note_id,
    version_number,
    p_structured_json,
    p_rendered_text,
    p_change_source,
    p_created_by
  );

  return next;
end;
$$;

create or replace function public.persist_sis_assessment_version(
  p_organisation_id uuid,
  p_consultation_id uuid,
  p_assessment_id uuid,
  p_structured_json jsonb,
  p_rendered_text text,
  p_source_transcript_id uuid,
  p_change_source text,
  p_actor_id uuid
)
returns table (assessment_id uuid, version_number integer)
language plpgsql
security invoker
as $$
declare
  existing_assessment record;
begin
  if p_organisation_id <> public.current_user_organisation_id() then
    raise exception 'organisation scope mismatch' using errcode = '42501';
  end if;

  select id, current_version
  into existing_assessment
  from public.sis_assessments
  where consultation_id = p_consultation_id
    and organisation_id = p_organisation_id
  for update;

  if not found then
    insert into public.sis_assessments (
      organisation_id,
      consultation_id,
      current_version,
      structured_json,
      rendered_text,
      source_transcript_id,
      created_by,
      updated_by
    )
    values (
      p_organisation_id,
      p_consultation_id,
      1,
      p_structured_json,
      p_rendered_text,
      p_source_transcript_id,
      p_actor_id,
      p_actor_id
    )
    returning id, current_version into assessment_id, version_number;
  else
    if existing_assessment.id <> p_assessment_id then
      raise exception 'sis assessment id mismatch' using errcode = '23514';
    end if;

    assessment_id := existing_assessment.id;
    version_number := existing_assessment.current_version + 1;

    update public.sis_assessments
    set current_version = version_number,
        structured_json = p_structured_json,
        rendered_text = p_rendered_text,
        source_transcript_id = p_source_transcript_id,
        updated_by = p_actor_id
    where id = assessment_id
      and organisation_id = p_organisation_id;
  end if;

  insert into public.sis_assessment_versions (
    organisation_id,
    sis_assessment_id,
    version_number,
    structured_json,
    rendered_text,
    source_transcript_id,
    change_source,
    created_by
  )
  values (
    p_organisation_id,
    assessment_id,
    version_number,
    p_structured_json,
    p_rendered_text,
    p_source_transcript_id,
    p_change_source,
    p_actor_id
  );

  return next;
end;
$$;

commit;
