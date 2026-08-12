ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS form_fields jsonb NOT NULL
DEFAULT '{"branch":true,"phone":true,"email":true,"priority":true,"attachments":false}'::jsonb;