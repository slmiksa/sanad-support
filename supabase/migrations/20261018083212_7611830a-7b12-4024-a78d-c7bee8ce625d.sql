ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS max_members integer NOT NULL DEFAULT 50;

CREATE OR REPLACE FUNCTION public.admin_provision_member(_user_id uuid, _company_id uuid, _full_name text, _email text, _role app_role, _employee_no text DEFAULT NULL::text, _extension text DEFAULT NULL::text, _specialty text DEFAULT NULL::text, _department text DEFAULT NULL::text, _phone text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  _limit integer;
  _count integer;
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

  -- فرض الحد الأقصى للعضويات عند إضافة عضو جديد للشركة
  if _company_id is not null
     and not exists (select 1 from public.user_roles where user_id = _user_id and company_id = _company_id) then
    select max_members into _limit from public.companies where id = _company_id;
    select count(*) into _count from public.user_roles where company_id = _company_id;
    if _limit is not null and _count >= _limit then
      raise exception 'وصلت الشركة للحد الأقصى من العضويات (%). لا يمكن إضافة أعضاء جدد.', _limit;
    end if;
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
$function$;