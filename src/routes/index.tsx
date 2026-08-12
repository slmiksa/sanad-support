import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  LayoutDashboard,
  Loader2,
  LogIn,
  Palette,
  ShieldCheck,
  Sparkles,
  Ticket,
  UserCog,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "منصة تذاكر الدعم الفني للشركات | White-Label SaaS" },
      {
        name: "description",
        content:
          "منصة تذاكر دعم فني متعددة الشركات: مسار مستقل لكل شركة، تخصيص الحقول والألوان، عضويات مشرفين وموظفين، وعزل كامل للبيانات.",
      },
      { property: "og:title", content: "منصة تذاكر الدعم الفني للشركات" },
      {
        property: "og:description",
        content: "بوابة تذاكر مخصصة لكل شركة مع لوحة تحكم وإدارة عضويات واشتراكات مركزية.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const FEATURES = [
  {
    icon: Ticket,
    title: "بوابة تذاكر لكل شركة",
    body: "رابط مستقل /c/اسم-الشركة يستقبل التذاكر ويمنح مقدم الطلب رقم متابعة فوري.",
  },
  {
    icon: Palette,
    title: "تخصيص الحقول والألوان",
    body: "أدمن الشركة يتحكم من لوحته بألوان الهوية، الشعار، والحقول الظاهرة في نموذج التذكرة.",
  },
  {
    icon: Users,
    title: "عضويات المشرفين والموظفين",
    body: "أنشئ حسابات مشرفين للوحة التحكم وحسابات موظفين يرفعون التذاكر ويتابعون سجلهم الخاص.",
  },
  {
    icon: Building2,
    title: "اشتراكات متعددة الشركات",
    body: "أدمن المنصة الأم ينشئ اشتراك كل شركة، يحدد باقتها وفروعها، ويصدر لها حساب أدمن مستقل.",
  },
  {
    icon: LayoutDashboard,
    title: "لوحة متابعة كاملة",
    body: "إحصائيات لحظية، فلاتر للأهمية والحالة، وخط زمني لكل تحديث على التذكرة.",
  },
  {
    icon: ShieldCheck,
    title: "عزل كامل للبيانات",
    body: "سياسات أمان على مستوى الصف تضمن أن كل شركة ترى تذاكرها ومستخدميها فقط.",
  },
];

const STEPS = [
  { title: "١. إنشاء الاشتراك", body: "الأدمن الأم ينشئ الشركة ويحدد مسارها ويصدر بيانات دخول أدمنها." },
  { title: "٢. تخصيص الشركة", body: "أدمن الشركة يضبط الألوان والفروع والحقول ويضيف المشرفين والموظفين." },
  { title: "٣. استقبال التذاكر", body: "الموظفون والعملاء يرفعون التذاكر ويتابعون حالتها حتى الإغلاق." },
];

function LandingPage() {
  const navigate = useNavigate();
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("تم تسجيل الدخول");
      void navigate({ to: "/portal" });
    } catch (err) {
      toast.error("تعذّر تسجيل الدخول", { description: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="flex items-center gap-2 font-black text-primary">
            <Sparkles className="h-5 w-5" /> منصة التذاكر
          </span>
          <Link
            to="/auth"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-black text-primary-foreground"
          >
            تسجيل الدخول
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <h1 className="text-3xl font-black leading-tight sm:text-5xl">
              نظام تذاكر دعم فني <span className="text-primary">White-Label</span> لكل شركة
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              منصة واحدة تدير الدعم الفني لعدة شركات في آنٍ معاً. لكل شركة مسار مستقل وهوية بصرية
              خاصة ولوحة تحكم كاملة: تتحكم بحقول نموذج التذكرة، بالألوان والشعار، وتنشئ عضويات
              مشرفين للوحة التحكم وعضويات موظفين يرفعون تذاكرهم ويتابعون سجلهم السابق من حساباتهم.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (slug.trim()) void navigate({ to: "/c/$slug", params: { slug: slug.trim() } });
              }}
              className="mt-8 flex max-w-md gap-2"
            >
              <input
                dir="ltr"
                className="field"
                placeholder="ادخل مسار شركتك مثال: acme"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
              />
              <button className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-black text-primary-foreground">
                دخول البوابة <ArrowLeft className="h-4 w-4" />
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-black">
              <UserCog className="h-5 w-5 text-primary" /> دخول الشركات
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              استخدم البريد وكلمة المرور اللذين أنشأهما أدمن المنصة الأم لشركتك — أو البيانات التي
              أنشأها أدمن شركتك للمشرفين والموظفين.
            </p>
            <form onSubmit={signIn} className="mt-5 space-y-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-muted-foreground">البريد الإلكتروني</span>
                <input
                  required
                  type="email"
                  dir="ltr"
                  className="field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-muted-foreground">كلمة المرور</span>
                <input
                  required
                  type="password"
                  dir="ltr"
                  className="field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <button
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground disabled:opacity-60"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                دخول لوحة التحكم
              </button>
            </form>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-10 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <article key={f.title} className="rounded-2xl border border-border bg-card p-6">
              <f.icon className="h-6 w-6 text-primary" />
              <h2 className="mt-3 text-base font-black">{f.title}</h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{f.body}</p>
            </article>
          ))}
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20">
          <h2 className="text-xl font-black">كيف يعمل النظام؟</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {STEPS.map((s) => (
              <article key={s.title} className="rounded-2xl border border-border bg-muted/30 p-5">
                <h3 className="text-sm font-black text-primary">{s.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        منصة تذاكر الدعم الفني — إدارة متعددة الشركات
      </footer>
    </div>
  );
}
