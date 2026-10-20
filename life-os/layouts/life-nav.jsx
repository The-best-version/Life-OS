import { T } from "../components/life-shared.jsx";
import { sidebarNav } from "../life-config.js";
import { GROUP_OF_TAB, NAV_GROUPS, NAV_IDS, TAB_BAR } from "../state/life-state.mjs";
import { Menu, Settings, Award } from "lucide-react"; // أضفت أيقونة Award
import React, { useEffect, useState } from "react";

/* ==================================================================== *
 * THE NAVIGATION — the sidebar and the phone bar
 * ==================================================================== */
export const NAV = sidebarNav
  .filter((n) => n.visible !== false && NAV_IDS.includes(n.id))
  .map((n) => ({ ...n }));

// 👇 إضافة زر "حصاد السنة" برمجياً بدون ما تعدل life-config.js 👇
if (!NAV.find(n => n.id === 'wrapped')) {
  NAV.push({
    id: 'wrapped',
    label: 'حصاد السنة',
    short: 'حصاد',
    icon: Award
  });
}

function NavList({ items, tab, onGo, showLabels }) {
  return (
    <nav className="flex flex-col gap-1.5">
      {items.map((n) => {
        const on = n.id === tab;
        const Icon = n.icon;
        return (
          <button
            key={n.id}
            onClick={() => onGo(n.id)}
            aria-current={on ? "page" : undefined}
            title={showLabels ? undefined : n.label}
            className={`group relative flex items-center gap-3 rounded-2xl border text-right transition-all duration-300 ${
              showLabels ? "px-3 py-2.5" : "justify-center px-0 py-2.5"
            }${
              on 
                ? " scale-[1.02] bg-white/[0.08] backdrop-blur-md" 
                : " hover:bg-white/[0.04] hover:translate-x-[-2px]"
            }`}
            style={{
              borderColor: on ? `${T.cta}40` : "transparent",
              backgroundImage: on
                ? `linear-gradient(115deg, ${T.cta}25 0%, ${T.cta}05 45%, ${T.ember}05 100%)`
                : "none",
              color: on ? T.ctaLift : T.muted,
              boxShadow: on
                ? `0 8px 30px -12px ${T.cta}50, inset 0 1px 0 0 rgba(255,255,255,0.1)`
                : "none",
            }}
          >
            {on && (
              <span
                aria-hidden="true"
                className="absolute inset-y-2 right-0 w-[4px] rounded-full"
                style={{
                  background: `linear-gradient(180deg, ${T.cta}, ${T.ember})`,
                  boxShadow: `0 0 16px 2px ${T.cta}80`,
                }}
              />
            )}
            
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110"
              style={{
                backgroundColor: on ? `${T.cta}20` : "rgba(255,255,255,0.03)",
                color: on ? T.ctaLift : T.muted,
                boxShadow: on ? `inset 0 0 10px ${T.cta}30` : "none",
              }}
            >
              <Icon size={17} strokeWidth={on ? 2.5 : 2} />
            </span>
            
            {showLabels && (
              <span className={`truncate text-[13px] transition-colors duration-300 ${on ? "font-extrabold text-white" : "font-bold group-hover:text-white/80"}`}>
                {n.label}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

export function NavGroups({ items, tab, onGo, showLabels }) {
  const groups = NAV_GROUPS.map((g) => ({
    ...g,
    tabsIn: items.filter((n) => GROUP_OF_TAB.get(n.id) === g.id),
  })).filter((g) => g.tabsIn.length);

  const loose = items.filter((n) => !GROUP_OF_TAB.has(n.id));

  return (
    <div className="flex flex-col gap-6">
      {groups.map((g, i) => (
        <div key={g.id}>
          {showLabels ? (
            <div className="mb-2.5 flex items-center gap-3 px-3">
              <p
                className="shrink-0 text-[10px] font-extrabold tracking-widest uppercase"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                {g.label}
              </p>
              <span
                aria-hidden="true"
                className="h-px flex-1"
                style={{
                  background: "linear-gradient(to left, rgba(255,255,255,0.08), transparent)",
                }}
              />
            </div>
          ) : (
            i > 0 && (
              <div
                aria-hidden="true"
                className="mx-auto mb-4 h-px w-8"
                style={{ background: "rgba(255,255,255,0.08)" }}
              />
            )
          )}
          <NavList items={g.tabsIn} tab={tab} onGo={onGo} showLabels={showLabels} />
        </div>
      ))}
      {loose.length > 0 && (
        <div>
          {showLabels && (
            <p
              className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-widest"
              style={{ color: T.faint }}
            >
              غير مصنّف
            </p>
          )}
          <NavList items={loose} tab={tab} onGo={onGo} showLabels={showLabels} />
        </div>
      )}
    </div>
  );
}

export function BottomTabs({ items, more: behind, tab, onGo, onSettings }) {
  const [more, setMore] = useState(false);
  const front = items.slice(0, TAB_BAR);
  const rest = [...items.slice(TAB_BAR), ...(behind || [])];
  const restActive = rest.some((n) => n.id === tab);

  const glass = {
    backgroundColor: `rgba(15, 23, 42, 0.85)`,
    backgroundImage: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))",
    borderColor: "rgba(255,255,255,0.12)",
    backdropFilter: "blur(20px) saturate(180%)",
    boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.15), 0 20px 44px -12px rgba(0,0,0,0.8), 0 0 34px -10px ${T.cta}40`,
  };

  const tabStyle = (on) => ({
    color: on ? T.ctaLift : T.faint,
    backgroundImage: on ? `linear-gradient(160deg, ${T.cta}40, ${T.cta}05)` : "none",
    boxShadow: on ? `inset 0 1px 0 0 rgba(255,255,255,0.1), 0 10px 22px -14px ${T.cta}` : "none",
  });

  return (
    <>
      {more && (
        <div className="fixed inset-0 z-[55] lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMore(false)} />
          <div
            className="los-in absolute inset-x-4 rounded-3xl border p-3 animate-in slide-in-from-bottom-5 duration-300"
            style={{ ...glass, bottom: "calc(env(safe-area-inset-bottom, 0px) + 92px)" }}
          >
            <div className="grid grid-cols-2 gap-2">
              {rest.map((n) => {
                const on = n.id === tab;
                const Icon = n.icon;
                return (
                  <button
                    key={n.id}
                    onClick={() => { onGo(n.id); setMore(false); }}
                    aria-current={on ? "page" : undefined}
                    className="los-tab flex items-center gap-2.5 rounded-2xl px-4 py-3.5 text-right transition-all duration-300"
                    style={tabStyle(on)}
                  >
                    <Icon size={18} strokeWidth={on ? 2.5 : 1.9} className="shrink-0" />
                    <span className="truncate text-[13px] font-bold">{n.short}</span>
                  </button>
                );
              })}
              <button
                onClick={() => { onSettings(); setMore(false); }}
                className="los-tab flex items-center gap-2.5 rounded-2xl px-4 py-3.5 text-right transition-all duration-300"
                style={tabStyle(false)}
              >
                <Settings size={18} strokeWidth={1.9} className="shrink-0" />
                <span className="truncate text-[13px] font-bold">الإعدادات</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <nav
        aria-label="التنقّل الرئيسي"
        className="fixed inset-x-0 z-[56] flex justify-center px-4 lg:hidden"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
      >
        <div className="flex w-full max-w-md items-stretch gap-1 rounded-[28px] border p-1.5" style={glass}>
          {front.map((n) => {
            const on = n.id === tab;
            const Icon = n.icon;
            return (
              <button
                key={n.id}
                onClick={() => { onGo(n.id); setMore(false); }}
                aria-current={on ? "page" : undefined}
                className="los-tab relative flex flex-1 flex-col items-center justify-center gap-1.5 rounded-[22px] px-1 py-2.5 transition-all duration-300"
                style={tabStyle(on)}
              >
                {on && <Pip />}
                <Icon
                  size={20}
                  strokeWidth={on ? 2.6 : 1.9}
                  className={`shrink-0 transition-transform duration-300 ${on ? " -translate-y-0.5 scale-110" : ""}`}
                />
                <span className="text-[10px] font-bold leading-none">{n.short}</span>
              </button>
            );
          })}
          <button
            onClick={() => setMore((m) => !m)}
            aria-expanded={more}
            aria-label="المزيد"
            className="los-tab relative flex flex-1 flex-col items-center justify-center gap-1.5 rounded-[22px] px-1 py-2.5 transition-all duration-300"
            style={tabStyle(more || restActive)}
          >
            {restActive && !more && <Pip />}
            <Menu size={20} strokeWidth={more || restActive ? 2.6 : 1.9} className="shrink-0" />
            <span className="text-[10px] font-bold leading-none">المزيد</span>
          </button>
        </div>
      </nav>
    </>
  );
}

function Pip() {
  return (
    <span
      aria-hidden="true"
      className="absolute top-1 h-[3px] w-8 rounded-full"
      style={{ background: T.ctaLift, boxShadow: `0 0 12px 1px ${T.cta}` }}
    />
  );
}

export function NowStamp({ compact = false }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const time = now.toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const date = now.toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  return (
    <div className={`min-w-0 leading-tight ${compact ? "text-left" : "text-left"}`}>
      <p className="truncate text-[12px] font-extrabold tabular-nums text-white/90">
        {time}
      </p>
      <p className="truncate text-[9.5px] font-bold text-white/40">
        {date}
      </p>
    </div>
  );
}