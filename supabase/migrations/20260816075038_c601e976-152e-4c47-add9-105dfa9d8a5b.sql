create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

create table if not exists public.keepalive_log (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'pg_cron',
  note text not null default '',
  created_at timestamptz not null default now()
);

grant all on public.keepalive_log to service_role;

alter table public.keepalive_log enable row level security;

create policy "service role manages keepalive log"
on public.keepalive_log for all
to service_role
using (true) with check (true);

create or replace function public.run_keepalive()
returns void
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare req_id bigint;
begin
  insert into public.keepalive_log (source, note) values ('pg_cron', 'daily heartbeat');

  begin
    select net.http_get(
      url := 'https://iaocettrchracwkhmxbt.supabase.co/rest/v1/platform_settings?select=id&limit=1',
      headers := jsonb_build_object(
        'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlhb2NldHRyY2hyYWN3a2hteGJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MTYxMTQsImV4cCI6MjEwMjA5MjExNH0.jFDwNrJfbgieQ1rtFIIIeDX-W0wtIRsH2sGA-MxtD3M',
        'Content-Type', 'application/json'
      )
    ) into req_id;
  exception when others then
    insert into public.keepalive_log (source, note) values ('pg_cron', 'http skipped: ' || sqlerrm);
  end;
end;
$$;

revoke all on function public.run_keepalive() from public, anon, authenticated;
grant execute on function public.run_keepalive() to service_role;

select cron.unschedule(jobid) from cron.job where jobname in ('daily-keepalive','keepalive-cleanup');

select cron.schedule('daily-keepalive', '17 3 * * *', $$select public.run_keepalive();$$);
select cron.schedule('keepalive-cleanup', '0 4 * * 0', $$delete from public.keepalive_log where created_at < now() - interval '30 days';$$);

select public.run_keepalive();