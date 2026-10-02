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
  { id: "career", label: "مسار التوظيف", short: "التوظيف", icon: Briefcase },
  { id: "matrix", label: "مصفوفة المهام", short: "المهام", icon: LayoutGrid },
  { id: "deep", label: "العمل العميق", short: "التركيز", icon: Timer },
  { id: "goals", label: "أهداف ٢٠٢٧", short: "الأهداف", icon: Flag },
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

/* --- the six pillars of 2027 ----------------------------------------- */
const PILLARS = [
  { id: "faith", label: "الإيماني", icon: MoonStar, tint: "#9D5CFF" },
  { id: "health", label: "الصحي", icon: HeartPulse, tint: "#FF7A45" },
  { id: "career", label: "المهني", icon: Briefcase, tint: "#00C2FF" },
  { id: "money", label: "المالي", icon: Wallet, tint: "#FFB020" },
  { id: "social", label: "الاجتماعي", icon: Users, tint: "#FF4D8D" },
  { id: "self", label: "الشخصي", icon: Sparkles, tint: "#5B8CFF" },
];

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
const SCHEMA = 14;
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

/* Whole days between two day keys. Parsed at local midnight on purpose —
   `new Date("2027-01-05")` is UTC, which rolls the count a day early for
   anyone east of Greenwich. */
