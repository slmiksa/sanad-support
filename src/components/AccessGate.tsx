import { Link } from "@tanstack/react-router";
import { Loader2, ShieldAlert } from "lucide-react";

/**
 * حارس صلاحيات على مستوى الواجهة: لا يعرض أي محتوى قبل اكتمال تحميل الصلاحيات،
 * ولا يعرض المحتوى إطلاقاً لمن لا يملك الصلاحية (لا وميض ولا تسريب بيانات).
 */
export function AccessGate({
  loading,
  allowed,
  message,
  children,
}: {
  loading: boolean;
  allowed: boolean;
  message: string;
  children: React.ReactNode;
}) {
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="grid min-h-screen place-items-center px-4 text-center">
        <div className="max-w-sm space-y-3">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldAlert className="h-6 w-6" />
          </span>
          <p className="text-lg font-black">{message}</p>
          <Link to="/portal" className="inline-block text-sm font-bold text-primary">
            العودة إلى حسابك
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
