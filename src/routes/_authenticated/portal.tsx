import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAccess } from "@/lib/use-access";

export const Route = createFileRoute("/_authenticated/portal")({
  component: PortalPage,
});

function PortalPage() {
  const access = useAccess();
  const navigate = useNavigate();

  useEffect(() => {
    if (access.loading) return;
    if (access.isSuperAdmin) {
      void navigate({ to: "/admin", replace: true });
    } else if (access.companySlug) {
      void navigate({
        to: "/c/$slug/admin",
        params: { slug: access.companySlug },
        replace: true,
      });
    }
  }, [access, navigate]);

  return (
    <div className="grid min-h-screen place-items-center gap-3 text-sm text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      {!access.loading && !access.isSuperAdmin && !access.companySlug && (
        <p>حسابك غير مرتبط بأي شركة بعد. تواصل مع أدمن المنصة.</p>
      )}
    </div>
  );
}
