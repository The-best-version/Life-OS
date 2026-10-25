"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/**
 * Route-level error boundary. Next.js renders this instead of a white screen if
 * a client component throws, and `reset()` re-mounts the subtree — so a transient
 * failure costs a tap, not the session.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Keep the real error reachable in the console; the UI stays in Arabic.
    console.error("[iron-log] unhandled error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <TriangleAlert className="size-7 text-danger" aria-hidden />
      <h1 className="text-lg font-bold text-fg">صار خطأ غير متوقع</h1>
      <p className="max-w-[36ch] text-xs leading-relaxed text-fg-3">
        بياناتك محفوظة في المتصفح ولم تتأثر. جرّب إعادة المحاولة، وإذا تكرر الخطأ
        صدّر نسخة احتياطية من الإعدادات.
      </p>
      <Button onClick={reset} className="mt-1">
        <RotateCcw className="size-4" aria-hidden />
        إعادة المحاولة
      </Button>
    </div>
  );
}
