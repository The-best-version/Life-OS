import { useSyncExternalStore } from "react";

/**
 * `next/navigation` for the standalone build — the hash is the pathname.
 *
 * `useSyncExternalStore` rather than a `useState` + `useEffect` pair: the hash
 * can change between the render that reads it and the effect that subscribes,
 * and that gap is exactly how a nav bar ends up highlighting the previous tab.
 */
function readPathname(): string {
  const hash = window.location.hash.replace(/^#/, "");
  return hash.startsWith("/") ? hash : "/";
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

export function usePathname(): string {
  return useSyncExternalStore(subscribe, readPathname, () => "/");
}

export function useRouter() {
  return {
    push: (href: string) => {
      window.location.hash = href;
    },
    replace: (href: string) => {
      window.location.replace(`#${href}`);
    },
    back: () => window.history.back(),
    forward: () => window.history.forward(),
    refresh: () => {},
    prefetch: () => {},
  };
}

export function useSearchParams() {
  return new URLSearchParams();
}
