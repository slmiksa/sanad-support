CREATE POLICY "company members upload ticket attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'ticket-attachments'
  AND ((storage.foldername(name))[1] = public.current_company_id()::text
       OR public.is_super_admin(auth.uid()))
);

CREATE POLICY "company members read ticket attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'ticket-attachments'
  AND ((storage.foldername(name))[1] = public.current_company_id()::text
       OR public.is_super_admin(auth.uid()))
);

CREATE POLICY "company members delete ticket attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'ticket-attachments'
  AND ((storage.foldername(name))[1] = public.current_company_id()::text
       OR public.is_super_admin(auth.uid()))
);