import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const slugSchema = z.object({ slug: z.string().min(1).max(64) });

export const getCompanyBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => slugSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("id, slug, name, tagline, logo_url, primary_color, secondary_color, is_active, form_fields")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!company || !company.is_active) return null;
    const { data: branches } = await supabaseAdmin
      .from("branches")
      .select("id, name")
      .eq("company_id", company.id)
      .order("name");
    return { company, branches: branches ?? [] };
  });

const ticketSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(3).max(160),
  description: z.string().min(3).max(4000),
  branch: z.string().max(120).default(""),
  priority: z.enum(["urgent", "medium", "normal"]),
  requester_name: z.string().min(2).max(120),
  requester_phone: z.string().max(30).optional(),
  requester_email: z.string().max(160).optional(),
});

export const submitTicket = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ticketSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("id, is_active")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!company || !company.is_active) throw new Error("الشركة غير موجودة أو الاشتراك غير مفعل");

    const ticketNo = `TCK-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
    const { data: ticket, error } = await supabaseAdmin
      .from("tickets")
      .insert({
        company_id: company.id,
        ticket_no: ticketNo,
        title: data.title,
        description: data.description,
        branch: data.branch,
        priority: data.priority,
        requester_name: data.requester_name,
        requester_phone: data.requester_phone ?? null,
        requester_email: data.requester_email || null,
      })
      .select("id, ticket_no")
      .single();
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("ticket_updates").insert({
      ticket_id: ticket.id,
      author_name: "النظام",
      note: "تم استلام التذكرة وهي بانتظار المراجعة.",
      status: "open",
    });

    return { ticket_no: ticket.ticket_no };
  });

export const trackTicket = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ ticket_no: z.string().min(3).max(40) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ticket } = await supabaseAdmin
      .from("tickets")
      .select("id, ticket_no, title, status, priority, branch, created_at, updated_at, requester_name")
      .eq("ticket_no", data.ticket_no.trim().toUpperCase())
      .maybeSingle();
    if (!ticket) return null;
    const { data: updates } = await supabaseAdmin
      .from("ticket_updates")
      .select("id, note, status, created_at, author_name")
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: true });
    return { ticket, updates: updates ?? [] };
  });
