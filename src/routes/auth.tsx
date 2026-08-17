import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { LogIn, Loader2, ShieldCheck, MailCheck, ArrowRight } from "lucide-react";
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
    ],
  }),
  component: AuthPage,
});

type Stage = "credentials" | "otp";

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<Stage>("credentials");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);

  /** الخطوة الأولى: التحقق من كلمة المرور ثم تحديد إن كان الحساب يحتاج مصادقة ثنائية */
  const submitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const userId = data.user?.id;
      let needs2fa = false;
      if (userId) {
        const { data: needs } = await (
          supabase.rpc as unknown as (
            name: string,
            params?: Record<string, unknown>,
          ) => Promise<{ data: unknown; error: unknown }>
        )("requires_two_factor", { _user_id: userId });
        needs2fa = Boolean(needs);
      }

      if (!needs2fa) {
        toast.success("تم تسجيل الدخول");
        void navigate({ to: "/portal" });
        return;
      }

      // لا نُبقي أي جلسة نشطة قبل إتمام المصادقة الثنائية
      await supabase.auth.signOut();

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      if (otpError) throw otpError;

      setStage("otp");
      toast.success("أرسلنا رمز التحقق إلى بريدك الإلكتروني");
    } catch (err) {
      toast.error("تعذّر تسجيل الدخول", { description: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  /** الخطوة الثانية: التحقق من الرمز المرسل بالبريد */
  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code.trim(),
        type: "email",
      });
      if (error) throw error;
      toast.success("تم التحقق بنجاح");
      void navigate({ to: "/portal" });
    } catch (err) {
      toast.error("رمز غير صحيح أو منتهي", { description: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      toast.success("تم إرسال رمز جديد");
    } catch (err) {
      toast.error("تعذّر إعادة الإرسال", { description: (err as Error).message });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-7 shadow-sm">
        <Link to="/" className="text-xs font-bold text-primary">
          ← العودة للرئيسية
        </Link>

        {stage === "credentials" ? (
          <>
            <h1 className="mt-4 text-2xl font-black">تسجيل الدخول</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              الحسابات تُنشأ من إدارة شركتك فقط. لا يوجد تسجيل ذاتي.
            </p>

            <form onSubmit={submitCredentials} className="mt-6 space-y-4">
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
                دخول
              </button>
            </form>

            <div className="mt-5 flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-3 text-[11px] leading-5 text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                حسابات الإدارة والدعم الفني محمية بمصادقة ثنائية: بعد كلمة المرور يصلك رمز تحقق على
                بريدك. حسابات الموظفين لرفع التذاكر تدخل مباشرة.
              </span>
            </div>
          </>
        ) : (
          <>
            <span className="mt-4 inline-grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <MailCheck className="h-6 w-6" />
            </span>
            <h1 className="mt-3 text-2xl font-black">التحقق بخطوتين</h1>
            <p className="mt-1 text-xs leading-6 text-muted-foreground">
              أرسلنا رمزاً مكوناً من 6 أرقام إلى <span dir="ltr" className="font-bold">{email}</span>.
              الرمز صالح لفترة قصيرة ولمرة واحدة.
            </p>

            <form onSubmit={submitOtp} className="mt-6 space-y-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-muted-foreground">رمز التحقق</span>
                <input
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={8}
                  dir="ltr"
                  placeholder="000000"
                  className="field text-center text-lg font-black tracking-[0.5em]"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                />
              </label>
              <button
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground disabled:opacity-60"
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

        <p className="mt-5 text-center text-xs text-muted-foreground">
          نسيت كلمة المرور أو لا تملك حساباً؟ تواصل مع مشرف الدعم الفني في شركتك.
        </p>
      </div>
    </div>
  );
}
