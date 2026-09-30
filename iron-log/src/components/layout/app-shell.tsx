"use client";

import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { BottomNav } from "@/components/layout/bottom-nav";
import { Skeleton } from "@/components/ui/skeleton";
import { useIronLog } from "@/lib/store";
import { formatFullDate, toIsoDate } from "@/lib/utils";

/**
 * The chrome every page sits in: knurled hairline, sticky top bar, the storage
 * banner, and the bottom nav.
 *
 * Children render only once the database has been read on the client — that keeps
 * the server render and the first client render identical (no hydration
 * mismatch) and means no page ever has to handle a half-loaded database.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { status, storage, saveFailed, repaired } = useIronLog();

  return (
    <div className="min-h-dvh">
      <div className="iron-lattice" />

      <header
        className="sticky top-0 z-20 bg-background/95 backdrop-blur"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="mx-auto flex max-w-[560px] items-baseline justify-between px-4 pb-2 pt-2.5">
          <span className="text-[14.5px] font-black tracking-tight">
            IRON&nbsp;LOG
          </span>
          <span className="font-mono text-[11.5px] text-muted-foreground">
            {formatFullDate(toIsoDate())}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-[560px] px-4">
        {storage === "unavailable" ? (
          <Banner
            tone="error"
            title="التخزين غير متاح"
            body="المتصفح يمنع تخزين البيانات (غالباً وضع التصفح الخاص). التطبيق يعمل، لكن كل ما تسجّله يضيع عند إغلاق الصفحة."
          />
        ) : saveFailed ? (
          <Banner
            tone="error"
            title="فشل الحفظ"
            body="آخر تغيير ما انحفظ — قد تكون مساحة التخزين ممتلئة. صدّر نسخة احتياطية من الإعدادات قبل إغلاق الصفحة."
          />
        ) : repaired ? (
          <Banner
            tone="warn"
            title="تم إصلاح البيانات"
            body="بعض السجلات كانت تالفة وتم تجاهلها عند التحميل. باقي بياناتك سليمة."
          />
        ) : null}

        {status === "loading" ? <LoadingState /> : children}
      </main>

      <BottomNav />
    </div>
  );
}

function Banner({
  tone,
  title,
  body,
}: {
  tone: "error" | "warn";
  title: string;
  body: string;
}) {
  return (
    <div
      role="alert"
      className={
        tone === "error"
          ? "mt-3 rounded-lg border border-primary/40 bg-primary/10 p-3"
          : "mt-3 rounded-lg border border-border bg-secondary p-3"
      }
    >
      <p className="flex items-center gap-1.5 text-[13px] font-extrabold">
        <TriangleAlert
          className={tone === "error" ? "size-4 text-primary" : "size-4 text-muted-foreground"}
          aria-hidden
        />
        {title}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3 py-6">
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-4 w-28" />
      <div className="grid grid-cols-2 gap-2.5 pt-2">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-56" />
    </div>
  );
}
