import { BreakerModule } from "./life-breaker.jsx";
import { T, GLASS, useBurst, Card, Btn, Field, Badge, Modal, StarRating, Checkbox, ProgressRing, whenWord, NumStep, DateField, TimeField, DOW_AR, arCount, dayWord, daysPhrase, minWord, stepWord, meetWord, timesWord, fallWord, taskWord, tasksPhrase, forgivenPhrase, countedWord, prettyTime, AR_MONTHS, WEEK_LABELS, arDate, coursesIn, courseIn, courseName, daySections, nextSection, useMinuteClock, GROUPS, groupOf, PRAYERS, clockAt, nextPrayer, cupWord, shrinkImage, Since, READ_KEY, useDailyQuote, UndoBus, useUndo, UndoToast } from "./life-shared.jsx";
import { uniKindOf, uniDue, UniModule } from "./life-uni.jsx";
import { TopThree, useHabitTick, ReadLogModal, TaskChip, ReflectionModal } from "./life-day.jsx";
import { FinanceModule } from "./life-finance.jsx";
import { DeepWorkModule } from "./life-desks.jsx";
import { DataHealth, RecoveryModal } from "./life-tools.jsx";
import { SkyBackdrop, useSkyPhase, AppStyles, SecondWindow } from "./life-styles.jsx";
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { createRoot } from "react-dom";
import {
  Menu,
  X,
  Network,
  ListChecks,
  LayoutGrid,
  Library,
  BarChart3,
  Plus,
  Pencil,
  Trash2,
  Check,
  Star,
  Flame,
  Quote,
  CalendarDays,
  ChevronRight,
  ChevronLeft,
  Target,
  Clock,
  Zap,
  Trash,
  Sunrise,
  GripVertical,
  RotateCcw,
  TrendingUp,
  ImagePlus,
  MoonStar,
  HeartPulse,
  Briefcase,
  Wallet,
  Users,
  Sparkles,
  Flag,
  Settings,
  Timer,
  Play,
  Pause,
  Download,
  Upload,
  Coins,
  Lightbulb,
  NotebookPen,
  ScanFace,
  Copy,
  CheckCheck,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  MessageSquareQuote,
  ShieldOff,
  ShieldCheck,
  HeartCrack,
  LifeBuoy,
  Hourglass,
  AlertTriangle,
  Crosshair,
  Gauge,
  Radar,
  Send,
  Rocket,
  Lock,
  Award,
  FileSpreadsheet,
  Database,
  Presentation,
  Languages,
  Calculator,
  UserSearch,
  Search,
  Handshake,
  GraduationCap,
  Milestone,
  ClipboardList,
  Mail,
  FileText,
  Megaphone,
  Building2,
  ExternalLink,
  MessageSquare,
  BadgeCheck,
  Phone,
  HandCoins,
  BookOpenCheck,
  ClipboardCheck,
  Brain,
  Smartphone,
  BatteryLow,
  CloudRain,
  Mountain,
  HelpCircle,
  Frown,
  Snail,
  Wind,
  Eye,
  Minus,
  MapPin,
  Repeat,
  Bell,
  CalendarClock,
  CalendarPlus,
  School,
  AlarmClock,
  CircleDot,
  Hash,
  SquarePen,
  Droplets,
  Compass,
  Telescope,
  CalendarRange,
  Link2,
  Layers,
  TrendingDown,
  History,
  Archive,
  Footprints,
  Feather,
} from "lucide-react";

import { blockAt, fixHour, prayerTimes } from "./prayer-times.mjs";

/* --- persistence ------------------------------------------------------ */
/* Every name this file reads off the storage module, and the list is checked
   by a test rather than by eye. `api`, `UI_KEY`, `OPENED_KEY` and
   `HANDOVER_KEY` were all left out of it once, and because each of their four
   call sites sits inside the try/catch that storage code is required to have,
   not one of them said a word: `pullDisk` threw on `api` before it could read
   the disk, so a fresh profile booted on seed data at revision 0 and every
   save after it was refused as a conflict. A missing import here is not a
   crash, it is a feature that quietly stops existing. */
import { dropDeadBackups, api, REV_KEY, UI_KEY, OPENED_KEY, HANDOVER_KEY, STORAGE_KEY, served, strayCopy, syncLocal, readRev, writeRev, DISK_STUCK_MS, onSyncResult, postSync, syncOut, flushSync, adoptDisk, tabId, readLock, writeLock, dropLock, claimHandover, LEASE_BEAT, LEASE_STALE } from "./life-storage.mjs";

/* The state itself — the day boundary, the seeds, the shapes, the migration
   and the discipline score — lives in ./life-state.mjs so that `node --test`
   can load it without a browser and without React. esbuild folds it back in,
   so the page the build ships is still one file. Everything that module holds
   is exported and everything the screens use is imported here by name; a
   helper left behind is a ReferenceError at first render, which is a blank
   white page. */
import {
  badHabitShape,
  blockRank,
  bookShape,
  carryOf,
  clampGoal,
  coreOf,
  CORE_CAP,
  COST_TYPES,
  costType,
  currentQuarter,
  dayKey,
  disciplineOf,
  EVENT_KINDS,
  eventShape,
  fmtDay,
  freshState,
  GOAL_YEARS,
  goalShape,
  hhmm,
  HISTORY_CAP,
  HORIZONS,
  isGap,
  isKey,
  keyToDate,
  logicalNow,
  migrate,
  moodOf,
  MORE_IDS,
  NAV_IDS,
  navSplit,
  NAV_GROUPS,
  GROUP_OF_TAB,
  obj,
  orderNavIds,
  parentHorizon,
  PILLARS,
  PLACE_BY_ID,
  pctOfRow,
  PLACES,
  placeShape,
  QUARTERS,
  READ_ACTIVE,
  remainingIn,
  REPEATS,
  rollDay,
  rows,
  SCHEMA,
  setDayDone,
  scoredOf,
  streakBaseFrom,
  streakRunFrom,
  habitShape,
  HABIT_MIN_MAX,
  comebackFrom,
  COMEBACK_MIN,
  TAB_BAR,
  tagOf,
  TOP_TASK_CAP,
  taskShape,
  capToday,
  STEP_MAX,
  tomorrowKey,
  prepShape,
  prepPickAdd,
  prepPickDrop,
  prepPickEvent,
  prepReady,
  STREAK_TARGET,
  uid,
  UNI_TASK_KINDS,
  uniDayOf,
  uniPending,
  uniShape,
  URGE_MOODS,
  URGE_TAGS,
  urgeShape,
  VISION_MAX,
  WARN_CHOICES,
  WATER_GOAL_MAX,
  WORD_MAX,
  yesterdayKey,
  daysBetween,
  stamp,
  daysTo,
  bandAt,
  bandOf,
  cleanDays,
  bleedSaved,
  bestRun,
  MIRROR_MIN,
  breakerEvents,
  weakSpots,
  tagFallRate,
  dangerWatch,
  breakerToday,
  inReflectWindow,
  REFLECT_SNOOZE_MS,
  REFLECT_MAX_SHOWS,
  historyIndex,
  habitStreak,
  habitBest,
  habitTally,
  habitStrip,
  levelOf,
  bookForHabit,
  sumPages,
  readStreak,
  pctOf,
  quarterOf,
  pillarOf,
  horizonOf,
  goalPct,
  goalEnd,
  windowOf,
  windowStand,
  openingWindow,
  minsIn,
  daysUntil,
  kindOf,
  repeatOf,
  isEventDone,
  eventsIn,
  upcoming,
  upcomingRows,
  alertsOf,
} from "./life-state.mjs";

/* --- the icons, fastened on ------------------------------------------- *
 *  Every table of ids, labels and tints lives in life-state.mjs; a lucide
 *  component cannot, because importing one would stop `node --test` loading
 *  that module at all — which is the entire point of the split.
 *
 *  So the icons are set here, onto the very row objects the module exports
 *  rather than onto copies of them. The lookups that read those tables —
 *  `tagOf`, `costType`, `kindOf` and the rest — live on both sides of the
 *  split, and the screens read `.icon` off whatever they hand back. A copy
 *  would give every lookup on the module's side an iconless row and quietly
 *  blank half the screens. Done once, at module load, long before a render.
 * --------------------------------------------------------------------- */
const fastenIcons = (list, icons) => {
  for (const row of list) row.icon = icons[row.id];
  return list;
};
fastenIcons(PILLARS, {
  faith: MoonStar,
  health: HeartPulse,
  career: Briefcase,
  money: Wallet,
  social: Users,
  self: Sparkles,
});
fastenIcons(HORIZONS, {
  h3: Telescope,
  year: CalendarRange,
  quarter: Target,
});
fastenIcons(COST_TYPES, {
  money: Coins,
  time: Hourglass,
});
fastenIcons(URGE_TAGS, {
  big: Mountain,
  unclear: HelpCircle,
  fear: Frown,
  phone: Smartphone,
  bored: Snail,
  tired: BatteryLow,
  stress: CloudRain,
  lonely: Eye,
  people: Users,
  free: Wind,
});
fastenIcons(EVENT_KINDS, {
  exam: GraduationCap,
  deadline: ClipboardList,
  class: Presentation,
  meet: Handshake,
  money: HandCoins,
  social: Sparkles,
  travel: Rocket,
  note: NotebookPen,
});
fastenIcons(UNI_TASK_KINDS, {
  assign: ClipboardList,
  quiz: ClipboardCheck,
  mid: FileText,
  final: GraduationCap,
  project: Rocket,
  present: Presentation,
});

/* ==================================================================== *
 *  2027 LIFE OS — modular discipline system
 *  React + Tailwind CSS + lucide-react. Single file, no other deps.
 *  Install: npm i lucide-react
 *
 *  Note on Shadcn UI: shadcn is a set of components you copy into a
 *  project via its CLI (it compiles down to Radix UI + Tailwind), not a
 *  package you can import. The primitives below (Card, Btn, Field,
 *  Modal, Badge) follow shadcn's token model and API shape so this file
 *  stays dependency-free and drops straight into any React app.
 * ==================================================================== */


/* The failure banner shouts; nothing ever said the quiet half. A tick that
   lands and is never confirmed looks exactly like one that was dropped, and
   this app is the kind a person leaves open for days and trusts blindly.

   Two destinations, said separately, because they fail separately. The
   browser is the working copy; the disk is the copy that survives the
   browser. For a while this said «محفوظ» off the browser write alone, so a
   sync server that had been off for two days read exactly like one keeping
   up. Both timestamps are the writes' own — set when each one returned,
   never guessed from a render. */
function SaveStamp({ at, diskAt, diskStuck }) {
  if (!at) return null;
  const clock = (ms) =>
    new Date(ms).toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  const pill = (tone, key, children) => (
    <span
      key={key}
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold"
      style={{
        borderColor: `${tone}44`,
        color: tone,
        backgroundColor: `${tone}14`,
      }}
    >
      {children}
    </span>
  );
  return (
    <span className="mt-2.5 inline-flex flex-wrap items-center gap-1.5">
      {pill(
        T.primary,
        "browser",
        <>
          <Check size={10} strokeWidth={3.2} />
          {"المتصفح "}
          <span dir="ltr" className="tabular-nums">
            {clock(at)}
          </span>
        </>,
      )}
      {diskStuck
        ? pill(
            T.accent,
            "disk",
            <>
              <AlertTriangle size={10} strokeWidth={3} />
              {"القرص متوقف"}
            </>,
          )
        : diskAt
          ? pill(
              T.sky,
              "disk",
              <>
                <Database size={10} strokeWidth={3} />
                {"القرص "}
                <span dir="ltr" className="tabular-nums">
                  {clock(diskAt)}
                </span>
              </>,
            )
          : null}
    </span>
  );
}

function NowStamp({ compact = false }) {
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

/* --- navigation ------------------------------------------------------ *
 *  Which tabs exist, and in what order, is `NAV_IDS` in life-state.mjs —
 *  the migration needs that list and cannot import a lucide component. The
 *  label and the icon are here, keyed by the same ids, and the array is built
 *  from the canonical order: a tab added there with no entry here renders
 *  nameless, which is a bug you see on the first open rather than one that
 *  hides in a saved payload.
 * --------------------------------------------------------------------- */
const NAV_META = {
  today: { label: "اليوم", short: "اليوم", icon: Compass },
  routine: { label: "الروتين اليومي", short: "الروتين", icon: ListChecks },
  agenda: { label: "التقويم", short: "التقويم", icon: CalendarDays },
  uni: { label: "الجامعة", short: "الجامعة", icon: GraduationCap },
  matrix: { label: "مصفوفة المهام", short: "المهام", icon: LayoutGrid },
  deep: { label: "العمل العميق", short: "التركيز", icon: Timer },
  goals: { label: "أهدافي على ثلاث سنوات", short: "الأهداف", icon: Flag },
  finance: { label: "الدخل والمشاريع", short: "الدخل", icon: Wallet },
  vault: { label: "مكتبة الإنجازات", short: "المكتبة", icon: Library },
  analytics: { label: "التتبع الشهري", short: "التتبع", icon: BarChart3 },
  breaker: { label: "كاسر العادات", short: "الكسر", icon: ShieldOff },
  graph: { label: "خريطة المعرفة", short: "الخريطة", icon: Network },
};
const NAV = NAV_IDS.map((id) => ({ id, ...NAV_META[id] }));
const NAV_BY_ID = new Map(NAV.map((n) => [n.id, n]));


/* The saved order, resolved to tabs. `orderNavIds` does the hard part —
   dropping an id this build no longer has, appending a tab the saved order
   has never seen, taking a duplicate once — and this only puts the label and
   the icon back on. */
const orderedNav = (order) => orderNavIds(order).map((id) => NAV_BY_ID.get(id));

/* His order cut in two, with the labels and the icons put back on each side:
   the tabs that take a row, and the tabs that answer only from «المزيد». */
const splitNav = (order, more) => {
  const { main, behind } = navSplit(order, more);
  return {
    main: main.map((id) => NAV_BY_ID.get(id)),
    behind: behind.map((id) => NAV_BY_ID.get(id)),
  };
};

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


/* The horizon a goal's parent must belong to. The top of the chain has none,
   which is also how the editor knows to hide the parent picker. */
const ARC_LABEL = "٢٠٢٧ — ٢٠٢٩";


/* --- Eisenhower quadrants -------------------------------------------- */
const QUADRANTS = [
  {
    id: "q1",
    label: "عاجل ومهم",
    action: "افعلها الآن",
    tint: "#FF3B5C",
    icon: Zap,
  },
  {
    id: "q2",
    label: "مهم غير عاجل",
    action: "جدولها — هنا يُصنع الـ ٢٠٪",
    tint: "#00C2FF",
    icon: Target,
  },
  {
    id: "q3",
    label: "عاجل غير مهم",
    action: "فوّضها أو قلّصها",
    tint: "#FFB020",
    icon: Clock,
  },
  {
    id: "q4",
    label: "غير عاجل وغير مهم",
    action: "احذفها بلا تردد",
    tint: "rgba(255,255,255,0.3)",
    icon: Trash,
  },
];


/* The current band, re-checked once a minute and again whenever the tab is
   looked at. A background tab throttles its intervals hard, and the guard
   that matters most is the one already waiting when the user comes back. */
function useHourBand() {
  const [id, setId] = useState(() => bandAt(new Date().getHours()).id);
  useEffect(() => {
    const check = () => setId(bandAt(new Date().getHours()).id);
    const t = setInterval(check, 60000);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);
  return id;
}


/* --- the countdown ---------------------------------------------------- *
 *  A horizon with no clock on it is a wish. These two functions are the only
 *  place a window's span is computed, so the goals screen and the routine
 *  strip can never disagree about how much of it is left.
 * ---------------------------------------------------------------------- */


/* The seed, written as the tree it actually is so the links between the three
   horizons are real rather than implied. `kids` is flattened away on build —
   nothing downstream of here knows about nesting; a goal only ever knows the
   one id above it, which is what keeps a reparent from having to rewrite a
   subtree. */

/* ==================================================================== *
 *  CALENDAR — the months and the years
 *
 *  The routine screen owns today and the quarters own the year's goals;
 *  neither can answer «متى الاختبار؟». That is what this is for: a dated
 *  square you can put something important on, months or years ahead, and
 *  find again without having to remember it.
 * ==================================================================== */


/* ==================================================================== *
 *  UNIVERSITY — a desk, not a folder of reminders
 *
 *  A term is four things at once: a timetable he has to be in the right
 *  room for, a mark sheet he has to keep above a line, an absence count
 *  that can bar him from the final, and a GPA all of it rolls up into.
 *  Each one is nearly useless alone — a mark without its weight, or an
 *  absence without the cap, answers nothing. So they live on one screen
 *  and read from one another.
 * ==================================================================== */


function loadState() {
  if (typeof window === "undefined") return freshState();
  let raw = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return freshState(); // storage blocked outright — the session still works
  }
  if (!raw) return freshState();
  try {
    const saved = migrate(JSON.parse(raw));
    if (saved.date === dayKey()) return { ...freshState(carryOf(saved)), ...saved };
    return rollDay(saved);
  } catch {
    /* The payload exists but could not be read. Returning seed data here is
       safe only if the original survives: the save effect fires moments later
       and would overwrite it for good. A copy kept aside can still be
       repaired by hand; an overwritten one cannot. */
    try {
      window.localStorage.setItem(`${STORAGE_KEY}:broken-${Date.now()}`, raw);
    } catch {
      /* no room for the rescue copy either — nothing further to try */
    }
    return freshState();
  }
}

const readUI = () => {
  try {
    return JSON.parse(window.localStorage.getItem(UI_KEY) || "{}");
  } catch {
    return {};
  }
};

/* Holds the write lease for this window, or reports that another one has it.
   Returns the role and a way to take the lease off the other window.

   Three things keep it honest. The lease is re-read on a timer rather than
   trusted once, so a window that loses it stops writing on its own. The claim
   is read back immediately after writing, which settles the race when two
   windows open in the same instant — both write, one wins, and the loser sees
   a foreign id staring back. And a BroadcastChannel carries the handover at
   once, so the old holder stops in the same tick rather than at the end of
   its next interval. */
function useWriteLease() {
  const meRef = useRef(null);
  if (meRef.current === null) meRef.current = tabId();
  const me = meRef.current;

  /* Resolved before the first paint so the app never renders a writable
     screen it is about to take away. */
  /* Spent here, before the first lease read, so the window returning from a
     takeover is let straight through whatever the stored lease says. */
  const handedOverRef = useRef(null);
  if (handedOverRef.current === null)
    handedOverRef.current = typeof window === "undefined" ? false : claimHandover();

  const [role, setRole] = useState(() => {
    if (typeof window === "undefined") return "leader";
    if (handedOverRef.current) return "leader";
    const lock = readLock();
    const held =
      lock &&
      typeof lock.at === "number" &&
      lock.id !== me &&
      Date.now() - lock.at < LEASE_STALE;
    return held ? "follower" : "leader";
  });
  const roleRef = useRef(role);
  /* Whether this window has ever been the one locked out. A follower holds a
     snapshot taken before the other window started working, so the moment it
     is allowed to write is the moment that snapshot would land on top of an
     hour it never saw. See the reload below. */
  const wasFollowerRef = useRef(role === "follower");
  const reloadingRef = useRef(false);
  const set = useCallback((next) => {
    if (next === "follower") wasFollowerRef.current = true;
    if (roleRef.current === next) return;
    roleRef.current = next;
    setRole(next);
  }, []);

  const chanRef = useRef(null);

  useEffect(() => {
    let chan = null;
    try {
      chan = new BroadcastChannel("life-os-2027:lease");
      chan.onmessage = (e) => {
        /* Someone else announced a claim: step down now, not in two seconds. */
        if (e?.data?.claim && e.data.claim !== me) set("follower");
      };
      chanRef.current = chan;
    } catch {
      /* No BroadcastChannel — the poll below still covers it, just slower. */
    }

    /* The handover is honoured for the first tick only: this window takes the
       lease outright, the window it took it from sees a foreign id on its own
       next tick and steps down. After that the ordinary rules apply again. */
    let forced = handedOverRef.current;

    const tick = () => {
      if (reloadingRef.current) return;
      const lock = readLock();
      const held =
        lock && typeof lock.at === "number" && Date.now() - lock.at < LEASE_STALE;
      if (held && lock.id !== me && !forced) {
        set("follower");
        return;
      }
      /* The lease is free and this window was the locked-out one. It is now
         entitled to write, and that is precisely the danger: its `state` was
         loaded when it opened, before the other window did an hour of work,
         and the save effect fires on the very next render. Two clicks on the
         shortcut, an hour in the first window, then closing it, and the
         second window would quietly put the morning back the way it was.

         So it does not become the leader by promotion. It reloads, reads the
         payload the other window actually left behind, and comes up as the
         leader on that. `takeOver` already works this way for the same
         reason; this is the path nobody chose. Nothing is written before the
         reload — not the lease, not the state. */
      if (wasFollowerRef.current && !forced) {
        reloadingRef.current = true;
        window.location.reload();
        return;
      }
      forced = false;
      writeLock(me);
      /* Read back: two windows claiming in the same instant both get here,
         and only the one whose write landed last sees its own id. */
      const back = readLock();
      set(back && back.id !== me ? "follower" : "leader");
    };

    tick();
    const timer = setInterval(tick, LEASE_BEAT);
    /* Chrome throttles a hidden window's timers to once a minute after five
       minutes out of sight, and the lease goes stale in six seconds. So a
       minimised window has effectively lost its lease long before its own
       next tick tells it so — and the thing a person does next is bring it
       back and click something. Re-reading the lease the instant the window
       is looked at again is what closes that: by the time anything can be
       clicked, this window already knows whether it is still the holder. */
    const wake = () => {
      if (document.visibilityState === "visible") tick();
    };
    window.addEventListener("focus", wake);
    document.addEventListener("visibilitychange", wake);
    /* `pagehide` rather than `beforeunload`: it fires on mobile Safari's
       back-forward cache path too, where `beforeunload` does not. */
    const release = () => dropLock(me);
    window.addEventListener("pagehide", release);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", wake);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("pagehide", release);
      try {
        chan?.close();
      } catch {
        /* already gone */
      }
      release();
    };
  }, [me, set]);

  /* Claim, announce, then reload. The reload is the point: this window has
     been sitting on a snapshot taken before the other one made its changes,
     and writing that back is exactly the clobbering this whole mechanism
     exists to prevent. Coming back from disk is the only safe way in. */
  const takeOver = useCallback(() => {
    try {
      window.localStorage.setItem(HANDOVER_KEY, String(Date.now()));
    } catch {
      /* Storage blocked entirely — then nothing can be saved from any window
         and there is no lease to contend for in the first place. */
    }
    writeLock(me);
    try {
      chanRef.current?.postMessage({ claim: me });
    } catch {
      /* the other window's poll will catch it within LEASE_BEAT */
    }
    window.location.reload();
  }, [me]);

  return [role, takeOver];
}

/* ==================================================================== *
 *  Primitives (shadcn-shaped, dependency-free)
 * ==================================================================== */



/* ==================================================================== *
 *  MODULE 0 — اليوم
 *
 *  The screen the app opens on, and the only one that answers «وش عليّ
 *  الآن؟» without being asked twice. Nothing here is a new store: the
 *  prayers are computed, the three tasks are the same `TopThree` the routine
 *  shows, the habits are the same flat array ticked through the same
 *  `useHabitTick`, and the lectures and the deadlines are read off the
 *  university desk and the calendar where they already live. A second copy
 *  of any of it would be a second day that disagrees with the first.
 *
 *  It is deliberately short. A landing screen that lists everything is the
 *  fifteen-tab sidebar again with extra steps — what belongs here is what
 *  the next hour needs, and a way into the screen that owns the rest.
 * ==================================================================== */

/* How long a ticked habit stays on «اليوم» before it drops out of the list.
   Longer than the 700ms reward burst, so the animation finishes on a row
   that is still there. */
const REWARD_HOLD = 1100;

/* One habit, light. No drag, no arrows, no delete: this screen is for doing
   them, and the routine screen is where they are managed. The payout is the
   same, because a completion that animates nothing is a bug wherever it is
   ticked. */
function TodayHabit({ habit, book, onToggle, onToggleTiny, late = false }) {
  const [burst, fireBurst] = useBurst(700);
  const g = groupOf(habit.group);
  const Icon = g.icon;

  const handle = () => {
    if (!habit.done) fireBurst();
    onToggle();
  };

  /* Same payout as the full tick — see HabitRow. This screen is where a bad
     day is actually lived, so the floor has to be reachable here or it is a
     feature that only exists on the screen nobody opens at 23:40. */
  const handleTiny = () => {
    if (!habit.done) fireBurst();
    onToggleTiny();
  };

  return (
    <div
      className={`group flex items-center gap-2 rounded-xl border px-2 py-1 transition-all duration-200${
        burst ? " los-reward" : ""
      }`}
      style={{
        borderColor: burst
          ? T.primary
          : late
            ? `${T.accent}2E`
            : "rgba(255,255,255,0.07)",
        backgroundColor: burst
          ? `${T.primary}26`
          : late
            ? `${T.accent}0D`
            : "rgba(255,255,255,0.025)",
      }}
    >
      <span
        aria-hidden="true"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
        style={{
          borderColor: `${g.tint}33`,
          backgroundColor: `${g.tint}14`,
          color: g.tint,
        }}
        title={g.label}
      >
        <Icon size={13} />
      </span>
      <Checkbox
        checked={habit.done}
        onToggle={handle}
        label={habit.label}
        tint={T.primary}
        size="sm"
      />
      {/* Kept visible through the reward hold, when `done` has just flipped
          and the row is still on screen — a mark that vanishes under the
          finger that set it reads as a tap that did not land. */}
      {!!habit.min && (habit.tiny || !habit.done) && (
        <button
          onClick={handleTiny}
          title={`نسخة صغيرة: ${habit.min}`}
          aria-label={`إنجاز النسخة الصغيرة من ${habit.label}`}
          className="shrink-0 rounded p-1 opacity-50 transition-all duration-200 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          style={{ color: T.sky }}
        >
          <Feather
            size={12}
            style={habit.tiny ? { filter: `drop-shadow(0 0 5px ${T.sky}AA)` } : undefined}
          />
        </button>
      )}
      {habit.core && (
        <Star
          size={12}
          aria-label="عادة أساسية"
          className="shrink-0"
          fill={T.accent}
          style={{ color: T.accent, filter: `drop-shadow(0 0 5px ${T.accent}AA)` }}
        />
      )}
      {late && (
        <span
          className="shrink-0 rounded-md px-1.5 py-0.5 text-[9.5px] font-extrabold"
          style={{ backgroundColor: `${T.accent}1F`, color: T.accent }}
        >
          {g.label}
        </span>
      )}
      {book && (
        <span
          title={`مربوطة بـ«${book.title}»`}
          className="hidden shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] sm:inline-flex"
          style={{ backgroundColor: `${T.accent}1A`, color: T.accent }}
        >
          <Library size={10} />
          <span className="max-w-[7rem] truncate">{book.title}</span>
        </span>
      )}
    </div>
  );
}

/* A row on the two cards at the foot of the screen — a lecture, a
   deliverable, an exam. One shape for all three so the eye reads them the
   same way: a tint, what it is, and when. */
function TodayLine({
  tint,
  icon: Icon,
  title,
  sub,
  when,
  time,
  hot = false,
  now = false,
}) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-xl border px-2.5 py-2"
      style={{
        borderColor: now
          ? `${T.cta}59`
          : hot
            ? `${T.danger}3D`
            : "rgba(255,255,255,0.07)",
        backgroundColor: now
          ? `${T.cta}1A`
          : hot
            ? `${T.danger}0F`
            : "rgba(255,255,255,0.025)",
        boxShadow: now ? `0 0 22px -10px ${T.cta}` : "none",
      }}
    >
      <span
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
        style={{ borderColor: `${tint}33`, backgroundColor: `${tint}14`, color: tint }}
      >
        <Icon size={14} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold" style={{ color: T.fg }}>
          {title}
        </p>
        {sub && (
          <p className="truncate text-[10.5px]" style={{ color: T.faint }}>
            {sub}
          </p>
        )}
      </div>
      <div className="shrink-0 text-left">
        {time && (
          <p
            dir="ltr"
            className="text-[12px] font-extrabold tabular-nums"
            style={{ color: now ? T.ctaLift : hot ? T.danger : T.muted }}
          >
            {time}
          </p>
        )}
        {when && (
          <p className="text-[10px]" style={{ color: hot ? T.danger : T.faint }}>
            {when}
          </p>
        )}
      </div>
    </div>
  );
}

