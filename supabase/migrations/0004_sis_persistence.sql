begin;

create table if not exists public.sis_assessments (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  consultation_id uuid not null unique references public.consultations(id) on delete cascade,
  current_version integer not null default 1,
  structured_json jsonb not null,
  rendered_text text not null,
  source_transcript_id uuid references public.transcripts(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger sis_assessments_set_updated_at
before update on public.sis_assessments
for each row execute function public.set_updated_at();

create index if not exists idx_sis_assessments_consultation_id
  on public.sis_assessments (consultation_id);

create table if not exists public.sis_assessment_versions (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  sis_assessment_id uuid not null references public.sis_assessments(id) on delete cascade,
  version_number integer not null,
  structured_json jsonb not null,
  rendered_text text not null,
  source_transcript_id uuid references public.transcripts(id) on delete set null,
  change_source text not null check (change_source in ('extraction', 'manual_edit', 'regeneration')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (sis_assessment_id, version_number)
);

create index if not exists idx_sis_assessment_versions_assessment_id
  on public.sis_assessment_versions (sis_assessment_id, version_number desc);

alter table public.sis_assessments enable row level security;
alter table public.sis_assessment_versions enable row level security;

drop policy if exists sis_assessments_org_all on public.sis_assessments;
create policy sis_assessments_org_all
on public.sis_assessments
for all to authenticated
using (organisation_id = public.current_user_organisation_id())
with check (organisation_id = public.current_user_organisation_id());

drop policy if exists sis_assessment_versions_org_all on public.sis_assessment_versions;
create policy sis_assessment_versions_org_all
on public.sis_assessment_versions
for all to authenticated
using (organisation_id = public.current_user_organisation_id())
with check (organisation_id = public.current_user_organisation_id());

commit;
