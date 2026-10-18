import { BotModule } from "./features/life-bot.jsx";
import { BreakerModule } from "./features/life-breaker.jsx";
import { GoalsModule } from "./features/life-goals.jsx";
import { VaultModule } from "./features/life-vault.jsx";
import { AgendaModule } from "./features/life-agenda.jsx";
import { AnalyticsModule, DayRollCall } from "./features/life-analytics.jsx";
import { RoutineModule, SaveStamp, MirrorModal, EditYesterdayModal } from "./features/life-routine.jsx";
import { TodayModule } from "./features/life-today.jsx";
import { MatrixModule, TomorrowModal } from "./features/life-matrix.jsx";
import { NavGroups, BottomTabs, NowStamp, NAV } from "./layouts/life-nav.jsx";
import { SettingsModal } from "./features/life-settings.jsx";
import { T, GLASS, useBurst, Card, Btn, Field, Badge, Modal, StarRating, Checkbox, ProgressRing, whenWord, NumStep, DateField, TimeField, DOW_AR, arCount, dayWord, daysPhrase, minWord, stepWord, meetWord, timesWord, fallWord, taskWord, tasksPhrase, forgivenPhrase, countedWord, prettyTime, AR_MONTHS, WEEK_LABELS, arDate, coursesIn, courseIn, courseName, daySections, nextSection, useMinuteClock, GROUPS, groupOf, PRAYERS, nextPrayer, cupWord, shrinkImage, Since, READ_KEY, useDailyQuote, UndoBus, useUndo, UndoToast } from "./components/life-shared.jsx";
import { uniKindOf, uniDue, UniModule } from "./features/life-uni.jsx";
import { TopThree, useHabitTick, ReadLogModal, TaskChip, ReflectionModal } from "./components/life-day.jsx";
import { FinanceModule } from "./features/life-finance.jsx";
import { DeepWorkModule } from "./features/life-desks.jsx";
import { DataHealth, RecoveryModal } from "./features/life-tools.jsx";
import { SkyBackdrop, useSkyPhase, AppStyles, SecondWindow } from "./layouts/life-styles.jsx";
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

import { blockAt, clockAt, fixHour, prayerTimes } from "./utils/prayer-times.mjs";

/* --- persistence ------------------------------------------------------ */
/* Every name this file reads off the storage module, and the list is checked
   by a test rather than by eye. `api`, `UI_KEY`, `OPENED_KEY` and
   `HANDOVER_KEY` were all left out of it once, and because each of their four
   call sites sits inside the try/catch that storage code is required to have,
   not one of them said a word: `pullDisk` threw on `api` before it could read
   the disk, so a fresh profile booted on seed data at revision 0 and every
   save after it was refused as a conflict. A missing import here is not a
   crash, it is a feature that quietly stops existing. */
import { LOCAL_HOST, dropDeadBackups, api, REV_KEY, UI_KEY, OPENED_KEY, HANDOVER_KEY, STORAGE_KEY, served, strayCopy, syncLocal, readRev, writeRev, DISK_STUCK_MS, onSyncResult, postSync, syncOut, flushSync, adoptDisk, tabId, readLock, writeLock, dropLock, claimHandover, LEASE_BEAT, LEASE_STALE } from "./utils/life-storage.mjs";

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
  NAV_IDS,
  obj,
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
  stampToday,
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
} from "./state/life-state.mjs";


