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

    return {
      slug: company.slug,
      admin_email: data.admin_email,
      admin_name: data.admin_name,
      admin_password: data.admin_password,
    };
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
        employee_no: z.string().max(40).optional().default(""),
        extension: z.string().max(20).optional().default(""),
        specialty: z.string().max(120).optional().default(""),
        department: z.string().max(120).optional().default(""),
        phone: z.string().max(30).optional().default(""),
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
      employee_no: data.employee_no || null,
      extension: data.extension || null,
      specialty: data.specialty || null,
      department: data.department || null,
      phone: data.phone || null,
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

export const getCompanyAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ company_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isSuper } = await context.supabase.rpc("is_super_admin", {
      _user_id: context.userId,
    });
    if (!isSuper) throw new Error("غير مصرح: هذه العملية للأدمن الأعلى فقط");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: company, error } = await supabaseAdmin
      .from("companies")
      .select("id, name, slug, tagline, plan, is_active, created_at")
      .eq("id", data.company_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!company) throw new Error("الشركة غير موجودة");

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .eq("company_id", company.id);
    const ids = (roles ?? []).map((r) => r.user_id);
    const { data: profiles } = ids.length
      ? await supabaseAdmin
          .from("profiles")
          .select("id, full_name, email, employee_no, extension, specialty, department, phone")
          .in("id", ids)
      : { data: [] as never[] };

    const members = (roles ?? []).map((r) => {
      const p = (profiles ?? []).find((x) => x.id === r.user_id);
      return {
        user_id: r.user_id,
        role: r.role as string,
        full_name: p?.full_name ?? "",
        email: p?.email ?? "",
        employee_no: p?.employee_no ?? "",
        extension: p?.extension ?? "",
        specialty: p?.specialty ?? "",
        department: p?.department ?? "",
        phone: p?.phone ?? "",
      };
    });

    return { company, members };
  });

export const resetMemberPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ user_id: z.string().uuid(), password: z.string().min(8).max(72) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isSuper } = await context.supabase.rpc("is_super_admin", {
      _user_id: context.userId,
    });
    if (!isSuper) throw new Error("غير مصرح: هذه العملية للأدمن الأعلى فقط");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true, password: data.password };
  });

export const listPlatformAgents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isSuper } = await context.supabase.rpc("is_super_admin", {
      _user_id: context.userId,
    });
    if (!isSuper) throw new Error("غير مصرح: هذه العملية للأدمن الأعلى فقط");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles, error } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, created_at")
      .eq("role", "platform_agent")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const ids = (roles ?? []).map((r) => r.user_id);
    const { data: profiles } = ids.length
      ? await supabaseAdmin.from("profiles").select("id, full_name, email, phone").in("id", ids)
      : { data: [] as never[] };

    return (roles ?? []).map((r) => {
      const p = (profiles ?? []).find((x) => x.id === r.user_id);
      return {
        user_id: r.user_id,
        created_at: r.created_at,
        full_name: p?.full_name ?? "",
        email: p?.email ?? "",
        phone: p?.phone ?? "",
      };
    });
  });

export const createPlatformAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        full_name: z.string().min(2).max(120),
        email: z.string().email().max(160),
        password: z.string().min(8).max(72),
        phone: z.string().max(30).optional().default(""),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isSuper } = await context.supabase.rpc("is_super_admin", {
      _user_id: context.userId,
    });
    if (!isSuper) throw new Error("غير مصرح: هذه العملية للأدمن الأعلى فقط");

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
      company_id: null,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || null,
    });
    await supabaseAdmin.from("user_roles").delete().eq("user_id", created.user.id);
    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, company_id: null, role: "platform_agent" });

    return { ok: true, email: data.email, password: data.password };
  });

export const removePlatformAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ user_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isSuper } = await context.supabase.rpc("is_super_admin", {
      _user_id: context.userId,
    });
    if (!isSuper) throw new Error("غير مصرح: هذه العملية للأدمن الأعلى فقط");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
