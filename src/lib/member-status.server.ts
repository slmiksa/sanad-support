import { createClient } from "@supabase/supabase-js";
import { assertStatusPermission, membershipAuthUpdate, memberStatusSchema } from "./member-status";

export async function changeMemberStatus(input: unknown, token: string) {
  const data = memberStatusSchema.parse(input);
  if (!token) throw new Error("غير مصرح");
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
  if (!url || !key) throw new Error("خدمة الحسابات غير متصلة");
  const caller = createClient(url, key, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: auth, error } = await caller.auth.getUser(token);
  if (error || !auth.user) throw new Error("الجلسة غير صالحة");
  const { data: roles, error: roleError } = await caller.from("user_roles").select("role, company_id").eq("user_id", auth.user.id);
  if (roleError) throw new Error("تعذّر التحقق من الصلاحيات");
  const { data: target, error: targetError } = await caller.from("profiles").select("company_id, is_active").eq("id", data.user_id).single();
  if (targetError || !target) throw new Error("العضوية غير موجودة أو غير متاحة");
  const { data: targetRoles, error: targetRoleError } = await caller.from("user_roles").select("role").eq("user_id", data.user_id);
  if (targetRoleError) throw new Error("تعذّر التحقق من العضوية");
  assertStatusPermission(auth.user.id, data.user_id, target.company_id, roles ?? [], targetRoles ?? []);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error: statusError } = await supabaseAdmin.from("profiles").update({ is_active: data.is_active }).eq("id", data.user_id);
  if (statusError) throw new Error("تعذّر تحديث حالة العضوية");
  const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, membershipAuthUpdate(data.is_active));
  if (banError) {
    const { error: rollbackError } = await supabaseAdmin.from("profiles").update({ is_active: target.is_active }).eq("id", data.user_id);
    if (rollbackError) throw new Error("تعذّر إكمال تحديث العضوية؛ تواصل مع أدمن المنصة");
    throw new Error("تعذّر تحديث صلاحية الدخول، لم يتم تغيير الحالة");
  }
  return { ok: true, is_active: data.is_active };
}