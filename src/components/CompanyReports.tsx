import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { computeKpis, exportTicketsExcel, fetchReportData } from "@/lib/reports";
import type { FieldItem } from "@/lib/company-settings";

const iso = (d: Date) => d.toISOString().slice(0, 10);

export function CompanyReports({
  companyId,
  companyName,
  fields,
}: {
  companyId: string;
  companyName: string;
  fields: FieldItem[];
}) {
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return iso(d);
  });
  const [to, setTo] = useState(() => iso(new Date()));

  const report = useQuery({
    queryKey: ["report", companyId, from, to],
    queryFn: () => fetchReportData(companyId, from, to),
  });

  const kpis = report.data ? computeKpis(report.data) : null;

  const download = () => {
    if (!report.data) return;
    try {
      exportTicketsExcel(report.data, fields, companyName, from, to);
    } catch (e) {
      toast.error("تعذّر التصدير", { description: (e as Error).message });
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-5">
        <label className="space-y-1.5">
          <span className="block text-xs font-bold text-muted-foreground">من تاريخ</span>
          <input
            type="date"
            className="field w-auto"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="space-y-1.5">
          <span className="block text-xs font-bold text-muted-foreground">إلى تاريخ</span>
          <input
            type="date"
            className="field w-auto"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <button
          onClick={download}
          disabled={report.isLoading || !report.data}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground disabled:opacity-60"
        >
          {report.isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          تصدير Excel
        </button>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        {[
          { label: "إجمالي التذاكر", value: kpis?.total ?? 0 },
          { label: "مفتوحة", value: kpis?.open ?? 0 },
          { label: "جاري المتابعة", value: kpis?.progress ?? 0 },
          { label: "تم الحل", value: kpis?.resolved ?? 0 },
          { label: "مغلقة", value: kpis?.closed ?? 0 },
          { label: "عاجلة", value: kpis?.urgent ?? 0 },
          { label: "عدد الردود", value: kpis?.replies ?? 0 },
          { label: "نسبة الحل", value: `${kpis?.resolutionRate ?? 0}%` },
          { label: "متوسط زمن الحل", value: `${kpis?.avgHours ?? 0} س` },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-2xl font-black text-primary">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-right text-sm">
          <thead className="bg-muted/60 text-xs text-muted-foreground">
            <tr>
              <th className="p-3">رقم التذكرة</th>
              <th className="p-3">العنوان</th>
              <th className="p-3">الموظف</th>
              <th className="p-3">الحالة</th>
              <th className="p-3">الردود</th>
              <th className="p-3">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {(report.data?.tickets ?? []).map((t) => (
              <tr key={t.id} className="border-t border-border">
                <td className="p-3 text-xs font-bold" dir="ltr">
                  {t.ticket_no}
                </td>
                <td className="p-3 font-bold">{t.title}</td>
                <td className="p-3 text-xs">{t.requester_name || "—"}</td>
                <td className="p-3 text-xs">{t.status}</td>
                <td className="p-3 text-xs">
                  {(report.data?.updates ?? []).filter((u) => u.ticket_id === t.id).length}
                </td>
                <td className="p-3 text-xs">
                  {new Date(t.created_at).toLocaleDateString("ar-SA-u-ca-gregory")}
                </td>
              </tr>
            ))}
            {report.data && report.data.tickets.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  لا توجد تذاكر في هذه الفترة.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
