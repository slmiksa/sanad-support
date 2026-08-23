import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { KeyRound, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import sanadLogo from "@/assets/sanad-logo.png";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "تعيين كلمة مرور جديدة | نظام سند للدعم الفني" },
      {
        name: "description",
        content: "صفحة آمنة لتعيين كلمة مرور جديدة لحسابك في نظام سند للدعم الفني.",
      },
      { property: "og:title", content: "تعيين كلمة مرور جديدة | نظام سند" },
      { property: "og:description", content: "أكمل إعادة تعيين كلمة المرور لحسابك بأمان." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

type Phase = "verifying" | "form" | "done" | "invalid";

function ResetPasswordPage() {
  const [phase, setPhase] = useState<Phase>("verifying");
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    const verify = async () => {
      const params = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const tokenHash = params.get("token_hash") ?? params.get("code");
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");

      try {
        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) throw sessionError;
        } else if (tokenHash) {
          const { error: otpError } = await supabase.auth.verifyOtp({
            type: "recovery",
            token_hash: tokenHash,
          });
          if (otpError) throw otpError;
        } else {
          const { data } = await supabase.auth.getSession();
          if (!data.session) throw new Error("الرابط غير صالح أو منتهي الصلاحية");
        }
        if (active) setPhase("form");
      } catch (err) {
        if (!active) return;
        setError((err as Error).message);
        setPhase("invalid");
      }
    };

    void verify();
    return () => {
      active = false;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("كلمة المرور يجب ألا تقل عن 8 أحرف");
      return;
    }
    if (password !== confirm) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }
    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      await supabase.auth.signOut();
      setPhase("done");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative grid min-h-[100svh] place-items-center overflow-hidden bg-background px-4 py-8 sm:py-12">
      <div className="pointer-events-none absolute -top-32 right-[-10%] h-80 w-80 rounded-full bg-primary/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-20%] left-[-10%] h-96 w-96 rounded-full bg-primary/15 blur-3xl" />

      <div className="relative w-full max-w-[26rem] sm:max-w-md">
        <div className="overflow-hidden rounded-3xl border border-border/70 bg-card/80 shadow-xl backdrop-blur">
          <div className="flex items-center gap-3 bg-gradient-to-br from-primary to-primary/70 px-5 py-6 text-primary-foreground sm:px-7">
            <img
              src={sanadLogo}
              alt="نظام سند"
              className="h-14 w-14 shrink-0 rounded-2xl bg-white object-contain p-1.5 shadow-sm"
            />
            <div className="min-w-0">
              <h1 className="truncate text-lg font-black leading-tight sm:text-xl">
                تعيين كلمة مرور جديدة
              </h1>
              <p className="truncate text-[11px] opacity-90">نظام سند للدعم الفني</p>
            </div>
          </div>

          <div className="px-5 py-6 sm:px-7 sm:py-7">
            {phase === "verifying" && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                جارٍ التحقق من الرابط...
              </p>
            )}

            {phase === "invalid" && (
              <div className="space-y-4">
                <p className="text-sm font-bold text-destructive">
                  الرابط غير صالح أو انتهت صلاحيته.
                </p>
                {error && <p className="text-xs text-muted-foreground">{error}</p>}
                <p className="text-xs leading-6 text-muted-foreground">
                  اطلب رابطاً جديداً من مشرف الدعم الفني في شركتك.
                </p>
                <Link
                  to="/"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground"
                >
                  العودة للرئيسية
                </Link>
              </div>
            )}

            {phase === "form" && (
              <form onSubmit={submit} className="space-y-4">
                <p className="text-xs leading-6 text-muted-foreground">
                  اختر كلمة مرور جديدة لا تقل عن 8 أحرف.
                </p>
                <label className="block space-y-1.5">
                  <span className="text-xs font-bold text-muted-foreground">كلمة المرور الجديدة</span>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      required
                      type="password"
                      minLength={8}
                      dir="ltr"
                      className="field pr-10 text-left"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-bold text-muted-foreground">تأكيد كلمة المرور</span>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      required
                      type="password"
                      minLength={8}
                      dir="ltr"
                      className="field pr-10 text-left"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                    />
                  </div>
                </label>
                {error && <p className="text-xs font-bold text-destructive">{error}</p>}
                <button
                  disabled={busy}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground shadow-sm transition hover:opacity-95 disabled:opacity-60"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  حفظ كلمة المرور
                </button>
              </form>
            )}

            {phase === "done" && (
              <div className="space-y-4 text-center">
                <span className="inline-grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <CheckCircle2 className="h-6 w-6" />
                </span>
                <p className="text-sm font-black">تم تحديث كلمة المرور بنجاح</p>
                <p className="text-xs leading-6 text-muted-foreground">
                  يمكنك الآن الدخول من بوابة شركتك بكلمة المرور الجديدة.
                </p>
                <Link
                  to="/"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground"
                >
                  العودة للرئيسية
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
