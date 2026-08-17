import { createFileRoute } from "@tanstack/react-router";
import { LoginCard } from "@/components/LoginCard";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "دخول فريق المنصة | نظام سند للدعم الفني" },
      {
        name: "description",
        content:
          "دخول أدمن المنصة وفريق دعم لمحة بمصادقة ثنائية عبر البريد الإلكتروني.",
      },
      { property: "og:title", content: "دخول فريق منصة سند" },
      { property: "og:description", content: "دخول آمن بمصادقة ثنائية للوحات التحكم." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  return (
    <LoginCard
      title="دخول فريق المنصة"
      subtitle="نظام سند للدعم الفني — لمحة الآمنة"
      logoUrl="/sanad-logo.png"
      backTo={{ to: "/", label: "العودة للرئيسية" }}
      hint="هذه البوابة مخصصة لأدمن المنصة وفريق دعم لمحة. أعضاء الشركات يسجّلون الدخول من مسار شركتهم /c/اسم-الشركة/login."
    />
  );
}
