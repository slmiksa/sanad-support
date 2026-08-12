import { useRef } from "react";
import { X, RotateCcw, Upload, Moon, Sun } from "lucide-react";
import { useBranding } from "@/lib/branding";

const PRESETS = [
  { primary: "#2563eb", secondary: "#0f766e", name: "أزرق مؤسسي" },
  { primary: "#0f766e", secondary: "#f59e0b", name: "أخضر تقني" },
  { primary: "#e11d48", secondary: "#1e293b", name: "أحمر جريء" },
  { primary: "#7c3aed", secondary: "#06b6d4", name: "بنفسجي حديث" },
];

export function BrandingPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const b = useBranding();
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-foreground/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        className={`absolute inset-y-0 left-0 flex w-[min(24rem,90vw)] flex-col border-l border-border bg-card shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-extrabold">تخصيص الهوية (White-Label)</h2>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="grid h-9 w-9 place-items-center rounded-lg hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground">الألوان</h3>
            <ColorRow
              label="اللون الرئيسي"
              value={b.primary}
              onChange={(v) => b.update({ primary: v })}
            />
            <ColorRow
              label="اللون الثانوي"
              value={b.secondary}
              onChange={(v) => b.update({ secondary: v })}
            />
            <div className="grid grid-cols-2 gap-2 pt-1">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => b.update({ primary: p.primary, secondary: p.secondary })}
                  className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold transition-colors hover:bg-muted"
                >
                  <span className="flex shrink-0 -space-x-1">
                    <span
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: p.primary }}
                    />
                    <span
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: p.secondary }}
                    />
                  </span>
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground">الوضع</h3>
            <button
              onClick={() => b.update({ dark: !b.dark })}
              className="flex w-full items-center justify-between rounded-xl border border-border px-4 py-3 text-sm font-semibold transition-colors hover:bg-muted"
            >
              <span className="flex items-center gap-2">
                {b.dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {b.dark ? "الوضع النهاري" : "الوضع الليلي"}
              </span>
              <span
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${b.dark ? "bg-primary" : "bg-muted"}`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-card shadow transition-all ${b.dark ? "left-1" : "left-6"}`}
                />
              </span>
            </button>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground">الشعار والنصوص</h3>
            <div className="flex items-center gap-3">
              {b.logo ? (
                <img src={b.logo} alt="الشعار" className="h-14 w-14 rounded-xl object-cover" />
              ) : (
                <span className="grid h-14 w-14 place-items-center rounded-xl bg-primary text-xl font-black text-primary-foreground">
                  {b.companyName.trim().charAt(0) || "ت"}
                </span>
              )}
              <div className="flex flex-1 flex-col gap-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-bold hover:bg-muted"
                >
                  <Upload className="h-3.5 w-3.5" /> رفع شعار
                </button>
                {b.logo && (
                  <button
                    onClick={() => b.update({ logo: null })}
                    className="text-xs font-semibold text-muted-foreground hover:text-destructive"
                  >
                    إزالة الشعار
                  </button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const reader = new FileReader();
                  reader.onload = () => b.update({ logo: String(reader.result) });
                  reader.readAsDataURL(f);
                }}
              />
            </div>

            <Field label="اسم الشركة">
              <input
                value={b.companyName}
                onChange={(e) => b.update({ companyName: e.target.value })}
                className="field"
              />
            </Field>
            <Field label="العنوان الترحيبي">
              <input
                value={b.tagline}
                onChange={(e) => b.update({ tagline: e.target.value })}
                className="field"
              />
            </Field>
          </section>

          <button
            onClick={b.reset}
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" /> استعادة الإعدادات الافتراضية
          </button>
        </div>
      </aside>
    </div>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border px-3 py-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground uppercase">{value}</p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
