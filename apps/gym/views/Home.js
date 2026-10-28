import { h, T, Card, Btn, Stat, ProgressBar, ar, minsWord, trendHint, tintOf, sparkPoints } from "/gym/lib/ui.js";
import {
  weekLoad,
  gymRun,
  restDays,
  latestWeigh,
  weighTrend,
  gymAdvise,
  sportOf,
  targetStand,
  exercisePRs,
  DEFAULT_PROGRAM,
  GYM_DAYS,
  REST_DAY,
  dayKey,
} from "/src/state/life-state.mjs";
import { PlateCalcModal, RestTimerWidget } from "/gym/views/GymTools.js";

const { useMemo, useState } = React;

export function HeroCard({ gym }) {
  const week = weekLoad(gym);
  const run = gymRun(gym);
  const away = restDays(gym);
  const weigh = latestWeigh(gym);
  const trend = weighTrend(gym, 30);
  const pct = week.planned ? Math.min(100, Math.round((week.done / week.planned) * 100)) : null;

  return h(
    Card,
    { style: { padding: 24 } },
    h(
      "div",
      { style: { display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "space-between" } },
      h(
        "div",
        { style: { minWidth: 200, flex: 1 } },
        h("div", { style: { fontSize: 12, fontWeight: 700, color: T.faint } }, "أسبوعك"),
        h(
          "div",
          { style: { marginTop: 4, fontSize: 24, fontWeight: 800 } },
          week.planned
            ? [h("span", { key: "a", style: { color: T.cta } }, ar(week.done)), h("span", { key: "b", style: { color: T.muted } }, ` من ${ar(week.planned)} حصة`)]
            : `${ar(week.done)} حصة هذا الأسبوع`,
        ),
        pct !== null && h("div", { style: { marginTop: 10 } }, h(ProgressBar, { pct })),
      ),
      h(
        "div",
        { style: { display: "flex", gap: 20, flexWrap: "wrap" } },
        h(Stat, { label: "أيام متتابعة", value: ar(run), unit: "يوم", tint: T.accent }),
        h(Stat, { label: "دقائق الأسبوع", value: minsWord(week.minutes), tint: T.sky }),
        h(Stat, {
          label: "الوزن الحالي",
          value: weigh ? weigh.kg : "—",
          unit: weigh ? "كجم" : "",
          hint: trendHint(trend),
          tint: trend && trend.delta < 0 ? T.primary : T.fg,
        }),
        away !== null && away > 0 && h(Stat, { label: "آخر حصة", value: ar(away), unit: "يوم مضى", tint: away >= 4 ? T.danger : T.muted }),
      ),
    ),
  );
}

export function AdviceCard({ gym, sleepLogs }) {
  const notes = useMemo(() => gymAdvise(gym, dayKey(), sleepLogs), [gym, sleepLogs]);
  if (!notes.length) return null;
  const tones = { door: T.cta, push: T.accent, ask: T.sky, keep: T.primary };
  return h(
    Card,
    null,
    h("div", { style: { marginBottom: 10, fontSize: 17, fontWeight: 700 } }, "✦ تحليل تلقائي"),
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: 10 } },
      notes.map((n) =>
        h(
          "div",
          { key: n.id, style: { fontSize: 13, lineHeight: 1.7, color: "rgba(253,248,246,0.85)", paddingRight: 14, borderRight: `2px solid ${tones[n.tone] || T.accent}` } },
          n.text,
        ),
      ),
    ),
  );
}

