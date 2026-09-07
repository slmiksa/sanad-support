import { ExternalLink } from "lucide-react";
import { DEVELOPER } from "@/lib/platform";

export function SiteFooter() {
  return (
    <footer className="border-t border-stage-foreground/10 bg-stage py-7 text-stage-foreground">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 text-center text-xs sm:flex-row sm:text-start lg:px-8">
        <p className="font-bold text-stage-foreground/65">
          برمجة وتطوير {DEVELOPER.name} — جميع الحقوق محفوظة © {new Date().getFullYear()}
        </p>
        <a
          href={DEVELOPER.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md border border-stage-foreground/20 bg-stage-foreground/5 px-4 py-2.5 font-bold text-stage-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
        >
          موقع المطور <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </footer>
  );
}
