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
import { AssistantFab } from "./features/life-bot.jsx";
import { SettingsModal } from "./features/life-settings.jsx";
import { T, GLASS, useBurst, Card, Btn, Field, Badge, Modal, StarRating, Checkbox, ProgressRing, whenWord, NumStep, DateField, TimeField, DOW_AR, arCount, dayWord, daysPhrase, minWord, stepWord, meetWord, timesWord, fallWord, taskWord, tasksPhrase, forgivenPhrase, countedWord, prettyTime, AR_MONTHS, WEEK_LABELS, arDate, coursesIn, courseIn, courseName, daySections, nextSection, useMinuteClock, GROUPS, groupOf, PRAYERS, nextPrayer, cupWord, shrinkImage, Since, READ_KEY, useDailyQuote, UndoBus, useUndo, UndoToast, HoverDeleteProvider } from "./components/life-shared.jsx";
import { uniKindOf, uniDue, UniModule } from "./features/life-uni.jsx";
import { TopThree, useHabitTick, ReadLogModal, TaskChip, ReflectionModal } from "./components/life-day.jsx";
import { FinanceModule } from "./features/life-finance.jsx";
import { DeepWorkModule } from "./features/life-desks.jsx";
import { DataHealth, RecoveryModal } from "./features/life-tools.jsx";
import { SkyBackdrop, useSkyPhase, AppStyles, SecondWindow } from "./layouts/life-styles.jsx";

// 👇 استيراد صفحة صندوق الوارد الكاملة 👇
import { InboxModule } from "./components/life-inbox.jsx";

// 👇 استيراد مختبر النوم الذكي 👇
import { SleepLabModule } from "./features/life-sleep.jsx";

// 👇 1. استيراد صفحة الوكيل الذكي 👇
import { AgentModule } from "./features/life-agent.jsx";

// 👇 استيراد ملف حصاد السنة 👇
import LifeWrapped from "./features/life-wrapped.jsx";

// 👇 استيراد لوحة الأوامر الخاطفة وشريط التركيز والصلاة العائم 👇
import { CommandPalette, DynamicIslandBar } from "./components/life-command.jsx";

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

import { LOCAL_HOST, dropDeadBackups, api, REV_KEY, UI_KEY, OPENED_KEY, HANDOVER_KEY, STORAGE_KEY, served, strayCopy, syncLocal, readRev, writeRev, DISK_STUCK_MS, onSyncResult, postSync, syncOut, flushSync, adoptDisk, tabId, readLock, writeLock, dropLock, claimHandover, LEASE_BEAT, LEASE_STALE } from "./utils/life-storage.mjs";

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

const SCREENS = {
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
  agenda: (c) => <AgendaModule state={c.state} setState={c.setState} onGo={c.go} />,
  uni: (c) => <UniModule state={c.state} setState={c.setState} onGo={c.go} />,
  matrix: (c) => <MatrixModule state={c.state} setState={c.setState} />,
  deep: (c) => (
    <DeepWorkModule
      state={c.state}
      setState={c.setState}
      hyperFocus={c.hyperFocus}
      onEnterHyperFocus={c.enterHyperFocus}
      onExitHyperFocus={c.exitHyperFocus}
    />
  ),
  goals: (c) => <GoalsModule state={c.state} setState={c.setState} />,
  finance: (c) => <FinanceModule state={c.state} setState={c.setState} />,
  vault: (c) => <VaultModule state={c.state} setState={c.setState} />,
  analytics: (c) => (
    <AnalyticsModule state={c.state} setState={c.setState} discipline={c.discipline} streak={c.streak} />
  ),
  breaker: (c) => <BreakerModule state={c.state} setState={c.setState} />,
  bot: (c) => <BotModule state={c.state} setState={c.setState} />,
  graph: () => <GraphModule />,
  
  // 👇 إضافة شاشة صندوق الوارد 👇
  inbox: (c) => <InboxModule state={c.state} setState={c.setState} />,

  // 👇 إضافة شاشة مختبر النوم الذكي 👇
  sleep: (c) => <SleepLabModule state={c.state} setState={c.setState} />,

  // 👇 2. إضافة شاشة الوكيل الذكي 👇
  agent: (c) => <AgentModule state={c.state} setState={c.setState} />,
  
  // 👇 إضافة شاشة حصاد السنة 👇
  wrapped: (c) => <LifeWrapped state={c.state} setState={c.setState} />,
};

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

