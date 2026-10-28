import { h, T, Card, Pill, ProgressBar, ar, minsWord, buildExerciseSparkline } from "/gym/lib/ui.js";
import {
  dayKey,
  addDays,
  liveSports,
  sportLoad,
  weekLoad,
  minutesOf,
  workoutsIn,
  gymAdvise,
  muscleVolume,
  exerciseProgressReport,
} from "/src/state/life-state.mjs";

const { useState, useMemo } = React;

const PERIODS = [
  { id: "week", label: "أسبوعي", days: 7 },
  { id: "month", label: "شهري", days: 30 },
];

function buildReport(gym, periodId, today) {
  const days = PERIODS.find((p) => p.id === periodId).days;
  const list = workoutsIn(gym, days, today);
  const mins = minutesOf(list);
  if (!list.length) {
    return periodId === "week" ? "لا حصص هذا الأسبوع بعد — أي حصة، حتى لو صغيرة، تبدأ التقرير." : "لا حصص هذا الشهر بعد.";
  }
  const sports = liveSports(gym);
  const bySport = sports
    .map((s) => ({ s, load: sportLoad(gym, s.id, days, today) }))
    .filter((x) => x.load.count)
    .sort((a, b) => b.load.minutes - a.load.minutes);
  const lead = bySport[0];
  const share = lead ? Math.round((lead.load.minutes / mins) * 100) : 0;
  const unit = periodId === "week" ? "الأسبوع" : "الشهر";
  let text = `تدرَّبت ${ar(list.length)} حصة بإجمالي ${minsWord(mins)} هذا ${unit}.`;
  if (lead) text += ` أغلب وقتك في ${lead.s.label} (${ar(share)}٪ من وقتك).`;
  return text;
}

function WeekCompare({ gym, today }) {
  const sports = liveSports(gym);
  const rows = sports.map((s) => {
    const cur = sportLoad(gym, s.id, 7, today);
    const prev = sportLoad(gym, s.id, 7, addDays(today, -7));
    return { s, cur, prev };
  });
  const maxMin = Math.max(1, ...rows.flatMap((r) => [r.cur.minutes, r.prev.minutes]));

  return h(
    Card,
    null,
    h(
      "div",
      { style: { display: "flex", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 } },
      h("div", { style: { fontSize: 17, fontWeight: 700 } }, "هذا الأسبوع مقابل الماضي"),
      h(
        "div",
        { style: { display: "flex", gap: 16, fontSize: 11, fontWeight: 700, color: T.muted } },
        h("span", { style: { display: "flex", alignItems: "center", gap: 6 } }, h("span", { style: { width: 10, height: 10, borderRadius: 3, background: T.cta, display: "inline-block" } }), "الحالي"),
        h("span", { style: { display: "flex", alignItems: "center", gap: 6 } }, h("span", { style: { width: 10, height: 10, borderRadius: 3, background: "rgba(255,255,255,0.18)", display: "inline-block" } }), "الماضي"),
      ),
    ),
    h(
      "div",
      { style: { display: "flex", gap: 32, alignItems: "flex-end", justifyContent: "center", padding: "8px 0", flexWrap: "wrap" } },
      rows.map(({ s, cur, prev }) =>
        h(
          "div",
          { key: s.id, style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8 } },
          h(
            "div",
            { style: { display: "flex", gap: 6, alignItems: "flex-end", height: 120 } },
            h("div", { style: { width: 24, borderRadius: "6px 6px 0 0", background: "rgba(255,255,255,0.14)", height: Math.round((prev.minutes / maxMin) * 120) + "px" } }),
            h("div", { style: { width: 24, borderRadius: "6px 6px 0 0", background: T.cta, height: Math.round((cur.minutes / maxMin) * 120) + "px" } }),
          ),
          h("div", { style: { fontSize: 12.5, fontWeight: 700 } }, s.label),
        ),
      ),
    ),
  );
}

