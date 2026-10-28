import { h, T, Card, Btn, Field, Switch, SPORT_TINT_KEYS, tintOf, ar } from "/gym/lib/ui.js";
import {
  sportShape,
  targetShape,
  SPORT_CAP,
  liveSports,
  REST_DAY,
  GYM_DAYS,
  DEFAULT_PROGRAM,
} from "/src/state/life-state.mjs";

const { useState } = React;

function SportRow({ s, onToggle, onEdit }) {
  const tint = tintOf(s.tint);
  return h(
    "div",
    { style: { display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" } },
    h("div", { style: { width: 10, height: 10, borderRadius: 999, background: tint, flexShrink: 0 } }),
    h(
      "div",
      { style: { flex: 1, minWidth: 0, opacity: s.off ? 0.45 : 1 } },
      h("div", { style: { fontSize: 14, fontWeight: 700 } }, s.label),
      h("div", { style: { fontSize: 11.5, color: T.muted } }, s.weekly ? `${ar(s.weekly)} حصص أسبوعياً` : "بلا هدف أسبوعي", s.min ? ` · حدّ أدنى: ${s.min}` : ""),
    ),
    h("button", { onClick: () => onEdit(s), style: { background: "none", border: "none", color: T.muted, fontSize: 12, fontWeight: 700 } }, "عدّل"),
    h(Switch, { on: !s.off, onClick: () => onToggle(s) }),
  );
}

function SportEditor({ sport, onSave, onCancel }) {
  const [draft, setDraft] = useState(sport);
  const set = (k, v) => setDraft({ ...draft, [k]: v });
  return h(
    Card,
    { style: { borderColor: "rgba(255,87,34,0.3)" } },
    h("div", { style: { fontSize: 15, fontWeight: 700, marginBottom: 12 } }, sport.label ? `تعديل ${sport.label}` : "رياضة جديدة"),
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: 10 } },
      h(Field, { value: draft.label, onChange: (e) => set("label", e.target.value), placeholder: "اسم الرياضة" }),
      h(
        "div",
        { style: { display: "flex", gap: 8 } },
        h(Field, { type: "number", min: 0, max: 14, dir: "ltr", value: draft.weekly, onChange: (e) => set("weekly", e.target.value), placeholder: "حصص/أسبوع", style: { flex: 1 } }),
      ),
      h(Field, { value: draft.min, onChange: (e) => set("min", e.target.value), placeholder: "الحدّ الأدنى في يوم سيّئ (اختياري)" }),
      h(
        "div",
        { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
        SPORT_TINT_KEYS.map((k) =>
          h("button", {
            key: k,
            onClick: () => set("tint", k),
            style: { width: 30, height: 30, borderRadius: 999, background: tintOf(k), border: draft.tint === k ? "2px solid #fff" : "2px solid transparent" },
          }),
        ),
      ),
      h(
        "div",
        { style: { display: "flex", gap: 8 } },
        h(Btn, { style: { flex: 1 }, disabled: !String(draft.label).trim(), onClick: () => onSave(sportShape(draft)) }, "حفظ"),
        h(Btn, { outline: true, onClick: onCancel }, "إلغاء"),
      ),
    ),
  );
}

export function SportsSettings({ gym, onSave, onToggle }) {
  const [edit, setEdit] = useState(null);
  return h(
    Card,
    null,
    h(
      "div",
      { style: { display: "flex", justifyContent: "space-between", marginBottom: 12 } },
      h("div", { style: { fontSize: 17, fontWeight: 700 } }, "رياضاتي"),
      h(
        Btn,
        { outline: true, disabled: gym.sports.length >= SPORT_CAP, onClick: () => setEdit(sportShape({ tint: SPORT_TINT_KEYS[gym.sports.length % SPORT_TINT_KEYS.length] })) },
        "+ رياضة",
      ),
    ),
    gym.sports.map((s) => h(SportRow, { key: s.id, s, onToggle, onEdit: setEdit })),
    edit &&
      h(
        "div",
        { style: { marginTop: 14 } },
        h(SportEditor, {
          key: edit.id,
          sport: edit,
          onCancel: () => setEdit(null),
          onSave: (s) => {
            onSave(s);
            setEdit(null);
          },
        }),
      ),
  );
}

