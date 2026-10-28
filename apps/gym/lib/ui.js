/* --- عناصر مشتركة بين كل شاشات النادي -------------------------------------
 *  نفس دور `life-shared.jsx` في Life OS: بدائل العرض التي تستخدمها كل شاشة،
 *  في مكان واحد حتى لا تختلف بطاقتان عن شكلهما بضع بكسلات. لا حالة هنا، كل
 *  شيء دالة عرض بحتة.
 * --------------------------------------------------------------------- */
export const h = React.createElement;

export const T = {
  primary: "#10B981",
  danger: "#FF3B5C",
  accent: "#FFB020",
  sky: "#00C2FF",
  violet: "#9D5CFF",
  ember: "#FF7A45",
  cta: "#FF5722",
  ctaLift: "#FF8A50",
  muted: "rgba(253,248,246,0.58)",
  faint: "rgba(253,248,246,0.34)",
  fg: "#FDF8F6",
};
export const SPORT_TINT_KEYS = ["primary", "danger", "accent", "sky", "violet", "ember"];
export const tintOf = (key) => T[key] || T.primary;

export const ar = (n) => new Intl.NumberFormat("ar-SA").format(Math.round(Number(n) || 0));

export const minsWord = (m) => {
  const v = Math.max(0, Math.round(Number(m) || 0));
  if (!v) return "٠ دقيقة";
  if (v < 60) return `${ar(v)} دقيقة`;
  const hh = Math.floor(v / 60);
  const r = v % 60;
  return r ? `${ar(hh)}س ${ar(r)}د` : `${ar(hh)} ساعة`;
};

/* خط الوزن. مقياسه من قراءاته لا من صفر — فرق كيلوين على محور يبدأ من
   الصفر خطٌّ مستقيم لا يقول شيئاً. */
/* `key` اختياري حتى يُستخدم على أي حقل رقمي بالقائمة (الوزن افتراضياً،
   ونسبة الدهون بتمرير `"fat"`) بلا نسخة ثانية من نفس الدالة. */
export const sparkPoints = (weighs, w = 560, hgt = 120, key = "kg") => {
  const list = [...weighs].reverse().filter((x) => x[key] !== null);
  if (list.length < 2) return null;
  const vals = list.map((x) => x[key]);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const span = hi - lo || 1;
  const pad = 10;
  return list
    .map((x, i) => {
      const px = (i / (list.length - 1)) * w;
      const py = pad + (1 - (x[key] - lo) / span) * (hgt - pad * 2);
      return `${Math.round(px)},${Math.round(py)}`;
    })
    .join(" ");
};

export function Card(props) {
  return h(
    "div",
    { className: "card" + (props.className ? " " + props.className : ""), style: props.style },
    props.children,
  );
}

export function Btn(props) {
  const { outline, danger, ...rest } = props;
  const cls = danger ? "btn-danger" : outline ? "btn-outline" : "btn";
  return h("button", { ...rest, className: cls + (rest.className ? " " + rest.className : "") }, rest.children);
}

export function Field(props) {
  const Tag = props.as || "input";
  const { as, ...rest } = props;
  return h(Tag, { ...rest, className: "field" + (rest.className ? " " + rest.className : "") });
}

export function Pill({ active, tint, onClick, children }) {
  return h(
    "button",
    {
      className: "pill",
      onClick,
      style: {
        background: active ? tint : "rgba(255,255,255,0.04)",
        borderColor: active ? tint : "rgba(255,255,255,0.14)",
        color: active ? "#10100E" : T.muted,
      },
    },
    children,
  );
}

/* مفتاح تبديل بسيط (نعم/لا) — يُستخدم لتفعيل/تعطيل رياضة أو تذكير. */
export function Switch({ on, onClick }) {
  return h(
    "button",
    { onClick, style: { width: 44, height: 26, borderRadius: 999, border: "none", background: on ? T.primary : "rgba(255,255,255,0.14)", position: "relative", flexShrink: 0 } },
    h("span", { style: { position: "absolute", top: 3, [on ? "right" : "left"]: 3, width: 20, height: 20, borderRadius: 999, background: "#FDF8F6" } }),
  );
}

