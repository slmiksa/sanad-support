import { createFileRoute } from "@tanstack/react-router";
import { provisionImportedMember } from "@/lib/member-import.server";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
export const Route = createFileRoute("/api/public/admin-member/import")({
  server: { handlers: {
    OPTIONS: async () => new Response(null, { status: 204, headers }),
    POST: async ({ request }) => {
      const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
      if (!token) return Response.json({ error: "غير مصرح" }, { status: 401, headers });
      try {
        if (Number(request.headers.get("content-length") ?? 0) > 16_384) return Response.json({ error: "الطلب كبير جداً" }, { status: 413, headers });
        return Response.json(await provisionImportedMember(await request.json(), token), { headers });
      } catch (error) {
        return Response.json({ error: error instanceof Error ? error.message : "تعذّر إنشاء العضوية" }, { status: 400, headers });
      }
    },
  } },
});