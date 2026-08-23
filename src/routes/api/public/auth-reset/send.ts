import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

const DEFAULT_SITE = "https://sanad.lamhasec.com";

/** يقبل فقط النطاقات الموثوقة لتفادي إعادة التوجيه الخبيث */
function safeOrigin(origin?: string): string {
  if (!origin) return DEFAULT_SITE;
  try {
    const url = new URL(origin);
    const host = url.hostname;
    const ok =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith("lamhasec.com") ||
      host.endsWith(".lovable.app") ||
      host.endsWith(".lovableproject.com");
    return ok ? `${url.protocol}//${url.host}` : DEFAULT_SITE;
  } catch {
    return DEFAULT_SITE;
  }
}

function emailHtml(link: string) {
  return `<!doctype html><html lang="ar" dir="rtl"><body style="margin:0;background:#f4f7f8;font-family:Tahoma,Arial,sans-serif;padding:32px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e2e8e9">
      <tr><td style="background:linear-gradient(135deg,#2cb3b3,#17656b);padding:28px 24px;text-align:center;color:#ffffff">
        <div style="font-size:20px;font-weight:800">نظام سند للدعم الفني</div>
        <div style="font-size:13px;opacity:.9;margin-top:6px">إعادة تعيين كلمة المرور</div>
      </td></tr>
      <tr><td style="padding:28px 24px;color:#0f2a33">
        <p style="margin:0 0 18px;font-size:14px;line-height:26px">وصلنا طلب لتعيين كلمة مرور جديدة لحسابك. اضغط الزر التالي خلال 60 دقيقة لإكمال العملية.</p>
        <div style="text-align:center">
          <a href="${link}" style="display:inline-block;background:#2cb3b3;color:#ffffff;text-decoration:none;padding:14px 30px;border-radius:14px;font-weight:800;font-size:15px">تعيين كلمة مرور جديدة</a>
        </div>
        <p style="margin:18px 0 0;text-align:center;font-size:11px;color:#64797f;word-break:break-all" dir="ltr">${link}</p>
        <p style="margin:22px 0 0;font-size:12px;color:#64797f;line-height:22px">إذا لم تطلب ذلك، تجاهل هذه الرسالة؛ كلمة مرورك الحالية تبقى كما هي.</p>
      </td></tr>
      <tr><td style="padding:16px;text-align:center;background:#f8fafa;font-size:11px;color:#7b8d92">
        برمجة وتطوير شركة لمحة الآمنة — <a href="https://lamhasec.com" style="color:#2cb3b3;text-decoration:none">lamhasec.com</a>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

export const Route = createFileRoute("/api/public/auth-reset/send")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { headers: cors }),
      POST: async ({ request }) => {
        try {
          const { email, origin } = (await request.json()) as {
            email?: string;
            origin?: string;
          };
          const cleanEmail = (email ?? "").trim().toLowerCase();
          if (!cleanEmail) return json({ error: "البريد مطلوب" }, 400);

          const site = safeOrigin(origin);

          const admin = createClient(
            process.env["SUPABASE_URL"]!,
            process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
            { auth: { persistSession: false } },
          );

          const { data, error } = await admin.auth.admin.generateLink({
            type: "recovery",
            email: cleanEmail,
            options: { redirectTo: `${site}/reset-password` },
          });
          if (error) return json({ error: error.message }, 400);

          const hashedToken = data?.properties?.hashed_token;
          if (!hashedToken) return json({ error: "تعذّر إنشاء رابط إعادة التعيين" }, 500);

          const link = `${site}/reset-password?token_hash=${encodeURIComponent(
            hashedToken,
          )}&type=recovery`;

          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env["RESEND_API_KEY"]}`,
            },
            body: JSON.stringify({
              from: "نظام سند <no-reply@lamhasec.com>",
              to: [cleanEmail],
              subject: "إعادة تعيين كلمة المرور — نظام سند",
              html: emailHtml(link),
            }),
          });
          if (!res.ok) {
            const body = await res.text();
            console.error(`Resend failed [${res.status}]: ${body}`);
            return json({ error: `تعذّر إرسال البريد: ${body}` }, 502);
          }

          return json({ sent: true });
        } catch (err) {
          console.error(err);
          return json({ error: (err as Error).message }, 500);
        }
      },
    },
  },
});
