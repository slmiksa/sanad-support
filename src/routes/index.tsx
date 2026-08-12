import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Building2, ShieldCheck, Sparkles, Ticket } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "منصة تذاكر الدعم الفني للشركات | White-Label SaaS" },
      {
        name: "description",
        content:
          "منصة تذاكر دعم فني متعددة الشركات: بوابة خاصة لكل شركة، لوحة تحكم للأدمن، وعزل كامل للبيانات.",
      },
      { property: "og:title", content: "منصة تذاكر الدعم الفني للشركات" },
      {
        property: "og:description",
        content: "بوابة تذاكر مخصصة لكل شركة مع لوحة تحكم وإدارة اشتراكات مركزية.",
      },
    ],
  }),
  component: LandingPage,
});

const FEATURES = [
  {
    icon: Ticket,
    title: "بوابة تذاكر لكل شركة",
    body: "رابط مستقل /c/اسم-الشركة يستقبل التذاكر من الموظفين والعملاء ويعطيهم رقم متابعة فوري.",
  },
  {
    icon: Building2,
    title: "اشتراكات وشركات متعددة",
    body: "أدمن المنصة ينشئ اشتراك كل شركة، يحدد باقتها وفروعها، ويصدر لها حساب أدمن مستقل.",
  },
  {
    icon: ShieldCheck,
    title: "عزل كامل للبيانات",
    body: "سياسات أمان على مستوى الصف تضمن أن كل شركة ترى تذاكرها ومستخدميها فقط.",
  },
];

function LandingPage() {
  const navigate = useNavigate();
  const [slug, setSlug] = useState("");

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
        <section className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h1 className="text-3xl font-black leading-tight sm:text-5xl">
            نظام تذاكر دعم فني <span className="text-primary">White-Label</span> لكل شركة
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
            أنشئ اشتراكاً لكل شركة بمسار خاص وهوية بصرية مستقلة، وامنح أدمن الشركة لوحة تحكم كاملة
            لإدارة التذاكر والفروع والمستخدمين.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (slug.trim()) void navigate({ to: "/c/$slug", params: { slug: slug.trim() } });
            }}
            className="mx-auto mt-8 flex max-w-md gap-2"
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
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-20 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <article key={f.title} className="rounded-2xl border border-border bg-card p-6">
              <f.icon className="h-6 w-6 text-primary" />
              <h2 className="mt-3 text-base font-black">{f.title}</h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{f.body}</p>
            </article>
          ))}
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        منصة تذاكر الدعم الفني — إدارة متعددة الشركات
      </footer>
    </div>
  );
}
