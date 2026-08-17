import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Loader2,
  LogOut,
  Plus,
  Save,
  Trash2,
  Users,
  Headset,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createCompanyMember } from "@/lib/admin.functions";
import { PRIORITY_META, STATUS_META, type Priority, type Status } from "@/lib/tickets";
import {
  buildFieldConfig,
  fieldsFromConfig,
  newCustomKey,
  type CustomFieldType,
  type FieldItem,
} from "@/lib/company-settings";
import { resizeImage } from "@/lib/image-resize";
import { useAccess } from "@/lib/use-access";

import { AccessGate } from "@/components/AccessGate";
import { CompanyReports } from "@/components/CompanyReports";

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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CompanyAdminGuard,
});

function CompanyAdminGuard() {
  const { slug } = Route.useParams();
  const access = useAccess();
  const isStaff = access.role === "company_admin" || access.role === "agent";
  const allowed =
    access.isSuperAdmin || (isStaff && !!access.companySlug && access.companySlug === slug);
  return (
    <AccessGate
      loading={access.loading}
      allowed={allowed}
      message="لا تملك صلاحية الوصول إلى لوحة هذه الشركة"
    >
      <CompanyAdminPage />
    </AccessGate>
  );
}

type Tab = "tickets" | "reports" | "settings" | "users";

