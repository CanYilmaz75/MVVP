-- Run after the initial migration in a local or staging environment.
-- Replace the auth user id with a real seeded auth.users id if not using the signup trigger.

insert into public.organisations (id, name, slug)
values ('11111111-1111-1111-1111-111111111111', 'CAREVO Pilot Clinic', 'carevo-pilot-clinic')
on conflict (id) do nothing;

insert into public.note_templates (
  id,
  organisation_id,
  name,
  specialty,
  note_type,
  schema_version,
  template_definition
)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'SOAP General Medicine',
  'General Medicine',
  'SOAP',
  '1.0',
  '{
    "noteType": "SOAP",
    "sections": ["subjective", "objective", "assessment", "plan"]
  }'::jsonb
)
on conflict (id) do nothing;
