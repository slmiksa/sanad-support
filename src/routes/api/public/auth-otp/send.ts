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

async function sha256(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function emailHtml(code: string) {
  return `<!doctype html><html lang="ar" dir="rtl"><body style="margin:0;background:#f4f7f8;font-family:Tahoma,Arial,sans-serif;padding:32px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e2e8e9">
      <tr><td style="background:linear-gradient(135deg,#2cb3b3,#17656b);padding:28px 24px;text-align:center;color:#ffffff">
        <div style="font-size:20px;font-weight:800">نظام سند للدعم الفني</div>
        <div style="font-size:13px;opacity:.9;margin-top:6px">رمز تحقق الدخول للوحة التحكم</div>
      </td></tr>
      <tr><td style="padding:28px 24px;text-align:center;color:#0f2a33">
        <p style="margin:0 0 18px;font-size:14px;line-height:26px">استخدم الرمز التالي لإكمال تسجيل الدخول. الرمز صالح لمدة 10 دقائق ولمرة واحدة فقط.</p>
        <div style="display:inline-block;padding:16px 28px;border-radius:16px;background:#effafa;border:1px dashed #2cb3b3;color:#12525a;font-size:34px;font-weight:800;letter-spacing:10px;direction:ltr">${code}</div>
        <p style="margin:22px 0 0;font-size:12px;color:#64797f;line-height:22px">إذا لم تحاول تسجيل الدخول، تجاهل هذه الرسالة وغيّر كلمة المرور فوراً.</p>
      </td></tr>
      <tr><td style="padding:16px;text-align:center;background:#f8fafa;font-size:11px;color:#7b8d92">
        برمجة وتطوير شركة لمحة الآمنة — <a href="https://lamhasec.com" style="color:#2cb3b3;text-decoration:none">lamhasec.com</a>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

export const Route = createFileRoute("/api/public/auth-otp/send")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { headers: cors }),
      POST: async ({ request }) => {
        try {
          const { email } = (await request.json()) as { email?: string };
          const cleanEmail = (email ?? "").trim().toLowerCase();
          if (!cleanEmail) return json({ error: "البريد مطلوب" }, 400);

          const admin = createClient(
            process.env["SUPABASE_URL"]!,
            process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
            { auth: { persistSession: false } },
          );

          const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
          const user = list?.users?.find((u) => (u.email ?? "").toLowerCase() === cleanEmail);
          if (!user) return json({ sent: false, required: false });

          const { data: required } = await admin.rpc("requires_two_factor", { _user_id: user.id });
          if (!required) return json({ sent: false, required: false });

          const code = String(Math.floor(100000 + Math.random() * 900000));
          const hash = await sha256(`${user.id}:${code}`);

          await admin
            .from("login_otp_codes")
            .update({ consumed_at: new Date().toISOString() })
            .is("consumed_at", null)
            .eq("user_id", user.id);

          const { error: insertError } = await admin.from("login_otp_codes").insert({
            user_id: user.id,
            email: cleanEmail,
            code_hash: hash,
            expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          });
          if (insertError) throw insertError;

          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env["RESEND_API_KEY"]}`,
            },
            body: JSON.stringify({
              from: "نظام سند <no-reply@lamhasec.com>",
              to: [cleanEmail],
              subject: `رمز الدخول: ${code}`,
              html: emailHtml(code),
            }),
          });
          if (!res.ok) {
            const body = await res.text();
            console.error(`Resend failed [${res.status}]: ${body}`);
            return json({ error: `تعذّر إرسال البريد: ${body}` }, 502);
          }

          return json({ sent: true, required: true });
        } catch (err) {
          console.error(err);
          return json({ error: (err as Error).message }, 500);
        }
      },
    },
  },
});