function LeaderCards({ gym, today }) {
  const sports = liveSports(gym);
  const loads = sports.map((s) => ({ s, load: sportLoad(gym, s.id, 30, today) })).filter((x) => x.s.weekly);
  if (!loads.length) return null;
  const scored = loads.map((x) => ({ ...x, pct: Math.round((x.load.count / (x.s.weekly * 4.3)) * 100) }));
  const best = [...scored].sort((a, b) => b.pct - a.pct)[0];
  const worst = [...scored].sort((a, b) => a.pct - b.pct)[0];
  if (!best || !worst || best.s.id === worst.s.id) return null;

  return h(
    "div",
    { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 } },
    h(
      "div",
      { className: "card", style: { borderColor: `${T.primary}4D`, background: `${T.primary}14` } },
      h("div", { style: { fontSize: 12, fontWeight: 700, color: T.primary } }, "الأكثر انضباطاً"),
      h("div", { style: { marginTop: 4, fontSize: 18, fontWeight: 800 } }, `${best.s.label} — ${ar(Math.min(100, best.pct))}٪`),
    ),
    h(
      "div",
      { className: "card", style: { borderColor: `${T.accent}4D`, background: `${T.accent}14` } },
      h("div", { style: { fontSize: 12, fontWeight: 700, color: T.accent } }, "يحتاج تركيز"),
      h("div", { style: { marginTop: 4, fontSize: 18, fontWeight: 800 } }, `${worst.s.label} — ${ar(Math.min(100, worst.pct))}٪`),
    ),
  );
}

export function MuscleVolumeCard({ gym }) {
  const today = dayKey();
  const muscles = useMemo(() => muscleVolume(gym, 7, today), [gym, today]);
  const totalWeekSets = muscles.reduce((s, m) => s + m.sets, 0);
  const totalWeekVol = muscles.reduce((s, m) => s + m.volume, 0);

  return h(
    Card,
    null,
    h(
      "div",
      { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 8 } },
      h(
        "div",
        null,
        h("div", { style: { fontSize: 17, fontWeight: 700 } }, "💪 توازن العضلات الأسبوعي (Muscle Volume Landmarks)"),
        h("div", { style: { fontSize: 12, color: T.muted, marginTop: 2 } }, "عدد الجلسات الأساسية لكل عضلة خلال آخر ٧ أيام مقارنة بالحد العلمي للتضخيم")
      ),
      totalWeekSets > 0 &&
        h(
          "div",
          {
            style: {
              fontSize: 12,
              fontWeight: 800,
              color: T.primary,
              background: `${T.primary}1A`,
              border: `1px solid ${T.primary}44`,
              padding: "4px 10px",
              borderRadius: 8,
            },
          },
          `${ar(totalWeekSets)} جلسة · ${ar(totalWeekVol)} كجم`
        )
    ),
    h(
      "div",
      { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 } },
      muscles.map((m) => {
        const tint =
          m.status === "optimal"
            ? T.primary
            : m.status === "building"
            ? T.accent
            : m.status === "low"
            ? T.cta
            : T.faint;
        const statusText =
          m.status === "optimal"
            ? "مكتمل ✓"
            : m.status === "building"
            ? "جيد — واصل"
            : m.status === "low"
            ? "يحتاج جلسات"
            : "لم يُدرَّب بعد";

        return h(
          "div",
          {
            key: m.id,
            style: {
              padding: "12px 14px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            },
          },
          h(
            "div",
            { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
            h("span", { style: { fontSize: 13.5, fontWeight: 800 } }, m.label),
            h(
              "span",
              { style: { fontSize: 11, fontWeight: 700, color: tint } },
              statusText
            )
          ),
          h(ProgressBar, { pct: m.pct, tint, tint2: tint }),
          h(
            "div",
            { style: { display: "flex", justifyContent: "space-between", fontSize: 11.5, color: T.muted } },
            h("span", null, `${ar(m.sets)} من ${ar(m.targetSets)} جلسة`),
            m.volume > 0 && h("span", { dir: "ltr" }, `${m.volume} kg vol`)
          )
        );
      })
    )
  );
}

