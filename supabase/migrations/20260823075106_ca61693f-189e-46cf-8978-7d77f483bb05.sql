alter table public.companies
  add column if not exists subscription_starts_at timestamptz not null default now(),
  add column if not exists subscription_months integer not null default 12,
  add column if not exists subscription_notified_at timestamptz;

update public.companies
set subscription_ends_at = coalesce(subscription_ends_at, subscription_starts_at + interval '12 months');

create or replace function public.run_subscription_expiry_check()
returns void
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare req_id bigint;
begin
  begin
    select net.http_post(
      url := 'https://project--0ea35464-4366-4fbb-82c3-d3352d37ad72-dev.lovable.app/api/public/subscription-expiry/notify',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object('source', 'pg_cron')
    ) into req_id;
  exception when others then
    insert into public.keepalive_log (source, note) values ('pg_cron', 'expiry check skipped: ' || sqlerrm);
  end;
end;
$$;

revoke all on function public.run_subscription_expiry_check() from public, anon, authenticated;
grant execute on function public.run_subscription_expiry_check() to service_role;

select cron.unschedule(jobid) from cron.job where jobname = 'subscription-expiry-check';
select cron.schedule('subscription-expiry-check', '0 6 * * *', $$select public.run_subscription_expiry_check();$$);