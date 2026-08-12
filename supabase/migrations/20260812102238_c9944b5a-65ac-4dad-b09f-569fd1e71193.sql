-- Super admin can manage branches of any company
drop policy if exists "super admin manages branches" on public.branches;
create policy "super admin manages branches" on public.branches for all to authenticated
  using (public.is_super_admin(auth.uid())) with check (public.is_super_admin(auth.uid()));

-- Provision a member (profile + role) for an already-created auth user
create or replace function public.admin_provision_member(
  _user_id uuid,
  _company_id uuid,
  _full_name text,
  _email text,
  _role public.app_role,
  _employee_no text default null,
  _extension text default null,
  _specialty text default null,
  _department text default null,
  _phone text default null
) returns void language plpgsql security definer set search_path = public as $$
begin
  if not (
    public.is_super_admin(auth.uid())
    or (_company_id is not null and public.is_company_admin(auth.uid(), _company_id))
  ) then
    raise exception 'غير مصرح لك بإضافة مستخدمين';
  end if;

  if _role in ('super_admin', 'platform_agent') and not public.is_super_admin(auth.uid()) then
    raise exception 'غير مصرح: هذه العملية للأدمن الأعلى فقط';
  end if;

  insert into public.profiles (id, company_id, full_name, email, employee_no, extension, specialty, department, phone)
  values (_user_id, _company_id, _full_name, _email,
          nullif(_employee_no, ''), nullif(_extension, ''), nullif(_specialty, ''),
          nullif(_department, ''), nullif(_phone, ''))
  on conflict (id) do update set
    company_id = excluded.company_id,
    full_name = excluded.full_name,
    email = excluded.email,
    employee_no = excluded.employee_no,
    extension = excluded.extension,
    specialty = excluded.specialty,
    department = excluded.department,
    phone = excluded.phone;

  delete from public.user_roles where user_id = _user_id;
  insert into public.user_roles (user_id, company_id, role)
  values (_user_id, _company_id, _role)
  on conflict do nothing;
end;
$$;
grant execute on function public.admin_provision_member(uuid, uuid, text, text, public.app_role, text, text, text, text, text) to authenticated;

-- Company subscription info + members (super admin only)
create or replace function public.admin_get_company_access(_company_id uuid)
returns json language plpgsql stable security definer set search_path = public as $$
declare result json;
begin
  if not public.is_super_admin(auth.uid()) then
    raise exception 'غير مصرح: هذه العملية للأدمن الأعلى فقط';
  end if;

  select json_build_object(
    'company', (select to_json(c) from (
        select id, name, slug, tagline, plan, is_active, created_at
        from public.companies where id = _company_id) c),
    'members', coalesce((
      select json_agg(json_build_object(
        'user_id', r.user_id,
        'role', r.role,
        'full_name', coalesce(p.full_name, ''),
        'email', coalesce(p.email, ''),
        'employee_no', coalesce(p.employee_no, ''),
        'extension', coalesce(p.extension, ''),
        'specialty', coalesce(p.specialty, ''),
        'department', coalesce(p.department, ''),
        'phone', coalesce(p.phone, '')
      ))
      from public.user_roles r
      left join public.profiles p on p.id = r.user_id
      where r.company_id = _company_id
    ), '[]'::json)
  ) into result;

  if (result -> 'company') is null or (result ->> 'company') is null then
    raise exception 'الشركة غير موجودة';
  end if;
  return result;
end;
$$;
grant execute on function public.admin_get_company_access(uuid) to authenticated;

-- Platform support staff list (super admin only)
create or replace function public.admin_list_platform_agents()
returns json language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_super_admin(auth.uid()) then
    raise exception 'غير مصرح: هذه العملية للأدمن الأعلى فقط';
  end if;
  return coalesce((
    select json_agg(json_build_object(
      'user_id', r.user_id,
      'created_at', r.created_at,
      'full_name', coalesce(p.full_name, ''),
      'email', coalesce(p.email, ''),
      'phone', coalesce(p.phone, '')
    ) order by r.created_at desc)
    from public.user_roles r
    left join public.profiles p on p.id = r.user_id
    where r.role = 'platform_agent'
  ), '[]'::json);
end;
$$;
grant execute on function public.admin_list_platform_agents() to authenticated;

-- Remove a platform agent (super admin only)
create or replace function public.admin_remove_platform_agent(_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_super_admin(auth.uid()) then
    raise exception 'غير مصرح: هذه العملية للأدمن الأعلى فقط';
  end if;
  delete from public.user_roles where user_id = _user_id and role = 'platform_agent';
  delete from public.profiles where id = _user_id;
end;
$$;
grant execute on function public.admin_remove_platform_agent(uuid) to authenticated;