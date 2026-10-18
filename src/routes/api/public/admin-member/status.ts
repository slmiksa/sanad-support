import { createFileRoute } from "@tanstack/react-router";
const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, authorization", "Access-Control-Allow-Methods": "POST, OPTIONS", "Cache-Control": "no-store" };
export const Route = createFileRoute("/api/public/admin-member/status")({ server: { handlers: {
  OPTIONS: async () => new Response(null, { status: 204, headers }),
  POST: async ({ request }) => {
    const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!token) return Response.json({ error: "غير مصرح" }, { status: 401, headers });
    try {
      const { changeMemberStatus } = await import("@/lib/member-status.server");
      return Response.json(await changeMemberStatus(await request.json(), token), { headers });
    } catch (error) {
      return Response.json({ error: error instanceof Error ? error.message : "تعذّر تحديث العضوية" }, { status: 400, headers });
    }
  },
} } });