/* ==================================================================== *
 *  خريطة الشاشات — SCREENS
 *  ★ هذا هو الملف الذي تعدّله لتركيب الصفحات. ★
 *
 *  كل سطر هنا يجيب على سؤال واحد: «التبويب الفلاني، أيّ مكوّن يفتح؟»
 *  لا شيء آخر في التطبيق يعرف الجواب، فتغييرٌ هنا يكفي وحده.
 *
 *  ── الأسماء والترتيب والإخفاء ليست هنا ──
 *  لأنها سؤال واحد الآن، وجوابه في مكان واحد:
 *    • أيّ تبويب موجود، واسمه، وأيقونته، وترتيبه، وهل هو مخفي →
 *      sidebarNav في src/life-config.js — ترتيب الأسطر هناك هو ترتيب
 *      القائمة الجانبية وشريط الجوال، فورًا وبلا تعارض مع أي تخزين قديم.
 *    • التبويبات الموجودة أصلًا (البنية التي لا تُحذف) → NAV_IDS في
 *      state/life-state.mjs، وهي ما يربط كل شاشة بـ SCREENS تحت.
 *
 *  ── كيف تنقل ميزة من صفحة إلى صفحة ──
 *  كل قيمة هنا دالّة تُعيد JSX، فالصفحة تجميعٌ لمكوّنات لا كتلة واحدة.
 *  مثال: لتظهر مصفوفة المهام أسفل شاشة الروتين، اجعل السطر:
 *
 *      routine: (c) => (
 *        <>
 *          <RoutineModule {...} />
 *          <MatrixModule state={c.state} setState={c.setState} />
 *        </>
 *      ),
 *
 *  ── كيف تضيف تبويبًا جديدًا ──
 *  ثلاثة أسطر، وكلّها يحميها اختبار:
 *    ١. الـ id في NAV_IDS                 (state/life-state.mjs)
 *    ٢. الاسم والأيقونة في sidebarNav     (src/life-config.js)
 *    ٣. سطر هنا يربط الـ id بمكوّنه
 *  وتبويب بلا مجموعة في SIDEBAR_GROUPS يختفي من القائمة الجانبية —
 *  اختبار يمسك ذلك قبل أن تراه.
 *
 *  ── الوسيط `c` ──
 *  كائن واحد يحمل كل ما تحتاجه أي شاشة: الحالة، ومُعدّلها، والدرجة،
 *  والسلسلة، ودوالّ فتح النوافذ. يُبنى في مكان واحد (screenCtx أسفل
 *  هذا الملف) حتى لا تُمرَّر عشرون prop عبر أربع طبقات. شاشة لا
 *  تحتاج شيئًا تتجاهله ببساطة: `graph: () => <GraphModule />`.
 * ==================================================================== */
