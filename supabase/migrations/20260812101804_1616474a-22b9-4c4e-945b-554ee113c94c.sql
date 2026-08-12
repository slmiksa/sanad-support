-- Public read helpers so the frontend can run fully static (no Node server)
create or replace function public.get_public_company(_slug text)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'company', to_json(c),
    'branches', coalesce((
      select json_agg(json_build_object('id', b.id, 'name', b.name) order by b.name)
      from public.branches b where b.company_id = c.id
    ), '[]'::json)
  )
  from (
    select id, slug, name, tagline, logo_url, primary_color, secondary_color,
           is_active, form_fields, field_config, managed_support
    from public.companies
    where slug = _slug and is_active = true
  ) c;
$$;

grant execute on function public.get_public_company(text) to anon, authenticated;

create or replace function public.track_ticket_public(_ticket_no text)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'ticket', to_json(t),
    'updates', coalesce((
      select json_agg(json_build_object(
        'id', u.id, 'note', u.note, 'status', u.status,
        'created_at', u.created_at, 'author_name', u.author_name
      ) order by u.created_at)
      from public.ticket_updates u where u.ticket_id = t.id
    ), '[]'::json)
  )
  from (
    select id, ticket_no, title, status, priority, branch, created_at, updated_at, requester_name
    from public.tickets
    where ticket_no = upper(trim(_ticket_no))
  ) t;
$$;

grant execute on function public.track_ticket_public(text) to anon, authenticated;