import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Ticket, FolderOpen, Loader2, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  MOCK_TICKETS,
  PRIORITY_META,
  STATUS_META,
  type Priority,
  type Status,
} from "@/lib/tickets";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "لوحة تحكم التذاكر | نظام تذاكر White-Label" },
      {
        name: "description",
        content: "لوحة تحكم تعرض إحصائيات التذاكر وجدولاً تفاعلياً مع فلترة حسب الأهمية والحالة.",
      },
      { property: "og:title", content: "لوحة تحكم التذاكر" },
      {
        property: "og:description",
        content: "إحصائيات فورية وجدول تذاكر قابل للفلترة لفريق الدعم الفني.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [status, setStatus] = useState<Status | "all">("all");

  const rows = useMemo(
    () =>
      MOCK_TICKETS.filter(
        (t) =>
          (priority === "all" || t.priority === priority) &&
          (status === "all" || t.status === status),
      ),
    [priority, status],
  );

  const stats = [
    { label: "إجمالي التذاكر", value: MOCK_TICKETS.length, icon: Ticket },
    {
      label: "المفتوحة",
      value: MOCK_TICKETS.filter((t) => t.status === "open").length,
      icon: FolderOpen,
    },
    {
      label: "قيد المعالجة",
      value: MOCK_TICKETS.filter((t) => t.status === "progress").length,
      icon: Loader2,
    },
    {
      label: "المغلقة / المحلولة",
      value: MOCK_TICKETS.filter((t) => t.status === "closed" || t.status === "resolved").length,
      icon: CheckCircle2,
    },
  ];

  return (
    <AppShell>
      <h1 className="text-3xl font-black">لوحة التحكم</h1>
      <p className="mt-2 text-sm text-muted-foreground">نظرة شاملة على تذاكر الدعم الفني.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-3xl font-black text-primary">{s.value}</p>
            </div>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <s.icon className="h-5 w-5" />
            </span>
          </div>
        ))}
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
          <h2 className="ml-auto text-sm font-extrabold">التذاكر ({rows.length})</h2>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority | "all")}
            className="field w-auto py-2 text-xs"
          >
            <option value="all">كل الأهميات</option>
            {(Object.keys(PRIORITY_META) as Priority[]).map((p) => (
              <option key={p} value={p}>
                {PRIORITY_META[p].label}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Status | "all")}
            className="field w-auto py-2 text-xs"
          >
            <option value="all">كل الحالات</option>
            {(Object.keys(STATUS_META) as Status[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] text-right text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">رقم التذكرة</th>
                <th className="px-5 py-3 font-semibold">الموضوع</th>
                <th className="px-5 py-3 font-semibold">الفرع</th>
                <th className="px-5 py-3 font-semibold">الأهمية</th>
                <th className="px-5 py-3 font-semibold">الحالة</th>
                <th className="px-5 py-3 font-semibold">التاريخ</th>
                <th className="px-5 py-3 font-semibold">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-t border-border transition-colors hover:bg-muted/40">
                  <td className="px-5 py-3 font-bold text-primary">{t.id}</td>
                  <td className="max-w-[16rem] px-5 py-3">
                    <p className="truncate font-semibold">{t.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{t.requester}</p>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{t.branch}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-block rounded-full border px-2.5 py-1 text-xs font-bold ${PRIORITY_META[t.priority].className}`}
                    >
                      {PRIORITY_META[t.priority].icon} {PRIORITY_META[t.priority].label}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${STATUS_META[t.status].className}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[t.status].dot}`} />
                      {STATUS_META[t.status].label}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{t.createdAt}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => toast.info(`إدارة التذكرة ${t.id}`, { description: "نموذج تجريبي بدون خلفية برمجية." })}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      إدارة
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    لا توجد تذاكر مطابقة للفلترة الحالية.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
