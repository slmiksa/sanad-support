import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Moon, Sun, Palette, Menu, X } from "lucide-react";
import { useBranding } from "@/lib/branding";
import { BrandingPanel } from "./BrandingPanel";

const NAV = [
  { to: "/", label: "تقديم تذكرة" },
  { to: "/track", label: "متابعة الطلب" },
  { to: "/dashboard", label: "لوحة التحكم" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { companyName, tagline, logo, dark, update } = useBranding();
  const [panel, setPanel] = useState(false);
  const [menu, setMenu] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:flex sm:justify-between">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            {logo ? (
              <img
                src={logo}
                alt={companyName}
                className="h-10 w-10 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-lg font-black text-primary-foreground shadow-[var(--shadow-brand)]">
                {companyName.trim().charAt(0) || "ت"}
              </span>
            )}
            <span className="min-w-0">
              <span className="block truncate text-base font-extrabold text-primary">
                {companyName}
              </span>
              <span className="block truncate text-xs text-muted-foreground">{tagline}</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{ className: "bg-primary/10 text-primary" }}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => update({ dark: !dark })}
              aria-label="تبديل الوضع الليلي"
              className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card transition-colors hover:bg-muted"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setPanel(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-3 text-sm font-bold text-primary-foreground shadow-[var(--shadow-brand)] transition-opacity hover:opacity-90"
            >
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">تخصيص الهوية</span>
            </button>
            <button
              onClick={() => setMenu((v) => !v)}
              aria-label="القائمة"
              className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card lg:hidden"
            >
              {menu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {menu && (
          <nav className="flex flex-col gap-1 border-t border-border px-4 py-3 lg:hidden">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMenu(false)}
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{ className: "bg-primary/10 text-primary" }}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:py-12">{children}</main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        {companyName} — نموذج تجريبي (Prototype) لنظام تذاكر الدعم الفني · بيانات وهمية بالكامل
      </footer>

      <BrandingPanel open={panel} onClose={() => setPanel(false)} />
    </div>
  );
}
