import { T } from "../components/life-shared.jsx";
import { sidebarNav } from "../life-config.js";
import { GROUP_OF_TAB, NAV_GROUPS, NAV_IDS, TAB_BAR } from "../state/life-state.mjs";
import { Menu, Settings, Award, Inbox, Bot, ChevronDown, ChevronUp, Bed } from "lucide-react";
import React, { useEffect, useState } from "react";

/* ==================================================================== *
 * THE NAVIGATION — the sidebar and the phone bar
 * ==================================================================== */
export const NAV = sidebarNav
  .filter((n) => n.visible !== false && NAV_IDS.includes(n.id))
  .map((n) => ({ ...n }));

// 👇 إضافة زر "حصاد السنة" برمجياً 👇
if (!NAV.find(n => n.id === 'wrapped')) {
  NAV.push({
    id: 'wrapped',
    label: 'حصاد السنة',
    short: 'حصاد',
    icon: Award
  });
}

// 👇 إضافة زر "صندوق الوارد" برمجياً 👇
if (!NAV.find(n => n.id === 'inbox')) {
  NAV.push({
    id: 'inbox',
    label: 'صندوق الوارد',
    short: 'الوارد',
    icon: Inbox
  });
}

// 👇 إضافة زر "الوكيل الذكي" برمجياً 👇
if (!NAV.find(n => n.id === 'agent')) {
  NAV.push({
    id: 'agent',
    label: 'الوكيل الذكي',
    short: 'الوكيل',
    icon: Bot
  });
}

