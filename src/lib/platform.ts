import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PlatformSettings = {
  id: string;
  contact_email: string;
  whatsapp: string;
};

export const DEVELOPER = {
  name: "شركة لمحة الآمنة",
  url: "https://lamhasec.com",
};

export async function fetchPlatformSettings(): Promise<PlatformSettings | null> {
  const { data } = await supabase
    .from("platform_settings")
    .select("id, contact_email, whatsapp")
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

export function usePlatformSettings() {
  return useQuery({ queryKey: ["platform-settings"], queryFn: fetchPlatformSettings });
}

export function whatsappLink(number: string) {
  return `https://wa.me/${number.replace(/[^0-9]/g, "")}`;
}
