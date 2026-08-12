import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { TicketTracker } from "@/components/TicketTracker";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "متابعة حالة التذكرة | نظام تذاكر White-Label" },
      {
        name: "description",
        content: "أدخل رقم التذكرة لعرض حالتها والخط الزمني لمراحل المعالجة حتى الإغلاق.",
      },
      { property: "og:title", content: "متابعة حالة التذكرة" },
      {
        property: "og:description",
        content: "تتبّع تذكرتك عبر خط زمني واضح: جاري المتابعة، تم الحل، مغلقة.",
      },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-black">متابعة الطلب</h1>
        <p className="mt-2 mb-6 text-sm text-muted-foreground">
          أدخل أي رقم تذكرة لعرض نموذج حالة تجريبي مع الخط الزمني للمراحل.
        </p>
        <TicketTracker />
      </div>
    </AppShell>
  );
}
