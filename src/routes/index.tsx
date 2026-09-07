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
import transparentLogoAsset from "@/assets/sanad-logo-transparent.png.asset.json";
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
      <header className="sticky top-0 z-40 border-b border-stage-foreground/10 bg-stage/95 text-stage-foreground backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 lg:px-8">
          <a href="/" className="flex items-center gap-2" aria-label="نظام سند للدعم الفني">
            <img src={transparentLogoAsset.url} alt="شعار نظام سند" className="h-12 w-12 object-contain sm:h-14 sm:w-14" />
            <span className="hidden text-[10px] font-bold leading-5 text-stage-foreground/50 sm:inline">نظام سند<br />للدعم الفني</span>
          </a>
          <div className="flex items-center gap-2">
            <a
              href="#faq"
              className="hidden px-3 py-2 text-sm font-bold text-stage-foreground/65 transition hover:text-primary sm:inline-flex"
            >
              الأسئلة الشائعة
            </a>
            <a
              href="#contact"
              className="rounded-md bg-primary px-4 py-2.5 text-xs font-black text-primary-foreground transition hover:-translate-y-0.5 sm:text-sm"
            >
              اطلب الخدمة
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-stage text-stage-foreground">
          <div className="pointer-events-none absolute -left-32 top-12 h-96 w-96 rotate-12 border-[5rem] border-primary/15 brand-drift" aria-hidden />
          <div className="pointer-events-none absolute -bottom-52 right-1/3 h-96 w-96 -rotate-12 bg-primary/10 brand-drift" aria-hidden />
          <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-5 py-12 lg:min-h-[38rem] lg:grid-cols-12 lg:px-8 lg:py-14">
            <div className="reveal-up lg:col-span-8">
            <span className="inline-flex items-center gap-2 border-r-2 border-primary pr-3 text-xs font-bold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> منصة تذاكر دعم فني متعددة الشركات
            </span>

            <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[1.18] sm:text-6xl lg:text-[5.25rem]">
              سند<span className="text-primary">.</span><br />بوابتك للحلول
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-stage-foreground/65 sm:text-base">
              منصة واحدة تدير الدعم الفني لعدة شركات في آنٍ معاً. لكل شركة مسار مستقل وهوية بصرية
              خاصة ولوحة تحكم كاملة: تتحكم بحقول نموذج التذكرة وترتيبها، وتنشئ عضويات مشرفين للوحة
              التحكم وعضويات موظفين يرفعون تذاكرهم ويتابعون سجلهم السابق من حساباتهم.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href={wa ? whatsappLink(wa) : "#contact"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3.5 text-sm font-black text-primary-foreground shadow-[var(--shadow-brand)] transition hover:-translate-y-0.5"
              >
                <MessageCircle className="h-4 w-4" /> اطلب الخدمة عبر واتساب
              </a>
              <a
                href={email ? `mailto:${email}` : "#contact"}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-stage-foreground/20 px-5 py-3.5 text-sm font-black text-stage-foreground transition hover:border-primary hover:text-primary"
              >
                <Mail className="h-4 w-4" /> راسلنا بالبريد
              </a>
            </div>

            </div>
            <div className="lg:col-span-4 lg:self-end">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (slug.trim()) void navigate({ to: "/c/$slug", params: { slug: slug.trim() } });
              }}
              className="flex w-full flex-col gap-2 rounded-lg border border-stage-foreground/15 bg-stage-foreground/5 p-3 backdrop-blur"
            >
              <label htmlFor="company-slug" className="px-2 pt-1 text-xs font-black text-stage-foreground/65">ادخل إلى بوابة شركتك</label>
              <input
                id="company-slug"
                dir="ltr"
                className="w-full rounded-md border border-stage-foreground/15 bg-stage-foreground/10 px-4 py-4 text-sm text-stage-foreground placeholder:text-stage-foreground/40 focus:border-primary focus:outline-none"
                placeholder="ادخل مسار شركتك مثال: acme"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
              />
              <button className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 py-3.5 text-sm font-black text-primary-foreground transition hover:opacity-90">
                دخول البوابة <ArrowLeft className="h-4 w-4" />
              </button>
            </form>

            <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-stage-foreground/10">
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="bg-stage px-4 py-5"
                >
                  <dt className="text-2xl font-black text-primary">{s.value}</dt>
                  <dd className="mt-1 text-[11px] text-stage-foreground/50">{s.label}</dd>
                </div>
              ))}
            </dl>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-xs font-black text-primary">كل شيء في مكان واحد</p>
            <h2 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">كل ما يحتاجه الدعم الفني،<br />دون تعقيد.</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              أدوات متكاملة لاستقبال التذاكر ومتابعتها وقياس أداء فريقك.
            </p>
          </div>

          <div className="mt-10 grid auto-rows-[minmax(13rem,auto)] gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, index) => (
              <article
                key={f.title}
                className={`group flex flex-col justify-between rounded-lg border border-border p-6 transition duration-300 hover:-translate-y-1 hover:border-primary ${index === 0 ? "bg-primary text-primary-foreground sm:col-span-2" : index === 1 ? "bg-stage text-stage-foreground lg:row-span-2" : "bg-card"}`}
              >
                <span className={`grid h-11 w-11 place-items-center rounded-md transition ${index === 0 ? "bg-primary-foreground/15 text-primary-foreground" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"}`}>
                  <f.icon className="h-5 w-5" />
                </span>
                <div><h3 className="mt-8 text-lg font-black">{f.title}</h3>
                <p className={`mt-2 text-xs leading-6 ${index === 0 ? "text-primary-foreground/70" : index === 1 ? "text-stage-foreground/60" : "text-muted-foreground"}`}>{f.body}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-surface-tint">
          <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
            <p className="text-xs font-black text-primary">الخطوات</p>
            <h2 className="mt-3 text-3xl font-black sm:text-5xl">من الاشتراك إلى الحل.</h2>
            <div className="mt-10 grid gap-px overflow-hidden rounded-lg bg-border sm:grid-cols-3">
              {STEPS.map((s, i) => (
                <article
                  key={s.title}
                  className="relative min-h-64 overflow-hidden bg-card p-7"
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -bottom-8 -left-2 text-[10rem] font-black leading-none text-primary/12 select-none"
                  >
                    {i + 1}
                  </span>

                   <h3 className="relative text-lg font-black text-primary">{s.title}</h3>
                   <p className="relative mt-4 max-w-xs text-sm leading-7 text-muted-foreground">{s.body}</p>

                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-5xl px-5 py-16 lg:py-24">
          <div>
            <p className="text-xs font-black text-primary">الأسئلة الشائعة</p>
            <h2 className="mt-3 text-3xl font-black sm:text-5xl">لديك سؤال؟</h2>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              أكثر ما يسأل عنه عملاؤنا حول نظام سند وطريقة الاشتراك والاستخدام.
            </p>
          </div>

          <Accordion type="single" collapsible className="mt-10 border-t border-border">
            {FAQ.map((item, i) => (
              <AccordionItem
                key={item.q}
                value={`faq-${i}`}
                className="border-b border-border px-1"
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

        <section id="contact" className="bg-primary">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-2 lg:items-end lg:px-8 lg:py-24">
            <div><p className="text-xs font-black text-primary-foreground/60">ابدأ الآن</p>
            <h2 className="mt-3 text-4xl font-black text-primary-foreground sm:text-6xl">اطلب الخدمة الآن.</h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-primary-foreground/70">
              نجهّز لشركتك بوابة تذاكر خاصة بهويتها ومسارها خلال وقت قصير. تواصل معنا واختر الطريقة
              الأنسب لك.
            </p></div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <a
                href={wa ? whatsappLink(wa) : "#contact"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-stage px-6 py-4 text-sm font-black text-stage-foreground transition hover:-translate-y-0.5"
              >
                <MessageCircle className="h-4 w-4" /> تواصل عبر واتساب
              </a>
              <a
                href={email ? `mailto:${email}` : "#contact"}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-primary-foreground/30 px-6 py-4 text-sm font-black text-primary-foreground transition hover:bg-primary-foreground hover:text-primary"
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
