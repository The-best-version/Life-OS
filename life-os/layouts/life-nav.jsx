import { T } from "../components/life-shared.jsx";
import { sidebarNav } from "../life-config.js";
import { GROUP_OF_TAB, MORE_IDS, NAV_GROUPS, NAV_IDS, TAB_BAR, navSplit, orderNavIds, rows } from "../state/life-state.mjs";
import { ChevronDown, ChevronUp, GripVertical, Menu, Settings } from "lucide-react";
import React, { useEffect, useState } from "react";

/* ==================================================================== *
 * THE NAVIGATION — the sidebar, the phone bar and the order editor
 *
 * `NAV_META` fastens the label, the short label and the icon onto the
 * canonical `NAV_IDS`, and everything below is a view over the order the user
 * owns. Declaration order matters here and nowhere else in this file: `NAV`
 * is built at module load out of `NAV_META`, so putting the table after the
 * list it fills is not a style question, it is a blank page.
 *
 * The sidebar is grouped and the phone bar is not, because they are solving
 * different problems — twelve rows in a column need dividing, four tabs in a
 * row do not.
 *
 * `NavOrderEditor` arms `draggable` from the grip alone. A button inside a
 * draggable element never fires a click: Chrome reads the press as the start
 * of a drag the moment the pointer moves a pixel, so the control works for a
 * perfectly still hand and is dead for every other one. This editor shipped
 * that way once.
 * ==================================================================== */


/* --- what the tabs are -------------------------------------------- *
 *  Declared before anything that reads them: `NAV` is built at module
 *  load out of `sidebarNav`, so an order that puts the table after the list
 *  it fills is not a style question — it is a blank page. */
/* --- navigation ------------------------------------------------------ *
 *  Which tabs exist, and in what order, is `NAV_IDS` in life-state.mjs —
 *  the migration needs that list and cannot import a lucide component. The
 *  label, the icon and the developer's own show/hide switch are
 *  `sidebarNav` in life-config.js, keyed by the same ids: a tab added to
 *  `NAV_IDS` with no row there renders nameless, which is a bug you see on
 *  the first open rather than one that hides in a saved payload.
 *  `visible: false` there drops a tab from every menu here without ever
 *  touching `NAV_IDS` or the user's own saved order (`state.navOrder`) —
 *  those two stay exactly what they always were. */
const NAV_META = new Map(sidebarNav.map((n) => [n.id, n]));

export const NAV = NAV_IDS.filter((id) => NAV_META.get(id)?.visible !== false).map((id) => ({
  id,
  ...NAV_META.get(id),
}));

const NAV_BY_ID = new Map(NAV.map((n) => [n.id, n]));

/* The saved order, resolved to tabs. `orderNavIds` does the hard part —
   dropping an id this build no longer has, appending a tab the saved order
   has never seen, taking a duplicate once — and this only puts the label and
   the icon back on. A tab hidden in `sidebarNav` is absent from `NAV_BY_ID`
   and is filtered out here rather than inside `orderNavIds`: the cap and
   order arithmetic in the state layer stays unaware of developer-only
   visibility, exactly as it stays unaware of icons. */
const orderedNav = (order) =>
  orderNavIds(order)
    .map((id) => NAV_BY_ID.get(id))
    .filter(Boolean);

/* His order cut in two, with the labels and the icons put back on each side:
   the tabs that take a row, and the tabs that answer only from «المزيد». */
export const splitNav = (order, more) => {
  const { main, behind } = navSplit(order, more);
  return {
    main: main.map((id) => NAV_BY_ID.get(id)).filter(Boolean),
    behind: behind.map((id) => NAV_BY_ID.get(id)).filter(Boolean),
  };
};

