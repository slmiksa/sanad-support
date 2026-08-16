create or replace function public.is_company_staff(_user_id uuid, _company_id uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id
      and company_id = _company_id
      and role in ('company_admin','agent')
  );
$$;

grant execute on function public.is_company_staff(uuid, uuid) to authenticated;

-- tickets
drop policy if exists "company members read tickets" on public.tickets;
create policy "company staff read tickets" on public.tickets
for select to authenticated
using (
  is_super_admin(auth.uid())
  or (company_id = current_company_id() and is_company_staff(auth.uid(), company_id))
  or (company_id = current_company_id() and created_by = auth.uid())
);

drop policy if exists "company members update tickets" on public.tickets;
create policy "company staff update tickets" on public.tickets
for update to authenticated
using (
  is_super_admin(auth.uid())
  or (company_id = current_company_id() and is_company_staff(auth.uid(), company_id))
)
with check (
  is_super_admin(auth.uid())
  or (company_id = current_company_id() and is_company_staff(auth.uid(), company_id))
);

drop policy if exists "company members create tickets" on public.tickets;
create policy "company members create tickets" on public.tickets
for insert to authenticated
with check (company_id = current_company_id() and created_by = auth.uid());

-- ticket updates
drop policy if exists "company members read updates" on public.ticket_updates;
create policy "company members read updates" on public.ticket_updates
for select to authenticated
using (exists (
  select 1 from public.tickets t
  where t.id = ticket_updates.ticket_id
    and (
      is_super_admin(auth.uid())
      or (t.company_id = current_company_id() and is_company_staff(auth.uid(), t.company_id))
      or (t.company_id = current_company_id() and t.created_by = auth.uid())
    )
));

drop policy if exists "company members add updates" on public.ticket_updates;
create policy "company members add updates" on public.ticket_updates
for insert to authenticated
with check (
  author_id = auth.uid()
  and exists (
    select 1 from public.tickets t
    where t.id = ticket_updates.ticket_id
      and (
        is_super_admin(auth.uid())
        or (t.company_id = current_company_id() and is_company_staff(auth.uid(), t.company_id))
        or (t.company_id = current_company_id() and t.created_by = auth.uid())
      )
  )
);