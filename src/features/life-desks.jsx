import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  AlarmClock,
  Bell,
  BellOff,
  Brain,
  Check,
  Coffee,
  Flame,
  Hand,
  Lightbulb,
  ListPlus,
  MonitorCheck,
  Pause,
  Pencil,
  Play,
  Plus,
  SkipForward,
  Square,
  Target,
  Timer,
  Trash2,
  TrendingUp,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import {
  T,
  Card,
  Btn,
  Field,
  Badge,
  Modal,
  NumStep,
  useBurst,
  useUndo,
  usePrefersReducedMotion,
  minWord,
  hourWord,
  dayWord,
  roundsPhrase,
  roundsAfter,
  timesWord,
  countedWord,
  arDate,
  WEEK_LABELS,
} from "../components/life-shared.jsx";
/* The focus desk's own state layer comes through the barrel like every
   other domain's. No comments inside the braces: `tests/split.test.mjs`
   reads an import list by splitting it on commas, and a comment in there
   reads as part of the first name. */
import {
  dayKey,
  keyToDate,
  rows,
  uid,
  phaseOf,
  isBreak,
  presetShape,
  presetFor,
  PRESET_CAP,
  ROUND_MIN,
  ROUND_MAX,
  BREAK_MIN,
  BREAK_MAX,
  LONG_MIN,
  LONG_MAX,
  EVERY_MIN,
  EVERY_MAX,
  FOCUS_GOAL_MAX,
  INTERRUPT_MAX,
  MIN_LOGGED,
  armRun,
  startRun,
  pauseRun,
  runLeft,
  runRunning,
  spentMinutes,
  settleRun,
  sessionOf,
  manualSession,
  addSession,
  sessionShape,
  nextBreak,
  breakMinutes,
  tillLong,
  focusShape,
  focusDay,
  focusStreak,
  focusWeek,
  focusSpan,
  focusByTask,
  bestBand,
  interruptRate,
} from "../state/life-state.mjs";

/* ==================================================================== *
 *  MODULE — the focus desk (بومودورو / عمل عميق)
 *
 *  The screen owns no arithmetic. Every length, every phase change, every
 *  total and every streak is read out of `life-state-focus.mjs`, which is
 *  under test; what is left here is the dial, the sheets and the three
 *  things a browser can do that a pure function cannot — ring a bell, raise
 *  a notification and hold the screen awake.
 *
 *  Rendered as a flat list of named blocks, like «اليوم»: each one takes
 *  what it draws as props and keeps nothing, so reordering this screen is
 *  moving a line and putting a block on another screen is one import.
 * ==================================================================== */

/* A phase's colour and icon are the screen's statement about it, not the
   data's, so they are fastened on here — the same division `PILLARS` keeps
   with its icons. */
export const PHASE_META = {
  focus: { tint: T.cta, lift: T.ctaLift, icon: Brain },
  short: { tint: T.primary, lift: T.primaryLift, icon: Coffee },
  long: { tint: T.sky, lift: "#7FE3FF", icon: Coffee },
};
export const phaseMeta = (id) => PHASE_META[id] || PHASE_META.focus;

/* The fallback for a payload that somehow arrives with no focus desk at
   all. A module constant rather than a call inside the render: `focusShape`
   mints ids, and a fresh object every render would re-key the whole list. */
const NO_FOCUS = focusShape({});
const focusIn = (s) =>
  s && s.focus && typeof s.focus === "object" && !Array.isArray(s.focus)
    ? s.focus
    : NO_FOCUS;

/* A run's identity, for the one guard that keeps a round from being logged
   twice. Every field that changes when a phase is armed, started, paused or
   extended is in it, so "the same run" means the same run in the same
   state — a bell that fired and a visibility change half a second later are
   then one event and not two. */
const keyOf = (r) => (r ? `${r.phase}:${r.startedAt || 0}:${r.endAt || 0}:${r.left}` : "");

