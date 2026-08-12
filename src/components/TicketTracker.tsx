import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { trackTicket } from "@/lib/tenant.functions";
import { PRIORITY_META, STATUS_META, type Priority, type Status } from "@/lib/tickets";

type Result = Awaited<ReturnType<typeof trackTicket>>;

export function TicketTracker() {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);
  const [result, setResult] = useState<Result>(null);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    setBusy(true);
    try {
      const res = await trackTicket({ data: { ticket_no: value.trim() } });
      setResult(res);
      setSearched(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={search} className="flex gap-2">
        <input
          className="field"
          dir="ltr"
          placeholder="TCK-00000000"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          disabled={busy}
          aria-label="بحث"
          className="grid h-11 w-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </button>
      </form>

      {searched && !result && (
        <p className="rounded-xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
          لم يتم العثور على تذكرة بهذا الرقم.
        </p>
      )}

      {result && (
        <div className="space-y-4 rounded-2xl border border-border bg-muted/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-xs" dir="ltr">
              {result.ticket.ticket_no}
            </span>
            <span
              className={`rounded-lg border px-2 py-1 text-xs font-bold ${
                STATUS_META[result.ticket.status as Status].className
              }`}
            >
              {STATUS_META[result.ticket.status as Status].label}
            </span>
          </div>
          <p className="text-sm font-extrabold">{result.ticket.title}</p>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>{result.ticket.branch || "بدون فرع"}</span>
            <span>·</span>
            <span>{PRIORITY_META[result.ticket.priority as Priority].label}</span>
            <span>·</span>
            <span>{new Date(result.ticket.created_at).toLocaleString("ar")}</span>
          </div>

          <ol className="space-y-3 border-r border-border pr-4">
            {result.updates.map((u) => (
              <li key={u.id} className="relative">
                <span className="absolute -right-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                <p className="text-xs font-bold">{u.note}</p>
                <p className="text-[11px] text-muted-foreground">
                  {u.author_name} — {new Date(u.created_at).toLocaleString("ar")}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
