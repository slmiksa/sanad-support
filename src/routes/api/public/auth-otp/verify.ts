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

export const Route = createFileRoute("/api/public/auth-otp/verify")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { headers: cors }),
      POST: async ({ request }) => {
        try {
          const { email, code } = (await request.json()) as { email?: string; code?: string };
          const cleanEmail = (email ?? "").trim().toLowerCase();
          const cleanCode = (code ?? "").trim();
          if (!cleanEmail || !/^\d{6}$/.test(cleanCode))
            return json({ error: "بيانات غير صالحة" }, 400);

          const admin = createClient(
            process.env["SUPABASE_URL"]!,
            process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
            { auth: { persistSession: false } },
          );

          const { data: rows } = await admin
            .from("login_otp_codes")
            .select("id, user_id, code_hash, expires_at, consumed_at, attempts")
            .eq("email", cleanEmail)
            .is("consumed_at", null)
            .order("created_at", { ascending: false })
            .limit(1);

          const row = rows?.[0];
          if (!row) return json({ error: "لا يوجد رمز فعّال، اطلب رمزاً جديداً" }, 400);
          if (new Date(row.expires_at).getTime() < Date.now())
            return json({ error: "انتهت صلاحية الرمز" }, 400);
          if ((row.attempts ?? 0) >= 5)
            return json({ error: "تجاوزت عدد المحاولات، اطلب رمزاً جديداً" }, 429);

          const hash = await sha256(`${row.user_id}:${cleanCode}`);
          if (hash !== row.code_hash) {
            await admin
              .from("login_otp_codes")
              .update({ attempts: (row.attempts ?? 0) + 1 })
              .eq("id", row.id);
            return json({ error: "الرمز غير صحيح" }, 400);
          }

          await admin
            .from("login_otp_codes")
            .update({ consumed_at: new Date().toISOString() })
            .eq("id", row.id);

          return json({ verified: true });
        } catch (err) {
          console.error(err);
          return json({ error: (err as Error).message }, 500);
        }
      },
    },
  },
});
