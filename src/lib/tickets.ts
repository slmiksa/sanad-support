export type Priority = "urgent" | "medium" | "normal";
export type Status = "open" | "progress" | "resolved" | "closed";

export const BRANCHES = [
  "الفرع الرئيسي - الرياض",
  "فرع جدة",
  "فرع الدمام",
  "فرع أبها",
  "المستودع المركزي",
];

export const PRIORITY_META: Record<
  Priority,
  { label: string; icon: string; className: string }
> = {
  urgent: {
    label: "عاجلة",
    icon: "🚨",
    className: "bg-destructive/10 text-destructive border-destructive/30",
  },
  medium: {
    label: "متوسطة",
    icon: "⚠️",
    className:
      "bg-[oklch(0.85_0.15_85/0.18)] text-[oklch(0.55_0.14_75)] border-[oklch(0.7_0.15_85/0.4)]",
  },
  normal: {
    label: "عادية",
    icon: "ℹ️",
    className: "bg-primary/10 text-primary border-primary/30",
  },
};

export const STATUS_META: Record<Status, { label: string; dot: string; className: string }> = {
  open: {
    label: "مفتوحة",
    dot: "bg-primary",
    className: "bg-primary/10 text-primary border-primary/30",
  },
  progress: {
    label: "جاري المتابعة",
    dot: "bg-[oklch(0.78_0.16_85)]",
    className:
      "bg-[oklch(0.85_0.15_85/0.18)] text-[oklch(0.55_0.14_75)] border-[oklch(0.7_0.15_85/0.4)]",
  },
  resolved: {
    label: "تم الحل",
    dot: "bg-[oklch(0.65_0.16_150)]",
    className:
      "bg-[oklch(0.7_0.16_150/0.15)] text-[oklch(0.5_0.14_150)] border-[oklch(0.65_0.16_150/0.35)]",
  },
  closed: {
    label: "مغلقة",
    dot: "bg-muted-foreground",
    className: "bg-muted text-muted-foreground border-border",
  },
};

export type Ticket = {
  id: string;
  title: string;
  branch: string;
  priority: Priority;
  status: Status;
  requester: string;
  createdAt: string;
};

export const MOCK_TICKETS: Ticket[] = [
  {
    id: "TCK-8821",
    title: "الطابعة في قسم المحاسبة لا تستجيب",
    branch: "الفرع الرئيسي - الرياض",
    priority: "urgent",
    status: "progress",
    requester: "نورة العتيبي",
    createdAt: "2026-08-11 09:24",
  },
  {
    id: "TCK-8814",
    title: "بطء شديد في نظام نقاط البيع",
    branch: "فرع جدة",
    priority: "urgent",
    status: "open",
    requester: "خالد الشمري",
    createdAt: "2026-08-11 08:05",
  },
  {
    id: "TCK-8809",
    title: "طلب تفعيل بريد إلكتروني لموظف جديد",
    branch: "فرع الدمام",
    priority: "normal",
    status: "resolved",
    requester: "سارة القحطاني",
    createdAt: "2026-08-10 15:41",
  },
  {
    id: "TCK-8802",
    title: "انقطاع الاتصال بالشبكة الداخلية",
    branch: "المستودع المركزي",
    priority: "medium",
    status: "progress",
    requester: "ماجد الدوسري",
    createdAt: "2026-08-10 12:10",
  },
  {
    id: "TCK-8795",
    title: "تحديث نسخة ويندوز على 12 جهاز",
    branch: "فرع أبها",
    priority: "medium",
    status: "closed",
    requester: "عبدالله الحربي",
    createdAt: "2026-08-09 17:30",
  },
  {
    id: "TCK-8788",
    title: "استبدال لوحة مفاتيح تالفة",
    branch: "الفرع الرئيسي - الرياض",
    priority: "normal",
    status: "resolved",
    requester: "ريم الزهراني",
    createdAt: "2026-08-09 10:02",
  },
  {
    id: "TCK-8780",
    title: "مشكلة في الوصول لمجلد المشاركة",
    branch: "فرع جدة",
    priority: "medium",
    status: "open",
    requester: "فيصل العمري",
    createdAt: "2026-08-08 13:55",
  },
];

export function generateTicketId() {
  return `TCK-${Math.floor(1000 + Math.random() * 8999)}`;
}
