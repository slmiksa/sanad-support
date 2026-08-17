import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      // إعادة التوجيه إلى صفحة دخول الشركة نفسها عند وجود مسار شركة
      const match = /^\/c\/([a-z0-9-]+)\//.exec(location.pathname);
      if (match) throw redirect({ to: "/c/$slug/login", params: { slug: match[1]! } });
      throw redirect({ to: "/auth" });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
