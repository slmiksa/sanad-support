import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { PRIORITY_META, STATUS_META, type Priority, type Status } from "@/lib/tickets";
import type { FieldItem } from "@/lib/company-settings";

export type ReportTicket = {
  id: string;
  ticket_no: string;
  title: string;
  description: string;
  branch: string;
  priority: Priority;
  status: Status;
  requester_name: string;
  requester_email: string | null;
  requester_phone: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  custom_data: Record<string, unknown> | null;
  attachments: unknown;
};

const fmt = (v: string | null | undefined) =>
  v ? new Date(v).toLocaleString("ar-SA-u-ca-gregory", { dateStyle: "short", timeStyle: "short" }) : "—";

export async function fetchReportData(
  companyId: string,
  from: string,
  to: string,
) {
  const start = new Date(`${from}T00:00:00`).toISOString();
  const end = new Date(`${to}T23:59:59`).toISOString();

  const { data: tickets, error } = await supabase
    .from("tickets")
    .select(
      "id, ticket_no, title, description, branch, priority, status, requester_name, requester_email, requester_phone, created_by, created_at, updated_at, closed_at, custom_data, attachments",
    )
    .eq("company_id", companyId)
    .gte("created_at", start)
    .lte("created_at", end)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const list = (tickets ?? []) as unknown as ReportTicket[];
  const ids = list.map((t) => t.id);

  const [updatesRes, profilesRes] = await Promise.all([
    ids.length
      ? supabase
          .from("ticket_updates")
          .select("id, ticket_id, author_name, note, status, created_at")
          .in("ticket_id", ids)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("profiles")
      .select("id, full_name, email, employee_no, extension, specialty, department")
      .eq("company_id", companyId),
  ]);

  return {
    tickets: list,
    updates: (updatesRes.data ?? []) as {
      id: string;
      ticket_id: string;
      author_name: string;
      note: string;
      status: Status | null;
      created_at: string;
    }[],
    profiles: (profilesRes.data ?? []) as {
      id: string;
      full_name: string;
      email: string;
      employee_no: string | null;
      extension: string | null;
      specialty: string | null;
      department: string | null;
    }[],
  };
}

export type ReportData = Awaited<ReturnType<typeof fetchReportData>>;

export function computeKpis(data: ReportData) {
  const t = data.tickets;
  const resolved = t.filter((x) => x.status === "resolved" || x.status === "closed");
  const hours = resolved
    .map((x) => {
      const end = x.closed_at ?? x.updated_at;
      return (new Date(end).getTime() - new Date(x.created_at).getTime()) / 36e5;
    })
    .filter((h) => Number.isFinite(h) && h >= 0);
  const avg = hours.length ? hours.reduce((a, b) => a + b, 0) / hours.length : 0;
  return {
    total: t.length,
    open: t.filter((x) => x.status === "open").length,
    progress: t.filter((x) => x.status === "progress").length,
    resolved: t.filter((x) => x.status === "resolved").length,
    closed: t.filter((x) => x.status === "closed").length,
    urgent: t.filter((x) => x.priority === "urgent").length,
    replies: data.updates.length,
    resolutionRate: t.length ? Math.round((resolved.length / t.length) * 100) : 0,
    avgHours: Math.round(avg * 10) / 10,
  };
}

export function exportTicketsExcel(
  data: ReportData,
  fields: FieldItem[],
  companyName: string,
  from: string,
  to: string,
) {
  const customFields = fields.filter((f) => f.custom && f.enabled);
  const profileById = new Map(data.profiles.map((p) => [p.id, p]));

  const rows = data.tickets.map((t) => {
    const p = t.created_by ? profileById.get(t.created_by) : undefined;
    const ups = data.updates.filter((u) => u.ticket_id === t.id);
    const last = ups[ups.length - 1];
    const row: Record<string, string | number> = {
      "رقم التذكرة": t.ticket_no,
      "العنوان": t.title,
      "الوصف": t.description || "—",
      "الفرع": t.branch || "—",
      "الأهمية": PRIORITY_META[t.priority]?.label ?? t.priority,
      "الحالة": STATUS_META[t.status]?.label ?? t.status,
      "اسم الموظف": p?.full_name || t.requester_name || "—",
      "بريد الموظف": p?.email || t.requester_email || "—",
      "الرقم الوظيفي": p?.employee_no || "—",
      "التحويلة": p?.extension || "—",
      "التخصص": p?.specialty || "—",
      "القسم": p?.department || "—",
      "جوال مقدم الطلب": t.requester_phone || "—",
    };
    for (const f of customFields) {
      const v = (t.custom_data ?? {})[f.key];
      row[f.label] = v === undefined || v === null || v === "" ? "—" : String(v);
    }
    row["عدد الردود"] = ups.length;
    row["آخر من رد"] = last?.author_name || "—";
    row["آخر رد"] = last?.note || "—";
    row["تاريخ آخر رد"] = fmt(last?.created_at);
    row["تاريخ الإنشاء"] = fmt(t.created_at);
    row["تاريخ الإغلاق"] = fmt(t.closed_at);
    row["عدد المرفقات"] = Array.isArray(t.attachments) ? t.attachments.length : 0;
    return row;
  });

  const repliesRows = data.updates.map((u) => {
    const t = data.tickets.find((x) => x.id === u.ticket_id);
    return {
      "رقم التذكرة": t?.ticket_no ?? "—",
      "عنوان التذكرة": t?.title ?? "—",
      "عضوية من قام بالرد": u.author_name || "فريق الدعم",
      "الرد": u.note,
      "الحالة بعد الرد": u.status ? (STATUS_META[u.status]?.label ?? u.status) : "—",
      "التاريخ": fmt(u.created_at),
    };
  });

  const k = computeKpis(data);
  const kpiRows = [
    { "المؤشر": "إجمالي التذاكر", "القيمة": k.total },
    { "المؤشر": "مفتوحة", "القيمة": k.open },
    { "المؤشر": "جاري المتابعة", "القيمة": k.progress },
    { "المؤشر": "تم الحل", "القيمة": k.resolved },
    { "المؤشر": "مغلقة", "القيمة": k.closed },
    { "المؤشر": "عاجلة", "القيمة": k.urgent },
    { "المؤشر": "عدد الردود", "القيمة": k.replies },
    { "المؤشر": "نسبة الحل %", "القيمة": k.resolutionRate },
    { "المؤشر": "متوسط زمن الحل (ساعة)", "القيمة": k.avgHours },
    { "المؤشر": "الفترة", "القيمة": `${from} → ${to}` },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kpiRows), "المؤشرات");
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(rows.length ? rows : [{ "لا توجد بيانات": "—" }]),
    "التذاكر",
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(repliesRows.length ? repliesRows : [{ "لا توجد ردود": "—" }]),
    "الردود",
  );
  XLSX.writeFile(wb, `tickets-${companyName || "report"}-${from}_${to}.xlsx`);
}