/* `unit` معناه أن `value` رقم لاتيني خام ملاصق لكلمة عربية — نلفّ الرقم
   ووحدته بـ dir="ltr" معاً كي لا ينعكس bidi. بلا `unit`، القيمة جملة عربية
   جاهزة (`minsWord` مثلاً) ولا تحتاج لفّاً. */
export function Stat({ label, value, unit, hint, tint }) {
  return h(
    "div",
    null,
    h("div", { style: { fontSize: 11, fontWeight: 700, color: T.faint } }, label),
    h(
      "div",
      { style: { marginTop: 4, fontSize: 20, fontWeight: 800, color: tint || T.fg, fontVariantNumeric: "tabular-nums" } },
      unit
        ? h("span", { dir: "ltr" }, value, h("span", { style: { marginLeft: 4, fontSize: 11, fontWeight: 700, color: T.muted } }, unit))
        : value,
    ),
    hint ? h("div", { style: { marginTop: 2, fontSize: 10.5, fontWeight: 700, color: T.faint } }, hint) : null,
  );
}

/* رقم لاتيني وسط جملة عربية ينعكس في bidi ما لم يُلفّ وحده. يبني
   «١٫٢- كجم / ٥ أيام» بدون قلب الجملة كلها dir="ltr". */
export function trendHint(trend) {
  if (!trend) return "لا يوجد اتجاه بعد";
  const sign = trend.delta > 0 ? "+" : "";
  return h(React.Fragment, null, h("span", { dir: "ltr" }, `${sign}${trend.delta}`), ` كجم / ${ar(trend.days)} يوم`);
}

export function ProgressBar({ pct, tint = T.cta, tint2 = T.accent }) {
  return h(
    "div",
    { style: { height: 8, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" } },
    h("div", { style: { height: "100%", width: Math.max(0, Math.min(100, pct)) + "%", background: `linear-gradient(90deg, ${tint}, ${tint2})`, borderRadius: 999 } }),
  );
}

/* نغمة صوتية خفيفة عند انتهاء مؤقت الراحة دون الحاجة لملفات صوت خارجية */
export function playBeep(freq = 880, duration = 0.25) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
}

/* حاسبة أوزان البار والصفائح (Plate Calculator) */
export const AVAILABLE_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
export const PLATE_COLORS = {
  25: "#E82C2C",
  20: "#2563EB",
  15: "#F59E0B",
  10: "#10B981",
  5: "#FFFFFF",
  2.5: "#6B7280",
  1.25: "#9CA3AF",
};

export function calculatePlates(targetTotal, barWeight = 20) {
  const target = Math.max(0, Number(targetTotal) || 0);
  const bar = Math.max(0, Number(barWeight) || 0);
  if (target <= bar) return { perSide: [], totalOnBar: bar, remainder: 0 };
  let sideWeight = (target - bar) / 2;
  const perSide = [];
  for (const p of AVAILABLE_PLATES) {
    while (sideWeight >= p) {
      perSide.push(p);
      sideWeight = Math.round((sideWeight - p) * 100) / 100;
    }
  }
  const totalOnBar = bar + perSide.reduce((sum, p) => sum + p, 0) * 2;
  return { perSide, totalOnBar, remainder: Math.round(sideWeight * 2 * 10) / 10 };
}

/* رسم بياني لتطور تمرين معين (Sparkline) */
export function buildExerciseSparkline(entries, w = 260, hgt = 60, pad = 6) {
  const valid = entries.filter((e) => Number(e.weight) > 0);
  if (valid.length < 2) return null;
  const weights = valid.map((e) => Number(e.weight));
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;
  const step = (w - pad * 2) / (valid.length - 1);
  const pts = weights
    .map((wt, i) => {
      const x = pad + i * step;
      const y = hgt - pad - ((wt - min) / range) * (hgt - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const lastX = pad + (valid.length - 1) * step;
  const lastY = hgt - pad - ((weights[weights.length - 1] - min) / range) * (hgt - pad * 2);

  return h(
    "svg",
    { width: w, height: hgt, style: { overflow: "visible", display: "block" } },
    h("polyline", { points: pts, fill: "none", stroke: "#FFB020", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" }),
    h("circle", { cx: lastX, cy: lastY, r: 4, fill: "#10B981" }),
  );
}
