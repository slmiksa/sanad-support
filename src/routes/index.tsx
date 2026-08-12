import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { UploadCloud, ImageIcon, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TicketTracker } from "@/components/TicketTracker";
import { useBranding } from "@/lib/branding";
import { BRANCHES, PRIORITY_META, generateTicketId, type Priority } from "@/lib/tickets";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "تقديم تذكرة دعم فني | نظام تذاكر White-Label" },
      {
        name: "description",
        content:
          "نموذج تجريبي لنظام تذاكر دعم فني قابل للتخصيص بالكامل: تقديم التذاكر، متابعتها، وتخصيص هوية الشركة بلحظة.",
      },
      { property: "og:title", content: "تقديم تذكرة دعم فني | نظام تذاكر White-Label" },
      {
        property: "og:description",
        content: "قدّم تذكرتك خلال ثوانٍ وتابع حالتها لحظياً عبر واجهة عربية عصرية.",
      },
    ],
  }),
  component: SubmitTicketPage,
});

function SubmitTicketPage() {
  const { tagline, companyName } = useBranding();
  const [priority, setPriority] = useState<Priority>("normal");
  const [file, setFile] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const readFile = (f?: File) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setFile(String(r.result));
    r.readAsDataURL(f);
  };

  return (
    <AppShell>
      <section className="mb-10 text-center">
        <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary">
          {companyName} · الدعم الفني
        </span>
        <h1 className="mt-4 text-3xl font-black sm:text-4xl">{tagline}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          أرسل مشكلتك التقنية عبر النموذج أدناه وسيصلك رقم تذكرة فوري لمتابعة حالتها.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const id = generateTicketId();
            toast.success(`تم استلام تذكرتك بنجاح`, {
              description: `رقم التذكرة الخاص بك: ${id} — احتفظ به للمتابعة.`,
            });
            (e.target as HTMLFormElement).reset();
            setFile(null);
            setPriority("normal");
          }}
          className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7"
        >
          <div className="space-y-2">
            <span className="text-xs font-bold text-muted-foreground">درجة الأهمية</span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(Object.keys(PRIORITY_META) as Priority[]).map((p) => {
                const m = PRIORITY_META[p];
                const active = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all ${m.className} ${
                      active ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    {m.icon} {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="الفرع">
              <select required className="field">
                <option value="">اختر الفرع...</option>
                {BRANCHES.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </Field>
            <Field label="رقم الاتصال بالكمبيوتر / IP">
              <input required className="field" placeholder="مثال: 192.168.1.24 أو PC-104" />
            </Field>
            <Field label="التحويلة">
              <input className="field" inputMode="numeric" placeholder="مثال: 2045" />
            </Field>
            <Field label="رقم الجوال">
              <input className="field" inputMode="numeric" placeholder="05XXXXXXXX" />
            </Field>
          </div>

          <Field label="وصف المشكلة">
            <textarea
              required
              rows={5}
              className="field resize-y"
              placeholder="اشرح المشكلة بالتفصيل: متى بدأت؟ وما الرسائل التي تظهر؟"
            />
          </Field>

          <div className="space-y-2">
            <span className="text-xs font-bold text-muted-foreground">إرفاق صورة</span>
            {file ? (
              <div className="relative overflow-hidden rounded-2xl border border-border">
                <img src={file} alt="المرفق" className="max-h-56 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="absolute top-2 left-2 grid h-8 w-8 place-items-center rounded-lg bg-background/90"
                  aria-label="حذف المرفق"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  readFile(e.dataTransfer.files?.[0]);
                }}
                onClick={() => inputRef.current?.click()}
                className={`grid cursor-pointer place-items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
                  dragging ? "border-primary bg-primary/5" : "border-border bg-muted/40 hover:border-primary/50"
                }`}
              >
                <UploadCloud className="h-7 w-7 text-primary" />
                <p className="text-sm font-bold">اسحب الصورة هنا أو اضغط للاختيار</p>
                <p className="text-xs text-muted-foreground">PNG · JPG · بحد أقصى 5MB</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => readFile(e.target.files?.[0])}
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-primary py-3.5 text-sm font-black text-primary-foreground shadow-[var(--shadow-brand)] transition-opacity hover:opacity-90"
          >
            إرسال التذكرة
          </button>
        </form>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-extrabold">متابعة سريعة</h2>
            <TicketTracker />
          </div>
          <div className="rounded-2xl border border-border bg-muted/40 p-5">
            <ImageIcon className="mb-2 h-5 w-5 text-primary" />
            <h3 className="text-sm font-extrabold">نصيحة</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              إرفاق لقطة شاشة لرسالة الخطأ يقلّل زمن الحل بنسبة تصل إلى 40% حسب بيانات فرق الدعم.
            </p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
