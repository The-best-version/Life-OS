"use client";

import {
  Dumbbell,
  HeartPulse,
  History,
  Settings,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "التقدم", icon: TrendingUp },
  { href: "/workout", label: "التمرين", icon: Dumbbell },
  { href: "/history", label: "السجل", icon: History },
  { href: "/nutrition", label: "الجسم", icon: HeartPulse },
  { href: "/settings", label: "الإعدادات", icon: Settings },
] as const;

/**
 * Five tabs, and five is the ceiling.
 *
 * At 375px each tab gets ~63px, which is exactly what a two-word Arabic label
 * needs to stay legible above its icon. A sixth tab would force either an
 * ellipsis or a smaller type size, so anything new goes inside a screen, not
 * onto this bar.
 *
 * On a phone it is edge to edge, because a floating bar wastes the thumb's
 * easiest reach — the very bottom of the screen. On a desktop window there is no
 * thumb, and a bar stretched across 1000px of chrome looks like a phone app that
 * was resized, so it lifts off the edge and becomes a centred pill.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="التنقل الرئيسي"
      className={cn(
        "fixed inset-x-3 bottom-2 z-30 rounded-2xl border border-white/[0.12] bg-[#0A0E18]/90 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.7)]",
        "lg:inset-x-auto lg:bottom-6 lg:left-1/2 lg:w-[540px] lg:-translate-x-1/2",
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="mx-auto flex max-w-[560px] items-center justify-between px-2 py-2">
        {ITEMS.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-bold transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  active
                    ? "bg-primary/20 text-white shadow-[0_0_15px_rgba(255,42,85,0.25)]"
                    : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "size-[18px] transition-transform duration-200",
                    active ? "scale-110 text-primary drop-shadow-[0_0_8px_rgba(255,42,85,0.6)]" : "text-muted-foreground",
                  )}
                  aria-hidden
                />
                <span className={active ? "font-black" : "font-semibold"}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
