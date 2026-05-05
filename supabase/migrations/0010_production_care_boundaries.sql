begin;

alter table public.consultations
  add column if not exists care_protocols text[] not null default '{}'::text[];

update public.organisations
set care_setting = 'care_facility'
where care_setting is null
   or care_setting not in ('care_facility', 'medical_practice');

update public.consultations c
set
  consultation_type = case
    when c.consultation_type = 'sis' or c.specialty = 'Pflege / SIS' then 'sis'
    when o.care_setting = 'medical_practice' then 'medical_consultation'
    else 'care_consultation'
  end,
  specialty = case
    when c.consultation_type = 'sis' or c.specialty = 'Pflege / SIS' then 'Pflege / SIS'
    when o.care_setting = 'medical_practice' then 'Praxis / Medizin'
    else 'Pflegeberatung'
  end,
  care_protocols = case
    when o.care_setting = 'care_facility'
      and c.consultation_type not in ('sis', 'medical_consultation')
      then coalesce(c.care_protocols, '{}'::text[])
    else '{}'::text[]
  end
from public.organisations o
where o.id = c.organisation_id;

alter table public.consultations
  alter column consultation_type set not null,
  alter column care_protocols set default '{}'::text[],
  alter column care_protocols set not null;

alter table public.consultations
  drop constraint if exists consultations_consultation_type_valid,
  add constraint consultations_consultation_type_valid
    check (consultation_type in ('sis', 'care_consultation', 'medical_consultation'));

alter table public.consultations
  drop constraint if exists consultations_care_protocols_valid,
  add constraint consultations_care_protocols_valid
    check (
      care_protocols <@ array[
        'vital_signs',
        'pain',
        'fall',
        'pressure_ulcer_positioning',
        'wound',
        'medication',
        'blood_glucose_insulin',
        'nutrition_hydration',
        'elimination',
        'hygiene',
        'handover',
        'relative_physician_communication',
        'incident'
      ]::text[]
    );

alter table public.consultations
  drop constraint if exists consultations_care_protocols_only_for_care,
  add constraint consultations_care_protocols_only_for_care
    check (consultation_type = 'care_consultation' or cardinality(care_protocols) = 0);

create or replace function public.enforce_consultation_care_boundary()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  org_care_setting text;
begin
  select care_setting
  into org_care_setting
  from public.organisations
  where id = new.organisation_id;

  if org_care_setting is null then
    raise exception 'organisation care setting not found' using errcode = '23503';
  end if;

  if new.consultation_type is null then
    new.consultation_type := case
      when org_care_setting = 'medical_practice' then 'medical_consultation'
      else 'care_consultation'
    end;
  end if;

  new.care_protocols := coalesce(new.care_protocols, '{}'::text[]);

  if org_care_setting = 'medical_practice' and new.consultation_type <> 'medical_consultation' then
    raise exception 'medical practice consultations must use medical_consultation' using errcode = '23514';
  end if;

  if org_care_setting = 'care_facility' and new.consultation_type = 'medical_consultation' then
    raise exception 'care facility consultations cannot use medical_consultation' using errcode = '23514';
  end if;

  if new.consultation_type = 'sis' and org_care_setting <> 'care_facility' then
    raise exception 'SIS consultations are only allowed for care facilities' using errcode = '23514';
  end if;

  if new.consultation_type <> 'care_consultation' and cardinality(new.care_protocols) > 0 then
    raise exception 'care protocols are only allowed for care_consultation' using errcode = '23514';
  end if;

  if new.consultation_type = 'sis' then
    new.specialty := 'Pflege / SIS';
  elsif new.consultation_type = 'care_consultation' then
    new.specialty := 'Pflegeberatung';
  elsif new.consultation_type = 'medical_consultation' then
    new.specialty := 'Praxis / Medizin';
  end if;

  return new;
end;
$$;

drop trigger if exists consultations_enforce_care_boundary on public.consultations;
create trigger consultations_enforce_care_boundary
before insert or update of organisation_id, consultation_type, care_protocols, specialty
on public.consultations
for each row execute function public.enforce_consultation_care_boundary();

commit;
