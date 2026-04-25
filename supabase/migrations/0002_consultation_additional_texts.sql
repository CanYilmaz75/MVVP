begin;

create table if not exists public.consultation_additional_texts (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  consultation_id uuid not null references public.consultations(id) on delete cascade,
  title text not null,
  content text not null,
  source_type text not null default 'additional_text' check (
    source_type in ('additional_text', 'previous_note', 'intake_form', 'chat')
  ),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists idx_consultation_additional_texts_consultation_id
  on public.consultation_additional_texts (consultation_id, created_at desc);

alter table public.consultation_additional_texts enable row level security;

drop policy if exists consultation_additional_texts_org_all on public.consultation_additional_texts;
create policy consultation_additional_texts_org_all
on public.consultation_additional_texts
for all to authenticated
using (organisation_id = public.current_user_organisation_id())
with check (organisation_id = public.current_user_organisation_id());

commit;
