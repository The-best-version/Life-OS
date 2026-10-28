import {
  h,
  T,
  Card,
  Btn,
  Field,
  Pill,
  ar,
  minsWord,
  buildExerciseSparkline,
  playBeep,
} from "/gym/lib/ui.js";
import {
  dayKey,
  exerciseHistory,
  lastExerciseLog,
  exercisePRs,
  exerciseAdvice,
  estimate1RM,
  SET_TYPES,
  SET_TYPE_LABELS,
  DEFAULT_PROGRAM,
} from "/src/state/life-state.mjs";
import { PlateCalcModal, RestTimerWidget } from "/gym/views/GymTools.js";

const { useState, useMemo, useEffect } = React;

const SET_TYPE_STYLES = {
  working: { color: T.fg, bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.14)", short: "أساسي" },
  warmup: { color: T.sky, bg: `${T.sky}1F`, border: `${T.sky}55`, short: "W إحماء" },
  failure: { color: T.danger, bg: `${T.danger}1F`, border: `${T.danger}55`, short: "F فشل" },
  dropset: { color: T.violet, bg: `${T.violet}1F`, border: `${T.violet}55`, short: "D دروب" },
};

export function ExerciseCard({
  exercise,
  routineId,
  gym,
  onLogExercise,
  onDeleteExerciseLog,
  onRenameExercise,
  onTriggerRest,
}) {
  const history = useMemo(() => exerciseHistory(gym, exercise, 20), [gym, exercise]);
  const last = useMemo(() => lastExerciseLog(gym, exercise), [gym, exercise]);
  const advice = useMemo(() => exerciseAdvice(gym, exercise, 8, 12), [gym, exercise]);
  const allPRs = useMemo(() => exercisePRs(gym), [gym]);
  const currentPR = allPRs.find(
    (p) => p.exercise.toLowerCase() === exercise.toLowerCase()
  );

  const defaultWt = advice.targetWeight !== null ? String(advice.targetWeight) : last ? String(last.weight) : "";
  const defaultReps = String(advice.targetReps || (last ? last.reps : 10));

  const [setRows, setSetRows] = useState(() => [
    { num: 1, setType: "working", weight: defaultWt, reps: defaultReps, done: false },
    { num: 2, setType: "working", weight: defaultWt, reps: defaultReps, done: false },
    { num: 3, setType: "working", weight: defaultWt, reps: defaultReps, done: false },
  ]);
  const [showChart, setShowChart] = useState(false);
  const [prBanner, setPrBanner] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [renameValue, setRenameValue] = useState(exercise);

  // تحديث القيم المقترحة في الصفوف غير المكتملة إذا لم يدخل المستخدم رقماً بعد
  useEffect(() => {
    setSetRows((prev) =>
      prev.map((r) =>
        r.done || r.weight !== ""
          ? r
          : { ...r, weight: defaultWt, reps: defaultReps }
      )
    );
  }, [defaultWt, defaultReps]);

  const updateRow = (idx, patch) => {
    setSetRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const cycleSetType = (idx) => {
    setSetRows((prev) =>
      prev.map((r, i) => {
        if (i !== idx || r.done) return r;
        const curIdx = SET_TYPES.indexOf(r.setType);
        const nextType = SET_TYPES[(curIdx + 1) % SET_TYPES.length];
        return { ...r, setType: nextType };
      })
    );
  };

  const addSetRow = () => {
    setSetRows((prev) => {
      const lastRow = prev[prev.length - 1];
      return [
        ...prev,
        {
          num: prev.length + 1,
          setType: "working",
          weight: lastRow ? lastRow.weight : defaultWt,
          reps: lastRow ? lastRow.reps : defaultReps,
          done: false,
        },
      ];
    });
  };

  const removeLastRow = () => {
    setSetRows((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  };

  const handleCompleteSet = (idx) => {
    const row = setRows[idx];
    if (!row || row.done) return;
    const wt = parseFloat(row.weight !== "" ? row.weight : defaultWt);
    const rp = parseInt(row.reps !== "" ? row.reps : defaultReps, 10) || 10;
    if (isNaN(wt) || wt <= 0) return;

    const newOrm = row.setType === "warmup" ? 0 : estimate1RM(wt, rp);
    const prevMaxWt = currentPR ? currentPR.weight || 0 : 0;
    const prevMaxOrm = currentPR ? currentPR.orm || estimate1RM(currentPR.weight, currentPR.reps) : 0;

    const isWeightPR = row.setType !== "warmup" && prevMaxWt > 0 && wt > prevMaxWt;
    const isOrmPR = row.setType !== "warmup" && prevMaxOrm > 0 && newOrm > prevMaxOrm;

    updateRow(idx, { weight: String(wt), reps: String(rp), done: true });

    onLogExercise({
      date: dayKey(),
      exercise,
      weight: wt,
      reps: rp,
      sets: 1,
      setType: row.setType,
      note: `جلسة ${row.num} (${SET_TYPE_LABELS[row.setType] || "أساسي"})`,
    });

    if (isWeightPR || isOrmPR) {
      const msg = isWeightPR
        ? `🎉 كفو! رقم قياسي جديد في الوزن (${wt} كجم) · 1RM: ${newOrm} كجم 🏆`
        : `🔥 رقم قياسي جديد في القوة التقديرية (1RM: ${newOrm} كجم)! 🏆`;
      setPrBanner(msg);
      playBeep(1200, 0.35);
      setTimeout(() => setPrBanner(""), 5000);
    } else {
      playBeep(660, 0.12);
    }

    onTriggerRest();
  };

  const doneCount = setRows.filter((r) => r.done).length;
  const todayVolume = setRows
    .filter((r) => r.done && r.setType !== "warmup")
    .reduce((sum, r) => sum + (parseFloat(r.weight) || 0) * (parseInt(r.reps, 10) || 0), 0);

  const adviceTint =
    advice.action === "up"
      ? T.primary
      : advice.action === "reps"
      ? T.accent
      : T.sky;

  return h(
    Card,
    {
      style: {
        marginBottom: 14,
        border: prBanner
          ? "1px solid #FFB020"
          : doneCount === setRows.length && doneCount > 0
          ? `1px solid ${T.primary}66`
          : "1px solid rgba(255,255,255,0.08)",
        transition: "all 0.25s ease",
      },
    },
    // رأس التمرين
    h(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 10,
          flexWrap: "wrap",
        },
      },
      h(
        "div",
        { style: { flex: 1, minWidth: 200 } },
        isEditingName
          ? h(
              "form",
              {
                onSubmit: (e) => {
                  e.preventDefault();
                  const trimmed = renameValue.trim();
                  if (trimmed && trimmed !== exercise && onRenameExercise) {
                    onRenameExercise(routineId, exercise, trimmed);
                  }
                  setIsEditingName(false);
                },
                style: { display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: 6 },
              },
              h(Field, {
                value: renameValue,
                onChange: (e) => setRenameValue(e.target.value),
                autoFocus: true,
                placeholder: "اسم التمرين",
                style: { width: 190, padding: "5px 10px", fontSize: 13.5, fontWeight: 700 },
              }),
              h(Btn, { type: "submit", style: { padding: "5px 12px", fontSize: 12 } }, "حفظ ✓"),
              h(
                Btn,
                {
                  type: "button",
                  outline: true,
                  onClick: () => {
                    setRenameValue(exercise);
                    setIsEditingName(false);
                  },
                  style: { padding: "5px 10px", fontSize: 12 },
                },
                "إلغاء"
              )
            )
          : h(
              "div",
              { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } },
              h("span", { style: { fontSize: 16.5, fontWeight: 800 } }, exercise),
              h(
                "button",
                {
                  type: "button",
                  onClick: (e) => {
                    e.stopPropagation();
                    setRenameValue(exercise);
                    setIsEditingName(true);
                  },
                  title: "تعديل اسم التمرين",
                  style: {
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 6,
                    padding: "2px 6px",
                    color: T.muted,
                    fontSize: 12,
                    cursor: "pointer",
                  },
                },
                "✏️ تعديل الاسم"
              ),
              currentPR &&
                h(
                  "span",
                  { className: "pr-badge" },
                  `🏆 ${currentPR.weight} كجم`,
                  currentPR.orm ? ` · 1RM ${currentPR.orm}` : ""
                ),
              doneCount > 0 &&
                h(
                  "span",
                  {
                    style: {
                      fontSize: 11,
                      fontWeight: 800,
                      color: T.primary,
                      background: `${T.primary}1F`,
                      border: `1px solid ${T.primary}44`,
                      borderRadius: 999,
                      padding: "2px 8px",
                    },
                  },
                  `${ar(doneCount)}/${ar(setRows.length)} جلسات · حجم ${ar(todayVolume)} كجم`
                )
            ),
        h(
          "div",
          { style: { fontSize: 12, color: T.muted, marginTop: 4 } },
          last
            ? [
                "آخر جلسة أساسية: ",
                h("b", { key: "wt", style: { color: T.fg } }, `${last.weight} كجم × ${last.reps}`),
                last.orm ? ` (1RM تقديري: ${last.orm} كجم)` : "",
                ` · ${last.date}`,
              ]
            : "لا يوجد سجل سابق — ابدأ بتسجيل جلساتك اليوم"
        )
      ),
      h(
        "button",
        {
          onClick: () => setShowChart((s) => !s),
          style: {
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            padding: "5px 10px",
            color: T.muted,
            fontSize: 11.5,
            fontWeight: 700,
          },
        },
        showChart ? "إخفاء السجل ▲" : "السجل والمخطط ▼"
      )
    ),

    // شريط المدرب الذكي للزيادة التدريجية (Double Progression Coach)
    h(
      "div",
      {
        style: {
          marginTop: 10,
          padding: "7px 12px",
          borderRadius: 9,
          background: `${adviceTint}12`,
          borderRight: `3px solid ${adviceTint}`,
          fontSize: 12,
          fontWeight: 700,
          color: "rgba(253,248,246,0.9)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 6,
        },
      },
      h("span", null, advice.text),
      advice.targetWeight !== null &&
        h(
          "span",
          { style: { fontSize: 11, color: adviceTint, fontFamily: "monospace" }, dir: "ltr" },
          `Target: ${advice.targetWeight}kg × ${advice.targetReps}`
        )
    ),

    // إشعار الاحتفال بكسر الرقم القياسي
    prBanner &&
      h(
        "div",
        {
          style: {
            marginTop: 10,
            padding: "8px 12px",
            background: "rgba(255, 176, 32, 0.16)",
            border: "1px solid #FFB020",
            borderRadius: 10,
            fontSize: 12.5,
            fontWeight: 800,
            color: "#FFB020",
            textAlign: "center",
          },
        },
        prBanner
      ),

    // جدول الجلسات التفاعلي على طريقة Hevy / Strong
    h(
      "div",
      { style: { marginTop: 12, display: "flex", flexDirection: "column", gap: 6 } },
      // عناوين الأعمدة
      h(
        "div",
        {
          style: {
            display: "grid",
            gridTemplateColumns: "38px 74px 1fr 82px 72px 44px",
            gap: 6,
            fontSize: 10.5,
            fontWeight: 700,
            color: T.faint,
            padding: "0 4px",
            alignItems: "center",
          },
        },
        h("span", null, "جلسة"),
        h("span", null, "النوع"),
        h("span", null, "السابق"),
        h("span", null, "الوزن (كجم)"),
        h("span", null, "التكرار"),
        h("span", { style: { textAlign: "center" } }, "تم")
      ),

      // صفوف الجلسات
      setRows.map((row, idx) => {
        const stStyle = SET_TYPE_STYLES[row.setType] || SET_TYPE_STYLES.working;
        const rowOrm = estimate1RM(row.weight || defaultWt, row.reps || defaultReps);
        return h(
          "div",
          {
            key: idx,
            style: {
              display: "grid",
              gridTemplateColumns: "38px 74px 1fr 82px 72px 44px",
              gap: 6,
              alignItems: "center",
              padding: "6px 6px",
              borderRadius: 10,
              background: row.done
                ? "rgba(16, 185, 129, 0.13)"
                : "rgba(255, 255, 255, 0.025)",
              border: row.done
                ? `1px solid ${T.primary}55`
                : "1px solid rgba(255, 255, 255, 0.05)",
              transition: "background 0.2s ease",
            },
          },
          // رقم الجلسة
          h(
            "span",
            {
              style: {
                fontSize: 13,
                fontWeight: 800,
                color: row.done ? T.primary : T.muted,
                textAlign: "center",
              },
              dir: "ltr",
            },
            `#${row.num}`
          ),
          // زر تغيير نوع الجلسة (أساسي / إحماء / فشل / دروب)
          h(
            "button",
            {
              onClick: () => cycleSetType(idx),
              disabled: row.done,
              title: "اضغط لتبديل نوع الجلسة: أساسي / إحماء / فشل / دروب سيت",
              style: {
                padding: "5px 4px",
                borderRadius: 7,
                fontSize: 10.5,
                fontWeight: 800,
                background: stStyle.bg,
                border: `1px solid ${stStyle.border}`,
                color: stStyle.color,
                whiteSpace: "nowrap",
              },
            },
            stStyle.short
          ),
          // الأداء السابق + 1RM التقديري للصف
          h(
            "div",
            { style: { fontSize: 11, color: T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, dir: "ltr" },
            last ? `${last.weight}kg × ${last.reps}` : "—",
            rowOrm > 0 && row.setType !== "warmup"
              ? h("span", { style: { display: "block", fontSize: 9.5, color: T.faint } }, `1RM ~${rowOrm}`)
              : null
          ),
          // حقل الوزن
          h(Field, {
            type: "number",
            step: "0.5",
            dir: "ltr",
            disabled: row.done,
            placeholder: defaultWt || "0",
            value: row.weight,
            onChange: (e) => updateRow(idx, { weight: e.target.value }),
            style: {
              padding: "6px 8px",
              fontSize: 13.5,
              fontWeight: 700,
              textAlign: "center",
              background: row.done ? "transparent" : "rgba(255,255,255,0.05)",
            },
          }),
          // حقل التكرار
          h(Field, {
            type: "number",
            min: "1",
            dir: "ltr",
            disabled: row.done,
            placeholder: defaultReps || "10",
            value: row.reps,
            onChange: (e) => updateRow(idx, { reps: e.target.value }),
            style: {
              padding: "6px 8px",
              fontSize: 13.5,
              fontWeight: 700,
              textAlign: "center",
              background: row.done ? "transparent" : "rgba(255,255,255,0.05)",
            },
          }),
          // زر صح (✓) بضغطة واحدة
          h(
            "button",
            {
              onClick: () => handleCompleteSet(idx),
              disabled: row.done || !(parseFloat(row.weight || defaultWt) > 0),
              title: row.done ? "تم حفظ الجلسة" : "اضغط لحفظ الجلسة وتشغيل مؤقت الراحة",
              style: {
                height: 34,
                borderRadius: 8,
                border: row.done ? `1px solid ${T.primary}` : "1px solid rgba(255,255,255,0.16)",
                background: row.done ? T.primary : "rgba(255,255,255,0.06)",
                color: row.done ? "#0B1026" : T.fg,
                fontSize: 15,
                fontWeight: 900,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              },
            },
            "✓"
          )
        );
      }),

      // أزرار إضافة / تقليص الجلسات
      h(
        "div",
        { style: { display: "flex", gap: 8, marginTop: 4 } },
        h(
          "button",
          {
            onClick: addSetRow,
            style: {
              flex: 1,
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px dashed rgba(255,255,255,0.16)",
              background: "rgba(255,255,255,0.02)",
              color: T.muted,
              fontSize: 11.5,
              fontWeight: 700,
            },
          },
          "+ جلسة إضافية"
        ),
        setRows.length > 1 &&
          !setRows[setRows.length - 1].done &&
          h(
            "button",
            {
              onClick: removeLastRow,
              style: {
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "transparent",
                color: T.faint,
                fontSize: 11.5,
                fontWeight: 700,
              },
            },
            "− حذف جلسة"
          )
      )
    ),

    // المخطط البياني والسجل التاريخي للتمرين
    showChart &&
      h(
        "div",
        {
          style: {
            marginTop: 14,
            paddingTop: 12,
            borderTop: "1px solid rgba(255,255,255,0.06)",
          },
        },
        history.filter((x) => x.setType !== "warmup").length >= 2 &&
          h(
            "div",
            { style: { marginBottom: 12 } },
            h(
              "div",
              {
                style: {
                  fontSize: 11,
                  fontWeight: 700,
                  color: T.muted,
                  marginBottom: 6,
                },
              },
              "مخطط تطور الوزن (الجلسات الأساسية):"
            ),
            buildExerciseSparkline(
              [...history.filter((x) => x.setType !== "warmup")].reverse(),
              320,
              65
            )
          ),
        history.length === 0
          ? h(
              "div",
              { style: { fontSize: 12, color: T.faint, textAlign: "center", padding: "10px 0" } },
              "سجّل أول جلسة بضغطة (✓) ليظهر السجل والمخطط."
            )
          : h(
              "div",
              { style: { display: "flex", flexDirection: "column", gap: 6 } },
              h(
                "div",
                { style: { fontSize: 11, fontWeight: 700, color: T.muted } },
                "آخر الجلسات المسجلة:"
              ),
              history.map((row) => {
                const st = SET_TYPE_STYLES[row.setType] || SET_TYPE_STYLES.working;
                return h(
                  "div",
                  {
                    key: row.id,
                    style: {
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: 12,
                      background: "rgba(255,255,255,0.03)",
                      padding: "6px 10px",
                      borderRadius: 8,
                    },
                  },
                  h(
                    "div",
                    { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } },
                    h(
                      "span",
                      {
                        style: {
                          fontSize: 10,
                          fontWeight: 800,
                          color: st.color,
                          background: st.bg,
                          padding: "1px 6px",
                          borderRadius: 5,
                        },
                      },
                      st.short
                    ),
                    h("b", { style: { color: T.ctaLift } }, `${row.weight} كجم`),
                    h("span", null, `× ${row.reps} تكرار`),
                    row.orm > 0 &&
                      h("span", { style: { fontSize: 10.5, color: T.faint }, dir: "ltr" }, `(1RM: ${row.orm})`)
                  ),
                  h(
                    "div",
                    { style: { display: "flex", gap: 8, alignItems: "center" } },
                    (row.isPR || row.is1RMPR) &&
                      h(
                        "span",
                        {
                          style: {
                            fontSize: 10,
                            color: "#FFB020",
                            fontWeight: 800,
                          },
                        },
                        row.isPR ? "PR وزن 🏆" : "PR 1RM 🔥"
                      ),
                    h("span", { style: { color: T.faint }, dir: "ltr" }, row.date),
                    h(
                      "button",
                      {
                        onClick: () => onDeleteExerciseLog(row.id),
                        style: {
                          background: "none",
                          border: "none",
                          color: T.faint,
                          cursor: "pointer",
                        },
                      },
                      "✕"
                    )
                  )
                );
              })
            )
      )
  );
}