function loadState() {
  if (typeof window === "undefined") return freshState();
  let raw = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return freshState();
  }
  if (!raw) return freshState();
  try {
    const saved = migrate(JSON.parse(raw));
    if (saved.date === dayKey()) return { ...freshState(carryOf(saved)), ...saved };
    return rollDay(saved);
  } catch {
    try {
      window.localStorage.setItem(`${STORAGE_KEY}:broken-${Date.now()}`, raw);
    } catch {}
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

function useWriteLease() {
  const meRef = useRef(null);
  if (meRef.current === null) meRef.current = tabId();
  const me = meRef.current;

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
        if (e?.data?.claim && e.data.claim !== me) set("follower");
      };
      chanRef.current = chan;
    } catch {}

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
      if (wasFollowerRef.current && !forced) {
        reloadingRef.current = true;
        window.location.reload();
        return;
      }
      forced = false;
      writeLock(me);
      const back = readLock();
      set(back && back.id !== me ? "follower" : "leader");
    };

    tick();
    const timer = setInterval(tick, LEASE_BEAT);
    const wake = () => {
      if (document.visibilityState === "visible") tick();
    };
    window.addEventListener("focus", wake);
    document.addEventListener("visibilitychange", wake);
    const release = () => dropLock(me);
    window.addEventListener("pagehide", release);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", wake);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("pagehide", release);
      try {
        chan?.close();
      } catch {}
      release();
    };
  }, [me, set]);

  const takeOver = useCallback(() => {
    try {
      window.localStorage.setItem(HANDOVER_KEY, String(Date.now()));
    } catch {}
    writeLock(me);
    try {
      chanRef.current?.postMessage({ claim: me });
    } catch {}
    window.location.reload();
  }, [me]);

  return [role, takeOver];
}

