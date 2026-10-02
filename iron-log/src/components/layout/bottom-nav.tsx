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
        "fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/85 backdrop-blur-xl",
        "lg:inset-x-auto lg:bottom-5 lg:left-1/2 lg:w-[540px] lg:-translate-x-1/2 lg:rounded-full lg:border lg:shadow-2xl",
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="mx-auto flex max-w-[560px] px-1.5 py-1.5 lg:py-1">
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
                  "relative flex flex-col items-center gap-1 rounded-md px-1 pb-1.5 pt-2.5 text-[10.5px] font-bold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {/* The molten tick above the active tab. It is a separate
                    element so the label keeps plain token colour — an active
                    tab is marked by position and a bar, not by tinted text. */}
                <span
                  aria-hidden
                  className={cn(
                    "molten absolute top-0 h-[3px] w-8 rounded-full transition-opacity lg:top-0.5",
                    active ? "opacity-100 shadow-[0_0_12px_0_var(--ember-glow)]" : "opacity-0",
                  )}
                />
                <Icon
                  className={cn(
                    "size-[19px] transition-colors",
                    active && "text-primary",
                  )}
                  aria-hidden
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
