import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { LayoutDashboard, LogIn, Ticket, Clock, Users, ShieldCheck } from "lucide-react";
import { getCompanyBySlug } from "@/lib/tenant.functions";
import { useAccess } from "@/lib/use-access";



export const Route = createFileRoute("/c/$slug/")({
  loader: async ({ params }) => {
    const data = await getCompanyBySlug({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.company.name ?? "بوابة الدعم"} | بوابة تذاكر الدعم الفني` },
      {
        name: "description",
        content: `بوابة الدعم الفني الخاصة بـ ${loaderData?.company.name ?? "الشركة"}: سجّل دخولك لرفع تذكرة أو تابع حالة تذكرتك برقمها.`,
      },
      { property: "og:title", content: `${loaderData?.company.name ?? "بوابة الدعم"} — بوابة التذاكر` },
      {
        property: "og:description",
        content: "رفع تذاكر الدعم الفني لموظفي الشركة ومتابعة حالتها لحظة بلحظة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  errorComponent: () => (
    <div className="grid min-h-screen place-items-center p-8 text-center text-sm text-muted-foreground">
      تعذّر تحميل بوابة الشركة.
    </div>
  ),
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center p-8 text-center">
      <div>
        <p className="text-lg font-black">هذه الشركة غير موجودة أو اشتراكها غير مفعّل</p>
        <Link to="/" className="mt-3 inline-block text-sm font-bold text-primary">
          العودة للرئيسية
        </Link>
      </div>
    </div>
  ),
  component: TenantPortal,
});

function TenantPortal() {
  const { company } = Route.useLoaderData();
  const { slug } = Route.useParams();
  const access = useAccess();
  const signedIn = !access.loading && !!access.user;

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ "--brand": company.primary_color } as React.CSSProperties}
    >
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.name}
                className="h-10 w-10 rounded-xl object-cover"
              />
            ) : (
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-lg font-black text-primary-foreground">
                {company.name.charAt(0)}
              </span>
            )}
            <div>
              <h1 className="text-base font-black">{company.name}</h1>
              <p className="text-xs text-muted-foreground">{company.tagline || "الدعم الفني"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {signedIn && (
              <Link
                to="/c/$slug/me"
                params={{ slug }}
                className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
              >
                حسابي
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-3xl gap-6 px-4 py-8">
        <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-black">رفع تذكرة دعم فني</h2>
          {signedIn ? (
            <>
              <p className="text-sm text-muted-foreground">
                أنت مسجّل دخولك بالفعل. انتقل إلى حسابك لرفع تذكرة جديدة ومتابعة سجل تذاكرك السابقة.
              </p>
              <Link
                to="/c/$slug/me"
                params={{ slug }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground"
              >
                <Ticket className="h-4 w-4" /> الذهاب إلى حسابي ورفع تذكرة
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                رفع التذاكر متاح لموظفي {company.name} المسجّلين فقط. سجّل الدخول بحسابك الوظيفي لتظهر
                بياناتك (الاسم، الرقم الوظيفي، التحويلة، التخصص) تلقائياً مع كل تذكرة، ولتتمكن من
                متابعة سجل تذاكرك السابقة.
              </p>
              <Link
                to="/c/$slug/login"
                params={{ slug }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground"
              >
                <LogIn className="h-4 w-4" /> تسجيل الدخول لرفع تذكرة
              </Link>
              <p className="text-xs text-muted-foreground">
                لا تملك حساباً؟ تواصل مع مشرف الدعم الفني في شركتك لإنشاء حساب لك.
              </p>
            </>
          )}
        </section>


      </main>
    </div>
  );
}
