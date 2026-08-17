CREATE TABLE IF NOT EXISTS public.login_otp_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS login_otp_codes_email_idx ON public.login_otp_codes (lower(email), created_at DESC);
GRANT ALL ON public.login_otp_codes TO service_role;
ALTER TABLE public.login_otp_codes ENABLE ROW LEVEL SECURITY;