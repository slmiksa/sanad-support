import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * كل العمليات الإدارية تتم مباشرة من المتصفح عبر Supabase
 * (RPC + Auth) حتى يعمل النظام كموقع ثابت بدون خادم Node.
 */

type AnyRecord = Record<string, unknown>;

// عميل ثانوي لإنشاء الحسابات دون التأثير على جلسة الأدمن الحالية
function signupClient() {
  const url = import.meta.env["VITE_SUPABASE_URL"] as string;
  const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

async function rpc<T>(fn: string, args?: AnyRecord): Promise<T> {
  const { data, error } = await (
    supabase.rpc as unknown as (
      name: string,
      params?: AnyRecord,
    ) => Promise<{ data: unknown; error: { message: string } | null }>
  )(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

async function createAuthUser(email: string, password: string, full_name: string) {
  const { data, error } = await signupClient().auth.signUp({
    email,
    password,
    options: { data: { full_name } },
  });
  if (error) throw new Error(error.message);
  const userId = data.user?.id;
  if (!userId) throw new Error("تعذّر إنشاء الحساب");
  return userId;
}

export type CreateCompanyInput = {
  name: string;
  slug: string;
  tagline?: string;
  plan?: string;
  primary_color?: string;
  secondary_color?: string;
  branches?: string[];
  admin_name: string;
  admin_email: string;
  admin_password: string;
};

export async function createCompany({ data }: { data: CreateCompanyInput }) {
  if (!/^[a-z0-9-]+$/.test(data.slug)) {
    throw new Error("المسار يجب أن يكون أحرفاً إنجليزية صغيرة وأرقاماً وشرطات فقط");
  }

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({
      name: data.name,
      slug: data.slug,
      tagline: data.tagline ?? "",
      plan: data.plan ?? "trial",
      primary_color: data.primary_color ?? "#2563eb",
      secondary_color: data.secondary_color ?? "#0f766e",
    })
    .select("id, slug")
    .single();
  if (companyError) throw new Error(companyError.message);

  const branches = data.branches ?? [];
  if (branches.length) {
    await supabase
      .from("branches")
      .insert(branches.map((name) => ({ company_id: company.id, name })));
  }

  let userId: string;
  try {
    userId = await createAuthUser(data.admin_email, data.admin_password, data.admin_name);
  } catch (e) {
    await supabase.from("companies").delete().eq("id", company.id);
    throw e;
  }

  await rpc("admin_provision_member", {
    _user_id: userId,
    _company_id: company.id,
    _full_name: data.admin_name,
    _email: data.admin_email,
    _role: "company_admin",
  });

  return {
    slug: company.slug,
    admin_email: data.admin_email,
    admin_name: data.admin_name,
    admin_password: data.admin_password,
  };
}

export type CreateMemberInput = {
  company_id: string;
  full_name: string;
  email: string;
  password: string;
  employee_no?: string;
  extension?: string;
  specialty?: string;
  department?: string;
  phone?: string;
  role: "company_admin" | "agent" | "employee";
};

export async function createCompanyMember({ data }: { data: CreateMemberInput }) {
  const userId = await createAuthUser(data.email, data.password, data.full_name);
  await rpc("admin_provision_member", {
    _user_id: userId,
    _company_id: data.company_id,
    _full_name: data.full_name,
    _email: data.email,
    _role: data.role,
    _employee_no: data.employee_no ?? "",
    _extension: data.extension ?? "",
    _specialty: data.specialty ?? "",
    _department: data.department ?? "",
    _phone: data.phone ?? "",
  });
  return { ok: true };
}

export type CompanyAccess = {
  company: {
    id: string;
    name: string;
    slug: string;
    tagline: string;
    plan: string;
    is_active: boolean;
    created_at: string;
  };
  members: Array<{
    user_id: string;
    role: string;
    full_name: string;
    email: string;
    employee_no: string;
    extension: string;
    specialty: string;
    department: string;
    phone: string;
  }>;
};

export async function getCompanyAccess({ data }: { data: { company_id: string } }) {
  return rpc<CompanyAccess>("admin_get_company_access", { _company_id: data.company_id });
}

/**
 * إرسال رابط إعادة تعيين كلمة المرور للعضو (لا يحتاج خادم).
 */
export async function resetMemberPassword({ data }: { data: { email: string } }) {
  const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
    redirectTo: `${window.location.origin}/auth`,
  });
  if (error) throw new Error(error.message);
  return { ok: true, email: data.email };
}

export type PlatformAgent = {
  user_id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string;
};

export async function listPlatformAgents() {
  return rpc<PlatformAgent[]>("admin_list_platform_agents");
}

export async function createPlatformAgent({
  data,
}: {
  data: { full_name: string; email: string; password: string; phone?: string };
}) {
  const userId = await createAuthUser(data.email, data.password, data.full_name);
  await rpc("admin_provision_member", {
    _user_id: userId,
    _company_id: null,
    _full_name: data.full_name,
    _email: data.email,
    _role: "platform_agent",
    _phone: data.phone ?? "",
  });
  return { ok: true, email: data.email, password: data.password };
}

export async function removePlatformAgent({ data }: { data: { user_id: string } }) {
  await rpc("admin_remove_platform_agent", { _user_id: data.user_id });
  return { ok: true };
}
