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
import sanadLogo from "@/assets/sanad-logo.png";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const SITE_ORIGIN = "https://project--0ea35464-4366-4fbb-82c3-d3352d37ad72.lovable.app";
const LOGO_URL = `${SITE_ORIGIN}${sanadLogo}`;

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

const STATS = [
  { value: "٢٤/٧", label: "متابعة التذاكر" },
  { value: "١٠٠٪", label: "عربي RTL" },
  { value: "∞", label: "عدد الشركات" },
  { value: "٣", label: "مستويات صلاحيات" },
];

const FAQ = [
  {
    q: "ما هو نظام سند للدعم الفني؟",
    a: "منصة سحابية لإدارة تذاكر الدعم الفني، تتيح لكل شركة بوابة مستقلة بمسار خاص وهوية بصرية خاصة، مع لوحة تحكم لإدارة التذاكر والعضويات والتقارير.",
  },
  {
    q: "كيف أحصل على حساب لشركتي؟",
    a: "تواصل معنا عبر واتساب أو البريد الإلكتروني من قسم «اطلب الخدمة»، ونقوم بتجهيز اشتراك شركتكم ومسارها الخاص وحساب الأدمن وتسليمكم بيانات الدخول.",
  },
  {
    q: "هل يستطيع الموظف إنشاء حساب بنفسه؟",
    a: "لا. إنشاء العضويات يتم من إدارة الشركة داخل لوحة التحكم فقط، والموظف يسجّل الدخول ببريده وكلمة المرور التي تزوّده بها إدارته.",
  },
  {
    q: "ما الفرق بين المشرف والموظف؟",
    a: "المشرف يدخل لوحة التحكم ويستعرض جميع التذاكر ويرد عليها ويغيّر حالتها، بينما الموظف يرفع التذاكر ويتابع سجل تذاكره الخاصة فقط.",
  },
  {
    q: "هل يمكنني تخصيص حقول نموذج التذكرة؟",
    a: "نعم. يمكن إضافة حقول مخصصة (نص، رقم، قائمة اختيارات)، تفعيلها أو إخفاؤها، تحديد الإلزامي منها، وإعادة ترتيبها بالأسهم من لوحة التحكم.",
  },
  {
    q: "هل يدعم النظام شعار الشركة وهويتها؟",
    a: "نعم. ترفع الشركة شعارها من جهازها مباشرة وتضبط اسمها ووصفها، فتظهر الهوية في بوابة التذاكر ولوحة التحكم وبوابة الموظفين.",
  },
  {
    q: "هل يمكن رفع المرفقات مع التذكرة؟",
    a: "نعم، يمكن إرفاق الصور والملفات مع كل تذكرة، وتُعرض عبر روابط موقّعة مؤقتة تحفظ خصوصية البيانات.",
  },
  {
    q: "كيف أتابع حالة تذكرتي؟",
    a: "من ودجت «متابعة تذكرة» في بوابة شركتك بإدخال رقم التذكرة، أو من حسابك الشخصي حيث تظهر شارة «تحديث جديد» عند أي رد أو تغيير حالة.",
  },
  {
    q: "هل توجد تقارير وإحصائيات؟",
    a: "نعم. تتوفر مؤشرات أداء (KPIs) لعدد التذاكر وحالاتها، مع إمكانية تحديد فترة زمنية وتصدير كل التذاكر إلى ملف Excel شامل للحقول والردود والتواريخ.",
  },
  {
    q: "ماذا لو لم يكن لدى شركتنا فريق دعم فني؟",
    a: "نوفّر خدمة «الدعم الفني عن بُعد»، حيث يتابع فريق لمحة الآمنة تذاكر شركتكم ويرد عليها مباشرة، وتظهر لديكم شارة تفعيل الخدمة في لوحة التحكم.",
  },
  {
    q: "هل بيانات كل شركة معزولة عن الأخرى؟",
    a: "نعم. سياسات الأمان على مستوى الصف (RLS) تضمن أن كل شركة ترى تذاكرها ومستخدميها فقط دون أي تداخل.",
  },
  {
    q: "هل النظام متوافق مع الجوال؟",
    a: "بالكامل. جميع الشاشات بما فيها لوحات التحكم مصممة لتعمل بسلاسة على الجوال والتابلت والحاسب، مع وضع ليلي مريح للعين.",
  },
  {
    q: "هل يمكن تشغيل النظام على سيرفر الشركة؟",
    a: "نعم، تتوفر نسخة استضافة ذاتية تُبنى كملفات ثابتة تُرفع إلى استضافتك الخاصة مع دعم المسارات عبر ملف htaccess.",
  },
  {
    q: "هل يدعم النظام الفروع المتعددة؟",
    a: "نعم، يمكن تعريف فروع الشركة وربط كل تذكرة بفرعها لتسهيل التوزيع والمتابعة والتقارير.",
  },
];

