import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Building2, Loader2, LogOut, Plus, ExternalLink, Download, KeyRound, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createCompany, getCompanyAccess, resetMemberPassword } from "@/lib/admin.functions";
import { useAccess } from "@/lib/use-access";

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
  const create = useServerFn(createCompany);
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
  const fetchAccess = useServerFn(getCompanyAccess);
  const resetPassword = useServerFn(resetMemberPassword);

  const details = useQuery({
    queryKey: ["company-access", detailsId],
    enabled: !!detailsId,
    queryFn: () => fetchAccess({ data: { company_id: detailsId! } }),
  });

  const resetMutation = useMutation({
    mutationFn: async (userId: string) => {
      const password = generatePassword();
      await resetPassword({ data: { user_id: userId, password } });
      return password;
    },
    onSuccess: (password) => {
      toast.success("تم تعيين كلمة مرور جديدة", { description: password });
      setNewPasswords((p) => ({ ...p, [resetMutation.variables as string]: password }));
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const [newPasswords, setNewPasswords] = useState<Record<string, string>>({});

  const companies = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, slug, plan, is_active, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async () =>
      create({
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

        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-right text-sm">
            <thead className="bg-muted/60 text-xs text-muted-foreground">
              <tr>
                <th className="p-3">الشركة</th>
                <th className="p-3">المسار</th>
                <th className="p-3">الباقة</th>
                <th className="p-3">الحالة</th>
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
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
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

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
