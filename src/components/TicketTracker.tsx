import { useState } from "react";
import { Search, Clock, CheckCircle2, CircleDot, XCircle } from "lucide-react";
import { STATUS_META, type Status } from "@/lib/tickets";

const CYCLE: Status[] = ["progress", "resolved", "closed"];

const STEPS = [
  { key: "استلام الطلب", icon: CircleDot },
  { key: "قيد المراجعة الفنية", icon: Clock },
  { key: "تم الحل", icon: CheckCircle2 },
  { key: "إغلاق التذكرة", icon: XCircle },
];

export function TicketTracker() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ id: string; status: Status } | null>(null);

  const stepIndex = result
    ? result.status === "progress"
      ? 1
      : result.status === "resolved"
        ? 2
        : 3
    : -1;

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const id = query.trim();
          if (!id) return;
          const status = CYCLE[Math.abs(hash(id)) % CYCLE.length]!;
          setResult({ id: id.toUpperCase(), status });
        }}
        className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-3 shadow-sm sm:flex-row"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-muted px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="أدخل رقم التذكرة مثال: TCK-8821"
            className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-[var(--shadow-brand)] transition-opacity hover:opacity-90"
        >
          متابعة الطلب
        </button>
      </form>

      {result && (
        <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border px-5 py-4">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">رقم التذكرة</p>
              <p className="truncate text-lg font-extrabold text-primary">{result.id}</p>
            </div>
            <span
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${STATUS_META[result.status].className}`}
            >
              {STATUS_META[result.status].label}
            </span>
          </div>

          <div className="space-y-0 px-5 py-6">
            {STEPS.map((step, i) => {
              const done = i <= stepIndex;
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors ${
                        done
                          ? "border-transparent bg-primary text-primary-foreground"
                          : "border-border bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    {i < STEPS.length - 1 && (
                      <span
                        className={`w-px flex-1 ${i < stepIndex ? "bg-primary" : "bg-border"}`}
                      />
                    )}
                  </div>
                  <div className={`min-w-0 pb-6 ${done ? "" : "opacity-50"}`}>
                    <p className="text-sm font-bold">{step.key}</p>
                    <p className="text-xs text-muted-foreground">
                      {done ? "تمت هذه المرحلة" : "بانتظار المرحلة السابقة"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid gap-4 border-t border-border bg-muted/40 px-5 py-4 sm:grid-cols-3">
            <Detail label="الفرع" value="الفرع الرئيسي - الرياض" />
            <Detail label="الفني المسؤول" value="فريق الدعم الفني" />
            <Detail label="آخر تحديث" value="اليوم 10:24 ص" />
          </div>
        </article>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}
