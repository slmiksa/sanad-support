import { Paperclip } from "lucide-react";
import { attachmentUrl, formatSize, type Attachment } from "@/lib/attachments";
import { toast } from "sonner";

export function AttachmentList({ items }: { items: Attachment[] }) {
  if (items.length === 0)
    return <p className="text-xs text-muted-foreground">لا توجد مرفقات.</p>;

  const open = async (path: string) => {
    const url = await attachmentUrl(path);
    if (!url) {
      toast.error("تعذّر فتح المرفق");
      return;
    }
    window.open(url, "_blank", "noopener");
  };

  return (
    <ul className="space-y-2">
      {items.map((a) => (
        <li key={a.path}>
          <button
            type="button"
            onClick={() => void open(a.path)}
            className="flex w-full items-center gap-2 rounded-xl border border-border px-3 py-2 text-right text-xs font-bold hover:bg-muted/50"
          >
            <Paperclip className="h-4 w-4 text-primary" />
            <span className="flex-1 truncate">{a.name}</span>
            <span className="text-muted-foreground">{formatSize(a.size)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
