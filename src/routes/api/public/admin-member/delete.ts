import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

export const Route = createFileRoute("/api/public/admin-member/delete")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { headers: cors }),
      POST: async ({ request }) => {
        try {
          const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
          if (!token) return json({ error: "غير مصرح" }, 401);

          const { user_id } = (await request.json()) as { user_id?: string };
          if (!user_id) return json({ error: "العضوية مطلوبة" }, 400);

          const admin = createClient(
            process.env["SUPABASE_URL"]!,
            process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
            { auth: { persistSession: false } },
          );

          const { data: caller, error: callerError } = await admin.auth.getUser(token);
          if (callerError || !caller.user) return json({ error: "الجلسة غير صالحة" }, 401);
          const callerId = caller.user.id;
          if (callerId === user_id) return json({ error: "لا يمكنك حذف حسابك الحالي" }, 400);

          const { data: callerRoles } = await admin
            .from("user_roles")
            .select("role, company_id")
            .eq("user_id", callerId);

          const isSuper = (callerRoles ?? []).some((r) => r.role === "super_admin");

          if (!isSuper) {
            const { data: target } = await admin
              .from("profiles")
              .select("company_id")
              .eq("id", user_id)
              .maybeSingle();
            const companyId = target?.company_id;
            const ok =
              !!companyId &&
              (callerRoles ?? []).some(
                (r) => r.role === "company_admin" && r.company_id === companyId,
              );
            if (!ok) return json({ error: "لا تملك صلاحية حذف هذه العضوية" }, 403);
          }

          await admin.from("user_roles").delete().eq("user_id", user_id);
          await admin.from("profiles").delete().eq("id", user_id);
          const { error } = await admin.auth.admin.deleteUser(user_id);
          if (error) return json({ error: error.message }, 400);

          return json({ ok: true });
        } catch (err) {
          console.error(err);
          return json({ error: (err as Error).message }, 500);
        }
      },
    },
  },
});
