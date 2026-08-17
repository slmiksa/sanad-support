import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { LogIn, Loader2, ShieldCheck, MailCheck, ArrowRight, KeyRound, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول | نظام سند للدعم الفني" },
      {
        name: "description",
        content:
          "تسجيل دخول أدمن المنصة وأدمن الشركات وفريق الدعم مع مصادقة ثنائية عبر البريد الإلكتروني.",
      },
      { property: "og:title", content: "تسجيل الدخول إلى نظام سند" },
      { property: "og:description", content: "دخول آمن بمصادقة ثنائية للوحات التحكم." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

type Stage = "credentials" | "otp";

const OTP_API_BASE = (import.meta.env["VITE_OTP_API_BASE"] as string | undefined) ?? "";

async function callOtpApi(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${OTP_API_BASE}/api/public/auth-otp/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error((data["error"] as string) || "تعذّر إتمام العملية");
  return data;
}

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<Stage>("credentials");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);

  /** الخطوة الأولى: التحقق من كلمة المرور ثم إرسال رمز التحقق للإداريين وفريق الدعم */
  const submitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      let result: Record<string, unknown> = {};
      try {
        result = await callOtpApi("send", { email });
      } catch (sendError) {
        await supabase.auth.signOut();
        throw sendError;
      }

      if (!result["required"]) {
        toast.success("تم تسجيل الدخول");
        void navigate({ to: "/portal" });
        return;
      }

      // لا نُبقي أي جلسة نشطة قبل إتمام المصادقة الثنائية
      await supabase.auth.signOut();
      setStage("otp");
      toast.success("أرسلنا رمز التحقق إلى بريدك الإلكتروني");
    } catch (err) {
      toast.error("تعذّر تسجيل الدخول", { description: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  /** الخطوة الثانية: التحقق من الرمز ثم فتح الجلسة */
  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await callOtpApi("verify", { email, code: code.trim() });
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("تم التحقق بنجاح");
      void navigate({ to: "/portal" });
    } catch (err) {
      toast.error("تعذّر التحقق", { description: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      await callOtpApi("send", { email });
      toast.success("تم إرسال رمز جديد");
    } catch (err) {
      toast.error("تعذّر إعادة الإرسال", { description: (err as Error).message });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute -top-32 right-[-10%] h-80 w-80 rounded-full bg-primary/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-20%] left-[-10%] h-96 w-96 rounded-full bg-primary/15 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="overflow-hidden rounded-3xl border border-border/70 bg-card/80 shadow-xl backdrop-blur">
          <div className="bg-gradient-to-br from-primary to-primary/70 px-7 py-7 text-primary-foreground">
            <Link to="/" className="text-xs font-bold opacity-90 hover:opacity-100">
              ← العودة للرئيسية
            </Link>
            <div className="mt-4 flex items-center gap-3">
              <img
                src="/sanad-logo.png"
                alt="شعار نظام سند للدعم الفني"
                className="h-12 w-12 rounded-2xl bg-white/90 object-contain p-1"
                loading="lazy"
              />
              <div>
                <h1 className="text-xl font-black leading-tight">
                  {stage === "credentials" ? "تسجيل الدخول" : "التحقق بخطوتين"}
                </h1>
                <p className="text-[11px] opacity-90">نظام سند للدعم الفني</p>
              </div>
            </div>
          </div>

          <div className="px-7 py-7">
            {stage === "credentials" ? (
              <>
                <p className="text-xs leading-6 text-muted-foreground">
                  الحسابات تُنشأ من إدارة شركتك فقط. لا يوجد تسجيل ذاتي.
                </p>

                <form onSubmit={submitCredentials} className="mt-6 space-y-4">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-muted-foreground">البريد الإلكتروني</span>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        required
                        type="email"
                        dir="ltr"
                        className="field pr-10 text-left"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-muted-foreground">كلمة المرور</span>
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
                  <button
                    disabled={busy}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground shadow-sm transition hover:opacity-95 disabled:opacity-60"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogIn className="h-4 w-4" />
                    )}
                    دخول
                  </button>
                </form>

                <div className="mt-5 flex items-start gap-2 rounded-2xl border border-border bg-muted/40 p-3 text-[11px] leading-5 text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    حسابات الإدارة وفريق الدعم محمية بمصادقة ثنائية: بعد كلمة المرور يصلك رمز تحقق على
                    بريدك. حسابات الموظفين لرفع التذاكر تدخل مباشرة.
                  </span>
                </div>
              </>
            ) : (
              <>
                <span className="inline-grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <MailCheck className="h-6 w-6" />
                </span>
                <p className="mt-3 text-xs leading-6 text-muted-foreground">
                  أرسلنا رمزاً مكوناً من 6 أرقام إلى{" "}
                  <span dir="ltr" className="font-bold text-foreground">
                    {email}
                  </span>
                  . الرمز صالح 10 دقائق ولمرة واحدة.
                </p>

                <form onSubmit={submitOtp} className="mt-6 space-y-4">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-muted-foreground">رمز التحقق</span>
                    <input
                      required
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      dir="ltr"
                      placeholder="000000"
                      className="field text-center text-lg font-black tracking-[0.5em]"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    />
                  </label>
                  <button
                    disabled={busy || code.length < 6}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground shadow-sm transition hover:opacity-95 disabled:opacity-60"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" />
                    )}
                    تأكيد الدخول
                  </button>
                </form>

                <div className="mt-4 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={resend}
                    disabled={resending}
                    className="font-bold text-primary disabled:opacity-60"
                  >
                    {resending ? "جارٍ الإرسال..." : "إعادة إرسال الرمز"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStage("credentials");
                      setCode("");
                      setPassword("");
                    }}
                    className="inline-flex items-center gap-1 font-bold text-muted-foreground"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                    تغيير الحساب
                  </button>
                </div>
              </>
            )}

            <p className="mt-6 text-center text-[11px] text-muted-foreground">
              نسيت كلمة المرور أو لا تملك حساباً؟ تواصل مع مشرف الدعم الفني في شركتك.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
