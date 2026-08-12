import { supabase } from "@/integrations/supabase/client";

export type PublicCompany = {
  company: {
    id: string;
    slug: string;
    name: string;
    tagline: string;
    logo_url: string | null;
    primary_color: string;
    secondary_color: string;
    is_active: boolean;
    form_fields: unknown;
    field_config: unknown;
    managed_support?: boolean;
  };
  branches: Array<{ id: string; name: string }>;
} | null;

export type TrackedTicket = {
  ticket: {
    id: string;
    ticket_no: string;
    title: string;
    status: string;
    priority: string;
    branch: string;
    created_at: string;
    updated_at: string;
    requester_name: string;
  };
  updates: Array<{
    id: string;
    note: string;
    status: string | null;
    created_at: string;
    author_name: string;
  }>;
} | null;

type RpcFn = (
  name: string,
  params?: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message: string } | null }>;

export async function getCompanyBySlug({ data }: { data: { slug: string } }) {
  const { data: result, error } = await (supabase.rpc as unknown as RpcFn)("get_public_company", {
    _slug: data.slug,
  });
  if (error) throw new Error(error.message);
  return (result ?? null) as PublicCompany;
}

export async function trackTicket({ data }: { data: { ticket_no: string } }) {
  const { data: result, error } = await (supabase.rpc as unknown as RpcFn)("track_ticket_public", {
    _ticket_no: data.ticket_no.trim().toUpperCase(),
  });
  if (error) throw new Error(error.message);
  return (result ?? null) as TrackedTicket;
}
