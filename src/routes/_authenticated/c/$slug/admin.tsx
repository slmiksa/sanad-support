import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, LogOut, Plus, Save, Trash2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createCompanyMember } from "@/lib/admin.functions";
import { PRIORITY_META, STATUS_META, type Priority, type Status } from "@/lib/tickets";
import { DEFAULT_FIELDS, FIELD_LABELS, parseFields, type FormFields } from "@/lib/company-settings";
import { useAccess } from "@/lib/use-access";

export const Route = createFileRoute("/_authenticated/c/$slug/admin")({
  head: () => ({
    meta: [
      { title: "لوحة تحكم تذاكر الشركة | نظام الدعم الفني" },
      {
        name: "description",
        content: "متابعة تذاكر الشركة، تغيير الحالات، تخصيص الحقول والألوان، وإدارة الفروع والمستخدمين.",
      },
      { property: "og:title", content: "لوحة تحكم تذاكر الشركة" },
      { property: "og:description", content: "إدارة كاملة لتذاكر الدعم الفني داخل شركتك." },
    ],
  }),
  component: CompanyAdminPage,
});

type Tab = "tickets" | "settings" | "users";

function CompanyAdminPage() {
  const { slug } = Route.useParams();
  const access = useAccess();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const addMember = useServerFn(createCompanyMember);
  const [tab, setTab] = useState<Tab>("tickets");
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [status, setStatus] = useState<Status | "all">("all");
  const [branchName, setBranchName] = useState("");
  const [member, setMember] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "employee" as "company_admin" | "agent" | "employee",
  });
  const [settings, setSettings] = useState<{
    tagline: string;
    logo_url: string;
    primary_color: string;
    secondary_color: string;
    form_fields: FormFields;
  } | null>(null);

  const company = useQuery({
    queryKey: ["company", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, slug, tagline, logo_url, primary_color, secondary_color, form_fields")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (data && !settings) {
        setSettings({
          tagline: data.tagline ?? "",
          logo_url: data.logo_url ?? "",
          primary_color: data.primary_color,
          secondary_color: data.secondary_color,
          form_fields: parseFields(data.form_fields),
        });
      }
      return data;
    },
  });

  const companyId = company.data?.id ?? null;

  const tickets = useQuery({
    queryKey: ["tickets", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("id, ticket_no, title, branch, priority, status, requester_name, created_at")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

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

  const members = useQuery({
    queryKey: ["members", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email").eq("company_id", companyId!),
        supabase.from("user_roles").select("user_id, role").eq("company_id", companyId!),
      ]);
      return (profiles ?? []).map((p) => ({
        ...p,
        role: (roles ?? []).find((r) => r.user_id === p.id)?.role ?? "employee",
      }));
    },
  });

  const setTicketStatus = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: Status }) => {
      const { error } = await supabase
        .from("tickets")
        .update({ status: next, closed_at: next === "closed" ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
      await supabase.from("ticket_updates").insert({
        ticket_id: id,
        author_id: access.user?.id ?? null,
        author_name: access.user?.email ?? "فريق الدعم",
        note: `تم تغيير الحالة إلى: ${STATUS_META[next].label}`,
        status: next,
      });
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["tickets", companyId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const saveSettings = useMutation({
    mutationFn: async () => {
      if (!companyId || !settings) return;
      const { error } = await supabase
        .from("companies")
        .update({
          tagline: settings.tagline,
          logo_url: settings.logo_url || null,
          primary_color: settings.primary_color,
          secondary_color: settings.secondary_color,
          form_fields: settings.form_fields,
        })
        .eq("id", companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم حفظ إعدادات الشركة");
      void qc.invalidateQueries({ queryKey: ["company", slug] });
    },
    onError: (e: Error) => toast.error("تعذّر الحفظ", { description: e.message }),
  });

  const addBranch = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("branches")
        .insert({ company_id: companyId!, name: branchName.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      setBranchName("");
      void qc.invalidateQueries({ queryKey: ["branches", companyId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeBranch = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("branches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["branches", companyId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const memberMutation = useMutation({
    mutationFn: async () => addMember({ data: { company_id: companyId!, ...member } }),
    onSuccess: () => {
      toast.success("تم إنشاء الحساب");
      setMember({ full_name: "", email: "", password: "", role: "employee" });
      void qc.invalidateQueries({ queryKey: ["members", companyId] });
    },
    onError: (e: Error) => toast.error("تعذّر الإنشاء", { description: e.message }),
  });

  const rows = useMemo(
    () =>
      (tickets.data ?? []).filter(
        (t) =>
          (priority === "all" || t.priority === priority) &&
          (status === "all" || t.status === status),
      ),
    [tickets.data, priority, status],
  );

  const stats = useMemo(() => {
    const all = tickets.data ?? [];
    return {
      total: all.length,
      open: all.filter((t) => t.status === "open").length,
      progress: all.filter((t) => t.status === "progress").length,
      resolved: all.filter((t) => t.status === "resolved").length,
    };
  }, [tickets.data]);

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  };

  const allowed =
    access.loading || access.isSuperAdmin || (!!companyId && access.companyId === companyId);

  if (!allowed) {
    return (
      <div className="grid min-h-screen place-items-center px-4 text-center">
        <div>
          <p className="text-lg font-black">لا تملك صلاحية الوصول إلى لوحة هذه الشركة</p>
          <Link to="/portal" className="mt-3 inline-block text-sm font-bold text-primary">
            العودة إلى حسابك
          </Link>
        </div>
      </div>
    );
  }

  const fields = settings?.form_fields ?? DEFAULT_FIELDS;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <h1 className="text-base font-black">{company.data?.name ?? "لوحة الشركة"}</h1>
            <p className="text-xs text-muted-foreground" dir="ltr">
              /c/{slug}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/c/$slug"
              params={{ slug }}
              className="rounded-xl border border-border px-3 py-2 text-xs font-bold"
            >
              بوابة التذاكر
            </Link>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-bold"
            >
              <LogOut className="h-4 w-4" /> خروج
            </button>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl gap-2 px-4 pb-3">
          {(
            [
              ["tickets", "التذاكر"],
              ["settings", "التخصيص والحقول"],
              ["users", "العضويات"],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                tab === key
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        {tab === "tickets" && (
          <>
            <div className="grid gap-4 sm:grid-cols-4">
              {[
                { label: "إجمالي التذاكر", value: stats.total },
                { label: "مفتوحة", value: stats.open },
                { label: "جاري المتابعة", value: stats.progress },
                { label: "تم الحل", value: stats.resolved },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-3xl font-black text-primary">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                className="field w-auto"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority | "all")}
              >
                <option value="all">كل الأهميات</option>
                {(Object.keys(PRIORITY_META) as Priority[]).map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_META[p].label}
                  </option>
                ))}
              </select>
              <select
                className="field w-auto"
                value={status}
                onChange={(e) => setStatus(e.target.value as Status | "all")}
              >
                <option value="all">كل الحالات</option>
                {(Object.keys(STATUS_META) as Status[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label}
                  </option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full text-right text-sm">
                <thead className="bg-muted/60 text-xs text-muted-foreground">
                  <tr>
                    <th className="p-3">رقم التذكرة</th>
                    <th className="p-3">العنوان</th>
                    <th className="p-3">الفرع</th>
                    <th className="p-3">الأهمية</th>
                    <th className="p-3">مقدم الطلب</th>
                    <th className="p-3">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.isLoading && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        جارٍ التحميل...
                      </td>
                    </tr>
                  )}
                  {rows.map((t) => (
                    <tr key={t.id} className="border-t border-border">
                      <td className="p-3 font-mono text-xs" dir="ltr">
                        {t.ticket_no}
                      </td>
                      <td className="p-3 font-bold">{t.title}</td>
                      <td className="p-3 text-xs text-muted-foreground">{t.branch}</td>
                      <td className="p-3">
                        <span
                          className={`rounded-lg border px-2 py-1 text-xs font-bold ${
                            PRIORITY_META[t.priority as Priority].className
                          }`}
                        >
                          {PRIORITY_META[t.priority as Priority].label}
                        </span>
                      </td>
                      <td className="p-3 text-xs">{t.requester_name}</td>
                      <td className="p-3">
                        <select
                          className="field w-auto py-1 text-xs"
                          value={t.status}
                          onChange={(e) =>
                            setTicketStatus.mutate({ id: t.id, next: e.target.value as Status })
                          }
                        >
                          {(Object.keys(STATUS_META) as Status[]).map((s) => (
                            <option key={s} value={s}>
                              {STATUS_META[s].label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                  {!tickets.isLoading && rows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        لا توجد تذاكر مطابقة.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "settings" && settings && (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-black">هوية الشركة</h2>
              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-muted-foreground">الوصف المختصر</span>
                <input
                  className="field"
                  value={settings.tagline}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-muted-foreground">رابط الشعار</span>
                <input
                  dir="ltr"
                  className="field"
                  value={settings.logo_url}
                  onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-xs font-bold text-muted-foreground">اللون الأساسي</span>
                  <input
                    type="color"
                    className="h-11 w-full rounded-xl border border-border bg-background"
                    value={settings.primary_color}
                    onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-bold text-muted-foreground">اللون الثانوي</span>
                  <input
                    type="color"
                    className="h-11 w-full rounded-xl border border-border bg-background"
                    value={settings.secondary_color}
                    onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                  />
                </label>
              </div>

              <h3 className="pt-2 text-sm font-black">حقول نموذج التذكرة</h3>
              <div className="space-y-2">
                {(Object.keys(FIELD_LABELS) as (keyof FormFields)[]).map((key) => (
                  <label
                    key={key}
                    className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-xs font-bold"
                  >
                    {FIELD_LABELS[key]}
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[var(--color-primary)]"
                      checked={fields[key]}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          form_fields: { ...fields, [key]: e.target.checked },
                        })
                      }
                    />
                  </label>
                ))}
              </div>

              <button
                onClick={() => saveSettings.mutate()}
                disabled={saveSettings.isPending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground disabled:opacity-60"
              >
                {saveSettings.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                حفظ الإعدادات
              </button>
            </section>

            <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-black">الفروع</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (branchName.trim()) addBranch.mutate();
                }}
                className="flex gap-2"
              >
                <input
                  className="field"
                  placeholder="اسم الفرع"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                />
                <button className="rounded-xl bg-primary px-4 text-sm font-black text-primary-foreground">
                  <Plus className="h-4 w-4" />
                </button>
              </form>
              <ul className="space-y-2">
                {(branches.data ?? []).map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm font-bold"
                  >
                    {b.name}
                    <button
                      onClick={() => removeBranch.mutate(b.id)}
                      className="text-destructive"
                      aria-label={`حذف ${b.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
                {(branches.data ?? []).length === 0 && (
                  <li className="text-xs text-muted-foreground">لا توجد فروع مضافة.</li>
                )}
              </ul>
            </section>
          </div>
        )}

        {tab === "users" && (
          <div className="space-y-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                memberMutation.mutate();
              }}
              className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-4"
            >
              <input
                required
                className="field"
                placeholder="الاسم"
                value={member.full_name}
                onChange={(e) => setMember({ ...member, full_name: e.target.value })}
              />
              <input
                required
                type="email"
                dir="ltr"
                className="field"
                placeholder="البريد"
                value={member.email}
                onChange={(e) => setMember({ ...member, email: e.target.value })}
              />
              <input
                required
                minLength={8}
                dir="ltr"
                className="field"
                placeholder="كلمة المرور"
                value={member.password}
                onChange={(e) => setMember({ ...member, password: e.target.value })}
              />
              <div className="flex gap-2">
                <select
                  className="field"
                  value={member.role}
                  onChange={(e) =>
                    setMember({ ...member, role: e.target.value as typeof member.role })
                  }
                >
                  <option value="employee">موظف (يرفع تذاكر)</option>
                  <option value="agent">فني دعم</option>
                  <option value="company_admin">مشرف لوحة التحكم</option>
                </select>
                <button
                  disabled={memberMutation.isPending}
                  className="rounded-xl bg-primary px-4 text-sm font-black text-primary-foreground disabled:opacity-60"
                >
                  {memberMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Users className="h-4 w-4" />
                  )}
                </button>
              </div>
            </form>

            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full text-right text-sm">
                <thead className="bg-muted/60 text-xs text-muted-foreground">
                  <tr>
                    <th className="p-3">الاسم</th>
                    <th className="p-3">البريد</th>
                    <th className="p-3">الصلاحية</th>
                  </tr>
                </thead>
                <tbody>
                  {(members.data ?? []).map((m) => (
                    <tr key={m.id} className="border-t border-border">
                      <td className="p-3 font-bold">{m.full_name || "—"}</td>
                      <td className="p-3 text-xs" dir="ltr">
                        {m.email}
                      </td>
                      <td className="p-3 text-xs">
                        {m.role === "company_admin"
                          ? "مشرف لوحة التحكم"
                          : m.role === "agent"
                            ? "فني دعم"
                            : "موظف"}
                      </td>
                    </tr>
                  ))}
                  {(members.data ?? []).length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-muted-foreground">
                        لا توجد عضويات بعد.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