export function MiniWorkouts({ gym, onGo }) {
  return h(
    Card,
    null,
    h(
      "div",
      { style: { display: "flex", justifyContent: "space-between", marginBottom: 10 } },
      h("div", { style: { fontSize: 17, fontWeight: 700 } }, "آخر الحصص"),
      h("button", { onClick: onGo, style: { background: "none", border: "none", color: T.cta, fontSize: 12.5, fontWeight: 700 } }, "السجل الكامل ←"),
    ),
    !gym.workouts.length
      ? h("p", { style: { fontSize: 13, color: T.faint, padding: "8px 0" } }, "لا حصص مسجّلة بعد.")
      : h(
          "div",
          null,
          gym.workouts.slice(0, 4).map((w) => {
            const s = sportOf(gym, w.sport);
            const tint = tintOf(s?.tint);
            return h(
              "div",
              { key: w.id, style: { display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" } },
              h("div", { style: { width: 8, height: 8, borderRadius: 999, background: tint, marginTop: 5, flexShrink: 0 } }),
              h(
                "div",
                { style: { flex: 1, minWidth: 0 } },
                h("div", { style: { fontSize: 13.5, fontWeight: 700 } }, w.title),
                h("div", { style: { fontSize: 11, fontWeight: 700, color: T.faint } }, h("span", { dir: "ltr" }, w.date), ` · ${minsWord(w.minutes)}`),
              ),
            );
          }),
        ),
  );
}

export function SportsOverview({ gym, onGo }) {
  const week = weekLoad(gym);
  return h(
    Card,
    null,
    h(
      "div",
      { style: { display: "flex", justifyContent: "space-between", marginBottom: 10 } },
      h("div", { style: { fontSize: 17, fontWeight: 700 } }, "رياضاتي"),
      h("button", { onClick: onGo, style: { background: "none", border: "none", color: T.cta, fontSize: 12.5, fontWeight: 700 } }, "إدارة ←"),
    ),
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: 12 } },
      gym.sports.map((s) => {
        const load = week.bySport.find((b) => b.id === s.id);
        const tint = tintOf(s.tint);
        return h(
          "div",
          { key: s.id, style: { display: "flex", alignItems: "center", gap: 10, opacity: s.off ? 0.45 : 1 } },
          h("div", { style: { width: 10, height: 10, borderRadius: 999, background: tint, flexShrink: 0 } }),
          h(
            "div",
            { style: { flex: 1, minWidth: 0 } },
            h("div", { style: { fontSize: 14, fontWeight: 700 } }, s.label),
            h("div", { style: { fontSize: 12, color: T.muted } }, s.weekly ? `${ar(load?.count || 0)} من ${ar(s.weekly)} هذا الأسبوع` : `${ar(load?.count || 0)} حصة هذا الأسبوع`),
          ),
          load?.pct !== null && load?.pct !== undefined && h("div", { style: { fontSize: 12.5, fontWeight: 800, color: tint }, dir: "ltr" }, `${load.pct}%`),
        );
      }),
    ),
  );
}

export function TargetCard({ gym }) {
  const stand = targetStand(gym);
  if (stand.kg === null) return null;
  return h(
    Card,
    null,
    h("div", { style: { fontSize: 17, fontWeight: 700, marginBottom: 6 } }, "الهدف"),
    h("div", { style: { fontSize: 13, color: T.muted } }, stand.note || `الوصول إلى ${stand.kg} كجم`),
    h(
      "div",
      { style: { marginTop: 8, display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" } },
      h(
        "span",
        { style: { fontSize: 22, fontWeight: 800 }, dir: "ltr" },
        stand.kg,
        h("span", { style: { marginLeft: 6, fontSize: 11, fontWeight: 700, color: T.muted } }, "كجم"),
      ),
      stand.gap !== null &&
        h("span", { style: { fontSize: 11, fontWeight: 700, color: T.accent } }, h("span", { dir: "ltr" }, Math.abs(stand.gap)), " كجم باقية"),
    ),
    stand.pct !== null &&
      h(
        "div",
        { style: { marginTop: 10 } },
        h(ProgressBar, { pct: stand.pct }),
        h(
          "div",
          { style: { display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, fontWeight: 700, color: T.faint } },
          h("span", null, `${ar(stand.pct)}٪ من الطريق`),
          stand.left !== null && stand.left >= 0 && h("span", null, `باقي ${ar(stand.left)} يوم`),
        ),
      ),
  );
}

export function WeekMatrixCard({ gym }) {
  const plan = gym.plan || {};
  const today = dayKey();
  const dObj = new Date(today + "T12:00:00");
  const currentDayOfWeek = dObj.getDay(); // 0 is Sunday

  // compute dates for Sunday to Saturday of current week
  const weekDays = GYM_DAYS.map((gd) => {
    const diff = gd.d - currentDayOfWeek;
    const targetDate = new Date(dObj.getTime());
    targetDate.setDate(targetDate.getDate() + diff);
    const key = targetDate.toISOString().slice(0, 10);
    const workouts = gym.workouts.filter((w) => w.date === key);
    const isRest = plan[gd.d] === REST_DAY;
    const isToday = key === today;
    return { ...gd, key, workouts, isRest, isToday };
  });

  return h(
    Card,
    null,
    h("div", { style: { fontSize: 16, fontWeight: 700, marginBottom: 12 } }, "📅 التزام الأسبوع"),
    h(
      "div",
      {
        style: {
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 6,
          textAlign: "center",
        },
      },
      weekDays.map((wd) => {
        const hasWorkout = wd.workouts.length > 0;
        return h(
          "div",
          {
            key: wd.d,
            style: {
              background: wd.isToday
                ? "rgba(255, 87, 34, 0.12)"
                : "rgba(255, 255, 255, 0.03)",
              border: wd.isToday
                ? `1px solid ${T.cta}`
                : "1px solid rgba(255, 255, 255, 0.07)",
              borderRadius: 10,
              padding: "10px 4px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            },
          },
          h(
            "span",
            { style: { fontSize: 11, fontWeight: 700, color: wd.isToday ? T.ctaLift : T.muted } },
            wd.label
          ),
          h(
            "div",
            {
              style: {
                width: 26,
                height: 26,
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 900,
                marginTop: 2,
                background: hasWorkout
                  ? T.primary
                  : wd.isRest
                  ? `${T.sky}26`
                  : "rgba(255, 255, 255, 0.05)",
                color: hasWorkout ? "#111" : wd.isRest ? T.sky : T.faint,
                border: wd.isRest ? `1px solid ${T.sky}55` : "none",
              },
            },
            hasWorkout ? "✓" : wd.isRest ? "☕" : "·"
          )
        );
      })
    )
  );
}

export function PRShowcaseCard({ gym, onGo }) {
  const prs = useMemo(() => exercisePRs(gym).slice(0, 5), [gym]);
  if (!prs.length) return null;

  return h(
    Card,
    null,
    h(
      "div",
      { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } },
      h("div", { style: { fontSize: 16, fontWeight: 700 } }, "🏆 أعلى أرقامك القياسية (PRs)"),
      h("button", { onClick: onGo, style: { background: "none", border: "none", color: T.cta, fontSize: 12.5, fontWeight: 700 } }, "كل التمارين ←")
    ),
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: 8 } },
      prs.map((p) =>
        h(
          "div",
          {
            key: p.exercise,
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "7px 12px",
              background: "rgba(255, 176, 32, 0.06)",
              border: "1px solid rgba(255, 176, 32, 0.16)",
              borderRadius: 10,
            },
          },
          h(
            "div",
            null,
            h("span", { style: { fontSize: 13.5, fontWeight: 700 } }, p.exercise),
            p.orm > 0 &&
              h("span", { style: { fontSize: 11, color: T.muted, marginRight: 8 }, dir: "ltr" }, `(1RM: ${p.orm}kg)`)
          ),
          h(
            "span",
            { className: "pr-badge" },
            `${p.weight} كجم × ${p.reps} 🏆`
          )
        )
      )
    )
  );
}

