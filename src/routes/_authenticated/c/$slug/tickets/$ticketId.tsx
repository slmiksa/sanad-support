import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PRIORITY_META, STATUS_META, type Priority, type Status } from "@/lib/tickets";
import { parseAttachments } from "@/lib/attachments";
import { AttachmentList } from "@/components/AttachmentList";
import { useAccess } from "@/lib/use-access";

export const Route = createFileRoute("/_authenticated/c/$slug/tickets/$ticketId")({
  head: () => ({
    meta: [
      { title: "تفاصيل التذكرة | لوحة تحكم الدعم الفني" },
      {
        name: "description",
        content: "عرض كامل لبيانات التذكرة ومقدّم الطلب والمرفقات وسجل التحديثات وتغيير الحالة.",
      },
      { property: "og:title", content: "تفاصيل تذكرة الدعم الفني" },
      { property: "og:description", content: "كل بيانات التذكرة والموظف والمرفقات في صفحة واحدة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TicketDetailPage,
});

function TicketDetailPage() {
  const { slug, ticketId } = Route.useParams();
  const access = useAccess();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [note, setNote] = useState("");

  const ticket = useQuery({
    queryKey: ["ticket", ticketId],
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
    queryKey: ["ticket-requester", ticket.data?.created_by],
    enabled: !!ticket.data?.created_by,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email, phone, employee_no, extension, specialty, department")
        .eq("id", ticket.data!.created_by!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const updates = useQuery({
    queryKey: ["ticket-updates", ticketId],
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
        author_name: access.fullName || "فريق الدعم",
        note: `تم تغيير الحالة إلى: ${STATUS_META[next].label}`,
        status: next,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
      void qc.invalidateQueries({ queryKey: ["ticket-updates", ticketId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addNote = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("ticket_updates").insert({
        ticket_id: ticketId,
        author_id: access.user?.id ?? null,
        author_name: access.fullName || "فريق الدعم",
        note: note.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNote("");
      void qc.invalidateQueries({ queryKey: ["ticket-updates", ticketId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (ticket.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!ticket.data) {
    return (
      <div className="grid min-h-screen place-items-center px-4 text-center">
        <div>
          <p className="text-lg font-black">التذكرة غير موجودة</p>
          <Link
            to="/c/$slug/admin"
            params={{ slug }}
            className="mt-3 inline-block text-sm font-bold text-primary"
          >
            العودة للوحة التحكم
          </Link>
        </div>
      </div>
    );
  }

  const t = ticket.data;
  const custom = (t.custom_data ?? {}) as Record<string, string>;
  const files = parseAttachments(t.attachments);
  const r = requester.data;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => void navigate({ to: "/c/$slug/admin", params: { slug } })}
              className="grid h-9 w-9 place-items-center rounded-xl border border-border"
              aria-label="رجوع"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-base font-black">{t.title}</h1>
              <p className="font-mono text-xs text-muted-foreground" dir="ltr">
                {t.ticket_no}
              </p>
            </div>
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
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className="space-y-3 rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-lg border px-2 py-1 text-xs font-bold ${
                  STATUS_META[t.status as Status].className
                }`}
              >
                {STATUS_META[t.status as Status].label}
              </span>
              <span
                className={`rounded-lg border px-2 py-1 text-xs font-bold ${
                  PRIORITY_META[t.priority as Priority].className
                }`}
              >
                {PRIORITY_META[t.priority as Priority].label}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(t.created_at).toLocaleString("ar")}
              </span>
            </div>
            <h2 className="text-sm font-black">وصف المشكلة</h2>
            <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
              {t.description || "—"}
            </p>
            <dl className="grid grid-cols-2 gap-3 pt-2 text-xs sm:grid-cols-3">
              {[
                ["الفرع", t.branch],
                ["تاريخ الإغلاق", t.closed_at ? new Date(t.closed_at).toLocaleString("ar") : ""],
                ["آخر تحديث", new Date(t.updated_at).toLocaleString("ar")],
                ...Object.entries(custom),
              ].map(([label, value]) => (
                <div key={label as string}>
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-bold">{(value as string) || "—"}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="space-y-3 rounded-2xl border border-border bg-card p-6">
            <h2 className="text-sm font-black">المرفقات</h2>
            <AttachmentList items={files} />
          </section>

          <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <h2 className="text-sm font-black">سجل التحديثات</h2>
            <ol className="space-y-3">
              {(updates.data ?? []).map((u) => (
                <li key={u.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span dir="ltr">{u.author_name}</span>
                    <span>{new Date(u.created_at).toLocaleString("ar")}</span>
                  </div>
                  <p className="mt-1 text-sm font-bold">{u.note}</p>
                </li>
              ))}
              {(updates.data ?? []).length === 0 && (
                <li className="text-xs text-muted-foreground">لا توجد تحديثات بعد.</li>
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
                placeholder="أضف ملاحظة للتذكرة"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <button
                disabled={addNote.isPending}
                aria-label="إضافة ملاحظة"
                className="grid h-11 w-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-60"
              >
                {addNote.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>
          </section>
        </div>

        <aside className="space-y-4 self-start rounded-2xl border border-border bg-card p-6">
          <h2 className="text-sm font-black">بيانات مقدّم الطلب</h2>
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
          {!t.created_by && (
            <p className="text-xs text-muted-foreground">
              هذه التذكرة مرفوعة بدون حساب موظف مسجّل.
            </p>
          )}
        </aside>
      </main>
    </div>
  );
}