function LandingPage() {
  const navigate = useNavigate();
  const [slug, setSlug] = useState("");
  const settings = usePlatformSettings();
  const email = settings.data?.contact_email ?? "";
  const wa = settings.data?.whatsapp ?? "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <a href="/" className="flex items-center" aria-label="نظام سند للدعم الفني">
            <img
              src={sanadLogo}
              alt="شعار نظام سند للدعم الفني"
              className="h-14 w-auto sm:h-16"
            />
          </a>
          <div className="flex items-center gap-2">
            <a
              href="#faq"
              className="hidden rounded-xl px-3 py-2 text-sm font-bold text-muted-foreground transition hover:text-primary sm:inline-flex"
            >
              الأسئلة الشائعة
            </a>
            <a
              href="#contact"
              className="rounded-xl bg-primary px-4 py-2 text-xs font-black text-primary-foreground shadow-[var(--shadow-brand)] transition hover:opacity-90 sm:text-sm"
            >
              اطلب الخدمة
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section
          className="relative overflow-hidden"
          style={{ background: "var(--hero-gradient)" }}
        >
          <div
            className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl"
            style={{ background: "color-mix(in oklab, var(--brand) 35%, transparent)" }}
            aria-hidden
          />
          <div className="relative mx-auto max-w-6xl px-4 py-14 sm:py-24">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold text-brand-light backdrop-blur sm:text-xs">
              <Sparkles className="h-3.5 w-3.5" /> منصة تذاكر دعم فني متعددة الشركات
            </span>

            <h1 className="mt-5 max-w-3xl text-3xl font-black leading-[1.25] text-white sm:text-5xl">
              <span className="text-brand-light">نظام سند</span> للدعم الفني لكل شركة
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
              منصة واحدة تدير الدعم الفني لعدة شركات في آنٍ معاً. لكل شركة مسار مستقل وهوية بصرية
              خاصة ولوحة تحكم كاملة: تتحكم بحقول نموذج التذكرة وترتيبها، وتنشئ عضويات مشرفين للوحة
              التحكم وعضويات موظفين يرفعون تذاكرهم ويتابعون سجلهم السابق من حساباتهم.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href={wa ? whatsappLink(wa) : "#contact"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-black text-primary-foreground shadow-[var(--shadow-brand)] transition hover:opacity-90"
              >
                <MessageCircle className="h-4 w-4" /> اطلب الخدمة عبر واتساب
              </a>
              <a
                href={email ? `mailto:${email}` : "#contact"}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-5 py-3.5 text-sm font-black text-white backdrop-blur transition hover:bg-white/10"
              >
                <Mail className="h-4 w-4" /> راسلنا بالبريد
              </a>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (slug.trim()) void navigate({ to: "/c/$slug", params: { slug: slug.trim() } });
              }}
              className="mt-8 flex w-full max-w-md flex-col gap-2 rounded-2xl border border-white/15 bg-white/5 p-2 backdrop-blur sm:flex-row"
            >
              <input
                dir="ltr"
                className="w-full rounded-xl border border-transparent bg-white/10 px-3 py-3 text-sm text-white placeholder:text-white/50 focus:border-brand-light focus:outline-none"
                placeholder="ادخل مسار شركتك مثال: acme"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
              />
              <button className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-3 text-sm font-black text-white transition hover:bg-white/25">
                دخول البوابة <ArrowLeft className="h-4 w-4" />
              </button>
            </form>

            <dl className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur"
                >
                  <dt className="text-xl font-black text-brand-light sm:text-2xl">{s.value}</dt>
                  <dd className="mt-1 text-[11px] text-white/60 sm:text-xs">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-black text-primary">المميزات</p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">كل ما يحتاجه الدعم الفني</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              أدوات متكاملة لاستقبال التذاكر ومتابعتها وقياس أداء فريقك.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <article
                key={f.title}
                className="group rounded-2xl border border-border bg-card p-5 transition duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-brand)] sm:p-6"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-black">{f.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
            <p className="text-xs font-black text-primary">الخطوات</p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">كيف يعمل النظام؟</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {STEPS.map((s, i) => (
                <article
                  key={s.title}
                  className="relative overflow-hidden rounded-2xl border border-border bg-card p-6"
                >
                  <span className="absolute -left-2 -top-4 text-6xl font-black text-primary/10">
                    {i + 1}
                  </span>
                  <h3 className="text-sm font-black text-primary">{s.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-4xl px-4 py-14 sm:py-20">
          <div className="text-center">
            <p className="text-xs font-black text-primary">الأسئلة الشائعة</p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">استفسارات وأجوبة</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              أكثر ما يسأل عنه عملاؤنا حول نظام سند وطريقة الاشتراك والاستخدام.
            </p>
          </div>

          <Accordion type="single" collapsible className="mt-8 space-y-3">
            {FAQ.map((item, i) => (
              <AccordionItem
                key={item.q}
                value={`faq-${i}`}
                className="rounded-2xl border border-border bg-card px-4 sm:px-5"
              >
                <AccordionTrigger className="text-right text-sm font-black hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Contact */}
        <section id="contact" className="mx-auto max-w-6xl px-4 pb-20">
          <div
            className="relative overflow-hidden rounded-3xl border border-primary/20 p-8 text-center sm:p-12"
            style={{ background: "var(--hero-gradient)" }}
          >
            <h2 className="text-2xl font-black text-white sm:text-3xl">اطلب الخدمة الآن</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/70">
              نجهّز لشركتك بوابة تذاكر خاصة بهويتها ومسارها خلال وقت قصير. تواصل معنا واختر الطريقة
              الأنسب لك.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href={wa ? whatsappLink(wa) : "#contact"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-black text-primary-foreground shadow-[var(--shadow-brand)] transition hover:opacity-90"
              >
                <MessageCircle className="h-4 w-4" /> تواصل عبر واتساب
              </a>
              <a
                href={email ? `mailto:${email}` : "#contact"}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-black text-white backdrop-blur transition hover:bg-white/10"
              >
                <Mail className="h-4 w-4" /> راسلنا بالبريد
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
