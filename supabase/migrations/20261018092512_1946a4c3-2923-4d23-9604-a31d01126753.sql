REVOKE EXECUTE ON FUNCTION public.is_membership_active(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_membership_active(uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.protect_membership_status() FROM PUBLIC, anon, authenticated;