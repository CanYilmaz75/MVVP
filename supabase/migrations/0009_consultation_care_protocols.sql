begin;

alter table public.consultations
  add column if not exists care_protocols text[] not null default '{}'::text[];

commit;
