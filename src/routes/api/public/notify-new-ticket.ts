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

const SITE_URL = "https://sanad.lamhasec.com";
const PLATFORM_LOGIN_URL = `${SITE_URL}/auth`;

function emailHtml(opts: {
  companyName: string;
  ticketNo: string;
  title: string;
  priority: string;
  requester: string;
  loginUrl: string;
}) {
  return `<!doctype html><html lang="ar" dir="rtl"><body style="margin:0;background:#f4f7f8;font-family:Tahoma,Arial,sans-serif;padding:32px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e2e8e9">
      <tr><td style="background:linear-gradient(135deg,#2cb3b3,#17656b);padding:26px 24px;text-align:center;color:#ffffff">
        <div style="font-size:20px;font-weight:800">نظام سند للدعم الفني</div>
        <div style="font-size:13px;opacity:.92;margin-top:6px">تذكرة جديدة بحاجة إلى معالجة</div>
      </td></tr>
      <tr><td style="padding:26px 24px;color:#0f2a33">
        <p style="margin:0 0 14px;font-size:15px;font-weight:800">الشركة: ${opts.companyName}</p>
        <table role="presentation" width="100%" style="font-size:14px;line-height:26px;border-collapse:collapse">
          <tr><td style="color:#64797f;width:110px">رقم التذكرة</td><td style="font-weight:700" dir="ltr">${opts.ticketNo}</td></tr>
          <tr><td style="color:#64797f">العنوان</td><td style="font-weight:700">${opts.title}</td></tr>
          <tr><td style="color:#64797f">الأولوية</td><td>${opts.priority}</td></tr>
          <tr><td style="color:#64797f">مقدّم الطلب</td><td>${opts.requester}</td></tr>
        </table>
        <p style="margin:18px 0 20px;font-size:14px;line-height:26px;color:#12525a;font-weight:700">نرجو الدخول حالاً لحل المشكلة.</p>
        <div style="text-align:center">
          <a href="${opts.loginUrl}" style="display:inline-block;background:#2cb3b3;color:#ffffff;text-decoration:none;padding:14px 30px;border-radius:14px;font-weight:800;font-size:15px">الدخول إلى مركز الدعم</a>
        </div>
        <p style="margin:18px 0 0;text-align:center;font-size:12px;color:#64797f" dir="ltr">${opts.loginUrl}</p>
      </td></tr>
      <tr><td style="padding:16px;text-align:center;background:#f8fafa;font-size:11px;color:#7b8d92">
        برمجة وتطوير شركة لمحة الآمنة — <a href="https://lamhasec.com" style="color:#2cb3b3;text-decoration:none">lamhasec.com</a>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

const priorityLabel = (p: string) =>
  p === "urgent" ? "عاجلة" : p === "medium" ? "متوسطة" : "عادية";

export const Route = createFileRoute("/api/public/notify-new-ticket")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { headers: cors }),
      POST: async ({ request }) => {
        try {
          const { ticket_no } = (await request.json()) as { ticket_no?: string };
          const ticketNo = (ticket_no ?? "").trim().toUpperCase();
          if (!ticketNo) return json({ error: "رقم التذكرة مطلوب" }, 400);

          const admin = createClient(
            process.env["SUPABASE_URL"]!,
            process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
            { auth: { persistSession: false } },
          );

          const { data: ticket, error: ticketError } = await admin
            .from("tickets")
            .select("ticket_no, title, priority, requester_name, company_id, created_at")
            .eq("ticket_no", ticketNo)
            .maybeSingle();
          if (ticketError) throw ticketError;
          if (!ticket) return json({ sent: false, reason: "not_found" });

          const { data: company } = await admin
            .from("companies")
            .select("name, slug, managed_support")
            .eq("id", ticket.company_id)
            .maybeSingle();

          if (!company) return json({ sent: false, reason: "no_company" });

          const companyLoginUrl = `${SITE_URL}/c/${company.slug}/login`;

          const emailsOf = async (userIds: string[]) => {
            if (!userIds.length) return [] as string[];
            const { data } = await admin.from("profiles").select("email").in("id", userIds);
            return Array.from(
              new Set(
                (data ?? [])
                  .map((a) => (a.email ?? "").trim().toLowerCase())
                  .filter((e) => e.includes("@")),
              ),
            );
          };

          // فريق الدعم الفني داخل الشركة الكلاينت — يصلهم الإشعار دائماً برابط مسار شركتهم
          const { data: companyAgents } = await admin
            .from("user_roles")
            .select("user_id")
            .eq("role", "agent")
            .eq("company_id", ticket.company_id);
          const companyRecipients = await emailsOf(
            (companyAgents ?? []).map((r) => r.user_id),
          );

          // موظفو دعم لمحة — فقط إذا كانت الشركة مدعومة من فريقنا، وبرابط بوابة المنصة
          let platformRecipients: string[] = [];
          if (company.managed_support) {
            const { data: platformAgents } = await admin
              .from("user_roles")
              .select("user_id")
              .eq("role", "platform_agent");
            platformRecipients = (
              await emailsOf((platformAgents ?? []).map((r) => r.user_id))
            ).filter((e) => !companyRecipients.includes(e));
          }

          if (!companyRecipients.length && !platformRecipients.length)
            return json({ sent: false, reason: "no_agents" });

          const send = async (to: string[], loginUrl: string) => {
            if (!to.length) return;
            const res = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env["RESEND_API_KEY"]}`,
              },
              body: JSON.stringify({
                from: "نظام سند <no-reply@lamhasec.com>",
                to,
                subject: `تذكرة جديدة — ${company.name} (${ticket.ticket_no})`,
                html: emailHtml({
                  companyName: company.name,
                  ticketNo: ticket.ticket_no,
                  title: ticket.title,
                  priority: priorityLabel(ticket.priority),
                  requester: ticket.requester_name || "—",
                  loginUrl,
                }),
              }),
            });
            if (!res.ok) {
              const body = await res.text();
              console.error(`Resend failed [${res.status}]: ${body}`);
              throw new Error(`تعذّر إرسال الإشعار: ${body}`);
            }
          };

          await send(companyRecipients, companyLoginUrl);
          await send(platformRecipients, PLATFORM_LOGIN_URL);

          return json({
            sent: true,
            recipients: companyRecipients.length + platformRecipients.length,
          });
        } catch (err) {
          console.error(err);
          return json({ error: (err as Error).message }, 500);
        }
      },
    },
  },
});