const SCREENS = {
  /* اليوم — الشاشة التي يُفتح عليها التطبيق. لا تملك شيئًا: كل رقم فيها
     مشتقّ، وعبارة الكتب ووالمهام الثلاث مكوّنات مشتركة تُعرض هنا وهناك. */
  today: (c) => (
    <TodayModule
      state={c.state}
      setState={c.setState}
      discipline={c.discipline}
      streak={c.streak}
      onGo={c.go}
      onOpenSettings={c.openSettings}
      onOpenTomorrow={c.openTomorrow}
      comeback={c.comeback}
      onCloseComeback={c.closeComeback}
    />
  ),

  /* الروتين اليومي — ستّ بلوكات مربوطة بأوقات الصلاة. أكبر شاشة في
     التطبيق؛ إن أردت تقسيمها فابدأ بنقل كتلة منها إلى ملف مستقلّ ثم
     ركّبها هنا بسطر، لا بتمرير props جديدة من الصدفة. */
  routine: (c) => (
    <RoutineModule
      state={c.state}
      setState={c.setState}
      discipline={c.discipline}
      streak={c.streak}
      quote={c.quote}
      onShuffleQuote={c.shuffleQuote}
      mirror={c.mirror}
      savedAt={c.savedAt}
      diskAt={c.diskAt}
      diskStuck={c.diskStuck}
      onOpenMirror={c.openMirror}
      onOpenReflect={c.openReflect}
      onOpenTomorrow={c.openTomorrow}
      onOpenFix={c.openFix}
      onGoGoals={c.goGoals}
      reflected={c.reflected}
      prepped={c.prepped}
    />
  ),

  /* التقويم — يقرأ تسليمات الجامعة مع صفوفه هو. */
  agenda: (c) => <AgendaModule state={c.state} setState={c.setState} onGo={c.go} />,

  /* الجامعة — المقرّرات والفصول والدرجات وشبكة الأسبوع. */
  uni: (c) => <UniModule state={c.state} setState={c.setState} onGo={c.go} />,

  /* مصفوفة المهام — أربع مناطق، والسقف ثلاث مهام في اليوم. */
  matrix: (c) => <MatrixModule state={c.state} setState={c.setState} />,

  /* العمل العميق — المؤقّت وجلساته. */
  deep: (c) => (
    <DeepWorkModule
      state={c.state}
      setState={c.setState}
      hyperFocus={c.hyperFocus}
      onEnterHyperFocus={c.enterHyperFocus}
      onExitHyperFocus={c.exitHyperFocus}
    />
  ),

  /* الأهداف — ستّ ركائز، وأرباع سنة، وساعات الأفق. */
  goals: (c) => <GoalsModule state={c.state} setState={c.setState} />,

  /* الدخل والمشاريع. */
  finance: (c) => <FinanceModule state={c.state} setState={c.setState} />,

  /* المكتبة — الرفّ ومكتب الكتاب. */
  vault: (c) => <VaultModule state={c.state} setState={c.setState} />,

  /* التتبع الشهري — يقرأ الأرشيف ولا يكتب فيه. */
  analytics: (c) => (
    <AnalyticsModule state={c.state} setState={c.setState} discipline={c.discipline} streak={c.streak} />
  ),

  /* كاسر العادات. */
  breaker: (c) => <BreakerModule state={c.state} setState={c.setState} />,

  /* بوت تيليجرام — جدولة ما يرسله البوت دون طلب. لا تتحكّم بالعملية:
     تكتب `state.bot` كأي شاشة، والبوت يقرؤها عن القرص ويعيد تسليح
     نفسه. الشيء الحيّ الوحيد فيها شريط الحالة، لأن «هل العملية شغّالة
     الآن؟» سؤال لا يجيب عنه ملف. */
  bot: (c) => <BotModule state={c.state} setState={c.setState} />,

  /* خريطة المعرفة — روابط لا embeds، ولهذا لا تحتاج حالة. */
  graph: () => <GraphModule />,
};
/* ==================================================================== *
 *  2027 LIFE OS — the shell
 *
 *  React + Tailwind + lucide-react, and nothing else installed: esbuild
 *  resolves the one dependency out of iron-log/node_modules and React
 *  itself loads as UMD from a CDN, so the built page is a single
 *  self-contained file. `node build-life-os.mjs` is the only way it is
 *  produced; editing life-os/index.html is editing a build artefact.
 *
 *  What is left in this file is the shell and only the shell: the state,
 *  the day rollover, the save path and its two bars, the write lease, the
 *  archive row, and the switch that decides which screen is on. Every
 *  screen itself lives in a life-*.jsx of its own — this was 12,892 lines
 *  and is now under two thousand, which is the difference between a file
 *  you navigate and a file you search.
 *
 *  Note on Shadcn UI: shadcn is a set of components you copy into a project
 *  with its CLI, compiling to Radix + Tailwind — not a package you can
 *  import. The primitives in life-shared.jsx follow shadcn's token model and
 *  API shape so this stays dependency-free. If the project ever moves to a
 *  real build with its own components/ui directory, swap them for genuine
 *  shadcn components; the call sites should not need to change.
 * ==================================================================== */


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
  /* وضع الغوص العميق — hides the sidebar, the phone bar and the header while
     a focus round is actually running, so the only thing on screen is the
     dial itself. A per-viewer preference like `collapsed`, not a focus-desk
     switch: it says nothing about what the timer does, only about what the
     chrome around it shows, so it has no business in `state.focus` beside
     `autoBreak` and the rest. Turned off the moment there is no focus round
     to be undistracted *for* — see the effect below — because a lockdown
     that survives the round it was entered for is a UI nobody can get back
     to without knowing to look for the exit pill. */
  const [hyperFocus, setHyperFocus] = useState(() => !!readUI().hyperFocus);
  useEffect(() => {
    if (!hyperFocus) return;
    if (state.focus?.run?.phase !== "focus") setHyperFocus(false);
  }, [hyperFocus, state.focus?.run?.phase]);
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
    /* Spread over whatever the state is by then, never over the state the
       delete was made on, so an unrelated change in those eight seconds is
       not undone with it.
     *
     *  `before` may also be a function of that state, and the control hub is
     *  why: every other delete in this app restores a top-level array, where
     *  a plain slice already has the property above — an unrelated change
     *  lives under a different key. A reminder lives *inside* `state.bot`
     *  beside the water window and the two brief times, so a snapshot of the
     *  whole object would quietly revert a toggle flipped a second later. A
     *  function can rebuild one field of it against the current value. */
    setState((s) => ({
      ...s,
      ...(typeof undo.before === "function" ? undo.before(s) : undo.before),
    }));
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
        JSON.stringify({ tab, collapsed, reflect: nag, back, hyperFocus }),
      );
    } catch {
      /* per-viewer convenience only */
    }
  }, [tab, collapsed, nag, back, hyperFocus, leading]);

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
     The row itself is built by `stampToday` in the state layer, not here: the
     Telegram bot ticks a habit from a phone and has to write the same row,
     and two writers each with their own copy of this merge is a bug waiting
     for the day they disagree. Everything on the row is derived from the
     state it is handed, which is why this effect passes nothing — the values
     below are the dependency keys that say *when* to re-stamp, never what
     to write. */
  useEffect(() => {
    setState(stampToday);
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

  /* Two lists cut out of one fixed array: `NAV` is already `sidebarNav`'s
     own order, filtered to what is visible. `BottomTabs` takes the floor
     (`TAB_BAR`) itself off the front of it, so the phone bar and the
     sidebar both read the same literal order with nothing left to resolve
     at runtime — no saved order, no user-pushed «المزيد» list. */
  const navItems = NAV;
  const moreItems = [];

  const active = NAV.find((n) => n.id === tab) || NAV[0];

  /* From the settings panel: close it, then go. Leaving the modal open over
     the screen it just sent him to is the oldest way to make a working
     button look broken. */
  const goFromSettings = (id) => {
    setSettings(false);
    go(id);
  };

  /* ── الوسيط الذي تستقبله كل شاشة ──
     يُبنى هنا مرّة واحدة، وتقرأ منه خريطة SCREENS أعلى الملف ما يلزمها.
     المكسب أنّ إضافة شاشة لا تعني تمرير props جديدة عبر الصدفة: تأخذ
     من هذا الكائن ما تحتاجه وتتجاهل الباقي. */
  const screenCtx = {
    state,
    setState,
    discipline,
    streak,
    quote,
    shuffleQuote,
    mirror: todayEntry?.mirror || "",
    savedAt,
    diskAt,
    diskStuck,
    reflected: alreadyReflected,
    prepped,
    comeback,
    go,
    goGoals: () => go("goals"),
    openSettings: () => setSettings(true),
    openTomorrow: () => setTomorrow(true),
    openMirror: () => setMirror(true),
    openReflect: () => setReflect(true),
    openFix: () => setFixing(true),
    closeComeback: () => setBack({ day: state.date }),
    hyperFocus,
    enterHyperFocus: () => setHyperFocus(true),
    exitHyperFocus: () => setHyperFocus(false),
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
        {/* ---------- sidebar (desktop) ---------- *
         *  Gone outright in hyper-focus, not just dimmed: the whole feature
         *  is that nothing competes with the dial for a glance, and a greyed
         *  sidebar is still something the eye has to rule out. */}
        {!hyperFocus && <aside
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

          {/* Collapsed to icons there is no room for a label. */}
          {!collapsed && (
            <p className="mb-2 px-1 text-[10px] font-bold" style={{ color: T.faint }}>
              التنقّل
            </p>
          )}

          {/* Order, labels, icons and visibility all come from sidebarNav
              in src/life-config.js now — there is nothing left here for the
              user to rearrange, so the editor and its toggle are gone. */}
          <div className="los-scroll -mx-1 min-h-0 flex-1 overflow-y-auto px-1 pb-2">
            <NavGroups items={navItems} tab={tab} onGo={go} showLabels={!collapsed} />
          </div>

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
        </aside>}

        {/* ---------- main ---------- */}
        <main className="min-w-0 flex-1">
          {/* mobile header — navigation lives in BottomTabs, so no menu here.
              Gone in hyper-focus for the same reason the sidebar is. */}
          {!hyperFocus && <div
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
          </div>}

          <div
            className={`mx-auto w-full max-w-6xl px-5 pt-8 sm:px-7 lg:px-12 lg:pt-12${
              hyperFocus ? " pb-10" : " pb-36 lg:pb-24"
            }`}
          >
            {/* Outside the keyed wrapper on purpose: the warning belongs to
                the hour, not to the tab, and re-animating it on every tab
                change would turn it into decoration. */}
            <DangerBanner
              list={state.badHabits || []}
              here={tab === "breaker"}
              onOpen={() => go("breaker")}
            />
            <div key={tab} className="los-in">
              {SCREENS[tab]?.(screenCtx)}
            </div>

            <footer className="mt-14 text-center text-[11px] text-white/20">
              2027 Life OS · الانضباط حرية مؤجّلة
            </footer>
          </div>
        </main>
      </div>

      {!hyperFocus && (
        <BottomTabs
          items={navItems}
          more={moreItems}
          tab={tab}
          onGo={go}
          onSettings={() => setSettings(true)}
        />
      )}

      {/* The one way back. Centred without a transform — `.los-in` on the
          screen below already owns `transform`, and `-translate-x-1/2` on a
          fixed element under it is the same collision the four other fixed
          bars in this file already avoid. */}
      {hyperFocus && (
        <button
          onClick={() => setHyperFocus(false)}
          className="fixed inset-x-3 z-50 flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-[12px] font-bold transition-colors hover:border-white/30 sm:inset-x-0 sm:mx-auto sm:w-fit"
          style={{
            top: "calc(env(safe-area-inset-top, 0px) + 12px)",
            borderColor: T.border,
            backgroundColor: `${T.bg}D9`,
            backdropFilter: "blur(12px) saturate(150%)",
            color: T.faint,
          }}
          title="غوص عميق نشط — اضغط للعودة"
        >
          <Target size={13} style={{ color: T.primary }} />
          وضع الغوص العميق — اضغط للخروج
        </button>
      )}

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
