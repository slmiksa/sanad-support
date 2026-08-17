import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getCompanyBySlug } from "@/lib/tenant.functions";
import { LoginCard } from "@/components/LoginCard";

export const Route = createFileRoute("/c/$slug/login")({
  loader: async ({ params }) => {
    const data = await getCompanyBySlug({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `تسجيل دخول ${loaderData?.company.name ?? "الشركة"} | بوابة الدعم الفني` },
      {
        name: "description",
        content: `صفحة الدخول الخاصة بموظفي وإدارة ${loaderData?.company.name ?? "الشركة"} للوصول إلى نظام تذاكر الدعم الفني.`,
      },
      {
        property: "og:title",
        content: `تسجيل دخول ${loaderData?.company.name ?? "الشركة"}`,
      },
      { property: "og:description", content: "دخول آمن بمصادقة ثنائية لأعضاء الشركة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: () => (
    <div className="grid min-h-screen place-items-center p-8 text-center text-sm text-muted-foreground">
      تعذّر تحميل صفحة الدخول.
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
  component: CompanyLogin,
});

function CompanyLogin() {
  const { company } = Route.useLoaderData();
  const { slug } = Route.useParams();

  return (
    <div style={{ "--brand": company.primary_color } as React.CSSProperties}>
      <LoginCard
        slug={slug}
        title={company.name}
        subtitle={`بوابة الدعم الفني — /c/${slug}`}
        logoUrl={company.logo_url}
        backTo={{ to: "/c/$slug", params: { slug }, label: "العودة لبوابة الشركة" }}
        hint={`الدخول مخصص لأعضاء ${company.name} فقط. الحسابات تُنشأ من إدارة شركتك.`}
      />
    </div>
  );
}
