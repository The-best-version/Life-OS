/* --- النادي: الموقع المستقل — القشرة ---------------------------------------
 *  لا React محزَّم هنا ولا أداة بناء — بالضبط كما يحمّل Life OS نفسه React
 *  UMD من cdnjs. طبقة الحالة (`/src/state/life-state.mjs` وملفاتها الشقيقة)
 *  هي نفس الملفات التي يختبرها `node --test` — لا نسخة ثانية من المنطق.
 *
 *  هذا الملف هو القشرة وحدها: التنقّل، تحميل الحالة وكتابتها. كل شاشة في
 *  `views/` تأخذ ما ترسمه كخصائص ولا تمدّ يدها لحالة القشرة — نفس قاعدة
 *  «قائمة كتل» التي يبنى عليها Life OS نفسه.
 * --------------------------------------------------------------------- */
import { withState, readLife } from "/gym/lib/sync.js";
import {
  logWorkout,
  deleteWorkout,
  logWeigh,
  logMeasure,
  gymShape,
  logExercise,
  deleteExerciseLog,
  saveRoutines,
  renameExerciseInGym,
  logPhoto,
  deletePhoto,
} from "/src/state/life-state.mjs";
import { T, Btn, Card } from "/gym/lib/ui.js";
import { deletePhotoFile } from "/gym/lib/photos.js";
import { HomeView } from "/gym/views/Home.js";
import { WorkoutsView } from "/gym/views/Workouts.js";
import { MeasurementsView } from "/gym/views/Measurements.js";
import { PhotosView } from "/gym/views/Photos.js";
import { AnalysisView } from "/gym/views/Analysis.js";
import { SettingsView } from "/gym/views/Settings.js";
import { TelegramBotView } from "/gym/views/TelegramBot.js";

const h = React.createElement;
const { useState, useEffect, useCallback } = React;

const TABS = [
  { id: "home", label: "الرئيسية" },
  { id: "workouts", label: "التمارين" },
  { id: "measurements", label: "القياسات" },
  { id: "photos", label: "الصور" },
  { id: "analysis", label: "التحليل" },
  { id: "telegram", label: "بوت تيليجرام 🤖" },
  { id: "settings", label: "الإعدادات" },
];

function NavBar({ tab, go }) {
  return h(
    "div",
    { style: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 } },
    h(
      "div",
      {
        style: { display: "flex", alignItems: "center", gap: 8, cursor: "pointer" },
        onClick: () => go("home"),
      },
      h(
        "div",
        {
          style: {
            width: 32,
            height: 32,
            borderRadius: 10,
            background: "linear-gradient(135deg, #FF5722, #FFB020)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            boxShadow: "0 4px 12px rgba(255,87,34,0.4)",
          },
        },
        "⚡"
      ),
      h(
        "div",
        {
          className: "los-title",
          style: {
            fontFamily: "Cairo, Tajawal, sans-serif",
            fontWeight: 900,
            fontSize: 23,
            letterSpacing: "-0.3px",
          },
        },
        "إرثي 2030"
      )
    ),
    h(
      "div",
      { style: { display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 999, padding: 4, flexWrap: "wrap" } },
      TABS.map((t) =>
        h(
          "button",
          {
            key: t.id,
            onClick: () => go(t.id),
            style: {
              border: "none",
              borderRadius: 999,
              padding: "8px 14px",
              fontSize: 12.5,
              fontWeight: 700,
              background: tab === t.id ? T.cta : "transparent",
              color: tab === t.id ? "#1C141A" : T.muted,
              transition: "all 0.15s ease",
            },
          },
          t.label,
        ),
      ),
    ),
  );
}

