import { Badge, Btn, Card, DOW_AR, Field, Modal, NumStep, T, arCount, dayWord, fallWord, meetWord, timesWord } from "../components/life-shared.jsx";
import { COST_TYPES, MIRROR_MIN, URGE_MOODS, URGE_TAGS, badHabitShape, bandAt, bandOf, bestRun, bleedSaved, breakerEvents, cleanDays, costType, dayKey, moodOf, rows, tagFallRate, tagOf, urgeShape, weakSpots } from "../state/life-state.mjs";
import { AlertTriangle, Brain, Calculator, CalendarDays, Check, ChevronDown, ChevronUp, Clock, Crosshair, Flame, HeartCrack, Hourglass, LifeBuoy, Pencil, Plus, Radar, ShieldCheck, ShieldOff, Timer, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

/* ==================================================================== *
 *  THE ACCOUNTABILITY MIRROR — كاسر العادات
 *
 *  One screen and everything only it renders: the bad habits he is
 *  breaking, the urge he rode out instead of obeying, the relapse he wrote
 *  down anyway, and the mirror that counts what the two add up to.
 *
 *  It is the largest feature in the app that nothing else reaches into.
 *  `BreakerModule` is the only name LifeOS.jsx imports back; the other
 *  seventeen blocks here are rendered by this screen alone. That is the
 *  whole test of where a seam can go, and it is why this one was cut first.
 *
 *  `CostEstimator` and `estimate` live here rather than in life-finance.jsx
 *  despite both being about money: the question they answer is what a habit
 *  bleeds in a year, which is an argument for stopping it rather than an
 *  entry in the income screen. Nothing in finance calls them.
 * ==================================================================== */


export function BreakerModule({ state, setState }) {
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


/* A stepper rather than a number field. The two numbers the estimator asks
   for are small and get nudged, not typed, and a keyboard that covers half
   a phone to turn «٣» into «٤» is a keyboard nobody opens twice. */

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



/* --- prayer times ----------------------------------------------------- *
 *  The maths moved to ./prayer-times.mjs, because the sync server fires the
 *  block reminders and has to land on the same minute this screen shows. It
 *  is bundled in by esbuild, so the built page is still one self-contained
 *  file — the split is in the source, not in what ships.
 * ---------------------------------------------------------------------- */


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

