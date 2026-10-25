"use client";

import {
  Activity,
  Dumbbell,
  HeartPulse,
  History,
  Settings2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "الرئيسية", icon: Activity },
  { href: "/workout", label: "التمرين", icon: Dumbbell },
  { href: "/history", label: "السجل", icon: History },
  { href: "/nutrition", label: "الجسم", icon: HeartPulse },
  { href: "/settings", label: "الإعدادات", icon: Settings2 },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="التنقل الرئيسي"
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 pt-1 pointer-events-none sm:pb-5"
    >
      <div className="mx-auto max-w-md pointer-events-auto">
        <ul className="flex items-center justify-around rounded-2xl border border-line-strong bg-surface px-2 py-2 shadow-lift">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1 rounded-xl py-1.5 transition-colors duration-150",
                    active ? "text-fg" : "text-fg-3",
                  )}
                >
                  {active ? (
                    <span className="absolute inset-0 rounded-xl bg-surface-2" aria-hidden />
                  ) : null}

                  <span className="relative flex items-center justify-center">
                    <Icon className={cn("size-5", active && "text-accent-glow")} aria-hidden />
                  </span>
                  <span
                    className={cn(
                      "relative text-[11px] tracking-tight",
                      active ? "font-bold text-fg" : "font-medium",
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
