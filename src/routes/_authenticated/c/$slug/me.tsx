import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, LogOut, Paperclip, Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PRIORITY_META, STATUS_META, type Priority, type Status } from "@/lib/tickets";
import { buildFieldConfig, customFields, isEnabled } from "@/lib/company-settings";
import { formatSize, uploadAttachments } from "@/lib/attachments";
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EmployeePage,
});

function EmployeePage() {
  const { slug } = Route.useParams();
  const access = useAccess();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [extra, setExtra] = useState<Record<string, string>>({});
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
        .select("id, name, slug, tagline, form_fields, field_config")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const profile = useQuery({
    queryKey: ["my-profile", access.user?.id],
    enabled: !!access.user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, employee_no, extension, specialty, department")
        .eq("id", access.user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const companyId = company.data?.id ?? null;
  const fieldItems = buildFieldConfig(company.data?.form_fields, company.data?.field_config);
  const extras = customFields(fieldItems);

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

  const ticketIds = (myTickets.data ?? []).map((t) => t.id);

  const updates = useQuery({
    queryKey: ["my-ticket-updates", ticketIds.join(",")],
    enabled: ticketIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticket_updates")
        .select("id, ticket_id, note, status, created_at, author_name")
        .in("ticket_id", ticketIds)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const updatesByTicket = (updates.data ?? []).reduce<
    Record<string, NonNullable<typeof updates.data>>
  >((acc, u) => {
    (acc[u.ticket_id] ??= []).push(u);
    return acc;
  }, {});

  const [openTicket, setOpenTicket] = useState<string | null>(null);
  const [seen, setSeen] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      setSeen(JSON.parse(localStorage.getItem("ticket-updates-seen") ?? "{}"));
    } catch {
      setSeen({});
    }
  }, []);

  const markSeen = (ticketId: string, last?: string) => {
    if (!last) return;
    const next = { ...seen, [ticketId]: last };
    setSeen(next);
    try {
      localStorage.setItem("ticket-updates-seen", JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };


  const create = useMutation({
    mutationFn: async () => {
      const uploaded =
        isEnabled(fieldItems, "attachments") && files.length
          ? await uploadAttachments(companyId!, files)
          : [];
      const ticketNo = `TCK-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
      const { error } = await supabase.from("tickets").insert({
        company_id: companyId!,
        ticket_no: ticketNo,
        title: form.title,
        description: form.description,
        branch: isEnabled(fieldItems, "branch") ? form.branch : "",
        priority: isEnabled(fieldItems, "priority") ? form.priority : "normal",
        requester_name: profile.data?.full_name || access.user?.email || "",
        requester_email: isEnabled(fieldItems, "email")
          ? (profile.data?.email ?? access.user?.email ?? null)
          : null,
        requester_phone: isEnabled(fieldItems, "phone") ? (profile.data?.phone ?? null) : null,
        created_by: access.user?.id ?? null,
        attachments: uploaded,
        custom_data: extras.reduce<Record<string, string>>((acc, f) => {
          if (extra[f.key]) acc[f.label] = extra[f.key]!;
          return acc;
        }, {}),
      });
      if (error) throw error;
      return ticketNo;
    },
    onSuccess: (no) => {
      toast.success("تم رفع التذكرة", { description: no });
      setForm({ title: "", description: "", branch: "", priority: "normal" });
      setFiles([]);
      setExtra({});
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

  const p = profile.data;

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
        <div className="space-y-6 self-start">
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-black">بياناتي الوظيفية</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
              {[
                ["الاسم", p?.full_name],
                ["الرقم الوظيفي", p?.employee_no],
                ["التحويلة", p?.extension],
                ["التخصص", p?.specialty],
                ["القسم", p?.department],
                ["الجوال", p?.phone],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-bold">{value || "—"}</dd>
                </div>
              ))}
            </dl>
          </section>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
            className="space-y-4 rounded-2xl border border-border bg-card p-6"
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

            {fieldItems
              .filter((f) => f.enabled)
              .map((f) => {
                if (f.key === "branch")
                  return (
                    <label key={f.key} className="block space-y-1.5">
                      <span className="text-xs font-bold text-muted-foreground">{f.label}</span>
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
                  );

                if (f.key === "priority")
                  return (
                    <div key={f.key} className="space-y-1.5">
                      <span className="text-xs font-bold text-muted-foreground">{f.label}</span>
                      <div className="flex gap-2">
                        {(Object.keys(PRIORITY_META) as Priority[]).map((pr) => (
                          <button
                            key={pr}
                            type="button"
                            onClick={() => setForm({ ...form, priority: pr })}
                            className={`flex-1 rounded-xl border px-2 py-2 text-xs font-bold transition ${
                              form.priority === pr
                                ? PRIORITY_META[pr].className
                                : "border-border bg-muted/40 text-muted-foreground"
                            }`}
                          >
                            {PRIORITY_META[pr].label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );

                if (f.key === "attachments")
                  return (
                    <div key={f.key} className="space-y-2">
                      <span className="text-xs font-bold text-muted-foreground">{f.label}</span>
                      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border px-3 py-4 text-xs font-bold text-muted-foreground">
                        <Paperclip className="h-4 w-4" /> اختر ملفات للإرفاق
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) => setFiles([...files, ...Array.from(e.target.files ?? [])])}
                        />
                      </label>
                      {files.map((file, i) => (
                        <div
                          key={`${file.name}-${i}`}
                          className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs"
                        >
                          <span className="flex-1 truncate font-bold">{file.name}</span>
                          <span className="text-muted-foreground">{formatSize(file.size)}</span>
                          <button
                            type="button"
                            aria-label="إزالة"
                            onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                            className="text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  );

                if (!f.custom) return null;

                return (
                  <label key={f.key} className="block space-y-1.5">
                    <span className="text-xs font-bold text-muted-foreground">{f.label}</span>
                    {f.type === "textarea" ? (
                      <textarea
                        rows={3}
                        required={f.required}
                        className="field"
                        value={extra[f.key] ?? ""}
                        onChange={(e) => setExtra({ ...extra, [f.key]: e.target.value })}
                      />
                    ) : f.type === "select" ? (
                      <select
                        required={f.required}
                        className="field"
                        value={extra[f.key] ?? ""}
                        onChange={(e) => setExtra({ ...extra, [f.key]: e.target.value })}
                      >
                        <option value="">غير محدد</option>
                        {f.options.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={f.type === "number" ? "number" : "text"}
                        required={f.required}
                        className="field"
                        value={extra[f.key] ?? ""}
                        onChange={(e) => setExtra({ ...extra, [f.key]: e.target.value })}
                      />
                    )}
                  </label>
                );
              })}

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
        </div>

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
