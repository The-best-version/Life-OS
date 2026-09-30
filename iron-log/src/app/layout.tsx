import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";

import { AppShell } from "@/components/layout/app-shell";
import { ToastProvider } from "@/components/ui/toast";
import { IronLogProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "Iron Log — متتبع التمرين",
  description:
    "متتبع تمارين محلي بالكامل: سجّل المجموعات والأوزان وشاهد تقدّمك في رسوم واضحة.",
  applicationName: "Iron Log",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0D0D0F",
  // The inputs are 16px so iOS will not zoom on focus; locking scale as well
  // would break pinch-zoom for anyone who needs it.
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Loaded via a plain <link> rather than next/font so the build works
            offline; the CSS stack in globals.css falls back to the system sans. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <IronLogProvider>
          <ToastProvider>
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </IronLogProvider>
      </body>
    </html>
  );
}
