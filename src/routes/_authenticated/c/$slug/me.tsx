import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, LogOut, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PRIORITY_META, STATUS_META, type Priority, type Status } from "@/lib/tickets";
import { parseFields } from "@/lib/company-settings";
import { useAccess } from "@/lib/use-access";

export const Route = createFileRoute("/_authenticated/c/$slug/me")({
  head: () => ({
    meta: [
      { title: "تذاكري | بوابة موظفي الشركة" },
      {
        name: "description",
        content: "ارفع تذكرة دعم فني جديدة وتابع كل تذاكرك السابقة وحالتها من حسابك الخاص.",
      },
      { property: "og:title", content: "تذاكري — بوابة الموظف" },
      { property: "og:description", content: "رفع التذاكر ومتابعة سجلها الكامل من حساب الموظف." },
    ],
  }),
  component: EmployeePage,
});

function EmployeePage() {
  const { slug } = Route.useParams();
  const access = useAccess();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    description: "",
    branch: "",
    priority: "normal" as Priority,
  });

  const company = useQuery({
    queryKey: ["company", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, slug, tagline, form_fields")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const companyId = company.data?.id ?? null;
  const fields = parseFields(company.data?.form_fields);

  const branches = useQuery({
    queryKey: ["branches", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name")
        .eq("company_id", companyId!)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const myTickets = useQuery({
    queryKey: ["my-tickets", access.user?.id],
    enabled: !!access.user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("id, ticket_no, title, branch, priority, status, created_at")
        .eq("created_by", access.user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const ticketNo = `TCK-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
      const { error } = await supabase.from("tickets").insert({
        company_id: companyId!,
        ticket_no: ticketNo,
        title: form.title,
        description: form.description,
        branch: fields.branch ? form.branch : "",
        priority: fields.priority ? form.priority : "normal",
        requester_name: access.user?.email ?? "",
        requester_email: access.user?.email ?? null,
        created_by: access.user?.id ?? null,
      });
      if (error) throw error;
      return ticketNo;
    },
    onSuccess: (no) => {
      toast.success("تم رفع التذكرة", { description: no });
      setForm({ title: "", description: "", branch: "", priority: "normal" });
      void qc.invalidateQueries({ queryKey: ["my-tickets", access.user?.id] });
    },
    onError: (e: Error) => toast.error("تعذّر رفع التذكرة", { description: e.message }),
  });

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <h1 className="text-base font-black">{company.data?.name ?? "بوابة الموظف"}</h1>
            <p className="text-xs text-muted-foreground" dir="ltr">
              {access.user?.email}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/c/$slug"
              params={{ slug }}
              className="rounded-xl border border-border px-3 py-2 text-xs font-bold"
            >
              البوابة العامة
            </Link>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-bold"
            >
              <LogOut className="h-4 w-4" /> خروج
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[1fr_1.2fr]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
          className="space-y-4 self-start rounded-2xl border border-border bg-card p-6"
        >
          <h2 className="text-lg font-black">رفع تذكرة جديدة</h2>
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
            <span className="text-xs font-bold text-muted-foreground">الوصف</span>
            <textarea
              required
              rows={4}
              className="field"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          {fields.branch && (
            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-muted-foreground">الفرع</span>
              <select
                className="field"
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
              >
                <option value="">غير محدد</option>
                {(branches.data ?? []).map((b) => (
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
                    {PRIORITY_META[p].label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button
            disabled={create.isPending || !companyId}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground disabled:opacity-60"
          >
            {create.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            إرسال
          </button>
        </form>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-black">تذاكري السابقة</h2>
          <div className="mt-4 space-y-3">
            {myTickets.isLoading && <p className="text-xs text-muted-foreground">جارٍ التحميل...</p>}
            {(myTickets.data ?? []).map((t) => (
              <article key={t.id} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs text-muted-foreground" dir="ltr">
                    {t.ticket_no}
                  </span>
                  <span
                    className={`rounded-lg border px-2 py-1 text-xs font-bold ${
                      STATUS_META[t.status as Status].className
                    }`}
                  >
                    {STATUS_META[t.status as Status].label}
                  </span>
                </div>
                <p className="mt-2 text-sm font-black">{t.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.branch || "بدون فرع"} · {PRIORITY_META[t.priority as Priority].label} ·{" "}
                  {new Date(t.created_at).toLocaleDateString("ar")}
                </p>
              </article>
            ))}
            {!myTickets.isLoading && (myTickets.data ?? []).length === 0 && (
              <p className="text-xs text-muted-foreground">لم ترفع أي تذكرة بعد.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