/* mm:ss, always two digits, always LTR at the call site. */
const clock = (secs) => {
  const n = Math.max(0, Math.round(secs));
  const m = Math.floor(n / 60);
  return `${String(m).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
};

/* Minutes as a sentence: «٩٠ دقيقة» under an hour and a half, «ساعة و٣٠
   دقيقة» past it — a three-digit minute count is a number you have to do
   arithmetic on before it means anything. */
/* The numeral is dropped for one and two, the rule every counted phrase in
   this app follows: Arabic's dual already carries the number, so «2 ساعتان»
   reads as a translation rather than a sentence.

   And the dual inflects. «ساعتان» stands on its own; «ساعتين» is what
   follows a preposition or a verb, so «في ساعتان» is wrong the same way
   «في اثنان ساعة» would be. The shared plural helpers return the
   nominative, which is right for a standalone figure and wrong for a
   figure inside a sentence — `after` is which of the two is being
   written. */
const DUAL_AFTER = { min: "دقيقتين", hour: "ساعتين" };
const counted = (n, kind, after, bare) => {
  const word = kind === "hour" ? hourWord : minWord;
  if (n === 1) return bare ? word(1) : `${word(1)} واحدة`;
  if (n === 2) return after ? DUAL_AFTER[kind] : word(2);
  return `${n} ${word(n)}`;
};

export const minsPhrase = (n, after = false) => {
  const m = Math.max(0, Math.round(n));
  if (m < 60) return counted(m, "min", after, false);
  const h = Math.floor(m / 60);
  const rest = m % 60;
  /* «ساعة و40 دقيقة», not «ساعة واحدة و40 دقيقة» — the «واحدة» is only
     worth saying when the hour stands alone. */
  const head = counted(h, "hour", after, rest > 0);
  return rest ? `${head} و${counted(rest, "min", after, true)}` : head;
};

/* The wall clock an epoch landed on. Arabic-Indic through the locale like
   every other time on this screen, and «—» for a row written before start
   times were recorded. */
const atClock = (at) => {
  if (!at) return "—";
  try {
    return new Date(at).toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

export function DeepWorkModule({ state, setState }) {
  const focus = focusIn(state);
  const run = focus.run;
  const arm = useUndo();
  const still = usePrefersReducedMotion();
  const [reward, fireReward] = useBurst(760);

  /* --- the clock ----------------------------------------------------- *
     One `now`, ticked only while something is counting. Every remaining
     second on the screen is read off the run's absolute `endAt` against
     it, so the dial cannot drift and a throttled tab cannot lose minutes:
     the worst a hidden window does is notice late, which is what the
     visibility listener below is for. */
  const [now, setNow] = useState(() => Date.now());
  const endAt = run ? run.endAt : null;
  useEffect(() => {
    if (!endAt) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [endAt]);

  /* Coming back to the window settles the deadline on the spot. Chrome
     throttles a hidden window's timers to once a minute, so a bell can ring
     late — but it can never ring *wrong*, because the ring is drawn from
     the deadline and not from a counter. */
  useEffect(() => {
    const touch = () => setNow(Date.now());
    document.addEventListener("visibilitychange", touch);
    window.addEventListener("focus", touch);
    return () => {
      document.removeEventListener("visibilitychange", touch);
      window.removeEventListener("focus", touch);
    };
  }, []);

  const left = runLeft(run, now);
  const running = runRunning(run);
  const phase = run ? run.phase : "focus";
  const onBreak = isBreak(phase);

  /* --- what the state says -------------------------------------------- */
  const setFocus = useCallback(
    (patch) =>
      setState((s) => {
        const base = focusIn(s);
        const next = typeof patch === "function" ? patch(base) : patch;
        return { ...s, focus: { ...base, ...next } };
      }),
    [setState],
  );

  const preset = presetFor(focus, run ? run.presetId : focus.pick);
  const picked = useMemo(() => rows(state.tasks).filter((t) => t.today), [state.tasks]);
  const [focusId, setFocusId] = useState(null);
  /* The run's task wins while a run exists — it is the one actually being
     worked — and the picker's choice applies to the next round. */
  const taskId = run ? run.taskId : focusId;
  const task = picked.find((t) => t.id === taskId) || null;

  const today = useMemo(() => focusDay(state.sessions), [state.sessions]);
  const goalPct = focus.goal > 0 ? Math.min(100, (today.minutes / focus.goal) * 100) : 0;
  const streak = useMemo(
    () => focusStreak(state.sessions, focus.goal),
    [state.sessions, focus.goal],
  );

  /* --- the bell ------------------------------------------------------- *
     A chime, a notification and a reward burst. The AudioContext is opened
     on the first press of «ابدأ» and kept — one created twenty-five minutes
     later, with no gesture behind it, starts suspended and is refused the
     resume, so the bell for the round you actually sat through is the one
     that would be silent. */
  const audioRef = useRef(null);
  const prime = useCallback(() => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioRef.current) audioRef.current = new Ctx();
      if (audioRef.current.state === "suspended") audioRef.current.resume();
    } catch {
      /* no audio on this machine — the bell is one of three signals */
    }
  }, []);

  const chime = useCallback(
    (kind) => {
      if (!focus.chime) return;
      try {
        prime();
        const ctx = audioRef.current;
        if (!ctx) return;
        const t0 = ctx.currentTime + 0.02;
        /* Two notes, rising to start and falling to rest — the direction is
           the message, so the bell is recognisable with the screen off. */
        const notes = kind === "rest" ? [784, 523.25] : [523.25, 784, 1046.5];
        notes.forEach((hz, i) => {
          const at = t0 + i * 0.17;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.value = hz;
          gain.gain.setValueAtTime(0, at);
          gain.gain.linearRampToValueAtTime(0.2, at + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.55);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(at);
          osc.stop(at + 0.6);
        });
      } catch {
        /* same: silence is a degraded bell, not a broken screen */
      }
    },
    [focus.chime, prime],
  );

  const notify = useCallback(
    (title, body) => {
      if (!focus.notify) return;
      try {
        if (typeof Notification === "undefined") return;
        if (Notification.permission !== "granted") return;
        /* One tag, so a second bell replaces the first rather than stacking
           three notifications nobody reads. */
        new Notification(title, { body, tag: "los-focus", silent: true });
      } catch {
        /* notifications refused or unavailable */
      }
    },
    [focus.notify],
  );

  const askNotify = useCallback(() => {
    try {
      if (typeof Notification === "undefined") {
        setFocus({ notify: false });
        return;
      }
      if (Notification.permission === "granted") {
        setFocus((f) => ({ notify: !f.notify }));
        return;
      }
      if (Notification.permission === "denied") {
        setFocus({ notify: false });
        return;
      }
      /* Asked from the press itself, never on mount: a permission prompt
         nobody opened is a permission prompt everybody denies. */
      Notification.requestPermission().then((p) =>
        setFocus({ notify: p === "granted" }),
      );
    } catch {
      setFocus({ notify: false });
    }
  }, [setFocus]);

  /* --- the screen stays awake while a round runs ---------------------- *
     A screen that sleeps mid-round takes the countdown with it, and the
     lock is dropped by the browser whenever the page is hidden — so it is
     re-taken on the way back rather than assumed to still be held. */
  const lockRef = useRef(null);
  useEffect(() => {
    let dead = false;
    const take = async () => {
      if (!running || !focus.awake) return;
      try {
        if (!navigator.wakeLock || lockRef.current || document.hidden) return;
        const held = await navigator.wakeLock.request("screen");
        if (dead) {
          held.release();
          return;
        }
        lockRef.current = held;
        held.addEventListener("release", () => {
          lockRef.current = null;
        });
      } catch {
        /* unsupported, or refused because the window was not visible */
      }
    };
    const drop = () => {
      try {
        if (lockRef.current) lockRef.current.release();
      } catch {
        /* already gone */
      }
      lockRef.current = null;
    };
    if (running && focus.awake) {
      take();
      document.addEventListener("visibilitychange", take);
    } else drop();
    return () => {
      dead = true;
      document.removeEventListener("visibilitychange", take);
      drop();
    };
  }, [running, focus.awake]);

  /* --- the tab's own title ------------------------------------------- *
     Two effects on purpose: the first captures the real title the moment a
     run starts and puts it back when it stops, the second writes the
     countdown. Written as one, the capture would re-run on every tick and
     "restore" the countdown it had just written. */
  const titleRef = useRef("");
  useEffect(() => {
    if (!running) return;
    titleRef.current = document.title;
    return () => {
      try {
        document.title = titleRef.current;
      } catch {
        /* nothing to restore to */
      }
    };
  }, [running]);
  useEffect(() => {
    if (!running) return;
    try {
      document.title = `${clock(left)} · ${phaseOf(phase).label}`;
    } catch {
      /* no document title on this host */
    }
  }, [running, left, phase]);

  /* --- ending a phase ------------------------------------------------- *
     One function for all four ways a phase ends — the bell, a stop, a
     skipped break and a discard — because they differ only in what gets
     written down. Everything is computed off the run as rendered, then
     applied in a single updater that re-checks the run it was handed is
     still the run on state: the bell's effect can fire twice (a tick and a
     visibility change in the same instant), and a round logged twice is a
     day that claims an hour it did not have.
  */
  const rungRef = useRef("");

  const endPhase = useCallback(
    (r, { log = true, minutes, full, advance = true, nextRun = null, at = Date.now() } = {}) => {
      if (!r) return null;
      const wasFocus = !isBreak(r.phase);
      const row = log && wasFocus ? sessionOf(r, { minutes, full, now: at }) : null;
      setState((s) => {
        const base = focusIn(s);
        const cur = base.run;
        /* Already settled by the other caller — nothing to do, and crucially
           nothing to write twice. */
        if (!cur || keyOf(cur) !== keyOf(r)) return s;
        const p = presetFor(base, r.presetId);
        /* The cycle counter: a completed focus round adds one, a completed
           long break resets it, and anything else leaves it alone. A round
           that was cut short does not advance it — the long break is earned
           by rounds that were actually sat through. */
        const round = !advance
          ? base.round
          : wasFocus
            ? Math.min(EVERY_MAX * 2, base.round + 1)
            : r.phase === "long"
              ? 0
              : base.round;
        let next = nextRun;
        if (next === null && advance) {
          if (wasFocus && base.autoBreak) {
            const bp = nextBreak(p, round);
            next = armRun({
              phase: bp,
              planned: breakMinutes(p, bp),
              presetId: p.id,
              taskId: r.taskId,
              label: r.label,
              round,
              now: at,
            });
            if (base.autoStartBreak) next = startRun(next, at);
          } else if (!wasFocus) {
            next = armRun({
              phase: "focus",
              planned: p.min,
              presetId: p.id,
              taskId: r.taskId,
              label: r.label,
              round,
              now: at,
            });
            if (base.autoNext) next = startRun(next, at);
          }
        }
        return {
          ...s,
          sessions: row ? addSession(s.sessions, row) : s.sessions,
          focus: { ...base, round, run: next },
          /* The old behaviour, now opt-in: twenty-five minutes is not
             evidence that a task is finished, and a task ticked by a timer
             is a task he has to go and untick. The sheet asks instead. */
          tasks:
            wasFocus && row && base.autoDone && r.taskId
              ? rows(s.tasks).map((t) => (t.id === r.taskId ? { ...t, done: true } : t))
              : s.tasks,
        };
      });
      return row;
    },
    [setState],
  );

  /* --- the end-of-round sheet ----------------------------------------- *
     What just finished, and what comes next. Local state: it is a receipt
     for one moment, not something written about the day. */
  const [bell, setBell] = useState(null);

  /* The one effect that notices a deadline has passed — and the one that
     throws away a run nobody was there for. `settleRun` draws the line;
     `rungRef` makes both idempotent, because this runs twice a second and
     again on every return to the window. */
  useEffect(() => {
    if (!run) return;
    const at = Date.now();
    const out = settleRun(run, at);
    const key = keyOf(run);
    if (!out.dropped && !out.rang) return;
    if (rungRef.current === key) return;
    rungRef.current = key;

    if (out.dropped) {
      /* Shut laptop, closed window, a round left paused on Tuesday. A round
         that was still *counting* writes nothing — nobody can say when he
         left it, and minutes nobody can vouch for are worse than no
         minutes, because every number above them becomes a guess. A round
         he *paused* is the one case the amount worked is known exactly, so
         `settleRun` hands those minutes back and they are kept. */
      setState((s) => ({
        ...s,
        sessions: out.log ? addSession(s.sessions, out.log) : s.sessions,
        focus: { ...focusIn(s), run: null },
      }));
      setBell({
        kind: "stale",
        phase: run.phase,
        minutes: out.log ? out.log.minutes : 0,
        interrupts: 0,
        round: 0,
      });
      return;
    }

    const wasFocus = !isBreak(run.phase);
    const row = endPhase(run, { minutes: run.planned, full: true, at });
    const p = presetFor(focus, run.presetId);
    const round = wasFocus ? focus.round + 1 : focus.round;
    const nextPhase = wasFocus ? nextBreak(p, round) : "focus";
    setBell({
      kind: "done",
      phase: run.phase,
      minutes: run.planned,
      interrupts: run.interrupts,
      round,
      sessionId: row ? row.id : null,
      taskId: run.taskId,
      nextPhase,
      nextMins: wasFocus ? breakMinutes(p, nextPhase) : p.min,
      armed: wasFocus ? focus.autoBreak : true,
      started: wasFocus ? focus.autoBreak && focus.autoStartBreak : focus.autoNext,
    });
    if (wasFocus) fireReward();
    chime(wasFocus ? "rest" : "work");
    notify(
      wasFocus ? "انتهت جولة التركيز" : "انتهت الراحة",
      wasFocus
        ? `${minsPhrase(run.planned)} · ${phaseOf(nextPhase).label} ${breakMinutes(p, nextPhase)} د`
        : "ابدأ الجولة التالية",
    );
  }, [run, now, focus, endPhase, setState, chime, notify, fireReward]);

  /* --- the controls --------------------------------------------------- */
  const startNew = useCallback(
    (phaseId = "focus") => {
      const p = presetFor(focus, focus.pick);
      const planned = phaseId === "focus" ? p.min : breakMinutes(p, phaseId);
      const armed = armRun({
        phase: phaseId,
        planned,
        presetId: p.id,
        taskId: phaseId === "focus" ? focusId : null,
        label: phaseId === "focus" && task ? task.text : "",
        round: focus.round,
      });
      prime();
      rungRef.current = "";
      setFocus({ run: startRun(armed) });
    },
    [focus, focusId, task, prime, setFocus],
  );

  const toggle = useCallback(() => {
    prime();
    if (!run) {
      startNew("focus");
      return;
    }
    if (running) {
      setFocus((f) => (f.run ? { run: pauseRun(f.run) } : {}));
      return;
    }
    if (runLeft(run) <= 0) {
      startNew(run.phase);
      return;
    }
    rungRef.current = "";
    setFocus((f) => (f.run ? { run: startRun(f.run) } : {}));
  }, [run, running, prime, setFocus, startNew]);

  /* Stop and keep the minutes. The old timer logged nothing unless the round
     finished, so eighty minutes of a ninety-minute round simply never
     existed — this is that hour, written down and marked for what it is. */
  const stopAndLog = useCallback(() => {
    if (!run) return;
    const at = Date.now();
    const mins = spentMinutes(run, at);
    const p = presetFor(focus, run.presetId);
    rungRef.current = keyOf(run);
    endPhase(run, {
      minutes: mins,
      full: false,
      advance: false,
      nextRun: armRun({
        phase: "focus",
        planned: p.min,
        presetId: p.id,
        taskId: run.taskId,
        label: run.label,
        round: focus.round,
        now: at,
      }),
      at,
    });
    if (!isBreak(run.phase) && mins >= MIN_LOGGED)
      setBell({ kind: "cut", phase: run.phase, minutes: mins, interrupts: run.interrupts, round: focus.round });
  }, [run, focus, endPhase]);

  /* Throw the round away. Armed with the undo bus, because the minutes are
     gone the instant it lands and «ألغِ» beside «أوقف» is one slip away
     from the button he wanted. Restored *paused*, so the eight seconds the
     toast was up do not come out of the round. */
  const discard = useCallback(() => {
    if (!run) return;
    const snap = pauseRun(run);
    arm("أُلغيت الجولة", (s) => ({ focus: { ...focusIn(s), run: snap } }));
    rungRef.current = "";
    setFocus({ run: null });
    setBell(null);
  }, [run, arm, setFocus]);

  /* Skip the break: the rhythm still counted the round, so the cycle
     bookkeeping is the break's as if it had been taken. */
  const skipBreak = useCallback(() => {
    if (!run || !isBreak(run.phase)) return;
    const at = Date.now();
    const p = presetFor(focus, run.presetId);
    rungRef.current = keyOf(run);
    endPhase(run, {
      log: false,
      nextRun: armRun({
        phase: "focus",
        planned: p.min,
        presetId: p.id,
        taskId: run.taskId,
        label: run.label,
        round: run.phase === "long" ? 0 : focus.round,
        now: at,
      }),
      at,
    });
    setBell(null);
  }, [run, focus, endPhase]);

  const bump = useCallback(() => {
    setFocus((f) =>
      f.run && !isBreak(f.run.phase)
        ? { run: { ...f.run, interrupts: Math.min(INTERRUPT_MAX, f.run.interrupts + 1), at: Date.now() } }
        : {},
    );
  }, [setFocus]);

  /* Another five minutes on the clock. The one honest answer to «I am in
     it» that is not "let the bell ring and ignore it" — and it moves the
     deadline, so the minutes it adds are minutes the log will carry. */
  const extend = useCallback(
    (mins) => {
      setFocus((f) => {
        if (!f.run) return {};
        const r = f.run;
        const planned = Math.min(ROUND_MAX * 2, r.planned + mins);
        return {
          run: {
            ...r,
            planned,
            left: runLeft(r) + mins * 60,
            endAt: r.endAt ? r.endAt + mins * 60 * 1000 : null,
            at: Date.now(),
          },
        };
      });
      rungRef.current = "";
    },
    [setFocus],
  );

  const pick = useCallback(
    (id) => {
      setFocus((f) => {
        if (runRunning(f.run)) return { pick: id };
        const p = presetFor({ ...f, pick: id }, id);
        return {
          pick: id,
          run: f.run
            ? armRun({
                phase: f.run.phase,
                planned: isBreak(f.run.phase) ? breakMinutes(p, f.run.phase) : p.min,
                presetId: p.id,
                taskId: f.run.taskId,
                label: f.run.label,
                round: f.run.round,
              })
            : null,
        };
      });
    },
    [setFocus],
  );

  /* --- the sheets ----------------------------------------------------- */
  const [editing, setEditing] = useState(null); // a preset row, or {} for a new one
  const [manual, setManual] = useState(false);
  const blocked = !!(editing || manual || bell);

  /* Space starts and pauses, because the one thing you want to do without
     looking for a button is the thing you do forty times a day. Never while
     typing, and never while a sheet is up — the sheet has its own buttons
     and its own Escape. */
  useEffect(() => {
    const onKey = (e) => {
      if (blocked) return;
      const el = e.target;
      if (
        el &&
        (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)
      )
        return;
      if (e.code !== "Space" && e.key !== " ") return;
      e.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, blocked]);

  const savePreset = useCallback(
    (row) => {
      const shaped = presetShape(row);
      setFocus((f) => {
        const list = rows(f.presets);
        const at = list.findIndex((p) => p.id === shaped.id);
        const next =
          at >= 0
            ? list.map((p) => (p.id === shaped.id ? shaped : p))
            : [...list, shaped].slice(0, PRESET_CAP);
        return {
          presets: next,
          pick: next.some((p) => p.id === f.pick) ? f.pick : next[0].id,
          /* An armed round with nothing worked in it re-arms to the edited
             length. One that has minutes in it is left exactly as it is —
             changing the clock under a round in progress is a round whose
             log would lie, and re-arming it would throw the minutes away. */
          run:
            f.run &&
            !f.run.endAt &&
            f.run.presetId === shaped.id &&
            runLeft(f.run) >= f.run.planned * 60
              ? armRun({
                  phase: f.run.phase,
                  planned: isBreak(f.run.phase)
                    ? breakMinutes(shaped, f.run.phase)
                    : shaped.min,
                  presetId: shaped.id,
                  taskId: f.run.taskId,
                  label: f.run.label,
                  round: f.run.round,
                })
              : f.run,
        };
      });
      setEditing(null);
    },
    [setFocus],
  );

  const dropPreset = useCallback(
    (id) => {
      const before = rows(focus.presets);
      if (before.length <= 1) return;
      arm("أُزيل الإيقاع", (s) => ({ focus: { ...focusIn(s), presets: before } }));
      setFocus((f) => {
        const next = rows(f.presets).filter((p) => p.id !== id);
        if (!next.length) return {};
        return { presets: next, pick: next.some((p) => p.id === f.pick) ? f.pick : next[0].id };
      });
      setEditing(null);
    },
    [focus.presets, arm, setFocus],
  );

  const dropSession = useCallback(
    (id) => {
      const before = rows(state.sessions);
      arm("أُزيلت الجولة من السجل", { sessions: before });
      setState((s) => ({ ...s, sessions: rows(s.sessions).filter((x) => x.id !== id) }));
    },
    [state.sessions, arm, setState],
  );

  const noteSession = useCallback(
    (id, note) =>
      setState((s) => ({
        ...s,
        sessions: rows(s.sessions).map((x) => (x.id === id ? sessionShape({ ...x, note }) : x)),
      })),
    [setState],
  );

  const addManual = useCallback(
    (row) => {
      const made = manualSession(row);
      if (!made) return;
      setState((s) => ({ ...s, sessions: addSession(s.sessions, made) }));
      setManual(false);
    },
    [setState],
  );

  const markDone = useCallback(
    (id) =>
      setState((s) => ({
        ...s,
        tasks: rows(s.tasks).map((t) => (t.id === id ? { ...t, done: true } : t)),
      })),
    [setState],
  );

  return (
    <div className="space-y-8">
      {/* The order of this screen is this list. Each block takes what it
          draws and keeps nothing, so moving one is moving a line. */}
      <FocusHeaderCard today={today} goal={focus.goal} streak={streak} pct={goalPct} />

      <RhythmPicker
        presets={rows(focus.presets)}
        pick={focus.pick}
        /* Not only while it runs: switching rhythm re-arms the round, and
           re-arming a round with twenty minutes in it throws those twenty
           minutes away. Locked the moment there is anything to lose. */
        locked={running || spentMinutes(run) >= MIN_LOGGED}
        round={focus.round}
        onPick={pick}
        onEdit={setEditing}
      />

      <TimerDial
        run={run}
        left={left}
        running={running}
        phase={phase}
        onBreak={onBreak}
        preset={preset}
        round={focus.round}
        task={task}
        reward={reward}
        still={still}
        onToggle={toggle}
        onStop={stopAndLog}
        onDiscard={discard}
        onSkip={skipBreak}
        onBump={bump}
        onExtend={extend}
      />

      <FocusSwitches focus={focus} onSet={setFocus} onAskNotify={askNotify} />

      <TaskPicker
        picked={picked}
        taskId={taskId}
        locked={!!run}
        onPick={(id) => setFocusId(id === focusId ? null : id)}
      />

      <GoalCard
        goal={focus.goal}
        today={today}
        streak={streak}
        onSet={(n) => setFocus({ goal: n })}
      />

      <TodayLog
        sessions={state.sessions}
        tasks={state.tasks}
        onDrop={dropSession}
        onManual={() => setManual(true)}
      />

      <FocusStats sessions={state.sessions} tasks={state.tasks} goal={focus.goal} />

      <PresetModal
        row={editing}
        canDelete={rows(focus.presets).length > 1}
        full={rows(focus.presets).length >= PRESET_CAP && !(editing && editing.id)}
        onClose={() => setEditing(null)}
        onSave={savePreset}
        onDelete={dropPreset}
      />

      <ManualModal
        open={manual}
        tasks={picked}
        onClose={() => setManual(false)}
        onSave={addManual}
      />

      <EndSheet
        bell={bell}
        task={bell && bell.taskId ? picked.find((t) => t.id === bell.taskId) || null : null}
        onClose={() => setBell(null)}
        onNote={noteSession}
        onDone={markDone}
        onStart={() => {
          setBell(null);
          toggle();
        }}
        onSkip={() => {
          setBell(null);
          skipBreak();
        }}
      />
    </div>
  );
}

/* ==================================================================== *
 *  BLOCK — the header, and the day in one line
 * ==================================================================== */
export function FocusHeaderCard({ today, goal, streak, pct }) {
  const met = goal > 0 && today.minutes >= goal;
  return (
    <Card className="p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">
            العمل العميق
          </h2>
          <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/40">
            مهمة واحدة، جولة واحدة، وراحة تأخذها فعلًا. البرومودو ليس عدّادًا
            تنازليًّا — هو إيقاع: جولة، راحة، وراحة أطول كل عدة جولات.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {streak > 0 && (
            <Badge tint={T.accent}>
              <Flame size={11} />
              <span dir="ltr" className="tabular-nums">
                {streak}
              </span>{" "}
              {countedWord(streak)}
            </Badge>
          )}
          <Badge tint={met ? T.primary : T.cta}>
            <Timer size={11} />
            {/* One LTR span over the whole fraction: a spaced «120 / 180»
                split across two spans reverses inside Arabic text. */}
            <span dir="ltr" className="tabular-nums">
              {goal > 0 ? `${today.minutes} / ${goal}` : today.minutes}
            </span>{" "}
            {minWord(today.minutes)}
          </Badge>
          <Badge tint={T.violet}>{roundsPhrase(today.rounds)}</Badge>
        </div>
      </div>

      {goal > 0 && (
        <div className="mt-5">
          <div
            className="h-2 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                backgroundImage: `linear-gradient(90deg, ${met ? T.primary : T.cta}, ${
                  met ? T.primaryLift : T.accent
                })`,
                boxShadow: `0 0 16px -2px ${met ? T.primary : T.cta}`,
              }}
            />
          </div>
          <p className="mt-2 text-[11px]" style={{ color: met ? T.primaryLift : T.faint }}>
            {met
              ? `بلغت هدف اليوم — ${minsPhrase(today.minutes)} من تركيز حقيقي`
              : `باقي ${minsPhrase(Math.max(0, goal - today.minutes), true)} على هدف اليوم`}
          </p>
        </div>
      )}
    </Card>
  );
}

/* ==================================================================== *
 *  BLOCK — the rhythms
 *  A chip is the round *and* its breaks, because a ninety-minute cycle
 *  followed by five minutes is not a rhythm. The pencil is a button inside
 *  a row that is not draggable — deliberately: a control inside a
 *  `draggable` element never receives a click once the pointer moves a
 *  pixel, which is how the nav order editor shipped dead once.
 * ==================================================================== */
export function RhythmPicker({ presets, pick, locked, round, onPick, onEdit }) {
  return (
    <Card className="p-6 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[17px] font-extrabold" style={{ color: T.ctaLift }}>
          الإيقاع
        </h3>
        <Btn
          size="sm"
          variant="outline"
          onClick={() => onEdit({})}
          disabled={presets.length >= PRESET_CAP}
          title={presets.length >= PRESET_CAP ? "القائمة مكتملة — عدّل إيقاعًا أو أزله" : undefined}
        >
          <Plus size={13} /> إيقاع جديد
        </Btn>
      </div>
      <p className="mt-1.5 text-[11.5px]" style={{ color: T.faint }}>
        {locked
          ? "جولة قائمة فيها دقائق محسوبة — أنهها أو ألغها قبل تغيير الإيقاع"
          : "كل إيقاع يحمل راحته القصيرة والطويلة، فالراحة جزء من الجولة لا مكافأة عليها"}
      </p>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {presets.map((p) => {
          const on = p.id === pick;
          const left = tillLong(p, round);
          return (
            <div
              key={p.id}
              className="los-raise flex items-stretch gap-2 rounded-2xl border p-1 transition-all duration-200"
              style={{
                borderColor: on ? `${T.cta}80` : T.border,
                backgroundImage: on ? `linear-gradient(160deg, ${T.cta}2E, ${T.cta}0A)` : "none",
                backgroundColor: on ? "transparent" : "rgba(255,255,255,0.03)",
              }}
            >
              <button
                type="button"
                onClick={() => onPick(p.id)}
                aria-pressed={on}
                disabled={locked}
                className="min-w-0 flex-1 rounded-xl px-4 py-3 text-right transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ color: on ? T.ctaLift : T.muted }}
              >
                <span className="flex items-baseline gap-1.5">
                  <span dir="ltr" className="text-[21px] font-extrabold tabular-nums">
                    {p.min}
                  </span>
                  <span className="text-[11px] font-bold">دقيقة</span>
                  <span className="truncate text-[13px] font-extrabold" style={{ color: on ? T.fg : T.muted }}>
                    · {p.label}
                  </span>
                </span>
                <span className="mt-1 block text-[10.5px]" style={{ color: T.faint }}>
                  راحة <span dir="ltr" className="tabular-nums">{p.brk}</span> د، وطويلة{" "}
                  <span dir="ltr" className="tabular-nums">{p.long}</span> د كل{" "}
                  {roundsAfter(p.every)}
                  {on && round > 0 ? ` — باقي ${roundsPhrase(left)} للراحة الطويلة` : ""}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onEdit(p)}
                aria-label={`عدّل ${p.label}`}
                className="shrink-0 rounded-xl px-2.5 transition-colors hover:bg-white/10"
                style={{ color: T.faint }}
              >
                <Pencil size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ==================================================================== *
 *  BLOCK — the dial
 * ==================================================================== */
export function TimerDial({
  run,
  left,
  running,
  phase,
  onBreak,
  preset,
  round,
  task,
  reward,
  still,
  onToggle,
  onStop,
  onDiscard,
  onSkip,
  onBump,
  onExtend,
}) {
  const meta = phaseMeta(phase);
  const Icon = meta.icon;
  const planned = run ? run.planned : preset.min;
  const total = Math.max(1, planned * 60);
  const shown = run ? left : total;
  const pct = ((total - shown) / total) * 100;
  const hot = running && !onBreak && shown <= 60;
  const lead = hot ? T.danger : meta.tint;

  const SIZE = 268;
  const STROKE = 14;
  const r = (SIZE - STROKE) / 2;
  const c = 2 * Math.PI * r;
  const gid = useMemo(() => `los-deep-${uid()}`, []);

  return (
    <Card
      className={`flex flex-col items-center gap-6 p-6 sm:p-8${reward ? " los-reward" : ""}`}
    >
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Badge tint={meta.tint}>
          <Icon size={11} /> {phaseOf(phase).label}
        </Badge>
        {!onBreak && round > 0 && (
          <Badge tint={T.violet}>
            الجولة <span dir="ltr" className="tabular-nums">{round + 1}</span> من الدورة
          </Badge>
        )}
        {run && run.interrupts > 0 && (
          <Badge tint={T.danger}>
            <Hand size={11} />
            <span dir="ltr" className="tabular-nums">{run.interrupts}</span> {timesWord(run.interrupts)}
          </Badge>
        )}
      </div>

      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <div
          className={`pointer-events-none absolute inset-4 rounded-full blur-2xl transition-all duration-700${
            running && !still ? " los-halo" : ""
          }`}
          style={{
            background: `radial-gradient(circle, ${lead} 0%, ${meta.lift} 75%, transparent 100%)`,
            opacity: running ? 0.34 : 0.13,
          }}
        />
        {reward && !still && (
          <span
            className="los-ripple pointer-events-none absolute inset-8 rounded-full border-2"
            style={{ borderColor: T.primary }}
          />
        )}
        <svg width={SIZE} height={SIZE} className="relative -rotate-90">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={lead} />
              <stop offset="55%" stopColor={meta.lift} />
              <stop offset="100%" stopColor={onBreak ? T.sky : T.primary} />
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
            strokeDashoffset={c - (Math.min(100, Math.max(0, pct)) / 100) * c}
            style={{
              transition: "stroke-dashoffset 300ms linear",
              filter: `drop-shadow(0 0 14px ${lead}AA)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
          <span
            dir="ltr"
            className="text-[54px] font-extrabold leading-none tabular-nums"
            style={{ color: hot ? T.danger : T.fg }}
          >
            {clock(shown)}
          </span>
          <span
            className="mt-2 line-clamp-2 text-[11.5px] leading-relaxed"
            style={{ color: onBreak ? meta.lift : task ? T.ctaLift : T.faint }}
          >
            {onBreak
              ? "قم، اشرب، لا تفتح شاشة"
              : task
                ? task.text
                : "بلا مهمة محدّدة"}
          </span>
          {!onBreak && task && task.step && (
            <span className="mt-1 line-clamp-1 text-[10.5px]" style={{ color: T.faint }}>
              أول خطوة: {task.step}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {running ? (
          <Btn
            variant="outline"
            onClick={onToggle}
            style={{ borderColor: `${T.accent}59`, color: T.accent }}
          >
            <Pause size={15} /> إيقاف مؤقّت
          </Btn>
        ) : (
          <Btn variant={onBreak ? "success" : "default"} onClick={onToggle}>
            <Play size={15} />{" "}
            {!run
              ? "ابدأ الجولة"
              : runLeft(run) === run.planned * 60
                ? onBreak
                  ? "ابدأ الراحة"
                  : "ابدأ الجولة"
                : "أكمل"}
          </Btn>
        )}

        {run && !onBreak && (
          <Btn variant="outline" onClick={onStop} disabled={spentMinutes(run) < MIN_LOGGED}>
            <Square size={13} /> أوقف واحسب
          </Btn>
        )}
        {run && onBreak && (
          <Btn variant="outline" onClick={onSkip}>
            <SkipForward size={13} /> تخطَّ الراحة
          </Btn>
        )}
        {run && (
          <Btn variant="ghost" onClick={onDiscard} style={{ color: T.faint }}>
            <X size={13} /> ألغِ
          </Btn>
        )}
      </div>

      {run && !onBreak && (
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <Btn
            size="sm"
            variant="outline"
            onClick={onBump}
            disabled={!running || run.interrupts >= INTERRUPT_MAX}
            style={{ borderColor: `${T.danger}4D`, color: T.danger }}
            title="كل مرة ينقطع فيها تركيزك — اضغط ولا تخرج من الجولة"
          >
            <Hand size={13} /> سجّل تشتّتًا
          </Btn>
          <Btn size="sm" variant="ghost" onClick={() => onExtend(5)} style={{ color: T.faint }}>
            <Plus size={12} /> خمس دقائق
          </Btn>
        </div>
      )}

      <p className="text-center text-[10.5px]" style={{ color: T.faint }}>
        مفتاح المسافة يبدأ الجولة ويوقفها
        {spentMinutes(run) > 0 && !running
          ? ` · أنجزت ${minsPhrase(spentMinutes(run), true)} من هذه الجولة`
          : ""}
      </p>
    </Card>
  );
}

/* ==================================================================== *
 *  BLOCK — the switches
 *  Everything the desk may do on its own, said in one place. The defaults
 *  are the argument: the break arms *and* starts itself because the break
 *  is the half of the technique that gets skipped; the next round does not,
 *  because a round nobody chose to begin is a round nobody committed to.
 * ==================================================================== */
export function FocusSwitches({ focus, onSet, onAskNotify }) {
  const items = [
    {
      id: "autoBreak",
      label: "جهّز الراحة تلقائيًّا",
      hint: "بعد كل جولة تظهر راحتها جاهزة",
      on: focus.autoBreak,
      icon: Coffee,
      toggle: () => onSet((f) => ({ autoBreak: !f.autoBreak })),
    },
    {
      id: "autoStartBreak",
      label: "ابدأ الراحة فورًا",
      hint: "لأن الراحة هي أول ما يُلغى",
      on: focus.autoStartBreak,
      icon: Play,
      toggle: () => onSet((f) => ({ autoStartBreak: !f.autoStartBreak })),
    },
    {
      id: "autoNext",
      label: "ابدأ الجولة التالية تلقائيًّا",
      hint: "جولة لم تقرّرها ليست جولة التزمت بها",
      on: focus.autoNext,
      icon: Zap,
      toggle: () => onSet((f) => ({ autoNext: !f.autoNext })),
    },
    {
      id: "chime",
      label: "جرس عند النهاية",
      hint: "نغمتان صاعدتان للجولة، هابطتان للراحة",
      on: focus.chime,
      icon: focus.chime ? Volume2 : VolumeX,
      toggle: () => onSet((f) => ({ chime: !f.chime })),
    },
    {
      id: "notify",
      label: "تنبيه من النظام",
      hint: "يصل وأنت في نافذة أخرى",
      on: focus.notify,
      icon: focus.notify ? Bell : BellOff,
      toggle: onAskNotify,
    },
    {
      id: "awake",
      label: "لا تُطفئ الشاشة",
      hint: "تبقى مضاءة أثناء الجولة فقط",
      on: focus.awake,
      icon: MonitorCheck,
      toggle: () => onSet((f) => ({ awake: !f.awake })),
    },
    {
      id: "autoDone",
      label: "علّم المهمة منجزة بعد الجولة",
      hint: "مغلق: خمس وعشرون دقيقة ليست دليلًا على أن المهمة انتهت",
      on: focus.autoDone,
      icon: Check,
      toggle: () => onSet((f) => ({ autoDone: !f.autoDone })),
    },
  ];

  return (
    <Card className="p-6 sm:p-7">
      <h3 className="text-[17px] font-extrabold" style={{ color: T.ctaLift }}>
        ما يفعله المؤقّت من نفسه
      </h3>
      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {items.map((r) => {
          const Icon = r.icon;
          return (
            <button
              key={r.id}
              type="button"
              onClick={r.toggle}
              aria-pressed={r.on}
              className="flex items-center gap-3 rounded-xl border px-4 py-3 text-right transition-all duration-200"
              style={{
                borderColor: r.on ? `${T.primary}66` : T.border,
                backgroundColor: r.on ? `${T.primary}12` : "rgba(255,255,255,0.03)",
                color: r.on ? T.primaryLift : T.muted,
              }}
            >
              <Icon size={15} className="shrink-0" strokeWidth={r.on ? 2.6 : 2} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-bold">{r.label}</span>
                <span className="mt-0.5 block truncate text-[10px]" style={{ color: T.faint }}>
                  {r.hint}
                </span>
              </span>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-extrabold"
                style={{
                  backgroundColor: r.on ? `${T.primary}26` : "rgba(255,255,255,0.06)",
                  color: r.on ? T.primaryLift : T.faint,
                }}
              >
                {r.on ? "مفتوح" : "مغلق"}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

/* ==================================================================== *
 *  BLOCK — which task
 * ==================================================================== */
export function TaskPicker({ picked, taskId, locked, onPick }) {
  return (
    <Card className="p-6 sm:p-7">
      <h3 className="text-[17px] font-extrabold" style={{ color: T.ctaLift }}>
        على ماذا تركّز؟
      </h3>
      <p className="mt-1.5 text-[11.5px]" style={{ color: T.faint }}>
        من أهم ٣ مهام اليوم. الجولة تُسجَّل باسم المهمة، فيُعرف لاحقًا أين ذهبت
        ساعاتك فعلًا.
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
            const on = t.id === taskId;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onPick(t.id)}
                aria-pressed={on}
                disabled={locked}
                className="flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-right transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  borderColor: on ? `${T.cta}80` : T.border,
                  backgroundImage: on ? `linear-gradient(160deg, ${T.cta}2E, ${T.cta}0A)` : "none",
                  backgroundColor: on ? "transparent" : "rgba(255,255,255,0.03)",
                  color: on ? T.ctaLift : T.muted,
                }}
              >
                <Target size={15} strokeWidth={on ? 2.6 : 2} className="shrink-0" />
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[13.5px] font-bold"
                    style={{ textDecorationLine: t.done ? "line-through" : "none" }}
                  >
                    {t.text}
                  </span>
                  {t.step && (
                    <span className="mt-0.5 block truncate text-[10.5px]" style={{ color: T.faint }}>
                      أول خطوة: {t.step}
                    </span>
                  )}
                </span>
              </button>
            );
          })
        )}
        {locked && (
          <p className="text-[10.5px]" style={{ color: T.faint }}>
            الجولة جارية باسم مهمتها — تُغيَّر المهمة بعد انتهائها أو إلغائها
          </p>
        )}
      </div>
    </Card>
  );
}

