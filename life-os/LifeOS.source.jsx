import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { createRoot, createPortal } from "react-dom";
import {
  Menu,
  X,
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
  Sun,
  Sunset,
  Moon,
  Bed,
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
  Square,
  Download,
  Upload,
  Coins,
  Lightbulb,
  NotebookPen,
  Bot,
  Swords,
  Kanban,
  ScanFace,
  Copy,
  CheckCheck,
  ArrowLeft,
  ArrowRight,
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
  Percent,
  Bell,
  CalendarClock,
  CalendarPlus,
  School,
  BookMarked,
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
} from "lucide-react";

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

/* --- tokens --------------------------------------------------------- *
 *  "Vibrant Deep Slate" — an energetic canvas, not a void. Emerald is
 *  reserved for success (a done habit, a banked streak); Electric Coral
 *  drives every primary call to action; amber marks achievement.
 * -------------------------------------------------------------------- */
const T = {
  /* Warm charcoal, not blue slate. A blue-grey ground plus muted accents is
     exactly the palette of a trading terminal — warmth is what makes this
     read as a place to live rather than a dashboard to monitor. */
  bg: "#1C141A",
  bgDeep: "#150E13",
  bgLift: "#241A20",
  /* Any surface that sits on the sky reads this, never a fixed white
     alpha — at noon a 0.07 white fill is a pale blue smear. */
  card: "var(--los-veil, rgba(255,255,255,0.07))",
  cardSolid: "#241A20",
  border: "rgba(255,255,255,0.18)",
  borderStrong: "rgba(255,255,255,0.24)",
  fg: "#FDF8F6",
  muted: "rgba(253,248,246,0.58)",
  faint: "rgba(253,248,246,0.34)",
  primary: "#10B981",
  primaryLift: "#34D399",
  cta: "#FF5722",
  ctaLift: "#FF8A50",
  accent: "#FFB020",
  violet: "#9D5CFF",
  sky: "#00C2FF",
  rose: "#FF4D8D",
  indigo: "#5B8CFF",
  ember: "#FF7A45",
  danger: "#FF3B5C",
};

/* Frosted glass, not a flat tint: a diagonal sheen falling to transparent,
   a brighter rim, and an inset top highlight standing in for the lit edge
   of a real pane of glass. */
const GLASS = {
  /* Set by the sky phase on the root: cards darken as the sky brightens,
     or white type loses its contrast against a noon horizon. */
  backgroundColor: "var(--los-veil, rgba(255,255,255,0.055))",
  /* The sheen is warm, not neutral white: a trace of coral at the lit
     corner and violet at the shaded one, so a card picks up the ground's
     colour instead of sitting on it as a grey pane. */
  backgroundImage:
    "linear-gradient(135deg, rgba(255,150,110,0.11) 0%, rgba(255,255,255,0.045) 42%, rgba(157,92,255,0.05) 100%)",
  borderColor: "rgba(255,225,210,0.18)",
  backdropFilter: "blur(22px) saturate(180%)",
  boxShadow:
    "inset 0 1px 0 0 rgba(255,235,225,0.14), 0 22px 52px -30px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,87,34,0.04)",
};


/* --- sky -------------------------------------------------------------- *
 *  The ground is not a fixed colour any more: it is the sky outside, and
 *  it moves with the day. A morning of sunrise and drifting cloud, a night
 *  of stars and stillness — the routine is prayer-anchored, so the screen
 *  is anchored the same way. A single dark charcoal was tried twice and
 *  rejected both times as gloomy; the fix was not another hue but daylight.
 *
 *  Each phase also carries `veil`: the card fill. Cards stay dark so white
 *  type keeps its contrast, and they have to darken as the sky brightens —
 *  a noon sky under the old 0.055 white fill is unreadable.
 * ==================================================================== */
const SKY = [
  {
    id: "night",
    label: "ليل",
    from: 20 * 60,
    sky: ["#070B1F", "#0D1330", "#181538"],
    body: "#0B1026",
    stars: 1,
    orb: { kind: "moon", x: 73, y: 15, r: 30, color: "#F4EBD6", glow: "#BFD4FF" },
    clouds: 0.12,
    cloud: "#2A2F52",
    veil: "rgba(255,255,255,0.055)",
    veilStrong: "rgba(255,255,255,0.05)",
  },
  {
    id: "fajr",
    label: "فجر",
    from: 4 * 60 + 30,
    sky: ["#131A3A", "#3B2A57", "#8E4462"],
    body: "#1A1F42",
    stars: 0.45,
    orb: { kind: "glow", x: 24, y: 88, r: 46, color: "#FFB48A", glow: "#FF7E6B" },
    clouds: 0.32,
    cloud: "#6B4A6B",
    veil: "rgba(255,255,255,0.06)",
    veilStrong: "rgba(255,255,255,0.05)",
  },
  {
    id: "sunrise",
    label: "شروق",
    from: 6 * 60 + 15,
    sky: ["#2C4C86", "#E2745C", "#FFC77E"],
    body: "#3A4E86",
    stars: 0,
    orb: { kind: "sun", x: 26, y: 74, r: 42, color: "#FFF1C9", glow: "#FF9A4C" },
    clouds: 0.72,
    cloud: "#FFD8C4",
    veil: "rgba(34,16,24,0.54)",
    veilStrong: "rgba(28,13,20,0.62)",
  },
  {
    id: "day",
    label: "نهار",
    from: 9 * 60,
    sky: ["#1E6FB4", "#5FADDD", "#BEE4F3"],
    body: "#2A7ABE",
    stars: 0,
    orb: { kind: "sun", x: 74, y: 18, r: 36, color: "#FFFBE8", glow: "#FFE07A" },
    clouds: 1,
    cloud: "#FFFFFF",
    veil: "rgba(15,19,31,0.66)",
    veilStrong: "rgba(11,15,26,0.74)",
  },
  {
    id: "asr",
    label: "عصر",
    from: 15 * 60,
    sky: ["#2F6796", "#E9A461", "#FFDCA6"],
    body: "#3D7099",
    stars: 0,
    orb: { kind: "sun", x: 22, y: 58, r: 40, color: "#FFF4D2", glow: "#FFB347" },
    clouds: 0.85,
    cloud: "#FFE9CF",
    veil: "rgba(30,18,14,0.58)",
    veilStrong: "rgba(24,14,11,0.66)",
  },
  {
    id: "maghrib",
    label: "مغرب",
    from: 17 * 60 + 30,
    sky: ["#201741", "#B4406C", "#FF8B4E"],
    body: "#2A1B44",
    stars: 0.18,
    orb: { kind: "sun", x: 20, y: 86, r: 44, color: "#FFD9A8", glow: "#FF5E3A" },
    clouds: 0.55,
    cloud: "#9C5A72",
    veil: "rgba(26,14,30,0.46)",
    veilStrong: "rgba(21,11,25,0.56)",
  },
];

/* Ordered by start minute so the lookup is a plain scan; the night entry
   wraps midnight, which is why it is the fallback rather than a range. */
const SKY_BY_TIME = [...SKY].sort((a, b) => a.from - b.from);

function skyAt(date = new Date()) {
  const mins = date.getHours() * 60 + date.getMinutes();
  let found = SKY.find((p) => p.id === "night");
  for (const phase of SKY_BY_TIME) if (mins >= phase.from) found = phase;
  return found;
}

/* Re-checked once a minute. A phase boundary that arrives while the app is
   open should change the sky, not wait for a reload — this is left open
   all day. */
function useSkyPhase() {
  const [phase, setPhase] = useState(() => skyAt());
  useEffect(() => {
    const t = setInterval(() => setPhase(skyAt()), 60000);
    return () => clearInterval(t);
  }, []);
  return phase;
}

/* Deterministic star field: seeded so it does not reshuffle on every
   render, which would read as flicker rather than as sky. */
function useStars(count = 70) {
  return useMemo(() => {
    let seed = 20270930;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    return Array.from({ length: count }, () => ({
      x: rand() * 100,
      y: rand() * 72,
      r: 0.5 + rand() * 1.3,
      o: 0.35 + rand() * 0.65,
      d: rand() * 4,
    }));
  }, [count]);
}

const CLOUDS = [
  { y: 8, s: 1.0, o: 0.62, dur: 200, start: 0.08 },
  { y: 19, s: 0.62, o: 0.44, dur: 280, start: 0.42 },
  { y: 30, s: 1.3, o: 0.5, dur: 230, start: 0.66 },
  { y: 44, s: 0.8, o: 0.34, dur: 320, start: 0.24 },
  { y: 57, s: 0.55, o: 0.26, dur: 260, start: 0.86 },
];

/* The sky itself: a fixed layer behind everything, carrying the sun or
   moon, drifting cloud and a star field. Pointer-events off — scenery. */
function SkyBackdrop({ phase }) {
  const reduce = usePrefersReducedMotion();
  const stars = useStars();
  const { orb } = phase;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{
        background: `linear-gradient(180deg, ${phase.sky[0]} 0%, ${phase.sky[1]} 58%, ${phase.sky[2]} 100%)`,
        transition: "background 1600ms ease",
      }}
    >
      {phase.stars > 0 && (
        <svg
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
          style={{ opacity: phase.stars, transition: "opacity 1600ms ease" }}
        >
          {stars.map((st, i) => (
            <circle
              key={i}
              cx={st.x}
              cy={st.y}
              r={st.r / 6}
              fill="#FFFFFF"
              opacity={st.o}
            >
              {!reduce && (
                <animate
                  attributeName="opacity"
                  values={`${st.o};${st.o * 0.25};${st.o}`}
                  dur={`${2.6 + st.d}s`}
                  repeatCount="indefinite"
                />
              )}
            </circle>
          ))}
        </svg>
      )}

      {/* The halo does the work. A single hard-edged disc reads as a
          billiard ball, not a sun — so the light spreads far and faint,
          and only a small core is actually bright. */}
      <div
        className="absolute rounded-full"
        style={{
          left: `${orb.x}%`,
          top: `${orb.y}%`,
          width: `${orb.r * 1.5}vmax`,
          height: `${orb.r * 1.5}vmax`,
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(circle, ${orb.glow}3D 0%, ${orb.glow}1F 32%, ${orb.glow}0F 52%, transparent 74%)`,
          transition: "all 1600ms ease",
        }}
      />
      {orb.kind === "sun" && (
        <div
          className="absolute rounded-full"
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: `${orb.r * 0.17}vmax`,
            height: `${orb.r * 0.17}vmax`,
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(circle, ${orb.color} 0%, ${orb.color} 58%, ${orb.glow} 84%, ${orb.glow}00 100%)`,
            filter: "blur(0.5vmax)",
            boxShadow: `0 0 ${orb.r * 0.3}vmax ${orb.r * 0.07}vmax ${orb.glow}66`,
            transition: "all 1600ms ease",
          }}
        />
      )}
      {orb.kind === "moon" && (
        /* The bite is cut with a mask, not painted over. A second disc in a
           flat colour read as an eclipse, because the gradient behind the
           moon is never exactly that colour at the moon's height. */
        <svg
          className="absolute"
          viewBox="0 0 100 100"
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: `${orb.r * 0.2}vmax`,
            height: `${orb.r * 0.2}vmax`,
            transform: "translate(-50%, -50%)",
            filter: `drop-shadow(0 0 ${orb.r * 0.1}vmax ${orb.glow}99)`,
            transition: "all 1600ms ease",
          }}
        >
          <defs>
            <mask id="los-moon">
              <rect width="100" height="100" fill="black" />
              <circle cx="50" cy="50" r="38" fill="white" />
              <circle cx="70" cy="34" r="33" fill="black" />
            </mask>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="38"
            fill={orb.color}
            mask="url(#los-moon)"
          />
        </svg>
      )}

      {phase.clouds > 0.05 &&
        CLOUDS.map((c, i) => (
          <div
            key={i}
            className={reduce ? "absolute" : "absolute los-drift"}
            style={{
              left: 0,
              top: `${c.y}%`,
              width: `${17 * c.s}vmax`,
              height: `${7 * c.s}vmax`,
              opacity: c.o * phase.clouds,
              animationDuration: `${c.dur}s`,
              /* Negative delay starts each one mid-drift, so the sky is
                 already populated on the first paint instead of empty. */
              animationDelay: `${-c.dur * c.start}s`,
              filter: `blur(${0.35 * c.s}vmax)`,
              transition: "opacity 1600ms ease",
            }}
          >
            <svg viewBox="0 0 170 70" className="h-full w-full">
              <g fill={phase.cloud}>
                <ellipse cx="52" cy="44" rx="34" ry="22" />
                <ellipse cx="86" cy="34" rx="30" ry="26" />
                <ellipse cx="116" cy="46" rx="28" ry="20" />
                <rect x="24" y="44" width="122" height="22" rx="11" />
              </g>
            </svg>
          </div>
        ))}

      {/* A floor of shade, so cards low on the page keep their contrast on
          the bright phases where the horizon is lightest. */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, transparent 0%, ${phase.body}33 62%, ${phase.body}66 100%)`,
          transition: "background 1600ms ease",
        }}
      />
    </div>
  );
}

/* Date and time, small, beside the wordmark. Its own component so the
   second-by-second tick re-renders this line and nothing else. */
/* The failure banner shouts; nothing ever said the quiet half. A tick that
   lands and is never confirmed looks exactly like one that was dropped, and
   this app is the kind a person leaves open for days and trusts blindly.
   The timestamp is the save effect's own — it is set after the write
   returned, never guessed from a render. */
function SaveStamp({ at }) {
  if (!at) return null;
  const t = new Date(at).toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return (
    <span
      className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold"
      style={{
        borderColor: `${T.primary}44`,
        color: T.primary,
        background: `${T.primary}14`,
      }}
    >
      <Check size={10} strokeWidth={3.2} />
      {"محفوظ "}
      <span dir="ltr" className="tabular-nums">
        {t}
      </span>
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

/* --- navigation ------------------------------------------------------ */
const NAV = [
  { id: "routine", label: "الروتين اليومي", short: "الروتين", icon: ListChecks },
  { id: "agenda", label: "التقويم", short: "التقويم", icon: CalendarDays },
  { id: "uni", label: "الجامعة", short: "الجامعة", icon: GraduationCap },
  { id: "career", label: "مسار التوظيف", short: "التوظيف", icon: Briefcase },
  { id: "matrix", label: "مصفوفة المهام", short: "المهام", icon: LayoutGrid },
  { id: "deep", label: "العمل العميق", short: "التركيز", icon: Timer },
  { id: "goals", label: "أهدافي على ثلاث سنوات", short: "الأهداف", icon: Flag },
  { id: "pipeline", label: "خط سير المشاريع", short: "المسار", icon: Kanban },
  { id: "tactical", label: "المراجعة التكتيكية", short: "التكتيك", icon: Swords },
  { id: "finance", label: "الدخل والمشاريع", short: "الدخل", icon: Wallet },
  { id: "prompts", label: "خزنة الأوامر", short: "الأوامر", icon: Bot },
  { id: "vault", label: "مكتبة الإنجازات", short: "المكتبة", icon: Library },
  { id: "analytics", label: "التتبع الشهري", short: "التتبع", icon: BarChart3 },
  { id: "breaker", label: "كاسر العادات", short: "الكسر", icon: ShieldOff },
];
const NAV_IDS = NAV.map((n) => n.id);

/* The saved order is a list of ids, not of tabs — a tab's definition lives in
   NAV and nowhere else. Resolving through here is what makes the stored order
   safe to trust: an id this build no longer has is dropped, a tab the saved
   order has never seen joins the end, and a duplicate is taken once. Without
   that last part a hand-edited backup could hide a tab outright. */
function orderedNav(order) {
  const byId = new Map(NAV.map((n) => [n.id, n]));
  const seen = new Set();
  const out = [];
  for (const id of Array.isArray(order) ? order : []) {
    if (byId.has(id) && !seen.has(id)) {
      seen.add(id);
      out.push(byId.get(id));
    }
  }
  for (const n of NAV) if (!seen.has(n.id)) out.push(n);
  return out;
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

/* --- kanban ----------------------------------------------------------- */
const LANES = [
  { id: "todo", label: "للتنفيذ", tint: "#5B8CFF" },
  { id: "doing", label: "جاري العمل", tint: "#FFB020" },
  { id: "done", label: "مكتمل", tint: T.primary },
];

/* --- deep work -------------------------------------------------------- */
const SESSIONS = [
  { min: 25, label: "بومودورو", hint: "جولة قصيرة مركّزة" },
  { min: 90, label: "عمل عميق", hint: "دورة التركيز الكاملة" },
];

/* --- 90-day chunks ---------------------------------------------------- *
 *  A year is too big to act on. Four 90-day blocks are not, and the vault
 *  opens on the one you are living in.
 * ---------------------------------------------------------------------- */
const QUARTERS = [
  { id: "q1", label: "الربع الأول", months: "يناير — مارس", tint: "#00C2FF" },
  { id: "q2", label: "الربع الثاني", months: "أبريل — يونيو", tint: "#9D5CFF" },
  { id: "q3", label: "الربع الثالث", months: "يوليو — سبتمبر", tint: "#FFB020" },
  { id: "q4", label: "الربع الرابع", months: "أكتوبر — ديسمبر", tint: "#FF4D8D" },
];
const currentQuarter = (d = new Date()) => QUARTERS[Math.floor(d.getMonth() / 3)].id;
const QUARTER_IDS = new Set(QUARTERS.map((q) => q.id));
const quarterOf = (id) => QUARTERS.find((q) => q.id === id) || QUARTERS[0];

/* --- the six pillars of 2027 ----------------------------------------- */
const PILLARS = [
  { id: "faith", label: "الإيماني", icon: MoonStar, tint: "#9D5CFF" },
  { id: "health", label: "الصحي", icon: HeartPulse, tint: "#FF7A45" },
  { id: "career", label: "المهني", icon: Briefcase, tint: "#00C2FF" },
  { id: "money", label: "المالي", icon: Wallet, tint: "#FFB020" },
  { id: "social", label: "الاجتماعي", icon: Users, tint: "#FF4D8D" },
  { id: "self", label: "الشخصي", icon: Sparkles, tint: "#5B8CFF" },
];
const PILLAR_IDS = new Set(PILLARS.map((p) => p.id));
const pillarOf = (id) => PILLARS.find((p) => p.id === id) || PILLARS[5];

/* --- the three horizons ---------------------------------------------- *
 *  A 90-day goal that serves nothing is a chore with a deadline. Three
 *  horizons, each answering the one above it: who you intend to be in three
 *  years, what this year has to deliver for that, and what the next ninety
 *  days actually execute. The order matters — `HORIZONS` is read top-down
 *  everywhere, and `parentHorizon` is the only place the chain is written.
 * ---------------------------------------------------------------------- */
const HORIZONS = [
  {
    id: "h3",
    label: "ثلاث سنوات",
    short: "٣ سنوات",
    hint: "من تريد أن تكون في نهاية ٢٠٢٩ — لا قائمة مهام، بل صورة رجل.",
    icon: Telescope,
    tint: "#9D5CFF",
    child: "هدف سنوي",
  },
  {
    id: "year",
    label: "هذه السنة",
    short: "السنة",
    hint: "ما يجب أن يتحقّق هذه السنة كي تصل الثلاث سنوات.",
    icon: CalendarRange,
    tint: "#FFB020",
    child: "هدف ربعي",
  },
  {
    id: "quarter",
    label: "تسعون يومًا",
    short: "٩٠ يومًا",
    hint: "ما تنفّذه الآن. هنا فقط يتحوّل الطموح إلى عمل.",
    icon: Target,
    tint: "#FF5722",
    child: null,
  },
];
const HORIZON_IDS = new Set(HORIZONS.map((h) => h.id));
const horizonOf = (id) => HORIZONS.find((h) => h.id === id) || HORIZONS[2];
/* The horizon a goal's parent must belong to. The top of the chain has none,
   which is also how the editor knows to hide the parent picker. */
const parentHorizon = (id) =>
  id === "quarter" ? "year" : id === "year" ? "h3" : null;

/* The three-year arc. 2027 is the year this whole app is named for, so it
   anchors the horizon and the two after it complete it. */
const ARC = [2027, 2028, 2029];
const ARC_LABEL = "٢٠٢٧ — ٢٠٢٩";

/* The years a goal may be filed under: the arc, plus the year you are
   actually standing in when that is earlier than it. Planning 2027 from 2026
   is the normal case right now, and the months before the arc opens are
   exactly when the planning happens — a year with no tab is a year you cannot
   write a goal in, and the three-month run-up would have nowhere to live.
   From 2027 onward this is the arc and nothing else, so no goal's year ever
   stops being selectable underneath it. */
const GOAL_YEARS = (() => {
  const y = new Date().getFullYear();
  return y < ARC[0] ? [y, ...ARC] : ARC;
})();

/* A stored year is validated against this range, not against GOAL_YEARS —
   GOAL_YEARS shrinks on the first of January once the run-up year is behind
   us, and validating against it would silently move every goal filed in that
   year into the next one. The range is fixed, so a 2026 goal stays a 2026
   goal forever; the screen keeps offering its tab for as long as anything
   lives there. */
const YEAR_MIN = ARC[0] - 1;
const YEAR_MAX = ARC[ARC.length - 1];

/* --- routine groups -------------------------------------------------- */
const GROUPS = [
  { id: "morning", label: "الصباح", icon: Sunrise, tint: "#FFB020" },
  { id: "afternoon", label: "بعد الظهر", icon: Sun, tint: "#FF7A45" },
  { id: "asr", label: "بعد العصر", icon: Sunset, tint: "#FF4D8D" },
  { id: "maghrib", label: "بعد المغرب", icon: Moon, tint: "#9D5CFF" },
  { id: "postisha", label: "بعد العشاء", icon: MoonStar, tint: "#00C2FF" },
  { id: "night", label: "قبل النوم", icon: Bed, tint: "#5B8CFF" },
];

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

/* --- daily cue -------------------------------------------------------- */
const QUOTES = [
  {
    text: "أنت لا ترتقي إلى مستوى أهدافك، بل تهبط إلى مستوى أنظمتك.",
    author: "جيمس كلير",
  },
  {
    text: "إضاعة الوقت أشدّ من الموت؛ لأنها تقطعك عن الله والدار الآخرة.",
    author: "ابن القيّم",
  },
  { text: "اقرأ ما تحبّ حتى تُحبّ القراءة.", author: "نافال رافيكانت" },
  {
    text: "التركيز العميق مهارة نادرة وثمينة في اقتصاد اليوم.",
    author: "كال نيوبورت",
  },
  { text: "حاسبوا أنفسكم قبل أن تُحاسَبوا.", author: "عمر بن الخطاب" },
  {
    text: "ابن آدم، إنما أنت أيام؛ فإذا ذهب يوم ذهب بعضك.",
    author: "الحسن البصري",
  },
  {
    text: "ومن لم يذق مرّ التعلّم ساعة، تجرّع ذلّ الجهل طول حياته.",
    author: "الإمام الشافعي",
  },
  { text: "ليست حياتنا قصيرة، بل نحن نُضيّع كثيرًا منها.", author: "سينيكا" },
  {
    text: "أنت تملك سلطانًا على عقلك، لا على الأحداث. أدرك هذا تجد القوة.",
    author: "ماركوس أوريليوس",
  },
  {
    text: "وقتك محدود، فلا تُضيّعه عيشًا في حياة شخص آخر.",
    author: "ستيف جوبز",
  },
  { text: "الناجحون جدًّا يقولون «لا» لكل شيء تقريبًا.", author: "وارن بافيت" },
  { text: "ما يُقاس، يتحسّن.", author: "بيتر دراكر" },
  { text: "ما يصنع أعدائي بي؟ أنا جنّتي وبستاني في صدري.", author: "ابن تيمية" },
  { text: "العادة هي الفائدة المركّبة لتطوير الذات.", author: "جيمس كلير" },
  {
    text: "من عرف طول الطريق استعدّ له، ومن أيقن بالمنزل هان عليه السفر.",
    author: "ابن القيّم",
  },
  { text: "لا تُصلح عملك لأجل الناس، ولا تُفسده لأجلهم.", author: "الفضيل بن عياض" },
  {
    text: "الانضباط هو اختيار ما تريده أكثر على ما تريده الآن.",
    author: "أبراهام لينكون",
  },
  { text: "أصعب خطوة هي الأولى؛ وما بعدها عادة.", author: "أرسطو" },
  {
    text: "إذا لم تكن لك خطة، فستكون جزءًا من خطة غيرك.",
    author: "تيري ماكميلان",
  },
  { text: "عش يومك كأنه آخر أيامك، واعمل كأنك تعيش أبدًا.", author: "مثل عربي" },
  {
    text: "النجاح مجموع جهود صغيرة تتكرّر يومًا بعد يوم.",
    author: "روبرت كوليير",
  },
  { text: "أفضل وقت لغرس شجرة كان قبل عشرين عامًا، وثانيه اليوم.", author: "مثل صيني" },
  {
    text: "لن تتغيّر حياتك حتى تتغيّر عاداتك اليومية؛ السرّ في جدولك.",
    author: "جون مكسويل",
  },
  {
    text: "من استوى يوماه فهو مغبون، ومن كان غده شرًّا من يومه فهو ملعون.",
    author: "الحسن البصري",
  },
  { text: "التركيز يعني قول «لا» لمئة فكرة جيّدة.", author: "ستيف جوبز" },
  {
    text: "لا يُدرَك العلم براحة الجسم، ولا تُنال المعالي بالتمنّي.",
    author: "الإمام مسلم",
  },
  {
    text: "أنت ما تفعله بتكرار؛ فالتميّز ليس حدثًا بل عادة.",
    author: "ويل ديورانت",
  },
  {
    text: "أعظم ما يملكه المرء وقتٌ فارغ يملؤه بما ينفع.",
    author: "ابن الجوزي",
  },
  { text: "لا تنتظر الإلهام؛ اذهب إليه بعصا غليظة.", author: "جاك لندن" },
  { text: "ما بدأتَه اليوم يصنع من تكون بعد سنة.", author: "سينيكا" },
];

/* The cue list is seed data the user owns from the first load: it is copied
   into state so a quote can be edited, added to or deleted. QUOTES itself
   stays the immutable seed the migration reads from. */
const SEED_QUOTES = () => QUOTES.map((q) => ({ id: uid(), ...q }));

/* A phone photo is several megabytes and the whole app state shares one
   localStorage quota, so an oversized image would make every later write
   throw and silently stop persisting *everything*. The photo is therefore
   redrawn through a canvas and stepped down until it fits a hard budget —
   the image gives way, never the user's habits and history. */
const IMAGE_BUDGET = 900 * 1024; // characters of data URL
const IMAGE_STEPS = [
  [1400, 0.78],
  [1100, 0.72],
  [900, 0.66],
  [700, 0.6],
  [520, 0.52],
];

function shrinkImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode"));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("canvas"));
        let out = null;
        for (const [maxW, quality] of IMAGE_STEPS) {
          const scale = Math.min(1, maxW / img.width);
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          try {
            out = canvas.toDataURL("image/jpeg", quality);
          } catch (e) {
            return reject(e);
          }
          if (out.length <= IMAGE_BUDGET) return resolve(out);
        }
        /* Even the smallest step overshot — refuse rather than poison the
           quota with something the next write cannot save alongside. */
        reject(new Error("too-large"));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* The library has its own cue, about reading rather than about the day.
   Same walk-on-open behaviour as the daily one, its own cursor. */
const READING_QUOTES = [
  { text: "الكتاب بلا درس مكتوب لم يُقرأ، بل مُرّ عليه.", author: "قاعدة المكتبة" },
  { text: "من قرأ كتابًا واحدًا وطبّقه، أنفع ممن قرأ مئة ونسيها.", author: "مثل مأثور" },
  { text: "اقرأ ما تحبّ حتى تُحبّ القراءة.", author: "نافال رافيكانت" },
  {
    text: "لو لم يكن في الكتب إلا أنها تقطع عنك وساوس الفراغ لكفى.",
    author: "ابن الجوزي",
  },
  { text: "الكتب هي المرآة التي نرى فيها أنفسنا قبل أن نرى غيرنا.", author: "عباس العقاد" },
  {
    text: "قراءة عشر صفحات كل يوم تصنع ١٥ كتابًا في السنة. البطء ليس العدوّ، الانقطاع هو.",
    author: "قاعدة التراكم",
  },
  { text: "خير جليس في الزمان كتاب.", author: "المتنبّي" },
  {
    text: "لا تقرأ لتردّ، ولا لتصدّق؛ اقرأ لتزن وتفكّر.",
    author: "فرانسيس بيكون",
  },
  { text: "الفصل الذي لم تلخّصه، ستنساه قبل نهاية الشهر.", author: "قاعدة التلخيص" },
  {
    text: "قيمة الكتاب في ما غيّره فيك، لا في عدد صفحاته.",
    author: "قاعدة المكتبة",
  },
  { text: "من لم يذق مرّ التعلّم ساعة، تجرّع ذلّ الجهل طول حياته.", author: "الإمام الشافعي" },
  {
    text: "كتاب تقرؤه مرّتين خير من كتابين تقرأ كلًّا منهما مرّة.",
    author: "قاعدة العمق",
  },
];

const SEED_READS = () => READING_QUOTES.map((q) => ({ id: uid(), ...q }));

/* --- persistence ------------------------------------------------------ */
const STORAGE_KEY = "life-os-2027:v3";

/* --- local sync -------------------------------------------------------
   Mirrors the state to report-agent's sync server so the charts refresh
   without a manual export. Entirely optional: if the server is down the
   rejection is swallowed and localStorage remains the source of truth. */
const SYNC_URL = "http://127.0.0.1:47615/sync";
let syncTimer = null;
function syncLocal() {
  try {
    return (
      location.protocol === "file:" ||
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1"
    );
  } catch {
    return false;
  }
}
function syncOut(payload) {
  if (!syncLocal()) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    try {
      fetch(SYNC_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain", "X-Local-Sync": "1" },
        body: JSON.stringify({ project: "lifeos", payload }),
      }).catch(() => {});
    } catch {}
  }, 2500);
}
const UI_KEY = "life-os-2027:ui";
const SCHEMA = 19;
const HISTORY_CAP = 500;
const STREAK_TARGET = 80;
/* 80/20: three real tasks a day beat a list of twenty. Hard cap, on purpose. */
const TOP_TASK_CAP = 3;

/* The day ends when you sleep, not at midnight. Ticking «أذكار النوم» at
   01:00 is finishing yesterday, not starting today — and a sheet that wiped
   itself at 00:00 is why a night of work kept landing on the wrong row and
   then being zeroed by the next morning's reload. Anything written between
   midnight and this hour belongs to the previous day. */
const DAY_START_HOUR = 4;

/* --- the evening prompt's window -------------------------------------- *
 *  The day here does not end at midnight, it ends at DAY_START_HOUR — so
 *  its evening runs from 20:00 round past midnight to that hour. Testing
 *  the wall clock with `h >= 20` left 00:00–03:59 silent, which is exactly
 *  when someone reviewing «the day that just ended» is awake, and exactly
 *  the hours this app's own «السهر بعد منتصف الليل» assumes he is up for.
 *  Past midnight the prompt never came, and at 04:00 the day rolled over
 *  and took the question with it.
 * ---------------------------------------------------------------------- */
const REFLECT_FROM_HOUR = 20;
const inReflectWindow = (d = new Date()) => {
  const h = d.getHours();
  return h >= REFLECT_FROM_HOUR || h < DAY_START_HOUR;
};
/* «لاحقًا» is a button that says *later*, so it has to mean later. Three
   showings an evening, an hour apart, then silence — a prompt that returns
   forever is one you learn to dismiss without reading. */
const REFLECT_SNOOZE_MS = 60 * 60 * 1000;
const REFLECT_MAX_SHOWS = 3;

/* "Now", shifted onto the logical day it belongs to. */
const logicalNow = (d = new Date()) => {
  const x = new Date(d.getTime());
  x.setHours(x.getHours() - DAY_START_HOUR);
  return x;
};

/* A calendar date, formatted as a key. The no-argument call means *now* and
   gets the logical day; a call that passes a date means that exact calendar
   square — the month grid and the streak walkers depend on the difference,
   so the shift must not hide inside a default parameter. */
const fmtDay = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
const dayKey = (d) => fmtDay(d === undefined ? logicalNow() : d);

const yesterdayKey = () => {
  const d = logicalNow();
  d.setDate(d.getDate() - 1);
  return fmtDay(d);
};
const uid = () => Math.random().toString(36).slice(2, 9);

/* --- the two guards every stored shape is built on -------------------- *
 *  A default parameter fires for `undefined` and for nothing else, so
 *  `shape(null)` sailed straight past `(x = {})` and threw on the first
 *  property read. That is not a theoretical payload: a hand-edited backup,
 *  a half-written download and another app's JSON all produce exactly it,
 *  and `[null]` passes the import check because it is still an array.
 *
 *  `obj` makes a shape total — anything that is not an object becomes an
 *  empty one and every field falls back to its default. `rows` does the
 *  same for a list: the holes are dropped rather than carried forward to
 *  throw later, somewhere with no try/catch around it.
 * ---------------------------------------------------------------------- */
const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
const rows = (v) =>
  Array.isArray(v) ? v.filter((x) => x && typeof x === "object" && !Array.isArray(x)) : [];

/* The "بعد العشاء" block was split out of "المساء" in schema 4. These labels
   drive both the seed and the migration, so an existing user's صلاة العشاء
   moves into the new block instead of being duplicated beside it. */
const POSTISHA_LABELS = [
  "صلاة العشاء",
  "تقييم اليوم: التزمت؟",
  "تحضير مهام الغد الثلاث",
];
const LEGACY_POSTISHA = new Set(["صلاة العشاء", "تقييم يومي", ...POSTISHA_LABELS]);

/* Added in schema 6. Kept in their own list so the migration can top up an
   existing profile with exactly the ones it is missing. */
const ADDED_HABITS = [
  { label: "تمارين مقاومة (صدر/بطن) أو T-Bar + ١٥ ألف خطوة", group: "morning" },
  { label: "محادثة إنجليزية مع متحدث أصلي", group: "afternoon" },
  { label: "تحضير وجبة الغد: دجاج صيني وأرز", group: "maghrib" },
];

/* Schema 8 split the old "المساء" block into "بعد العصر" and "بعد المغرب". */
const ASR_HABITS = [
  { label: "صلاة العصر", group: "asr" },
  { label: "مراجعة سريعة لمهام اليوم", group: "asr" },
  { label: "مشي أو حركة خفيفة", group: "asr" },
];
const MAGHRIB_HABITS = [{ label: "صلاة المغرب وأذكار", group: "maghrib" }];

const ADDED_TASKS = [
  { text: "جلسة مذاكرة PMP — ٩٠ دقيقة", quadrant: "q2" },
  { text: "تحديث LinkedIn: إبراز إدارة المرافق والتدريب التعاوني", quadrant: "q2" },
  { text: "ساعتان عمل توصيل مرن", quadrant: "q3" },
];

const READ_ACTIVE = "active";
const READ_GOAL_DEFAULT = 20;

/* --- water ------------------------------------------------------------ *
 *  Eight cups is the figure everyone already knows, so it is the default.
 *  The count is per-day and deliberately absent from `carryOf`: yesterday's
 *  water is not today's. The cap exists because the cups are rendered one
 *  per glass, and a hand-edited backup asking for four hundred of them
 *  would lock the routine screen up drawing them.
 * ---------------------------------------------------------------------- */
const WATER_GOAL_DEFAULT = 8;
const WATER_GOAL_MAX = 20;
const clampGoal = (n) =>
  Number.isFinite(+n) && +n >= 1
    ? Math.min(WATER_GOAL_MAX, Math.round(+n))
    : WATER_GOAL_DEFAULT;
const CUP_FORMS = ["كوب", "كوبان", "أكواب", "كوبًا"];
const cupWord = (n) => arCount(n, CUP_FORMS);

/* --- prayer times ----------------------------------------------------- *
 *  Computed here, never fetched. The routine's six blocks are anchored to
 *  the prayers, so the times they are anchored to cannot be the one part of
 *  the screen that needs a network: this file is opened straight off disk as
 *  `file://`, where a fetch is at the mercy of CORS and of being offline,
 *  and a blank prayer card would take the meaning of «بعد العصر» with it.
 *
 *  The maths is the standard solar-position method (the same one the public
 *  APIs run server-side) with Umm al-Qura's parameters: Fajr at 18.5° of
 *  depression and Isha a fixed ninety minutes after Maghrib. Verified
 *  against Umm al-Qura's own published times for Riyadh on five dates spread
 *  across a year — every prayer landed within a single minute.
 * ---------------------------------------------------------------------- */
const RAD = Math.PI / 180;
const dSin = (d) => Math.sin(d * RAD);
const dCos = (d) => Math.cos(d * RAD);
const dTan = (d) => Math.tan(d * RAD);
const fixAngle = (a) => ((a % 360) + 360) % 360;
const fixHour = (h) => ((h % 24) + 24) % 24;

/* Julian day at 00:00 UT of a civil date (Gregorian). */
function julianDay(y, m, d) {
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    d +
    b -
    1524.5
  );
}

function sunPosition(jd) {
  const D = jd - 2451545.0; // days from J2000
  const g = fixAngle(357.529 + 0.98560028 * D); // mean anomaly
  const q = fixAngle(280.459 + 0.98564736 * D); // mean longitude
  const L = fixAngle(q + 1.915 * dSin(g) + 0.02 * dSin(2 * g)); // apparent
  const e = 23.439 - 0.00000036 * D; // obliquity
  const decl = Math.asin(dSin(e) * dSin(L)) / RAD;
  const ra = fixHour(Math.atan2(dCos(e) * dSin(L), dCos(L)) / RAD / 15);
  /* Both terms are already wrapped into [0,24), so their difference lands a
     whole day out whenever one of them has just crossed zero. Folding
     through 12 puts it back in [-12,12), where the equation of time lives. */
  const eqt = fixHour(q / 15 - ra + 12) - 12;
  return { decl, eqt };
}

/* Hours between solar noon and the moment the sun sits `angle` degrees below
   the horizon. `null` when the day has no such moment at all — a polar
   summer has no Fajr, and inventing one would be worse than an honest dash. */
function hourAngle(angle, decl, lat) {
  const x =
    (-dSin(angle) - dSin(decl) * dSin(lat)) / (dCos(decl) * dCos(lat));
  if (!(x >= -1 && x <= 1)) return null;
  return Math.acos(x) / RAD / 15;
}

/* Asr is a shadow length, not an angle: the sun's altitude at the moment a
   shadow has grown `factor` object-heights past its noon length. One for the
   Shafii school, two for the Hanafi. */
const asrAltitude = (factor, decl, lat) =>
  -Math.atan(1 / (factor + dTan(Math.abs(lat - decl)))) / RAD;

const FAJR_ANGLE = 18.5; // Umm al-Qura
const ISHA_GAP_MIN = 90; // Umm al-Qura: ninety minutes after Maghrib

/* Returns decimal hours in the place's own standard time, or null per prayer
   where the sun never reaches that depression. */
function prayerTimes(place, date) {
  const { lat, lng, tz, asr = 1 } = place;
  /* The sun's position is wanted at local noon, not at 00:00 UT — a whole
     time zone's worth of drift otherwise shows up as a minute or two of
     error at the solstices, which is exactly where it is most visible. */
  const jd = julianDay(date.getFullYear(), date.getMonth() + 1, date.getDate()) - lng / 360;
  const { decl, eqt } = sunPosition(jd);
  const noon = 12 - eqt - lng / 15 + tz;
  const riseSet = hourAngle(0.833, decl, lat); // refraction + solar radius
  const fajrT = hourAngle(FAJR_ANGLE, decl, lat);
  const asrT = hourAngle(asrAltitude(asr, decl, lat), decl, lat);
  const maghrib = riseSet === null ? null : noon + riseSet;
  return {
    fajr: fajrT === null ? null : noon - fajrT,
    sunrise: riseSet === null ? null : noon - riseSet,
    dhuhr: noon,
    asr: asrT === null ? null : noon + asrT,
    maghrib,
    isha: maghrib === null ? null : maghrib + ISHA_GAP_MIN / 60,
  };
}

/* The six rows, in the order of the day. «الشروق» is not a prayer and is
   marked so: it is the end of Fajr's window, which is why it is shown. */
const PRAYERS = [
  { id: "fajr", label: "الفجر", icon: Sunrise, tint: "#5B8CFF" },
  { id: "sunrise", label: "الشروق", icon: Sun, tint: "#FFB020", mark: true },
  { id: "dhuhr", label: "الظهر", icon: Sun, tint: "#FF7A45" },
  { id: "asr", label: "العصر", icon: Sunset, tint: "#FF4D8D" },
  { id: "maghrib", label: "المغرب", icon: Moon, tint: "#9D5CFF" },
  { id: "isha", label: "العشاء", icon: MoonStar, tint: "#00C2FF" },
];

/* Saudi first, because that is where this is lived. Coordinates are the city
   centre and the offset is standard time — the Kingdom has no DST, so a
   stored number is safe here in a way it would not be in Europe. */
const PLACES = [
  { id: "riyadh", label: "الرياض", lat: 24.7136, lng: 46.6753, tz: 3 },
  { id: "makkah", label: "مكة المكرمة", lat: 21.3891, lng: 39.8579, tz: 3 },
  { id: "madinah", label: "المدينة المنورة", lat: 24.5247, lng: 39.5692, tz: 3 },
  { id: "jeddah", label: "جدة", lat: 21.4858, lng: 39.1925, tz: 3 },
  { id: "dammam", label: "الدمام", lat: 26.4207, lng: 50.0888, tz: 3 },
  { id: "abha", label: "أبها", lat: 18.2164, lng: 42.5053, tz: 3 },
  { id: "buraydah", label: "بريدة", lat: 26.326, lng: 43.975, tz: 3 },
  { id: "tabuk", label: "تبوك", lat: 28.3835, lng: 36.5662, tz: 3 },
  { id: "hail", label: "حائل", lat: 27.5114, lng: 41.7208, tz: 3 },
  { id: "jizan", label: "جازان", lat: 16.8892, lng: 42.5611, tz: 3 },
];
const PLACE_BY_ID = new Map(PLACES.map((p) => [p.id, p]));

const placeShape = (p) => {
  const o = obj(p);
  const seed = PLACE_BY_ID.get(o.id) || PLACES[0];
  /* Unary `+` turns null, [], "" and false into 0, and 0 is a perfectly
     plausible-looking longitude — so a payload that lost a field came back
     sitting on the prime meridian at UTC+0 and the prayer times were three
     hours out without anything looking broken. Only a real number, or a
     string that is entirely one, is allowed to pass. */
  const num = (v, fb, lim) => {
    const n =
      typeof v === "number"
        ? v
        : typeof v === "string" && v.trim() !== ""
          ? Number(v)
          : NaN;
    return Number.isFinite(n) && Math.abs(n) <= lim ? n : fb;
  };
  return {
    id: PLACE_BY_ID.has(o.id) ? o.id : o.id === "custom" ? "custom" : seed.id,
    label: typeof o.label === "string" && o.label.trim() ? o.label.trim() : seed.label,
    lat: num(o.lat, seed.lat, 90),
    lng: num(o.lng, seed.lng, 180),
    tz: num(o.tz, seed.tz, 14),
    /* 1 = Shafii, 2 = Hanafi. Anything else is not a school. */
    asr: +o.asr === 2 ? 2 : 1,
  };
};

/* Decimal hours → "07:18". Named apart from `hhmm`, which validates a time
   the user typed; this one formats one the solar maths produced. Rendered
   LTR by the caller — this only builds the string. */
const clockAt = (h) => {
  if (h === null || !Number.isFinite(h)) return "—";
  const total = Math.round(fixHour(h) * 60);
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(
    total % 60,
  ).padStart(2, "0")}`;
};

/* Which prayer is next, and how long until it. Isha is the last row of the
   day, so after it the answer is tomorrow's Fajr — computed from tomorrow's
   own date rather than reused, because a date boundary moves it by minutes.
   «الشروق» is skipped: it is a window's end, not something you wait for. */
function nextPrayer(place, now = new Date()) {
  const mins = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const today = prayerTimes(place, now);
  for (const p of PRAYERS) {
    if (p.mark) continue;
    const t = today[p.id];
    if (t === null || !Number.isFinite(t)) continue;
    const at = fixHour(t) * 60;
    if (at > mins) return { ...p, at, left: Math.round(at - mins) };
  }
  const tomorrow = new Date(now.getTime());
  tomorrow.setDate(tomorrow.getDate() + 1);
  const t = prayerTimes(place, tomorrow).fajr;
  if (t === null || !Number.isFinite(t)) return null;
  const at = fixHour(t) * 60;
  return { ...PRAYERS[0], at, left: Math.round(at + 1440 - mins), tomorrow: true };
}

/* --- habit breaker ---------------------------------------------------- *
 *  The mirror image of a routine habit: a streak you defend rather than
 *  build. Everything here is keyed off one stored day — startDate — so the
 *  count can never drift out of sync with a separate counter.
 * ---------------------------------------------------------------------- */
const MILESTONES = [
  { d: 3, label: "٣ أيام", hint: "أصعب ٧٢ ساعة" },
  { d: 7, label: "أسبوع", hint: "أسبوع كامل بلا رجعة" },
  { d: 21, label: "٢١ يومًا", hint: "الدماغ بدأ ينسى" },
  { d: 90, label: "٩٠ يومًا", hint: "ربع كامل — صرت شخصًا آخر" },
];
const MILESTONE_CAP = MILESTONES[MILESTONES.length - 1].d;

const COST_TYPES = [
  {
    id: "money",
    label: "مال",
    unit: "ريال",
    forms: ["ريال", "ريالان", "ريالات", "ريالًا"],
    icon: Coins,
    tint: "#FFB020",
  },
  {
    id: "time",
    label: "وقت",
    unit: "ساعة",
    forms: ["ساعة", "ساعتان", "ساعات", "ساعة"],
    icon: Hourglass,
    tint: "#00C2FF",
  },
];
const costType = (id) => COST_TYPES.find((c) => c.id === id) || COST_TYPES[0];

/* --- the weakness mirror ---------------------------------------------- *
 *  A relapse written as prose is a diary: it reads well once and can never
 *  be counted. So every confrontation with the urge — the ones that won and
 *  the ones that lost — carries a cause, a mood and the clock hour beside
 *  the free text. That is the whole point of the screen: to say back to the
 *  user the one sentence he cannot say about himself — *this* is what takes
 *  you down, and *this* is when it comes for you.
 *
 *  Every tag ships with its own counter-move. A diagnosis with no
 *  prescription is just a nicer way of telling someone he is weak.
 * ---------------------------------------------------------------------- */
const URGE_TAGS = [
  {
    id: "big",
    label: "المهمة كبيرة",
    icon: Mountain,
    tint: "#FF7A45",
    counter:
      "قصّها إلى خطوة واحدة مدّتها خمس دقائق، واكتبها كفعل لا كهدف: «افتح الملف»، لا «أنجز التقرير».",
  },
  {
    id: "unclear",
    label: "لا أعرف من أين أبدأ",
    icon: HelpCircle,
    tint: "#FFB020",
    counter:
      "لا تبدأ — خطّط فقط. اكتب أول ثلاث خطوات على ورقة ثم نفّذ الأولى وحدها. الغموض هو ما يشلّك، لا الكسل.",
  },
  {
    id: "fear",
    label: "خوف من الفشل",
    icon: Frown,
    tint: "#FF4D8D",
    counter:
      "اصنع نسخة سيئة عمدًا. المسوّدة الرديئة تكسر الرهبة، والجودة تأتي من التعديل لا من البداية.",
  },
  {
    id: "phone",
    label: "الهاتف بيدي",
    icon: Smartphone,
    tint: "#00C2FF",
    counter:
      "الهاتف في غرفة أخرى قبل أن تجلس، لا في جيبك. إرادتك لا تنافس إشعارًا صُمّم ليخطفها.",
  },
  {
    id: "bored",
    label: "ملل",
    icon: Snail,
    tint: "#9D5CFF",
    counter:
      "املأ الفراغ قبل أن يملأك هو. ضع البديل جاهزًا في متناول يدك قبل أن يأتي الملل بساعة.",
  },
  {
    id: "tired",
    label: "إرهاق",
    icon: BatteryLow,
    tint: "#5B8CFF",
    counter:
      "النوم ليس مكافأة بعد الإنجاز، هو شرطه. نَم بدل أن تقاوم بنصف دماغ — المقاومة المرهقة تخسر دائمًا.",
  },
  {
    id: "stress",
    label: "ضغط أو قلق",
    icon: CloudRain,
    tint: "#FF3B5C",
    counter:
      "أفرغ ما يضغطك على ورقة دقيقتين، ثم اختر أصغر بند فيها ونفّذه. القلق يتغذّى على القائمة المخفيّة.",
  },
  {
    id: "lonely",
    label: "وحدة",
    icon: Eye,
    tint: "#FF5722",
    counter:
      "اتصل بأحدهم أو انتقل إلى مكان فيه ناس. الوحدة هي الساحة المفضّلة لكل عادة تريد كسرها.",
  },
  {
    id: "people",
    label: "رفقة تجرّني",
    icon: Users,
    tint: "#10B981",
    counter:
      "جهّز جملة رفض قصيرة تقولها بلا شرح ولا اعتذار. التردّد نصف ثانية هو ما يُستغل.",
  },
  {
    id: "free",
    label: "فراغ مفاجئ",
    icon: Wind,
    tint: "#FFB020",
    counter:
      "الفراغ غير المخطّط يسلّم نفسه للعادة. احجز له بديلًا داخل الروتين بدل أن تتركه مفتوحًا.",
  },
];
const tagOf = (id) => URGE_TAGS.find((t) => t.id === id) || null;

const URGE_MOODS = [
  { id: "empty", label: "فارغ" },
  { id: "anxious", label: "قلِق" },
  { id: "angry", label: "غاضب" },
  { id: "low", label: "محبط" },
  { id: "spent", label: "منهك" },
  { id: "restless", label: "مشتّت" },
];
const moodOf = (id) => URGE_MOODS.find((m) => m.id === id) || null;

/* Bands, not hours. "أكثر ما تسقط الساعة ١١" is a trivia fact; "بعد العشاء
   إلى منتصف الليل" is a window a person can actually defend. The last band
   starts at midnight and ends at four, so nothing wraps and every hour of
   the clock lands in exactly one band. */
const HOUR_BANDS = [
  { id: "dawn", label: "من الفجر إلى الضحى", from: 4, to: 10 },
  { id: "forenoon", label: "من الضحى إلى الظهر", from: 10, to: 14 },
  { id: "afternoon", label: "من الظهر إلى المغرب", from: 14, to: 18 },
  { id: "evening", label: "من المغرب إلى العشاء", from: 18, to: 21 },
  { id: "night", label: "من العشاء إلى منتصف الليل", from: 21, to: 24 },
  { id: "small", label: "بعد منتصف الليل", from: 0, to: 4 },
];
const bandAt = (h) =>
  HOUR_BANDS.find((b) => h >= b.from && h < b.to) || HOUR_BANDS[0];
const bandOf = (id) => HOUR_BANDS.find((b) => b.id === id) || null;

const DOW_AR = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

/* Four templates, because the hardest part of this screen is the blank
   form: a user who cannot phrase his own habit writes "التسويف" and stops.
   Each preset carries the cost unit that actually fits it, a replacement
   plan written as an order, and the two numbers the estimator opens on. */
const BAD_PRESETS = [
  {
    key: "delay",
    title: "التسويف",
    costType: "time",
    bouts: 3,
    minutes: 40,
    replacement:
      "أضبط مؤقتًا على خمس دقائق وأفتح الملف فقط. إن أردت التوقف بعدها فلي ذلك.",
  },
  {
    key: "scroll",
    title: "التصفّح بلا هدف",
    costType: "time",
    bouts: 6,
    minutes: 15,
    replacement:
      "أضع الهاتف في غرفة أخرى وأشرب ماءً وأمشي دقيقتين قبل أن أعود.",
  },
  {
    key: "late",
    title: "السهر بعد منتصف الليل",
    costType: "time",
    bouts: 1,
    minutes: 90,
    replacement:
      "أطفئ الشاشات وأتوضّأ وأقرأ ورقًا عشر دقائق في السرير حتى ينام جسدي.",
  },
  {
    key: "spend",
    title: "الصرف خارج الميزانية",
    costType: "money",
    bouts: 3,
    minutes: 35,
    replacement:
      "أضع ما أريده في قائمة وأؤجّله ٢٤ ساعة. إن بقيت أريده غدًا أعيد النظر.",
  },
];


/* Whole days between two day keys. Parsed at local midnight on purpose —
   `new Date("2027-01-05")` is UTC, which rolls the count a day early for
   anyone east of Greenwich. */
const daysBetween = (fromKey, toKey = dayKey()) => {
  const a = new Date(`${fromKey}T00:00:00`);
  const b = new Date(`${toKey}T00:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  return Math.max(0, Math.round((b - a) / 86400000));
};

/* One confrontation with the urge, win or lose. `kind` is the only field
   that separates a relapse from a resisted craving, so both can be counted
   on one scale — a screen that only records the losses makes the user look
   weaker than he is, and he stops opening it. A log written before the tags
   existed keeps `tag: ""` and is simply skipped by the breakdowns. */
const urgeShape = (u, kind = "hold") => (
  (u = obj(u)),
  {
  id: u.id || uid(),
  at: typeof u.at === "string" ? u.at : dayKey(),
  kind: u.kind === "fall" || kind === "fall" ? "fall" : "hold",
  days: Number.isFinite(Number(u.days)) ? Math.max(0, Number(u.days)) : 0,
  tag: tagOf(u.tag) ? u.tag : "",
  mood: moodOf(u.mood) ? u.mood : "",
  hour: Number.isFinite(Number(u.hour))
    ? Math.min(23, Math.max(0, Math.round(Number(u.hour))))
    : null,
  dow: Number.isFinite(Number(u.dow)) ? Math.min(6, Math.max(0, Number(u.dow))) : null,
  trigger: typeof u.trigger === "string" ? u.trigger : "",
  feeling: typeof u.feeling === "string" ? u.feeling : "",
});

/* Stamped at the moment of logging, not derived later. The hour comes from
   the wall clock and the weekday from the logical day: a craving at one in
   the morning belongs to «بعد منتصف الليل» but to *yesterday's* row, which
   is exactly how the person lived it. */
const stamp = () => ({
  at: dayKey(),
  hour: new Date().getHours(),
  dow: logicalNow().getDay(),
});

/* The one place a bad habit's fields are written — add form, migration and
   import all pass through here, so the shape cannot drift between them. */
const badHabitShape = (b) => (
  (b = obj(b)),
  {
  id: b.id || uid(),
  title: typeof b.title === "string" ? b.title : "",
  startDate: typeof b.startDate === "string" ? b.startDate : dayKey(),
  costType: b.costType === "time" ? "time" : "money",
  costPerDay: Number.isFinite(Number(b.costPerDay))
    ? Math.max(0, Number(b.costPerDay))
    : 0,
  replacement: typeof b.replacement === "string" ? b.replacement : "",
  /* Falls and holds live in two arrays because they are read separately —
     the card counts the falls, the mirror counts both. */
  logs: Array.isArray(b.logs) ? b.logs.map((l) => urgeShape(l, "fall")) : [],
  urges: Array.isArray(b.urges) ? b.urges.map((u) => urgeShape(u, "hold")) : [],
});

/* Arabic counts the noun, not just the number: ٣ أيام but ٢٥ يومًا. Printing
   one fixed form next to a live counter is wrong most of the time. The four
   forms are [one, two, 3–10, 11+]. */
const arCount = (n, forms) => {
  const h = Math.abs(n) % 100;
  if (Math.abs(n) === 1) return forms[0];
  if (Math.abs(n) === 2) return forms[1];
  if (h >= 3 && h <= 10) return forms[2];
  return forms[3];
};
const DAY_FORMS = ["يوم", "يومان", "أيام", "يومًا"];
const dayWord = (n) => arCount(n, DAY_FORMS);
const MIN_FORMS = ["دقيقة", "دقيقتان", "دقائق", "دقيقة"];
const minWord = (n) => arCount(n, MIN_FORMS);
const STEP_FORMS = ["خطوة", "خطوتان", "خطوات", "خطوة"];
const stepWord = (n) => arCount(n, STEP_FORMS);
const MEET_FORMS = ["مواجهة", "مواجهتان", "مواجهات", "مواجهة"];
const meetWord = (n) => arCount(n, MEET_FORMS);
const TIMES_FORMS = ["مرة", "مرتان", "مرات", "مرة"];
const timesWord = (n) => arCount(n, TIMES_FORMS);
const FALL_FORMS = ["انتكاسة", "انتكاستان", "انتكاسات", "انتكاسة"];
const fallWord = (n) => arCount(n, FALL_FORMS);
const HOUR_FORMS = ["ساعة", "ساعتان", "ساعات", "ساعة"];
const hourWord = (n) => arCount(n, HOUR_FORMS);
const COURSE_FORMS = ["مقرّر", "مقرّران", "مقرّرات", "مقرّرًا"];
const courseWord = (n) => arCount(n, COURSE_FORMS);
const WEEK_FORMS = ["أسبوع", "أسبوعان", "أسابيع", "أسبوعًا"];
const weekWord = (n) => arCount(n, WEEK_FORMS);
const LECTURE_FORMS = ["محاضرة", "محاضرتان", "محاضرات", "محاضرة"];
const lectureWord = (n) => arCount(n, LECTURE_FORMS);

/* «قبل ٣ أيام», but «اليوم» at zero — nobody says «قبل ٠ يومًا». */
function Since({ day }) {
  const n = daysBetween(day);
  if (n === 0) return "اليوم";
  return (
    <>
      قبل{" "}
      <span dir="ltr" className="tabular-nums">
        {n}
      </span>{" "}
      {dayWord(n)}
    </>
  );
}

const cleanDays = (b) => daysBetween(b.startDate);
const bleedSaved = (b) => cleanDays(b) * (b.costPerDay || 0);
/* The longest run ever, not just the current one — a relapse log carries the
   days it cost, so the record survives the reset that ended it. */
const bestRun = (b) =>
  Math.max(cleanDays(b), ...(b.logs || []).map((l) => l.days || 0), 0);

/* --- diagnosis -------------------------------------------------------- *
 *  Everything the mirror claims is counted here and nowhere else, so the
 *  card can never drift from the numbers behind it. Each breakdown counts
 *  on its *own* denominator — an entry with a mood but no tag must not
 *  deflate the tag percentages, or the first few logs read as noise.
 * ---------------------------------------------------------------------- */
const MIRROR_MIN = 4;

const breakerEvents = (list) =>
  (list || []).flatMap((h) => [
    ...(h.logs || []).map((l) => ({ ...l, kind: "fall", habit: h.title })),
    ...(h.urges || []).map((u) => ({ ...u, kind: "hold", habit: h.title })),
  ]);

/* The commonest value of one field, with the share it holds. Returns null
   rather than a zeroed row when nothing carries the field — "٠٪ من
   مواجهاتك" is a claim about data that does not exist. */
const topShare = (rows, pick) => {
  const tally = new Map();
  rows.forEach((r) => {
    const v = pick(r);
    if (v === null || v === undefined || v === "") return;
    tally.set(v, (tally.get(v) || 0) + 1);
  });
  if (!tally.size) return null;
  const sorted = [...tally.entries()].sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((n, [, c]) => n + c, 0);
  return {
    value: sorted[0][0],
    count: sorted[0][1],
    total,
    pct: Math.round((sorted[0][1] / total) * 100),
    rows: sorted.map(([value, count]) => ({
      value,
      count,
      pct: Math.round((count / total) * 100),
    })),
  };
};

function weakSpots(list) {
  const all = breakerEvents(list);
  const falls = all.filter((e) => e.kind === "fall");
  const holds = all.filter((e) => e.kind === "hold");
  const runs = falls.map((f) => Number(f.days) || 0);

  /* A trend wants two halves to compare, and halves of fewer than four runs
     are one bad week against another. Below that it is simply not claimed —
     an app that tells you you are "تتحسّن" off two data points teaches you
     to distrust it. */
  let trend = null;
  if (runs.length >= 4) {
    const half = Math.floor(runs.length / 2);
    const mean = (xs) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
    const early = mean(runs.slice(0, half));
    const late = mean(runs.slice(half));
    if (late - early >= 1) trend = { dir: "up", early, late };
    else if (early - late >= 1) trend = { dir: "down", early, late };
    else trend = { dir: "flat", early, late };
  }

  return {
    total: all.length,
    falls: falls.length,
    holds: holds.length,
    ready: all.length >= MIRROR_MIN,
    hold: all.length ? Math.round((holds.length / all.length) * 100) : 0,
    avgRun: runs.length ? runs.reduce((a, b) => a + b, 0) / runs.length : 0,
    trend,
    tag: topShare(all, (e) => e.tag),
    /* The tag that most often *wins* — separate from the commonest tag on
       purpose. A trigger you meet ten times and survive nine is not your
       weak point; the one you meet three times and lose three is. */
    fatal: topShare(falls, (e) => e.tag),
    band: topShare(all, (e) =>
      Number.isFinite(e.hour) ? bandAt(e.hour).id : null,
    ),
    dow: topShare(all, (e) => (Number.isFinite(e.dow) ? e.dow : null)),
    mood: topShare(all, (e) => e.mood),
  };
}

/* How often a single tag ends in a fall. Printed beside the tag's bar, it
   turns a frequency list into a danger list. */
const tagFallRate = (rows, id) => {
  const met = rows.filter((e) => e.tag === id);
  if (!met.length) return null;
  const lost = met.filter((e) => e.kind === "fall").length;
  return { met: met.length, lost, pct: Math.round((lost / met.length) * 100) };
};

/* --- the guard -------------------------------------------------------- *
 *  A diagnosis nobody acts on is trivia. The mirror already knows which
 *  band of the day takes the user down; this turns that into a warning that
 *  arrives *before* the hour does, which is the only moment it can help.
 * ---------------------------------------------------------------------- */
const DANGER_MIN_HITS = 2;
const DANGER_MIN_SHARE = 35;

/* The band only counts as *the* danger hour when it holds a real share of
   the confrontations. A band that leads by one event out of nine is a
   coincidence, and a warning that fires on a coincidence is a warning the
   user learns to scroll past. */
function dangerWatch(list) {
  const w = weakSpots(list);
  if (!w.ready || !w.band) return null;
  if (w.band.count < DANGER_MIN_HITS || w.band.pct < DANGER_MIN_SHARE) return null;
  const share = w.fatal || w.tag;
  return {
    band: bandOf(w.band.value),
    pct: w.band.pct,
    tag: share ? tagOf(share.value) : null,
  };
}

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

/* Today's confrontations, for the archive row. Counted from the one place
   they live, so the calendar can never claim a day the breaker disagrees
   with. */
const breakerToday = (list, day = dayKey()) => {
  const rows = breakerEvents(list).filter((e) => e.at === day);
  return {
    holds: rows.filter((e) => e.kind === "hold").length,
    falls: rows.filter((e) => e.kind === "fall").length,
  };
};



const SEED_HABITS = [
  { id: uid(), label: "شرب ماء", group: "morning", done: false },
  { id: uid(), label: "صلاة الفجر وأذكار", group: "morning", done: false },
  ...ADDED_HABITS.filter((h) => h.group === "morning").map((h) => ({
    id: uid(),
    done: false,
    ...h,
  })),
  { id: uid(), label: "جلسة STEP — ٩٠ دقيقة", group: "morning", done: false },
  { id: uid(), label: "صلاة الظهر", group: "afternoon", done: false },
  { id: uid(), label: "قراءة", group: "afternoon", done: false, book: READ_ACTIVE },
  ...ADDED_HABITS.filter((h) => h.group === "afternoon").map((h) => ({
    id: uid(),
    done: false,
    ...h,
  })),
  ...ASR_HABITS.map((h) => ({ id: uid(), done: false, ...h })),
  ...MAGHRIB_HABITS.map((h) => ({ id: uid(), done: false, ...h })),
  ...ADDED_HABITS.filter((h) => h.group === "maghrib").map((h) => ({
    id: uid(),
    done: false,
    ...h,
  })),
  ...POSTISHA_LABELS.map((label) => ({
    id: uid(),
    label,
    group: "postisha",
    done: false,
  })),
  { id: uid(), label: "الابتعاد عن الشاشات", group: "night", done: false },
  { id: uid(), label: "تدوين", group: "night", done: false },
  { id: uid(), label: "أذكار النوم", group: "night", done: false },
];

const SEED_TASKS = [
  { id: uid(), text: "تسليم تقرير الجامعة", quadrant: "q1", today: true, done: false },
  { id: uid(), text: "مراجعة مكثفة لاختبار STEP", quadrant: "q2", today: true, done: false },
  ...ADDED_TASKS.map((t) => ({ id: uid(), today: false, done: false, ...t })),
  { id: uid(), text: "بناء صندوق الطوارئ", quadrant: "q2", today: false, done: false },
  { id: uid(), text: "الرد على الرسائل المتراكمة", quadrant: "q3", today: false, done: false },
  { id: uid(), text: "تصفّح مواقع التواصل بلا هدف", quadrant: "q4", today: false, done: false },
];

/* Every book gained a workspace in schema 10: a summary, a list of points
   with the page they came from, and a page counter. `bookShape` is the one
   place that shape is written, so the seed, the add form and the migration
   cannot drift apart. */
const bookShape = (b) => (
  (b = obj(b)),
  {
  title: "",
  author: "",
  status: "planned",
  rating: 0,
  lesson: "",
  cover: "",
  summary: "",
  notes: [],
  pages: "",
  page: "",
  finishedAt: null,
  ...b,
});

/* A habit can feed the library. `habit.book` is the link:
     null        — an ordinary habit, nothing to do with reading
     "active"    — follows whichever book is marked «أقرأه الآن»
     "<book id>" — pinned to one book, for a second reading habit
   Ticking such a habit logs a session; unticking removes today's and rolls
   the page counter back, so the log can never claim pages that were undone. */
/* The book a reading habit points at right now, or null. */
function bookForHabit(habit, books) {
  if (!habit?.book) return null;
  if (habit.book === READ_ACTIVE)
    return books.find((b) => b.status === "reading") || null;
  return books.find((b) => b.id === habit.book) || null;
}

/* `(log || [])` like every other list reader here. These two were the only
   ones that assumed an array outright, which made them the only two that
   could take the render down over a field the data layer had not filled. */
const sumPages = (log) =>
  rows(log).reduce((n, r) => n + (Number.isFinite(r.pages) ? r.pages : 0), 0);

/* Days in a row, counting back from today, on which the goal was met. A
   streak that ended yesterday still counts today — the day is not over. */
function readStreak(log, goal) {
  /* Through `rows`, not just `|| []`: it also drops a hole, so one bad
     entry cannot throw on `r.date` halfway through the walk. The local
     name avoids shadowing the helper itself. */
  const list = rows(log);
  if (!list.length || goal <= 0) return 0;
  const byDay = new Map();
  for (const r of list)
    byDay.set(r.date, (byDay.get(r.date) || 0) + (r.pages || 0));

  const d = logicalNow();
  if ((byDay.get(dayKey(d)) || 0) < goal) d.setDate(d.getDate() - 1);

  let n = 0;
  for (;;) {
    if ((byDay.get(dayKey(d)) || 0) < goal) return n;
    n += 1;
    d.setDate(d.getDate() - 1);
  }
}

/* --- the habit ledger ------------------------------------------------- *
 *  Every figure here is derived from `history` and nothing is stored twice.
 *  The archive already writes, per day, which habit ids were ticked (`done`)
 *  and which were on the roster at all (`all`) — which is exactly enough to
 *  answer «ما العادة التي أصمد عليها؟» without a second ledger that could
 *  drift out of step with the first.
 *
 *  `all` is what makes the answers honest. A habit added in November was not
 *  "missed" every day of October: it was not asked. A day whose row predates
 *  the roster is unknown, not a miss, and renders as a gap.
 * ---------------------------------------------------------------------- */
const historyIndex = (history) => {
  const by = new Map();
  for (const h of rows(history))
    if (typeof h.date === "string" && Array.isArray(h.done)) by.set(h.date, h);
  return by;
};

/* Was this habit on the roster that day? A row written before the roster was
   archived has no `all`, so it can only say "there was a day here". */
const askedOn = (row, id) =>
  !row ? false : Array.isArray(row.all) ? row.all.includes(id) : true;
const keptOn = (row, id) => !!row && row.done.includes(id);

/* Days in a row, walking back from today. A run that ended yesterday still
   stands today — the day is not over, and zeroing it at 00:00 would punish
   someone who ticks his night habits at eleven. Bounded by HISTORY_CAP: the
   walk stops at the first day with no row at all. */
function habitStreak(by, id) {
  const d = logicalNow();
  if (!keptOn(by.get(dayKey(d)), id)) d.setDate(d.getDate() - 1);
  let n = 0;
  for (;;) {
    if (!keptOn(by.get(dayKey(d)), id)) return n;
    n += 1;
    d.setDate(d.getDate() - 1);
  }
}

/* The longest run ever recorded, which outlives the streak that ended it.
   Walks the archive in date order and only treats two rows as consecutive
   when their dates genuinely are — a gap in the archive breaks the run
   rather than silently joining across it. */
function habitBest(by, id) {
  const days = [...by.keys()].filter((k) => keptOn(by.get(k), id)).sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const k of days) {
    const [y, m, d] = k.split("-").map(Number);
    const t = new Date(y, m - 1, d).getTime();
    run = prev !== null && Math.round((t - prev) / 86400000) === 1 ? run + 1 : 1;
    if (run > best) best = run;
    prev = t;
  }
  return best;
}

/* Kept out of asked, over a window of days — `0` means the whole archive.
   The denominator counts only days the habit was actually on the roster. */
function habitTally(by, id, win = 0) {
  let kept = 0;
  let asked = 0;
  for (const [k, row] of by) {
    if (win && daysBetween(k) >= win) continue;
    if (!askedOn(row, id)) continue;
    asked += 1;
    if (keptOn(row, id)) kept += 1;
  }
  return { kept, asked, pct: asked ? Math.round((kept / asked) * 100) : 0 };
}

/* The last `n` days as a strip, oldest first, for the dot grid. Three states
   and they are not interchangeable: kept, asked-and-missed, and never asked
   — drawing the third as a miss is the lie this whole file exists to avoid. */
function habitStrip(by, id, n = 30) {
  const out = [];
  const d = logicalNow();
  d.setDate(d.getDate() - (n - 1));
  for (let i = 0; i < n; i += 1) {
    const key = dayKey(d);
    const row = by.get(key);
    out.push({
      key,
      state: !askedOn(row, id) ? "off" : keptOn(row, id) ? "kept" : "missed",
    });
    d.setDate(d.getDate() + 1);
  }
  return out;
}

const SEED_BOOKS = [
  {
    id: uid(),
    title: "العادات الذرية",
    author: "جيمس كلير",
    status: "finished",
    rating: 5,
    lesson: "لا ترتقي إلى أهدافك، بل تهبط إلى مستوى أنظمتك. ابنِ النظام قبل الحلم.",
  },
  {
    id: uid(),
    title: "العمل العميق",
    author: "كال نيوبورت",
    status: "finished",
    rating: 4,
    lesson: "ساعتان بلا تشتت تهزم يومًا كاملًا مشتتًا. احمِ تركيزك كما تحمي مالك.",
  },
  {
    id: uid(),
    title: "الفوائد",
    author: "ابن القيّم",
    status: "reading",
    rating: 5,
    lesson: "القلب يصدأ كما يصدأ الحديد، وجلاؤه الذكر وتلاوة القرآن.",
  },
];

/* --- the goal, in one place ------------------------------------------- *
 *  Every goal row is written through here — seed, the add form, and the
 *  migration all go through `goalShape`, so the three can never drift apart.
 *  A goal carries more than a label now: the horizon it belongs to, the
 *  goal one horizon up that it serves, the reason it exists, an optional
 *  meter, its own milestones and a deadline.
 *
 *  Nothing here is permissive by accident. `parent` is validated for shape
 *  only; whether it points at a goal that exists, in the right horizon, is
 *  checked in `migrate` where the whole list is in hand — a shape function
 *  that can only see one row has no way to answer it.
 * ---------------------------------------------------------------------- */
/* --- the word and the vision ------------------------------------------ *
 *  One word for the arc and a paragraph under it. It sits above every goal
 *  on the screen because it is the thing the goals are for: a list of
 *  eighteen targets with no sentence explaining who they are building is a
 *  list you abandon in March. Capped because it is a motto and a paragraph,
 *  not a journal — and because every byte here shares one storage quota
 *  with the habits and the history, which never give way.
 * ---------------------------------------------------------------------- */
const WORD_MAX = 24;
const VISION_MAX = 600;
const northStarShape = (n) => {
  const o = obj(n);
  const str = (v, max) => (typeof v === "string" ? v.slice(0, max) : "");
  return { word: str(o.word, WORD_MAX), vision: str(o.vision, VISION_MAX) };
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const goalShape = (g) => {
  const o = obj(g);
  const horizon = HORIZON_IDS.has(o.horizon) ? o.horizon : "quarter";
  const num = (v, fb = 0) => (Number.isFinite(+v) && +v >= 0 ? +v : fb);
  const target = num(o.target);
  return {
    id: typeof o.id === "string" && o.id ? o.id : uid(),
    text: typeof o.text === "string" ? o.text : "",
    pillar: PILLAR_IDS.has(o.pillar) ? o.pillar : "self",
    horizon,
    /* A quarter is meaningless above the 90-day horizon and a year is
       meaningless below it, but both are stored regardless: changing a
       goal's horizon and changing it back must not lose where it sat. */
    quarter: QUARTER_IDS.has(o.quarter) ? o.quarter : currentQuarter(),
    year:
      Number.isInteger(+o.year) && +o.year >= YEAR_MIN && +o.year <= YEAR_MAX
        ? +o.year
        : GOAL_YEARS[0],
    parent: typeof o.parent === "string" && o.parent ? o.parent : null,
    why: typeof o.why === "string" ? o.why : "",
    /* A target of zero is not a broken meter, it is a goal that has none —
       a yes/no goal, scored by its milestones or its children instead. */
    target,
    current: target > 0 ? Math.min(target, num(o.current)) : num(o.current),
    unit: typeof o.unit === "string" ? o.unit.slice(0, 16) : "",
    step: num(o.step, 1) > 0 ? num(o.step, 1) : 1,
    deadline: DATE_RE.test(o.deadline) ? o.deadline : "",
    steps: rows(o.steps).map((s) => ({
      id: typeof s.id === "string" && s.id ? s.id : uid(),
      text: typeof s.text === "string" ? s.text : "",
      done: !!s.done,
    })),
    done: !!o.done,
  };
};

/* How far along a goal is, read from whatever evidence it actually has: a
   meter first, then its own milestones, then the goals one horizon down
   that serve it. An explicit «مُحقَّق» wins over all three — declaring a goal
   done is a judgement the owner is allowed to make, and a meter that reads
   94% must not argue with it.
 *
 *  The depth guard is not theoretical. The chain is three deep by design, but
 *  a hand-edited backup can point a goal at its own descendant, and without
 *  a floor the recursion would never return — a white screen that reloading
 *  cannot clear, because the payload on disk is already the bad one. */
function goalPct(goal, all, depth = 0) {
  if (goal.done) return 100;
  if (goal.target > 0)
    return Math.min(100, Math.round((goal.current / goal.target) * 100));
  if (goal.steps.length)
    return Math.round(
      (goal.steps.filter((s) => s.done).length / goal.steps.length) * 100,
    );
  if (depth < HORIZONS.length) {
    const kids = all.filter((g) => g.parent === goal.id);
    if (kids.length)
      return Math.round(
        kids.reduce((n, k) => n + goalPct(k, all, depth + 1), 0) / kids.length,
      );
  }
  return 0;
}

/* The last day a goal has. Its own deadline when it set one, otherwise the
   end of the window it lives in — a 90-day goal expires with its quarter and
   a yearly one with its December, whether or not anyone typed a date. */
function goalEnd(goal) {
  if (goal.deadline) return goal.deadline;
  if (goal.horizon === "quarter") {
    const qi = QUARTERS.findIndex((q) => q.id === goal.quarter);
    const y = goal.year || GOAL_YEARS[0];
    return fmtDay(new Date(y, (qi < 0 ? 0 : qi) * 3 + 3, 0));
  }
  if (goal.horizon === "year") return `${goal.year}-12-31`;
  return `${GOAL_YEARS[GOAL_YEARS.length - 1]}-12-31`;
}

/* Days remaining, counted from calendar boundaries rather than the clock: on
   the last day of a quarter you still have that whole day, so the floor of a
   live window is 1. Negative means the window has closed. */
function daysTo(key) {
  const [y, m, d] = key.split("-").map(Number);
  if (!Number.isFinite(y)) return null;
  const end = new Date(y, m - 1, d);
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((end - midnight) / 86400000) + 1;
}

/* --- the countdown ---------------------------------------------------- *
 *  A horizon with no clock on it is a wish. These two functions are the only
 *  place a window's span is computed, so the goals screen and the routine
 *  strip can never disagree about how much of it is left.
 * ---------------------------------------------------------------------- */

/* The first and last day of a horizon's window, as date keys. */
function windowOf(horizon, year = GOAL_YEARS[0], quarter = "q1") {
  /* The arc, not GOAL_YEARS: the run-up year is a place to file goals, not a
     fourth year of a three-year horizon. */
  if (horizon === "h3") return [`${ARC[0]}-01-01`, `${ARC[ARC.length - 1]}-12-31`];
  if (horizon === "year") return [`${year}-01-01`, `${year}-12-31`];
  const qi = Math.max(0, QUARTERS.findIndex((q) => q.id === quarter));
  return [fmtDay(new Date(year, qi * 3, 1)), fmtDay(new Date(year, qi * 3 + 3, 0))];
}

/* Where today stands inside that window. `left` counts the day you are
   standing in — on the last day of a quarter you still have that whole day,
   which is why a live window never reads zero. A window that has not opened
   yet reports its full length rather than a negative one: «لم يبدأ» is a
   different answer from «بقي يوم», and collapsing them is how a planner ends
   up telling you to hurry in a quarter that starts in March. */
function windowStand(from, to) {
  const total = Math.max(1, daysBetween(from, to) + 1);
  /* `daysTo` counts the day you are standing in, which is what «بقي» wants
     and what «يبدأ بعد» does not: a window opening tomorrow starts in one
     day, not two. The inclusive day comes back off for the start only. */
  const untilStart = daysTo(from) === null ? null : daysTo(from) - 1;
  const left = daysTo(to);
  /* A window that has not opened still reports the days to its *end*, because
     that is what «كم بقي» asks. Reporting its full span instead answered a
     question nobody had and printed «يبدأ بعد ٩٠ يومًا» three times over,
     which is a countdown that counts nothing. The start is said underneath,
     as a note, and the elapsed bar stays empty until the day arrives. */
  if (untilStart !== null && untilStart > 0)
    return {
      state: "soon",
      total,
      left: left === null ? total : Math.max(0, left),
      gone: 0,
      pct: 0,
      until: untilStart,
    };
  if (left === null || left <= 0)
    return { state: "done", total, left: 0, gone: total, pct: 100 };
  return {
    state: "live",
    total,
    left,
    gone: total - left,
    pct: Math.round(((total - left) / total) * 100),
  };
}

/* Which 90-day window the goals screen should open on: the one you are
   standing in, unless nothing is filed there yet — in which case the earliest
   window that does have goals. A planner that greets you with an empty
   quarter while your whole year is written one tab over has made you do its
   job, and the run-up months before the arc opens are exactly when that
   happens. */
function openingWindow(goals) {
  const here = new Date().getFullYear();
  const live = GOAL_YEARS.includes(here)
    ? { year: here, quarter: currentQuarter() }
    : { year: GOAL_YEARS[0], quarter: QUARTERS[0].id };
  const list = rows(goals).map(goalShape).filter((g) => g.horizon === "quarter");
  if (!list.length) return live;
  if (list.some((g) => g.year === live.year && g.quarter === live.quarter))
    return live;
  const rank = (g) => g.year * 10 + QUARTERS.findIndex((q) => q.id === g.quarter);
  const first = list.reduce((a, b) => (rank(b) < rank(a) ? b : a));
  return { year: first.year, quarter: first.quarter };
}

/* The seed, written as the tree it actually is so the links between the three
   horizons are real rather than implied. `kids` is flattened away on build —
   nothing downstream of here knows about nesting; a goal only ever knows the
   one id above it, which is what keeps a reparent from having to rewrite a
   subtree. */
const GOAL_TREE = [
  {
    text: "أكون من أهل القرآن: حفظًا وتدبّرًا وعملًا",
    pillar: "faith",
    why: "لأن كل ما بعده يُسأل عنه، وهذا وحده يبقى.",
    kids: [
      {
        text: "ختم القرآن تدبّرًا ثلاث مرّات",
        year: 2027,
        target: 3,
        unit: "ختمة",
        kids: [
          { text: "ختم القرآن تدبّرًا مرّة", quarter: "q1" },
          { text: "المحافظة على الصلوات في وقتها", quarter: "q4" },
        ],
      },
      {
        text: "حفظ جزأين إتقانًا لا كمًّا",
        year: 2027,
        target: 2,
        unit: "جزء",
        kids: [
          { text: "حفظ جزء عمّ إتقانًا", quarter: "q3" },
          { text: "قيام الليل ٣ مرّات أسبوعيًّا", quarter: "q2" },
        ],
      },
    ],
  },
  {
    text: "جسد قويّ لا يعتذر: وزن صحّي ثابت وقوّة تُرى",
    pillar: "health",
    why: "الانضباط يبدأ من الجسد — ما لا تقدر عليه بدنك لن تقدر عليه بعزمك.",
    kids: [
      {
        text: "الوصول إلى الوزن الصحّي وثباته ثلاثة أشهر",
        year: 2027,
        kids: [
          { text: "الوصول إلى وزن صحّي وثباته", quarter: "q3" },
          { text: "نوم ٧ ساعات ثابتة كل ليلة", quarter: "q2" },
        ],
      },
      {
        text: "مئتا حصّة نادي هذه السنة",
        year: 2027,
        target: 200,
        unit: "حصّة",
        step: 1,
        kids: [{ text: "نادي ٤ مرّات أسبوعيًّا بلا انقطاع", quarter: "q1" }],
      },
    ],
  },
  {
    text: "وظيفة أحبّها بدخل يكفيني ويزيد",
    pillar: "career",
    why: "الشهادة لا تُوظّف، النظام يُوظّف — وثلاث سنوات تكفي لبناء سيرة لا تُرَدّ.",
    kids: [
      {
        text: "التخرّج ثم التوظيف في وظيفة إدارية",
        year: 2027,
        kids: [
          { text: "إنهاء مشروع تخرّج يُفتخر به", quarter: "q4" },
          { text: "إرسال ٦٠ طلب توظيف مدروس", quarter: "q2", target: 60, unit: "طلب", step: 5 },
        ],
      },
      {
        text: "اجتياز STEP بتسعين أو أكثر",
        year: 2027,
        kids: [
          { text: "اجتياز اختبار STEP بدرجة عالية", quarter: "q1" },
          { text: "إتقان الإنجليزية محادثةً", quarter: "q3" },
        ],
      },
    ],
  },
  {
    text: "استقلال مالي: لا دَين، وصندوق يكفي سنة",
    pillar: "money",
    why: "المال لا يشترى به الوقت إلا إذا كان فائضًا — والفائض يُبنى، لا يُنتظر.",
    kids: [
      {
        text: "صندوق طوارئ يغطّي ستة أشهر",
        year: 2027,
        kids: [
          { text: "بناء صندوق طوارئ يغطّي ٦ أشهر", quarter: "q2" },
          { text: "ادّخار ٢٠٪ من كل دخل", quarter: "q3" },
        ],
      },
      {
        text: "مصدر دخل ثانٍ يغطّي مصاريفي الشهرية",
        year: 2027,
        kids: [{ text: "مصدر دخل ثانٍ", quarter: "q4" }],
      },
    ],
  },
  {
    text: "صحبة وأهل يُعينونني على الآخرة",
    pillar: "social",
    why: "المرء على دين خليله — وهذه الدائرة تُختار مرّة وتُحمل عمرًا.",
    kids: [
      {
        text: "صلة الرحم أسبوعيًّا بلا انقطاع",
        year: 2027,
        kids: [
          { text: "صلة الرحم أسبوعيًّا", quarter: "q1" },
          { text: "بناء دائرة صحبة صالحة", quarter: "q3" },
        ],
      },
    ],
  },
  {
    text: "عقل مقروء: مئة كتاب ولغة ثانية أتكلّمها بثقة",
    pillar: "self",
    why: "ما تقرؤه في ثلاث سنوات هو من ستكون عليه في الرابعة.",
    kids: [
      {
        text: "قراءة أربعة وعشرين كتابًا",
        year: 2027,
        target: 24,
        unit: "كتاب",
        kids: [{ text: "قراءة ٦ كتب", quarter: "q3", target: 6, unit: "كتاب" }],
      },
      {
        text: "مهارة واحدة تُتقنها إتقانًا يُدفع فيه",
        year: 2027,
        kids: [
          { text: "تعلّم مهارة جديدة كليًّا", quarter: "q4" },
          { text: "تقليل وقت الشاشات إلى ساعة يوميًّا", quarter: "q2" },
        ],
      },
    ],
  },
];

/* Walks the tree into the flat list the app stores, stamping each level with
   its horizon and each row with the id of the one above it. */
function buildGoals(tree) {
  const out = [];
  const walk = (node, depth, parent, pillar) => {
    const horizon = HORIZONS[Math.min(depth, HORIZONS.length - 1)].id;
    const row = goalShape({ ...node, horizon, parent, pillar });
    out.push(row);
    for (const kid of node.kids || []) walk(kid, depth + 1, row.id, pillar);
  };
  for (const root of tree) walk(root, 0, null, root.pillar);
  return out;
}

const SEED_GOALS = () => buildGoals(GOAL_TREE);

/* The rows a profile written before the horizons existed is topped up with:
   everything above the 90-day line, which it has none of. Matched on text so
   a user who already typed one of these never gets a second copy beside it. */
const ADDED_GOALS = () =>
  SEED_GOALS().filter((g) => g.horizon !== "quarter");

/* Which yearly goal each seeded 90-day goal was written to serve, by text.
   An existing profile's eighteen goals came from this same seed list before
   the horizons existed, so matching on text is what lets the migration wire
   the user's own rows into the tree instead of leaving them orphans beside a
   duplicate set that does have parents. */
const SEED_LINKS = (() => {
  const map = new Map();
  for (const root of GOAL_TREE)
    for (const year of root.kids || [])
      for (const q of year.kids || []) map.set(q.text, year.text);
  return map;
})();

const SEED_PROMPTS = [
  {
    title: "محاكي اختبار PMP",
    body: "تصرّف كمحاكي صارم لاختبار PMP. اطرح عليّ سؤالًا موقفيًّا صعبًا من نمط الاختبار الحقيقي، بأربعة خيارات متقاربة. لا تكشف الإجابة حتى أجيب، ثم اشرح لماذا الخيار الصحيح صحيح ولماذا كل خيار آخر خاطئ، مع ربطه بمجال المعرفة ومجموعة العمليات.",
  },
  {
    title: "بريد إدارة المرافق",
    body: "اكتب بريدًا مهنيًّا موجزًا لمدير المرافق بخصوص [الموضوع]. النبرة: محترمة وحازمة وواضحة. ابدأ بالسياق في سطر، ثم المشكلة بالأرقام، ثم الإجراء المطلوب بتاريخ محدّد. لا تزيد على ١٥٠ كلمة، ولا تستخدم عبارات إنشائية.",
  },
].map((p) => ({ id: uid(), ...p }));

const SEED_PIPELINE = [
  { title: "إنهاء اختبار PMP التجريبي الأول", lane: "todo" },
  { title: "دراسة جدوى عربة الآيس كريم", lane: "todo" },
  { title: "تحديث LinkedIn بخبرة التدريب التعاوني", lane: "doing" },
].map((c) => ({ id: uid(), ...c }));

/* ==================================================================== *
 *  CAREER — the 90-day employability masterplan
 *
 *  A diploma does not get hired; a routine does. Thirteen weeks in three
 *  phases, five missions a week, written for a business administration
 *  graduate specifically — not generic job-hunting advice.
 *
 *  Nothing here is a free-text to-do list. The schedule is generated from
 *  a start date, the company sprints are locked into order, and the two
 *  daily lists are *derived from the date* rather than reset by a rollover:
 *  a tick is stored against its own day in `career.log`, so the morning
 *  checklist is empty at dawn whether or not the app was reopened, and a
 *  streak can be counted backwards without trusting a stored counter.
 * ==================================================================== */
const CAREER_DAYS = 90;
const SKILL_TARGET = 2; // 30-minute blocks a day to bank the streak
const BLOCK_MIN = 30;
const FOLLOWUP_DAYS = 5; // an application untouched this long is overdue
const APPS_PER_MONTH = 20; // one a day on weekdays — what the morning routine asks
const CAREER_LOG_CAP = 400;
const STREAK_CEIL = 14; // where a streak stops earning more readiness

const CAREER_PHASES = [
  {
    id: "base",
    label: "التأسيس",
    span: "الأسابيع ١–٤",
    weeks: [1, 2, 3, 4],
    tint: T.sky,
    icon: GraduationCap,
    aim: "تسجيلات تعمل وحدها، وملف يمرّ أنظمة الفرز",
  },
  {
    id: "arm",
    label: "التسليح",
    span: "الأسابيع ٥–٩",
    weeks: [5, 6, 7, 8, 9],
    tint: T.violet,
    icon: Zap,
    aim: "مهارات تُدفع عليها رواتب، ومعرض أعمال يُثبتها",
  },
  {
    id: "strike",
    label: "الهجوم",
    span: "الأسابيع ١٠–١٣",
    weeks: [10, 11, 12, 13],
    tint: T.cta,
    icon: Crosshair,
    aim: "اختراق الشركات مباشرة، ثم المقابلة فالتفاوض",
  },
];

const CAREER_WEEKS = [
  {
    w: 1,
    phase: "base",
    title: "السيرة التي تمرّ الفرز",
    aim: "ملف واحد، صفحة واحدة، يقرأه النظام قبل الإنسان",
    missions: [
      "أنهِ «الأرضية» كاملة في تبويب العدّة: طاقات، تمهير، جدارة، دروب — قبل أي شيء آخر",
      "أعد كتابة السيرة في صفحة واحدة: بلا جداول ولا أعمدة ولا صورة — أنظمة الفرز تقرأها نصًّا",
      "استخرج ١٥ كلمة مفتاحية من خمسة إعلانات إدارية حقيقية، وازرعها في السيرة بصياغتها نفسها",
      "حوّل كل مهمة في السيرة إلى نتيجة برقم: «نظّمت أرشيف ٢٠٠ ملف» لا «مسؤول عن الأرشفة»",
      "اكتب سطر العنوان المهني تحت اسمك: «أخصائي إداري — تشغيل، تنسيق، تقارير»",
      "مرّر السيرة على فاحص توافق ATS مجاني، وسجّل النسبة ثم أصلح أدنى ثلاث ملاحظات",
    ],
  },
  {
    w: 2,
    phase: "base",
    title: "واجهة لينكدإن",
    aim: "أن يجدك مسؤول التوظيف قبل أن تطرق بابه",
    missions: [
      "صورة مهنية بخلفية محيّدة، وبانر يحمل تخصّصك لا منظرًا عامًّا",
      "عنوان الملف أربع كلمات مفتاحية يبحث بها الموظِّف — لا «باحث عن عمل»",
      "اكتب «نبذة» في خمسة أسطر: من أنا، ماذا أُجيد، ما الدور الذي أبحث عنه",
      "فعّل «منفتح للعمل» واضبط المسمّيات الخمسة والمدينة ونوع الدوام",
      "اطلب ثلاث توصيات مكتوبة: مشرف التدريب، أستاذ، زميل مشروع",
    ],
  },
  {
    w: 3,
    phase: "base",
    title: "سبرنت إكسل — عشر ساعات",
    aim: "المهارة الأولى التي تُسأل عنها في كل مقابلة إدارية",
    missions: [
      "‏XLOOKUP و VLOOKUP على جدول بيانات حقيقي لا على مثال من درس",
      "الجداول المحورية: استخرج ثلاثة تقارير مختلفة من ملف واحد",
      "التنسيق الشرطي والتحقق من صحة البيانات على نموذج إدخال",
      "ابنِ لوحة متابعة في ورقة واحدة: أربعة مؤشّرات ورسمان",
      "احصل على شهادة إكسل مجانية واحدة وأضفها إلى الملف والسيرة",
    ],
  },
  {
    w: 4,
    phase: "base",
    title: "خريطة السوق",
    aim: "قائمة أهداف مكتوبة بدل التقديم العشوائي",
    missions: [
      "اسرد أربعين شركة هدف في ثلاث طبقات: كبرى، متوسطة، ناشئة",
      "حدّد خمسة مسمّيات واقعية لحديث تخرّج: منسّق إداري، مساعد تنفيذي، أخصائي عمليات، منسّق مشتريات، منسّق موارد بشرية",
      "اعرف نطاق الراتب الحقيقي لكل مسمّى — رقمك في التفاوض يبدأ من هنا",
      "راجع إعلانات تمهير المفتوحة هذا الأسبوع وقدّم على كل مطابق — القبول على السرعة",
      "اصنع ملف متابعة التقديمات، وابدأه بثلاثة تقديمات مطابقة",
    ],
  },
  {
    w: 5,
    phase: "arm",
    title: "أساسيات أنظمة ERP",
    aim: "الفرق بين «يعرف إكسل» و«يعرف يشتغل على نظام»",
    missions: [
      "افهم دورة الشراء كاملة: طلب، أمر شراء، استلام، فاتورة، سداد",
      "تعلّم مصطلحات SAP وأوراكل الإدارية: مركز التكلفة، أمر الشراء، الحركة المخزنية",
      "جرّب نظامًا تجريبيًّا أو نسخة مجانية، وسجّل عشر حركات بنفسك",
      "اكتب صفحة واحدة: كيف يتدفّق مستند واحد من الطلب إلى السداد",
      "أضف «أساسيات ERP» إلى السيرة بوصف دقيق لا بمبالغة",
    ],
  },
  {
    w: 6,
    phase: "arm",
    title: "الموارد البشرية والعمليات",
    aim: "لغة الإدارة من داخلها",
    missions: [
      "اقرأ نظام العمل السعودي: ساعات العمل، الإجازات، نهاية الخدمة",
      "افهم دورة التوظيف كما يراها الموظِّف — وستكتب طلبك بعدها بشكل مختلف",
      "تعلّم مؤشّرات الأداء الإدارية: دوران الموظفين، زمن الدورة، الالتزام بالموعد",
      "ارسم خريطة إجراء واحد (Process Map) لعملية إدارية تعرفها",
      "اكتب سياسة من صفحة واحدة لإجراء متكرّر — ضعها في معرض أعمالك",
    ],
  },
  {
    w: 7,
    phase: "arm",
    title: "معرض أعمال الظلّ",
    aim: "لا أحد يوظّف وعودًا؛ الناس توظّف مخرجات",
    missions: [
      "ابنِ لوحة متابعة مشتريات أو مخزون من بيانات مُفترضة واقعية",
      "اكتب تقريرًا إداريًّا شهريًّا من صفحتين بالأرقام والتوصية",
      "اصنع نموذج متابعة طلبات داخلية قابلًا للاستخدام فعلًا",
      "ارفع المخرجات الثلاثة في مجلّد سحابي واحد برابط مباشر",
      "اربط الرابط في لينكدإن والسيرة تحت «معرض أعمال»",
    ],
  },
  {
    w: 8,
    phase: "arm",
    title: "التقارير ولوحات المتابعة",
    aim: "أن تُقرأ أرقامك في دقيقة",
    missions: [
      "تعلّم أساسيات Power BI أو Looker Studio: مصدر، علاقة، مرئية",
      "حوّل أحد تقاريرك إلى لوحة تفاعلية من صفحة واحدة",
      "اضبط قاعدة الرسم: رسم واحد، فكرة واحدة، عنوان يقول الخلاصة",
      "اكتب ملخّصًا تنفيذيًّا من خمسة أسطر لكل لوحة",
      "اعرض اللوحة على شخص غير مختص، وأصلح ما لم يفهمه في ثلاثين ثانية",
    ],
  },
  {
    w: 9,
    phase: "arm",
    title: "بنك قصص المقابلة",
    aim: "السبب الأول لرفض حديثي التخرّج: لا قصص، فقط صفات",
    missions: [
      "افتح «أسئلة المقابلة وفخاخها» في العدّة، واكتب كل قصّة وأنت تنظر إلى السؤال الذي ستُستخدَم فيه",
      "اكتب ست قصص بصيغة STAR: الموقف، المهمة، الإجراء، النتيجة برقم",
      "جهّز جواب «حدّثني عن نفسك» في تسعين ثانية واحفظ هيكله لا نصّه",
      "جهّز جواب «لماذا نحن؟» مربوطًا بشيء حقيقي عن الشركة",
      "جهّز جواب نقطة الضعف: ضعف حقيقي + ما تفعله حياله الآن",
      "سجّل نفسك بالفيديو مرّتين، واحذف من إجاباتك كل كلمة لا تضيف",
    ],
  },
  {
    w: 10,
    phase: "strike",
    title: "الهجوم المباشر",
    aim: "الوظائف المعلنة أصعب طريق؛ الطريق الأقصر رسالة مكتوبة بعناية",
    missions: [
      "افتح أول هجوم شركة من سبعة أيام في هذا التطبيق",
      "أرسل خمس رسائل نقطة ألم هذا الأسبوع — خمسًا مخصّصة لا خمسين منسوخة",
      "تابع كل رسالة بعد خمسة أيام برسالة واحدة قصيرة لا أكثر",
      "سجّل كل إرسال في لوحة التقديمات بتاريخه",
      "راجع ما لم يُرَدّ عليه، وبدّل جملة واحدة في القالب ثم أعد التجربة",
    ],
  },
  {
    w: 11,
    phase: "strike",
    title: "الشبكة البشرية",
    aim: "أكثر من نصف التعيينات تمرّ بإنسان يعرفك",
    missions: [
      "اطلب ثلاث مقابلات معرفية (١٥ دقيقة) من موظفين في أدوارك المستهدفة",
      "اسأل في كل مقابلة: ما الذي يصعب في دورك؟ ومن أنجح من رأيت فيه؟",
      "اطلب تزكية داخلية واحدة بوضوح وبلا إحراج",
      "احضر لقاءً أو ملتقى مهنيًّا واحدًا، واخرج بثلاث جهات اتصال",
      "اشكر كل من ساعدك برسالة قصيرة — الشبكة تُبنى بالمتابعة",
    ],
  },
  {
    w: 12,
    phase: "strike",
    title: "المقابلات الحقيقية",
    aim: "التحويل: من مُرشّح إلى مُختار",
    missions: [
      "أجرِ مقابلتين تجريبيتين مع شخص يصحّح لك بصراحة",
      "ابحث عن كل مقابلة: المنتج، العميل، آخر خبر، اسم من يقابلك",
      "جهّز ثلاثة أسئلة تسألها أنت — السؤال الجيّد يقلب الكرسي",
      "أرسل رسالة شكر في أربع وعشرين ساعة، تُذكّر بنقطة واحدة قلتها",
      "أرسل رسالة الشكر من بنك الرسائل خلال أربع وعشرين ساعة — يُرسلها أقلّ من ربع المتقدّمين",
      "بعد كل مقابلة اكتب: ما نجح، ما تعثّر، وما ستغيّره في التالية",
    ],
  },
  {
    w: 13,
    phase: "strike",
    title: "العرض والتفاوض",
    aim: "الراتب الأول يحدّد سقف السنوات العشر القادمة",
    missions: [
      "لا تذكر رقمًا أولًا؛ وإذا أُلزمت فاذكر نطاقًا مبنيًّا على بحث الأسبوع الرابع",
      "احسب الحزمة كاملة: الأساس، البدلات، التأمين، التدريب، مسار الترقية",
      "اطلب أربعًا وعشرين ساعة قبل القبول — دائمًا",
      "فاوض على بند واحد غير الراتب إذا أُغلق الراتب: تدريب، لقب، مرونة",
      "اطلب العرض مكتوبًا قبل أي تأكيد نهائي",
    ],
  },
];

const CAREER_WEEK_COUNT = CAREER_WEEKS.length;
const MISSION_TOTAL = CAREER_WEEKS.reduce((n, w) => n + w.missions.length, 0);
const weekOf = (w) => CAREER_WEEKS.find((x) => x.w === w) || CAREER_WEEKS[0];
const phaseOf = (id) => CAREER_PHASES.find((p) => p.id === id) || CAREER_PHASES[0];
const missionKey = (w, i) => `${w}:${i}`;

/* The seven days are fixed and run in order: research before portfolio,
   portfolio before the pitch. A sprint whose owner jumps to day 7 is just
   another cold message, which is the thing this is meant to replace. */
const SPRINT_DAYS = [
  {
    d: 1,
    label: "البحث العميق",
    icon: Search,
    tint: T.sky,
    task: "اقرأ أخبار الشركة وصفحة وظائفها وحسابها المهني، واكتب ثلاث نقاط ألم تشغيلية أو إدارية محتملة.",
    out: "ثلاث نقاط ألم مكتوبة",
  },
  {
    d: 2,
    label: "معرض الظلّ",
    icon: FileSpreadsheet,
    tint: T.violet,
    task: "ابنِ مخرجًا واحدًا يعالج أقوى نقطة ألم: نموذج متابعة، تقرير، أو خريطة إجراء — باسمهم وببياناتهم المعلنة.",
    out: "ملف واحد جاهز للإرسال",
  },
  {
    d: 3,
    label: "خريطة الهيكل",
    icon: UserSearch,
    tint: T.indigo,
    task: "اعثر على مسؤول التوظيف، ومدير الإدارة المعنيّة، وموظّف واحد في مستواك. سجّل الأسماء والمسمّيات.",
    out: "ثلاثة أسماء بمسمّياتها",
  },
  {
    d: 4,
    label: "القيمة أولًا ①",
    icon: Handshake,
    tint: T.primary,
    task: "علّق تعليقًا مهنيًّا واحدًا يضيف فكرة على منشور لهم. لا مدح، ولا طلب وظيفة.",
    out: "تعليق يُقرأ ويُتذكّر",
  },
  {
    d: 5,
    label: "القيمة أولًا ②",
    icon: Users,
    tint: T.primary,
    task: "أرسل طلب تواصل مخصّصًا لموظّف واحد في سطرين: من أنت، ولماذا دوره يهمّك. بلا أي طلب.",
    out: "طلب تواصل مخصّص",
  },
  {
    d: 6,
    label: "القيمة أولًا ③",
    icon: Megaphone,
    tint: T.primary,
    task: "انشر من عندك شيئًا يلمس مجالهم — ملاحظة أو مخرج صغير — حتى يرى اسمك في سياق العمل لا في سياق الطلب.",
    out: "منشور واحد من عندك",
  },
  {
    d: 7,
    label: "رسالة نقطة الألم",
    icon: Send,
    tint: T.cta,
    task: "أرسل الرسالة ومعها المخرج: النقطة، الحلّ، ثم طلب عشر دقائق. لا سيرة ملحقة في الرسالة الأولى.",
    out: "الرسالة مُرسلة ومسجّلة",
  },
];

/* Six blocks of half an hour. Two a day is the bar — a bar that can be met
   on a bad day is the only kind that survives ninety of them. */
const SKILL_BLOCKS = [
  {
    id: "excel",
    label: "إكسل: الجداول المحورية",
    hint: "على ملف حقيقي، لا على فيديو",
    icon: FileSpreadsheet,
    tint: T.primary,
  },
  {
    id: "erp",
    label: "أساسيات ERP / SAP",
    hint: "دورة الشراء والمخزون",
    icon: Database,
    tint: T.sky,
  },
  {
    id: "report",
    label: "كتابة التقارير والمراسلات",
    hint: "تقرير من صفحة بالأرقام",
    icon: FileText,
    tint: T.violet,
  },
  {
    id: "english",
    label: "الإنجليزية المهنية",
    hint: "مفردات المقابلة ونطقها",
    icon: Languages,
    tint: T.indigo,
  },
  {
    id: "finance",
    label: "المحاسبة للإداريين",
    hint: "ميزانية، تدفّق نقدي، مركز تكلفة",
    icon: Calculator,
    tint: T.accent,
  },
  {
    id: "present",
    label: "العرض والتقديم",
    hint: "شريحة واحدة، فكرة واحدة",
    icon: Presentation,
    tint: T.rose,
  },
];

/* The morning routine, written as instructions rather than as reminders.
 *
 *  The first version of this list was six bare imperatives — "send one
 *  connection request", "review the sector news" — and it was read, fairly,
 *  as six commands with no method: no where, no how long, no words to send.
 *  A checklist a person cannot execute without first inventing the method
 *  is not a checklist, it is a guilt generator. So every step now carries
 *  the four things that make it executable at 7am without thinking:
 *
 *    min    — how long it takes, so the whole run has a known price (45m)
 *    where  — the exact place it happens, named
 *    how    — the actual moves, in order
 *    script — the words, ready to copy, with [brackets] where you fill in
 *
 *  `core` marks the four steps that put you in front of an employer. The
 *  streak counts those four and only those four: dressing well is a good
 *  opener, but it must never be allowed to stand in for an application. */
const AM_CORE = new Set(["apply", "follow", "connect", "polish"]);
const AM_TARGET = AM_CORE.size;

const AM_ROUTINE = [
  {
    id: "dress",
    label: "البس كأنك ذاهب إلى العمل",
    min: 5,
    icon: Briefcase,
    tint: T.primary,
    where: "في بيتك، قبل فتح الجوال",
    how: [
      "ملابس العمل لا ملابس النوم — الدماغ يصدّق ما يراه في المرآة.",
      "اجلس على طاولة لا على السرير؛ المكان يحدّد جودة الساعة القادمة.",
      "ضع الجوال على الوضع الصامت حتى تنتهي الخطوات الخمس الباقية.",
    ],
    script: "",
  },
  {
    id: "news",
    label: "افتح الرادار: عشر دقائق في أخبار القطاع",
    min: 10,
    icon: Radar,
    tint: T.sky,
    where: "لينكدإن + «أخبار الأعمال السعودية» في قوقل نيوز",
    how: [
      "تابع على لينكدإن ١٥ شركة من قائمة الأربعين، فتصير أخبارهم تصلك بلا بحث.",
      "اقرأ العناوين فقط، وافتح خبرين لا أكثر.",
      "اكتب سطرًا واحدًا في «نقاط الألم» لأي شركة ظهر لها خبر: توسّع، فرع جديد، تمويل، مشكلة.",
      "هذا السطر هو مادة رسالتك اليوم — بلا رادار تكتب رسائل عامة، وبرادار تكتب رسالة لا تُهمَل.",
    ],
    script: "",
  },
  {
    id: "apply",
    label: "قدّم على وظيفة واحدة مطابقة — واحدة لا عشر",
    min: 15,
    icon: Send,
    tint: T.cta,
    where: "جدارات وطاقات للتوظيف، جدارة للحكومي، لينكدإن وبيت.كوم للخاص",
    how: [
      "اختر إعلانًا نُشر خلال ٧٢ ساعة — ما قبلها غالبًا امتلأ بمئات الطلبات.",
      "استخرج خمس كلمات من نص الإعلان نفسه، وازرعها في السيرة بصياغتها حرفيًّا قبل الإرسال.",
      "احفظ النسخة باسم الشركة. نسخة واحدة تُرسل للجميع تعني رفضًا من أنظمة الفرز قبل أن يراها إنسان.",
      "أرفق سطرين لا صفحة في خانة الرسالة — القالب جاهز تحت.",
      "سجّله فورًا في «التقديمات»، وإلا ضاع موعد المتابعة.",
    ],
    script: `السلام عليكم،

قرأت إعلانكم عن [المسمّى]، وأرى فيه ثلاث مسؤوليات أعمل عليها فعلًا: [١]، [٢]، [٣].
خريج إدارة أعمال، وأعددت [مخرج حقيقي: لوحة متابعة / تقرير / خريطة إجراء] يشبه ما يُطلب في الدور، ورابطه في السيرة.

شاكرًا لوقتكم،
[اسمك] — [جوالك]`,
  },
  {
    id: "follow",
    label: "تابع تقديمًا واحدًا عمره خمسة أيام",
    min: 5,
    icon: Mail,
    tint: T.accent,
    where: "تبويب «التقديمات» في هذا التطبيق — رادار المتابعة يختار لك",
    how: [
      "افتح رادار المتابعة وخذ الاسم الأول فيه. لا تختر بمزاجك، خذ الأقدم.",
      "رسالة واحدة قصيرة لا رسالتين، وفي نفس سلسلة البريد لا في رسالة جديدة.",
      "أضف شيئًا جديدًا في المتابعة — مخرجًا أو سطر قيمة — لا تذكيرًا مجرّدًا.",
      "اضغط «تابعت اليوم» ليعاد ضبط العدّاد.",
    ],
    script: `السلام عليكم [الاسم]،

أتابع طلبي على وظيفة [المسمّى] المُرسل في [التاريخ].
أضفت منذ ذلك الحين [مخرجًا / شهادة / مهارة] يخصّ الدور مباشرة، وهو تحت تصرّفكم.

وإن كان الدور قد أُغلق، يسعدني أن أبقى في قائمتكم لأي دور إداري قادم.

شاكرًا لكم،
[اسمك]`,
  },
  {
    id: "connect",
    label: "أرسل طلب تواصل واحدًا برسالة مخصّصة",
    min: 5,
    icon: Users,
    tint: T.violet,
    where: "لينكدإن — موظّف في دورك المستهدف، لا مدير تنفيذي",
    how: [
      "ابحث بالمسمّى + اسم الشركة، واختر من هو في مستواك أو أعلى بدرجة — هؤلاء يردّون.",
      "اضغط «تواصل» ثم «إضافة ملاحظة». الطلب بلا ملاحظة يُقبل ويُنسى.",
      "الملاحظة أقل من ٣٠٠ حرف وبلا أي طلب وظيفة — الطلب في الرسالة الأولى يحرق الباب.",
      "بعد القبول بثلاثة أيام، أرسل سؤال المقابلة المعرفية من بنك القوالب.",
    ],
    script: `السلام عليكم [الاسم]،

لفتني دورك في [الشركة]، وأنا خريج إدارة أعمال أبني مساري نحو [المسمّى المستهدف].
أتابع ما تنشره عن [مجال محدّد]، وأحببت أن أكون ضمن شبكتك.

شكرًا لك.`,
  },
  {
    id: "polish",
    label: "حسّن سطرًا واحدًا في السيرة أو لينكدإن",
    min: 5,
    icon: FileText,
    tint: T.indigo,
    where: "ملف السيرة + ملفك على لينكدإن",
    how: [
      "سطر واحد في اليوم فقط — ستّون سطرًا في الفصل، وملف يُعاد كتابته بالكامل بلا جلسة واحدة شاقّة.",
      "حوّل مهمّة إلى نتيجة برقم: «نظّمت أرشيف ٢٠٠ ملف وقلّلت زمن الاستخراج من ١٠ دقائق إلى دقيقتين».",
      "أو اسحب كلمة مفتاحية من إعلان اليوم وازرعها بصياغتها.",
      "أو احذف سطرًا لا يقول شيئًا — الحذف تحسين أيضًا.",
    ],
    script: `[فعل بصيغة الماضي] [ماذا] [لمن/أين] — [النتيجة برقم أو بنسبة].

مثال: «أعددت تقرير مشتريات شهريًّا لثلاثة أقسام، فانخفض التأخير في أوامر الشراء من ٨ أيام إلى ٣.»`,
  },
];

const AM_MINUTES = AM_ROUTINE.reduce((n, s) => n + s.min, 0);

/* ---- The Saudi ground floor -----------------------------------------
 *  The plan used to open on "rewrite your CV", which is the right second
 *  move and the wrong first one. For a Saudi business-administration
 *  graduate the first contract most often arrives through a government
 *  employment programme rather than a job board — and those programmes all
 *  need a registration that costs a single evening and then sits there
 *  working for months. Nothing else in this app pays back as much for as
 *  little, so it is a one-time checklist that goes green before week one
 *  is worth starting.
 *
 *  `link` is a hostname, not a deep path: ministry portals reorganise, and
 *  a dead deep link is worse than a name the user can search. */
const SAUDI_SETUP = [
  {
    id: "taqat",
    label: "سجّل في طاقات — بوابة هدف الوطنية",
    link: "taqat.sa",
    icon: Building2,
    tint: T.sky,
    why: "البوابة التي تُبنى عليها بقيّة البرامج. بلا حساب فيها لا تظهر لك تمهير ولا الدعم ولا المسارات.",
    how: [
      "سجّل بالنفاذ الوطني الموحّد — نفس حساب أبشر.",
      "أكمل الملف ١٠٠٪: الشهادة، التخصّص، المدينة، المسمّيات التي تقبلها.",
      "فعّل التنبيهات، فالإعلانات تُغلق بسرعة.",
    ],
  },
  {
    id: "tamheer",
    label: "قدّم على تمهير — تدريب منتهٍ بالتوظيف",
    link: "hrdf.org.sa",
    icon: GraduationCap,
    tint: T.cta,
    why: "أقصر طريق إلى أول عقد لخريج إدارة: أشهر داخل جهة حقيقية بمكافأة شهرية، وكثير من المتدرّبين يُثبَّتون. وحتى لو لم تُثبَّت، خرجت بخبرة مكتوبة تنهي سؤال «ليست لديك خبرة».",
    how: [
      "ادخل منصّة هدف ثم برنامج تمهير، وتحقّق من شروط التخرّج والمدّة.",
      "اختر الجهات حسب القطاع لا حسب القرب فقط.",
      "قدّم على كل إعلان مطابق — المنافسة على السرعة لا على المعدّل وحده.",
      "أعد الزيارة كل أسبوعين؛ الإعلانات تتجدّد ولا تُشعرك.",
    ],
  },
  {
    id: "jadara",
    label: "جهّز ملفك للوظائف الحكومية",
    link: "my.gov.sa · جدارة",
    icon: ClipboardCheck,
    tint: T.indigo,
    why: "التوظيف الحكومي يفتح في مواعيد محدّدة ويُغلق سريعًا. الجاهزية المسبقة هي الفرق بين أن تقدّم وأن تقرأ عن إعلان انتهى.",
    how: [
      "جهّز رقم الهوية ورقم الشهادة والمعدّل في ملف واحد قبل أن تبدأ.",
      "دقّق إدخال المعدّل والتخصّص — خطأ هنا يُسقط الطلب آليًّا بلا إشعار.",
      "ضع تذكيرًا شهريًّا للتحقّق من إعلان جديد.",
    ],
  },
  {
    id: "doroob",
    label: "ابدأ مسارًا في دروب — تدريب مجاني بشهادة",
    link: "doroob.sa",
    icon: BookOpenCheck,
    tint: T.violet,
    why: "شهادات معتمدة ومجانية بالعربية تملأ فراغ «المهارات» في السيرة خلال أسابيع، ويعرفها الموظِّف السعودي.",
    how: [
      "ابدأ بالمهارات الأساسية ثم مسارًا إداريًّا أو ماليًّا.",
      "أنهِ شهادة كل أسبوعين، وأضفها فورًا للسيرة وللينكدإن.",
      "احفظ ملفات الشهادات في نفس مجلّد معرض الأعمال.",
    ],
  },
  {
    id: "linkedin",
    label: "أكمل لينكدإن إلى ١٠٠٪ وفعّل «منفتح للعمل»",
    link: "linkedin.com",
    icon: Users,
    tint: T.primary,
    why: "أكثر من نصف التعيينات في القطاع الخاص تمرّ بإنسان. الملف الناقص لا يظهر في بحث الموظِّفين أصلًا.",
    how: [
      "صورة بخلفية محيّدة، وعنوان من أربع كلمات مفتاحية لا «باحث عن عمل».",
      "فعّل «منفتح للعمل» واضبط خمسة مسمّيات والمدينة ونوع الدوام.",
      "اطلب ثلاث توصيات مكتوبة: مشرف التدريب، أستاذ، زميل مشروع.",
    ],
  },
  {
    id: "boards",
    label: "فعّل منصّتي توظيف خاصّتين لا عشرًا",
    link: "bayt.com · wadhefa.com",
    icon: Search,
    tint: T.accent,
    why: "القطاع الخاص ينشر خارج المنصّات الحكومية. حسابان يكفيان؛ العشرة تشتّت ولا تزيد الفرص.",
    how: [
      "ارفع السيرة بصيغة PDF نصّيّة لا صورة ممسوحة.",
      "اضبط تنبيهًا يوميًّا لثلاثة مسمّيات في مدينتك.",
      "راجع التنبيه في دقائق الرادار الصباحية لا طوال اليوم.",
    ],
  },
  {
    id: "portfolio",
    label: "افتح مجلّد معرض الأعمال برابط واحد",
    link: "Google Drive · OneDrive",
    icon: FileSpreadsheet,
    tint: T.rose,
    why: "الشهادة يملكها كل منافس، والمخرج لا يملكه إلا من صنعه. الرابط هو ما يحوّل سيرتك من ادّعاء إلى دليل.",
    how: [
      "مجلّد واحد، وصلاحية «أي شخص لديه الرابط يطّلع».",
      "ثلاثة ملفات تكفي للبداية: لوحة متابعة، تقرير من صفحتين، خريطة إجراء.",
      "ضع الرابط في السيرة وفي لينكدإن تحت «معرض أعمال».",
    ],
  },
  {
    id: "cv",
    label: "ثبّت نسخة السيرة الأساسية بصيغة تمرّ الفرز",
    link: "ملف واحد تُشتقّ منه البقيّة",
    icon: FileText,
    tint: T.indigo,
    why: "كل تقديم ينسخ من هذه النسخة ويعدّل فيها خمس كلمات. بلا نسخة أساسية ستعيد البناء من الصفر كل مرّة، وستتوقّف بعد أسبوع.",
    how: [
      "صفحة واحدة، بلا جداول ولا أعمدة ولا صورة — أنظمة الفرز تقرأ النص فقط.",
      "عناوين قياسية: الخبرة، التعليم، المهارات، الشهادات.",
      "مرّرها على فاحص توافق ATS مجاني وأصلح أدنى ثلاث ملاحظات.",
    ],
  },
];

const SETUP_TOTAL = SAUDI_SETUP.length;

/* ---- The words ------------------------------------------------------
 *  Every point in this hunt where a person freezes is a point where they
 *  do not know what to write. Nine of them, written out, with [brackets]
 *  to fill — and each kept short enough to edit in a minute, because a
 *  template that still reads as a template after it is sent does more
 *  damage than sending nothing at all. */
const TEMPLATES = [
  {
    id: "cover",
    label: "رسالة التغطية القصيرة",
    when: "مع كل تقديم — سطران لا صفحة",
    icon: Send,
    tint: T.cta,
    body: "السلام عليكم،\n\nقرأت إعلانكم عن [المسمّى]، وأرى فيه ثلاث مسؤوليات أعمل عليها فعلًا: [١]، [٢]، [٣].\nخريج إدارة أعمال، وأعددت [مخرجًا حقيقيًّا] يشبه ما يُطلب في الدور، ورابطه في السيرة.\n\nشاكرًا لوقتكم،\n[اسمك] — [جوالك]",
  },
  {
    id: "followup",
    label: "متابعة بعد التقديم",
    when: "بعد خمسة أيام من الإرسال، مرّة واحدة",
    icon: Mail,
    tint: T.accent,
    body: "السلام عليكم [الاسم]،\n\nأتابع طلبي على وظيفة [المسمّى] المُرسل في [التاريخ].\nأضفت منذ ذلك الحين [مخرجًا / شهادة / مهارة] يخصّ الدور مباشرة، وهو تحت تصرّفكم.\n\nوإن كان الدور قد أُغلق، يسعدني أن أبقى في قائمتكم لأي دور إداري قادم.\n\nشاكرًا لكم،\n[اسمك]",
  },
  {
    id: "connect",
    label: "طلب تواصل على لينكدإن",
    when: "أقل من ٣٠٠ حرف، وبلا أي طلب وظيفة",
    icon: Users,
    tint: T.violet,
    body: "السلام عليكم [الاسم]،\n\nلفتني دورك في [الشركة]، وأنا خريج إدارة أعمال أبني مساري نحو [المسمّى المستهدف].\nأتابع ما تنشره عن [مجال محدّد]، وأحببت أن أكون ضمن شبكتك.\n\nشكرًا لك.",
  },
  {
    id: "coffee",
    label: "طلب مقابلة معرفية",
    when: "بعد قبول طلب التواصل بثلاثة أيام",
    icon: MessageSquare,
    tint: T.sky,
    body: "السلام عليكم [الاسم]،\n\nشكرًا على القبول. أنا في بداية مساري الإداري، وأحاول أن أفهم الدور من داخله لا من إعلانات الوظائف.\nهل تتيح لك ظروفك خمس عشرة دقيقة هذا الأسبوع؟ ثلاثة أسئلة فقط:\nما الذي يصعب فعلًا في دورك؟ وما المهارة التي تمنّيت لو أتقنتها قبل أن تبدأ؟ وما الذي يميّز من نجح عندكم؟\n\nولن أطلب منك وظيفة — أطلب رأيك فقط.\n\n[اسمك]",
  },
  {
    id: "referral",
    label: "طلب تزكية داخلية",
    when: "بعد محادثة حقيقية، لا مع غريب",
    icon: Handshake,
    tint: T.primary,
    body: "السلام عليكم [الاسم]،\n\nشكرًا على وقتك الأسبوع الماضي، وقد غيّر ما ذكرته عن [شيء محدّد] فهمي للدور.\nرأيت أن [الشركة] أعلنت عن [المسمّى]، وأظنّني مطابقًا لـ[سببين محدّدين].\n\nهل تتيح لك الأنظمة تزكيتي داخليًّا؟ وإن كان في الطلب أي حرج فتجاوزه بلا تردّد — تواصلنا أهمّ عندي.\n\nالسيرة مرفقة، ورابط أعمالي: [الرابط].\n\n[اسمك]",
  },
  {
    id: "thanks",
    label: "شكر بعد المقابلة",
    when: "خلال أربع وعشرين ساعة — يُرسله أقلّ من الربع",
    icon: BadgeCheck,
    tint: T.primary,
    body: "السلام عليكم [الاسم]،\n\nشكرًا على وقتك اليوم. بقي في ذهني ما ذكرته عن [نقطة حقيقية من المقابلة].\nفكّرت فيها بعد اللقاء، وأرى أن [فكرتك أنت في سطرين] قد تساعد — وإن أحببتم، أرسل تصوّرًا من صفحة واحدة.\n\nمتحمّس للدور، وفي انتظار ما تستقرّون عليه.\n\n[اسمك]",
  },
  {
    id: "silent",
    label: "متابعة بعد المقابلة بلا ردّ",
    when: "بعد سبعة أيام من الموعد الذي وُعدت به",
    icon: Phone,
    tint: T.sky,
    body: "السلام عليكم [الاسم]،\n\nأتابع مقابلة [المسمّى] يوم [التاريخ]. أعلم أن القرارات تأخذ وقتها ولا أريد أن أستعجلكم.\nأودّ فقط أن أعرف إن كان المسار ما زال مفتوحًا حتى أرتّب بقيّة ارتباطاتي.\n\nوشاكرًا لك في الحالين.\n\n[اسمك]",
  },
  {
    id: "salary",
    label: "الردّ على سؤال الراتب",
    when: "حين يُطلب رقمك قبل أن يُعرض عليك شيء",
    icon: HandCoins,
    tint: T.accent,
    body: "سؤال مهمّ، وأفضّل أن أفهم نطاق المسؤوليات أولًا حتى يكون الرقم عادلًا للطرفين.\n\nوإن كان لا بدّ من رقم الآن: بحثي عن هذا الدور في [المدينة] يضع النطاق بين [أدنى] و[أعلى] ريال شهريًّا، وأنا مرتاح داخله حسب الحزمة كاملة.\n\nفما النطاق المعتمد لديكم لهذه الدرجة؟",
  },
  {
    id: "offer",
    label: "طلب مهلة على العرض",
    when: "دائمًا — القبول الفوري يُضعف موقفك ولا يسرّع شيئًا",
    icon: Award,
    tint: T.rose,
    body: "شكرًا جزيلًا، وسعيد بثقتكم.\n\nهل أستلم العرض مكتوبًا بتفاصيل الحزمة: الأساس، البدلات، التأمين، أيام الإجازة، ومسار الترقية؟\nوأرجو مهلة أربع وعشرين ساعة لأراجعه مراجعة تليق بقرار كهذا، وأعود لكم غدًا بإجابة واضحة.\n\n[اسمك]",
  },
];

/* The eight questions that decide a fresh graduate's interview, each with
   the trap it hides. They sit beside the story bank so the six STAR
   stories get written against real questions instead of in a vacuum. */
const INTERVIEW_QS = [
  {
    q: "حدّثني عن نفسك",
    trap: "سرد السيرة من الولادة. المطلوب تسعون ثانية: من أنت الآن، ماذا تُجيد بدليل، أي دور تريد ولماذا هم.",
  },
  {
    q: "لماذا نحن تحديدًا؟",
    trap: "«شركة رائدة ولها سمعة طيّبة» تعني أنك لم تبحث. اذكر شيئًا حدث عندهم هذا العام وصِله بما تريد تعلّمه.",
  },
  {
    q: "ما أكبر نقطة ضعف فيك؟",
    trap: "«أنا مثاليّ في عملي» إجابة محروقة. ضعف حقيقي لا يقتل الدور، ثم ما تفعله حياله الآن بالتحديد.",
  },
  {
    q: "ليست لديك خبرة — لماذا نوظّفك؟",
    trap: "لا تعتذر ولا تدافع. انقل الحديث إلى مخرج صنعته: «أعددت هذا، وهو أقرب ما يكون لما يُطلب في الدور».",
  },
  {
    q: "حدّثني عن موقف عملت فيه تحت ضغط",
    trap: "صفات بلا قصّة. اسحب قصّة جاهزة من بنك القصص، وأنهِها برقم.",
  },
  {
    q: "خلاف مع زميل أو مشرف — كيف تصرّفت؟",
    trap: "«لم يحدث لي خلاف» يُقرأ تهرّبًا. اذكر خلافًا مهنيًّا، وركّز على ما فعلتَ أنت لا على خطأ الآخر.",
  },
  {
    q: "أين ترى نفسك بعد خمس سنوات؟",
    trap: "طموح معلّق في الهواء، أو طموح يتجاوز الشركة نفسها. اربطه بمسار موجود عندهم فعلًا.",
  },
  {
    q: "هل لديك أسئلة لنا؟",
    trap: "«لا، كل شيء واضح» أسوأ إجابة في المقابلة كلها. ثلاثة أسئلة جاهزة دائمًا: كيف يبدو النجاح في أول تسعين يومًا؟ ما أصعب ما في الدور؟ مع من سأعمل يوميًّا؟",
  },
];

const APP_STAGES = [
  { id: "sent", label: "مُرسَل", tint: T.indigo },
  { id: "touch", label: "تمت المتابعة", tint: T.sky },
  { id: "screen", label: "فرز هاتفي", tint: T.violet },
  { id: "intv", label: "مقابلة", tint: T.accent },
  { id: "offer", label: "عرض", tint: T.primary },
  { id: "closed", label: "مُغلَق", tint: T.rose },
];
const OPEN_STAGES = new Set(["sent", "touch", "screen", "intv"]);
const stageOf = (id) => APP_STAGES.find((s) => s.id === id) || APP_STAGES[0];

/* One place each career row's fields are written — add form, migration and
   import all pass through here, so the shape cannot drift between them. */
const sprintShape = (s) => (
  (s = obj(s)),
  {
  id: s.id || uid(),
  company: typeof s.company === "string" ? s.company : "",
  role: typeof s.role === "string" ? s.role : "",
  startedAt: typeof s.startedAt === "string" ? s.startedAt : dayKey(),
  pain: typeof s.pain === "string" ? s.pain : "",
  solution: typeof s.solution === "string" ? s.solution : "",
  contact: typeof s.contact === "string" ? s.contact : "",
  days: s.days && typeof s.days === "object" ? s.days : {},
  notes: s.notes && typeof s.notes === "object" ? s.notes : {},
});

const appShape = (a) => (
  (a = obj(a)),
  {
  id: a.id || uid(),
  company: typeof a.company === "string" ? a.company : "",
  role: typeof a.role === "string" ? a.role : "",
  stage: APP_STAGES.some((s) => s.id === a.stage) ? a.stage : "sent",
  sentAt: typeof a.sentAt === "string" ? a.sentAt : dayKey(),
  touchedAt: typeof a.touchedAt === "string" ? a.touchedAt : null,
  note: typeof a.note === "string" ? a.note : "",
});

const storyShape = (s) => (
  (s = obj(s)),
  {
  id: s.id || uid(),
  title: typeof s.title === "string" ? s.title : "",
  situation: typeof s.situation === "string" ? s.situation : "",
  task: typeof s.task === "string" ? s.task : "",
  action: typeof s.action === "string" ? s.action : "",
  result: typeof s.result === "string" ? s.result : "",
});

const careerShape = (c) => (
  (c = obj(c)),
  {
  startedAt: typeof c.startedAt === "string" ? c.startedAt : null,
  /* The one-time Saudi registrations. An object keyed by id rather than an
     array of done ids, so adding a row later cannot shift anyone's ticks. */
  setup: c.setup && typeof c.setup === "object" ? c.setup : {},
  missions: c.missions && typeof c.missions === "object" ? c.missions : {},
  sprints: Array.isArray(c.sprints) ? c.sprints.map(sprintShape) : [],
  apps: Array.isArray(c.apps) ? c.apps.map(appShape) : [],
  stories: Array.isArray(c.stories) ? c.stories.map(storyShape) : [],
  log: Array.isArray(c.log) ? c.log : [],
});

const careerDayNo = (c) =>
  c.startedAt ? Math.min(CAREER_DAYS, daysBetween(c.startedAt) + 1) : 0;
const careerWeekNo = (c) =>
  c.startedAt
    ? Math.min(CAREER_WEEK_COUNT, Math.floor(daysBetween(c.startedAt) / 7) + 1)
    : 1;

const missionsIn = (missions, weeks) =>
  weeks.reduce(
    (n, w) => n + weekOf(w).missions.filter((_, i) => missions[missionKey(w, i)]).length,
    0,
  );
const missionCount = (weeks) =>
  weeks.reduce((n, w) => n + weekOf(w).missions.length, 0);

/* Today's row in the career log. Read by date, never by a reset — which is
   what makes the two daily lists correct at 00:01 without any rollover. */
const careerToday = (log) => (log || []).find((e) => e.date === dayKey()) || {};

/* Merged like a history row: the day carries both daily lists, so writing
   one must never drop the other. */
function toggleDaily(log, field, id) {
  const today = dayKey();
  const prev = (log || []).find((e) => e.date === today);
  const rest = (log || []).filter((e) => e.date !== today);
  const have = prev?.[field] || [];
  return [
    ...rest,
    {
      ...prev,
      date: today,
      [field]: have.includes(id) ? have.filter((x) => x !== id) : [...have, id],
    },
  ].slice(-CAREER_LOG_CAP);
}

/* Days in a row that cleared `need`. A run whose last qualifying day was
   yesterday still counts today — the day is not over, and zeroing it at
   dawn would punish someone who studies in the evening. */
function dailyStreak(log, field, need, only) {
  const count = (e) =>
    only ? (e[field] || []).filter((id) => only.has(id)).length : (e[field] || []).length;
  const met = new Set((log || []).filter((e) => count(e) >= need).map((e) => e.date));
  if (!met.size) return 0;
  const d = logicalNow();
  if (!met.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (met.has(dayKey(d))) {
    n += 1;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

const setupDone = (c) => SAUDI_SETUP.filter((x) => (c.setup || {})[x.id]).length;
const amCoreDone = (am) => (am || []).filter((id) => AM_CORE.has(id)).length;

const sprintDone = (sp) => SPRINT_DAYS.filter((d) => sp.days[d.d]).length;
/* Locked in order: a day opens when every day before it is ticked. */
const sprintOpenDay = (sp) => {
  for (const d of SPRINT_DAYS) if (!sp.days[d.d]) return d.d;
  return 0;
};
const needsFollowUp = (a) =>
  OPEN_STAGES.has(a.stage) && daysBetween(a.touchedAt || a.sentAt) >= FOLLOWUP_DAYS;

/* The composite: six measures of whether this week actually moved you
   closer to a contract. Plan progress is scored against the weeks you have
   *reached*, not against all ninety days — otherwise day three reads 2%
   however perfectly it went, and a score nobody can move is a score nobody
   looks at. */
const READINESS = [
  { id: "setup", label: "المنصّات والبرامج", max: 15, tint: T.sky },
  { id: "plan", label: "خطة التسعين يومًا", max: 25, tint: T.cta },
  { id: "apps", label: "تقديمات ٣٠ يومًا", max: 20, tint: T.indigo },
  { id: "skill", label: "سلسلة الحصص", max: 15, tint: T.primary },
  { id: "am", label: "روتين الصباح", max: 10, tint: T.accent },
  { id: "sprint", label: "هجمات الشركات", max: 8, tint: T.violet },
  { id: "story", label: "بنك القصص", max: 7, tint: T.rose },
];

function readiness(c) {
  const live = careerWeekNo(c);
  const reached = CAREER_WEEKS.filter((w) => w.w <= live).map((w) => w.w);
  const planTotal = missionCount(reached);
  const share = (hit, cap) => Math.min(1, cap ? hit / cap : 0);

  const sent30 = (c.apps || []).filter((a) => daysBetween(a.sentAt) <= 30).length;
  const attacks = (c.sprints || []).reduce((n, s) => n + sprintDone(s), 0);

  const parts = {
    setup: share(setupDone(c), SETUP_TOTAL),
    plan: c.startedAt ? share(missionsIn(c.missions, reached), planTotal) : 0,
    skill: share(dailyStreak(c.log, "skills", SKILL_TARGET), STREAK_CEIL),
    apps: share(sent30, APPS_PER_MONTH),
    am: share(dailyStreak(c.log, "am", AM_TARGET, AM_CORE), STREAK_CEIL),
    sprint: share(attacks, SPRINT_DAYS.length * 2),
    story: share((c.stories || []).length, 6),
  };

  const rows = READINESS.map((r) => ({
    ...r,
    got: Math.round(parts[r.id] * r.max),
  }));
  return { rows, total: rows.reduce((n, r) => n + r.got, 0) };
}

/* The day-7 message, assembled from what the sprint already knows. A blank
   field leaves its bracket in place so the gap is obvious before sending. */
const sprintPitch = (sp) =>
  [
    `السلام عليكم ${sp.contact || ""}،`.replace(/ ،$/, "،"),
    "",
    `لاحظت أن ${sp.company || "[الشركة]"} ${sp.pain || "[نقطة الألم]"}.`,
    `أعددت ${sp.solution || "[المخرج]"} على بياناتكم المعلنة، وهو بين يديكم بلا أي التزام.`,
    "",
    `أنا خريج إدارة أعمال، وأبحث عن دور ${sp.role || "إداري"} أُكمل فيه هذا العمل من داخل الفريق.`,
    "المخرج مرفق — وإن رأيتم فيه قيمة، يسعدني لقاء عشر دقائق.",
    "",
    "شاكرًا لوقتكم،",
  ].join("\n");

/* ==================================================================== *
 *  CALENDAR — the months and the years
 *
 *  The routine screen owns today and the quarters own the year's goals;
 *  neither can answer «متى الاختبار؟». That is what this is for: a dated
 *  square you can put something important on, months or years ahead, and
 *  find again without having to remember it.
 * ==================================================================== */

/* Day keys are calendar squares, not instants, and every helper here parses
   them at LOCAL midnight. `new Date("2027-01-05")` is read as UTC and lands
   on the 4th for anyone east of Greenwich — which is all of the Gulf, every
   day of the year. */
const keyToDate = (ds) => {
  const [y, m, d] = String(ds || "").split("-").map(Number);
  if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const x = new Date(y, m - 1, d);
  /* Rejects 31 February outright instead of quietly accepting it as the
     3rd of March, which is how an invalid date becomes a wrong one. */
  if (x.getFullYear() !== y || x.getMonth() !== m - 1 || x.getDate() !== d)
    return null;
  return x;
};

const isKey = (ds) => !!keyToDate(ds);

const addDays = (ds, n) => {
  const d = keyToDate(ds);
  if (!d) return ds;
  return fmtDay(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));
};

/* Signed, unlike `daysBetween`, which floors at zero for the streak
   counters. A calendar needs the sign: «متأخر ٣ أيام» and «بعد ٣ أيام» are
   opposite facts, and clamping collapses them into the same number. */
const daysUntil = (ds, fromKey = dayKey()) => {
  const a = keyToDate(fromKey);
  const b = keyToDate(ds);
  if (!a || !b) return null;
  return Math.round((b - a) / 86400000);
};

/* "HH:MM" or nothing at all. A half-typed time is worse than no time: it
   sorts wrongly and then renders as a lie, so anything that is not a real
   clock reading is dropped on the way into state. */
const hhmm = (v, fallback = "") => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(v || "").trim());
  if (!m) return fallback;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return fallback;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
};

const minsOf = (t) => {
  const v = hhmm(t);
  if (!v) return null;
  const [h, m] = v.split(":").map(Number);
  return h * 60 + m;
};

const nowMins = (d = new Date()) => d.getHours() * 60 + d.getMinutes();

/* 14:30 → «٢:٣٠ م». A 24-hour clock is what gets typed; a 12-hour one is
   what gets read. */
const prettyTime = (t) => {
  const v = hhmm(t);
  if (!v) return "";
  const [h, m] = v.split(":").map(Number);
  const suffix = h < 12 ? "ص" : "م";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
};

const clampNum = (v, min, max, fallback) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

/* A link the app is willing to put in an `href`, or nothing.
 *
 *  Only http and https pass. `javascript:` in an href runs as the page when
 *  it is clicked, and this field is reachable through an imported backup —
 *  a file the app already treats as untrusted. A bare «blackboard.ksu.edu.sa»
 *  is what people actually paste, so a missing scheme is filled in rather
 *  than refused. */
const safeUrl = (v) => {
  const raw = String(v || "").trim();
  if (!raw) return "";
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withScheme);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : "";
  } catch {
    return "";
  }
};

const EVENT_KINDS = [
  { id: "exam", label: "اختبار", icon: GraduationCap, tint: "#FF3B5C" },
  { id: "deadline", label: "موعد تسليم", icon: ClipboardList, tint: "#FF7A45" },
  { id: "class", label: "محاضرة أو دورة", icon: Presentation, tint: "#00C2FF" },
  { id: "meet", label: "مقابلة أو اجتماع", icon: Handshake, tint: "#5B8CFF" },
  { id: "money", label: "استحقاق مالي", icon: HandCoins, tint: "#FFB020" },
  { id: "social", label: "مناسبة", icon: Sparkles, tint: "#FF4D8D" },
  { id: "travel", label: "سفر", icon: Rocket, tint: "#9D5CFF" },
  { id: "note", label: "تذكير", icon: NotebookPen, tint: "#10B981" },
];
const kindOf = (id) =>
  EVENT_KINDS.find((k) => k.id === id) || EVENT_KINDS[EVENT_KINDS.length - 1];

const REPEATS = [
  { id: "none", label: "مرّة واحدة", short: "" },
  { id: "weekly", label: "كل أسبوع", short: "أسبوعي" },
  { id: "monthly", label: "كل شهر", short: "شهري" },
  { id: "yearly", label: "كل سنة", short: "سنوي" },
];
const repeatOf = (id) => REPEATS.find((r) => r.id === id) || REPEATS[0];

/* How many days before the square itself the entry starts warning. Zero
   means it only speaks on the day — which for an exam is far too late. */
const WARN_CHOICES = [0, 1, 3, 7, 14, 30];

const eventShape = (e) => (
  (e = obj(e)),
  {
  id: e.id || uid(),
  title: typeof e.title === "string" ? e.title : "",
  date: isKey(e.date) ? e.date : dayKey(),
  time: hhmm(e.time),
  kind: EVENT_KINDS.some((k) => k.id === e.kind) ? e.kind : "note",
  repeat: REPEATS.some((r) => r.id === e.repeat) ? e.repeat : "none",
  /* An open-ended weekly entry is a legitimate thing to want, so `null`
     here is a real value and not a missing one. */
  until: isKey(e.until) ? e.until : null,
  place: typeof e.place === "string" ? e.place : "",
  note: typeof e.note === "string" ? e.note : "",
  warn: WARN_CHOICES.includes(Number(e.warn)) ? Number(e.warn) : 0,
  /* Per occurrence, not one flag: a weekly entry ticked this Sunday must
     still be waiting next Sunday, and a boolean cannot say that. */
  doneOn: Array.isArray(e.doneOn)
    ? e.doneOn.filter((d) => typeof d === "string" && isKey(d))
    : [],
});

/* Every square an entry lands on inside a window — the only real
   arithmetic on this screen, so it is written once and read everywhere.
 *
 *  Bounded by the window at BOTH ends on purpose: walking forward from the
 *  start date would cost a weekly entry from 2019 three hundred iterations
 *  to draw one month, and the year view asks for twelve months at a time.
 *
 *  A monthly entry on the 31st is SKIPPED in a thirty-day month rather than
 *  pulled back onto the 30th, and 29 February exists only in a leap year.
 *  Moving a due date silently is the one thing a calendar must never do.
 */
function occurrences(ev, fromKey, toKey) {
  const start = keyToDate(ev.date);
  const from = keyToDate(fromKey);
  const to = keyToDate(toKey);
  if (!start || !from || !to || to < from) return [];
  const stop = ev.until ? keyToDate(ev.until) : null;
  const last = stop && stop < to ? stop : to;
  if (last < from || last < start) return [];
  const out = [];
  const at = (y, m, d) => new Date(y, m, d);

  if (ev.repeat === "weekly") {
    let x = start;
    if (x < from) {
      const weeks = Math.ceil((from - x) / (7 * 86400000));
      x = at(start.getFullYear(), start.getMonth(), start.getDate() + weeks * 7);
    }
    for (; x <= last; x = at(x.getFullYear(), x.getMonth(), x.getDate() + 7))
      out.push(fmtDay(x));
    return out;
  }

  if (ev.repeat === "monthly") {
    const dom = start.getDate();
    let y = from > start ? from.getFullYear() : start.getFullYear();
    let m = from > start ? from.getMonth() : start.getMonth();
    for (;;) {
      if (at(y, m, 1) > last) break;
      const dim = at(y, m + 1, 0).getDate();
      if (dom <= dim) {
        const d = at(y, m, dom);
        if (d >= from && d >= start && d <= last) out.push(fmtDay(d));
      }
      m += 1;
      if (m > 11) {
        m = 0;
        y += 1;
      }
    }
    return out;
  }

  if (ev.repeat === "yearly") {
    const mo = start.getMonth();
    const dom = start.getDate();
    for (let y = from.getFullYear(); y <= last.getFullYear(); y++) {
      if (dom > at(y, mo + 1, 0).getDate()) continue; // 29 Feb, common year
      const d = at(y, mo, dom);
      if (d >= from && d >= start && d <= last) out.push(fmtDay(d));
    }
    return out;
  }

  if (start >= from && start <= last) out.push(ev.date);
  return out;
}

const isEventDone = (ev, on) => (ev.doneOn || []).includes(on);

/* Timed entries first in clock order, then the day's untimed reminders.
   Sorting "" as a time would float them all to dawn. */
const byClock = (a, b) => {
  const x = minsOf(a.ev.time);
  const y = minsOf(b.ev.time);
  if (x === null && y === null) return 0;
  if (x === null) return 1;
  if (y === null) return -1;
  return x - y;
};

/* date key → the occurrences landing on it, across one window. */
function eventsIn(list, fromKey, toKey) {
  const map = new Map();
  for (const ev of list || [])
    for (const on of occurrences(ev, fromKey, toKey)) {
      const row = map.get(on);
      if (row) row.push({ ev, on });
      else map.set(on, [{ ev, on }]);
    }
  for (const row of map.values()) row.sort(byClock);
  return map;
}

/* What is coming, flattened and ordered — including anything still unticked
   behind today, because an overdue entry that scrolls out of sight is an
   entry the calendar failed to carry. A ticked past occurrence is done and
   drops out.

   The backlog runs a year and a half rather than two months: a one-off
   deadline from last spring that was never ticked used to fall out of the
   window and then existed nowhere on the screen — still counted in «كل
   المواعيد», still absent from every list. Silence is the one thing an
   overdue entry must not get. */
const UPCOMING_AHEAD = 365;
const UPCOMING_BACKLOG = 540;

function upcoming(list, days = UPCOMING_AHEAD, backlog = UPCOMING_BACKLOG) {
  const today = dayKey();
  const from = addDays(today, -backlog);
  const to = addDays(today, days);
  const out = [];
  for (const ev of list || [])
    for (const on of occurrences(ev, from, to)) {
      if (on < today && isEventDone(ev, on)) continue;
      out.push({ ev, on });
    }
  out.sort((a, b) => (a.on === b.on ? byClock(a, b) : a.on < b.on ? -1 : 1));
  return out;
}

/* The same list, one row per entry instead of one per occurrence.
 *
 *  A weekly class expanded over a year is fifty rows that say the same
 *  thing, and they bury every other entry — the list stops being a list of
 *  what is coming and becomes a printout of one repetition. So a repeating
 *  entry shows the occurrence that actually needs attention (the oldest
 *  overdue one if it has any, otherwise the next) and carries a count of
 *  the rest. Nothing is hidden: every occurrence is still on the grid, and
 *  this is the summary view of it.
 */
function upcomingRows(list) {
  const rows = upcoming(list);
  const seen = new Map();
  for (const r of rows) {
    const at = seen.get(r.ev.id);
    if (at) at.more += 1;
    else seen.set(r.ev.id, { ...r, more: 0 });
  }
  /* `rows` is already in date order and the first hit per entry is kept,
     so each survivor is that entry's earliest pending occurrence. */
  return [...seen.values()].sort((a, b) =>
    a.on === b.on ? byClock(a, b) : a.on < b.on ? -1 : 1,
  );
}

/* The entries whose warning window is open today and that are not ticked.
   `warn` is days-before, so an exam set to warn at seven starts speaking a
   week out and keeps speaking until the day itself has passed. */
function alertsOf(list) {
  const today = dayKey();
  const rows = [];
  for (const ev of list || []) {
    if (!ev.warn) continue;
    for (const on of occurrences(ev, today, addDays(today, ev.warn))) {
      if (isEventDone(ev, on)) continue;
      rows.push({ ev, on, left: daysUntil(on) });
    }
  }
  rows.sort((a, b) => a.left - b.left);
  return rows;
}

/* The relative day, in words. Arabic counts in threes, so the plural comes
   from `dayWord` rather than from a bare "أيام". */
const whenWord = (on) => {
  const n = daysUntil(on);
  if (n === null) return "";
  if (n === 0) return "اليوم";
  if (n === 1) return "غدًا";
  if (n === 2) return "بعد غد";
  if (n === -1) return "أمس";
  if (n < 0) {
    const d = -n;
    return `متأخر ${d <= 10 ? `${d} ${dayWord(d)}` : `${d} يومًا`}`;
  }
  return `بعد ${n <= 10 ? `${n} ${dayWord(n)}` : `${n} يومًا`}`;
};

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

/* The Saudi five-point scale with the four-point column beside it. The
   percentage floors are the standard ones, and they are what lets the mark
   sheet name the grade a course is currently earning instead of leaving
   him to look it up. Ordered high to low — `gradeFromPct` depends on that,
   and F sits at zero so the search can never miss. */
const GRADES = [
  { id: "A+", ar: "ممتاز مرتفع", p5: 5, p4: 4, min: 95 },
  { id: "A", ar: "ممتاز", p5: 4.75, p4: 3.75, min: 90 },
  { id: "B+", ar: "جيد جدًا مرتفع", p5: 4.5, p4: 3.5, min: 85 },
  { id: "B", ar: "جيد جدًا", p5: 4, p4: 3, min: 80 },
  { id: "C+", ar: "جيد مرتفع", p5: 3.5, p4: 2.5, min: 75 },
  { id: "C", ar: "جيد", p5: 3, p4: 2, min: 70 },
  { id: "D+", ar: "مقبول مرتفع", p5: 2.5, p4: 1.5, min: 65 },
  { id: "D", ar: "مقبول", p5: 2, p4: 1, min: 60 },
  { id: "F", ar: "راسب", p5: 1, p4: 0, min: 0 },
];
const gradeOf = (id) => GRADES.find((g) => g.id === id) || null;
const gradePoints = (g, scale) => (Number(scale) === 4 ? g.p4 : g.p5);
const gradeFromPct = (pct) =>
  GRADES.find((g) => pct >= g.min) || GRADES[GRADES.length - 1];

/* The letter whose points sit closest to a required average — «تحتاج 4.33»
   means nothing until it is «أي B+ في كل مقرّر تقريبًا». */
const nearestGrade = (points, scale) => {
  let best = GRADES[0];
  let gap = Infinity;
  for (const g of GRADES) {
    const d = Math.abs(gradePoints(g, scale) - points);
    if (d < gap) {
      gap = d;
      best = g;
    }
  }
  return best.id;
};

/* Where an average sits, named. The number alone does not tell a student
   whether he is safe, and «٣.١ من ٥» is a different sentence from
   «٣.١ من ٤» — so the band is read off the ratio, not the raw figure. */
const GPA_BANDS = [
  { min: 0.9, label: "ممتاز", tint: "#10B981" },
  { min: 0.75, label: "جيد جدًا", tint: "#00C2FF" },
  { min: 0.6, label: "جيد", tint: "#FFB020" },
  { min: 0.4, label: "مقبول", tint: "#FF7A45" },
  { min: 0, label: "تحت الخط", tint: "#FF3B5C" },
];
const gpaBand = (gpa, scale) => {
  const r = scale ? gpa / scale : 0;
  return GPA_BANDS.find((b) => r >= b.min) || GPA_BANDS[GPA_BANDS.length - 1];
};

/* The university week, Sunday first. Friday is not on it; Saturday is, at
   the end, because some sections really are scheduled there and a timetable
   that cannot hold a real section is not a timetable. */
const UNI_DAYS = [
  { d: 0, label: "الأحد", short: "ح" },
  { d: 1, label: "الإثنين", short: "ن" },
  { d: 2, label: "الثلاثاء", short: "ث" },
  { d: 3, label: "الأربعاء", short: "ر" },
  { d: 4, label: "الخميس", short: "خ" },
  { d: 6, label: "السبت", short: "س" },
];
const uniDayOf = (d) => UNI_DAYS.find((x) => x.d === Number(d)) || null;

/* Vivid, never pastel — the tint is how a block is found on the timetable
   at a glance, and a washed-out one finds nothing. */
const COURSE_TINTS = [
  "#00C2FF",
  "#FFB020",
  "#FF4D8D",
  "#9D5CFF",
  "#5B8CFF",
  "#FF7A45",
  "#10B981",
  "#FF5722",
];

/* A quarter of the meetings is the usual bar for being barred from the
   final. Derived from how often the course actually meets rather than
   asked for — but still editable, because it is a regulation and
   regulations differ between universities. */
const ABSENCE_LIMIT = 0.25;
const TERM_WEEKS_DEFAULT = 15;

const UNI_TASK_KINDS = [
  { id: "assign", label: "واجب", icon: ClipboardList, tint: "#FF7A45" },
  { id: "quiz", label: "كويز", icon: ClipboardCheck, tint: "#FFB020" },
  { id: "mid", label: "اختبار فصلي", icon: FileText, tint: "#FF4D8D" },
  { id: "final", label: "اختبار نهائي", icon: GraduationCap, tint: "#FF3B5C" },
  { id: "project", label: "مشروع", icon: Rocket, tint: "#9D5CFF" },
  { id: "present", label: "عرض تقديمي", icon: Presentation, tint: "#00C2FF" },
];
const uniKindOf = (id) =>
  UNI_TASK_KINDS.find((k) => k.id === id) || UNI_TASK_KINDS[0];
/* The ones that cannot be rescheduled by asking nicely. */
const UNI_EXAM_KINDS = new Set(["quiz", "mid", "final"]);

const slotShape = (s) => (
  (s = obj(s)),
  {
  id: s.id || uid(),
  day: uniDayOf(s.day) ? Number(s.day) : 0,
  from: hhmm(s.from, "08:00"),
  to: hhmm(s.to, "09:50"),
  room: typeof s.room === "string" ? s.room : "",
});

const markShape = (m) => (
  (m = obj(m)),
  {
  id: m.id || uid(),
  label: typeof m.label === "string" ? m.label : "",
  /* `null` is "not returned yet" and has to survive as null. A zero is a
     zero he actually scored, and folding the two together is exactly how a
     mark sheet starts lying about where he stands. */
  score:
    m.score === null || m.score === undefined || m.score === ""
      ? null
      : Number.isFinite(Number(m.score))
        ? Math.max(0, Number(m.score))
        : null,
  max: clampNum(m.max, 0.01, 1000, 100),
  weight: clampNum(m.weight, 0, 100, 0),
});

const courseShape = (c) => (
  (c = obj(c)),
  {
  id: c.id || uid(),
  code: typeof c.code === "string" ? c.code : "",
  name: typeof c.name === "string" ? c.name : "",
  credits: clampNum(c.credits, 1, 12, 3),
  instructor: typeof c.instructor === "string" ? c.instructor : "",
  term: typeof c.term === "string" ? c.term : "",
  tint: COURSE_TINTS.includes(c.tint) ? c.tint : COURSE_TINTS[0],
  slots: Array.isArray(c.slots) ? c.slots.map(slotShape) : [],
  marks: Array.isArray(c.marks) ? c.marks.map(markShape) : [],
  /* Set by hand once the final grade is published. Until then the mark
     sheet projects one and the GPA leaves the course out entirely. */
  grade: gradeOf(c.grade) ? c.grade : null,
  absences: clampNum(c.absences, 0, 200, 0),
  /* The days the quick button recorded. `absences` stays the authoritative
     count — it has to, because a term usually starts with absences taken
     before the app did — and this is what lets the button refuse a second
     tap on a day it already recorded. Tapping «غياب» twice after one
     lecture is the easiest mistake on this screen and the hardest to
     notice: the number is simply wrong from then on. */
  absentOn: Array.isArray(c.absentOn)
    ? c.absentOn.filter((d) => typeof d === "string" && isKey(d))
    : [],
  absenceCap: clampNum(c.absenceCap, 0, 200, 0), // 0 → derive from the slots
  target: clampNum(c.target, 0, 100, 90),
  /* Blackboard, Teams, a shared drive — whatever the course actually lives
     in. Stored exactly as typed: running it through `safeUrl` here would
     rewrite the field between keystrokes, so «b» became «https://b/» before
     the second letter arrived. It is sanitised where it is used as an
     `href` instead, which is the only place it can do harm. */
  link: typeof c.link === "string" ? c.link : "",
  notes: typeof c.notes === "string" ? c.notes : "",
});

const termShape = (t) => (
  (t = obj(t)),
  {
  id: t.id || uid(),
  label: typeof t.label === "string" ? t.label : "",
  start: isKey(t.start) ? t.start : dayKey(),
  end: isKey(t.end) ? t.end : addDays(dayKey(), 7 * TERM_WEEKS_DEFAULT),
  weeks: clampNum(t.weeks, 1, 40, TERM_WEEKS_DEFAULT),
});

const uniTaskShape = (t) => (
  (t = obj(t)),
  {
  id: t.id || uid(),
  title: typeof t.title === "string" ? t.title : "",
  kind: UNI_TASK_KINDS.some((k) => k.id === t.kind) ? t.kind : "assign",
  course: typeof t.course === "string" ? t.course : "",
  due: isKey(t.due) ? t.due : dayKey(),
  time: hhmm(t.time),
  place: typeof t.place === "string" ? t.place : "",
  weight: clampNum(t.weight, 0, 100, 0),
  done: !!t.done,
  notes: typeof t.notes === "string" ? t.notes : "",
});

/* The whole desk, reshaped. The active-term pointer is normalised here and
   nowhere else: a dangling id — a term deleted, or a hand-edited backup —
   would otherwise render an empty screen that looks exactly like lost data. */
const uniShape = (u) => {
  u = obj(u);
  const terms = Array.isArray(u.terms) ? u.terms.map(termShape) : [];
  const ids = new Set(terms.map((t) => t.id));
  let term = typeof u.term === "string" && ids.has(u.term) ? u.term : "";
  if (!term && terms.length) {
    const today = dayKey();
    term = (terms.find((t) => t.start <= today && today <= t.end) || terms[0]).id;
  }
  return {
    scale: Number(u.scale) === 4 ? 4 : 5,
    /* Everything before the terms listed here, as one pair. Asking for
       every past term just to show a cumulative figure is a wall nobody
       climbs; two numbers off a transcript is thirty seconds. */
    priorGpa: clampNum(u.priorGpa, 0, 5, 0),
    priorCredits: clampNum(u.priorCredits, 0, 500, 0),
    /* Which scale that figure was typed on. Without it, flipping the scale
       folds a four-point average into a five-point cumulative — a wrong
       number stated confidently, which is worse than no number at all. */
    priorScale: Number(u.priorScale) === 4 ? 4 : 5,
    /* The degree's total credit hours, for the graduation bar. Zero means
       «not set» and the bar stays hidden — a progress bar against a number
       the user never gave is a progress bar against a guess. */
    gradCredits: clampNum(u.gradCredits, 0, 400, 0),
    /* The cumulative he is aiming at, for the «كم أحتاج هذا الفصل»
       calculator. Zero means «not set», same reasoning. */
    targetGpa: clampNum(u.targetGpa, 0, 5, 0),
    term,
    terms,
    courses: Array.isArray(u.courses) ? u.courses.map(courseShape) : [],
    tasks: Array.isArray(u.tasks) ? u.tasks.map(uniTaskShape) : [],
  };
};

/* What this term has to average for the cumulative to land on the target.
 *
 *  target = (bankedPoints + g · hours) / (bankedCredits + hours), solved for
 *  g. Returns null when there is nothing registered to earn it with, and a
 *  figure above the scale's ceiling when the target is simply out of reach
 *  this term — which the screen says plainly instead of printing «5.4».
 */
const gpaNeeded = (target, banked, hours) => {
  if (!hours || hours <= 0) return null;
  return (target * (banked.credits + hours) - banked.points) / hours;
};

/* One term, so the screen opens on a timetable to fill rather than on a
   form asking what a term is. The dates are editable and the label is
   generic on purpose — inventing a term number would be inventing his
   transcript. */
const SEED_UNI = () => {
  const start = dayKey();
  const t = termShape({
    label: "الفصل الحالي",
    start,
    end: addDays(start, 7 * TERM_WEEKS_DEFAULT),
    weeks: TERM_WEEKS_DEFAULT,
  });
  return uniShape({ terms: [t], term: t.id });
};

/* --- the mark sheet --------------------------------------------------- *
 *  Two different questions, and conflating them is the usual bug: how much
 *  of the full hundred is already banked, versus how the marks that came
 *  back average on their own. One quiz worth 10%, answered perfectly, is
 *  ten points banked — not a course standing at 100%.
 * -------------------------------------------------------------------- */
function courseStanding(c) {
  let totalW = 0;
  let gradedW = 0;
  let earned = 0; // points of the final hundred, already banked
  for (const m of c.marks || []) {
    totalW += m.weight;
    if (m.score === null) continue;
    gradedW += m.weight;
    earned += (m.score / m.max) * m.weight;
  }
  const pending = Math.max(0, totalW - gradedW);
  return {
    totalW,
    gradedW,
    pending,
    earned,
    /* The average over what has come back — the honest "how am I doing". */
    pace: gradedW > 0 ? (earned / gradedW) * 100 : null,
    /* Where the course lands if the rest goes exactly as the returned marks
       have gone. A projection, and labelled as one. */
    projected: gradedW > 0 ? earned + (earned / gradedW) * pending : null,
    /* The need-calculator is honest only once the declared weights add up
       to a hundred. Below that, some of the remaining marks are not
       declared at all, and «تحتاج ٨٤٪» would be arithmetic on a
       denominator that does not exist yet. */
    weightOk: Math.abs(totalW - 100) < 0.5,
  };
}

/* What the remaining weight has to average for the course to land on the
   target. Over 100 means the target is already out of reach on the
   declared weights, and the screen says so instead of printing 118%. */
const needFor = (st, target) =>
  st.pending <= 0 ? null : ((target - st.earned) / st.pending) * 100;

/* How many meetings the course holds across the term, and how many
   absences bar you from the final. `null` rather than a guess when the
   timetable is empty — a cap of one, invented out of nothing, is exactly
   the kind of number a student would plan around. */
const meetingsOf = (c, term) =>
  (c.slots || []).length * (term ? term.weeks : TERM_WEEKS_DEFAULT);
const absenceCapOf = (c, term) => {
  if (c.absenceCap > 0) return c.absenceCap;
  const n = meetingsOf(c, term);
  return n > 0 ? Math.max(1, Math.floor(n * ABSENCE_LIMIT)) : null;
};
const ATTEND_BANDS = [
  { min: 1, label: "خطر الحرمان", tint: "#FF3B5C" },
  { min: 0.75, label: "على الحدّ", tint: "#FF7A45" },
  { min: 0.5, label: "انتبه", tint: "#FFB020" },
  { min: 0, label: "آمن", tint: "#10B981" },
];
const attendBand = (used, cap) => {
  if (!cap) return null;
  const r = used / cap;
  return ATTEND_BANDS.find((b) => r >= b.min) || ATTEND_BANDS[ATTEND_BANDS.length - 1];
};

/* Term and cumulative averages. Only a course carrying a published letter
   grade counts: an ungraded course has no points, and reading it as a zero
   would drop the GPA the moment a new term is registered. */
function gpaOf(courses, scale) {
  let points = 0;
  let credits = 0;
  for (const c of courses || []) {
    const g = gradeOf(c.grade);
    if (!g) continue;
    points += gradePoints(g, scale) * c.credits;
    credits += c.credits;
  }
  return { gpa: credits ? points / credits : 0, points, credits };
}

const coursesIn = (uni, termId) =>
  (uni.courses || []).filter((c) => c.term === termId);
const termOf = (uni, id) => (uni.terms || []).find((t) => t.id === id) || null;
const courseIn = (uni, id) => (uni.courses || []).find((c) => c.id === id) || null;
const courseName = (c) =>
  !c ? "" : c.name || c.code || "مقرّر بلا اسم";

/* The university's own deadlines, as calendar rows. Derived, never stored
   twice: a due date edited on the university screen has to move on the
   calendar in the same render, and two copies of one date are two dates
   that will eventually disagree. */
function uniDue(uni, fromKey, toKey) {
  const map = new Map();
  for (const t of uni.tasks || []) {
    if (t.due < fromKey || t.due > toKey) continue;
    const row = map.get(t.due);
    if (row) row.push(t);
    else map.set(t.due, [t]);
  }
  for (const row of map.values())
    row.sort((a, b) => (minsOf(a.time) ?? 1441) - (minsOf(b.time) ?? 1441));
  return map;
}

/* Today's sections, and the one he is either sitting in or walking to.
   Minutes are passed in rather than read off the clock so the caller owns
   the tick — this runs on every render of a screen that re-renders once a
   minute, and two clocks in one frame can disagree by a minute. */
function daySections(courses, dow, mins) {
  const rows = [];
  for (const c of courses || [])
    for (const s of c.slots || [])
      if (s.day === dow) {
        const from = minsOf(s.from) ?? 0;
        const to = minsOf(s.to) ?? from;
        rows.push({
          course: c,
          slot: s,
          from,
          to,
          now: mins >= from && mins < to,
        });
      }
  rows.sort((a, b) => a.from - b.from);
  return rows;
}

/* The next section anywhere in the week, walking forward from now. The day
   offset rides along so the card can say «غدًا» instead of a weekday the
   user then has to count to. */
function nextSection(courses, dow, mins) {
  for (let i = 0; i < 8; i++) {
    const rows = daySections(courses, (dow + i) % 7, i === 0 ? mins : -1).filter(
      (r) => i > 0 || r.to > mins,
    );
    if (rows.length) return { ...rows[0], inDays: i };
  }
  return null;
}

/* Minutes to a position on the week grid, clamped to the band the grid
   actually draws — a 06:00 section must not render above the top edge. */
const DAY_FROM = 7 * 60;
const DAY_TO = 23 * 60;
const spanPct = (from, to) => {
  const a = Math.max(DAY_FROM, Math.min(DAY_TO, from));
  const b = Math.max(a + 12, Math.min(DAY_TO, to));
  const w = DAY_TO - DAY_FROM;
  return { top: ((a - DAY_FROM) / w) * 100, height: ((b - a) / w) * 100 };
};

/* The timetable, the next-section card and the "now" line all move with
   the clock, and this screen is left open for hours. One minute is the
   right grain: a second would re-render the module sixty times a minute
   for a line that moves one pixel. */
function useMinuteClock() {
  const [mins, setMins] = useState(() => nowMins());
  useEffect(() => {
    const check = () => setMins(nowMins());
    const t = setInterval(check, 60000);
    /* A background tab throttles intervals hard, so also re-read the clock
       the moment the tab is looked at again. */
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);
  return mins;
}

const freshState = (carry = {}) => ({
  schema: SCHEMA,
  date: dayKey(),
  habits: (carry.habits || SEED_HABITS).map((h) => ({ ...h, done: false })),
  tasks: (carry.tasks || SEED_TASKS).map((t) => ({ ...t, done: false })),
  books: carry.books || SEED_BOOKS,
  goals: carry.goals || SEED_GOALS(),
  sessions: carry.sessions || [],
  income: carry.income || [],
  ventures: carry.ventures || [],
  prompts: carry.prompts || SEED_PROMPTS,
  reviews: carry.reviews || [],
  pipeline: carry.pipeline || SEED_PIPELINE,
  badHabits: carry.badHabits || [],
  /* The calendar and the university desk. Every row in both is keyed to a
     calendar date of its own, so they cross a day rollover untouched —
     nothing in either of them belongs to "today" in the first place. */
  events: carry.events || [],
  uni: carry.uni || SEED_UNI(),
  /* Entirely date-derived inside, so it carries across a rollover whole —
     the two daily checklists empty themselves by reading today's log row. */
  career: careerShape(carry.career),
  navOrder: carry.navOrder || NAV_IDS,
  quotes: carry.quotes || SEED_QUOTES(),
  reads: carry.reads || SEED_READS(),
  reading: carry.reading || [],
  readGoal: carry.readGoal ?? READ_GOAL_DEFAULT,
  /* The word and the vision outlive every goal underneath them, so they
     carry; the glasses of water do not, and are deliberately absent from
     `carryOf` below — yesterday's water is not today's. */
  northStar: northStarShape(carry.northStar),
  place: placeShape(carry.place),
  waterGoal: clampGoal(carry.waterGoal),
  water: 0,
  cueImage: carry.cueImage ?? null,
  history: carry.history || [],
  streakBase: carry.streakBase || 0,
  bestStreak: carry.bestStreak || 0,
  dayBanked: false,
});

/* Reshapes a saved payload without discarding anything the user typed. */
function migrate(saved) {
  saved = obj(saved);
  const from = saved.schema || 0;

  /* Every list is cleaned of holes before a single branch below touches it.
     A row that is `null`, a number or a string is not data this app can
     repair — it is damage — and carrying it forward only moves the throw
     somewhere further from a try/catch. The one that mattered was
     `history`: it survived migration untouched and then took the render
     down on `.find(h => h.date === today)`, which is a white screen that
     reloading cannot clear because the payload is already saved. */
  let habits = rows(saved.habits);

  if (from < 4) {
    habits = habits.map((h) =>
      h.group === "evening" && LEGACY_POSTISHA.has(h.label)
        ? { ...h, group: "postisha", label: h.label === "تقييم يومي" ? "تقييم اليوم: التزمت؟" : h.label }
        : h,
    );
    const present = new Set(
      habits.filter((h) => h.group === "postisha").map((h) => h.label),
    );
    const missing = POSTISHA_LABELS.filter((l) => !present.has(l)).map((label) => ({
      id: uid(),
      label,
      group: "postisha",
      done: false,
    }));
    if (missing.length) habits = [...habits, ...missing];
  }

  /* Goals predate quarters. Park every existing one in the quarter the user
     is living in, so nothing they wrote disappears behind a tab. */
  let goals = rows(saved.goals);
  if (from < 5) {
    const here = currentQuarter();
    goals = goals.map((g) => (g.quarter ? g : { ...g, quarter: here }));
  }

  /* Schema 19 stacks the goals into three horizons. Everything a schema-18
     profile holds was a 90-day goal, so that is the horizon it lands in —
     `goalShape` defaults to it, which is why there is no mapping step here. */
  goals = goals.map(goalShape);

  if (from < 19) {
    /* Top up with the two horizons above the 90-day line, which this payload
       has none of. Matched on text so a user who already wrote one of these
       himself never ends up with a second copy beside it, and the seed's own
       ids are kept — the parent links between the added rows are what makes
       them a tree rather than two flat lists.
       The match is per horizon, not across all of them: «قراءة ٢٤ كتابًا» as a
       90-day goal and the same words as a yearly one are two different
       commitments, and treating the first as proof of the second would leave
       the yearly row missing and its children with nothing to serve. */
    const have = new Set(goals.map((g) => `${g.horizon} ${g.text.trim()}`));
    const added = ADDED_GOALS().filter(
      (g) => !have.has(`${g.horizon} ${g.text.trim()}`),
    );
    goals = [...goals, ...added];

    /* Wire the user's own 90-day goals into the tree. They came from this
       same seed list before the horizons existed, so the text is the join —
       and the yearly row matched here may be one just added above or one he
       had already written, which is exactly why the lookup runs over the
       merged list rather than over `added`. */
    const yearByText = new Map(
      goals
        .filter((g) => g.horizon === "year")
        .map((g) => [g.text.trim(), g.id]),
    );
    goals = goals.map((g) => {
      if (g.horizon !== "quarter" || g.parent) return g;
      const wanted = SEED_LINKS.get(g.text.trim());
      const parent = wanted ? yearByText.get(wanted.trim()) : null;
      return parent ? { ...g, parent } : g;
    });
  }

  /* A parent is only a shape to `goalShape`; whether it points anywhere real
     can only be answered with the whole list in hand. Three ways it can be
     wrong — a goal that no longer exists, one in the wrong horizon, and a
     goal pointed at itself — and all three are cut to null rather than
     carried, because `goalPct` would otherwise walk a chain that has no end
     and take the render down with it. */
  {
    const byId = new Map(goals.map((g) => [g.id, g]));
    goals = goals.map((g) => {
      if (!g.parent) return g;
      const up = byId.get(g.parent);
      const want = parentHorizon(g.horizon);
      if (!up || up.id === g.id || !want || up.horizon !== want)
        return { ...g, parent: null };
      return g;
    });
    /* A cycle needs no bad horizon to exist: year→h3 is legal in both
       directions on its own, so a hand-edited backup can close a loop that
       every single row passes. Walk each chain to the top and cut the link
       that comes back round. */
    const live = new Map(goals.map((g) => [g.id, g]));
    goals = goals.map((g) => {
      const seen = new Set([g.id]);
      let at = g.parent;
      while (at) {
        if (seen.has(at)) return { ...g, parent: null };
        seen.add(at);
        at = live.get(at)?.parent || null;
      }
      return g;
    });
  }

  /* Top up with the routines added in schema 6, matching on label so a
     profile that already has one (or renamed it) never gets a duplicate. */
  let tasks = rows(saved.tasks);
  if (from < 6) {
    {
      const have = new Set(habits.map((h) => h.label));
      habits = [
        ...habits,
        ...ADDED_HABITS.filter((h) => !have.has(h.label)).map((h) => ({
          id: uid(),
          done: false,
          ...h,
        })),
      ];
    }
    {
      const have = new Set(tasks.map((t) => t.text));
      tasks = [
        ...tasks,
        ...ADDED_TASKS.filter((t) => !have.has(t.text)).map((t) => ({
          id: uid(),
          today: false,
          done: false,
          ...t,
        })),
      ];
    }
  }

  /* "المساء" became "بعد المغرب", and "بعد العصر" is new. The old block's
     habits move rather than being recreated, so nothing the user wrote in
     it is lost or duplicated. */
  if (from < 8) {
    habits = habits.map((h) => {
      if (h.group === "evening") return { ...h, group: "maghrib" };
      if (h.group === "afternoon" && h.label === "صلاة العصر")
        return { ...h, group: "asr" };
      return h;
    });
    const have = new Set(habits.map((h) => h.label));
    habits = [
      ...habits,
      ...[...ASR_HABITS, ...MAGHRIB_HABITS]
        .filter((h) => !have.has(h.label))
        .map((h) => ({ id: uid(), done: false, ...h })),
    ];
  }

  /* Schema 9 hands the cue list to the user. An older payload has no
     quotes of its own, so it inherits the seed rather than opening on an
     empty card; one that already has them is left exactly as written. */
  let quotes = rows(saved.quotes);
  if (quotes.length === 0) quotes = SEED_QUOTES();
  else quotes = quotes.map((q) => (q.id ? q : { ...q, id: uid() }));

  let reads = rows(saved.reads);
  if (reads.length === 0) reads = SEED_READS();
  else reads = reads.map((q) => (q.id ? q : { ...q, id: uid() }));

  /* Schema 10 gave every book a workspace. Run the existing rows through
     bookShape so the new fields appear with sane defaults — spread last is
     wrong here, the saved values must win over the defaults. */
  let books = rows(saved.books).map((b) => ({
    ...bookShape(b),
    notes: rows(b.notes),
  }));

  /* Schema 11 links habits to books. Existing habits are ordinary unless
     they are the reading one, which is pointed at the active book so the
     feature works on the first open instead of after a settings hunt. */
  if (from < 11) {
    habits = habits.map((h) =>
      h.book === undefined
        ? { ...h, book: h.label === "قراءة" ? READ_ACTIVE : null }
        : h,
    );
  }

  /* Schema 12 adds the habit breaker. An older payload has no list at all;
     one written by a newer build is run through badHabitShape so a row that
     lost a field to a hand-edited backup comes back whole.

     Schema 16 adds the tagged confrontation — a cause, a mood and the clock
     hour on every entry, plus the `urges` list of cravings that were
     resisted. It needs no branch of its own: badHabitShape runs every row
     and every log through urgeShape on the way in, so an older relapse
     simply arrives with an empty tag and is skipped by the breakdowns
     instead of counted as an unknown cause. */
  const badHabits = rows(saved.badHabits).map(badHabitShape);

  /* Schema 13 lets the user order the tabs. Stored as ids and normalised on
     the way in, so a payload from a build with different tabs still resolves
     to a complete, duplicate-free order. */
  let navOrder = orderedNav(saved.navOrder).map((n) => n.id);

  /* Schema 14 adds the employability masterplan. orderedNav appends a tab
     the saved order has never seen to the *end*, which on a phone buries it
     behind «المزيد» — so this one is placed by hand, once, right after the
     routine. A daily driver that takes two taps to reach is not daily. */
  if (from < 14 && !(saved.navOrder || []).includes("career")) {
    const rest = navOrder.filter((id) => id !== "career");
    const at = rest.indexOf("routine");
    navOrder =
      at < 0
        ? ["career", ...rest]
        : [...rest.slice(0, at + 1), "career", ...rest.slice(at + 1)];
  }

  /* Run through the shape whether or not it is new: a hand-edited backup
     that lost a field comes back whole instead of crashing a render. */
  let career = careerShape(saved.career);

  /* Schema 15 rewrote the morning routine as instructions, and one step's
     id went with it ("keyword" became "polish" when it stopped being about
     keywords alone). Rename it inside the log rather than dropping it: an
     orphan id still counts toward the day's total but can never render as
     ticked, which reads as a checkbox that lies. */
  if (from < 15) {
    career = {
      ...career,
      log: (career.log || []).map((e) =>
        (e.am || []).includes("keyword")
          ? { ...e, am: e.am.map((id) => (id === "keyword" ? "polish" : id)) }
          : e,
      ),
    };
  }

  /* Schema 17 adds the calendar and the university desk. An older payload
     has neither and starts them empty; one written by a newer build is run
     back through the shapes, so a row that lost a field to a hand-edited
     backup comes back whole instead of crashing a render.

     Schema 18 adds the recorded absence days, the course link, the
     graduation total and the target cumulative. None of them needs a
     branch of its own: every one is a new field with a defined empty
     value, and `uniShape` already runs over the whole payload on the way
     in — so a schema-17 profile simply arrives with an empty absence log
     and the two totals switched off, which is what it means. */
  const events = rows(saved.events).map(eventShape);
  const uni = saved.uni ? uniShape(saved.uni) : SEED_UNI();

  /* Both are daily screens for a student, so — like `career` before them —
     they are placed by hand right after the routine instead of being
     appended to the end, where a phone buries a tab behind «المزيد». A tab
     the user has already positioned himself is left exactly where he put
     it, and becomes the anchor for the next one. */
  if (from < 17) {
    let anchor = "routine";
    for (const id of ["agenda", "uni"]) {
      if ((saved.navOrder || []).includes(id)) {
        anchor = id;
        continue;
      }
      const rest = navOrder.filter((x) => x !== id);
      const at = rest.indexOf(anchor);
      navOrder =
        at < 0
          ? [id, ...rest]
          : [...rest.slice(0, at + 1), id, ...rest.slice(at + 1)];
      anchor = id;
    }
  }

  return {
    ...saved,
    schema: SCHEMA,
    habits,
    goals,
    tasks,
    quotes,
    reads,
    books,
    badHabits,
    career,
    events,
    uni,
    navOrder,
    /* The archive row the whole app writes to. A hole here is the one that
       reaches the render rather than a shape, so it is cleaned here too. */
    history: rows(saved.history).filter((h) => typeof h.date === "string"),
    sessions: rows(saved.sessions),
    income: rows(saved.income),
    ventures: rows(saved.ventures),
    prompts: rows(saved.prompts),
    reviews: rows(saved.reviews),
    pipeline: rows(saved.pipeline),
    reading: rows(saved.reading),
    readGoal: Number.isFinite(saved.readGoal)
      ? saved.readGoal
      : READ_GOAL_DEFAULT,
    /* Schema 19 adds the word, the vision, the place the prayer times are
       computed for and the water goal. None needs a branch: each is a new
       field with a defined empty value, and its shape runs over the whole
       payload on the way in — so a schema-18 profile simply arrives with an
       unwritten vision and the default city, which is what it means.
       `water` is the one exception and is clamped rather than shaped: it is
       per-day, and a count above the goal would draw cups that are not
       there. */
    northStar: northStarShape(saved.northStar),
    place: placeShape(saved.place),
    waterGoal: clampGoal(saved.waterGoal),
    water:
      Number.isFinite(+saved.water) && +saved.water > 0
        ? Math.min(clampGoal(saved.waterGoal), Math.round(+saved.water))
        : 0,
    cueImage: typeof saved.cueImage === "string" ? saved.cueImage : null,
  };
}

/* Everything that outlives a day, in one place. Both the reload path and the
   live rollover read this list — a key missing from it is data that quietly
   vanishes at the next day boundary, so it must never be written twice. */
const carryOf = (s) => ({
  habits: s.habits,
  tasks: s.tasks,
  books: s.books,
  goals: s.goals,
  sessions: s.sessions,
  income: s.income,
  ventures: s.ventures,
  prompts: s.prompts,
  reviews: s.reviews,
  pipeline: s.pipeline,
  badHabits: s.badHabits,
  events: s.events,
  uni: s.uni,
  career: s.career,
  navOrder: s.navOrder,
  quotes: s.quotes,
  reads: s.reads,
  reading: s.reading,
  readGoal: s.readGoal,
  northStar: s.northStar,
  place: s.place,
  waterGoal: s.waterGoal,
  cueImage: s.cueImage,
  history: s.history,
  bestStreak: s.bestStreak,
});

/* The day turning over, applied to a state already in memory. The reload
   path and the live clock must agree on what a new day means, or a window
   left open overnight ends up on a different footing from one reopened in
   the morning — which is exactly how a night's work got written onto the
   next day's row and then wiped. Returns the same object when nothing has
   changed, so React can bail out of the render. */
function rollDay(s) {
  if (s.date === dayKey()) return s;
  const continued = s.date === yesterdayKey() && s.dayBanked;
  return freshState({
    ...carryOf(s),
    streakBase: continued ? (s.streakBase || 0) + 1 : 0,
  });
}

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

/* ==================================================================== *
 *  Primitives (shadcn-shaped, dependency-free)
 * ==================================================================== */

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

/* Advances on every open, and again on tap. Keying it to the day of the
   month was the literal spec but meant the card never visibly moved within
   a day — the cue is only motivating if it is actually new. The cursor
   persists so consecutive opens walk the list instead of repeating. */
const QUOTE_KEY = "life-os-2027:quote";
const READ_KEY = "life-os-2027:read-quote";

function useDailyQuote(list, key = QUOTE_KEY) {
  const total = list.length;
  const [i, setI] = useState(() => {
    let prev = -1;
    try {
      prev = parseInt(window.localStorage.getItem(key), 10);
    } catch {
      /* storage blocked — fall back to the day of the month */
    }
    const base = total || 1;
    const next = Number.isFinite(prev)
      ? (prev + 1) % base
      : new Date().getDate() % base;
    try {
      window.localStorage.setItem(key, String(next));
    } catch {
      /* per-viewer convenience only */
    }
    return next;
  });

  const shuffle = useCallback(() => {
    setI((cur) => {
      const next = total ? (cur + 1) % total : 0;
      try {
        window.localStorage.setItem(key, String(next));
      } catch {
        /* per-viewer convenience only */
      }
      return next;
    });
  }, [total, key]);

  /* The cursor can outrun the list once the user deletes a quote, so it is
     wrapped at read time rather than trusted. */
  const quote = total ? list[i % total] : null;
  return [quote, shuffle];
}

/* Fires a one-shot reward flag that auto-clears. Deliberately no
   requestAnimationFrame here — it never runs in a hidden tab, which both
   swallowed the reward and replayed it whenever the tab came back. */
function useBurst(ms = 640) {
  const [on, setOn] = useState(false);
  const timer = useRef(null);
  const fire = useCallback(() => {
    clearTimeout(timer.current);
    setOn(true);
    timer.current = setTimeout(() => setOn(false), ms);
  }, [ms]);
  useEffect(() => () => clearTimeout(timer.current), []);
  return [on, fire];
}

function Card({ children, className = "", style, as = "div", ...rest }) {
  const Tag = as;
  return (
    <Tag
      className={`rounded-2xl border ${className}`}
      style={{ ...GLASS, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

function Btn({
  children,
  variant = "default",
  size = "md",
  className = "",
  style,
  /* Same escape hatch `Card` and `Field` already carry: a control that
     navigates has to be an anchor, or it loses middle-click, "open in new
     tab" and the status bar — and a button with an `href` simply does
     nothing. The styling is identical either way. */
  as = "button",
  ...rest
}) {
  const Tag = as;
  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3.5 text-[15px] gap-2",
    icon: "p-2",
  };
  const variants = {
    default: {
      background: `linear-gradient(135deg, ${T.cta}, ${T.ctaLift})`,
      color: "#1A0600",
      borderColor: "transparent",
      boxShadow: `0 8px 24px -10px ${T.cta}CC`,
    },
    success: {
      background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLift})`,
      color: "#04140E",
      borderColor: "transparent",
      boxShadow: `0 8px 24px -10px ${T.primary}CC`,
    },
    gold: {
      background: `linear-gradient(135deg, ${T.accent}, #FDE68A)`,
      color: "#1C1203",
      borderColor: "transparent",
      boxShadow: `0 8px 24px -10px ${T.accent}AA`,
    },
    outline: {
      background: "transparent",
      color: T.muted,
      borderColor: T.border,
    },
    ghost: {
      background: "transparent",
      color: T.muted,
      borderColor: "transparent",
    },
    danger: {
      background: `${T.danger}1F`,
      color: T.danger,
      borderColor: `${T.danger}4D`,
    },
  };
  return (
    <Tag
      className={`los-btn inline-flex items-center justify-center rounded-xl border font-bold transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${sizes[size]} ${className}`}
      style={{ ...variants[variant], ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

function Field({ className = "", style, as = "input", ...rest }) {
  const Tag = as;
  return (
    <Tag
      className={`w-full rounded-xl border bg-transparent px-3.5 py-2.5 text-sm text-white/85 outline-none transition-colors placeholder:text-white/20 focus:border-white/30 ${className}`}
      style={{ borderColor: T.border, ...style }}
      {...rest}
    />
  );
}

function Badge({ children, tint = T.accent, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold ${className}`}
      style={{
        borderColor: `${tint}44`,
        color: tint,
        background: `${tint}14`,
      }}
    >
      {children}
    </span>
  );
}

function Modal({ open, onClose, title, children, footer, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  /* --- why this is a portal ------------------------------------------- *
   *  A modal is `position: fixed`, which normally resolves against the
   *  viewport — except that a transformed ancestor becomes the containing
   *  block for every fixed descendant, and `.los-in`, the wrapper that
   *  slides each screen in, animates `transform`. Every modal in this app
   *  is rendered from inside a module, so every one of them was being laid
   *  out against the module's content box instead of the window: on a
   *  screen with little content the tallest form (the habit-breaker's) was
   *  positioned so its header sat above the top edge, unreachable, because
   *  there is nothing above a fixed element to scroll.
   *
   *  Capping the height or changing the easing would both be treatments of
   *  the symptom. Rendering outside the transformed subtree is the fix:
   *  `document.body` has no transformed ancestor, so `inset-0` means the
   *  window again — for this modal and the twenty others that share it.
   *  React still routes events through the tree the modal is written in,
   *  so every `onClose` and every handler keeps working unchanged.
   * -------------------------------------------------------------------- */
  const tree = (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        /* A desk needs room for a table; a form does not. One prop, so
           every existing call site keeps the narrow sheet it was built for. */
        className={`los-in relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border p-6 sm:rounded-3xl ${
          wide ? "max-w-3xl" : "max-w-md"
        }`}
        style={{
          background: `linear-gradient(160deg, ${T.bgLift}, ${T.bgDeep})`,
          borderColor: `${T.cta}40`,
          boxShadow: `0 40px 90px -30px ${T.cta}55`,
        }}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="text-lg font-bold" style={{ color: T.accent }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="rounded-lg border p-1.5 text-white/45 transition-colors hover:text-white"
            style={{ borderColor: T.border }}
          >
            <X size={15} />
          </button>
        </div>
        {children}
        {footer ? <div className="mt-6 flex gap-3">{footer}</div> : null}
      </div>
    </div>
  );

  /* `document.body` is read at render, so the guard is for the server pass
     and for a test host that mounts without one. */
  return typeof document === "undefined" ? tree : createPortal(tree, document.body);
}

function StarRating({ value, onChange, size = 15 }) {
  return (
    <div className="flex items-center gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n === value ? 0 : n)}
          aria-label={`${n} من ٥`}
          className="rounded p-0.5 transition-transform hover:scale-125 active:scale-95"
        >
          <Star
            size={size}
            strokeWidth={1.8}
            style={{
              color: n <= value ? T.accent : "rgba(255,255,255,0.2)",
              fill: n <= value ? T.accent : "transparent",
            }}
          />
        </button>
      ))}
    </div>
  );
}

function Checkbox({ checked, onToggle, label, tint = T.primary, size = "md" }) {
  const box = size === "sm" ? 18 : 22;
  const [pop, firePop] = useBurst(640);

  const handle = () => {
    if (!checked) firePop();
    onToggle();
  };

  return (
    <button
      type="button"
      onClick={handle}
      aria-pressed={checked}
      className="group/c flex min-w-0 flex-1 items-center gap-3 rounded-lg px-1.5 py-1.5 text-right transition-colors hover:bg-white/[0.06]"
    >
      <span
        className="relative flex shrink-0 items-center justify-center"
        style={{ width: box, height: box }}
      >
        {pop && (
          <span
            aria-hidden="true"
            className="los-ripple pointer-events-none absolute inset-0 rounded-md border-2"
            style={{ borderColor: tint }}
          />
        )}
        <span
          className={`flex h-full w-full items-center justify-center rounded-md border transition-all duration-300${
            pop ? " los-pop" : ""
          }`}
          style={{
            borderColor: checked ? tint : T.borderStrong,
            background: checked ? tint : "transparent",
            boxShadow: checked ? `0 0 16px ${tint}80` : "none",
            transform: checked && !pop ? "scale(1.06)" : "scale(1)",
          }}
        >
          <Check
            size={size === "sm" ? 11 : 14}
            strokeWidth={4}
            className="transition-all duration-200"
            style={{
              color: T.bgDeep,
              opacity: checked ? 1 : 0,
              transform: checked ? "scale(1)" : "scale(0.4)",
            }}
          />
        </span>
      </span>
      <span
        className="min-w-0 flex-1 truncate text-[13.5px] transition-all duration-300"
        style={{
          color: checked ? tint : "rgba(248,250,252,0.86)",
          /* Longhands, not the `textDecoration` shorthand beside its own
             colour. React applies the two in object order and warns that
             a re-render can have the shorthand wipe the longhand — the
             same trap as `background` erasing `backgroundImage`, which
             already cost this project the sheen on its cards once. */
          textDecorationLine: checked ? "line-through" : "none",
          textDecorationColor: `${tint}80`,
        }}
      >
        {label}
      </span>
    </button>
  );
}

/* --- discipline ring -------------------------------------------------- *
 *  The gradient ramps cool→hot as the day fills and keeps rotating, so a
 *  glance at the ring reads as momentum rather than a static gauge.
 * ---------------------------------------------------------------------- */
function ProgressRing({
  value,
  size = 168,
  stroke = 12,
  label = "مؤشر الانضباط",
  fullLabel = "يوم مكتمل 🔥",
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value));
  const full = pct >= 100;
  const hit = pct >= STREAK_TARGET;
  const still = usePrefersReducedMotion();
  const gid = useMemo(() => `los-ring-${uid()}`, []);

  const ramp = full
    ? [T.primaryLift, T.primary, T.sky]
    : hit
    ? [T.primary, T.primaryLift, T.accent]
    : pct >= 50
    ? [T.accent, T.ember, T.cta]
    : [T.cta, T.ctaLift, T.accent];

  const lead = full ? T.primaryLift : hit ? T.primary : pct >= 50 ? T.accent : T.cta;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className={`pointer-events-none absolute inset-3 rounded-full blur-2xl transition-all duration-700${
          full && !still ? " los-halo" : ""
        }`}
        style={{
          background: `radial-gradient(circle, ${ramp[0]} 0%, ${ramp[2]} 70%, transparent 100%)`,
          opacity: full ? 0.45 : hit ? 0.28 : 0.14,
        }}
      />
      <svg width={size} height={size} className="relative -rotate-90">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={ramp[0]} />
            <stop offset="50%" stopColor={ramp[1]} />
            <stop offset="100%" stopColor={ramp[2]} />
            {!still && (
              <animateTransform
                attributeName="gradientTransform"
                type="rotate"
                from="0 0.5 0.5"
                to="360 0.5 0.5"
                dur="7s"
                repeatCount="indefinite"
              />
            )}
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          style={{
            transition: "stroke-dashoffset 900ms cubic-bezier(.22,1,.36,1)",
            filter: `drop-shadow(0 0 ${full ? 18 : 12}px ${lead}AA)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        {/* The throb lives on a wrapper: a transform on the same element as
            background-clip:text collapses the clip in Chrome and the number
            paints as a solid block. */}
        <span className={full && !still ? "los-throb" : undefined}>
          <span
            className="block font-extrabold leading-none tabular-nums"
            style={{
              fontSize: size * 0.27,
              backgroundImage: `linear-gradient(135deg, ${ramp[0]}, ${ramp[1]}, ${ramp[2]})`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: lead,
            }}
          >
            {pct}
            <span className="align-super text-[0.45em] font-bold">%</span>
          </span>
        </span>
        <span
          className="mt-1 text-[10.5px] font-bold leading-tight"
          style={{ color: full ? T.primaryLift : T.faint }}
        >
          {full ? fullLabel : label}
        </span>
      </div>
    </div>
  );
}

/* ==================================================================== *
 *  The 80/20 hook — exactly three non-negotiables a day
 * ==================================================================== */
function TopThree({ state, setState }) {
  const picked = state.tasks.filter((t) => t.today);
  const done = picked.filter((t) => t.done).length;
  const slots = [...Array(TOP_TASK_CAP)].map((_, i) => picked[i] || null);
  const full = picked.length >= TOP_TASK_CAP;

  const patch = (id, next) =>
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...next } : t)),
    }));

  return (
    <Card
      className="p-6 sm:p-7"
      style={{
        borderColor: done === TOP_TASK_CAP ? `${T.primary}70` : `${T.cta}59`,
        boxShadow:
          done === TOP_TASK_CAP
            ? `inset 0 1px 0 0 rgba(255,255,255,0.15), 0 0 46px -18px ${T.primary}`
            : `inset 0 1px 0 0 rgba(255,255,255,0.15), 0 0 46px -20px ${T.cta}`,
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border"
            style={{
              borderColor: `${T.cta}59`,
              background: `linear-gradient(160deg, ${T.cta}3D, ${T.cta}0F)`,
              color: T.ctaLift,
            }}
          >
            <Zap size={20} strokeWidth={2.4} />
          </span>
          <div>
            <h3 className="text-[17px] font-extrabold" style={{ color: T.ctaLift }}>
              أهم ٣ مهام اليوم
            </h3>
            <p className="text-[11.5px] leading-relaxed" style={{ color: T.faint }}>
              ثلاث فقط. لو أنجزتها وحدها، كان اليوم ناجحًا.
            </p>
          </div>
        </div>
        <Badge tint={done === TOP_TASK_CAP ? T.primary : T.cta}>
          <span dir="ltr" className="tabular-nums">
            {done}/{TOP_TASK_CAP}
          </span>
          {" منجزة"}
        </Badge>
      </div>

      <div className="mt-5 space-y-2.5">
        {slots.map((task, i) =>
          task ? (
            <div key={task.id} className="flex items-center gap-2.5">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-extrabold tabular-nums"
                style={{
                  background: task.done ? `${T.primary}26` : `${T.cta}26`,
                  color: task.done ? T.primary : T.ctaLift,
                }}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <TaskChip
                  task={task}
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", task.id)}
                  onToggleDone={() => patch(task.id, { done: !task.done })}
                  onToggleToday={() => patch(task.id, { today: false })}
                  onDelete={() =>
                    setState((s) => ({
                      ...s,
                      tasks: s.tasks.filter((t) => t.id !== task.id),
                    }))
                  }
                />
              </div>
            </div>
          ) : (
            <div key={`slot-${i}`} className="flex items-center gap-2.5">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-extrabold tabular-nums"
                style={{ background: "rgba(255,255,255,0.06)", color: T.faint }}
              >
                {i + 1}
              </span>
              <p
                className="flex-1 rounded-xl border border-dashed py-3 text-center text-[11.5px]"
                style={{ borderColor: T.border, color: T.faint }}
              >
                اختر مهمة من مصفوفة المهام
              </p>
            </div>
          ),
        )}
      </div>

      {full && (
        <p
          className="mt-4 rounded-xl border px-3.5 py-2.5 text-center text-[11.5px] leading-relaxed"
          style={{
            borderColor: `${T.accent}3D`,
            background: `${T.accent}12`,
            color: T.accent,
          }}
        >
          القائمة مكتملة. أنجِز واحدة قبل أن تضيف غيرها — هذا هو الشرط.
        </p>
      )}
    </Card>
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

/* Asked right after a reading habit is ticked. Deliberately skippable: the
   habit is already done and animated by the time this opens, so refusing to
   type a number must never undo the completion. */
function ReadLogModal({ open, book, onClose, onLog }) {
  const [pages, setPages] = useState("");

  useEffect(() => {
    if (open) setPages("");
  }, [open, book?.id]);

  if (!open) return null;

  const commit = (n) => {
    const v = parseInt(n, 10);
    if (!Number.isFinite(v) || v <= 0) return;
    onLog(v);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={book ? "كم صفحة قرأت؟" : "لا كتاب نشط"}
      footer={
        book ? (
          <>
            <Btn
              variant="default"
              className="flex-1"
              onClick={() => commit(pages)}
            >
              سجّل
            </Btn>
            <Btn variant="outline" className="flex-1" onClick={onClose}>
              تخطّي
            </Btn>
          </>
        ) : (
          <Btn variant="outline" className="flex-1" onClick={onClose}>
            حسنًا
          </Btn>
        )
      }
    >
      {book ? (
        <div className="space-y-4">
          <p className="text-[12.5px] leading-relaxed" style={{ color: T.muted }}>
            من <span style={{ color: T.accent }}>«{book.title}»</span>
            {pctOf(book) !== null && (
              <>
                {" "}
                — أنت عند الصفحة{" "}
                <span dir="ltr" className="tabular-nums">
                  {book.page}
                </span>
              </>
            )}
          </p>

          <div className="flex flex-wrap gap-2">
            {[10, 20, 30, 50].map((n) => (
              <button
                key={n}
                onClick={() => setPages(String(n))}
                className="rounded-xl border px-4 py-2 text-xs font-bold tabular-nums transition-all duration-200 hover:scale-105"
                dir="ltr"
                style={{
                  borderColor:
                    pages === String(n) ? `${T.cta}80` : T.border,
                  background: pages === String(n) ? `${T.cta}1F` : "transparent",
                  color: pages === String(n) ? T.ctaLift : T.muted,
                }}
              >
                {n}
              </button>
            ))}
          </div>

          <div>
            <label
              htmlFor="los-read-pages"
              className="mb-1.5 block text-xs text-white/45"
            >
              أو اكتب العدد
            </label>
            <Field
              id="los-read-pages"
              value={pages}
              autoFocus
              inputMode="numeric"
              onChange={(e) => setPages(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && commit(pages)}
              placeholder="عدد الصفحات"
              className="tabular-nums"
            />
          </div>
        </div>
      ) : (
        <p className="text-[12.5px] leading-relaxed" style={{ color: T.muted }}>
          هذه العادة مربوطة بالكتاب الذي تقرأه الآن، ولا كتاب موسوم بـ«أقرأه
          الآن» في مكتبتك. علّم كتابًا بهذه الحالة، أو اربط العادة بكتاب بعينه
          من تعديل العادة.
        </p>
      )}
    </Modal>
  );
}

function HabitRow({
  habit,
  linkedBook,
  streak = 0,
  onToggle,
  onEdit,
  onDelete,
  onNudge,
  onDrop,
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

  const drop = (id) =>
    setState((s) => ({ ...s, quotes: s.quotes.filter((q) => q.id !== id) }));

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

function RoutineModule({
  state,
  setState,
  discipline,
  streak,
  quote,
  onShuffleQuote,
  mirror,
  savedAt,
  onOpenMirror,
  onOpenReflect,
  onOpenSettings,
  onGoGoals,
  reflected,
}) {
  const [editing, setEditing] = useState(null); // {id?, label, group}
  const [quotesOpen, setQuotesOpen] = useState(false);
  const [logging, setLogging] = useState(null); // habit awaiting a page count
  const [dragging, setDragging] = useState(null); // habit id being dragged
  const [overGroup, setOverGroup] = useState(null);
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

  const toggle = (id) => {
    const habit = state.habits.find((h) => h.id === id);
    const turningOn = habit && !habit.done;

    setState((s) => {
      const next = {
        ...s,
        habits: s.habits.map((h) => (h.id === id ? { ...h, done: !h.done } : h)),
      };
      /* Unticking withdraws today's sessions for this habit and rolls the
         page counters back, so the library never keeps pages that were
         undone in the routine. */
      if (habit && habit.book && !turningOn) {
        const today = dayKey();
        const dropped = (s.reading || []).filter(
          (r) => r.habitId === id && r.date === today,
        );
        if (dropped.length) {
          const back = new Map();
          for (const r of dropped)
            back.set(r.bookId, (back.get(r.bookId) || 0) + r.pages);
          next.reading = (s.reading || []).filter(
            (r) => !(r.habitId === id && r.date === today),
          );
          next.books = s.books.map((b) => {
            const n = back.get(b.id);
            if (!n) return b;
            const at = parseInt(b.page, 10);
            if (!Number.isFinite(at)) return b;
            return { ...b, page: String(Math.max(0, at - n)) };
          });
        }
      }
      return next;
    });

    /* Ask only after the tick has landed, so the reward animation plays
       and a skipped prompt still leaves the habit done. */
    if (habit?.book && turningOn) setLogging(habit);
  };

  const logRead = (pages) => {
    const habit = logging;
    if (!habit) return;
    setState((s) => {
      const book = bookForHabit(habit, s.books);
      if (!book) return s;
      const total = parseInt(book.pages, 10);
      const at = parseInt(book.page, 10);
      const base = Number.isFinite(at) ? at : 0;
      const next = Number.isFinite(total) && total > 0
        ? Math.min(total, base + pages)
        : base + pages;
      return {
        ...s,
        reading: [
          ...(s.reading || []),
          { id: uid(), date: dayKey(), bookId: book.id, habitId: habit.id, pages },
        ],
        books: s.books.map((b) =>
          b.id === book.id ? { ...b, page: String(next) } : b,
        ),
      };
    });
    setLogging(null);
  };

  const save = () => {
    const label = editing.label.trim();
    if (!label) return;
    setState((s) => ({
      ...s,
      habits: editing.id
        ? s.habits.map((h) =>
            h.id === editing.id
              ? { ...h, label, group: editing.group, book: editing.book || null }
              : h
          )
        : [
            ...s.habits,
            {
              id: uid(),
              label,
              group: editing.group,
              done: false,
              book: editing.book || null,
            },
          ],
    }));
    setEditing(null);
  };

  const remove = (id) =>
    setState((s) => ({ ...s, habits: s.habits.filter((h) => h.id !== id) }));

  const reorder = (dragId, targetId) =>
    setState((s) => ({ ...s, habits: dropHabit(s.habits, dragId, targetId) }));

  const moveToGroup = (dragId, group) =>
    setState((s) => ({ ...s, habits: dropHabitInGroup(s.habits, dragId, group) }));

  const nudge = (id, dir) =>
    setState((s) => ({ ...s, habits: nudgeHabit(s.habits, id, dir) }));

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
          <SaveStamp at={savedAt} />
          <p className="mt-3 max-w-sm text-xs leading-relaxed text-white/35">
            {done} من {state.habits.length} عادة. المؤشر يمتلئ مع كل علامة —
            وعند ٨٠٪ يُحتسب اليوم في سلسلتك.
          </p>
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
              <span className="text-[11px] text-white/35">يوم متتالٍ</span>
            </div>
            <Btn
              variant="default"
              size="sm"
              onClick={() => setEditing({ label: "", group: "morning", book: null })}
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
                      onToggle={() => toggle(h.id)}
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
        onClose={() => setLogging(null)}
        onLog={logRead}
      />

      <QuotesModal
        open={quotesOpen}
        onClose={() => setQuotesOpen(false)}
        quotes={state.quotes || []}
        setState={setState}
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

/* ==================================================================== *
 *  MODULE 2 — Eisenhower matrix
 * ==================================================================== */
function TaskChip({ task, onToggleToday, onToggleDone, onDelete, onDragStart }) {
  const [burst, fireBurst] = useBurst(700);

  const handleDone = () => {
    if (!task.done) fireBurst();
    onToggleDone();
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`group flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-all duration-200 hover:border-white/25${burst ? " los-reward" : ""}`}
      style={{
        borderColor: burst ? T.primary : task.done ? `${T.primary}55` : T.border,
        background: burst
          ? `${T.primary}2E`
          : task.done
          ? `${T.primary}14`
          : "rgba(255,255,255,0.04)",
        cursor: "grab",
      }}
    >
      <GripVertical
        size={13}
        className="shrink-0 text-white/15 transition-colors group-hover:text-white/35"
      />
      <Checkbox
        checked={task.done}
        onToggle={handleDone}
        label={task.text}
        size="sm"
      />
      <button
        onClick={onToggleToday}
        aria-pressed={task.today}
        aria-label="إضافة إلى مهام اليوم"
        title="مهام اليوم"
        className="shrink-0 rounded p-1 transition-colors"
        style={{ color: task.today ? T.accent : "rgba(255,255,255,0.15)" }}
      >
        <Target size={14} strokeWidth={task.today ? 2.6 : 2} />
      </button>
      <button
        onClick={onDelete}
        aria-label={`حذف ${task.text}`}
        className="shrink-0 rounded p-1 text-white/25 opacity-40 transition-all hover:text-red-400 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

function MatrixModule({ state, setState }) {
  const [draft, setDraft] = useState("");
  const [draftQ, setDraftQ] = useState("q2");
  const [over, setOver] = useState(null);
  const [capHit, fireCapHit] = useBurst(2800);

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    setState((s) => ({
      ...s,
      tasks: [
        ...s.tasks,
        { id: uid(), text, quadrant: draftQ, today: false, done: false },
      ],
    }));
    setDraft("");
  };

  const patch = (id, p) =>
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...p } : t)),
    }));

  /* The cap is the whole point of the rule, so a fourth pick is refused
     outright rather than quietly hidden — and it says why. */
  const promote = (id) => {
    const t = state.tasks.find((x) => x.id === id);
    if (!t || t.today) return;
    if (state.tasks.filter((x) => x.today).length >= TOP_TASK_CAP) {
      fireCapHit();
      return;
    }
    patch(id, { today: true });
  };

  const toggleToday = (t) =>
    t.today ? patch(t.id, { today: false }) : promote(t.id);

  const remove = (id) =>
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));

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
 *  MODULE — AI prompt vault
 * ==================================================================== */
function PromptCard({ prompt, onEdit, onDelete }) {
  const [copied, fireCopied] = useBurst(1800);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.body);
      fireCopied();
    } catch {
      /* clipboard can be blocked — select-and-copy still works manually */
    }
  };

  return (
    <Card className="group flex flex-col p-5 sm:p-6">
      <div className="flex items-start gap-2.5">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
          style={{
            borderColor: `${T.violet}45`,
            background: `${T.violet}18`,
            color: T.violet,
          }}
        >
          <Bot size={16} strokeWidth={1.9} />
        </span>
        <h3 className="min-w-0 flex-1 pt-1.5 text-[15px] font-bold">
          {prompt.title}
        </h3>
        <button
          onClick={onEdit}
          aria-label={`تعديل ${prompt.title}`}
          className="shrink-0 rounded p-1.5 text-white/25 opacity-40 transition-all hover:text-white/70 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={onDelete}
          aria-label={`حذف ${prompt.title}`}
          className="shrink-0 rounded p-1.5 text-white/25 opacity-40 transition-all hover:text-red-400 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <p
        className="mt-3.5 flex-1 rounded-xl border px-3.5 py-3 text-[12.5px] leading-relaxed"
        style={{
          borderColor: T.border,
          background: "rgba(255,255,255,0.03)",
          color: "rgba(248,250,252,0.72)",
        }}
      >
        {prompt.body}
      </p>

      <Btn
        variant={copied ? "success" : "outline"}
        size="sm"
        className="mt-4 w-full"
        onClick={copy}
      >
        {copied ? (
          <>
            <CheckCheck size={14} /> نُسخ
          </>
        ) : (
          <>
            <Copy size={14} /> نسخ الأمر
          </>
        )}
      </Btn>
    </Card>
  );
}

function PromptsModule({ state, setState }) {
  const [editing, setEditing] = useState(null); // {id?, title, body}
  const prompts = state.prompts || [];

  const save = () => {
    const title = editing.title.trim();
    const body = editing.body.trim();
    if (!title || !body) return;
    setState((s) => ({
      ...s,
      prompts: editing.id
        ? s.prompts.map((p) => (p.id === editing.id ? { ...p, title, body } : p))
        : [{ id: uid(), title, body }, ...(s.prompts || [])],
    }));
    setEditing(null);
  };

  return (
    <div className="space-y-7">
      <Card className="flex flex-wrap items-end justify-between gap-4 p-6 sm:p-7">
        <div className="min-w-0">
          <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">
            خزنة الأوامر
          </h2>
          <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/40">
            الأوامر التي تُجيد صياغتها مرّة، تستعملها ألف مرّة. احفظها هنا بدل أن
            تكتبها من جديد كل يوم.
          </p>
        </div>
        <Btn
          variant="default"
          onClick={() => setEditing({ title: "", body: "" })}
          className="shrink-0"
        >
          <Plus size={15} strokeWidth={3} /> أمر جديد
        </Btn>
      </Card>

      {prompts.length === 0 ? (
        <Card className="py-14 text-center text-xs text-white/25">
          لا أوامر محفوظة بعد.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {prompts.map((p) => (
            <PromptCard
              key={p.id}
              prompt={p}
              onEdit={() => setEditing({ id: p.id, title: p.title, body: p.body })}
              onDelete={() =>
                setState((s) => ({
                  ...s,
                  prompts: s.prompts.filter((x) => x.id !== p.id),
                }))
              }
            />
          ))}
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "تعديل الأمر" : "أمر جديد"}
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
        <div className="space-y-4">
          <div>
            <label htmlFor="los-p-title" className="mb-1.5 block text-xs text-white/45">
              العنوان
            </label>
            <Field
              id="los-p-title"
              autoFocus
              value={editing?.title || ""}
              onChange={(e) => setEditing((s) => ({ ...s, title: e.target.value }))}
              placeholder="مثال: محاكي اختبار PMP"
            />
          </div>
          <div>
            <label htmlFor="los-p-body" className="mb-1.5 block text-xs text-white/45">
              نصّ الأمر
            </label>
            <Field
              id="los-p-body"
              as="textarea"
              rows={7}
              value={editing?.body || ""}
              onChange={(e) => setEditing((s) => ({ ...s, body: e.target.value }))}
              className="resize-none leading-relaxed"
              placeholder="تصرّف كـ…"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ==================================================================== *
 *  MODULE — tactical weekly review
 * ==================================================================== */
const weekKey = (d = logicalNow()) => {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  t.setDate(t.getDate() - ((t.getDay() + 1) % 7)); // weeks start Saturday
  return dayKey(t);
};

function TacticalModule({ state, setState }) {
  const reviews = useMemo(
    () => [...(state.reviews || [])].sort((a, b) => (a.week < b.week ? 1 : -1)),
    [state.reviews],
  );
  const thisWeek = weekKey();
  const current = reviews.find((r) => r.week === thisWeek);
  const [threat, setThreat] = useState("");
  const [move, setMove] = useState("");
  const [saved, fireSaved] = useBurst(2200);

  useEffect(() => {
    setThreat(current?.threat || "");
    setMove(current?.move || "");
  }, [current?.threat, current?.move]);

  const save = () => {
    const t = threat.trim();
    const m = move.trim();
    if (!t && !m) return;
    setState((s) => {
      const rest = (s.reviews || []).filter((r) => r.week !== thisWeek);
      return {
        ...s,
        reviews: [...rest, { id: current?.id || uid(), week: thisWeek, threat: t, move: m }],
      };
    });
    fireSaved();
  };

  const panels = [
    {
      key: "threat",
      title: "القطع المهدَّدة",
      hint: "ما الذي تراجع هذا الأسبوع؟ سمّه بلا تجميل.",
      icon: Swords,
      tint: T.danger,
      value: threat,
      set: setThreat,
      placeholder: "مثال: النادي توقّف ٤ أيام، ومذاكرة PMP صفر…",
    },
    {
      key: "move",
      title: "النقلة القادمة",
      hint: "إجراء واحد حاسم للأسبوع القادم. واحد فقط.",
      icon: Target,
      tint: T.cta,
      value: move,
      set: setMove,
      placeholder: "مثال: جلسة PMP ٩٠ دقيقة يوميًّا قبل الظهر…",
    },
  ];

  return (
    <div className="space-y-7">
      <Card className="p-6 sm:p-7">
        <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">
          المراجعة التكتيكية
        </h2>
        <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/40">
          مرّة كل أسبوع، انظر إلى اللوح من فوق: أي قطعة تتعرّض للتهديد، وما
          النقلة الواحدة التي تغيّر الموقف.
        </p>
        <div className="mt-4">
          <Badge tint={T.accent}>
            {"أسبوع "}
            <span dir="ltr" className="tabular-nums">
              {thisWeek}
            </span>
          </Badge>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {panels.map((p) => {
          const Icon = p.icon;
          return (
            <Card
              key={p.key}
              className="p-6 sm:p-7"
              style={{ borderColor: `${p.tint}3D` }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: `${p.tint}59`,
                    background: `${p.tint}18`,
                    color: p.tint,
                  }}
                >
                  <Icon size={18} strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-bold" style={{ color: p.tint }}>
                    {p.title}
                  </h3>
                  <p className="text-[11px]" style={{ color: T.faint }}>
                    {p.hint}
                  </p>
                </div>
              </div>
              <Field
                as="textarea"
                rows={6}
                value={p.value}
                onChange={(e) => p.set(e.target.value)}
                className="mt-4 resize-none leading-relaxed"
                placeholder={p.placeholder}
              />
            </Card>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Btn variant={saved ? "success" : "default"} onClick={save}>
          {saved ? (
            <>
              <CheckCheck size={15} /> حُفظت
            </>
          ) : (
            <>
              <NotebookPen size={15} /> احفظ مراجعة الأسبوع
            </>
          )}
        </Btn>
        <span className="text-[11.5px]" style={{ color: T.faint }}>
          الحفظ يستبدل مراجعة هذا الأسبوع، ولا يمسّ الأسابيع السابقة.
        </span>
      </div>

      {reviews.filter((r) => r.week !== thisWeek).length > 0 && (
        <Card className="p-6 sm:p-7">
          <h3 className="text-[17px] font-extrabold" style={{ color: T.accent }}>
            الأسابيع السابقة
          </h3>
          <div className="mt-4 space-y-3">
            {reviews
              .filter((r) => r.week !== thisWeek)
              .slice(0, 12)
              .map((r) => (
                <div
                  key={r.id}
                  className="group rounded-2xl border p-4"
                  style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      dir="ltr"
                      className="text-[11px] font-bold tabular-nums"
                      style={{ color: T.accent }}
                    >
                      {r.week}
                    </span>
                    <button
                      onClick={() =>
                        setState((s) => ({
                          ...s,
                          reviews: s.reviews.filter((x) => x.id !== r.id),
                        }))
                      }
                      aria-label={`حذف مراجعة ${r.week}`}
                      className="mr-auto shrink-0 rounded p-1 text-white/25 opacity-40 transition-all hover:text-red-400 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  {r.threat && (
                    <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: T.danger }}>
                      <span style={{ color: T.faint }}>المهدَّد: </span>
                      {r.threat}
                    </p>
                  )}
                  {r.move && (
                    <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: T.ctaLift }}>
                      <span style={{ color: T.faint }}>النقلة: </span>
                      {r.move}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ==================================================================== *
 *  MODULE — 90-day sprint pipeline
 * ==================================================================== */
function PipelineModule({ state, setState }) {
  const [draft, setDraft] = useState("");
  const [over, setOver] = useState(null);
  const cards = state.pipeline || [];

  const add = () => {
    const title = draft.trim();
    if (!title) return;
    setState((s) => ({
      ...s,
      pipeline: [...(s.pipeline || []), { id: uid(), title, lane: "todo" }],
    }));
    setDraft("");
  };

  const moveTo = (id, lane) =>
    setState((s) => ({
      ...s,
      pipeline: s.pipeline.map((c) => (c.id === id ? { ...c, lane } : c)),
    }));

  const shift = (card, dir) => {
    const i = LANES.findIndex((l) => l.id === card.lane);
    const next = LANES[Math.min(LANES.length - 1, Math.max(0, i + dir))];
    if (next && next.id !== card.lane) moveTo(card.id, next.id);
  };

  const remove = (id) =>
    setState((s) => ({ ...s, pipeline: s.pipeline.filter((c) => c.id !== id) }));

  const done = cards.filter((c) => c.lane === "done").length;

  return (
    <div className="space-y-7">
      <Card className="p-6 sm:p-7">
        <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">
          خط سير المشاريع
        </h2>
        <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/40">
          محطّات الـ ٩٠ يومًا. اسحب البطاقة بين الأعمدة، أو حرّكها بالسهمين على
          الجوال.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Field
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="محطّة جديدة…"
          />
          <Btn variant="default" onClick={add} className="shrink-0">
            <Plus size={15} strokeWidth={3} /> إضافة
          </Btn>
        </div>
        <div className="mt-4">
          <Badge tint={done === cards.length && cards.length ? T.primary : T.accent}>
            <span dir="ltr" className="tabular-nums">
              {done}/{cards.length}
            </span>
            {" مكتملة"}
          </Badge>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {LANES.map((lane, li) => {
          const list = cards.filter((c) => c.lane === lane.id);
          return (
            <Card
              key={lane.id}
              className="p-5 transition-all duration-200 sm:p-6"
              style={{
                borderColor: over === lane.id ? lane.tint : `${lane.tint}33`,
                boxShadow:
                  over === lane.id
                    ? `inset 0 1px 0 0 rgba(255,255,255,0.085), 0 0 40px -14px ${lane.tint}`
                    : undefined,
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(lane.id);
              }}
              onDragLeave={() => setOver((o) => (o === lane.id ? null : o))}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                const id = e.dataTransfer.getData("text/plain");
                if (id) moveTo(id, lane.id);
              }}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: lane.tint, boxShadow: `0 0 8px ${lane.tint}` }}
                />
                <h3 className="text-[15px] font-bold">{lane.label}</h3>
                <span className="mr-auto text-[11px] tabular-nums text-white/30">
                  {list.length}
                </span>
              </div>

              <div className="mt-4 min-h-[120px] space-y-2.5">
                {list.length === 0 ? (
                  <p
                    className="rounded-xl border border-dashed py-8 text-center text-[11px]"
                    style={{ borderColor: T.border, color: T.faint }}
                  >
                    لا محطّات هنا
                  </p>
                ) : (
                  list.map((c) => (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", c.id)}
                      className="group rounded-xl border px-3.5 py-3 transition-all duration-200 hover:border-white/25"
                      style={{
                        borderColor: c.lane === "done" ? `${T.primary}45` : T.border,
                        background:
                          c.lane === "done"
                            ? `${T.primary}0F`
                            : "rgba(255,255,255,0.04)",
                        cursor: "grab",
                      }}
                    >
                      <p
                        className="text-[13px] leading-relaxed"
                        style={{
                          color: c.lane === "done" ? T.primary : "rgba(248,250,252,0.86)",
                          textDecoration: c.lane === "done" ? "line-through" : "none",
                        }}
                      >
                        {c.title}
                      </p>
                      <div className="mt-2.5 flex items-center gap-1">
                        <button
                          onClick={() => shift(c, -1)}
                          disabled={li === 0}
                          aria-label="إرجاع للعمود السابق"
                          className="rounded p-1 text-white/30 transition-colors hover:text-white/70 disabled:opacity-20"
                        >
                          <ArrowRight size={13} />
                        </button>
                        <button
                          onClick={() => shift(c, 1)}
                          disabled={li === LANES.length - 1}
                          aria-label="تقديم للعمود التالي"
                          className="rounded p-1 text-white/30 transition-colors hover:text-white/70 disabled:opacity-20"
                        >
                          <ArrowLeft size={13} />
                        </button>
                        <button
                          onClick={() => remove(c.id)}
                          aria-label={`حذف ${c.title}`}
                          className="mr-auto rounded p-1 text-white/25 opacity-40 transition-all hover:text-red-400 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
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
 *  MODULE — deep work
 * ==================================================================== */
function DeepWorkModule({ state, setState }) {
  const [minutes, setMinutes] = useState(SESSIONS[0].min);
  const [endAt, setEndAt] = useState(null); // epoch ms while running
  const [left, setLeft] = useState(SESSIONS[0].min * 60);
  const [focusId, setFocusId] = useState(null);
  const [rang, setRang] = useState(false);
  const still = usePrefersReducedMotion();

  const picked = state.tasks.filter((t) => t.today);
  const focus = picked.find((t) => t.id === focusId) || null;
  const running = endAt !== null;

  /* Driven by a target timestamp, not by decrementing a counter — an
     interval drifts and is throttled hard in a background tab, so a
     counted-down timer silently loses minutes while you work. */
  useEffect(() => {
    if (!running) return;
    const tick = () => setLeft(Math.max(0, Math.round((endAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [running, endAt]);

  const log = useCallback(
    (mins, taskId) =>
      setState((s) => ({
        ...s,
        sessions: [
          ...(s.sessions || []),
          { id: uid(), date: dayKey(), minutes: mins, taskId: taskId || null },
        ].slice(-400),
      })),
    [setState],
  );

  useEffect(() => {
    if (!running || left > 0 || rang) return;
    setRang(true);
    setEndAt(null);
    log(minutes, focusId);
    if (focusId) {
      setState((s) => ({
        ...s,
        tasks: s.tasks.map((t) => (t.id === focusId ? { ...t, done: true } : t)),
      }));
    }
  }, [running, left, rang, minutes, focusId, log, setState]);

  const start = () => {
    setRang(false);
    setEndAt(Date.now() + left * 1000);
  };
  const pause = () => {
    setEndAt(null);
    setLeft(Math.max(0, Math.round((endAt - Date.now()) / 1000)));
  };
  const stop = () => {
    setEndAt(null);
    setRang(false);
    setLeft(minutes * 60);
  };
  const choose = (m) => {
    setEndAt(null);
    setRang(false);
    setMinutes(m);
    setLeft(m * 60);
  };

  const total = minutes * 60;
  const pct = total ? ((total - left) / total) * 100 : 0;
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  const today = (state.sessions || []).filter((s) => s.date === dayKey());
  const todayMin = today.reduce((n, s) => n + s.minutes, 0);

  const SIZE = 268;
  const STROKE = 14;
  const r = (SIZE - STROKE) / 2;
  const c = 2 * Math.PI * r;
  const gid = useMemo(() => `los-deep-${uid()}`, []);
  const hot = left <= 60 && running;

  return (
    <div className="space-y-7">
      <Card className="p-6 sm:p-7">
        <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">
          العمل العميق
        </h2>
        <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/40">
          اختر مهمة واحدة، أغلق كل شيء آخر، وشغّل المؤقّت. الجولة المكتملة تُسجَّل
          وتُعلّم المهمة منجزة.
        </p>
      </Card>

      <Card className="flex flex-col items-center gap-7 p-6 sm:p-8">
        <div className="flex flex-wrap justify-center gap-2.5">
          {SESSIONS.map((s) => {
            const on = s.min === minutes;
            return (
              <button
                key={s.min}
                onClick={() => choose(s.min)}
                aria-pressed={on}
                className="rounded-2xl border px-5 py-3 text-center transition-all duration-200"
                style={{
                  borderColor: on ? `${T.cta}80` : T.border,
                  backgroundImage: on
                    ? `linear-gradient(160deg, ${T.cta}2E, ${T.cta}0A)`
                    : "none",
                  backgroundColor: on ? "transparent" : "rgba(255,255,255,0.03)",
                  color: on ? T.ctaLift : T.muted,
                }}
              >
                <span className="block text-[15px] font-extrabold">
                  <span dir="ltr" className="tabular-nums">
                    {s.min}
                  </span>{" "}
                  دقيقة
                </span>
                <span className="mt-0.5 block text-[10.5px]" style={{ color: T.faint }}>
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative" style={{ width: SIZE, height: SIZE }}>
          <div
            className={`pointer-events-none absolute inset-4 rounded-full blur-2xl transition-all duration-700${
              running && !still ? " los-halo" : ""
            }`}
            style={{
              background: `radial-gradient(circle, ${hot ? T.danger : T.cta} 0%, ${T.primary} 75%, transparent 100%)`,
              opacity: running ? 0.34 : 0.13,
            }}
          />
          <svg width={SIZE} height={SIZE} className="relative -rotate-90">
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={hot ? T.danger : T.cta} />
                <stop offset="55%" stopColor={T.ctaLift} />
                <stop offset="100%" stopColor={T.primary} />
                {!still && (
                  <animateTransform
                    attributeName="gradientTransform"
                    type="rotate"
                    from="0 0.5 0.5"
                    to="360 0.5 0.5"
                    dur="9s"
                    repeatCount="indefinite"
                  />
                )}
              </linearGradient>
            </defs>
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={r}
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth={STROKE}
            />
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={r}
              fill="none"
              stroke={`url(#${gid})`}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c - (pct / 100) * c}
              style={{
                transition: "stroke-dashoffset 300ms linear",
                filter: `drop-shadow(0 0 14px ${hot ? T.danger : T.cta}AA)`,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
            <span
              dir="ltr"
              className="text-[54px] font-extrabold leading-none tabular-nums"
              style={{ color: hot ? T.danger : T.fg }}
            >
              {mm}:{ss}
            </span>
            <span
              className="mt-2 line-clamp-2 text-[11.5px] leading-relaxed"
              style={{ color: focus ? T.ctaLift : T.faint }}
            >
              {focus ? focus.text : "بلا مهمة محدّدة"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {running ? (
            <Btn variant="outline" onClick={pause} style={{ borderColor: `${T.accent}59`, color: T.accent }}>
              <Pause size={15} /> إيقاف مؤقّت
            </Btn>
          ) : (
            <Btn variant="default" onClick={start} disabled={left === 0}>
              <Play size={15} /> {left === minutes * 60 ? "ابدأ" : "أكمل"}
            </Btn>
          )}
          <Btn variant="outline" onClick={stop}>
            <Square size={13} /> تصفير
          </Btn>
        </div>

        <div
          className="flex items-center gap-2 rounded-xl border px-4 py-2"
          style={{ borderColor: T.border, color: T.muted }}
        >
          <Timer size={14} style={{ color: T.primary }} />
          <span className="text-[11.5px]">
            اليوم:{" "}
            <span dir="ltr" className="font-bold tabular-nums" style={{ color: T.primary }}>
              {todayMin}
            </span>{" "}
            دقيقة في{" "}
            <span dir="ltr" className="font-bold tabular-nums" style={{ color: T.primary }}>
              {today.length}
            </span>{" "}
            جولة
          </span>
        </div>
      </Card>

      <Card className="p-6 sm:p-7">
        <h3 className="text-[17px] font-extrabold" style={{ color: T.ctaLift }}>
          على ماذا تركّز؟
        </h3>
        <p className="mt-1.5 text-[11.5px]" style={{ color: T.faint }}>
          من أهم ٣ مهام اليوم. الجولة المكتملة تُعلّمها منجزة تلقائيًّا.
        </p>
        <div className="mt-4 space-y-2.5">
          {picked.length === 0 ? (
            <p
              className="rounded-xl border border-dashed py-8 text-center text-[11.5px]"
              style={{ borderColor: T.border, color: T.faint }}
            >
              لم تختر مهام اليوم بعد — ارفع ثلاثًا من مصفوفة المهام
            </p>
          ) : (
            picked.map((t) => {
              const on = t.id === focusId;
              return (
                <button
                  key={t.id}
                  onClick={() => setFocusId(on ? null : t.id)}
                  aria-pressed={on}
                  disabled={running}
                  className="flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-right transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    borderColor: on ? `${T.cta}80` : T.border,
                    backgroundImage: on
                      ? `linear-gradient(160deg, ${T.cta}2E, ${T.cta}0A)`
                      : "none",
                    backgroundColor: on ? "transparent" : "rgba(255,255,255,0.03)",
                    color: on ? T.ctaLift : T.muted,
                  }}
                >
                  <Target size={15} strokeWidth={on ? 2.6 : 2} className="shrink-0" />
                  <span
                    className="min-w-0 flex-1 truncate text-[13.5px] font-bold"
                    style={{ textDecoration: t.done ? "line-through" : "none" }}
                  >
                    {t.text}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </Card>
    </div>
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

/* The two bars every clock draws: the window's own progress underneath, the
   goals' progress on top of it. Deliberately the same geometry in both the
   card and the strip, so the gap between them reads identically everywhere. */
function ClockBars({ clock, tint, thin = false }) {
  const h = thin ? "h-1" : "h-1.5";
  const track = `${h} block w-full overflow-hidden rounded-full`;
  return (
    <span className={`block ${thin ? "space-y-1" : "space-y-1.5"}`}>
      <span
        className={track}
        style={{ background: "rgba(255,255,255,0.07)" }}
        title={`مضى ${clock.pct}% من المدّة`}
      >
        <span
          className="block h-full rounded-full transition-all duration-700"
          style={{ width: `${clock.pct}%`, background: "rgba(255,255,255,0.3)" }}
        />
      </span>
      <span
        className={track}
        style={{ background: "rgba(255,255,255,0.07)" }}
        title={`أُنجز ${clock.hit}% من الأهداف`}
      >
        <span
          className="block h-full rounded-full transition-all duration-700"
          style={{
            width: `${clock.hit}%`,
            backgroundImage: `linear-gradient(90deg, ${tint}, ${tint}AA)`,
            boxShadow: clock.hit ? `0 0 10px ${tint}99` : "none",
          }}
        />
      </span>
    </span>
  );
}

/* The big number, written so the plural agrees with it: ٣ أيام but ٢٥ يومًا.
   A fixed noun beside a live counter is wrong most of the time. */
function DaysLeft({ clock, tint, size = "text-[30px]" }) {
  /* Spans throughout, never <p>: both callers render this inside a <button>,
     and a block element in there is invalid markup the browser is free to
     reflow out of the button entirely. */
  if (clock.state === "done")
    return (
      <span className="block text-[15px] font-extrabold" style={{ color: T.faint }}>
        انتهت المدّة
      </span>
    );
  return (
    <>
      <span className="flex items-baseline gap-1.5 leading-none">
        <span
          dir="ltr"
          className={`${size} font-extrabold tabular-nums`}
          style={{ color: tint }}
        >
          {clock.left}
        </span>
        <span className="text-[11px] font-bold" style={{ color: T.muted }}>
          {dayWord(clock.left)}
        </span>
      </span>
      {clock.state === "soon" && (
        <span className="mt-1 block text-[9.5px] font-bold" style={{ color: T.faint }}>
          يبدأ بعد{" "}
          <span dir="ltr" className="tabular-nums">
            {clock.until}
          </span>{" "}
          {dayWord(clock.until)}
        </span>
      )}
    </>
  );
}

/* The full card, for the goals screen. Three windows side by side, each
   saying how long is left, how much of it has gone, and how far its goals
   have got — and naming the gap between the last two out loud. */
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
          الشريط الباهت هو ما مضى من المدّة، والملوّن ما أُنجز من أهدافها. حين
          يسبق الباهتُ الملوّنَ فأنت متأخّر — وهذا هو الرقم الذي يستحقّ النظر.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {HORIZONS.map((h) => {
          const clock = horizonClock(h.id, all, year, quarter);
          const on = h.id === horizon;
          const label =
            h.id === "h3"
              ? ARC_LABEL
              : h.id === "year"
                ? String(year)
                : `${quarterOf(quarter).label} · ${year}`;
          return (
            <button
              key={h.id}
              onClick={() => onPick(h.id)}
              aria-pressed={on}
              className="rounded-2xl border p-4 text-right transition-all duration-200"
              style={{
                borderColor: on ? `${h.tint}80` : T.border,
                backgroundColor: on ? "transparent" : "rgba(255,255,255,0.03)",
                backgroundImage: on
                  ? `linear-gradient(160deg, ${h.tint}24, ${h.tint}08)`
                  : "none",
                boxShadow: on ? `0 10px 26px -18px ${h.tint}` : "none",
              }}
            >
              <span
                className="flex items-center gap-1.5 text-[12px] font-extrabold"
                style={{ color: h.tint }}
              >
                <h.icon size={13} strokeWidth={2.2} />
                {h.short}
              </span>
              <span className="mt-0.5 block text-[10px]" dir="auto" style={{ color: T.faint }}>
                {label}
              </span>

              <span className="mt-3 block">
                <DaysLeft clock={clock} tint={h.tint} />
              </span>

              <span className="mt-3 block">
                <ClockBars clock={clock} tint={h.tint} />
              </span>

              {/* Only the figure is LTR. Wrapping the Arabic word in it too
                  flips the pair and prints «مضى ٪٠». */}
              <span
                className="mt-2.5 flex items-center justify-between gap-2 text-[9.5px]"
                style={{ color: T.faint }}
              >
                {/* Latin «%», like every other figure in this file. The
                    Arabic sign U+066A is a terminator the bidi algorithm
                    reorders around the digits, and it printed «٪٧٦». */}
                <span>
                  مضى{" "}
                  <span dir="ltr" className="tabular-nums">
                    {clock.pct}%
                  </span>
                </span>
                <span>
                  أُنجز{" "}
                  <span dir="ltr" className="tabular-nums">
                    {clock.hit}%
                  </span>
                </span>
              </span>

              <span className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] font-bold"
                  style={{
                    background:
                      clock.goals && clock.done === clock.goals
                        ? `${T.primary}1A`
                        : "rgba(255,255,255,0.05)",
                    color:
                      clock.goals && clock.done === clock.goals ? T.primary : T.muted,
                  }}
                >
                  <Flag size={9} />
                  <span dir="ltr" className="tabular-nums">
                    {clock.done}/{clock.goals}
                  </span>
                </span>
                {clock.pace && (
                  <span
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] font-bold"
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
            </button>
          );
        })}
      </div>
    </Card>
  );
}

/* The same three clocks, slimmed to a strip for the routine screen. It sits
   above the habit blocks on purpose: the habits are what spend the days the
   strip is counting, and seeing the two together is the whole point. */
function CountdownStrip({ state, onGo }) {
  const all = useMemo(() => (state.goals || []).map(goalShape), [state.goals]);
  /* The calendar being lived in, not the arc's first year. On this screen
     «كم بقي من السنة» can only mean the year outside the window. */
  const here = new Date().getFullYear();
  const year = GOAL_YEARS.includes(here) ? here : GOAL_YEARS[0];
  const quarter = GOAL_YEARS.includes(here) ? currentQuarter() : QUARTERS[0].id;
  const label = { h3: ARC_LABEL, year: String(year), quarter: quarterOf(quarter).label };

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3
          className="flex items-center gap-2 text-[14px] font-extrabold"
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

      <div className="mt-4 grid grid-cols-3 gap-2.5">
        {HORIZONS.map((h) => {
          const clock = horizonClock(h.id, all, year, quarter);
          return (
            <div
              key={h.id}
              className="rounded-xl border px-3 py-3"
              style={{ borderColor: `${h.tint}33`, background: `${h.tint}0D` }}
            >
              <p
                className="flex items-center gap-1 text-[10px] font-extrabold"
                style={{ color: h.tint }}
              >
                <h.icon size={11} strokeWidth={2.2} />
                <span className="truncate">{h.short}</span>
              </p>
              <p className="mt-0.5 truncate text-[9px]" dir="auto" style={{ color: T.faint }}>
                {label[h.id]}
              </p>
              <div className="mt-2">
                <DaysLeft clock={clock} tint={h.tint} size="text-[22px]" />
              </div>
              <div className="mt-2.5">
                <ClockBars clock={clock} tint={h.tint} thin />
              </div>
              {clock.pace && (
                <p
                  className="mt-2 truncate text-[9px] font-bold"
                  style={{ color: clock.pace.tint }}
                  title={clock.pace.label}
                >
                  {clock.pace.label}
                </p>
              )}
            </div>
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

  const remove = (id) =>
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

/* ==================================================================== *
 *  MODULE — flexible income & side ventures
 * ==================================================================== */
const money = (n) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    Math.round(n || 0),
  );

function FinanceModule({ state, setState }) {
  const [label, setLabel] = useState("");
  const [hours, setHours] = useState("");
  const [amount, setAmount] = useState("");
  const [venture, setVenture] = useState(null); // {id?, name, cost, revenue}

  const income = state.income || [];
  const ventures = state.ventures || [];

  const since = (days) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (days - 1));
    return income.filter((e) => new Date(e.date) >= d);
  };
  const week = since(7);
  const month = since(30);
  const sum = (list) => list.reduce((n, e) => n + (e.amount || 0), 0);
  const hoursOf = (list) => list.reduce((n, e) => n + (e.hours || 0), 0);
  const weekTotal = sum(week);
  const monthTotal = sum(month);
  const monthHours = hoursOf(month);
  const rate = monthHours ? monthTotal / monthHours : 0;

  const addIncome = () => {
    const amt = parseFloat(amount);
    if (!Number.isFinite(amt) || amt <= 0) return;
    const hrs = parseFloat(hours);
    setState((s) => ({
      ...s,
      income: [
        {
          id: uid(),
          date: dayKey(),
          label: label.trim() || "عمل مرن",
          hours: Number.isFinite(hrs) && hrs > 0 ? hrs : 0,
          amount: amt,
        },
        ...(s.income || []),
      ].slice(0, 500),
    }));
    setLabel("");
    setHours("");
    setAmount("");
  };

  const removeIncome = (id) =>
    setState((s) => ({ ...s, income: s.income.filter((e) => e.id !== id) }));

  const saveVenture = () => {
    const name = venture.name.trim();
    if (!name) return;
    const cost = parseFloat(venture.cost) || 0;
    const revenue = parseFloat(venture.revenue) || 0;
    setState((s) => ({
      ...s,
      ventures: venture.id
        ? s.ventures.map((v) =>
            v.id === venture.id ? { ...v, name, cost, revenue } : v,
          )
        : [...(s.ventures || []), { id: uid(), name, cost, revenue }],
    }));
    setVenture(null);
  };

  const stats = [
    { label: "هذا الأسبوع", value: weekTotal, tint: T.primary, icon: Coins },
    { label: "آخر ٣٠ يومًا", value: monthTotal, tint: T.accent, icon: Wallet },
    { label: "معدّل الساعة", value: rate, tint: T.sky, icon: TrendingUp },
  ];

  return (
    <div className="space-y-7">
      <Card className="p-6 sm:p-7">
        <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">
          الدخل والمشاريع
        </h2>
        <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/40">
          سجّل ساعاتك ودخلك المرن، واحسب كلفة أي فكرة قبل أن تبدأها. الأرقام
          بالريال.
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5 sm:p-6">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: `${s.tint}45`,
                    background: `${s.tint}16`,
                    color: s.tint,
                  }}
                >
                  <Icon size={16} strokeWidth={1.9} />
                </span>
                <span className="text-[11.5px]" style={{ color: T.faint }}>
                  {s.label}
                </span>
              </div>
              <p
                className="mt-3 text-2xl font-extrabold tabular-nums"
                dir="ltr"
                style={{ color: s.tint }}
              >
                {money(s.value)}
              </p>
            </Card>
          );
        })}
      </div>

      <Card className="p-6 sm:p-7">
        <h3 className="text-[17px] font-extrabold" style={{ color: T.ctaLift }}>
          تسجيل دخل
        </h3>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Field
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="المصدر — مثال: توصيل"
          />
          <Field
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            inputMode="decimal"
            placeholder="ساعات"
            className="sm:max-w-[130px]"
          />
          <Field
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addIncome()}
            inputMode="decimal"
            placeholder="المبلغ"
            className="sm:max-w-[150px]"
          />
          <Btn variant="default" onClick={addIncome} className="shrink-0">
            <Plus size={15} strokeWidth={3} /> إضافة
          </Btn>
        </div>

        <div className="mt-5 space-y-2">
          {income.length === 0 ? (
            <p
              className="rounded-xl border border-dashed py-8 text-center text-[11.5px]"
              style={{ borderColor: T.border, color: T.faint }}
            >
              لا دخل مسجّل بعد
            </p>
          ) : (
            income.slice(0, 12).map((e) => (
              <div
                key={e.id}
                className="group flex items-center gap-3 rounded-xl border px-4 py-2.5"
                style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
              >
                <span className="min-w-0 flex-1 truncate text-[13px]">{e.label}</span>
                {e.hours > 0 && (
                  <span
                    className="shrink-0 text-[10.5px] tabular-nums"
                    dir="ltr"
                    style={{ color: T.faint }}
                  >
                    {e.hours}h
                  </span>
                )}
                <span
                  className="shrink-0 text-[13px] font-extrabold tabular-nums"
                  dir="ltr"
                  style={{ color: T.primary }}
                >
                  {money(e.amount)}
                </span>
                <span className="shrink-0 text-[10px] tabular-nums" dir="ltr" style={{ color: T.faint }}>
                  {e.date.slice(5)}
                </span>
                <button
                  onClick={() => removeIncome(e.id)}
                  aria-label={`حذف ${e.label}`}
                  className="shrink-0 rounded p-1 text-white/25 opacity-40 transition-all hover:text-red-400 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-[17px] font-extrabold" style={{ color: T.ctaLift }}>
              أفكار ومشاريع
            </h3>
            <p className="mt-1.5 text-[11.5px]" style={{ color: T.faint }}>
              الكلفة مقابل العائد المتوقّع — قبل أن تصرف ريالًا.
            </p>
          </div>
          <Btn
            variant="default"
            size="sm"
            onClick={() => setVenture({ name: "", cost: "", revenue: "" })}
          >
            <Plus size={14} strokeWidth={3} /> فكرة جديدة
          </Btn>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {ventures.length === 0 ? (
            <p
              className="rounded-xl border border-dashed py-8 text-center text-[11.5px] lg:col-span-2"
              style={{ borderColor: T.border, color: T.faint }}
            >
              لا أفكار مسجّلة بعد
            </p>
          ) : (
            ventures.map((v) => {
              const profit = (v.revenue || 0) - (v.cost || 0);
              const good = profit >= 0;
              return (
                <div
                  key={v.id}
                  className="group rounded-2xl border p-4"
                  style={{
                    borderColor: good ? `${T.primary}3D` : `${T.danger}3D`,
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Lightbulb
                      size={15}
                      style={{ color: good ? T.primary : T.danger }}
                      className="shrink-0"
                    />
                    <span className="min-w-0 flex-1 truncate text-[14px] font-bold">
                      {v.name}
                    </span>
                    <button
                      onClick={() =>
                        setVenture({
                          id: v.id,
                          name: v.name,
                          cost: String(v.cost ?? ""),
                          revenue: String(v.revenue ?? ""),
                        })
                      }
                      aria-label={`تعديل ${v.name}`}
                      className="shrink-0 rounded p-1 text-white/25 transition-all hover:text-white/70"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() =>
                        setState((s) => ({
                          ...s,
                          ventures: s.ventures.filter((x) => x.id !== v.id),
                        }))
                      }
                      aria-label={`حذف ${v.name}`}
                      className="shrink-0 rounded p-1 text-white/25 transition-all hover:text-red-400"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    {[
                      { k: "الكلفة", v: v.cost, tint: T.faint },
                      { k: "العائد", v: v.revenue, tint: T.accent },
                      { k: "الربح", v: profit, tint: good ? T.primary : T.danger },
                    ].map((cell) => (
                      <div
                        key={cell.k}
                        className="rounded-xl py-2"
                        style={{ background: "rgba(255,255,255,0.04)" }}
                      >
                        <p className="text-[10px]" style={{ color: T.faint }}>
                          {cell.k}
                        </p>
                        <p
                          dir="ltr"
                          className="mt-0.5 text-[14px] font-extrabold tabular-nums"
                          style={{ color: cell.tint }}
                        >
                          {money(cell.v)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <Modal
        open={!!venture}
        onClose={() => setVenture(null)}
        title={venture?.id ? "تعديل الفكرة" : "فكرة جديدة"}
        footer={
          <>
            <Btn variant="default" className="flex-1" onClick={saveVenture}>
              حفظ
            </Btn>
            <Btn variant="outline" className="flex-1" onClick={() => setVenture(null)}>
              إلغاء
            </Btn>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="los-v-name" className="mb-1.5 block text-xs text-white/45">
              اسم الفكرة
            </label>
            <Field
              id="los-v-name"
              autoFocus
              value={venture?.name || ""}
              onChange={(e) => setVenture((s) => ({ ...s, name: e.target.value }))}
              placeholder="مثال: متجر إلكتروني صغير"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="los-v-cost" className="mb-1.5 block text-xs text-white/45">
                الكلفة المتوقّعة
              </label>
              <Field
                id="los-v-cost"
                inputMode="decimal"
                value={venture?.cost || ""}
                onChange={(e) => setVenture((s) => ({ ...s, cost: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div>
              <label htmlFor="los-v-rev" className="mb-1.5 block text-xs text-white/45">
                العائد المتوقّع
              </label>
              <Field
                id="los-v-rev"
                inputMode="decimal"
                value={venture?.revenue || ""}
                onChange={(e) => setVenture((s) => ({ ...s, revenue: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && saveVenture()}
                placeholder="0"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* --- image helpers --------------------------------------------------- */
function resizeImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const MAX_W = 280, MAX_H = 400;
        const scale = Math.min(MAX_W / img.width, MAX_H / img.height, 1);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ==================================================================== *
 *  MODULE 3 — Book vault
 * ==================================================================== */
/* Reading progress, or null when either number is missing — the card and
   the desk both ask this rather than each parsing the fields itself. */
function pctOf(b) {
  const total = parseInt(b.pages, 10);
  const at = parseInt(b.page, 10);
  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(at)) return null;
  return Math.max(0, Math.min(100, Math.round((at / total) * 100)));
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

  const remove = (id) =>
    setState((s) => ({ ...s, books: s.books.filter((b) => b.id !== id) }));

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
              { n: streak, k: "يوم متتالٍ", tint: T.ember },
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
                      const data = await resizeImage(file);
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

/* ==================================================================== *
 *  MODULE — habit breaker
 *  The mirror image of the routine screen: a streak you defend instead of
 *  one you build. The reset is deliberately expensive — it costs a written
 *  confession before it costs the days, because a counter you can zero
 *  with one tap is a counter that teaches nothing.
 * ==================================================================== */

/* Days to the next milestone, drawn as a bar plus four gates. The bar is
   scoped to the *next* gate rather than to 90 — at day 2 a bar that reads
   2% is discouraging, while one that reads 66% of three days is true and
   worth finishing. */
function MilestoneTrack({ days }) {
  const next = MILESTONES.find((m) => m.d > days) || null;
  const prev = [...MILESTONES].reverse().find((m) => m.d <= days);
  const floor = prev ? prev.d : 0;
  const span = next ? next.d - floor : 1;
  const pct = next ? Math.min(100, ((days - floor) / span) * 100) : 100;
  const tint = next ? T.cta : T.primary;

  return (
    <div className="mt-4">
      <div className="flex items-end justify-between gap-3">
        <p className="text-[11px]" style={{ color: T.faint }}>
          {next ? (
            <>
              {"البوابة القادمة: "}
              <span style={{ color: T.accent }}>{next.label}</span>
            </>
          ) : (
            "تجاوزت كل البوابات. أنت خارج دائرة الخطر."
          )}
        </p>
        {next && (
          <p className="shrink-0 text-[11px]" style={{ color: T.muted }}>
            {"باقٍ "}
            {/* "٢ يومان" says two twice — under three, the word counts on
                its own and the numeral is dropped. The separators are
                non-breaking: an ordinary space at the edge of a dir="ltr"
                span collapses, and the line renders as "باقٍ65يومًا". */}
            {next.d - days > 2 && (
              <>
                <span
                  dir="ltr"
                  className="font-bold tabular-nums"
                  style={{ color: T.cta }}
                >
                  {next.d - days}
                </span>
                {" "}
              </>
            )}
            <span style={{ color: next.d - days > 2 ? undefined : T.cta }}>
              {dayWord(next.d - days)}
            </span>
          </p>
        )}
      </div>

      <div
        className="mt-2 h-2 overflow-hidden rounded-full"
        style={{ background: "rgba(255,255,255,0.08)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${tint}, ${
              next ? T.accent : T.primaryLift
            })`,
            boxShadow: `0 0 12px ${tint}99`,
          }}
        />
      </div>

      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {MILESTONES.map((m) => {
          const won = days >= m.d;
          return (
            <div
              key={m.d}
              title={m.hint}
              className="rounded-lg border px-1 py-1.5 text-center transition-all duration-300"
              style={{
                borderColor: won ? `${T.primary}59` : T.border,
                background: won ? `${T.primary}16` : "transparent",
                boxShadow: won ? `0 0 18px -8px ${T.primary}` : "none",
              }}
            >
              <p
                dir="ltr"
                className="text-[13px] font-extrabold tabular-nums"
                style={{ color: won ? T.primary : "rgba(255,255,255,0.28)" }}
              >
                {m.d}
              </p>
              <p
                className="text-[9px] leading-tight"
                style={{ color: won ? `${T.primary}C0` : T.faint }}
              >
                {won ? "عبرتها" : dayWord(m.d)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* What the habit has stopped costing. Hours roll up to days past 24 — "٧٢
   ساعة" is an abstraction, "٣ أيام كاملة" is a thing you can picture. */
function BleedPanel({ habit }) {
  const kind = costType(habit.costType);
  const total = bleedSaved(habit);
  const Icon = kind.icon;
  const whole = Math.round(total);
  const asDays = kind.id === "time" && whole >= 24 ? Math.floor(whole / 24) : 0;

  return (
    <div
      className="rounded-2xl border p-4"
      style={{ borderColor: `${kind.tint}3D`, background: `${kind.tint}12` }}
    >
      <div className="flex items-center gap-2">
        <Icon size={14} strokeWidth={2} style={{ color: kind.tint }} />
        <p className="text-[11px] font-bold" style={{ color: kind.tint }}>
          ما استرجعته
        </p>
      </div>
      <p className="mt-2 leading-none">
        <span
          dir="ltr"
          className="text-[26px] font-extrabold tabular-nums"
          style={{ color: kind.tint, textShadow: `0 0 24px ${kind.tint}66` }}
        >
          {whole.toLocaleString("en-US")}
        </span>
        <span className="mr-1.5 text-[12px] font-bold" style={{ color: kind.tint }}>
          {arCount(whole, kind.forms)}
        </span>
      </p>
      <p className="mt-1.5 text-[10.5px] leading-relaxed" style={{ color: T.faint }}>
        {habit.costPerDay > 0 ? (
          asDays > 0 ? (
            <>
              {"≈ "}
              <span dir="ltr" className="tabular-nums" style={{ color: T.muted }}>
                {asDays}
              </span>
              {` ${dayWord(asDays)} كاملة عادت إليك`}
            </>
          ) : (
            <>
              {habit.costPerDay > 2 && (
                <>
                  <span dir="ltr" className="tabular-nums">
                    {habit.costPerDay}
                  </span>
                  {" "}
                </>
              )}
              {`${arCount(habit.costPerDay, kind.forms)} تتسرّب كل يوم`}
            </>
          )
        ) : (
          "حدّد الكلفة اليومية ليبدأ العدّاد"
        )}
      </p>
    </div>
  );
}

/* Reset friction. Nothing here is decoration: the streak and the recovered
   cost are shown *before* the fields, the plan the user wrote for exactly
   this moment is quoted back, and the destructive button stays disabled
   until the trigger, the feeling and a deliberate acknowledgement are in. */
function RelapseModal({ open, habit, prefill, onClose, onConfirm }) {
  const [trigger, setTrigger] = useState("");
  const [feeling, setFeeling] = useState("");
  const [tag, setTag] = useState("");
  const [mood, setMood] = useState("");
  const [owned, setOwned] = useState(false);

  useEffect(() => {
    if (open) {
      /* A relapse that arrives from a wave the user could not ride out
         already knows the trigger and the mood — asking for them a second
         time reads as the app not listening. The confession and the
         acknowledgement are never prefilled: those are the friction. */
      setTrigger(prefill?.trigger || "");
      setFeeling("");
      setTag(prefill?.tag || "");
      setMood(prefill?.mood || "");
      setOwned(false);
    }
  }, [open, habit?.id, prefill]);

  if (!habit) return null;

  const days = cleanDays(habit);
  const kind = costType(habit.costType);
  const lost = Math.round(bleedSaved(habit));
  const picked = tagOf(tag);
  /* The written confession stays required — it is the friction the reset is
     supposed to cost. The free-text *feeling* does not: the mood chip
     carries that answer in a form the mirror can actually count, and five
     required fields at the worst moment of the day is a form abandoned
     half-filled, which records nothing at all. */
  const ready = tag && mood && trigger.trim() && owned;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="مرآة المحاسبة"
      footer={
        <>
          <Btn
            variant="outline"
            className="flex-1"
            onClick={onClose}
            style={{ borderColor: `${T.primary}59`, color: T.primary }}
          >
            <ShieldCheck size={15} /> لا، سأصمد
          </Btn>
          <Btn
            variant="default"
            className="flex-1"
            disabled={!ready}
            onClick={() =>
              onConfirm({
                trigger: trigger.trim(),
                feeling: feeling.trim(),
                tag,
                mood,
              })
            }
            style={{
              backgroundImage: `linear-gradient(135deg, ${T.danger}, ${T.ember})`,
              boxShadow: `0 8px 24px -10px ${T.danger}`,
              color: "#1A0603",
            }}
          >
            <HeartCrack size={15} /> صفّر العدّاد
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <div
          className="rounded-2xl border px-4 py-3.5"
          style={{ borderColor: `${T.danger}4D`, background: `${T.danger}12` }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} style={{ color: T.danger }} />
            <p className="text-[12px] font-extrabold" style={{ color: T.danger }}>
              أنت على وشك أن تخسر
            </p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <p
                dir="ltr"
                className="text-[24px] font-extrabold leading-none tabular-nums"
                style={{ color: T.danger }}
              >
                {days}
              </p>
              <p className="mt-1 text-[10px]" style={{ color: T.muted }}>
                {`${dayWord(days)} من الصمود`}
              </p>
            </div>
            <div>
              <p
                dir="ltr"
                className="text-[24px] font-extrabold leading-none tabular-nums"
                style={{ color: T.danger }}
              >
                {lost.toLocaleString("en-US")}
              </p>
              <p className="mt-1 text-[10px]" style={{ color: T.muted }}>
                {`${arCount(lost, kind.forms)} استرجعتها`}
              </p>
            </div>
          </div>
          <p
            className="mt-3 border-t pt-3 text-[11.5px] leading-relaxed"
            style={{ borderColor: `${T.danger}2E`, color: T.danger }}
          >
            هذه ليست لحظة ضعف تمرّ عليك — هذا قرار تأخذه الآن بيدك. الرغبة تمرّ
            خلال عشرين دقيقة سواء استجبت لها أو لا.
          </p>
        </div>

        {habit.replacement ? (
          <div
            className="rounded-2xl border px-4 py-3"
            style={{ borderColor: `${T.sky}3D`, background: `${T.sky}10` }}
          >
            <div className="flex items-center gap-2">
              <LifeBuoy size={14} style={{ color: T.sky }} />
              <p className="text-[11px] font-bold" style={{ color: T.sky }}>
                خطتك التي كتبتها لهذه اللحظة بالذات
              </p>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-white/85">
              {habit.replacement}
            </p>
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="block text-[11px] font-bold" style={{ color: T.muted }}>
            ما الذي فتح الباب؟ اختر واحدًا — هذا ما تُبنى عليه مرآتك.
          </label>
          <TagPicker value={tag} onPick={setTag} />
        </div>

        {picked && (
          <div
            className="los-in rounded-2xl border px-4 py-3"
            style={{ borderColor: `${T.sky}3D`, background: `${T.sky}10` }}
          >
            <div className="flex items-center gap-2">
              <Brain size={14} style={{ color: T.sky }} />
              <p className="text-[11px] font-bold" style={{ color: T.sky }}>
                المضاد الذي تحتاجه المرة القادمة
              </p>
            </div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-white/85">
              {picked.counter}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-[11px] font-bold" style={{ color: T.muted }}>
            ما شعورك قبلها مباشرة؟
          </label>
          <MoodPicker value={mood} onPick={setMood} />
        </div>

        <div className="space-y-2">
          <label className="block text-[11px] font-bold" style={{ color: T.muted }}>
            اكتبها بتفصيلها: أين كنت ومع من وماذا حدث قبلها مباشرة؟
          </label>
          <Field
            as="textarea"
            rows={3}
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            className="resize-none leading-relaxed"
            placeholder="كنت وحيدًا بعد منتصف الليل والهاتف بيدي…"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-[11px] font-bold" style={{ color: T.faint }}>
            ما شعورك الآن، بصدق؟ (اختياري)
          </label>
          <Field
            as="textarea"
            rows={2}
            value={feeling}
            onChange={(e) => setFeeling(e.target.value)}
            className="resize-none leading-relaxed"
            placeholder="فارغ، ونادم قبل أن أنتهي…"
          />
        </div>

        <button
          type="button"
          onClick={() => setOwned((v) => !v)}
          aria-pressed={owned}
          className="flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-right transition-all duration-200"
          style={{
            borderColor: owned ? `${T.danger}80` : T.border,
            background: owned ? `${T.danger}14` : "transparent",
          }}
        >
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-200"
            style={{
              borderColor: owned ? T.danger : T.borderStrong,
              background: owned ? T.danger : "transparent",
            }}
          >
            <Check
              size={12}
              strokeWidth={4}
              style={{ color: T.bgDeep, opacity: owned ? 1 : 0 }}
            />
          </span>
          <span
            className="text-[11.5px] leading-relaxed"
            style={{ color: owned ? T.danger : T.muted }}
          >
            أُقرّ أن هذا اختيار اخترته، لا قدر نزل بي.
          </span>
        </button>
      </div>
    </Modal>
  );
}

/* A stepper rather than a number field. The two numbers the estimator asks
   for are small and get nudged, not typed, and a keyboard that covers half
   a phone to turn «٣» into «٤» is a keyboard nobody opens twice. */
function NumStep({ value, onChange, min = 0, max = 999, step = 1, unit, tint = T.sky }) {
  const clamp = (n) => Math.min(max, Math.max(min, n));
  const btn =
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 active:scale-90 disabled:opacity-30";
  return (
    <div className="flex items-center justify-between gap-2">
      <button
        type="button"
        onClick={() => onChange(clamp(value - step))}
        disabled={value <= min}
        aria-label="أنقص"
        className={btn}
        style={{ borderColor: T.border, color: T.muted }}
      >
        <Minus size={13} strokeWidth={3} />
      </button>
      <p className="min-w-0 flex-1 text-center leading-none">
        <span
          dir="ltr"
          className="text-[19px] font-extrabold tabular-nums"
          style={{ color: tint }}
        >
          {value}
        </span>
        <span className="mr-1.5 text-[11px] font-bold" style={{ color: T.muted }}>
          {unit}
        </span>
      </p>
      <button
        type="button"
        onClick={() => onChange(clamp(value + step))}
        disabled={value >= max}
        aria-label="زد"
        className={btn}
        style={{ borderColor: `${tint}4D`, color: tint }}
      >
        <Plus size={13} strokeWidth={3} />
      </button>
    </div>
  );
}

/* Asked cold, «كم ساعة تخسرها يوميًا؟» is answered with a guess, and every
   figure built on that guess is a lie the app then states confidently. So
   the field is filled by arithmetic instead of by memory: two things a
   person genuinely can answer — how often it happens and how long it takes
   — multiply into the daily cost.

   Procrastination needs the second method. It has no «مرات»: it eats a
   share of a day that was already planned, so the questions become how many
   hours you meant to work and how much of them evaporated — two questions
   with real answers. */
const estimate = (type, e) =>
  type === "money"
    ? (e.perWeek * e.amount) / 7
    : e.method === "share"
      ? (e.planned * e.lost) / 100
      : (e.bouts * e.minutes) / 60;

function CostEstimator({ type, seed, onPick }) {
  const [open, setOpen] = useState(false);
  const [e, setE] = useState({
    method: seed?.method || "bouts",
    bouts: seed?.bouts ?? 3,
    minutes: seed?.minutes ?? 20,
    planned: 6,
    lost: 40,
    perWeek: seed?.bouts ?? 3,
    amount: seed?.minutes ?? 35,
  });

  /* Pushed on every change rather than behind a «طبّق» button: the number
     field above stays the one source of truth, and a second copy of the
     figure waiting to be applied is a second copy that can disagree. */
  const set = (patch) => {
    const next = { ...e, ...patch };
    setE(next);
    onPick(Math.round(estimate(type, next) * 10) / 10);
  };

  const daily = Math.round(estimate(type, e) * 10) / 10;
  const kind = costType(type);
  const yearly = daily * 365;
  const asDays = type === "time" ? Math.round(yearly / 24) : 0;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold transition-colors"
        style={{ color: T.sky }}
      >
        <Calculator size={13} />
        {open ? "أغلق الحاسبة" : "لا أعرف الرقم — احسبه معي"}
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {open && (
        <div
          className="los-in mt-2 rounded-2xl border p-4"
          style={{ borderColor: `${T.sky}3D`, background: `${T.sky}0E` }}
        >
          {type === "time" && (
            <div className="mb-3 grid grid-cols-2 gap-2">
              {[
                { id: "bouts", label: "نوبات متفرّقة" },
                { id: "share", label: "تلتهم يومي" },
              ].map((m) => {
                const on = e.method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => set({ method: m.id })}
                    aria-pressed={on}
                    className="rounded-xl border py-2 text-[11.5px] font-bold transition-all duration-200"
                    style={{
                      borderColor: on ? T.sky : T.border,
                      background: on ? `${T.sky}1C` : "transparent",
                      color: on ? T.sky : T.muted,
                    }}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          )}

          <div className="space-y-3">
            {type === "money" ? (
              <>
                <EstRow label="كم مرة في الأسبوع؟">
                  <NumStep
                    value={e.perWeek}
                    onChange={(v) => set({ perWeek: v })}
                    min={1}
                    max={70}
                    unit="مرة"
                    tint={T.accent}
                  />
                </EstRow>
                <EstRow label="كم تدفع في المرة الواحدة؟">
                  <NumStep
                    value={e.amount}
                    onChange={(v) => set({ amount: v })}
                    min={1}
                    max={5000}
                    step={5}
                    unit="ريال"
                    tint={T.accent}
                  />
                </EstRow>
              </>
            ) : e.method === "share" ? (
              <>
                <EstRow label="كم ساعة نويت أن تعمل اليوم؟">
                  <NumStep
                    value={e.planned}
                    onChange={(v) => set({ planned: v })}
                    min={1}
                    max={16}
                    unit="ساعة"
                  />
                </EstRow>
                <EstRow label="كم منها ضاع فعلًا؟">
                  <NumStep
                    value={e.lost}
                    onChange={(v) => set({ lost: v })}
                    min={5}
                    max={100}
                    step={5}
                    unit="٪"
                  />
                </EstRow>
              </>
            ) : (
              <>
                <EstRow label="كم مرة في اليوم؟">
                  <NumStep
                    value={e.bouts}
                    onChange={(v) => set({ bouts: v })}
                    min={1}
                    max={40}
                    unit="مرة"
                  />
                </EstRow>
                <EstRow label="كم دقيقة في المرة؟">
                  <NumStep
                    value={e.minutes}
                    onChange={(v) => set({ minutes: v })}
                    min={1}
                    max={600}
                    step={5}
                    unit="دقيقة"
                  />
                </EstRow>
              </>
            )}
          </div>

          <div
            className="mt-4 rounded-xl border px-3.5 py-3"
            style={{ borderColor: `${kind.tint}40`, background: `${kind.tint}12` }}
          >
            <p className="text-[10.5px] font-bold" style={{ color: kind.tint }}>
              الكلفة اليومية
            </p>
            <p className="mt-1 leading-none">
              <span
                dir="ltr"
                className="text-[22px] font-extrabold tabular-nums"
                style={{ color: kind.tint }}
              >
                {daily}
              </span>
              <span className="mr-1.5 text-[12px] font-bold" style={{ color: kind.tint }}>
                {/* ٢٫٤ ساعتان is nonsense — a fraction counts in the
                    singular, and only a whole number takes the dual. */}
                {Number.isInteger(daily) ? arCount(daily, kind.forms) : kind.forms[0]}
              </span>
            </p>
            <p className="mt-2 text-[11px] leading-relaxed" style={{ color: T.muted }}>
              {"على هذا المعدّل تخسر "}
              <span
                dir="ltr"
                className="font-extrabold tabular-nums"
                style={{ color: T.danger }}
              >
                {(type === "time" ? asDays : Math.round(yearly)).toLocaleString("en-US")}
              </span>
              {type === "time"
                ? ` ${dayWord(asDays)} كاملة كل سنة — ليست ساعات فراغ، بل أيام من عمرك.`
                : " ريال كل سنة."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function EstRow({ label, children }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-bold" style={{ color: T.muted }}>
        {label}
      </p>
      {children}
    </div>
  );
}

/* One picker for both modals. The relapse and the resisted urge must be
   tagged from the identical list, or the counts beneath them are comparing
   two different vocabularies. */
function TagPicker({ value, onPick }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {URGE_TAGS.map((t) => {
        const on = value === t.id;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onPick(on ? "" : t.id)}
            aria-pressed={on}
            className="flex items-center gap-2 rounded-xl border px-2.5 py-2 text-right text-[11.5px] font-bold transition-all duration-200 active:scale-95"
            style={{
              borderColor: on ? t.tint : T.border,
              background: on ? `${t.tint}1C` : "transparent",
              color: on ? t.tint : T.muted,
              boxShadow: on ? `0 0 20px -8px ${t.tint}` : "none",
            }}
          >
            <Icon size={14} strokeWidth={2} className="shrink-0" />
            <span className="min-w-0 flex-1 leading-tight">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function MoodPicker({ value, onPick }) {
  return (
    <div className="flex flex-wrap gap-2">
      {URGE_MOODS.map((m) => {
        const on = value === m.id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onPick(on ? "" : m.id)}
            aria-pressed={on}
            className="rounded-full border px-3 py-1.5 text-[11.5px] font-bold transition-all duration-200 active:scale-95"
            style={{
              borderColor: on ? T.violet : T.border,
              background: on ? `${T.violet}1C` : "transparent",
              color: on ? T.violet : T.muted,
            }}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

/* Add and edit share one form — two forms for one shape is how the two
   drift apart. The replacement plan is required: a habit you are quitting
   without something to put in its place is a vacuum, not a plan. */
function BadHabitFormModal({ open, draft, setDraft, onSave, onClose }) {
  if (!draft) return null;
  const ready = draft.title.trim() && draft.replacement.trim();
  const seed = BAD_PRESETS.find((p) => p.key === draft.preset);

  /* A preset fills the three fields the user stalls on and seeds the
     estimator with numbers that fit *that* habit — التسويف is measured as a
     share of a planned day, الصرف as a weekly amount. It never touches the
     date: the last time is his to answer. */
  const usePreset = (p) =>
    setDraft((d) => ({
      ...d,
      preset: p.key,
      title: p.title,
      costType: p.costType,
      replacement: p.replacement,
      costPerDay: String(
        Math.round(
          estimate(p.costType, {
            method: p.key === "delay" ? "share" : "bouts",
            bouts: p.bouts,
            minutes: p.minutes,
            planned: 6,
            lost: 40,
            perWeek: p.bouts,
            amount: p.minutes,
          }) * 10,
        ) / 10,
      ),
    }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={draft.id ? "تعديل العادة" : "عادة جديدة تكسرها"}
      footer={
        <>
          <Btn variant="default" className="flex-1" disabled={!ready} onClick={onSave}>
            <ShieldOff size={15} /> {draft.id ? "حفظ" : "ابدأ العدّ"}
          </Btn>
          <Btn variant="outline" className="flex-1" onClick={onClose}>
            إلغاء
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        {!draft.id && (
          <div className="space-y-2">
            <label className="block text-[11px] font-bold" style={{ color: T.faint }}>
              ابدأ من قالب جاهز، أو اكتبها بنفسك
            </label>
            <div className="grid grid-cols-2 gap-2">
              {BAD_PRESETS.map((p) => {
                const on = draft.preset === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => usePreset(p)}
                    aria-pressed={on}
                    className="rounded-xl border px-2.5 py-2 text-[11.5px] font-bold transition-all duration-200 active:scale-95"
                    style={{
                      borderColor: on ? T.cta : T.border,
                      background: on ? `${T.cta}1C` : "transparent",
                      color: on ? T.cta : T.muted,
                    }}
                  >
                    {p.title}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-[11px] font-bold" style={{ color: T.muted }}>
            ما العادة التي تتركها؟
          </label>
          <Field
            autoFocus
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            placeholder="السهر بعد منتصف الليل"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-[11px] font-bold" style={{ color: T.sky }}>
            ملاذك الآمن — ماذا تفعل بالضبط حين تهجم الرغبة؟
          </label>
          <Field
            as="textarea"
            rows={3}
            value={draft.replacement}
            onChange={(e) => setDraft((d) => ({ ...d, replacement: e.target.value }))}
            className="resize-none leading-relaxed"
            style={{ borderColor: `${T.sky}45`, background: `${T.sky}0A` }}
            placeholder="أتوضّأ وأخرج للمشي عشر دقائق، وأترك الهاتف في الغرفة."
          />
          <p className="text-[10px] leading-relaxed" style={{ color: T.faint }}>
            اكتبها كأمر تنفّذه بلا تفكير. الرغبة لا تترك مساحة للارتجال.
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-[11px] font-bold" style={{ color: T.muted }}>
            ماذا تنزف هذه العادة؟
          </label>
          <div className="grid grid-cols-2 gap-2">
            {COST_TYPES.map((c) => {
              const on = draft.costType === c.id;
              const Icon = c.icon;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, costType: c.id }))}
                  aria-pressed={on}
                  className="flex items-center justify-center gap-2 rounded-xl border py-2.5 text-[12.5px] font-bold transition-all duration-200"
                  style={{
                    borderColor: on ? c.tint : T.border,
                    background: on ? `${c.tint}1C` : "transparent",
                    color: on ? c.tint : T.muted,
                  }}
                >
                  <Icon size={14} /> {c.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-[11px] font-bold" style={{ color: T.muted }}>
            {`الكلفة اليومية (${costType(draft.costType).unit})`}
          </label>
          <Field
            type="number"
            min="0"
            step="0.5"
            dir="ltr"
            className="text-left tabular-nums"
            value={draft.costPerDay}
            onChange={(e) => setDraft((d) => ({ ...d, costPerDay: e.target.value }))}
            placeholder="30"
          />
          <CostEstimator
            key={`${draft.preset || "none"}-${draft.costType}`}
            type={draft.costType}
            seed={
              seed
                ? {
                    method: seed.key === "delay" ? "share" : "bouts",
                    bouts: seed.bouts,
                    minutes: seed.minutes,
                  }
                : null
            }
            onPick={(v) => setDraft((d) => ({ ...d, costPerDay: String(v) }))}
          />
          <p className="text-[10px] leading-relaxed" style={{ color: T.faint }}>
            رقم تقريبي أفضل من لا رقم. العدّاد لا يحاسبك على الدقّة، يحاسبك على
            أن ترى الثمن مكتوبًا.
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-[11px] font-bold" style={{ color: T.muted }}>
            متى كانت آخر مرة؟
          </label>
          <Field
            type="date"
            dir="ltr"
            className="text-left"
            max={dayKey()}
            value={draft.startDate}
            onChange={(e) =>
              setDraft((d) => ({ ...d, startDate: e.target.value || dayKey() }))
            }
          />
        </div>
      </div>
    </Modal>
  );
}

function BadHabitCard({ habit, onRelapse, onUrge, onEdit, onDelete, reward }) {
  const [openLogs, setOpenLogs] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const days = cleanDays(habit);
  const logs = habit.logs || [];
  const urges = habit.urges || [];
  /* One journal, both outcomes. Two separate lists would hide the only
     comparison that matters: the same trigger met twice, survived once. */
  const journal = useMemo(
    () =>
      [...logs, ...urges]
        .map((e, i) => ({ ...e, seq: i }))
        .sort((a, b) => (a.at === b.at ? a.seq - b.seq : a.at < b.at ? 1 : -1)),
    [logs, urges],
  );
  const own = useMemo(() => weakSpots([habit]), [habit]);
  const best = bestRun(habit);
  const atGate = MILESTONES.some((m) => m.d === days);
  const tint = days >= MILESTONE_CAP ? T.primary : days >= 7 ? T.accent : T.cta;

  return (
    <Card
      className={`group flex flex-col p-5 sm:p-6${reward ? " los-reward" : ""}`}
      style={{
        borderColor: atGate ? `${T.primary}5C` : undefined,
        boxShadow: atGate
          ? `inset 0 1px 0 0 rgba(255,255,255,0.085), 0 0 46px -16px ${T.primary}`
          : undefined,
      }}
    >
      <div className="flex items-start gap-2.5">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
          style={{
            borderColor: `${tint}45`,
            background: `${tint}18`,
            color: tint,
          }}
        >
          <ShieldOff size={16} strokeWidth={1.9} />
        </span>
        <h3 className="min-w-0 flex-1 pt-1.5 text-[15px] font-bold">{habit.title}</h3>
        <button
          onClick={onEdit}
          aria-label={`تعديل ${habit.title}`}
          className="shrink-0 rounded p-1.5 text-white/25 opacity-40 transition-all hover:text-white/70 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={() => (confirmDel ? onDelete() : setConfirmDel(true))}
          aria-label={
            confirmDel ? `تأكيد حذف ${habit.title}` : `حذف ${habit.title}`
          }
          className="shrink-0 rounded p-1.5 text-white/25 opacity-40 transition-all hover:text-red-400 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          style={confirmDel ? { color: T.danger, opacity: 1 } : undefined}
        >
          <Trash2 size={13} />
        </button>
      </div>

      {confirmDel && (
        <div
          className="los-in mt-3 flex items-center gap-2 rounded-xl border px-3 py-2"
          style={{ borderColor: `${T.danger}4D`, background: `${T.danger}12` }}
        >
          <p className="min-w-0 flex-1 text-[11px]" style={{ color: T.danger }}>
            سيُحذف السجل كاملًا. اضغط السلّة مرة أخرى للتأكيد.
          </p>
          <Btn variant="ghost" size="sm" onClick={() => setConfirmDel(false)}>
            تراجع
          </Btn>
        </div>
      )}

      <div className="mt-5 flex items-end justify-between gap-3">
        <div>
          <p
            dir="ltr"
            className="text-[44px] font-extrabold leading-none tabular-nums"
            style={{ color: tint, textShadow: `0 0 30px ${tint}59` }}
          >
            {days}
          </p>
          <p className="mt-1.5 text-[11.5px]" style={{ color: T.muted }}>
            {days === 0 ? "اليوم الأول يبدأ الآن" : `${dayWord(days)} بلا انتكاسة`}
          </p>
        </div>
        {best > 0 && (
          <Badge tint={best > days ? T.violet : T.primary}>
            <Flame size={10} />
            {"الأطول: "}
            <span dir="ltr" className="tabular-nums">
              {best}
            </span>
          </Badge>
        )}
      </div>

      <MilestoneTrack days={days} />

      {own.tag && own.total >= 3 && (
        <p className="mt-4 text-[11px] leading-relaxed" style={{ color: T.muted }}>
          <span style={{ color: T.violet }}>نمطك هنا: </span>
          {tagOf(own.tag.value)?.label}
          {" في "}
          <span dir="ltr" className="font-extrabold tabular-nums">
            {own.tag.count}
          </span>
          {" من "}
          <span dir="ltr" className="font-extrabold tabular-nums">
            {own.tag.total}
          </span>
          {` ${meetWord(own.tag.total)}.`}
        </p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <BleedPanel habit={habit} />
        <div
          className="rounded-2xl border p-4"
          style={{ borderColor: `${T.sky}3D`, background: `${T.sky}10` }}
        >
          <div className="flex items-center gap-2">
            <LifeBuoy size={14} strokeWidth={2} style={{ color: T.sky }} />
            <p className="text-[11px] font-bold" style={{ color: T.sky }}>
              الملاذ الآمن
            </p>
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-white/85">
            {habit.replacement || "لم تكتب خطة بعد — الرغبة لا تنتظر ارتجالك."}
          </p>
        </div>
      </div>

      {/* The resisted craving comes first and wears the success colour: it
          is the button he should be reaching for on most days, and a card
          whose only action is «سقطت» is a card he stops opening. */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Btn variant="success" size="sm" onClick={onUrge}>
          <ShieldCheck size={13} /> واجهت الرغبة
        </Btn>
        <Btn variant="danger" size="sm" onClick={onRelapse}>
          <HeartCrack size={13} /> سجّل انتكاسة
        </Btn>
        {journal.length > 0 && (
          <button
            onClick={() => setOpenLogs((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] transition-colors hover:text-white/80"
            style={{ color: T.faint }}
          >
            {openLogs ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            <span dir="ltr" className="tabular-nums">
              {journal.length}
            </span>
            {` ${meetWord(journal.length)} مسجّلة`}
          </button>
        )}
      </div>

      {urges.length > 0 && (
        <p className="mt-2 text-[10.5px]" style={{ color: T.primary }}>
          {"صمدت "}
          <span dir="ltr" className="font-extrabold tabular-nums">
            {urges.length}
          </span>
          {` ${timesWord(urges.length)} في وجه الرغبة — وهذه ليست صدفة.`}
        </p>
      )}

      {openLogs && journal.length > 0 && (
        <div className="los-in mt-4 space-y-2.5">
          <p className="text-[10.5px] leading-relaxed" style={{ color: T.faint }}>
            اقرأ المحفّزات متتالية — النمط الذي يتكرّر هو عدوّك الحقيقي، لا
            العادة نفسها. الأخضر صمود والأحمر سقوط، والمحفّز نفسه يظهر في
            الاثنين.
          </p>
          {journal.map((l) => {
            const fell = l.kind === "fall";
            const tint = fell ? T.danger : T.primary;
            const t = tagOf(l.tag);
            const m = moodOf(l.mood);
            return (
              <div
                key={l.id}
                className="rounded-xl border px-3.5 py-3"
                style={{ borderColor: `${tint}33`, background: `${tint}0D` }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    dir="ltr"
                    className="text-[10.5px] tabular-nums"
                    style={{ color: T.faint }}
                  >
                    {l.at}
                  </span>
                  {fell ? (
                    <Badge tint={T.danger}>
                      {"سقطت بعد "}
                      <span dir="ltr" className="tabular-nums">
                        {l.days}
                      </span>
                      {` ${dayWord(l.days)}`}
                    </Badge>
                  ) : (
                    <Badge tint={T.primary}>
                      <ShieldCheck size={10} /> صمدت
                    </Badge>
                  )}
                  {t && <Badge tint={t.tint}>{t.label}</Badge>}
                  {m && <Badge tint={T.violet}>{m.label}</Badge>}
                  {Number.isFinite(l.hour) && (
                    <span className="text-[10px]" style={{ color: T.faint }}>
                      {bandAt(l.hour).label}
                    </span>
                  )}
                </div>
                {l.trigger && (
                  <p className="mt-2 text-[12px] leading-relaxed text-white/80">
                    {l.trigger}
                  </p>
                )}
                {l.feeling && (
                  <p className="mt-1 text-[12px] leading-relaxed text-white/60">
                    <span style={{ color: T.violet }}>الشعور: </span>
                    {l.feeling}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* The craving logged *before* it wins. Without it the screen only ever sees
   the losses, which makes a person look weaker than he is and teaches him
   to stop opening it — and worse, it leaves the diagnosis blind to the
   triggers he beats, which is exactly the half that proves what works.
 *
 *  It is also the one place the app intervenes instead of recording. A
 *  craving is a wave: it rises and falls inside a quarter of an hour
 *  whether it is obeyed or not, and the reason people lose is that in its
 *  third minute it feels permanent. The timer is there to show it falling. */
const WAVE_OPTIONS = [
  { min: 5, label: "٥ دقائق" },
  { min: 15, label: "١٥ دقيقة" },
];

function UrgeModal({ open, habit, onClose, onConfirm, onFell }) {
  const [tag, setTag] = useState("");
  const [mood, setMood] = useState("");
  const [note, setNote] = useState("");
  const [mode, setMode] = useState("pick");
  const [endAt, setEndAt] = useState(0);
  const [span, setSpan] = useState(0);
  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (open) {
      setTag("");
      setMood("");
      setNote("");
      setMode("pick");
      setLeft(0);
      setSpan(0);
    }
  }, [open, habit?.id]);

  /* Counted down from a stored end time rather than by decrementing a
     number: a throttled background tab skips ticks, and a wave that pauses
     while the user looks away is a wave that never ends. */
  useEffect(() => {
    /* `open` belongs in the guard, not only in the reset above: closing the
       modal mid-wave leaves this component mounted, and without it the
       interval ran on in the background until the wave it no longer owned
       hit zero. */
    if (mode !== "wave" || !open) return;
    const tick = () => {
      const l = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      setLeft(l);
      if (l === 0) setMode("after");
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [mode, endAt, open]);

  if (!habit) return null;

  const picked = tagOf(tag);
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const pct = span ? ((span - left) / span) * 100 : 0;
  const start = (min) => {
    setSpan(min * 60);
    setEndAt(Date.now() + min * 60000);
    setMode("wave");
  };
  const log = () => onConfirm({ tag, mood, trigger: note.trim() });

  const title =
    mode === "wave" ? "اركب الموجة" : mode === "after" ? "انتهت الموجة" : "واجهت الرغبة";

  const footer =
    mode === "wave" ? (
      <Btn variant="outline" className="flex-1" onClick={() => setMode("pick")}>
        أوقف الموجة
      </Btn>
    ) : mode === "after" ? (
      <>
        <Btn variant="success" className="flex-1" onClick={log}>
          <ShieldCheck size={15} /> صمدت
        </Btn>
        <Btn
          variant="danger"
          className="flex-1"
          onClick={() => onFell({ tag, mood, trigger: note.trim() })}
        >
          <HeartCrack size={15} /> لم أصمد
        </Btn>
      </>
    ) : (
      <>
        <Btn variant="success" className="flex-1" disabled={!tag} onClick={log}>
          <ShieldCheck size={15} /> سجّلها صمودًا
        </Btn>
        <Btn variant="outline" className="flex-1" onClick={onClose}>
          إلغاء
        </Btn>
      </>
    );

  return (
    <Modal open={open} onClose={onClose} title={title} footer={footer}>
      {mode === "wave" ? (
        <div className="space-y-4">
          <p className="text-center text-[12px] leading-relaxed" style={{ color: T.muted }}>
            لا تقاوم الرغبة — انتظرها. أنت لا تفعل شيئًا الآن سوى أن تدع
            الموجة تهبط.
          </p>

          <p
            dir="ltr"
            className="text-center text-[56px] font-extrabold leading-none tabular-nums"
            style={{ color: T.primary, textShadow: `0 0 40px ${T.primary}66` }}
          >
            {mm}:{ss}
          </p>

          <div
            className="h-2 overflow-hidden rounded-full"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-1000 ease-linear"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${T.primary}, ${T.primaryLift})`,
                boxShadow: `0 0 12px ${T.primary}99`,
              }}
            />
          </div>

          {picked && (
            <div
              className="rounded-2xl border px-4 py-3"
              style={{ borderColor: `${T.sky}3D`, background: `${T.sky}10` }}
            >
              <div className="flex items-center gap-2">
                <Brain size={14} style={{ color: T.sky }} />
                <p className="text-[11px] font-bold" style={{ color: T.sky }}>
                  نفّذ هذا بدل الانتظار الفارغ
                </p>
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-white/85">
                {picked.counter}
              </p>
            </div>
          )}

          {habit.replacement ? (
            <div
              className="rounded-2xl border px-4 py-3"
              style={{ borderColor: `${T.primary}3D`, background: `${T.primary}10` }}
            >
              <div className="flex items-center gap-2">
                <LifeBuoy size={14} style={{ color: T.primary }} />
                <p className="text-[11px] font-bold" style={{ color: T.primary }}>
                  ملاذك الآمن
                </p>
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-white/85">
                {habit.replacement}
              </p>
            </div>
          ) : null}
        </div>
      ) : mode === "after" ? (
        <div className="space-y-4">
          <p className="text-[13px] leading-relaxed text-white/85">
            انتهت الموجة. الرغبة التي بدت قبل قليل وكأنها لن تمرّ — أين هي
            الآن؟
          </p>
          <p className="text-[12px] leading-relaxed" style={{ color: T.muted }}>
            هذا بالضبط ما كانت تخفيه عنك: أنها مؤقّتة. وكلما انتظرتها مرة
            إضافية، ضعفت المرة التي بعدها.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[12px] leading-relaxed" style={{ color: T.muted }}>
            سجّلها الآن وأنت داخلها، لا بعد ساعة. الوسم الذي تختاره هنا هو
            الذي يبني تشخيصك — بلا وسوم تبقى المرآة فارغة.
          </p>

          <div className="space-y-2">
            <label className="block text-[11px] font-bold" style={{ color: T.muted }}>
              ما الذي استدعاها الآن؟
            </label>
            <TagPicker value={tag} onPick={setTag} />
          </div>

          {picked && (
            <div
              className="los-in rounded-2xl border px-4 py-3"
              style={{ borderColor: `${T.sky}3D`, background: `${T.sky}10` }}
            >
              <div className="flex items-center gap-2">
                <Brain size={14} style={{ color: T.sky }} />
                <p className="text-[11px] font-bold" style={{ color: T.sky }}>
                  المضاد لهذا المحفّز
                </p>
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-white/85">
                {picked.counter}
              </p>
            </div>
          )}

          <div
            className="rounded-2xl border px-4 py-3"
            style={{ borderColor: `${T.primary}3D`, background: `${T.primary}10` }}
          >
            <div className="flex items-center gap-2">
              <Hourglass size={14} style={{ color: T.primary }} />
              <p className="text-[11px] font-bold" style={{ color: T.primary }}>
                اركب الموجة بدل أن تقاومها
              </p>
            </div>
            <p className="mt-1.5 text-[11.5px] leading-relaxed" style={{ color: T.muted }}>
              الرغبة تعلو وتهبط خلال ربع ساعة سواء استجبت لها أو لم تستجب.
              اضبط المؤقّت ولا تفعل شيئًا حتى ينتهي.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {WAVE_OPTIONS.map((o) => (
                <Btn
                  key={o.min}
                  variant="success"
                  size="sm"
                  disabled={!tag}
                  onClick={() => start(o.min)}
                >
                  <Timer size={13} /> {o.label}
                </Btn>
              ))}
            </div>
            {!tag && (
              <p className="mt-2 text-[10px]" style={{ color: T.faint }}>
                اختر المحفّز أولًا — المؤقّت يعرض المضاد الخاص به.
              </p>
            )}
          </div>

          {habit.replacement ? (
            <div
              className="rounded-2xl border px-4 py-3"
              style={{ borderColor: `${T.primary}3D`, background: `${T.primary}10` }}
            >
              <div className="flex items-center gap-2">
                <LifeBuoy size={14} style={{ color: T.primary }} />
                <p className="text-[11px] font-bold" style={{ color: T.primary }}>
                  نفّذ ملاذك الآن
                </p>
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-white/85">
                {habit.replacement}
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="block text-[11px] font-bold" style={{ color: T.muted }}>
              كيف تشعر؟
            </label>
            <MoodPicker value={mood} onPick={setMood} />
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-bold" style={{ color: T.faint }}>
              سطر تكتبه لنفسك (اختياري)
            </label>
            <Field
              as="textarea"
              rows={2}
              value={note}
              onChange={(ev) => setNote(ev.target.value)}
              className="resize-none leading-relaxed"
              placeholder="جلست للمذاكرة فوجدت نفسي أفتح الهاتف…"
            />
          </div>
        </div>
      )}
    </Modal>
  );
}


function MirrorTile({ icon: Icon, label, value, sub, tint }) {
  return (
    <div
      className="rounded-xl border px-3.5 py-3"
      style={{ borderColor: `${tint}3D`, background: `${tint}10` }}
    >
      <div className="flex items-center gap-1.5">
        <Icon size={12} strokeWidth={2.2} style={{ color: tint }} />
        <p className="text-[10px] font-bold" style={{ color: tint }}>
          {label}
        </p>
      </div>
      <p className="mt-1.5 text-[13.5px] font-extrabold leading-tight text-white/90">
        {value}
      </p>
      {sub ? (
        <p className="mt-1 text-[10px] leading-relaxed" style={{ color: T.faint }}>
          {sub}
        </p>
      ) : null}
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

/* The screen the user asked for: not a counter, a diagnosis. Everything in
   it is counted from what he logged and nothing is inferred — a mirror that
   invents a weakness is worse than no mirror, because it is believed. Below
   the threshold it says so plainly instead of drawing empty bars. */
function WeaknessMirror({ list }) {
  const w = useMemo(() => weakSpots(list), [list]);
  const events = useMemo(() => breakerEvents(list), [list]);
  /* Two different things that both used to be called `fatal`: the tally
     (count, total, pct) and the tag it points at. Collapsing them cost the
     verdict its numbers. */
  const fatal = w.fatal;
  const common = w.tag;
  const prescribe = (fatal && tagOf(fatal.value)) || (common && tagOf(common.value));

  return (
    <Card className="p-6 sm:p-7">
      <div className="flex items-start gap-2.5">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
          style={{
            borderColor: `${T.violet}45`,
            background: `${T.violet}18`,
            color: T.violet,
          }}
        >
          <Radar size={16} strokeWidth={1.9} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[16px] font-extrabold">مرآة نقاط الضعف</h3>
          <p className="mt-1 text-[11.5px] leading-relaxed" style={{ color: T.faint }}>
            لا تعرف نقطة ضعفك لأنك تعيشها ولا تعدّها. هنا تُعدّ: كل مواجهة
            تسجّلها — سقطت أو صمدت — تضيف سطرًا إلى تشخيصك.
          </p>
        </div>
      </div>

      {!w.ready ? (
        <div className="mt-5">
          <div className="flex items-end justify-between gap-3">
            <p className="text-[11.5px]" style={{ color: T.muted }}>
              {"التشخيص يبدأ بعد "}
              <span dir="ltr" className="font-extrabold tabular-nums" style={{ color: T.cta }}>
                {MIRROR_MIN}
              </span>
              {" مواجهات مسجّلة"}
            </p>
            <p dir="ltr" className="shrink-0 text-[11px] font-extrabold tabular-nums" style={{ color: T.cta }}>
              {w.total}/{MIRROR_MIN}
            </p>
          </div>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (w.total / MIRROR_MIN) * 100)}%`,
                background: `linear-gradient(90deg, ${T.cta}, ${T.accent})`,
                boxShadow: `0 0 12px ${T.cta}99`,
              }}
            />
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed" style={{ color: T.muted }}>
            لا تنتظر الانتكاسة لتسجّل. كل مرة تهجم الرغبة وتصمد، اضغط «واجهت
            الرغبة» على بطاقة العادة — المرآة تتعلّم من صمودك أكثر مما تتعلّم
            من سقوطك.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {prescribe && (
            <div
              className="rounded-2xl border px-4 py-3.5"
              style={{
                borderColor: `${prescribe.tint}4D`,
                background: `${prescribe.tint}14`,
              }}
            >
              <div className="flex items-center gap-2">
                <Crosshair size={14} style={{ color: prescribe.tint }} />
                <p className="text-[11px] font-extrabold" style={{ color: prescribe.tint }}>
                  نقطة ضعفك الأولى
                </p>
              </div>
              <p className="mt-2 text-[15px] font-extrabold" style={{ color: prescribe.tint }}>
                {prescribe.label}
              </p>
              <p className="mt-1.5 text-[11.5px] leading-relaxed" style={{ color: T.muted }}>
                {fatal ? (
                  <>
                    {"سقطت بسببه "}
                    <span dir="ltr" className="font-extrabold tabular-nums" style={{ color: T.danger }}>
                      {fatal.count}
                    </span>
                    {" من أصل "}
                    <span dir="ltr" className="font-extrabold tabular-nums">
                      {fatal.total}
                    </span>
                    {` ${fallWord(fatal.total)} مسجّلة.`}
                  </>
                ) : (
                  <>
                    {"يتكرّر في "}
                    <span dir="ltr" className="font-extrabold tabular-nums">
                      {common.pct}٪
                    </span>
                    {" من مواجهاتك."}
                  </>
                )}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <MirrorTile
              icon={Clock}
              label="ساعة الخطر"
              tint={T.ember}
              value={w.band ? bandOf(w.band.value).label : "—"}
              sub={
                w.band ? (
                  <>
                    <span dir="ltr" className="tabular-nums">
                      {w.band.pct}٪
                    </span>
                    {" من مواجهاتك تقع هنا"}
                  </>
                ) : (
                  "لم تُسجَّل ساعات بعد"
                )
              }
            />
            <MirrorTile
              icon={CalendarDays}
              label="يوم الخطر"
              tint={T.indigo}
              value={w.dow ? DOW_AR[Number(w.dow.value)] : "—"}
              sub={
                w.dow ? (
                  <>
                    <span dir="ltr" className="tabular-nums">
                      {w.dow.count}
                    </span>
                    {` ${meetWord(w.dow.count)} في هذا اليوم`}
                  </>
                ) : (
                  "لا بيانات بعد"
                )
              }
            />
            <MirrorTile
              icon={ShieldCheck}
              label="معدّل صمودك"
              tint={w.hold >= 50 ? T.primary : T.danger}
              value={
                <span dir="ltr" className="tabular-nums">
                  {w.hold}٪
                </span>
              }
              sub={
                <>
                  {"صمدت في "}
                  <span dir="ltr" className="tabular-nums">
                    {w.holds}
                  </span>
                  {" من "}
                  <span dir="ltr" className="tabular-nums">
                    {w.total}
                  </span>
                  {` ${meetWord(w.total)}`}
                </>
              }
            />
            <MirrorTile
              icon={Flame}
              label="متوسط الصمود"
              tint={T.accent}
              value={
                w.falls ? (
                  <>
                    <span dir="ltr" className="tabular-nums">
                      {Math.round(w.avgRun)}
                    </span>
                    {` ${dayWord(Math.round(w.avgRun))}`}
                  </>
                ) : (
                  "بلا انتكاسة"
                )
              }
              sub={
                w.trend
                  ? w.trend.dir === "up"
                    ? "سلاسلك تطول — أنت تتحسّن فعلًا"
                    : w.trend.dir === "down"
                      ? "سلاسلك تقصر — راجع ملاذك الآمن"
                      : "ثابت، لا يطول ولا يقصر"
                  : "اجمع انتكاسات أكثر ليظهر الاتجاه"
              }
            />
          </div>

          {w.mood && (
            <p className="text-[11.5px] leading-relaxed" style={{ color: T.muted }}>
              {"أغلب مواجهاتك تأتيك وأنت "}
              <span className="font-extrabold" style={{ color: T.violet }}>
                {moodOf(w.mood.value)?.label}
              </span>
              {" — الشعور الذي يسبق العادة هو الباب، والعادة مجرّد الغرفة."}
            </p>
          )}

          {prescribe && (
            <div
              className="rounded-2xl border px-4 py-3"
              style={{ borderColor: `${T.sky}3D`, background: `${T.sky}10` }}
            >
              <div className="flex items-center gap-2">
                <Brain size={14} style={{ color: T.sky }} />
                <p className="text-[11px] font-bold" style={{ color: T.sky }}>
                  المضاد — نفّذ هذا بدل أن تقاوم بإرادتك
                </p>
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-white/85">
                {prescribe.counter}
              </p>
            </div>
          )}

          {w.tag && (
            <div>
              <p className="mb-2 text-[11px] font-bold" style={{ color: T.muted }}>
                خريطة محفّزاتك
              </p>
              <div className="space-y-2">
                {w.tag.rows.map((r) => {
                  const t = tagOf(r.value);
                  if (!t) return null;
                  const rate = tagFallRate(events, r.value);
                  const Icon = t.icon;
                  return (
                    <div key={r.value}>
                      <div className="flex items-center gap-2">
                        <Icon size={12} style={{ color: t.tint }} className="shrink-0" />
                        <span className="min-w-0 flex-1 truncate text-[11.5px] font-bold text-white/80">
                          {t.label}
                        </span>
                        {rate && (
                          <span
                            dir="ltr"
                            className="shrink-0 text-[10px] font-extrabold tabular-nums"
                            style={{ color: rate.pct >= 50 ? T.danger : T.primary }}
                          >
                            {rate.lost}/{rate.met}
                          </span>
                        )}
                      </div>
                      <div
                        className="mt-1 h-1.5 overflow-hidden rounded-full"
                        style={{ background: "rgba(255,255,255,0.07)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${r.pct}%`,
                            background: `linear-gradient(90deg, ${t.tint}, ${t.tint}99)`,
                            boxShadow: `0 0 10px ${t.tint}70`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2.5 text-[10px] leading-relaxed" style={{ color: T.faint }}>
                الرقم على اليسار: كم مرة سقطت من أصل كم مرة واجهت هذا المحفّز.
                محفّز تواجهه كثيرًا وتصمد ليس ضعفك — ضعفك هو الذي يسقطك في كل
                مرة تقريبًا.
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function BreakerModule({ state, setState }) {
  const list = state.badHabits || [];
  const [draft, setDraft] = useState(null);
  const [relapsing, setRelapsing] = useState(null);
  const [urging, setUrging] = useState(null);
  const [prefill, setPrefill] = useState(null);
  /* Set synchronously and cleared on a timer, never through
     requestAnimationFrame — a reward scheduled on a frame is swallowed in a
     hidden tab and then replays when the tab comes back. */
  const [rewardId, setRewardId] = useState(null);
  const rewardTimer = useRef(null);
  useEffect(() => () => clearTimeout(rewardTimer.current), []);

  const openAdd = () =>
    setDraft({
      id: "",
      title: "",
      startDate: dayKey(),
      costType: "money",
      costPerDay: "",
      replacement: "",
    });

  const openEdit = (h) => setDraft({ ...h, costPerDay: String(h.costPerDay ?? "") });

  const save = () => {
    const edit = draft.id;
    setState((s) => {
      const rows = s.badHabits || [];
      /* An edit must keep the journal the row already carries — the form
         never shows the logs, so a blind spread would drop them. */
      const shaped = badHabitShape({
        ...draft,
        logs: edit ? rows.find((b) => b.id === edit)?.logs || [] : [],
      });
      return {
        ...s,
        badHabits: edit
          ? rows.map((b) => (b.id === edit ? { ...shaped, id: edit } : b))
          : [...rows, shaped],
      };
    });
    setDraft(null);
  };

  const remove = (id) =>
    setState((s) => ({
      ...s,
      badHabits: (s.badHabits || []).filter((b) => b.id !== id),
    }));

  const confirmRelapse = ({ trigger, feeling, tag, mood }) => {
    const id = relapsing.id;
    setState((s) => ({
      ...s,
      badHabits: (s.badHabits || []).map((b) =>
        b.id === id
          ? {
              ...b,
              /* The run that just ended is stamped on the log, so the record
                 outlives the counter it cost. */
              logs: [
                ...(b.logs || []),
                urgeShape(
                  {
                    ...stamp(),
                    days: cleanDays(b),
                    tag,
                    mood,
                    trigger,
                    feeling,
                  },
                  "fall",
                ),
              ],
              startDate: dayKey(),
            }
          : b,
      ),
    }));
    setRelapsing(null);
    setPrefill(null);
  };

  /* A hold never touches startDate: surviving the urge is the streak
     continuing, not an event in it. */
  const confirmUrge = ({ tag, mood, trigger }) => {
    const id = urging.id;
    setState((s) => ({
      ...s,
      badHabits: (s.badHabits || []).map((b) =>
        b.id === id
          ? {
              ...b,
              urges: [
                ...(b.urges || []),
                urgeShape({ ...stamp(), tag, mood, trigger }, "hold"),
              ],
            }
          : b,
      ),
    }));
    setUrging(null);
    setRewardId(id);
    clearTimeout(rewardTimer.current);
    rewardTimer.current = setTimeout(() => setRewardId(null), 900);
  };

  const cleanToday = list.filter((b) => cleanDays(b) > 0).length;
  const longest = list.reduce((n, b) => Math.max(n, cleanDays(b)), 0);

  return (
    <div className="space-y-7">
      <Card className="p-6 sm:p-7">
        <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">
          كاسر العادات
        </h2>
        <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/40">
          هنا تحمي سلسلة بدل أن تبنيها. كل عادة تحمل عدّادًا نظيفًا، وملاذًا
          آمنًا تنفّذه حين تهجم الرغبة، وحسابًا لما استرجعته من مال أو وقت.
          وكل مواجهة تسجّلها — سقطت أو صمدت — تُبنى عليها مرآة نقاط ضعفك في
          أسفل الشاشة.
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Btn variant="default" onClick={openAdd} className="shrink-0">
            <Plus size={15} strokeWidth={3} /> عادة جديدة تكسرها
          </Btn>
        </div>

        {list.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tint={T.primary}>
              <ShieldCheck size={10} />
              <span dir="ltr" className="tabular-nums">
                {cleanToday}/{list.length}
              </span>
              {" صامدة"}
            </Badge>
            <Badge tint={T.violet}>
              <Radar size={10} />
              <span dir="ltr" className="tabular-nums">
                {breakerEvents(list).length}
              </span>
              {` ${meetWord(breakerEvents(list).length)} مسجّلة`}
            </Badge>
            <Badge tint={T.ember}>
              <Flame size={10} />
              {"أطول عدّاد حالي: "}
              <span dir="ltr" className="tabular-nums">
                {longest}
              </span>
              {` ${dayWord(longest)}`}
            </Badge>
          </div>
        )}
      </Card>

      {list.length === 0 ? (
        <Card className="p-10 text-center">
          <ShieldOff
            size={34}
            strokeWidth={1.4}
            className="mx-auto"
            style={{ color: T.faint }}
          />
          <p className="mt-4 text-[14px] font-bold" style={{ color: T.muted }}>
            لا عادة تحت المقصلة بعد
          </p>
          <p className="mx-auto mt-2 max-w-sm text-[12px] leading-relaxed" style={{ color: T.faint }}>
            اختر واحدة فقط للبداية — الأغلى ثمنًا، لا الأسهل. العدّاد يبدأ من
            آخر مرة فعلتها فيها.
          </p>
          <Btn variant="default" className="mt-5" onClick={openAdd}>
            <Plus size={15} strokeWidth={3} /> ابدأ الأولى
          </Btn>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {list.map((h) => (
            <BadHabitCard
              key={h.id}
              habit={h}
              reward={rewardId === h.id}
              onRelapse={() => setRelapsing(h)}
              onUrge={() => setUrging(h)}
              onEdit={() => openEdit(h)}
              onDelete={() => remove(h.id)}
            />
          ))}
        </div>
      )}

      {list.length > 0 && <WeaknessMirror list={list} />}

      <BadHabitFormModal
        open={!!draft}
        draft={draft}
        setDraft={setDraft}
        onSave={save}
        onClose={() => setDraft(null)}
      />

      <RelapseModal
        open={!!relapsing}
        habit={relapsing}
        prefill={prefill}
        onClose={() => {
          setRelapsing(null);
          setPrefill(null);
        }}
        onConfirm={confirmRelapse}
      />

      <UrgeModal
        open={!!urging}
        habit={urging}
        onClose={() => setUrging(null)}
        onConfirm={confirmUrge}
        onFell={(answers) => {
          const h = urging;
          setUrging(null);
          setPrefill(answers);
          setRelapsing(h);
        }}
      />
    </div>
  );
}

/* ==================================================================== *
 *  MODULE 4 — Analytics
 * ==================================================================== */
/* ==================================================================== *
 *  MODULE — the 90-day employability masterplan
 *
 *  Four views, because four different time horizons live here: what must
 *  happen in the next hour, this week, against one company, and across the
 *  whole hunt. They are deliberately not one scrolling page — the daily
 *  view has to be openable and finishable before breakfast.
 * ==================================================================== */
const CAREER_VIEWS = [
  { id: "today", label: "اليوم", icon: Sunrise },
  { id: "kit", label: "العدّة", icon: Briefcase },
  { id: "plan", label: "الخطة", icon: CalendarDays },
  { id: "war", label: "الشركات", icon: Crosshair },
  { id: "track", label: "التقديمات", icon: ClipboardList },
];

function ReadinessCard({ career, onStart }) {
  const { rows, total } = useMemo(() => readiness(career), [career]);
  const day = careerDayNo(career);
  const week = careerWeekNo(career);
  const left = career.startedAt ? Math.max(0, CAREER_DAYS - day) : CAREER_DAYS;

  return (
    <Card className="p-6 sm:p-7">
      {/* The ring sits beside the headline rather than after the breakdown:
          on a phone the column stacks, and a score six bars down the page is
          a score nobody sees. */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Gauge size={16} style={{ color: T.cta }} />
            <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">
              خطة التوظيف في ٩٠ يومًا
            </h2>
          </div>
          <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/40">
            الشهادة لا توظّف، الروتين يوظّف. ثلاث عشرة أسبوعًا في ثلاث مراحل،
            وخمس مهام كل أسبوع مكتوبة لخريج إدارة أعمال تحديدًا.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            {career.startedAt ? (
              <>
                <Badge tint={T.cta}>
                  اليوم{" "}
                  <span dir="ltr" className="tabular-nums">
                    {day}
                  </span>{" "}
                  من{" "}
                  <span dir="ltr" className="tabular-nums">
                    {CAREER_DAYS}
                  </span>
                </Badge>
                <Badge tint={T.accent}>
                  الأسبوع{" "}
                  <span dir="ltr" className="tabular-nums">
                    {week}
                  </span>{" "}
                  · {phaseOf(weekOf(week).phase).label}
                </Badge>
                <Badge tint={left > 0 ? T.sky : T.primary}>
                  {left > 0 ? (
                    <>
                      بقي{" "}
                      <span dir="ltr" className="tabular-nums">
                        {left}
                      </span>{" "}
                      {dayWord(left)}
                    </>
                  ) : (
                    "انتهت التسعون"
                  )}
                </Badge>
              </>
            ) : (
              <Btn variant="default" size="sm" onClick={onStart}>
                <Rocket size={14} strokeWidth={2.6} /> ابدأ العدّ من اليوم
              </Btn>
            )}
          </div>
        </div>

        <div className="self-center">
          <ProgressRing
            value={total}
            size={178}
            stroke={13}
            label="مؤشر الجهوزية"
            fullLabel="جاهز للتوظيف"
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => {
          const pct = Math.round((r.got / r.max) * 100);
          return (
            <div
              key={r.id}
              className="rounded-xl border px-3.5 py-2.5"
              style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[11.5px] font-bold" style={{ color: T.muted }}>
                  {r.label}
                </span>
                <span
                  dir="ltr"
                  className="shrink-0 text-[11px] font-extrabold tabular-nums"
                  style={{ color: r.tint }}
                >
                  {r.got}/{r.max}
                </span>
              </div>
              <div
                className="mt-2 h-1.5 overflow-hidden rounded-full"
                style={{ background: "rgba(255,255,255,0.07)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${r.tint}, ${r.tint}99)`,
                    boxShadow: pct > 0 ? `0 0 10px ${r.tint}80` : "none",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* One timer for all six blocks on purpose: a time-blocker that lets two run
   at once is a stopwatch collection, not a block. */
function SkillBlock({ block, done, live, left, onPick, onToggle, reward }) {
  const Icon = block.icon;
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const pct = ((BLOCK_MIN * 60 - left) / (BLOCK_MIN * 60)) * 100;

  return (
    <div
      className={`overflow-hidden rounded-2xl border transition-all duration-300${
        reward ? " los-reward" : ""
      }`}
      style={{
        borderColor: done ? `${T.primary}59` : live ? `${T.cta}70` : T.border,
        background: done
          ? `${T.primary}12`
          : live
          ? `${T.cta}12`
          : "rgba(255,255,255,0.03)",
      }}
    >
      <div className="flex items-center gap-3 px-3.5 py-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
          style={{
            borderColor: `${block.tint}45`,
            background: `${block.tint}18`,
            color: block.tint,
          }}
        >
          <Icon size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-[13px] font-extrabold"
            style={{
              color: done ? T.primary : T.fg,
              textDecoration: done ? "line-through" : "none",
            }}
          >
            {block.label}
          </p>
          <p className="truncate text-[10.5px]" style={{ color: T.faint }}>
            {live ? (
              <span dir="ltr" className="font-bold tabular-nums" style={{ color: T.ctaLift }}>
                {mm}:{ss}
              </span>
            ) : (
              block.hint
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Btn
            variant={live ? "outline" : "ghost"}
            size="icon"
            onClick={onPick}
            title={live ? "إيقاف الحصّة" : "ابدأ ٣٠ دقيقة"}
            aria-label={live ? "إيقاف الحصّة" : "ابدأ ٣٠ دقيقة"}
            style={{
              borderColor: live ? `${T.accent}59` : T.border,
              color: live ? T.accent : T.muted,
            }}
          >
            {live ? <Pause size={14} /> : <Play size={14} />}
          </Btn>
          {/* Checkbox grows to fill its label; with no label it needs a box
              of its own or it collapses next to the play button. */}
          <div className="flex w-8 justify-end">
            <Checkbox checked={!!done} onToggle={onToggle} tint={T.primary} size="sm" />
          </div>
        </div>
      </div>
      {live && (
        <div className="h-1" style={{ background: "rgba(255,255,255,0.07)" }}>
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${T.cta}, ${T.accent})`,
            }}
          />
        </div>
      )}
    </div>
  );
}

/* A block of ready-to-send text with one button. Clipboard access can be
   refused outright, so the text stays selectable on screen and the button
   simply reports what happened instead of failing silently. */
function CopyBox({ text, tint = T.cta, label = "انسخ النص" }) {
  const [copied, fireCopied] = useBurst(1800);
  const [failed, fireFailed] = useBurst(2600);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      fireCopied();
    } catch {
      fireFailed();
    }
  };

  return (
    <div
      className="rounded-xl border p-3"
      style={{ borderColor: `${tint}33`, background: `${tint}0D` }}
    >
      <pre
        className="whitespace-pre-wrap break-words font-[inherit] text-[11.5px] leading-relaxed"
        style={{ color: T.muted }}
      >
        {text}
      </pre>
      <div className="mt-2.5 flex items-center gap-2">
        <Btn
          variant={copied ? "success" : "outline"}
          size="sm"
          onClick={copy}
          style={copied ? undefined : { borderColor: `${tint}4D`, color: tint }}
        >
          {copied ? <CheckCheck size={12} /> : <Copy size={12} />}
          {copied ? "نُسخ" : label}
        </Btn>
        {failed && (
          <span className="text-[10px]" style={{ color: T.faint }}>
            النسخ محجوب — حدّد النص ثم انسخه يدويًّا
          </span>
        )}
      </div>
    </div>
  );
}

/* ---- One morning step ------------------------------------------------
   Collapsed it is a checkbox with a clock; opened it is the whole method.
   The method is deliberately *not* always visible: six expanded steps is a
   wall of text at 7am, and a wall of text is skipped the same way a bare
   imperative is. */
function AmStep({ step, n, on, open, onOpen, onToggle }) {
  const Icon = step.icon;
  const core = AM_CORE.has(step.id);

  return (
    <div
      className="rounded-xl border transition-all duration-300"
      style={{
        borderColor: on ? `${T.primary}4D` : T.border,
        background: on ? `${T.primary}0F` : "rgba(255,255,255,0.03)",
      }}
    >
      <div className="flex items-center gap-3 px-3.5 py-2.5">
        <span
          dir="ltr"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-[11px] font-extrabold tabular-nums"
          style={{
            borderColor: `${step.tint}45`,
            background: `${step.tint}18`,
            color: step.tint,
          }}
        >
          {n}
        </span>
        <Icon size={15} className="hidden shrink-0 sm:block" style={{ color: step.tint }} />
        <Checkbox
          checked={on}
          onToggle={onToggle}
          label={step.label}
          tint={T.primary}
          size="sm"
        />
        <span className="shrink-0 text-[10px] font-bold" style={{ color: T.faint }}>
          <span dir="ltr" className="tabular-nums">
            {step.min}
          </span>{" "}
          {minWord(step.min)}
        </span>
        {/* The core mark stays visible at every width: it is the only thing
            that tells the four streak-bearing steps apart from the two that
            merely warm you up. */}
        {core && (
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: T.cta }}
            title="خطوة أساسية — تحفظ السلسلة"
          />
        )}
        <button
          onClick={onOpen}
          aria-expanded={open}
          aria-label={open ? `أغلق شرح: ${step.label}` : `كيف أنفّذ: ${step.label}`}
          className="shrink-0 rounded-lg border p-1.5 transition-all duration-200 hover:brightness-125"
          style={{
            borderColor: open ? `${step.tint}4D` : T.border,
            color: open ? step.tint : T.faint,
            background: open ? `${step.tint}14` : "transparent",
          }}
        >
          <ChevronDown
            size={13}
            style={{
              transform: open ? "rotate(180deg)" : "none",
              transition: "transform .25s",
            }}
          />
        </button>
      </div>

      {open && (
        <div
          className="los-in space-y-3 border-t px-3.5 pb-3.5 pt-3"
          style={{ borderColor: T.border }}
        >
          <p className="flex items-start gap-1.5 text-[11px]" style={{ color: step.tint }}>
            <Milestone size={12} className="mt-0.5 shrink-0" />
            <span style={{ color: T.muted }}>{step.where}</span>
          </p>
          <ol className="space-y-1.5">
            {step.how.map((line, i) => (
              <li key={i} className="flex items-start gap-2 text-[11.5px] leading-relaxed">
                <span
                  dir="ltr"
                  className="mt-[3px] shrink-0 text-[10px] font-extrabold tabular-nums"
                  style={{ color: step.tint }}
                >
                  {i + 1}.
                </span>
                <span style={{ color: T.muted }}>{line}</span>
              </li>
            ))}
          </ol>
          {step.script && <CopyBox text={step.script} tint={step.tint} />}
        </div>
      )}
    </div>
  );
}

function CareerToday({ state, setState, onGo }) {
  const career = state.career;
  const today = careerToday(career.log);
  const skills = today.skills || [];
  const am = today.am || [];

  const [pick, setPick] = useState(null); // block id holding the timer
  const [openStep, setOpenStep] = useState(null); // the one expanded method
  const [endAt, setEndAt] = useState(null);
  const [left, setLeft] = useState(BLOCK_MIN * 60);
  const [rang, setRang] = useState(false);
  const [reward, fireReward] = useBurst(900);

  /* Target timestamp, not a decrementing counter: a background tab throttles
     intervals hard and a counted-down half hour silently loses minutes. */
  useEffect(() => {
    if (endAt === null) return;
    const tick = () => setLeft(Math.max(0, Math.round((endAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endAt]);

  const mark = useCallback(
    (id) =>
      setState((s) => ({
        ...s,
        career: { ...s.career, log: toggleDaily(s.career.log, "skills", id) },
      })),
    [setState],
  );

  /* A finished block is also a half hour of focused work, so it lands in the
     same session log the deep-work screen and the analytics read. One place
     counts minutes in this app, and this is it. */
  useEffect(() => {
    if (endAt === null || left > 0 || rang) return;
    setRang(true);
    setEndAt(null);
    fireReward();
    setState((s) => {
      const have = careerToday(s.career.log).skills || [];
      return {
        ...s,
        sessions: [
          ...(s.sessions || []),
          { id: uid(), date: dayKey(), minutes: BLOCK_MIN, taskId: null },
        ].slice(-400),
        career: {
          ...s.career,
          log: have.includes(pick)
            ? s.career.log
            : toggleDaily(s.career.log, "skills", pick),
        },
      };
    });
  }, [endAt, left, rang, pick, setState, fireReward]);

  const choose = (id) => {
    if (pick === id && endAt !== null) {
      setLeft(Math.max(0, Math.round((endAt - Date.now()) / 1000)));
      setEndAt(null);
      return;
    }
    const fresh = pick === id ? left || BLOCK_MIN * 60 : BLOCK_MIN * 60;
    setPick(id);
    setRang(false);
    setLeft(fresh);
    setEndAt(Date.now() + fresh * 1000);
  };

  const toggleAm = (id) =>
    setState((s) => ({
      ...s,
      career: { ...s.career, log: toggleDaily(s.career.log, "am", id) },
    }));

  const skillStreak = dailyStreak(career.log, "skills", SKILL_TARGET);
  const amStreak = dailyStreak(career.log, "am", AM_TARGET, AM_CORE);
  const coreDone = amCoreDone(am);
  const amPct = Math.round((am.length / AM_ROUTINE.length) * 100);
  const leftMin = AM_ROUTINE.filter((x) => !am.includes(x.id)).reduce((n, x) => n + x.min, 0);
  const hit = skills.length >= SKILL_TARGET;

  const setupLeft = SETUP_TOTAL - setupDone(career);

  return (
    <div className="space-y-5">
      {setupLeft > 0 && (
        <Card
          className="p-5 sm:p-6"
          style={{ borderColor: `${T.sky}59`, boxShadow: `0 18px 44px -28px ${T.sky}` }}
        >
          <h3
            className="flex items-center gap-2 text-[15px] font-extrabold"
            style={{ color: T.sky }}
          >
            <Building2 size={16} /> ابدأ من الأرضية
          </h3>
          <p className="mt-1.5 text-[11.5px] leading-relaxed" style={{ color: T.muted }}>
            بقيت{" "}
            <span dir="ltr" className="tabular-nums font-bold">
              {setupLeft}
            </span>{" "}
            {stepWord(setupLeft)} من التسجيلات التي تُنجَز مرّة
            وتعمل شهورًا — تمهير وطاقات ودروب وغيرها. أمسية واحدة هنا تساوي
            أسبوعًا من التقديم العشوائي.
          </p>
          <Btn
            variant="default"
            size="sm"
            className="mt-3.5"
            onClick={() => onGo && onGo("kit")}
          >
            <Briefcase size={13} /> افتح العدّة
          </Btn>
        </Card>
      )}

      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Sunrise size={17} style={{ color: T.accent }} />
            <h3 className="text-[17px] font-extrabold" style={{ color: T.accent }}>
              روتين الصباح التنفيذي
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge tint={amPct === 100 ? T.primary : T.accent}>
              <span dir="ltr" className="tabular-nums">
                {am.length}/{AM_ROUTINE.length}
              </span>
            </Badge>
            {amStreak > 0 && (
              <Badge tint={T.ember}>
                <Flame size={10} />
                <span dir="ltr" className="tabular-nums">
                  {amStreak}
                </span>{" "}
                {dayWord(amStreak)}
              </Badge>
            )}
          </div>
        </div>
        <p className="mt-1.5 text-[11.5px] leading-relaxed" style={{ color: T.faint }}>
          ست خطوات في{" "}
          <span dir="ltr" className="tabular-nums">
            {AM_MINUTES}
          </span>{" "}
          {minWord(AM_MINUTES)}، تُنفَّذ بالترتيب قبل أن يأخذ اليوم رأيه فيك. اضغط السهم في أي
          خطوة لترى أين تُنفَّذ وكيف، ومعها نصّ جاهز للنسخ.
        </p>

        {/* The contract, said out loud: four specific steps carry the streak,
            and which four is not left to be guessed from a number. */}
        <div
          className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border px-3.5 py-2.5 text-[11px]"
          style={{ borderColor: `${T.cta}2E`, background: `${T.cta}0A` }}
        >
          <span className="flex items-center gap-1.5" style={{ color: T.muted }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: T.cta }} />
            الخطوات الأساسية الأربع (تقديم، متابعة، تواصل، تحسين) هي ما يحفظ
            السلسلة — والباقي يهيّئك لها.
          </span>
          <span className="flex items-center gap-1.5 font-bold" style={{ color: coreDone >= AM_TARGET ? T.primary : T.ctaLift }}>
            <Flame size={11} />
            <span dir="ltr" className="tabular-nums">
              {coreDone}/{AM_TARGET}
            </span>
            {coreDone >= AM_TARGET ? "السلسلة محفوظة اليوم" : "لحفظ اليوم"}
          </span>
        </div>

        <div className="mt-4 space-y-2">
          {AM_ROUTINE.map((item, i) => (
            <AmStep
              key={item.id}
              step={item}
              n={i + 1}
              on={am.includes(item.id)}
              open={openStep === item.id}
              onOpen={() => setOpenStep((x) => (x === item.id ? null : item.id))}
              onToggle={() => toggleAm(item.id)}
            />
          ))}
        </div>

        <p className="mt-3 text-[11px]" style={{ color: T.faint }}>
          {am.length === AM_ROUTINE.length ? (
            "انتهى الروتين. ما تبقّى من اليوم ربح صافٍ."
          ) : (
            <>
              المتبقّي{" "}
              <span dir="ltr" className="tabular-nums">
                {leftMin}
              </span>{" "}
              {minWord(leftMin)}.
            </>
          )}
        </p>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Clock size={17} style={{ color: T.cta }} />
            <h3 className="text-[17px] font-extrabold" style={{ color: T.ctaLift }}>
              حصص المهارات — نصف ساعة لكل حصّة
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge tint={hit ? T.primary : T.cta}>
              <span dir="ltr" className="tabular-nums">
                {skills.length}/{SKILL_TARGET}
              </span>{" "}
              اليوم
            </Badge>
            {skillStreak > 0 && (
              <Badge tint={T.ember}>
                <Flame size={10} />
                <span dir="ltr" className="tabular-nums">
                  {skillStreak}
                </span>{" "}
                {dayWord(skillStreak)}
              </Badge>
            )}
          </div>
        </div>
        <p className="mt-1.5 text-[11.5px]" style={{ color: T.faint }}>
          حصّتان في اليوم تحفظان السلسلة. الحصّة المكتملة تُسجَّل في العمل العميق
          تلقائيًّا.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-2.5 xl:grid-cols-2">
          {SKILL_BLOCKS.map((b) => (
            <SkillBlock
              key={b.id}
              block={b}
              done={skills.includes(b.id)}
              live={pick === b.id && endAt !== null}
              left={pick === b.id ? left : BLOCK_MIN * 60}
              reward={reward && pick === b.id}
              onPick={() => choose(b.id)}
              onToggle={() => mark(b.id)}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

function CareerPlan({ state, setState }) {
  const career = state.career;
  const live = careerWeekNo(career);
  const [week, setWeek] = useState(live);
  const data = weekOf(week);
  const phase = phaseOf(data.phase);
  const missions = career.missions || {};

  const toggle = (i) =>
    setState((s) => {
      const k = missionKey(week, i);
      const next = { ...(s.career.missions || {}) };
      if (next[k]) delete next[k];
      else next[k] = true;
      return { ...s, career: { ...s.career, missions: next } };
    });

  const doneHere = data.missions.filter((_, i) => missions[missionKey(week, i)]).length;
  const allDone = missionsIn(missions, CAREER_WEEKS.map((w) => w.w));

  return (
    <div className="space-y-5">
      {/* phases — the completion percentage of each is the whole point */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {CAREER_PHASES.map((p) => {
          const hit = missionsIn(missions, p.weeks);
          const total = missionCount(p.weeks);
          const pct = total ? Math.round((hit / total) * 100) : 0;
          const here = p.id === data.phase;
          const Icon = p.icon;
          return (
            <Card
              key={p.id}
              className="p-4 transition-all duration-300"
              style={{
                borderColor: here ? `${p.tint}70` : "rgba(255,225,210,0.18)",
                boxShadow: here ? `0 14px 36px -22px ${p.tint}` : undefined,
              }}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: `${p.tint}45`,
                    background: `${p.tint}18`,
                    color: p.tint,
                  }}
                >
                  <Icon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-extrabold" style={{ color: p.tint }}>
                    {p.label}
                  </p>
                  <p className="truncate text-[10px]" style={{ color: T.faint }}>
                    {p.span}
                  </p>
                </div>
                <span
                  dir="ltr"
                  className="shrink-0 text-[15px] font-extrabold tabular-nums"
                  style={{ color: pct === 100 ? T.primary : p.tint }}
                >
                  {pct}%
                </span>
              </div>
              <p className="mt-2.5 text-[11px] leading-relaxed" style={{ color: T.muted }}>
                {p.aim}
              </p>
              <div
                className="mt-3 h-1.5 overflow-hidden rounded-full"
                style={{ background: "rgba(255,255,255,0.07)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${pct === 100 ? T.primary : p.tint}, ${
                      pct === 100 ? T.primaryLift : p.tint
                    }99)`,
                    boxShadow: pct > 0 ? `0 0 10px ${pct === 100 ? T.primary : p.tint}80` : "none",
                  }}
                />
              </div>
            </Card>
          );
        })}
      </div>

      {/* week strip */}
      <Card className="p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: T.faint }}>
            <Milestone size={12} /> الأسابيع الثلاثة عشر
          </p>
          <Badge tint={T.cta}>
            <span dir="ltr" className="tabular-nums">
              {allDone}/{MISSION_TOTAL}
            </span>{" "}
            مهمة
          </Badge>
        </div>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-7 lg:grid-cols-[repeat(13,minmax(0,1fr))]">
          {CAREER_WEEKS.map((w) => {
            const on = w.w === week;
            const tint = phaseOf(w.phase).tint;
            const hit = w.missions.filter((_, i) => missions[missionKey(w.w, i)]).length;
            const full = hit === w.missions.length;
            const now = w.w === live && !!career.startedAt;
            return (
              <button
                key={w.w}
                onClick={() => setWeek(w.w)}
                aria-pressed={on}
                title={w.title}
                className="relative rounded-xl border py-2 text-center transition-all duration-200"
                style={{
                  borderColor: on ? `${tint}99` : full ? `${T.primary}4D` : T.border,
                  backgroundImage: on ? `linear-gradient(160deg, ${tint}33, ${tint}0A)` : "none",
                  backgroundColor: on
                    ? "transparent"
                    : full
                    ? `${T.primary}12`
                    : "rgba(255,255,255,0.03)",
                  color: on ? tint : full ? T.primary : T.muted,
                }}
              >
                <span dir="ltr" className="block text-[13px] font-extrabold tabular-nums">
                  {w.w}
                </span>
                <span dir="ltr" className="block text-[9px] tabular-nums opacity-70">
                  {hit}/{w.missions.length}
                </span>
                {now && (
                  <span
                    aria-label="الأسبوع الحالي"
                    className="absolute left-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
                    style={{ background: T.cta, boxShadow: `0 0 8px ${T.cta}` }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* the selected week */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Badge tint={phase.tint}>{phase.label}</Badge>
              <Badge tint={T.faint}>
                الأسبوع{" "}
                <span dir="ltr" className="tabular-nums">
                  {week}
                </span>
              </Badge>
            </div>
            <h3 className="mt-2.5 text-[19px] font-extrabold" style={{ color: T.fg }}>
              {data.title}
            </h3>
            <p className="mt-1 text-[11.5px] leading-relaxed" style={{ color: T.muted }}>
              {data.aim}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Btn
              variant="ghost"
              size="icon"
              onClick={() => setWeek(Math.max(1, week - 1))}
              disabled={week === 1}
              aria-label="الأسبوع السابق"
              style={{ borderColor: T.border }}
            >
              <ChevronRight size={15} />
            </Btn>
            <span
              dir="ltr"
              className="text-[13px] font-extrabold tabular-nums"
              style={{ color: doneHere === data.missions.length ? T.primary : T.accent }}
            >
              {doneHere}/{data.missions.length}
            </span>
            <Btn
              variant="ghost"
              size="icon"
              onClick={() => setWeek(Math.min(CAREER_WEEK_COUNT, week + 1))}
              disabled={week === CAREER_WEEK_COUNT}
              aria-label="الأسبوع التالي"
              style={{ borderColor: T.border }}
            >
              <ChevronLeft size={15} />
            </Btn>
          </div>
        </div>

        <div className="mt-5 space-y-2.5">
          {data.missions.map((m, i) => {
            const on = !!missions[missionKey(week, i)];
            return (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border px-3.5 py-3 transition-all duration-300"
                style={{
                  borderColor: on ? `${T.primary}4D` : T.border,
                  background: on ? `${T.primary}0F` : "rgba(255,255,255,0.03)",
                }}
              >
                <span
                  dir="ltr"
                  className="mt-1 w-4 shrink-0 text-center text-[10px] font-extrabold tabular-nums"
                  style={{ color: on ? T.primary : T.faint }}
                >
                  {i + 1}
                </span>
                <Checkbox
                  checked={on}
                  onToggle={() => toggle(i)}
                  label={m}
                  tint={T.primary}
                  size="sm"
                />
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function SprintCard({ sprint, onToggle, onNote, onEdit, onDelete }) {
  const [open, setOpen] = useState(sprintOpenDay(sprint));
  const [copied, fireCopied] = useBurst(1800);
  const done = sprintDone(sprint);
  const pct = Math.round((done / SPRINT_DAYS.length) * 100);
  const next = sprintOpenDay(sprint);
  const finished = next === 0;

  /* Finishing a day opens the next one. The sequence is the whole feature,
     and hunting for the next card is how a sequence gets abandoned. */
  const tick = (d) => {
    onToggle(d);
    setOpen(sprint.days[d] ? d : d < SPRINT_DAYS.length ? d + 1 : 0);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sprintPitch(sprint));
      fireCopied();
    } catch {
      /* clipboard can be blocked — the text is on screen to select */
    }
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
              style={{
                borderColor: finished ? `${T.primary}45` : `${T.cta}45`,
                background: finished ? `${T.primary}18` : `${T.cta}18`,
                color: finished ? T.primary : T.cta,
              }}
            >
              <Crosshair size={18} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[16px] font-extrabold" style={{ color: T.fg }}>
                {sprint.company || "شركة بلا اسم"}
              </p>
              <p className="truncate text-[10.5px]" style={{ color: T.faint }}>
                {sprint.role || "دور إداري"} · بدأ <Since day={sprint.startedAt} />
              </p>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge tint={finished ? T.primary : T.cta}>
            <span dir="ltr" className="tabular-nums">
              {done}/{SPRINT_DAYS.length}
            </span>
          </Badge>
          <Btn
            variant="ghost"
            size="icon"
            onClick={onEdit}
            aria-label="تعديل الهجوم"
            style={{ borderColor: T.border }}
          >
            <Pencil size={13} />
          </Btn>
          <Btn
            variant="ghost"
            size="icon"
            onClick={onDelete}
            aria-label="حذف الهجوم"
            style={{ borderColor: T.border, color: T.danger }}
          >
            <Trash2 size={13} />
          </Btn>
        </div>
      </div>

      <div
        className="mt-4 h-1.5 overflow-hidden rounded-full"
        style={{ background: "rgba(255,255,255,0.07)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${finished ? T.primary : T.cta}, ${
              finished ? T.primaryLift : T.accent
            })`,
            boxShadow: pct > 0 ? `0 0 10px ${finished ? T.primary : T.cta}80` : "none",
          }}
        />
      </div>

      <div className="mt-4 space-y-2.5">
        {SPRINT_DAYS.map((d) => {
          const on = !!sprint.days[d.d];
          /* Locked until the day before it is ticked: a sprint that jumps
             to day seven is just another cold message, which is the thing
             this schedule exists to replace. */
          const locked = !on && d.d !== next;
          const Icon = locked ? Lock : d.icon;
          const expanded = open === d.d;
          return (
            <div
              key={d.d}
              className="overflow-hidden rounded-xl border transition-all duration-300"
              style={{
                borderColor: on
                  ? `${T.primary}4D`
                  : locked
                  ? T.border
                  : `${d.tint}70`,
                background: on
                  ? `${T.primary}0F`
                  : locked
                  ? "rgba(255,255,255,0.02)"
                  : `${d.tint}10`,
                opacity: locked ? 0.55 : 1,
              }}
            >
              <button
                onClick={() => setOpen(expanded ? 0 : d.d)}
                className="flex w-full items-center gap-3 px-3.5 py-2.5 text-right"
                aria-expanded={expanded}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
                  style={{
                    borderColor: on ? `${T.primary}45` : `${d.tint}3D`,
                    background: on ? `${T.primary}18` : `${d.tint}14`,
                    color: on ? T.primary : locked ? T.faint : d.tint,
                  }}
                >
                  <Icon size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-[12.5px] font-extrabold"
                    style={{ color: on ? T.primary : locked ? T.muted : T.fg }}
                  >
                    اليوم{" "}
                    <span dir="ltr" className="tabular-nums">
                      {d.d}
                    </span>{" "}
                    · {d.label}
                  </p>
                  <p className="truncate text-[10px]" style={{ color: T.faint }}>
                    {d.out}
                  </p>
                </div>
                {expanded ? (
                  <ChevronUp size={14} style={{ color: T.faint }} />
                ) : (
                  <ChevronDown size={14} style={{ color: T.faint }} />
                )}
              </button>

              {expanded && (
                <div className="space-y-3 border-t px-3.5 py-3" style={{ borderColor: T.border }}>
                  <p className="text-[11.5px] leading-relaxed" style={{ color: T.muted }}>
                    {d.task}
                  </p>

                  {d.d === 7 && (
                    <div
                      className="rounded-xl border p-3"
                      style={{ borderColor: `${T.cta}3D`, background: `${T.cta}0D` }}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: T.ctaLift }}>
                          <Send size={11} /> الرسالة الجاهزة
                        </p>
                        <Btn
                          variant={copied ? "success" : "outline"}
                          size="sm"
                          onClick={copy}
                          style={copied ? undefined : { borderColor: T.border }}
                        >
                          {copied ? <CheckCheck size={12} /> : <Copy size={12} />}
                          {copied ? "نُسخت" : "انسخ"}
                        </Btn>
                      </div>
                      <pre
                        className="whitespace-pre-wrap text-[11px] leading-relaxed"
                        style={{ color: T.muted, fontFamily: "inherit" }}
                      >
                        {sprintPitch(sprint)}
                      </pre>
                    </div>
                  )}

                  <Field
                    as="textarea"
                    rows={2}
                    value={sprint.notes[d.d] || ""}
                    onChange={(e) => onNote(d.d, e.target.value)}
                    className="resize-none text-[12px]"
                    placeholder="ما خرجت به من هذا اليوم…"
                    aria-label={`ملاحظة اليوم ${d.d}`}
                  />

                  <Btn
                    variant={on ? "outline" : "success"}
                    size="sm"
                    onClick={() => tick(d.d)}
                    disabled={locked}
                    className="w-full"
                    style={on ? { borderColor: T.border } : undefined}
                  >
                    {on ? (
                      <>
                        <RotateCcw size={12} /> أعد فتح اليوم
                      </>
                    ) : (
                      <>
                        <Check size={13} strokeWidth={3} /> أنجزت هذا اليوم
                      </>
                    )}
                  </Btn>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function SprintModal({ open, draft, setDraft, onClose, onSave }) {
  if (!draft) return null;
  const set = (k) => (e) => setDraft({ ...draft, [k]: e.target.value });
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={draft.id ? "تعديل الهجوم" : "هجوم شركة جديد"}
      footer={
        <>
          <Btn variant="default" onClick={onSave} className="flex-1" disabled={!draft.company.trim()}>
            <Check size={15} strokeWidth={3} /> {draft.id ? "حفظ" : "ابدأ السبعة أيام"}
          </Btn>
          <Btn variant="ghost" onClick={onClose} style={{ borderColor: T.border }}>
            إلغاء
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="los-sp-c" className="mb-1.5 block text-[11px] font-bold" style={{ color: T.muted }}>
            اسم الشركة
          </label>
          <Field id="los-sp-c" value={draft.company} onChange={set("company")} placeholder="مثال: شركة المراعي" />
        </div>
        <div>
          <label htmlFor="los-sp-r" className="mb-1.5 block text-[11px] font-bold" style={{ color: T.muted }}>
            الدور المستهدف
          </label>
          <Field id="los-sp-r" value={draft.role} onChange={set("role")} placeholder="منسّق إداري" />
        </div>
        <div>
          <label htmlFor="los-sp-n" className="mb-1.5 block text-[11px] font-bold" style={{ color: T.muted }}>
            جهة الاتصال (إن عرفتها)
          </label>
          <Field id="los-sp-n" value={draft.contact} onChange={set("contact")} placeholder="أ. فلان، مدير الموارد البشرية" />
        </div>
        <div>
          <label htmlFor="los-sp-p" className="mb-1.5 block text-[11px] font-bold" style={{ color: T.muted }}>
            نقطة الألم — تُكتب في اليوم الأول
          </label>
          <Field
            id="los-sp-p"
            as="textarea"
            rows={2}
            value={draft.pain}
            onChange={set("pain")}
            className="resize-none"
            placeholder="تتوسّع بثلاثة فروع ولا يظهر لها نظام متابعة طلبات موحّد"
          />
        </div>
        <div>
          <label htmlFor="los-sp-s" className="mb-1.5 block text-[11px] font-bold" style={{ color: T.muted }}>
            المخرج — يُبنى في اليوم الثاني
          </label>
          <Field
            id="los-sp-s"
            as="textarea"
            rows={2}
            value={draft.solution}
            onChange={set("solution")}
            className="resize-none"
            placeholder="نموذج متابعة طلبات على إكسل بلوحة مؤشّرات"
          />
        </div>
        <p className="text-[10.5px] leading-relaxed" style={{ color: T.faint }}>
          النقطة والمخرج يُركّبان رسالة اليوم السابع تلقائيًّا.
        </p>
      </div>
    </Modal>
  );
}

function CareerWar({ state, setState }) {
  const sprints = state.career.sprints || [];
  const [draft, setDraft] = useState(null);

  const save = () => {
    const company = draft.company.trim();
    if (!company) return;
    setState((s) => ({
      ...s,
      career: {
        ...s.career,
        sprints: draft.id
          ? s.career.sprints.map((x) => (x.id === draft.id ? { ...x, ...draft, company } : x))
          : [sprintShape({ ...draft, company }), ...s.career.sprints],
      },
    }));
    setDraft(null);
  };

  const patch = (id, fn) =>
    setState((s) => ({
      ...s,
      career: {
        ...s.career,
        sprints: s.career.sprints.map((x) => (x.id === id ? fn(x) : x)),
      },
    }));

  const remove = (id) => {
    if (!window.confirm("حذف هذا الهجوم وكل ملاحظاته؟")) return;
    setState((s) => ({
      ...s,
      career: { ...s.career, sprints: s.career.sprints.filter((x) => x.id !== id) },
    }));
  };

  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-[17px] font-extrabold" style={{ color: T.ctaLift }}>
              <Crosshair size={17} /> خطة اختراق الشركات
            </h3>
            <p className="mt-1.5 max-w-xl text-[11.5px] leading-relaxed" style={{ color: T.faint }}>
              اكتب اسم شركة، فيُولَّد لها جدول سبعة أيام مقفل بالترتيب: بحث، ثم
              مخرج، ثم أسماء، ثم ثلاثة أيام قيمة أولًا، ثم رسالة واحدة تُرسل.
            </p>
          </div>
          <Btn
            variant="default"
            size="sm"
            onClick={() =>
              setDraft({
                company: "",
                role: "",
                contact: "",
                pain: "",
                solution: "",
              })
            }
          >
            <Plus size={14} strokeWidth={3} /> هجوم جديد
          </Btn>
        </div>
      </Card>

      {sprints.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 border-dashed p-10 text-center">
          <Crosshair size={26} style={{ color: T.faint }} />
          <p className="text-[12.5px]" style={{ color: T.muted }}>
            لا هجوم مفتوح. شركة واحدة مدروسة أفضل من خمسين تقديمًا منسوخًا.
          </p>
        </Card>
      ) : (
        sprints.map((sp) => (
          <SprintCard
            key={sp.id}
            sprint={sp}
            onToggle={(d) =>
              patch(sp.id, (x) => {
                const days = { ...x.days };
                if (days[d]) delete days[d];
                else days[d] = true;
                return { ...x, days };
              })
            }
            onNote={(d, text) =>
              patch(sp.id, (x) => ({ ...x, notes: { ...x.notes, [d]: text } }))
            }
            onEdit={() => setDraft({ ...sp })}
            onDelete={() => remove(sp.id)}
          />
        ))
      )}

      <SprintModal
        open={!!draft}
        draft={draft}
        setDraft={setDraft}
        onClose={() => setDraft(null)}
        onSave={save}
      />
    </div>
  );
}

function AppModal({ open, draft, setDraft, onClose, onSave }) {
  if (!draft) return null;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={draft.id ? "تعديل التقديم" : "تقديم جديد"}
      footer={
        <>
          <Btn variant="default" onClick={onSave} className="flex-1" disabled={!draft.company.trim()}>
            <Check size={15} strokeWidth={3} /> حفظ
          </Btn>
          <Btn variant="ghost" onClick={onClose} style={{ borderColor: T.border }}>
            إلغاء
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="los-ap-c" className="mb-1.5 block text-[11px] font-bold" style={{ color: T.muted }}>
            الشركة
          </label>
          <Field
            id="los-ap-c"
            value={draft.company}
            onChange={(e) => setDraft({ ...draft, company: e.target.value })}
            placeholder="اسم الشركة"
          />
        </div>
        <div>
          <label htmlFor="los-ap-r" className="mb-1.5 block text-[11px] font-bold" style={{ color: T.muted }}>
            المسمّى
          </label>
          <Field
            id="los-ap-r"
            value={draft.role}
            onChange={(e) => setDraft({ ...draft, role: e.target.value })}
            placeholder="منسّق إداري"
          />
        </div>
        <div>
          <p className="mb-1.5 text-[11px] font-bold" style={{ color: T.muted }}>
            المرحلة
          </p>
          <div className="flex flex-wrap gap-2">
            {APP_STAGES.map((s) => {
              const on = s.id === draft.stage;
              return (
                <button
                  key={s.id}
                  onClick={() => setDraft({ ...draft, stage: s.id })}
                  aria-pressed={on}
                  className="rounded-xl border px-3 py-1.5 text-[11.5px] font-bold transition-all duration-200"
                  style={{
                    borderColor: on ? `${s.tint}80` : T.border,
                    background: on ? `${s.tint}1F` : "transparent",
                    color: on ? s.tint : T.faint,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label htmlFor="los-ap-n" className="mb-1.5 block text-[11px] font-bold" style={{ color: T.muted }}>
            ملاحظة
          </label>
          <Field
            id="los-ap-n"
            as="textarea"
            rows={2}
            value={draft.note}
            onChange={(e) => setDraft({ ...draft, note: e.target.value })}
            className="resize-none"
            placeholder="القناة، اسم من كلّمك، أي وعد بموعد…"
          />
        </div>
      </div>
    </Modal>
  );
}

function StoryModal({ open, draft, setDraft, onClose, onSave }) {
  if (!draft) return null;
  const set = (k) => (e) => setDraft({ ...draft, [k]: e.target.value });
  const rows = [
    { k: "situation", label: "الموقف", hint: "أين ومتى، في سطر" },
    { k: "task", label: "المهمة", hint: "ما كان مطلوبًا منك تحديدًا" },
    { k: "action", label: "الإجراء", hint: "ما فعلته أنت، لا ما فعله الفريق" },
    { k: "result", label: "النتيجة", hint: "برقم: وفّرت، قلّصت، أنجزت قبل…" },
  ];
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={draft.id ? "تعديل القصة" : "قصة مقابلة جديدة"}
      footer={
        <>
          <Btn variant="default" onClick={onSave} className="flex-1" disabled={!draft.title.trim()}>
            <Check size={15} strokeWidth={3} /> حفظ
          </Btn>
          <Btn variant="ghost" onClick={onClose} style={{ borderColor: T.border }}>
            إلغاء
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="los-st-t" className="mb-1.5 block text-[11px] font-bold" style={{ color: T.muted }}>
            عنوان القصة
          </label>
          <Field
            id="los-st-t"
            value={draft.title}
            onChange={set("title")}
            placeholder="مثال: أنقذت تسليم تقرير متأخّر"
          />
        </div>
        {rows.map((r) => (
          <div key={r.k}>
            <label htmlFor={`los-st-${r.k}`} className="mb-1.5 block text-[11px] font-bold" style={{ color: T.muted }}>
              {r.label}
            </label>
            <Field
              id={`los-st-${r.k}`}
              as="textarea"
              rows={2}
              value={draft[r.k]}
              onChange={set(r.k)}
              className="resize-none"
              placeholder={r.hint}
            />
          </div>
        ))}
      </div>
    </Modal>
  );
}

function StoryCard({ story, onEdit, onDelete }) {
  const [copied, fireCopied] = useBurst(1800);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        [
          story.title,
          "",
          `الموقف: ${story.situation}`,
          `المهمة: ${story.task}`,
          `الإجراء: ${story.action}`,
          `النتيجة: ${story.result}`,
        ].join("\n"),
      );
      fireCopied();
    } catch {
      /* clipboard blocked — the text is on screen to select */
    }
  };

  return (
    <div
      className="rounded-xl border p-3.5"
      style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
    >
      <div className="flex items-start gap-2.5">
        <Award size={15} className="mt-0.5 shrink-0" style={{ color: T.rose }} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-extrabold" style={{ color: T.fg }}>
            {story.title}
          </p>
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed" style={{ color: T.muted }}>
            {story.result || story.action || story.situation || "لم تُكتب بعد"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Btn
            variant="ghost"
            size="icon"
            onClick={copy}
            aria-label="انسخ القصة"
            style={{ borderColor: T.border, color: copied ? T.primary : T.muted }}
          >
            {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
          </Btn>
          <Btn variant="ghost" size="icon" onClick={onEdit} aria-label="تعديل" style={{ borderColor: T.border }}>
            <Pencil size={13} />
          </Btn>
          <Btn
            variant="ghost"
            size="icon"
            onClick={onDelete}
            aria-label="حذف"
            style={{ borderColor: T.border, color: T.danger }}
          >
            <Trash2 size={13} />
          </Btn>
        </div>
      </div>
    </div>
  );
}

function CareerTrack({ state, setState }) {
  const apps = state.career.apps || [];
  const stories = state.career.stories || [];
  const [draft, setDraft] = useState(null);
  const [story, setStory] = useState(null);

  const overdue = apps.filter(needsFollowUp);
  const sent30 = apps.filter((a) => daysBetween(a.sentAt) <= 30).length;
  const interviews = apps.filter((a) => a.stage === "intv" || a.stage === "offer").length;
  const offers = apps.filter((a) => a.stage === "offer").length;

  const saveApp = () => {
    const company = draft.company.trim();
    if (!company) return;
    setState((s) => ({
      ...s,
      career: {
        ...s.career,
        apps: draft.id
          ? s.career.apps.map((a) => (a.id === draft.id ? { ...a, ...draft, company } : a))
          : [appShape({ ...draft, company }), ...s.career.apps],
      },
    }));
    setDraft(null);
  };

  const touch = (id) =>
    setState((s) => ({
      ...s,
      career: {
        ...s.career,
        apps: s.career.apps.map((a) =>
          a.id === id
            ? { ...a, touchedAt: dayKey(), stage: a.stage === "sent" ? "touch" : a.stage }
            : a,
        ),
      },
    }));

  const removeApp = (id) =>
    setState((s) => ({
      ...s,
      career: { ...s.career, apps: s.career.apps.filter((a) => a.id !== id) },
    }));

  const saveStory = () => {
    const title = story.title.trim();
    if (!title) return;
    setState((s) => ({
      ...s,
      career: {
        ...s.career,
        stories: story.id
          ? s.career.stories.map((x) => (x.id === story.id ? { ...x, ...story, title } : x))
          : [...s.career.stories, storyShape({ ...story, title })],
      },
    }));
    setStory(null);
  };

  const stats = [
    { label: "تقديم خلال ٣٠ يومًا", n: sent30, tint: T.indigo },
    { label: "مقابلات", n: interviews, tint: T.accent },
    { label: "عروض", n: offers, tint: T.primary },
    { label: "تحتاج متابعة", n: overdue.length, tint: overdue.length ? T.danger : T.faint },
  ];

  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-[17px] font-extrabold" style={{ color: T.ctaLift }}>
              <ClipboardList size={17} /> لوحة التقديمات
            </h3>
            <p className="mt-1.5 text-[11.5px]" style={{ color: T.faint }}>
              التقديم الذي لا يُتابَع يُنسى. ما مضى عليه{" "}
              <span dir="ltr" className="tabular-nums">
                {FOLLOWUP_DAYS}
              </span>{" "}
              أيام بلا حركة يظهر في الرادار.
            </p>
          </div>
          <Btn
            variant="default"
            size="sm"
            onClick={() => setDraft({ company: "", role: "", stage: "sent", note: "" })}
          >
            <Plus size={14} strokeWidth={3} /> تقديم جديد
          </Btn>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border px-3 py-2.5 text-center"
              style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
            >
              <p dir="ltr" className="text-[20px] font-extrabold tabular-nums" style={{ color: s.tint }}>
                {s.n}
              </p>
              <p className="mt-0.5 text-[10px] leading-tight" style={{ color: T.faint }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {overdue.length > 0 && (
        <Card
          className="p-5 sm:p-6"
          style={{ borderColor: `${T.danger}59`, boxShadow: `0 18px 44px -28px ${T.danger}` }}
        >
          <h3 className="flex items-center gap-2 text-[15px] font-extrabold" style={{ color: T.danger }}>
            <Radar size={16} /> رادار المتابعة
          </h3>
          <p className="mt-1.5 text-[11.5px]" style={{ color: T.muted }}>
            رسالة متابعة واحدة قصيرة ترفع احتمال الردّ أكثر من تقديم جديد.
          </p>
          <div className="mt-4 space-y-2">
            {overdue.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-xl border px-3.5 py-2.5"
                style={{ borderColor: `${T.danger}3D`, background: `${T.danger}0D` }}
              >
                <AlertTriangle size={14} className="shrink-0" style={{ color: T.danger }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-bold" style={{ color: T.fg }}>
                    {a.company}
                  </p>
                  <p className="truncate text-[10px]" style={{ color: T.faint }}>
                    بلا حركة منذ{" "}
                    <span dir="ltr" className="tabular-nums">
                      {daysBetween(a.touchedAt || a.sentAt)}
                    </span>{" "}
                    {dayWord(daysBetween(a.touchedAt || a.sentAt))}
                  </p>
                </div>
                <Btn variant="success" size="sm" onClick={() => touch(a.id)}>
                  <Mail size={12} /> تابعت اليوم
                </Btn>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-5 sm:p-6">
        <div className="space-y-2">
          {apps.length === 0 ? (
            <p
              className="rounded-xl border border-dashed py-10 text-center text-[11.5px]"
              style={{ borderColor: T.border, color: T.faint }}
            >
              لا تقديمات بعد — ابدأ بواحد مطابق اليوم، لا بعشرة منسوخة
            </p>
          ) : (
            apps.map((a) => {
              const st = stageOf(a.stage);
              const late = needsFollowUp(a);
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-all duration-300"
                  style={{
                    borderColor: late ? `${T.danger}3D` : T.border,
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
                    style={{
                      borderColor: `${st.tint}3D`,
                      background: `${st.tint}14`,
                      color: st.tint,
                    }}
                  >
                    <Send size={13} />
                  </span>
                  <button
                    onClick={() => setDraft({ ...a })}
                    className="min-w-0 flex-1 text-right"
                    aria-label={`تعديل تقديم ${a.company}`}
                  >
                    <p className="truncate text-[12.5px] font-extrabold" style={{ color: T.fg }}>
                      {a.company}
                    </p>
                    <p className="truncate text-[10px]" style={{ color: T.faint }}>
                      {a.role || "بلا مسمّى"} · أُرسل <Since day={a.sentAt} />
                    </p>
                  </button>
                  <Badge tint={st.tint} className="shrink-0">
                    {st.label}
                  </Badge>
                  <Btn
                    variant="ghost"
                    size="icon"
                    onClick={() => removeApp(a.id)}
                    aria-label="حذف التقديم"
                    style={{ borderColor: T.border, color: T.danger }}
                  >
                    <Trash2 size={13} />
                  </Btn>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-[17px] font-extrabold" style={{ color: T.rose }}>
              <Award size={17} /> بنك قصص المقابلة
            </h3>
            <p className="mt-1.5 max-w-xl text-[11.5px] leading-relaxed" style={{ color: T.faint }}>
              السبب الأول لرفض حديث التخرّج أنه يذكر صفاته ولا يملك قصصًا. ستّ
              قصص بصيغة STAR تكفي كل سؤال سلوكي تقريبًا.
            </p>
          </div>
          <Btn
            variant="default"
            size="sm"
            onClick={() =>
              setStory({ title: "", situation: "", task: "", action: "", result: "" })
            }
          >
            <Plus size={14} strokeWidth={3} /> قصة جديدة
          </Btn>
        </div>

        <div className="mt-4 space-y-2">
          {stories.length === 0 ? (
            <p
              className="rounded-xl border border-dashed py-8 text-center text-[11.5px]"
              style={{ borderColor: T.border, color: T.faint }}
            >
              لا قصص بعد — ابدأ بموقف واحد انتهى بنتيجة يمكن قياسها
            </p>
          ) : (
            stories.map((s) => (
              <StoryCard
                key={s.id}
                story={s}
                onEdit={() => setStory({ ...s })}
                onDelete={() =>
                  setState((st) => ({
                    ...st,
                    career: {
                      ...st.career,
                      stories: st.career.stories.filter((x) => x.id !== s.id),
                    },
                  }))
                }
              />
            ))
          )}
        </div>
      </Card>

      <AppModal
        open={!!draft}
        draft={draft}
        setDraft={setDraft}
        onClose={() => setDraft(null)}
        onSave={saveApp}
      />
      <StoryModal
        open={!!story}
        draft={story}
        setDraft={setStory}
        onClose={() => setStory(null)}
        onSave={saveStory}
      />
    </div>
  );
}

/* ==================================================================== *
 *  The kit — the three things a hunt stalls on when they are missing
 *
 *  A plan tells you what to do this week; it does not tell you where to
 *  register, what to type, or what you will be asked. Those three gaps are
 *  where this hunt actually stops, so they get their own screen rather
 *  than a paragraph buried in a week's missions.
 * ==================================================================== */
function SetupRow({ item, on, open, onOpen, onToggle }) {
  const Icon = item.icon;
  return (
    <div
      className="rounded-xl border transition-all duration-300"
      style={{
        borderColor: on ? `${T.primary}4D` : T.border,
        background: on ? `${T.primary}0F` : "rgba(255,255,255,0.03)",
      }}
    >
      <div className="flex items-center gap-3 px-3.5 py-2.5">
        <Icon size={15} className="shrink-0" style={{ color: item.tint }} />
        <Checkbox
          checked={on}
          onToggle={onToggle}
          label={item.label}
          tint={T.primary}
          size="sm"
        />
        <button
          onClick={onOpen}
          aria-expanded={open}
          aria-label={open ? `أغلق شرح: ${item.label}` : `لماذا وكيف: ${item.label}`}
          className="shrink-0 rounded-lg border p-1.5 transition-all duration-200 hover:brightness-125"
          style={{
            borderColor: open ? `${item.tint}4D` : T.border,
            color: open ? item.tint : T.faint,
            background: open ? `${item.tint}14` : "transparent",
          }}
        >
          <ChevronDown
            size={13}
            style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .25s" }}
          />
        </button>
      </div>

      {open && (
        <div
          className="los-in space-y-2.5 border-t px-3.5 pb-3.5 pt-3"
          style={{ borderColor: T.border }}
        >
          <p className="text-[11.5px] leading-relaxed" style={{ color: T.muted }}>
            {item.why}
          </p>
          <ol className="space-y-1.5">
            {item.how.map((line, i) => (
              <li key={i} className="flex items-start gap-2 text-[11.5px] leading-relaxed">
                <span
                  dir="ltr"
                  className="mt-[3px] shrink-0 text-[10px] font-extrabold tabular-nums"
                  style={{ color: item.tint }}
                >
                  {i + 1}.
                </span>
                <span style={{ color: T.muted }}>{line}</span>
              </li>
            ))}
          </ol>
          <p
            dir="ltr"
            className="flex items-center justify-end gap-1.5 text-[11px] font-bold"
            style={{ color: item.tint }}
          >
            {item.link}
            <ExternalLink size={11} />
          </p>
        </div>
      )}
    </div>
  );
}

function TemplateCard({ tpl, open, onOpen }) {
  const Icon = tpl.icon;
  return (
    <Card className="overflow-hidden p-0">
      <button
        onClick={onOpen}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-right transition-colors duration-200"
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
          style={{
            borderColor: `${tpl.tint}45`,
            background: `${tpl.tint}18`,
            color: tpl.tint,
          }}
        >
          <Icon size={15} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-extrabold" style={{ color: T.fg }}>
            {tpl.label}
          </span>
          <span className="block truncate text-[10.5px]" style={{ color: T.faint }}>
            {tpl.when}
          </span>
        </span>
        <ChevronDown
          size={14}
          className="shrink-0"
          style={{
            color: T.faint,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform .25s",
          }}
        />
      </button>
      {open && (
        <div className="los-in px-4 pb-4">
          <CopyBox text={tpl.body} tint={tpl.tint} />
        </div>
      )}
    </Card>
  );
}

function CareerKit({ state, setState }) {
  const career = state.career;
  const setup = career.setup || {};
  const [openSetup, setOpenSetup] = useState(null);
  const [openTpl, setOpenTpl] = useState(null);

  const done = setupDone(career);
  const pct = Math.round((done / SETUP_TOTAL) * 100);

  const toggleSetup = (id) =>
    setState((s) => {
      const next = { ...(s.career.setup || {}) };
      if (next[id]) delete next[id];
      else next[id] = true;
      return { ...s, career: { ...s.career, setup: next } };
    });

  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h3
              className="flex items-center gap-2 text-[17px] font-extrabold"
              style={{ color: T.sky }}
            >
              <Building2 size={17} /> الأرضية: المنصّات والبرامج
            </h3>
            <p className="mt-1.5 max-w-2xl text-[11.5px] leading-relaxed" style={{ color: T.faint }}>
              ثماني خطوات تُنجَز مرّة واحدة، ثم تعمل لك شهورًا وأنت نائم. أهمّها
              تمهير: أقصر طريق معروف لأول عقد لخريج إدارة في السوق السعودي.
              أنجِزها قبل أن تبدأ أسابيع الخطة — لا بعدها.
            </p>
          </div>
          <Badge tint={done === SETUP_TOTAL ? T.primary : T.sky}>
            <span dir="ltr" className="tabular-nums">
              {done}/{SETUP_TOTAL}
            </span>
          </Badge>
        </div>

        <div
          className="mt-4 h-1.5 w-full overflow-hidden rounded-full"
          style={{ background: "rgba(255,255,255,0.07)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${T.sky}, ${done === SETUP_TOTAL ? T.primary : T.cta})`,
            }}
          />
        </div>

        <div className="mt-4 space-y-2">
          {SAUDI_SETUP.map((item) => (
            <SetupRow
              key={item.id}
              item={item}
              on={!!setup[item.id]}
              open={openSetup === item.id}
              onOpen={() => setOpenSetup((x) => (x === item.id ? null : item.id))}
              onToggle={() => toggleSetup(item.id)}
            />
          ))}
        </div>

        <p className="mt-3 text-[10.5px] leading-relaxed" style={{ color: T.faint }}>
          أسماء المنصّات ثابتة، وروابطها قد تتغيّر مع إعادة ترتيب البوّابات —
          ابحث بالاسم إن لم يفتح الرابط مباشرة.
        </p>
      </Card>

      <Card className="p-5 sm:p-6">
        <h3
          className="flex items-center gap-2 text-[17px] font-extrabold"
          style={{ color: T.ctaLift }}
        >
          <MessageSquare size={17} /> بنك الرسائل
        </h3>
        <p className="mt-1.5 max-w-2xl text-[11.5px] leading-relaxed" style={{ color: T.faint }}>
          كل توقّف في البحث عن عمل هو لحظة لا تعرف فيها ماذا تكتب. تسع رسائل
          جاهزة، تملأ ما بين الأقواس وترسل. غيّر جملة واحدة على الأقل في كل
          رسالة — القالب الذي يصل كما هو يُقرأ قالبًا.
        </p>
        <div className="mt-4 space-y-2.5">
          {TEMPLATES.map((t) => (
            <TemplateCard
              key={t.id}
              tpl={t}
              open={openTpl === t.id}
              onOpen={() => setOpenTpl((x) => (x === t.id ? null : t.id))}
            />
          ))}
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h3
          className="flex items-center gap-2 text-[17px] font-extrabold"
          style={{ color: T.rose }}
        >
          <ScanFace size={17} /> أسئلة المقابلة وفخاخها
        </h3>
        <p className="mt-1.5 max-w-2xl text-[11.5px] leading-relaxed" style={{ color: T.faint }}>
          ثمانية أسئلة تحسم مقابلة حديث التخرّج. اكتب قصص{" "}
          <span dir="ltr">STAR</span> في «التقديمات» وأنت تنظر إلى هذه
          القائمة، لا في الفراغ.
        </p>
        <div className="mt-4 space-y-2">
          {INTERVIEW_QS.map((x, i) => (
            <div
              key={x.q}
              className="rounded-xl border px-3.5 py-3"
              style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
            >
              <p className="flex items-start gap-2 text-[12.5px] font-extrabold" style={{ color: T.fg }}>
                <span dir="ltr" className="mt-[2px] shrink-0 text-[10px] tabular-nums" style={{ color: T.rose }}>
                  {i + 1}.
                </span>
                {x.q}
              </p>
              <p className="mt-1.5 pr-5 text-[11.5px] leading-relaxed" style={{ color: T.muted }}>
                <span className="font-bold" style={{ color: T.danger }}>
                  الفخّ:{" "}
                </span>
                {x.trap}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function CareerModule({ state, setState }) {
  const [view, setView] = useState("today");
  const career = state.career;

  const start = () =>
    setState((s) => ({ ...s, career: { ...s.career, startedAt: dayKey() } }));

  return (
    <div className="space-y-7">
      <ReadinessCard career={career} onStart={start} />

      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {CAREER_VIEWS.map((v) => {
          const on = v.id === view;
          const Icon = v.icon;
          return (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              aria-pressed={on}
              className="flex flex-col items-center gap-1.5 rounded-2xl border px-1 py-3 transition-all duration-200 sm:px-2"
              style={{
                borderColor: on ? `${T.cta}80` : T.border,
                backgroundImage: on
                  ? `linear-gradient(160deg, ${T.cta}2E, ${T.cta}0A)`
                  : "none",
                backgroundColor: on ? "transparent" : "rgba(255,255,255,0.03)",
                color: on ? T.ctaLift : T.muted,
                boxShadow: on ? `0 10px 26px -16px ${T.cta}` : "none",
              }}
            >
              <Icon size={16} strokeWidth={on ? 2.6 : 2} />
              <span className="text-[10px] font-extrabold sm:text-[11.5px]">{v.label}</span>
            </button>
          );
        })}
      </div>

      <div key={view} className="los-in">
        {view === "today" && (
          <CareerToday state={state} setState={setState} onGo={setView} />
        )}
        {view === "kit" && <CareerKit state={state} setState={setState} />}
        {view === "plan" && <CareerPlan state={state} setState={setState} />}
        {view === "war" && <CareerWar state={state} setState={setState} />}
        {view === "track" && <CareerTrack state={state} setState={setState} />}
      </div>
    </div>
  );
}

const AR_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];
const WEEK_LABELS = ["س", "ح", "ن", "ث", "ر", "خ", "ج"];

/* "2026-10-01" inside Arabic text renders as "01-10-2026" — the hyphens are
   neutral, so bidi reorders the three numbers right to left. Spelling the
   month out removes the ambiguity instead of fighting it with isolates. */
const arDate = (ds) => {
  const [y, m, d] = String(ds || "").split("-").map(Number);
  if (!y || !m || !d) return ds || "";
  return `${d} ${AR_MONTHS[m - 1]} ${y}`;
};

const levelOf = (pct) =>
  pct >= 90 ? 4 : pct >= 70 ? 3 : pct >= 45 ? 2 : pct > 0 ? 1 : 0;
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
    const items = ids.map((id) => ({
      id,
      label: live.get(id)?.label || "عادة لم تعد في روتينك",
      group: live.get(id)?.group || null,
      done: done.has(id),
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

  const careerDay = useMemo(
    () => (state.career?.log || []).find((e) => e.date === row?.date) || null,
    [state.career, row],
  );

  if (!row) return null;

  const extras = [
    pages > 0 && { label: "صفحة قراءة", n: pages, tint: T.violet },
    careerDay?.skills?.length && {
      label: "حصّة مهارة",
      n: careerDay.skills.length,
      tint: T.sky,
    },
    careerDay?.am?.length && {
      label: "خطوة صباحية",
      n: careerDay.am.length,
      tint: T.accent,
    },
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
                          <Check
                            size={12}
                            strokeWidth={3.5}
                            className="mt-0.5 shrink-0"
                            style={{ color: T.primary }}
                          />
                        ) : (
                          <X
                            size={12}
                            strokeWidth={3}
                            className="mt-0.5 shrink-0"
                            style={{ color: T.faint }}
                          />
                        )}
                        <span style={{ color: h.done ? T.fg : T.faint }}>{h.label}</span>
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
    const map = new Map((state.history || []).map((h) => [h.date, h.pct]));
    map.set(dayKey(), discipline); // today is live, not yet archived
    return map;
  }, [state.history, discipline]);

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
      cells.push({ d, ds, pct: byDate.get(ds) });
    }
    return cells;
  }, [cursor, byDate]);

  const monthStats = useMemo(() => {
    const vals = grid.filter((c) => c && c.pct !== undefined).map((c) => c.pct);
    return {
      tracked: vals.length,
      avg: vals.length
        ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
        : 0,
      best: vals.length ? Math.max(...vals) : 0,
      hit: vals.filter((v) => v >= STREAK_TARGET).length,
    };
  }, [grid]);

  const yearBars = useMemo(() => {
    return AR_MONTHS.map((label, m) => {
      const vals = (state.history || [])
        .filter((h) => {
          const [y, mm] = h.date.split("-").map(Number);
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
                  cell.pct === undefined
                    ? `${cell.ds} — لا سجلّ`
                    : `${cell.ds} — ${cell.pct}٪${note ? " — فيه وقفة" : ""}${
                        row?.holds ? ` — صمدت ${row.holds}` : ""
                      }${row?.falls ? ` — سقطت ${row.falls}` : ""}`
                }
                className="relative flex aspect-square items-center justify-center rounded-lg border text-[11px] font-bold tabular-nums transition-transform duration-150 hover:scale-110 disabled:cursor-default"
                style={{
                  background: LEVEL_BG[levelOf(cell.pct ?? 0)],
                  /* A tracked day and an untracked one must never look the
                     same. A 20% day is a day you showed up for, and at 0.28
                     alpha against a noon sky it read as blank — which is
                     what "nothing is being saved" looked like. */
                  borderColor:
                    cell.ds === dayKey()
                      ? T.accent
                      : cell.pct !== undefined
                      ? `${T.primary}66`
                      : "rgba(255,255,255,0.06)",
                  color:
                    (cell.pct ?? 0) >= 45
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
function DateField({ value, onChange, id, min, ...rest }) {
  return (
    <Field
      id={id}
      type="date"
      dir="ltr"
      value={value || ""}
      min={min}
      onChange={(e) => onChange(e.target.value)}
      style={{ colorScheme: "dark", textAlign: "left" }}
      {...rest}
    />
  );
}

function TimeField({ value, onChange, id, ...rest }) {
  return (
    <Field
      id={id}
      type="time"
      dir="ltr"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      style={{ colorScheme: "dark", textAlign: "left" }}
      {...rest}
    />
  );
}

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

/* ==================================================================== *
 *  MODULE — the university desk
 *
 *  Four screens that read from one another: الجدول (where to be), المقررات
 *  (the mark sheet and the absences), التسليمات (what is due), المعدّل
 *  (what all of it rolls up into).
 * ==================================================================== */

const UNI_VIEWS = [
  { id: "week", label: "الجدول", icon: CalendarDays },
  { id: "courses", label: "المقررات", icon: BookMarked },
  { id: "tasks", label: "التسليمات", icon: ClipboardList },
  { id: "gpa", label: "المعدّل", icon: Calculator },
];

/* A number field you can actually type a decimal into. Committing
   `Number(e.target.value)` straight to state rewrites "8." as "8" between
   keystrokes, so "8.5" becomes unreachable — the field holds the text while
   it is being typed and commits the parsed number beside it. */
function NumField({
  value,
  onChange,
  allowEmpty = false,
  min = 0,
  max = 1000,
  className = "",
  ...rest
}) {
  const show = (v) => (v === null || v === undefined ? "" : String(v));
  const [text, setText] = useState(() => show(value));
  const [typing, setTyping] = useState(false);

  /* A change arriving from outside — a reset, an import, another field —
     has to appear, but not while this one is being typed into: rewriting
     the text under the cursor is how a caret jumps to the end mid-number. */
  useEffect(() => {
    if (!typing) setText(show(value));
  }, [value, typing]);

  const commit = (raw) => {
    setText(raw);
    if (raw.trim() === "") {
      if (allowEmpty) onChange(null);
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) return; // "-" or "1e" mid-typing: keep the text
    onChange(Math.min(max, Math.max(min, n)));
  };

  return (
    <Field
      type="text"
      inputMode="decimal"
      dir="ltr"
      value={text}
      onFocus={() => setTyping(true)}
      onBlur={() => {
        setTyping(false);
        setText(show(value));
      }}
      onChange={(e) => commit(e.target.value)}
      className={`text-left tabular-nums ${className}`}
      {...rest}
    />
  );
}

/* Letter grades, as a grid. The one the percentage currently earns is
   ringed so the published grade can be checked against the mark sheet
   instead of being taken on trust. */
function GradePicker({ value, onPick, scale, suggest }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
      {GRADES.map((g) => {
        const on = value === g.id;
        const hint = !on && suggest === g.id;
        const pts = gradePoints(g, scale);
        const tint = g.id === "F" ? T.danger : g.min >= 85 ? T.primary : T.accent;
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => onPick(on ? null : g.id)}
            aria-pressed={on}
            title={`${g.ar} — ${pts}`}
            className="rounded-xl border px-2 py-2 text-center transition-all"
            style={{
              borderColor: on ? `${tint}99` : hint ? `${T.sky}80` : T.border,
              background: on ? `${tint}26` : hint ? `${T.sky}14` : "rgba(255,255,255,0.03)",
              color: on ? tint : hint ? T.sky : T.muted,
            }}
          >
            <span dir="ltr" className="block text-[13px] font-extrabold">
              {g.id}
            </span>
            <span dir="ltr" className="block text-[9.5px] tabular-nums opacity-70">
              {pts}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* A labelled figure. Used wherever a screen states a number it computed,
   so the unit and the caveat travel with it. */
function StatTile({ icon: Icon, label, value, sub, tint = T.accent }) {
  return (
    /* A Card, not a flat `${tint}0F` fill. These sit straight on the sky in
       the university header, and a fixed low-alpha tint becomes a pale
       smear against a noon horizon — the fill has to come from the phase.
       The tint keeps the rim and the figure, which is all it was for. */
    <Card className="p-3.5" style={{ borderColor: `${tint}40` }}>
      <p className="flex items-center gap-1.5 text-[10.5px]" style={{ color: T.faint }}>
        {Icon && <Icon size={12} style={{ color: tint }} />}
        {label}
      </p>
      <p
        dir="ltr"
        className="mt-1 text-[20px] font-extrabold leading-none tabular-nums"
        style={{ color: tint }}
      >
        {value}
      </p>
      {sub && (
        <p className="mt-1.5 text-[10px] leading-relaxed" style={{ color: T.faint }}>
          {sub}
        </p>
      )}
    </Card>
  );
}

/* --- the course desk -------------------------------------------------- *
 *  The card is a glance; this is where the term is actually run. The mark
 *  sheet, the timetable rows, the absence count and the grade all live
 *  here because they answer one another's questions.
 * -------------------------------------------------------------------- */
function CourseDesk({ course, term, scale, onClose, onPatch, onDelete }) {
  if (!course) return null;

  const c = course;
  const st = courseStanding(c);
  const cap = absenceCapOf(c, term);
  const band = attendBand(c.absences, cap);
  const meetings = meetingsOf(c, term);
  const need = st.weightOk ? needFor(st, c.target) : null;
  const suggest =
    st.projected !== null ? gradeFromPct(st.projected).id : null;

  /* Every edit is expressed against `prev` — the course as it stands in
     state — not against `c`, the copy this render was drawn from. Two
     clicks on a stepper inside one frame otherwise both read the same
     starting number and one of them is lost. */
  const patch = (p) =>
    onPatch((prev) => ({ ...prev, ...(typeof p === "function" ? p(prev) : p) }));

  const addSlot = () =>
    patch((prev) => ({
      slots: [...prev.slots, slotShape({ day: 0, from: "08:00", to: "09:50" })],
    }));
  const setSlot = (id, p) =>
    patch((prev) => ({
      slots: prev.slots.map((s) => (s.id === id ? slotShape({ ...s, ...p }) : s)),
    }));
  const dropSlot = (id) =>
    patch((prev) => ({ slots: prev.slots.filter((s) => s.id !== id) }));

  const addMark = () =>
    patch((prev) => ({
      marks: [...prev.marks, markShape({ label: "", score: null, max: 100, weight: 0 })],
    }));
  const setMark = (id, p) =>
    patch((prev) => ({
      marks: prev.marks.map((m) => (m.id === id ? { ...m, ...p } : m)),
    }));
  const dropMark = (id) =>
    patch((prev) => ({ marks: prev.marks.filter((m) => m.id !== id) }));

  /* The four weightings almost every syllabus uses, so the mark sheet is
     one tap away from being usable instead of five rows of typing. */
  const preset = () =>
    patch({
      marks: [
        markShape({ label: "أعمال فصلية", max: 100, weight: 20 }),
        markShape({ label: "كويزات", max: 100, weight: 10 }),
        markShape({ label: "اختبار فصلي", max: 100, weight: 30 }),
        markShape({ label: "اختبار نهائي", max: 100, weight: 40 }),
      ],
    });

  return (
    <Modal
      open={!!course}
      onClose={onClose}
      wide
      title={courseName(c)}
      footer={
        <>
          <Btn variant="default" className="flex-1" onClick={onClose}>
            <Check size={15} strokeWidth={3} /> تم
          </Btn>
          <Btn variant="danger" onClick={onDelete} title="حذف المقرّر">
            <Trash2 size={15} />
          </Btn>
        </>
      }
    >
      <div className="space-y-6">
        {/* --- identity --- */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs text-white/45" htmlFor="los-c-name">
              اسم المقرّر
            </label>
            <Field
              id="los-c-name"
              value={c.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="مثال: مبادئ الإدارة"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/45" htmlFor="los-c-code">
              الرمز
            </label>
            <Field
              id="los-c-code"
              dir="ltr"
              value={c.code}
              onChange={(e) => patch({ code: e.target.value })}
              placeholder="MGT 101"
              style={{ textAlign: "left" }}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/45" htmlFor="los-c-dr">
              المحاضر
            </label>
            <Field
              id="los-c-dr"
              value={c.instructor}
              onChange={(e) => patch({ instructor: e.target.value })}
              placeholder="اسم الدكتور"
            />
          </div>
          <div>
            <span className="mb-1.5 block text-xs text-white/45">الساعات المعتمدة</span>
            <NumStep
              value={c.credits}
              onChange={(v) => patch({ credits: clampNum(v, 1, 12, 3) })}
              min={1}
              max={12}
              unit="ساعة"
              tint={c.tint}
            />
          </div>
        </div>

        <div>
          <span className="mb-2 block text-xs text-white/45">اللون على الجدول</span>
          <div className="flex flex-wrap gap-2">
            {COURSE_TINTS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => patch({ tint: t })}
                aria-label={`اللون ${t}`}
                aria-pressed={c.tint === t}
                className="h-8 w-8 rounded-lg border-2 transition-transform hover:scale-110"
                style={{
                  background: t,
                  borderColor: c.tint === t ? T.fg : "transparent",
                  boxShadow: c.tint === t ? `0 0 14px ${t}` : "none",
                }}
              />
            ))}
          </div>
        </div>

        {/* --- the timetable rows --- */}
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-[12.5px] font-extrabold" style={{ color: T.accent }}>
              <Clock size={13} /> مواعيد المحاضرات
            </p>
            <Btn variant="outline" size="sm" onClick={addSlot} style={{ borderColor: T.border }}>
              <Plus size={13} strokeWidth={3} /> موعد
            </Btn>
          </div>
          {c.slots.length === 0 ? (
            <p className="rounded-xl border border-dashed p-3 text-center text-[11px] leading-relaxed"
               style={{ borderColor: T.border, color: T.faint }}>
              بلا مواعيد لا يظهر المقرّر على الجدول، ولا يُحسب حدّ الغياب.
            </p>
          ) : (
            <div className="space-y-2">
              {c.slots.map((s) => {
                /* A section that ends before it starts draws as a sliver on
                   the week grid and quietly halves the meeting count behind
                   the absence limit. Flagged where it is typed, not left to
                   be discovered on the timetable. */
                const bad = (minsOf(s.to) ?? 0) <= (minsOf(s.from) ?? 0);
                return (
                <div
                  key={s.id}
                  className="flex flex-wrap items-end gap-2 rounded-xl border p-2.5"
                  style={{
                    borderColor: bad ? `${T.danger}59` : T.border,
                    background: bad ? `${T.danger}0F` : "rgba(255,255,255,0.03)",
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <span className="mb-1 block text-[10px]" style={{ color: T.faint }}>
                      اليوم
                    </span>
                    <Field
                      as="select"
                      value={s.day}
                      onChange={(e) => setSlot(s.id, { day: Number(e.target.value) })}
                      className="py-2 text-[12px]"
                      style={{ borderColor: T.border, colorScheme: "dark" }}
                    >
                      {UNI_DAYS.map((d) => (
                        <option key={d.d} value={d.d}>
                          {d.label}
                        </option>
                      ))}
                    </Field>
                  </div>
                  <div className="w-[88px]">
                    <span className="mb-1 block text-[10px]" style={{ color: T.faint }}>
                      من
                    </span>
                    <TimeField value={s.from} onChange={(v) => setSlot(s.id, { from: v })} className="py-2 text-[12px]" />
                  </div>
                  <div className="w-[88px]">
                    <span className="mb-1 block text-[10px]" style={{ color: T.faint }}>
                      إلى
                    </span>
                    <TimeField value={s.to} onChange={(v) => setSlot(s.id, { to: v })} className="py-2 text-[12px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="mb-1 block text-[10px]" style={{ color: T.faint }}>
                      القاعة
                    </span>
                    <Field
                      value={s.room}
                      onChange={(e) => setSlot(s.id, { room: e.target.value })}
                      placeholder="٢٠٣"
                      className="py-2 text-[12px]"
                    />
                  </div>
                  <button
                    onClick={() => dropSlot(s.id)}
                    aria-label="حذف الموعد"
                    className="mb-1 rounded-lg p-2 text-white/30 transition-colors hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                  {bad && (
                    <p
                      className="flex w-full items-center gap-1.5 text-[10.5px] font-bold"
                      style={{ color: T.danger }}
                    >
                      <AlertTriangle size={11} /> وقت النهاية ليس بعد وقت البداية.
                    </p>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </div>

        {/* --- attendance --- */}
        <div
          className="rounded-2xl border p-4"
          style={{
            borderColor: band ? `${band.tint}3D` : T.border,
            background: band ? `${band.tint}0F` : "rgba(255,255,255,0.03)",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-[12.5px] font-extrabold" style={{ color: T.accent }}>
              <UserSearch size={13} /> الحضور والغياب
            </p>
            {band && (
              <Badge tint={band.tint}>
                <ShieldCheck size={11} /> {band.label}
              </Badge>
            )}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <span className="mb-1.5 block text-[10.5px]" style={{ color: T.faint }}>
                إجمالي مرات الغياب
              </span>
              <NumStep
                value={c.absences}
                onChange={(v) => patch({ absences: clampNum(v, 0, 200, 0) })}
                min={0}
                max={200}
                unit="مرّة"
                tint={band ? band.tint : T.sky}
              />
            </div>
            <div>
              <span className="mb-1.5 block text-[10.5px]" style={{ color: T.faint }}>
                الحدّ المسموح {c.absenceCap === 0 && cap !== null ? "(محسوب تلقائيًا)" : ""}
              </span>
              <NumStep
                value={c.absenceCap > 0 ? c.absenceCap : cap || 0}
                onChange={(v) => patch({ absenceCap: clampNum(v, 0, 200, 0) })}
                min={0}
                max={200}
                unit="مرّة"
                tint={T.accent}
              />
            </div>
          </div>

          {cap ? (
            <>
              <div
                className="mt-3 h-1.5 w-full overflow-hidden rounded-full"
                style={{ background: "rgba(255,255,255,0.07)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, (c.absences / cap) * 100)}%`,
                    backgroundImage: `linear-gradient(90deg, ${band.tint}, ${band.tint}AA)`,
                    boxShadow: `0 0 12px ${band.tint}99`,
                  }}
                />
              </div>
              <p className="mt-2 text-[11px] leading-relaxed" style={{ color: T.muted }}>
                {c.absences >= cap ? (
                  <>تجاوزت الحدّ — راجع المرشد الأكاديمي قبل أن يُثبّت الحرمان.</>
                ) : (
                  <>
                    يتبقّى لك{" "}
                    <span dir="ltr" className="font-extrabold tabular-nums" style={{ color: band.tint }}>
                      {cap - c.absences}
                    </span>{" "}
                    {timesWord(cap - c.absences)} قبل الحرمان
                    {meetings > 0 && (
                      <>
                        {" "}— من{" "}
                        <span dir="ltr" className="tabular-nums">
                          {meetings}
                        </span>{" "}
                        {lectureWord(meetings)} في الفصل
                      </>
                    )}
                    .
                  </>
                )}
              </p>
            </>
          ) : (
            <p className="mt-2 text-[11px] leading-relaxed" style={{ color: T.faint }}>
              أضف مواعيد المحاضرات أو اكتب الحدّ بنفسك ليُحسب الغياب.
            </p>
          )}

          {/* The days the quick button recorded. A bare counter cannot be
              audited — «ستّ مرات» is unarguable and unverifiable at once,
              and the day you were actually present is the one you want to
              find. Removing a day puts the total back with it. */}
          {(c.absentOn || []).length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-[10.5px]" style={{ color: T.faint }}>
                الأيام المسجّلة من هذه الشاشة
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[...c.absentOn].sort().reverse().map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() =>
                      patch((prev) => ({
                        absences: clampNum(prev.absences - 1, 0, 200, 0),
                        absentOn: (prev.absentOn || []).filter((x) => x !== d),
                      }))
                    }
                    aria-label={`حذف غياب ${arDate(d)}`}
                    title="احذف هذا اليوم"
                    className="inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10.5px] font-bold transition-colors hover:border-white/40"
                    style={{ borderColor: T.border, color: T.muted }}
                  >
                    {arDate(d)}
                    <X size={10} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* --- where the course lives --- */}
        <div>
          <label className="mb-1.5 block text-xs text-white/45" htmlFor="los-c-link">
            رابط المقرّر <span style={{ color: T.faint }}>(بلاك بورد، تيمز، درايف)</span>
          </label>
          <div className="flex items-center gap-2">
            <Field
              id="los-c-link"
              dir="ltr"
              value={c.link}
              onChange={(e) => patch({ link: e.target.value })}
              placeholder="https://..."
              style={{ textAlign: "left" }}
            />
            {safeUrl(c.link) && (
              <Btn
                as="a"
                variant="outline"
                size="icon"
                href={safeUrl(c.link)}
                target="_blank"
                rel="noopener noreferrer"
                title="افتح الرابط"
                className="shrink-0"
                style={{ borderColor: T.border }}
              >
                <ExternalLink size={15} />
              </Btn>
            )}
          </div>
        </div>

        {/* --- the mark sheet --- */}
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-[12.5px] font-extrabold" style={{ color: T.accent }}>
              <Percent size={13} /> توزيع الدرجات
            </p>
            <div className="flex gap-2">
              {c.marks.length === 0 && (
                <Btn variant="outline" size="sm" onClick={preset} style={{ borderColor: T.border }}>
                  <Sparkles size={13} /> توزيع شائع
                </Btn>
              )}
              <Btn variant="outline" size="sm" onClick={addMark} style={{ borderColor: T.border }}>
                <Plus size={13} strokeWidth={3} /> بند
              </Btn>
            </div>
          </div>

          {c.marks.length === 0 ? (
            <p className="rounded-xl border border-dashed p-3 text-center text-[11px] leading-relaxed"
               style={{ borderColor: T.border, color: T.faint }}>
              اكتب بنود التقييم وأوزانها، ثم أدخل الدرجات كما تصل — وسيُحسب
              كل شيء بعدها وحده.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="hidden gap-2 px-2.5 text-[10px] sm:flex" style={{ color: T.faint }}>
                <span className="min-w-0 flex-1">البند</span>
                <span className="w-[72px] text-center">الدرجة</span>
                <span className="w-[72px] text-center">من</span>
                <span className="w-[72px] text-center">الوزن ٪</span>
                <span className="w-[34px]" />
              </div>
              {c.marks.map((m) => {
                const got = m.score !== null ? (m.score / m.max) * m.weight : null;
                return (
                  <div
                    key={m.id}
                    className="flex flex-wrap items-end gap-2 rounded-xl border p-2.5"
                    style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
                  >
                    <div className="min-w-[120px] flex-1">
                      <span className="mb-1 block text-[10px] sm:hidden" style={{ color: T.faint }}>
                        البند
                      </span>
                      <Field
                        value={m.label}
                        onChange={(e) => setMark(m.id, { label: e.target.value })}
                        placeholder="مثال: اختبار فصلي"
                        className="py-2 text-[12px]"
                      />
                    </div>
                    <div className="w-[72px]">
                      <span className="mb-1 block text-[10px] sm:hidden" style={{ color: T.faint }}>
                        الدرجة
                      </span>
                      <NumField
                        value={m.score}
                        allowEmpty
                        min={0}
                        max={1000}
                        onChange={(v) => setMark(m.id, { score: v })}
                        placeholder="—"
                        className="py-2 text-[12px]"
                      />
                    </div>
                    <div className="w-[72px]">
                      <span className="mb-1 block text-[10px] sm:hidden" style={{ color: T.faint }}>
                        من
                      </span>
                      <NumField
                        value={m.max}
                        min={0.01}
                        max={1000}
                        onChange={(v) => setMark(m.id, { max: v })}
                        className="py-2 text-[12px]"
                      />
                    </div>
                    <div className="w-[72px]">
                      <span className="mb-1 block text-[10px] sm:hidden" style={{ color: T.faint }}>
                        الوزن ٪
                      </span>
                      <NumField
                        value={m.weight}
                        min={0}
                        max={100}
                        onChange={(v) => setMark(m.id, { weight: v })}
                        className="py-2 text-[12px]"
                      />
                    </div>
                    <button
                      onClick={() => dropMark(m.id)}
                      aria-label="حذف البند"
                      className="mb-1 rounded-lg p-2 text-white/30 transition-colors hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                    {got !== null && (
                      <p className="w-full text-[10px]" style={{ color: T.muted }}>
                        حصّلت{" "}
                        <span dir="ltr" className="font-extrabold tabular-nums" style={{ color: c.tint }}>
                          {got.toFixed(1)}
                        </span>{" "}
                        من{" "}
                        <span dir="ltr" className="tabular-nums">
                          {m.weight}
                        </span>{" "}
                        نقطة من المئة
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!st.weightOk && c.marks.length > 0 && (
            <p
              className="mt-2 flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-bold"
              style={{ borderColor: `${T.accent}40`, background: `${T.accent}12`, color: T.accent }}
            >
              <AlertTriangle size={13} className="shrink-0" />
              مجموع الأوزان{" "}
              <span dir="ltr" className="tabular-nums">
                {st.totalW}
              </span>
              ٪ لا ١٠٠٪ — أكمله ليعمل حاسب «كم أحتاج».
            </p>
          )}
        </div>

        {/* --- where it stands --- */}
        {c.marks.length > 0 && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              icon={BadgeCheck}
              label="محصّل من ١٠٠"
              value={st.earned.toFixed(1)}
              sub={`من ${st.gradedW}٪ رُصدت`}
              tint={c.tint}
            />
            <StatTile
              icon={Gauge}
              label="متوسط ما رُصد"
              value={st.pace === null ? "—" : `${st.pace.toFixed(1)}%`}
              sub={st.pace === null ? "لا درجات بعد" : gradeFromPct(st.pace).ar}
              tint={T.sky}
            />
            <StatTile
              icon={TrendingUp}
              label="المتوقّع"
              value={st.projected === null ? "—" : `${st.projected.toFixed(1)}%`}
              sub={
                st.projected === null
                  ? "يظهر بعد أول درجة"
                  : `بهذا المستوى: ${gradeFromPct(st.projected).id}`
              }
              tint={T.accent}
            />
            <StatTile
              icon={Hourglass}
              label="لم يُرصد بعد"
              value={`${st.pending}%`}
              sub="الوزن المتبقّي من المئة"
              tint={T.violet}
            />
          </div>
        )}

        {/* --- what the rest has to average --- */}
        {st.weightOk && st.pending > 0 && (
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: `${T.cta}3D`, background: `${T.cta}0F` }}
          >
            <p className="flex items-center gap-1.5 text-[12.5px] font-extrabold" style={{ color: T.cta }}>
              <Crosshair size={13} /> كم أحتاج في الباقي؟
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <div className="min-w-[180px] flex-1">
                <span className="mb-1.5 block text-[10.5px]" style={{ color: T.faint }}>
                  هدفي في المقرّر
                </span>
                <NumStep
                  value={c.target}
                  onChange={(v) => patch({ target: clampNum(v, 0, 100, 90) })}
                  min={0}
                  max={100}
                  step={5}
                  unit="٪"
                  tint={T.cta}
                />
              </div>
              <div className="min-w-[160px] flex-1">
                {need === null ? null : need > 100 ? (
                  <p className="text-[12px] font-bold leading-relaxed" style={{ color: T.danger }}>
                    الهدف لم يبقَ ممكنًا — أعلى ما يمكن بلوغه الآن{" "}
                    <span dir="ltr" className="tabular-nums">
                      {(st.earned + st.pending).toFixed(1)}
                    </span>
                    ٪. أنزل الهدف إلى ما يُدرك.
                  </p>
                ) : need <= 0 ? (
                  <p className="text-[12px] font-bold leading-relaxed" style={{ color: T.primary }}>
                    بلغت الهدف فعلًا — الباقي تثبيت لا إنقاذ.
                  </p>
                ) : (
                  <p className="text-[12px] leading-relaxed" style={{ color: T.muted }}>
                    تحتاج متوسط{" "}
                    <span
                      dir="ltr"
                      className="text-[17px] font-extrabold tabular-nums"
                      style={{ color: need >= 90 ? T.danger : T.primary }}
                    >
                      {need.toFixed(1)}%
                    </span>{" "}
                    في البنود المتبقّية (
                    <span dir="ltr" className="tabular-nums">
                      {st.pending}
                    </span>
                    ٪ من الدرجة) لتصل إلى{" "}
                    <span dir="ltr" className="tabular-nums">
                      {c.target}
                    </span>
                    ٪.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- the published grade --- */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[12.5px] font-extrabold" style={{ color: T.accent }}>
            <Award size={13} /> التقدير النهائي
          </p>
          <p className="mb-2.5 text-[11px] leading-relaxed" style={{ color: T.faint }}>
            لا يُحسب في المعدّل حتى تختاره بنفسك — والمحاط بالأزرق هو ما
            يستحقّه المقرّر بحسب درجاتك الآن.
          </p>
          <GradePicker
            value={c.grade}
            onPick={(id) => patch({ grade: id })}
            scale={scale}
            suggest={suggest}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs text-white/45" htmlFor="los-c-notes">
            ملاحظات المقرّر
          </label>
          <Field
            id="los-c-notes"
            as="textarea"
            rows={3}
            value={c.notes}
            onChange={(e) => patch({ notes: e.target.value })}
            placeholder="ما يطلبه الدكتور، شكل الاختبار، ما يجب ألّا تنساه"
            className="resize-y leading-relaxed"
          />
        </div>
      </div>
    </Modal>
  );
}

function CourseCard({ course, term, onOpen, onAbsence }) {
  const c = course;
  const st = courseStanding(c);
  const cap = absenceCapOf(c, term);
  const band = attendBand(c.absences, cap);
  const g = gradeOf(c.grade);
  const link = safeUrl(c.link);
  const absentToday = (c.absentOn || []).includes(dayKey());
  const days = c.slots
    .map((s) => uniDayOf(s.day))
    .filter(Boolean)
    .map((d) => d.short);

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-[12px] font-extrabold"
          style={{
            borderColor: `${c.tint}45`,
            background: `${c.tint}18`,
            color: c.tint,
          }}
        >
          <span dir="ltr">{c.credits}</span>
        </span>
        <button onClick={onOpen} className="min-w-0 flex-1 text-right">
          <p className="truncate text-[14.5px] font-extrabold">{courseName(c)}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 text-[10.5px]" style={{ color: T.faint }}>
            {c.code && <span dir="ltr">{c.code}</span>}
            {c.instructor && <span className="truncate">{c.instructor}</span>}
            {days.length > 0 && <span>{days.join(" · ")}</span>}
          </p>
        </button>
        {g && (
          <Badge tint={g.id === "F" ? T.danger : g.min >= 85 ? T.primary : T.accent}>
            <span dir="ltr">{g.id}</span>
          </Badge>
        )}
      </div>

      {/* The card stays a glance: a bar and two figures. Everything else is
          on the desk, one tap away. */}
      <div className="mt-4 space-y-3">
        <div>
          <p className="mb-1 flex items-center justify-between text-[10.5px]" style={{ color: T.faint }}>
            <span>محصّل من ١٠٠</span>
            <span dir="ltr" className="font-extrabold tabular-nums" style={{ color: c.tint }}>
              {st.earned.toFixed(1)} / {st.totalW || 100}
            </span>
          </p>
          <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, st.earned)}%`,
                backgroundImage: `linear-gradient(90deg, ${c.tint}, ${c.tint}AA)`,
                boxShadow: `0 0 12px ${c.tint}99`,
              }}
            />
          </div>
        </div>

        {cap !== null && (
          <div>
            <p className="mb-1 flex items-center justify-between text-[10.5px]" style={{ color: T.faint }}>
              <span>الغياب</span>
              <span dir="ltr" className="font-extrabold tabular-nums" style={{ color: band.tint }}>
                {c.absences} / {cap}
              </span>
            </p>
            <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, (c.absences / cap) * 100)}%`,
                  backgroundImage: `linear-gradient(90deg, ${band.tint}, ${band.tint}AA)`,
                  boxShadow: `0 0 12px ${band.tint}99`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Btn variant="outline" size="sm" onClick={onOpen} className="flex-1" style={{ borderColor: T.border }}>
          <SquarePen size={13} /> مكتب المقرّر
        </Btn>
        {link && (
          <Btn
            as="a"
            variant="ghost"
            size="sm"
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            style={{ borderColor: T.border }}
            title="افتح صفحة المقرّر"
          >
            <ExternalLink size={13} /> الصفحة
          </Btn>
        )}
        {/* The label says which way the next tap goes — a button that
            silently flips between adding and removing is a button you stop
            trusting with a count that matters this much. */}
        <Btn
          variant="ghost"
          size="sm"
          onClick={onAbsence}
          style={{
            borderColor: absentToday ? `${T.danger}59` : T.border,
            color: absentToday ? T.danger : undefined,
          }}
          title={absentToday ? "تراجع عن غياب اليوم" : "سجّل غياب اليوم"}
        >
          {absentToday ? (
            <>
              <Minus size={13} strokeWidth={3} /> ألغِ غياب اليوم
            </>
          ) : (
            <>
              <Plus size={13} strokeWidth={3} /> غياب اليوم
            </>
          )}
        </Btn>
      </div>
    </Card>
  );
}

function CourseModal({ open, draft, setDraft, terms, onClose, onSave }) {
  const d = draft || {};
  const [err, setErr] = useState("");
  useEffect(() => {
    if (open) setErr("");
  }, [open]);

  const save = () => {
    if (!String(d.name || "").trim() && !String(d.code || "").trim()) {
      setErr("اكتب اسم المقرّر أو رمزه.");
      return;
    }
    onSave();
  };
  const set = (p) => setDraft((s) => ({ ...s, ...p }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="مقرّر جديد"
      footer={
        <>
          <Btn variant="default" className="flex-1" onClick={save}>
            <Check size={15} strokeWidth={3} /> أضف
          </Btn>
          <Btn variant="outline" className="flex-1" onClick={onClose}>
            إلغاء
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs text-white/45" htmlFor="los-nc-name">
            اسم المقرّر
          </label>
          <Field
            id="los-nc-name"
            autoFocus
            value={d.name || ""}
            onChange={(e) => set({ name: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="مثال: محاسبة إدارية"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs text-white/45" htmlFor="los-nc-code">
              الرمز
            </label>
            <Field
              id="los-nc-code"
              dir="ltr"
              value={d.code || ""}
              onChange={(e) => set({ code: e.target.value })}
              placeholder="ACC 201"
              style={{ textAlign: "left" }}
            />
          </div>
          <div>
            <span className="mb-1.5 block text-xs text-white/45">الساعات</span>
            <NumStep
              value={d.credits ?? 3}
              onChange={(v) => set({ credits: v })}
              min={1}
              max={12}
              unit="ساعة"
              tint={d.tint || COURSE_TINTS[0]}
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-white/45" htmlFor="los-nc-dr">
            المحاضر <span style={{ color: T.faint }}>(اختياري)</span>
          </label>
          <Field
            id="los-nc-dr"
            value={d.instructor || ""}
            onChange={(e) => set({ instructor: e.target.value })}
            placeholder="اسم الدكتور"
          />
        </div>
        {terms.length > 1 && (
          <div>
            <span className="mb-2 block text-xs text-white/45">الفصل</span>
            <Field
              as="select"
              value={d.term || ""}
              onChange={(e) => set({ term: e.target.value })}
              style={{ borderColor: T.border, colorScheme: "dark" }}
            >
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label || "فصل بلا اسم"}
                </option>
              ))}
            </Field>
          </div>
        )}
        <div>
          <span className="mb-2 block text-xs text-white/45">اللون</span>
          <div className="flex flex-wrap gap-2">
            {COURSE_TINTS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set({ tint: t })}
                aria-label={`اللون ${t}`}
                aria-pressed={d.tint === t}
                className="h-8 w-8 rounded-lg border-2 transition-transform hover:scale-110"
                style={{
                  background: t,
                  borderColor: d.tint === t ? T.fg : "transparent",
                  boxShadow: d.tint === t ? `0 0 14px ${t}` : "none",
                }}
              />
            ))}
          </div>
        </div>
        {err && (
          <p
            className="flex items-center gap-2 rounded-xl border px-3 py-2 text-[11.5px] font-bold"
            style={{ borderColor: `${T.danger}4D`, background: `${T.danger}14`, color: T.danger }}
            role="alert"
          >
            <AlertTriangle size={13} /> {err}
          </p>
        )}
      </div>
    </Modal>
  );
}

function TermModal({ open, draft, setDraft, onClose, onSave, onDelete }) {
  const d = draft || {};
  const [err, setErr] = useState("");
  useEffect(() => {
    if (open) setErr("");
  }, [open, d.id]);

  const save = () => {
    if (!String(d.label || "").trim()) {
      setErr("اكتب اسم الفصل.");
      return;
    }
    if (!isKey(d.start) || !isKey(d.end)) {
      setErr("تواريخ الفصل غير صالحة.");
      return;
    }
    if (d.end < d.start) {
      setErr("نهاية الفصل قبل بدايته.");
      return;
    }
    onSave();
  };
  const set = (p) => setDraft((s) => ({ ...s, ...p }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={d.isNew ? "فصل دراسي جديد" : "تعديل الفصل"}
      footer={
        <>
          <Btn variant="default" className="flex-1" onClick={save}>
            <Check size={15} strokeWidth={3} /> حفظ
          </Btn>
          {!d.isNew && (
            <Btn variant="danger" onClick={onDelete} title="حذف الفصل">
              <Trash2 size={15} />
            </Btn>
          )}
          <Btn variant="outline" onClick={onClose}>
            إلغاء
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs text-white/45" htmlFor="los-tm-label">
            اسم الفصل
          </label>
          <Field
            id="los-tm-label"
            autoFocus
            value={d.label || ""}
            onChange={(e) => set({ label: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="مثال: الفصل الأول ١٤٤٨"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs text-white/45" htmlFor="los-tm-start">
              البداية
            </label>
            <DateField id="los-tm-start" value={d.start} onChange={(v) => set({ start: v })} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/45" htmlFor="los-tm-end">
              النهاية
            </label>
            <DateField id="los-tm-end" value={d.end} min={d.start} onChange={(v) => set({ end: v })} />
          </div>
        </div>
        <div>
          <span className="mb-1.5 block text-xs text-white/45">عدد أسابيع الدراسة</span>
          <NumStep
            value={d.weeks ?? TERM_WEEKS_DEFAULT}
            onChange={(v) => set({ weeks: v })}
            min={1}
            max={40}
            unit="أسبوع"
            tint={T.sky}
          />
          <p className="mt-1.5 text-[10.5px] leading-relaxed" style={{ color: T.faint }}>
            منه يُحسب عدد المحاضرات، ومنه حدّ الغياب (
            <span dir="ltr" className="tabular-nums">
              25
            </span>
            ٪).
          </p>
        </div>
        {err && (
          <p
            className="flex items-center gap-2 rounded-xl border px-3 py-2 text-[11.5px] font-bold"
            style={{ borderColor: `${T.danger}4D`, background: `${T.danger}14`, color: T.danger }}
            role="alert"
          >
            <AlertTriangle size={13} /> {err}
          </p>
        )}
      </div>
    </Modal>
  );
}

function UniTaskModal({ open, draft, setDraft, courses, onClose, onSave }) {
  const d = draft || {};
  const [err, setErr] = useState("");
  useEffect(() => {
    if (open) setErr("");
  }, [open, d.id]);

  const save = () => {
    if (!String(d.title || "").trim()) {
      setErr("اكتب عنوان التسليم.");
      return;
    }
    if (!isKey(d.due)) {
      setErr("تاريخ الاستحقاق غير صالح.");
      return;
    }
    onSave();
  };
  const set = (p) => setDraft((s) => ({ ...s, ...p }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={d.id && !d.isNew ? "تعديل التسليم" : "تسليم أو اختبار جديد"}
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
          <label className="mb-1.5 block text-xs text-white/45" htmlFor="los-ut-title">
            العنوان
          </label>
          <Field
            id="los-ut-title"
            autoFocus
            value={d.title || ""}
            onChange={(e) => set({ title: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="مثال: تقرير الفصل الثالث"
          />
        </div>

        <div>
          <span className="mb-2 block text-xs text-white/45">النوع</span>
          <div className="grid grid-cols-2 gap-2">
            {UNI_TASK_KINDS.map((k) => {
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

        <div>
          <label className="mb-1.5 block text-xs text-white/45" htmlFor="los-ut-course">
            المقرّر
          </label>
          <Field
            as="select"
            id="los-ut-course"
            value={d.course || ""}
            onChange={(e) => set({ course: e.target.value })}
            style={{ borderColor: T.border, colorScheme: "dark" }}
          >
            <option value="">بلا مقرّر</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {courseName(c)}
              </option>
            ))}
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs text-white/45" htmlFor="los-ut-due">
              الاستحقاق
            </label>
            <DateField id="los-ut-due" value={d.due} onChange={(v) => set({ due: v })} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/45" htmlFor="los-ut-time">
              الوقت <span style={{ color: T.faint }}>(اختياري)</span>
            </label>
            <TimeField id="los-ut-time" value={d.time} onChange={(v) => set({ time: v })} />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs text-white/45" htmlFor="los-ut-place">
            المكان <span style={{ color: T.faint }}>(اختياري)</span>
          </label>
          <Field
            id="los-ut-place"
            value={d.place || ""}
            onChange={(e) => set({ place: e.target.value })}
            placeholder="قاعة الاختبار، أو منصّة التسليم"
          />
        </div>

        <div>
          <span className="mb-1.5 block text-xs text-white/45">وزنه من الدرجة</span>
          <NumStep
            value={d.weight ?? 0}
            onChange={(v) => set({ weight: v })}
            min={0}
            max={100}
            step={5}
            unit="٪"
            tint={T.accent}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs text-white/45" htmlFor="los-ut-notes">
            ملاحظة <span style={{ color: T.faint }}>(اختياري)</span>
          </label>
          <Field
            id="los-ut-notes"
            as="textarea"
            rows={2}
            value={d.notes || ""}
            onChange={(e) => set({ notes: e.target.value })}
            placeholder="المطلوب بالضبط، وشروط الدكتور"
            className="resize-y leading-relaxed"
          />
        </div>

        {err && (
          <p
            className="flex items-center gap-2 rounded-xl border px-3 py-2 text-[11.5px] font-bold"
            style={{ borderColor: `${T.danger}4D`, background: `${T.danger}14`, color: T.danger }}
            role="alert"
          >
            <AlertTriangle size={13} /> {err}
          </p>
        )}
      </div>
    </Modal>
  );
}

function UniTaskRow({ task, course, onToggle, onEdit, onDelete }) {
  const k = uniKindOf(task.kind);
  const Icon = k.icon;
  const left = daysUntil(task.due);
  const late = !task.done && left < 0;
  const soon = !task.done && left >= 0 && left <= 2;
  const [burst, fireBurst] = useBurst(700);

  const handle = () => {
    if (!task.done) fireBurst();
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
            : soon
              ? `${T.cta}40`
              : "rgba(255,255,255,0.08)",
        backgroundColor: burst
          ? `${T.primary}26`
          : task.done
            ? `${T.primary}0F`
            : late
              ? `${T.danger}0F`
              : "rgba(255,255,255,0.03)",
      }}
    >
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
        style={{
          borderColor: task.done ? `${T.primary}59` : `${k.tint}45`,
          background: task.done ? `${T.primary}1A` : `${k.tint}18`,
          color: task.done ? T.primary : k.tint,
        }}
      >
        <Icon size={15} strokeWidth={1.9} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-start gap-2">
          <Checkbox
            checked={task.done}
            onToggle={handle}
            label={task.title || k.label}
            tint={T.primary}
            size="sm"
          />
          <button
            onClick={onEdit}
            aria-label={`تعديل ${task.title || k.label}`}
            className="shrink-0 rounded p-1.5 text-white/25 opacity-40 transition-all hover:text-white/70 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onDelete}
            aria-label={`حذف ${task.title || k.label}`}
            className="shrink-0 rounded p-1.5 text-white/25 opacity-40 transition-all hover:text-red-400 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <Trash2 size={13} />
          </button>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 pr-1.5 text-[10.5px]">
          <span style={{ color: k.tint }}>{k.label}</span>
          {course && (
            <span className="inline-flex min-w-0 items-center gap-1" style={{ color: course.tint }}>
              <BookMarked size={10} className="shrink-0" />
              <span className="truncate">{courseName(course)}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1" style={{ color: T.faint }}>
            <CalendarDays size={10} />
            {arDate(task.due)}
          </span>
          {task.time && (
            <span className="inline-flex items-center gap-1" style={{ color: T.muted }}>
              <Clock size={10} />
              <span dir="ltr" className="tabular-nums">
                {prettyTime(task.time)}
              </span>
            </span>
          )}
          {task.place && (
            <span className="inline-flex min-w-0 items-center gap-1" style={{ color: T.faint }}>
              <MapPin size={10} className="shrink-0" />
              <span className="truncate">{task.place}</span>
            </span>
          )}
          {task.weight > 0 && (
            <span className="inline-flex items-center gap-1" style={{ color: T.accent }}>
              <Percent size={10} />
              <span dir="ltr" className="tabular-nums">
                {task.weight}
              </span>
            </span>
          )}
          {!task.done && (
            <span
              className="font-bold"
              style={{ color: late ? T.danger : soon ? T.cta : T.faint }}
            >
              {whenWord(task.due)}
            </span>
          )}
        </div>
        {task.notes && (
          <p className="mt-1.5 whitespace-pre-wrap pr-1.5 text-[11px] leading-relaxed" style={{ color: T.muted }}>
            {task.notes}
          </p>
        )}
      </div>
    </div>
  );
}

/* The week, drawn. A six-column grid is unreadable at 375px, so the phone
   gets the same data as a day at a time and the grid appears from `lg` up —
   the arrows are not a fallback, they are the only thing that works under
   a finger. */
function WeekGrid({ courses, mins, dow }) {
  const hours = useMemo(() => {
    const out = [];
    for (let h = Math.floor(DAY_FROM / 60); h <= Math.floor(DAY_TO / 60); h += 2) out.push(h);
    return out;
  }, []);

  const nowLine =
    mins >= DAY_FROM && mins <= DAY_TO
      ? ((mins - DAY_FROM) / (DAY_TO - DAY_FROM)) * 100
      : null;

  return (
    <div className="hidden lg:block">
      <div className="flex gap-2">
        <div className="relative w-12 shrink-0" style={{ height: 560 }}>
          {hours.map((h) => {
            const { top } = spanPct(h * 60, h * 60 + 10);
            return (
              <span
                key={h}
                dir="ltr"
                className="absolute left-0 -translate-y-1/2 text-[10px] tabular-nums"
                style={{ top: `${top}%`, color: T.faint }}
              >
                {String(h).padStart(2, "0")}:00
              </span>
            );
          })}
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-6 gap-2">
          {UNI_DAYS.map((d) => {
            const rows = daySections(courses, d.d, mins);
            const isToday = d.d === dow;
            return (
              <div key={d.d} className="min-w-0">
                <p
                  className="mb-1.5 truncate text-center text-[11px] font-extrabold"
                  style={{ color: isToday ? T.cta : T.muted }}
                >
                  {d.label}
                </p>
                <div
                  className="relative rounded-xl border"
                  style={{
                    height: 560,
                    borderColor: isToday ? `${T.cta}59` : "rgba(255,255,255,0.08)",
                    backgroundColor: isToday ? `${T.cta}0A` : "rgba(255,255,255,0.025)",
                  }}
                >
                  {hours.map((h) => {
                    const { top } = spanPct(h * 60, h * 60 + 10);
                    return (
                      <span
                        key={h}
                        className="absolute inset-x-0 border-t"
                        style={{ top: `${top}%`, borderColor: "rgba(255,255,255,0.05)" }}
                      />
                    );
                  })}

                  {isToday && nowLine !== null && (
                    <span
                      className="absolute inset-x-0 z-10 border-t-2"
                      style={{
                        top: `${nowLine}%`,
                        borderColor: T.cta,
                        boxShadow: `0 0 10px ${T.cta}`,
                      }}
                      aria-hidden="true"
                    />
                  )}

                  {rows.map((r) => {
                    const { top, height } = spanPct(r.from, r.to);
                    return (
                      <span
                        key={`${r.course.id}:${r.slot.id}`}
                        className="absolute inset-x-1 overflow-hidden rounded-lg border p-1.5"
                        style={{
                          top: `${top}%`,
                          height: `${height}%`,
                          borderColor: r.now ? r.course.tint : `${r.course.tint}59`,
                          background: `${r.course.tint}26`,
                          boxShadow: r.now ? `0 0 16px -4px ${r.course.tint}` : "none",
                        }}
                        title={`${courseName(r.course)} — ${r.slot.from} إلى ${r.slot.to}`}
                      >
                        <span
                          className="block truncate text-[10px] font-extrabold leading-tight"
                          style={{ color: r.course.tint }}
                        >
                          {courseName(r.course)}
                        </span>
                        <span dir="ltr" className="block truncate text-[9px] tabular-nums" style={{ color: T.muted }}>
                          {r.slot.from}–{r.slot.to}
                        </span>
                        {r.slot.room && (
                          <span className="block truncate text-[9px]" style={{ color: T.faint }}>
                            {r.slot.room}
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function UniModule({ state, setState, onGo }) {
  const uni = state.uni || uniShape();
  const mins = useMinuteClock();
  const dow = new Date().getDay();

  const [view, setView] = useState("week");
  const [deskId, setDeskId] = useState(null);
  const [newCourse, setNewCourse] = useState(null);
  const [termDraft, setTermDraft] = useState(null);
  const [taskDraft, setTaskDraft] = useState(null);
  /* `null` means "follow today". Pinning the weekday at mount looked right
     until the screen was left open overnight and the phone kept opening on
     yesterday; resolving it at render costs nothing and cannot drift. A
     weekday the user picks himself is his until he leaves the screen. */
  const [pickDay, setPickDay] = useState(null);
  const day = pickDay ?? (uniDayOf(dow) ? dow : UNI_DAYS[0].d);

  const term = termOf(uni, uni.term);
  const courses = useMemo(() => coursesIn(uni, uni.term), [uni]);
  const desk = deskId ? courseIn(uni, deskId) : null;

  const patchUni = useCallback(
    (fn) =>
      setState((s) => {
        const prev = s.uni || uniShape();
        return { ...s, uni: { ...prev, ...fn(prev) } };
      }),
    [setState],
  );

  /* `fn` receives the course as it stands in state, not as it stood when
     the button was drawn.
   *
   *  `{ ...c, absences: c.absences + 1 }` reads `c` out of the render that
   *  drew the button, so two taps inside one frame both compute 1 and the
   *  second absence is silently swallowed — the counter is then wrong for
   *  the rest of the term with nothing on screen to suggest it. Every write
   *  goes through a function so the arithmetic is always done against the
   *  value that is actually stored. */
  const patchCourse = useCallback(
    (id, fn) =>
      patchUni((u) => ({
        courses: u.courses.map((c) => (c.id === id ? courseShape(fn(c)) : c)),
      })),
    [patchUni],
  );

  const dropCourse = (c) => {
    if (!window.confirm(`حذف «${courseName(c)}» بكل درجاته وملاحظاته؟`)) return;
    patchUni((u) => ({
      courses: u.courses.filter((x) => x.id !== c.id),
      /* A deliverable pointing at a deleted course would render under a
         blank name forever, so the link is cut rather than left dangling —
         the deliverable itself is the user's and stays. */
      tasks: u.tasks.map((t) => (t.course === c.id ? { ...t, course: "" } : t)),
    }));
    setDeskId(null);
  };

  /* One tap, one absence, once per day. The quick button is pressed in a
     corridor on the way out of a lecture, and a second tap — a fat finger,
     a re-render, coming back to the screen later the same day — used to add
     a second absence that nothing on screen contradicted. The day is
     recorded, so the second tap is recognised and refused with a reason
     rather than quietly counted. Removing it is the same button again. */
  const [absenceNote, setAbsenceNote] = useState(null); // {id, text, undo}
  const noteTimer = useRef(null);
  const flash = useCallback((msg) => {
    clearTimeout(noteTimer.current);
    setAbsenceNote(msg);
    noteTimer.current = setTimeout(() => setAbsenceNote(null), 4000);
  }, []);
  useEffect(() => () => clearTimeout(noteTimer.current), []);

  /* One button, both directions, and the direction is written on it. The
     test for "already recorded" happens inside the updater, against the
     stored row rather than the drawn one, so the day can never be counted
     twice however fast the button is pressed.

     A second press inside half a second is a slipped finger, not a change
     of mind: without this it toggles straight back off, so the tap the user
     meant to register leaves nothing behind and the confirmation underneath
     announces the opposite of what happened. A deliberate undo comes after
     reading that line, which takes far longer. */
  const lastAbsence = useRef({ id: null, at: 0 });
  const toggleTodayAbsence = (c) => {
    const now = Date.now();
    if (lastAbsence.current.id === c.id && now - lastAbsence.current.at < 500) return;
    lastAbsence.current = { id: c.id, at: now };

    const today = dayKey();
    const marked = (c.absentOn || []).includes(today);
    patchCourse(c.id, (prev) => {
      const was = (prev.absentOn || []).includes(today);
      return was
        ? {
            ...prev,
            absences: clampNum(prev.absences - 1, 0, 200, 0),
            absentOn: prev.absentOn.filter((d) => d !== today),
          }
        : {
            ...prev,
            absences: clampNum(prev.absences + 1, 0, 200, 0),
            absentOn: [...(prev.absentOn || []), today],
          };
    });
    flash({
      id: c.id,
      text: marked
        ? `أُلغي غياب اليوم في «${courseName(c)}».`
        : `سُجّل غياب اليوم في «${courseName(c)}».`,
    });
  };

  const saveCourse = () => {
    const c = courseShape({ ...newCourse, term: newCourse.term || uni.term });
    c.name = String(newCourse.name || "").trim();
    c.code = String(newCourse.code || "").trim();
    patchUni((u) => ({ courses: [...u.courses, c] }));
    setNewCourse(null);
    setDeskId(c.id);
  };

  const saveTerm = () => {
    const t = termShape(termDraft);
    t.label = String(termDraft.label || "").trim();
    patchUni((u) => ({
      terms: termDraft.isNew
        ? [...u.terms, t]
        : u.terms.map((x) => (x.id === t.id ? t : x)),
      term: termDraft.isNew ? t.id : u.term,
    }));
    setTermDraft(null);
  };

  const dropTerm = () => {
    const t = termDraft;
    const n = coursesIn(uni, t.id).length;
    if (
      !window.confirm(
        n
          ? `حذف «${t.label}» و${n} ${courseWord(n)} فيه؟`
          : `حذف «${t.label}»؟`,
      )
    )
      return;
    patchUni((u) => {
      const terms = u.terms.filter((x) => x.id !== t.id);
      const courses = u.courses.filter((c) => c.term !== t.id);
      const ids = new Set(courses.map((c) => c.id));
      return {
        terms,
        courses,
        /* Same reason as deleting one course: the deliverable survives, the
           dead link does not. */
        tasks: u.tasks.map((x) => (x.course && !ids.has(x.course) ? { ...x, course: "" } : x)),
        term: terms.length ? terms[0].id : "",
      };
    });
    setTermDraft(null);
  };

  const saveTask = () => {
    const t = uniTaskShape(taskDraft);
    t.title = String(taskDraft.title || "").trim();
    patchUni((u) => ({
      tasks: u.tasks.some((x) => x.id === t.id)
        ? u.tasks.map((x) => (x.id === t.id ? t : x))
        : [...u.tasks, t],
    }));
    setTaskDraft(null);
  };

  const toggleTask = (id) =>
    patchUni((u) => ({
      tasks: u.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    }));

  const dropTask = (t) => {
    if (!window.confirm(`حذف «${t.title}»؟`)) return;
    patchUni((u) => ({ tasks: u.tasks.filter((x) => x.id !== t.id) }));
  };

  const setScale = (n) =>
    patchUni(() => ({ scale: Number(n) === 4 ? 4 : 5 }));

  /* --- the figures ---------------------------------------------------- */
  const termGpa = useMemo(() => gpaOf(courses, uni.scale), [courses, uni.scale]);
  const allGraded = useMemo(() => gpaOf(uni.courses, uni.scale), [uni.courses, uni.scale]);
  /* The prior figure is only usable on the scale it was typed on. Rather
     than fold a four-point average into a five-point cumulative, the screen
     says it cannot and asks for the number again. */
  const priorUsable = uni.priorCredits === 0 || uni.priorScale === uni.scale;
  const cumulative = useMemo(() => {
    if (!priorUsable) return null;
    const credits = allGraded.credits + uni.priorCredits;
    if (!credits) return 0;
    return (allGraded.points + uni.priorGpa * uni.priorCredits) / credits;
  }, [allGraded, uni.priorGpa, uni.priorCredits, priorUsable]);
  /* The term's whole registered load. Declared up here because the
     graduation projection below reads it — a `const` used above its own
     declaration is a temporal-dead-zone throw, which takes the module
     down to a blank screen rather than warning about anything. */
  const loadHours = courses.reduce((n, c) => n + c.credits, 0);
  const cumCredits = allGraded.credits + uni.priorCredits;

  /* Everything already banked, as one pair: the published terms plus the
     figure off his transcript. This is the floor the target calculator
     builds on, so it is computed once and read by all of them. */
  const banked = useMemo(
    () => ({
      points: allGraded.points + uni.priorGpa * uni.priorCredits,
      credits: cumCredits,
    }),
    [allGraded.points, uni.priorGpa, uni.priorCredits, cumCredits],
  );
  /* The hours he is registered in right now — the only ones this term's
     average can be earned with. Ungraded on purpose: a course already
     graded is in `banked`, and counting it twice would ask him to re-earn
     marks he has. */
  const termHours = useMemo(
    () => courses.filter((c) => !gradeOf(c.grade)).reduce((n, c) => n + c.credits, 0),
    [courses],
  );
  const needThisTerm =
    uni.targetGpa > 0 && priorUsable
      ? gpaNeeded(uni.targetGpa, banked, termHours)
      : null;
  /* Where the cumulative lands if every registered hour comes out perfect. */
  const bestPossible =
    banked.credits + termHours > 0
      ? (banked.points + uni.scale * termHours) / (banked.credits + termHours)
      : 0;
  /* Projected on the term's whole registered load, not on `termHours`.
     `termHours` deliberately drops a course once its grade is published,
     which is right for "what do I still have to earn" and wrong here: as
     the term gets marked, the hours-per-term figure would shrink and the
     number of terms to graduation would climb every time a grade arrived. */
  const termsLeft =
    uni.gradCredits > 0 && loadHours > 0
      ? Math.max(0, Math.ceil((uni.gradCredits - cumCredits) / loadHours))
      : null;

  /* Each term with its own average, so «هل أنا أتحسّن؟» has an answer. */
  const termRecord = useMemo(
    () =>
      (uni.terms || []).map((t) => {
        const list = coursesIn(uni, t.id);
        return { t, n: list.length, ...gpaOf(list, uni.scale) };
      }),
    [uni, uni.scale],
  );

  /* Which week of the term today is, or null outside it. Counted from the
     term's own start date rather than from the calendar, and capped at the
     declared length so a term that runs past its end date does not report
     «الأسبوع ١٨ من ١٥». */
  const termWeek = useMemo(() => {
    if (!term) return null;
    const today = dayKey();
    if (today < term.start || today > term.end) return null;
    const n = Math.floor((daysUntil(today, term.start) || 0) / 7) + 1;
    return Math.min(term.weeks, Math.max(1, n));
  }, [term]);
  const todayRows = useMemo(
    () => daySections(courses, dow, mins),
    [courses, dow, mins],
  );
  /* The weekday the phone is showing — today unless the user swiped to
     another one. Only the real today gets a live "now" reading. */
  const dayRows = useMemo(
    () => daySections(courses, day, day === dow ? mins : -1),
    [courses, day, dow, mins],
  );
  const next = useMemo(
    () => nextSection(courses, dow, mins),
    [courses, dow, mins],
  );

  const openTasks = useMemo(
    () =>
      (uni.tasks || [])
        .filter((t) => !t.done)
        .sort((a, b) => (a.due === b.due ? 0 : a.due < b.due ? -1 : 1)),
    [uni.tasks],
  );
  const doneTasks = useMemo(
    () => (uni.tasks || []).filter((t) => t.done).sort((a, b) => (a.due < b.due ? 1 : -1)),
    [uni.tasks],
  );
  const lateTasks = openTasks.filter((t) => t.due < dayKey()).length;
  const week1 = openTasks.filter((t) => {
    const n = daysUntil(t.due);
    return n >= 0 && n <= 7;
  }).length;

  /* The one number that matters more than the GPA: who is close to being
     barred from a final. Surfaced at the top rather than buried in a desk. */
  const atRisk = useMemo(
    () =>
      courses
        .map((c) => {
          const cap = absenceCapOf(c, term);
          return cap ? { c, cap, band: attendBand(c.absences, cap) } : null;
        })
        .filter((r) => r && r.band.min >= 0.75),
    [courses, term],
  );

  const stats = [
    {
      k: "الساعات المسجّلة",
      v: loadHours,
      c: T.sky,
      icon: Hash,
      sub: `${courses.length} ${courseWord(courses.length)}`,
    },
    {
      k: "معدّل الفصل",
      v: termGpa.credits ? termGpa.gpa.toFixed(2) : "—",
      c: termGpa.credits ? gpaBand(termGpa.gpa, uni.scale).tint : T.faint,
      icon: Calculator,
      /* «من ٥» alone hides the thing worth knowing: how much of the term
         that average actually covers. An average over four of eighteen
         hours is not the term's average yet, and should not be read as one. */
      sub: termGpa.credits
        ? `من ${uni.scale} · ${termGpa.credits} ${hourWord(termGpa.credits)} من ${loadHours}`
        : "بعد رصد التقديرات",
    },
    { k: "تسليمات قادمة", v: week1, c: T.cta, icon: ClipboardList, sub: "خلال أسبوع" },
    {
      k: "متأخّر",
      v: lateTasks,
      c: lateTasks ? T.danger : T.faint,
      icon: AlertTriangle,
      sub: lateTasks ? "سلّمه أو ألغه" : "لا شيء متأخّر",
    },
  ];

  return (
    <div className="space-y-7">
      <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:justify-between sm:p-7">
        <div className="min-w-0">
          <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">
            الجامعة
          </h2>
          <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/40">
            الجدول والدرجات والغياب والمعدّل في شاشة واحدة — لأن كل رقم منها
            يجيب عن سؤال الآخر.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {(uni.terms || []).map((t) => {
              const on = t.id === uni.term;
              const live = t.start <= dayKey() && dayKey() <= t.end;
              return (
                <button
                  key={t.id}
                  onClick={() => patchUni(() => ({ term: t.id }))}
                  onDoubleClick={() => setTermDraft({ ...t })}
                  aria-pressed={on}
                  className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11.5px] font-bold transition-all"
                  style={{
                    borderColor: on ? `${T.cta}80` : T.border,
                    background: on ? `${T.cta}1F` : "rgba(255,255,255,0.03)",
                    color: on ? T.cta : T.muted,
                  }}
                >
                  {t.label || "فصل بلا اسم"}
                  {live && (
                    <span
                      aria-label="الفصل الحالي"
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: T.primary, boxShadow: `0 0 8px ${T.primary}` }}
                    />
                  )}
                </button>
              );
            })}
            {term && (
              <Btn
                variant="ghost"
                size="sm"
                onClick={() => setTermDraft({ ...term })}
                style={{ borderColor: T.border }}
                title="تعديل الفصل الحالي"
              >
                <Pencil size={12} />
              </Btn>
            )}
            <Btn
              variant="outline"
              size="sm"
              onClick={() =>
                setTermDraft({
                  ...termShape({ label: "", start: dayKey() }),
                  isNew: true,
                })
              }
              style={{ borderColor: T.border }}
            >
              <Plus size={13} strokeWidth={3} /> فصل
            </Btn>
          </div>
          {term && (
            <div className="mt-2.5">
              <p className="text-[10.5px]" style={{ color: T.faint }}>
                {arDate(term.start)} — {arDate(term.end)} ·{" "}
                <span dir="ltr" className="tabular-nums">
                  {term.weeks}
                </span>{" "}
                {weekWord(term.weeks)}
                {/* Which week of the term it is, because «الأسبوع العاشر من
                    ١٥» is the sentence that decides whether there is still
                    room to fix a mark — the two dates alone are not. */}
                {termWeek !== null && (
                  <>
                    {" · الأسبوع "}
                    <span dir="ltr" className="font-bold tabular-nums" style={{ color: T.accent }}>
                      {termWeek}
                    </span>
                  </>
                )}
              </p>
              {termWeek !== null && (
                <div
                  className="mt-1.5 h-1 w-full max-w-[280px] overflow-hidden rounded-full"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, (termWeek / term.weeks) * 100)}%`,
                      backgroundImage: `linear-gradient(90deg, ${T.cta}, ${T.ctaLift})`,
                      boxShadow: `0 0 10px ${T.cta}99`,
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
        <div className="grid shrink-0 grid-cols-4 gap-2">
          {UNI_VIEWS.map((v) => {
            const on = v.id === view;
            const Icon = v.icon;
            return (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                aria-pressed={on}
                className="flex flex-col items-center gap-1 rounded-xl border px-2.5 py-2.5 text-[10.5px] font-bold transition-all duration-200"
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
        {stats.map((s) => (
          <StatTile
            key={s.k}
            icon={s.icon}
            label={s.k}
            value={s.v}
            sub={s.sub}
            tint={s.c}
          />
        ))}
      </div>

      {/* An absence is recorded by one tap and changes a number that can
          end a course. It has to say out loud what it just did — a silent
          counter is one nobody checks until it is too late. */}
      {absenceNote && (
        <Card
          className="los-in flex items-center gap-2.5 p-3.5"
          style={{ borderColor: `${T.accent}59` }}
          role="status"
        >
          <ShieldCheck size={15} className="shrink-0" style={{ color: T.accent }} />
          <p className="text-[12px] font-bold" style={{ color: T.accent }}>
            {absenceNote.text}
          </p>
        </Card>
      )}

      {atRisk.length > 0 && (
        <Card className="p-5 sm:p-6" style={{ borderColor: `${T.danger}40` }}>
          <p className="flex items-center gap-2 text-[13px] font-extrabold" style={{ color: T.danger }}>
            <AlertTriangle size={15} /> الغياب يقترب من الحدّ
          </p>
          <div className="mt-3 space-y-2">
            {atRisk.map(({ c, cap, band }) => (
              <button
                key={c.id}
                onClick={() => setDeskId(c.id)}
                className="flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-right transition-colors hover:bg-white/[0.06]"
                style={{ borderColor: `${band.tint}40`, backgroundColor: `${band.tint}0F` }}
              >
                <BookMarked size={15} className="shrink-0" style={{ color: c.tint }} />
                <span className="min-w-0 flex-1 truncate text-[13px] font-bold">
                  {courseName(c)}
                </span>
                <span dir="ltr" className="shrink-0 text-[11.5px] font-extrabold tabular-nums" style={{ color: band.tint }}>
                  {c.absences} / {cap}
                </span>
                <Badge tint={band.tint}>{band.label}</Badge>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* ---------------- الجدول ---------------- */}
      {view === "week" && (
        <>
          {next && (
            <Card className="p-5 sm:p-6" style={{ borderColor: `${next.course.tint}40` }}>
              <p className="flex items-center gap-2 text-[11px] font-bold" style={{ color: T.faint }}>
                <AlarmClock size={13} style={{ color: next.course.tint }} />
                {/* At seven days out the weekday name is today's own, so
                    «أوّل محاضرة الجمعة» would read as a lecture a few hours
                    away when it is a full week off. */}
                {next.now
                  ? "أنت الآن في"
                  : next.inDays === 0
                    ? "القادمة اليوم"
                    : next.inDays === 1
                      ? "أوّل محاضرة غدًا"
                      : next.inDays >= 7
                        ? "أوّل محاضرة الأسبوع القادم"
                        : `أوّل محاضرة ${DOW_AR[(dow + next.inDays) % 7]}`}
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-[18px] font-extrabold" style={{ color: next.course.tint }}>
                    {courseName(next.course)}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[11.5px]" style={{ color: T.muted }}>
                    <span dir="ltr" className="tabular-nums">
                      {prettyTime(next.slot.from)} – {prettyTime(next.slot.to)}
                    </span>
                    {next.slot.room && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={11} /> {next.slot.room}
                      </span>
                    )}
                    {next.course.instructor && (
                      <span className="inline-flex items-center gap-1">
                        <Users size={11} /> {next.course.instructor}
                      </span>
                    )}
                  </p>
                </div>
                {next.inDays === 0 && !next.now && (
                  <Badge tint={T.cta}>
                    <Clock size={11} /> بعد{" "}
                    <span dir="ltr" className="tabular-nums">
                      {Math.max(1, next.from - mins)}
                    </span>{" "}
                    {minWord(Math.max(1, next.from - mins))}
                  </Badge>
                )}
                {next.now && (
                  <Badge tint={T.primary}>
                    <CircleDot size={11} /> جارية الآن
                  </Badge>
                )}
              </div>
            </Card>
          )}

          <Card className="p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-[13px] font-extrabold" style={{ color: T.accent }}>
                <CalendarDays size={15} /> الجدول الأسبوعي
              </p>
              <Btn
                variant="outline"
                size="sm"
                onClick={() => setView("courses")}
                style={{ borderColor: T.border }}
              >
                <SquarePen size={13} /> عدّل المواعيد
              </Btn>
            </div>

            {courses.length === 0 ? (
              <div className="py-10 text-center">
                <School size={28} className="mx-auto" style={{ color: T.faint }} />
                <p className="mt-3 text-[12.5px] leading-relaxed text-white/35">
                  لا مقرّرات في هذا الفصل بعد.
                </p>
                <Btn
                  variant="default"
                  size="sm"
                  className="mt-4"
                  onClick={() =>
                    setNewCourse(courseShape({ term: uni.term, tint: COURSE_TINTS[0] }))
                  }
                  disabled={!uni.term}
                >
                  <Plus size={14} strokeWidth={3} /> أضف أول مقرّر
                </Btn>
              </div>
            ) : (
              <>
                <WeekGrid courses={courses} mins={mins} dow={dow} />

                {/* phone: a day at a time */}
                <div className="lg:hidden">
                  <div className="mb-3 grid grid-cols-6 gap-1.5">
                    {UNI_DAYS.map((d) => {
                      const on = d.d === day;
                      const isToday = d.d === dow;
                      const n = daySections(courses, d.d, -1).length;
                      return (
                        <button
                          key={d.d}
                          onClick={() => setPickDay(d.d)}
                          aria-pressed={on}
                          className="rounded-xl border px-1 py-2 text-center transition-all"
                          style={{
                            borderColor: on ? `${T.cta}80` : isToday ? `${T.cta}40` : T.border,
                            background: on ? `${T.cta}1F` : "rgba(255,255,255,0.03)",
                            color: on ? T.cta : T.muted,
                          }}
                        >
                          <span className="block text-[12px] font-extrabold">{d.short}</span>
                          <span dir="ltr" className="block text-[9px] tabular-nums opacity-70">
                            {n}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="space-y-2">
                    {/* Built once. Calling `daySections` for the emptiness
                        test and again for the rows walks every slot twice
                        on every tick of the clock. */}
                    {dayRows.length === 0 ? (
                      <p className="py-6 text-center text-[12px] text-white/30">
                        لا محاضرات في {uniDayOf(day)?.label}.
                      </p>
                    ) : (
                      dayRows.map((r) => (
                        <div
                          key={`${r.course.id}:${r.slot.id}`}
                          className="flex items-center gap-3 rounded-xl border p-3"
                          style={{
                            borderColor: r.now ? r.course.tint : `${r.course.tint}40`,
                            backgroundColor: `${r.course.tint}12`,
                          }}
                        >
                          <span
                            dir="ltr"
                            className="shrink-0 text-center text-[10.5px] font-extrabold tabular-nums leading-tight"
                            style={{ color: r.course.tint }}
                          >
                            {r.slot.from}
                            <br />
                            {r.slot.to}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-extrabold">
                              {courseName(r.course)}
                            </span>
                            <span className="mt-0.5 flex flex-wrap gap-x-2.5 text-[10.5px]" style={{ color: T.faint }}>
                              {r.slot.room && (
                                <span className="inline-flex items-center gap-1">
                                  <MapPin size={10} /> {r.slot.room}
                                </span>
                              )}
                              {r.course.instructor && <span className="truncate">{r.course.instructor}</span>}
                            </span>
                          </span>
                          {r.now && <Badge tint={T.primary}>الآن</Badge>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </Card>

          {todayRows.length > 0 && (
            <Card className="p-5 sm:p-6">
              <p className="flex items-center gap-2 text-[13px] font-extrabold" style={{ color: T.accent }}>
                <ClipboardCheck size={15} /> محاضرات اليوم
              </p>
              <p className="mt-1 text-[11px] leading-relaxed" style={{ color: T.faint }}>
                سجّل الغياب في يومه — غياب يُسجَّل بعد أسبوع هو غياب لا يُسجَّل.
              </p>
              <div className="mt-3 space-y-2">
                {todayRows.map((r) => {
                  const cap = absenceCapOf(r.course, term);
                  const band = attendBand(r.course.absences, cap);
                  return (
                    <div
                      key={`${r.course.id}:${r.slot.id}`}
                      className="flex flex-wrap items-center gap-3 rounded-xl border p-3"
                      style={{
                        borderColor: r.now ? r.course.tint : "rgba(255,255,255,0.08)",
                        backgroundColor: r.now ? `${r.course.tint}14` : "rgba(255,255,255,0.03)",
                      }}
                    >
                      <span dir="ltr" className="shrink-0 text-[11px] font-extrabold tabular-nums" style={{ color: r.course.tint }}>
                        {r.slot.from}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] font-bold">
                        {courseName(r.course)}
                      </span>
                      {cap !== null && (
                        <span dir="ltr" className="shrink-0 text-[10.5px] tabular-nums" style={{ color: band.tint }}>
                          {r.course.absences}/{cap}
                        </span>
                      )}
                      <Btn
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTodayAbsence(r.course)}
                        style={{ borderColor: T.border }}
                      >
                        <Plus size={12} strokeWidth={3} /> غياب
                      </Btn>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </>
      )}

      {/* ---------------- المقررات ---------------- */}
      {view === "courses" && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[12.5px]" style={{ color: T.faint }}>
              {courses.length === 0
                ? "ابدأ بمقرّر واحد، وأكمل الباقي من مكتبه."
                : "اضغط المقرّر لتفتح مكتبه: المواعيد، الدرجات، الغياب، والتقدير."}
            </p>
            <Btn
              variant="default"
              size="sm"
              onClick={() =>
                setNewCourse(
                  courseShape({
                    term: uni.term,
                    tint: COURSE_TINTS[courses.length % COURSE_TINTS.length],
                  }),
                )
              }
              disabled={!uni.term}
            >
              <Plus size={14} strokeWidth={3} /> مقرّر جديد
            </Btn>
          </div>

          {!uni.term ? (
            <Card className="p-8 text-center">
              <School size={28} className="mx-auto" style={{ color: T.faint }} />
              <p className="mt-3 text-[12.5px] leading-relaxed text-white/35">
                أضف فصلًا دراسيًا أولًا — المقرّرات تعيش داخل فصل.
              </p>
            </Card>
          ) : courses.length === 0 ? (
            <Card className="p-8 text-center">
              <BookMarked size={28} className="mx-auto" style={{ color: T.faint }} />
              <p className="mt-3 text-[12.5px] leading-relaxed text-white/35">
                لا مقرّرات في «{term?.label || "هذا الفصل"}» بعد.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {courses.map((c) => (
                <CourseCard
                  key={c.id}
                  course={c}
                  term={term}
                  onOpen={() => setDeskId(c.id)}
                  onAbsence={() => toggleTodayAbsence(c)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ---------------- التسليمات ---------------- */}
      {view === "tasks" && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[12.5px]" style={{ color: T.faint }}>
              كل تسليم هنا يظهر تلقائيًا في التقويم — تاريخ واحد في مكان واحد.
            </p>
            <div className="flex gap-2">
              <Btn
                variant="outline"
                size="sm"
                onClick={() => onGo("agenda")}
                style={{ borderColor: T.border }}
              >
                <CalendarDays size={13} /> في التقويم
              </Btn>
              <Btn
                variant="default"
                size="sm"
                onClick={() =>
                  setTaskDraft({
                    ...uniTaskShape({ due: dayKey(), kind: "assign" }),
                    isNew: true,
                  })
                }
              >
                <Plus size={14} strokeWidth={3} /> تسليم جديد
              </Btn>
            </div>
          </div>

          <Card className="p-5 sm:p-7">
            <p className="text-[13px] font-extrabold" style={{ color: T.accent }}>
              المطلوب
            </p>
            {openTasks.length === 0 ? (
              <div className="py-10 text-center">
                <ClipboardCheck size={28} className="mx-auto" style={{ color: T.primary }} />
                <p className="mt-3 text-[12.5px] text-white/35">
                  لا شيء مستحقّ. أضف ما تعرف أنه قادم قبل أن يفاجئك.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {openTasks.map((t) => (
                  <UniTaskRow
                    key={t.id}
                    task={t}
                    course={courseIn(uni, t.course)}
                    onToggle={() => toggleTask(t.id)}
                    onEdit={() => setTaskDraft({ ...t })}
                    onDelete={() => dropTask(t)}
                  />
                ))}
              </div>
            )}
          </Card>

          {doneTasks.length > 0 && (
            <Card className="p-5 sm:p-7">
              <p className="flex items-center gap-2 text-[13px] font-extrabold" style={{ color: T.primary }}>
                <CheckCheck size={15} /> مُنجز
                <span dir="ltr" className="tabular-nums opacity-60">
                  ({doneTasks.length})
                </span>
              </p>
              <div className="mt-4 space-y-2">
                {doneTasks.slice(0, 20).map((t) => (
                  <UniTaskRow
                    key={t.id}
                    task={t}
                    course={courseIn(uni, t.course)}
                    onToggle={() => toggleTask(t.id)}
                    onEdit={() => setTaskDraft({ ...t })}
                    onDelete={() => dropTask(t)}
                  />
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* ---------------- المعدّل ---------------- */}
      {view === "gpa" && (
        <>
          <Card className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[13px] font-extrabold" style={{ color: T.accent }}>
                  <Calculator size={15} /> حاسب المعدّل
                </p>
                <p className="mt-1.5 max-w-lg text-[11.5px] leading-relaxed" style={{ color: T.faint }}>
                  لا يُحسب مقرّر إلا بعد أن ترصد تقديره — المقرّر بلا تقدير
                  ليس صفرًا، وحسابه صفرًا يكذب عليك.
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {[5, 4].map((n) => {
                  const on = uni.scale === n;
                  return (
                    <button
                      key={n}
                      onClick={() => setScale(n)}
                      aria-pressed={on}
                      className="rounded-xl border px-4 py-2 text-[12px] font-extrabold transition-all"
                      style={{
                        borderColor: on ? `${T.cta}80` : T.border,
                        background: on ? `${T.cta}1F` : "rgba(255,255,255,0.03)",
                        color: on ? T.cta : T.muted,
                      }}
                    >
                      من <span dir="ltr">{n}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div
                className="rounded-2xl border p-5 text-center"
                style={{
                  borderColor: `${termGpa.credits ? gpaBand(termGpa.gpa, uni.scale).tint : T.border}40`,
                  background: `${termGpa.credits ? gpaBand(termGpa.gpa, uni.scale).tint : "#ffffff"}0F`,
                }}
              >
                <p className="text-[10.5px]" style={{ color: T.faint }}>
                  معدّل الفصل
                </p>
                <p
                  dir="ltr"
                  className="mt-1 text-[32px] font-extrabold leading-none tabular-nums"
                  style={{
                    color: termGpa.credits ? gpaBand(termGpa.gpa, uni.scale).tint : T.faint,
                  }}
                >
                  {termGpa.credits ? termGpa.gpa.toFixed(2) : "—"}
                </p>
                <p className="mt-1.5 text-[10.5px]" style={{ color: T.muted }}>
                  {termGpa.credits ? (
                    <>
                      {gpaBand(termGpa.gpa, uni.scale).label} ·{" "}
                      <span dir="ltr" className="tabular-nums">
                        {termGpa.credits}
                      </span>{" "}
                      {hourWord(termGpa.credits)} محسوبة
                    </>
                  ) : (
                    "لا تقديرات مرصودة"
                  )}
                </p>
              </div>

              <div
                className="rounded-2xl border p-5 text-center"
                style={{
                  borderColor: `${
                    cumulative !== null && cumCredits
                      ? gpaBand(cumulative, uni.scale).tint
                      : T.border
                  }40`,
                  background: `${
                    cumulative !== null && cumCredits
                      ? gpaBand(cumulative, uni.scale).tint
                      : "#ffffff"
                  }0F`,
                }}
              >
                <p className="text-[10.5px]" style={{ color: T.faint }}>
                  المعدّل التراكمي
                </p>
                <p
                  dir="ltr"
                  className="mt-1 text-[32px] font-extrabold leading-none tabular-nums"
                  style={{
                    color:
                      cumulative !== null && cumCredits
                        ? gpaBand(cumulative, uni.scale).tint
                        : T.faint,
                  }}
                >
                  {cumulative !== null && cumCredits ? cumulative.toFixed(2) : "—"}
                </p>
                <p className="mt-1.5 text-[10.5px]" style={{ color: T.muted }}>
                  {cumulative === null ? (
                    "المعدّل السابق على مقياس آخر"
                  ) : cumCredits ? (
                    <>
                      <span dir="ltr" className="tabular-nums">
                        {cumCredits}
                      </span>{" "}
                      {hourWord(cumCredits)} إجمالًا
                    </>
                  ) : (
                    "لا ساعات بعد"
                  )}
                </p>
              </div>

              <div
                className="rounded-2xl border p-5"
                style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
              >
                <p className="text-[10.5px]" style={{ color: T.faint }}>
                  ما قبل هذه الفصول
                </p>
                <div className="mt-2 space-y-2">
                  <div>
                    <span className="mb-1 block text-[10px]" style={{ color: T.faint }}>
                      المعدّل السابق
                    </span>
                    <NumField
                      value={uni.priorGpa}
                      min={0}
                      max={uni.scale}
                      onChange={(v) =>
                        patchUni(() => ({ priorGpa: v, priorScale: uni.scale }))
                      }
                      className="py-2 text-[12px]"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <span className="mb-1 block text-[10px]" style={{ color: T.faint }}>
                      ساعاته المعتمدة
                    </span>
                    <NumField
                      value={uni.priorCredits}
                      min={0}
                      max={500}
                      onChange={(v) =>
                        patchUni(() => ({ priorCredits: v, priorScale: uni.scale }))
                      }
                      className="py-2 text-[12px]"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {!priorUsable && (
              <p
                className="mt-4 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-[11.5px] font-bold leading-relaxed"
                style={{ borderColor: `${T.accent}40`, background: `${T.accent}12`, color: T.accent }}
                role="alert"
              >
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                المعدّل السابق مُدخل على مقياس «من{" "}
                <span dir="ltr">{uni.priorScale}</span>» وأنت تحسب الآن على «من{" "}
                <span dir="ltr">{uni.scale}</span>». أعد كتابته من سجلك
                الأكاديمي ليُحسب التراكمي — تحويله تلقائيًا رقمٌ مخترع.
              </p>
            )}
          </Card>

          {/* --- what this term has to average ------------------------- *
               The cumulative is the number he is judged on, but it is not
               the number he can act on — this term's average is. So the
               target is entered once and the screen turns it into the only
               figure that is actionable: what the hours he is registered in
               right now have to come out at.                              */}
          <Card className="p-5 sm:p-7">
            <p className="flex items-center gap-2 text-[13px] font-extrabold" style={{ color: T.cta }}>
              <Crosshair size={15} /> كم أحتاج هذا الفصل؟
            </p>
            <div className="mt-4 flex flex-wrap items-start gap-5">
              <div className="min-w-[200px] flex-1">
                <span className="mb-1.5 block text-[10.5px]" style={{ color: T.faint }}>
                  المعدّل التراكمي الذي أريده
                </span>
                <NumField
                  value={uni.targetGpa}
                  min={0}
                  max={uni.scale}
                  onChange={(v) => patchUni(() => ({ targetGpa: v }))}
                  placeholder="0"
                  className="py-2 text-[13px]"
                />
                <p className="mt-1.5 text-[10px] leading-relaxed" style={{ color: T.faint }}>
                  على مقياس «من <span dir="ltr">{uni.scale}</span>». اتركه صفرًا
                  لإخفاء الحاسب.
                </p>
              </div>
              <div className="min-w-[220px] flex-[2]">
                {uni.targetGpa <= 0 ? (
                  <p className="text-[12px] leading-relaxed" style={{ color: T.faint }}>
                    اكتب المعدّل الذي تريد الوصول إليه، ويقول لك كم يجب أن يكون
                    معدّل هذا الفصل بالضبط.
                  </p>
                ) : !priorUsable ? (
                  <p className="text-[12px] font-bold leading-relaxed" style={{ color: T.accent }}>
                    حدّث المعدّل السابق على المقياس الحالي أولًا — بدونه لا
                    يُعرف من أين تبدأ.
                  </p>
                ) : termHours <= 0 ? (
                  <p className="text-[12px] leading-relaxed" style={{ color: T.faint }}>
                    لا ساعات مسجّلة في «{term?.label || "هذا الفصل"}» — أضف
                    مقرّراتك ليُحسب المطلوب.
                  </p>
                ) : needThisTerm === null ? null : needThisTerm > uni.scale ? (
                  <p className="text-[12px] font-bold leading-relaxed" style={{ color: T.danger }}>
                    لا يُدرَك هذا الفصل مهما فعلت: حتى بمعدّل{" "}
                    <span dir="ltr" className="tabular-nums">
                      {uni.scale}
                    </span>{" "}
                    كاملًا سينتهي تراكميك عند{" "}
                    <span dir="ltr" className="tabular-nums">
                      {bestPossible.toFixed(2)}
                    </span>
                    . اخفض الهدف أو وزّعه على فصلين.
                  </p>
                ) : needThisTerm <= 0 ? (
                  <p className="text-[12px] font-bold leading-relaxed" style={{ color: T.primary }}>
                    أنت فوق هدفك فعلًا — هذا الفصل تثبيت لا إنقاذ.
                  </p>
                ) : (
                  <p className="text-[12.5px] leading-relaxed" style={{ color: T.muted }}>
                    معدّل هذا الفصل يجب أن يكون{" "}
                    <span
                      dir="ltr"
                      className="text-[22px] font-extrabold tabular-nums"
                      style={{ color: gpaBand(needThisTerm, uni.scale).tint }}
                    >
                      {needThisTerm.toFixed(2)}
                    </span>{" "}
                    على الأقل، عبر{" "}
                    <span dir="ltr" className="tabular-nums">
                      {termHours}
                    </span>{" "}
                    {hourWord(termHours)} مسجّلة — أي ما يقارب تقدير{" "}
                    <span dir="ltr" className="font-bold">
                      {nearestGrade(needThisTerm, uni.scale)}
                    </span>{" "}
                    في كل مقرّر.
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* --- the degree, not the term ------------------------------- */}
          <Card className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="flex items-center gap-2 text-[13px] font-extrabold" style={{ color: T.accent }}>
                <Milestone size={15} /> الطريق إلى التخرّج
              </p>
              <div className="w-[160px]">
                <span className="mb-1 block text-[10px]" style={{ color: T.faint }}>
                  ساعات الخطة كاملة
                </span>
                <NumField
                  value={uni.gradCredits}
                  min={0}
                  max={400}
                  onChange={(v) => patchUni(() => ({ gradCredits: v }))}
                  placeholder="0"
                  className="py-1.5 text-[12px]"
                />
              </div>
            </div>

            {uni.gradCredits > 0 ? (
              <>
                <div
                  className="mt-4 h-2 w-full overflow-hidden rounded-full"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, (cumCredits / uni.gradCredits) * 100)}%`,
                      backgroundImage: `linear-gradient(90deg, ${T.primary}, ${T.primaryLift})`,
                      boxShadow: `0 0 14px ${T.primary}99`,
                    }}
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatTile
                    icon={BadgeCheck}
                    label="أُنجز"
                    value={cumCredits}
                    sub={`${Math.round((cumCredits / uni.gradCredits) * 100)}٪ من الخطة`}
                    tint={T.primary}
                  />
                  <StatTile
                    icon={Hourglass}
                    label="يتبقّى"
                    value={Math.max(0, uni.gradCredits - cumCredits)}
                    sub={`${hourWord(Math.max(0, uni.gradCredits - cumCredits))} معتمدة`}
                    tint={T.accent}
                  />
                  <StatTile
                    icon={Hash}
                    label="مسجّل الآن"
                    value={loadHours}
                    sub={term?.label || "هذا الفصل"}
                    tint={T.sky}
                  />
                  <StatTile
                    icon={Flag}
                    label="فصول متبقّية"
                    value={termsLeft === null ? "—" : termsLeft}
                    sub={
                      termsLeft === null
                        ? "يظهر بعد تسجيل ساعاتك"
                        : `بمعدّل ${loadHours} ${hourWord(loadHours)} للفصل`
                    }
                    tint={T.violet}
                  />
                </div>
              </>
            ) : (
              <p className="mt-3 text-[11.5px] leading-relaxed" style={{ color: T.faint }}>
                اكتب عدد ساعات خطتك الدراسية كاملة، ويتحوّل عدّاد الساعات إلى
                شريط تخرّج يقول لك كم بقي وكم فصلًا.
              </p>
            )}
          </Card>

          {/* --- every term, not just this one -------------------------- *
               The term switcher shows one term's average at a time, which
               is the one view that cannot answer «هل أنا أتحسّن؟». The
               whole record on one card can.                               */}
          {(uni.terms || []).length > 1 && (
            <Card className="p-5 sm:p-7">
              <p className="flex items-center gap-2 text-[13px] font-extrabold" style={{ color: T.accent }}>
                <BarChart3 size={15} /> سجلّ الفصول
              </p>
              <div className="mt-4 space-y-2">
                {termRecord.map((row) => {
                  const on = row.t.id === uni.term;
                  const band = row.credits ? gpaBand(row.gpa, uni.scale) : null;
                  return (
                    <button
                      key={row.t.id}
                      onClick={() => patchUni(() => ({ term: row.t.id }))}
                      aria-pressed={on}
                      className="flex w-full flex-wrap items-center gap-3 rounded-xl border p-3 text-right transition-colors hover:bg-white/[0.06]"
                      style={{
                        borderColor: on ? `${T.cta}59` : "rgba(255,255,255,0.08)",
                        backgroundColor: on ? `${T.cta}0F` : "rgba(255,255,255,0.03)",
                      }}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-extrabold">
                          {row.t.label || "فصل بلا اسم"}
                        </span>
                        <span className="mt-0.5 block text-[10.5px]" style={{ color: T.faint }}>
                          {arDate(row.t.start)} — {arDate(row.t.end)} ·{" "}
                          <span dir="ltr" className="tabular-nums">
                            {row.n}
                          </span>{" "}
                          {courseWord(row.n)}
                        </span>
                      </span>
                      <span className="shrink-0 text-left">
                        <span
                          dir="ltr"
                          className="block text-[17px] font-extrabold tabular-nums"
                          style={{ color: band ? band.tint : T.faint }}
                        >
                          {row.credits ? row.gpa.toFixed(2) : "—"}
                        </span>
                        <span className="block text-[10px]" style={{ color: T.faint }}>
                          {row.credits ? (
                            <>
                              <span dir="ltr" className="tabular-nums">
                                {row.credits}
                              </span>{" "}
                              {hourWord(row.credits)}
                            </>
                          ) : (
                            "بلا تقديرات"
                          )}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>
          )}

          <Card className="p-5 sm:p-7">
            <p className="text-[13px] font-extrabold" style={{ color: T.accent }}>
              تقديرات {term?.label || "الفصل"}
            </p>
            {courses.length === 0 ? (
              <p className="py-8 text-center text-[12px] text-white/30">
                لا مقرّرات في هذا الفصل.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {courses.map((c) => {
                  const st = courseStanding(c);
                  const g = gradeOf(c.grade);
                  const suggest = st.projected !== null ? gradeFromPct(st.projected).id : null;
                  return (
                    <div
                      key={c.id}
                      className="rounded-2xl border p-3.5"
                      style={{ borderColor: `${c.tint}2E`, background: `${c.tint}0A` }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <button onClick={() => setDeskId(c.id)} className="min-w-0 flex-1 text-right">
                          <p className="truncate text-[13.5px] font-extrabold" style={{ color: c.tint }}>
                            {courseName(c)}
                          </p>
                          <p className="mt-0.5 text-[10.5px]" style={{ color: T.faint }}>
                            <span dir="ltr" className="tabular-nums">
                              {c.credits}
                            </span>{" "}
                            {hourWord(c.credits)}
                            {st.projected !== null && (
                              <>
                                {" · المتوقّع "}
                                <span dir="ltr" className="tabular-nums">
                                  {st.projected.toFixed(1)}%
                                </span>
                              </>
                            )}
                          </p>
                        </button>
                        {g && (
                          <span
                            dir="ltr"
                            className="shrink-0 text-[13px] font-extrabold tabular-nums"
                            style={{ color: gradePoints(g, uni.scale) >= 4 ? T.primary : T.accent }}
                          >
                            {gradePoints(g, uni.scale).toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="mt-3">
                        <GradePicker
                          value={c.grade}
                          onPick={(id) => patchCourse(c.id, (prev) => ({ ...prev, grade: id }))}
                          scale={uni.scale}
                          suggest={suggest}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}

      <CourseDesk
        course={desk}
        term={term}
        scale={uni.scale}
        onClose={() => setDeskId(null)}
        onPatch={(fn) => patchCourse(desk.id, fn)}
        onDelete={() => desk && dropCourse(desk)}
      />

      <CourseModal
        open={!!newCourse}
        draft={newCourse}
        setDraft={setNewCourse}
        terms={uni.terms || []}
        onClose={() => setNewCourse(null)}
        onSave={saveCourse}
      />

      <TermModal
        open={!!termDraft}
        draft={termDraft}
        setDraft={setTermDraft}
        onClose={() => setTermDraft(null)}
        onSave={saveTerm}
        onDelete={dropTerm}
      />

      <UniTaskModal
        open={!!taskDraft}
        draft={taskDraft}
        setDraft={setTaskDraft}
        courses={uni.courses || []}
        onClose={() => setTaskDraft(null)}
        onSave={saveTask}
      />
    </div>
  );
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
            className={`los-nav flex items-center gap-3 rounded-xl border px-3 py-2.5 text-right transition-all duration-200${
              on ? " los-nav-on" : ""
            }`}
            style={{
              borderColor: on ? `${T.cta}66` : "transparent",
              background: on
                ? `linear-gradient(135deg, ${T.cta}2E, ${T.cta}0F)`
                : "transparent",
              color: on ? T.ctaLift : T.muted,
              boxShadow: on ? `0 8px 22px -12px ${T.cta}` : "none",
            }}
          >
            <Icon size={18} strokeWidth={on ? 2.4 : 1.9} className="shrink-0" />
            {showLabels && (
              <span className="truncate text-[13.5px] font-bold">{n.label}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

/* Reordering the nav itself. Drag for the mouse and ↑/↓ for a finger, the
   same pairing the habit list uses and for the same reason: HTML5 drag never
   fires on touch, so the arrows are the only path that works on a phone.
   The cut line is not decoration — the order also decides which four tabs
   reach the mobile bar, and that consequence is invisible from a desktop. */
function NavOrderEditor({ order, onChange, onReset }) {
  const [dragging, setDragging] = useState(null);
  const [over, setOver] = useState(null);
  const items = orderedNav(order);
  const ids = items.map((n) => n.id);
  const pristine = ids.join() === NAV_IDS.join();

  return (
    <div className="flex flex-col gap-1.5">
      {items.map((n, i) => {
        const Icon = n.icon;
        const isOver = over === n.id && dragging && dragging !== n.id;
        return (
          <React.Fragment key={n.id}>
            <div
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", n.id);
                e.dataTransfer.effectAllowed = "move";
                setDragging(n.id);
              }}
              onDragEnd={() => {
                setDragging(null);
                setOver(null);
              }}
              onDragOver={(e) => {
                if (!dragging || dragging === n.id) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setOver(n.id);
              }}
              onDragLeave={() => setOver((o) => (o === n.id ? null : o))}
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
                opacity: dragging === n.id ? 0.4 : 1,
                cursor: "grab",
              }}
            >
              <span aria-hidden="true" className="shrink-0 text-white/25">
                <GripVertical size={13} />
              </span>
              <Icon size={15} strokeWidth={1.9} className="shrink-0" style={{ color: T.muted }} />
              <span className="min-w-0 flex-1 truncate text-[12.5px] font-bold text-white/80">
                {n.label}
              </span>
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

            {i === TAB_BAR - 1 && items.length > TAB_BAR && (
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

const TAB_BAR = 4; // four fit a phone legibly; the rest live behind "المزيد"

function BottomTabs({ items, tab, onGo, onSettings }) {
  const [more, setMore] = useState(false);
  const front = items.slice(0, TAB_BAR);
  const rest = items.slice(TAB_BAR);
  const restActive = rest.some((n) => n.id === tab);

  const glass = {
    backgroundColor: `${T.bgDeep}E0`,
    backgroundImage:
      "linear-gradient(135deg, rgba(255,255,255,0.13), rgba(255,255,255,0.035))",
    borderColor: "rgba(255,255,255,0.16)",
    backdropFilter: "blur(24px) saturate(160%)",
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
function SettingsModal({ open, onClose, state, setState }) {
  const fileRef = useRef(null);
  const [note, setNote] = useState(null); // {ok, text}
  const [ordering, setOrdering] = useState(false);

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
                onChange={(ids) => setState((s) => ({ ...s, navOrder: ids }))}
                onReset={() => setState((s) => ({ ...s, navOrder: NAV_IDS }))}
              />
            </div>
          )}
        </div>

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
      </div>
    </Modal>
  );
}

/* ==================================================================== *
 *  End-of-day reflection — only on a day that fell short
 * ==================================================================== */
function ReflectionModal({ open, onClose, onSave, pct, value, fixValue }) {
  const [distraction, setDistraction] = useState("");
  const [fix, setFix] = useState("");

  /* Seeded from the archive each time it opens. Without this, opening it a
     second time showed two empty boxes and saving overwrote what was
     already written with nothing — a reflection silently erased by the act
     of going back to read it. */
  useEffect(() => {
    if (!open) return;
    setDistraction(value || "");
    setFix(fixValue || "");
  }, [open, value, fixValue]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="وقفة آخر اليوم"
      footer={
        <>
          <Btn
            variant="default"
            className="flex-1"
            onClick={() => onSave(distraction.trim(), fix.trim())}
          >
            احفظ
          </Btn>
          <Btn variant="outline" className="flex-1" onClick={onClose}>
            لاحقًا
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <p
          className="rounded-xl border px-3.5 py-3 text-[11.5px] leading-relaxed"
          style={{
            borderColor: `${T.cta}3D`,
            background: `${T.cta}12`,
            color: T.ctaLift,
          }}
        >
          أغلقت اليوم على{" "}
          <span dir="ltr" className="font-extrabold tabular-nums">
            {pct}%
          </span>
          . لا لوم — لكن لا تمرّ عليه دون أن تعرف السبب.
        </p>
        <div>
          <label htmlFor="los-r-d" className="mb-1.5 block text-xs text-white/45">
            ما الذي شتّتني اليوم؟
          </label>
          <Field
            id="los-r-d"
            as="textarea"
            rows={3}
            autoFocus
            value={distraction}
            onChange={(e) => setDistraction(e.target.value)}
            className="resize-none"
            placeholder="اكتبه بصراحة…"
          />
        </div>
        <div>
          <label htmlFor="los-r-f" className="mb-1.5 block text-xs text-white/45">
            كيف أتجنّبه غدًا؟
          </label>
          <Field
            id="los-r-f"
            as="textarea"
            rows={3}
            value={fix}
            onChange={(e) => setFix(e.target.value)}
            className="resize-none"
            placeholder="إجراء واحد محدّد…"
          />
        </div>
      </div>
    </Modal>
  );
}

/* ==================================================================== *
 *  ROOT
 * ==================================================================== */
export default function LifeOS() {
  const [state, setState] = useState(loadState);
  /* Validated, not just defaulted. A saved id this build no longer has —
     a tab renamed or dropped, or a hand-edited preferences key — renders
     no module at all: an empty page with a working sidebar, which reads as
     the app having lost everything. */
  const [tab, setTab] = useState(() => {
    const saved = readUI().tab;
    return NAV_IDS.includes(saved) ? saved : "routine";
  });
  const [collapsed, setCollapsed] = useState(() => !!readUI().collapsed);
  const [streakToast, setStreakToast] = useState(null); // streak count when banked
  const [saveFailed, setSaveFailed] = useState(false);
  const [savedAt, setSavedAt] = useState(null); // when the last write landed
  const [settings, setSettings] = useState(false);
  const [editNav, setEditNav] = useState(false);
  const [reflect, setReflect] = useState(false);
  /* How often the evening prompt has shown today and when it may show
     again. Kept with the other per-viewer preferences, not in the archive:
     it is a reminder's snooze, not something written about the day. In
     memory only, a reload reset it and the prompt reappeared at once. */
  const [nag, setNagState] = useState(() => obj(readUI().reflect));
  const nagRef = useRef(nag);
  const setNag = useCallback((next) => {
    nagRef.current = next;
    setNagState(next);
  }, []);
  const [mirror, setMirror] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setSaveFailed(false);
      setSavedAt(Date.now());
    } catch {
      /* Swallowing this silently is how a week of work disappears without
         anyone noticing. The app keeps running — but it has to say so. */
      setSaveFailed(true);
    }
    syncOut(state);
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
    try {
      window.localStorage.setItem(
        UI_KEY,
        JSON.stringify({ tab, collapsed, reflect: nag }),
      );
    } catch {
      /* per-viewer convenience only */
    }
  }, [tab, collapsed, nag]);

  const habitsDone = state.habits.filter((h) => h.done).length;
  const discipline = state.habits.length
    ? Math.round((habitsDone / state.habits.length) * 100)
    : 0;

  /* Which habits, not just how many. Reviewing a month is asking "what was I
     actually keeping", and a bare percentage cannot answer that. Ids rather
     than labels — twenty Arabic labels a day is most of a megabyte a year,
     and the label is resolved from the live list when the day is opened. */
  const doneIds = useMemo(
    () => state.habits.filter((h) => h.done).map((h) => h.id),
    [state.habits],
  );
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
    discipline,
    doneIds,
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

  const navItems = useMemo(() => orderedNav(state.navOrder), [state.navOrder]);
  const setNavOrder = useCallback(
    (ids) => setState((s) => ({ ...s, navOrder: ids })),
    [],
  );

  const active = NAV.find((n) => n.id === tab) || NAV[0];

  return (
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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&family=Cairo:wght@400;600;700&display=swap');
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

        /* Cairo carries more weight at display sizes than Tajawal; headings
           take it, body copy stays on Tajawal for readability. */
        h1, h2, h3 {
          font-family: 'Cairo', 'Tajawal', ui-sans-serif, system-ui, sans-serif;
          letter-spacing: -0.015em;
        }
        h2 { line-height: 1.25; }

        /* Coral-to-gold on the headings that carry a screen. The clip is
           paired with a transparent fill, and nothing on this element is
           ever animated with a transform — Chrome collapses the clip and
           paints the text as a solid block if it is. Animate a wrapper. */
        /* Cloud drift: slow enough to read as weather, not motion. */
        @keyframes los-drift {
          from { transform: translateX(-20vw); }
          to   { transform: translateX(120vw); }
        }
        .los-drift {
          animation-name: los-drift;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        .los-title {
          background-image: linear-gradient(100deg, #FFCF7A 0%, #FF8A50 46%, #FF5722 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
        }

        /* Everything Tailwind marks as transitioning eases OUT instead of
           in-and-out, so hover arrives fast and settles slowly. Attribute
           selectors tie with Tailwind's own class, and this block ships
           after it in the document, so it wins without !important. */
        [class~="transition"],
        [class~="transition-all"],
        [class~="transition-colors"],
        [class~="transition-transform"],
        [class~="transition-opacity"] {
          transition-timing-function: cubic-bezier(.22, 1, .36, 1);
        }

        @keyframes losFlame { 0%,100% { transform: scale(1) rotate(-2deg); } 50% { transform: scale(1.15) rotate(3deg); } }
        .los-flame { animation: losFlame 1.6s ease-in-out infinite; }

        @keyframes losIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .los-in { animation: losIn .3s cubic-bezier(.22,1,.36,1) both; }

        @keyframes losCoverIn { from { opacity: 0; transform: scale(.94); } to { opacity: 1; transform: scale(1); } }
        .los-cover-in { animation: losCoverIn .35s cubic-bezier(.22,1,.36,1) both; }

        /* --- reward loop: the payoff for finishing something ------------ */
        @keyframes losReward {
          0%   { transform: scale(1);     box-shadow: 0 0 0 0 ${T.primary}B3; }
          30%  { transform: scale(1.045); box-shadow: 0 0 22px 6px ${T.primary}66; }
          60%  { transform: scale(0.982); box-shadow: 0 0 30px 10px ${T.primary}26; }
          100% { transform: scale(1);     box-shadow: 0 0 0 0 ${T.primary}00; }
        }
        .los-reward { animation: losReward .7s cubic-bezier(.34,1.56,.64,1) forwards; }

        @keyframes losPop {
          0%   { transform: scale(1)    rotate(0deg); }
          35%  { transform: scale(1.35) rotate(-8deg); }
          62%  { transform: scale(0.9)  rotate(3deg); }
          100% { transform: scale(1.06) rotate(0deg); }
        }
        .los-pop { animation: losPop .52s cubic-bezier(.34,1.56,.64,1) forwards; }

        @keyframes losRipple {
          0%   { opacity: .95; transform: scale(1); }
          100% { opacity: 0;   transform: scale(2.9); }
        }
        .los-ripple { animation: losRipple .64s cubic-bezier(.22,1,.36,1) forwards; }

        @keyframes losHalo { 0%,100% { opacity: .38; transform: scale(1); } 50% { opacity: .62; transform: scale(1.06); } }
        .los-halo { animation: losHalo 2.4s ease-in-out infinite; }

        @keyframes losThrob { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        .los-throb { animation: losThrob 2.4s ease-in-out infinite; }

        /* Hover lives in CSS so React never fights an imperatively-set style. */
        .los-nav:not(.los-nav-on):hover {
          background: rgba(255,255,255,0.07) !important;
          color: ${T.fg} !important;
        }
        .los-nav-on:hover { filter: brightness(1.12); }
        .los-btn:active { filter: brightness(.95); }
        .los-tab:active { transform: scale(.93); }

        @media (prefers-reduced-motion: reduce) {
          .los-flame, .los-in, .los-cover-in, .los-reward,
          .los-pop, .los-ripple, .los-halo, .los-throb, .los-drift {
            animation: none !important;
          }
          .los-btn:hover { transform: none !important; }
        }
      `}</style>

      <div className="flex min-h-screen">
        {/* ---------- sidebar (desktop) ---------- */}
        <aside
          className="sticky top-0 hidden h-screen shrink-0 flex-col border-l p-4 transition-all duration-300 lg:flex"
          style={{
            width: collapsed ? 80 : 268,
            borderColor: T.border,
            background: "var(--los-veil-strong, rgba(255,255,255,0.045))",
            backdropFilter: "blur(18px) saturate(150%)",
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
                {editNav ? "اسحب أو استخدم الأسهم" : "التنقّل"}
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
              onChange={setNavOrder}
              onReset={() => setNavOrder(NAV_IDS)}
            />
          ) : (
            <NavList items={navItems} tab={tab} onGo={go} showLabels={!collapsed} />
          )}

          <div className="mt-auto space-y-3">
            {!collapsed && (
              <div
                className="rounded-2xl border p-4 text-center"
                style={{ borderColor: T.border, background: T.card }}
              >
                <p className="text-[10px] text-white/35">مؤشر اليوم</p>
                <p
                  className="text-3xl font-extrabold tabular-nums"
                  style={{
                    color: discipline >= STREAK_TARGET ? T.primary : T.accent,
                  }}
                >
                  {discipline}%
                </p>
                <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-white/40">
                  <Flame
                    size={13}
                    style={{
                      color: discipline >= STREAK_TARGET ? T.ember : "rgba(255,255,255,.25)",
                    }}
                  />
                  {streak} يوم متتالٍ
                </div>
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
              backdropFilter: "blur(18px) saturate(150%)",
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
                  onOpenMirror={() => setMirror(true)}
                  onOpenReflect={() => setReflect(true)}
                  onOpenSettings={() => setSettings(true)}
                  onGoGoals={() => go("goals")}
                  reflected={alreadyReflected}
                />
              )}
              {tab === "agenda" && (
                <AgendaModule state={state} setState={setState} onGo={go} />
              )}
              {tab === "uni" && (
                <UniModule state={state} setState={setState} onGo={go} />
              )}
              {tab === "career" && (
                <CareerModule state={state} setState={setState} />
              )}
              {tab === "matrix" && (
                <MatrixModule state={state} setState={setState} />
              )}
              {tab === "deep" && <DeepWorkModule state={state} setState={setState} />}
              {tab === "goals" && <GoalsModule state={state} setState={setState} />}
              {tab === "pipeline" && (
                <PipelineModule state={state} setState={setState} />
              )}
              {tab === "tactical" && (
                <TacticalModule state={state} setState={setState} />
              )}
              {tab === "finance" && (
                <FinanceModule state={state} setState={setState} />
              )}
              {tab === "prompts" && (
                <PromptsModule state={state} setState={setState} />
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
            </div>

            <footer className="mt-14 text-center text-[11px] text-white/20">
              2027 Life OS · الانضباط حرية مؤجّلة
            </footer>
          </div>
        </main>
      </div>

      <BottomTabs
        items={navItems}
        tab={tab}
        onGo={go}
        onSettings={() => setSettings(true)}
      />

      {/* A write that fails has to be loud. Everything on screen is still
          correct — it just is not on disk, and only the user can decide what
          to do about that. */}
      {saveFailed && (
        <div
          className="los-in fixed inset-x-3 z-[80] flex flex-wrap items-center justify-center gap-3 rounded-2xl border px-4 py-3 text-center shadow-2xl sm:inset-x-auto sm:left-1/2 sm:w-[min(560px,92vw)] sm:-translate-x-1/2"
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

      {/* streak-banked toast */}
      {streakToast !== null && (
        <div
          className="los-in pointer-events-none fixed bottom-28 left-1/2 z-[70] -translate-x-1/2 flex items-center gap-3 rounded-2xl border px-6 py-4 shadow-2xl lg:bottom-8"
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
              <span dir="ltr" className="font-bold tabular-nums" style={{ color: T.ember }}>{streakToast}</span> يوم متتالٍ
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<LifeOS />);
