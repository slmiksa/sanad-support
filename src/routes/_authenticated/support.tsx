import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Headset, Loader2, LogOut, Send, Building2, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PRIORITY_META, STATUS_META, type Priority, type Status } from "@/lib/tickets";
import { parseAttachments } from "@/lib/attachments";
import { AttachmentList } from "@/components/AttachmentList";
import { useAccess } from "@/lib/use-access";

export const Route = createFileRoute("/_authenticated/support")({
  head: () => ({
    meta: [
      { title: "مركز دعم المنصة | متابعة تذاكر الشركات المُدارة" },
      {
        name: "description",
        content:
          "واجهة فريق دعم المنصة لمتابعة تذاكر الشركات التي نتولى دعمها الفني، والرد عليها وتغيير حالتها.",
      },
      { property: "og:title", content: "مركز دعم المنصة" },
      { property: "og:description", content: "متابعة والرد على تذاكر الشركات المُدارة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlatformSupportPage,
});

function displayAuthor(name?: string | null) {
  const n = (name ?? "").trim();
  if (!n || n.includes("@")) return "فريق الدعم";
  return n;
}

function PlatformSupportPage() {
  const access = useAccess();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);

  const allowed = access.isPlatformAgent || access.isSuperAdmin;

  const companies = useQuery({
    queryKey: ["managed-companies"],
    enabled: allowed,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, slug")
        .eq("managed_support", true)
        .order("name");
      if (error) throw error;
      const ids = (data ?? []).map((c) => c.id);
      if (!ids.length) return [];
      const { data: rows } = await supabase
        .from("tickets")
        .select("company_id, status")
        .in("company_id", ids);
      return (data ?? []).map((c) => {
        const mine = (rows ?? []).filter((t) => t.company_id === c.id);
        return {
          ...c,
          total: mine.length,
          open: mine.filter((t) => t.status === "open").length,
          progress: mine.filter((t) => t.status === "progress").length,
        };
      });
    },
  });

  const tickets = useQuery({
    queryKey: ["managed-tickets", companyId],
    enabled: allowed && !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("id, ticket_no, title, status, priority, branch, requester_name, created_at")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  };

  if (!access.loading && !allowed) {
    return (
      <div className="grid min-h-screen place-items-center px-4 text-center">
        <div>
          <p className="text-lg font-black">هذه الصفحة مخصصة لفريق دعم المنصة</p>
          <Link to="/portal" className="mt-3 inline-block text-sm font-bold text-primary">
            العودة إلى حسابك
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Headset className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-base font-black">مركز دعم المنصة</h1>
              <p className="text-xs text-muted-foreground">
                {access.fullName ? `مرحباً ${access.fullName} — ` : ""}تذاكر الشركات المُدارة
              </p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-bold"
          >
            <LogOut className="h-4 w-4" /> خروج
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <section>
          <h2 className="mb-3 text-sm font-black">الشركات التي نتولى دعمها</h2>
          {companies.isLoading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(companies.data ?? []).map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setCompanyId(c.id === companyId ? null : c.id);
                  setTicketId(null);
                }}
                className={`rounded-2xl border p-4 text-right transition ${
                  companyId === c.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-sm font-black">
                    <Building2 className="h-4 w-4 text-primary" /> {c.name}
                  </span>
                  {c.open > 0 && (
                    <span className="rounded-lg bg-destructive px-2 py-0.5 text-[11px] font-black text-destructive-foreground">
                      {c.open} جديدة
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  إجمالي {c.total} تذكرة — قيد المتابعة {c.progress}
                </p>
              </button>
            ))}
            {companies.data?.length === 0 && (
              <p className="text-sm text-muted-foreground">
                لا توجد شركات مُفعّل لها الدعم المُدار من المنصة بعد.
              </p>
            )}
          </div>
        </section>

        {companyId && (
          <section className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-right text-sm">
              <thead className="bg-muted/60 text-xs text-muted-foreground">
                <tr>
                  <th className="p-3">رقم التذكرة</th>
                  <th className="p-3">العنوان</th>
                  <th className="p-3">مقدّم الطلب</th>
                  <th className="p-3">الأولوية</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {(tickets.data ?? []).map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setTicketId(t.id === ticketId ? null : t.id)}
                    className={`cursor-pointer border-t border-border hover:bg-muted/40 ${
                      ticketId === t.id ? "bg-primary/5" : ""
                    }`}
                  >
                    <td className="p-3 font-mono text-xs" dir="ltr">
                      {t.ticket_no}
                    </td>
                    <td className="p-3 font-bold">{t.title}</td>
                    <td className="p-3 text-xs">{t.requester_name || "—"}</td>
                    <td className="p-3">
                      <span
                        className={`rounded-lg border px-2 py-1 text-xs font-bold ${
                          PRIORITY_META[t.priority as Priority].className
                        }`}
                      >
                        {PRIORITY_META[t.priority as Priority].label}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded-lg border px-2 py-1 text-xs font-bold ${
                          STATUS_META[t.status as Status].className
                        }`}
                      >
                        {STATUS_META[t.status as Status].label}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {new Date(t.created_at).toLocaleString("ar")}
                    </td>
                  </tr>
                ))}
                {tickets.data?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      <Inbox className="mx-auto mb-2 h-6 w-6" /> لا توجد تذاكر لهذه الشركة.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}

        {ticketId && <TicketPanel ticketId={ticketId} companyId={companyId!} />}
      </main>
    </div>
  );
}