export function RoutineTrackerView({
  gym,
  onLogExercise,
  onDeleteExerciseLog,
  onRenameExercise,
  onLogWorkout,
}) {
  const routines = gym.routines && gym.routines.length ? gym.routines : DEFAULT_PROGRAM;
  const [activeDayId, setActiveDayId] = useState(routines[0]?.id || "push");
  const [showPlateCalc, setShowPlateCalc] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [sessionMins, setSessionMins] = useState("60");

  const currentRoutine = routines.find((r) => r.id === activeDayId) || routines[0];

  // إحصائيات جلسات اليوم المسجلة فعلياً
  const today = dayKey();
  const todayLogs = useMemo(
    () => (gym.exerciseLogs || []).filter((x) => x.date === today && x.setType !== "warmup"),
    [gym.exerciseLogs, today]
  );
  const todayTotalVolume = useMemo(
    () => Math.round(todayLogs.reduce((s, x) => s + (x.volume || (x.weight || 0) * (x.reps || 0) * (x.sets || 1)), 0)),
    [todayLogs]
  );
  const todayTotalSets = useMemo(
    () => todayLogs.reduce((s, x) => s + (x.sets || 1), 0),
    [todayLogs]
  );

  const handleFinishDay = () => {
    const mins = parseInt(sessionMins, 10) || 60;
    onLogWorkout({
      date: dayKey(),
      sport: "gym",
      title: currentRoutine.title,
      minutes: mins,
      hard: 2,
      detail: `أُنجزت ${todayTotalSets || currentRoutine.exercises.length * 3} جلسة · الحجم الكلي: ${todayTotalVolume} كجم (${currentRoutine.exercises.join("، ")})`,
    });
    setShowCompleteDialog(false);
    playBeep(1100, 0.4);
  };

  return h(
    "div",
    null,
    // شريط اختيار أيام التمرين (Push / Pull / Legs ...)
    h(
      "div",
      {
        style: {
          display: "flex",
          gap: 6,
          overflowX: "auto",
          paddingBottom: 10,
          marginBottom: 14,
          scrollbarWidth: "none",
        },
      },
      routines.map((r) =>
        h(
          Pill,
          {
            key: r.id,
            active: r.id === activeDayId,
            tint: T.cta,
            onClick: () => setActiveDayId(r.id),
          },
          r.title.split(" — ")[0]
        )
      )
    ),

    // رأس اليوم الحالي + ملخص حجم اليوم + الأدوات السريعة
    h(
      Card,
      { style: { marginBottom: 16, padding: "16px 20px" } },
      h(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          },
        },
        h(
          "div",
          null,
          h(
            "div",
            { style: { fontSize: 19, fontWeight: 900, color: T.fg } },
            currentRoutine.title
          ),
          currentRoutine.focus &&
            h(
              "div",
              { style: { fontSize: 12.5, color: T.muted, marginTop: 2 } },
              `العضلات المستهدفة: ${currentRoutine.focus}`
            ),
          todayTotalSets > 0 &&
            h(
              "div",
              { style: { fontSize: 12, fontWeight: 700, color: T.primary, marginTop: 6 } },
              `🔥 إنجاز اليوم: ${ar(todayTotalSets)} جلسة أساسية · إجمالي الأوزان المرفوعة (Volume): ${ar(todayTotalVolume)} كجم`
            )
        ),
        h(
          "div",
          { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
          h(
            Btn,
            {
              outline: true,
              onClick: () => setShowPlateCalc(true),
              style: { padding: "8px 12px", fontSize: 12 },
            },
            "🏋️‍♂️ حاسبة الصفائح"
          ),
          h(
            Btn,
            {
              outline: true,
              onClick: () => setShowTimer((t) => !t),
              style: { padding: "8px 12px", fontSize: 12 },
            },
            showTimer ? "إخفاء المؤقت" : "⏱️ مؤقت الراحة"
          ),
          h(
            Btn,
            {
              onClick: () => setShowCompleteDialog(true),
              style: { padding: "8px 14px", fontSize: 12 },
            },
            "✓ إنهاء وتوثيق اليوم"
          )
        )
      )
    ),

    // مؤقت الراحة إذا تم تفعيله
    showTimer &&
      h(
        "div",
        { style: { marginBottom: 16 } },
        h(RestTimerWidget, { initialSec: 90 })
      ),

    // قائمة تمارين اليوم الحالي
    h(
      "div",
      null,
      currentRoutine.exercises.map((ex) =>
        h(ExerciseCard, {
          key: `${currentRoutine.id}:${ex}`,
          exercise: ex,
          routineId: currentRoutine.id,
          gym,
          onLogExercise,
          onDeleteExerciseLog,
          onRenameExercise,
          onTriggerRest: () => setShowTimer(true),
        })
      )
    ),

    // نافذة حاسبة الصفائح
    h(PlateCalcModal, {
      open: showPlateCalc,
      onClose: () => setShowPlateCalc(false),
    }),

    // نافذة إنهاء الحصة وتوثيقها
    showCompleteDialog &&
      h(
        "div",
        { className: "modal-overlay", onClick: () => setShowCompleteDialog(false) },
        h(
          "div",
          {
            className: "card",
            onClick: (e) => e.stopPropagation(),
            style: { width: "100%", maxWidth: 380, background: "#10162F" },
          },
          h(
            "div",
            { style: { fontSize: 17, fontWeight: 800, marginBottom: 12 } },
            `توثيق تمرين "${currentRoutine.title}"`
          ),
          h(
            "p",
            { style: { fontSize: 13, color: T.muted, marginBottom: 14 } },
            `سيتم توثيق الحصة في أسبوعك مع إجمالي حجم اليوم (${ar(todayTotalVolume)} كجم) واحتسابها في سلسلتك (Streak).`
          ),
          h(
            "label",
            { style: { fontSize: 12, fontWeight: 700, color: T.faint, display: "block", marginBottom: 6 } },
            "كم دقيقة استغرقت في النادي؟"
          ),
          h(Field, {
            type: "number",
            min: "10",
            max: "300",
            dir: "ltr",
            value: sessionMins,
            onChange: (e) => setSessionMins(e.target.value),
            style: { marginBottom: 16 },
          }),
          h(
            "div",
            { style: { display: "flex", gap: 8 } },
            h(
              Btn,
              { onClick: handleFinishDay, style: { flex: 1 } },
              "تأكيد وتوثيق 🎉"
            ),
            h(
              Btn,
              { outline: true, onClick: () => setShowCompleteDialog(false) },
              "إلغاء"
            )
          )
        )
      )
  );
}
