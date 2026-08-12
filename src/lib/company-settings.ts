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

/** ترتيب وتخصيص حقول نموذج التذكرة */
export type CustomFieldType = "text" | "textarea" | "number" | "select";

export type FieldItem = {
  key: string;
  label: string;
  enabled: boolean;
  /** حقل مضاف من الشركة (وليس من الحقول الأساسية) */
  custom: boolean;
  type: CustomFieldType;
  required: boolean;
  options: string[];
};

const BASE_KEYS = Object.keys(FIELD_LABELS) as (keyof FormFields)[];

/** يدمج الحقول الأساسية مع ترتيب/حقول الشركة المخزنة في field_config */
export function buildFieldConfig(formFields: unknown, fieldConfig: unknown): FieldItem[] {
  const fields = parseFields(formFields);
  const stored = Array.isArray(fieldConfig) ? (fieldConfig as Partial<FieldItem>[]) : [];

  const items: FieldItem[] = [];
  for (const raw of stored) {
    if (!raw?.key) continue;
    const custom = raw.custom === true || !BASE_KEYS.includes(raw.key as keyof FormFields);
    items.push({
      key: raw.key,
      label: raw.label || FIELD_LABELS[raw.key as keyof FormFields] || raw.key,
      enabled: custom ? raw.enabled !== false : fields[raw.key as keyof FormFields],
      custom,
      type: (raw.type as CustomFieldType) ?? "text",
      required: raw.required === true,
      options: Array.isArray(raw.options) ? raw.options.filter(Boolean) : [],
    });
  }

  for (const key of BASE_KEYS) {
    if (items.some((i) => i.key === key)) continue;
    items.push({
      key,
      label: FIELD_LABELS[key],
      enabled: fields[key],
      custom: false,
      type: "text",
      required: false,
      options: [],
    });
  }

  return items;
}

export function fieldsFromConfig(items: FieldItem[]): FormFields {
  const out = { ...DEFAULT_FIELDS };
  for (const item of items) {
    if (!item.custom && BASE_KEYS.includes(item.key as keyof FormFields)) {
      out[item.key as keyof FormFields] = item.enabled;
    }
  }
  return out;
}

export function customFields(items: FieldItem[]): FieldItem[] {
  return items.filter((i) => i.custom && i.enabled);
}

export function isEnabled(items: FieldItem[], key: keyof FormFields): boolean {
  return items.find((i) => i.key === key)?.enabled ?? DEFAULT_FIELDS[key];
}

export function newCustomKey(): string {
  return `custom_${Math.random().toString(36).slice(2, 9)}`;
}
