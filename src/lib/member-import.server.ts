import { createClient } from "@supabase/supabase-js";
import { assertMemberCapacity, importMemberSchema } from "./member-import";

export async function provisionImportedMember(input: unknown, token: string) {
  const data = importMemberSchema.parse(input);
  if (!token) throw new Error("انتهت الجلسة، سجّل الدخول مجدداً");
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
  if (!url || !key) throw new Error("خدمة الحسابات غير متصلة");
  const caller = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: user, error: authError } = await caller.auth.getUser(token);
  if (authError || !user.user) throw new Error("الجلسة غير صالحة");
  const { data: roles, error: roleError } = await caller.from("user_roles").select("role, company_id").eq("user_id", user.user.id);
  if (roleError) throw new Error(roleError.message);
  if (!(roles ?? []).some((role) => role.role === "super_admin" || (role.role === "company_admin" && role.company_id === data.company_id))) {
    throw new Error("لا تملك صلاحية إضافة عضويات لهذه الشركة");
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: company, error: companyError }, { count, error: countError }] = await Promise.all([
    supabaseAdmin.from("companies").select("max_members").eq("id", data.company_id).single(),
    supabaseAdmin.from("user_roles").select("id", { count: "exact", head: true }).eq("company_id", data.company_id),
  ]);
  if (companyError || countError || !company || count === null) throw new Error("تعذّر التحقق من حد العضويات");
  assertMemberCapacity(count, company.max_members, 1);
  const m = data.member;
  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: m.email, password: m.password, email_confirm: true, user_metadata: { full_name: m.full_name },
  });
  if (createError || !created.user) throw new Error(createError?.message ?? "تعذّر إنشاء الحساب");
  const { error } = await caller.rpc("admin_provision_member", {
    _user_id: created.user.id, _company_id: data.company_id, _full_name: m.full_name,
    _email: m.email, _role: data.role, _employee_no: m.employee_no, _extension: m.extension,
    _specialty: m.specialty, _department: m.department, _phone: m.phone,
  });
  if (error) {
    const { error: cleanupError } = await supabaseAdmin.auth.admin.deleteUser(created.user.id);
    if (cleanupError) throw new Error("تعذّرت إضافة العضوية وإلغاء الحساب؛ تواصل مع أدمن المنصة قبل إعادة المحاولة");
    throw new Error(error.message);
  }
  return { ok: true };
}