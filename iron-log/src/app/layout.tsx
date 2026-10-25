import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";

import { AppShell } from "@/components/layout/app-shell";
import { SportFilterProvider } from "@/components/session/sport-selector";
import { ToastProvider } from "@/components/ui/toast";
import { IronLogProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "Iron Log — نظام رياضي متعدد التخصصات",
  description:
    "نظام رياضي متعدد التخصصات، محلي بالكامل: حديد وملاكمة وفروسية وجري — جولات ومجموعات ومسافات ومؤقتات في مكان واحد.",
  applicationName: "Iron Log",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#08090C",
  // The inputs are 16px so iOS will not zoom on focus; locking the scale as
  // well would break pinch-zoom for anyone who needs it.
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/*
          Loaded via a plain <link> rather than next/font so the build works
          offline; the CSS stack in globals.css falls back to the system sans.
          Two families, one job each: IBM Plex Sans Arabic carries every word,
          Oswald carries every number — a weight on the bar and the Arabic
          label beside it are deliberately two different materials.
        */}
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Oswald:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <IronLogProvider>
          <ToastProvider>
            {/* The active discipline is a view preference, so it sits above
                the shell and below the database: every screen reads it, and
                none of it reaches the payload. */}
            <SportFilterProvider>
              <AppShell>{children}</AppShell>
            </SportFilterProvider>
          </ToastProvider>
        </IronLogProvider>
      </body>
    </html>
  );
}