export function ExerciseProgressReportCard({ gym }) {
  const today = dayKey();
  const report = useMemo(() => exerciseProgressReport(gym, 30, today), [gym, today]);

  return h(
    Card,
    null,
    h(
      "div",
      { style: { marginBottom: 14 } },
      h("div", { style: { fontSize: 17, fontWeight: 700 } }, "📈 تقرير تطور أوزان التمارين — آخر ٣٠ يوماً"),
      h(
        "div",
        { style: { fontSize: 12, color: T.muted, marginTop: 2 } },
        "متابعة الزيادة التدريجية (Progressive Overload) والـ 1RM التقديري في كل تمرين"
      )
    ),
    report.length === 0
      ? h(
          "div",
          {
            style: {
              fontSize: 13,
              color: T.faint,
              textAlign: "center",
              padding: "24px 12px",
              lineHeight: 1.8,
            },
          },
          "ما فيه سجلات أوزان بآخر ٣٠ يوماً. ابدأ سجّل جلساتك من شاشة «التمارين» عشان يظهر لك التقرير هنا تلقائياً."
        )
      : h(
          "div",
          { style: { display: "flex", flexDirection: "column", gap: 10 } },
          report.map((r) => {
            const isPos = r.delta > 0 || (r.delta === 0 && r.ormDelta > 0);
            const isNeg = r.delta < 0;
            const tint = isPos ? T.primary : isNeg ? T.danger : T.muted;
            const sign = r.delta > 0 ? "+" : "";

            return h(
              "div",
              {
                key: r.exercise,
                style: {
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12,
                  padding: "12px 14px",
                  flexWrap: "wrap",
                  gap: 10,
                },
              },
              h(
                "div",
                null,
                h("div", { style: { fontSize: 14, fontWeight: 800 } }, r.exercise),
                h(
                  "div",
                  { style: { fontSize: 11.5, color: T.muted, marginTop: 3 } },
                  `${r.first.weight} كجم (${r.first.date}) ← `,
                  h("b", { style: { color: T.fg } }, `${r.last.weight} كجم × ${r.last.reps}`),
                  r.lastOrm ? ` · 1RM: ${r.lastOrm} كجم` : "",
                  ` (${ar(r.count)} جلسات)`
                )
              ),
              h(
                "div",
                { style: { display: "flex", gap: 8, alignItems: "center" } },
                r.ormDelta !== undefined &&
                  r.ormDelta !== 0 &&
                  h(
                    "span",
                    {
                      style: {
                        fontSize: 11.5,
                        fontWeight: 800,
                        color: r.ormDelta > 0 ? T.accent : T.muted,
                        fontFamily: "monospace",
                      },
                      dir: "ltr",
                    },
                    `1RM ${r.ormDelta > 0 ? "+" : ""}${r.ormDelta}kg`
                  ),
                h(
                  "div",
                  {
                    style: {
                      fontSize: 15,
                      fontWeight: 900,
                      color: tint,
                      fontFamily: "monospace",
                      background: `${tint}18`,
                      border: `1px solid ${tint}33`,
                      padding: "4px 10px",
                      borderRadius: 8,
                    },
                  },
                  `${sign}${r.delta} كجم`
                )
              )
            );
          })
        )
  );
}

export function AnalysisView({ gym }) {
  const [period, setPeriod] = useState("week");
  const today = dayKey();
  const report = useMemo(() => buildReport(gym, period, today), [gym, period, today]);
  const notes = useMemo(() => gymAdvise(gym, today), [gym, today]);

  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: 20 } },
    h(
      "div",
      { style: { display: "flex", gap: 8 } },
      PERIODS.map((p) => h(Pill, { key: p.id, active: period === p.id, tint: T.cta, onClick: () => setPeriod(p.id) }, p.label)),
    ),
    h(
      Card,
      null,
      h("div", { style: { fontSize: 17, fontWeight: 700, marginBottom: 10 } }, `✦ تقرير ${period === "week" ? "الأسبوع" : "الشهر"}`),
      h("p", { style: { fontSize: 14, lineHeight: 1.8, color: "rgba(253,248,246,0.85)" } }, report),
    ),
    h(MuscleVolumeCard, { gym }),
    h(ExerciseProgressReportCard, { gym }),
    h(LeaderCards, { gym, today }),
    h(WeekCompare, { gym, today }),
    !!notes.length &&
      h(
        Card,
        null,
        h("div", { style: { fontSize: 17, fontWeight: 700, marginBottom: 10 } }, "سجل الملاحظات"),
        h(
          "div",
          { style: { display: "flex", flexDirection: "column", gap: 10 } },
          notes.map((n) => h("div", { key: n.id, style: { fontSize: 13, lineHeight: 1.7, color: "rgba(253,248,246,0.8)" } }, n.text)),
        ),
      ),
  );
}
