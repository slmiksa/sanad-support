export type FormFields = {
  branch: boolean;
  phone: boolean;
  email: boolean;
  priority: boolean;
  attachments: boolean;
};

export const DEFAULT_FIELDS: FormFields = {
  branch: true,
  phone: true,
  email: true,
  priority: true,
  attachments: false,
};

export const FIELD_LABELS: Record<keyof FormFields, string> = {
  branch: "الفرع",
  phone: "رقم الجوال",
  email: "البريد الإلكتروني",
  priority: "درجة الأهمية",
  attachments: "المرفقات",
};

export function parseFields(value: unknown): FormFields {
  const v = (value ?? {}) as Partial<Record<keyof FormFields, unknown>>;
  return {
    branch: v.branch !== false,
    phone: v.phone !== false,
    email: v.email !== false,
    priority: v.priority !== false,
    attachments: v.attachments === true,
  };
}
