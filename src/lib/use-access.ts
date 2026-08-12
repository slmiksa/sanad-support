import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Access = {
  user: User | null;
  loading: boolean;
  isSuperAdmin: boolean;
  companySlug: string | null;
  companyName: string | null;
  companyId: string | null;
  role: string | null;
  fullName: string | null;
};

export function useAccess(): Access {
  const [state, setState] = useState<Access>({
    user: null,
    loading: true,
    isSuperAdmin: false,
    companySlug: null,
    companyName: null,
    companyId: null,
    role: null,
    fullName: null,
  });

  useEffect(() => {
    let active = true;

    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user ?? null;
      if (!user) {
        if (active)
          setState({
            user: null,
            loading: false,
            isSuperAdmin: false,
            companySlug: null,
            companyName: null,
            companyId: null,
            role: null,
            fullName: null,
          });
        return;
      }
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role, company_id").eq("user_id", user.id),
        supabase.from("profiles").select("company_id, full_name").eq("id", user.id).maybeSingle(),
      ]);
      const isSuperAdmin = (roles ?? []).some((r) => r.role === "super_admin");
      const companyId = profile?.company_id ?? null;
      let companySlug: string | null = null;
      let companyName: string | null = null;
      if (companyId) {
        const { data: company } = await supabase
          .from("companies")
          .select("slug, name")
          .eq("id", companyId)
          .maybeSingle();
        companySlug = company?.slug ?? null;
        companyName = company?.name ?? null;
      }
      if (active)
        setState({
          user,
          loading: false,
          isSuperAdmin,
          companySlug,
          companyName,
          companyId,
          role: (roles ?? [])[0]?.role ?? null,
          fullName:
            profile?.full_name?.trim() ||
            (user.user_metadata?.["full_name"] as string | undefined) ||
            null,
        });
    };

    void load();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") void load();
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
