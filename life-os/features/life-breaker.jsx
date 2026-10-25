import { Badge, Btn, Card, DOW_AR, Field, Modal, NumStep, T, arCount, dayWord, fallWord, meetWord, timesWord } from "../components/life-shared.jsx";
import { COST_TYPES, MIRROR_MIN, URGE_MOODS, URGE_TAGS, badHabitShape, bandAt, bandOf, bestRun, bleedSaved, breakerEvents, cleanDays, costType, dayKey, moodOf, rows, tagFallRate, tagOf, urgeShape, weakSpots } from "../state/life-state.mjs";
import { 
  AlertTriangle, Brain, Calculator, CalendarDays, Check, ChevronDown, ChevronUp, Clock, Crosshair, Flame, HeartCrack, Hourglass, LifeBuoy, Pencil, Plus, Radar, ShieldCheck, ShieldOff, Timer, Trash2, Shield, Zap, Wind, Activity, TrendingDown, XCircle, Smartphone, CreditCard, ArrowLeft, MoonStar,
  Gift, User, TrendingUp, Sparkles, Sun, Moon, Anchor, Crown, Compass
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

// 👇 دالة مساعدة لإنشاء الوقت والتاريخ (لحل خطأ الشاشة البيضاء) 👇
const stamp = () => ({ at: new Date().toISOString() });

/* ==================================================================== *
 *  THE ACCOUNTABILITY MIRROR — كاسر العادات (نسخة ساحة المعركة)
 * ==================================================================== */

export function BreakerModule({ state, setState }) {
  const list = state.badHabits || [];
  const [draft, setDraft] = useState(null);
  const [relapsing, setRelapsing] = useState(null);
  const [urging, setUrging] = useState(null);
  const [prefill, setPrefill] = useState(null);
  const [rewardId, setRewardId] = useState(null);
  const [lootBoxOpen, setLootBoxOpen] = useState(false);
  const rewardTimer = useRef(null);
  useEffect(() => () => clearTimeout(rewardTimer.current), []);

  const openAdd = () =>
    setDraft({
      id: "",
      title: "",
      identity: "", // ميزة الهوية
      startDate: dayKey(),
      costType: "money",
      costPerDay: "",
      replacement: "",
    });

  const openEdit = (h) => setDraft({ ...h, identity: h.identity || "", costPerDay: String(h.costPerDay ?? "") });

  const save = () => {
    const edit = draft.id;
    setState((s) => {
      const rows = s.badHabits || [];
      
      // إصلاح: استخدام النسخ الآمن لدمج الهوية دون التلاعب بالكائن الأصلي
      const shaped = {
        ...badHabitShape({
          ...draft,
          logs: edit ? rows.find((b) => b.id === edit)?.logs || [] : [],
        }),
        identity: draft.identity || "",
      };
      
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
    setLootBoxOpen(true); // تفعيل صندوق الغنائم
    clearTimeout(rewardTimer.current);
    rewardTimer.current = setTimeout(() => setRewardId(null), 900);
  };

  const cleanToday = list.filter((b) => cleanDays(b) > 0).length;
  const longest = list.reduce((n, b) => Math.max(n, cleanDays(b)), 0);

  return (
    <div className="space-y-10 pb-20 font-sans">
      
      {/* 👇 ترويسة غرفة العمليات 👇 */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0a0607] p-8 sm:p-12 border border-white/5">
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-red-500/10 blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/20 text-red-500 border border-red-500/30">
                <Shield size={24} />
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight">ساحة المعركة</h2>
            </div>
            <p className="text-sm leading-relaxed text-white/50">
              هنا لا تبني العادات، بل <span className="text-red-400 font-bold">تحطمها</span>. كل عادة تريد تركها هي عدو يجب هزيمته. راقب عدّاد صمودك، واستخدم أسلحتك (البدائل) عند الهجوم.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full md:w-auto">
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white/[0.03] border border-white/10 px-6 py-4 flex-1 md:flex-none">
              <span className="text-[10px] font-bold text-white/40 mb-1">أطول صمود</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-emerald-400">{longest}</span>
                <span className="text-xs text-white/50">يوم</span>
              </div>
            </div>
            <button
              onClick={openAdd}
              className="flex items-center justify-center gap-2 rounded-2xl bg-white text-black font-bold px-8 py-4 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
            >
              <Plus size={20} strokeWidth={3} /> أضف عادة
            </button>
          </div>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShieldOff size={48} strokeWidth={1} className="text-white/10 mb-4" />
          <p className="text-lg font-bold text-white/70">لا توجد أعداء في قائمتك بعد.</p>
          <p className="text-sm text-white/40 mt-2 max-w-sm">اختر العادة الأكثر تدميراً في حياتك وابدأ حربك المقدسة ضدها.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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

      {/* الميزة 5: التصميم البيئي */}
      {list.length > 0 && <EnvironmentDesign list={list} />}

      {list.length > 0 && <WeaknessMirror list={list} />}

      {/* المودالات (النوافذ المنبثقة) */}
      <BadHabitFormModal
        open={!!draft}
        draft={draft}
        setDraft={setDraft}
        onSave={save}
        onDelete={
          draft?.id
            ? () => {
                remove(draft.id);
                setDraft(null);
              }
            : undefined
        }
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

      {/* الميزة 8: صندوق الغنائم */}
      <LootBoxModal 
        open={lootBoxOpen} 
        onClose={() => setLootBoxOpen(false)} 
      />

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}


function BadHabitCard({ habit, onRelapse, onUrge, onEdit, onDelete, reward }) {
  const [openLogs, setOpenLogs] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const days = cleanDays(habit);
  const logs = habit.logs || [];
  const urges = habit.urges || [];
  
  const journal = useMemo(
    () =>
      [...logs, ...urges]
        .map((e, i) => ({ ...e, seq: i }))
        .sort((a, b) => (a.at === b.at ? a.seq - b.seq : a.at < b.at ? 1 : -1)),
    [logs, urges],
  );
  
  const best = bestRun(habit);
  const kind = costType(habit.costType);
  const totalBleed = Math.round(bleedSaved(habit));

  // رتب ومراحل التعافي
  const rank = useMemo(() => {
    if (days >= 90) return { label: "تحرر كامل 💎", stage: "المرحلة 4", tint: "#38bdf8", next: null, target: 90 };
    if (days >= 21) return { label: "مسار عصبي جديد 🥇", stage: "المرحلة 3", tint: "#eab308", next: "90 يوماً", target: 90 };
    if (days >= 7) return { label: "تأسيس الانضباط 🥈", stage: "المرحلة 2", tint: "#a855f7", next: "21 يوماً", target: 21 };
    if (days >= 3) return { label: "كسر الحاجز 🥉", stage: "المرحلة 1", tint: "#10b981", next: "7 أيام", target: 7 };
    return { label: "بداية التحدي 🌱", stage: "المرحلة 0", tint: "#64748b", next: "3 أيام", target: 3 };
  }, [days]);

  // حساب شريط آخر 14 يوماً مع نقاط السقوط الفعلية
  const streakStrip = useMemo(() => {
    const items = [];
    const today = new Date();
    const fallDates = new Set(
      logs
        .filter((l) => l.kind === "fall" && l.at)
        .map((l) => l.at.split("T")[0])
    );

    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split("T")[0];
      const isPastStartDate = !habit.startDate || iso >= habit.startDate;
      const isFall = fallDates.has(iso);
      const isClean = isPastStartDate && !isFall && i <= days;

      items.push({
        dayIndex: i,
        date: iso,
        isToday: i === 0,
        status: isFall ? "fall" : isClean ? "clean" : "idle",
      });
    }
    return items;
  }, [habit.startDate, days, logs]);

  return (
    <Card
      className={`group relative flex flex-col overflow-hidden rounded-[2.2rem] border border-white/10 bg-gradient-to-b from-[#161214] to-[#0c0a0c] p-0 shadow-2xl transition-all duration-300 hover:border-white/20 hover:shadow-[0_0_50px_rgba(244,63,94,0.12)] ${
        reward ? "ring-2 ring-emerald-500 ring-offset-4 ring-offset-black" : ""
      }`}
    >
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />

      {/* الرأس: اسم العادة + الرتبة + أزرار التعديل */}
      <div className="relative z-10 flex items-start justify-between p-6 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shadow-inner">
            <ShieldOff size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-white tracking-tight">{habit.title}</h3>
              <span
                className="px-2.5 py-0.5 rounded-lg text-[10px] font-black border"
                style={{
                  backgroundColor: `${rank.tint}18`,
                  borderColor: `${rank.tint}40`,
                  color: rank.tint,
                }}
              >
                {rank.label}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-white/40 font-bold">
                {rank.stage} {rank.next ? `(الهدف القادم: ${rank.next})` : "أعلى رتبة! 🎉"}
              </span>
              {habit.identity && (
                <Badge tint={T.accent} className="text-[9.5px] py-0 px-2 flex items-center gap-1">
                  <User size={10} /> {habit.identity}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-2 text-white/30 hover:text-white transition-colors rounded-xl hover:bg-white/5"
            title="تعديل العادة"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => (confirmDel ? onDelete() : setConfirmDel(true))}
            className={`p-2 rounded-xl transition-colors ${
              confirmDel ? "bg-red-500/20 text-red-400" : "text-white/30 hover:text-red-400 hover:bg-white/5"
            }`}
            title="حذف العادة"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {confirmDel && (
        <div className="mx-6 mt-3 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2">
          <p className="flex-1 text-[11px] text-red-300">سيُحذف السجل كاملاً. هل أنت متأكد؟</p>
          <button
            onClick={() => setConfirmDel(false)}
            className="text-[11px] font-bold text-white/50 hover:text-white"
          >
            تراجع
          </button>
        </div>
      )}

      {/* العدادين المباشرين: صمود الأيام + الوقت/المال المسترجع */}
      <div className="relative z-10 grid grid-cols-2 gap-3 p-6 pb-2">
        {/* عداد الصمود */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-black/40 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/50 text-[11px] font-bold mb-1">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck size={14} /> الصمود الحالي
            </span>
            {best > 0 && (
              <span className="text-[10px] text-white/40 flex items-center gap-0.5">
                <Flame size={11} className="text-amber-400" /> الرقم القياسي: {best}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span dir="ltr" className="text-4xl sm:text-5xl font-black text-white tabular-nums tracking-tight">
              {days}
            </span>
            <span className="text-xs font-bold text-white/50">يوم صامد</span>
          </div>
        </div>

        {/* عداد المسترجع */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-black/40 p-4 flex flex-col justify-between">
          <span className="flex items-center gap-1 text-sky-400 text-[11px] font-bold mb-1">
            <Zap size={14} /> ما أنقذته
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span dir="ltr" className="text-3xl sm:text-4xl font-black text-white tabular-nums">
              {totalBleed.toLocaleString("en-US")}
            </span>
            <span className="text-[11px] font-bold text-white/50">{arCount(totalBleed, kind.forms)}</span>
          </div>
        </div>
      </div>

      {/* 🟩 متتبع الأيام المرئي التفاعلي (Streak Strip - آخر 14 يوماً) تحت العداد مباشرة 🟩 */}
      <div className="relative z-10 px-6 py-3">
        <div className="rounded-2xl border border-white/5 bg-black/30 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-white/60 flex items-center gap-1">
              <CalendarDays size={13} className="text-emerald-400" /> مسار صمودك (آخر 14 يوماً)
            </span>
            <span className="text-[10px] font-mono text-emerald-400/90">
              {streakStrip.filter((s) => s.status === "clean").length} من 14 يوم صامد
            </span>
          </div>

          {/* شريط المكعبات */}
          <div className="grid grid-cols-14 gap-1.5 pt-1" dir="ltr">
            {streakStrip.map((item, idx) => {
              const isClean = item.status === "clean";
              const isFall = item.status === "fall";
              return (
                <div
                  key={idx}
                  title={`${item.date}: ${isClean ? "يوم صامد ونظيف ✅" : isFall ? "تعثر ⚠️" : "قبل بداية السلسلة"}`}
                  className={`h-7 rounded-lg transition-all flex items-center justify-center text-[10px] font-mono cursor-default ${
                    isClean
                      ? "bg-emerald-500/25 border border-emerald-500/50 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                      : isFall
                        ? "bg-rose-500/30 border border-rose-500/60 text-rose-300"
                        : "bg-white/5 border border-white/5 text-white/20"
                  } ${item.isToday ? "ring-2 ring-white/40" : ""}`}
                >
                  {isClean ? "✓" : isFall ? "✕" : "•"}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[9.5px] font-bold text-white/40 pt-1">
            <span>قبل أسبوعين</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-emerald-500" /> صامد
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-rose-500" /> تعثر
              </span>
            </div>
            <span>اليوم</span>
          </div>
        </div>
      </div>

      {/* البديل السريع المباشر */}
      <div className="relative z-10 px-6 py-2">
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-3.5 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
            <Crosshair size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-indigo-300 mb-0.5">البديل الفوري عند هجوم الرغبة:</p>
            <p className="text-xs leading-relaxed text-white/80 font-medium">
              {habit.replacement || "ضع خطة بديلة فورية، لأن الرغبة تأتي مفاجئة."}
            </p>
          </div>
        </div>
      </div>

      {/* أزرار المواجهة والانتكاسة السريعة */}
      <div className="relative z-10 p-6 pt-3 mt-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={onUrge}
          className="group/btn relative flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-emerald-600 px-5 py-3.5 font-black text-white text-xs transition-all hover:bg-emerald-500 hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
          <ShieldCheck size={18} />
          <span>واجهت الرغبة (SOS)</span>
        </button>

        <button
          onClick={onRelapse}
          className="flex items-center justify-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-3.5 font-black text-rose-300 text-xs transition-all hover:bg-rose-500/20 hover:text-rose-200 active:scale-95"
        >
          <HeartCrack size={18} />
          <span>سجل تعثر (انتكاسة)</span>
        </button>
      </div>

      {/* سجل المواجهات السابق */}
      {journal.length > 0 && (
        <div className="relative z-10 mx-6 mb-5">
          <button
            onClick={() => setOpenLogs((v) => !v)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/5 py-2 text-[11px] font-bold text-white/40 hover:text-white/80 transition-colors"
          >
            {openLogs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            سجل المواجهات السابقة ({journal.length})
          </button>

          {openLogs && (
            <div className="mt-3 space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-2">
              {journal.map((l) => {
                const fell = l.kind === "fall";
                const tint = fell ? T.danger : T.primary;
                const t = tagOf(l.tag);
                return (
                  <div
                    key={l.id}
                    className="rounded-xl border px-3 py-2 text-[11px]"
                    style={{ borderColor: `${tint}30`, background: `${tint}0A` }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span dir="ltr" className="text-white/30 text-[9px] tabular-nums">
                        {l.at ? l.at.split("T")[0] : ""}
                      </span>
                      {fell ? <Badge tint={T.danger}>تعثر</Badge> : <Badge tint={T.primary}>صمود</Badge>}
                      {t && <Badge tint={t.tint}>{t.label}</Badge>}
                    </div>
                    {l.trigger && <p className="text-white/70 italic">"{l.trigger}"</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

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

  useEffect(() => {
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

  const title = mode === "wave" ? "اركب الموجة" : mode === "after" ? "لقد نجوت" : "درع الرغبة (SOS)";

  const footer = mode === "wave" ? (
    <Btn variant="outline" className="flex-1" onClick={() => setMode("pick")}>
      أوقف المؤقت
    </Btn>
  ) : mode === "after" ? (
    <>
      <Btn variant="success" className="flex-1" onClick={log}>
        <ShieldCheck size={18} /> صمدت وانتصرت
      </Btn>
      <Btn variant="danger" className="flex-1" onClick={() => onFell({ tag, mood, trigger: note.trim() })}>
        <HeartCrack size={18} /> لم أصمد
      </Btn>
    </>
  ) : (
    <>
      <Btn variant="success" className="flex-1" disabled={!tag} onClick={log}>
        <ShieldCheck size={18} /> سجّلها صمودًا
      </Btn>
      <Btn variant="outline" className="flex-1" onClick={onClose}>
        إلغاء
      </Btn>
    </>
  );

  return (
    <Modal open={open} onClose={onClose} title={title} footer={footer}>
      {mode === "wave" ? (
        <div className="flex flex-col items-center justify-center py-6">
          <div className="relative flex h-48 w-48 items-center justify-center mb-8">
             <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping" style={{ animationDuration: '3s' }} />
             <div className="absolute inset-4 rounded-full border-2 border-emerald-500/40 animate-pulse" />
             <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full bg-emerald-950/80 shadow-[0_0_50px_rgba(16,185,129,0.3)] backdrop-blur-md">
                <span dir="ltr" className="text-5xl font-black text-white tabular-nums">{mm}:{ss}</span>
                <span className="text-[10px] font-bold text-emerald-300 mt-2 uppercase tracking-widest">Take a breath</span>
             </div>
          </div>
          
          <p className="text-center text-sm font-bold text-white/80 mb-6 max-w-sm">
            الرغبة تستمر 60 ثانية فقط. خذ نفساً عميقاً، ولا تفعل شيئاً حتى ينتهي المؤقت.
          </p>

          {picked && (
            <div className="w-full rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-center">
              <p className="text-[11px] font-bold text-indigo-300 mb-1">نفّذ هذا بدل الانتظار الفارغ:</p>
              <p className="text-sm text-white">{picked.counter}</p>
            </div>
          )}
        </div>
      ) : mode === "after" ? (
        <div className="text-center py-8 space-y-4">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-emerald-500/20 text-emerald-400">
              <ShieldCheck size={48} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white">انتهت الموجة!</h3>
          <p className="text-sm text-white/60 leading-relaxed max-w-md mx-auto">
            الرغبة التي بدت قبل قليل وكأنها لن تمرّ — أين هي الآن؟<br/>
            <span className="text-emerald-400 font-bold mt-2 inline-block">لقد انتصرت على عقلك.</span>
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-xs text-amber-200/80 leading-relaxed">
              أنت تواجه الرغبة الآن. سجّل المحفز، ثم ابدأ "موجة الصمود" لتعبر بك الرغبة بسلام.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-white/50">ما الذي استدعاها الآن؟</label>
            <TagPicker value={tag} onPick={setTag} />
          </div>

          {picked && (
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4">
              <p className="text-[11px] font-bold text-indigo-300 mb-1">سلاحك المضاد لهذا المحفز:</p>
              <p className="text-sm text-white/90">{picked.counter}</p>
            </div>
          )}

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="text-[11px] font-bold text-emerald-400 mb-2">اركب الموجة (Resist)</p>
            <div className="grid grid-cols-2 gap-2">
              {WAVE_OPTIONS.map((o) => (
                <Btn key={o.min} variant="success" size="sm" disabled={!tag} onClick={() => start(o.min)}>
                  <Timer size={14} /> {o.label}
                </Btn>
              ))}
            </div>
            {!tag && <p className="mt-2 text-[10px] text-white/40">اختر المحفز أولاً.</p>}
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-white/50">كيف تشعر الآن؟ (اختياري)</label>
            <MoodPicker value={mood} onPick={setMood} />
          </div>
        </div>
      )}
    </Modal>
  );
}


function RelapseModal({ open, habit, prefill, onClose, onConfirm }) {
  const [trigger, setTrigger] = useState("");
  const [feeling, setFeeling] = useState("");
  const [tag, setTag] = useState("");
  const [mood, setMood] = useState("");
  const [owned, setOwned] = useState(false);

  useEffect(() => {
    if (open) {
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
            <ShieldCheck size={18} /> لا، سأصمد
          </Btn>
          <Btn
            variant="default"
            className="flex-1"
            disabled={!ready}
            onClick={() => onConfirm({ trigger: trigger.trim(), feeling: feeling.trim(), tag, mood })}
            style={{
              backgroundImage: `linear-gradient(135deg, ${T.danger}, ${T.ember})`,
              boxShadow: `0 8px 24px -10px ${T.danger}`,
              color: "#1A0603",
            }}
          >
            <HeartCrack size={18} /> صفّر العدّاد
          </Btn>
        </>
      }
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-red-500" />
            <p className="text-sm font-black text-red-500 uppercase tracking-wide">أنت على وشك أن تخسر</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p dir="ltr" className="text-3xl font-black text-red-400 leading-none tabular-nums">{days}</p>
              <p className="mt-1 text-[11px] font-bold text-red-300/70">{`${dayWord(days)} من الصمود`}</p>
            </div>
            <div>
              <p dir="ltr" className="text-3xl font-black text-red-400 leading-none tabular-nums">{lost.toLocaleString("en-US")}</p>
              <p className="mt-1 text-[11px] font-bold text-red-300/70">{`${arCount(lost, kind.forms)} استرجعتها`}</p>
            </div>
          </div>
          <p className="mt-4 border-t border-red-500/20 pt-3 text-xs leading-relaxed text-red-200/80 font-bold">
            هذه ليست لحظة ضعف تمرّ عليك — هذا قرار تأخذه الآن بيدك. الرغبة تمرّ خلال دقائق سواء استجبت لها أو لا.
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-white/50">ما الذي فتح الباب؟ اختر واحدًا — هذا ما تُبنى عليه مرآتك.</label>
          <TagPicker value={tag} onPick={setTag} />
        </div>

        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-white/50">ما شعورك قبلها مباشرة؟</label>
          <MoodPicker value={mood} onPick={setMood} />
        </div>

        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-white/50">اكتبها بتفصيلها: أين كنت ومع من وماذا حدث؟</label>
          <Field
            as="textarea"
            rows={3}
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            className="resize-none leading-relaxed bg-black/40 border-white/10"
            placeholder="كنت وحيدًا بعد منتصف الليل والهاتف بيدي…"
          />
        </div>

        <button
          type="button"
          onClick={() => setOwned((v) => !v)}
          aria-pressed={owned}
          className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-right transition-all hover:bg-white/10"
          style={{ borderColor: owned ? `${T.danger}80` : undefined, background: owned ? `${T.danger}14` : undefined }}
        >
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-white/20" style={{ borderColor: owned ? T.danger : undefined, background: owned ? T.danger : "transparent" }}>
            <Check size={14} strokeWidth={4} className="text-black" style={{ opacity: owned ? 1 : 0 }} />
          </div>
          <span className={`text-[12px] font-bold ${owned ? 'text-red-400' : 'text-white/60'}`}>
            أُقرّ أن هذا اختيار اخترته، لا قدر نزل بي.
          </span>
        </button>
      </div>
    </Modal>
  );
}


function BadHabitFormModal({ open, draft, setDraft, onSave, onClose, onDelete }) {
  const [step, setStep] = useState(1);
  
  useEffect(() => {
    if (open) setStep(1);
  }, [open]);

  if (!draft) return null;
  
  const ready = draft.title.trim() && draft.replacement.trim();
  const seed = BAD_PRESETS.find((p) => p.key === draft.preset);

  const usePreset = (p) =>
    setDraft((d) => ({
      ...d,
      preset: p.key,
      title: p.title,
      identity: p.identity || "",
      costType: p.costType,
      replacement: p.replacement,
      costPerDay: String(
        Math.round(
          estimateBleed(p.costType, {
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

  const nextStep = () => setStep((s) => Math.min(3, s + 1));
  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20 text-red-500 border border-red-500/30">
            <Crosshair size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">بروتوكول استهداف</h2>
            <p className="text-xs text-white/50 font-bold">
              {draft.id ? "تعديل بيانات العدو" : "إضافة عدو جديد لساحة المعركة"}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex w-full gap-3">
          {step > 1 ? (
            <Btn variant="outline" className="flex-1" onClick={prevStep}>
              السابق
            </Btn>
          ) : (
            <Btn variant="outline" className="flex-1" onClick={onClose}>
              إلغاء
            </Btn>
          )}

          {step < 3 ? (
            <Btn variant="default" className="flex-1" onClick={nextStep} disabled={step === 1 && !draft.title.trim()}>
              التالي <ArrowLeft size={16} className="mr-1 rotate-180" />
            </Btn>
          ) : (
            <Btn 
              variant="default" 
              className="flex-1 bg-red-600 hover:bg-red-500 text-white border-none shadow-[0_0_30px_rgba(239,68,68,0.4)]" 
              disabled={!ready} 
              onClick={onSave}
            >
              <ShieldOff size={18} /> {draft.id ? "حفظ التعديلات" : "أعلن الحرب الآن"}
            </Btn>
          )}
        </div>
      }
    >
      <div className="space-y-6 py-2 min-h-[40vh] flex flex-col">
        
        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 h-1.5 rounded-full transition-all duration-500" 
                 style={{ backgroundColor: step >= s ? T.danger : 'rgba(255,255,255,0.1)' }} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
            {!draft.id && (
              <div className="space-y-3">
                <label className="block text-sm font-bold text-white/80">اختر هدفاً من ملفات الاستخبارات (أعداء شائعون)</label>
                <div className="grid grid-cols-2 gap-3">
                  {BAD_PRESETS.map((p) => {
                    const on = draft.preset === p.key;
                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => usePreset(p)}
                        className={`group relative flex flex-col items-start gap-2 rounded-2xl border p-4 text-right transition-all duration-300 ${
                          on ? 'border-red-500/50 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.15)]' : 'border-white/5 bg-black/40 hover:border-white/20'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${on ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/40 group-hover:text-white/70'}`}>
                          {p.key === 'delay' && <Clock size={18} />}
                          {p.key === 'scroll' && <Smartphone size={18} />}
                          {p.key === 'late' && <MoonStar size={18} />}
                          {p.key === 'spend' && <CreditCard size={18} />}
                        </div>
                        <span className={`text-sm font-bold ${on ? 'text-white' : 'text-white/60'}`}>{p.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-sm font-bold text-white/80">اسم العادة التي تريد كسرها (عدوك المباشر)</label>
              <Field
                autoFocus
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="مثال: التسويف، السهر، التصفح اللانهائي..."
                className="bg-black/50 border-white/10 text-lg font-bold text-red-100 placeholder:text-white/20 h-14"
              />
            </div>

            {/* الميزة 3: الهوية */}
            <div className="space-y-3 mt-4 pt-4 border-t border-white/5">
              <label className="block text-sm font-bold text-white/80">من أنا بدون هذه العادة؟ (الهوية)</label>
              <Field
                value={draft.identity || ""}
                onChange={(e) => setDraft((d) => ({ ...d, identity: e.target.value }))}
                placeholder="مثال: أنا شخص يتحكم بوقته، شخص يتنفس بحرية..."
                className="bg-black/50 border-violet-500/30 text-violet-100 placeholder:text-white/20 focus:border-violet-500"
              />
              <p className="text-[11px] text-white/40">لا تقل "أنا أحاول ترك التدخين"، بل تبنَّ الهوية الجديدة.</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
              <div className="flex items-center gap-3 mb-3 relative z-10">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="text-sm font-bold text-emerald-400">سلاحك البديل (خطة الهجوم)</h3>
              </div>
              <p className="text-[11px] text-emerald-200/60 mb-4 leading-relaxed relative z-10">
                الدماغ لا يستطيع حذف عادة، بل يستبدلها. ماذا ستفعل <span className="font-bold text-white">بالضبط</span> في اللحظة التي تهجم فيها الرغبة؟
              </p>
              
              <Field
                as="textarea"
                rows={4}
                value={draft.replacement}
                onChange={(e) => setDraft((d) => ({ ...d, replacement: e.target.value }))}
                className="resize-none leading-relaxed bg-black/40 border-emerald-500/30 text-white placeholder:text-white/20 text-sm focus:border-emerald-500"
                placeholder="أتوضأ وأخرج للمشي 5 دقائق، وأترك الهاتف في غرفة أخرى..."
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
            <div className="space-y-3">
              <label className="block text-sm font-bold text-white/80">ماذا تنزف هذه العادة؟</label>
              <div className="grid grid-cols-2 gap-3">
                {COST_TYPES.map((c) => {
                  const on = draft.costType === c.id;
                  const Icon = c.icon;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, costType: c.id }))}
                      className={`flex flex-col items-center justify-center gap-2 rounded-2xl border py-4 text-sm font-bold transition-all duration-200 ${
                        on ? 'bg-white/10' : 'bg-black/40 border-white/5 hover:bg-white/5'
                      }`}
                      style={{ borderColor: on ? c.tint : undefined, color: on ? c.tint : 'rgba(255,255,255,0.4)' }}
                    >
                      <Icon size={24} /> 
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-bold text-white/80">
                {`الكلفة اليومية (${costType(draft.costType).unit})`}
              </label>
              <div className="flex gap-3">
                <Field
                  type="number"
                  min="0"
                  step="0.5"
                  dir="ltr"
                  className="text-left tabular-nums bg-black/50 border-white/10 text-xl font-bold h-14 flex-1"
                  value={draft.costPerDay}
                  onChange={(e) => setDraft((d) => ({ ...d, costPerDay: e.target.value }))}
                  placeholder="0"
                />
                <div className="flex items-center justify-center px-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm">
                  {draft.costPerDay ? `تخسر ${draft.costPerDay} يومياً` : 'حدد الرقم'}
                </div>
              </div>
              <CostEstimator
                key={`${draft.preset || "none"}-${draft.costType}`}
                type={draft.costType}
                seed={seed ? { method: seed.key === "delay" ? "share" : "bouts", bouts: seed.bouts, minutes: seed.minutes } : null}
                onPick={(v) => setDraft((d) => ({ ...d, costPerDay: String(v) }))}
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-bold text-white/80">متى كانت آخر مرة استسلمت لها؟</label>
              <Field
                type="date"
                dir="ltr"
                className="text-left bg-black/50 border-white/10 h-14"
                max={dayKey()}
                value={draft.startDate}
                onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value || dayKey() }))}
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}


function WeaknessMirror({ list }) {
  const w = useMemo(() => weakSpots(list), [list]);
  const events = useMemo(() => breakerEvents(list), [list]);
  const fatal = w.fatal;
  const common = w.tag;
  const prescribe = (fatal && tagOf(fatal.value)) || (common && tagOf(common.value));

  return (
    <Card className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#070709] p-6 sm:p-10 shadow-2xl mt-8">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-violet-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex items-center gap-4 mb-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/20 border border-violet-500/30 text-violet-400 shadow-[0_0_30px_rgba(139,92,246,0.2)]">
          <Radar size={28} />
        </div>
        <div>
          <h3 className="text-2xl font-black text-white tracking-tight">مرآة نقاط الضعف</h3>
          <p className="text-xs text-white/40 mt-1">تحليل استخباراتي لبيانات معاركك</p>
        </div>
      </div>

      {!w.ready ? (
        <div className="relative z-10 max-w-2xl mx-auto text-center py-10">
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-violet-500 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)] transition-all" style={{ width: `${Math.min(100, (w.total / MIRROR_MIN) * 100)}%` }} />
          </div>
          <p className="text-sm font-bold text-white/60 mb-2">جاري جمع البيانات...</p>
          <p className="text-xs text-white/40">يبدأ التشخيص بعد {MIRROR_MIN} مواجهات مسجلة (سجل صمودك أو انتكاستك).</p>
        </div>
      ) : (
        <div className="relative z-10 space-y-8">
          
          {prescribe && (
            <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-violet-400">
                <Crosshair size={32} />
              </div>
              <div>
                <p className="text-xs font-black text-violet-300 uppercase tracking-widest mb-1">عدوك الأول</p>
                <h4 className="text-2xl font-black text-white mb-2">{prescribe.label}</h4>
                <p className="text-sm text-white/70 leading-relaxed">
                  {fatal ? (
                    <>سقطت بسببه <span className="font-bold text-red-400">{fatal.count}</span> من أصل <span className="font-bold text-white">{fatal.total}</span> مواجهة. </>
                  ) : (
                    <>يتكرر في <span className="font-bold text-white">{common.pct}%</span> من مواجهاتك. </>
                  )}
                  <span className="text-violet-200 font-bold">السلاح المقترح: {prescribe.counter}</span>
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <MirrorTile
              icon={Clock}
              label="ساعة الخطر"
              tint="#f59e0b"
              value={w.band ? bandOf(w.band.value).label : "—"}
              sub={w.band ? `${w.band.pct}% من مواجهاتك تقع هنا` : "لا بيانات"}
            />
            <MirrorTile
              icon={CalendarDays}
              label="يوم الخطر"
              tint="#6366f1"
              value={w.dow ? DOW_AR[Number(w.dow.value)] : "—"}
              sub={w.dow ? `${w.dow.count} مواجهة في هذا اليوم` : "لا بيانات"}
            />
            <MirrorTile
              icon={ShieldCheck}
              label="معدل صمودك"
              tint={w.hold >= 50 ? T.primary : T.danger}
              value={`${w.hold}%`}
              sub={`صمدت في ${w.holds} من ${w.total} مواجهة`}
            />
            <MirrorTile
              icon={Flame}
              label="متوسط الصمود"
              tint="#10b981"
              value={w.falls ? `${Math.round(w.avgRun)} يوم` : "بلا انتكاسة"}
              sub={w.trend ? (w.trend.dir === "up" ? "أنت تتحسن!" : "تحتاج لمراجعة خطتك") : "اجمع بيانات أكثر"}
            />
          </div>

          {w.tag && (
            <div className="rounded-2xl border border-white/5 bg-black/40 p-6">
              <h4 className="text-sm font-bold text-white mb-6 flex items-center gap-2"><Activity size={16} className="text-sky-400"/> خريطة المحفزات (Triggers)</h4>
              <div className="space-y-4">
                {w.tag.rows.map((r) => {
                  const t = tagOf(r.value);
                  if (!t) return null;
                  const rate = tagFallRate(events, r.value);
                  const Icon = t.icon;
                  return (
                    <div key={r.value}>
                      <div className="flex items-center gap-3 mb-1.5">
                        <Icon size={14} style={{ color: t.tint }} />
                        <span className="flex-1 text-xs font-bold text-white/80">{t.label}</span>
                        {rate && (
                          <span className={`text-[10px] font-bold ${rate.pct >= 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                            سقوط: {rate.lost}/{rate.met}
                          </span>
                        )}
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${r.pct}%`, backgroundColor: t.tint }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

/* ==================================================================== *
 *  الميزة 5: التصميم البيئي (Environment Design)
 * ==================================================================== */
function EnvironmentDesign({ list }) {
  const w = useMemo(() => weakSpots(list), [list]);
  // إصلاح: استخدام القيمة النصية مباشرة بدلاً من تحويلها لرقم وإحداث خطأ NaN
  const bandValue = w.band ? w.band.value : null;
  const bandInfo = bandValue ? bandOf(bandValue) : null;
  const bandLabel = bandInfo ? bandInfo.label : null;

  const isLateNight = bandLabel && (bandLabel.includes("ليل") || bandLabel.includes("سهر") || bandLabel.includes("مساء"));
  const isMorning = bandLabel && (bandLabel.includes("صباح") || bandLabel.includes("فجر"));

  const intervention = useMemo(() => {
    if (!bandLabel) {
      return {
        title: 'لا توجد بيانات كافية',
        desc: 'سجل انتكاسة أو استخدم درع الرغبة لنكشف لك بيئتك الخطر.',
        icon: Compass,
        tint: '#64748b',
        tips: ['راقب أنماطك يدوياً هذا الأسبوع.'],
      };
    }
    if (isLateNight) {
      return {
        title: 'خطر السهر المتأخر',
        desc: 'دماغك في هذا الوقت يبحث عن مكافأة سريعة لتعويض التعب.',
        icon: Moon,
        tint: '#6366f1',
        tips: [
          'ضع الهاتف في غرفة أخرى قبل الـ 10 مساءً.',
          'استبدل الشاشة بكتاب أو شاي أعشاب.',
          'اضبط منبهاً لإيقاف الشاشات.',
        ],
      };
    }
    if (isMorning) {
      return {
        title: 'خطر بداية اليوم',
        desc: 'قد يكون التوتر أو ضغط المهام هو المحفز الأول.',
        icon: Sun,
        tint: '#f59e0b',
        tips: [
          'ابدأ يومك بـ 10 دقائق هدوء قبل فتح الهاتف.',
          'جهز ملابسك وأدواتك في الليلة السابقة.',
        ],
      };
    }
    return {
      title: 'خطر أوقات متفرقة',
      desc: 'محفزاتك موزعة. تحتاج إلى خطة مرونة يومية.',
      icon: Shield,
      tint: '#8b5cf6',
      tips: ['احتفظ بقائمة "أسلحة بديلة" جاهزة في هاتفك.'],
    };
  }, [bandLabel, isLateNight, isMorning]);

  const Icon = intervention.icon;

  return (
    <Card className="mt-8 p-6 sm:p-8 rounded-[2rem] border border-white/5 bg-[#0a0607]">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10" style={{ color: intervention.tint }}>
          <Icon size={24} />
        </span>
        <div>
          <h3 className="text-lg font-black text-white tracking-tight">خطة التدخل البيئي</h3>
          <p className="text-xs text-white/40">
            {bandLabel ? `بناءً على ساعة الخطر: ${bandLabel}` : 'بيئة آمنة = عادات مكسورة'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: `${intervention.tint}10`, borderColor: `${intervention.tint}30` }}>
          <p className="text-sm font-bold text-white mb-1">{intervention.title}</p>
          <p className="text-[12px] leading-relaxed text-white/60">{intervention.desc}</p>
        </div>

        <div className="rounded-2xl bg-black/40 border border-white/5 p-5">
          <p className="mb-3 text-[11px] font-bold text-white/50 uppercase tracking-widest">إجراءات فورية لتغيير بيئتك:</p>
          <ul className="space-y-3">
            {intervention.tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-3 text-[12px] text-white/70">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[10px] font-bold" style={{ color: intervention.tint }}>
                  {idx + 1}
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}

/* ==================================================================== *
 *  الميزة 8: صندوق الغنائم (Loot Box / Variable Rewards)
 * ==================================================================== */
const LOOT_REWARDS = [
  { id: 'l1', title: 'شارة "الموجة المكسورة"', desc: 'لقد تغلبت على رغبة ملحّة. دماغك يتعلم أنك تتحكم به، وليس العكس.', icon: ShieldCheck, tint: T.primary },
  { id: 'l2', title: 'الاقتباس الذهبي', desc: '"بينما نتظر طويلاً للفرص الكبيرة، فإن الحياة اليومية تمر." - علي الوردي', icon: Crown, tint: T.accent },
  { id: 'l3', title: 'دفعة دوبامين', desc: 'أنت أقوى من هذا. تذكر شعور الفخر الذي ستشعر به في المساء.', icon: Sparkles, tint: '#8b5cf6' },
  { id: 'l4', title: 'شارة "الصياد"', desc: 'الرغبة موجة، وأنت صياد ماهر. اتركها تمر ولا تقفز في الماء.', icon: Anchor, tint: '#10b981' },
  { id: 'l5', title: 'تذكير بالهوية', desc: 'كل مرة تصمد فيها، تصوّت للشخص الذي تريد أن تكونه.', icon: User, tint: T.danger },
];

function LootBoxModal({ open, onClose }) {
  const [opened, setOpened] = useState(false);
  const [reward, setReward] = useState(null);

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setOpened(false);
        setReward(null);
      }, 300);
    }
  }, [open]);

  const handleOpen = () => {
    const randomReward = LOOT_REWARDS[Math.floor(Math.random() * LOOT_REWARDS.length)];
    setReward(randomReward);
    setOpened(true);
  };

  // إصلاح: استخراج الأيقونة كمتغير بحرف كبير لكي يتعرف عليها React
  const RewardIcon = reward?.icon || Gift;

  return (
    <Modal open={open} onClose={onClose} title="صندوق الغنائم" footer={
      opened ? <Btn variant="success" className="w-full" onClick={onClose}>استلام المكافأة</Btn> : null
    }>
      <div className="flex flex-col items-center justify-center py-8">
        {!opened ? (
          <div className="flex flex-col items-center animate-pulse">
            <button
              onClick={handleOpen}
              className="group relative flex h-32 w-32 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-[0_0_60px_-10px_rgba(139,92,246,0.8)] transition-transform hover:scale-105 active:scale-95"
            >
              <Gift className="h-14 w-14 text-white" />
              <span className="absolute -bottom-8 whitespace-nowrap text-xs font-bold text-violet-300">
                اضغط لفتح الصندوق
              </span>
            </button>
          </div>
        ) : (
          <div className="w-full animate-in fade-in zoom-in duration-500">
            <div className="rounded-2xl p-6 text-center border" style={{ backgroundColor: `${reward.tint}15`, borderColor: `${reward.tint}40` }}>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.05] ring-1 ring-white/10">
                <RewardIcon className="h-8 w-8" style={{ color: reward.tint }} />
              </div>
              <h4 className="text-xl font-black text-white">{reward.title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-white/80">
                {reward.desc}
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}


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

  const set = (patch) => {
    const next = { ...e, ...patch };
    setE(next);
    onPick(Math.round(estimateBleed(type, next) * 10) / 10);
  };

  const daily = Math.round(estimateBleed(type, e) * 10) / 10;
  const kind = costType(type);
  const yearly = daily * 365;
  const asDays = type === "time" ? Math.round(yearly / 24) : 0;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold text-sky-400 hover:text-sky-300 transition-colors"
      >
        <Calculator size={14} />
        {open ? "أغلق الحاسبة" : "لا أعرف الرقم — احسبه معي"}
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {open && (
        <div className="mt-3 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-5">
          {type === "time" && (
            <div className="mb-4 grid grid-cols-2 gap-2">
              {[
                { id: "bouts", label: "نوبات متفرّقة" },
                { id: "share", label: "تلتهم يومي" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => set({ method: m.id })}
                  className={`rounded-xl border py-2 text-[11.5px] font-bold transition-all ${e.method === m.id ? 'border-sky-500 bg-sky-500/20 text-sky-300' : 'border-white/10 text-white/50 hover:bg-white/5'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {type === "money" ? (
              <>
                <EstRow label="كم مرة في الأسبوع؟"><NumStep value={e.perWeek} onChange={(v) => set({ perWeek: v })} min={1} max={70} unit="مرة" tint={T.accent} /></EstRow>
                <EstRow label="كم تدفع في المرة الواحدة؟"><NumStep value={e.amount} onChange={(v) => set({ amount: v })} min={1} max={5000} step={5} unit="ريال" tint={T.accent} /></EstRow>
              </>
            ) : e.method === "share" ? (
              <>
                <EstRow label="كم ساعة نويت أن تعمل اليوم؟"><NumStep value={e.planned} onChange={(v) => set({ planned: v })} min={1} max={16} unit="ساعة" /></EstRow>
                <EstRow label="كم منها ضاع فعلًا؟"><NumStep value={e.lost} onChange={(v) => set({ lost: v })} min={5} max={100} step={5} unit="٪" /></EstRow>
              </>
            ) : (
              <>
                <EstRow label="كم مرة في اليوم؟"><NumStep value={e.bouts} onChange={(v) => set({ bouts: v })} min={1} max={40} unit="مرة" /></EstRow>
                <EstRow label="كم دقيقة في المرة؟"><NumStep value={e.minutes} onChange={(v) => set({ minutes: v })} min={1} max={600} step={5} unit="دقيقة" /></EstRow>
              </>
            )}
          </div>

          <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-[10px] font-bold text-red-400 mb-1">الكلفة اليومية</p>
            <p className="text-2xl font-black text-white">{daily} <span className="text-sm text-red-300">{kind.forms[0]}</span></p>
            <p className="mt-2 text-[11px] text-white/60">
              على هذا المعدل تخسر <span className="font-bold text-red-400">{type === "time" ? asDays : Math.round(yearly).toLocaleString("en-US")}</span> {type === "time" ? "يوم كامل" : "ريال"} كل سنة.
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
      <p className="mb-1.5 text-[11px] font-bold text-white/50">{label}</p>
      {children}
    </div>
  );
}

const estimateBleed = (type, e) =>
  type === "money"
    ? (e.perWeek * e.amount) / 7
    : e.method === "share"
      ? (e.planned * e.lost) / 100
      : (e.bouts * e.minutes) / 60;


function MilestoneTrack({ days }) {
  const next = MILESTONES.find((m) => m.d > days) || null;
  const prev = [...MILESTONES].reverse().find((m) => m.d <= days);
  const floor = prev ? prev.d : 0;
  const span = next ? next.d - floor : 1;
  const pct = next ? Math.min(100, ((days - floor) / span) * 100) : 100;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        {MILESTONES.map((m) => {
          const won = days >= m.d;
          return (
            <div key={m.d} className="flex flex-col items-center gap-1">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-all ${won ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'border-white/10 text-white/30'}`}>
                {won ? <Check size={12} strokeWidth={3} /> : m.d}
              </div>
              <span className={`text-[9px] font-bold ${won ? 'text-emerald-400' : 'text-white/30'}`}>{m.label}</span>
            </div>
          );
        })}
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}


function MirrorTile({ icon: Icon, label, value, sub, tint }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/40 p-5 flex flex-col justify-between" style={{ borderTop: `2px solid ${tint}40` }}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} style={{ color: tint }} />
        <p className="text-[11px] font-bold text-white/50">{label}</p>
      </div>
      <div>
        <p className="text-xl font-black text-white">{value}</p>
        <p className="mt-1 text-[10px] text-white/40 leading-relaxed">{sub}</p>
      </div>
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
            className={`rounded-xl border px-3 py-2 text-[11.5px] font-bold transition-all active:scale-95 ${on ? 'border-violet-500 bg-violet-500/20 text-violet-300' : 'border-white/10 bg-black/20 text-white/50 hover:bg-white/5'}`}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}


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
            className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-right text-[11.5px] font-bold transition-all active:scale-95 ${on ? 'bg-white/10' : 'border-white/10 bg-black/20 hover:bg-white/5'}`}
            style={{ borderColor: on ? t.tint : undefined, color: on ? t.tint : undefined }}
          >
            <Icon size={16} className="shrink-0" />
            <span className="min-w-0 flex-1 leading-tight">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}


const BAD_PRESETS = [
  { key: "delay", title: "التسويف", costType: "time", bouts: 3, minutes: 40, replacement: "أضبط مؤقتًا على خمس دقائق وأفتح الملف فقط. إن أردت التوقف بعدها فلي ذلك.", identity: "شخص ينجز أولاً" },
  { key: "scroll", title: "التصفّح بلا هدف", costType: "time", bouts: 6, minutes: 15, replacement: "أضع الهاتف في غرفة أخرى وأشرب ماءً وأمشي دقيقتين قبل أن أعود.", identity: "شخص حاضر الذهن" },
  { key: "late", title: "السهر بعد منتصف الليل", costType: "time", bouts: 1, minutes: 90, replacement: "أطفئ الشاشات وأتوضّأ وأقرأ ورقًا عشر دقائق في السرير حتى ينام جسدي.", identity: "شخص يستيقظ بنشاط" },
  { key: "spend", title: "الصرف خارج الميزانية", costType: "money", bouts: 3, minutes: 35, replacement: "أضع ما أريده في قائمة وأؤجّله ٢٤ ساعة. إن بقيت أريده غدًا أعيد النظر.", identity: "شخص يتحكم بماله" },
];

const MILESTONES = [
  { d: 3, label: "٣ أيام", hint: "أصعب ٧٢ ساعة" },
  { d: 7, label: "أسبوع", hint: "أسبوع كامل بلا رجعة" },
  { d: 21, label: "٢١ يومًا", hint: "الدماغ بدأ ينسى" },
  { d: 90, label: "٩٠ يومًا", hint: "ربع كامل — صرت شخصًا آخر" },
];

const WAVE_OPTIONS = [
  { min: 5, label: "٥ دقائق" },
  { min: 15, label: "١٥ دقيقة" },
];