export function HomeView({ gym, go, sleepLogs }) {
  const [showCalc, setShowCalc] = useState(false);
  const [showTimer, setShowTimer] = useState(false);

  const routines = gym.routines && gym.routines.length ? gym.routines : DEFAULT_PROGRAM;
  // determine next routine
  const lastW = gym.workouts[0];
  let nextIdx = 0;
  if (lastW) {
    const foundIdx = routines.findIndex((r) => lastW.title.includes(r.title.split(" — ")[0]));
    if (foundIdx !== -1) nextIdx = (foundIdx + 1) % routines.length;
  }
  const nextRoutine = routines[nextIdx] || routines[0];

  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: 16 } },
    // بطاقة بدء التمرين السريع والأدوات
    h(
      Card,
      {
        style: {
          background: "linear-gradient(135deg, rgba(255, 87, 34, 0.16) 0%, rgba(16, 185, 129, 0.1) 100%)",
          borderColor: "rgba(255, 87, 34, 0.35)",
          padding: 20,
        },
      },
      h(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 14,
          },
        },
        h(
          "div",
          null,
          h("div", { style: { fontSize: 12, fontWeight: 700, color: T.ctaLift } }, "⚡ تمرينك القادم في الجدول:"),
          h("div", { style: { fontSize: 20, fontWeight: 900, marginTop: 2 } }, nextRoutine.title),
          nextRoutine.focus &&
            h("div", { style: { fontSize: 12.5, color: T.muted, marginTop: 2 } }, nextRoutine.focus)
        ),
        h(
          "div",
          { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
          h(
            Btn,
            {
              onClick: () => go("workouts"),
              style: { padding: "10px 20px", fontSize: 13.5 },
            },
            "ابدأ التمرين الآن ←"
          ),
          h(
            Btn,
            {
              outline: true,
              onClick: () => setShowCalc(true),
              style: { padding: "10px 14px", fontSize: 13 },
            },
            "🏋️‍♂️ حاسبة الصفائح"
          ),
          h(
            Btn,
            {
              outline: true,
              onClick: () => setShowTimer((t) => !t),
              style: { padding: "10px 14px", fontSize: 13 },
            },
            showTimer ? "إخفاء المؤقت" : "⏱️ مؤقت الراحة"
          ),
          h(
            Btn,
            {
              outline: true,
              onClick: () => go("telegram"),
              style: { padding: "10px 14px", fontSize: 13 },
            },
            "🤖 بوت تيليجرام"
          )
        )
      )
    ),

    showTimer && h(RestTimerWidget, { initialSec: 90 }),

    h(HeroCard, { gym }),
    h(WeekMatrixCard, { gym }),
    h(PRShowcaseCard, { gym, onGo: () => go("workouts") }),
    h(AdviceCard, { gym, sleepLogs }),

    h(
      "div",
      { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 } },
      h(SportsOverview, { gym, onGo: () => go("settings") }),
      h(MiniWorkouts, { gym, onGo: () => go("workouts") }),
      h(TargetCard, { gym })
    ),

    h(PlateCalcModal, { open: showCalc, onClose: () => setShowCalc(false) })
  );
}