export function TargetSettings({ gym, onSave }) {
  const [draft, setDraft] = useState(gym.target);
  const set = (k, v) => setDraft({ ...draft, [k]: v });
  return h(
    Card,
    null,
    h("div", { style: { fontSize: 17, fontWeight: 700, marginBottom: 12 } }, "الهدف"),
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: 10 } },
      h(
        "div",
        { style: { display: "flex", gap: 8 } },
        h(Field, { type: "number", step: "0.1", dir: "ltr", value: draft.kg ?? "", onChange: (e) => set("kg", e.target.value), placeholder: "الوزن المستهدف (كجم)", style: { flex: 1 } }),
        h(Field, { type: "date", dir: "ltr", value: draft.date || "", onChange: (e) => set("date", e.target.value), style: { flex: 1 } }),
      ),
      h(Field, { value: draft.note || "", onChange: (e) => set("note", e.target.value), placeholder: "بكلماتك — ٧٥ كجم وحزام بوكسنج متوسط" }),
      h(Btn, { onClick: () => onSave(targetShape(draft)) }, "حفظ الهدف"),
    ),
  );
}

/* أيام الأسبوع تُقرأ من `GYM_DAYS` ولا تُكتب هنا ثانية — سبعة أيام
   كاملة، لا ستة: انظر تعليق `GYM_DAYS` في طبقة الحالة. */
export function WeekPlanSettings({ gym, onSet }) {
  const sports = liveSports(gym);
  const today = new Date().getDay();

  const cycle = (d) => {
    const chain = [...sports.map((s) => s.id), REST_DAY, ""];
    const now = gym.plan[d] || "";
    const at = chain.indexOf(now);
    onSet(d, chain[(at + 1) % chain.length]);
  };

  return h(
    Card,
    null,
    h("div", { style: { fontSize: 17, fontWeight: 700, marginBottom: 4 } }, "برنامج الأسبوع"),
    h("p", { style: { fontSize: 11, color: T.faint, marginBottom: 12 } }, "اضغط اليوم لتنقله بين رياضاتك ثم «راحة» ثم فراغ — ويوم الراحة المخطَّط لا يقطع عدّاد الأيام المتتابعة."),
    h(
      "div",
      { style: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 } },
      GYM_DAYS.map((d) => {
        const v = gym.plan[d.d] || "";
        const s = v && v !== REST_DAY ? sports.find((x) => x.id === v) : null;
        const rest = v === REST_DAY;
        const tint = s ? tintOf(s.tint) : rest ? T.faint : "rgba(255,255,255,0.14)";
        return h(
          "button",
          {
            key: d.d,
            onClick: () => cycle(d.d),
            style: {
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              minHeight: 72,
              borderRadius: 10,
              padding: 8,
              background: s ? `${tint}1A` : "rgba(255,255,255,0.03)",
              border: `1px solid ${d.d === today ? T.cta : s ? `${tint}40` : "rgba(255,255,255,0.08)"}`,
            },
          },
          h("span", { style: { fontSize: 11, fontWeight: 700, color: T.muted } }, d.label),
          h("span", { style: { fontSize: 12, fontWeight: 800, color: s ? tint : rest ? T.faint : "rgba(253,248,246,0.25)", textAlign: "center" } }, s ? s.label : rest ? "راحة" : "—"),
        );
      }),
    ),
  );
}

