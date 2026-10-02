import { StrictMode, useEffect, type ComponentType } from "react";
import { createRoot } from "react-dom/client";

import { AppShell } from "@/components/layout/app-shell";
import { ToastProvider } from "@/components/ui/toast";
import { IronLogProvider } from "@/lib/store";
import { ThemeProvider } from "@/lib/theme";

import DashboardPage from "@/app/page";
import HistoryPage from "@/app/history/page";
import BodyScreen from "@/app/nutrition/page";
import SettingsPage from "@/app/settings/page";
import WorkoutPage from "@/app/workout/page";

import { usePathname } from "./shims/next-navigation";

/**
 * The standalone entry: what `app/layout.tsx` is to Next, this is to the single
 * file build.
 *
 * The provider stack is copied from that layout deliberately, in the same order
 * — ThemeProvider outermost because the pre-paint script has already written
 * `data-theme` and the provider only keeps it in step, then the database, then
 * toasts, then the chrome. Reordering it here and not there is how the two
 * builds quietly stop being the same app.
 *
 * Every page in `src/app` is already "use client", which is the only reason a
 * build like this is possible at all: there is no server half to replace.
 */
// `ComponentType`, not `JSX.Element`: React 19 removed the global JSX namespace,
// so the old spelling only type-checks in a project that still pulls in the
// legacy @types/react globals.
const ROUTES: Record<string, ComponentType> = {
  "/": DashboardPage,
  "/workout": WorkoutPage,
  "/history": HistoryPage,
  "/nutrition": BodyScreen,
  "/settings": SettingsPage,
};

function App() {
  const pathname = usePathname();
  const Page = ROUTES[pathname] ?? DashboardPage;

  // Next scrolls to the top on a route change; a hash router does not, so a tab
  // opened from halfway down the dashboard would land mid-page.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <ThemeProvider>
      <IronLogProvider>
        <ToastProvider>
          <AppShell>
            <Page />
          </AppShell>
        </ToastProvider>
      </IronLogProvider>
    </ThemeProvider>
  );
}

// An empty hash is the dashboard. Written with `replace` so the back button does
// not have to walk through a bare file:// URL on the way out.
if (!window.location.hash) {
  window.location.replace("#/");
}

const host = document.getElementById("root");
if (host) {
  createRoot(host).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
