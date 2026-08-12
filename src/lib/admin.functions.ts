import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const createCompanySchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(48)
    .regex(/^[a-z0-9-]+$/, "المسار يجب أن يكون أحرفاً إنجليزية صغيرة وأرقاماً وشرطات فقط"),
  tagline: z.string().max(160).default(""),
  plan: z.string().max(40).default("trial"),
  primary_color: z.string().max(20).default("#2563eb"),
  secondary_color: z.string().max(20).default("#0f766e"),
  branches: z.array(z.string().min(1).max(120)).default([]),
  admin_name: z.string().min(2).max(120),
  admin_email: z.string().email().max(160),
  admin_password: z.string().min(8).max(72),
});

export const createCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createCompanySchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: isSuper } = await context.supabase.rpc("is_super_admin", {
      _user_id: context.userId,
    });
    if (!isSuper) throw new Error("غير مصرح: هذه العملية للأدمن الأعلى فقط");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .insert({
        name: data.name,
        slug: data.slug,
        tagline: data.tagline,
        plan: data.plan,
        primary_color: data.primary_color,
        secondary_color: data.secondary_color,
      })
      .select("id, slug")
      .single();
    if (companyError) throw new Error(companyError.message);

    if (data.branches.length) {
      await supabaseAdmin
        .from("branches")
        .insert(data.branches.map((name) => ({ company_id: company.id, name })));
    }

    const { data: created, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: data.admin_email,
      password: data.admin_password,
      email_confirm: true,
      user_metadata: { full_name: data.admin_name },
    });
    if (userError || !created?.user) {
      await supabaseAdmin.from("companies").delete().eq("id", company.id);
      throw new Error(userError?.message ?? "تعذّر إنشاء حساب أدمن الشركة");
    }

    const userId = created.user.id;
    await supabaseAdmin.from("profiles").upsert({
      id: userId,
      company_id: company.id,
      full_name: data.admin_name,
      email: data.admin_email,
    });
    await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", "super_admin");
    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, company_id: company.id, role: "company_admin" });

    return { slug: company.slug };
  });

export const createCompanyMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        company_id: z.string().uuid(),
        full_name: z.string().min(2).max(120),
        email: z.string().email().max(160),
        password: z.string().min(8).max(72),
        role: z.enum(["company_admin", "agent", "employee"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isSuper } = await context.supabase.rpc("is_super_admin", {
      _user_id: context.userId,
    });
    const { data: isCompanyAdmin } = await context.supabase.rpc("is_company_admin", {
      _user_id: context.userId,
      _company_id: data.company_id,
    });
    if (!isSuper && !isCompanyAdmin) throw new Error("غير مصرح لك بإضافة مستخدمين");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (error || !created?.user) throw new Error(error?.message ?? "تعذّر إنشاء الحساب");

    await supabaseAdmin.from("profiles").upsert({
      id: created.user.id,
      company_id: data.company_id,
      full_name: data.full_name,
      email: data.email,
    });
    await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", created.user.id)
      .eq("role", "super_admin");
    await supabaseAdmin.from("user_roles").insert({
      user_id: created.user.id,
      company_id: data.company_id,
      role: data.role,
    });
    return { ok: true };
  });
