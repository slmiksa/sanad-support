ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS employee_no text,
  ADD COLUMN IF NOT EXISTS extension text,
  ADD COLUMN IF NOT EXISTS specialty text,
  ADD COLUMN IF NOT EXISTS department text;

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS custom_data jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS field_config jsonb NOT NULL DEFAULT '[]'::jsonb;