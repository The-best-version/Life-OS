import { h, T, Card, Btn, Field, Pill, ar, minsWord, tintOf } from "/gym/lib/ui.js";
import {
  dayKey,
  liveSports,
  sportOf,
  workoutsIn,
  minutesOf,
  HARD_LABELS,
  HARD_MIN,
  HARD_MAX,
} from "/src/state/life-state.mjs";
import { RoutineTrackerView } from "/gym/views/RoutineTracker.js";

const { useState } = React;

export function WorkoutForm({ gym, onLog, busy }) {
  const sports = liveSports(gym);
  const [sport, setSport] = useState(sports[0]?.id || "");
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState("");
  const [hard, setHard] = useState(2);
  const [detail, setDetail] = useState("");
  const [rounds, setRounds] = useState("");
  const [roundMin, setRoundMin] = useState("");
  const [date, setDate] = useState(dayKey());
  const [tiny, setTiny] = useState(false);

  const pick = sports.find((s) => s.id === sport) || sports[0] || null;
  if (!sports.length) return h(Card, null, h("p", { style: { fontSize: 13, color: T.muted } }, "أضف رياضة أولاً من «الإعدادات»."));

  const reset = () => {
    setTitle("");
    setMinutes("");
    setDetail("");
    setRounds("");
    setRoundMin("");
    setTiny(false);
  };

  return h(
    Card,
    null,
    h("div", { style: { fontSize: 17, fontWeight: 700, marginBottom: 12 } }, "سجّل حصة"),
    h(
      "div",
      { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 } },
      sports.map((s) => h(Pill, { key: s.id, active: pick?.id === s.id, tint: tintOf(s.tint), onClick: () => setSport(s.id) }, s.label)),
    ),
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: 10 } },
      h(Field, { value: title, onChange: (e) => setTitle(e.target.value), placeholder: "صدر وظهر / كومبينيشنز" }),
      h(
        "div",
        { style: { display: "flex", gap: 8 } },
        h(Field, { type: "number", min: 0, max: 600, dir: "ltr", value: minutes, onChange: (e) => setMinutes(e.target.value), placeholder: "الدقائق الكلية", style: { flex: 1 } }),
        h(Field, { type: "date", dir: "ltr", value: date, onChange: (e) => setDate(e.target.value), style: { flex: 1 } }),
      ),
      h(
        "div",
        { style: { display: "flex", gap: 8 } },
        h(Field, { type: "number", min: 0, max: 50, dir: "ltr", value: rounds, onChange: (e) => setRounds(e.target.value), placeholder: "عدد الجولات (اختياري)", style: { flex: 1 } }),
        h(Field, { type: "number", min: 0, max: 60, step: "0.5", dir: "ltr", value: roundMin, onChange: (e) => setRoundMin(e.target.value), placeholder: "دقيقة لكل جولة", style: { flex: 1 } }),
      ),
      h(
        "div",
        { style: { display: "flex", gap: 8 } },
        [HARD_MIN, 2, HARD_MAX].map((hv) =>
          h(
            "button",
            {
              key: hv,
              onClick: () => setHard(hv),
              style: {
                flex: 1,
                borderRadius: 10,
                border: `1px solid ${hard === hv ? T.ember : "rgba(255,255,255,0.14)"}`,
                background: hard === hv ? `${T.ember}26` : "transparent",
                color: hard === hv ? T.ember : T.muted,
                padding: "9px 0",
                fontSize: 12.5,
                fontWeight: 700,
              },
            },
            HARD_LABELS[hv],
          ),
        ),
      ),
      h(Field, { as: "textarea", value: detail, onChange: (e) => setDetail(e.target.value), placeholder: "أي ملاحظة إضافية (مسافة، وزن الحديد...)", style: { minHeight: 48, resize: "none" } }),
      pick?.min &&
        h(
          "label",
          { style: { display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: T.sky } },
          h("input", { type: "checkbox", checked: tiny, onChange: (e) => setTiny(e.target.checked) }),
          `كانت الحدّ الأدنى (${pick.min}) — وتُحتسَب كاملة`,
        ),
      h(
        Btn,
        {
          disabled: !pick || !String(title).trim() || busy,
          onClick: () => {
            onLog({ date, sport: pick.id, title, minutes, hard, detail, rounds, roundMin, tiny });
            reset();
          },
        },
        "+ أضف الحصة",
      ),
    ),
  );
}