function TicketPanel({ ticketId, companyId }: { ticketId: string; companyId: string }) {
  const access = useAccess();
  const qc = useQueryClient();
  const [note, setNote] = useState("");

  const ticket = useQuery({
    queryKey: ["support-ticket", ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("id", ticketId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const requester = useQuery({
    queryKey: ["support-requester", ticket.data?.created_by],
    enabled: !!ticket.data?.created_by,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email, phone, employee_no, extension, specialty, department")
        .eq("id", ticket.data!.created_by!)
        .maybeSingle();
      return data;
    },
  });

  const updates = useQuery({
    queryKey: ["support-updates", ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticket_updates")
        .select("id, note, status, author_name, created_at")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["support-ticket", ticketId] });
    void qc.invalidateQueries({ queryKey: ["support-updates", ticketId] });
    void qc.invalidateQueries({ queryKey: ["managed-tickets", companyId] });
    void qc.invalidateQueries({ queryKey: ["managed-companies"] });
  };

  const changeStatus = useMutation({
    mutationFn: async (next: Status) => {
      const { error } = await supabase
        .from("tickets")
        .update({ status: next, closed_at: next === "closed" ? new Date().toISOString() : null })
        .eq("id", ticketId);
      if (error) throw error;
      await supabase.from("ticket_updates").insert({
        ticket_id: ticketId,
        author_id: access.user?.id ?? null,
        author_name: access.fullName || "فريق دعم المنصة",
        note: `تم تغيير الحالة إلى: ${STATUS_META[next].label}`,
        status: next,
      });
    },
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });

  const addNote = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("ticket_updates").insert({
        ticket_id: ticketId,
        author_id: access.user?.id ?? null,
        author_name: access.fullName || "فريق دعم المنصة",
        note: note.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNote("");
      toast.success("تم إرسال الرد");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (ticket.isLoading || !ticket.data) {
    return (
      <div className="grid place-items-center rounded-2xl border border-border bg-card p-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  const t = ticket.data;
  const custom = (t.custom_data ?? {}) as Record<string, string>;
  const r = requester.data;

  return (
    <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-6">
        <div className="space-y-3 rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black">{t.title}</h3>
              <p className="font-mono text-xs text-muted-foreground" dir="ltr">
                {t.ticket_no}
              </p>
            </div>
            <select
              className="field w-auto"
              value={t.status}
              onChange={(e) => changeStatus.mutate(e.target.value as Status)}
            >
              {(Object.keys(STATUS_META) as Status[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </select>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
            {t.description || "—"}
          </p>
          <dl className="grid grid-cols-2 gap-3 pt-2 text-xs sm:grid-cols-3">
            {[
              ["الفرع", t.branch],
              ["الأولوية", PRIORITY_META[t.priority as Priority].label],
              ["تاريخ الرفع", new Date(t.created_at).toLocaleString("ar")],
              ...Object.entries(custom),
            ].map(([label, value]) => (
              <div key={label as string}>
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-bold">{(value as string) || "—"}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-card p-6">
          <h3 className="text-sm font-black">المرفقات</h3>
          <AttachmentList items={parseAttachments(t.attachments)} />
        </div>

        <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <h3 className="text-sm font-black">الردود والتحديثات</h3>
          <ol className="space-y-3">
            {(updates.data ?? []).map((u) => (
              <li key={u.id} className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{displayAuthor(u.author_name)}</span>
                  <span>{new Date(u.created_at).toLocaleString("ar")}</span>
                </div>
                <p className="mt-1 text-sm font-bold">{u.note}</p>
              </li>
            ))}
            {(updates.data ?? []).length === 0 && (
              <li className="text-xs text-muted-foreground">لا توجد ردود بعد.</li>
            )}
          </ol>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (note.trim()) addNote.mutate();
            }}
            className="flex gap-2"
          >
            <input
              className="field"
              placeholder="اكتب رداً على الموظف"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button
              disabled={addNote.isPending}
              aria-label="إرسال الرد"
              className="grid h-11 w-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-60"
            >
              {addNote.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
      </div>

      <aside className="space-y-4 self-start rounded-2xl border border-border bg-card p-6">
        <h3 className="text-sm font-black">بيانات مقدّم الطلب</h3>
        <dl className="grid gap-3 text-xs">
          {[
            ["الاسم", r?.full_name || t.requester_name],
            ["الرقم الوظيفي", r?.employee_no],
            ["التحويلة", r?.extension],
            ["التخصص", r?.specialty],
            ["القسم", r?.department],
            ["البريد", r?.email || t.requester_email],
            ["الجوال", r?.phone || t.requester_phone],
          ].map(([label, value]) => (
            <div
              key={label as string}
              className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2"
            >
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-bold">{(value as string) || "—"}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </section>
  );
}