function App() {
  const [gym, setGym] = useState(null);
  /* النوم ليس حقل نادٍ — يقرأه `gymAdvise` ليحذّر من مزيج التعب وقلّة
     النوم، لكن من يكتبه هو شاشة النوم وبوت Life OS الرئيسي، لا هذا
     الموقع. يُقرأ هنا للعرض فقط. */
  const [sleepLogs, setSleepLogs] = useState([]);
  const [tab, setTab] = useState("home");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    readLife()
      .then((s) => {
        if (s) {
          setGym(s.gym);
          setSleepLogs(s.sleepLogs || []);
        } else setError("لا توجد نسخة على القرص بعد — افتح 2027 Life OS مرة واحدة على الحاسب أولاً.");
      })
      .catch((e) => setError(e.message || "تعذّر القراءة."));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = useCallback((mutate) => {
    setBusy(true);
    setError("");
    withState((s) => ({ ...s, gym: mutate(s.gym) }))
      .then((next) => {
        setGym(next.gym);
        setSleepLogs(next.sleepLogs || []);
      })
      .catch((e) => setError(e.message || "حصل خطأ."))
      .finally(() => setBusy(false));
  }, []);

  if (error && !gym) {
    return h(
      "div",
      { style: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 } },
      h(Card, { style: { maxWidth: 420, textAlign: "center" } }, h("p", { style: { fontSize: 14, lineHeight: 1.8 } }, error)),
    );
  }
  if (!gym) {
    return h("div", { style: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" } }, h("div", { style: { fontSize: 14, color: T.muted } }, "يتحمَّل…"));
  }

  const views = {
    home: () =>
      h(HomeView, {
        gym,
        sleepLogs,
        go: setTab,
        onLogWorkout: (w) => act((g) => logWorkout(g, w)),
      }),
    workouts: () =>
      h(WorkoutsView, {
        gym,
        busy,
        onLog: (w) => act((g) => logWorkout(g, w)),
        onDelete: (w) => act((g) => deleteWorkout(g, w.id)),
        onLogExercise: (ex) => act((g) => logExercise(g, ex)),
        onDeleteExerciseLog: (id) => act((g) => deleteExerciseLog(g, id)),
        onRenameExercise: (routineId, oldName, newName) =>
          act((g) => renameExerciseInGym(g, routineId, oldName, newName)),
      }),
    measurements: () =>
      h(MeasurementsView, {
        gym,
        busy,
        onWeigh: (w) => act((g) => logWeigh(g, w)),
        onMeasure: (m) => act((g) => logMeasure(g, m)),
      }),
    photos: () =>
      h(PhotosView, {
        gym,
        onAdd: (row) => act((g) => logPhoto(g, row)),
        onDelete: (row) => {
          /* يُحذَف سطر الحالة فوراً؛ ملف الصورة يُحذَف على التوازي ولا
             يُنتظَر — انظر التعليق في `deletePhotoFile`. */
          deletePhotoFile(row.filename);
          act((g) => deletePhoto(g, row.id));
        },
      }),
    analysis: () => h(AnalysisView, { gym, sleepLogs }),
    telegram: () => h(TelegramBotView, { gym }),
    settings: () =>
      h(SettingsView, {
        gym,
        onSaveSport: (s) => {
          const g = gymShape(gym);
          const has = g.sports.some((x) => x.id === s.id);
          act(() => ({ ...g, sports: has ? g.sports.map((x) => (x.id === s.id ? s : x)) : [...g.sports, s] }));
        },
        onToggleSport: (s) => act((g) => ({ ...g, sports: g.sports.map((x) => (x.id === s.id ? { ...x, off: !x.off } : x)) })),
        onSaveTarget: (t) => act((g) => ({ ...g, target: t })),
        onSetPlan: (d, v) => act((g) => ({ ...g, plan: { ...g.plan, [d]: v } })),
        onSaveRoutines: (r) => act((g) => saveRoutines(g, r)),
        onRenameExercise: (routineId, oldName, newName) =>
          act((g) => renameExerciseInGym(g, routineId, oldName, newName)),
      }),
  };

  return h(
    "div",
    { style: { maxWidth: 820, margin: "0 auto", padding: "24px 18px 80px", display: "flex", flexDirection: "column", gap: 20 } },
    h(NavBar, { tab, go: setTab }),
    error && h(Card, { style: { borderColor: "rgba(255,59,92,0.35)", background: "rgba(255,59,92,0.08)" } }, h("p", { style: { fontSize: 13, color: T.danger } }, error)),
    views[tab](),
  );
}

/* عامل الخدمة: يفتح الموقع ولو انقطعت الشبكة أو تيلسكيل. نفس شرط Life OS
   نفسه — `register()` بمسار نسبي، ومحميّ بـtry/catch لأن متصفحاً لا يدعم
   عمّال الخدمة لا يجوز أن يمنع الصفحة من الرسم. */
try {
  navigator.serviceWorker?.register("sw.js").catch(() => {});
} catch {}

ReactDOM.createRoot(document.getElementById("root")).render(h(App));