export function RoutinesSettings({ gym, onSaveRoutines, onRenameExercise }) {
  const routines = gym.routines && gym.routines.length ? gym.routines : DEFAULT_PROGRAM;
  const [selectedDay, setSelectedDay] = useState(routines[0]?.id || "push");
  const [newEx, setNewEx] = useState("");
  const [editIdx, setEditIdx] = useState(null);
  const [editVal, setEditVal] = useState("");

  const current = routines.find((r) => r.id === selectedDay) || routines[0];

  const handleAddExercise = () => {
    const trimmed = String(newEx).trim();
    if (!trimmed) return;
    const updated = routines.map((r) => {
      if (r.id === current.id) {
        return { ...r, exercises: [...r.exercises, trimmed] };
      }
      return r;
    });
    onSaveRoutines(updated);
    setNewEx("");
  };

  const handleRename = (oldName) => {
    const trimmed = String(editVal).trim();
    if (trimmed && trimmed !== oldName && onRenameExercise) {
      onRenameExercise(current.id, oldName, trimmed);
    }
    setEditIdx(null);
    setEditVal("");
  };

  const handleRemoveExercise = (idx) => {
    const updated = routines.map((r) => {
      if (r.id === current.id) {
        return { ...r, exercises: r.exercises.filter((_, i) => i !== idx) };
      }
      return r;
    });
    onSaveRoutines(updated);
  };

  const handleReset = () => {
    if (confirm("هل تريد استعادة جدول التمارين الافتراضي (Push / Pull / Legs)؟")) {
      onSaveRoutines(DEFAULT_PROGRAM);
    }
  };

  return h(
    Card,
    null,
    h(
      "div",
      { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } },
      h("div", { style: { fontSize: 17, fontWeight: 700 } }, "برنامج التمارين والتمارين المخصصة"),
      h(
        Btn,
        { outline: true, onClick: handleReset, style: { fontSize: 11, padding: "5px 10px" } },
        "استعادة الافتراضي"
      )
    ),
    h(
      "div",
      { style: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 } },
      routines.map((r) =>
        h(
          "button",
          {
            key: r.id,
            onClick: () => {
              setSelectedDay(r.id);
              setEditIdx(null);
            },
            style: {
              padding: "6px 12px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              border: r.id === current.id ? `1px solid ${T.cta}` : "1px solid rgba(255,255,255,0.1)",
              background: r.id === current.id ? `${T.cta}22` : "rgba(255,255,255,0.03)",
              color: r.id === current.id ? T.cta : T.muted,
            },
          },
          r.title.split(" — ")[0]
        )
      )
    ),
    h(
      "div",
      { style: { background: "rgba(255,255,255,0.02)", padding: 14, borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" } },
      h("div", { style: { fontSize: 15, fontWeight: 800, marginBottom: 4 } }, current.title),
      current.focus && h("div", { style: { fontSize: 12, color: T.muted, marginBottom: 12 } }, `العضلات: ${current.focus}`),
      h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 } },
        current.exercises.map((ex, i) =>
          editIdx === i
            ? h(
                "div",
                {
                  key: i,
                  style: {
                    display: "flex",
                    gap: 6,
                    alignItems: "center",
                    padding: "6px 10px",
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: 8,
                  },
                },
                h(Field, {
                  value: editVal,
                  onChange: (e) => setEditVal(e.target.value),
                  autoFocus: true,
                  style: { flex: 1, padding: "4px 8px", fontSize: 13 },
                }),
                h(Btn, { onClick: () => handleRename(ex), style: { padding: "4px 10px", fontSize: 11.5 } }, "حفظ"),
                h(Btn, { outline: true, onClick: () => setEditIdx(null), style: { padding: "4px 8px", fontSize: 11.5 } }, "إلغاء")
              )
            : h(
                "div",
                {
                  key: i,
                  style: {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 10px",
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 8,
                    fontSize: 13,
                  },
                },
                h("span", null, ex),
                h(
                  "div",
                  { style: { display: "flex", gap: 8, alignItems: "center" } },
                  h(
                    "button",
                    {
                      onClick: () => {
                        setEditIdx(i);
                        setEditVal(ex);
                      },
                      title: "تعديل اسم التمرين",
                      style: { background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 12 },
                    },
                    "✏️"
                  ),
                  h(
                    "button",
                    {
                      onClick: () => handleRemoveExercise(i),
                      title: "حذف التمرين",
                      style: { background: "none", border: "none", color: T.faint, cursor: "pointer", fontSize: 14 },
                    },
                    "✕"
                  )
                )
              )
        )
      ),
      h(
        "div",
        { style: { display: "flex", gap: 8 } },
        h(Field, {
          value: newEx,
          onChange: (e) => setNewEx(e.target.value),
          placeholder: "اسم تمرين جديد لإضافته لهذا اليوم",
          style: { flex: 1 },
        }),
        h(
          Btn,
          {
            disabled: !String(newEx).trim(),
            onClick: handleAddExercise,
            style: { padding: "0 14px", fontSize: 12.5 },
          },
          "+ إضافة تمرين"
        )
      )
    )
  );
}

export function SettingsView({ gym, onSaveSport, onToggleSport, onSaveTarget, onSetPlan, onSaveRoutines, onRenameExercise }) {
  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: 20 } },
    h(SportsSettings, { gym, onSave: onSaveSport, onToggle: onToggleSport }),
    h(RoutinesSettings, { gym, onSaveRoutines, onRenameExercise }),
    h(WeekPlanSettings, { gym, onSet: onSetPlan }),
    h(TargetSettings, { gym, onSave: onSaveTarget }),
  );
}
