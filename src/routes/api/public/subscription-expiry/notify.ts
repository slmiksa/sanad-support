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

const SITE = "https://sanad.lamhasec.com";

function fmt(date: string) {
  return new Date(date).toLocaleDateString("ar-SA-u-ca-gregory", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function emailHtml(company: string, slug: string, endsAt: string, daysLeft: number) {
  const link = `${SITE}/c/${slug}/admin`;
  return `<!doctype html><html lang="ar" dir="rtl"><body style="margin:0;background:#f4f7f8;font-family:Tahoma,Arial,sans-serif;padding:32px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e2e8e9">
      <tr><td style="background:linear-gradient(135deg,#2cb3b3,#17656b);padding:28px 24px;text-align:center;color:#ffffff">
        <div style="font-size:20px;font-weight:800">نظام سند للدعم الفني</div>
        <div style="font-size:13px;opacity:.9;margin-top:6px">تنبيه قرب انتهاء الاشتراك</div>
      </td></tr>
      <tr><td style="padding:28px 24px;color:#0f2a33">
        <p style="margin:0 0 14px;font-size:14px;line-height:26px">مرحباً فريق <strong>${company}</strong>،</p>
        <p style="margin:0 0 18px;font-size:14px;line-height:26px">
          نودّ تذكيركم بأن اشتراككم في نظام سند سينتهي بتاريخ <strong>${fmt(endsAt)}</strong>
          (متبقٍ ${daysLeft} يوماً). لتجديد الاشتراك دون انقطاع الخدمة، يرجى التواصل معنا.
        </p>
        <div style="text-align:center">
          <a href="${link}" style="display:inline-block;background:#2cb3b3;color:#ffffff;text-decoration:none;padding:14px 30px;border-radius:14px;font-weight:800;font-size:15px">لوحة تحكم الشركة</a>
        </div>
      </td></tr>
      <tr><td style="padding:16px;text-align:center;background:#f8fafa;font-size:11px;color:#7b8d92">
        برمجة وتطوير شركة لمحة الآمنة — <a href="https://lamhasec.com" style="color:#2cb3b3;text-decoration:none">lamhasec.com</a>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

async function sendEmail(to: string[], subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env["RESEND_API_KEY"]}`,
    },
    body: JSON.stringify({ from: "نظام سند <no-reply@lamhasec.com>", to, subject, html }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Resend failed [${res.status}]: ${body}`);
    return false;
  }
  return true;
}

export const Route = createFileRoute("/api/public/subscription-expiry/notify")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { headers: cors }),
      POST: async () => {
        try {
          const admin = createClient(
            process.env["SUPABASE_URL"]!,
            process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
            { auth: { persistSession: false } },
          );

          const now = Date.now();
          const horizon = new Date(now + 30 * 86400000).toISOString();

          const { data: companies, error } = await admin
            .from("companies")
            .select("id, name, slug, subscription_ends_at, subscription_notified_at, is_active")
            .eq("is_active", true)
            .not("subscription_ends_at", "is", null)
            .lte("subscription_ends_at", horizon)
            .gte("subscription_ends_at", new Date(now).toISOString());
          if (error) return json({ error: error.message }, 500);

          const pending = (companies ?? []).filter((c) => {
            const last = c.subscription_notified_at
              ? new Date(c.subscription_notified_at).getTime()
              : 0;
            // لا نعيد الإرسال إلا بعد 20 يوماً من آخر تنبيه لنفس الاشتراك
            return now - last > 20 * 86400000;
          });

          let sent = 0;
          for (const c of pending) {
            const { data: roles } = await admin
              .from("user_roles")
              .select("user_id")
              .eq("company_id", c.id)
              .eq("role", "company_admin");
            const ids = (roles ?? []).map((r) => r.user_id);
            if (!ids.length) continue;

            const { data: profiles } = await admin
              .from("profiles")
              .select("email")
              .in("id", ids);
            const emails = (profiles ?? [])
              .map((p) => (p.email ?? "").trim())
              .filter((e) => e.includes("@"));
            if (!emails.length) continue;

            const endsAt = c.subscription_ends_at as string;
            const daysLeft = Math.max(
              0,
              Math.ceil((new Date(endsAt).getTime() - now) / 86400000),
            );

            const ok = await sendEmail(
              emails,
              `تنبيه: اشتراك ${c.name} في نظام سند ينتهي خلال ${daysLeft} يوماً`,
              emailHtml(c.name, c.slug, endsAt, daysLeft),
            );
            if (!ok) continue;

            await admin
              .from("companies")
              .update({ subscription_notified_at: new Date(now).toISOString() })
              .eq("id", c.id);
            sent += 1;
          }

          return json({ checked: companies?.length ?? 0, sent });
        } catch (err) {
          console.error(err);
          return json({ error: (err as Error).message }, 500);
        }
      },
    },
  },
});
