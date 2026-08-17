create table if not exists public.login_otps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists login_otps_email_idx on public.login_otps (lower(email), created_at desc);

grant all on public.login_otps to service_role;

alter table public.login_otps enable row level security;

-- لا توجد أي سياسة للمستخدمين: الجدول يُقرأ ويُكتب من الخادم الآمن فقط.

create or replace function public.requires_two_factor(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id
      and role in ('super_admin','platform_agent','company_admin','agent')
  );
$$;

grant execute on function public.requires_two_factor(uuid) to authenticated, anon, service_role;