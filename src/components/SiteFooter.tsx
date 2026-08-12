import { ExternalLink } from "lucide-react";
import { DEVELOPER } from "@/lib/platform";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/40 py-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-center text-xs text-muted-foreground sm:flex-row sm:text-start">
        <p className="font-bold">
          برمجة وتطوير {DEVELOPER.name} — جميع الحقوق محفوظة © {new Date().getFullYear()}
        </p>
        <a
          href={DEVELOPER.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 font-bold text-foreground transition-colors hover:bg-accent"
        >
          موقع المطور <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </footer>
  );
}
