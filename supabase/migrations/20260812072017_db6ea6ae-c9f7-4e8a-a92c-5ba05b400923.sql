-- ENUMS
create type public.app_role as enum ('super_admin','company_admin','agent','employee');
create type public.ticket_priority as enum ('urgent','medium','normal');
create type public.ticket_status as enum ('open','progress','resolved','closed');

-- UPDATED_AT HELPER
create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- COMPANIES
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text not null default '',
  logo_url text,
  primary_color text not null default '#2563eb',
  secondary_color text not null default '#0f766e',
  plan text not null default 'trial',
  is_active boolean not null default true,
  subscription_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.companies to authenticated;
grant all on public.companies to service_role;
alter table public.companies enable row level security;

-- PROFILES
create table public.profiles (
  id uuid primary key,
  company_id uuid references public.companies(id) on delete set null,
  full_name text not null default '',
  email text not null default '',
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- USER ROLES
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  company_id uuid references public.companies(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role, company_id)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

-- SECURITY DEFINER HELPERS
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

create or replace function public.is_super_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = 'super_admin');
$$;

create or replace function public.current_company_id()
returns uuid language sql stable security definer set search_path = public as $$
  select company_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_company_admin(_user_id uuid, _company_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = 'company_admin' and company_id = _company_id
  );
$$;

-- BRANCHES
create table public.branches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.branches to authenticated;
grant all on public.branches to service_role;
alter table public.branches enable row level security;

-- TICKETS
create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  ticket_no text not null unique,
  title text not null,
  description text not null default '',
  branch text not null default '',
  priority public.ticket_priority not null default 'normal',
  status public.ticket_status not null default 'open',
  requester_name text not null default '',
  requester_email text,
  requester_phone text,
  created_by uuid,
  assignee_id uuid,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tickets_company_idx on public.tickets(company_id);
grant select, insert, update, delete on public.tickets to authenticated;
grant all on public.tickets to service_role;
alter table public.tickets enable row level security;

-- TICKET UPDATES
create table public.ticket_updates (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  author_id uuid,
  author_name text not null default '',
  note text not null default '',
  status public.ticket_status,
  created_at timestamptz not null default now()
);
create index ticket_updates_ticket_idx on public.ticket_updates(ticket_id);
grant select, insert, update, delete on public.ticket_updates to authenticated;
grant all on public.ticket_updates to service_role;
alter table public.ticket_updates enable row level security;

-- POLICIES: companies
create policy "super admin manages companies" on public.companies for all to authenticated
  using (public.is_super_admin(auth.uid())) with check (public.is_super_admin(auth.uid()));
create policy "members read own company" on public.companies for select to authenticated
  using (id = public.current_company_id());
create policy "company admin updates own company" on public.companies for update to authenticated
  using (public.is_company_admin(auth.uid(), id)) with check (public.is_company_admin(auth.uid(), id));

-- POLICIES: profiles
create policy "read own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "update own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy "insert own profile" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "super admin reads profiles" on public.profiles for select to authenticated
  using (public.is_super_admin(auth.uid()));
create policy "company admin reads company profiles" on public.profiles for select to authenticated
  using (company_id is not null and public.is_company_admin(auth.uid(), company_id));

-- POLICIES: user_roles
create policy "read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());
create policy "super admin reads roles" on public.user_roles for select to authenticated
  using (public.is_super_admin(auth.uid()));
create policy "company admin reads company roles" on public.user_roles for select to authenticated
  using (company_id is not null and public.is_company_admin(auth.uid(), company_id));

-- POLICIES: branches
create policy "company members read branches" on public.branches for select to authenticated
  using (company_id = public.current_company_id() or public.is_super_admin(auth.uid()));
create policy "company admin manages branches" on public.branches for all to authenticated
  using (public.is_company_admin(auth.uid(), company_id) or public.is_super_admin(auth.uid()))
  with check (public.is_company_admin(auth.uid(), company_id) or public.is_super_admin(auth.uid()));

-- POLICIES: tickets
create policy "company members read tickets" on public.tickets for select to authenticated
  using (company_id = public.current_company_id() or public.is_super_admin(auth.uid()));
create policy "company members create tickets" on public.tickets for insert to authenticated
  with check (company_id = public.current_company_id());
create policy "company members update tickets" on public.tickets for update to authenticated
  using (company_id = public.current_company_id() or public.is_super_admin(auth.uid()))
  with check (company_id = public.current_company_id() or public.is_super_admin(auth.uid()));
create policy "company admin deletes tickets" on public.tickets for delete to authenticated
  using (public.is_company_admin(auth.uid(), company_id) or public.is_super_admin(auth.uid()));

-- POLICIES: ticket_updates
create policy "company members read updates" on public.ticket_updates for select to authenticated
  using (exists (select 1 from public.tickets t where t.id = ticket_id
    and (t.company_id = public.current_company_id() or public.is_super_admin(auth.uid()))));
create policy "company members add updates" on public.ticket_updates for insert to authenticated
  with check (exists (select 1 from public.tickets t where t.id = ticket_id
    and (t.company_id = public.current_company_id() or public.is_super_admin(auth.uid()))));

-- TRIGGERS
create trigger companies_updated_at before update on public.companies
  for each row execute function public.update_updated_at_column();
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at_column();
create trigger branches_updated_at before update on public.branches
  for each row execute function public.update_updated_at_column();
create trigger tickets_updated_at before update on public.tickets
  for each row execute function public.update_updated_at_column();

-- NEW USER -> PROFILE (+ first user becomes super admin)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare has_super boolean;
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), coalesce(new.email,''))
  on conflict (id) do nothing;

  select exists(select 1 from public.user_roles where role = 'super_admin') into has_super;
  if not has_super then
    insert into public.user_roles (user_id, role) values (new.id, 'super_admin')
    on conflict do nothing;
  end if;
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();