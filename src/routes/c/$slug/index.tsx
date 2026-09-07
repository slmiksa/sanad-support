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
  const isStaff =
    signedIn && (access.role === "company_admin" || access.role === "agent" || access.isSuperAdmin);

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ "--brand": company.primary_color } as React.CSSProperties}
    >
      <header className="border-b border-stage-foreground/10 bg-stage text-stage-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.name}
                className="h-11 w-11 rounded-md object-cover"
              />
            ) : (
               <span className="grid h-11 w-11 place-items-center rounded-md bg-primary text-lg font-black text-primary-foreground">
                {company.name.charAt(0)}
              </span>
            )}
            <div>
              <h1 className="text-base font-black">{company.name}</h1>
               <p className="text-xs text-stage-foreground/60">{company.tagline || "الدعم الفني"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isStaff && (
              <Link
                to="/c/$slug/admin"
                params={{ slug }}
                 className="rounded-md border border-stage-foreground/20 px-3 py-2 text-xs font-bold hover:border-primary"
              >
                لوحة التحكم
              </Link>
            )}
            {signedIn ? (
              <Link
                to="/c/$slug/me"
                params={{ slug }}
                 className="rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
              >
                حسابي
              </Link>
            ) : (
              <Link
                to="/c/$slug/login"
                params={{ slug }}
                 className="rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
              >
                تسجيل الدخول
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-5 px-5 py-8 lg:grid-cols-12 lg:px-8 lg:py-12">
        <section className="relative overflow-hidden rounded-lg bg-stage p-7 text-stage-foreground sm:p-10 lg:col-span-8 lg:min-h-[28rem] lg:p-14">
          <div className="absolute -bottom-28 -left-20 h-72 w-72 rotate-12 border-[3.5rem] border-primary/15" aria-hidden />
          <p className="relative text-xs font-black text-primary">مركز الدعم الخاص بكم</p>
          <h2 className="relative mt-5 max-w-2xl text-3xl font-black leading-[1.3] sm:text-5xl">
            بوابة الدعم الفني في {company.name}
          </h2>
          <p className="relative mt-5 max-w-2xl text-sm leading-7 text-stage-foreground/65">
            منصة موحّدة لجميع منسوبي الشركة: ارفع طلبك الفني، تابع حالته لحظة بلحظة، واطّلع على سجل
            تذاكرك السابقة والردود عليها. ولفريق الدعم والمشرفين: إدارة كاملة للتذاكر والفرق
            والتقارير من لوحة التحكم.
          </p>
          <div className="relative mt-8 flex flex-wrap items-center gap-3">
            {signedIn ? (
              <>
                <Link
                  to="/c/$slug/me"
                  params={{ slug }}
                   className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3.5 text-sm font-black text-primary-foreground"
                >
                  <Ticket className="h-4 w-4" /> رفع تذكرة ومتابعة تذاكري
                </Link>
                {isStaff && (
                  <Link
                    to="/c/$slug/admin"
                    params={{ slug }}
                     className="inline-flex items-center justify-center gap-2 rounded-md border border-stage-foreground/20 px-5 py-3.5 text-sm font-black hover:border-primary"
                  >
                    <LayoutDashboard className="h-4 w-4" /> الدخول للوحة التحكم
                  </Link>
                )}
              </>
            ) : (
              <Link
                to="/c/$slug/login"
                params={{ slug }}
                 className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3.5 text-sm font-black text-primary-foreground"
              >
                <LogIn className="h-4 w-4" /> تسجيل الدخول للبوابة
              </Link>
            )}
          </div>
          {!signedIn && (
             <p className="relative mt-4 text-xs text-stage-foreground/55">
              الحسابات تُنشأ من إدارة الدعم الفني في شركتك — تواصل معهم إذا لم يكن لديك حساب.
            </p>
          )}
        </section>

        <section className="grid gap-3 sm:grid-cols-3 lg:col-span-4 lg:grid-cols-1">
          {[
            {
              icon: Ticket,
              title: "رفع التذاكر",
              body: "نموذج مرن بحقول تناسب شركتك مع إمكانية إرفاق الملفات وتحديد الأولوية والفرع.",
            },
            {
              icon: Clock,
              title: "متابعة لحظية",
              body: "تابع حالة تذكرتك (مفتوحة، قيد المعالجة، تم الحل) واستعرض ردود فريق الدعم أولاً بأول.",
            },
            {
              icon: Users,
              title: "لكل الموظفين",
              body: "كل منسوبي الشركة — موظفين ومشرفين وفريق دعم — يستخدمون البوابة نفسها بصلاحيات مختلفة.",
            },
          ].map((item) => (
             <div key={item.title} className="group rounded-lg border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary">
               <span className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"><item.icon className="h-5 w-5" /></span>
               <h3 className="mt-4 text-sm font-black">{item.title}</h3>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </section>

         <section className="flex items-center justify-center gap-2 border-t border-border pt-5 text-xs text-muted-foreground lg:col-span-12">
          <ShieldCheck className="h-4 w-4 text-primary" />
          الوصول محمي: كل مستخدم يرى ما تسمح به صلاحيته فقط.
        </section>
      </main>
    </div>
  );
}

