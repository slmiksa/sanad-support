import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MessageCircle, Mail } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { usePlatformSettings, whatsappLink } from "@/lib/platform";
import transparentSanadLogo from "@/assets/sanad-logo-transparent-local.png";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "الأسئلة الشائعة - نظام سند للدعم الفني" },
      {
        name: "description",
        content:
          "أجوبة على أكثر الأسئلة شيوعاً حول نظام سند للدعم الفني: الاشتراك، العضويات، التخصيص، المرفقات، التقارير، والعزل الأمني.",
      },
      { property: "og:title", content: "الأسئلة الشائعة - نظام سند للدعم الفني" },
      {
        property: "og:description",
        content:
          "أجوبة شاملة حول الاشتراك والعضويات وتخصيص الحقول والمرفقات والتقارير في نظام سند.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/faq" }],
  }),
  component: FaqPage,
});

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

function FaqPage() {
  const settings = usePlatformSettings();
  const email = settings.data?.contact_email ?? "";
  const wa = settings.data?.whatsapp ?? "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-stage-foreground/10 bg-stage/95 text-stage-foreground backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 lg:px-8">
          <Link to="/" className="flex items-center gap-2" aria-label="نظام سند للدعم الفني">
            <img src={transparentSanadLogo} alt="شعار نظام سند" className="h-12 w-12 object-contain sm:h-14 sm:w-14" />
            <span className="hidden text-[10px] font-bold leading-5 text-stage-foreground/50 sm:inline">نظام سند<br />للدعم الفني</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="hidden px-3 py-2 text-sm font-bold text-stage-foreground/65 transition hover:text-primary sm:inline-flex"
            >
              الرئيسية
            </Link>
            <a
              href={wa ? whatsappLink(wa) : "#contact"}
              target="_blank"
              rel="noopener noreferrer"
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
          <div className="relative mx-auto max-w-5xl px-5 py-16 lg:px-8 lg:py-24">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-stage-foreground/55 transition hover:text-primary"
            >
              <ArrowRight className="h-4 w-4" /> العودة للرئيسية
            </Link>
            <p className="mt-6 text-xs font-black text-primary">الأسئلة الشائعة</p>
            <h1 className="mt-3 text-4xl font-black leading-tight sm:text-6xl">لديك سؤال؟</h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-stage-foreground/65 sm:text-base">
              أكثر ما يسأل عنه عملاؤنا حول نظام سند وطريقة الاشتراك والاستخدام. لم تجد إجابتك؟
              تواصل معنا مباشرة عبر واتساب أو البريد.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 py-16 lg:px-8 lg:py-24">
          <Accordion type="single" collapsible className="border-t border-border">
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
            <div>
              <p className="text-xs font-black text-primary-foreground/60">ابدأ الآن</p>
              <h2 className="mt-3 text-4xl font-black text-primary-foreground sm:text-6xl">اطلب الخدمة الآن.</h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-primary-foreground/70">
                نجهّز لشركتك بوابة تذاكر خاصة بهويتها ومسارها خلال وقت قصير. تواصل معنا واختر الطريقة
                الأنسب لك.
              </p>
            </div>
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
