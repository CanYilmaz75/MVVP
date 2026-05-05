begin;

alter table public.organisations
  add column if not exists care_setting text not null default 'care_facility'
    check (care_setting in ('care_facility', 'medical_practice'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  org_id uuid;
  invite_row public.organisation_invites%rowtype;
  active_seats integer;
  self_service_limit integer;
begin
  if new.raw_user_meta_data ? 'invite_token' then
    select *
    into invite_row
    from public.organisation_invites
    where token = new.raw_user_meta_data->>'invite_token'
      and lower(email) = lower(coalesce(new.email, ''))
      and status = 'pending'
      and expires_at > now()
    limit 1;

    if invite_row.id is not null then
      org_id := invite_row.organisation_id;

      select count(*)::integer
      into active_seats
      from public.profiles
      where organisation_id = org_id
        and status = 'active';

      select p.self_service_seat_limit
      into self_service_limit
      from public.subscriptions s
      join public.plans p on p.id = s.plan_id
      join public.organisations o on o.id = s.organisation_id
      where s.organisation_id = org_id
        and o.customer_type = 'self_service'
      limit 1;

      if self_service_limit is not null and active_seats >= self_service_limit then
        raise exception 'self-service seat limit reached' using errcode = 'P0001';
      end if;

      insert into public.profiles (id, organisation_id, full_name, role, specialty, status)
      values (
        new.id,
        org_id,
        coalesce(new.raw_user_meta_data->>'full_name', ''),
        invite_row.role,
        coalesce(new.raw_user_meta_data->>'specialty', invite_row.specialty, ''),
        'active'
      );

      update public.organisation_invites
      set status = 'accepted', accepted_at = now()
      where id = invite_row.id;

      update public.subscriptions
      set active_seats = greatest(active_seats, (
        select count(*)::integer
        from public.profiles
        where organisation_id = org_id
          and status = 'active'
      ))
      where organisation_id = org_id;

      insert into public.billing_seat_events (organisation_id, event_type, active_seats, metadata)
      values (
        org_id,
        'seat_added',
        (select count(*)::integer from public.profiles where organisation_id = org_id and status = 'active'),
        jsonb_build_object('source', 'invite_signup')
      );

      return new;
    end if;
  end if;

  insert into public.organisations (name, slug, customer_type, billing_mode, enterprise_status, care_setting)
  values (
    coalesce(new.raw_user_meta_data->>'organisation_name', 'Default Organisation'),
    lower(replace(split_part(coalesce(new.email, gen_random_uuid()::text), '@', 1), '.', '-')) || '-' || substr(new.id::text, 1, 8),
    'self_service',
    'automatic',
    'none',
    case
      when new.raw_user_meta_data->>'care_setting' in ('care_facility', 'medical_practice')
        then new.raw_user_meta_data->>'care_setting'
      else 'care_facility'
    end
  )
  returning id into org_id;

  insert into public.profiles (id, organisation_id, full_name, role, specialty, status)
  values (
    new.id,
    org_id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'admin',
    coalesce(new.raw_user_meta_data->>'specialty', ''),
    'active'
  );

  insert into public.subscriptions (organisation_id, plan_id, status, billing_provider, active_seats)
  values (org_id, 'starter', 'active', 'internal', 1)
  on conflict (organisation_id) do nothing;

  insert into public.billing_seat_events (organisation_id, event_type, active_seats, metadata)
  values (org_id, 'seat_added', 1, jsonb_build_object('source', 'self_service_signup'));

  return new;
end;
$$;

commit;
