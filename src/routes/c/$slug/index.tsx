import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import { getCompanyBySlug, submitTicket } from "@/lib/tenant.functions";
import { PRIORITY_META, type Priority } from "@/lib/tickets";
import { TicketTracker } from "@/components/TicketTracker";

export const Route = createFileRoute("/c/$slug/")({
  loader: async ({ params }) => {
    const data = await getCompanyBySlug({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.company.name ?? "بوابة الدعم"} | تقديم تذكرة دعم فني` },
      {
        name: "description",
        content: `قدّم تذكرة دعم فني إلى ${loaderData?.company.name ?? "فريق الدعم"} وتابع حالتها لحظة بلحظة.`,
      },
      { property: "og:title", content: `${loaderData?.company.name ?? "بوابة الدعم"} — تقديم تذكرة` },
      {
        property: "og:description",
        content: "بوابة تذاكر الدعم الفني الخاصة بالشركة: تقديم، متابعة، وحل سريع.",
      },
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
  const { company, branches } = Route.useLoaderData();
  const { slug } = Route.useParams();
  const submit = useServerFn(submitTicket);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    branch: branches[0]?.name ?? "",
    priority: "normal" as Priority,
    requester_name: "",
    requester_phone: "",
    requester_email: "",
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await submit({ data: { slug, ...form } });
      setDone(res.ticket_no);
      toast.success("تم إرسال التذكرة", { description: res.ticket_no });
      setForm({ ...form, title: "", description: "" });
    } catch (err) {
      toast.error("تعذّر إرسال التذكرة", { description: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={
        {
          "--brand": company.primary_color,
        } as React.CSSProperties
      }
    >
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            {company.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="h-10 w-10 rounded-xl object-cover" />
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
          <Link
            to="/c/$slug/track"
            params={{ slug }}
            className="rounded-xl border border-border px-3 py-2 text-xs font-bold"
          >
            متابعة تذكرة
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[1.4fr_1fr]">
        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-black">تقديم تذكرة دعم فني</h2>

          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-muted-foreground">عنوان المشكلة</span>
            <input
              required
              className="field"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-muted-foreground">وصف تفصيلي</span>
            <textarea
              required
              rows={5}
              className="field"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            {fields.branch && (
              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-muted-foreground">الفرع</span>
                <select
                  className="field"
                  value={form.branch}
                  onChange={(e) => setForm({ ...form, branch: e.target.value })}
                >
                  <option value="">غير محدد</option>
                  {branches.map((b: { id: string; name: string }) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {fields.priority && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-muted-foreground">الأهمية</span>
                <div className="flex gap-2">
                  {(Object.keys(PRIORITY_META) as Priority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm({ ...form, priority: p })}
                      className={`flex-1 rounded-xl border px-2 py-2 text-xs font-bold transition ${
                        form.priority === p
                          ? PRIORITY_META[p].className
                          : "border-border bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      {PRIORITY_META[p].icon} {PRIORITY_META[p].label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-muted-foreground">الاسم</span>
              <input
                required
                className="field"
                value={form.requester_name}
                onChange={(e) => setForm({ ...form, requester_name: e.target.value })}
              />
            </label>
            {fields.phone && (
              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-muted-foreground">الجوال</span>
                <input
                  dir="ltr"
                  className="field"
                  value={form.requester_phone}
                  onChange={(e) => setForm({ ...form, requester_phone: e.target.value })}
                />
              </label>
            )}
            {fields.email && (
              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-muted-foreground">البريد</span>
                <input
                  dir="ltr"
                  type="email"
                  className="field"
                  value={form.requester_email}
                  onChange={(e) => setForm({ ...form, requester_email: e.target.value })}
                />
              </label>
            )}
          </div>


          <button
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            إرسال التذكرة
          </button>

          {done && (
            <p className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 p-3 text-xs font-bold text-primary">
              <CheckCircle2 className="h-4 w-4" /> رقم تذكرتك: <span dir="ltr">{done}</span>
            </p>
          )}
        </form>

        <aside className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-black">متابعة سريعة</h2>
          <p className="text-xs text-muted-foreground">أدخل رقم التذكرة لعرض حالتها وسجل التحديثات.</p>
          <TicketTracker />
        </aside>
      </main>
    </div>
  );
}
