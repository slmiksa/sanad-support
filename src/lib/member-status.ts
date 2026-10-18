import { z } from "zod";

export const memberStatusSchema = z.object({ user_id: z.string().uuid(), is_active: z.boolean() });
export function assertStatusPermission(callerId: string, targetId: string, companyId: string | null, roles: { role: string; company_id: string | null }[], targetRoles: { role: string }[]) {
  if (callerId === targetId) throw new Error("لا يمكنك تعطيل عضويتك الحالية");
  if (targetRoles.some(r => r.role === "super_admin" || r.role === "platform_agent")) throw new Error("هذه العملية خاصة بعضويات الشركات");
  if (!companyId || !roles.some(r => r.role === "super_admin" || (r.role === "company_admin" && r.company_id === companyId))) throw new Error("لا تملك صلاحية تعديل هذه العضوية");
}
export function membershipAuthUpdate(isActive: boolean) {
  return { ban_duration: isActive ? "none" : "876000h" };
}