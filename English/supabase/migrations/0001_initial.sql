-- CAREVO MVP initial schema.
-- Derived from SUPABASE_SQL_MIGRATIONS.sql and extended with private storage setup.

begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organisation_id uuid not null references public.organisations(id) on delete restrict,
  full_name text,
  role text not null default 'clinician' check (role in ('clinician', 'admin')),
  specialty text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table if not exists public.note_templates (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  name text not null,
  specialty text not null,
  note_type text not null default 'SOAP',
  schema_version text not null default '1.0',
  template_definition jsonb not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger note_templates_set_updated_at
before update on public.note_templates
for each row execute function public.set_updated_at();

create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  clinician_id uuid not null references public.profiles(id) on delete restrict,
  patient_reference text not null,
  specialty text not null,
  spoken_language text not null,
  note_template_id uuid references public.note_templates(id) on delete set null,
  consultation_type text,
  status text not null check (
    status in (
      'created',
      'recording',
      'audio_uploaded',
      'transcribing',
      'transcript_ready',
      'note_generating',
      'draft_ready',
      'approved',
      'exported',
      'failed'
    )
  ) default 'created',
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger consultations_set_updated_at
before update on public.consultations
for each row execute function public.set_updated_at();

create index if not exists idx_consultations_org_created_at
  on public.consultations (organisation_id, created_at desc);

create index if not exists idx_consultations_clinician_created_at
  on public.consultations (clinician_id, created_at desc);

create table if not exists public.audio_assets (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  consultation_id uuid not null references public.consultations(id) on delete cascade,
  storage_path text not null,
  mime_type text not null,
  duration_seconds integer,
  file_size_bytes bigint,
  source text not null check (source in ('browser_recording', 'upload', 'voice_edit')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists idx_audio_assets_consultation_id
  on public.audio_assets (consultation_id);

create table if not exists public.transcripts (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  consultation_id uuid not null references public.consultations(id) on delete cascade,
  audio_asset_id uuid not null references public.audio_assets(id) on delete cascade,
  provider text not null,
  detected_language text,
  raw_text text not null,
  confidence numeric,
  status text not null check (status in ('queued', 'processing', 'ready', 'failed')) default 'queued',
  created_at timestamptz not null default now()
);

create index if not exists idx_transcripts_consultation_id
  on public.transcripts (consultation_id);

create table if not exists public.transcript_segments (
  id uuid primary key default gen_random_uuid(),
  transcript_id uuid not null references public.transcripts(id) on delete cascade,
  speaker_label text,
  start_ms integer,
  end_ms integer,
  text text not null,
  segment_index integer not null
);

create index if not exists idx_transcript_segments_transcript_id
  on public.transcript_segments (transcript_id, segment_index);

create table if not exists public.clinical_notes (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  consultation_id uuid not null unique references public.consultations(id) on delete cascade,
  current_version integer not null default 1,
  status text not null check (status in ('not_started', 'generating', 'draft', 'edited', 'approved', 'failed')) default 'not_started',
  structured_json jsonb not null,
  rendered_text text not null,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger clinical_notes_set_updated_at
before update on public.clinical_notes
for each row execute function public.set_updated_at();

create index if not exists idx_clinical_notes_consultation_id
  on public.clinical_notes (consultation_id);

create table if not exists public.clinical_note_versions (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  clinical_note_id uuid not null references public.clinical_notes(id) on delete cascade,
  version_number integer not null,
  structured_json jsonb not null,
  rendered_text text not null,
  change_source text not null check (
    change_source in ('generation', 'manual_edit', 'voice_edit', 'regeneration', 'post_approval_edit')
  ),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (clinical_note_id, version_number)
);

create index if not exists idx_clinical_note_versions_note_id
  on public.clinical_note_versions (clinical_note_id, version_number desc);

create table if not exists public.note_edits (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  clinical_note_id uuid not null references public.clinical_notes(id) on delete cascade,
  instruction_text text not null,
  instruction_source text not null check (instruction_source in ('voice', 'manual')),
  result_summary text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists idx_note_edits_note_id
  on public.note_edits (clinical_note_id, created_at desc);

create table if not exists public.exports (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  consultation_id uuid not null references public.consultations(id) on delete cascade,
  clinical_note_id uuid not null references public.clinical_notes(id) on delete cascade,
  note_version_number integer not null,
  export_type text not null check (export_type in ('pdf', 'clipboard')),
  storage_path text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists idx_exports_consultation_id
  on public.exports (consultation_id, created_at desc);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_org_created_at
  on public.audit_logs (organisation_id, created_at desc);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  consultation_id uuid references public.consultations(id) on delete set null,
  job_type text not null,
  status text not null check (status in ('queued', 'processing', 'completed', 'failed')) default 'queued',
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  error_message text,
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger jobs_set_updated_at
before update on public.jobs
for each row execute function public.set_updated_at();

create index if not exists idx_jobs_consultation_id
  on public.jobs (consultation_id, created_at desc);

create table if not exists public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  key text not null,
  enabled boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, key)
);

create trigger feature_flags_set_updated_at
before update on public.feature_flags
for each row execute function public.set_updated_at();

create or replace function public.current_user_organisation_id()
returns uuid
language sql
stable
as $$
  select organisation_id
  from public.profiles
  where id = auth.uid()
$$;

alter table public.organisations enable row level security;
alter table public.profiles enable row level security;
alter table public.note_templates enable row level security;
alter table public.consultations enable row level security;
alter table public.audio_assets enable row level security;
alter table public.transcripts enable row level security;
alter table public.transcript_segments enable row level security;
alter table public.clinical_notes enable row level security;
alter table public.clinical_note_versions enable row level security;
alter table public.note_edits enable row level security;
alter table public.exports enable row level security;
alter table public.audit_logs enable row level security;
alter table public.jobs enable row level security;
alter table public.feature_flags enable row level security;

drop policy if exists organisations_select_own on public.organisations;
create policy organisations_select_own
on public.organisations
for select to authenticated
using (id = public.current_user_organisation_id());

drop policy if exists profiles_select_own_org on public.profiles;
create policy profiles_select_own_org
on public.profiles
for select to authenticated
using (organisation_id = public.current_user_organisation_id());

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self
on public.profiles
for insert to authenticated
with check (id = auth.uid() and organisation_id = public.current_user_organisation_id());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid() and organisation_id = public.current_user_organisation_id());

drop policy if exists note_templates_org_all on public.note_templates;
create policy note_templates_org_all
on public.note_templates
for all to authenticated
using (organisation_id = public.current_user_organisation_id())
with check (organisation_id = public.current_user_organisation_id());

drop policy if exists consultations_org_all on public.consultations;
create policy consultations_org_all
on public.consultations
for all to authenticated
using (organisation_id = public.current_user_organisation_id())
with check (organisation_id = public.current_user_organisation_id());

drop policy if exists audio_assets_org_all on public.audio_assets;
create policy audio_assets_org_all
on public.audio_assets
for all to authenticated
using (organisation_id = public.current_user_organisation_id())
with check (organisation_id = public.current_user_organisation_id());

drop policy if exists transcripts_org_all on public.transcripts;
create policy transcripts_org_all
on public.transcripts
for all to authenticated
using (organisation_id = public.current_user_organisation_id())
with check (organisation_id = public.current_user_organisation_id());

drop policy if exists transcript_segments_select_by_org on public.transcript_segments;
create policy transcript_segments_select_by_org
on public.transcript_segments
for select to authenticated
using (
  exists (
    select 1
    from public.transcripts t
    where t.id = transcript_segments.transcript_id
      and t.organisation_id = public.current_user_organisation_id()
  )
);

drop policy if exists transcript_segments_insert_by_org on public.transcript_segments;
create policy transcript_segments_insert_by_org
on public.transcript_segments
for insert to authenticated
with check (
  exists (
    select 1
    from public.transcripts t
    where t.id = transcript_segments.transcript_id
      and t.organisation_id = public.current_user_organisation_id()
  )
);

drop policy if exists clinical_notes_org_all on public.clinical_notes;
create policy clinical_notes_org_all
on public.clinical_notes
for all to authenticated
using (organisation_id = public.current_user_organisation_id())
with check (organisation_id = public.current_user_organisation_id());

drop policy if exists clinical_note_versions_org_all on public.clinical_note_versions;
create policy clinical_note_versions_org_all
on public.clinical_note_versions
for all to authenticated
using (organisation_id = public.current_user_organisation_id())
with check (organisation_id = public.current_user_organisation_id());

drop policy if exists note_edits_org_all on public.note_edits;
create policy note_edits_org_all
on public.note_edits
for all to authenticated
using (organisation_id = public.current_user_organisation_id())
with check (organisation_id = public.current_user_organisation_id());

drop policy if exists exports_org_all on public.exports;
create policy exports_org_all
on public.exports
for all to authenticated
using (organisation_id = public.current_user_organisation_id())
with check (organisation_id = public.current_user_organisation_id());

drop policy if exists audit_logs_org_select_insert on public.audit_logs;
create policy audit_logs_org_select_insert
on public.audit_logs
for select to authenticated
using (organisation_id = public.current_user_organisation_id());

drop policy if exists audit_logs_org_insert on public.audit_logs;
create policy audit_logs_org_insert
on public.audit_logs
for insert to authenticated
with check (organisation_id = public.current_user_organisation_id());

drop policy if exists jobs_org_all on public.jobs;
create policy jobs_org_all
on public.jobs
for all to authenticated
using (organisation_id = public.current_user_organisation_id())
with check (organisation_id = public.current_user_organisation_id());

drop policy if exists feature_flags_org_all on public.feature_flags;
create policy feature_flags_org_all
on public.feature_flags
for all to authenticated
using (organisation_id = public.current_user_organisation_id())
with check (organisation_id = public.current_user_organisation_id());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('consultation-audio', 'consultation-audio', false, 52428800, array['audio/webm', 'audio/wav', 'audio/mpeg', 'audio/mp4']),
  ('exported-pdfs', 'exported-pdfs', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;

drop policy if exists storage_objects_org_read_audio on storage.objects;
create policy storage_objects_org_read_audio
on storage.objects
for select to authenticated
using (
  bucket_id in ('consultation-audio', 'exported-pdfs')
  and split_part(name, '/', 1) = public.current_user_organisation_id()::text
);

drop policy if exists storage_objects_org_insert_audio on storage.objects;
create policy storage_objects_org_insert_audio
on storage.objects
for insert to authenticated
with check (
  bucket_id in ('consultation-audio', 'exported-pdfs')
  and split_part(name, '/', 1) = public.current_user_organisation_id()::text
);

drop policy if exists storage_objects_org_update_audio on storage.objects;
create policy storage_objects_org_update_audio
on storage.objects
for update to authenticated
using (
  bucket_id in ('consultation-audio', 'exported-pdfs')
  and split_part(name, '/', 1) = public.current_user_organisation_id()::text
)
with check (
  bucket_id in ('consultation-audio', 'exported-pdfs')
  and split_part(name, '/', 1) = public.current_user_organisation_id()::text
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  org_id uuid;
begin
  insert into public.organisations (name, slug)
  values (
    coalesce(new.raw_user_meta_data->>'organisation_name', 'Default Organisation'),
    lower(replace(split_part(coalesce(new.email, gen_random_uuid()::text), '@', 1), '.', '-')) || '-' || substr(new.id::text, 1, 8)
  )
  returning id into org_id;

  insert into public.profiles (id, organisation_id, full_name, role, specialty)
  values (
    new.id,
    org_id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'clinician'),
    coalesce(new.raw_user_meta_data->>'specialty', '')
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

commit;
