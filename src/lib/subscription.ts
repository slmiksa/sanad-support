/** أدوات حساب وعرض مدة الاشتراك */

export const MONTH_OPTIONS = [1, 2, 3, 6, 9, 12] as const;

export function addMonths(from: Date, months: number): Date {
  const d = new Date(from.getTime());
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  // معالجة نهايات الشهور (مثال: 31 يناير + شهر)
  if (d.getDate() < day) d.setDate(0);
  return d;
}

export function daysLeft(endsAt?: string | null): number | null {
  if (!endsAt) return null;
  const end = new Date(endsAt).getTime();
  if (Number.isNaN(end)) return null;
  return Math.ceil((end - Date.now()) / 86400000);
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ar-SA-u-ca-gregory", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function subscriptionState(endsAt?: string | null): {
  label: string;
  tone: "ok" | "warn" | "expired" | "none";
  days: number | null;
} {
  const days = daysLeft(endsAt);
  if (days === null) return { label: "غير محدد", tone: "none", days };
  if (days < 0) return { label: "منتهي", tone: "expired", days };
  if (days <= 30) return { label: `ينتهي خلال ${days} يوماً`, tone: "warn", days };
  return { label: `متبقٍ ${days} يوماً`, tone: "ok", days };
}
