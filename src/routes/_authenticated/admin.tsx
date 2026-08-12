import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Building2,
  Loader2,
  LogOut,
  Plus,
  ExternalLink,
  Download,
  KeyRound,
  Info,
  Headset,
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  createCompany,
  getCompanyAccess,
  resetMemberPassword,
  listPlatformAgents,
  createPlatformAgent,
  removePlatformAgent,
} from "@/lib/admin.functions";
import { useAccess } from "@/lib/use-access";
import { usePlatformSettings } from "@/lib/platform";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "لوحة أدمن المنصة | إدارة اشتراكات الشركات" },
      {
        name: "description",
        content: "إنشاء وإدارة اشتراكات الشركات، مساراتها الخاصة، وحسابات الأدمن لكل شركة.",
      },
      { property: "og:title", content: "لوحة أدمن المنصة" },
      { property: "og:description", content: "إدارة اشتراكات الشركات وحسابات الأدمن." },
    ],
  }),
  component: SuperAdminPage,
});

const empty = {
  name: "",
  slug: "",
  tagline: "",
  plan: "trial",
  primary_color: "#2563eb",
  secondary_color: "#0f766e",
  branches: "",
  admin_name: "",
  admin_email: "",
  admin_password: "",
};

function SuperAdminPage() {
  const access = useAccess();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState(empty);
  const [open, setOpen] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [lastCreated, setLastCreated] = useState<{
    name: string;
    slug: string;
    admin_name: string;
    admin_email: string;
    admin_password: string;
  } | null>(null);

  const details = useQuery({
    queryKey: ["company-access", detailsId],
    enabled: !!detailsId,
    queryFn: () => getCompanyAccess({ data: { company_id: detailsId! } }),
  });

  const [newPasswords, setNewPasswords] = useState<Record<string, string>>({});

  const resetMutation = useMutation({
    mutationFn: async (userId: string) => {
      const password = generatePassword();
      await resetMemberPassword({ data: { user_id: userId, password } });
      return { userId, password };
    },
    onSuccess: ({ userId, password }) => {
      setNewPasswords((prev) => ({ ...prev, [userId]: password }));
      toast.success("تم تعيين كلمة مرور جديدة", { description: password });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const companies = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, slug, plan, is_active, created_at, managed_support")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async () =>
      createCompany({
        data: {
          ...form,
          branches: form.branches
            .split("\n")
            .map((b) => b.trim())
            .filter(Boolean),
        },
      }),
    onSuccess: (res) => {
      toast.success("تم إنشاء الشركة وحساب الأدمن");
      setLastCreated({
        name: form.name,
        slug: res.slug,
        admin_name: form.admin_name,
        admin_email: form.admin_email,
        admin_password: form.admin_password,
      });
      setForm(empty);
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["companies"] });
    },
    onError: (e: Error) => toast.error("فشل الإنشاء", { description: e.message }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("companies").update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["companies"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleManaged = useMutation({
    mutationFn: async ({ id, managed }: { id: string; managed: boolean }) => {
      const { error } = await supabase
        .from("companies")
        .update({ managed_support: managed })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم تحديث نوع الدعم للشركة");
      void qc.invalidateQueries({ queryKey: ["companies"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  };

  if (!access.loading && !access.isSuperAdmin) {
    return (
      <div className="grid min-h-screen place-items-center px-4 text-center">
        <div>
          <p className="text-lg font-black">هذه الصفحة مخصصة لأدمن المنصة</p>
          <Link to="/portal" className="mt-3 inline-block text-sm font-bold text-primary">
            العودة إلى حسابك
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-base font-black">لوحة أدمن المنصة</h1>
              <p className="text-xs text-muted-foreground">إدارة اشتراكات الشركات</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-bold"
          >
            <LogOut className="h-4 w-4" /> خروج
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <PlatformContactCard />
        <PlatformStaffCard />

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black">الشركات المشتركة</h2>
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-black text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> شركة جديدة
          </button>
        </div>


        {open && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
            className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2"
          >
            <F label="اسم الشركة">
              <input
                required
                className="field"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </F>
            <F label="المسار (slug) — يظهر في الرابط">
              <input
                required
                dir="ltr"
                pattern="[a-z0-9-]+"
                className="field"
                placeholder="acme"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
              />
            </F>
            <F label="الوصف / الشعار النصي">
              <input
                className="field"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              />
            </F>
            <F label="الباقة">
              <select
                className="field"
                value={form.plan}
                onChange={(e) => setForm({ ...form, plan: e.target.value })}
              >
                <option value="trial">تجريبية</option>
                <option value="basic">أساسية</option>
                <option value="pro">احترافية</option>
                <option value="enterprise">مؤسسات</option>
              </select>
            </F>
            <F label="اللون الأساسي">
              <input
                type="color"
                className="field h-11 p-1"
                value={form.primary_color}
                onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
              />
            </F>
            <F label="اللون الثانوي">
              <input
                type="color"
                className="field h-11 p-1"
                value={form.secondary_color}
                onChange={(e) => setForm({ ...form, secondary_color: e.target.value })}
              />
            </F>
            <div className="sm:col-span-2">
              <F label="الفروع (فرع في كل سطر)">
                <textarea
                  rows={3}
                  className="field"
                  value={form.branches}
                  onChange={(e) => setForm({ ...form, branches: e.target.value })}
                />
              </F>
            </div>
            <F label="اسم أدمن الشركة">
              <input
                required
                className="field"
                value={form.admin_name}
                onChange={(e) => setForm({ ...form, admin_name: e.target.value })}
              />
            </F>
            <F label="بريد أدمن الشركة">
              <input
                required
                type="email"
                dir="ltr"
                className="field"
                value={form.admin_email}
                onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
              />
            </F>
            <F label="كلمة مرور الأدمن (8 أحرف فأكثر)">
              <input
                required
                minLength={8}
                dir="ltr"
                className="field"
                value={form.admin_password}
                onChange={(e) => setForm({ ...form, admin_password: e.target.value })}
              />
            </F>
            <div className="flex items-end">
              <button
                disabled={mutation.isPending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground disabled:opacity-60"
              >
                {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                إنشاء الاشتراك
              </button>
            </div>
          </form>
        )}

        {lastCreated && (
          <div className="space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black">بيانات تسجيل الاشتراك الجديد</h3>
              <button
                onClick={() =>
                  downloadText(
                    `${lastCreated.slug}-access.txt`,
                    buildAccessText(window.location.origin, lastCreated),
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-black text-primary-foreground"
              >
                <Download className="h-4 w-4" /> تحميل ملف نصي
              </button>
            </div>
            <pre
              dir="ltr"
              className="overflow-x-auto whitespace-pre-wrap rounded-xl bg-background p-4 text-xs"
            >
              {buildAccessText(
                typeof window !== "undefined" ? window.location.origin : "",
                lastCreated,
              )}
            </pre>
            <button
              onClick={() => setLastCreated(null)}
              className="text-xs font-bold text-muted-foreground"
            >
              إخفاء
            </button>
          </div>
        )}

        {detailsId && (
          <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
            {details.isLoading && (
              <p className="text-sm text-muted-foreground">جارٍ تحميل بيانات الاشتراك…</p>
            )}
            {details.data && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black">{details.data.company.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      الباقة: {details.data.company.plan} —{" "}
                      {details.data.company.is_active ? "مفعّلة" : "موقوفة"}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      downloadText(
                        `${details.data!.company.slug}-subscription.txt`,
                        buildCompanyText(window.location.origin, details.data!, newPasswords),
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-black text-primary-foreground"
                  >
                    <Download className="h-4 w-4" /> تحميل ملف البيانات
                  </button>
                </div>

                <div className="grid gap-2 rounded-xl bg-muted/50 p-4 text-xs" dir="ltr">
                  <Row k="Portal" v={`/c/${details.data.company.slug}`} />
                  <Row k="Tracking" v={`/c/${details.data.company.slug}/track`} />
                  <Row k="Admin panel" v={`/c/${details.data.company.slug}/admin`} />
                  <Row k="Employee portal" v={`/c/${details.data.company.slug}/me`} />
                  <Row k="Login" v={`/auth`} />
                </div>

                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-muted/60 text-muted-foreground">
                      <tr>
                        <th className="p-2">الاسم</th>
                        <th className="p-2">البريد</th>
                        <th className="p-2">الصلاحية</th>
                        <th className="p-2">كلمة المرور</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.data.members.map((m) => (
                        <tr key={m.user_id} className="border-t border-border">
                          <td className="p-2 font-bold">{m.full_name || "—"}</td>
                          <td className="p-2 font-mono" dir="ltr">
                            {m.email}
                          </td>
                          <td className="p-2">{ROLE_LABEL[m.role] ?? m.role}</td>
                          <td className="p-2">
                            {newPasswords[m.user_id] ? (
                              <span className="font-mono" dir="ltr">
                                {newPasswords[m.user_id]}
                              </span>
                            ) : (
                              <button
                                onClick={() => resetMutation.mutate(m.user_id)}
                                disabled={resetMutation.isPending}
                                className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 font-bold"
                              >
                                <KeyRound className="h-3 w-3" /> توليد كلمة مرور
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  كلمات المرور مشفّرة ولا يمكن استرجاعها؛ استخدم «توليد كلمة مرور» لإصدار كلمة جديدة
                  وتسليمها للعميل.
                </p>
              </>
            )}
          </section>
        )}

        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-right text-sm">
            <thead className="bg-muted/60 text-xs text-muted-foreground">
              <tr>
                <th className="p-3">الشركة</th>
                <th className="p-3">المسار</th>
                <th className="p-3">الباقة</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">نوع الدعم</th>
                <th className="p-3">روابط</th>
              </tr>
            </thead>
            <tbody>
              {companies.data?.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="p-3 font-bold">{c.name}</td>
                  <td className="p-3 font-mono text-xs" dir="ltr">
                    /c/{c.slug}
                  </td>
                  <td className="p-3">{c.plan}</td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleActive.mutate({ id: c.id, active: !c.is_active })}
                      className={`rounded-lg border px-2 py-1 text-xs font-bold ${
                        c.is_active
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border bg-muted text-muted-foreground"
                      }`}
                    >
                      {c.is_active ? "مفعّلة" : "موقوفة"}
                    </button>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() =>
                        toggleManaged.mutate({ id: c.id, managed: !c.managed_support })
                      }
                      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-bold ${
                        c.managed_support
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border bg-muted text-muted-foreground"
                      }`}
                    >
                      <Headset className="h-3 w-3" />
                      {c.managed_support ? "دعم من فريقنا" : "دعم داخلي للشركة"}
                    </button>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-3 text-xs font-bold text-primary">
                      <Link to="/c/$slug" params={{ slug: c.slug }}>
                        بوابة التذاكر <ExternalLink className="inline h-3 w-3" />
                      </Link>
                      <Link to="/c/$slug/admin" params={{ slug: c.slug }}>
                        لوحة الشركة
                      </Link>
                      <button
                        onClick={() => setDetailsId(detailsId === c.id ? null : c.id)}
                        className="inline-flex items-center gap-1 font-bold text-foreground"
                      >
                        <Info className="h-3 w-3" /> بيانات الاشتراك
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {companies.data?.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    لا توجد شركات بعد — أنشئ أول اشتراك.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-mono">{v}</span>
    </div>
  );
}

function buildAccessText(
  origin: string,
  c: { name: string; slug: string; admin_name: string; admin_email: string; admin_password: string },
) {
  return [
    `Company: ${c.name}`,
    `Path: /c/${c.slug}`,
    `Portal URL: ${origin}/c/${c.slug}`,
    `Tracking URL: ${origin}/c/${c.slug}/track`,
    `Admin panel: ${origin}/c/${c.slug}/admin`,
    `Employee portal: ${origin}/c/${c.slug}/me`,
    `Login page: ${origin}/auth`,
    ``,
    `Admin name: ${c.admin_name}`,
    `Admin email: ${c.admin_email}`,
    `Admin password: ${c.admin_password}`,
  ].join("\n");
}

function buildCompanyText(
  origin: string,
  data: {
    company: { name: string; slug: string; plan: string; is_active: boolean };
    members: { user_id: string; full_name: string; email: string; role: string }[];
  },
  passwords: Record<string, string>,
) {
  const lines = [
    `Company: ${data.company.name}`,
    `Plan: ${data.company.plan}`,
    `Status: ${data.company.is_active ? "active" : "suspended"}`,
    `Path: /c/${data.company.slug}`,
    `Portal URL: ${origin}/c/${data.company.slug}`,
    `Tracking URL: ${origin}/c/${data.company.slug}/track`,
    `Admin panel: ${origin}/c/${data.company.slug}/admin`,
    `Employee portal: ${origin}/c/${data.company.slug}/me`,
    `Login page: ${origin}/auth`,
    ``,
    `Accounts:`,
  ];
  for (const m of data.members) {
    lines.push(
      `- ${m.full_name || "-"} | ${m.email} | ${m.role}${
        passwords[m.user_id] ? ` | password: ${passwords[m.user_id]}` : ""
      }`,
    );
  }
  return lines.join("\n");
}

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#";
  const arr = new Uint32Array(12);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join("");
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const ROLE_LABEL: Record<string, string> = {
  company_admin: "أدمن الشركة",
  agent: "فني دعم",
  employee: "موظف",
  super_admin: "أدمن المنصة",
  platform_agent: "فني دعم المنصة",
};

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function PlatformContactCard() {
  const qc = useQueryClient();
  const settings = usePlatformSettings();
  const [form, setForm] = useState<{ contact_email: string; whatsapp: string } | null>(null);
  const current = form ?? {
    contact_email: settings.data?.contact_email ?? "",
    whatsapp: settings.data?.whatsapp ?? "",
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!settings.data?.id) throw new Error("لا توجد إعدادات");
      const { error } = await supabase
        .from("platform_settings")
        .update({ contact_email: current.contact_email, whatsapp: current.whatsapp })
        .eq("id", settings.data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم حفظ بيانات التواصل");
      void qc.invalidateQueries({ queryKey: ["platform-settings"] });
    },
    onError: (e: Error) => toast.error("تعذّر الحفظ", { description: e.message }),
  });

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-base font-black">بيانات التواصل في الصفحة الرئيسية</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        تظهر هذه البيانات في أزرار «اطلب الخدمة» بالصفحة الرئيسية.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="mt-4 grid gap-4 sm:grid-cols-3"
      >
        <F label="البريد الإلكتروني">
          <input
            required
            type="email"
            dir="ltr"
            className="field"
            value={current.contact_email}
            onChange={(e) => setForm({ ...current, contact_email: e.target.value })}
          />
        </F>
        <F label="رقم واتساب (بصيغة دولية)">
          <input
            required
            dir="ltr"
            className="field"
            placeholder="966500000000"
            value={current.whatsapp}
            onChange={(e) => setForm({ ...current, whatsapp: e.target.value })}
          />
        </F>
        <div className="flex items-end">
          <button
            disabled={save.isPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground disabled:opacity-60"
          >
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />} حفظ
          </button>
        </div>
      </form>
    </section>
  );
}

function PlatformStaffCard() {
  const qc = useQueryClient();
  const access = useAccess();
  const [form, setForm] = useState({ full_name: "", email: "", password: "", phone: "" });
  const [open, setOpen] = useState(false);

  const agents = useQuery({
    queryKey: ["platform-agents"],
    queryFn: () => listPlatformAgents(),
    enabled: access.isSuperAdmin,
    retry: false,
  });


  const create = useMutation({
    mutationFn: async () => createPlatformAgent({ data: form }),
    onSuccess: (res) => {
      toast.success("تم إنشاء عضوية فني دعم المنصة", {
        description: `${res.email} — ${res.password}`,
      });
      setForm({ full_name: "", email: "", password: "", phone: "" });
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["platform-agents"] });
    },
    onError: (e: Error) => toast.error("تعذّر الإنشاء", { description: e.message }),
  });

  const remove = useMutation({
    mutationFn: async (user_id: string) => removePlatformAgent({ data: { user_id } }),
    onSuccess: () => {
      toast.success("تم حذف العضوية");
      void qc.invalidateQueries({ queryKey: ["platform-agents"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!access.isSuperAdmin) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="inline-flex items-center gap-2 text-base font-black">
            <Headset className="h-4 w-4 text-primary" /> فريق دعم المنصة
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            عضويات موظفي الدعم لدينا — يتابعون تذاكر الشركات المفعّل لها «دعم من فريقنا» عبر
            المسار <span dir="ltr" className="font-mono">/support</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/support"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-bold"
          >
            فتح مركز الدعم
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-black text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> عضوية جديدة
          </button>
        </div>
      </div>

      {open && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
          className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <F label="الاسم الكامل">
            <input
              required
              className="field"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </F>
          <F label="البريد الإلكتروني">
            <input
              required
              type="email"
              dir="ltr"
              className="field"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </F>
          <F label="كلمة المرور (8 أحرف فأكثر)">
            <div className="flex gap-2">
              <input
                required
                minLength={8}
                dir="ltr"
                className="field"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setForm({ ...form, password: generatePassword() })}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border"
                aria-label="توليد كلمة مرور"
              >
                <KeyRound className="h-4 w-4" />
              </button>
            </div>
          </F>
          <F label="الجوال (اختياري)">
            <input
              dir="ltr"
              className="field"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </F>
          <div className="flex items-end">
            <button
              disabled={create.isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground disabled:opacity-60"
            >
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />} إنشاء العضوية
            </button>
          </div>
        </form>
      )}

      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-right text-xs">
          <thead className="bg-muted/60 text-muted-foreground">
            <tr>
              <th className="p-2">الاسم</th>
              <th className="p-2">البريد</th>
              <th className="p-2">الجوال</th>
              <th className="p-2">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {(agents.data ?? []).map((a) => (
              <tr key={a.user_id} className="border-t border-border">
                <td className="p-2 font-bold">{a.full_name || "—"}</td>
                <td className="p-2 font-mono" dir="ltr">
                  {a.email}
                </td>
                <td className="p-2" dir="ltr">
                  {a.phone || "—"}
                </td>
                <td className="p-2">
                  <button
                    onClick={() => remove.mutate(a.user_id)}
                    disabled={remove.isPending}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 font-bold text-destructive"
                  >
                    <Trash2 className="h-3 w-3" /> حذف
                  </button>
                </td>
              </tr>
            ))}
            {agents.data?.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-muted-foreground">
                  لا توجد عضويات دعم بعد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