function DangerBanner({ list, here, onOpen }) {
  const bandId = useHourBand();
  const watch = useMemo(() => dangerWatch(list), [list]);
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
            {" من مواجهاتك تقع في هذه الفترة. قرّر الآن، لا بعد ربع ساعة."}
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

function GraphModule() {
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

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
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
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
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

export default function LifeOS() {
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [role, takeOver] = useWriteLease();
  const leading = role === "leader";
  const [state, setState] = useState(loadState);

  const [tab, setTab] = useState(() => {
    const saved = readUI().tab;
    const back = NAV_IDS.includes(saved) ? saved : "today";
    try {
      if (window.sessionStorage.getItem(OPENED_KEY)) return back;
      window.sessionStorage.setItem(OPENED_KEY, "1");
    } catch {}
    return "today";
  });
  const [collapsed, setCollapsed] = useState(() => !!readUI().collapsed);
  const [streakToast, setStreakToast] = useState(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [diskAt, setDiskAt] = useState(null);
  const [diskStuck, setDiskStuck] = useState(false);
  const [conflict, setConflict] = useState(null);
  const [resolving, setResolving] = useState(false);
  const myRevRef = useRef(0);
  if (myRevRef.current === 0) myRevRef.current = readRev();
  const [settings, setSettings] = useState(false);
  const [reflect, setReflect] = useState(false);
  const [tomorrow, setTomorrow] = useState(false);
  const [nag, setNagState] = useState(() => obj(readUI().reflect));
  const [back, setBack] = useState(() => obj(readUI().back));
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
  const [fixing, setFixing] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  // اختصار عالمي Ctrl + K أو Cmd + K لفتح لوحة الأوامر الخاطفة
  useEffect(() => {
    const onGlobalKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onGlobalKey);
    return () => window.removeEventListener("keydown", onGlobalKey);
  }, []);

  const [undo, setUndo] = useState(null);
  const arm = useCallback((label, before) => {
    setUndo({ label, before, at: Date.now() });
  }, []);
  const takeBack = useCallback(() => {
    if (!undo) return;
    setState((s) => ({
      ...s,
      ...(typeof undo.before === "function" ? undo.before(s) : undo.before),
    }));
    setUndo(null);
  }, [undo]);
  const dropUndo = useCallback(() => setUndo(null), []);

  useEffect(() => {
    dropDeadBackups();
  }, []);

  useEffect(() => {
    if (!leading) return;
    const stored = readRev();
    if (stored > myRevRef.current) {
      setConflict({ mine: myRevRef.current, theirs: stored, where: "window" });
      return;
    }
    if (conflict) return;
    const next = stored + 1;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      writeRev(next);
      myRevRef.current = next;
      setSaveFailed(false);
      setSavedAt(Date.now());
    } catch {
      setSaveFailed(true);
      return;
    }
    syncOut(state, next);
  }, [state, leading, conflict]);

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
      if (stuckSince.at === null) stuckSince.at = Date.now();
      if (Date.now() - stuckSince.at >= DISK_STUCK_MS) setDiskStuck(true);
    });
    return () => onSyncResult(null);
  }, []);

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

  /* التزامن التلقائي الحي مع تغييرات البوت وخادم المزامنة المحلي */
  useEffect(() => {
    if (!leading) return;
    let cancelled = false;

    const checkDisk = async () => {
      if (conflict || resolving) return;
      try {
        const res = await fetch(api("/state?project=lifeos"), { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const disk = await res.json();
        if (!disk || typeof disk !== "object" || !Array.isArray(disk.habits)) return;
        const diskRev = Number.isFinite(disk.rev) ? disk.rev : 0;
        if (diskRev > myRevRef.current) {
          const { rev, ...rest } = disk;
          const fresh = migrate(rest);
          const nextState =
            fresh.date === dayKey() ? { ...freshState(carryOf(fresh)), ...fresh } : rollDay(fresh);
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
          writeRev(diskRev);
          myRevRef.current = diskRev;
          setState(nextState);
          setSavedAt(Date.now());
          setDiskAt(Date.now());
        }
      } catch {}
    };

    const onFocusOrVisible = () => {
      if (document.visibilityState === "visible") checkDisk();
    };

    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);
    const timer = setInterval(checkDisk, 4000);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
      clearInterval(timer);
    };
  }, [leading, conflict, resolving]);

  const [stray] = useState(() => strayCopy());

  const takeDisk = useCallback(async () => {
    setResolving(true);
    try {
      await adoptDisk();
      window.location.reload();
    } catch {
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
    } catch {}
    setConflict(null);
    setResolving(false);
  }, [state]);

  const retryDisk = useCallback(() => {
    setDiskStuck(false);
    try {
      postSync(state, myRevRef.current);
    } catch {}
  }, [state]);

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
    if (!leading) return;
    try {
      window.localStorage.setItem(
        UI_KEY,
        JSON.stringify({ tab, collapsed, reflect: nag, back, hyperFocus }),
      );
    } catch {}
  }, [tab, collapsed, nag, back, hyperFocus, leading]);

  const discipline = disciplineOf(state.habits);

  const doneIds = useMemo(
    () => state.habits.filter((h) => h.done).map((h) => h.id),
    [state.habits],
  );
  const tinyIds = useMemo(
    () => state.habits.filter((h) => h.done && h.tiny).map((h) => h.id),
    [state.habits],
  );
  const tinyCall = tinyIds.join(",");
  const rollCall = doneIds.join(",");
  const roster = useMemo(() => state.habits.map((h) => h.id), [state.habits]);

  const breakerDay = useMemo(
    () => breakerToday(state.badHabits || []),
    [state.badHabits, state.date],
  );

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
  const streakRun = useMemo(() => streakRunFrom(state.history), [state.history]);
  const away = useMemo(
    () => comebackFrom(state.history, state.date),
    [state.history, state.date],
  );
  const comeback = away >= COMEBACK_MIN && back.day !== state.date ? away : 0;

  const [quote, shuffleQuote] = useDailyQuote(state.quotes || []);
  const phase = useSkyPhase();

  useEffect(() => {
    const el = document.documentElement;
    const prev = el.style.backgroundColor;
    el.style.backgroundColor = phase.body;
    el.style.transition = "background-color 1600ms ease";
    return () => {
      el.style.backgroundColor = prev;
    };
  }, [phase.body]);

  const todayEntry = (state.history || []).find((h) => h.date === dayKey());
  const alreadyReflected = !!(todayEntry?.distraction || todayEntry?.fix);
  const prepped = prepReady(state.tomorrow, state.tasks, tomorrowKey()).length > 0;

  useEffect(() => {
    if (alreadyReflected) return;
    const check = () => {
      const day = dayKey();
      const n = nagRef.current;
      const seen = n.day === day ? n.shown || 0 : 0;
      if (seen >= REFLECT_MAX_SHOWS) return;
      if (n.day === day && n.until && Date.now() < n.until) return;
      if (!inReflectWindow() || discipline >= STREAK_TARGET) return;
      setReflect(true);
      setNag({ day, shown: seen + 1, until: Date.now() + REFLECT_SNOOZE_MS });
    };
    check();
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

  const navItems = NAV;
  const moreItems = [];

  const active = NAV.find((n) => n.id === tab) || NAV[0];

  const goFromSettings = (id) => {
    setSettings(false);
    go(id);
  };

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

  if (!leading) return <SecondWindow onTakeOver={takeOver} phase={phase} />;

  return (
    <UndoBus.Provider value={arm}>
    <HoverDeleteProvider>
    <div
      dir="rtl"
      className="min-h-screen w-full text-white antialiased relative overflow-hidden"
      style={{
        "--los-veil": phase.veil,
        "--los-veil-strong": phase.veilStrong,
        fontFamily:
          "'Tajawal', 'Cairo', ui-sans-serif, system-ui, -apple-system, sans-serif",
      }}
    >
      <SkyBackdrop phase={phase} />
      <AppStyles />

      {/* 👇 الخلفية المتوهجة (Glowing Background) 👇 */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 flex min-h-screen">
        
        {/* ---------- القائمة الجانبية العائمة (Floating Glass Sidebar) ---------- */}
        {!hyperFocus && (
          <div
            className="fixed right-0 top-0 bottom-0 z-50 hidden lg:block"
            style={{ width: "30px" }}
            onMouseEnter={() => setIsSidebarHovered(true)}
            onMouseLeave={() => setIsSidebarHovered(false)}
          >
            <aside
              className={`absolute right-4 top-4 bottom-4 flex flex-col rounded-[2rem] transition-all duration-500 ease-in-out ${
                collapsed ? "w-[88px]" : "w-[280px]"
              }`}
              style={{
                transform: isSidebarHovered ? "translateX(0)" : "translateX(calc(100% - 6px))",
                backgroundColor: "rgba(10, 15, 30, 0.45)", 
                backdropFilter: "blur(32px) saturate(150%)", 
                border: "1px solid rgba(255, 255, 255, 0.15)", 
                boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.3), 0 24px 48px -12px rgba(0, 0, 0, 0.6)",
              }}
            >
              {/* شريط التوهج الذي يظهر عندما تكون القائمة مخفية */}
              <div
                className={`absolute top-1/2 -translate-y-1/2 left-0 w-1.5 h-16 rounded-l-full transition-opacity duration-300 ${
                  isSidebarHovered ? "opacity-0" : "opacity-100 bg-white/20"
                }`}
              />

              {/* الخطوط */}
              <style>
                {`
                  @import url('https://fonts.googleapis.com/css2?family=Reem+Kufi:wght@400..700&family=Cinzel:wght@400..900&display=swap');
                  .font-kufi { font-family: 'Reem Kufi', sans-serif; }
                  .font-cinzel { font-family: 'Cinzel', serif; }
                `}
              </style>

              {!collapsed ? (
                <>
                  {/* 🌟 الشعار في القمة (The Brand) */}
                  <div className="relative w-full flex flex-col items-center pt-8 pb-4 overflow-hidden">
                    {/* الشمس المشرقة */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-orange-500/20 blur-[40px] pointer-events-none mix-blend-screen" />
                    
                    {/* أثر */}
                    <h1 className="z-10 text-[48px] font-kufi font-bold leading-none bg-clip-text text-transparent bg-gradient-to-b from-white via-orange-50 to-orange-300 drop-shadow-[0_0_25px_rgba(249,115,22,0.3)]">
                      أثر
                    </h1>

                    {/* ATHAR */}
                    <p className="z-10 text-[9px] font-cinzel font-bold text-white/70 tracking-[0.6em] mt-2" style={{ direction: "ltr" }}>
                      A T H A R
                    </p>

                    {/* الخط الفاصل المضيء مع 2030 */}
                    <div className="w-full flex items-center gap-3 px-6 mt-4 z-10">
                      <span className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-orange-500/60" />
                      <span className="text-[11px] font-cinzel font-bold text-orange-300/90 tracking-[0.3em] drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" style={{ direction: "ltr" }}>2030</span>
                      <span className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-orange-500/60" />
                    </div>
                  </div>

                  {/* 🛠️ زر القائمة والوقت */}
                  <div className="flex items-center justify-between px-4 py-3 border-y border-white/5 bg-white/[0.02] mb-2 mx-2 rounded-xl">
                    <button
                      onClick={() => setCollapsed((c) => !c)}
                      aria-label="طيّ القائمة"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-colors hover:border-white/30 hover:bg-white/10"
                      style={{ color: T.accent }}
                    >
                      <Menu size={16} />
                    </button>
                    <div className="shrink-0 text-left">
                      <NowStamp />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center pt-6 pb-4">
                  <button
                    onClick={() => setCollapsed((c) => !c)}
                    aria-label="توسيع القائمة"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-colors hover:border-white/30 hover:bg-white/10"
                    style={{ color: T.accent }}
                  >
                    <Menu size={18} />
                  </button>
                  {/* شعار مصغر يظهر عندما تكون القائمة مطوية */}
                  <h1 className="text-[24px] font-kufi font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-orange-300 mt-4">أثر</h1>
                </div>
              )}

              {!collapsed && (
                <p className="mb-2 px-5 text-[10px] font-bold text-white/30">
                  التنقّل
                </p>
              )}

              <div className={`los-scroll flex-1 overflow-y-auto px-3 pb-2 ${collapsed ? 'mt-4' : ''}`}>
                <NavGroups items={navItems} tab={tab} onGo={go} showLabels={!collapsed} />
              </div>

              <div className="mt-auto space-y-3 p-4">
                {!collapsed ? (
                  <div
                    className="flex items-center gap-3 rounded-2xl border p-3"
                    style={{
                      borderColor: discipline >= STREAK_TARGET ? `${T.primary}50` : "rgba(255,255,255,0.08)",
                      backgroundColor: "rgba(255,255,255,0.02)",
                      backgroundImage: `linear-gradient(115deg, ${
                        discipline >= STREAK_TARGET ? `${T.primary}1A` : `${T.accent}0A`
                      }, transparent 70%)`,
                    }}
                  >
                    <ProgressRing value={discipline} size={54} stroke={5} label={null} />
                    <div className="min-w-0">
                      <p className="text-[9.5px] font-bold text-white/40">مؤشر اليوم</p>
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-white/70">
                        <Flame
                          size={12}
                          style={{
                            color: discipline >= STREAK_TARGET ? T.ember : "rgba(255,255,255,.25)",
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
                    className="rounded-xl border border-white/10 bg-white/5 py-2 text-center"
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
                  className={`w-full bg-white/5 hover:bg-white/10 ${collapsed ? 'px-0 justify-center' : ''}`}
                  title="الإعدادات والنسخ الاحتياطي"
                >
                  <Settings size={13} />
                  {!collapsed && <span className="mr-2">الإعدادات</span>}
                </Btn>
                <Btn
                  variant="ghost"
                  size="sm"
                  onClick={resetDay}
                  className={`w-full bg-white/5 hover:bg-white/10 ${collapsed ? 'px-0 justify-center' : ''}`}
                  title="تصفير اليوم"
                >
                  <RotateCcw size={13} />
                  {!collapsed && <span className="mr-2">تصفير اليوم</span>}
                </Btn>
              </div>
            </aside>
          </div>
        )}

        {/* ---------- المنطقة الرئيسية (Main Content) ---------- */}
        <main className="min-w-0 flex-1 transition-all duration-300 lg:pr-8">
          
          {!hyperFocus && (
            <div
              className="sticky z-40 flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3.5 lg:hidden"
              style={{
                top: "env(safe-area-inset-top, 0px)",
                backgroundColor: `rgba(15, 23, 42, 0.85)`,
                backdropFilter: "blur(20px) saturate(150%)",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                  <svg viewBox="0 0 100 100" className="w-6 h-6">
                    <path d="M50 15 L85 85 H15 Z" fill="url(#mobileIcon)" />
                    <path d="M32 60 H68" fill="none" stroke="#0f0f11" strokeWidth="10" strokeLinecap="round" />
                    <defs>
                      <linearGradient id="mobileIcon" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="#e11d48" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div className="flex flex-col justify-center">
                  <h1 className="truncate text-[24px] font-black leading-none text-white tracking-tight">أثر</h1>
                  <p className="truncate text-[9px] font-black text-orange-400/80 tracking-[0.3em] mt-1" style={{ direction: "ltr" }}>2030</p>
                </div>
              </div>
              <div className="shrink-0">
                <NowStamp compact />
              </div>
              <span
                className="shrink-0 rounded-xl border px-3 py-1.5 text-[13px] font-extrabold tabular-nums"
                style={{
                  borderColor: discipline >= STREAK_TARGET ? `${T.primary}59` : `${T.accent}4D`,
                  backgroundColor: discipline >= STREAK_TARGET ? `${T.primary}1A` : `${T.accent}14`,
                  color: discipline >= STREAK_TARGET ? T.primary : T.accent,
                }}
              >
                {discipline}%
              </span>
            </div>
          )}

          <div
            className={`mx-auto w-full max-w-6xl px-5 pt-4 sm:px-7 lg:px-12 lg:pt-6 ${
              hyperFocus ? " pb-10" : " pb-36 lg:pb-24"
            }`}
          >
            {!hyperFocus && (
              <div className="mb-5">
                <DynamicIslandBar
                  state={state}
                  setState={setState}
                  discipline={discipline}
                  streak={streak}
                  onGo={go}
                  onOpenCommand={() => setCommandOpen(true)}
                />
              </div>
            )}

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

      {/* 👇 3. تمرير الحالة للزر العائم 👇 */}
      {!hyperFocus && <AssistantFab state={state} setState={setState} />}

      {/* 👇 لوحة الأوامر الخاطفة Ctrl + K 👇 */}
      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        state={state}
        setState={setState}
        onGo={go}
      />

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
              } catch {}
            }}
          >
            <ExternalLink size={13} /> افتح الأساسية
          </Btn>
        </div>
      )}

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
            <p className="mt-0.5 text-[10.5px]" style={{ color: T.sky }}>
              {streakRun.forgiven > 0
                ? forgivenPhrase(streakRun.forgiven)
                : "يوم واحد تحت الهدف لا يكسرها. يومان متتاليان يكسرانها."}
            </p>
          </div>
        </div>
      )}
    </div>
    </HoverDeleteProvider>
    </UndoBus.Provider>
  );
}

function keepStorage() {
  try {
    navigator.storage?.persist?.().catch(() => {});
  } catch {}
}

function cacheShell() {
  if (!served()) return;
  try {
    navigator.serviceWorker?.register("sw.js").catch(() => {});
  } catch {}
}

async function pullDisk() {
  if (!syncLocal()) return;
  try {
    const stop = new AbortController();
    const t = setTimeout(() => stop.abort(), 3000);
    const res = await fetch(api("/state?project=lifeos"), { signal: stop.signal });
    clearTimeout(t);
    if (!res.ok) return;
    const saved = await res.json();
    if (!saved || typeof saved !== "object" || !Array.isArray(saved.habits)) return;
    const diskRev = Number.isFinite(saved.rev) ? saved.rev : 0;
    const localRev = readRev();
    let hasLocal = false;
    try {
      hasLocal = !!window.localStorage.getItem(STORAGE_KEY);
    } catch {}
    if (!hasLocal || diskRev > localRev) {
      const { rev, ...rest } = saved;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
      writeRev(diskRev);
    }
  } catch {}
}

async function boot() {
  keepStorage();
  await pullDisk();
  createRoot(document.getElementById("root")).render(<LifeOS />);
  cacheShell();
}

boot();