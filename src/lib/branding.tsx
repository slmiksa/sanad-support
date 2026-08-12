import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Branding = {
  primary: string;
  secondary: string;
  companyName: string;
  tagline: string;
  logo: string | null;
  dark: boolean;
};

const DEFAULTS: Branding = {
  primary: "#2cb3b3",
  secondary: "#007a7d",
  companyName: "شركتي للتكنولوجيا",
  tagline: "منصة الدعم الفني وإدارة التذاكر",
  logo: null,
  dark: false,
};

type Ctx = Branding & { update: (patch: Partial<Branding>) => void; reset: () => void };

const BrandingContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "wl-branding";

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Branding>(DEFAULTS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
    const root = document.documentElement;
    root.classList.toggle("dark", state.dark);
    root.setAttribute("dir", "rtl");
    root.setAttribute("lang", "ar");
    root.style.setProperty("--primary", state.primary);
    root.style.setProperty("--ring", state.primary);
    root.style.setProperty("--sidebar-primary", state.primary);
    root.style.setProperty("--brand-secondary", state.secondary);
    root.style.setProperty("--primary-foreground", "oklch(0.99 0 0)");
  }, [state]);

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      update: (patch) => setState((s) => ({ ...s, ...patch })),
      reset: () => setState(DEFAULTS),
    }),
    [state],
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  const ctx = useContext(BrandingContext);
  if (!ctx) throw new Error("useBranding must be used inside BrandingProvider");
  return ctx;
}