const daysBetween = (fromKey, toKey = dayKey()) => {
  const a = new Date(`${fromKey}T00:00:00`);
  const b = new Date(`${toKey}T00:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  return Math.max(0, Math.round((b - a) / 86400000));
};

/* The one place a bad habit's fields are written — add form, migration and
   import all pass through here, so the shape cannot drift between them. */
const badHabitShape = (b = {}) => ({
  id: b.id || uid(),
  title: typeof b.title === "string" ? b.title : "",
  startDate: typeof b.startDate === "string" ? b.startDate : dayKey(),
  costType: b.costType === "time" ? "time" : "money",
  costPerDay: Number.isFinite(Number(b.costPerDay))
    ? Math.max(0, Number(b.costPerDay))
    : 0,
  replacement: typeof b.replacement === "string" ? b.replacement : "",
  logs: Array.isArray(b.logs) ? b.logs : [],
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
const bookShape = (b = {}) => ({
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

const sumPages = (log) =>
  log.reduce((n, r) => n + (Number.isFinite(r.pages) ? r.pages : 0), 0);

/* Days in a row, counting back from today, on which the goal was met. A
   streak that ended yesterday still counts today — the day is not over. */
function readStreak(log, goal) {
  if (!log.length || goal <= 0) return 0;
  const byDay = new Map();
  for (const r of log)
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

const SEED_GOALS = [
  { text: "ختم القرآن تدبّرًا مرّة", pillar: "faith", quarter: "q1" },
  { text: "قيام الليل ٣ مرّات أسبوعيًّا", pillar: "faith", quarter: "q2" },
  { text: "حفظ جزء عمّ إتقانًا", pillar: "faith", quarter: "q3" },
  { text: "المحافظة على الصلوات في وقتها", pillar: "faith", quarter: "q4" },
  { text: "نادي ٤ مرّات أسبوعيًّا بلا انقطاع", pillar: "health", quarter: "q1" },
  { text: "الوصول إلى وزن صحّي وثباته", pillar: "health", quarter: "q3" },
  { text: "نوم ٧ ساعات ثابتة كل ليلة", pillar: "health", quarter: "q2" },
  { text: "اجتياز اختبار STEP بدرجة عالية", pillar: "career", quarter: "q1" },
  { text: "إتقان الإنجليزية محادثةً", pillar: "career", quarter: "q3" },
  { text: "إنهاء مشروع تخرّج يُفتخر به", pillar: "career", quarter: "q4" },
  { text: "بناء صندوق طوارئ يغطّي ٦ أشهر", pillar: "money", quarter: "q2" },
  { text: "ادّخار ٢٠٪ من كل دخل", pillar: "money", quarter: "q3" },
  { text: "مصدر دخل ثانٍ", pillar: "money", quarter: "q4" },
  { text: "صلة الرحم أسبوعيًّا", pillar: "social", quarter: "q1" },
  { text: "بناء دائرة صحبة صالحة", pillar: "social", quarter: "q3" },
  { text: "قراءة ٦ كتب", pillar: "self", quarter: "q3" },
  { text: "تقليل وقت الشاشات إلى ساعة يوميًّا", pillar: "self", quarter: "q2" },
  { text: "تعلّم مهارة جديدة كليًّا", pillar: "self", quarter: "q4" },
].map((g) => ({ id: uid(), done: false, ...g }));

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
    aim: "ملف يمرّ أنظمة الفرز، وحضور مهني يُعثر عليه",
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
      "سجّل في منصّات التوظيف الثلاث الكبرى وأكمل الملف فيها ١٠٠٪",
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

/* Quick, professional, and done before the day gets a say. */
const AM_ROUTINE = [
  { id: "news", label: "راجع أخبار القطاع عشر دقائق", icon: Radar, tint: T.sky },
  { id: "connect", label: "أرسل طلب تواصل واحدًا برسالة مخصّصة", icon: Users, tint: T.violet },
  { id: "apply", label: "قدّم على وظيفة واحدة مطابقة — واحدة لا عشر", icon: Send, tint: T.cta },
  { id: "keyword", label: "حدّث كلمة مفتاحية واحدة في السيرة أو الملف", icon: FileText, tint: T.indigo },
  { id: "follow", label: "تابع تقديمًا قديمًا أو ردًّا معلّقًا", icon: Mail, tint: T.accent },
  { id: "dress", label: "البس كأنك ذاهب إلى العمل", icon: Briefcase, tint: T.primary },
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
const sprintShape = (s = {}) => ({
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

const appShape = (a = {}) => ({
  id: a.id || uid(),
  company: typeof a.company === "string" ? a.company : "",
  role: typeof a.role === "string" ? a.role : "",
  stage: APP_STAGES.some((s) => s.id === a.stage) ? a.stage : "sent",
  sentAt: typeof a.sentAt === "string" ? a.sentAt : dayKey(),
  touchedAt: typeof a.touchedAt === "string" ? a.touchedAt : null,
  note: typeof a.note === "string" ? a.note : "",
});

const storyShape = (s = {}) => ({
  id: s.id || uid(),
  title: typeof s.title === "string" ? s.title : "",
  situation: typeof s.situation === "string" ? s.situation : "",
  task: typeof s.task === "string" ? s.task : "",
  action: typeof s.action === "string" ? s.action : "",
  result: typeof s.result === "string" ? s.result : "",
});

const careerShape = (c = {}) => ({
  startedAt: typeof c.startedAt === "string" ? c.startedAt : null,
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
function dailyStreak(log, field, need) {
  const met = new Set(
    (log || []).filter((e) => (e[field] || []).length >= need).map((e) => e.date),
  );
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
  { id: "plan", label: "خطة التسعين يومًا", max: 30, tint: T.cta },
  { id: "skill", label: "سلسلة الحصص", max: 20, tint: T.primary },
  { id: "apps", label: "تقديمات ٣٠ يومًا", max: 20, tint: T.indigo },
  { id: "am", label: "روتين الصباح", max: 10, tint: T.accent },
  { id: "sprint", label: "هجمات الشركات", max: 10, tint: T.violet },
  { id: "story", label: "بنك القصص", max: 10, tint: T.rose },
];

function readiness(c) {
  const live = careerWeekNo(c);
  const reached = CAREER_WEEKS.filter((w) => w.w <= live).map((w) => w.w);
  const planTotal = missionCount(reached);
  const share = (hit, cap) => Math.min(1, cap ? hit / cap : 0);

  const sent30 = (c.apps || []).filter((a) => daysBetween(a.sentAt) <= 30).length;
  const attacks = (c.sprints || []).reduce((n, s) => n + sprintDone(s), 0);

  const parts = {
    plan: c.startedAt ? share(missionsIn(c.missions, reached), planTotal) : 0,
    skill: share(dailyStreak(c.log, "skills", SKILL_TARGET), STREAK_CEIL),
    apps: share(sent30, 12),
    am: share(dailyStreak(c.log, "am", 4), STREAK_CEIL),
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

const freshState = (carry = {}) => ({
  schema: SCHEMA,
  date: dayKey(),
  habits: (carry.habits || SEED_HABITS).map((h) => ({ ...h, done: false })),
  tasks: (carry.tasks || SEED_TASKS).map((t) => ({ ...t, done: false })),
  books: carry.books || SEED_BOOKS,
  goals: carry.goals || SEED_GOALS,
  sessions: carry.sessions || [],
  income: carry.income || [],
  ventures: carry.ventures || [],
  prompts: carry.prompts || SEED_PROMPTS,
  reviews: carry.reviews || [],
  pipeline: carry.pipeline || SEED_PIPELINE,
  badHabits: carry.badHabits || [],
  /* Entirely date-derived inside, so it carries across a rollover whole —
     the two daily checklists empty themselves by reading today's log row. */
  career: careerShape(carry.career),
  navOrder: carry.navOrder || NAV_IDS,
  quotes: carry.quotes || SEED_QUOTES(),
  reads: carry.reads || SEED_READS(),
  reading: carry.reading || [],
  readGoal: carry.readGoal ?? READ_GOAL_DEFAULT,
  cueImage: carry.cueImage ?? null,
  history: carry.history || [],
  streakBase: carry.streakBase || 0,
  bestStreak: carry.bestStreak || 0,
  dayBanked: false,
});

/* Reshapes a saved payload without discarding anything the user typed. */
function migrate(saved) {
  const from = saved.schema || 0;
  let habits = saved.habits;

  if (from < 4 && Array.isArray(habits)) {
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
  let goals = saved.goals;
  if (from < 5 && Array.isArray(goals)) {
    const here = currentQuarter();
    goals = goals.map((g) => (g.quarter ? g : { ...g, quarter: here }));
  }

  /* Top up with the routines added in schema 6, matching on label so a
     profile that already has one (or renamed it) never gets a duplicate. */
  let tasks = saved.tasks;
  if (from < 6) {
    if (Array.isArray(habits)) {
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
    if (Array.isArray(tasks)) {
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
  if (from < 8 && Array.isArray(habits)) {
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
  let quotes = saved.quotes;
  if (!Array.isArray(quotes) || quotes.length === 0) quotes = SEED_QUOTES();
  else quotes = quotes.map((q) => (q.id ? q : { ...q, id: uid() }));

  let reads = saved.reads;
  if (!Array.isArray(reads) || reads.length === 0) reads = SEED_READS();
  else reads = reads.map((q) => (q.id ? q : { ...q, id: uid() }));

  /* Schema 10 gave every book a workspace. Run the existing rows through
     bookShape so the new fields appear with sane defaults — spread last is
     wrong here, the saved values must win over the defaults. */
  let books = saved.books;
  if (Array.isArray(books)) {
    books = books.map((b) => ({
      ...bookShape(b),
      notes: Array.isArray(b.notes) ? b.notes : [],
    }));
  }

  /* Schema 11 links habits to books. Existing habits are ordinary unless
     they are the reading one, which is pointed at the active book so the
     feature works on the first open instead of after a settings hunt. */
  if (from < 11 && Array.isArray(habits)) {
    habits = habits.map((h) =>
      h.book === undefined
        ? { ...h, book: h.label === "قراءة" ? READ_ACTIVE : null }
        : h,
    );
  }

  /* Schema 12 adds the habit breaker. An older payload has no list at all;
     one written by a newer build is run through badHabitShape so a row that
     lost a field to a hand-edited backup comes back whole. */
  const badHabits = Array.isArray(saved.badHabits)
    ? saved.badHabits.map(badHabitShape)
    : [];

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
  const career = careerShape(saved.career);

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
    navOrder,
    reading: Array.isArray(saved.reading) ? saved.reading : [],
    readGoal: Number.isFinite(saved.readGoal)
      ? saved.readGoal
      : READ_GOAL_DEFAULT,
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
  career: s.career,
  navOrder: s.navOrder,
  quotes: s.quotes,
  reads: s.reads,
  reading: s.reading,
  readGoal: s.readGoal,
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
  ...rest
}) {
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
    <button
      className={`los-btn inline-flex items-center justify-center rounded-xl border font-bold transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${sizes[size]} ${className}`}
      style={{ ...variants[variant], ...style }}
      {...rest}
    >
      {children}
    </button>
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

function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="los-in relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border p-6 sm:rounded-3xl"
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
          textDecoration: checked ? "line-through" : "none",
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

function RoutineModule({
  state,
  setState,
  discipline,
  streak,
  quote,
  onShuffleQuote,
  mirror,
  onOpenMirror,
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
                        setEditing({ id: h.id, label: h.label, group: h.group })
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
 *  MODULE — 2027 goals, by pillar
 * ==================================================================== */
function GoalRow({ goal, onToggle, onEdit, onDelete }) {
  const [burst, fireBurst] = useBurst(700);

  const handle = () => {
    if (!goal.done) fireBurst();
    onToggle();
  };

  return (
    <div
      className={`group flex items-center gap-1 rounded-lg border transition-all duration-200${
        burst ? " los-reward" : ""
      }`}
      style={{
        borderColor: burst ? T.primary : "transparent",
        background: burst
          ? `${T.primary}26`
          : goal.done
          ? `${T.primary}0F`
          : "transparent",
      }}
    >
      {/* Emerald, never the pillar's pastel — done is done, and it has to
          read that way at a glance. The pillar colours its own chrome. */}
      <Checkbox
        checked={goal.done}
        onToggle={handle}
        label={goal.text}
        tint={T.primary}
        size="sm"
      />
      <button
        onClick={onEdit}
        aria-label={`تعديل ${goal.text}`}
        className="shrink-0 rounded p-1.5 text-white/25 opacity-40 transition-all hover:text-white/70 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <Pencil size={13} />
      </button>
      <button
        onClick={onDelete}
        aria-label={`حذف ${goal.text}`}
        className="shrink-0 rounded p-1.5 text-white/25 opacity-40 transition-all hover:text-red-400 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

function GoalsModule({ state, setState }) {
  const [editing, setEditing] = useState(null); // {id?, text, pillar, quarter}
  /* Opens on the 90 days you are actually in — the whole point of chunking. */
  const [quarter, setQuarter] = useState(currentQuarter);

  const all = state.goals || [];
  const goals = all.filter((g) => g.quarter === quarter);
  const done = goals.filter((g) => g.done).length;
  const pct = goals.length ? Math.round((done / goals.length) * 100) : 0;
  const meta = QUARTERS.find((q) => q.id === quarter) || QUARTERS[0];
  const live = quarter === currentQuarter();
  /* Counted from date boundaries, not the current clock time — on the last
     day of a quarter you still have that whole day, so the floor is 1. */
  const daysLeft = useMemo(() => {
    if (!live) return null;
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(
      now.getFullYear(),
      Math.floor(now.getMonth() / 3) * 3 + 3,
      0,
    );
    return Math.max(1, Math.round((end - midnight) / 86400000) + 1);
  }, [live]);

  const toggle = (id) =>
    setState((s) => ({
      ...s,
      goals: s.goals.map((g) => (g.id === id ? { ...g, done: !g.done } : g)),
    }));

  const remove = (id) =>
    setState((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) }));

  const save = () => {
    const text = editing.text.trim();
    if (!text) return;
    setState((s) => ({
      ...s,
      goals: editing.id
        ? s.goals.map((g) =>
            g.id === editing.id
              ? { ...g, text, pillar: editing.pillar, quarter: editing.quarter }
              : g,
          )
        : [
            ...s.goals,
            {
              id: uid(),
              text,
              pillar: editing.pillar,
              quarter: editing.quarter,
              done: false,
            },
          ],
    }));
    setQuarter(editing.quarter);
    setEditing(null);
  };

  return (
    <div className="space-y-7">
      <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="min-w-0">
          <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">أهداف ٢٠٢٧</h2>
          <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/40">
            تسعون يومًا في كل مرّة. ركّز على الربع الذي تعيشه، ودع البقيّة تنتظر
            دورها.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Btn
              variant="default"
              size="sm"
              onClick={() =>
                setEditing({ text: "", pillar: "faith", quarter })
              }
            >
              <Plus size={14} strokeWidth={3} /> هدف جديد
            </Btn>
            <Badge tint={pct === 100 && goals.length ? T.primary : meta.tint}>
              <span dir="ltr" className="tabular-nums">
                {done}/{goals.length}
              </span>
              {" مُحقَّق"}
            </Badge>
            {daysLeft !== null && (
              <Badge tint={T.cta}>
                {daysLeft === 1 ? (
                  "بقي يوم واحد"
                ) : daysLeft === 2 ? (
                  "بقي يومان"
                ) : (
                  <>
                    {daysLeft <= 10 ? "بقيت " : "بقي "}
                    <span dir="ltr" className="tabular-nums">
                      {daysLeft}
                    </span>
                    {daysLeft <= 10 ? " أيام" : " يومًا"}
                  </>
                )}
              </Badge>
            )}
          </div>
        </div>
        <ProgressRing value={pct} size={150} stroke={11} />
      </Card>

      {/* quarter tabs */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {QUARTERS.map((q) => {
          const on = q.id === quarter;
          const now = q.id === currentQuarter();
          const list = all.filter((g) => g.quarter === q.id);
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {PILLARS.map((p) => {
          const list = goals.filter((g) => g.pillar === p.id);
          const hit = list.filter((g) => g.done).length;
          const complete = list.length > 0 && hit === list.length;
          const Icon = p.icon;
          return (
            <Card key={p.id} className="p-6 sm:p-7">
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
                    width: list.length ? `${(hit / list.length) * 100}%` : "0%",
                    backgroundImage: complete
                      ? `linear-gradient(90deg, ${T.primary}, ${T.primaryLift})`
                      : `linear-gradient(90deg, ${p.tint}, ${p.tint}AA)`,
                    boxShadow: `0 0 12px ${complete ? T.primary : p.tint}99`,
                  }}
                />
              </div>

              <div className="mt-2 space-y-0.5">
                {list.length === 0 ? (
                  <p className="py-3 text-center text-[11px] text-white/25">
                    لا أهداف في هذه الركيزة بعد
                  </p>
                ) : (
                  list.map((g) => (
                    <GoalRow
                      key={g.id}
                      goal={g}
                      onToggle={() => toggle(g.id)}
                      onEdit={() =>
                        setEditing({ id: g.id, text: g.text, pillar: g.pillar })
                      }
                      onDelete={() => remove(g.id)}
                    />
                  ))
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "تعديل الهدف" : "هدف جديد"}
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
            <label htmlFor="los-g-text" className="mb-1.5 block text-xs text-white/45">
              الهدف
            </label>
            <Field
              id="los-g-text"
              autoFocus
              value={editing?.text || ""}
              onChange={(e) => setEditing((s) => ({ ...s, text: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && save()}
              placeholder="مثال: ختم القرآن تدبّرًا مرّتين"
            />
          </div>
          <div>
            <span className="mb-2 block text-xs text-white/45">الربع</span>
            <div className="grid grid-cols-2 gap-2">
              {QUARTERS.map((q) => {
                const on = editing?.quarter === q.id;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setEditing((s) => ({ ...s, quarter: q.id }))}
                    aria-pressed={on}
                    className="rounded-xl border px-3 py-2.5 text-xs font-bold transition-all"
                    style={{
                      borderColor: on ? `${q.tint}80` : T.border,
                      background: on ? `${q.tint}1F` : "rgba(255,255,255,0.03)",
                      color: on ? q.tint : T.muted,
                    }}
                  >
                    {q.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <span className="mb-2 block text-xs text-white/45">الركيزة</span>
            <div className="grid grid-cols-2 gap-2">
              {PILLARS.map((p) => {
                const on = editing?.pillar === p.id;
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setEditing((s) => ({ ...s, pillar: p.id }))}
                    aria-pressed={on}
                    className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition-all"
                    style={{
                      borderColor: on ? `${p.tint}80` : T.border,
                      background: on ? `${p.tint}1F` : "rgba(255,255,255,0.03)",
                      color: on ? p.tint : T.muted,
                    }}
                  >
                    <Icon size={14} strokeWidth={2} />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>
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
function RelapseModal({ open, habit, onClose, onConfirm }) {
  const [trigger, setTrigger] = useState("");
  const [feeling, setFeeling] = useState("");
  const [owned, setOwned] = useState(false);

  useEffect(() => {
    if (open) {
      setTrigger("");
      setFeeling("");
      setOwned(false);
    }
  }, [open, habit?.id]);

  if (!habit) return null;

  const days = cleanDays(habit);
  const kind = costType(habit.costType);
  const lost = Math.round(bleedSaved(habit));
  const ready = trigger.trim() && feeling.trim() && owned;

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
              onConfirm({ trigger: trigger.trim(), feeling: feeling.trim() })
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
            ما المحفّز؟ أين كنت ومع من وماذا حدث قبلها مباشرة؟
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
          <label className="block text-[11px] font-bold" style={{ color: T.muted }}>
            ما شعورك الآن، بصدق؟
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

/* Add and edit share one form — two forms for one shape is how the two
   drift apart. The replacement plan is required: a habit you are quitting
   without something to put in its place is a vacuum, not a plan. */
function BadHabitFormModal({ open, draft, setDraft, onSave, onClose }) {
  if (!draft) return null;
  const ready = draft.title.trim() && draft.replacement.trim();

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

function BadHabitCard({ habit, onRelapse, onEdit, onDelete }) {
  const [openLogs, setOpenLogs] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const days = cleanDays(habit);
  const logs = habit.logs || [];
  const best = bestRun(habit);
  const atGate = MILESTONES.some((m) => m.d === days);
  const tint = days >= MILESTONE_CAP ? T.primary : days >= 7 ? T.accent : T.cta;

  return (
    <Card
      className="group flex flex-col p-5 sm:p-6"
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

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Btn variant="danger" size="sm" onClick={onRelapse}>
          <HeartCrack size={13} /> سجّل انتكاسة
        </Btn>
        {logs.length > 0 && (
          <button
            onClick={() => setOpenLogs((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] transition-colors hover:text-white/80"
            style={{ color: T.faint }}
          >
            {openLogs ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            <span dir="ltr" className="tabular-nums">
              {logs.length}
            </span>
            {" انتكاسة مسجّلة"}
          </button>
        )}
      </div>

      {openLogs && logs.length > 0 && (
        <div className="los-in mt-4 space-y-2.5">
          <p className="text-[10.5px]" style={{ color: T.faint }}>
            اقرأ المحفّزات متتالية — النمط الذي يتكرّر هو عدوّك الحقيقي، لا
            العادة نفسها.
          </p>
          {[...logs].reverse().map((l) => (
            <div
              key={l.id}
              className="rounded-xl border px-3.5 py-3"
              style={{ borderColor: T.border, background: "rgba(255,255,255,0.04)" }}
            >
              <div className="flex items-center gap-2">
                <span dir="ltr" className="text-[10.5px] tabular-nums" style={{ color: T.faint }}>
                  {l.at}
                </span>
                <Badge tint={T.danger}>
                  {"بعد "}
                  <span dir="ltr" className="tabular-nums">
                    {l.days}
                  </span>
                  {` ${dayWord(l.days)}`}
                </Badge>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-white/80">
                <span style={{ color: T.ember }}>المحفّز: </span>
                {l.trigger}
              </p>
              {l.feeling && (
                <p className="mt-1 text-[12px] leading-relaxed text-white/60">
                  <span style={{ color: T.violet }}>الشعور: </span>
                  {l.feeling}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function BreakerModule({ state, setState }) {
  const list = state.badHabits || [];
  const [draft, setDraft] = useState(null);
  const [relapsing, setRelapsing] = useState(null);

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

  const confirmRelapse = ({ trigger, feeling }) => {
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
                {
                  id: uid(),
                  at: dayKey(),
                  days: cleanDays(b),
                  trigger,
                  feeling,
                },
              ],
              startDate: dayKey(),
            }
          : b,
      ),
    }));
    setRelapsing(null);
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
              onRelapse={() => setRelapsing(h)}
              onEdit={() => openEdit(h)}
              onDelete={() => remove(h.id)}
            />
          ))}
        </div>
      )}

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
        onClose={() => setRelapsing(null)}
        onConfirm={confirmRelapse}
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

function CareerToday({ state, setState }) {
  const career = state.career;
  const today = careerToday(career.log);
  const skills = today.skills || [];
  const am = today.am || [];

  const [pick, setPick] = useState(null); // block id holding the timer
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
  const amStreak = dailyStreak(career.log, "am", 4);
  const amPct = Math.round((am.length / AM_ROUTINE.length) * 100);
  const hit = skills.length >= SKILL_TARGET;

  return (
    <div className="space-y-5">
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
        <p className="mt-1.5 text-[11.5px]" style={{ color: T.faint }}>
          ست خطوات قبل أن يأخذ اليوم رأيه فيك. أربع منها تحفظ السلسلة.
        </p>

        <div className="mt-4 space-y-2">
          {AM_ROUTINE.map((item) => {
            const Icon = item.icon;
            const on = am.includes(item.id);
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-all duration-300"
                style={{
                  borderColor: on ? `${T.primary}4D` : T.border,
                  background: on ? `${T.primary}0F` : "rgba(255,255,255,0.03)",
                }}
              >
                <Icon size={15} className="shrink-0" style={{ color: item.tint }} />
                <Checkbox
                  checked={on}
                  onToggle={() => toggleAm(item.id)}
                  label={item.label}
                  tint={T.primary}
                  size="sm"
                />
              </div>
            );
          })}
        </div>
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

function CareerModule({ state, setState }) {
  const [view, setView] = useState("today");
  const career = state.career;

  const start = () =>
    setState((s) => ({ ...s, career: { ...s.career, startedAt: dayKey() } }));

  return (
    <div className="space-y-7">
      <ReadinessCard career={career} onStart={start} />

      <div className="grid grid-cols-4 gap-2">
        {CAREER_VIEWS.map((v) => {
          const on = v.id === view;
          const Icon = v.icon;
          return (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              aria-pressed={on}
              className="flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 transition-all duration-200"
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
              <span className="text-[11.5px] font-extrabold">{v.label}</span>
            </button>
          );
        })}
      </div>

      <div key={view} className="los-in">
        {view === "today" && <CareerToday state={state} setState={setState} />}
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
                    : `${cell.ds} — ${cell.pct}٪${note ? " — فيه وقفة" : ""}`
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
                {note && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
                    style={{ background: T.cta, boxShadow: `0 0 5px ${T.cta}` }}
                  />
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

  const Pip = () => (
    <span
      aria-hidden="true"
      className="absolute top-0.5 h-[3px] w-7 rounded-full"
      style={{ background: T.ctaLift, boxShadow: `0 0 10px 1px ${T.cta}` }}
    />
  );

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
      setState(migrate({ ...freshState(), ...parsed }));
      setNote({ ok: true, text: "تم استيراد البيانات واستبدال الحالي." });
    } catch {
      setNote({ ok: false, text: "تعذّرت قراءة الملف — تأكّد أنه JSON سليم." });
    }
  };

  const counts = [
    { k: "عادة", n: state.habits?.length || 0 },
    { k: "مهمة", n: state.tasks?.length || 0 },
    { k: "هدف", n: state.goals?.length || 0 },
    { k: "كتاب", n: state.books?.length || 0 },
  ];

  return (
    <Modal open={open} onClose={onClose} title="الإعدادات والنسخ الاحتياطي">
      <div className="space-y-5">
        <div
          className="grid grid-cols-4 gap-2 rounded-2xl border p-3 text-center"
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
function ReflectionModal({ open, onClose, onSave, pct }) {
  const [distraction, setDistraction] = useState("");
  const [fix, setFix] = useState("");

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
  const [tab, setTab] = useState(() => readUI().tab || "routine");
  const [collapsed, setCollapsed] = useState(() => !!readUI().collapsed);
  const [streakToast, setStreakToast] = useState(null); // streak count when banked
  const [saveFailed, setSaveFailed] = useState(false);
  const [settings, setSettings] = useState(false);
  const [editNav, setEditNav] = useState(false);
  const [reflect, setReflect] = useState(false);
  const [reflectDone, setReflectDone] = useState(null); // the day already asked about
  const [mirror, setMirror] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setSaveFailed(false);
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
      window.localStorage.setItem(UI_KEY, JSON.stringify({ tab, collapsed }));
    } catch {
      /* per-viewer convenience only */
    }
  }, [tab, collapsed]);

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
        },
      ].slice(-HISTORY_CAP);
      return { ...s, history: next };
    });
  }, [rollCall, discipline, doneIds, roster]);

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

  /* After 20:00, on a day that fell short, once — and never again if today's
     reflection is already written. Polled because the app is often left open. */
  const todayEntry = (state.history || []).find((h) => h.date === dayKey());
  const alreadyReflected = !!(todayEntry?.distraction || todayEntry?.fix);
  useEffect(() => {
    /* Keyed to the day, not to the session: the window stays open for days
       at a time, and a plain "already asked" flag would mean the evening
       prompt fired once and never again. */
    if (alreadyReflected || reflectDone === dayKey()) return;
    const check = () => {
      if (new Date().getHours() >= 20 && discipline < STREAK_TARGET) {
        setReflect(true);
        setReflectDone(dayKey());
      }
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
  }, [alreadyReflected, reflectDone, discipline]);

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
                  onOpenMirror={() => setMirror(true)}
                />
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
