import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { LogIn, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول | منصة تذاكر الدعم" },
      {
        name: "description",
        content: "تسجيل دخول أدمن المنصة وأدمن الشركات لإدارة الاشتراكات وتذاكر الدعم الفني.",
      },
      { property: "og:title", content: "تسجيل الدخول إلى منصة التذاكر" },
      { property: "og:description", content: "دخول آمن لأدمن المنصة وأدمن الشركات." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/portal`,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("تم إنشاء الحساب", { description: "يمكنك الآن الدخول." });
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("تم تسجيل الدخول");
      void navigate({ to: "/portal" });
    } catch (err) {
      toast.error("تعذّر تسجيل الدخول", { description: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-7 shadow-sm">
        <Link to="/" className="text-xs font-bold text-primary">
          ← العودة للرئيسية
        </Link>
        <h1 className="mt-4 text-2xl font-black">
          {mode === "signin" ? "تسجيل الدخول" : "إنشاء حساب"}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          أول حساب يتم إنشاؤه في المنصة يصبح أدمن المنصة (الأدمن الأم) تلقائياً.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-muted-foreground">الاسم الكامل</span>
              <input
                required
                className="field"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
          )}
          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-muted-foreground">البريد الإلكتروني</span>
            <input
              required
              type="email"
              dir="ltr"
              className="field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-muted-foreground">كلمة المرور</span>
            <input
              required
              type="password"
              minLength={8}
              dir="ltr"
              className="field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            {mode === "signin" ? "دخول" : "إنشاء الحساب والدخول"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-xs font-bold text-primary"
        >
          {mode === "signin" ? "ليس لديك حساب؟ إنشاء حساب" : "لديك حساب؟ تسجيل الدخول"}
        </button>
      </div>
    </div>
  );
}
