"use client";

import { Activity, HeartPulse, History, Settings2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { SportIcon } from "@/components/session/sport-icon";
import { useSportFilter } from "@/components/session/sport-selector";
import { ALL_SPORTS, getSport } from "@/lib/sports-config";
import { cn } from "@/lib/utils";

/**
 * Five tabs, and the bar is not widened for a sixth.
 *
 * At 375px a tab needs about 63px to keep its label legible, so a sixth entry
 * would cost every label its last letter. The training tab is sport-aware
 * instead: it goes to the gym's own logging screen when the gym is the active
 * discipline, and to the session engine otherwise, carrying that discipline's
 * icon. One "train" tab whose destination follows the sport you are in beats
 * two tabs where one is always wrong.
 */
const STATIC_ITEMS = [
  { href: "/", label: "الرئيسية", icon: Activity },
  { href: "/history", label: "السجل", icon: History },
  { href: "/nutrition", label: "الجسم", icon: HeartPulse },
  { href: "/settings", label: "الإعدادات", icon: Settings2 },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { sport } = useSportFilter();

  const isGym = sport === ALL_SPORTS || sport === "gym";
  const trainHref = isGym ? "/workout" : "/session";
  const trainSport = isGym ? "gym" : getSport(sport).id;
  const trainLabel = isGym ? "التمرين" : getSport(sport).nameAr;

  const items = [
    STATIC_ITEMS[0],
    { href: trainHref, label: trainLabel, icon: null },
    STATIC_ITEMS[1],
    STATIC_ITEMS[2],
    STATIC_ITEMS[3],
  ];

  return (
    <nav
      aria-label="التنقل الرئيسي"
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 pt-1 pointer-events-none sm:pb-5"
    >
      <div className="mx-auto max-w-md pointer-events-auto">
        <ul className="flex items-center justify-around rounded-2xl border border-line-strong bg-surface px-2 py-2 shadow-lift">
          {items.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
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
                    {Icon ? (
                      <Icon
                        className={cn("size-5", active && "text-accent")}
                        aria-hidden
                      />
                    ) : (
                      <SportIcon
                        sport={trainSport}
                        className={cn("size-5", active && "text-accent")}
                      />
                    )}
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
