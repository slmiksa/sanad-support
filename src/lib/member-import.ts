import { z } from "zod";

export const MEMBER_COLUMNS = [
  ["full_name", "الاسم"], ["email", "البريد"], ["password", "كلمة المرور"],
  ["employee_no", "الرقم الوظيفي"], ["extension", "التحويلة"],
  ["specialty", "التخصص"], ["department", "القسم"], ["phone", "رقم الجوال"],
] as const;
const required = (label: string) => z.string().trim().min(1, `${label} مطلوب`).max(100, `${label} طويل جداً`);
export const importRowSchema = z.object({
  full_name: required("الاسم"),
  email: z.string().trim().toLowerCase().email("البريد غير صالح").max(255),
  password: z.string().min(8, "كلمة المرور يجب ألا تقل عن 8 أحرف").max(128),
  employee_no: required("الرقم الوظيفي"), extension: required("التحويلة"),
  specialty: required("التخصص"), department: required("القسم"),
  phone: z.string().trim().min(1, "رقم الجوال مطلوب").max(30).regex(/^\+?[\d\s()-]+$/, "رقم الجوال غير صالح"),
});
export type ImportMember = z.infer<typeof importRowSchema>;
export const memberRoleSchema = z.enum(["employee", "agent", "company_admin"]);
export type MemberRole = z.infer<typeof memberRoleSchema>;
export const importMemberSchema = z.object({ company_id: z.string().uuid(), role: memberRoleSchema, member: importRowSchema });

export function validateMemberSheet(matrix: unknown[][]) {
  const headers = (matrix[0] ?? []).map((value) => String(value ?? "").trim());
  const missing = MEMBER_COLUMNS.filter(([, label]) => !headers.includes(label));
  if (missing.length) throw new Error(`الأعمدة الناقصة: ${missing.map(([, label]) => label).join("، ")}`);
  const errors: { row: number; message: string }[] = [];
  const rows: { row: number; member: ImportMember }[] = [];
  const emails = new Set<string>();
  matrix.slice(1).forEach((cells, index) => {
    if (cells.every((cell) => !String(cell ?? "").trim())) return;
    const row = index + 2;
    const value = Object.fromEntries(MEMBER_COLUMNS.map(([key, label]) => [key, String(cells[headers.indexOf(label)] ?? "")]));
    const result = importRowSchema.safeParse(value);
    if (!result.success) { errors.push({ row, message: result.error.issues.map((issue) => issue.message).join("، ") }); return; }
    if (emails.has(result.data.email)) { errors.push({ row, message: "البريد مكرر داخل الملف" }); return; }
    emails.add(result.data.email);
    rows.push({ row, member: result.data });
  });
  if (!rows.length && !errors.length) throw new Error("الملف لا يحتوي على عضويات");
  return { rows, errors };
}

export function assertMemberCapacity(current: number, limit: number, incoming: number) {
  if (current + incoming > limit) throw new Error(`لا يمكن الإضافة: المتاح ${Math.max(0, limit - current)} عضوية، والملف يحتوي ${incoming}.`);
}