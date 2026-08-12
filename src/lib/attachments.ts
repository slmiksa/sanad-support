import { supabase } from "@/integrations/supabase/client";

export const ATTACHMENTS_BUCKET = "ticket-attachments";

export type Attachment = {
  name: string;
  path: string;
  size: number;
  type: string;
};

export function parseAttachments(value: unknown): Attachment[] {
  if (!Array.isArray(value)) return [];
  return (value as Partial<Attachment>[])
    .filter((a) => a && typeof a.path === "string")
    .map((a) => ({
      name: a.name || "ملف",
      path: a.path as string,
      size: typeof a.size === "number" ? a.size : 0,
      type: a.type || "",
    }));
}

export async function uploadAttachments(
  companyId: string,
  files: File[],
): Promise<Attachment[]> {
  const out: Attachment[] = [];
  for (const file of files) {
    const safe = file.name.replace(/[^\w.\-\u0600-\u06FF]/g, "_");
    const path = `${companyId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
    const { error } = await supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) throw new Error(error.message);
    out.push({ name: file.name, path, size: file.size, type: file.type });
  }
  return out;
}

export async function attachmentUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

export function formatSize(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
