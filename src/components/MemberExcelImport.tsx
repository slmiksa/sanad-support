import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download, Upload, Users, Loader2, X } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { apiBase, apiUrl } from "@/lib/api-base";
import { importCompanyMember } from "@/lib/member-import.functions";
import { MEMBER_COLUMNS, assertMemberCapacity, validateMemberSheet, type MemberRole } from "@/lib/member-import";

type Sheet = ReturnType<typeof validateMemberSheet>;
export function MemberExcelImport({ companyId, onComplete }: { companyId: string; onComplete: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [role, setRole] = useState<MemberRole>("employee");
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [filename, setFilename] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<{ row: number; ok: boolean; message: string }[]>([]);
  const importMember = useServerFn(importCompanyMember);

  function downloadTemplate() {
    const workbook = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([MEMBER_COLUMNS.map(([, label]) => label)]);
    ws["!cols"] = MEMBER_COLUMNS.map(() => ({ wch: 24 }));
    // Keep identifiers and phone numbers as text, including their leading zeroes.
    for (let r = 1; r <= 1000; r++) for (let c = 0; c < MEMBER_COLUMNS.length; c++) {
      ws[XLSX.utils.encode_cell({ r, c })] = { t: "s", v: "", z: "@" };
    }
    ws["!ref"] = "A1:H1001";
    workbook.Workbook = { Views: [{ RTL: true }] };
    XLSX.utils.book_append_sheet(workbook, ws, "العضويات");
    XLSX.writeFile(workbook, "قالب-عضويات-سند.xlsx");
  }

  async function readFile(file: File) {
    setError(""); setResults([]); setSheet(null); setFilename(file.name);
    try {
      if (!/\.xlsx$/i.test(file.name)) throw new Error("اختر ملف إكسل بصيغة .xlsx");
      if (file.size > 5 * 1024 * 1024) throw new Error("حجم الملف يجب ألا يتجاوز 5 ميجابايت");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const first = workbook.SheetNames[0];
      if (!first || !workbook.Sheets[first]) throw new Error("الملف لا يحتوي على ورقة");
      const ws = workbook.Sheets[first];
      const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
      if (range.e.r > 10000 || range.e.c > 50) throw new Error("الملف كبير جداً؛ قسّمه إلى ملفات أصغر");
      for (const [cell, value] of Object.entries(ws)) if (!cell.startsWith("!") && value && typeof value === "object" && "f" in value) throw new Error("استخدم قيماً مباشرة بدون معادلات");
      setSheet(validateMemberSheet(XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "", raw: false })));
    } catch (e) { setError(e instanceof Error ? e.message : "تعذّر قراءة الملف"); }
  }

  async function startImport() {
    if (!sheet || sheet.errors.length || busy) return;
    setBusy(true); setError(""); setResults([]);
    const pending = [...sheet.rows];
    const outcomes: typeof results = [];
    try {
      const [{ data: company, error: companyError }, { count, error: countError }] = await Promise.all([
        supabase.from("companies").select("max_members").eq("id", companyId).single(),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("company_id", companyId),
      ]);
      if (companyError || countError || !company || count === null) throw new Error("تعذّر التحقق من العضويات المتاحة");
      assertMemberCapacity(count, company.max_members, pending.length);
      setProgress({ done: 0, total: pending.length });
      for (const item of pending) {
        try {
          const data = { company_id: companyId, role, member: item.member };
          if (apiBase()) {
            const { data: session } = await supabase.auth.getSession();
            const token = session.session?.access_token;
            if (!token) throw new Error("انتهت الجلسة، سجّل الدخول مجدداً");
            const response = await fetch(apiUrl("/api/public/admin-member/import"), {
              method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(data),
            });
            const body = await response.json();
            if (!response.ok) throw new Error(body.error ?? "تعذّر إنشاء العضوية");
          } else await importMember({ data });
          outcomes.push({ row: item.row, ok: true, message: "تمت الإضافة" });
        } catch (e) { outcomes.push({ row: item.row, ok: false, message: e instanceof Error ? e.message : "تعذّرت الإضافة" }); }
        item.member.password = "";
        setProgress({ done: outcomes.length, total: pending.length });
        setResults([...outcomes]);
      }
      setSheet(null); // Clear credentials and prevent accidentally submitting successful rows twice.
      onComplete();
    } catch (e) { setError(e instanceof Error ? e.message : "تعذّر الاستيراد"); }
    finally { setBusy(false); }
  }

  return <section className="space-y-4 border-y border-border py-5" aria-label="استيراد العضويات من إكسل">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-bold">استيراد العضويات من إكسل</h2>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={busy} onClick={downloadTemplate}><Download />تحميل القالب</Button>
        <Button type="button" variant="outline" disabled={busy} onClick={() => input.current?.click()}><Upload />رفع ملف إكسل</Button>
      </div>
    </div>
    <input ref={input} type="file" className="hidden" accept=".xlsx" aria-label="ملف عضويات إكسل" disabled={busy} onChange={(e) => { const file = e.target.files?.[0]; if (file) void readFile(file); e.target.value = ""; }} />
    <div className="flex flex-wrap items-end gap-3">
      <label className="min-w-0 space-y-2"><span className="block text-xs font-bold">نوع العضويات</span>
        <select className="field" aria-label="نوع العضويات المستوردة" value={role} disabled={busy} onChange={(e) => setRole(e.target.value as MemberRole)}>
          <option value="employee">موظف (يرفع تذاكر)</option><option value="agent">فني دعم</option><option value="company_admin">مشرف لوحة التحكم</option>
        </select>
      </label>
      {sheet && <><span className="py-2 text-sm break-all">{filename} — {sheet.rows.length} عضوية صالحة</span>
        <Button disabled={busy || sheet.errors.length > 0 || sheet.rows.length === 0} onClick={() => void startImport()}>{busy ? <Loader2 className="animate-spin" /> : <Users />}إضافة العضويات</Button>
        <Button variant="ghost" size="icon" aria-label="إزالة الملف" disabled={busy} onClick={() => { setSheet(null); setFilename(""); }}><X /></Button>
      </>}
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {!!sheet?.errors.length && <ul className="max-h-48 overflow-auto text-sm text-destructive">{sheet.errors.map((item) => <li key={item.row}>الصف {item.row}: {item.message}</li>)}</ul>}
    {busy && <div role="status" aria-live="polite" className="space-y-2"><progress className="w-full accent-primary" max={progress.total || 1} value={progress.done} /><p className="text-xs">تمت معالجة {progress.done} من {progress.total}</p></div>}
    {!busy && results.length > 0 && <p role="status" className="text-sm font-bold">تمت إضافة {results.filter((r) => r.ok).length} عضوية؛ تعذّرت إضافة {results.filter((r) => !r.ok).length}.</p>}
    {results.some((r) => !r.ok) && <ul className="max-h-48 overflow-auto text-sm text-destructive">{results.filter((r) => !r.ok).map((r) => <li key={r.row}>الصف {r.row}: {r.message}</li>)}</ul>}
  </section>;
}