/* One row of the sidebar. The active state is carried by four things at
   once — a warm gradient, a lit border, an ambient glow under the row and a
   rail down its leading edge — because any one of them alone is a tint, and
   a tint is what the eye skips. The icon sits in a tile of its own so the
   lit row has a shape rather than just a colour.

   Coral, not the emerald it would be tempting to reach for: emerald in this
   app means *done*, and a nav row that borrows it makes "where I am" and "I
   finished this" the same signal on the same screen. */
function NavList({ items, tab, onGo, showLabels }) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map((n) => {
        const on = n.id === tab;
        const Icon = n.icon;
        return (
          <button
            key={n.id}
            onClick={() => onGo(n.id)}
            aria-current={on ? "page" : undefined}
            title={showLabels ? undefined : n.label}
            className={`los-nav relative flex items-center gap-3 rounded-xl border text-right transition-all duration-200 ${
              showLabels ? "px-2.5 py-2" : "justify-center px-0 py-2"
            }${on ? " los-nav-on" : ""}`}
            style={{
              borderColor: on ? `${T.cta}59` : "transparent",
              backgroundImage: on
                ? `linear-gradient(115deg, ${T.cta}33 0%, ${T.cta}1A 45%, ${T.ember}14 100%)`
                : "none",
              color: on ? T.ctaLift : T.muted,
              boxShadow: on
                ? `0 10px 26px -16px ${T.cta}, inset 0 1px 0 0 rgba(255,235,225,0.10)`
                : "none",
            }}
          >
            {/* The rail. On the leading edge, which is the right one here. */}
            {on && (
              <span
                aria-hidden="true"
                className="absolute inset-y-1.5 right-0 w-[3px] rounded-full"
                style={{
                  background: `linear-gradient(180deg, ${T.cta}, ${T.ember})`,
                  boxShadow: `0 0 12px -1px ${T.cta}`,
                }}
              />
            )}
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200"
              style={{
                backgroundColor: on ? `${T.cta}26` : "rgba(255,255,255,0.045)",
                color: on ? T.ctaLift : T.muted,
              }}
            >
              <Icon size={16} strokeWidth={on ? 2.5 : 1.9} />
            </span>
            {showLabels && (
              <span className="truncate text-[13px] font-bold">{n.label}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

/* The column, cut into its three groups. Each one lists only the tabs that
   are both in it and out front, in his order — so a group he has emptied by
   pushing all of its tabs behind «المزيد» does not leave a heading standing
   over nothing.

   Collapsed to icons the headings go and a hairline takes their place: at
   80px wide a heading is unreadable, but the grouping is the one thing worth
   keeping, and a rule between the groups says it in the space available. */
export function NavGroups({ items, tab, onGo, showLabels }) {
  const groups = NAV_GROUPS.map((g) => ({
    ...g,
    rows: items.filter((n) => GROUP_OF_TAB.get(n.id) === g.id),
  })).filter((g) => g.rows.length);

  /* A tab whose id is in no group would otherwise be dropped from the
     sidebar without a sound. Listed last, under a heading that says so. */
  const loose = items.filter((n) => !GROUP_OF_TAB.has(n.id));

  return (
    <div className="flex flex-col gap-4">
      {groups.map((g, i) => (
        <div key={g.id}>
          {showLabels ? (
            /* The heading and a hairline that runs out to the edge. The
               label alone, at this size, had to be faint enough not to
               compete with the rows and was then too faint to read; the rule
               carries the division so the words do not have to. */
            <div className="mb-2 flex items-center gap-2 px-2.5">
              <p
                className="shrink-0 text-[9.5px] font-extrabold tracking-[0.12em]"
                style={{ color: "rgba(253,248,246,0.46)" }}
              >
                {g.label}
              </p>
              <span
                aria-hidden="true"
                className="h-px flex-1"
                style={{
                  background:
                    "linear-gradient(to left, rgba(255,255,255,0.13), transparent)",
                }}
              />
            </div>
          ) : (
            i > 0 && (
              <div
                aria-hidden="true"
                className="mx-auto mb-3 h-px w-7"
                style={{ background: "rgba(255,255,255,0.10)" }}
              />
            )
          )}
          <NavList items={g.rows} tab={tab} onGo={onGo} showLabels={showLabels} />
        </div>
      ))}
      {loose.length > 0 && (
        <div>
          {showLabels && (
            <p
              className="mb-1.5 px-2.5 text-[9.5px] font-extrabold uppercase tracking-[0.14em]"
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

/* The sidebar's own «المزيد». The phone bar has had one since there were
   more tabs than fit a row; the desktop list had nowhere to put a tab that
   belongs to the app without belonging to the day, so it gets the same
   disclosure. Closed by default and lit when the tab inside it is the one on
   screen, because a collapsed group that hides the current screen with no
   mark on it reads as the nav having lost it. Collapsed to icons the label
   goes and the row keeps its tooltip, like every other row up there. */
export function NavMore({ items, tab, onGo, showLabels }) {
  const inside = items.some((n) => n.id === tab);
  const [open, setOpen] = useState(inside);

  if (!items.length) return null;

  return (
    <div className="mt-1.5 flex flex-col gap-1.5">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        title={showLabels ? undefined : "المزيد"}
        className="los-nav flex items-center gap-3 rounded-xl border px-3 py-2.5 text-right transition-all duration-200"
        style={{
          borderColor: inside && !open ? `${T.cta}66` : "transparent",
          background:
            inside && !open
              ? `linear-gradient(135deg, ${T.cta}2E, ${T.cta}0F)`
              : "transparent",
          color: inside && !open ? T.ctaLift : T.muted,
        }}
      >
        <Menu size={18} strokeWidth={1.9} className="shrink-0" />
        {showLabels && (
          <>
            <span className="truncate text-[13.5px] font-bold">المزيد</span>
            <span className="mr-auto shrink-0 text-white/30">
              {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </span>
          </>
        )}
      </button>

      {open && (
        <div className={showLabels ? "pr-3" : ""}>
          <NavList items={items} tab={tab} onGo={onGo} showLabels={showLabels} />
        </div>
      )}
    </div>
  );
}

/* Reordering the nav itself, and deciding which tabs take a row at all.
   Drag for the mouse and ↑/↓ for a finger, the same pairing the habit list
   uses and for the same reason: HTML5 drag never fires on touch, so the
   arrows are the only path that works on a phone. The cut line is not
   decoration — the order also decides which four tabs reach the mobile bar,
   and that consequence is invisible from a desktop.

   Every tab is listed, pushed-back ones included and in their own place,
   because that place is what they come back to. The eye on each row is the
   push: it sends a tab behind «المزيد» and fetches it out again. The last
   four out front cannot be pushed — the bar needs them — and they say so on
   the button rather than failing silently when it is pressed. */
export function NavOrderEditor({ order, more, onChange, onMore, onReset }) {
  const [dragging, setDragging] = useState(null);
  const [over, setOver] = useState(null);
  /* Which row is allowed to start a drag right now, and it is only ever the
     one whose grip is under the finger. A row that is `draggable` outright
     swallows the clicks of the buttons inside it: Chrome reads the press on
     the button as the start of a drag the moment the pointer moves a pixel,
     the drag is then cancelled because nothing was dropped, and no click
     event is ever fired — a button that works on a perfectly still hand and
     does nothing on any other. The grip arms it, the drag disarms it. */
  const [grip, setGrip] = useState(null);
  const items = orderedNav(order);
  const ids = items.map((n) => n.id);
  const behind = new Set(navSplit(order, more).behind);
  const atFloor = ids.length - behind.size <= TAB_BAR;
  const pristine =
    ids.join() === NAV_IDS.join() &&
    behind.size === MORE_IDS.length &&
    MORE_IDS.every((id) => behind.has(id));

  /* The divider goes after the fourth tab that actually takes a row — the
     pushed-back ones never reach the bar, so counting raw positions would
     draw the line in the wrong place the moment one of them sits above it. */
  const mainIds = ids.filter((id) => !behind.has(id));
  const cutAfter = mainIds.length > TAB_BAR ? mainIds[TAB_BAR - 1] : null;

  return (
    <div className="flex flex-col gap-1.5">
      {items.map((n, i) => {
        const Icon = n.icon;
        const isOver = over === n.id && dragging && dragging !== n.id;
        const hidden = behind.has(n.id);
        const stuck = !hidden && atFloor; // the bar still needs this one
        return (
          <React.Fragment key={n.id}>
            <div
              draggable={grip === n.id}
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", n.id);
                e.dataTransfer.effectAllowed = "move";
                setDragging(n.id);
              }}
              onDragEnd={() => {
                setDragging(null);
                setOver(null);
                setGrip(null);
              }}
              onDragOver={(e) => {
                if (!dragging || dragging === n.id) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setOver(n.id);
              }}
              onDragLeave={() => setOver((o) => (o === n.id ? null : o))}
              /* Belt and braces on the disarm: a press on the grip that ends
                 anywhere in the row, or wanders out of it, puts `draggable`
                 back. A row left armed is a row whose buttons stop clicking,
                 which is the whole fault this guards against. */
              onMouseUp={() => setGrip(null)}
              onMouseLeave={() => setGrip(null)}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                const id = e.dataTransfer.getData("text/plain");
                if (id) onChange(moveBefore(ids, id, n.id));
              }}
              className="flex items-center gap-2 rounded-xl border px-2 py-2 transition-all duration-200"
              style={{
                borderColor: isOver ? T.cta : T.border,
                background: isOver ? `${T.cta}1F` : "rgba(255,255,255,0.04)",
                opacity: dragging === n.id ? 0.4 : hidden ? 0.55 : 1,
              }}
            >
              <span
                aria-hidden="true"
                onMouseDown={() => setGrip(n.id)}
                onMouseUp={() => setGrip(null)}
                className="shrink-0 text-white/25"
                style={{ cursor: "grab" }}
              >
                <GripVertical size={13} />
              </span>
              <Icon size={15} strokeWidth={1.9} className="shrink-0" style={{ color: T.muted }} />
              {/* The short label here, not the long one: the row carries a
                  grip, a button with a word on it and two arrows inside a
                  sidebar, and the full «أهدافي على ثلاث سنوات» truncated to
                  three letters tells you less than «الأهداف» whole. */}
              <span className="min-w-0 flex-1 truncate text-[12px] font-bold text-white/80">
                {n.short}
              </span>
              {/* A word, not a glyph. This was a bare ☰ for one build and it
                  sat in the same row as the drag grip, which is also two
                  short lines at 13px — so the control that moves a tab was
                  indistinguishable from the one that does nothing when you
                  click it. The button says which way it goes. */}
              <button
                onClick={() =>
                  onMore(
                    hidden
                      ? [...behind].filter((id) => id !== n.id)
                      : [...behind, n.id],
                  )
                }
                disabled={stuck}
                aria-pressed={hidden}
                title={
                  stuck
                    ? "شريط الجوال يحتاج أربعة تبويبات — أعِد واحدًا من «المزيد» أولًا"
                    : hidden
                      ? `إعادة ${n.label} إلى القائمة`
                      : `نقل ${n.label} إلى «المزيد»`
                }
                className="shrink-0 rounded-lg border px-2 py-1 text-[9.5px] font-bold transition-all disabled:pointer-events-none disabled:opacity-25"
                style={{
                  color: hidden ? T.accent : T.faint,
                  borderColor: hidden ? `${T.accent}59` : T.border,
                  backgroundColor: hidden ? `${T.accent}1A` : "transparent",
                }}
              >
                {hidden ? "للقائمة" : "للمزيد"}
              </button>
              <button
                onClick={() => onChange(nudgeInList(ids, n.id, "up"))}
                disabled={i === 0}
                aria-label={`تحريك ${n.label} لأعلى`}
                className="shrink-0 rounded p-1 text-white/30 transition-all hover:text-white/80 disabled:pointer-events-none disabled:opacity-20"
              >
                <ChevronUp size={13} />
              </button>
              <button
                onClick={() => onChange(nudgeInList(ids, n.id, "down"))}
                disabled={i === items.length - 1}
                aria-label={`تحريك ${n.label} لأسفل`}
                className="shrink-0 rounded p-1 text-white/30 transition-all hover:text-white/80 disabled:pointer-events-none disabled:opacity-20"
              >
                <ChevronDown size={13} />
              </button>
            </div>

            {n.id === cutAfter && (
              <div className="flex items-center gap-2 py-0.5">
                <span
                  className="h-px flex-1"
                  style={{ background: `${T.accent}4D` }}
                />
                <span
                  className="shrink-0 text-[9.5px] font-bold"
                  style={{ color: T.accent }}
                >
                  آخر ما يظهر على شريط الجوال
                </span>
                <span
                  className="h-px flex-1"
                  style={{ background: `${T.accent}4D` }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}

      <button
        onClick={onReset}
        disabled={pristine}
        className="mt-1 self-start rounded-lg px-2 py-1 text-[10.5px] transition-colors hover:text-white/70 disabled:pointer-events-none disabled:opacity-30"
        style={{ color: T.faint }}
      >
        استعادة الترتيب الأصلي
      </button>
    </div>
  );
}

export function BottomTabs({ items, more: behind, tab, onGo, onSettings }) {
  const [more, setMore] = useState(false);
  const front = items.slice(0, TAB_BAR);
  /* The tabs past the fourth, then the ones that live here whatever the
     order says — the sheet is the only place either kind is reachable, so
     they share it. Appended last: an ordered tab the user pushed down is
     still a tab he put there, and a secondary one was never in his list. */
  const rest = [...items.slice(TAB_BAR), ...(behind || [])];
  const restActive = rest.some((n) => n.id === tab);

  const glass = {
    backgroundColor: `${T.bgDeep}E0`,
    backgroundImage:
      "linear-gradient(135deg, rgba(255,255,255,0.13), rgba(255,255,255,0.035))",
    borderColor: "rgba(255,255,255,0.16)",
    /* 14px rather than 24px: this bar floats over the scrolling column, so
       unlike the sidebar its backdrop genuinely changes on every frame of
       every scroll and the radius is paid each time. */
    backdropFilter: "blur(14px) saturate(160%)",
    boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.16), 0 20px 44px -16px rgba(0,0,0,0.95), 0 0 34px -16px ${T.cta}`,
  };

  const tabStyle = (on) => ({
    color: on ? T.ctaLift : T.faint,
    backgroundImage: on
      ? `linear-gradient(160deg, ${T.cta}40, ${T.cta}0D)`
      : "none",
    boxShadow: on ? `0 10px 22px -14px ${T.cta}` : "none",
  });

  return (
    <>
      {more && (
        <div className="fixed inset-0 z-[55] lg:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMore(false)}
          />
          <div
            className="los-in absolute inset-x-4 rounded-[26px] border p-3"
            style={{ ...glass, bottom: "calc(env(safe-area-inset-bottom, 0px) + 92px)" }}
          >
            <div className="grid grid-cols-2 gap-2">
              {rest.map((n) => {
                const on = n.id === tab;
                const Icon = n.icon;
                return (
                  <button
                    key={n.id}
                    onClick={() => {
                      onGo(n.id);
                      setMore(false);
                    }}
                    aria-current={on ? "page" : undefined}
                    className="los-tab flex items-center gap-2.5 rounded-2xl px-4 py-3 text-right transition-all duration-300"
                    style={tabStyle(on)}
                  >
                    <Icon size={17} strokeWidth={on ? 2.5 : 1.9} className="shrink-0" />
                    <span className="truncate text-[12.5px] font-bold">{n.short}</span>
                  </button>
                );
              })}
              <button
                onClick={() => {
                  onSettings();
                  setMore(false);
                }}
                className="los-tab flex items-center gap-2.5 rounded-2xl px-4 py-3 text-right transition-all duration-300"
                style={tabStyle(false)}
              >
                <Settings size={17} strokeWidth={1.9} className="shrink-0" />
                <span className="truncate text-[12.5px] font-bold">الإعدادات</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <nav
        aria-label="التنقّل الرئيسي"
        className="fixed inset-x-0 z-[56] flex justify-center px-4 lg:hidden"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)" }}
      >
        <div
          className="flex w-full max-w-md items-stretch gap-1 rounded-[26px] border p-1.5"
          style={glass}
        >
          {front.map((n) => {
            const on = n.id === tab;
            const Icon = n.icon;
            return (
              <button
                key={n.id}
                onClick={() => {
                  onGo(n.id);
                  setMore(false);
                }}
                aria-current={on ? "page" : undefined}
                className="los-tab relative flex flex-1 flex-col items-center justify-center gap-1 rounded-[20px] px-1 py-2 transition-all duration-300"
                style={tabStyle(on)}
              >
                {on && <Pip />}
                <Icon
                  size={19}
                  strokeWidth={on ? 2.6 : 1.9}
                  className={`shrink-0 transition-transform duration-300${
                    on ? " -translate-y-px scale-110" : ""
                  }`}
                />
                <span className="text-[9.5px] font-bold leading-none">{n.short}</span>
              </button>
            );
          })}
          <button
            onClick={() => setMore((m) => !m)}
            aria-expanded={more}
            aria-label="المزيد"
            className="los-tab relative flex flex-1 flex-col items-center justify-center gap-1 rounded-[20px] px-1 py-2 transition-all duration-300"
            style={tabStyle(more || restActive)}
          >
            {restActive && !more && <Pip />}
            <Menu
              size={19}
              strokeWidth={more || restActive ? 2.6 : 1.9}
              className="shrink-0"
            />
            <span className="text-[9.5px] font-bold leading-none">المزيد</span>
          </button>
        </div>
      </nav>
    </>
  );
}

/* Mobile navigation. Floats clear of the bottom edge so it reads as a
   separate pane of glass rather than a docked strip, and clears the home
   indicator via safe-area inset. */
/* The lit bar over the active tab. Declared out here, not inside
   `BottomTabs`: a component defined during render is a new type on every
   render, so React throws the old node away and builds a fresh one each
   time instead of updating it. */
function Pip() {
  return (
    <span
      aria-hidden="true"
      className="absolute top-0.5 h-[3px] w-7 rounded-full"
      style={{ background: T.ctaLift, boxShadow: `0 0 10px 1px ${T.cta}` }}
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
      <p
        className="truncate text-[12px] font-extrabold tabular-nums"
        style={{ color: T.fg, opacity: 0.85 }}
      >
        {time}
      </p>
      <p className="truncate text-[9.5px]" style={{ color: T.faint }}>
        {date}
      </p>
    </div>
  );
}

/* Reordering by id, shared by the drag path and the arrows. Kept generic
   because the habit list already has its own group-aware versions — these
   two are for a flat list of ids and nothing else. */
const moveBefore = (ids, dragId, targetId) => {
  if (dragId === targetId) return ids;
  const rest = ids.filter((i) => i !== dragId);
  const at = rest.indexOf(targetId);
  return at < 0 ? ids : [...rest.slice(0, at), dragId, ...rest.slice(at)];
};

const nudgeInList = (ids, id, dir) => {
  const i = ids.indexOf(id);
  const j = i + (dir === "up" ? -1 : 1);
  if (i < 0 || j < 0 || j >= ids.length) return ids;
  const next = ids.slice();
  next[i] = ids[j];
  next[j] = ids[i];
  return next;
};