export function WorkoutsList({ gym, onDelete }) {
  const [filter, setFilter] = useState("all");
  const sports = gym.sports;
  const list = filter === "all" ? gym.workouts : gym.workouts.filter((w) => w.sport === filter);
  const month = workoutsIn(gym, 30);

  return h(
    Card,
    null,
    h(
      "div",
      { style: { display: "flex", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 6 } },
      h("div", { style: { fontSize: 17, fontWeight: 700 } }, "سجل الحصص"),
      h("div", { style: { fontSize: 12, fontWeight: 700, color: T.muted } }, `آخر ٣٠ يوماً: ${ar(month.length)} حصة · ${minsWord(minutesOf(month))}`),
    ),
    h(
      "div",
      { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 } },
      h(Pill, { active: filter === "all", tint: T.cta, onClick: () => setFilter("all") }, "الكل"),
      sports.map((s) => h(Pill, { key: s.id, active: filter === s.id, tint: tintOf(s.tint), onClick: () => setFilter(s.id) }, s.label)),
    ),
    !list.length
      ? h("p", { style: { fontSize: 13, color: T.faint, textAlign: "center", padding: "20px 0" } }, "لا حصص مسجّلة بعد.")
      : h(
          "div",
          null,
          list.map((w) => {
            const s = sportOf(gym, w.sport);
            const tint = tintOf(s?.tint);
            const roundsLine = w.rounds !== null && w.roundMin !== null ? `${ar(w.rounds)} جولات × ${w.roundMin} دقيقة` : null;
            return h(
              "div",
              { key: w.id, style: { display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" } },
              h("div", { style: { width: 8, height: 8, borderRadius: 999, background: tint, marginTop: 5, flexShrink: 0 } }),
              h(
                "div",
                { style: { flex: 1, minWidth: 0 } },
                h(
                  "div",
                  { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } },
                  h("span", { style: { fontSize: 13.5, fontWeight: 700 } }, w.title),
                  s && h("span", { style: { fontSize: 10.5, fontWeight: 700, color: tint, background: `${tint}22`, borderRadius: 999, padding: "1px 8px" } }, s.label),
                  w.tiny && h("span", { style: { fontSize: 10.5, fontWeight: 700, color: T.sky, background: `${T.sky}22`, borderRadius: 999, padding: "1px 8px" } }, "◔ الحدّ الأدنى"),
                ),
                roundsLine && h("div", { style: { fontSize: 12, color: T.muted, marginTop: 2 }, dir: "rtl" }, roundsLine),
                w.detail && h("div", { style: { fontSize: 12, color: T.muted, marginTop: 2 } }, w.detail),
                h("div", { style: { fontSize: 11, fontWeight: 700, color: T.faint, marginTop: 2 } }, h("span", { dir: "ltr" }, w.date), ` · ${minsWord(w.minutes)} · ${HARD_LABELS[w.hard]}`),
              ),
              h(
                "button",
                {
                  onClick: () => onDelete(w),
                  "aria-label": `احذف ${w.title}`,
                  style: { background: "none", border: "none", color: T.faint, fontSize: 16, flexShrink: 0, alignSelf: "flex-start", padding: 4 },
                },
                "✕",
              ),
            );
          }),
        ),
  );
}

export function WorkoutsView({
  gym,
  busy,
  onLog,
  onDelete,
  onLogExercise,
  onDeleteExerciseLog,
  onRenameExercise,
}) {
  const [subTab, setSubTab] = useState("program");

  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: 16 } },
    h(
      "div",
      {
        style: {
          display: "flex",
          gap: 8,
          background: "rgba(255,255,255,0.03)",
          padding: 4,
          borderRadius: 999,
          alignSelf: "flex-start",
        },
      },
      h(
        Pill,
        {
          active: subTab === "program",
          tint: T.cta,
          onClick: () => setSubTab("program"),
        },
        "📋 برنامج التمارين والأوزان"
      ),
      h(
        Pill,
        {
          active: subTab === "manual",
          tint: T.sky,
          onClick: () => setSubTab("manual"),
        },
        "⚡ تسجيل يدوي وسجل الحصص"
      )
    ),
    subTab === "program"
      ? h(RoutineTrackerView, {
          gym,
          onLogExercise,
          onDeleteExerciseLog,
          onRenameExercise,
          onLogWorkout: onLog,
        })
      : h(
          "div",
          { style: { display: "grid", gridTemplateColumns: "1fr", gap: 20 } },
          h(WorkoutForm, { gym, busy, onLog }),
          h(WorkoutsList, { gym, onDelete })
        )
  );
}
