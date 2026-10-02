import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";

import { AppShell } from "@/components/layout/app-shell";
import { ToastProvider } from "@/components/ui/toast";
import { IronLogProvider } from "@/lib/store";
import { ThemeProvider } from "@/lib/theme";
// Imported from the neutral module, never from "@/lib/theme": a value exported
// by a "use client" module reaches a Server Component as a client reference, so
// the script tag would be handed a proxy object instead of the source.
import { THEME_SCRIPT } from "@/lib/theme-script";

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
  // `themeColor` is deliberately NOT declared here. It can only be keyed off a
  // media query, which would contradict a user who picked light while their OS is
  // dark — so the <meta> tag is written by THEME_SCRIPT and kept in step by
  // ThemeProvider instead.
  //
  // The inputs are 16px so iOS will not zoom on focus; locking the scale as well
  // would break pinch-zoom for anyone who needs it.
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    /*
      suppressHydrationWarning belongs HERE, on <html>, and not on the script
      below. React scopes the suppression to the element it is written on, and
      the attribute that differs between the server pass and the first client
      render is `data-theme` on THIS element — the head script writes it before
      hydration. On the <script> it suppressed nothing and every load logged a
      hydration mismatch.
    */
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/*
          Runs before the first paint and writes `data-theme` onto <html>, so the
          first painted frame is already the right theme. It has to be inline and
          synchronous — a deferred script would paint light first and then flip.
          The content is a build-time constant from our own module, never user
          input.
        */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/*
          Loaded via a plain <link> rather than next/font so the build works
          offline; the CSS stack in globals.css falls back to the system sans.
          One family, five weights: IBM Plex Sans Arabic covers Arabic and Latin
          from the same design, so a figure and the Arabic label beside it no
          longer come from two different faces.
        */}
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          <IronLogProvider>
            <ToastProvider>
              <AppShell>{children}</AppShell>
            </ToastProvider>
          </IronLogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
