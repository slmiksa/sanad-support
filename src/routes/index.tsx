import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Building2,
  LayoutDashboard,
  Mail,
  MessageCircle,
  Palette,
  Paperclip,
  Bell,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
  Moon,
  Search,
} from "lucide-react";
import { usePlatformSettings, whatsappLink } from "@/lib/platform";
import sanadLogo from "@/assets/sanad-logo.png.asset.json";

const SITE_ORIGIN = "https://project--0ea35464-4366-4fbb-82c3-d3352d37ad72.lovable.app";
const LOGO_URL = `${SITE_ORIGIN}${sanadLogo.url}`;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "نظام سند - للدعم الفني" },
      {
        name: "description",
        content:
          "نظام سند للدعم الفني: منصة تذاكر متعددة الشركات، مسار مستقل لكل شركة، تخصيص الحقول والهوية، عضويات مشرفين وموظفين، وعزل كامل للبيانات.",
      },
      { property: "og:title", content: "نظام سند - للدعم الفني" },
      {
        property: "og:description",
        content: "بوابة تذاكر مخصصة لكل شركة مع لوحة تحكم وإدارة عضويات واشتراكات مركزية.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { property: "og:image", content: LOGO_URL },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: LOGO_URL },
    ],
    links: [{ rel: "canonical", href: "/" }],
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
    title: "هوية بصرية خاصة لكل شركة",
    body: "شعار الشركة واسمها ووصفها يظهران في كل الشاشات، مع دعم كامل للوضع الليلي.",
  },
  {
    icon: LayoutDashboard,
    title: "لوحة تحكم كاملة",
    body: "إحصائيات لحظية، فلاتر للأهمية والحالة، وصفحة مستقلة لكل تذكرة بكل تفاصيلها.",
  },
  {
    icon: Users,
    title: "عضويات المشرفين والموظفين",
    body: "أنشئ حسابات مشرفين ولوحة تحكم، وحسابات موظفين يرفعون التذاكر ويتابعون سجلهم الخاص.",
  },
  {
    icon: Building2,
    title: "اشتراكات متعددة الشركات",
    body: "إدارة مركزية لاشتراك كل شركة: الباقة، الفروع، حالة التفعيل، وحساب أدمن مستقل.",
  },
  {
    icon: Sparkles,
    title: "حقول قابلة للتخصيص والترتيب",
    body: "أضف حقولاً خاصة (نص، قائمة، رقم)، فعّلها أو أخفها، ورتّبها بالأسهم كما تريد.",
  },
  {
    icon: Paperclip,
    title: "مرفقات آمنة",
    body: "رفع صور وملفات مع كل تذكرة وعرضها عبر روابط موقّعة مؤقتة تحفظ الخصوصية.",
  },
  {
    icon: Bell,
    title: "تنبيه التحديثات والردود",
    body: "الموظف يرى شارة «تحديث جديد» على تذاكره ويستعرض الردود واسم من قام بالرد وتغيّر الحالة.",
  },
  {
    icon: Search,
    title: "متابعة سريعة برقم التذكرة",
    body: "ودجت متابعة يعرض حالة التذكرة وخطها الزمني بمجرد إدخال رقمها.",
  },
  {
    icon: ShieldCheck,
    title: "عزل كامل للبيانات",
    body: "سياسات أمان على مستوى الصف تضمن أن كل شركة ترى تذاكرها ومستخدميها فقط.",
  },
  {
    icon: Building2,
    title: "فروع متعددة",
    body: "عرّف فروع الشركة وربط كل تذكرة بفرعها لتسهيل التوزيع والمتابعة.",
  },
  {
    icon: Moon,
    title: "تصميم عربي عصري",
    body: "واجهة RTL بالكامل بخط Cairo، سريعة الاستجابة على الجوال، مع وضع ليلي مريح.",
  },
];

const STEPS = [
  { title: "١. طلب الاشتراك", body: "تواصل معنا عبر واتساب أو البريد ونجهّز لك حساب شركتك ومسارها." },
  { title: "٢. تخصيص الشركة", body: "أدمن الشركة يضبط الهوية والفروع والحقول ويضيف المشرفين والموظفين." },
  { title: "٣. استقبال التذاكر", body: "الموظفون يرفعون التذاكر ويتابعون حالتها حتى الإغلاق." },
];

function LandingPage() {
  const navigate = useNavigate();
  const [slug, setSlug] = useState("");
  const settings = usePlatformSettings();
  const email = settings.data?.contact_email ?? "";
  const wa = settings.data?.whatsapp ?? "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="flex items-center gap-3 font-black text-primary">
            <img src={sanadLogo.url} alt="شعار نظام سند" className="h-10 w-auto" />
            نظام سند للدعم الفني
          </span>
          <a
            href="#contact"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-black text-primary-foreground"
          >
            اطلب الخدمة
          </a>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-16">
          <h1 className="max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
            <span className="text-primary">نظام سند</span> للدعم الفني لكل شركة
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            منصة واحدة تدير الدعم الفني لعدة شركات في آنٍ معاً. لكل شركة مسار مستقل وهوية بصرية
            خاصة ولوحة تحكم كاملة: تتحكم بحقول نموذج التذكرة وترتيبها، وتنشئ عضويات مشرفين للوحة
            التحكم وعضويات موظفين يرفعون تذاكرهم ويتابعون سجلهم السابق من حساباتهم.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={wa ? whatsappLink(wa) : "#contact"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-primary-foreground"
            >
              <MessageCircle className="h-4 w-4" /> اطلب الخدمة عبر واتساب
            </a>
            <a
              href={email ? `mailto:${email}` : "#contact"}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-black"
            >
              <Mail className="h-4 w-4" /> راسلنا بالبريد
            </a>
          </div>

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
            <button className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border px-4 text-sm font-black">
              دخول البوابة <ArrowLeft className="h-4 w-4" />
            </button>
          </form>
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

        <section className="mx-auto max-w-6xl px-4 pb-14">
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

        <section id="contact" className="mx-auto max-w-6xl px-4 pb-20">
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <h2 className="text-xl font-black">اطلب الخدمة الآن</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              نجهّز لشركتك بوابة تذاكر خاصة بهويتها ومسارها خلال وقت قصير. تواصل معنا واختر الطريقة
              الأنسب لك.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a
                href={wa ? whatsappLink(wa) : "#contact"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-primary-foreground"
              >
                <MessageCircle className="h-4 w-4" /> واتساب {wa && <span dir="ltr">{wa}</span>}
              </a>
              <a
                href={email ? `mailto:${email}` : "#contact"}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-black"
              >
                <Mail className="h-4 w-4" /> {email || "البريد الإلكتروني"}
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
