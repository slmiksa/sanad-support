CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_email text NOT NULL DEFAULT 'info@lamhasec.com',
  whatsapp text NOT NULL DEFAULT '966500000000',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.platform_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads platform settings" ON public.platform_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "super admin manages platform settings" ON public.platform_settings FOR ALL TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));
CREATE TRIGGER platform_settings_updated_at BEFORE UPDATE ON public.platform_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.platform_settings (contact_email, whatsapp) VALUES ('info@lamhasec.com', '966500000000');