function CompanyAdminPage() {
  const { slug } = Route.useParams();
  const access = useAccess();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("tickets");
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [status, setStatus] = useState<Status | "all">("all");
  const [branchName, setBranchName] = useState("");
  const [newField, setNewField] = useState<{ label: string; type: CustomFieldType; options: string }>(
    { label: "", type: "text", options: "" },
  );
  const [member, setMember] = useState({
    full_name: "",
    email: "",
    password: "",
    employee_no: "",
    extension: "",
    specialty: "",
    department: "",
    phone: "",
    role: "employee" as "company_admin" | "agent" | "employee",
  });
  const [settings, setSettings] = useState<{
    name: string;
    tagline: string;
    logo_url: string;
    fields: FieldItem[];
  } | null>(null);


  const company = useQuery({
    queryKey: ["company", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select(
          "id, name, slug, tagline, logo_url, primary_color, secondary_color, form_fields, field_config, managed_support",
        )
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (data && !settings) {
        setSettings({
          name: data.name ?? "",
          tagline: data.tagline ?? "",
          logo_url: data.logo_url ?? "",
          fields: buildFieldConfig(data.form_fields, data.field_config),
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
        supabase
          .from("profiles")
          .select("id, full_name, email, employee_no, extension, specialty, department")
          .eq("company_id", companyId!),
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
        author_name: access.fullName || "فريق الدعم",
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
          name: settings.name,
          tagline: settings.tagline,
          logo_url: settings.logo_url || null,
          form_fields: fieldsFromConfig(settings.fields),
          field_config: settings.fields,

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
    mutationFn: async () => createCompanyMember({ data: { company_id: companyId!, ...member } }),
    onSuccess: () => {
      toast.success("تم إنشاء الحساب");
      setMember({
        full_name: "",
        email: "",
        password: "",
        employee_no: "",
        extension: "",
        specialty: "",
        department: "",
        phone: "",
        role: "employee",
      });

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
    void navigate({ to: "/c/$slug/login", params: { slug }, replace: true });
  };

  const fields = settings?.fields ?? [];

  const moveField = (index: number, dir: -1 | 1) => {
    if (!settings) return;
    const next = [...settings.fields];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    setSettings({ ...settings, fields: next });
  };

  const updateField = (index: number, patch: Partial<FieldItem>) => {
    if (!settings) return;
    const next = settings.fields.map((f, i) => (i === index ? { ...f, ...patch } : f));
    setSettings({ ...settings, fields: next });
  };

  const removeField = (index: number) => {
    if (!settings) return;
    setSettings({ ...settings, fields: settings.fields.filter((_, i) => i !== index) });
  };

  const addCustomField = () => {
    if (!settings || !newField.label.trim()) return;
    setSettings({
      ...settings,
      fields: [
        ...settings.fields,
        {
          key: newCustomKey(),
          label: newField.label.trim(),
          enabled: true,
          custom: true,
          core: false,
          type: newField.type,
          required: false,

          options: newField.options
            .split(",")
            .map((o) => o.trim())
            .filter(Boolean),
        },
      ],
    });
    setNewField({ label: "", type: "text", options: "" });
  };


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
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(
            [
              ["tickets", "التذاكر"],
              ["reports", "التقارير"],
              ["settings", "التخصيص والحقول"],
              ["users", "العضويات"],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black transition ${
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
        {company.data?.managed_support && (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/20 text-primary">
              <Headset className="h-4 w-4" />
            </span>
            <div className="text-sm">
              <p className="font-black text-primary">نظام خدمة الدعم الفني عن بُعد فعّال</p>
              <p className="text-xs text-muted-foreground">
                فريق دعم «لمحة الآمنة» يتابع تذاكر شركتكم ويرد عليها مباشرة على مدار الاشتراك.
              </p>
            </div>
          </div>
        )}
        {tab === "tickets" && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
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
                    <th className="p-3">مقدّم الطلب</th>
                    <th className="p-3">الفرع</th>
                    <th className="p-3">الأهمية</th>
                    <th className="p-3">الحالة</th>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => (
                    <tr key={t.id} className="border-t border-border">
                      <td className="p-3 text-xs font-bold" dir="ltr">
                        <Link
                          to="/c/$slug/tickets/$ticketId"
                          params={{ slug, ticketId: t.id }}
                          className="text-primary hover:underline"
                        >
                          {t.ticket_no}
                        </Link>
                      </td>
                      <td className="p-3 font-bold">
                        <Link
                          to="/c/$slug/tickets/$ticketId"
                          params={{ slug, ticketId: t.id }}
                          className="hover:underline"
                        >
                          {t.title}
                        </Link>
                      </td>
                      <td className="p-3 text-xs">{t.requester_name || "—"}</td>
                      <td className="p-3 text-xs">{t.branch || "—"}</td>
                      <td className="p-3 text-xs">
                        {PRIORITY_META[t.priority as Priority]?.label ?? t.priority}
                      </td>
                      <td className="p-3 text-xs">
                        {STATUS_META[t.status as Status]?.label ?? t.status}
                      </td>
                      <td className="p-3 text-xs">
                        {new Date(t.created_at).toLocaleDateString("ar-SA-u-ca-gregory")}
                      </td>
                      <td className="p-3">
                        <select
                          className="field h-9 w-auto py-1 text-xs"
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
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        {tickets.isLoading ? "جارِ التحميل…" : "لا توجد تذاكر."}
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
                <span className="text-xs font-bold text-muted-foreground">اسم الشركة</span>
                <input
                  className="field"
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-muted-foreground">الوصف المختصر</span>
                <input
                  className="field"
                  value={settings.tagline}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                />
              </label>
              <div className="space-y-2">
                <span className="text-xs font-bold text-muted-foreground">شعار الشركة</span>
                <div className="flex items-center gap-3">
                  {settings.logo_url ? (
                    <img
                      src={settings.logo_url}
                      alt="شعار الشركة"
                      className="h-16 w-16 rounded-xl border border-border object-contain"
                    />
                  ) : (
                    <span className="grid h-16 w-16 place-items-center rounded-xl bg-primary text-xl font-black text-primary-foreground">
                      {settings.name.trim().charAt(0) || "ش"}
                    </span>
                  )}
                  <div className="flex flex-1 flex-col gap-2">
                    <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-bold hover:bg-muted">
                      رفع شعار من جهازك
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (!file) return;
                          try {
                            const dataUrl = await resizeImage(file, 256);
                            setSettings((s) => (s ? { ...s, logo_url: dataUrl } : s));
                            toast.success("تم تحميل الشعار — لا تنسَ حفظ الإعدادات");
                          } catch {
                            toast.error("تعذّر قراءة الصورة");
                          }
                        }}
                      />
                    </label>
                    {settings.logo_url && (
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, logo_url: "" })}
                        className="text-xs font-bold text-muted-foreground hover:text-destructive"
                      >
                        إزالة الشعار
                      </button>
                    )}
                  </div>
                </div>
                <input
                  dir="ltr"
                  className="field"
                  placeholder="أو الصق رابط الشعار"
                  value={settings.logo_url.startsWith("data:") ? "" : settings.logo_url}
                  onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                />
              </div>


              <h3 className="pt-2 text-sm font-black">حقول نموذج التذكرة</h3>
              <p className="text-xs text-muted-foreground">
                يمكنك تعديل مسمّى أي حقل، تفعيله أو إخفاؤه، جعله إلزامياً، إعادة ترتيبه، وحذف ما لا
                تحتاجه (عدا عنوان التذكرة). تُحفظ كل التغييرات في قاعدة البيانات.
              </p>
              <div className="space-y-2">
                {fields.map((f, i) => (
                  <div
                    key={f.key}
                    className="rounded-xl border border-border px-3 py-2 text-xs font-bold"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        aria-label={`تفعيل ${f.label}`}
                        className="h-4 w-4 accent-[var(--color-primary)]"
                        checked={f.enabled}
                        disabled={f.key === "title"}
                        onChange={(e) => updateField(i, { enabled: e.target.checked })}
                      />
                      <input
                        className="field h-9 flex-1 py-1 text-xs"
                        aria-label={`مسمّى الحقل ${f.label}`}
                        value={f.label}
                        onChange={(e) => updateField(i, { label: e.target.value })}
                      />
                      <button
                        type="button"
                        aria-label="تحريك لأعلى"
                        onClick={() => moveField(i, -1)}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-border disabled:opacity-30"
                        disabled={i === 0}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="تحريك لأسفل"
                        onClick={() => moveField(i, 1)}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-border disabled:opacity-30"
                        disabled={i === fields.length - 1}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      {!f.core && (
                        <button
                          type="button"
                          aria-label={`حذف ${f.label}`}
                          onClick={() => removeField(i)}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-border text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-normal">
                      {f.custom && (
                        <select
                          className="field h-9 w-auto py-1 text-xs"
                          aria-label={`نوع الحقل ${f.label}`}
                          value={f.type}
                          onChange={(e) =>
                            updateField(i, { type: e.target.value as CustomFieldType })
                          }
                        >
                          <option value="text">نص قصير</option>
                          <option value="textarea">نص طويل</option>
                          <option value="number">رقم</option>
                          <option value="select">قائمة اختيار</option>
                        </select>
                      )}
                      {f.custom && f.type === "select" && (
                        <input
                          className="field h-9 flex-1 py-1 text-xs"
                          placeholder="الخيارات مفصولة بفاصلة"
                          value={f.options.join("، ")}
                          onChange={(e) =>
                            updateField(i, {
                              options: e.target.value
                                .split(/[،,]/)
                                .map((o) => o.trim())
                                .filter(Boolean),
                            })
                          }
                        />
                      )}
                      {f.key !== "attachments" && (
                        <label className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 accent-[var(--color-primary)]"
                            checked={f.required}
                            disabled={f.key === "title"}
                            onChange={(e) => updateField(i, { required: e.target.checked })}
                          />
                          إلزامي
                        </label>
                      )}
                      {!f.custom && (
                        <span className="text-muted-foreground">
                          {f.core ? "حقل جوهري" : "حقل أساسي"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>


              <div className="flex flex-wrap gap-2 rounded-xl border border-dashed border-border p-3">
                <input
                  className="field h-10 flex-1 py-1 text-xs"
                  placeholder="اسم حقل جديد"
                  value={newField.label}
                  onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                />
                <select
                  className="field h-10 w-auto py-1 text-xs"
                  value={newField.type}
                  onChange={(e) =>
                    setNewField({ ...newField, type: e.target.value as CustomFieldType })
                  }
                >
                  <option value="text">نص قصير</option>
                  <option value="textarea">نص طويل</option>
                  <option value="number">رقم</option>
                  <option value="select">قائمة اختيار</option>
                </select>
                <button
                  type="button"
                  onClick={addCustomField}
                  aria-label="إضافة حقل"
                  className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground"
                >
                  <Plus className="h-4 w-4" />
                </button>
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
              <input
                className="field"
                placeholder="الرقم الوظيفي"
                value={member.employee_no}
                onChange={(e) => setMember({ ...member, employee_no: e.target.value })}
              />
              <input
                className="field"
                placeholder="التحويلة"
                value={member.extension}
                onChange={(e) => setMember({ ...member, extension: e.target.value })}
              />
              <input
                className="field"
                placeholder="التخصص"
                value={member.specialty}
                onChange={(e) => setMember({ ...member, specialty: e.target.value })}
              />
              <input
                className="field"
                placeholder="القسم"
                value={member.department}
                onChange={(e) => setMember({ ...member, department: e.target.value })}
              />
              <input
                dir="ltr"
                className="field"
                placeholder="الجوال"
                value={member.phone}
                onChange={(e) => setMember({ ...member, phone: e.target.value })}
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

            <div className="space-y-6">
              <MembersSection
                title="العضويات الإدارية"
                hint="مشرفو لوحة التحكم — صلاحية كاملة على التذاكر والإعدادات."
                rows={(members.data ?? []).filter((m) => m.role === "company_admin")}
              />
              <MembersSection
                title="موظفو الشركة"
                hint="يرفعون التذاكر ويتابعون سجلهم الخاص فقط."
                rows={(members.data ?? []).filter((m) => m.role === "employee")}
              />
              <MembersSection
                title="فريق الدعم الفني"
                hint="فنيو الدعم داخل الشركة — يستعرضون التذاكر ويردون عليها."
                rows={(members.data ?? []).filter((m) => m.role === "agent")}
              />
            </div>
          </div>
        )}

        {tab === "reports" && companyId && (
          <CompanyReports
            companyId={companyId}
            companyName={company.data?.name ?? ""}
            fields={fields}
          />
        )}

      </main>
    </div>
  );
}

type MemberRow = {
  id: string;
  full_name: string;
  email: string;
  employee_no: string | null;
  extension: string | null;
  specialty: string | null;
  department: string | null;
  role: string;
};

function MembersSection({
  title,
  hint,
  rows,
}: {
  title: string;
  hint: string;
  rows: MemberRow[];
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <h3 className="text-sm font-black">{title}</h3>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        <span className="rounded-lg bg-muted px-2 py-1 text-xs font-bold text-muted-foreground">
          {rows.length} عضوية
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="bg-muted/60 text-xs text-muted-foreground">
            <tr>
              <th className="p-3">الاسم</th>
              <th className="p-3">البريد</th>
              <th className="p-3">الرقم الوظيفي</th>
              <th className="p-3">التحويلة</th>
              <th className="p-3">التخصص</th>
              <th className="p-3">القسم</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id} className="border-t border-border">
                <td className="p-3 font-bold">{m.full_name || "—"}</td>
                <td className="p-3 text-xs" dir="ltr">
                  {m.email}
                </td>
                <td className="p-3 text-xs">{m.employee_no || "—"}</td>
                <td className="p-3 text-xs">{m.extension || "—"}</td>
                <td className="p-3 text-xs">{m.specialty || "—"}</td>
                <td className="p-3 text-xs">{m.department || "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-xs text-muted-foreground">
                  لا توجد عضويات في هذا القسم بعد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
