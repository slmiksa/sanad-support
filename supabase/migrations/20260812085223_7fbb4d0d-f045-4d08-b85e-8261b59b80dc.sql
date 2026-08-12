
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS managed_support boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.is_platform_agent(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'platform_agent'::app_role
  )
$$;

CREATE OR REPLACE FUNCTION public.can_platform_support(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_platform_agent(_user_id)
     AND EXISTS (
       SELECT 1 FROM public.companies c
       WHERE c.id = _company_id AND c.managed_support = true
     )
$$;

REVOKE EXECUTE ON FUNCTION public.is_platform_agent(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_platform_support(uuid, uuid) FROM anon;

CREATE POLICY "platform agents read managed companies"
ON public.companies FOR SELECT TO authenticated
USING (managed_support = true AND public.is_platform_agent(auth.uid()));

CREATE POLICY "platform agents read managed tickets"
ON public.tickets FOR SELECT TO authenticated
USING (public.can_platform_support(auth.uid(), company_id));

CREATE POLICY "platform agents update managed tickets"
ON public.tickets FOR UPDATE TO authenticated
USING (public.can_platform_support(auth.uid(), company_id))
WITH CHECK (public.can_platform_support(auth.uid(), company_id));

CREATE POLICY "platform agents read managed ticket updates"
ON public.ticket_updates FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.tickets t
  WHERE t.id = ticket_updates.ticket_id
    AND public.can_platform_support(auth.uid(), t.company_id)
));

CREATE POLICY "platform agents add managed ticket updates"
ON public.ticket_updates FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.tickets t
  WHERE t.id = ticket_updates.ticket_id
    AND public.can_platform_support(auth.uid(), t.company_id)
));

CREATE POLICY "platform agents read managed profiles"
ON public.profiles FOR SELECT TO authenticated
USING (company_id IS NOT NULL AND public.can_platform_support(auth.uid(), company_id));
