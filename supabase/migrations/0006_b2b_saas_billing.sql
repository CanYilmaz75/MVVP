-- B2B SaaS: team administration, active-seat billing, and enterprise requests.

begin;

alter table public.organisations
  add column if not exists customer_type text not null default 'self_service'
    check (customer_type in ('self_service', 'enterprise')),
  add column if not exists billing_mode text not null default 'automatic'
    check (billing_mode in ('automatic', 'manual_contract')),
  add column if not exists enterprise_status text not null default 'none'
    check (enterprise_status in ('none', 'requested', 'active'));

alter table public.profiles
  add column if not exists status text not null default 'active'
    check (status in ('active', 'inactive', 'invited'));

create table if not exists public.plans (
  id text primary key,
  name text not null,
  billing_mode text not null default 'automatic'
    check (billing_mode in ('automatic', 'manual_contract')),
  base_price_cents integer not null default 0,
  included_seats integer not null default 1,
  seat_price_cents integer not null default 0,
  self_service_seat_limit integer,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null unique references public.organisations(id) on delete cascade,
  plan_id text not null references public.plans(id) on delete restrict,
  status text not null default 'active'
    check (status in ('trialing', 'active', 'past_due', 'canceled', 'enterprise_pending')),
  billing_provider text not null default 'internal',
  provider_customer_id text,
  provider_subscription_id text,
  active_seats integer not null default 1,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

create index if not exists idx_subscriptions_org
  on public.subscriptions (organisation_id);

create table if not exists public.billing_seat_events (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  previous_active_seats integer not null,
  new_active_seats integer not null,
  reason text not null check (reason in ('signup', 'member_activated', 'member_deactivated', 'sync')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_billing_seat_events_org_created_at
  on public.billing_seat_events (organisation_id, created_at desc);

create table if not exists public.organisation_invites (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'clinician' check (role in ('clinician', 'admin')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  token_hash text not null unique,
  invited_by uuid references public.profiles(id) on delete set null,
  accepted_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger organisation_invites_set_updated_at
before update on public.organisation_invites
for each row execute function public.set_updated_at();

create index if not exists idx_organisation_invites_org_created_at
  on public.organisation_invites (organisation_id, created_at desc);

create unique index if not exists idx_organisation_invites_pending_email_unique
  on public.organisation_invites (organisation_id, lower(email))
  where status = 'pending';

create table if not exists public.enterprise_requests (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  requested_by uuid references public.profiles(id) on delete set null,
  desired_seats integer not null check (desired_seats >= 21),
  contact_name text not null,
  contact_email text not null,
  message text,
  status text not null default 'open' check (status in ('open', 'in_review', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger enterprise_requests_set_updated_at
before update on public.enterprise_requests
for each row execute function public.set_updated_at();

create index if not exists idx_enterprise_requests_org_created_at
  on public.enterprise_requests (organisation_id, created_at desc);

insert into public.plans (id, name, billing_mode, base_price_cents, included_seats, seat_price_cents, self_service_seat_limit)
values
  ('self_service', 'Self-Service', 'automatic', 4900, 1, 3000, 20),
  ('enterprise', 'Enterprise', 'manual_contract', 0, 0, 0, null)
on conflict (id) do update
set name = excluded.name,
    billing_mode = excluded.billing_mode,
    base_price_cents = excluded.base_price_cents,
    included_seats = excluded.included_seats,
    seat_price_cents = excluded.seat_price_cents,
    self_service_seat_limit = excluded.self_service_seat_limit,
    active = true;

insert into public.subscriptions (organisation_id, plan_id, status, billing_provider, active_seats)
select o.id, 'self_service', 'active', 'internal',
  greatest(1, (select count(*)::integer from public.profiles p where p.organisation_id = o.id and p.status = 'active'))
from public.organisations o
where not exists (
  select 1 from public.subscriptions s where s.organisation_id = o.id
);

alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.billing_seat_events enable row level security;
alter table public.organisation_invites enable row level security;
alter table public.enterprise_requests enable row level security;

drop policy if exists plans_select_active on public.plans;
create policy plans_select_active
on public.plans
for select to authenticated
using (active);

drop policy if exists subscriptions_select_org on public.subscriptions;
create policy subscriptions_select_org
on public.subscriptions
for select to authenticated
using (organisation_id = public.current_user_organisation_id());

drop policy if exists subscriptions_admin_insert on public.subscriptions;
create policy subscriptions_admin_insert
on public.subscriptions
for insert to authenticated
with check (organisation_id = public.current_user_organisation_id() and public.current_user_is_admin());

drop policy if exists subscriptions_admin_update on public.subscriptions;
create policy subscriptions_admin_update
on public.subscriptions
for update to authenticated
using (organisation_id = public.current_user_organisation_id() and public.current_user_is_admin())
with check (organisation_id = public.current_user_organisation_id() and public.current_user_is_admin());

drop policy if exists billing_seat_events_select_org on public.billing_seat_events;
create policy billing_seat_events_select_org
on public.billing_seat_events
for select to authenticated
using (organisation_id = public.current_user_organisation_id());

drop policy if exists billing_seat_events_admin_insert on public.billing_seat_events;
create policy billing_seat_events_admin_insert
on public.billing_seat_events
for insert to authenticated
with check (organisation_id = public.current_user_organisation_id() and public.current_user_is_admin());

drop policy if exists organisation_invites_select_org_admin on public.organisation_invites;
create policy organisation_invites_select_org_admin
on public.organisation_invites
for select to authenticated
using (organisation_id = public.current_user_organisation_id() and public.current_user_is_admin());

drop policy if exists organisation_invites_admin_insert on public.organisation_invites;
create policy organisation_invites_admin_insert
on public.organisation_invites
for insert to authenticated
with check (organisation_id = public.current_user_organisation_id() and public.current_user_is_admin());

drop policy if exists organisation_invites_admin_update on public.organisation_invites;
create policy organisation_invites_admin_update
on public.organisation_invites
for update to authenticated
using (organisation_id = public.current_user_organisation_id() and public.current_user_is_admin())
with check (organisation_id = public.current_user_organisation_id() and public.current_user_is_admin());

drop policy if exists enterprise_requests_select_org_admin on public.enterprise_requests;
create policy enterprise_requests_select_org_admin
on public.enterprise_requests
for select to authenticated
using (organisation_id = public.current_user_organisation_id() and public.current_user_is_admin());

drop policy if exists enterprise_requests_admin_insert on public.enterprise_requests;
create policy enterprise_requests_admin_insert
on public.enterprise_requests
for insert to authenticated
with check (organisation_id = public.current_user_organisation_id() and public.current_user_is_admin());

drop policy if exists enterprise_requests_admin_update on public.enterprise_requests;
create policy enterprise_requests_admin_update
on public.enterprise_requests
for update to authenticated
using (organisation_id = public.current_user_organisation_id() and public.current_user_is_admin())
with check (organisation_id = public.current_user_organisation_id() and public.current_user_is_admin());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid() and organisation_id = public.current_user_organisation_id());

drop policy if exists profiles_admin_update_org on public.profiles;
create policy profiles_admin_update_org
on public.profiles
for update to authenticated
using (organisation_id = public.current_user_organisation_id() and public.current_user_is_admin())
with check (organisation_id = public.current_user_organisation_id() and public.current_user_is_admin());

drop policy if exists organisations_admin_update_own on public.organisations;
create policy organisations_admin_update_own
on public.organisations
for update to authenticated
using (id = public.current_user_organisation_id() and public.current_user_is_admin())
with check (id = public.current_user_organisation_id() and public.current_user_is_admin());

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
begin
  if coalesce(new.raw_user_meta_data->>'invite_token', '') <> '' then
    select *
    into invite_row
    from public.organisation_invites
    where token_hash = encode(digest(new.raw_user_meta_data->>'invite_token', 'sha256'), 'hex')
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

  insert into public.organisations (name, slug, customer_type, billing_mode, enterprise_status)
  values (
    coalesce(new.raw_user_meta_data->>'organisation_name', 'Default Organisation'),
    lower(replace(split_part(coalesce(new.email, gen_random_uuid()::text), '@', 1), '.', '-')) || '-' || substr(new.id::text, 1, 8),
    'self_service',
    'automatic',
    'none'
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
