import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Pause,
  Play,
  Square,
  Target,
  Timer,
} from "lucide-react";
import {
  T,
  Card,
  Btn,
  usePrefersReducedMotion,
} from "./life-shared.jsx";
import { dayKey, uid } from "./life-state.mjs";


/* --- deep work -------------------------------------------------------- */
const SESSIONS = [
  { min: 25, label: "بومودورو", hint: "جولة قصيرة مركّزة" },
  { min: 90, label: "عمل عميق", hint: "دورة التركيز الكاملة" },
];

/* ==================================================================== *
 *  MODULE — deep work
 * ==================================================================== */
export function DeepWorkModule({ state, setState }) {
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