// 👇 إضافة زر "مختبر النوم" برمجياً 👇
if (!NAV.find(n => n.id === 'sleep')) {
  NAV.push({
    id: 'sleep',
    label: 'مختبر النوم',
    short: 'النوم',
    icon: Bed
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
            title={!showLabels ? `${n.label} (${n.short})` : undefined}
            className={`group relative flex items-center rounded-2xl border text-right transition-all duration-300 ${
              showLabels ? "gap-3 px-3 py-2.5" : "justify-center px-0 py-2.5 mx-auto w-11 h-11"
            }${
              on 
                ? " scale-[1.02] bg-white/[0.08] backdrop-blur-md" 
                : " hover:bg-white/[0.04] hover:scale-105"
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
                className={`absolute inset-y-2 rounded-full ${showLabels ? "right-0 w-[4px]" : "right-1 w-[3px]"}`}
                style={{
                  background: `linear-gradient(180deg, ${T.cta}, ${T.ember})`,
                  boxShadow: `0 0 16px 2px ${T.cta}80`,
                }}
              />
            )}
            
            <span
              className={`flex shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 ${
                showLabels ? "h-8 w-8" : "h-9 w-9"
              }`}
              style={{
                backgroundColor: on ? `${T.cta}20` : "rgba(255,255,255,0.03)",
                color: on ? T.ctaLift : T.muted,
                boxShadow: on ? `inset 0 0 10px ${T.cta}30` : "none",
              }}
            >
              <Icon size={showLabels ? 17 : 19} strokeWidth={on ? 2.5 : 2} />
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

export const CONTEXT_SECTIONS = [
  { id: "daily", label: "اليومي", icon: "⚡", groupIds: ["daily"] },
  { id: "growth", label: "المستقبلي", icon: "🎯", groupIds: ["growth"] },
  { id: "tools", label: "الأدوات", icon: "🧰", groupIds: ["tools", "ai_assist"] },
  { id: "all", label: "الكل", icon: "🌐", groupIds: ["daily", "growth", "tools", "ai_assist"] },
];

export function NavGroups({ items, tab, onGo, showLabels }) {
  const [activeSection, setActiveSection] = useState(() => {
    try {
      return localStorage.getItem("los-nav-section") || "daily";
    } catch {
      return "daily";
    }
  });

  const selectSection = (secId) => {
    setActiveSection(secId);
    try {
      localStorage.setItem("los-nav-section", secId);
    } catch {}
  };

  const [collapsedMap, setCollapsedMap] = useState(() => {
    try {
      const raw = localStorage.getItem("los-nav-collapsed-groups");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // Automatically ensure active tab's section is shown if not in 'all'
  useEffect(() => {
    if (activeSection === "all") return;
    const secDef = CONTEXT_SECTIONS.find((s) => s.id === activeSection);
    const tabGroupId = GROUP_OF_TAB.get(tab) || "ai_assist";
    if (secDef && !secDef.groupIds.includes(tabGroupId)) {
      const match = CONTEXT_SECTIONS.find((s) => s.id !== "all" && s.groupIds.includes(tabGroupId));
      if (match) {
        selectSection(match.id);
      }
    }
  }, [tab]);

  const toggleGroup = (groupId) => {
    setCollapsedMap((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      try {
        localStorage.setItem("los-nav-collapsed-groups", JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const groups = NAV_GROUPS.map((g) => ({
    ...g,
    tabsIn: items.filter((n) => GROUP_OF_TAB.get(n.id) === g.id),
  })).filter((g) => g.tabsIn.length);

  const loose = items.filter((n) => !GROUP_OF_TAB.has(n.id));

  const currentSectionDef =
    CONTEXT_SECTIONS.find((s) => s.id === activeSection) || CONTEXT_SECTIONS[0];
  const filteredGroups = groups.filter((g) => currentSectionDef.groupIds.includes(g.id));
  const showLoose = loose.length > 0 && currentSectionDef.groupIds.includes("ai_assist");

  return (
    <div className="flex flex-col gap-3">
      {/* 🧭 محوّل السياق السريع (Segmented Context Switcher) */}
      <div className="mb-1">
        {showLabels ? (
          <div className="grid grid-cols-4 gap-1 rounded-2xl bg-white/[0.03] p-1 border border-white/5 backdrop-blur-sm">
            {CONTEXT_SECTIONS.map((sec) => {
              const active = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => selectSection(sec.id)}
                  className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[11px] transition-all duration-200 select-none ${
                    active
                      ? "bg-gradient-to-r from-orange-500/80 to-amber-600/80 text-white font-black shadow-md shadow-orange-500/20 scale-[1.02]"
                      : "text-white/45 hover:text-white/80 hover:bg-white/5 font-bold"
                  }`}
                  title={`تصفية: ${sec.label}`}
                >
                  <span className="text-xs">{sec.icon}</span>
                  <span className="truncate">{sec.label}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-white/[0.03] p-1 border border-white/5">
            {CONTEXT_SECTIONS.map((sec) => {
              const active = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => selectSection(sec.id)}
                  className={`h-8 w-8 mx-auto flex items-center justify-center rounded-xl text-xs transition-all duration-200 ${
                    active
                      ? "bg-gradient-to-r from-orange-500/80 to-amber-600/80 text-white shadow-md shadow-orange-500/20 scale-105"
                      : "text-white/40 hover:text-white hover:bg-white/5"
                  }`}
                  title={`سياق: ${sec.label}`}
                >
                  {sec.icon}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {filteredGroups.map((g, i) => {
          const hasActive = g.tabsIn.some((n) => n.id === tab);
          const isCollapsible = activeSection === "all" && g.id === "tools";
          const isCollapsed = isCollapsible && !hasActive && !!collapsedMap[g.id];

          return (
            <div key={g.id}>
              {showLabels ? (
                activeSection === "all" ? (
                  <div
                    onClick={isCollapsible ? () => toggleGroup(g.id) : undefined}
                    className={`mb-2 flex items-center justify-between px-3 ${
                      isCollapsible ? "cursor-pointer group select-none" : ""
                    }`}
                    title={
                      isCollapsible
                        ? isCollapsed
                          ? "اضغط لإظهار الأدوات"
                          : "اضغط لطي الأدوات وتصفية القائمة"
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-2">
                      <p
                        className={`shrink-0 text-[10px] font-extrabold tracking-widest uppercase transition-colors ${
                          isCollapsible ? "group-hover:text-white/70" : ""
                        }`}
                        style={{ color: "rgba(255,255,255,0.4)" }}
                      >
                        {g.label}
                      </p>
                      {isCollapsible && (
                        <span
                          className="rounded px-1.5 py-0.2 text-[9px] font-bold text-white/35 transition-colors group-hover:text-white/60"
                          style={{ background: "rgba(255,255,255,0.05)" }}
                        >
                          {g.tabsIn.length}
                        </span>
                      )}
                    </div>
                    {isCollapsible && (
                      <span className="text-white/30 transition-transform group-hover:text-white/60">
                        {isCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                      </span>
                    )}
                  </div>
                ) : null
              ) : (
                i > 0 &&
                activeSection === "all" && (
                  <div
                    aria-hidden="true"
                    className="mx-auto mb-3 h-px w-8"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                  />
                )
              )}
              {!isCollapsed && (
                <NavList items={g.tabsIn} tab={tab} onGo={onGo} showLabels={showLabels} />
              )}
            </div>
          );
        })}
        {showLoose &&
          (() => {
            const hasActive = loose.some((n) => n.id === tab);
            const isCollapsible = activeSection === "all";
            const isCollapsed = isCollapsible && !hasActive && !!collapsedMap["ai_assist"];
            return (
              <div>
                {showLabels && activeSection === "all" && (
                  <div
                    onClick={() => toggleGroup("ai_assist")}
                    className="mb-2 flex cursor-pointer select-none items-center justify-between px-3 group"
                    title={isCollapsed ? "اضغط لإظهار أدوات الذكاء والمساعد" : "اضغط لطي القسم"}
                  >
                    <div className="flex items-center gap-2">
                      <p
                        className="shrink-0 text-[10px] font-extrabold tracking-widest uppercase transition-colors group-hover:text-white/70"
                        style={{ color: "rgba(255,255,255,0.4)" }}
                      >
                        الذكاء والمساعد
                      </p>
                      <span
                        className="rounded px-1.5 py-0.2 text-[9px] font-bold text-white/35 transition-colors group-hover:text-white/60"
                        style={{ background: "rgba(255,255,255,0.05)" }}
                      >
                        {loose.length}
                      </span>
                    </div>
                    <span className="text-white/30 transition-transform group-hover:text-white/60">
                      {isCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                    </span>
                  </div>
                )}
                {!isCollapsed && (
                  <NavList items={loose} tab={tab} onGo={onGo} showLabels={showLabels} />
                )}
              </div>
            );
          })()}
      </div>
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