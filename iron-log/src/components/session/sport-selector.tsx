"use client";

/**
 * The global discipline switcher, and the filter it drives.
 *
 * The filter is deliberately NOT in the database. It is a view preference —
 * which column of the week you are looking at — and putting it in `Settings`
 * would mean every pill tap rewrites the whole payload and re-syncs it. It
 * lives in `localStorage` instead, wrapped in try/catch like every other read
 * here, so a blocked store costs the remembered tab and nothing else.
 */

import { Layers } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { SportIcon, sportStyle } from "@/components/session/sport-icon";
import {
  ALL_SPORTS,
  SPORTS_CONFIG,
  isSportId,
  type SportFilter,
} from "@/lib/sports-config";
import { cn } from "@/lib/utils";

const FILTER_KEY = "ironlog.sport.filter";

interface SportFilterValue {
  sport: SportFilter;
  setSport(next: SportFilter): void;
}

const SportFilterContext = createContext<SportFilterValue | null>(null);

export function SportFilterProvider({ children }: { children: ReactNode }) {
  // Starts on the overview so the server render and the first client render
  // agree; the stored choice is adopted after mount.
  const [sport, setSportState] = useState<SportFilter>(ALL_SPORTS);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(FILTER_KEY);
      if (stored === ALL_SPORTS || isSportId(stored)) {
        setSportState(stored as SportFilter);
      }
    } catch {
      /* blocked storage: the overview is a fine default */
    }
  }, []);

  const setSport = useCallback((next: SportFilter) => {
    setSportState(next);
    try {
      window.localStorage.setItem(FILTER_KEY, next);
    } catch {
      /* the choice still applies to this session */
    }
  }, []);

  const value = useMemo(() => ({ sport, setSport }), [sport, setSport]);

  return (
    <SportFilterContext.Provider value={value}>
      {children}
    </SportFilterContext.Provider>
  );
}

export function useSportFilter(): SportFilterValue {
  const context = useContext(SportFilterContext);
  if (!context) {
    throw new Error("useSportFilter must be used inside <SportFilterProvider>");
  }
  return context;
}

/**
 * The switcher itself.
 *
 * The active pill is `surface-2` with a found-by-eye edge, and only its icon
 * and trailing dot take the discipline's own hue: a pill filled with the sport
 * colour reads as a primary action, and this is navigation. The row scrolls
 * sideways with the bar hidden, so a fifth and sixth discipline cost nothing.
 */
export function SportSelector({
  value,
  onChange,
  allOption = true,
  className,
}: {
  value: SportFilter;
  onChange(next: SportFilter): void;
  /** `false` wherever a real discipline is required — starting a session. */
  allOption?: boolean;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label="الرياضة"
      className={cn(
        "flex gap-1.5 overflow-x-auto rounded-2xl border border-line bg-bg p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {allOption ? (
        <button
          type="button"
          aria-pressed={value === ALL_SPORTS}
          onClick={() => onChange(ALL_SPORTS)}
          className={cn(
            "flex h-10 shrink-0 items-center gap-2 rounded-2xl px-4 text-[12px] font-bold transition-colors duration-150",
            value === ALL_SPORTS
              ? "border border-line-strong bg-surface-2 text-fg"
              : "text-fg-3 hover:bg-surface-2 hover:text-fg",
          )}
        >
          <Layers
            className={cn("size-[18px]", value === ALL_SPORTS && "text-accent")}
            aria-hidden
          />
          <span>الكل</span>
        </button>
      ) : null}

      {SPORTS_CONFIG.map((sport) => {
        const active = sport.id === value;
        return (
          <button
            key={sport.id}
            type="button"
            aria-pressed={active}
            style={sportStyle(sport.accentVar)}
            onClick={() => onChange(sport.id)}
            className={cn(
              "flex h-10 shrink-0 items-center gap-2 rounded-2xl px-4 text-[12px] font-bold transition-colors duration-150",
              active
                ? "border border-line-strong bg-surface-2 text-fg"
                : "text-fg-3 hover:bg-surface-2 hover:text-fg",
            )}
          >
            <SportIcon
              sport={sport.id}
              className={cn("size-[18px]", active && "text-[var(--sport)]")}
            />
            <span>{sport.nameAr}</span>
            {active ? (
              <span
                aria-hidden
                className="size-1.5 rounded-full bg-[var(--sport)]"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
