/** أعمدة الشركة المستخدمة في كل الشاشات — موحّدة لضمان تطابق الحقول بين اللوحة ونموذج الموظف */
export const COMPANY_SELECT =
  "id, name, slug, tagline, logo_url, primary_color, secondary_color, form_fields, field_config, managed_support";

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

/** الحقول الجوهرية للتذكرة (يمكن تغيير مسمّاها وترتيبها ولا يمكن حذف العنوان) */
export const CORE_LABELS: Record<string, string> = {
  title: "عنوان المشكلة",
  description: "وصف المشكلة",
};

const CORE_KEYS = Object.keys(CORE_LABELS);

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
  /** حقل جوهري في التذكرة (العنوان/الوصف) */
  core: boolean;
  type: CustomFieldType;
  required: boolean;
  options: string[];
};

const BASE_KEYS = Object.keys(FIELD_LABELS) as (keyof FormFields)[];

function coreItem(key: string, raw?: Partial<FieldItem>): FieldItem {
  return {
    key,
    label: raw?.label || CORE_LABELS[key] || key,
    enabled: key === "title" ? true : raw?.enabled !== false,
    custom: false,
    core: true,
    type: key === "description" ? "textarea" : "text",
    required: key === "title" ? true : raw?.required !== false,
    options: [],
  };
}

function baseItem(key: keyof FormFields, fields: FormFields, raw?: Partial<FieldItem>): FieldItem {
  return {
    key,
    label: raw?.label || FIELD_LABELS[key],
    enabled: raw?.enabled ?? fields[key],
    custom: false,
    core: false,
    type: raw?.type ?? "text",
    required: raw?.required === true,
    options: [],
  };
}

/** يدمج الحقول الأساسية مع ترتيب/حقول الشركة المخزنة في field_config */
export function buildFieldConfig(formFields: unknown, fieldConfig: unknown): FieldItem[] {
  const fields = parseFields(formFields);
  const stored = (Array.isArray(fieldConfig) ? (fieldConfig as Partial<FieldItem>[]) : []).filter(
    (raw) => !!raw?.key,
  );

  if (stored.length === 0) {
    return [
      ...CORE_KEYS.map((k) => coreItem(k)),
      ...BASE_KEYS.map((k) => baseItem(k, fields)),
    ];
  }

  const items: FieldItem[] = [];
  for (const raw of stored) {
    const key = raw.key as string;
    if (CORE_KEYS.includes(key)) {
      items.push(coreItem(key, raw));
      continue;
    }
    if (BASE_KEYS.includes(key as keyof FormFields) && raw.custom !== true) {
      items.push(baseItem(key as keyof FormFields, fields, raw));
      continue;
    }
    items.push({
      key,
      label: raw.label || key,
      enabled: raw.enabled !== false,
      custom: true,
      core: false,
      type: (raw.type as CustomFieldType) ?? "text",
      required: raw.required === true,
      options: Array.isArray(raw.options) ? raw.options.filter(Boolean) : [],
    });
  }

  // العنوان لا يمكن الاستغناء عنه
  if (!items.some((i) => i.key === "title")) items.unshift(coreItem("title"));

  return items;
}

export function fieldsFromConfig(items: FieldItem[]): FormFields {
  const out = { ...DEFAULT_FIELDS };
  for (const key of BASE_KEYS) out[key] = false;
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
  return items.find((i) => i.key === key)?.enabled ?? false;
}

export function fieldLabel(items: FieldItem[], key: string, fallback: string): string {
  return items.find((i) => i.key === key)?.label || fallback;
}

export function newCustomKey(): string {
  return `custom_${Math.random().toString(36).slice(2, 9)}`;
}