/* ==================================================================== *
 *  BLOCK — the daily goal, the second meter of this screen
 * ==================================================================== */
/* The goal itself, the streak it feeds and today's interruptions. It
   deliberately does *not* reprint the day's minutes or its progress bar:
   `FocusHeaderCard` above owns those, and two cards on one screen showing
   the same number is two numbers to keep in agreement. */
export function GoalCard({ goal, today, streak, onSet }) {
  return (
    <Card className="p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <h3 className="text-[17px] font-extrabold" style={{ color: T.ctaLift }}>
            هدف التركيز اليومي
          </h3>
          <p className="mt-1.5 max-w-sm text-[11.5px] leading-relaxed" style={{ color: T.faint }}>
            ساعتان من تركيز حقيقي تهزمان يومًا كاملًا مشتتًا. اجعل الرقم صغيرًا
            بما يُبلَغ كل يوم، لا كبيرًا بما يُكسَر في الأسبوع الأول.
          </p>
        </div>
        <div className="w-full max-w-[220px] shrink-0">
          <NumStep
            value={goal}
            onChange={onSet}
            min={0}
            max={FOCUS_GOAL_MAX}
            step={15}
            unit="دقيقة"
            tint={T.cta}
          />
          <p className="mt-2 text-center text-[10.5px]" style={{ color: T.faint }}>
            {goal === 0 ? "بلا هدف — المؤقّت يسجّل فقط" : minsPhrase(goal)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {goal > 0 && (
          <div
            className="flex items-center gap-2 rounded-xl border px-4 py-2"
            style={{ borderColor: streak > 0 ? `${T.accent}4D` : T.border, color: T.muted }}
          >
            <Flame size={14} style={{ color: streak > 0 ? T.accent : T.faint }} />
            <span className="text-[11.5px]">
              {streak > 0 ? (
                <>
                  <span dir="ltr" className="font-bold tabular-nums" style={{ color: T.accent }}>
                    {streak}
                  </span>{" "}
                  {countedWord(streak)} على الهدف
                </>
              ) : (
                "لم يبدأ تتابع بعد — اليوم يصلح أن يكون الأول"
              )}
            </span>
          </div>
        )}
        {today.interrupts > 0 && (
          <div
            className="flex items-center gap-2 rounded-xl border px-4 py-2"
            style={{ borderColor: `${T.danger}3D`, color: T.muted }}
          >
            <Hand size={14} style={{ color: T.danger }} />
            <span className="text-[11.5px]">
              <span dir="ltr" className="font-bold tabular-nums" style={{ color: T.danger }}>
                {today.interrupts}
              </span>{" "}
              {timesWord(today.interrupts)} انقطع تركيزك اليوم
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ==================================================================== *
 *  BLOCK — today's rounds, and a round typed in by hand
 * ==================================================================== */
export function TodayLog({ sessions, tasks, onDrop, onManual }) {
  const list = useMemo(() => {
    const key = dayKey();
    return rows(sessions)
      .filter((s) => s.date === key)
      .slice()
      .sort((a, b) => (b.at || 0) - (a.at || 0));
  }, [sessions]);
  const names = useMemo(() => new Map(rows(tasks).map((t) => [t.id, t.text])), [tasks]);

  return (
    <Card className="p-6 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[17px] font-extrabold" style={{ color: T.ctaLift }}>
          جولات اليوم
        </h3>
        <Btn size="sm" variant="outline" onClick={onManual}>
          <ListPlus size={13} /> أضف جولة يدويًّا
        </Btn>
      </div>
      <p className="mt-1.5 text-[11.5px]" style={{ color: T.faint }}>
        العمل الذي حدث بعيدًا عن هذه الشاشة يُكتب هنا أيضًا، وإلّا فالرقم أعلاه
        ليس رقم يومك.
      </p>

      <div className="mt-4 space-y-2.5">
        {list.length === 0 ? (
          <p
            className="rounded-xl border border-dashed py-8 text-center text-[11.5px]"
            style={{ borderColor: T.border, color: T.faint }}
          >
            لا جولة بعد اليوم
          </p>
        ) : (
          list.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 rounded-xl border px-4 py-3"
              style={{
                borderColor: s.full ? `${T.primary}3D` : T.border,
                backgroundColor: "rgba(255,255,255,0.03)",
              }}
            >
              <span
                className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-extrabold"
                style={{
                  backgroundColor: s.full ? `${T.primary}1F` : `${T.accent}1A`,
                  color: s.full ? T.primaryLift : T.accent,
                }}
              >
                <span dir="ltr" className="tabular-nums">
                  {s.minutes}
                </span>{" "}
                د
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-bold" style={{ color: T.fg }}>
                  {names.get(s.taskId) || s.label || "بلا مهمة محدّدة"}
                </span>
                <span className="mt-0.5 block truncate text-[10px]" style={{ color: T.faint }}>
                  <span dir="ltr">{atClock(s.at)}</span>
                  {!s.full && s.planned > s.minutes ? ` · مقطوعة من ${s.planned} د` : ""}
                  {s.interrupts > 0 ? ` · ${s.interrupts} ${timesWord(s.interrupts)} تشتّت` : ""}
                  {s.note ? ` · ${s.note}` : ""}
                </span>
              </span>
              <button
                type="button"
                onClick={() => onDrop(s.id)}
                aria-label="أزل الجولة"
                className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-white/10"
                style={{ color: T.faint }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

/* ==================================================================== *
 *  BLOCK — what the weeks say
 *  Every figure here is read out of the state layer, so the bars, the
 *  averages and the per-task totals cannot disagree about the same minutes.
 * ==================================================================== */
export function FocusStats({ sessions, tasks, goal }) {
  const week = useMemo(() => focusWeek(sessions, 7), [sessions]);
  const span = useMemo(() => focusSpan(sessions, 30), [sessions]);
  const byTask = useMemo(() => focusByTask(sessions, tasks, 7).slice(0, 5), [sessions, tasks]);
  const band = useMemo(() => bestBand(sessions, 30), [sessions]);
  const rate = useMemo(() => interruptRate(sessions, 7), [sessions]);
  /* Scaled to the week itself, never to the goal: a 480-minute goal beside
     40-minute days would flatten every bar to a sliver and the chart would
     stop saying anything. A day that met the goal says so in emerald. */
  const peak = Math.max(...week.map((d) => d.minutes), 1);
  const weekTotal = week.reduce((n, d) => n + d.minutes, 0);
  const metDays = goal > 0 ? week.filter((d) => d.minutes >= goal).length : 0;

  if (span.total === 0)
    return (
      <Card className="p-6 sm:p-7">
        <h3 className="text-[17px] font-extrabold" style={{ color: T.ctaLift }}>
          أين تذهب ساعاتك
        </h3>
        <p
          className="mt-4 rounded-xl border border-dashed py-8 text-center text-[11.5px]"
          style={{ borderColor: T.border, color: T.faint }}
        >
          شغّل جولة واحدة وستبدأ هذه اللوحة تخبرك بأفضل ساعاتك وأين ذهب وقتك
        </p>
      </Card>
    );

  return (
    <Card className="p-6 sm:p-7">
      <h3 className="text-[17px] font-extrabold" style={{ color: T.ctaLift }}>
        أين تذهب ساعاتك
      </h3>

      {/* seven days, oldest first — an empty day is a zero and not a hole */}
      <div className="mt-5 flex items-end justify-between gap-1.5" style={{ height: 132 }}>
        {week.map((d) => {
          const met = goal > 0 && d.minutes >= goal;
          const h = Math.max(d.minutes > 0 ? 6 : 2, (d.minutes / peak) * 108);
          const date = keyToDate(d.date);
          const dow = date ? WEEK_LABELS[(date.getDay() + 1) % 7] : "";
          const isToday = d.date === dayKey();
          return (
            <div key={d.date} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <span
                dir="ltr"
                className="text-[9.5px] font-bold tabular-nums"
                style={{ color: d.minutes ? T.muted : T.faint }}
              >
                {d.minutes || ""}
              </span>
              <div
                className="w-full rounded-t-md transition-all duration-500"
                style={{
                  height: h,
                  backgroundImage: d.minutes
                    ? `linear-gradient(180deg, ${met ? T.primaryLift : T.ctaLift}, ${
                        met ? T.primary : T.cta
                      })`
                    : "none",
                  backgroundColor: d.minutes ? "transparent" : "rgba(255,255,255,0.07)",
                  boxShadow: met ? `0 0 14px -4px ${T.primary}` : "none",
                }}
                title={`${arDate(d.date)} — ${minsPhrase(d.minutes)}`}
              />
              <span
                className="text-[10px] font-bold"
                style={{ color: isToday ? T.ctaLift : T.faint }}
              >
                {dow}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-center text-[11px]" style={{ color: T.faint }}>
        هذا الأسبوع: <span dir="ltr" className="font-bold tabular-nums" style={{ color: T.cta }}>{weekTotal}</span>{" "}
        {minWord(weekTotal)}
        {goal > 0 && (
          <>
            {" — "}
            {metDays === 0 ? (
              "لا يوم على الهدف"
            ) : (
              <>
                <span dir="ltr" className="font-bold tabular-nums" style={{ color: T.primary }}>
                  {metDays}
                </span>{" "}
                {dayWord(metDays)} على الهدف
              </>
            )}
          </>
        )}
      </p>

      <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
        <StatTile
          icon={TrendingUp}
          tint={T.sky}
          label="متوسط آخر ثلاثين يومًا"
          value={minsPhrase(span.perDay)}
          hint={`${minsPhrase(span.total)} في ${roundsAfter(span.rounds)}`}
        />
        <StatTile
          icon={Flame}
          tint={T.accent}
          label="أفضل يوم في الشهر"
          value={span.best ? minsPhrase(span.best.minutes) : "—"}
          hint={span.best && span.best.minutes ? arDate(span.best.date) : "لا يوم بعد"}
        />
        <StatTile
          icon={AlarmClock}
          tint={T.violet}
          label="أفضل ساعاتك"
          value={band ? band.label : "تحتاج جولات أكثر"}
          hint={band ? `${minsPhrase(band.minutes)} في هذه الفترة وحدها` : "ثلاث جولات على الأقل"}
        />
        <StatTile
          icon={Hand}
          tint={rate !== null && rate > 1 ? T.danger : T.primary}
          label="تشتّت في الجولة"
          value={rate === null ? "—" : `${rate}`}
          hint={
            rate === null
              ? "لا جولات هذا الأسبوع"
              : rate === 0
                ? "أسبوع بلا انقطاع واحد"
                : "متوسط الانقطاعات في الجولة هذا الأسبوع"
          }
        />
      </div>

      {byTask.length > 0 && (
        <div className="mt-6">
          <h4 className="text-[13px] font-extrabold" style={{ color: T.fg }}>
            أين ذهب أسبوعك
          </h4>
          <div className="mt-3 space-y-2.5">
            {byTask.map((r) => {
              const top = byTask[0].minutes || 1;
              return (
                <div key={r.key}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span
                      className="min-w-0 flex-1 truncate text-[12px] font-bold"
                      style={{ color: r.gone ? T.faint : T.muted }}
                    >
                      {r.label}
                      {r.gone ? " (مهمة محذوفة)" : ""}
                    </span>
                    <span className="shrink-0 text-[11px]" style={{ color: T.faint }}>
                      <span dir="ltr" className="font-bold tabular-nums" style={{ color: T.cta }}>
                        {r.minutes}
                      </span>{" "}
                      {minWord(r.minutes)} · {roundsPhrase(r.rounds)}
                    </span>
                  </div>
                  <div
                    className="mt-1 h-1.5 w-full overflow-hidden rounded-full"
                    style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(3, (r.minutes / top) * 100)}%`,
                        backgroundImage: `linear-gradient(90deg, ${T.cta}, ${T.accent})`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

export function StatTile({ icon: Icon, tint, label, value, hint }) {
  return (
    <div
      className="rounded-xl border px-4 py-3"
      style={{ borderColor: T.border, backgroundColor: "rgba(255,255,255,0.03)" }}
    >
      <span className="flex items-center gap-2">
        <Icon size={13} style={{ color: tint }} />
        <span className="text-[10.5px] font-bold" style={{ color: T.faint }}>
          {label}
        </span>
      </span>
      <p className="mt-1.5 text-[15px] font-extrabold" style={{ color: tint }}>
        {value}
      </p>
      <p className="mt-0.5 text-[10px] leading-relaxed" style={{ color: T.faint }}>
        {hint}
      </p>
    </div>
  );
}

/* ==================================================================== *
 *  SHEET — the end of a phase
 *  A receipt, and the one decision that follows it. It is not a nag: it
 *  closes on Escape, on the backdrop and on «إغلاق», and nothing on this
 *  screen waits for it.
 * ==================================================================== */
export function EndSheet({ bell, task, onClose, onNote, onDone, onStart, onSkip }) {
  const [note, setNote] = useState("");
  useEffect(() => setNote(""), [bell && bell.sessionId]);
  if (!bell) return null;

  const wasFocus = !isBreak(bell.phase);
  const meta = phaseMeta(bell.phase);

  if (bell.kind === "stale")
    return (
      <Modal open onClose={onClose} title="جولة قديمة">
        <p className="text-[12.5px] leading-relaxed" style={{ color: T.muted }}>
          كانت هناك جولة معلّقة من جلسة سابقة، وقد مضى عليها وقت طويل — فلم
          تُحسب دقائقها. دقائق لا أحد يشهد عليها أسوأ من لا دقائق، لأن كل رقم
          بعدها يصبح تخمينًا.
        </p>
        <div className="mt-5 flex justify-start">
          <Btn onClick={onClose}>
            <Check size={14} /> فهمت، نبدأ من جديد
          </Btn>
        </div>
      </Modal>
    );

  const title =
    bell.kind === "cut"
      ? "أُوقفت الجولة وحُسبت"
      : wasFocus
        ? "انتهت الجولة"
        : "انتهت الراحة";

  return (
    <Modal open onClose={onClose} title={title}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tint={bell.kind === "cut" ? T.accent : meta.tint}>
          <span dir="ltr" className="tabular-nums">
            {bell.minutes}
          </span>{" "}
          {minWord(bell.minutes)}
        </Badge>
        {wasFocus && bell.kind === "done" && (
          <Badge tint={T.violet}>
            الجولة <span dir="ltr" className="tabular-nums">{bell.round}</span> في دورتك
          </Badge>
        )}
        {bell.interrupts > 0 && (
          <Badge tint={T.danger}>
            <Hand size={11} />
            <span dir="ltr" className="tabular-nums">{bell.interrupts}</span> {timesWord(bell.interrupts)}
          </Badge>
        )}
      </div>

      <p className="mt-4 text-[12.5px] leading-relaxed" style={{ color: T.muted }}>
        {bell.kind === "cut"
          ? "دقائقك مكتوبة ومعلّمة أنها جولة مقطوعة — فالرقم في الأعلى صادق، لا مجمَّل."
          : wasFocus
            ? bell.started
              ? `الراحة بدأت الآن. قم عنها، واتركها تنتهي — ${phaseOf(bell.nextPhase).label} ${bell.nextMins} دقيقة.`
              : bell.armed
                ? `${phaseOf(bell.nextPhase).label} جاهزة: ${bell.nextMins} دقيقة. ابدأها، فالراحة جزء من الجولة.`
                : "جاهز لجولة أخرى حين تشاء."
            : "انتهت الراحة. جولة واحدة أخرى، ومهمة واحدة."}
      </p>

      {wasFocus && bell.sessionId && (
        <div className="mt-5">
          <label
            className="mb-1.5 block text-[11px] font-bold"
            style={{ color: T.faint }}
            htmlFor="los-focus-note"
          >
            ماذا أنجزت في هذه الجولة؟ (تُكتب على سجل الجولة)
          </label>
          <Field
            id="los-focus-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={160}
            placeholder="سطر واحد يكفي"
            onBlur={() => note.trim() && onNote(bell.sessionId, note.trim())}
          />
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2.5">
        {bell.kind === "done" && !bell.started && (
          <Btn
            variant={wasFocus && bell.armed ? "success" : "default"}
            onClick={() => {
              if (note.trim() && bell.sessionId) onNote(bell.sessionId, note.trim());
              onStart();
            }}
          >
            <Play size={14} />{" "}
            {wasFocus && bell.armed ? `ابدأ ${phaseOf(bell.nextPhase).label}` : "ابدأ جولة"}
          </Btn>
        )}
        {bell.kind === "done" && wasFocus && bell.armed && (
          <Btn
            variant="outline"
            onClick={() => {
              if (note.trim() && bell.sessionId) onNote(bell.sessionId, note.trim());
              onSkip();
            }}
          >
            <SkipForward size={13} /> تخطَّ الراحة
          </Btn>
        )}
        {task && !task.done && (
          <Btn
            variant="gold"
            onClick={() => {
              if (note.trim() && bell.sessionId) onNote(bell.sessionId, note.trim());
              onDone(task.id);
              onClose();
            }}
          >
            <Check size={14} /> أنجزت المهمة
          </Btn>
        )}
        <Btn
          variant="ghost"
          onClick={() => {
            if (note.trim() && bell.sessionId) onNote(bell.sessionId, note.trim());
            onClose();
          }}
          style={{ color: T.faint }}
        >
          إغلاق
        </Btn>
      </div>
    </Modal>
  );
}

/* ==================================================================== *
 *  SHEET — a rhythm, added or edited
 * ==================================================================== */
export function PresetModal({ row, canDelete, full, onClose, onSave, onDelete }) {
  const [draft, setDraft] = useState(null);
  useEffect(() => {
    setDraft(row ? presetShape(row) : null);
  }, [row]);
  if (!row || !draft) return null;

  const isNew = !row.id;
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? "إيقاع جديد" : `عدّل ${row.label}`}
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-2.5">
          <div className="flex gap-2.5">
            <Btn onClick={() => onSave(draft)} disabled={isNew && full}>
              <Check size={14} /> حفظ
            </Btn>
            <Btn variant="ghost" onClick={onClose} style={{ color: T.faint }}>
              إلغاء
            </Btn>
          </div>
          {!isNew && (
            <Btn
              variant="danger"
              onClick={() => onDelete(row.id)}
              disabled={!canDelete}
              title={canDelete ? undefined : "لا بد من إيقاع واحد على الأقل"}
            >
              <Trash2 size={13} /> أزل
            </Btn>
          )}
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <label className="mb-1.5 block text-[11px] font-bold" style={{ color: T.faint }} htmlFor="los-preset-label">
            الاسم
          </label>
          <Field
            id="los-preset-label"
            value={draft.label}
            onChange={(e) => set({ label: e.target.value })}
            maxLength={40}
            placeholder="بومودورو، عمل عميق، جولة قصيرة…"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Row label="طول الجولة">
            <NumStep
              value={draft.min}
              onChange={(min) => set({ min })}
              min={ROUND_MIN}
              max={ROUND_MAX}
              step={5}
              unit="دقيقة"
              tint={T.cta}
            />
          </Row>
          <Row label="الراحة القصيرة">
            <NumStep
              value={draft.brk}
              onChange={(brk) => set({ brk })}
              min={BREAK_MIN}
              max={BREAK_MAX}
              unit="دقيقة"
              tint={T.primary}
            />
          </Row>
          <Row label="الراحة الطويلة">
            <NumStep
              value={draft.long}
              onChange={(long) => set({ long })}
              min={LONG_MIN}
              max={LONG_MAX}
              step={5}
              unit="دقيقة"
              tint={T.sky}
            />
          </Row>
          <Row label="الراحة الطويلة كل">
            <NumStep
              value={draft.every}
              onChange={(every) => set({ every })}
              min={EVERY_MIN}
              max={EVERY_MAX}
              unit="جولات"
              tint={T.violet}
            />
          </Row>
        </div>

        <p
          className="flex items-start gap-2 rounded-xl border px-4 py-3 text-[11px] leading-relaxed"
          style={{ borderColor: `${T.accent}33`, color: T.muted, backgroundColor: `${T.accent}0F` }}
        >
          <Lightbulb size={14} className="mt-0.5 shrink-0" style={{ color: T.accent }} />
          <span>
            الدورة الكاملة:{" "}
            <span dir="ltr" className="tabular-nums">{draft.every}</span> ×{" "}
            <span dir="ltr" className="tabular-nums">{draft.min}</span> دقيقة تركيز، بينها{" "}
            <span dir="ltr" className="tabular-nums">{draft.brk}</span> دقائق راحة، وتُختم بـ{" "}
            <span dir="ltr" className="tabular-nums">{draft.long}</span> دقيقة — أي{" "}
            {minsPhrase(draft.every * draft.min)} من التركيز في{" "}
            {minsPhrase(
              draft.every * draft.min + (draft.every - 1) * draft.brk + draft.long,
              true,
            )}
            .
          </span>
        </p>
        {isNew && full && (
          <p className="text-[11px]" style={{ color: T.danger }}>
            القائمة بلغت حدّها ({PRESET_CAP}) — أزل إيقاعًا قبل إضافة آخر. قائمة
            أطول من هذا تصبح هي القرار الذي وُجدت لتريحك منه.
          </p>
        )}
      </div>
    </Modal>
  );
}

function Row({ label, children }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-bold" style={{ color: T.faint }}>
        {label}
      </p>
      {children}
    </div>
  );
}

/* ==================================================================== *
 *  SHEET — a round that happened away from the screen
 * ==================================================================== */
export function ManualModal({ open, tasks, onClose, onSave }) {
  const [mins, setMins] = useState(25);
  const [taskId, setTaskId] = useState("");
  const [note, setNote] = useState("");
  useEffect(() => {
    if (!open) return;
    setMins(25);
    setTaskId("");
    setNote("");
  }, [open]);
  if (!open) return null;

  const task = tasks.find((t) => t.id === taskId) || null;
  return (
    <Modal
      open
      onClose={onClose}
      title="أضف جولة يدويًّا"
      footer={
        <div className="flex gap-2.5">
          <Btn
            onClick={() =>
              onSave({ minutes: mins, taskId: taskId || null, label: task ? task.text : "", note })
            }
            disabled={mins < MIN_LOGGED}
          >
            <Check size={14} /> سجّل
          </Btn>
          <Btn variant="ghost" onClick={onClose} style={{ color: T.faint }}>
            إلغاء
          </Btn>
        </div>
      }
    >
      <div className="space-y-5">
        <p className="text-[12px] leading-relaxed" style={{ color: T.muted }}>
          عملٌ حدث على ورق، أو في مكتبة، أو قبل أن تفتح الشاشة. يُسجَّل باسم
          اليوم ويُحتسب في هدفه كأي جولة أخرى.
        </p>
        <Row label="المدة">
          <NumStep value={mins} onChange={setMins} min={MIN_LOGGED} max={ROUND_MAX * 4} step={5} unit="دقيقة" tint={T.cta} />
        </Row>
        <div>
          <label className="mb-1.5 block text-[11px] font-bold" style={{ color: T.faint }} htmlFor="los-manual-task">
            المهمة (اختياري)
          </label>
          {/* A raw select with its options filled from `T.cardSolid`, the
              same shape the goal desk and the settings sheet use: an option
              list inherits the page's transparent background and renders as
              white-on-white in Chrome otherwise. */}
          <select
            id="los-manual-task"
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            className="w-full rounded-xl border bg-transparent px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-white/30"
            style={{ borderColor: T.border, color: T.muted }}
          >
            <option value="" style={{ background: T.cardSolid }}>
              بلا مهمة محدّدة
            </option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id} style={{ background: T.cardSolid }}>
                {t.text}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-bold" style={{ color: T.faint }} htmlFor="los-manual-note">
            ملاحظة (اختياري)
          </label>
          <Field
            id="los-manual-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={160}
            placeholder="ماذا أنجزت؟"
          />
        </div>
      </div>
    </Modal>
  );
}
