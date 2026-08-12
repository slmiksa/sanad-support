import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getCompanyBySlug } from "@/lib/tenant.functions";
import { TicketTracker } from "@/components/TicketTracker";

export const Route = createFileRoute("/c/$slug/track")({
  loader: async ({ params }) => {
    const data = await getCompanyBySlug({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `متابعة تذكرة | ${loaderData?.company.name ?? "الدعم الفني"}` },
      {
        name: "description",
        content: "تابع حالة تذكرة الدعم الفني الخاصة بك عبر رقم التذكرة واطّلع على سجل التحديثات.",
      },
      { property: "og:title", content: "متابعة تذكرة الدعم الفني" },
      { property: "og:description", content: "تتبّع حالة تذكرتك وسجل التحديثات لحظة بلحظة." },
    ],
  }),
  errorComponent: () => (
    <div className="grid min-h-screen place-items-center p-8 text-center text-sm text-muted-foreground">
      تعذّر تحميل الصفحة.
    </div>
  ),
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center p-8 text-center">
      <p className="text-lg font-black">الشركة غير موجودة</p>
    </div>
  ),
  component: TrackPage,
});

function TrackPage() {
  const { company } = Route.useLoaderData();
  const { slug } = Route.useParams();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <h1 className="text-base font-black">{company.name} — متابعة تذكرة</h1>
          <Link
            to="/c/$slug"
            params={{ slug }}
            className="rounded-xl border border-border px-3 py-2 text-xs font-bold"
          >
            تقديم تذكرة
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl border border-border bg-card p-6">
          <TicketTracker />
        </div>
      </main>
    </div>
  );
}
