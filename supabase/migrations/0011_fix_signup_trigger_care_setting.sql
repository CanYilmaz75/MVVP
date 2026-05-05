begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  org_id uuid;
  invite_row public.organisation_invites%rowtype;
  default_plan_id text := 'self_service';
  active_seat_count integer;
  seat_limit integer;
  assigned_status text;
  signup_care_setting text;
begin
  signup_care_setting := case
    when new.raw_user_meta_data->>'care_setting' in ('care_facility', 'medical_practice')
      then new.raw_user_meta_data->>'care_setting'
    else 'care_facility'
  end;

  if coalesce(new.raw_user_meta_data->>'invite_token', '') <> '' then
    select *
    into invite_row
    from public.organisation_invites
    where token_hash = encode(digest(new.raw_user_meta_data->>'invite_token', 'sha256'), 'hex')
      and lower(email) = lower(coalesce(new.email, ''))
      and status = 'pending'
      and expires_at > now()
    limit 1;

    if invite_row.id is not null then
      org_id := invite_row.organisation_id;

      select count(*)::integer
      into active_seat_count
      from public.profiles
      where organisation_id = org_id
        and status = 'active';

      select p.self_service_seat_limit
      into seat_limit
      from public.subscriptions s
      join public.plans p on p.id = s.plan_id
      where s.organisation_id = org_id;

      assigned_status := case
        when seat_limit is not null and active_seat_count >= seat_limit then 'inactive'
        else 'active'
      end;

      insert into public.profiles (id, organisation_id, full_name, role, specialty, status)
      values (
        new.id,
        org_id,
        coalesce(new.raw_user_meta_data->>'full_name', invite_row.full_name, ''),
        invite_row.role,
        coalesce(new.raw_user_meta_data->>'specialty', ''),
        assigned_status
      );

      update public.organisation_invites
      set status = 'accepted', accepted_by = new.id, accepted_at = now()
      where id = invite_row.id;

      if assigned_status = 'active' then
        update public.subscriptions
        set active_seats = active_seat_count + 1
        where organisation_id = org_id;

        insert into public.billing_seat_events (
          organisation_id,
          subscription_id,
          actor_id,
          previous_active_seats,
          new_active_seats,
          reason,
          metadata
        )
        select org_id, s.id, new.id, active_seat_count, active_seat_count + 1, 'member_activated',
          jsonb_build_object('source', 'invite_acceptance', 'inviteId', invite_row.id)
        from public.subscriptions s
        where s.organisation_id = org_id;
      end if;

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
    signup_care_setting
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
  values (org_id, default_plan_id, 'active', 'internal', 1);

  insert into public.billing_seat_events (
    organisation_id,
    subscription_id,
    actor_id,
    previous_active_seats,
    new_active_seats,
    reason,
    metadata
  )
  select org_id, s.id, new.id, 0, 1, 'signup', jsonb_build_object('source', 'handle_new_user')
  from public.subscriptions s
  where s.organisation_id = org_id;

  return new;
end;
$$;

commit;
