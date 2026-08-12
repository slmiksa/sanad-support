import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const slugSchema = z.object({ slug: z.string().min(1).max(64) });

export const getCompanyBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => slugSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: company } = await supabaseAdmin
      .from("companies")
      .select(
        "id, slug, name, tagline, logo_url, primary_color, secondary_color, is_active, form_fields, field_config",
      )
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
