// عنوان نقاط الـ API (المصادقة الثنائية + إشعارات التذاكر عبر Resend).
//
// في النسخة الثابتة (build:static) لا يوجد خادم على سيرفر العميل، لذلك
// يجب توجيه هذه الطلبات إلى منصة سند الرسمية التي تملك مفاتيح Resend.
// يمكن تجاوز ذلك بضبط VITE_OTP_API_BASE قبل البناء.

const PLATFORM_API = "https://sanad.lamhasec.com";

/** المضيفات التي يعمل عليها الخادم نفسه (نفس الأصل) */
function hasLocalServer(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".lovable.app") ||
    hostname.endsWith(".lovableproject.com") ||
    hostname === "sanad.lamhasec.com" ||
    hostname.endsWith(".lamhasec.com")
  );
}

export function apiBase(): string {
  const configured = (import.meta.env["VITE_OTP_API_BASE"] as string | undefined)?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (typeof window === "undefined") return "";
  return hasLocalServer(window.location.hostname) ? "" : PLATFORM_API;
}

export function apiUrl(path: string): string {
  return `${apiBase()}${path.startsWith("/") ? path : `/${path}`}`;
}