function TodayModule({
  state,
  setState,
  discipline,
  streak,
  onGo,
  onOpenSettings,
  onOpenTomorrow,
  comeback = 0,
  onCloseComeback,
}) {
  /* Every number on this screen is a function of the clock: the open block,
     the countdown to the next prayer, which lecture is running. One tick a
     minute re-reads them all. */
  useMinuteClock();
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const place = placeShape(state.place);
  const uni = state.uni || uniShape();

  const next = nextPrayer(place, now);
  /* The block the day is actually in, from the prayers rather than from
     clock hours — the same anchoring the six routine blocks use, because a
     screen that says «بعد العصر» ten minutes before العصر is a screen that
     has to be checked against another one. */
  const block = blockAt(place, now);
  const g = groupOf(block?.id);
  const BlockIcon = g.icon;

  const { toggle, logging, closeLog, logRead } = useHabitTick(state, setState);

  /* A habit ticked here leaves the list it was ticked from, and a row that
     vanishes under the finger animates nothing — the ripple, the pop and the
     emerald glow all play on a row that is no longer mounted. So the id is
     held for a moment longer than the animation and the row goes out after
     it, struck through. On a timer and never through requestAnimationFrame:
     a hidden tab does not run frames, and the reward would be swallowed and
     then replayed when the tab came back. */
  const [fading, setFading] = useState(() => new Set());
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const tick = (id, tiny = false) => {
    const h = (state.habits || []).find((x) => x.id === id);
    if (h && !h.done) {
      setFading((prev) => new Set(prev).add(id));
      timers.current.push(
        setTimeout(
          () =>
            setFading((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            }),
          REWARD_HOLD,
        ),
      );
    }
    toggle(id, tiny);
  };

  const habits = state.habits || [];
  const open = remainingIn(habits, block?.id, fading);
  /* His own order inside a block is his; across blocks the flat array can
     interleave them, so what is behind him is read in the order the day ran
     — earliest block first, which is also the order it has to be caught up
     in. */
  const missed = useMemo(
    () => open.missed.slice().sort((a, b) => blockRank(a.group) - blockRank(b.group)),
    [open.missed],
  );
  const doneCount = habits.filter((h) => h.done).length;
  const allDone = habits.length > 0 && doneCount === habits.length;

  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString("ar-EG", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [],
  );

  /* The weekday the timetable is read on is the wall clock's, not the
     logical day's: at 01:00 the logical day is still yesterday, and the
     lectures someone awake at that hour needs are the ones he is about to
     walk into. The weekday is printed under the heading for that exact
     reason — «اليوم» is ambiguous in those four hours and a named day is
     not. */
  const dow = now.getDay();
  const courses = useMemo(() => coursesIn(uni, uni.term), [uni]);
  const sections = useMemo(() => daySections(courses, dow, mins), [courses, dow, mins]);
  const ahead = useMemo(
    () => (sections.length ? null : nextSection(courses, dow, mins)),
    [sections.length, courses, dow, mins],
  );

  /* The university's deliverables and the calendar's exams and deadlines,
     in one list. Two sources, never copied into a third: a due date edited
     on either screen moves here in the same render. Overdue rows come first
     because the list is sorted by date and a date that has passed is the one
     that needs saying out loud. */
  const soon = useMemo(() => {
    const out = [];
    for (const t of uniPending(uni)) {
      const k = UNI_TASK_KINDS.find((x) => x.id === t.kind) || UNI_TASK_KINDS[0];
      const c = t.course ? courseIn(uni, t.course) : null;
      out.push({
        key: `u-${t.id}`,
        on: t.due,
        time: t.time,
        title: t.title || k.label,
        tint: k.tint,
        sub: [k.label, c ? courseName(c) : ""].filter(Boolean).join(" · "),
        go: "uni",
      });
    }
    for (const r of upcomingRows(state.events || [])) {
      if (r.ev.kind !== "exam" && r.ev.kind !== "deadline") continue;
      const k = kindOf(r.ev.kind);
      out.push({
        key: `e-${r.ev.id}-${r.on}`,
        on: r.on,
        time: r.ev.time,
        title: r.ev.title || k.label,
        tint: k.tint,
        sub: [k.label, r.ev.place].filter(Boolean).join(" · "),
        go: "agenda",
      });
    }
    out.sort((a, b) =>
      a.on === b.on
        ? (minsIn(a.time) ?? 1441) - (minsIn(b.time) ?? 1441)
        : a.on < b.on
          ? -1
          : 1,
    );
    return out;
  }, [uni, state.events]);

  const nearest = soon.slice(0, 4);

  /* Tomorrow's prep, read and never written here. `useMinuteClock` above is
     what makes the window live: the card appears when 20:00 arrives on a
     screen that was already open, instead of waiting for a reload. */
  const evening = inReflectWindow(now);
  const tomorrowOn = tomorrowKey();
  const prepared = useMemo(() => {
    const byId = new Map((state.tasks || []).map((t) => [t.id, t]));
    const events = state.events || [];
    return prepReady(state.tomorrow, state.tasks, tomorrowOn)
      .map((p) => ({
        task: byId.get(p.task),
        at: p.event ? events.find((e) => e.id === p.event)?.time || "" : "",
      }))
      .filter((r) => r.task);
  }, [state.tomorrow, state.tasks, state.events, tomorrowOn]);

  return (
    <div className="space-y-5">
      {/* First on the screen, above the ring and the score, because what it
          replaces is the first sentence the app says after a week away. */}
      {comeback > 0 && (
        <ComebackCard
          state={state}
          setState={setState}
          days={comeback}
          onTick={tick}
          onTickTiny={(id) => tick(id, true)}
          onClose={onCloseComeback}
        />
      )}

      {/* Where the day is, in one card: the date, the open block, the next
          prayer and the one score the day is judged by. */}
      <Card className="flex flex-col items-center gap-6 p-6 sm:p-7 lg:flex-row lg:justify-between">
        <div className="min-w-0 text-center lg:text-right">
          <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">
            اليوم
          </h2>
          <p className="mt-1.5 flex items-center justify-center gap-2 text-xs text-white/40 lg:justify-start">
            <CalendarDays size={13} /> {dateLabel}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 lg:justify-start">
            <span
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[12px] font-extrabold"
              style={{
                borderColor: `${g.tint}3D`,
                backgroundColor: `${g.tint}14`,
                color: g.tint,
              }}
            >
              <BlockIcon size={14} /> {g.label}
            </span>
            {next && (
              <button
                onClick={onOpenSettings}
                title="تغيير المدينة"
                className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[12px] transition-colors hover:bg-white/[0.06]"
                style={{ borderColor: `${T.violet}3D`, backgroundColor: `${T.violet}12` }}
              >
                <MoonStar size={14} style={{ color: T.violet }} />
                <span style={{ color: T.muted }}>
                  {next.tomorrow ? "فجر غدٍ" : next.label}
                </span>
                <span
                  dir="ltr"
                  className="font-extrabold tabular-nums"
                  style={{ color: T.cta }}
                >
                  {clockAt(next.at / 60)}
                </span>
                <span className="text-[10.5px]" style={{ color: T.faint }}>
                  {next.left >= 60
                    ? `بعد ${Math.floor(next.left / 60)} س ${next.left % 60} د`
                    : `بعد ${next.left} د`}
                </span>
              </button>
            )}
            {/* Hidden while the comeback card is up. A zero beside a flame
                is a verdict, and the one thing someone opening this after a
                week away must not be handed first is a verdict. It is back
                the moment the card is closed. */}
            {comeback === 0 && (
              <span
                className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[12px]"
                style={{ borderColor: T.border }}
              >
                <Flame size={14} style={{ color: streak > 0 ? T.ember : T.faint }} />
                <span className="font-extrabold tabular-nums">{streak}</span>
                <span className="text-[10.5px]" style={{ color: T.faint }}>
                  {countedWord(streak)}
                </span>
              </span>
            )}
          </div>
          <p className="mt-3 max-w-md text-xs leading-relaxed text-white/35">
            <span dir="ltr" className="font-extrabold tabular-nums">
              {doneCount} / {habits.length}
            </span>{" "}
            عادة اليوم. ما في هذه الشاشة هو ما تبقّى من يومك — والتفاصيل في
            شاشاتها.
          </p>
        </div>
        <ProgressRing value={discipline} size={150} />
      </Card>

      {/* The three. The same component the routine screen shows, not a copy
          of it: the cap is the rule, and one rule cannot have two
          renderings. */}
      <TopThree state={state} setState={setState} />

      {/* Tomorrow, asked for in the evening and nowhere else. Read-only
          here like everything on this screen — the picks, the steps and the
          hours all live where they already lived, and the card only says
          what is prepared and opens the screen that prepares it. */}
      {evening && (
        <Card
          className="p-5 sm:p-6"
          style={{
            borderColor: `${T.violet}59`,
            backgroundColor: `${T.violet}0D`,
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border"
                style={{
                  borderColor: `${T.violet}4D`,
                  background: `linear-gradient(160deg, ${T.violet}33, ${T.violet}0F)`,
                  color: T.violet,
                }}
              >
                <Sunrise size={18} strokeWidth={2.4} />
              </span>
              <div>
                <h3 className="text-[15px] font-extrabold" style={{ color: T.violet }}>
                  {prepared.length ? "غدك مجهّز" : "جهّز غدك"}
                </h3>
                {/* The count, never the word «ثلاث» — two picks announced as
                    three is the screen lying about the one number it
                    exists to carry. */}
                <p className="mt-0.5 text-[11px] leading-relaxed" style={{ color: T.faint }}>
                  {!prepared.length ? (
                    "اختر ثلاثًا الآن، وابدأ الغد بلا مساومة"
                  ) : tasksPhrase(prepared.length) ? (
                    <>
                      {tasksPhrase(prepared.length)} {arDate(tomorrowOn)}
                    </>
                  ) : (
                    <>
                      <span dir="ltr" className="font-bold tabular-nums">
                        {prepared.length}
                      </span>{" "}
                      {taskWord(prepared.length)} تنتظر {arDate(tomorrowOn)}
                    </>
                  )}
                </p>
              </div>
            </div>
            <Btn variant={prepared.length ? "outline" : "default"} size="sm" onClick={onOpenTomorrow}>
              {prepared.length ? "عدّل" : "ابدأ"} <ArrowLeft size={13} />
            </Btn>
          </div>

          {prepared.length > 0 && (
            <div className="mt-4 space-y-1.5">
              {prepared.map((r, i) => (
                <div
                  key={r.task.id}
                  className="flex items-start gap-2.5 rounded-xl border px-3 py-2"
                  style={{ borderColor: T.border }}
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold tabular-nums"
                    style={{ background: `${T.violet}26`, color: T.violet }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-bold text-white/80">
                      {r.task.text}
                    </p>
                    {!!r.task.step && (
                      <p
                        className="mt-0.5 flex items-start gap-1.5 text-[11px] leading-relaxed"
                        style={{ color: T.faint }}
                      >
                        <Footprints size={10} className="mt-[3px] shrink-0" />
                        <span>{r.task.step}</span>
                      </p>
                    )}
                  </div>
                  {!!r.at && (
                    <span
                      dir="ltr"
                      className="mt-0.5 shrink-0 text-[11px] font-extrabold tabular-nums"
                      style={{ color: T.violet }}
                    >
                      {prettyTime(r.at)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* What is still open, the block in front of you first. */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <h3
            className="flex items-center gap-2 text-[15px] font-extrabold"
            style={{ color: T.primaryLift }}
          >
            <ListChecks size={16} /> العادات المتبقية
          </h3>
          <div className="flex items-center gap-2">
            <Badge tint={allDone ? T.primary : T.cta}>
              <span dir="ltr" className="tabular-nums">
                {habits.length - doneCount}
              </span>
              {" متبقية"}
            </Badge>
            <Btn variant="ghost" size="sm" onClick={() => onGo("routine")}>
              الروتين <ArrowLeft size={13} />
            </Btn>
          </div>
        </div>

        {allDone ? (
          <p
            className="mt-4 rounded-xl border px-3.5 py-6 text-center text-[13px] font-bold leading-relaxed"
            style={{
              borderColor: `${T.primary}3D`,
              backgroundColor: `${T.primary}12`,
              color: T.primaryLift,
            }}
          >
            كل عادات اليوم تمّت. أغلق الشاشة واذهب — لا شيء ينتظرك هنا.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            <div>
              <p className="mb-2 text-[11px] font-bold" style={{ color: g.tint }}>
                {g.label} — الآن
              </p>
              {open.here.length ? (
                <div className="space-y-1.5">
                  {open.here.map((h) => (
                    <TodayHabit
                      key={h.id}
                      habit={h}
                      book={bookForHabit(h, state.books)}
                      onToggle={() => tick(h.id)}
                      onToggleTiny={() => tick(h.id, true)}
                    />
                  ))}
                </div>
              ) : (
                <p
                  className="rounded-xl border border-dashed px-3 py-3 text-center text-[11.5px]"
                  style={{ borderColor: T.border, color: T.faint }}
                >
                  لا شيء متبقٍّ في هذا البلوك.
                </p>
              )}
            </div>

            {/* Behind him, not hidden. A habit whose block has closed is
                still tickable — the day is not over until 04:00 — and a
                screen that drops it is a screen that quietly lowers the
                score without saying so. */}
            {missed.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-bold" style={{ color: T.accent }}>
                  فاتك في بلوكات مضت —{" "}
                  <span dir="ltr" className="tabular-nums">
                    {missed.length}
                  </span>
                </p>
                <div className="space-y-1.5">
                  {missed.slice(0, 5).map((h) => (
                    <TodayHabit
                      key={h.id}
                      habit={h}
                      book={bookForHabit(h, state.books)}
                      onToggle={() => tick(h.id)}
                      onToggleTiny={() => tick(h.id, true)}
                      late
                    />
                  ))}
                </div>
                {missed.length > 5 && (
                  <button
                    onClick={() => onGo("routine")}
                    className="mt-2 w-full rounded-xl border border-dashed py-2 text-[11.5px] transition-colors hover:bg-white/[0.06]"
                    style={{ borderColor: T.border, color: T.muted }}
                  >
                    وبقي{" "}
                    <span dir="ltr" className="tabular-nums">
                      {missed.length - 5}
                    </span>{" "}
                    — افتح الروتين
                  </button>
                )}
              </div>
            )}

            {open.later.length > 0 && (
              <p className="text-[11px]" style={{ color: T.faint }}>
                وأمامك{" "}
                <span dir="ltr" className="tabular-nums">
                  {open.later.length}
                </span>{" "}
                عادة في بلوكات لم تبدأ بعد.
              </p>
            )}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* The timetable, for one day only. */}
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3
                className="flex items-center gap-2 text-[15px] font-extrabold"
                style={{ color: T.sky }}
              >
                <School size={16} /> محاضرات اليوم
              </h3>
              <p className="mt-1 text-[10.5px]" style={{ color: T.faint }}>
                {uniDayOf(dow)?.label || "نهاية الأسبوع"}
              </p>
            </div>
            <Btn variant="ghost" size="sm" onClick={() => onGo("uni")}>
              الجامعة <ArrowLeft size={13} />
            </Btn>
          </div>

          <div className="mt-4 space-y-1.5">
            {sections.length ? (
              sections.map((r) => (
                <TodayLine
                  key={r.slot.id}
                  tint={r.course.tint}
                  icon={GraduationCap}
                  title={courseName(r.course)}
                  sub={[r.slot.room, r.course.instructor].filter(Boolean).join(" · ")}
                  time={`${prettyTime(r.slot.from)} – ${prettyTime(r.slot.to)}`}
                  when={r.now ? "الآن" : r.to <= mins ? "انتهت" : ""}
                  now={r.now}
                />
              ))
            ) : (
              <>
                <p
                  className="rounded-xl border border-dashed px-3 py-4 text-center text-[11.5px]"
                  style={{ borderColor: T.border, color: T.faint }}
                >
                  لا محاضرات اليوم.
                </p>
                {ahead && (
                  <TodayLine
                    tint={ahead.course.tint}
                    icon={CalendarClock}
                    title={courseName(ahead.course)}
                    sub={`القادمة · ${uniDayOf(ahead.slot.day)?.label || ""}`}
                    time={prettyTime(ahead.slot.from)}
                    when={ahead.inDays === 1 ? "غدًا" : ahead.inDays === 0 ? "اليوم" : ""}
                  />
                )}
              </>
            )}
          </div>
        </Card>

        {/* The nearest thing with a date on it. */}
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3
                className="flex items-center gap-2 text-[15px] font-extrabold"
                style={{ color: T.rose }}
              >
                <AlarmClock size={16} /> أقرب اختبار أو تسليم
              </h3>
              <p className="mt-1 text-[10.5px]" style={{ color: T.faint }}>
                من الجامعة والتقويم معًا
              </p>
            </div>
            <Btn variant="ghost" size="sm" onClick={() => onGo("agenda")}>
              التقويم <ArrowLeft size={13} />
            </Btn>
          </div>

          <div className="mt-4 space-y-1.5">
            {nearest.length ? (
              nearest.map((r) => {
                const left = daysUntil(r.on);
                return (
                  <button
                    key={r.key}
                    onClick={() => onGo(r.go)}
                    className="block w-full text-right"
                  >
                    <TodayLine
                      tint={r.tint}
                      icon={ClipboardList}
                      title={r.title}
                      sub={r.sub}
                      time={r.time ? prettyTime(r.time) : ""}
                      when={whenWord(r.on)}
                      hot={left !== null && left <= 1}
                    />
                  </button>
                );
              })
            ) : (
              <p
                className="rounded-xl border border-dashed px-3 py-4 text-center text-[11.5px]"
                style={{ borderColor: T.border, color: T.faint }}
              >
                لا تسليمات ولا اختبارات مسجّلة.
              </p>
            )}
          </div>
        </Card>
      </div>

      <ReadLogModal
        open={!!logging}
        book={logging ? bookForHabit(logging, state.books) : null}
        onClose={closeLog}
        onLog={logRead}
      />
    </div>
  );
}

/* ==================================================================== *
 *  MODULE 1 — Daily routine
 * ==================================================================== */
/* Habits live in one flat array and the blocks are a filtered view of it,
   so a move is a splice on that array — never a per-block list, which would
   drift out of sync with the order the archive and the discipline count read.
   Both callers below go through these two helpers for that reason. */

/* Drops `dragId` onto `targetId`, adopting the target's block. Dropping a
   habit on itself is a no-op rather than a reshuffle. */
function dropHabit(habits, dragId, targetId) {
  if (dragId === targetId) return habits;
  const from = habits.findIndex((h) => h.id === dragId);
  const target = habits.find((h) => h.id === targetId);
  if (from < 0 || !target) return habits;
  const moved = { ...habits[from], group: target.group };
  const rest = habits.filter((h) => h.id !== dragId);
  const at = rest.findIndex((h) => h.id === targetId);
  return [...rest.slice(0, at), moved, ...rest.slice(at)];
}

/* Drops a habit at the end of a block — the path for an empty block and for
   the header, which is the only target when a block has no rows yet. */
function dropHabitInGroup(habits, dragId, group) {
  const from = habits.findIndex((h) => h.id === dragId);
  if (from < 0) return habits;
  const moved = { ...habits[from], group };
  const rest = habits.filter((h) => h.id !== dragId);
  const last = rest.map((h) => h.group).lastIndexOf(group);
  const at = last < 0 ? rest.length : last + 1;
  return [...rest.slice(0, at), moved, ...rest.slice(at)];
}

/* Swaps a habit with its neighbour inside its own block. Touch has no HTML5
   drag, so these arrows — not the drag handle — are the reliable path on a
   phone, and they stay visible there instead of waiting for a hover. */
function nudgeHabit(habits, id, dir) {
  const me = habits.find((h) => h.id === id);
  if (!me) return habits;
  const idx = habits.map((h) => h.id).indexOf(id);
  const step = dir === "up" ? -1 : 1;
  for (let i = idx + step; i >= 0 && i < habits.length; i += step) {
    if (habits[i].group !== me.group) continue;
    const next = habits.slice();
    next[idx] = habits[i];
    next[i] = habits[idx];
    return next;
  }
  return habits;
}




function HabitRow({
  habit,
  linkedBook,
  streak = 0,
  onToggle,
  onToggleTiny,
  onEdit,
  onDelete,
  onNudge,
  onDrop,
  onToggleCore,
  first,
  last,
  dragging,
  onDragStart,
  onDragEnd,
}) {
  const [burst, fireBurst] = useBurst(700);
  const [over, setOver] = useState(false);

  const handle = () => {
    if (!habit.done) fireBurst();
    onToggle();
  };

  /* The same payout as the full tick, deliberately. A completion that
     animates less than the one beside it is a completion that reads as
     worth less, and the whole point of the floor is that taking it is not a
     defeat. */
  const handleTiny = () => {
    if (!habit.done) fireBurst();
    onToggleTiny();
  };

  const edge = over
    ? T.cta
    : burst
    ? T.primary
    : "transparent";

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", habit.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={() => {
        setOver(false);
        onDragEnd();
      }}
      onDragOver={(e) => {
        if (!dragging || dragging === habit.id) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(false);
        const id = e.dataTransfer.getData("text/plain");
        if (id) onDrop(id);
      }}
      className={`group flex items-center gap-1 rounded-lg border transition-all duration-200${
        burst ? " los-reward" : ""
      }`}
      style={{
        borderColor: edge,
        background: over
          ? `${T.cta}1F`
          : burst
          ? `${T.primary}26`
          : habit.done
          ? `${T.primary}0F`
          : "transparent",
        opacity: dragging === habit.id ? 0.4 : 1,
        cursor: "grab",
      }}
    >
      <span
        aria-hidden="true"
        className="shrink-0 pr-1 text-white/20 transition-colors group-hover:text-white/45"
      >
        <GripVertical size={13} />
      </span>
      <Checkbox
        checked={habit.done}
        onToggle={handle}
        label={habit.label}
        tint={T.primary}
      />
      {/* Amber, because being core is an achievement marker and not an action
          — and never emerald, which in this app means only that something was
          finished. Always visible once set, so the five can be read off the
          screen at a glance; faint and hover-revealed while unset, so twelve
          grey stars do not compete with the twelve checkboxes beside them. */}
      <button
        onClick={onToggleCore}
        title={habit.core ? "إزالة من الأساسيات" : "تعيين كعادة أساسية"}
        aria-label={`${habit.core ? "إزالة" : "تعيين"} ${habit.label} ${
          habit.core ? "من" : "ضمن"
        } الأساسيات`}
        aria-pressed={!!habit.core}
        className={`shrink-0 rounded p-1 transition-all duration-200${
          habit.core
            ? ""
            : " opacity-40 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        }`}
        style={{ color: habit.core ? T.accent : "rgba(255,255,255,0.25)" }}
      >
        <Star
          size={13}
          fill={habit.core ? T.accent : "none"}
          style={habit.core ? { filter: `drop-shadow(0 0 5px ${T.accent}AA)` } : undefined}
        />
      </button>
      {/* The floor, reachable in one tap from the row it belongs to. Shown
          only once a floor has actually been written: a second button on
          twenty-two rows that names nothing is twenty-two dead buttons. */}
      {!!habit.min && (habit.tiny || !habit.done) && (
        <button
          onClick={handleTiny}
          title={habit.tiny ? `أُنجزت كنسخة صغيرة: ${habit.min}` : `نسخة صغيرة: ${habit.min}`}
          aria-label={`${habit.tiny ? "إلغاء" : "إنجاز"} النسخة الصغيرة من ${habit.label}`}
          aria-pressed={!!habit.tiny}
          className={`shrink-0 rounded p-1 transition-all duration-200${
            habit.tiny
              ? ""
              : " opacity-40 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          }`}
          style={{ color: habit.tiny ? T.sky : "rgba(255,255,255,0.25)" }}
        >
          <Feather
            size={13}
            style={habit.tiny ? { filter: `drop-shadow(0 0 5px ${T.sky}AA)` } : undefined}
          />
        </button>
      )}
      {/* The run you are protecting, where you are protecting it. Two days is
          not a streak yet, so it stays quiet until there is something to
          lose — a badge that reads «١» next to every habit is noise. */}
      {streak >= 2 && (
        <span
          title={`${streak} ${dayWord(streak)} متتالية`}
          className="inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold"
          style={{
            background: streak >= 7 ? `${T.ember}24` : "rgba(255,255,255,0.05)",
            color: streak >= 7 ? T.ember : T.muted,
          }}
        >
          <Flame size={10} />
          <span dir="ltr" className="tabular-nums">
            {streak}
          </span>
        </span>
      )}
      {linkedBook && (
        <span
          title={`مربوطة بـ«${linkedBook.title}»`}
          className="hidden shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] sm:inline-flex"
          style={{ background: `${T.accent}1A`, color: T.accent }}
        >
          <Library size={10} />
          <span className="max-w-[7rem] truncate">{linkedBook.title}</span>
        </span>
      )}
      {/* Arrows, not the handle, are what works under a finger. */}
      <button
        onClick={() => onNudge("up")}
        disabled={first}
        aria-label={`تحريك ${habit.label} لأعلى`}
        className="shrink-0 rounded p-1 text-white/30 transition-all hover:text-white/80 disabled:pointer-events-none disabled:opacity-20"
      >
        <ChevronUp size={13} />
      </button>
      <button
        onClick={() => onNudge("down")}
        disabled={last}
        aria-label={`تحريك ${habit.label} لأسفل`}
        className="shrink-0 rounded p-1 text-white/30 transition-all hover:text-white/80 disabled:pointer-events-none disabled:opacity-20"
      >
        <ChevronDown size={13} />
      </button>
      <button
        onClick={onEdit}
        aria-label={`تعديل ${habit.label}`}
        className="shrink-0 rounded p-1.5 text-white/25 opacity-40 transition-all hover:text-white/70 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <Pencil size={13} />
      </button>
      <button
        onClick={onDelete}
        aria-label={`حذف ${habit.label}`}
        className="shrink-0 rounded p-1.5 text-white/25 opacity-40 transition-all hover:text-red-400 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

/* The motivation photo, in a card of its own above the cue. Stored in state
   rather than a side key so a backup carries it, and shrunk on the way in so
   it does not eat the storage quota the rest of the app depends on. */
function CueImageCard({ src, onChange }) {
  const fileRef = useRef(null);
  const [err, setErr] = useState(null);

  const pick = async (file) => {
    if (!file) return;
    setErr(null);
    try {
      onChange(await shrinkImage(file));
    } catch (e) {
      setErr(
        e?.message === "too-large"
          ? "الصورة كبيرة جدًا حتى بعد التصغير — اختر صورة أصغر."
          : "تعذّرت قراءة الصورة — جرّب صورة أخرى.",
      );
    }
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {src ? (
        <Card className="group relative overflow-hidden p-0">
          <img
            src={src}
            alt="صورتك التحفيزية"
            className="block max-h-[22rem] w-full object-cover"
          />
          <div className="absolute left-3 top-3 flex gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label="استبدال الصورة التحفيزية"
              title="استبدال الصورة"
              className="rounded-lg border p-2 backdrop-blur transition-all duration-200 hover:scale-105"
              style={{
                borderColor: `${T.cta}59`,
                background: `${T.bgDeep}B3`,
                color: T.cta,
              }}
            >
              <ImagePlus size={15} />
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label="حذف الصورة التحفيزية"
              title="حذف الصورة"
              className="rounded-lg border p-2 backdrop-blur transition-all duration-200 hover:scale-105"
              style={{
                borderColor: `${T.danger}59`,
                background: `${T.bgDeep}B3`,
                color: T.danger,
              }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </Card>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed py-4 text-[12.5px] font-bold transition-all duration-200 hover:scale-[1.01]"
          style={{
            borderColor: `${T.cta}4D`,
            background: `${T.cta}0D`,
            color: T.cta,
          }}
        >
          <ImagePlus size={15} /> أضف صورة تحفيزية
        </button>
      )}
      {err && (
        <p className="mt-2 text-center text-[11px]" style={{ color: T.danger }}>
          {err}
        </p>
      )}
    </>
  );
}

/* The cue list, editable. Seeded from QUOTES on first load, then entirely
   the user's: a deleted quote stays deleted through a day rollover, and the
   card falls back to an invitation rather than a blank when the list empties. */
function QuotesModal({ open, onClose, quotes, setState }) {
  const [draft, setDraft] = useState({ id: null, text: "", author: "" });
  const arm = useUndo();

  const commit = () => {
    const text = draft.text.trim();
    if (!text) return;
    const author = draft.author.trim() || "بلا نسبة";
    setState((s) => ({
      ...s,
      quotes: draft.id
        ? s.quotes.map((q) => (q.id === draft.id ? { ...q, text, author } : q))
        : [...s.quotes, { id: uid(), text, author }],
    }));
    setDraft({ id: null, text: "", author: "" });
  };

  const drop = (id) => {
    arm("حُذف الاقتباس", { quotes });
    setState((s) => ({ ...s, quotes: s.quotes.filter((q) => q.id !== id) }));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="عبارات التحفيز"
      footer={
        <Btn variant="outline" className="flex-1" onClick={onClose}>
          إغلاق
        </Btn>
      }
    >
      <div className="space-y-4">
        <div
          className="space-y-2.5 rounded-2xl border p-3.5"
          style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
        >
          <div>
            <label
              htmlFor="los-quote-text"
              className="mb-1.5 block text-xs text-white/45"
            >
              {draft.id ? "تعديل العبارة" : "عبارة جديدة"}
            </label>
            <Field
              id="los-quote-text"
              as="textarea"
              rows={2}
              className="resize-none leading-relaxed"
              value={draft.text}
              onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))}
              placeholder="اكتب العبارة التي تحرّكك"
            />
          </div>
          <div>
            <label
              htmlFor="los-quote-author"
              className="mb-1.5 block text-xs text-white/45"
            >
              القائل
            </label>
            <Field
              id="los-quote-author"
              value={draft.author}
              onChange={(e) => setDraft((d) => ({ ...d, author: e.target.value }))}
              placeholder="اتركه فارغًا إن لم تعرف القائل"
            />
          </div>
          <div className="flex gap-2">
            <Btn variant="default" size="sm" className="flex-1" onClick={commit}>
              <Plus size={14} strokeWidth={3} /> {draft.id ? "حفظ التعديل" : "إضافة"}
            </Btn>
            {draft.id && (
              <Btn
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setDraft({ id: null, text: "", author: "" })}
              >
                إلغاء
              </Btn>
            )}
          </div>
        </div>

        <div className="max-h-72 space-y-2 overflow-y-auto pl-1">
          {quotes.length === 0 ? (
            <p className="py-4 text-center text-[11.5px]" style={{ color: T.faint }}>
              القائمة فارغة — أضف عبارتك الأولى بالأعلى.
            </p>
          ) : (
            quotes.map((q) => (
              <div
                key={q.id}
                className="group flex items-start gap-2 rounded-xl border p-3 transition-colors duration-200"
                style={{
                  borderColor: draft.id === q.id ? `${T.accent}66` : T.border,
                  background:
                    draft.id === q.id ? `${T.accent}12` : "rgba(255,255,255,0.02)",
                }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-bold leading-relaxed">{q.text}</p>
                  <p className="mt-1 text-[10.5px]" style={{ color: T.accent }}>
                    — {q.author}
                  </p>
                </div>
                <button
                  onClick={() => setDraft({ id: q.id, text: q.text, author: q.author })}
                  aria-label={`تعديل: ${q.text}`}
                  className="shrink-0 rounded p-1.5 text-white/30 transition-colors hover:text-white/80"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => drop(q.id)}
                  aria-label={`حذف: ${q.text}`}
                  className="shrink-0 rounded p-1.5 text-white/30 transition-colors hover:text-red-400"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}

/* --- prayer times ----------------------------------------------------- *
 *  The six blocks of this routine are anchored to the prayers, so the times
 *  they are anchored to are shown beside them. Computed locally and never
 *  fetched — see `prayerTimes` for why that is not an optimisation but a
 *  requirement. Re-read once a minute, so the "next" marker and the counter
 *  move while the app sits open rather than waiting for a reload.
 * ---------------------------------------------------------------------- */
function PrayerCard({ place, onOpenSettings }) {
  useMinuteClock(); // the whole card is a function of the clock
  const now = new Date();
  const p = placeShape(place);
  /* Recomputed on every minute tick rather than memoised: it is a dozen trig
     calls, and a cache keyed on "the place and the day" would need the day
     in its own dependency list — which is the clock again, by a longer road. */
  const times = prayerTimes(p, now);
  const next = nextPrayer(p, now);
  const mins = now.getHours() * 60 + now.getMinutes();

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3
            className="flex items-center gap-2 text-[15px] font-extrabold"
            style={{ color: T.violet }}
          >
            <MoonStar size={16} /> أوقات الصلاة
          </h3>
          <button
            onClick={onOpenSettings}
            className="mt-1 inline-flex items-center gap-1 text-[10.5px] transition-colors hover:text-white/70"
            style={{ color: T.faint }}
            title="تغيير المدينة"
          >
            <MapPin size={10} /> {p.label}
            {p.asr === 2 && " · حنفي"}
          </button>
        </div>
        {next && (
          <div className="shrink-0 text-left">
            <p className="text-[10px]" style={{ color: T.faint }}>
              {next.tomorrow ? "فجر غدٍ بعد" : `${next.label} بعد`}
            </p>
            <p
              dir="ltr"
              className="text-[15px] font-extrabold tabular-nums"
              style={{ color: T.cta }}
            >
              {next.left >= 60
                ? `${Math.floor(next.left / 60)}:${String(next.left % 60).padStart(2, "0")}`
                : `${next.left} د`}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {PRAYERS.map((row) => {
          const t = times[row.id];
          const at = t === null || !Number.isFinite(t) ? null : fixHour(t) * 60;
          const on = !row.mark && next && next.id === row.id && !next.tomorrow;
          /* Passed, so it is behind you — dimmed rather than hidden, because
             «هل صليت العصر؟» is answered by seeing that it has gone by. */
          const past = at !== null && at <= mins;
          const Icon = row.icon;
          return (
            <div
              key={row.id}
              className="rounded-xl border px-2 py-2.5 text-center transition-all duration-300"
              style={{
                borderColor: on ? `${T.cta}80` : `${row.tint}2E`,
                background: on ? `${T.cta}1F` : `${row.tint}0D`,
                boxShadow: on ? `0 0 20px -8px ${T.cta}` : "none",
                opacity: past && !on ? 0.45 : 1,
              }}
            >
              <Icon
                size={13}
                className="mx-auto"
                style={{ color: on ? T.cta : row.tint }}
              />
              <p
                dir="ltr"
                className="mt-1 text-[13.5px] font-extrabold tabular-nums"
                style={{ color: on ? T.ctaLift : row.tint }}
              >
                {clockAt(t)}
              </p>
              <p className="truncate text-[9.5px]" style={{ color: on ? T.ctaLift : T.faint }}>
                {row.label}
              </p>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[10px] leading-relaxed" style={{ color: T.faint }}>
        محسوبة على طريقة أم القرى محليًّا — تعمل بلا إنترنت، ولا تُحمّل من أي
        خدمة.
      </p>
    </Card>
  );
}

/* --- water ------------------------------------------------------------ *
 *  A cup per glass, tapped to fill up to that point. Tapping the glass that
 *  is already the last full one takes it back off instead of doing nothing —
 *  a tracker you cannot correct is one you stop trusting after the first
 *  mis-tap. The count is per-day and resets with the rollover.
 * ---------------------------------------------------------------------- */
function WaterCard({ count, goal, onSet }) {
  const [burst, fireBurst] = useBurst(700);
  const n = Math.min(goal, Math.max(0, count || 0));
  const pct = goal ? Math.round((n / goal) * 100) : 0;
  const full = n >= goal;

  const tap = (i) => {
    const to = n === i ? i - 1 : i;
    if (to > n && to >= goal) fireBurst();
    onSet(to);
  };

  return (
    <Card className={`p-5 sm:p-6${burst ? " los-reward" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3
          className="flex items-center gap-2 text-[15px] font-extrabold"
          style={{ color: full ? T.primary : T.sky }}
        >
          <Droplets size={16} /> شرب الماء
        </h3>
        <span
          dir="ltr"
          className="shrink-0 rounded-lg px-2 py-0.5 text-[11.5px] font-extrabold tabular-nums"
          style={{
            background: full ? `${T.primary}1A` : "rgba(255,255,255,0.05)",
            color: full ? T.primary : T.muted,
          }}
        >
          {n} / {goal}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {Array.from({ length: goal }, (_, i) => {
          const on = i < n;
          return (
            <button
              key={i}
              onClick={() => tap(i + 1)}
              aria-label={`كوب ${i + 1}`}
              aria-pressed={on}
              title={`كوب ${i + 1}`}
              className="relative h-10 w-7 overflow-hidden rounded-b-lg rounded-t-sm border transition-all duration-200 hover:scale-110 active:scale-95"
              style={{
                borderColor: on ? `${T.sky}99` : T.border,
                background: "rgba(255,255,255,0.03)",
                boxShadow: on ? `0 0 14px -6px ${T.sky}` : "none",
              }}
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 transition-all duration-500"
                style={{
                  height: on ? "78%" : "0%",
                  backgroundImage: `linear-gradient(180deg, ${T.sky}CC, ${T.indigo}E6)`,
                }}
              />
            </button>
          );
        })}
      </div>

      <div
        className="mt-4 h-1.5 w-full overflow-hidden rounded-full"
        style={{ background: "rgba(255,255,255,0.07)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            backgroundImage: full
              ? `linear-gradient(90deg, ${T.primary}, ${T.primaryLift})`
              : `linear-gradient(90deg, ${T.sky}, ${T.indigo})`,
            boxShadow: pct ? `0 0 12px ${full ? T.primary : T.sky}99` : "none",
          }}
        />
      </div>
      <p
        className="mt-2.5 text-[10.5px] leading-relaxed"
        style={{ color: full ? T.primary : T.faint }}
      >
        {full ? (
          "بلغت هدفك اليوم 💧"
        ) : (
          <>
            بقي{" "}
            <span dir="ltr" className="tabular-nums">
              {goal - n}
            </span>{" "}
            {cupWord(goal - n)}
            {/* Only once there is something to undo. Offering the way back
                before the first cup is filled is an instruction with nothing
                to act on. */}
            {n > 0 && " — اضغط الكوب الممتلئ الأخير للتراجع."}
          </>
        )}
      </p>
    </Card>
  );
}

/* --- the habit ledger ------------------------------------------------- *
 *  The routine screen answers «ماذا عليّ اليوم؟». This answers the question
 *  that actually changes behaviour: «على أيّ عادة أصمد، وأيّها تسقط أولًا؟»
 *
 *  Every figure is derived from the archive — see `habitStreak` and friends.
 *  Nothing new is stored, so this view can never disagree with the history
 *  the calendar and the monthly tracker read from.
 * ---------------------------------------------------------------------- */
const LEDGER_WINDOWS = [
  { id: 30, label: "٣٠ يومًا" },
  { id: 90, label: "٩٠ يومًا" },
  { id: 0, label: "الكل" },
];

function HabitLedgerRow({ habit, by, win }) {
  const group = GROUPS.find((g) => g.id === habit.group);
  const tint = group?.tint || T.accent;
  const run = habitStreak(by, habit.id);
  const best = habitBest(by, habit.id);
  const { kept, asked, pct } = habitTally(by, habit.id, win);
  const strip = habitStrip(by, habit.id, 30);
  const hot = run >= 3;

  return (
    <div
      className="rounded-xl border px-3.5 py-3"
      style={{
        borderColor: hot ? `${T.ember}3D` : T.border,
        background: hot ? `${T.ember}0A` : "rgba(255,255,255,0.03)",
      }}
    >
      <div className="flex items-baseline gap-2">
        <p
          className="min-w-0 flex-1 truncate text-[12.5px] font-bold"
          style={{ color: T.fg }}
          title={habit.label}
        >
          {habit.label}
        </p>
        {run > 0 && (
          <span
            className="flex shrink-0 items-center gap-1 text-[11px] font-extrabold"
            style={{ color: hot ? T.ember : T.muted }}
            title={`${run} ${dayWord(run)} متتالية`}
          >
            <Flame size={11} className={hot ? "los-flame" : ""} />
            <span dir="ltr" className="tabular-nums">
              {run}
            </span>
          </span>
        )}
        {best > 0 && (
          <span
            className="flex shrink-0 items-center gap-1 text-[10.5px]"
            style={{ color: T.accent }}
            title={`أطول سلسلة: ${best} ${dayWord(best)}`}
          >
            <Star size={10} />
            <span dir="ltr" className="tabular-nums">
              {best}
            </span>
          </span>
        )}
        <span
          dir="ltr"
          className="w-9 shrink-0 text-left text-[12.5px] font-extrabold tabular-nums"
          style={{
            color: pct >= 80 ? T.primary : pct >= 50 ? T.accent : pct > 0 ? T.ember : T.faint,
          }}
        >
          {asked ? `${pct}%` : "—"}
        </span>
      </div>

      {/* Thirty days, oldest on the right because the page reads right to
          left: today is the dot nearest the left edge. */}
      <div className="mt-2.5 flex flex-row-reverse flex-wrap justify-end gap-[3px]">
        {strip.map((d) => (
          <span
            key={d.key}
            title={d.key}
            className="h-2.5 w-2.5 shrink-0 rounded-[3px] transition-colors"
            style={{
              background:
                d.state === "kept"
                  ? T.primary
                  : d.state === "missed"
                    ? `${T.danger}59`
                    : "rgba(255,255,255,0.06)",
              boxShadow: d.state === "kept" ? `0 0 6px ${T.primary}66` : "none",
            }}
          />
        ))}
      </div>

      <p className="mt-2 flex items-center gap-1.5 text-[9.5px]" style={{ color: T.faint }}>
        {group && <span style={{ color: tint }}>{group.label}</span>}
        {group && "·"}
        <span dir="ltr" className="tabular-nums">
          {kept}/{asked}
        </span>{" "}
        {dayWord(asked)}
      </p>
    </div>
  );
}

function HabitLedger({ state }) {
  const [win, setWin] = useState(30);
  const by = useMemo(() => historyIndex(state.history), [state.history]);
  const habits = state.habits || [];

  /* Sorted by what is standing, not alphabetically: the longest run at the
     top is the one to protect, and the bottom of the list is where the next
     percentage point is hiding. */
  const sorted = useMemo(() => {
    return habits
      .map((h) => ({ h, run: habitStreak(by, h.id), t: habitTally(by, h.id, win) }))
      .sort((a, b) => b.run - a.run || b.t.pct - a.t.pct)
      .map((x) => x.h);
  }, [habits, by, win]);

  const any = by.size > 0;

  return (
    <Card className="p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3
            className="flex items-center gap-2 text-[17px] font-extrabold"
            style={{ color: T.ctaLift }}
          >
            <Flame size={17} /> سجل العادات
          </h3>
          <p className="mt-1.5 max-w-xl text-[11.5px] leading-relaxed" style={{ color: T.faint }}>
            لكل عادة سلسلتها وأطول ما بلغته وثلاثون يومًا من سجلّها. المربّع
            الممتلئ يومٌ التزمت فيه، والباهت يومٌ لم تكن العادة فيه مطلوبة.
          </p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          {LEDGER_WINDOWS.map((w) => {
            const on = w.id === win;
            return (
              <button
                key={w.id}
                onClick={() => setWin(w.id)}
                aria-pressed={on}
                className="rounded-lg border px-2.5 py-1 text-[10.5px] font-bold transition-all duration-200"
                style={{
                  borderColor: on ? `${T.cta}80` : T.border,
                  background: on ? `${T.cta}1F` : "transparent",
                  color: on ? T.ctaLift : T.faint,
                }}
              >
                {w.label}
              </button>
            );
          })}
        </div>
      </div>

      {!any ? (
        <p
          className="mt-5 rounded-xl border border-dashed py-10 text-center text-[11.5px] leading-relaxed"
          style={{ borderColor: T.border, color: T.faint }}
        >
          لا سجلّ بعد — يبدأ العدّ من اليوم.
          <br />
          كل يوم تؤشّر فيه عادةً يضيف عمودًا هنا.
        </p>
      ) : sorted.length === 0 ? (
        <p className="mt-5 py-8 text-center text-[11.5px]" style={{ color: T.faint }}>
          لا عادات في روتينك بعد.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-2 lg:grid-cols-2">
          {sorted.map((h) => (
            <HabitLedgerRow key={h.id} habit={h} by={by} win={win} />
          ))}
        </div>
      )}
    </Card>
  );
}

/* --- choosing the five ------------------------------------------------ *
 *  A draft, not a live edit. Picking the core means weighing five against
 *  seventeen, and that is done by trying combinations — so the checkboxes
 *  move a local list and only «احفظ» writes it. Toggling state directly here
 *  would change the discipline score behind the modal while he is still
 *  deciding, which turns the thing he is measuring into a moving target.
 * ---------------------------------------------------------------------- */
function CorePicker({ open, onClose, habits, onSave }) {
  const [picked, setPicked] = useState([]);

  /* Seeded on each open, not once: he comes back to change it, and a draft
     left over from the previous visit would quietly discard the five he
     has been keeping. */
  useEffect(() => {
    if (open) setPicked(habits.filter((h) => h.core).map((h) => h.id));
  }, [open, habits]);

  const full = picked.length >= CORE_CAP;
  const flip = (id) =>
    setPicked((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : full ? p : [...p, id],
    );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="اختر أساسياتك"
      footer={
        <>
          <Btn
            variant="default"
            className="flex-1"
            onClick={() => {
              onSave(picked);
              onClose();
            }}
          >
            احفظ{" "}
            <span dir="ltr" className="tabular-nums">
              ({picked.length}/{CORE_CAP})
            </span>
          </Btn>
          <Btn variant="outline" onClick={onClose}>
            إلغاء
          </Btn>
        </>
      }
    >
      <p className="text-[11.5px] leading-relaxed text-white/50">
        هذي العادات وحدها تحسب نسبة انضباطك اليومية. الباقي يبقى في مكانه،
        بسلسلته وسجلّه، لكنه إضافي — لأن مقياسًا يعدّ كل شيء لا يقيس شيئًا.
      </p>
      {!picked.length && (
        <p className="text-[11.5px] leading-relaxed" style={{ color: T.faint }}>
          واحدة على الأقل، وإلا رجع المؤشر يعدّ كل عاداتك.
        </p>
      )}

      <div className="space-y-4">
        {GROUPS.map((g) => {
          const list = habits.filter((h) => h.group === g.id);
          if (!list.length) return null;
          const Icon = g.icon;
          return (
            <div key={g.id}>
              <p
                className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold"
                style={{ color: g.tint }}
              >
                <Icon size={12} /> {g.label}
              </p>
              <div className="space-y-1">
                {list.map((h) => {
                  const on = picked.includes(h.id);
                  return (
                    <div
                      key={h.id}
                      className="rounded-lg px-2 py-1 transition-opacity duration-200"
                      style={{
                        backgroundColor: on ? `${T.accent}14` : "transparent",
                        /* Dimmed, not disabled: a greyed-out row reads as
                           broken, while a faded one reads as "not until you
                           free a slot" — which is what it means. */
                        opacity: !on && full ? 0.35 : 1,
                      }}
                    >
                      <Checkbox
                        checked={on}
                        onToggle={() => flip(h.id)}
                        label={h.label}
                        tint={T.accent}
                        size="sm"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {full && (
        <p className="text-[11px] leading-relaxed" style={{ color: T.ember }}>
          وصلت الحدّ. أزل واحدة لتختار غيرها.
        </p>
      )}
    </Modal>
  );
}

/* --- yesterday, corrected --------------------------------------------- *
 *  A habit system that only accepts today's answer punishes the one failure
 *  it cannot do anything about: forgetting to open the app. The day went to
 *  zero, the streak broke, and the number on the ring was about his memory
 *  rather than his discipline.
 *
 *  So yesterday stays open for exactly as long as today lasts — until the
 *  logical day boundary at 04:00, which is also when yesterday stops being
 *  the day before and becomes the day before that. One row is rewritten and
 *  nothing else moves: today's habits are not touched, because today is a
 *  different day and the whole value of a hard boundary is that it holds.
 *
 *  It works on a gap row too, which is the common case — the day he did not
 *  open the app is precisely the day worth going back for. A gap has no
 *  roster of its own, so the live routine is what it is asked against.
 * ---------------------------------------------------------------------- */
const GONE_BLOCK = {
  id: "__gone",
  label: "عادات لم تعد في روتينك",
  tint: T.faint,
  icon: Trash2,
};

function EditYesterdayModal({ open, onClose, state, setState }) {
  const ykey = yesterdayKey();
  const row = useMemo(
    () => (state.history || []).find((h) => h.date === ykey) || null,
    [state.history, ykey],
  );

  /* The roster as it stood that day where the row recorded one, and the live
     routine where it did not. A habit since deleted stays on the list, named
     the way the roll call names it — it was asked that day, and dropping it
     would rescore a finished day every time the routine is edited. */
  const roster = useMemo(() => {
    const live = new Map((state.habits || []).map((h) => [h.id, h]));
    const ids =
      Array.isArray(row?.all) && row.all.length
        ? row.all
        : (state.habits || []).map((h) => h.id);
    return ids.map((id) => {
      const h = live.get(id);
      return h
        ? { ...h, gone: false }
        : { id, label: "عادة لم تعد في روتينك", group: null, core: false, gone: true };
    });
  }, [row, state.habits]);

  const [picked, setPicked] = useState([]);
  /* Seeded from the archive each time it opens, exactly like the reflection
     box: opening it a second time on an empty list and saving would wipe the
     correction with nothing. */
  useEffect(() => {
    if (!open) return;
    const asked = new Set(roster.map((h) => h.id));
    setPicked((Array.isArray(row?.done) ? row.done : []).filter((id) => asked.has(id)));
  }, [open, row, roster]);

  const toggle = (id) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  /* Through `pctOfRow`, which goes through `disciplineOf` — the five core
     habits carry the number here too, or the ring and this screen would
     disagree about the same day the moment a core is set. */
  const pct = pctOfRow({ all: roster.map((h) => h.id), done: picked }, state.habits);
  const was = isGap(row) ? null : Number.isFinite(Number(row?.pct)) ? Number(row.pct) : null;

  /* Grouped by the block each habit belongs to, in the order the day runs.
     A habit whose block this build no longer has goes through `groupOf` into
     the night block, exactly as it does on every other screen. */
  const byBlock = useMemo(() => {
    const live = roster.filter((h) => !h.gone);
    return GROUPS.map((g) => ({
      g,
      list: live.filter((h) => groupOf(h.group).id === g.id),
    })).filter((x) => x.list.length);
  }, [roster]);
  /* The deleted habits get a heading of their own rather than being swept
     into the last block — they were asked that day and still count in the
     denominator, but saying «قبل النوم» over them would be a plain lie. */
  const gone = roster.filter((h) => h.gone);

  const commit = () => {
    setState((s) => {
      const history = setDayDone(s.history, ykey, picked, s.habits);
      /* The streak is read back off the rows rather than nudged: correcting
         yesterday can make or break the run that ends today, and a counter
         adjusted by hand here would be a second opinion about the same
         archive. */
      return { ...s, history, streakBase: streakBaseFrom(history) };
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`عدّل ${arDate(ykey)}`}
      footer={
        <>
          <Btn variant="default" className="flex-1" onClick={commit}>
            <Check size={14} strokeWidth={3} /> احفظ أمس
          </Btn>
          <Btn variant="outline" className="flex-1" onClick={onClose}>
            إلغاء
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <div
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3.5 py-3"
          style={{ borderColor: `${T.violet}3D`, background: `${T.violet}12` }}
        >
          <p className="text-[11.5px] leading-relaxed" style={{ color: T.muted }}>
            {isGap(row)
              ? "هذا اليوم لم يُسجَّل. أشّر ما أنجزته فعلًا فيه."
              : "تعديل صف أمس فقط — عادات اليوم لا تتغيّر."}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            {was !== null && was !== pct && (
              <Badge tint={T.faint}>
                <span dir="ltr" className="tabular-nums">
                  {was}%
                </span>
                {" كان"}
              </Badge>
            )}
            <Badge tint={pct >= STREAK_TARGET ? T.primary : T.cta}>
              <span dir="ltr" className="tabular-nums">
                {pct}%
              </span>
            </Badge>
          </div>
        </div>

        {!roster.length ? (
          <p
            className="rounded-xl border border-dashed px-3.5 py-5 text-center text-[11.5px] leading-relaxed"
            style={{ borderColor: T.border, color: T.faint }}
          >
            لا عادات في روتينك بعد — أضف عادة أولًا ثم ارجع لهذا اليوم.
          </p>
        ) : (
          <div className="space-y-3.5">
            {[...byBlock, ...(gone.length ? [{ g: GONE_BLOCK, list: gone }] : [])].map(
              ({ g, list }) => {
                const Icon = g.icon;
                return (
                  <div key={g.id}>
                    <p
                      className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold"
                      style={{ color: g.tint }}
                    >
                      <Icon size={12} /> {g.label}
                    </p>
                    <div className="space-y-1">
                      {list.map((h) => (
                        <div key={h.id} className="flex items-center gap-2">
                          <Checkbox
                            size="sm"
                            checked={picked.includes(h.id)}
                            onToggle={() => toggle(h.id)}
                            label={h.label}
                            /* The completion colour, never the block's tint —
                               a done row that borrows its category colour
                               stops reading as done. */
                            tint={T.primary}
                          />
                          {h.core && (
                            <Star
                              size={11}
                              aria-label="أساسية"
                              style={{ color: T.accent, fill: T.accent }}
                            />
                          )}

                        </div>
                      ))}
                    </div>
                  </div>
                );
              },
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

function RoutineModule({
  state,
  setState,
  discipline,
  streak,
  quote,
  onShuffleQuote,
  mirror,
  savedAt,
  diskAt,
  diskStuck,
  onOpenMirror,
  onOpenReflect,
  onOpenFix,
  onOpenTomorrow,
  onOpenSettings,
  onGoGoals,
  reflected,
  prepped,
}) {
  const [editing, setEditing] = useState(null); // {id?, label, group}
  const [quotesOpen, setQuotesOpen] = useState(false);
  const [dragging, setDragging] = useState(null); // habit id being dragged
  const [overGroup, setOverGroup] = useState(null);
  const [picking, setPicking] = useState(false); // choosing the core five
  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString("ar-EG", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    []
  );

  /* One place a habit is ticked, shared with the «اليوم» screen — the
     withdrawal of a reading log on an untick is not logic that may exist in
     two copies drifting apart. */
  const { toggle, logging, closeLog, logRead } = useHabitTick(state, setState);
  const arm = useUndo();

  const save = () => {
    const label = editing.label.trim();
    if (!label) return;
    /* Through the one shape, so the add form and the migration cannot drift
       into writing two different kinds of habit. */
    const min = String(editing.min || "").trim();
    setState((s) => ({
      ...s,
      habits: editing.id
        ? s.habits.map((h) =>
            h.id === editing.id
              ? habitShape({
                  ...h,
                  label,
                  group: editing.group,
                  book: editing.book || null,
                  min,
                })
              : h
          )
        : [
            ...s.habits,
            habitShape({
              label,
              group: editing.group,
              book: editing.book || null,
              min,
            }),
          ],
    }));
    setEditing(null);
  };

  const remove = (id) => {
    /* The whole list, not the row: a habit put back at the end of the list
       is a habit in the wrong block and the wrong order, which is its own
       small loss. */
    arm("حُذفت العادة", { habits: state.habits });
    setState((s) => ({ ...s, habits: s.habits.filter((h) => h.id !== id) }));
  };

  const reorder = (dragId, targetId) =>
    setState((s) => ({ ...s, habits: dropHabit(s.habits, dragId, targetId) }));

  const moveToGroup = (dragId, group) =>
    setState((s) => ({ ...s, habits: dropHabitInGroup(s.habits, dragId, group) }));

  const nudge = (id, dir) =>
    setState((s) => ({ ...s, habits: nudgeHabit(s.habits, id, dir) }));

  /* Refused at the cap, and told why — the same contract the three tasks
     hold. A sixth star that silently does nothing teaches that the button is
     broken; one that says «خمس أساسيات تكفي» teaches what the cap is for. */
  const [coreNote, setCoreNote] = useState(null);
  const toggleCore = (id) =>
    setState((s) => {
      const h = s.habits.find((x) => x.id === id);
      if (!h) return s;
      if (!h.core && coreOf(s.habits).length >= CORE_CAP) {
        setCoreNote(id);
        return s;
      }
      setCoreNote(null);
      return {
        ...s,
        habits: s.habits.map((x) => (x.id === id ? { ...x, core: !x.core } : x)),
      };
    });
  /* The refusal is a moment, not a state. Left on screen it becomes part of
     the layout and stops being read. */
  useEffect(() => {
    if (coreNote === null) return;
    const t = setTimeout(() => setCoreNote(null), 4000);
    return () => clearTimeout(t);
  }, [coreNote]);

  const core = coreOf(state.habits);
  const coreDone = core.filter((h) => h.done).length;
  const extra = core.length ? state.habits.filter((h) => !h.core) : [];
  const extraDone = extra.filter((h) => h.done).length;
  const done = state.habits.filter((h) => h.done).length;
  /* Indexed once for the whole screen: every row asks for its own run, and
     rebuilding the map per row would walk the archive once per habit. */
  const archive = useMemo(() => historyIndex(state.history), [state.history]);
  const flame =
    discipline >= STREAK_TARGET
      ? { color: T.ember, glow: `drop-shadow(0 0 14px ${T.ember})`, animate: true }
      : discipline >= 50
      ? { color: "#B45309", glow: "none", animate: false }
      : { color: "rgba(255,255,255,0.22)", glow: "none", animate: false };

  return (
    <div className="space-y-7">
      <CueImageCard
        src={state.cueImage}
        onChange={(dataUrl) => setState((s) => ({ ...s, cueImage: dataUrl }))}
      />

      {/* daily cue — tap for the next one. The card is a div with a full-area
          button layered under the content, not a <button> itself: the manage
          control lives here too, and a button inside a button is invalid. */}
      <Card className="los-cue group relative overflow-hidden p-6 text-center transition-all duration-300 sm:p-7">
        <button
          type="button"
          onClick={onShuffleQuote}
          title="اضغط لاقتباس آخر"
          aria-label="اقتباس آخر"
          className="absolute inset-0 z-0 cursor-pointer"
        />
        <div
          className="pointer-events-none absolute -top-24 right-1/3 h-56 w-56 rounded-full opacity-30 blur-3xl transition-opacity duration-500 group-hover:opacity-50"
          style={{ background: T.accent }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-1/4 h-48 w-48 rounded-full opacity-25 blur-3xl"
          style={{ background: T.rose }}
        />
        <button
          type="button"
          onClick={() => setQuotesOpen(true)}
          aria-label="تحرير عبارات التحفيز"
          title="تحرير عبارات التحفيز"
          className="absolute left-3 top-3 z-20 rounded-lg border p-1.5 transition-all duration-200 hover:scale-105"
          style={{
            borderColor: `${T.accent}3D`,
            background: `${T.accent}14`,
            color: T.accent,
          }}
        >
          <MessageSquareQuote size={14} />
        </button>
        <div className="pointer-events-none relative z-10">
          <Quote
            size={20}
            className="mx-auto mb-2 opacity-45"
            style={{ color: T.accent }}
          />
          {quote ? (
            <>
              <p
                key={quote.text}
                className="los-in mx-auto max-w-2xl text-[15px] font-bold leading-relaxed sm:text-lg"
                style={{ color: T.fg }}
              >
                {quote.text}
              </p>
              <p className="mt-2 text-xs" style={{ color: T.accent }}>
                — {quote.author}
              </p>
            </>
          ) : (
            <p className="text-[13px]" style={{ color: T.muted }}>
              لا عبارات بعد — اضغط زر التحرير لإضافة أول عبارة.
            </p>
          )}
          <span
            className="mt-3 inline-flex items-center gap-1.5 text-[10.5px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ color: T.faint }}
          >
            <RotateCcw size={11} /> اضغط لاقتباس آخر
          </span>
        </div>
      </Card>

      {/* score */}
      <Card className="flex flex-col items-center gap-7 p-6 sm:p-7 lg:flex-row lg:justify-between">
        <div className="text-center lg:text-right">
          <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">الروتين اليومي</h2>
          <p className="mt-1.5 flex items-center justify-center gap-2 text-xs text-white/40 lg:justify-start">
            <CalendarDays size={13} /> {dateLabel}
          </p>
          <SaveStamp at={savedAt} diskAt={diskAt} diskStuck={diskStuck} />
          {core.length ? (
            <p className="mt-3 max-w-sm text-xs leading-relaxed text-white/35">
              <span className="font-extrabold" style={{ color: T.accent }}>
                <span dir="ltr" className="tabular-nums">
                  {coreDone} / {core.length}
                </span>{" "}
                أساسيات
              </span>
              {extra.length > 0 && (
                <>
                  {" · إضافي "}
                  <span dir="ltr" className="tabular-nums">
                    {extraDone} / {extra.length}
                  </span>
                </>
              )}
              . المؤشر يقيس أساسياتك وحدها — وعند ٨٠٪ يُحتسب اليوم في سلسلتك.
            </p>
          ) : (
            <p className="mt-3 max-w-sm text-xs leading-relaxed text-white/35">
              {done} من {state.habits.length} عادة. المؤشر يمتلئ مع كل علامة —
              وعند ٨٠٪ يُحتسب اليوم في سلسلتك.
            </p>
          )}

          {/* The invitation, shown only while there is no core. It sits here
              rather than in settings because this is the sentence it is
              arguing with: the percentage directly above it is the one that
              counts eighteen habits and calls three of them a failure. */}
          {!core.length && (
            <button
              onClick={() => setPicking(true)}
              className="los-in mt-3 flex w-full max-w-sm items-start gap-2.5 rounded-xl border px-3.5 py-3 text-right transition-all duration-200"
              style={{
                borderColor: `${T.accent}3D`,
                background: `${T.accent}12`,
              }}
            >
              <Star size={15} className="mt-0.5 shrink-0" style={{ color: T.accent }} />
              <span>
                <span className="block text-[12px] font-extrabold" style={{ color: T.accent }}>
                  اختر أساسياتك
                </span>
                <span className="mt-1 block text-[11px] leading-relaxed text-white/45">
                  حتى {CORE_CAP} عادات تحسب نسبتك وحدها، والباقي إضافي. ثلاث
                  عادات حقيقية من {state.habits.length} تقرأ الآن{" "}
                  <span dir="ltr" className="tabular-nums">
                    {state.habits.length
                      ? Math.round((3 / state.habits.length) * 100)
                      : 0}
                    %
                  </span>
                  .
                </span>
              </span>
            </button>
          )}

          {coreNote !== null && (
            <p
              className="los-in mt-3 max-w-sm rounded-xl border px-3.5 py-2.5 text-[11px] leading-relaxed"
              style={{
                borderColor: `${T.ember}4D`,
                background: `${T.ember}14`,
                color: T.ember,
              }}
            >
              {CORE_CAP} أساسيات تكفي. أزل نجمة قبل أن تضيف أخرى — الحدّ هو ما
              يجعلها أساسيات.
            </p>
          )}
          <div className="mt-4 flex items-center justify-center gap-3 lg:justify-start">
            <div
              className="flex items-center gap-2 rounded-xl border px-4 py-2"
              style={{ borderColor: T.border }}
            >
              <Flame
                size={22}
                className={flame.animate ? "los-flame" : ""}
                style={{
                  color: flame.color,
                  filter: flame.glow,
                  transition: "all .5s ease",
                }}
              />
              <span className="text-xl font-extrabold tabular-nums">{streak}</span>
              <span className="text-[11px] text-white/35">{countedWord(streak)}</span>
            </div>
            <Btn
              variant="default"
              size="sm"
              onClick={() =>
                setEditing({ label: "", group: "morning", book: null, min: "" })
              }
            >
              <Plus size={14} strokeWidth={3} /> عادة جديدة
            </Btn>
            {/* The evening prompt comes on its own, but only inside its
                window and only on a day that fell short. This is how you
                reach it the rest of the time — and how you reopen what you
                already wrote to read or change it. */}
            <button
              onClick={onOpenReflect}
              title="وقفة آخر اليوم"
              aria-label="وقفة آخر اليوم"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-200"
              style={{
                borderColor: reflected ? `${T.cta}80` : `${T.cta}3D`,
                background: reflected ? `${T.cta}24` : `${T.cta}0F`,
                color: T.cta,
                boxShadow: reflected ? `0 0 18px -6px ${T.cta}` : "none",
              }}
            >
              <MessageSquareQuote size={16} strokeWidth={2} />
            </button>
            {/* «اليوم» only invites it in the evening window, which is the
                right default and the wrong only door — the three can be
                chosen at any hour, and a prep already written has to be
                re-readable. Lit once tomorrow has its three. */}
            <button
              onClick={onOpenTomorrow}
              title="جهّز غدك"
              aria-label="جهّز غدك"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-200"
              style={{
                borderColor: prepped ? `${T.violet}80` : `${T.violet}3D`,
                background: prepped ? `${T.violet}24` : `${T.violet}0F`,
                color: T.violet,
                boxShadow: prepped ? `0 0 18px -6px ${T.violet}` : "none",
              }}
            >
              <Sunrise size={16} strokeWidth={2} />
            </button>
            {/* Open for as long as today is today. A day missed because the
                app was never opened is the one failure the app itself caused,
                and it has to be answerable. */}
            <button
              onClick={onOpenFix}
              title="عدّل أمس"
              aria-label="عدّل أمس"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-200"
              style={{
                borderColor: `${T.violet}3D`,
                background: `${T.violet}0F`,
                color: T.violet,
              }}
            >
              <History size={16} strokeWidth={2} />
            </button>
            <button
              onClick={onOpenMirror}
              title="مرآة المحاسبة"
              aria-label="مرآة المحاسبة"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-200"
              style={{
                borderColor: mirror ? `${T.danger}80` : `${T.danger}3D`,
                background: mirror ? `${T.danger}24` : `${T.danger}0F`,
                color: T.danger,
                boxShadow: mirror ? `0 0 18px -6px ${T.danger}` : "none",
              }}
            >
              <ScanFace size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
        <ProgressRing value={discipline} size={176} />
      </Card>

      <TopThree state={state} setState={setState} />

      {/* The prayers the six blocks below are anchored to, and the one meter
          that is not a habit. Side by side because they answer the same
          question — «أين أنا من يومي الآن؟» — from two directions. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PrayerCard place={state.place} onOpenSettings={onOpenSettings} />
        <WaterCard
          count={state.water}
          goal={clampGoal(state.waterGoal)}
          onSet={(n) =>
            setState((s) => ({
              ...s,
              water: Math.max(0, Math.min(clampGoal(s.waterGoal), n)),
            }))
          }
        />
      </div>

      {/* The habits below are what spend the days this counts, so the two sit
          together — a countdown on a screen of its own is a number you visit,
          not one you feel. */}
      <CountdownStrip state={state} onGo={onGoGoals} />

      {/* habit groups */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {GROUPS.map((g) => {
          const list = state.habits.filter((h) => h.group === g.id);
          const gDone = list.filter((h) => h.done).length;
          const Icon = g.icon;
          return (
            <Card
              key={g.id}
              className="p-5 transition-all duration-200"
              style={
                overGroup === g.id
                  ? { borderColor: `${T.cta}80`, boxShadow: `0 0 0 1px ${T.cta}4D, ${GLASS.boxShadow}` }
                  : undefined
              }
              onDragOver={(e) => {
                if (!dragging) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setOverGroup(g.id);
              }}
              onDragLeave={(e) => {
                if (e.currentTarget.contains(e.relatedTarget)) return;
                setOverGroup(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setOverGroup(null);
                const id = e.dataTransfer.getData("text/plain");
                if (id) moveToGroup(id, g.id);
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: `${g.tint}33`,
                    background: `${g.tint}14`,
                    color: g.tint,
                  }}
                >
                  <Icon size={18} strokeWidth={1.9} />
                </span>
                <h3 className="text-[15px] font-bold">{g.label}</h3>
                <span className="mr-auto text-[11px] tabular-nums text-white/30">
                  {gDone}/{list.length}
                </span>
              </div>

              <div
                className="mt-3.5 h-1 w-full overflow-hidden rounded-full"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: list.length ? `${(gDone / list.length) * 100}%` : "0%",
                    backgroundImage:
                      gDone === list.length && list.length
                        ? `linear-gradient(90deg, ${T.primary}, ${T.primaryLift})`
                        : `linear-gradient(90deg, ${g.tint}, ${g.tint}AA)`,
                    boxShadow: `0 0 12px ${
                      gDone === list.length && list.length ? T.primary : g.tint
                    }99`,
                  }}
                />
              </div>

              <div className="mt-2 space-y-0.5">
                {list.length === 0 ? (
                  <p className="py-3 text-center text-[11px] text-white/25">
                    {dragging
                      ? "أفلت هنا لنقل العادة إلى هذه الفترة"
                      : "لا عادات في هذه الفترة بعد"}
                  </p>
                ) : (
                  list.map((h, idx) => (
                    <HabitRow
                      key={h.id}
                      habit={h}
                      linkedBook={bookForHabit(h, state.books)}
                      streak={habitStreak(archive, h.id)}
                      first={idx === 0}
                      last={idx === list.length - 1}
                      dragging={dragging}
                      onDragStart={() => setDragging(h.id)}
                      onDragEnd={() => {
                        setDragging(null);
                        setOverGroup(null);
                      }}
                      onDrop={(dragId) => reorder(dragId, h.id)}
                      onNudge={(dir) => nudge(h.id, dir)}
                      onToggleCore={() => toggleCore(h.id)}
                      onToggle={() => toggle(h.id)}
                      onToggleTiny={() => toggle(h.id, true)}
                      onEdit={() =>
                        /* `book` has to be seeded here: the form writes
                           `book: editing.book || null` on save, so opening it
                           without the current link silently unlinks a reading
                           habit the moment its name is corrected. */
                        setEditing({
                          id: h.id,
                          label: h.label,
                          group: h.group,
                          book: h.book || null,
                          min: h.min || "",
                        })
                      }
                      onDelete={() => remove(h.id)}
                    />
                  ))
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <HabitLedger state={state} />

      <ReadLogModal
        open={!!logging}
        book={logging ? bookForHabit(logging, state.books) : null}
        onClose={closeLog}
        onLog={logRead}
      />

      <QuotesModal
        open={quotesOpen}
        onClose={() => setQuotesOpen(false)}
        quotes={state.quotes || []}
        setState={setState}
      />

      <CorePicker
        open={picking}
        onClose={() => setPicking(false)}
        habits={state.habits}
        onSave={(ids) =>
          setState((s) => ({
            ...s,
            habits: s.habits.map((h) => ({ ...h, core: ids.includes(h.id) })),
          }))
        }
      />

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "تعديل العادة" : "عادة جديدة"}
        footer={
          <>
            <Btn variant="default" className="flex-1" onClick={save}>
              حفظ
            </Btn>
            <Btn
              variant="outline"
              className="flex-1"
              onClick={() => setEditing(null)}
            >
              إلغاء
            </Btn>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="los-habit-label"
                className="mb-1.5 block text-xs text-white/45"
              >
                اسم العادة
              </label>
              <Field
                id="los-habit-label"
                value={editing.label}
                autoFocus
                onChange={(e) =>
                  setEditing((s) => ({ ...s, label: e.target.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && save()}
                placeholder="مثال: قراءة ١٠ صفحات"
              />
            </div>
            {/* The floor. Written by him and nobody else — which smaller
                version of «ساعة في النادي» he would still accept on a bad
                day is not a question this app is in any position to answer,
                the same reason the core five are asked for rather than
                guessed. */}
            <div>
              <label
                htmlFor="los-habit-min"
                className="mb-1.5 flex items-center gap-1.5 text-xs text-white/45"
              >
                <Feather size={12} style={{ color: T.sky }} /> النسخة الصغيرة
                <span style={{ color: T.faint }}>— اختياري</span>
              </label>
              <Field
                id="los-habit-min"
                value={editing.min || ""}
                maxLength={HABIT_MIN_MAX}
                onChange={(e) => setEditing((s) => ({ ...s, min: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && save()}
                placeholder="مثال: عشر دقائق مشي"
              />
              <p className="mt-1.5 text-[10.5px] leading-relaxed" style={{ color: T.faint }}>
                أصغر نسخة تقبلها في أسوأ يوم. تظهر كزرّ ثانٍ في صف العادة،
                وتُحتسب منجزة بالكامل — وتُعلَّم في الأرشيف بأنك حملتها على
                الحد الأدنى.
              </p>
            </div>

            <div>
              <label
                htmlFor="los-habit-book"
                className="mb-1.5 block text-xs text-white/45"
              >
                ربط بالمكتبة
              </label>
              <select
                id="los-habit-book"
                value={editing.book || ""}
                onChange={(e) =>
                  setEditing((s) => ({ ...s, book: e.target.value || null }))
                }
                className="w-full rounded-xl border bg-transparent px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-white/30"
                style={{ borderColor: T.border, color: T.muted }}
              >
                <option value="" style={{ background: T.cardSolid }}>
                  ليست عادة قراءة
                </option>
                <option value={READ_ACTIVE} style={{ background: T.cardSolid }}>
                  الكتاب الذي أقرأه الآن
                </option>
                {state.books.map((b) => (
                  <option key={b.id} value={b.id} style={{ background: T.cardSolid }}>
                    {b.title}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-[10.5px]" style={{ color: T.faint }}>
                عادة مربوطة تسألك كم صفحة قرأت عند كل علامة، وتسجّلها في
                المكتبة.
              </p>
            </div>

            <div>
              <span className="mb-1.5 block text-xs text-white/45">الفترة</span>
              <div className="grid grid-cols-2 gap-2">
                {GROUPS.map((g) => {
                  const active = editing.group === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => setEditing((s) => ({ ...s, group: g.id }))}
                      aria-pressed={active}
                      className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[13px] transition-all"
                      style={{
                        borderColor: active ? `${g.tint}80` : T.border,
                        background: active ? `${g.tint}16` : "transparent",
                        color: active ? g.tint : T.muted,
                      }}
                    >
                      <g.icon size={15} /> {g.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}


function MatrixModule({ state, setState }) {
  const [draft, setDraft] = useState("");
  const [draftQ, setDraftQ] = useState("q2");
  const [over, setOver] = useState(null);
  const [capHit, fireCapHit] = useBurst(2800);
  const arm = useUndo();

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    setState((s) => ({
      ...s,
      /* Through the one shape, so the matrix's form and the evening prep's
         cannot drift into writing two different kinds of task. */
      tasks: [...s.tasks, taskShape({ text, quadrant: draftQ })],
    }));
    setDraft("");
  };

  const patch = (id, p) =>
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...p } : t)),
    }));

  /* The cap is the whole point of the rule, so a fourth pick is refused
     outright rather than quietly hidden — and it says why. `capToday`
     re-asserts it on the way out, because this is no longer the only door:
     the evening prep promotes three of its own at the rollover. */
  const promote = (id) => {
    const t = state.tasks.find((x) => x.id === id);
    if (!t || t.today) return;
    if (state.tasks.filter((x) => x.today).length >= TOP_TASK_CAP) {
      fireCapHit();
      return;
    }
    setState((s) => ({
      ...s,
      tasks: capToday(s.tasks.map((x) => (x.id === id ? { ...x, today: true } : x))),
    }));
  };

  const toggleToday = (t) =>
    t.today ? patch(t.id, { today: false }) : promote(t.id);

  const remove = (id) => {
    arm("حُذفت المهمة", { tasks: state.tasks });
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
  };

  const onDrop = (zone) => (e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    setOver(null);
    if (!id) return;
    if (zone === "today") promote(id);
    else patch(id, { quadrant: zone, today: false });
  };

  const dragProps = (zone) => ({
    onDragOver: (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (over !== zone) setOver(zone);
    },
    onDragLeave: () => setOver((o) => (o === zone ? null : o)),
    onDrop: onDrop(zone),
  });


  return (
    <div className="space-y-7">
      <Card className="p-6 sm:p-7">
        <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">مصفوفة المهام</h2>
        <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/40">
          صنّف كل مهمة بصدق، ثم ارفع ثلاثًا فقط إلى «أهم ٣ مهام» — بالسحب أو
          بأيقونة الهدف
          <Target size={12} className="mx-1 inline" /> على الجوال.
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Field
            id="los-task-new"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="مهمة جديدة…"
          />
          <div className="flex gap-2">
            <select
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
              aria-label="الربع"
              className="rounded-xl border bg-transparent px-3 py-2.5 text-xs outline-none"
              style={{ borderColor: T.border, color: T.muted }}
            >
              {QUADRANTS.map((q) => (
                <option key={q.id} value={q.id} style={{ background: T.cardSolid }}>
                  {q.label}
                </option>
              ))}
            </select>
            <Btn variant="default" onClick={add} className="shrink-0">
              <Plus size={15} strokeWidth={3} /> إضافة
            </Btn>
          </div>
        </div>
      </Card>

      {/* the drop target that matters */}
      <div
        {...dragProps("today")}
        className="rounded-2xl transition-all duration-200"
        style={{
          outline: over === "today" ? `2px dashed ${T.cta}` : "none",
          outlineOffset: 4,
        }}
      >
        <TopThree state={state} setState={setState} />
      </div>

      {capHit && (
        <p
          className="los-in rounded-2xl border px-4 py-3 text-center text-xs font-bold leading-relaxed"
          style={{
            borderColor: `${T.danger}59`,
            background: `${T.danger}1A`,
            color: T.danger,
          }}
        >
          ثلاث مهام فقط — هذا هو الحد. أنجِز واحدة أو أنزل غيرها أولًا.
        </p>
      )}

      {/* four quadrants */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {QUADRANTS.map((q) => {
          const list = state.tasks.filter((t) => t.quadrant === q.id);
          const Icon = q.icon;
          return (
            <Card
              key={q.id}
              {...dragProps(q.id)}
              className="flex min-h-[200px] flex-col p-5 transition-all duration-200"
              style={{
                ...GLASS,
                borderColor: over === q.id ? `${q.tint}B3` : T.border,
                backgroundColor: over === q.id ? `${q.tint}2E` : T.card,
                boxShadow:
                  over === q.id
                    ? `0 0 0 1px ${q.tint}59, ${GLASS.boxShadow}`
                    : GLASS.boxShadow,
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border"
                  style={{
                    borderColor: `${q.tint}33`,
                    background: `${q.tint}14`,
                    color: q.tint,
                  }}
                >
                  <Icon size={16} strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[14.5px] font-bold" style={{ color: q.tint }}>
                    {q.label}
                  </h3>
                  <p className="text-[10.5px] text-white/35">{q.action}</p>
                </div>
                <span className="mr-auto shrink-0 text-[11px] tabular-nums text-white/25">
                  {list.length}
                </span>
              </div>

              <div className="mt-4 flex-1 space-y-2">
                {list.length === 0 ? (
                  <p className="py-6 text-center text-[11px] text-white/20">
                    فارغ
                  </p>
                ) : (
                  list.map((t) => (
                    <TaskChip
                      key={t.id}
                      task={t}
                      onDragStart={(e) =>
                        e.dataTransfer.setData("text/plain", t.id)
                      }
                      onToggleDone={() => patch(t.id, { done: !t.done })}
                      onToggleToday={() => toggleToday(t)}
                      onDelete={() => remove(t.id)}
                    />
                  ))
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ==================================================================== *
 *  The accountability mirror — no styling softener, on purpose
 * ==================================================================== */
function MirrorModal({ open, onClose, value, onSave }) {
  const [draft, setDraft] = useState("");

  /* Reopened on a new day, the stored value is empty and so is the box —
     the entry is keyed by date, which is what "clears at midnight" means. */
  useEffect(() => {
    if (open) setDraft(value || "");
  }, [open, value]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="مرآة المحاسبة"
      footer={
        <>
          <Btn
            variant="default"
            className="flex-1"
            onClick={() => onSave(draft.trim())}
            style={{
              backgroundImage: `linear-gradient(135deg, ${T.danger}, ${T.ember})`,
              boxShadow: `0 8px 24px -10px ${T.danger}`,
              color: "#1A0603",
            }}
          >
            <Flame size={15} /> واجه الحقيقة
          </Btn>
          <Btn variant="outline" className="flex-1" onClick={onClose}>
            إغلاق
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <p
          className="rounded-xl border px-3.5 py-3 text-[11.5px] leading-relaxed"
          style={{
            borderColor: `${T.danger}45`,
            background: `${T.danger}12`,
            color: T.danger,
          }}
        >
          هنا لا تُجمّل ولا تبرّر. اكتب ما تهرب منه — الكسل الذي سمّيته راحة،
          والتأجيل الذي سمّيته انتظارًا. لا أحد يقرأ هذا غيرك.
        </p>
        <Field
          as="textarea"
          rows={8}
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="resize-none leading-relaxed"
          style={{
            borderColor: `${T.danger}59`,
            background: `${T.danger}0A`,
          }}
          placeholder="قل الحقيقة كاملة…"
        />
      </div>
    </Modal>
  );
}

/* ==================================================================== *
 *  MODULE — goals across three horizons
 *
 *  A 90-day goal that serves nothing is a chore with a deadline. The screen
 *  is built around the chain rather than around a flat list: three years, the
 *  year, and the ninety days you are in — each row knowing the one above it
 *  that it serves and the ones below it that carry it.
 *
 *  The card is a glance and the desk is where the work happens, the same
 *  split the library and the university desk already use. A goal's reason,
 *  its meter, its milestones and its deadline all live on the desk; the card
 *  shows only what you scan for.
 * ==================================================================== */

/* --- the horizon clock ------------------------------------------------ *
 *  How much of a window has gone, beside how much of its goals have. The
 *  first number alone is a countdown and decoration; the two together are
 *  the only thing that can tell you that you are behind, which is the one
 *  fact a planner exists to surface while there is still time to act on it.
 * ---------------------------------------------------------------------- */
const DRIFT_BAND = 10; // inside ten points of the clock still counts as on pace

function horizonClock(id, all, year, quarter) {
  const [from, to] = windowOf(id, year, quarter);
  const stand = windowStand(from, to);
  const list = all.filter((g) =>
    g.horizon !== id
      ? false
      : id === "quarter"
        ? g.quarter === quarter && g.year === year
        : id === "year"
          ? g.year === year
          : true,
  );
  const hit = list.length
    ? Math.round(list.reduce((n, g) => n + goalPct(g, all), 0) / list.length)
    : 0;
  const done = list.filter((g) => g.done).length;
  /* Pace is only a question once the window is open and has goals in it.
     Calling an empty quarter «متأخّر» would be scolding someone for not yet
     having written anything down. */
  const judged = stand.state === "live" && list.length > 0;
  const drift = hit - stand.pct;
  return {
    ...stand,
    from,
    to,
    goals: list.length,
    done,
    hit,
    drift,
    pace: !judged
      ? null
      : drift >= DRIFT_BAND
        ? { label: "متقدّم على الوقت", tint: T.primary }
        : drift <= -DRIFT_BAND
          ? { label: "متأخّر عن الوقت", tint: T.danger }
          : { label: "على المسار", tint: T.accent },
  };
}

/* --- the pace track --------------------------------------------------- *
 *  One track, not two. The fill is how far the goals have got; the marker
 *  standing on it is where the calendar currently is. Marker ahead of fill
 *  means you are behind, and that reads in a glance without a legend —
 *  which two stacked bars never did, because at the start of a window they
 *  are both empty and look like a component that failed to load.
 *
 *  Everything is positioned from `right`: the page is RTL, so a window fills
 *  from the right edge the way the text runs.
 * ---------------------------------------------------------------------- */
function PaceTrack({ clock, tint, compact = false }) {
  const h = compact ? 7 : 9;
  const behind = clock.pace && clock.drift <= -DRIFT_BAND;
  return (
    <span className="relative block" style={{ height: h + 10, marginTop: 2 }}>
      {/* the window */}
      <span
        className="absolute inset-x-0 block overflow-hidden rounded-full"
        style={{ top: 5, height: h, background: "rgba(255,255,255,0.09)" }}
      >
        {/* time already spent, kept very quiet — it is the backdrop the fill
            is judged against, not a second thing to read */}
        <span
          className="absolute inset-y-0 block transition-all duration-700"
          style={{
            right: 0,
            width: `${clock.pct}%`,
            background: "rgba(255,255,255,0.10)",
          }}
        />
        {/* what the goals have actually done */}
        <span
          className="absolute inset-y-0 block rounded-full transition-all duration-700"
          style={{
            right: 0,
            width: `${clock.hit}%`,
            backgroundImage: `linear-gradient(270deg, ${tint}, ${tint}99)`,
            boxShadow: clock.hit ? `0 0 12px ${tint}AA` : "none",
          }}
        />
      </span>

      {/* «أنت هنا» — the calendar's own position on the window */}
      {clock.state === "live" && (
        <span
          className="absolute block transition-all duration-700"
          style={{ right: `${clock.pct}%`, top: 0, height: h + 10 }}
          title={`مضى ${clock.pct}% من المدّة`}
        >
          <span
            className="absolute block rounded-full"
            style={{
              top: 0,
              right: -1.5,
              width: 3,
              height: h + 10,
              background: behind ? T.danger : "rgba(255,255,255,0.85)",
              boxShadow: behind
                ? `0 0 10px ${T.danger}`
                : "0 0 8px rgba(255,255,255,0.55)",
            }}
          />
        </span>
      )}
    </span>
  );
}

/* One horizon, as a row. The row is what fixed the design: three tall tiles
   left most of their height empty and the numbers floating in it, which is
   what reads as unfinished no matter how the type is set. */
function HorizonRow({ clock, h, compact = false, on = false, as = "div", ...rest }) {
  const Tag = as;
  const label = clock.label;
  const dead = clock.state === "done";
  return (
    <Tag
      className={`relative block w-full overflow-hidden rounded-xl border text-right transition-all duration-200${
        as === "button" ? " hover:brightness-110" : ""
      }`}
      style={{
        borderColor: on ? `${h.tint}80` : `${h.tint}2E`,
        backgroundColor: on ? "transparent" : "rgba(255,255,255,0.025)",
        backgroundImage: on
          ? `linear-gradient(160deg, ${h.tint}24, ${h.tint}08)`
          : "none",
        boxShadow: on ? `0 10px 26px -18px ${h.tint}` : "none",
        opacity: dead ? 0.55 : 1,
        padding: compact ? "11px 13px 11px 13px" : "14px 16px",
      }}
      {...rest}
    >
      {/* the accent edge, on the reading-start side — the same rule the
          project's own report charts are drawn with */}
      <span
        aria-hidden="true"
        className="absolute block rounded-full"
        style={{
          right: 0,
          top: compact ? 11 : 14,
          bottom: compact ? 11 : 14,
          width: 3,
          background: h.tint,
          boxShadow: `0 0 10px ${h.tint}99`,
        }}
      />

      {/* Three columns — name, track, count — rather than two blocks pinned
          to the edges. Pinned, the middle of a wide row is simply empty, and
          an empty middle is what reads as unfinished however the type is set.
          The order flips on a phone: name and count share the first line and
          the track takes the second, which is the only way the track stays
          wide enough to read at 375px. */}
      <span className="flex flex-wrap items-center gap-x-4 gap-y-2.5 pr-3">
        <span
          className={`order-1 block min-w-0 flex-1 sm:flex-none ${
            compact ? "sm:w-[108px]" : "sm:w-[132px]"
          }`}
        >
          <span
            className={`flex items-center gap-1.5 font-extrabold ${
              compact ? "text-[11.5px]" : "text-[13px]"
            }`}
            style={{ color: h.tint }}
          >
            <h.icon size={compact ? 12 : 14} strokeWidth={2.2} />
            <span className="truncate">{h.short}</span>
          </span>
          <span
            className={`mt-0.5 block truncate ${compact ? "text-[9.5px]" : "text-[10.5px]"}`}
            dir="auto"
            style={{ color: T.faint }}
          >
            {label}
          </span>
        </span>

        <span className="order-3 block w-full min-w-0 sm:order-2 sm:w-auto sm:flex-1">
          <PaceTrack clock={clock} tint={h.tint} compact={compact} />
          <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span
              className={`flex items-center gap-2 ${compact ? "text-[9px]" : "text-[10px]"}`}
              style={{ color: T.faint }}
            >
              <span>
                مضى{" "}
                <span dir="ltr" className="tabular-nums" style={{ color: T.muted }}>
                  {clock.pct}%
                </span>
              </span>
              <span aria-hidden="true" style={{ opacity: 0.35 }}>
                ·
              </span>
              <span>
                أُنجز{" "}
                <span dir="ltr" className="tabular-nums" style={{ color: h.tint }}>
                  {clock.hit}%
                </span>
              </span>
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-bold ${
                compact ? "text-[9px]" : "text-[9.5px]"
              }`}
              style={{
                background:
                  clock.goals && clock.done === clock.goals
                    ? `${T.primary}1A`
                    : "rgba(255,255,255,0.05)",
                color: clock.goals && clock.done === clock.goals ? T.primary : T.muted,
              }}
            >
              <Flag size={9} />
              <span dir="ltr" className="tabular-nums">
                {clock.done}/{clock.goals}
              </span>
            </span>
            {clock.pace && (
              <span
                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-bold ${
                  compact ? "text-[9px]" : "text-[9.5px]"
                }`}
                style={{ background: `${clock.pace.tint}1A`, color: clock.pace.tint }}
              >
                {clock.drift >= DRIFT_BAND ? (
                  <TrendingUp size={9} />
                ) : clock.drift <= -DRIFT_BAND ? (
                  <TrendingDown size={9} />
                ) : (
                  <Check size={9} strokeWidth={3} />
                )}
                {clock.pace.label}
              </span>
            )}
          </span>
        </span>

        <span
          className={`order-2 block shrink-0 text-left sm:order-3 ${
            compact ? "sm:w-[72px]" : "sm:w-[88px]"
          }`}
        >
          {dead ? (
            <span
              className={`block font-extrabold ${compact ? "text-[12px]" : "text-[14px]"}`}
              style={{ color: T.faint }}
            >
              انتهت
            </span>
          ) : (
            <>
              <span className="flex items-baseline justify-start gap-1 leading-none">
                <span
                  dir="ltr"
                  className={`font-extrabold tabular-nums ${
                    compact ? "text-[23px]" : "text-[28px]"
                  }`}
                  style={{ color: h.tint, letterSpacing: "-0.02em" }}
                >
                  {clock.left}
                </span>
                <span
                  className={`font-bold ${compact ? "text-[10px]" : "text-[11px]"}`}
                  style={{ color: T.muted }}
                >
                  {dayWord(clock.left)}
                </span>
              </span>
              {clock.state === "soon" && (
                <span
                  className="mt-0.5 block text-[9px] font-bold"
                  style={{ color: T.faint }}
                >
                  يبدأ بعد{" "}
                  <span dir="ltr" className="tabular-nums">
                    {clock.until}
                  </span>{" "}
                  {dayWord(clock.until)}
                </span>
              )}
            </>
          )}
        </span>
      </span>
    </Tag>
  );
}

/* The window each horizon is counting, named the way it is spoken. */
const clockLabel = (id, year, quarter) =>
  id === "h3"
    ? ARC_LABEL
    : id === "year"
      ? String(year)
      : `${quarterOf(quarter).label} · ${year}`;

/* The full card, for the goals screen. Each row also switches the horizon,
   so the countdown is not a second control to learn beside the tabs. */
function CountdownCard({ all, year, quarter, horizon, onPick }) {
  return (
    <Card className="p-6 sm:p-7">
      <div className="min-w-0">
        <h3
          className="flex items-center gap-2 text-[16px] font-extrabold"
          style={{ color: T.ctaLift }}
        >
          <Hourglass size={16} /> العدّ التنازلي
        </h3>
        <p className="mt-1.5 max-w-2xl text-[11.5px] leading-relaxed" style={{ color: T.faint }}>
          الشريط الملوّن ما أُنجز من أهداف النافذة، والعلامة البيضاء واقفة عند
          اليوم الذي أنت فيه. إن سبقتِ العلامةُ الشريطَ فأنت متأخّر — وهذا هو
          الرقم الذي يستحقّ النظر.
        </p>
      </div>

      <div className="mt-5 space-y-2.5">
        {HORIZONS.map((h) => {
          const clock = horizonClock(h.id, all, year, quarter);
          return (
            <HorizonRow
              key={h.id}
              as="button"
              h={h}
              clock={{ ...clock, label: clockLabel(h.id, year, quarter) }}
              on={h.id === horizon}
              onClick={() => onPick(h.id)}
              aria-pressed={h.id === horizon}
            />
          );
        })}
      </div>
    </Card>
  );
}

/* The same three clocks, slimmed for the routine screen. It sits above the
   habit blocks on purpose: the habits are what spend the days it counts. */
function CountdownStrip({ state, onGo }) {
  const all = useMemo(() => (state.goals || []).map(goalShape), [state.goals]);
  /* The calendar being lived in, not the arc's first year. On this screen
     «كم بقي من السنة» can only mean the year outside the window. */
  const here = new Date().getFullYear();
  const year = GOAL_YEARS.includes(here) ? here : GOAL_YEARS[0];
  const quarter = GOAL_YEARS.includes(here) ? currentQuarter() : QUARTERS[0].id;

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3
          className="flex items-center gap-2 text-[14.5px] font-extrabold"
          style={{ color: T.ctaLift }}
        >
          <Hourglass size={15} /> كم بقي؟
        </h3>
        <button
          onClick={onGo}
          className="inline-flex items-center gap-1 text-[10.5px] font-bold transition-colors hover:brightness-125"
          style={{ color: T.cta }}
        >
          أهدافي <ArrowLeft size={11} />
        </button>
      </div>

      <div className="mt-3.5 space-y-2">
        {HORIZONS.map((h) => {
          const clock = horizonClock(h.id, all, year, quarter);
          return (
            <HorizonRow
              key={h.id}
              h={h}
              compact
              clock={{ ...clock, label: clockLabel(h.id, year, quarter) }}
            />
          );
        })}
      </div>
    </Card>
  );
}

/* The word and the vision. Above every goal on the screen, because it is
   what the goals are for — eighteen targets with no sentence saying who they
   are building is a list abandoned in March. */
function NorthStarCard({ value, onSave }) {
  const [draft, setDraft] = useState(null); // null = reading, object = editing
  const star = value || { word: "", vision: "" };
  const empty = !star.word.trim() && !star.vision.trim();

  const commit = () => {
    onSave({
      word: draft.word.trim().slice(0, WORD_MAX),
      vision: draft.vision.trim().slice(0, VISION_MAX),
    });
    setDraft(null);
  };

  return (
    <Card className="relative overflow-hidden p-6 sm:p-7">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/4 h-56 w-56 rounded-full opacity-25 blur-3xl"
        style={{ background: T.violet }}
      />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <h3
          className="flex items-center gap-2 text-[16px] font-extrabold"
          style={{ color: T.accent }}
        >
          <Compass size={17} /> كلمة سنتي ورؤيتي
        </h3>
        <Btn
          variant="ghost"
          size="sm"
          onClick={() =>
            setDraft(draft ? null : { word: star.word, vision: star.vision })
          }
          style={{ borderColor: T.border }}
        >
          {draft ? <X size={13} /> : <SquarePen size={13} />}
          {draft ? "إلغاء" : empty ? "اكتبها" : "تعديل"}
        </Btn>
      </div>

      {draft ? (
        <div className="los-in relative mt-4 space-y-3.5">
          <div>
            <label
              htmlFor="los-ns-word"
              className="mb-1.5 block text-xs"
              style={{ color: T.muted }}
            >
              كلمة واحدة تحكم السنة
            </label>
            <Field
              id="los-ns-word"
              autoFocus
              maxLength={WORD_MAX}
              value={draft.word}
              onChange={(e) => setDraft((d) => ({ ...d, word: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && commit()}
              placeholder="مثال: إتقان"
            />
          </div>
          <div>
            <label
              htmlFor="los-ns-vision"
              className="mb-1.5 block text-xs"
              style={{ color: T.muted }}
            >
              الرؤية — من تريد أن تكون في نهاية {ARC_LABEL}؟
            </label>
            <Field
              as="textarea"
              id="los-ns-vision"
              rows={4}
              maxLength={VISION_MAX}
              value={draft.vision}
              onChange={(e) =>
                setDraft((d) => ({ ...d, vision: e.target.value }))
              }
              placeholder="اكتبها بصيغة الحاضر، كأنها قد تحقّقت: «أنا رجل يقوم لصلاته، يقرأ كل يوم، ويعمل فيما يحبّ…»"
              className="resize-none leading-relaxed"
            />
            <p className="mt-1 text-left text-[10px] tabular-nums" dir="ltr" style={{ color: T.faint }}>
              {draft.vision.length}/{VISION_MAX}
            </p>
          </div>
          <Btn variant="default" size="sm" onClick={commit}>
            <Check size={13} strokeWidth={3} /> احفظ
          </Btn>
        </div>
      ) : empty ? (
        <p
          className="relative mt-4 text-[12.5px] leading-relaxed"
          style={{ color: T.faint }}
        >
          لم تكتب كلمتك بعد. كلمة واحدة وسطرٌ عن الرجل الذي تبنيه — هي ما
          يُبقيك على الأهداف حين يفتر الحافز.
        </p>
      ) : (
        <div className="relative mt-4">
          {star.word.trim() && (
            <p
              className="los-title text-3xl font-extrabold leading-tight sm:text-4xl"
              style={{ wordBreak: "break-word" }}
            >
              {star.word}
            </p>
          )}
          {star.vision.trim() && (
            <p
              className="mt-3 max-w-2xl whitespace-pre-line text-[13px] leading-relaxed"
              style={{ color: T.muted }}
            >
              {star.vision}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

/* A compact meter row. Used on the card and again on the desk, so the two
   can never show a different number for the same goal. */
function GoalMeter({ goal, pct, tint, onStep }) {
  const has = goal.target > 0;
  const full = pct >= 100;
  const bar = full ? T.primary : tint;
  return (
    <div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full"
        style={{ background: "rgba(255,255,255,0.07)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.min(100, pct)}%`,
            backgroundImage: `linear-gradient(90deg, ${bar}, ${bar}AA)`,
            boxShadow: pct ? `0 0 12px ${bar}99` : "none",
          }}
        />
      </div>
      {has && (
        <div className="mt-2 flex items-center justify-between gap-2">
          <span dir="ltr" className="text-[11px] tabular-nums" style={{ color: T.faint }}>
            {goal.current} / {goal.target}
            {goal.unit ? ` ${goal.unit}` : ""}
          </span>
          {onStep && (
            <span className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => onStep(-goal.step)}
                disabled={goal.current <= 0}
                aria-label={`أنقص ${goal.text}`}
                className="flex h-6 w-6 items-center justify-center rounded-md border transition-all active:scale-90 disabled:opacity-25"
                style={{ borderColor: T.border, color: T.muted }}
              >
                <Minus size={11} strokeWidth={3} />
              </button>
              <button
                type="button"
                onClick={() => onStep(goal.step)}
                disabled={goal.current >= goal.target}
                aria-label={`زد ${goal.text}`}
                className="flex h-6 w-6 items-center justify-center rounded-md border transition-all active:scale-90 disabled:opacity-25"
                style={{ borderColor: `${tint}4D`, color: tint }}
              >
                <Plus size={11} strokeWidth={3} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* «بقي ١٢ يومًا», «اليوم آخر يوم», «فات موعده قبل ٣ أيام». A window that has
   closed has to say so — a goal silently sitting past its deadline is the
   one state a planner must never render as normal. */
function DeadlineChip({ day, done }) {
  const left = daysTo(day);
  if (left === null) return null;
  const over = left < 0;
  const tint = done
    ? T.primary
    : over
      ? T.danger
      : left <= 7
        ? T.cta
        : left <= 30
          ? T.accent
          : T.faint;
  const n = Math.abs(over ? left : left);
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] font-bold"
      style={{ background: `${tint}1A`, color: tint }}
      title={day}
    >
      <Hourglass size={9} />
      {left === 0 ? (
        "اليوم آخر يوم"
      ) : over ? (
        <>
          فات قبل{" "}
          <span dir="ltr" className="tabular-nums">
            {n}
          </span>{" "}
          {dayWord(n)}
        </>
      ) : (
        <>
          بقي{" "}
          <span dir="ltr" className="tabular-nums">
            {n}
          </span>{" "}
          {dayWord(n)}
        </>
      )}
    </span>
  );
}

function GoalCard({ goal, all, parent, kids, onToggle, onStep, onOpen }) {
  const [burst, fireBurst] = useBurst(700);
  const p = pillarOf(goal.pillar);
  const pct = goalPct(goal, all);
  const ripe = pct >= 100 && !goal.done;
  const Icon = p.icon;
  const childLabel = horizonOf(goal.horizon).child;
  const kidsDone = kids.filter((k) => k.done).length;

  const handle = () => {
    if (!goal.done) fireBurst();
    onToggle();
  };

  return (
    <div
      className={`rounded-2xl border p-3.5 transition-all duration-200${
        burst ? " los-reward" : ""
      }`}
      style={{
        borderColor: burst
          ? T.primary
          : goal.done
            ? `${T.primary}4D`
            : ripe
              ? `${T.accent}4D`
              : T.border,
        backgroundColor: goal.done
          ? `${T.primary}0F`
          : "rgba(255,255,255,0.03)",
      }}
    >
      <div className="flex items-start gap-1">
        <Checkbox
          checked={goal.done}
          onToggle={handle}
          label={goal.text}
          tint={T.primary}
          size="sm"
        />
        <button
          onClick={onOpen}
          aria-label={`مكتب ${goal.text}`}
          title="افتح المكتب"
          className="shrink-0 rounded p-1.5 transition-all hover:scale-110"
          style={{ color: p.tint }}
        >
          <SquarePen size={13} />
        </button>
      </div>

      <div className="mt-2.5">
        <GoalMeter goal={goal} pct={pct} tint={p.tint} onStep={onStep} />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span
          className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] font-bold"
          style={{ background: `${p.tint}1A`, color: p.tint }}
        >
          <Icon size={9} />
          {p.label}
        </span>
        <span
          dir="ltr"
          className="shrink-0 rounded-md px-1.5 py-0.5 text-[9.5px] font-extrabold tabular-nums"
          style={{
            background: pct >= 100 ? `${T.primary}1A` : "rgba(255,255,255,0.05)",
            color: pct >= 100 ? T.primary : T.muted,
          }}
        >
          {pct}%
        </span>
        <DeadlineChip day={goalEnd(goal)} done={goal.done} />
        {goal.steps.length > 0 && (
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px]"
            style={{ background: "rgba(255,255,255,0.05)", color: T.faint }}
          >
            <ListChecks size={9} />
            <span dir="ltr" className="tabular-nums">
              {goal.steps.filter((s) => s.done).length}/{goal.steps.length}
            </span>
          </span>
        )}
        {kids.length > 0 && (
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px]"
            style={{ background: `${T.sky}14`, color: T.sky }}
            title={`${childLabel || "هدف"} يخدم هذا الهدف`}
          >
            <Layers size={9} />
            <span dir="ltr" className="tabular-nums">
              {kidsDone}/{kids.length}
            </span>
          </span>
        )}
        {goal.why.trim() && (
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px]"
            style={{ background: `${T.violet}14`, color: T.violet }}
            title={goal.why}
          >
            <Lightbulb size={9} /> لماذا
          </span>
        )}
      </div>

      {/* The one line the chain is for: what this goal is in service of. */}
      {parent ? (
        <p
          className="mt-2 flex items-start gap-1.5 text-[10px] leading-relaxed"
          style={{ color: T.faint }}
        >
          <Link2 size={10} className="mt-0.5 shrink-0" style={{ color: T.sky }} />
          <span>
            يخدم:{" "}
            <span style={{ color: T.muted }}>{parent.text}</span>
          </span>
        </p>
      ) : (
        goal.horizon !== "h3" && (
          <p
            className="mt-2 flex items-start gap-1.5 text-[10px] leading-relaxed"
            style={{ color: `${T.accent}B3` }}
          >
            <AlertTriangle size={10} className="mt-0.5 shrink-0" />
            <span>لا يخدم هدفًا أعلى — اربطه من المكتب.</span>
          </p>
        )
      )}

      {ripe && (
        <p
          className="los-in mt-2 flex items-center gap-1.5 text-[10px] font-bold"
          style={{ color: T.accent }}
        >
          <Check size={11} strokeWidth={3} /> اكتمل القياس — علّمه مُحقَّقًا
        </p>
      )}
    </div>
  );
}

/* --- the desk --------------------------------------------------------- *
 *  Everything a goal is, in one place: the horizon, the window, the reason,
 *  the meter, the milestones, the deadline and the goal it serves. Edits are
 *  applied live through `onPatch` rather than held in a draft and saved at
 *  the end — the same way the book and course desks work, so closing the
 *  sheet can never be the thing that loses a milestone.
 * ---------------------------------------------------------------------- */
function GoalDesk({ goal, all, onClose, onPatch, onDelete }) {
  const [step, setStep] = useState("");
  /* Every hook runs before the early return, without exception. This sheet is
     rendered with `goal === null` whenever it is shut, so a `useMemo` placed
     after the guard would run on open and not on close — which is React
     error #310 and a blank screen, not a warning. */
  const below = useMemo(() => {
    const out = new Set();
    if (!goal) return out;
    const walk = (id, depth) => {
      if (depth > HORIZONS.length) return;
      for (const g of all)
        if (g.parent === id && !out.has(g.id)) {
          out.add(g.id);
          walk(g.id, depth + 1);
        }
    };
    walk(goal.id, 0);
    return out;
  }, [all, goal]);

  if (!goal) return null;

  const h = horizonOf(goal.horizon);
  const p = pillarOf(goal.pillar);
  const pct = goalPct(goal, all);
  const want = parentHorizon(goal.horizon);
  const kids = all.filter((g) => g.parent === goal.id);
  /* The goal's own year is always offered, even once the arc has moved past
     it — otherwise the desk would show no year selected at all and the first
     tap would move the goal somewhere the user never asked for. */
  const deskYears = [...new Set([...GOAL_YEARS, goal.year])].sort((a, b) => a - b);
  /* Only goals one horizon up may be a parent, and never one already below
     this goal in the chain — that is the loop `migrate` has to repair, and it
     is cheaper to make it unreachable in the picker than to repair it later. */
  const options = want
    ? all.filter((g) => g.horizon === want && g.id !== goal.id && !below.has(g.id))
    : [];

  const addStep = () => {
    const text = step.trim();
    if (!text) return;
    onPatch({ steps: [...goal.steps, { id: uid(), text, done: false }] });
    setStep("");
  };

  const label = "mb-1.5 block text-xs";

  return (
    <Modal open={!!goal} onClose={onClose} title="مكتب الهدف" wide>
      <div className="space-y-5">
        <div>
          <label htmlFor="los-gd-text" className={label} style={{ color: T.muted }}>
            الهدف
          </label>
          <Field
            id="los-gd-text"
            value={goal.text}
            onChange={(e) => onPatch({ text: e.target.value })}
            placeholder="مثال: ختم القرآن تدبّرًا مرّتين"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold"
            style={{ background: `${h.tint}1A`, color: h.tint }}
          >
            <h.icon size={12} /> {h.label}
          </span>
          <span
            dir="ltr"
            className="rounded-lg px-2 py-1 text-[12px] font-extrabold tabular-nums"
            style={{
              background: pct >= 100 ? `${T.primary}1A` : "rgba(255,255,255,0.05)",
              color: pct >= 100 ? T.primary : T.muted,
            }}
          >
            {pct}%
          </span>
          <DeadlineChip day={goalEnd(goal)} done={goal.done} />
          <Btn
            variant={goal.done ? "default" : "outline"}
            size="sm"
            className="mr-auto"
            onClick={() => onPatch({ done: !goal.done })}
          >
            <Check size={13} strokeWidth={3} />
            {goal.done ? "مُحقَّق" : "علّمه مُحقَّقًا"}
          </Btn>
        </div>

        {/* why */}
        <div>
          <label htmlFor="los-gd-why" className={label} style={{ color: T.muted }}>
            لماذا هذا الهدف؟
          </label>
          <Field
            as="textarea"
            id="los-gd-why"
            rows={2}
            value={goal.why}
            onChange={(e) => onPatch({ why: e.target.value.slice(0, 400) })}
            placeholder="السبب الذي يحملك عليه في الشهر السابع، لا في الأول."
            className="resize-none leading-relaxed"
          />
        </div>

        {/* the window */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <span className={label} style={{ color: T.muted }}>
              الأفق
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {HORIZONS.map((x) => {
                const on = x.id === goal.horizon;
                return (
                  <button
                    key={x.id}
                    type="button"
                    onClick={() =>
                      /* Changing horizon invalidates the parent: a 90-day goal
                         promoted to a yearly one cannot still serve the yearly
                         goal it used to. Cutting it here is what keeps the
                         chain legal without a repair pass. */
                      on
                        ? undefined
                        : onPatch({ horizon: x.id, parent: null })
                    }
                    aria-pressed={on}
                    className="rounded-xl border px-2 py-2 text-[10.5px] font-bold transition-all"
                    style={{
                      borderColor: on ? `${x.tint}80` : T.border,
                      background: on ? `${x.tint}1F` : "rgba(255,255,255,0.03)",
                      color: on ? x.tint : T.muted,
                    }}
                  >
                    {x.short}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className={label} style={{ color: T.muted }}>
              {goal.horizon === "quarter" ? "الربع والسنة" : "السنة"}
            </span>
            <div className="flex gap-1.5">
              {goal.horizon === "quarter" &&
                QUARTERS.map((q) => {
                  const on = q.id === goal.quarter;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => onPatch({ quarter: q.id })}
                      aria-pressed={on}
                      className="flex-1 rounded-xl border py-2 text-[10.5px] font-bold transition-all"
                      style={{
                        borderColor: on ? `${q.tint}80` : T.border,
                        background: on ? `${q.tint}1F` : "rgba(255,255,255,0.03)",
                        color: on ? q.tint : T.muted,
                      }}
                      title={q.months}
                    >
                      {q.id.toUpperCase()}
                    </button>
                  );
                })}
              {goal.horizon !== "h3" &&
                deskYears.map((y) => {
                  const on = y === goal.year;
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => onPatch({ year: y })}
                      aria-pressed={on}
                      dir="ltr"
                      className="flex-1 rounded-xl border py-2 text-[10.5px] font-bold tabular-nums transition-all"
                      style={{
                        borderColor: on ? `${T.accent}80` : T.border,
                        background: on ? `${T.accent}1F` : "rgba(255,255,255,0.03)",
                        color: on ? T.accent : T.muted,
                      }}
                    >
                      {y}
                    </button>
                  );
                })}
              {goal.horizon === "h3" && (
                <p
                  className="flex-1 rounded-xl border px-3 py-2 text-center text-[10.5px] font-bold"
                  style={{ borderColor: T.border, color: T.faint }}
                >
                  {ARC_LABEL}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* pillar */}
        <div>
          <span className={label} style={{ color: T.muted }}>
            الركيزة
          </span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PILLARS.map((x) => {
              const on = x.id === goal.pillar;
              const XIcon = x.icon;
              return (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => onPatch({ pillar: x.id })}
                  aria-pressed={on}
                  className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition-all"
                  style={{
                    borderColor: on ? `${x.tint}80` : T.border,
                    background: on ? `${x.tint}1F` : "rgba(255,255,255,0.03)",
                    color: on ? x.tint : T.muted,
                  }}
                >
                  <XIcon size={14} strokeWidth={2} />
                  {x.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* the chain */}
        {want && (
          <div>
            <label htmlFor="los-gd-parent" className={label} style={{ color: T.muted }}>
              يخدم هدف «{horizonOf(want).label}»
            </label>
            <select
              id="los-gd-parent"
              value={goal.parent || ""}
              onChange={(e) => onPatch({ parent: e.target.value || null })}
              className="w-full rounded-xl border bg-transparent px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-white/30"
              style={{ borderColor: T.border, color: T.muted }}
            >
              <option value="" style={{ background: T.cardSolid }}>
                — لا يخدم شيئًا بعد —
              </option>
              {options.map((g) => (
                <option key={g.id} value={g.id} style={{ background: T.cardSolid }}>
                  {g.text}
                </option>
              ))}
            </select>
            {options.length === 0 && (
              <p className="mt-1.5 text-[10.5px]" style={{ color: T.accent }}>
                لا أهداف في أفق «{horizonOf(want).label}» بعد — أضف واحدًا أولًا
                ليصبح لهذا الهدف ما يخدمه.
              </p>
            )}
          </div>
        )}

        {/* the meter */}
        <div
          className="rounded-2xl border p-4"
          style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
        >
          <p className="flex items-center gap-2 text-[12.5px] font-bold" style={{ color: T.sky }}>
            <Gauge size={14} /> القياس
          </p>
          <p className="mt-1 text-[10.5px] leading-relaxed" style={{ color: T.faint }}>
            هدف بلا رقم لا يُقاس. اتركه صفرًا إن كان هدفًا بنعم أو لا — حينها
            تقيسه خطواته أو الأهداف التي تخدمه.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label htmlFor="los-gd-target" className="mb-1 block text-[10px]" style={{ color: T.faint }}>
                الهدف الرقمي
              </label>
              <Field
                id="los-gd-target"
                type="number"
                min="0"
                dir="ltr"
                value={goal.target || ""}
                onChange={(e) => {
                  const target = Math.max(0, Math.round(+e.target.value) || 0);
                  onPatch({
                    target,
                    current: target > 0 ? Math.min(target, goal.current) : goal.current,
                  });
                }}
                placeholder="0"
                className="tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="los-gd-current" className="mb-1 block text-[10px]" style={{ color: T.faint }}>
                المُحقَّق
              </label>
              <Field
                id="los-gd-current"
                type="number"
                min="0"
                dir="ltr"
                value={goal.current || ""}
                onChange={(e) => {
                  const n = Math.max(0, Math.round(+e.target.value) || 0);
                  onPatch({ current: goal.target > 0 ? Math.min(goal.target, n) : n });
                }}
                placeholder="0"
                className="tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="los-gd-unit" className="mb-1 block text-[10px]" style={{ color: T.faint }}>
                الوحدة
              </label>
              <Field
                id="los-gd-unit"
                maxLength={16}
                value={goal.unit}
                onChange={(e) => onPatch({ unit: e.target.value })}
                placeholder="كتاب"
              />
            </div>
            <div>
              <label htmlFor="los-gd-step" className="mb-1 block text-[10px]" style={{ color: T.faint }}>
                مقدار الخطوة
              </label>
              <Field
                id="los-gd-step"
                type="number"
                min="1"
                dir="ltr"
                value={goal.step}
                onChange={(e) =>
                  onPatch({ step: Math.max(1, Math.round(+e.target.value) || 1) })
                }
                className="tabular-nums"
              />
            </div>
          </div>
          {goal.target > 0 && (
            <div className="mt-3.5">
              <GoalMeter
                goal={goal}
                pct={pct}
                tint={p.tint}
                onStep={(n) =>
                  onPatch({
                    current: Math.max(0, Math.min(goal.target, goal.current + n)),
                  })
                }
              />
            </div>
          )}
        </div>

        {/* deadline */}
        <div>
          <label htmlFor="los-gd-deadline" className={label} style={{ color: T.muted }}>
            موعد نهائي <span style={{ color: T.faint }}>(اختياري)</span>
          </label>
          <div className="flex items-center gap-2">
            <DateField
              id="los-gd-deadline"
              value={goal.deadline}
              onChange={(v) => onPatch({ deadline: v })}
            />
            {goal.deadline && (
              <Btn variant="ghost" size="sm" onClick={() => onPatch({ deadline: "" })} style={{ borderColor: T.border }}>
                <X size={13} /> امسح
              </Btn>
            )}
          </div>
          <p className="mt-1.5 text-[10.5px]" style={{ color: T.faint }}>
            بلا موعد، ينتهي الهدف مع نهاية نافذته:{" "}
            <span dir="ltr">{goalEnd(goal)}</span>.
          </p>
        </div>

        {/* milestones */}
        <div>
          <span className={label} style={{ color: T.muted }}>
            الخطوات — ما الذي يجعله يتحرّك؟
          </span>
          <div className="space-y-1">
            {goal.steps.length === 0 ? (
              <p className="py-2 text-[11px]" style={{ color: T.faint }}>
                لا خطوات بعد. أول خطوة صغيرة تكفي لبدء الحركة.
              </p>
            ) : (
              goal.steps.map((s, i) => (
                <div
                  key={s.id}
                  className="group flex items-center gap-1 rounded-lg border transition-all"
                  style={{
                    borderColor: "transparent",
                    background: s.done ? `${T.primary}0F` : "transparent",
                  }}
                >
                  <Checkbox
                    checked={s.done}
                    onToggle={() =>
                      onPatch({
                        steps: goal.steps.map((x) =>
                          x.id === s.id ? { ...x, done: !x.done } : x,
                        ),
                      })
                    }
                    label={s.text}
                    tint={T.primary}
                    size="sm"
                  />
                  <button
                    onClick={() =>
                      onPatch({
                        steps: goal.steps.filter((x) => x.id !== s.id),
                      })
                    }
                    aria-label={`حذف ${s.text}`}
                    className="shrink-0 rounded p-1.5 text-white/25 opacity-40 transition-all hover:text-red-400 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Trash2 size={12} />
                  </button>
                  <span className="sr-only">خطوة {i + 1}</span>
                </div>
              ))
            )}
          </div>
          <div className="mt-2 flex gap-2">
            <Field
              value={step}
              onChange={(e) => setStep(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addStep()}
              placeholder="خطوة جديدة"
              className="flex-1"
            />
            <Btn variant="default" size="sm" onClick={addStep} className="shrink-0">
              <Plus size={13} strokeWidth={3} /> أضف
            </Btn>
          </div>
        </div>

        {/* what it carries */}
        {kids.length > 0 && (
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: `${T.sky}3D`, background: `${T.sky}0F` }}
          >
            <p className="flex items-center gap-2 text-[12.5px] font-bold" style={{ color: T.sky }}>
              <Layers size={14} /> ما يخدم هذا الهدف
            </p>
            <div className="mt-2.5 space-y-1.5">
              {kids.map((k) => {
                const kp = goalPct(k, all);
                return (
                  <div key={k.id} className="flex items-center gap-2">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: k.done ? T.primary : pillarOf(k.pillar).tint }}
                    />
                    <span
                      className="min-w-0 flex-1 truncate text-[11.5px]"
                      style={{
                        color: k.done ? T.muted : T.fg,
                        textDecorationLine: k.done ? "line-through" : "none",
                      }}
                    >
                      {k.text}
                    </span>
                    <span
                      dir="ltr"
                      className="shrink-0 text-[10.5px] font-bold tabular-nums"
                      style={{ color: kp >= 100 ? T.primary : T.faint }}
                    >
                      {kp}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Btn
          variant="danger"
          size="sm"
          className="w-full"
          onClick={() => {
            if (
              window.confirm(
                kids.length
                  ? `حذف «${goal.text}»؟ ${kids.length} هدفًا يخدمه ستبقى لكن بلا ارتباط.`
                  : `حذف «${goal.text}»؟`,
              )
            )
              onDelete();
          }}
        >
          <Trash2 size={13} /> احذف الهدف
        </Btn>
      </div>
    </Modal>
  );
}

function GoalsModule({ state, setState }) {
  /* Opens on the ninety days you are actually in — the whole point of
     chunking. The horizons above it are one tap away but never the default.
     Before the arc starts there is no «now» to open on, so it falls to the
     first ninety days of the first year instead: opening on Q4 of a year
     that has not begun, because the wall clock happens to say October, is
     the one window nobody is planning in. */
  const here = new Date().getFullYear();
  const arm = useUndo();
  const [horizon, setHorizon] = useState("quarter");
  const [quarter, setQuarter] = useState(() => openingWindow(state.goals).quarter);
  const [year, setYear] = useState(() => openingWindow(state.goals).year);
  const [deskId, setDeskId] = useState(null);
  const [orphansOnly, setOrphansOnly] = useState(false);

  const all = useMemo(() => (state.goals || []).map(goalShape), [state.goals]);
  const byId = useMemo(() => new Map(all.map((g) => [g.id, g])), [all]);
  const kidsOf = useMemo(() => {
    const m = new Map();
    for (const g of all) {
      if (!g.parent) continue;
      if (!m.has(g.parent)) m.set(g.parent, []);
      m.get(g.parent).push(g);
    }
    return m;
  }, [all]);

  /* The years on offer: the arc, plus any year that still has goals filed in
     it. Without the second half, a year the arc has moved past would keep its
     goals but lose its tab — and a goal you cannot navigate to is gone as far
     as the user is concerned. */
  const years = useMemo(() => {
    const set = new Set(GOAL_YEARS);
    for (const g of all) if (g.horizon !== "h3") set.add(g.year);
    return [...set].sort((a, b) => a - b);
  }, [all]);

  const meta = horizonOf(horizon);
  /* Which window the chosen horizon means. The three-year arc has only one. */
  const inWindow = useCallback(
    (g) =>
      g.horizon !== horizon
        ? false
        : horizon === "quarter"
          ? g.quarter === quarter && g.year === year
          : horizon === "year"
            ? g.year === year
            : true,
    [horizon, quarter, year],
  );

  const scoped = useMemo(() => all.filter(inWindow), [all, inWindow]);
  /* Only below the top horizon: a three-year goal has nothing above it to
     serve, so calling it an orphan would be nonsense. */
  const orphans = useMemo(
    () => scoped.filter((g) => g.horizon !== "h3" && !g.parent),
    [scoped],
  );
  const shown = orphansOnly ? orphans : scoped;

  const done = scoped.filter((g) => g.done).length;
  const pct = scoped.length
    ? Math.round(scoped.reduce((n, g) => n + goalPct(g, all), 0) / scoped.length)
    : 0;

  const live =
    horizon === "quarter"
      ? quarter === currentQuarter() && year === here
      : horizon === "year"
        ? year === here
        : true;

  const windowEnd =
    horizon === "quarter"
      ? goalEnd({ horizon: "quarter", quarter, year, deadline: "" })
      : horizon === "year"
        ? `${year}-12-31`
        : `${GOAL_YEARS[GOAL_YEARS.length - 1]}-12-31`;
  const daysLeft = daysTo(windowEnd);

  const patch = (id, fields) =>
    setState((s) => ({
      ...s,
      goals: (s.goals || []).map((g) =>
        g.id === id ? goalShape({ ...goalShape(g), ...fields }) : g,
      ),
    }));

  const remove = (id) => {
    /* The cut links come back with the list, which is the point of restoring
       the array whole rather than re-inserting the row. */
    arm("حُذف الهدف", { goals: state.goals || [] });
    setState((s) => ({
      ...s,
      /* The children stay — they are the user's own rows, not this goal's
         property. Their link is cut rather than followed, which is also what
         `migrate` would do on the next load; doing it here keeps the screen
         honest without waiting for a reload. */
      goals: (s.goals || [])
        .filter((g) => g.id !== id)
        .map((g) => (g.parent === id ? { ...g, parent: null } : g)),
    }));
  };

  /* A new goal lands in the window on screen and opens straight onto its own
     desk: a goal with no reason, no measure and nothing it serves is the kind
     this screen exists to prevent, so the form that asks for all three is the
     next thing the user sees rather than something to go hunting for. */
  const add = () => {
    const row = goalShape({
      horizon,
      quarter,
      year,
      pillar: shown[0]?.pillar || "faith",
    });
    setState((s) => ({ ...s, goals: [...(s.goals || []), row] }));
    setDeskId(row.id);
  };

  const desk = deskId ? byId.get(deskId) : null;

  return (
    <div className="space-y-7">
      <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="min-w-0">
          <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">
            أهدافي
          </h2>
          <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/40">
            {meta.hint}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Btn variant="default" size="sm" onClick={add}>
              <Plus size={14} strokeWidth={3} /> هدف جديد
            </Btn>
            <Badge tint={pct === 100 && scoped.length ? T.primary : meta.tint}>
              <span dir="ltr" className="tabular-nums">
                {done}/{scoped.length}
              </span>
              {" مُحقَّق"}
            </Badge>
            {daysLeft !== null && daysLeft > 0 && live && (
              <Badge tint={T.cta}>
                {daysLeft === 1 ? (
                  "بقي يوم واحد"
                ) : daysLeft === 2 ? (
                  "بقي يومان"
                ) : (
                  <>
                    بقي{" "}
                    <span dir="ltr" className="tabular-nums">
                      {daysLeft}
                    </span>{" "}
                    {dayWord(daysLeft)}
                  </>
                )}
              </Badge>
            )}
          </div>
        </div>
        <ProgressRing value={pct} size={150} stroke={11} label="تقدّم الأفق" />
      </Card>

      <NorthStarCard
        value={state.northStar}
        onSave={(northStar) => setState((s) => ({ ...s, northStar }))}
      />

      {/* The clock on all three windows at once. Doubles as the horizon
          switcher, so the countdown is not a second control to learn. */}
      <CountdownCard
        all={all}
        year={year}
        quarter={quarter}
        horizon={horizon}
        onPick={(id) => {
          setHorizon(id);
          setOrphansOnly(false);
        }}
      />

      {/* the window inside the horizon */}
      {horizon !== "h3" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            {years.map((y) => {
              const on = y === year;
              const list = all.filter((g) => g.horizon === horizon && g.year === y);
              return (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  aria-pressed={on}
                  dir="ltr"
                  className="flex-1 rounded-xl border px-2 py-2 text-[11.5px] font-extrabold tabular-nums transition-all duration-200"
                  style={{
                    borderColor: on ? `${T.accent}80` : T.border,
                    background: on ? `${T.accent}1F` : "rgba(255,255,255,0.03)",
                    color: on ? T.accent : T.faint,
                  }}
                >
                  {y}
                  <span className="mr-1.5 opacity-60">({list.length})</span>
                </button>
              );
            })}
          </div>

          {horizon === "quarter" && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {QUARTERS.map((q) => {
                const on = q.id === quarter;
                const now = q.id === currentQuarter() && year === here;
                const list = all.filter(
                  (g) => g.horizon === "quarter" && g.quarter === q.id && g.year === year,
                );
                const hit = list.filter((g) => g.done).length;
                return (
                  <button
                    key={q.id}
                    onClick={() => setQuarter(q.id)}
                    aria-pressed={on}
                    className="rounded-2xl border px-3 py-3 text-right transition-all duration-200"
                    style={{
                      borderColor: on ? `${q.tint}80` : T.border,
                      backgroundImage: on
                        ? `linear-gradient(160deg, ${q.tint}2E, ${q.tint}0A)`
                        : "none",
                      backgroundColor: on ? "transparent" : "rgba(255,255,255,0.03)",
                      color: on ? q.tint : T.muted,
                      boxShadow: on ? `0 10px 26px -16px ${q.tint}` : "none",
                    }}
                  >
                    <span className="flex items-center gap-1.5 text-[13px] font-extrabold">
                      {q.label}
                      {now && (
                        <span
                          aria-label="الربع الحالي"
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: T.cta, boxShadow: `0 0 8px ${T.cta}` }}
                        />
                      )}
                    </span>
                    <span className="mt-0.5 block text-[10px]" style={{ color: T.faint }}>
                      {q.months}
                    </span>
                    <span
                      className="mt-1 block text-[10.5px] font-bold tabular-nums"
                      dir="ltr"
                      style={{ color: on ? q.tint : T.faint }}
                    >
                      {hit}/{list.length}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Every goal below the top horizon should answer to one above it.
          Saying so once, with a way to see exactly which ones do not, is the
          whole discipline this screen adds over a flat list. */}
      {orphans.length > 0 && (
        <button
          onClick={() => setOrphansOnly((v) => !v)}
          aria-pressed={orphansOnly}
          className="flex w-full items-center gap-2.5 rounded-2xl border px-4 py-3 text-right transition-all duration-200"
          style={{
            borderColor: orphansOnly ? `${T.cta}80` : `${T.accent}4D`,
            background: orphansOnly ? `${T.cta}1A` : `${T.accent}12`,
          }}
        >
          <AlertTriangle size={15} className="shrink-0" style={{ color: orphansOnly ? T.cta : T.accent }} />
          <span className="min-w-0 flex-1 text-[12px] font-bold leading-relaxed" style={{ color: orphansOnly ? T.ctaLift : T.accent }}>
            <span dir="ltr" className="tabular-nums">
              {orphans.length}
            </span>{" "}
            من أهداف هذه النافذة لا تخدم هدفًا أعلى.
            <span className="block text-[10.5px] font-normal" style={{ color: T.muted }}>
              {orphansOnly ? "اضغط لعرض الكل" : "اضغط لعرضها وحدها"}
            </span>
          </span>
        </button>
      )}

      {/* by pillar */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {PILLARS.map((p) => {
          const list = shown.filter((g) => g.pillar === p.id);
          const hit = list.filter((g) => g.done).length;
          const complete = list.length > 0 && hit === list.length;
          const Icon = p.icon;
          const avg = list.length
            ? Math.round(list.reduce((n, g) => n + goalPct(g, all), 0) / list.length)
            : 0;
          return (
            <Card key={p.id} className="p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: complete ? `${T.primary}59` : `${p.tint}45`,
                    background: complete ? `${T.primary}1A` : `${p.tint}18`,
                    color: complete ? T.primary : p.tint,
                  }}
                >
                  <Icon size={18} strokeWidth={1.9} />
                </span>
                <h3 className="text-[15px] font-bold">{p.label}</h3>
                <span className="mr-auto text-[11px] tabular-nums text-white/30">
                  <span dir="ltr">
                    {hit}/{list.length}
                  </span>
                </span>
              </div>

              <div
                className="mt-3.5 h-1 w-full overflow-hidden rounded-full"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${avg}%`,
                    backgroundImage: complete
                      ? `linear-gradient(90deg, ${T.primary}, ${T.primaryLift})`
                      : `linear-gradient(90deg, ${p.tint}, ${p.tint}AA)`,
                    boxShadow: avg ? `0 0 12px ${complete ? T.primary : p.tint}99` : "none",
                  }}
                />
              </div>

              <div className="mt-3 space-y-2">
                {list.length === 0 ? (
                  <p className="py-3 text-center text-[11px] text-white/25">
                    {orphansOnly
                      ? "لا أهداف معلّقة في هذه الركيزة"
                      : "لا أهداف في هذه الركيزة بعد"}
                  </p>
                ) : (
                  list.map((g) => (
                    <GoalCard
                      key={g.id}
                      goal={g}
                      all={all}
                      parent={g.parent ? byId.get(g.parent) : null}
                      kids={kidsOf.get(g.id) || []}
                      onToggle={() => patch(g.id, { done: !g.done })}
                      onStep={
                        g.target > 0
                          ? (n) =>
                              patch(g.id, {
                                current: Math.max(
                                  0,
                                  Math.min(g.target, g.current + n),
                                ),
                              })
                          : null
                      }
                      onOpen={() => setDeskId(g.id)}
                    />
                  ))
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <GoalDesk
        goal={desk}
        all={all}
        onClose={() => setDeskId(null)}
        onPatch={(fields) => patch(deskId, fields)}
        onDelete={() => {
          remove(deskId);
          setDeskId(null);
        }}
      />
    </div>
  );
}

const BOOK_STATUS = {
  planned: { label: "أنوي قراءته", tint: "#A855F7" },
  reading: { label: "أقرأه الآن", tint: "#3B82F6" },
  finished: { label: "أنهيته", tint: T.primary },
};

/* A book's own desk: the summary, the points taken from it, and where the
   reading has reached. Kept in a modal rather than on the card, because the
   card has to stay scannable — this is the place you come back to, not the
   place you glance at. */
function BookDesk({ book, log = [], onClose, onPatch }) {
  const [draft, setDraft] = useState({ text: "", page: "" });
  const [copied, setCopied] = useState(false);

  if (!book) return null;

  const notes = book.notes || [];
  const meta = BOOK_STATUS[book.status] || BOOK_STATUS.planned;

  const addNote = () => {
    const text = draft.text.trim();
    if (!text) return;
    onPatch({
      ...book,
      notes: [...notes, { id: uid(), text, page: draft.page.trim() }],
    });
    setDraft({ text: "", page: "" });
  };

  const dropNote = (id) =>
    onPatch({ ...book, notes: notes.filter((n) => n.id !== id) });

  const moveNote = (id, dir) => {
    const i = notes.findIndex((n) => n.id === id);
    const j = dir === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= notes.length) return;
    const next = notes.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onPatch({ ...book, notes: next });
  };

  /* Everything written about the book, as plain text — so a summary can
     leave the app without an export of the whole state. */
  const copyAll = async () => {
    const lines = [
      `${book.title}${book.author ? ` — ${book.author}` : ""}`,
      "",
      book.lesson ? `أهم درس: ${book.lesson}` : "",
      book.summary ? `\nالملخّص:\n${book.summary}` : "",
      notes.length
        ? `\nالنقاط:\n${notes
            .map((n) => `• ${n.text}${n.page ? ` (ص ${n.page})` : ""}`)
            .join("\n")}`
        : "",
    ].filter(Boolean);
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the text is still on screen to select */
    }
  };

  const total = parseInt(book.pages, 10);
  const at = parseInt(book.page, 10);
  const pct = pctOf(book);

  return (
    <Modal
      open={!!book}
      onClose={onClose}
      title={book.title || "دفتر الكتاب"}
      footer={
        <>
          <Btn variant="outline" className="flex-1" onClick={copyAll}>
            {copied ? <CheckCheck size={15} /> : <Copy size={15} />}
            {copied ? "نُسخ" : "نسخ الكل"}
          </Btn>
          <Btn variant="default" className="flex-1" onClick={onClose}>
            تمّ
          </Btn>
        </>
      }
    >
      <div className="space-y-5">
        <p className="-mt-2 text-[11px]" style={{ color: T.faint }}>
          {book.author || "بلا مؤلّف"} · {meta.label}
        </p>

        {/* where the reading has reached */}
        <div
          className="space-y-2.5 rounded-2xl border p-3.5"
          style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
        >
          <span className="block text-xs text-white/45">أين وصلت</span>
          <div className="flex items-center gap-2">
            <input
              id={`los-page-${book.id}`}
              value={book.page}
              onChange={(e) => onPatch({ ...book, page: e.target.value })}
              inputMode="numeric"
              aria-label="الصفحة الحالية"
              placeholder="الصفحة"
              className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm tabular-nums text-white/85 outline-none transition-colors placeholder:text-white/20 focus:border-white/30"
              style={{ borderColor: T.border }}
            />
            <span className="shrink-0 text-xs text-white/30">من</span>
            <input
              id={`los-pages-${book.id}`}
              value={book.pages}
              onChange={(e) => onPatch({ ...book, pages: e.target.value })}
              inputMode="numeric"
              aria-label="عدد صفحات الكتاب"
              placeholder="الصفحات"
              className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm tabular-nums text-white/85 outline-none transition-colors placeholder:text-white/20 focus:border-white/30"
              style={{ borderColor: T.border }}
            />
          </div>
          {pct !== null && (
            <>
              <div
                className="h-1.5 w-full overflow-hidden rounded-full"
                style={{ background: "rgba(255,255,255,0.07)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    backgroundImage: `linear-gradient(90deg, ${meta.tint}, ${T.accent})`,
                    boxShadow: `0 0 12px ${meta.tint}99`,
                  }}
                />
              </div>
              <p className="text-[10.5px]" style={{ color: T.faint }}>
                <span dir="ltr" className="tabular-nums">
                  {pct}%
                </span>{" "}
                — بقي{" "}
                <span dir="ltr" className="tabular-nums">
                  {Math.max(0, total - at)}
                </span>{" "}
                صفحة
              </p>
            </>
          )}
        </div>

        {/* the one takeaway */}
        <div>
          <label
            htmlFor={`los-desk-lesson-${book.id}`}
            className="mb-1.5 block text-xs"
            style={{ color: `${T.accent}CC` }}
          >
            أهم درس يغيّر حياتي
          </label>
          <textarea
            id={`los-desk-lesson-${book.id}`}
            value={book.lesson}
            onChange={(e) => onPatch({ ...book, lesson: e.target.value })}
            rows={2}
            placeholder="الدرس الواحد الذي ستطبّقه…"
            className="w-full resize-none rounded-xl border bg-transparent px-3 py-2.5 text-[12.5px] leading-relaxed text-white/80 outline-none transition-colors placeholder:text-white/20 focus:border-white/30"
            style={{ borderColor: T.border }}
          />
        </div>

        {/* the summary */}
        <div>
          <label
            htmlFor={`los-summary-${book.id}`}
            className="mb-1.5 block text-xs text-white/45"
          >
            ملخّص الكتاب
          </label>
          <textarea
            id={`los-summary-${book.id}`}
            value={book.summary}
            onChange={(e) => onPatch({ ...book, summary: e.target.value })}
            rows={6}
            placeholder="لخّصه بكلماتك أنت — الفكرة الكبرى، وكيف بناها المؤلّف…"
            className="w-full resize-y rounded-xl border bg-transparent px-3 py-2.5 text-[12.5px] leading-relaxed text-white/80 outline-none transition-colors placeholder:text-white/20 focus:border-white/30"
            style={{ borderColor: T.border }}
          />
        </div>

        {/* every session this book has had */}
        {log.length > 0 && (
          <div>
            <span className="mb-1.5 block text-xs text-white/45">
              سجلّ القراءة{" "}
              <span dir="ltr" className="tabular-nums" style={{ color: T.sky }}>
                ({sumPages(log)} صفحة)
              </span>
            </span>
            <div
              className="max-h-40 space-y-1 overflow-y-auto rounded-2xl border p-2.5"
              style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
            >
              {[...log]
                .reverse()
                .map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5"
                    style={{ background: "rgba(255,255,255,0.02)" }}
                  >
                    <span dir="ltr" className="text-[10.5px] tabular-nums" style={{ color: T.faint }}>
                      {r.date}
                    </span>
                    <span
                      dir="ltr"
                      className="text-[11px] font-bold tabular-nums"
                      style={{ color: T.sky }}
                    >
                      +{r.pages}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* the points */}
        <div>
          <span className="mb-1.5 block text-xs text-white/45">
            نقاط ومقتطفات{" "}
            {notes.length > 0 && (
              <span dir="ltr" className="tabular-nums" style={{ color: T.accent }}>
                ({notes.length})
              </span>
            )}
          </span>

          <div
            className="space-y-2 rounded-2xl border p-3"
            style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
          >
            <textarea
              id={`los-note-${book.id}`}
              value={draft.text}
              onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))}
              rows={2}
              aria-label="نقطة جديدة"
              placeholder="اقتباس أو فكرة تستحقّ أن تعود إليها…"
              className="w-full resize-none rounded-xl border bg-transparent px-3 py-2 text-[12px] leading-relaxed text-white/80 outline-none transition-colors placeholder:text-white/20 focus:border-white/30"
              style={{ borderColor: T.border }}
            />
            <div className="flex gap-2">
              <input
                value={draft.page}
                onChange={(e) => setDraft((d) => ({ ...d, page: e.target.value }))}
                inputMode="numeric"
                aria-label="رقم الصفحة"
                placeholder="ص"
                className="w-20 shrink-0 rounded-xl border bg-transparent px-3 py-2 text-[12px] tabular-nums text-white/80 outline-none transition-colors placeholder:text-white/20 focus:border-white/30"
                style={{ borderColor: T.border }}
              />
              <Btn variant="default" size="sm" className="flex-1" onClick={addNote}>
                <Plus size={14} strokeWidth={3} /> أضف نقطة
              </Btn>
            </div>
          </div>

          <div className="mt-2 space-y-2">
            {notes.length === 0 ? (
              <p
                className="py-3 text-center text-[11px]"
                style={{ color: T.faint }}
              >
                لا نقاط بعد. أوّل اقتباس يستحقّ الحفظ يبدأ الدفتر.
              </p>
            ) : (
              notes.map((n, i) => (
                <div
                  key={n.id}
                  className="group flex items-start gap-1.5 rounded-xl border p-2.5"
                  style={{
                    borderColor: T.border,
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <span
                    className="mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[9.5px] tabular-nums"
                    dir="ltr"
                    style={{
                      background: `${meta.tint}1F`,
                      color: meta.tint,
                    }}
                  >
                    {n.page ? `ص ${n.page}` : i + 1}
                  </span>
                  <p className="min-w-0 flex-1 text-[12px] leading-relaxed text-white/75">
                    {n.text}
                  </p>
                  <button
                    onClick={() => moveNote(n.id, "up")}
                    disabled={i === 0}
                    aria-label="تحريك النقطة لأعلى"
                    className="shrink-0 rounded p-1 text-white/25 transition-colors hover:text-white/75 disabled:pointer-events-none disabled:opacity-20"
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button
                    onClick={() => moveNote(n.id, "down")}
                    disabled={i === notes.length - 1}
                    aria-label="تحريك النقطة لأسفل"
                    className="shrink-0 rounded p-1 text-white/25 transition-colors hover:text-white/75 disabled:pointer-events-none disabled:opacity-20"
                  >
                    <ChevronDown size={12} />
                  </button>
                  <button
                    onClick={() => dropNote(n.id)}
                    aria-label="حذف النقطة"
                    className="shrink-0 rounded p-1 text-white/25 transition-colors hover:text-red-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function VaultModule({ state, setState }) {
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("all");
  const [deskId, setDeskId] = useState(null);
  const [read, shuffleRead] = useDailyQuote(state.reads || [], READ_KEY);
  const arm = useUndo();

  const save = () => {
    const title = editing.title.trim();
    if (!title) return;
    setState((s) => ({
      ...s,
      books: editing.id
        ? s.books.map((b) => (b.id === editing.id ? { ...editing, title } : b))
        : [bookShape({ ...editing, id: uid(), title }), ...s.books],
    }));
    setEditing(null);
  };

  const patch = (next) =>
    setState((s) => ({
      ...s,
      books: s.books.map((b) => (b.id === next.id ? next : b)),
    }));

  /* Finishing a book stamps the date once. Moving it back out clears the
     stamp, so the shelf never claims a finish that was undone. */
  const setStatus = (b, status) =>
    patch({
      ...b,
      status,
      finishedAt:
        status === "finished" ? b.finishedAt || dayKey() : null,
    });

  const remove = (id) => {
    /* The reading log stays — it records evenings that happened, and a book
       removed from the shelf does not un-read them — so only the shelf is
       held aside. */
    arm("حُذف الكتاب", { books: state.books });
    setState((s) => ({ ...s, books: s.books.filter((b) => b.id !== id) }));
  };

  const shown =
    filter === "all" ? state.books : state.books.filter((b) => b.status === filter);
  const finished = state.books.filter((b) => b.status === "finished").length;
  const noteCount = state.books.reduce(
    (n, b) => n + (b.notes?.length || 0),
    0,
  );
  const pagesRead = state.books.reduce((n, b) => {
    const at = parseInt(b.page, 10);
    return n + (Number.isFinite(at) ? at : 0);
  }, 0);
  const desk = state.books.find((b) => b.id === deskId) || null;

  const log = state.reading || [];
  const goal = state.readGoal || 0;
  const today = dayKey();
  const month = today.slice(0, 7);
  const todayPages = sumPages(log.filter((r) => r.date === today));
  const monthPages = sumPages(log.filter((r) => r.date.startsWith(month)));
  const monthFinished = state.books.filter(
    (b) => b.status === "finished" && (b.finishedAt || "").startsWith(month),
  ).length;
  const streak = readStreak(log, goal);
  const goalPct = goal > 0 ? Math.min(100, Math.round((todayPages / goal) * 100)) : 0;

  return (
    <div className="space-y-7">
      <Card className="p-6 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">مكتبة الإنجازات</h2>
            <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/40">
              {finished} كتابًا مُنهًى من {state.books.length}. الكتاب بلا درس
              مكتوب لم يُقرأ.
            </p>
          </div>
          <Btn
            variant="default"
            onClick={() => setEditing(bookShape())}
          >
            <Plus size={15} strokeWidth={3} /> أضف كتابًا
          </Btn>
        </div>

        {/* what the shelf has cost you so far */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            { n: finished, k: "كتابًا مُنهًى", tint: T.primary },
            { n: noteCount, k: "نقطة محفوظة", tint: T.accent },
            { n: pagesRead, k: "صفحة مقروءة", tint: T.sky },
          ].map((c) => (
            <div
              key={c.k}
              className="rounded-2xl border px-2 py-2.5 text-center"
              style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
            >
              <p
                dir="ltr"
                className="text-[19px] font-extrabold tabular-nums"
                style={{ color: c.tint }}
              >
                {c.n}
              </p>
              <p className="text-[9.5px]" style={{ color: T.faint }}>
                {c.k}
              </p>
            </div>
          ))}
        </div>

        {/* what the reading habit has actually produced */}
        <div
          className="mt-4 rounded-2xl border p-4"
          style={{ borderColor: `${T.sky}33`, background: `${T.sky}0D` }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[12px] font-bold" style={{ color: T.sky }}>
              متتبّع القراءة
            </span>
            <div className="flex items-center gap-1.5">
              <label htmlFor="los-read-goal" className="text-[10.5px] text-white/40">
                هدف اليوم
              </label>
              <input
                id="los-read-goal"
                value={state.readGoal}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setState((s) => ({
                    ...s,
                    readGoal: Number.isFinite(v) && v > 0 ? v : 0,
                  }));
                }}
                inputMode="numeric"
                className="w-14 rounded-lg border bg-transparent px-2 py-1 text-center text-[11px] tabular-nums text-white/85 outline-none focus:border-white/30"
                style={{ borderColor: T.border }}
              />
              <span className="text-[10.5px] text-white/40">صفحة</span>
            </div>
          </div>

          <div
            className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full"
            style={{ background: "rgba(255,255,255,0.07)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${goalPct}%`,
                backgroundImage: `linear-gradient(90deg, ${
                  goalPct >= 100 ? T.primary : T.sky
                }, ${goalPct >= 100 ? T.primaryLift : T.accent})`,
                boxShadow: `0 0 12px ${goalPct >= 100 ? T.primary : T.sky}99`,
              }}
            />
          </div>

          <div className="mt-2.5 grid grid-cols-4 gap-2 text-center">
            {[
              { n: todayPages, k: "اليوم", tint: goalPct >= 100 ? T.primary : T.sky },
              { n: streak, k: countedWord(streak), tint: T.ember },
              { n: monthPages, k: "صفحة/الشهر", tint: T.accent },
              { n: monthFinished, k: "كتاب/الشهر", tint: T.primary },
            ].map((c) => (
              <div key={c.k}>
                <p
                  dir="ltr"
                  className="text-[16px] font-extrabold tabular-nums"
                  style={{ color: c.tint }}
                >
                  {c.n}
                </p>
                <p className="text-[9px]" style={{ color: T.faint }}>
                  {c.k}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* the reading cue — tap for the next one */}
        <button
          type="button"
          onClick={shuffleRead}
          title="اضغط لعبارة أخرى"
          className="los-cue group relative mt-4 w-full overflow-hidden rounded-2xl border p-4 text-center transition-all duration-300"
          style={{
            borderColor: `${T.accent}33`,
            background: `${T.accent}0D`,
          }}
        >
          <div
            className="pointer-events-none absolute -top-16 right-1/3 h-40 w-40 rounded-full opacity-25 blur-3xl transition-opacity duration-500 group-hover:opacity-45"
            style={{ background: T.accent }}
          />
          {read ? (
            <>
              <p
                key={read.text}
                className="los-in relative mx-auto max-w-xl text-[13px] font-bold leading-relaxed"
                style={{ color: T.fg }}
              >
                {read.text}
              </p>
              <p
                className="relative mt-1.5 text-[10.5px]"
                style={{ color: T.accent }}
              >
                — {read.author}
              </p>
            </>
          ) : (
            <p className="relative text-[12px]" style={{ color: T.muted }}>
              لا عبارات في هذه القائمة.
            </p>
          )}
          <span
            className="relative mt-2 inline-flex items-center gap-1.5 text-[10px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ color: T.faint }}
          >
            <RotateCcw size={10} /> اضغط لعبارة أخرى
          </span>
        </button>
      </Card>

      <div className="flex flex-wrap gap-2">
        {[
          { id: "all", label: "الكل", tint: T.accent },
          ...Object.entries(BOOK_STATUS).map(([id, v]) => ({
            id,
            label: v.label,
            tint: v.tint,
          })),
        ].map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              aria-pressed={active}
              className="rounded-xl border px-4 py-2 text-xs font-bold transition-all"
              style={{
                borderColor: active ? `${f.tint}70` : T.border,
                background: active ? `${f.tint}16` : "rgba(255,255,255,0.03)",
                color: active ? f.tint : T.muted,
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <Card className="py-14 text-center text-xs text-white/25">
          لا كتب في هذا التصنيف بعد.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {shown.map((b) => {
            const meta = BOOK_STATUS[b.status] || BOOK_STATUS.planned;
            return (
              <Card
                key={b.id}
                className="group flex gap-4 p-4 transition-all duration-500 hover:-translate-y-1"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${T.accent}59`;
                  e.currentTarget.style.boxShadow = `0 18px 50px -22px ${T.accent}88`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = T.border;
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* spine + cover */}
                <div
                  className="relative h-[132px] w-[92px] shrink-0 overflow-hidden rounded-lg border"
                  style={{
                    borderColor: b.cover ? `${meta.tint}55` : `${meta.tint}33`,
                    boxShadow: b.cover ? `0 8px 30px -8px ${meta.tint}60` : `0 4px 20px -8px ${meta.tint}40`,
                  }}
                >
                  {b.cover ? (
                    <img
                      src={b.cover}
                      alt={b.title}
                      className="los-cover-in h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full flex-col items-center justify-center"
                      style={{
                        background: `linear-gradient(160deg, ${meta.tint}45 0%, ${T.bgDeep} 72%)`,
                      }}
                    >
                      {/* inner glow blob */}
                      <div
                        className="pointer-events-none absolute inset-0 opacity-60"
                        style={{
                          background: `radial-gradient(ellipse 80% 55% at 50% 25%, ${meta.tint}55, transparent)`,
                        }}
                      />
                      <span
                        className="relative z-10 font-black leading-none"
                        style={{
                          fontSize: 44,
                          color: `${meta.tint}EE`,
                          textShadow: `0 0 28px ${meta.tint}BB, 0 0 6px ${meta.tint}`,
                        }}
                      >
                        {b.title.trim().charAt(0) || "؟"}
                      </span>
                      <span className="relative z-10 mt-2 px-1 text-center line-clamp-2 text-[8px] leading-tight text-white/35">
                        {b.title}
                      </span>
                    </div>
                  )}
                  {/* spine */}
                  <span
                    className="pointer-events-none absolute inset-y-0 right-0 w-[5px]"
                    style={{ background: `linear-gradient(to bottom, ${meta.tint}99, ${meta.tint}44)` }}
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-[15px] font-bold text-white/90">
                        {b.title}
                      </h3>
                      <p className="truncate text-[11px] text-white/35">
                        {b.author || "—"}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-0.5">
                      <button
                        onClick={() => setEditing({ ...b })}
                        aria-label={`تعديل ${b.title}`}
                        className="rounded p-1.5 text-white/15 transition-colors hover:text-white/70"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => remove(b.id)}
                        aria-label={`حذف ${b.title}`}
                        className="rounded p-1.5 text-white/15 transition-colors hover:text-red-400"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <select
                      value={b.status}
                      onChange={(e) => setStatus(b, e.target.value)}
                      aria-label={`حالة ${b.title}`}
                      className="rounded-md border bg-transparent px-2 py-0.5 text-[10.5px] outline-none"
                      style={{
                        borderColor: `${meta.tint}44`,
                        color: meta.tint,
                        background: `${meta.tint}12`,
                      }}
                    >
                      {Object.entries(BOOK_STATUS).map(([k, v]) => (
                        <option key={k} value={k} style={{ background: T.cardSolid }}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                    <StarRating
                      value={b.rating}
                      onChange={(rating) => patch({ ...b, rating })}
                    />
                    {b.status === "finished" && b.finishedAt && (
                      <span
                        dir="ltr"
                        className="text-[9.5px] tabular-nums"
                        style={{ color: T.faint }}
                      >
                        {b.finishedAt}
                      </span>
                    )}
                  </div>

                  {pctOf(b) !== null && (
                    <div className="mt-2">
                      <div
                        className="h-1 w-full overflow-hidden rounded-full"
                        style={{ background: "rgba(255,255,255,0.07)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pctOf(b)}%`,
                            backgroundImage: `linear-gradient(90deg, ${meta.tint}, ${T.accent})`,
                            boxShadow: `0 0 10px ${meta.tint}88`,
                          }}
                        />
                      </div>
                      <p
                        dir="ltr"
                        className="mt-1 text-left text-[9.5px] tabular-nums"
                        style={{ color: T.faint }}
                      >
                        {b.page} / {b.pages}
                      </p>
                    </div>
                  )}

                  <div className="mt-2.5 flex-1">
                    <label
                      htmlFor={`los-lesson-${b.id}`}
                      className="mb-1 block text-[10px]"
                      style={{ color: `${T.accent}AA` }}
                    >
                      أهم درس يغيّر حياتي
                    </label>
                    <textarea
                      id={`los-lesson-${b.id}`}
                      value={b.lesson}
                      onChange={(e) => patch({ ...b, lesson: e.target.value })}
                      rows={2}
                      placeholder="اكتب الدرس الواحد الذي ستطبّقه…"
                      className="w-full resize-none rounded-lg border bg-transparent px-2.5 py-2 text-[11.5px] leading-relaxed text-white/70 outline-none transition-colors placeholder:text-white/20 focus:border-white/30"
                      style={{ borderColor: "rgba(255,255,255,0.07)" }}
                    />
                  </div>

                  <button
                    onClick={() => setDeskId(b.id)}
                    className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border py-1.5 text-[11px] font-bold transition-all duration-200 hover:scale-[1.01]"
                    style={{
                      borderColor: `${T.accent}3D`,
                      background: `${T.accent}0F`,
                      color: T.accent,
                    }}
                  >
                    <NotebookPen size={13} /> دفتر الكتاب
                    {(b.notes?.length || 0) > 0 && (
                      <span dir="ltr" className="tabular-nums opacity-70">
                        ({b.notes.length})
                      </span>
                    )}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <BookDesk
        book={desk}
        log={desk ? log.filter((r) => r.bookId === desk.id) : []}
        onClose={() => setDeskId(null)}
        onPatch={patch}
      />

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "تعديل الكتاب" : "كتاب جديد"}
        footer={
          <>
            <Btn variant="default" className="flex-1" onClick={save}>
              حفظ
            </Btn>
            <Btn variant="outline" className="flex-1" onClick={() => setEditing(null)}>
              إلغاء
            </Btn>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            {/* cover upload */}
            <div>
              <span className="mb-1.5 block text-xs text-white/45">غلاف الكتاب</span>
              <label
                className="flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl border transition-all duration-200 hover:border-white/30"
                style={{
                  borderColor: editing.cover ? `${T.accent}55` : T.border,
                  background: editing.cover ? "transparent" : "rgba(255,255,255,0.03)",
                  height: editing.cover ? "auto" : 64,
                }}
              >
                {editing.cover ? (
                  <div className="relative w-full">
                    <img
                      src={editing.cover}
                      alt="غلاف"
                      className="max-h-40 w-full object-contain"
                    />
                    <span
                      className="absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded-lg border px-3 py-1 text-[10px] font-bold"
                      style={{ borderColor: T.border, background: `${T.bgDeep}D9`, color: T.muted }}
                    >
                      تغيير الصورة
                    </span>
                  </div>
                ) : (
                  <span className="flex flex-col items-center gap-1" style={{ color: T.muted }}>
                    <ImagePlus size={20} />
                    <span className="text-[11px]">رفع غلاف (اختياري)</span>
                  </span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const data = await shrinkImage(file, COVER_STEPS);
                      setEditing((s) => ({ ...s, cover: data }));
                    } catch {/* ignore */ }
                  }}
                />
              </label>
              {editing.cover && (
                <button
                  type="button"
                  className="mt-1.5 text-[10.5px] text-white/30 hover:text-red-400 transition-colors"
                  onClick={() => setEditing((s) => ({ ...s, cover: "" }))}
                >
                  حذف الصورة
                </button>
              )}
            </div>
            <div>
              <label htmlFor="los-b-title" className="mb-1.5 block text-xs text-white/45">
                العنوان
              </label>
              <Field
                id="los-b-title"
                autoFocus
                value={editing.title}
                onChange={(e) => setEditing((s) => ({ ...s, title: e.target.value }))}
                placeholder="مثال: العادات الذرية"
              />
            </div>
            <div>
              <label htmlFor="los-b-author" className="mb-1.5 block text-xs text-white/45">
                المؤلف
              </label>
              <Field
                id="los-b-author"
                value={editing.author}
                onChange={(e) => setEditing((s) => ({ ...s, author: e.target.value }))}
                placeholder="مثال: جيمس كلير"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/45">التقييم</span>
              <StarRating
                value={editing.rating}
                size={18}
                onChange={(rating) => setEditing((s) => ({ ...s, rating }))}
              />
            </div>
            <div>
              <span className="mb-1.5 block text-xs text-white/45">الحالة</span>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(BOOK_STATUS).map(([k, v]) => {
                  const active = editing.status === k;
                  return (
                    <button
                      key={k}
                      onClick={() => setEditing((s) => ({ ...s, status: k }))}
                      aria-pressed={active}
                      className="rounded-xl border px-2 py-2 text-[11.5px] font-bold transition-all"
                      style={{
                        borderColor: active ? `${v.tint}80` : T.border,
                        background: active ? `${v.tint}16` : "transparent",
                        color: active ? v.tint : T.muted,
                      }}
                    >
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label htmlFor="los-b-lesson" className="mb-1.5 block text-xs text-white/45">
                أهم درس يغيّر حياتي
              </label>
              <Field
                as="textarea"
                id="los-b-lesson"
                rows={3}
                value={editing.lesson}
                onChange={(e) => setEditing((s) => ({ ...s, lesson: e.target.value }))}
                placeholder="الدرس الواحد الذي ستطبّقه…"
                className="resize-none leading-relaxed"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* Shown above every screen, not just the breaker: the point is to meet the
   user where he already is when his hour arrives. The fill stays T.card —
   a surface sitting on the sky never carries its own white or tinted alpha,
   or it turns into a pale smear against a noon horizon. The alarm is
   carried by the border, the glow and the type. */
function DangerBanner({ list, here, onOpen }) {
  const bandId = useHourBand();
  const watch = useMemo(() => dangerWatch(list), [list]);
  /* Dismissal is deliberately not persisted and is keyed to the band and
     the day: it lasts until the hour passes. A warning that can be switched
     off for good is a warning that gets switched off on the first bad
     evening — which is the evening it was written for. */
  const [hidden, setHidden] = useState("");
  const key = `${dayKey()}:${bandId}`;

  if (!watch || watch.band.id !== bandId || hidden === key) return null;

  return (
    <Card
      className="los-in mb-6 p-5"
      style={{
        borderColor: `${T.danger}66`,
        boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.085), 0 0 54px -18px ${T.danger}`,
      }}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
          style={{
            borderColor: `${T.danger}4D`,
            background: `${T.danger}1A`,
            color: T.danger,
          }}
        >
          <AlertTriangle size={16} strokeWidth={2.2} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-extrabold" style={{ color: T.danger }}>
            أنت الآن في ساعة خطرك
          </p>
          <p className="mt-1 text-[11.5px] leading-relaxed" style={{ color: T.muted }}>
            {watch.band.label}
            {" — "}
            <span dir="ltr" className="font-extrabold tabular-nums">
              {watch.pct}٪
            </span>
            {" من مواجهاتك تقع في هذه الفترة. قرّر الآن، لا بعد ربع ساعة."}
          </p>

          {watch.tag && (
            <div
              className="mt-3 rounded-xl border px-3.5 py-2.5"
              style={{ borderColor: `${T.sky}3D`, background: `${T.sky}10` }}
            >
              <p className="text-[10.5px] font-bold" style={{ color: T.sky }}>
                {`ضعفك هنا: ${watch.tag.label} — نفّذ هذا`}
              </p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/85">
                {watch.tag.counter}
              </p>
            </div>
          )}

          {!here && (
            <Btn variant="danger" size="sm" className="mt-3" onClick={onOpen}>
              <ShieldOff size={13} /> افتح كاسر العادات
            </Btn>
          )}
        </div>

        <button
          type="button"
          onClick={() => setHidden(key)}
          aria-label="إخفاء التنبيه حتى تنتهي الفترة"
          className="shrink-0 rounded-lg border p-1.5 text-white/35 transition-colors hover:text-white/80"
          style={{ borderColor: T.border }}
        >
          <X size={13} />
        </button>
      </div>
    </Card>
  );
}

/* ==================================================================== *
 *  MODULE — the knowledge map
 *
 *  The one screen that is not about the day. graphify builds a graph of
 *  this whole folder -- the app's own source included -- and renders its
 *  charts out of the same state file the app writes to, so the two have
 *  always shared a disk and never shared a door. This is the door.
 *
 *  Everything here is a link, not an embed. The graph pulls its engine
 *  from a CDN and the charts are regenerated behind the app's back, so an
 *  iframe would hand the day's screen a blank rectangle on the first
 *  offline open and a stale one after every rebuild. A link that opens the
 *  live artefact cannot go stale, and the charts below are plain <img>
 *  with a cache-busting stamp -- a picture that fails to load degrades to
 *  its alt text instead of taking the screen with it.
 * ==================================================================== */
function GraphModule() {
  /* Stamped once per mount, not per render: the charts are rewritten by
     the report agent, and without this the browser keeps serving the copy
     it cached the first time the tab was opened -- indistinguishable from
     a chart that stopped updating. */
  const stamp = useMemo(() => Date.now(), []);

  const charts = [
    { key: "discipline", label: "الانضباط اليومي", tint: T.primary },
    { key: "gym", label: "انتظام النادي", tint: T.accent },
    { key: "step", label: "تقدّم STEP", ltr: "STEP", tint: T.violet },
  ];

  const doors = [
    {
      href: "/hub",
      icon: LayoutGrid,
      tint: T.cta,
      title: "المركز الموحّد",
      body: "صفحة واحدة تجمع أرقام يومك مع الخريطة والرسوم والتقرير. تقرأ من القرص ولا تكتب شيئًا.",
      cta: "افتح المركز",
    },
    {
      href: "/graphify/graph.html",
      icon: Network,
      tint: T.sky,
      title: "الرسم التفاعلي",
      body: "الملفات والمفاهيم والعلاقات بينها، مع تجميع المجتمعات. يحتاج اتصالًا أوّل مرة: محرّك الرسم يُحمَّل من شبكة توزيع.",
      cta: "افتح الخريطة",
    },
    {
      href: "/graphify/report.md",
      icon: FileText,
      tint: T.violet,
      title: "تقرير الخريطة",
      body: "قراءة بلغة مفهومة لما وجدته الخريطة، مع سجلّ أمانة يفرّق بين ما استُخرج وما استُنتج.",
      cta: "اقرأ التقرير",
    },
  ];

  return (
    <div className="space-y-7">
      <Card className="p-6 sm:p-7">
        <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">
          خريطة المعرفة
        </h2>
        <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-white/40">
          هذا المجلد كلّه مرسوم: المصدر، الملاحظات، المشاريع، وملف الحالة الذي
          يحفظ سنتك. الخريطة والرسوم مبنيّة من البيانات نفسها التي يكتبها هذا
          النظام — لا نسخة ثانية ولا تصدير يدوي.
        </p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {doors.map((d) => {
          const Icon = d.icon;
          return (
            <Card
              key={d.href}
              as="a"
              href={d.href}
              className="group flex flex-col gap-3 p-5 transition-all duration-300 hover:-translate-y-1"
              style={{ boxShadow: `inset 0 1px 0 0 rgba(255,235,220,0.14), 0 24px 48px -24px rgba(0,0,0,0.85), 0 0 40px -24px ${d.tint}` }}
            >
              <span
                className="grid h-10 w-10 place-items-center rounded-xl border"
                style={{
                  backgroundColor: `${d.tint}29`,
                  borderColor: `${d.tint}4D`,
                  color: d.tint,
                }}
              >
                <Icon size={19} strokeWidth={1.9} />
              </span>
              <h3 className="text-[15.5px] font-extrabold">{d.title}</h3>
              <p className="text-[12px] leading-relaxed text-white/45">{d.body}</p>
              <span
                className="mt-auto inline-flex items-center gap-1.5 self-start rounded-xl px-3.5 py-2 text-[12.5px] font-extrabold"
                style={{
                  background: `linear-gradient(135deg, ${d.tint}, ${d.tint}B3)`,
                  color: "#140600",
                  boxShadow: `0 12px 26px -14px ${d.tint}`,
                }}
              >
                {d.cta}
                <ExternalLink size={13} strokeWidth={2.2} />
              </span>
            </Card>
          );
        })}
      </div>

      <div>
        <h3 className="mb-3 px-1 text-[13.5px] font-extrabold text-white/70">
          الرسوم المبنيّة من بياناتك
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {charts.map((c) => (
            <Card key={c.key} as="a" href={`/graphify/charts/${c.key}.svg`} className="block p-4">
              <p className="mb-2.5 text-[12.5px] font-extrabold" style={{ color: c.tint }}>
                {c.ltr ? (
                  <>
                    تقدّم <span dir="ltr">{c.ltr}</span>
                  </>
                ) : (
                  c.label
                )}
              </p>
              <span
                className="block overflow-hidden rounded-xl border"
                style={{ borderColor: "rgba(255,225,210,0.12)", backgroundColor: "rgba(0,0,0,0.26)" }}
              >
                <img
                  src={`/graphify/charts/${c.key}.svg?v=${stamp}`}
                  alt={`رسم ${c.label}`}
                  loading="lazy"
                  className="block h-auto w-full"
                />
              </span>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ==================================================================== *
 *  MODULE 4 — Analytics
 * ==================================================================== */


const LEVEL_BG = [
  "rgba(255,255,255,0.04)",
  "rgba(16,185,129,0.42)",
  "rgba(16,185,129,0.5)",
  "rgba(16,185,129,0.74)",
  "#10B981",
];

/* What you were actually keeping on a given day, block by block. Labels are
   resolved from the live routine rather than stored per day — a renamed habit
   should read under its current name, and twenty Arabic labels a day would
   cost most of a megabyte a year. A habit since deleted is still shown: it
   was part of that day whether or not it survived to this one. */
function DayRollCall({ row, state }) {
  const detail = useMemo(() => {
    if (!row || !Array.isArray(row.done)) return null;
    const live = new Map((state.habits || []).map((h) => [h.id, h]));
    const done = new Set(row.done);
    /* The roster recorded that day. Older rows predate it, so they fall back
       to today's routine — flagged, because that comparison is approximate. */
    const exact = Array.isArray(row.all);
    const ids = exact ? row.all : (state.habits || []).map((h) => h.id);
    /* Which of the ticks were carried on the floor. A subset of `done`,
       never a third state: the day counted it fully and so does this list —
       it only says how. */
    const tiny = new Set(Array.isArray(row.tiny) ? row.tiny : []);
    const items = ids.map((id) => ({
      id,
      label: live.get(id)?.label || "عادة لم تعد في روتينك",
      group: live.get(id)?.group || null,
      done: done.has(id),
      tiny: done.has(id) && tiny.has(id),
    }));
    return {
      items,
      exact,
      kept: items.filter((i) => i.done).length,
      total: items.length || row.total || 0,
    };
  }, [row, state.habits]);

  const pages = useMemo(
    () =>
      (state.reading || [])
        .filter((r) => r.date === row?.date)
        .reduce((n, r) => n + (r.pages || 0), 0),
    [state.reading, row],
  );

  if (!row) return null;

  const extras = [
    pages > 0 && { label: "صفحة قراءة", n: pages, tint: T.violet },
  ].filter(Boolean);

  return (
    <div className="space-y-3">
      {!detail ? (
        <p
          className="rounded-xl border border-dashed px-3.5 py-4 text-center text-[11.5px] leading-relaxed"
          style={{ borderColor: T.border, color: T.faint }}
        >
          هذا اليوم سُجّلت نسبته فقط — تفاصيل الروتين تُحفظ من اليوم فصاعدًا.
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs" style={{ color: T.muted }}>
              الروتين ذلك اليوم
            </p>
            <span
              dir="ltr"
              className="text-[12px] font-extrabold tabular-nums"
              style={{ color: detail.kept ? T.primary : T.faint }}
            >
              {detail.kept}/{detail.total}
            </span>
          </div>

          {/* Where the score came from. "٢٠٪" says nothing about whether the
              morning held and the evening collapsed — and that is the whole
              question when you go back to look at a day. */}
          <div className="grid grid-cols-3 gap-1.5">
            {GROUPS.map((g) => {
              const items = detail.items.filter((h) => h.group === g.id);
              if (!items.length) return null;
              const kept = items.filter((h) => h.done).length;
              const pct = Math.round((kept / items.length) * 100);
              const Icon = g.icon;
              return (
                <div
                  key={g.id}
                  className="rounded-lg border px-2 py-1.5 text-center"
                  style={{
                    borderColor: pct ? `${g.tint}59` : T.border,
                    background: pct ? `${g.tint}14` : "rgba(255,255,255,0.03)",
                  }}
                >
                  <Icon size={11} className="mx-auto" style={{ color: g.tint }} />
                  <p
                    dir="ltr"
                    className="mt-0.5 text-[13px] font-extrabold tabular-nums"
                    style={{ color: pct ? g.tint : T.faint }}
                  >
                    {pct}%
                  </p>
                  <p className="truncate text-[9px]" style={{ color: T.faint }}>
                    {g.label}
                  </p>
                </div>
              );
            })}
          </div>

          {[...GROUPS, { id: null, label: "خارج الروتين الحالي", icon: Hourglass, tint: T.faint }].map(
            (g) => {
              const items = detail.items.filter((h) => h.group === g.id);
              if (!items.length) return null;
              const Icon = g.icon;
              const kept = items.filter((h) => h.done).length;
              return (
                <div
                  key={g.id || "gone"}
                  className="rounded-xl border px-3 py-2.5"
                  style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
                >
                  <p
                    className="mb-2 flex items-center gap-1.5 text-[10.5px] font-bold"
                    style={{ color: g.tint }}
                  >
                    <Icon size={11} /> {g.label}
                    <span dir="ltr" className="mr-auto tabular-nums opacity-70">
                      {kept}/{items.length} · {Math.round((kept / items.length) * 100)}%
                    </span>
                  </p>
                  <ul className="space-y-1">
                    {items.map((h) => (
                      <li key={h.id} className="flex items-start gap-2 text-[12px]">
                        {h.done ? (
                          h.tiny ? (
                            <Feather
                              size={12}
                              strokeWidth={2.6}
                              className="mt-0.5 shrink-0"
                              aria-label="أُنجزت كنسخة صغيرة"
                              style={{ color: T.sky }}
                            />
                          ) : (
                            <Check
                              size={12}
                              strokeWidth={3.5}
                              className="mt-0.5 shrink-0"
                              style={{ color: T.primary }}
                            />
                          )
                        ) : (
                          <X
                            size={12}
                            strokeWidth={3}
                            className="mt-0.5 shrink-0"
                            style={{ color: T.faint }}
                          />
                        )}
                        <span style={{ color: h.done ? T.fg : T.faint }}>
                          {h.label}
                          {h.tiny && (
                            <span className="mr-1.5 text-[10px]" style={{ color: T.sky }}>
                              نسخة صغيرة
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            },
          )}

          {!detail.exact && (
            <p className="text-[10.5px] leading-relaxed" style={{ color: T.faint }}>
              قورن هذا اليوم بروتينك الحالي — قائمة ذلك اليوم نفسها لم تكن تُحفظ بعد.
            </p>
          )}
        </>
      )}

      {extras.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {extras.map((e) => (
            <Badge key={e.label} tint={e.tint}>
              <span dir="ltr" className="tabular-nums">
                {e.n}
              </span>{" "}
              {e.label}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

const CONSISTENCY_WINDOWS = [
  { id: 30, label: "٣٠ يومًا" },
  { id: 90, label: "٩٠ يومًا" },
  { id: 0, label: "كل السجل" },
];

/* Which habits actually hold, across time rather than on one day. A month of
   percentages tells you how you did; this tells you *what* you did, and the
   bottom of the list is where the next percentage point is hiding.
   Only days carrying a recorded roster count — a day that stored a score and
   nothing else cannot say which habit earned it, and guessing would be worse
   than an honest gap. */
function ConsistencyCard({ state }) {
  const [win, setWin] = useState(30);

  const data = useMemo(() => {
    const rows = (state.history || []).filter(
      (h) => Array.isArray(h.done) && Array.isArray(h.all) && h.all.length,
    );
    const scoped = win ? rows.filter((h) => daysBetween(h.date) < win) : rows;
    if (!scoped.length) return null;

    const live = new Map((state.habits || []).map((h) => [h.id, h]));
    const tally = new Map();
    const blocks = new Map(GROUPS.map((g) => [g.id, { kept: 0, total: 0 }]));

    for (const r of scoped) {
      const done = new Set(r.done);
      for (const id of r.all) {
        if (!tally.has(id)) tally.set(id, { kept: 0, total: 0 });
        const t = tally.get(id);
        t.total += 1;
        if (done.has(id)) t.kept += 1;
        const g = live.get(id)?.group;
        if (g && blocks.has(g)) {
          const b = blocks.get(g);
          b.total += 1;
          if (done.has(id)) b.kept += 1;
        }
      }
    }

    const habits = [...tally.entries()]
      .map(([id, t]) => ({
        id,
        label: live.get(id)?.label || "عادة لم تعد في روتينك",
        group: live.get(id)?.group || null,
        pct: Math.round((t.kept / t.total) * 100),
        ...t,
      }))
      .sort((a, b) => b.pct - a.pct || b.kept - a.kept);

    return { days: scoped.length, habits, blocks };
  }, [state.history, state.habits, win]);

  const tintFor = (pct) =>
    pct >= 80 ? T.primary : pct >= 50 ? T.accent : pct > 0 ? T.ember : T.danger;

  return (
    <Card className="p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-[17px] font-extrabold" style={{ color: T.ctaLift }}>
            <ListChecks size={17} /> أكثر ما التزمت به
          </h3>
          <p className="mt-1.5 max-w-xl text-[11.5px] leading-relaxed" style={{ color: T.faint }}>
            ليست النسبة، بل ما وراءها: أي عادة تصمد، وأيّها تسقط أولًا.
          </p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          {CONSISTENCY_WINDOWS.map((w) => {
            const on = w.id === win;
            return (
              <button
                key={w.id}
                onClick={() => setWin(w.id)}
                aria-pressed={on}
                className="rounded-lg border px-2.5 py-1 text-[10.5px] font-bold transition-all duration-200"
                style={{
                  borderColor: on ? `${T.cta}80` : T.border,
                  background: on ? `${T.cta}1F` : "transparent",
                  color: on ? T.ctaLift : T.faint,
                }}
              >
                {w.label}
              </button>
            );
          })}
        </div>
      </div>

      {!data ? (
        <p
          className="mt-5 rounded-xl border border-dashed py-10 text-center text-[11.5px] leading-relaxed"
          style={{ borderColor: T.border, color: T.faint }}
        >
          لا توجد أيام بسجلّ مفصّل بعد — يبدأ العدّ من اليوم.
          <br />
          كل يوم تؤشّر فيه عادةً يضيف سطرًا هنا.
        </p>
      ) : (
        <>
          <p className="mt-4 text-[11px]" style={{ color: T.faint }}>
            محسوب على{" "}
            <span dir="ltr" className="font-bold tabular-nums" style={{ color: T.muted }}>
              {data.days}
            </span>{" "}
            {dayWord(data.days)} بسجلّ مفصّل
          </p>

          {/* which part of the day holds, before which habit holds */}
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {GROUPS.map((g) => {
              const b = data.blocks.get(g.id);
              if (!b || !b.total) return null;
              const pct = Math.round((b.kept / b.total) * 100);
              const Icon = g.icon;
              return (
                <div
                  key={g.id}
                  className="rounded-xl border px-2 py-2.5 text-center"
                  style={{ borderColor: `${g.tint}3D`, background: `${g.tint}10` }}
                >
                  <Icon size={13} className="mx-auto" style={{ color: g.tint }} />
                  <p
                    dir="ltr"
                    className="mt-1 text-[15px] font-extrabold tabular-nums"
                    style={{ color: g.tint }}
                  >
                    {pct}%
                  </p>
                  <p className="truncate text-[9.5px]" style={{ color: T.faint }}>
                    {g.label}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 space-y-2">
            {data.habits.map((h, i) => {
              const tint = tintFor(h.pct);
              const g = GROUPS.find((x) => x.id === h.group);
              return (
                <div
                  key={h.id}
                  className="rounded-xl border px-3.5 py-2.5"
                  style={{
                    borderColor: i === 0 ? `${T.primary}59` : T.border,
                    background:
                      i === 0 ? `${T.primary}0F` : "rgba(255,255,255,0.03)",
                  }}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="min-w-0 flex-1 truncate text-[12.5px] font-bold" style={{ color: T.fg }}>
                      {i === 0 && <span style={{ color: T.accent }}>★ </span>}
                      {h.label}
                    </p>
                    <span
                      dir="ltr"
                      className="shrink-0 text-[10.5px] tabular-nums"
                      style={{ color: T.faint }}
                    >
                      {h.kept}/{h.total}
                    </span>
                    <span
                      dir="ltr"
                      className="w-10 shrink-0 text-left text-[13px] font-extrabold tabular-nums"
                      style={{ color: tint }}
                    >
                      {h.pct}%
                    </span>
                  </div>
                  <div
                    className="mt-2 h-1.5 overflow-hidden rounded-full"
                    style={{ background: "rgba(255,255,255,0.07)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${h.pct}%`,
                        background: `linear-gradient(90deg, ${tint}, ${tint}99)`,
                        boxShadow: h.pct ? `0 0 10px ${tint}66` : "none",
                      }}
                    />
                  </div>
                  {g && (
                    <p className="mt-1 text-[9.5px]" style={{ color: g.tint }}>
                      {g.label}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}

function AnalyticsModule({ state, discipline, streak }) {
  const today = new Date();
  const [cursor, setCursor] = useState({
    y: today.getFullYear(),
    m: today.getMonth(),
  });
  const [openNote, setOpenNote] = useState(null);

  const byDate = useMemo(() => {
    const map = new Map(
      /* A gap row carries no percentage on purpose — it is a day nobody
         recorded, not a day that scored nothing — so it is kept out of this
         map entirely and answered from `gapDates` below. */
      rows(state.history)
        .filter((h) => !isGap(h))
        .map((h) => [h.date, h.pct]),
    );
    map.set(dayKey(), discipline); // today is live, not yet archived
    return map;
  }, [state.history, discipline]);

  /* The days written down as unrecorded. A square that is grey because the
     app was never opened and a square that is grey because the month has not
     got there yet are two different facts, and a tracker that draws them the
     same way is the one that let two silent days pass unnoticed. */
  const gapDates = useMemo(
    () => new Set(rows(state.history).filter(isGap).map((h) => h.date)),
    [state.history],
  );

  const notesByDate = useMemo(
    () =>
      new Map(
        (state.history || [])
          .filter((h) => h.distraction || h.fix || h.mirror)
          .map((h) => [h.date, h]),
      ),
    [state.history],
  );

  const rowsByDate = useMemo(
    () => new Map((state.history || []).map((h) => [h.date, h])),
    [state.history],
  );

  const grid = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const lead = (first.getDay() + 1) % 7; // week starts Saturday
    const cells = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = dayKey(new Date(cursor.y, cursor.m, d));
      cells.push({ d, ds, pct: byDate.get(ds), gap: gapDates.has(ds) });
    }
    return cells;
  }, [cursor, byDate, gapDates]);

  const monthStats = useMemo(() => {
    const vals = grid.filter((c) => c && c.pct !== undefined).map((c) => c.pct);
    return {
      tracked: vals.length,
      avg: vals.length
        ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
        : 0,
      best: vals.length ? Math.max(...vals) : 0,
      hit: vals.filter((v) => v >= STREAK_TARGET).length,
      /* Counted, never averaged. An unrecorded day folded into the average
         as a zero would punish a day nobody has any record of; left out of
         the count entirely it would flatter a month of four entries. Said
         out loud is the only honest third option. */
      gaps: grid.filter((c) => c && c.gap).length,
    };
  }, [grid]);

  const yearBars = useMemo(() => {
    return AR_MONTHS.map((label, m) => {
      const vals = rows(state.history)
        .filter((h) => {
          if (isGap(h)) return false;
          const [y, mm] = String(h.date).split("-").map(Number);
          return y === cursor.y && mm - 1 === m;
        })
        .map((h) => h.pct);
      return {
        label,
        avg: vals.length
          ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
          : 0,
        n: vals.length,
      };
    });
  }, [state.history, cursor.y]);

  const shift = (delta) =>
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  return (
    <div className="space-y-7">
      <Card className="p-6 sm:p-7">
        <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">التتبع الشهري</h2>
        <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/40">
          كل مربّع يوم من عمرك. الفراغات هي ما ستندم عليه — لا الأخطاء.
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { k: "متوسط الشهر", v: `${monthStats.avg}%`, c: T.accent, icon: TrendingUp },
          { k: "أفضل يوم", v: `${monthStats.best}%`, c: T.primary, icon: Star },
          { k: "أيام فوق ٨٠٪", v: String(monthStats.hit), c: T.primary, icon: Check },
          { k: "السلسلة الحالية", v: String(streak), c: T.ember, icon: Flame },
        ].map((s) => (
          <Card key={s.k} className="p-4">
            <div className="flex items-center gap-2">
              <s.icon size={13} style={{ color: s.c }} />
              <p className="text-[10.5px] text-white/40">{s.k}</p>
            </div>
            <p
              className="mt-1.5 text-2xl font-extrabold tabular-nums"
              style={{ color: s.c }}
            >
              {s.v}
            </p>
          </Card>
        ))}
      </div>

      {/* month grid */}
      <Card className="p-6 sm:p-7">
        <div className="mb-5 flex items-center justify-between">
          <Btn variant="outline" size="icon" onClick={() => shift(1)} aria-label="الشهر التالي">
            <ChevronLeft size={16} />
          </Btn>
          <h3 className="text-base font-bold">
            {AR_MONTHS[cursor.m]}{" "}
            <span className="tabular-nums text-white/40">{cursor.y}</span>
          </h3>
          <Btn variant="outline" size="icon" onClick={() => shift(-1)} aria-label="الشهر السابق">
            <ChevronRight size={16} />
          </Btn>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center">
          {WEEK_LABELS.map((w) => (
            <span key={w} className="pb-1 text-[10px] text-white/25">
              {w}
            </span>
          ))}
          {grid.map((cell, i) => {
            if (cell === null) return <span key={`e${i}`} />;
            const note = notesByDate.get(cell.ds);
            /* Every recorded day opens, not just the ones carrying a written
               reflection — the roll call is the thing worth going back for. */
            const row = cell.pct === undefined ? null : rowsByDate.get(cell.ds);
            return (
              <button
                key={cell.ds}
                type="button"
                onClick={() => row && setOpenNote(row)}
                disabled={!row}
                title={
                  cell.gap
                    ? `${cell.ds} — لم يُسجَّل`
                    : cell.pct === undefined
                    ? `${cell.ds} — لا سجلّ`
                    : `${cell.ds} — ${cell.pct}٪${note ? " — فيه وقفة" : ""}${
                        row?.holds ? ` — صمدت ${row.holds}` : ""
                      }${row?.falls ? ` — سقطت ${row.falls}` : ""}`
                }
                className={`relative flex aspect-square items-center justify-center rounded-lg text-[11px] font-bold tabular-nums transition-transform duration-150 hover:scale-110 disabled:cursor-default ${
                  /* Dashed, so an unrecorded day is distinguishable from a
                     day that has not happened yet without needing a colour
                     the sky can wash out. */
                  cell.gap ? "border border-dashed" : "border"
                }`}
                style={{
                  background: cell.gap
                    ? "rgba(255,255,255,0.02)"
                    : LEVEL_BG[levelOf(cell.pct ?? 0)],
                  /* A tracked day and an untracked one must never look the
                     same. A 20% day is a day you showed up for, and at 0.28
                     alpha against a noon sky it read as blank — which is
                     what "nothing is being saved" looked like. */
                  borderColor:
                    cell.ds === dayKey()
                      ? T.accent
                      : cell.gap
                      ? "rgba(255,255,255,0.22)"
                      : cell.pct !== undefined
                      ? `${T.primary}66`
                      : "rgba(255,255,255,0.06)",
                  color: cell.gap
                    ? "rgba(253,248,246,0.3)"
                    : (cell.pct ?? 0) >= 45
                      ? "#04140E"
                      : cell.pct !== undefined
                      ? "rgba(253,248,246,0.8)"
                      : "rgba(255,255,255,0.3)",
                }}
              >
                {cell.d}
                {(note || row?.holds > 0 || row?.falls > 0) && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0.5 left-1/2 flex -translate-x-1/2 items-center gap-0.5"
                  >
                    {note && (
                      <i
                        className="block h-1 w-1 rounded-full"
                        style={{ background: T.cta, boxShadow: `0 0 5px ${T.cta}` }}
                      />
                    )}
                    {row?.holds > 0 && (
                      <i
                        className="block h-1 w-1 rounded-full"
                        style={{
                          background: T.primary,
                          boxShadow: `0 0 5px ${T.primary}`,
                        }}
                      />
                    )}
                    {row?.falls > 0 && (
                      <i
                        className="block h-1 w-1 rounded-full"
                        style={{ background: T.rose, boxShadow: `0 0 5px ${T.rose}` }}
                      />
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Said out loud, under the grid it is about. Two silent days in a
            month is the fact that explains a flattering average, and a
            number nobody renders is a number nobody acts on. */}
        {monthStats.gaps > 0 && (
          <p
            className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-dashed px-3.5 py-2.5 text-center text-[11.5px] font-bold leading-relaxed"
            style={{ borderColor: "rgba(255,255,255,0.22)", color: T.muted }}
          >
            <CalendarDays size={13} style={{ color: T.faint }} />
            <span>
              {daysPhrase(monthStats.gaps) || (
                <>
                  <span dir="ltr" className="tabular-nums">
                    {monthStats.gaps}
                  </span>{" "}
                  {dayWord(monthStats.gaps)}
                </>
              )}
              {" بدون تسجيل هذا الشهر — لا تدخل في المتوسط."}
            </span>
          </p>
        )}

        <Modal
          open={!!openNote}
          onClose={() => setOpenNote(null)}
          title={openNote ? arDate(openNote.date) : ""}
        >
          <div className="space-y-4">
            <Badge tint={(openNote?.pct ?? 0) >= STREAK_TARGET ? T.primary : T.cta}>
              <span dir="ltr" className="tabular-nums">
                {openNote?.pct ?? 0}%
              </span>
              {" ذلك اليوم"}
            </Badge>

            {(openNote?.holds > 0 || openNote?.falls > 0) && (
              <div className="flex flex-wrap gap-2">
                {openNote.holds > 0 && (
                  <Badge tint={T.primary}>
                    <ShieldCheck size={10} />
                    {"صمدت "}
                    <span dir="ltr" className="tabular-nums">
                      {openNote.holds}
                    </span>
                    {` ${timesWord(openNote.holds)}`}
                  </Badge>
                )}
                {openNote.falls > 0 && (
                  <Badge tint={T.danger}>
                    <HeartCrack size={10} />
                    <span dir="ltr" className="tabular-nums">
                      {openNote.falls}
                    </span>
                    {` ${fallWord(openNote.falls)}`}
                  </Badge>
                )}
              </div>
            )}

            <DayRollCall row={openNote} state={state} />

            {openNote?.distraction && (
              <div>
                <p className="mb-1.5 text-xs text-white/45">ما الذي شتّتني</p>
                <p
                  className="rounded-xl border px-3.5 py-3 text-[13px] leading-relaxed"
                  style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
                >
                  {openNote.distraction}
                </p>
              </div>
            )}
            {openNote?.fix && (
              <div>
                <p className="mb-1.5 text-xs text-white/45">كيف أتجنّبه</p>
                <p
                  className="rounded-xl border px-3.5 py-3 text-[13px] leading-relaxed"
                  style={{
                    borderColor: `${T.primary}3D`,
                    background: `${T.primary}0F`,
                  }}
                >
                  {openNote.fix}
                </p>
              </div>
            )}
            {openNote?.mirror && (
              <div>
                <p className="mb-1.5 text-xs text-white/45">مرآة المحاسبة</p>
                <p
                  className="whitespace-pre-wrap rounded-xl border px-3.5 py-3 text-[13px] leading-relaxed"
                  style={{
                    borderColor: `${T.danger}3D`,
                    background: `${T.danger}0F`,
                  }}
                >
                  {openNote.mirror}
                </p>
              </div>
            )}
          </div>
        </Modal>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-[10px] text-white/30">
          <span>اضغط أي يوم مسجَّل لمراجعة روتينه · الإطار الذهبي = اليوم · النقطة المرجانية = وقفة مكتوبة</span>
          <span className="flex items-center gap-1.5">
            أقل
            {LEVEL_BG.map((c, i) => (
              <span
                key={i}
                className="h-[11px] w-[11px] rounded-[3px]"
                style={{ background: c }}
              />
            ))}
            أكثر
          </span>
        </div>
      </Card>

      <ConsistencyCard state={state} />

      {/* year overview */}
      <Card className="p-6 sm:p-7">
        <h3 className="text-sm font-bold text-white/70">
          متوسط كل شهر في {cursor.y}
        </h3>
        <div className="mt-5 flex h-32 items-end gap-1.5">
          {yearBars.map((b, i) => (
            <div key={b.label} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-full w-full items-end">
                <div
                  title={`${b.label}: ${b.avg}٪ (${b.n} يوم)`}
                  className="w-full rounded-t transition-all duration-500"
                  style={{
                    height: `${Math.max(3, b.avg)}%`,
                    background:
                      b.avg >= STREAK_TARGET
                        ? T.primary
                        : b.avg > 0
                        ? T.accent
                        : "rgba(255,255,255,0.06)",
                    opacity: i === cursor.m ? 1 : 0.65,
                  }}
                />
              </div>
              <span className="text-[8.5px] text-white/25">{b.label.slice(0, 3)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* Module scope, not a closure inside LifeOS — defining it inline gave the
   nav a new component type every render, so React tore down and rebuilt
   every button, dropping focus and restarting transitions mid-flight. */
/* ==================================================================== *
 *  MODULE — the calendar: months, years, and the things that matter on them
 * ==================================================================== */

const AGENDA_VIEWS = [
  { id: "month", label: "الشهر", icon: CalendarDays },
  { id: "year", label: "السنة", icon: LayoutGrid },
  { id: "list", label: "القادم", icon: ListChecks },
];

/* A dated input that renders dark. Left to itself the native picker paints
   a white panel and a black glyph on a dark card — unreadable, and the icon
   disappears entirely. `colorScheme` is the one line that fixes both. */


/* One occurrence, as a row. The tick is per-day — the same weekly entry is
   ticked this Sunday and open the next — so the reward has to fire on the
   occurrence, not on the entry. */
function EventRow({ ev, on, onToggle, onEdit, onDelete, showDate = false, more = 0 }) {
  const k = kindOf(ev.kind);
  const Icon = k.icon;
  const done = isEventDone(ev, on);
  const late = !done && on < dayKey();
  const [burst, fireBurst] = useBurst(700);
  const rep = repeatOf(ev.repeat);

  const handle = () => {
    if (!done) fireBurst();
    onToggle();
  };

  return (
    <div
      className={`group flex items-start gap-2 rounded-xl border p-2.5 transition-all duration-200${
        burst ? " los-reward" : ""
      }`}
      style={{
        borderColor: burst
          ? T.primary
          : late
            ? `${T.danger}4D`
            : "rgba(255,255,255,0.08)",
        backgroundColor: burst
          ? `${T.primary}26`
          : done
            ? `${T.primary}0F`
            : late
              ? `${T.danger}0F`
              : "rgba(255,255,255,0.03)",
      }}
    >
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
        style={{
          borderColor: done ? `${T.primary}59` : `${k.tint}45`,
          background: done ? `${T.primary}1A` : `${k.tint}18`,
          color: done ? T.primary : k.tint,
        }}
      >
        <Icon size={15} strokeWidth={1.9} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-start gap-2">
          <Checkbox
            checked={done}
            onToggle={handle}
            label={ev.title || k.label}
            tint={T.primary}
            size="sm"
          />
          <button
            onClick={onEdit}
            aria-label={`تعديل ${ev.title || k.label}`}
            className="shrink-0 rounded p-1.5 text-white/25 opacity-40 transition-all hover:text-white/70 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onDelete}
            aria-label={`حذف ${ev.title || k.label}`}
            className="shrink-0 rounded p-1.5 text-white/25 opacity-40 transition-all hover:text-red-400 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <Trash2 size={13} />
          </button>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 pr-1.5 text-[10.5px]">
          <span style={{ color: k.tint }}>{k.label}</span>
          {showDate && (
            <span
              className="inline-flex items-center gap-1"
              style={{ color: late ? T.danger : T.faint }}
            >
              <CalendarDays size={10} />
              {arDate(on)}
            </span>
          )}
          {ev.time && (
            <span className="inline-flex items-center gap-1" style={{ color: T.muted }}>
              <Clock size={10} />
              <span dir="ltr" className="tabular-nums">
                {prettyTime(ev.time)}
              </span>
            </span>
          )}
          {ev.place && (
            <span className="inline-flex min-w-0 items-center gap-1" style={{ color: T.faint }}>
              <MapPin size={10} className="shrink-0" />
              <span className="truncate">{ev.place}</span>
            </span>
          )}
          {rep.short && (
            <span className="inline-flex items-center gap-1" style={{ color: T.violet }}>
              <Repeat size={10} />
              {rep.short}
              {/* The row stands for the whole series in the summary list, so
                  it has to say how much of the series it is standing for —
                  otherwise collapsing fifty occurrences into one reads as
                  forty-nine of them having gone missing. */}
              {more > 0 && (
                <span className="font-bold">
                  {"+ "}
                  <span dir="ltr" className="tabular-nums">
                    {more}
                  </span>{" "}
                  {timesWord(more)}
                </span>
              )}
            </span>
          )}
          {!done && (
            <span
              className="font-bold"
              style={{ color: late ? T.danger : on === dayKey() ? T.cta : T.faint }}
            >
              {whenWord(on)}
            </span>
          )}
        </div>

        {ev.note && (
          <p
            className="mt-1.5 whitespace-pre-wrap pr-1.5 text-[11px] leading-relaxed"
            style={{ color: T.muted }}
          >
            {ev.note}
          </p>
        )}
      </div>
    </div>
  );
}

/* The university's deadlines, read-only here. They belong to the other
   screen and are shown rather than copied — one due date, one owner. */
function UniDueRow({ task, course, onGo }) {
  const k = uniKindOf(task.kind);
  const Icon = k.icon;
  return (
    <button
      onClick={onGo}
      className="flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-right transition-colors hover:bg-white/[0.06]"
      style={{
        borderColor: task.done ? `${T.primary}33` : `${k.tint}33`,
        backgroundColor: task.done ? `${T.primary}0D` : "rgba(255,255,255,0.03)",
      }}
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
        style={{
          borderColor: task.done ? `${T.primary}59` : `${k.tint}45`,
          background: task.done ? `${T.primary}1A` : `${k.tint}18`,
          color: task.done ? T.primary : k.tint,
        }}
      >
        <Icon size={15} strokeWidth={1.9} />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className="block truncate text-[13px] font-bold"
          style={{
            color: task.done ? T.primary : T.fg,
            textDecoration: task.done ? "line-through" : "none",
          }}
        >
          {task.title || k.label}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2.5 text-[10.5px]">
          <span style={{ color: k.tint }}>{k.label}</span>
          {course && <span style={{ color: T.faint }}>{courseName(course)}</span>}
          {task.time && (
            <span dir="ltr" className="tabular-nums" style={{ color: T.muted }}>
              {prettyTime(task.time)}
            </span>
          )}
        </span>
      </span>
      <ArrowLeft size={14} className="shrink-0" style={{ color: T.faint }} />
    </button>
  );
}

function EventModal({ open, draft, setDraft, onClose, onSave }) {
  const [err, setErr] = useState("");
  const d = draft || {};
  const repeating = d.repeat && d.repeat !== "none";

  useEffect(() => {
    if (open) setErr("");
  }, [open, d.id]);

  const save = () => {
    if (!String(d.title || "").trim()) {
      setErr("اكتب عنوان الموعد أولًا.");
      return;
    }
    if (!isKey(d.date)) {
      setErr("التاريخ غير صالح.");
      return;
    }
    /* A repeat that ends before it starts is a repeat that never happens,
       and the grid would simply draw nothing — a save that looks like it
       worked and loses the entry. Refuse it with a reason instead. */
    if (repeating && d.until && d.until < d.date) {
      setErr("تاريخ انتهاء التكرار قبل تاريخ البداية.");
      return;
    }
    onSave();
  };

  const set = (patch) => setDraft((s) => ({ ...s, ...patch }));

  /* The title reads `isNew`, not `id`: every draft is born through
     `eventShape`, which hands it an id straight away, so an id proves
     nothing about whether this entry already exists. */
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={d.isNew ? "موعد جديد" : "تعديل الموعد"}
      footer={
        <>
          <Btn variant="default" className="flex-1" onClick={save}>
            <Check size={15} strokeWidth={3} /> حفظ
          </Btn>
          <Btn variant="outline" className="flex-1" onClick={onClose}>
            إلغاء
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="los-ev-title" className="mb-1.5 block text-xs text-white/45">
            العنوان
          </label>
          <Field
            id="los-ev-title"
            autoFocus
            value={d.title || ""}
            onChange={(e) => set({ title: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="مثال: اختبار مبادئ الإدارة"
          />
        </div>

        <div>
          <span className="mb-2 block text-xs text-white/45">النوع</span>
          <div className="grid grid-cols-2 gap-2">
            {EVENT_KINDS.map((k) => {
              const on = d.kind === k.id;
              const Icon = k.icon;
              return (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => set({ kind: k.id })}
                  aria-pressed={on}
                  className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[11.5px] font-bold transition-all"
                  style={{
                    borderColor: on ? `${k.tint}80` : T.border,
                    background: on ? `${k.tint}1F` : "rgba(255,255,255,0.03)",
                    color: on ? k.tint : T.muted,
                  }}
                >
                  <Icon size={14} strokeWidth={2} />
                  {k.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="los-ev-date" className="mb-1.5 block text-xs text-white/45">
              التاريخ
            </label>
            <DateField id="los-ev-date" value={d.date} onChange={(v) => set({ date: v })} />
          </div>
          <div>
            <label htmlFor="los-ev-time" className="mb-1.5 block text-xs text-white/45">
              الوقت <span style={{ color: T.faint }}>(اختياري)</span>
            </label>
            <TimeField id="los-ev-time" value={d.time} onChange={(v) => set({ time: v })} />
          </div>
        </div>

        <div>
          <label htmlFor="los-ev-place" className="mb-1.5 block text-xs text-white/45">
            المكان <span style={{ color: T.faint }}>(اختياري)</span>
          </label>
          <Field
            id="los-ev-place"
            value={d.place || ""}
            onChange={(e) => set({ place: e.target.value })}
            placeholder="مثال: قاعة ٢٠٣ — مبنى الإدارة"
          />
        </div>

        <div>
          <span className="mb-2 block text-xs text-white/45">التكرار</span>
          <div className="grid grid-cols-2 gap-2">
            {REPEATS.map((r) => {
              const on = (d.repeat || "none") === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => set({ repeat: r.id, until: r.id === "none" ? null : d.until })}
                  aria-pressed={on}
                  className="rounded-xl border px-3 py-2.5 text-[11.5px] font-bold transition-all"
                  style={{
                    borderColor: on ? `${T.violet}80` : T.border,
                    background: on ? `${T.violet}1F` : "rgba(255,255,255,0.03)",
                    color: on ? T.violet : T.muted,
                  }}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        {repeating && (
          <div className="los-in">
            <label htmlFor="los-ev-until" className="mb-1.5 block text-xs text-white/45">
              يتوقّف التكرار في <span style={{ color: T.faint }}>(اتركه فارغًا ليستمر)</span>
            </label>
            <div className="flex items-center gap-2">
              <DateField
                id="los-ev-until"
                value={d.until}
                min={d.date}
                onChange={(v) => set({ until: v || null })}
              />
              {d.until && (
                <Btn
                  variant="ghost"
                  size="icon"
                  onClick={() => set({ until: null })}
                  title="إلغاء تاريخ التوقّف"
                  style={{ borderColor: T.border }}
                >
                  <X size={14} />
                </Btn>
              )}
            </div>
          </div>
        )}

        <div>
          <span className="mb-2 block text-xs text-white/45">
            ينبّهك قبل الموعد بـ
          </span>
          <div className="flex flex-wrap gap-2">
            {WARN_CHOICES.map((w) => {
              const on = Number(d.warn || 0) === w;
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => set({ warn: w })}
                  aria-pressed={on}
                  className="rounded-xl border px-3 py-2 text-[11.5px] font-bold transition-all"
                  style={{
                    borderColor: on ? `${T.cta}80` : T.border,
                    background: on ? `${T.cta}1F` : "rgba(255,255,255,0.03)",
                    color: on ? T.cta : T.muted,
                  }}
                >
                  {w === 0 ? (
                    "لا تنبيه"
                  ) : (
                    <>
                      <span dir="ltr" className="tabular-nums">
                        {w}
                      </span>{" "}
                      {dayWord(w)}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="los-ev-note" className="mb-1.5 block text-xs text-white/45">
            ملاحظة <span style={{ color: T.faint }}>(اختياري)</span>
          </label>
          <Field
            id="los-ev-note"
            as="textarea"
            rows={3}
            value={d.note || ""}
            onChange={(e) => set({ note: e.target.value })}
            placeholder="ما يجب تحضيره، أو ما لا يجب أن تنساه"
            className="resize-y leading-relaxed"
          />
        </div>

        {err && (
          <p
            className="flex items-center gap-2 rounded-xl border px-3 py-2 text-[11.5px] font-bold"
            style={{
              borderColor: `${T.danger}4D`,
              background: `${T.danger}14`,
              color: T.danger,
            }}
            role="alert"
          >
            <AlertTriangle size={13} /> {err}
          </p>
        )}
      </div>
    </Modal>
  );
}

/* One square, opened. Everything written on that day in one place —
   the calendar's own entries and, below them, what the university screen
   has due. */
function DaySheet({ open, on, rows, due, uni, onClose, onAdd, onToggle, onEdit, onDelete, onGo }) {
  const d = keyToDate(on);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={d ? `${DOW_AR[d.getDay()]} · ${arDate(on)}` : "اليوم"}
      footer={
        <Btn variant="default" className="flex-1" onClick={onAdd}>
          <Plus size={15} strokeWidth={3} /> أضف في هذا اليوم
        </Btn>
      }
    >
      <div className="space-y-4">
        {on === dayKey() && (
          <Badge tint={T.cta}>
            <CircleDot size={11} /> اليوم
          </Badge>
        )}

        {rows.length === 0 && due.length === 0 ? (
          <p className="py-6 text-center text-[12px] leading-relaxed text-white/30">
            لا شيء في هذا اليوم.
            <span className="mt-1 block text-[11px] text-white/20">
              يوم فارغ في التقويم ليس يومًا فارغًا في عمرك.
            </span>
          </p>
        ) : (
          <div className="space-y-2">
            {rows.map(({ ev }) => (
              <EventRow
                key={ev.id}
                ev={ev}
                on={on}
                onToggle={() => onToggle(ev.id, on)}
                onEdit={() => onEdit(ev)}
                onDelete={() => onDelete(ev)}
              />
            ))}
          </div>
        )}

        {due.length > 0 && (
          <div>
            <p
              className="mb-2 flex items-center gap-1.5 text-[11px] font-bold"
              style={{ color: T.faint }}
            >
              <GraduationCap size={12} /> من الجامعة
            </p>
            <div className="space-y-2">
              {due.map((t) => (
                <UniDueRow
                  key={t.id}
                  task={t}
                  course={courseIn(uni, t.course)}
                  onGo={onGo}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function AgendaModule({ state, setState, onGo }) {
  const today = new Date();
  const [view, setView] = useState("month");
  const [cursor, setCursor] = useState({
    y: today.getFullYear(),
    m: today.getMonth(),
  });
  const [picked, setPicked] = useState(null); // the opened square
  const [draft, setDraft] = useState(null); // the event form

  const events = state.events || [];
  const uni = state.uni || uniShape();

  /* The window the month grid covers, including the leading blanks — an
     entry on the 1st of a month that starts on a Wednesday still has to be
     found, and the grid asks for its square by key. */
  const month = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const days = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const lead = (first.getDay() + 1) % 7; // the week starts Saturday
    const cells = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= days; d++)
      cells.push({ d, ds: fmtDay(new Date(cursor.y, cursor.m, d)) });
    return {
      cells,
      from: fmtDay(first),
      to: fmtDay(new Date(cursor.y, cursor.m, days)),
    };
  }, [cursor]);

  const byDate = useMemo(
    () => eventsIn(events, month.from, month.to),
    [events, month.from, month.to],
  );
  const dueByDate = useMemo(
    () => uniDue(uni, month.from, month.to),
    [uni, month.from, month.to],
  );

  const monthCount = useMemo(() => {
    let n = 0;
    for (const row of byDate.values()) n += row.length;
    return n;
  }, [byDate]);

  const alerts = useMemo(() => alertsOf(events), [events]);
  /* One expansion, four readings. Walking the recurrence rules once per
     counter is the same answer paid for four times. The counters read the
     occurrence-level list so «متأخّر ٣» means three real dates; the screen
     shows the entry-level one so a weekly class is a single row. */
  const all = useMemo(() => upcoming(events), [events]);
  const list = useMemo(() => upcomingRows(events), [events]);
  /* Ticked-but-still-ahead occurrences stay in the list (seeing that next
     week's exam is already prepared for is the point) but must not be
     counted as work outstanding. */
  const next7 = all.filter((r) => {
    const left = daysUntil(r.on);
    return left >= 0 && left <= 7 && !isEventDone(r.ev, r.on);
  }).length;
  const late = all.filter((r) => r.on < dayKey()).length;

  /* The twelve months of the cursor's year, each with how many entries land
     in it. Built in one pass over one window instead of twelve calls, which
     is what keeps a year of weekly entries cheap to draw. */
  const year = useMemo(() => {
    const from = fmtDay(new Date(cursor.y, 0, 1));
    const to = fmtDay(new Date(cursor.y, 11, 31));
    const map = eventsIn(events, from, to);
    const months = AR_MONTHS.map((label, m) => ({ label, m, n: 0, days: new Set() }));
    for (const [ds, row] of map) {
      const mm = Number(ds.slice(5, 7)) - 1;
      if (months[mm]) {
        months[mm].n += row.length;
        months[mm].days.add(Number(ds.slice(8, 10)));
      }
    }
    return months;
  }, [events, cursor.y]);

  const shift = (delta) =>
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const jumpToday = () => {
    const now = new Date();
    setCursor({ y: now.getFullYear(), m: now.getMonth() });
    setView("month");
  };

  const toggle = (id, on) =>
    setState((s) => ({
      ...s,
      events: (s.events || []).map((e) =>
        e.id !== id
          ? e
          : {
              ...e,
              doneOn: (e.doneOn || []).includes(on)
                ? e.doneOn.filter((x) => x !== on)
                : [...(e.doneOn || []), on],
            },
      ),
    }));

  const remove = (ev) => {
    const rep = repeatOf(ev.repeat);
    const msg = rep.short
      ? `حذف «${ev.title}» وكل تكراراته (${rep.label})؟`
      : `حذف «${ev.title}»؟`;
    if (!window.confirm(msg)) return;
    setState((s) => ({
      ...s,
      events: (s.events || []).filter((e) => e.id !== ev.id),
    }));
  };

  const openNew = (date) =>
    setDraft({
      ...eventShape({ date: date || dayKey(), kind: "note", warn: 1 }),
      isNew: true,
    });

  const save = () => {
    const ev = eventShape(draft);
    ev.title = String(draft.title || "").trim();
    setState((s) => {
      const prev = s.events || [];
      return {
        ...s,
        /* The ticks belong to the occurrences, not to the form — an entry
           edited after being ticked must not come back untouched. */
        events: prev.some((e) => e.id === ev.id)
          ? prev.map((e) => (e.id === ev.id ? { ...ev, doneOn: e.doneOn } : e))
          : [...prev, ev],
      };
    });
    /* Land the user where the entry actually went — saving a date in March
       while looking at October and seeing nothing change reads as a failed
       save. */
    const d = keyToDate(ev.date);
    if (d) setCursor({ y: d.getFullYear(), m: d.getMonth() });
    setDraft(null);
  };

  const stats = [
    { k: "في هذا الشهر", v: monthCount, c: T.sky, icon: CalendarDays },
    { k: "خلال أسبوع", v: next7, c: T.cta, icon: CalendarClock },
    { k: "متأخّر", v: late, c: late ? T.danger : T.faint, icon: AlertTriangle },
    { k: "كل المواعيد", v: events.length, c: T.accent, icon: Hash },
  ];

  const pickedRows = picked ? byDate.get(picked) || [] : [];
  const pickedDue = picked ? dueByDate.get(picked) || [] : [];

  return (
    <div className="space-y-7">
      <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:justify-between sm:p-7">
        <div className="min-w-0">
          <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">
            التقويم
          </h2>
          <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/40">
            الشهور والسنوات القادمة، وما يستحق أن يُحجز فيها. ما لا تاريخ له لا
            يحدث.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Btn variant="default" size="sm" onClick={() => openNew()}>
              <CalendarPlus size={14} strokeWidth={2.6} /> موعد جديد
            </Btn>
            <Btn
              variant="outline"
              size="sm"
              onClick={jumpToday}
              style={{ borderColor: T.border }}
            >
              <CircleDot size={13} /> اليوم
            </Btn>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {AGENDA_VIEWS.map((v) => {
            const on = v.id === view;
            const Icon = v.icon;
            return (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                aria-pressed={on}
                className="flex flex-col items-center gap-1 rounded-xl border px-3.5 py-2.5 text-[11px] font-bold transition-all duration-200"
                style={{
                  borderColor: on ? `${T.cta}80` : T.border,
                  background: on ? `${T.cta}1F` : "rgba(255,255,255,0.03)",
                  color: on ? T.cta : T.muted,
                }}
              >
                <Icon size={15} strokeWidth={2} />
                {v.label}
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.k} className="p-4">
              <div className="flex items-center gap-2">
                <Icon size={14} style={{ color: s.c }} />
                <p className="text-[10.5px]" style={{ color: T.faint }}>
                  {s.k}
                </p>
              </div>
              <p
                dir="ltr"
                className="mt-1 text-[22px] font-extrabold tabular-nums"
                style={{ color: s.c }}
              >
                {s.v}
              </p>
            </Card>
          );
        })}
      </div>

      {/* The warning window, open. An exam that only speaks on the morning
          of the exam is a calendar that waited until it was too late. */}
      {alerts.length > 0 && (
        <Card className="p-5 sm:p-6" style={{ borderColor: `${T.cta}40` }}>
          <p className="flex items-center gap-2 text-[13px] font-extrabold" style={{ color: T.cta }}>
            <Bell size={15} /> يقترب
          </p>
          <div className="mt-3 space-y-2">
            {alerts.slice(0, 6).map(({ ev, on, left }) => {
              const k = kindOf(ev.kind);
              const Icon = k.icon;
              return (
                <button
                  key={`${ev.id}:${on}`}
                  onClick={() => setPicked(on)}
                  className="flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-right transition-colors hover:bg-white/[0.06]"
                  style={{
                    borderColor: left <= 1 ? `${T.danger}4D` : "rgba(255,255,255,0.08)",
                    backgroundColor: left <= 1 ? `${T.danger}0F` : "rgba(255,255,255,0.03)",
                  }}
                >
                  <Icon size={15} className="shrink-0" style={{ color: k.tint }} />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-bold">
                    {ev.title || k.label}
                  </span>
                  <span
                    className="shrink-0 text-[11px] font-extrabold"
                    style={{ color: left <= 1 ? T.danger : T.accent }}
                  >
                    {whenWord(on)}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {view === "month" && (
        <Card className="p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            {/* RTL: the chevron pointing right walks back in time. */}
            <button
              onClick={() => shift(-1)}
              aria-label="الشهر السابق"
              className="rounded-xl border p-2 transition-colors hover:border-white/30"
              style={{ borderColor: T.border, color: T.muted }}
            >
              <ChevronRight size={16} />
            </button>
            <div className="text-center">
              <p className="text-[15px] font-extrabold" style={{ color: T.accent }}>
                {AR_MONTHS[cursor.m]}
              </p>
              <p dir="ltr" className="text-[11px] tabular-nums" style={{ color: T.faint }}>
                {cursor.y}
              </p>
            </div>
            <button
              onClick={() => shift(1)}
              aria-label="الشهر القادم"
              className="rounded-xl border p-2 transition-colors hover:border-white/30"
              style={{ borderColor: T.border, color: T.muted }}
            >
              <ChevronLeft size={16} />
            </button>
          </div>

          <div className="mb-1.5 grid grid-cols-7 gap-1 sm:gap-1.5">
            {WEEK_LABELS.map((w, i) => (
              <p
                key={i}
                className="text-center text-[10px] font-bold"
                style={{ color: T.faint }}
              >
                {w}
              </p>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {month.cells.map((cell, i) => {
              if (!cell) return <div key={`b${i}`} />;
              const rows = byDate.get(cell.ds) || [];
              const due = dueByDate.get(cell.ds) || [];
              const total = rows.length + due.length;
              const isToday = cell.ds === dayKey();
              const open = rows.filter((r) => !isEventDone(r.ev, r.on)).length +
                due.filter((t) => !t.done).length;
              const dow = keyToDate(cell.ds)?.getDay();
              const weekend = dow === 5; // Friday
              return (
                <button
                  key={cell.ds}
                  onClick={() => setPicked(cell.ds)}
                  aria-label={`${arDate(cell.ds)}${total ? ` — ${total} عنصر` : ""}`}
                  className="group relative flex min-h-[62px] flex-col rounded-xl border p-1.5 text-right transition-all duration-200 hover:border-white/30 sm:min-h-[84px]"
                  style={{
                    borderColor: isToday ? `${T.cta}99` : "rgba(255,255,255,0.08)",
                    backgroundColor: isToday
                      ? `${T.cta}14`
                      : weekend
                        ? "rgba(255,255,255,0.015)"
                        : "rgba(255,255,255,0.03)",
                    boxShadow: isToday ? `0 0 18px -6px ${T.cta}99` : "none",
                  }}
                >
                  <span className="flex items-center justify-between gap-1">
                    <span
                      dir="ltr"
                      className="text-[12px] font-extrabold tabular-nums"
                      style={{ color: isToday ? T.cta : total ? T.fg : T.faint }}
                    >
                      {cell.d}
                    </span>
                    {open > 0 && (
                      <span
                        dir="ltr"
                        className="rounded-md px-1 text-[9px] font-extrabold tabular-nums"
                        style={{ background: `${T.cta}26`, color: T.cta }}
                      >
                        {open}
                      </span>
                    )}
                  </span>

                  {/* Phones get dots, desktops get titles: at 375px a
                      truncated Arabic title in a 44px cell is noise. */}
                  <span className="mt-1 flex flex-wrap gap-0.5 sm:hidden">
                    {rows.slice(0, 4).map(({ ev, on }) => (
                      <span
                        key={ev.id}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          background: isEventDone(ev, on) ? T.primary : kindOf(ev.kind).tint,
                        }}
                      />
                    ))}
                    {/* Ringed, so a university deadline is visibly not one
                        of the calendar's own entries. */}
                    {due.slice(0, 2).map((t) => (
                      <span
                        key={t.id}
                        className="h-1.5 w-1.5 rounded-full border"
                        style={{
                          background: t.done ? T.primary : uniKindOf(t.kind).tint,
                          borderColor: "rgba(255,255,255,0.55)",
                        }}
                      />
                    ))}
                  </span>

                  <span className="mt-1 hidden min-w-0 flex-1 flex-col gap-0.5 sm:flex">
                    {rows.slice(0, 2).map(({ ev, on }) => {
                      const done = isEventDone(ev, on);
                      const tint = done ? T.primary : kindOf(ev.kind).tint;
                      return (
                        <span
                          key={ev.id}
                          className="truncate rounded px-1 py-0.5 text-[9.5px] font-bold"
                          style={{
                            background: `${tint}26`,
                            color: tint,
                            textDecoration: done ? "line-through" : "none",
                          }}
                        >
                          {ev.title || kindOf(ev.kind).label}
                        </span>
                      );
                    })}
                    {due.slice(0, 1).map((t) => (
                      <span
                        key={t.id}
                        className="truncate rounded px-1 py-0.5 text-[9.5px] font-bold"
                        style={{
                          background: `${uniKindOf(t.kind).tint}26`,
                          color: uniKindOf(t.kind).tint,
                          textDecoration: t.done ? "line-through" : "none",
                        }}
                      >
                        {t.title || uniKindOf(t.kind).label}
                      </span>
                    ))}
                    {total > 3 && (
                      <span className="px-1 text-[9px]" style={{ color: T.faint }}>
                        {"+"}
                        <span dir="ltr" className="tabular-nums">
                          {total - 3}
                        </span>
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {view === "year" && (
        <Card className="p-4 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <button
              onClick={() => setCursor((c) => ({ ...c, y: c.y - 1 }))}
              aria-label="السنة السابقة"
              className="rounded-xl border p-2 transition-colors hover:border-white/30"
              style={{ borderColor: T.border, color: T.muted }}
            >
              <ChevronRight size={16} />
            </button>
            <p
              dir="ltr"
              className="text-[19px] font-extrabold tabular-nums"
              style={{ color: T.accent }}
            >
              {cursor.y}
            </p>
            <button
              onClick={() => setCursor((c) => ({ ...c, y: c.y + 1 }))}
              aria-label="السنة القادمة"
              className="rounded-xl border p-2 transition-colors hover:border-white/30"
              style={{ borderColor: T.border, color: T.muted }}
            >
              <ChevronLeft size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {year.map((mo) => {
              const here =
                cursor.y === today.getFullYear() && mo.m === today.getMonth();
              const days = new Date(cursor.y, mo.m + 1, 0).getDate();
              return (
                <button
                  key={mo.m}
                  onClick={() => {
                    setCursor({ y: cursor.y, m: mo.m });
                    setView("month");
                  }}
                  className="rounded-2xl border p-3 text-right transition-all duration-200 hover:border-white/30"
                  style={{
                    borderColor: here ? `${T.cta}80` : T.border,
                    backgroundColor: here ? `${T.cta}14` : "rgba(255,255,255,0.03)",
                  }}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span
                      className="text-[12.5px] font-extrabold"
                      style={{ color: here ? T.cta : T.fg }}
                    >
                      {mo.label}
                    </span>
                    {mo.n > 0 && (
                      <span
                        dir="ltr"
                        className="rounded-md px-1.5 text-[9.5px] font-extrabold tabular-nums"
                        style={{ background: `${T.sky}26`, color: T.sky }}
                      >
                        {mo.n}
                      </span>
                    )}
                  </span>
                  <span className="mt-2 grid grid-cols-7 gap-[3px]">
                    {Array.from({ length: days }, (_, i) => i + 1).map((d) => (
                      <span
                        key={d}
                        className="h-[7px] rounded-sm"
                        style={{
                          background: mo.days.has(d)
                            ? T.sky
                            : "rgba(255,255,255,0.07)",
                          boxShadow: mo.days.has(d) ? `0 0 6px ${T.sky}80` : "none",
                        }}
                      />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {view === "list" && (
        <Card className="p-5 sm:p-7">
          <p className="text-[13px] font-extrabold" style={{ color: T.accent }}>
            القادم
          </p>
          <p className="mt-1 text-[11.5px] leading-relaxed" style={{ color: T.faint }}>
            المتأخّر أولًا، ثم اليوم، ثم ما بعده — بلا بحث في الشهور.
          </p>
          {list.length === 0 ? (
            <div className="py-10 text-center">
              <CalendarDays size={28} className="mx-auto" style={{ color: T.faint }} />
              <p className="mt-3 text-[12.5px] text-white/35">
                لا مواعيد مسجّلة بعد.
              </p>
              <Btn variant="default" size="sm" className="mt-4" onClick={() => openNew()}>
                <Plus size={14} strokeWidth={3} /> أضف أول موعد
              </Btn>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {list.map(({ ev, on, more }) => (
                <EventRow
                  key={`${ev.id}:${on}`}
                  ev={ev}
                  on={on}
                  showDate
                  more={more}
                  onToggle={() => toggle(ev.id, on)}
                  onEdit={() => setDraft({ ...ev })}
                  onDelete={() => remove(ev)}
                />
              ))}
            </div>
          )}
        </Card>
      )}

      <DaySheet
        open={!!picked}
        on={picked}
        rows={pickedRows}
        due={pickedDue}
        uni={uni}
        onClose={() => setPicked(null)}
        onAdd={() => {
          openNew(picked);
          setPicked(null);
        }}
        onToggle={toggle}
        onEdit={(ev) => {
          setDraft({ ...ev });
          setPicked(null);
        }}
        onDelete={remove}
        onGo={() => {
          setPicked(null);
          onGo("uni");
        }}
      />

      <EventModal
        open={!!draft}
        draft={draft}
        setDraft={setDraft}
        onClose={() => setDraft(null)}
        onSave={save}
      />
    </div>
  );
}


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
function NavGroups({ items, tab, onGo, showLabels }) {
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
function NavMore({ items, tab, onGo, showLabels }) {
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
function NavOrderEditor({ order, more, onChange, onMore, onReset }) {
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

function BottomTabs({ items, more: behind, tab, onGo, onSettings }) {
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

/* ==================================================================== *
 *  Backup — export / import the whole payload
 * ==================================================================== */
function SettingsModal({
  open,
  onClose,
  state,
  setState,
  savedAt,
  diskAt,
  onGo,
  onEditYesterday,
}) {
  const fileRef = useRef(null);
  const [note, setNote] = useState(null); // {ok, text}
  const [ordering, setOrdering] = useState(false);
  const [recovering, setRecovering] = useState(false);

  const exportData = () => {
    try {
      const blob = new Blob([JSON.stringify(state, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `life-os-2027-${dayKey()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setNote({ ok: true, text: "تم تنزيل نسخة احتياطية." });
    } catch {
      setNote({ ok: false, text: "تعذّر التصدير." });
    }
  };

  const importData = async (file) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      /* A file can be anything — refuse a payload that is not this app's,
         rather than replacing good data with a half-valid object. */
      if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.habits)) {
        setNote({ ok: false, text: "الملف ليس نسخة صالحة من Life OS." });
        return;
      }
      /* Through rollDay, exactly as the load path does it. A backup taken
         yesterday carries yesterday's date and yesterday's ticks; without
         this the app wears them as today until the minute poll catches up —
         long enough for the archive effect to stamp today's history row with
         a day the user did not live. */
      /* An unversioned payload is an *old* payload, not a current one.
         Spreading it over freshState left SCHEMA standing, so a hand-edited
         or third-party file skipped every migration and arrived looking
         modern while carrying shapes this build stopped understanding
         versions ago. Unknown means oldest, and migrate stamps the current
         version on the way out, so the walk happens once and never again.

         A file from a *newer* build keeps its own number: no branch can run
         for a version this build has not been taught, and pretending
         otherwise would reshape data it does not understand. */
      const ver = Number(parsed.schema);
      const from = Number.isFinite(ver) && ver > 0 ? ver : 0;
      setState(rollDay(migrate({ ...freshState(), ...parsed, schema: from })));
      setNote({
        ok: true,
        text: !from
          ? "تم الاستيراد — الملف بلا رقم إصدار، فرُقّي من أقدم نسخة احتياطًا."
          : ver > SCHEMA
            ? "تم الاستيراد — الملف من إصدار أحدث من هذا البناء؛ راجع بياناتك."
            : "تم استيراد البيانات واستبدال الحالي.",
      });
    } catch {
      setNote({ ok: false, text: "تعذّرت قراءة الملف — تأكّد أنه JSON سليم." });
    }
  };

  const place = placeShape(state.place);

  const counts = [
    { k: "عادة", n: state.habits?.length || 0 },
    { k: "مهمة", n: state.tasks?.length || 0 },
    { k: "هدف", n: state.goals?.length || 0 },
    { k: "كتاب", n: state.books?.length || 0 },
    { k: "موعد", n: state.events?.length || 0 },
    { k: "مقرّر", n: state.uni?.courses?.length || 0 },
  ];

  return (
    <Modal open={open} onClose={onClose} title="الإعدادات والنسخ الاحتياطي">
      <div className="space-y-5">
        <div
          className="grid grid-cols-3 gap-2 rounded-2xl border p-3 text-center"
          style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
        >
          {counts.map((c) => (
            <div key={c.k}>
              <p
                dir="ltr"
                className="text-[17px] font-extrabold tabular-nums"
                style={{ color: T.accent }}
              >
                {c.n}
              </p>
              <p className="text-[10px]" style={{ color: T.faint }}>
                {c.k}
              </p>
            </div>
          ))}
        </div>

        {/* Prayer times and the water goal. Both belong to the routine
            screen, but neither is something you set more than once — so they
            live here rather than taking permanent room on a daily driver. */}
        <div
          className="space-y-3.5 rounded-2xl border p-3.5"
          style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
        >
          <div>
            <label
              htmlFor="los-place"
              className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-bold"
              style={{ color: T.violet }}
            >
              <MapPin size={13} /> مدينة أوقات الصلاة
            </label>
            <select
              id="los-place"
              value={place.id}
              onChange={(e) => {
                const seed = PLACE_BY_ID.get(e.target.value);
                if (!seed) return;
                /* The school is the user's, not the city's — carried across
                   so changing town does not quietly switch his Asr. */
                setState((s) => ({
                  ...s,
                  place: placeShape({ ...seed, asr: placeShape(s.place).asr }),
                }));
              }}
              className="w-full rounded-xl border bg-transparent px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-white/30"
              style={{ borderColor: T.border, color: T.muted }}
            >
              {PLACES.map((c) => (
                <option key={c.id} value={c.id} style={{ background: T.cardSolid }}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="mb-1.5 block text-[11px]" style={{ color: T.faint }}>
              مذهب العصر
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { n: 1, label: "الشافعي والجمهور" },
                { n: 2, label: "الحنفي" },
              ].map((o) => {
                const on = place.asr === o.n;
                return (
                  <button
                    key={o.n}
                    onClick={() =>
                      setState((s) => ({
                        ...s,
                        place: placeShape({ ...placeShape(s.place), asr: o.n }),
                      }))
                    }
                    aria-pressed={on}
                    className="rounded-xl border px-3 py-2 text-[11.5px] font-bold transition-all"
                    style={{
                      borderColor: on ? `${T.violet}80` : T.border,
                      background: on ? `${T.violet}1F` : "transparent",
                      color: on ? T.violet : T.muted,
                    }}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span
              className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-bold"
              style={{ color: T.sky }}
            >
              <Droplets size={13} /> هدف الماء اليومي
            </span>
            <NumStep
              value={clampGoal(state.waterGoal)}
              onChange={(n) =>
                /* Lowering the goal below today's count would render fewer
                   cups than are filled, so the count comes down with it. */
                setState((s) => ({
                  ...s,
                  waterGoal: n,
                  water: Math.min(n, s.water || 0),
                }))
              }
              min={1}
              max={WATER_GOAL_MAX}
              unit={cupWord(clampGoal(state.waterGoal))}
              tint={T.sky}
            />
          </div>
        </div>

        {/* The sidebar's own reorder toggle is desktop-only, so this is the
            single path a phone has to its tab order. */}
        <div
          className="rounded-2xl border p-3"
          style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
        >
          <button
            onClick={() => setOrdering((v) => !v)}
            aria-expanded={ordering}
            className="flex w-full items-center gap-2 text-right"
          >
            {ordering ? (
              <ChevronUp size={14} style={{ color: T.accent }} />
            ) : (
              <ChevronDown size={14} style={{ color: T.accent }} />
            )}
            <span className="flex-1 text-[12.5px] font-bold" style={{ color: T.accent }}>
              ترتيب التبويبات
            </span>
            <GripVertical size={13} style={{ color: T.faint }} />
          </button>
          {ordering && (
            <div className="los-in mt-3">
              <NavOrderEditor
                order={state.navOrder}
                more={state.navMore}
                onChange={(ids) => setState((s) => ({ ...s, navOrder: ids }))}
                onMore={(ids) => setState((s) => ({ ...s, navMore: ids }))}
                onReset={() =>
                  setState((s) => ({ ...s, navOrder: NAV_IDS, navMore: MORE_IDS }))
                }
              />
            </div>
          )}
        </div>

        <DataHealth
          open={open}
          state={state}
          savedAt={savedAt}
          diskAt={diskAt}
          onGo={onGo}
          onEditYesterday={onEditYesterday}
          onRecover={() => setRecovering(true)}
        />

        {/* The snapshots the server has been writing all along, finally
            reachable. Above export/import because it is the answer to the
            same worry and does not require him to have taken a backup
            himself. */}
        <Btn variant="outline" className="w-full" onClick={() => setRecovering(true)}>
          <Archive size={15} /> مركز الاسترجاع
        </Btn>

        <div className="space-y-2.5">
          <Btn variant="default" className="w-full" onClick={exportData}>
            <Download size={15} /> تصدير البيانات
          </Btn>
          <Btn
            variant="outline"
            className="w-full"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={15} /> استيراد البيانات
          </Btn>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => {
              importData(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>

        <p
          className="rounded-xl border px-3.5 py-2.5 text-[11px] leading-relaxed"
          style={{
            borderColor: `${T.accent}3D`,
            background: `${T.accent}12`,
            color: T.accent,
          }}
        >
          الاستيراد يستبدل كل بياناتك الحالية. صدّر نسخة أولًا إن لم تكن متأكّدًا.
        </p>

        {note && (
          <p
            className="los-in rounded-xl border px-3.5 py-2.5 text-center text-[11.5px] font-bold"
            style={{
              borderColor: note.ok ? `${T.primary}59` : `${T.danger}59`,
              background: note.ok ? `${T.primary}1A` : `${T.danger}1A`,
              color: note.ok ? T.primary : T.danger,
            }}
          >
            {note.text}
          </p>
        )}

        <RecoveryModal
          open={recovering}
          onClose={() => setRecovering(false)}
          state={state}
        />
      </div>
    </Modal>
  );
}

/* ==================================================================== *
 *  وضع الرجوع — two days away, and no verdict waiting
 *
 *  Somebody opening this app after a week away is opening it for a verdict,
 *  and the verdict a broken streak and a 0% ring deliver is «you failed, and
 *  here is the number». That is the moment the app gets closed for a month,
 *  and no amount of accurate arithmetic makes it a useful thing to say.
 *
 *  So on a day that follows two or more unrecorded ones, the first thing on
 *  «اليوم» is the smallest possible surface: the core habits and the three
 *  tasks, and nothing else. No streak, no percentage, no count of what was
 *  missed — all of that is still one scroll away and none of it is the first
 *  sentence. It owns nothing of its own: the habits are the same flat array
 *  ticked through the same `useHabitTick`, and the three are the same
 *  `TopThree` every other screen renders.
 *
 *  It closes, and stays closed for the rest of the day. A card that says
 *  «نبدأ بأقل شي» and then reappears after every tick is the nagging it
 *  exists to replace.
 * ==================================================================== */
function ComebackCard({ state, setState, days, onTick, onTickTiny, onClose }) {
  /* The core when one is set, every habit when none is — the same roster
     the score reads, so this card cannot show a different five from the
     ring. Only what is still open: the point is the shortest list, and a
     list of things already done is not a place to start. */
  const open = scoredOf(state.habits || []).filter((h) => !h.done);
  const shown = open.slice(0, CORE_CAP);

  return (
    <Card
      className="p-6 sm:p-7"
      style={{
        borderColor: `${T.sky}59`,
        backgroundColor: `${T.sky}0D`,
        boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.15), 0 0 50px -20px ${T.sky}`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border"
            style={{
              borderColor: `${T.sky}4D`,
              background: `linear-gradient(160deg, ${T.sky}33, ${T.sky}0F)`,
              color: T.sky,
            }}
          >
            <Sunrise size={20} strokeWidth={2.4} />
          </span>
          <div className="min-w-0">
            <h3 className="text-[17px] font-extrabold" style={{ color: T.sky }}>
              رجعت. نبدأ بأقل شي.
            </h3>
            {/* The days away are stated once, flatly, because they are a
                fact he already knows and hiding them would be the app
                pretending. What is never stated is a verdict about them. */}
            <p className="mt-1 text-[11.5px] leading-relaxed" style={{ color: T.faint }}>
              {daysPhrase(days) || `${days} ${dayWord(days)}`} بلا تسجيل. لا شيء
              يحتاج تعويضًا — اليوم وحده يكفي.
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="إغلاق بطاقة الرجوع"
          title="أرني الشاشة كاملة"
          className="shrink-0 rounded-lg border p-1.5 text-white/30 transition-colors hover:text-white"
          style={{ borderColor: T.border }}
        >
          <X size={14} />
        </button>
      </div>

      <div className="mt-5">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold" style={{ color: T.primaryLift }}>
          <Star size={11} fill={T.accent} style={{ color: T.accent }} /> الأساسيات
        </p>
        {shown.length ? (
          <div className="space-y-1.5">
            {shown.map((h) => (
              <TodayHabit
                key={h.id}
                habit={h}
                book={bookForHabit(h, state.books)}
                onToggle={() => onTick(h.id)}
                onToggleTiny={() => onTickTiny(h.id)}
              />
            ))}
          </div>
        ) : (
          <p
            className="rounded-xl border border-dashed px-3 py-4 text-center text-[11.5px]"
            style={{ borderColor: T.border, color: T.faint }}
          >
            أساسياتك كلها تمّت اليوم. هذا كل المطلوب.
          </p>
        )}
      </div>

      <div className="mt-5">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold" style={{ color: T.ctaLift }}>
          <Zap size={11} /> ثلاث مهام، لا أكثر
        </p>
        <div className="-mx-1">
          <TopThree state={state} setState={setState} />
        </div>
      </div>
    </Card>
  );
}

/* ==================================================================== *
 *  جهّز غدك — the three picked the night before
 *
 *  A day's three tasks get chosen the night before or they get chosen at
 *  ten in the morning by whatever shouted loudest. This is the screen that
 *  asks for them, and it owns no store of its own: a pick is a task id out
 *  of the same `state.tasks` the matrix edits, the first step is written
 *  onto that task row, and the hour goes onto the calendar as a real entry
 *  rather than a second copy of a time. `rollDay` then promotes exactly
 *  those three and spends the prep — the arithmetic is `applyPrep` in
 *  life-state.mjs, under test, and nothing here recomputes any of it.
 * ==================================================================== */
function TomorrowModal({ open, onClose, state, setState }) {
  const arm = useUndo();
  const [capHit, fireCapHit] = useBurst(2800);
  const [draft, setDraft] = useState("");

  /* Recomputed on every render rather than captured when the modal opened:
     a window left open across 04:00 would otherwise be preparing a day that
     has already started. */
  const on = tomorrowKey();
  const prep = prepShape(state.tomorrow);
  const picks = prep.for === on ? prep.picks : [];
  const byId = useMemo(
    () => new Map((state.tasks || []).map((t) => [t.id, t])),
    [state.tasks],
  );
  const rowsOf = picks.map((p) => ({ pick: p, task: byId.get(p.task) })).filter((r) => r.task);
  const slots = [...Array(TOP_TASK_CAP)].map((_, i) => rowsOf[i] || null);
  const full = rowsOf.length >= TOP_TASK_CAP;

  const pool = (state.tasks || []).filter(
    (t) => !t.done && !picks.some((p) => p.task === t.id),
  );

  /* The event a pick's hour lives in, looked up rather than remembered. */
  const eventOf = (p) =>
    p.event ? (state.events || []).find((e) => e.id === p.event) || null : null;

  const pick = (id) => {
    /* The cap is refused in `prepPickAdd` whatever this does; the screen's
       job is only to say why. */
    if (full) {
      fireCapHit();
      return;
    }
    setState((s) => ({ ...s, tomorrow: prepPickAdd(s.tomorrow, id, tomorrowKey()) }));
  };

  /* Written straight onto the task row, keystroke by keystroke. Held in
     local state and committed on close was the other option and is worse:
     a step typed and then dismissed with Escape is text the user wrote,
     and this app does not lose that. */
  const setStep = (id, text) =>
    setState((s) => ({
      ...s,
      tasks: (s.tasks || []).map((t) =>
        t.id === id ? { ...t, step: String(text).slice(0, STEP_MAX) } : t,
      ),
    }));

  /* An hour is a calendar entry, not a field on the prep. Setting one
     creates it, changing one moves it, clearing one deletes it — and the
     pick only ever remembers which entry it is. */
  const setTime = (p, raw) =>
    setState((s) => {
      const time = hhmm(raw);
      const day = tomorrowKey();
      const task = (s.tasks || []).find((t) => t.id === p.task);
      let events = s.events || [];
      let id = p.event;
      if (!time) {
        if (id) events = events.filter((e) => e.id !== id);
        id = null;
      } else if (id && events.some((e) => e.id === id)) {
        /* Only the two fields this screen owns. A title he rewrote on the
           calendar is his, and a repeat he set there stays set. */
        events = events.map((e) => (e.id === id ? { ...e, date: day, time } : e));
      } else {
        const ev = eventShape({
          date: day,
          time,
          kind: "note",
          title: (task?.text || "").trim() || "مهمة الغد",
          warn: 0,
        });
        events = [...events, ev];
        id = ev.id;
      }
      return { ...s, events, tomorrow: prepPickEvent(s.tomorrow, p.task, id) };
    });

  /* Removing a pick deletes the calendar entry its hour created, so it is
     armed like every other destructive button in this tree. The whole
     arrays go in, never the rows. */
  const drop = (p) => {
    arm("أُزيلت من تجهيز الغد", {
      events: state.events,
      tomorrow: state.tomorrow,
    });
    setState((s) => ({
      ...s,
      events: p.event ? (s.events || []).filter((e) => e.id !== p.event) : s.events || [],
      tomorrow: prepPickDrop(s.tomorrow, p.task),
    }));
  };

  /* A task that does not exist yet. Without this, preparing tomorrow at
     22:00 means going to the matrix first — and a screen that sends you
     somewhere else to be used is a screen you stop opening. It lands in
     «مهم غير عاجل» like every other undecided task, through the one shape. */
  const addAndPick = () => {
    const text = draft.trim();
    if (!text) return;
    if (full) {
      fireCapHit();
      return;
    }
    const t = taskShape({ text, quadrant: "q2" });
    setState((s) => ({
      ...s,
      tasks: [...(s.tasks || []), t],
      tomorrow: prepPickAdd(s.tomorrow, t.id, tomorrowKey()),
    }));
    setDraft("");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="جهّز غدك"
      footer={
        <Btn variant="default" className="flex-1" onClick={onClose}>
          تمّ — نراه غدًا
        </Btn>
      }
    >
      <div className="space-y-5">
        <p
          className="rounded-xl border px-3.5 py-3 text-[11.5px] leading-relaxed"
          style={{
            borderColor: `${T.violet}3D`,
            background: `${T.violet}12`,
            color: T.muted,
          }}
        >
          ثلاث مهام لـ{" "}
          <span className="font-extrabold" style={{ color: T.violet }}>
            {arDate(on)}
          </span>
          . اكتب لكل واحدة أول خطوة — الخطوة هي ما يتحرّك، لا العنوان. ما
          تختاره الليلة يصبح «أهم ٣ مهام» حين يبدأ الغد.
        </p>

        <div className="space-y-3">
          {slots.map((row, i) =>
            row ? (
              <div
                key={row.pick.task}
                className="rounded-2xl border p-3.5"
                style={{ borderColor: `${T.cta}3D`, backgroundColor: `${T.cta}0A` }}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-extrabold tabular-nums"
                    style={{ background: `${T.cta}26`, color: T.ctaLift }}
                  >
                    {i + 1}
                  </span>
                  <p className="min-w-0 flex-1 pt-1 text-[13px] font-bold leading-snug text-white/85">
                    {row.task.text}
                  </p>
                  <button
                    onClick={() => drop(row.pick)}
                    aria-label={`أزل ${row.task.text} من تجهيز الغد`}
                    title="أزل من غدك"
                    className="shrink-0 rounded-lg border p-1.5 text-white/30 transition-colors hover:text-red-400"
                    style={{ borderColor: T.border }}
                  >
                    <X size={13} />
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-[1fr_auto]">
                  <div>
                    <label
                      htmlFor={`los-step-${row.task.id}`}
                      className="mb-1.5 flex items-center gap-1.5 text-[11px] text-white/45"
                    >
                      <Footprints size={11} style={{ color: T.cta }} /> أول خطوة
                    </label>
                    <Field
                      id={`los-step-${row.task.id}`}
                      value={row.task.step || ""}
                      maxLength={STEP_MAX}
                      onChange={(e) => setStep(row.task.id, e.target.value)}
                      placeholder="أصغر شيء يبدأ الحركة…"
                    />
                  </div>
                  <div className="sm:w-36">
                    <label
                      htmlFor={`los-time-${row.task.id}`}
                      className="mb-1.5 flex items-center gap-1.5 text-[11px] text-white/45"
                    >
                      <Clock size={11} style={{ color: T.violet }} /> وقت محدد
                    </label>
                    <TimeField
                      id={`los-time-${row.task.id}`}
                      value={eventOf(row.pick)?.time || ""}
                      onChange={(v) => setTime(row.pick, v)}
                    />
                  </div>
                </div>

                {!!eventOf(row.pick) && (
                  <p
                    className="mt-2 flex items-center gap-1.5 text-[10.5px]"
                    style={{ color: T.primary }}
                  >
                    <CalendarPlus size={11} /> موعد في التقويم{" "}
                    <span dir="ltr" className="font-bold tabular-nums">
                      {prettyTime(eventOf(row.pick).time)}
                    </span>
                  </p>
                )}
              </div>
            ) : (
              <div
                key={`slot-${i}`}
                className="flex items-center gap-2.5 rounded-2xl border border-dashed px-3.5 py-4"
                style={{ borderColor: T.border }}
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-extrabold tabular-nums"
                  style={{ background: "rgba(255,255,255,0.06)", color: T.faint }}
                >
                  {i + 1}
                </span>
                <p className="text-[11.5px]" style={{ color: T.faint }}>
                  اختر مهمة من الأسفل.
                </p>
              </div>
            ),
          )}
        </div>

        {full ? (
          <p
            className={`rounded-xl border px-3.5 py-2.5 text-center text-[11.5px] leading-relaxed${
              capHit ? " los-pop" : ""
            }`}
            style={{
              borderColor: `${T.accent}3D`,
              background: `${T.accent}12`,
              color: T.accent,
            }}
          >
            ثلاث فقط — هذا هو الشرط. أزل واحدة قبل أن تضع غيرها.
          </p>
        ) : (
          <div>
            <p className="mb-2 text-[11px] font-bold" style={{ color: T.muted }}>
              مهامك غير المنجزة
            </p>
            {pool.length ? (
              <div className="flex max-h-56 flex-wrap gap-2 overflow-y-auto pl-1">
                {pool.map((t) => {
                  const q = QUADRANTS.find((x) => x.id === t.quadrant) || QUADRANTS[1];
                  return (
                    <button
                      key={t.id}
                      onClick={() => pick(t.id)}
                      className="flex max-w-full items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11.5px] transition-all duration-200 hover:-translate-y-0.5"
                      style={{
                        borderColor: `${q.tint}40`,
                        backgroundColor: `${q.tint}12`,
                        color: "rgba(255,255,255,0.8)",
                      }}
                    >
                      <Plus size={11} strokeWidth={3} style={{ color: q.tint }} />
                      <span className="truncate">{t.text}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p
                className="rounded-xl border border-dashed px-3 py-4 text-center text-[11.5px]"
                style={{ borderColor: T.border, color: T.faint }}
              >
                لا مهام غير منجزة. اكتب واحدة تحت.
              </p>
            )}

            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Field
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addAndPick()}
                placeholder="أو اكتب مهمة جديدة لغدٍ…"
                aria-label="مهمة جديدة لغد"
              />
              <Btn variant="outline" onClick={addAndPick} disabled={!draft.trim()}>
                <Plus size={14} strokeWidth={3} /> أضفها واخترها
              </Btn>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}


/* ==================================================================== *
 *  ROOT
 * ==================================================================== */
export default function LifeOS() {
  /* Resolved before anything else: a window without the lease must not reach
     a single write, and that includes the ones the archive effect fires on
     its own without the user touching anything. */
  const [role, takeOver] = useWriteLease();
  const leading = role === "leader";
  const [state, setState] = useState(loadState);
  /* Validated, not just defaulted. A saved id this build no longer has —
     a tab renamed or dropped, or a hand-edited preferences key — renders
     no module at all: an empty page with a working sidebar, which reads as
     the app having lost everything. */
  /* «اليوم» on a fresh open, where he left off on a reload.
   *
   *  The two are different questions and `localStorage` alone cannot tell
   *  them apart. Opening the app in the morning should land on the screen
   *  that says what the next hour needs — that is the whole reason the
   *  screen exists. A reload is not an open: the conflict bar's «حمّل
   *  الأحدث» reloads, a follower window reloads itself, and F5 in the middle
   *  of writing a goal is the user asking for the same screen back, not for
   *  a landing page. `sessionStorage` survives a reload and is empty in a
   *  new tab or window, which is exactly that line. */
  const [tab, setTab] = useState(() => {
    const saved = readUI().tab;
    const back = NAV_IDS.includes(saved) ? saved : "today";
    try {
      if (window.sessionStorage.getItem(OPENED_KEY)) return back;
      window.sessionStorage.setItem(OPENED_KEY, "1");
    } catch {
      /* Blocked storage means every render is a fresh open, which lands on
         «اليوم» — the safe side of a preference nobody can read. */
    }
    return "today";
  });
  const [collapsed, setCollapsed] = useState(() => !!readUI().collapsed);
  const [streakToast, setStreakToast] = useState(null); // streak count when banked
  const [saveFailed, setSaveFailed] = useState(false);
  const [savedAt, setSavedAt] = useState(null); // when the browser write landed
  /* The disk is a second destination with its own failure mode, and the save
     stamp used to speak only for the browser — a server that had been down
     for two days looked exactly like one that was keeping up. `diskAt` is
     set from the server's own answer, never guessed from a render. */
  const [diskAt, setDiskAt] = useState(null);
  const [diskStuck, setDiskStuck] = useState(false);
  /* Another window's revision is ahead of this one's. Nothing is written
     while this is set — the two ways out are the only ways out. */
  const [conflict, setConflict] = useState(null);
  const [resolving, setResolving] = useState(false);
  /* The revision this window loaded, and the one the storage had when it
     did. Refs, not state: it changes on every save and a re-render to
     announce a save is a re-render for nothing. */
  const myRevRef = useRef(0);
  if (myRevRef.current === 0) myRevRef.current = readRev();
  const [settings, setSettings] = useState(false);
  const [editNav, setEditNav] = useState(false);
  const [reflect, setReflect] = useState(false);
  const [tomorrow, setTomorrow] = useState(false);
  /* How often the evening prompt has shown today and when it may show
     again. Kept with the other per-viewer preferences, not in the archive:
     it is a reminder's snooze, not something written about the day. In
     memory only, a reload reset it and the prompt reappeared at once. */
  const [nag, setNagState] = useState(() => obj(readUI().reflect));
  /* The comeback card, once it has been put away. Same shelf as the snooze
     above and for the same reason. */
  const [back, setBack] = useState(() => obj(readUI().back));
  const nagRef = useRef(nag);
  const setNag = useCallback((next) => {
    nagRef.current = next;
    setNagState(next);
  }, []);
  const [mirror, setMirror] = useState(false);
  /* Yesterday's correction sheet. It lives here rather than in the routine
     screen because the data-health panel reaches it too, and a modal owned
     by one screen cannot be opened from another without a second copy. */
  const [fixing, setFixing] = useState(false);

  /* --- the eight seconds after a delete ------------------------------- *
     The snapshot a delete left behind, and the toast offering it back. Held
     here because the toast is a fixed bar over everything, and armed from
     anywhere through `UndoBus`.

     Spread back over whatever the state is by then, never over the state as
     it was: something unrelated may well have changed in those eight
     seconds, and undoing a delete must not undo that too. */
  const [undo, setUndo] = useState(null);
  const arm = useCallback((label, before) => {
    setUndo({ label, before, at: Date.now() });
  }, []);
  const takeBack = useCallback(() => {
    if (!undo) return;
    setState((s) => ({ ...s, ...undo.before }));
    setUndo(null);
  }, [undo]);
  const dropUndo = useCallback(() => setUndo(null), []);

  /* Once per open, and only to give back what the rotation above took: the
     three unread copies are already ~78KB of the quota this profile has been
     carrying, and nothing reclaims them by itself. */
  useEffect(() => {
    dropDeadBackups();
  }, []);

  useEffect(() => {
    /* The one gate that matters. A window that lost the lease is holding a
       snapshot from before the other one started working; writing it back is
       precisely the clobbering the lease exists to stop. */
    if (!leading) return;
    /* And the second gate, for the case the lease cannot see: a window whose
       revision has been overtaken. The lease covers two windows open at the
       same time; this covers one that was asleep, or on another origin, or
       came back from a tab that had been sitting since yesterday. Read the
       stored number fresh every time — the point is that something else may
       have moved it since the last render. */
    const stored = readRev();
    if (stored > myRevRef.current) {
      setConflict({ mine: myRevRef.current, theirs: stored, where: "window" });
      return;
    }
    if (conflict) return; // already stopped; nothing is written until it is answered
    const next = stored + 1;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      /* The counter moves only after the payload it counts has landed.
         Bumping first and failing second would leave every other window
         locked out behind a revision that describes nothing. */
      writeRev(next);
      myRevRef.current = next;
      setSaveFailed(false);
      setSavedAt(Date.now());
    } catch {
      /* Swallowing this silently is how a week of work disappears without
         anyone noticing. The app keeps running — but it has to say so. */
      setSaveFailed(true);
      return;
    }
    syncOut(state, next);
  }, [state, leading, conflict]);

  /* What the server said about the last write. The stamp and the two bars
     all hang off this one report. */
  useEffect(() => {
    const stuckSince = { at: null };
    onSyncResult((r) => {
      if (r.ok) {
        stuckSince.at = null;
        setDiskStuck(false);
        setDiskAt(r.at || Date.now());
        return;
      }
      if (r.conflict) {
        setConflict({
          mine: myRevRef.current,
          theirs: r.disk && Number.isFinite(r.disk.rev) ? r.disk.rev : null,
          where: "disk",
        });
        return;
      }
      /* A minute of failures, not one. The server restarts, the laptop
         sleeps, a request is cut off mid-flight — none of that is worth a
         banner. Two days of silence is. */
      if (stuckSince.at === null) stuckSince.at = Date.now();
      if (Date.now() - stuckSince.at >= DISK_STUCK_MS) setDiskStuck(true);
    });
    return () => onSyncResult(null);
  }, []);

  /* The last change before the window goes away. The debounce is 800ms and
     closing a window takes less, so without this the disk stayed a tick
     behind the browser — and the disk is what the reminders read and what a
     cleared profile recovers from. */
  useEffect(() => {
    const leave = () => flushSync();
    const hide = () => {
      if (document.visibilityState === "hidden") flushSync();
    };
    window.addEventListener("pagehide", leave);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("pagehide", leave);
      document.removeEventListener("visibilitychange", hide);
    };
  }, []);

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === STORAGE_KEY || e.key === REV_KEY) {
        const stored = readRev();
        if (stored > myRevRef.current) {
          setConflict({ mine: myRevRef.current, theirs: stored, where: "window" });
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  /* Whether this copy is the primary one, decided once. The origin does not
     change under a running page, so this is a constant for the session —
     it is only in state so the bar renders on the first paint. */
  const [stray] = useState(() => strayCopy());

  /* The two ways out of a conflict, and nothing in between.

     Taking the disk throws away what this window holds, which is the honest
     thing when the disk is ahead: this window's copy is the older one by
     definition. Keeping this window's copy is the other answer, and it is
     destructive in the other direction — so the server stows the file it is
     about to overwrite in backups/guard/ before it does. */
  const takeDisk = useCallback(async () => {
    setResolving(true);
    try {
      await adoptDisk();
      window.location.reload();
    } catch {
      /* The server is unreachable, or handed back something that is not this
         app's state. Nothing was written; the bar stays up and the other
         button still works. */
      setResolving(false);
    }
  }, []);

  const keepMine = useCallback(async () => {
    setResolving(true);
    const next = readRev() + 1;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      writeRev(next);
      myRevRef.current = next;
      setSavedAt(Date.now());
    } catch {
      setSaveFailed(true);
    }
    try {
      await postSync(state, next, { force: true });
    } catch {
      /* The browser copy is current either way; the disk bar covers the rest. */
    }
    setConflict(null);
    setResolving(false);
  }, [state]);

  /* The disk, asked again. The payload is whatever is on screen now, at the
     revision this window already holds — a retry is not a new change. */
  const retryDisk = useCallback(() => {
    setDiskStuck(false);
    try {
      postSync(state, myRevRef.current);
    } catch {}
  }, [state]);

  /* The app is left open for days, so the day boundary cannot live only in
     the load path. Polled once a minute and re-checked whenever the tab is
     looked at again, because a background tab throttles timers hard. */
  useEffect(() => {
    const check = () => setState(rollDay);
    const id = setInterval(check, 60000);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  useEffect(() => {
    /* Gated too. These are only preferences, but the evening prompt's snooze
       rides along with them, and a blocked window re-arming it would make the
       prompt reappear in the window that is actually being used. */
    if (!leading) return;
    try {
      window.localStorage.setItem(
        UI_KEY,
        JSON.stringify({ tab, collapsed, reflect: nag, back }),
      );
    } catch {
      /* per-viewer convenience only */
    }
  }, [tab, collapsed, nag, back, leading]);

  /* Through `disciplineOf`, never recomputed here — the archive row, the streak and
     the ring all read the same denominator or they will disagree about the
     same day the first time a habit is marked core. */
  const discipline = disciplineOf(state.habits);

  /* Which habits, not just how many. Reviewing a month is asking "what was I
     actually keeping", and a bare percentage cannot answer that. Ids rather
     than labels — twenty Arabic labels a day is most of a megabyte a year,
     and the label is resolved from the live list when the day is opened. */
  const doneIds = useMemo(
    () => state.habits.filter((h) => h.done).map((h) => h.id),
    [state.habits],
  );
  /* Which of them were carried on the floor rather than done whole. A subset
     of `done` and never a replacement for it — the score, the streak and the
     roll call all read `done`, and a tiny tick is a tick to every one of
     them. This list only answers «how», which is the question a month read
     back a year later actually needs. */
  const tinyIds = useMemo(
    () => state.habits.filter((h) => h.done && h.tiny).map((h) => h.id),
    [state.habits],
  );
  const tinyCall = tinyIds.join(",");
  /* Keyed on the roll call itself, never on the score alone: unticking one
     habit and ticking another leaves the percentage identical, and a
     dependency on the number would quietly freeze the list behind it. */
  const rollCall = doneIds.join(",");
  /* The roster as it stood that day, not just the ticks. Without it a habit
     added in November would show up as "missed" across every day in October,
     which is a worse lie than showing nothing. */
  const roster = useMemo(() => state.habits.map((h) => h.id), [state.habits]);

  /* The breaker stops being an island here: the day's holds and falls ride
     the same archive row as the discipline score, so the calendar and the
     day's roll call can show them. */
  const breakerDay = useMemo(
    () => breakerToday(state.badHabits || []),
    [state.badHabits, state.date],
  );

  /* archive today's score continuously so analytics never needs a save button.
     Today's entry is merged, not replaced — it also carries the evening
     reflection, and rebuilding it from scratch would wipe what was written. */
  useEffect(() => {
    setState((s) => {
      const today = dayKey();
      const prev = (s.history || []).find((h) => h.date === today);
      const rest = (s.history || []).filter((h) => h.date !== today);
      const next = [
        ...rest,
        {
          ...prev,
          date: today,
          pct: discipline,
          done: doneIds,
          tiny: tinyIds,
          all: roster,
          holds: breakerDay.holds,
          falls: breakerDay.falls,
          /* Per-day like everything else on this row, so the calendar and
             the monthly tracker can read it back without a second ledger. */
          water: state.water || 0,
        },
      ].slice(-HISTORY_CAP);
      return { ...s, history: next };
    });
  }, [
    rollCall,
    tinyCall,
    discipline,
    doneIds,
    tinyIds,
    roster,
    breakerDay.holds,
    breakerDay.falls,
    state.water,
  ]);

  useEffect(() => {
    if (discipline >= STREAK_TARGET && !state.dayBanked) {
      setState((s) => {
        const n = s.streakBase + 1;
        return { ...s, dayBanked: true, bestStreak: Math.max(s.bestStreak || 0, n) };
      });
      setStreakToast(state.streakBase + 1);
      const t = setTimeout(() => setStreakToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [discipline, state.dayBanked, state.streakBase]);

  const streak = state.streakBase + (state.dayBanked ? 1 : 0);

  /* The run as the archive tells it — the days banked and, separately, the
     days stepped over. `streakBase` is the same number read at the last
     rollover; this is read live, so an edit to yesterday moves the tolerance
     line in the same render it moves the count. */
  const streakRun = useMemo(() => streakRunFrom(state.history), [state.history]);

  /* How many days in a row went unrecorded before today. Zero on any
     ordinary day, and on a brand-new profile. */
  const away = useMemo(
    () => comebackFrom(state.history, state.date),
    [state.history, state.date],
  );
  /* Dismissed for the rest of the day, and written out with the other
     per-viewer preferences by the effect below: it is a card being put
     away, not something recorded about the day. In memory only, a reload
     would put it straight back. */
  const comeback = away >= COMEBACK_MIN && back.day !== state.date ? away : 0;

  const [quote, shuffleQuote] = useDailyQuote(state.quotes || []);
  const phase = useSkyPhase();

  /* Overscroll and the area behind the fixed sky both read from the
     document element, so the phase colour goes there. */
  useEffect(() => {
    const el = document.documentElement;
    const prev = el.style.backgroundColor;
    el.style.backgroundColor = phase.body;
    el.style.transition = "background-color 1600ms ease";
    return () => {
      el.style.backgroundColor = prev;
    };
  }, [phase.body]);

  /* Through the logical evening, on a day that fell short, up to three
     times an hour apart — and never once today's reflection is written.
     Polled because the app is often left open for days. */
  const todayEntry = (state.history || []).find((h) => h.date === dayKey());
  const alreadyReflected = !!(todayEntry?.distraction || todayEntry?.fix);
  /* Whether tomorrow already has its three. Derived, like everything else
     the shell hands down — the prep itself lives in one place. */
  const prepped = prepReady(state.tomorrow, state.tasks, tomorrowKey()).length > 0;
  useEffect(() => {
    if (alreadyReflected) return;
    const check = () => {
      const day = dayKey();
      /* The snooze is read fresh on every tick rather than captured, so a
         dismissal lands immediately without re-running the effect. */
      const n = nagRef.current;
      const seen = n.day === day ? n.shown || 0 : 0;
      if (seen >= REFLECT_MAX_SHOWS) return;
      if (n.day === day && n.until && Date.now() < n.until) return;
      if (!inReflectWindow() || discipline >= STREAK_TARGET) return;
      setReflect(true);
      /* Counted when it is shown, not when it is dismissed: a prompt the
         user walks away from has still been asked. */
      setNag({ day, shown: seen + 1, until: Date.now() + REFLECT_SNOOZE_MS });
    };
    check();
    /* A background tab throttles intervals hard, so also check the moment
       the tab is looked at again — that is when the evening prompt matters. */
    const id = setInterval(check, 60000);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [alreadyReflected, discipline, setNag]);

  const saveReflection = useCallback(
    (distraction, fix) => {
      setState((s) => {
        const today = dayKey();
        const prev = (s.history || []).find((h) => h.date === today);
        const rest = (s.history || []).filter((h) => h.date !== today);
        return {
          ...s,
          history: [
            ...rest,
            { ...prev, date: today, pct: discipline, distraction, fix },
          ].slice(-HISTORY_CAP),
        };
      });
      setReflect(false);
    },
    [discipline],
  );

  const saveMirror = useCallback(
    (text) => {
      setState((s) => {
        const today = dayKey();
        const prev = (s.history || []).find((h) => h.date === today);
        const rest = (s.history || []).filter((h) => h.date !== today);
        return {
          ...s,
          history: [...rest, { ...prev, date: today, pct: discipline, mirror: text }].slice(
            -HISTORY_CAP,
          ),
        };
      });
      setMirror(false);
    },
    [discipline],
  );

  const resetDay = useCallback(() => {
    if (!window.confirm("تصفير اليوم؟ سيُلغى تأشير جميع العادات والمهام.")) return;
    setState((s) => ({
      ...s,
      habits: s.habits.map((h) => ({ ...h, done: false })),
      tasks: s.tasks.map((t) => ({ ...t, done: false })),
    }));
  }, []);

  const go = (id) => setTab(id);

  /* Two lists out of one order: what the navigation shows, and what answers
     only from «المزيد». Both are his to set, and `navSplit` holds the floor
     so neither can be emptied past the width of the phone bar. */
  const { main: navItems, behind: moreItems } = useMemo(
    () => splitNav(state.navOrder, state.navMore),
    [state.navOrder, state.navMore],
  );
  const setNavOrder = useCallback(
    (ids) => setState((s) => ({ ...s, navOrder: ids })),
    [],
  );
  const setNavMore = useCallback(
    (ids) => setState((s) => ({ ...s, navMore: ids })),
    [],
  );
  const resetNav = useCallback(
    () => setState((s) => ({ ...s, navOrder: NAV_IDS, navMore: MORE_IDS })),
    [],
  );

  const active = NAV.find((n) => n.id === tab) || NAV[0];

  /* From the settings panel: close it, then go. Leaving the modal open over
     the screen it just sent him to is the oldest way to make a working
     button look broken. */
  const goFromSettings = (id) => {
    setSettings(false);
    go(id);
  };

  /* Below every hook, without exception — a return placed among them is
     React error #310 and a blank screen, which this file has already paid
     for once. */
  if (!leading) return <SecondWindow onTakeOver={takeOver} phase={phase} />;

  return (
    /* Every delete button in the tree reaches `arm` through here. A provider
       rather than sixteen props: a new destructive button that forgets to
       take the callback is a new destructive button with no undo, and that
       is not a mistake worth leaving available. */
    <UndoBus.Provider value={arm}>
    <div
      dir="rtl"
      className="min-h-screen w-full text-white antialiased"
      style={{
        /* No background here: an opaque fill would paint straight over the
           fixed -z-10 sky. The document element carries the colour instead,
           which is also what shows through an overscroll bounce. */
        "--los-veil": phase.veil,
        "--los-veil-strong": phase.veilStrong,
        fontFamily:
          "'Tajawal', 'Cairo', ui-sans-serif, system-ui, -apple-system, sans-serif",
      }}
    >
      <SkyBackdrop phase={phase} />
      <AppStyles />

      <div className="flex min-h-screen">
        {/* ---------- sidebar (desktop) ---------- */}
        <aside
          className="sticky top-0 hidden h-screen shrink-0 flex-col border-l p-4 transition-all duration-300 lg:flex"
          style={{
            width: collapsed ? 80 : 268,
            borderColor: T.border,
            background: "var(--los-veil-strong, rgba(255,255,255,0.045))",
            /* 12px, like `GLASS`, and for the same reason one floor down:
               this panel is `h-screen`, so it is the largest blurred region
               on a desktop page by a wide margin and the one whose radius
               costs the most. The sidebar sits beside the scrolling column
               rather than over it, so it is also the blur the eye compares
               a card against — matching the two is cheaper *and* tidier. */
            backdropFilter: "blur(12px) saturate(150%)",
            /* Nothing inside can paint outside it, so a card scrolling past
               in the next column never dirties this layer. */
            contain: "layout paint style",
          }}
        >
          <div className="mb-7 flex items-center gap-3">
            <button
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "توسيع القائمة" : "طيّ القائمة"}
              aria-expanded={!collapsed}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors hover:border-white/30"
              style={{ borderColor: T.border, color: T.accent }}
            >
              <Menu size={18} />
            </button>
            {!collapsed && (
              <>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-extrabold leading-tight">
                    2027 <span style={{ color: T.accent }}>Life OS</span>
                  </p>
                  <p className="truncate text-[10px] text-white/30">
                    وقت حصاد الثمار
                  </p>
                </div>
                <div className="mr-auto shrink-0">
                  <NowStamp />
                </div>
              </>
            )}
          </div>

          {/* Collapsed to icons there is no room to drag or label a row, so
              the toggle only exists while the labels do. */}
          {!collapsed && (
            <div className="mb-2 flex items-center justify-between gap-2 px-1">
              <p className="text-[10px] font-bold" style={{ color: T.faint }}>
                {editNav ? "رتّب بالأسهم · «للمزيد» يُخفي" : "التنقّل"}
              </p>
              <button
                onClick={() => setEditNav((v) => !v)}
                aria-pressed={editNav}
                className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold transition-colors"
                style={{
                  borderColor: editNav ? `${T.primary}59` : T.border,
                  color: editNav ? T.primary : T.faint,
                  background: editNav ? `${T.primary}14` : "transparent",
                }}
              >
                {editNav ? <Check size={11} strokeWidth={3} /> : <GripVertical size={11} />}
                {editNav ? "تم" : "ترتيب"}
              </button>
            </div>
          )}

          {editNav && !collapsed ? (
            <NavOrderEditor
              order={state.navOrder}
              more={state.navMore}
              onChange={setNavOrder}
              onMore={setNavMore}
              onReset={resetNav}
            />
          ) : (
            /* Scrolls on its own, and only here. Three headings and four
               gaps are taller than the flat list was, and on a short laptop
               screen the bill for that used to be the day indicator and the
               settings button pushed off the bottom edge. The groups scroll;
               the wordmark above and the ring below stay put. */
            <div className="los-scroll -mx-1 min-h-0 flex-1 overflow-y-auto px-1 pb-2">
              <NavGroups items={navItems} tab={tab} onGo={go} showLabels={!collapsed} />
              <NavMore
                items={moreItems}
                tab={tab}
                onGo={go}
                showLabels={!collapsed}
              />
            </div>
          )}

          <div className="mt-auto space-y-3">
            {/* --- the day, at the foot of the column ---------------------
                A number in a box was a second, worse copy of the ring the
                routine screen already draws. This is the ring itself, small,
                with the figure inside it and the run beside it — one object
                that belongs to the sidebar rather than a panel parked at the
                bottom of it. Collapsed, the figure alone is still the one
                thing worth 80px of width. */}
            {!collapsed ? (
              <div
                className="flex items-center gap-3 rounded-2xl border p-3"
                style={{
                  borderColor: discipline >= STREAK_TARGET ? `${T.primary}3D` : T.border,
                  backgroundColor: T.card,
                  backgroundImage: `linear-gradient(115deg, ${
                    discipline >= STREAK_TARGET ? `${T.primary}1A` : `${T.accent}12`
                  }, transparent 70%)`,
                }}
              >
                <ProgressRing value={discipline} size={54} stroke={5} label={null} />
                <div className="min-w-0">
                  <p className="text-[9.5px] font-bold" style={{ color: T.faint }}>
                    مؤشر اليوم
                  </p>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-white/55">
                    <Flame
                      size={12}
                      style={{
                        color:
                          discipline >= STREAK_TARGET ? T.ember : "rgba(255,255,255,.25)",
                      }}
                    />
                    <span dir="rtl">
                      {streak} {countedWord(streak)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="rounded-xl border py-2 text-center"
                style={{ borderColor: T.border, backgroundColor: T.card }}
                title={`مؤشر اليوم ${discipline}% · ${streak} ${countedWord(streak)}`}
              >
                <p
                  className="text-[15px] font-extrabold tabular-nums"
                  style={{ color: discipline >= STREAK_TARGET ? T.primary : T.accent }}
                >
                  {discipline}%
                </p>
              </div>
            )}
            <Btn
              variant="ghost"
              size="sm"
              onClick={() => setSettings(true)}
              className="w-full"
              style={{ borderColor: T.border }}
              title="الإعدادات والنسخ الاحتياطي"
            >
              <Settings size={13} />
              {!collapsed && "الإعدادات"}
            </Btn>
            <Btn
              variant="ghost"
              size="sm"
              onClick={resetDay}
              className="w-full"
              style={{ borderColor: T.border }}
              title="تصفير اليوم"
            >
              <RotateCcw size={13} />
              {!collapsed && "تصفير اليوم"}
            </Btn>
          </div>
        </aside>

        {/* ---------- main ---------- */}
        <main className="min-w-0 flex-1">
          {/* mobile header — navigation lives in BottomTabs, so no menu here */}
          <div
            className="sticky z-40 flex items-center justify-between gap-3 border-b px-5 py-3.5 lg:hidden"
            style={{
              top: "env(safe-area-inset-top, 0px)",
              borderColor: "rgba(255,255,255,0.10)",
              backgroundColor: `${T.bg}D9`,
              /* Same bill as the bottom bar: it is pinned over the column
                 the content scrolls through, so its backdrop is new every
                 frame. */
              backdropFilter: "blur(12px) saturate(150%)",
            }}
          >
            <div className="min-w-0">
              <p className="truncate text-[15px] font-extrabold leading-tight">
                2027 <span style={{ color: T.accent }}>Life OS</span>
              </p>
              <p
                className="truncate text-[10.5px] leading-tight"
                style={{ color: T.faint }}
              >
                {active.label}
              </p>
            </div>
            <div className="shrink-0">
              <NowStamp compact />
            </div>
            <span
              className="shrink-0 rounded-xl border px-3 py-1.5 text-[13px] font-extrabold tabular-nums"
              style={{
                borderColor:
                  discipline >= STREAK_TARGET ? `${T.primary}59` : `${T.accent}4D`,
                backgroundColor:
                  discipline >= STREAK_TARGET ? `${T.primary}1A` : `${T.accent}14`,
                color: discipline >= STREAK_TARGET ? T.primary : T.accent,
              }}
            >
              {discipline}%
            </span>
          </div>

          <div className="mx-auto w-full max-w-6xl px-5 pb-36 pt-7 sm:px-7 lg:px-10 lg:pb-20 lg:pt-12">
            {/* Outside the keyed wrapper on purpose: the warning belongs to
                the hour, not to the tab, and re-animating it on every tab
                change would turn it into decoration. */}
            <DangerBanner
              list={state.badHabits || []}
              here={tab === "breaker"}
              onOpen={() => go("breaker")}
            />
            <div key={tab} className="los-in">
              {tab === "today" && (
                <TodayModule
                  state={state}
                  setState={setState}
                  discipline={discipline}
                  streak={streak}
                  onGo={go}
                  onOpenSettings={() => setSettings(true)}
                  onOpenTomorrow={() => setTomorrow(true)}
                  comeback={comeback}
                  onCloseComeback={() => setBack({ day: state.date })}
                />
              )}
              {tab === "routine" && (
                <RoutineModule
                  state={state}
                  setState={setState}
                  discipline={discipline}
                  streak={streak}
                  quote={quote}
                  onShuffleQuote={shuffleQuote}
                  mirror={todayEntry?.mirror || ""}
                  savedAt={savedAt}
                  diskAt={diskAt}
                  diskStuck={diskStuck}
                  onOpenMirror={() => setMirror(true)}
                  onOpenReflect={() => setReflect(true)}
                  onOpenTomorrow={() => setTomorrow(true)}
                  onOpenFix={() => setFixing(true)}
                  onOpenSettings={() => setSettings(true)}
                  onGoGoals={() => go("goals")}
                  reflected={alreadyReflected}
                  prepped={prepped}
                />
              )}
              {tab === "agenda" && (
                <AgendaModule state={state} setState={setState} onGo={go} />
              )}
              {tab === "uni" && (
                <UniModule state={state} setState={setState} onGo={go} />
              )}
              {tab === "matrix" && (
                <MatrixModule state={state} setState={setState} />
              )}
              {tab === "deep" && <DeepWorkModule state={state} setState={setState} />}
              {tab === "goals" && <GoalsModule state={state} setState={setState} />}
              {tab === "finance" && (
                <FinanceModule state={state} setState={setState} />
              )}
              {tab === "vault" && <VaultModule state={state} setState={setState} />}
              {tab === "analytics" && (
                <AnalyticsModule
                  state={state}
                  discipline={discipline}
                  streak={streak}
                />
              )}
              {tab === "breaker" && (
                <BreakerModule state={state} setState={setState} />
              )}
              {tab === "graph" && <GraphModule />}
            </div>

            <footer className="mt-14 text-center text-[11px] text-white/20">
              2027 Life OS · الانضباط حرية مؤجّلة
            </footer>
          </div>
        </main>
      </div>

      <BottomTabs
        items={navItems}
        more={moreItems}
        tab={tab}
        onGo={go}
        onSettings={() => setSettings(true)}
      />

      <UndoToast undo={undo} onUndo={takeBack} onDismiss={dropUndo} />

      {/* Another window has been working, and this one is holding a payload
          from before it started. Nothing is written while this is up: not to
          localStorage, not to disk. Merging two divergent copies of a year
          cannot be done correctly after the fact, so the question goes to the
          one person who knows which copy he meant. */}
      {conflict && (
        <div
          className="los-in fixed inset-x-3 z-[95] flex flex-wrap items-center justify-center gap-3 rounded-2xl border px-4 py-3 text-center shadow-2xl sm:inset-x-0 sm:mx-auto sm:w-[min(620px,92vw)]"
          style={{
            top: "calc(env(safe-area-inset-top, 0px) + 12px)",
            backgroundColor: T.cardSolid,
            backgroundImage: `linear-gradient(135deg, ${T.bgLift}, ${T.bgDeep})`,
            borderColor: `${T.accent}80`,
            boxShadow: `0 0 60px -12px ${T.accent}`,
          }}
          role="alert"
        >
          <AlertTriangle size={18} className="shrink-0" style={{ color: T.accent }} />
          <p className="text-[12.5px] font-bold leading-relaxed" style={{ color: T.fg }}>
            تغيّرت بياناتك من نافذة أخرى — التعديلات هنا متوقفة الآن.
            <span className="block text-[11px] font-normal" style={{ color: T.muted }}>
              {conflict.where === "disk"
                ? "النسخة المحفوظة على الجهاز أحدث من نسخة هذه النافذة. اختر أيّهما تعتمد."
                : "نافذة أخرى حفظت بعد أن فتحت هذه. اختر أيّهما تعتمد."}
            </span>
          </p>
          <div className="flex shrink-0 flex-wrap items-center justify-center gap-2">
            <Btn size="sm" disabled={resolving} onClick={takeDisk}>
              <Download size={13} /> حمّل الأحدث
            </Btn>
            <Btn variant="ghost" size="sm" disabled={resolving} onClick={keepMine}>
              <Upload size={13} /> اعتمد هذه النافذة
            </Btn>
          </div>
        </div>
      )}

      {/* A copy on the wrong origin. It reads, and it can still recover — it
          simply never writes to disk, because its localStorage is its own and
          the window lease cannot see across the two. Saying so beats letting
          an afternoon's work pile up in a copy nothing else can see. */}
      {stray && (
        <div
          className="los-in fixed inset-x-3 z-[85] flex flex-wrap items-center justify-center gap-3 rounded-2xl border px-4 py-2.5 text-center shadow-2xl sm:inset-x-0 sm:mx-auto sm:w-[min(560px,92vw)]"
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 96px)",
            backgroundColor: T.cardSolid,
            backgroundImage: `linear-gradient(135deg, ${T.bgLift}, ${T.bgDeep})`,
            borderColor: `${T.violet}80`,
            boxShadow: `0 0 50px -14px ${T.violet}`,
          }}
          role="status"
        >
          <Lock size={16} className="shrink-0" style={{ color: T.violet }} />
          <p className="text-[12px] font-bold leading-relaxed" style={{ color: T.fg }}>
            هذي ليست النسخة الأساسية — ما تكتبه هنا لا يُحفظ على الجهاز.
            <span className="block text-[11px] font-normal" style={{ color: T.muted }}>
              افتح النسخة الأساسية لتكمل على بياناتك الحقيقية.
            </span>
          </p>
          <Btn
            size="sm"
            className="shrink-0"
            onClick={() => {
              try {
                window.location.href = LOCAL_HOST + "/";
              } catch {
                /* nothing further to try */
              }
            }}
          >
            <ExternalLink size={13} /> افتح الأساسية
          </Btn>
        </div>
      )}

      {/* The disk has been refusing for a minute or more. The browser copy is
          fine and the screen is correct — but the copy that outlives the
          browser is not being written, which is the whole reason the sync
          server exists. */}
      {diskStuck && !conflict && (
        <div
          className="los-in fixed inset-x-3 z-[84] flex flex-wrap items-center justify-center gap-3 rounded-2xl border px-4 py-2.5 text-center shadow-2xl sm:inset-x-0 sm:mx-auto sm:w-[min(560px,92vw)]"
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 168px)",
            backgroundColor: T.cardSolid,
            backgroundImage: `linear-gradient(135deg, ${T.bgLift}, ${T.bgDeep})`,
            borderColor: `${T.ember}80`,
            boxShadow: `0 0 50px -14px ${T.ember}`,
          }}
          role="status"
        >
          <Database size={16} className="shrink-0" style={{ color: T.ember }} />
          <p className="text-[12px] font-bold leading-relaxed" style={{ color: T.fg }}>
            الحفظ على الجهاز متوقف — بياناتك في المتصفح فقط.
            <span className="block text-[11px] font-normal" style={{ color: T.muted }}>
              تأكّد أن خادم المزامنة يعمل، ثم أعد المحاولة.
            </span>
          </p>
          <Btn size="sm" className="shrink-0" onClick={retryDisk}>
            <RotateCcw size={13} /> إعادة المحاولة
          </Btn>
        </div>
      )}

      {/* A write that fails has to be loud. Everything on screen is still
          correct — it just is not on disk, and only the user can decide what
          to do about that. */}
      {saveFailed && (
        <div
          className="los-in fixed inset-x-3 z-[80] flex flex-wrap items-center justify-center gap-3 rounded-2xl border px-4 py-3 text-center shadow-2xl sm:inset-x-0 sm:mx-auto sm:w-[min(560px,92vw)]"
          style={{
            top: "calc(env(safe-area-inset-top, 0px) + 12px)",
            background: `linear-gradient(135deg, ${T.bgLift}, ${T.bgDeep})`,
            borderColor: `${T.danger}80`,
            boxShadow: `0 0 60px -12px ${T.danger}`,
          }}
          role="alert"
        >
          <AlertTriangle size={18} className="shrink-0" style={{ color: T.danger }} />
          <p className="text-[12.5px] font-bold leading-relaxed" style={{ color: T.fg }}>
            تعذّر الحفظ في هذا المتصفّح — ما تراه الآن غير محفوظ.
            <span className="block text-[11px] font-normal" style={{ color: T.muted }}>
              صدّر نسخة احتياطية قبل إغلاق الصفحة.
            </span>
          </p>
          <Btn variant="danger" size="sm" onClick={() => setSettings(true)} className="shrink-0">
            <Download size={13} /> صدّر الآن
          </Btn>
        </div>
      )}

      <SettingsModal
        open={settings}
        onClose={() => setSettings(false)}
        state={state}
        setState={setState}
        savedAt={savedAt}
        diskAt={diskAt}
        onGo={goFromSettings}
        onEditYesterday={() => {
          setSettings(false);
          setFixing(true);
        }}
      />

      <EditYesterdayModal
        open={fixing}
        onClose={() => setFixing(false)}
        state={state}
        setState={setState}
      />

      <TomorrowModal
        open={tomorrow}
        onClose={() => setTomorrow(false)}
        state={state}
        setState={setState}
      />

      <ReflectionModal
        open={reflect}
        onClose={() => setReflect(false)}
        onSave={saveReflection}
        pct={discipline}
        value={todayEntry?.distraction || ""}
        fixValue={todayEntry?.fix || ""}
      />

      <MirrorModal
        open={mirror}
        onClose={() => setMirror(false)}
        value={todayEntry?.mirror || ""}
        onSave={saveMirror}
      />

      {/* streak-banked toast. Centred with inset-x/mx-auto and never with
          -translate-x-1/2: `.los-in` animates `transform` on this very
          element, so a Tailwind translate utility is simply discarded and
          the toast hangs off the edge of the screen. */}
      {streakToast !== null && (
        <div
          className="los-in pointer-events-none fixed inset-x-3 bottom-28 z-[70] flex items-center justify-center gap-3 rounded-2xl border px-6 py-4 shadow-2xl sm:inset-x-0 sm:mx-auto sm:w-[min(380px,92vw)] lg:bottom-8"
          style={{
            background: `linear-gradient(135deg, ${T.bgLift}, ${T.bgDeep})`,
            borderColor: `${T.primary}70`,
            boxShadow: `0 0 70px -10px ${T.primary}99`,
          }}
        >
          <Flame size={28} className="los-flame" style={{ color: T.ember, filter: `drop-shadow(0 0 10px ${T.ember})` }} />
          <div className="text-right">
            <p className="text-[13px] font-extrabold" style={{ color: T.accent }}>
              اليوم محتسب في سلسلتك! 🔥
            </p>
            <p className="text-[11px] text-white/50">
              <span dir="ltr" className="font-bold tabular-nums" style={{ color: T.ember }}>{streakToast}</span> {countedWord(streakToast)}
            </p>
            {/* Said out loud, for the same reason a gap is counted and never
                averaged: a tolerance nobody can see is a number quietly
                meaning less than it used to. */}
            <p className="mt-0.5 text-[10.5px]" style={{ color: T.sky }}>
              {streakRun.forgiven > 0
                ? forgivenPhrase(streakRun.forgiven)
                : "يوم واحد تحت الهدف لا يكسرها. يومان متتاليان يكسرانها."}
            </p>
          </div>
        </div>
      )}
    </div>
    </UndoBus.Provider>
  );
}

/* --- starting up ------------------------------------------------------ *
 *  Three things have to happen before the first render, and all three are
 *  about the data outliving the browser.
 *
 *  localStorage is not a safe place to keep a year. Chrome evicts it under
 *  storage pressure, "clear browsing data" wipes it without asking what was
 *  in it, and on a file:// page every local document on the machine shares
 *  one bucket — so an unrelated page can push this one out. Served from
 *  127.0.0.1 the app has an origin of its own, and that is what makes the
 *  other two possible.
 * --------------------------------------------------------------------- */

/* Ask Chrome to stop treating this like a cache. Granted outright for an
   installed app; for a plain tab it depends on how the site is used. Either
   way asking costs nothing and the answer only ever improves things. */
function keepStorage() {
  try {
    navigator.storage?.persist?.().catch(() => {});
  } catch {}
}

/* The app shell, kept offline. The server starts with Windows, but "the
   server was not up yet" must not be the same thing as "your day is gone" —
   so the one html file is cached and served from there when the network
   fails. Never the data: the data is localStorage, and it is already local. */
function cacheShell() {
  if (!served()) return; // a service worker needs a real origin
  try {
    navigator.serviceWorker?.register("sw.js").catch(() => {});
  } catch {}
}

/* The disk copy, read back. This runs only when localStorage has nothing —
   a new browser profile, a profile that was cleared, a move from file:// to
   this origin. It writes what the server has straight into localStorage and
   then lets `loadState` do its ordinary job on it, migration and day-roll
   and all, so there is one path into the app and not two.

   Awaited before the first render on purpose. Mounting first and adopting
   after would put a seeded, empty day on screen, and the save effect fires
   on that seed — writing emptiness over the recovery that was still in
   flight. The whole point is that this cannot happen. */
async function pullDisk() {
  try {
    if (window.localStorage.getItem(STORAGE_KEY)) return; // the browser has it
  } catch {
    return; // storage blocked: nothing to recover into
  }
  if (!syncLocal()) return;
  try {
    const stop = new AbortController();
    const t = setTimeout(() => stop.abort(), 3000); // a dead server must not hang the app
    const res = await fetch(api("/state?project=lifeos"), { signal: stop.signal });
    clearTimeout(t);
    if (!res.ok) return;
    const saved = await res.json();
    /* Shaped like this app's state, or it does not get written. Same bar the
       import in settings holds a file to. */
    if (!saved || typeof saved !== "object" || !Array.isArray(saved.habits)) return;
    /* The revision comes back with it and is lifted out rather than stored as
       part of the state: it belongs to the write, not to the day. Seeding the
       counter from the disk matters more than it looks — start the recovered
       profile at zero and its first save arrives behind every revision the
       file already carries, which the server is now right to refuse. */
    const { rev, ...rest } = saved;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
    writeRev(Number.isFinite(rev) ? rev : 0);
  } catch {
    /* Server down, blocked, or serving something unreadable. The app opens
       on seed data, which is the same as it did before any of this existed. */
  }
}

async function boot() {
  keepStorage();
  await pullDisk();
  createRoot(document.getElementById("root")).render(<LifeOS />);
  cacheShell(); // after paint: it is a safety net, not a dependency
}

boot();
