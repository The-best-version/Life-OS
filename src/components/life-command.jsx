// src/components/life-command.jsx
// ============================================================================
// الميزة #1: لوحة الأوامر الخاطفة (Ctrl + K Command Palette)
// الميزة #6: شريط التركيز والصلاة العائم (Dynamic Island / Live Focus & Prayer Bar)
// الميزة #3: الجسر التلقائي مع النادي (Life OS × Iron-Log Gym Bridge)
// ============================================================================

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Search,
  Command,
  Zap,
  Timer,
  Play,
  Pause,
  Check,
  X,
  ArrowLeft,
  Flame,
  MoonStar,
  Droplets,
  Wallet,
  Coins,
  ListChecks,
  Sparkles,
  Bot,
  Inbox,
  HeartPulse,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { T, Card, Btn, Badge, groupOf, nextPrayer, PRAYERS } from "./life-shared.jsx";
import { NAV } from "../layouts/life-nav.jsx";
import { blockAt, clockAt, prayerTimes } from "../utils/prayer-times.mjs";
import {
  dayKey,
  uid,
  rows,
  placeShape,
  clampGoal,
  taskShape,
  expenseShape,
  incomeShape,
  setDayDone,
  focusShape,
  armRun,
  startRun,
  pauseRun,
  runLeft,
  runRunning,
  settleRun,
  sessionOf,
  addSession,
} from "../state/life-state.mjs";
import {
  runLifeAgent,
  TOOL_LABELS,
  undoAgentChanges,
} from "../utils/life-agent.js";

const GYM_STORAGE_KEY = "ironlog.db.v1";
const GYM_BRIDGE_CACHE_KEY = "los_gym_bridge_cache_v1";
const SYNC_URL_IRONLOG = "http://127.0.0.1:47615/state?project=ironlog";

/* ============================================================================
 * محرك الأجواء الصوتية وموجات التركيز (Offline Web Audio Binaural & Soundscapes)
 * ============================================================================ */
const SOUNDSCAPE_PRESETS = [
  { id: "off", label: "صامت", icon: "🔇", desc: "بدون خلفية صوتية" },
  {
    id: "gamma40",
    label: "تركيز 40Hz",
    icon: "🧠",
    desc: "موجات غاما ثنائية الأذن للتركيز العميق وحل المشكلات",
  },
  {
    id: "alpha10",
    label: "تدفق 10Hz",
    icon: "🌊",
    desc: "موجات ألفا للهدوء الذهني وحالة التدفق المستمر",
  },
  {
    id: "rain",
    label: "مطر ليلي",
    icon: "🌧️",
    desc: "صوت مطر دافئ مفلتر لعزل الضوضاء الخارجية",
  },
  {
    id: "brown",
    label: "عزل عميق",
    icon: "☕",
    desc: "ضوضاء بنية منخفضة التردد لراحة الأذن الطويلة",
  },
];

function startWebAudioSoundscape(presetId, volume = 0.25) {
  if (typeof window === "undefined" || presetId === "off") return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  const ctx = new AudioCtx();
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(Math.max(0.01, Math.min(0.8, volume)), ctx.currentTime);
  masterGain.connect(ctx.destination);

  const nodes = [];

  if (presetId === "gamma40" || presetId === "alpha10") {
    const baseFreq = presetId === "gamma40" ? 200 : 174;
    const beatDiff = presetId === "gamma40" ? 40 : 10;

    const oscL = ctx.createOscillator();
    const oscR = ctx.createOscillator();
    const panL = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const panR = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

    oscL.type = "sine";
    oscR.type = "sine";
    oscL.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    oscR.frequency.setValueAtTime(baseFreq + beatDiff, ctx.currentTime);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.35, ctx.currentTime);
    subGain.connect(masterGain);

    if (panL && panR) {
      panL.pan.setValueAtTime(-0.85, ctx.currentTime);
      panR.pan.setValueAtTime(0.85, ctx.currentTime);
      oscL.connect(panL).connect(subGain);
      oscR.connect(panR).connect(subGain);
    } else {
      oscL.connect(subGain);
      oscR.connect(subGain);
    }

    oscL.start();
    oscR.start();
    nodes.push(oscL, oscR);
  } else if (presetId === "rain" || presetId === "brown") {
    const bufferSize = ctx.sampleRate * 3;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= presetId === "rain" ? 2.8 : 3.5;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(presetId === "rain" ? 720 : 340, ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(masterGain);
    whiteNoise.start();
    nodes.push(whiteNoise);
  }

  return {
    setVolume: (v) => {
      try {
        masterGain.gain.setTargetAtTime(
          Math.max(0.01, Math.min(0.8, v)),
          ctx.currentTime,
          0.08
        );
      } catch {}
    },
    stop: () => {
      try {
        nodes.forEach((n) => {
          try {
            n.stop();
          } catch {}
        });
        ctx.close();
      } catch {}
    },
  };
}

/* ============================================================================
 * الميزة #3: غرفة القيادة المركزية ونمط المكتب الحي (Ambient / Zen Desk OS)
 * ============================================================================ */
function AmbientDeskModal({
  open,
  onClose,
  state,
  setState,
  discipline,
  streak,
  hasActiveSession,
  isRunning,
  leftSecs,
  activeRun,
  linkedTask,
  upcomingPrayer,
  userPlace,
  nowDate,
  onToggleRun,
  onCompleteRun,
  onQuickStartFocus,
  formatClock,
}) {
  const [soundId, setSoundId] = useState("off");
  const [volume, setVolume] = useState(0.25);
  const soundEngineRef = useRef(null);

  useEffect(() => {
    if (!open) {
      if (soundEngineRef.current) {
        soundEngineRef.current.stop();
        soundEngineRef.current = null;
      }
      setSoundId("off");
      return;
    }
  }, [open]);

  const handleSelectSound = (id) => {
    if (soundEngineRef.current) {
      soundEngineRef.current.stop();
      soundEngineRef.current = null;
    }
    setSoundId(id);
    if (id !== "off") {
      soundEngineRef.current = startWebAudioSoundscape(id, volume);
    }
  };

  const handleVolumeChange = (nextVol) => {
    setVolume(nextVol);
    if (soundEngineRef.current) {
      soundEngineRef.current.setVolume(nextVol);
    }
  };

  useEffect(() => {
    return () => {
      if (soundEngineRef.current) {
        soundEngineRef.current.stop();
        soundEngineRef.current = null;
      }
    };
  }, []);

  if (!open) return null;

  const primaryTask =
    linkedTask ||
    (state.tasks || []).find((t) => !t.done && t.top) ||
    (state.tasks || []).find((t) => !t.done && t.quadrant === "q1") ||
    (state.tasks || []).find((t) => !t.done) ||
    null;

  const pTimes = prayerTimes(userPlace, nowDate);
  const prayerList = PRAYERS.map((p) => ({
    ...p,
    atHours: pTimes[p.id],
    clock: clockAt(pTimes[p.id]),
  }));

  const timeStr = nowDate.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const dateAr = nowDate.toLocaleDateString("ar-SA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleCompletePrimaryTask = () => {
    if (!primaryTask) return;
    setState((prev) => ({
      ...prev,
      tasks: (prev.tasks || []).map((t) =>
        t.id === primaryTask.id ? { ...t, done: true } : t
      ),
    }));
  };

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    } catch {}
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[98] flex flex-col justify-between overflow-y-auto bg-[#03050a] p-6 sm:p-10 text-white select-none"
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% 15%, rgba(16,185,129,0.08) 0%, rgba(14,165,233,0.04) 35%, rgba(3,5,10,1) 75%)",
      }}
    >
      {/* الشريط العلوي لغرفة القيادة */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_12px_#10b981]" />
          <div>
            <h2 className="text-sm font-black tracking-wide text-white">
              أثر 2030 · غرفة القيادة المكتبية (Ambient Desk OS)
            </h2>
            <p className="text-[11px] text-white/45">{dateAr}</p>
          </div>
        </div>

        {/* أزرار الأجواء الصوتية وموجات التركيز (Binaural & Soundscapes) */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5">
          {SOUNDSCAPE_PRESETS.map((preset) => {
            const active = soundId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectSound(preset.id)}
                title={preset.desc}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11.5px] font-extrabold transition-all ${
                  active
                    ? "bg-emerald-500 text-black shadow-lg"
                    : "text-white/65 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>{preset.icon}</span>
                <span>{preset.label}</span>
              </button>
            );
          })}
          {soundId !== "off" && (
            <input
              type="range"
              min="0.05"
              max="0.6"
              step="0.05"
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="mx-2 w-20 accent-emerald-400"
              title="مستوى صوت الخلفية"
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-[11.5px] font-bold text-white/80 hover:bg-white/10"
          >
            ملء الشاشة ⛶
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/15 px-4 py-2 text-[12px] font-extrabold text-rose-300 hover:bg-rose-500/25"
          >
            <X size={14} /> إغلاق (Esc)
          </button>
        </div>
      </div>

      {/* المسرح الرئيسي (3 أعمدة متوازنة) */}
      <div className="my-auto grid grid-cols-1 items-center gap-8 py-6 lg:grid-cols-12">
        {/* العمود الأيمن: رادار الصلاة الحي والمسار اليومي */}
        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.02] p-6 lg:col-span-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-400">
              🕌 رادار المواقيت الحي
            </span>
            <span className="rounded-lg bg-white/5 px-2 py-0.5 text-[10.5px] text-white/60">
              {userPlace.label}
            </span>
          </div>

          {upcomingPrayer && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
              <p className="text-[11px] font-bold text-emerald-300">
                الصلاة القادمة: {upcomingPrayer.label}
              </p>
              <p
                dir="ltr"
                className="mt-1 font-mono text-2xl font-black tabular-nums text-white"
              >
                {upcomingPrayer.left} min
              </p>
              <p className="mt-0.5 text-[11px] text-white/50">
                الأذان عند {clockAt(upcomingPrayer.at / 60)}
              </p>
            </div>
          )}

          <div className="space-y-2">
            {prayerList.map((p) => {
              const isNext = upcomingPrayer && upcomingPrayer.id === p.id;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs ${
                    isNext
                      ? "border border-emerald-500/40 bg-emerald-500/15 font-extrabold text-white"
                      : "bg-white/[0.02] text-white/55"
                  }`}
                >
                  <span>{p.label}</span>
                  <span dir="ltr" className="font-mono tabular-nums">
                    {p.clock}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* العمود الأوسط: الساعة العملاقة + المهمة الأحادية + عداد التركيز */}
        <div className="flex flex-col items-center justify-center text-center lg:col-span-6">
          <div
            dir="ltr"
            className="font-mono text-6xl font-black tracking-tight tabular-nums text-white sm:text-8xl"
            style={{
              textShadow: "0 0 60px rgba(16,185,129,0.25)",
            }}
          >
            {timeStr}
          </div>

          {/* بطاقة التركيز الأحادي (Single-Task Monotasking) */}
          <div className="mt-8 w-full max-w-xl rounded-3xl border border-white/15 bg-white/[0.03] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-300">
              <Zap size={14} />
              <span>بؤرة التركيز الأحادي الآن (Single-Task Focus)</span>
            </div>

            {primaryTask ? (
              <div className="mt-3">
                <h3 className="text-xl font-black leading-relaxed text-white sm:text-2xl">
                  «{primaryTask.text}»
                </h3>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={handleCompletePrimaryTask}
                    className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-2.5 text-xs font-black text-black transition-transform hover:scale-105"
                  >
                    <Check size={15} strokeWidth={3} /> إتمام المهمة الآن
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-white/50">
                أنجزت جميع المهام المفتوحة! استمتع بالهدوء أو ابدأ جلسة قراءة وتأمل.
              </p>
            )}

            {/* مؤقت البومودورو الحي داخل غرفة القيادة */}
            <div className="mt-6 border-t border-white/10 pt-5">
              {hasActiveSession ? (
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <span
                    dir="ltr"
                    className="font-mono text-4xl font-black tabular-nums text-amber-400"
                  >
                    {formatClock(leftSecs)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onToggleRun}
                      className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-extrabold text-white hover:bg-white/20"
                    >
                      {isRunning ? <Pause size={14} /> : <Play size={14} />}
                      {isRunning ? "إيقاف مؤقت" : "استئناف"}
                    </button>
                    <button
                      onClick={onCompleteRun}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 px-4 py-2 text-xs font-extrabold text-emerald-300 hover:bg-emerald-500/30"
                    >
                      <Check size={14} /> إنهاء وحفظ الجلسة
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    onClick={() => onQuickStartFocus(25)}
                    className="rounded-xl border border-amber-400/40 bg-amber-500/15 px-4 py-2 text-xs font-extrabold text-amber-300 hover:bg-amber-500/25"
                  >
                    ⏱️ جلسة تركيز 25 دقيقة
                  </button>
                  <button
                    onClick={() => onQuickStartFocus(50)}
                    className="rounded-xl border border-sky-400/40 bg-sky-500/15 px-4 py-2 text-xs font-extrabold text-sky-300 hover:bg-sky-500/25"
                  >
                    ⚡ غوص عميق 50 دقيقة
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* العمود الأيسر: المؤشرات الحيوية للمكتب */}
        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.02] p-6 lg:col-span-3">
          <div className="text-xs font-extrabold text-sky-400">
            📊 المؤشرات الحيوية اليومية
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-3.5 text-center">
              <p className="text-[10.5px] text-white/45">الانضباط</p>
              <p
                dir="ltr"
                className="mt-1 font-mono text-2xl font-black text-emerald-400"
              >
                {discipline}%
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/40 p-3.5 text-center">
              <p className="text-[10.5px] text-white/45">السلسلة</p>
              <p
                dir="ltr"
                className="mt-1 font-mono text-2xl font-black text-amber-400"
              >
                {streak} 🔥
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-sky-300">💧 ترطيب الجسم</span>
              <span dir="ltr" className="font-mono">
                {state.water || 0} / {clampGoal(state.waterGoal)}
              </span>
            </div>
            <button
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  water: Math.min(
                    clampGoal(prev.waterGoal),
                    (prev.water || 0) + 1
                  ),
                }))
              }
              className="mt-3 w-full rounded-xl border border-sky-400/30 bg-sky-500/15 py-2 text-xs font-extrabold text-sky-200 hover:bg-sky-500/25"
            >
              + تسجيل كوب ماء الآن
            </button>
          </div>
        </div>
      </div>

      {/* شريط التذييل الهادئ */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-white/35 border-t border-white/10 pt-3">
        <span>اختصار التشغيل السريع: Alt + Z</span>
        <span>الانضباط حرية مؤجّلة · 2027 Life OS</span>
      </div>
    </div>
  );
}

/* ============================================================================
 * الميزة #5: شريط الحفظ السريع العائم والملاحظات الخاطفة (Quick Scratchpad & Floating Dock)
 * ============================================================================ */
const SCRATCHPAD_STORAGE_KEY = "los_quick_scratchpad_v1";

function QuickScratchpadModal({ open, onClose, state, setState, onGo }) {
  const [text, setText] = useState(() => {
    try {
      return localStorage.getItem(SCRATCHPAD_STORAGE_KEY) || "";
    } catch {
      return "";
    }
  });
  const [notice, setNotice] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(SCRATCHPAD_STORAGE_KEY, text);
    } catch {}
  }, [text]);

  if (!open) return null;

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const flashNotice = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 3200);
  };

  const handleConvertToTasks = () => {
    if (!lines.length) return;
    setState((prev) => ({
      ...prev,
      tasks: [
        ...lines.map((line) =>
          taskShape({ text: line, quadrant: "q2", top: false, done: false })
        ),
        ...(prev.tasks || []),
      ],
    }));
    setText("");
    flashNotice(`✅ تم تحويل ${lines.length} سطر إلى مهام في مصفوفتك!`);
  };

  const handleSendToInbox = () => {
    if (!lines.length) return;
    try {
      const existing = JSON.parse(
        localStorage.getItem("life_os_inbox_items") || "[]"
      );
      const added = lines.map((line, i) => ({
        id: `scratch-${Date.now()}-${i}`,
        text: line,
        type: /ريال|صرفت|دفعت|قهوة|غداء/.test(line) ? "finance" : "idea",
        source: "المفكرة الخاطفة 📝",
        createdAt: new Date().toISOString(),
      }));
      localStorage.setItem(
        "life_os_inbox_items",
        JSON.stringify([...added, ...existing])
      );
      setText("");
      flashNotice(`📥 تم إرسال ${lines.length} ملاحظة إلى صندوق الوارد الذكي!`);
    } catch {}
  };

  const handleAiTriageScratchpad = async () => {
    if (!lines.length || aiBusy) return;
    setAiBusy(true);
    try {
      const prompt = `قم بفرز وتنفيذ الملاحظات الخاطفة التالية في النظام باستخدام الأدوات المناسبة (مهام، مصاريف، مواعيد، عادات):\n${lines.join("\n")}`;
      const reply = await runLifeAgent(prompt, [], state, setState, {
        mode: "executive",
      });
      if (!reply?.error) {
        setText("");
        flashNotice("✨ قام الوكيل الذكي بفرز وتنفيذ ملاحظاتك بنجاح!");
      } else {
        flashNotice("⚠️ تعذّر الفرز بالوكيل — يمكنك تحويلها لمهام بضغطة زر.");
      }
    } catch {
      flashNotice("⚠️ تعذّر الاتصال بالوكيل.");
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="fixed bottom-20 left-4 z-[92] w-[min(410px,92vw)] rounded-3xl border border-amber-400/35 bg-[#0a0f1d]/95 p-5 text-white shadow-2xl backdrop-blur-2xl"
      style={{
        boxShadow: "0 20px 60px -15px rgba(0,0,0,0.85), 0 0 35px -10px rgba(245,158,11,0.25)",
      }}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
            <Sparkles size={15} />
          </span>
          <div>
            <h4 className="text-xs font-black text-white">
              المفكرة الخاطفة العائمة (Quick Scratchpad)
            </h4>
            <p className="text-[10px] text-white/45">
              حفظ تلقائي فوري · سطر لكل فكرة أو مهمة (Alt + N)
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
        >
          <X size={14} />
        </button>
      </div>

      <textarea
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="دوّن أي فكرة خاطفة، رقم، أو مهمة عابرة هنا بدون مغادرة شاشتك... (كل سطر عنصر مستقل)"
        className="mt-3 w-full resize-none rounded-2xl border border-white/15 bg-black/45 p-3.5 text-xs font-bold leading-relaxed text-white placeholder-white/30 outline-none focus:border-amber-400/60"
        autoFocus
      />

      {notice && (
        <div className="mt-2 rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-3 py-1.5 text-[11px] font-bold text-emerald-300">
          {notice}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-1.5">
        <button
          onClick={handleConvertToTasks}
          disabled={!lines.length}
          className="flex items-center gap-1 rounded-xl border border-sky-400/30 bg-sky-500/15 px-3 py-2 text-[11px] font-extrabold text-sky-300 hover:bg-sky-500/25 disabled:opacity-40"
        >
          <ListChecks size={13} /> للمهام ({lines.length})
        </button>

        <button
          onClick={handleSendToInbox}
          disabled={!lines.length}
          className="flex items-center gap-1 rounded-xl border border-rose-400/30 bg-rose-500/15 px-3 py-2 text-[11px] font-extrabold text-rose-300 hover:bg-rose-500/25 disabled:opacity-40"
        >
          <Inbox size={13} /> للوارد
        </button>

        <button
          onClick={handleAiTriageScratchpad}
          disabled={!lines.length || aiBusy}
          className="flex items-center gap-1 rounded-xl border border-violet-400/40 bg-violet-500/20 px-3 py-2 text-[11px] font-extrabold text-violet-200 hover:bg-violet-500/30 disabled:opacity-40"
        >
          {aiBusy ? <Loader2 size={13} className="animate-spin" /> : <Bot size={13} />}
          فرز بالوكيل ✨
        </button>
      </div>
    </div>
  );
}

/* ============================================================================
 * 1) شريط التركيز والصلاة العائم (Dynamic Island Bar — Feature #6)
 * ============================================================================ */
export function DynamicIslandBar({
  state,
  setState,
  discipline,
  streak,
  onGo,
  onOpenCommand,
}) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [expanded, setExpanded] = useState(false);
  const [pwaPrompt, setPwaPrompt] = useState(null);
  const [ambientOpen, setAmbientOpen] = useState(false);
  const [scratchpadOpen, setScratchpadOpen] = useState(false);

  // اختصارات لوحة المفاتيح السريعة: Alt+Z لغرفة القيادة المكتبية، و Alt+N للمفكرة الخاطفة
  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey && (e.key === "z" || e.key === "Z" || e.key === "ئ")) {
        e.preventDefault();
        setAmbientOpen((v) => !v);
      } else if (e.altKey && (e.key === "n" || e.key === "N" || e.key === "ى")) {
        e.preventDefault();
        setScratchpadOpen((v) => !v);
      } else if (e.key === "Escape") {
        setAmbientOpen(false);
        setScratchpadOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // التقاط حدث تثبيت التطبيق كـ PWA على الهاتف أو سطح المكتب
  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setPwaPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const handleInstallPwa = async () => {
    if (!pwaPrompt) return;
    try {
      pwaPrompt.prompt();
      await pwaPrompt.userChoice;
    } catch {}
    setPwaPrompt(null);
  };

  const focusObj = useMemo(() => focusShape(state.focus), [state.focus]);
  const activeRun = focusObj.run;
  const isRunning = runRunning(activeRun);
  const totalRunSecs = (activeRun?.minutes || 25) * 60;
  const leftSecs = useMemo(
    () => (activeRun ? runLeft(activeRun, nowMs) : totalRunSecs),
    [activeRun, nowMs, totalRunSecs]
  );

  // هل هناك جلسة عمل عميق نشطة أو موقوفة مؤقتاً في منتصفها؟
  const hasActiveSession =
    isRunning || (activeRun && activeRun.left < totalRunSecs && activeRun.left > 0);

  // تحديث الساعة كل ثانية عند عمل المؤقت أو عند فتح غرفة القيادة، وكل 15 ثانية في الوضع العادي
  useEffect(() => {
    const interval = setInterval(
      () => setNowMs(Date.now()),
      hasActiveSession || ambientOpen ? 1000 : 15000
    );
    return () => clearInterval(interval);
  }, [hasActiveSession, ambientOpen]);

  // إنهاء المرحلة تلقائياً إذا وصل المؤقت إلى الصفر أثناء التجول في شاشات أخرى
  useEffect(() => {
    if (!isRunning || leftSecs > 0) return;
    setState((prev) => {
      const f = focusShape(prev.focus);
      if (!runRunning(f.run)) return prev;
      const now = Date.now();
      if (runLeft(f.run, now) > 0) return prev;
      const settled = settleRun(f, now);
      return {
        ...prev,
        focus: settled.focus,
        sessions: settled.session
          ? addSession(prev.sessions, settled.session)
          : prev.sessions,
      };
    });
  }, [isRunning, leftSecs, setState]);

  const nowDate = useMemo(() => new Date(nowMs), [nowMs]);
  const userPlace = useMemo(() => placeShape(state.place), [state.place]);
  const upcomingPrayer = useMemo(
    () => nextPrayer(userPlace, nowDate),
    [userPlace, nowDate]
  );
  const currentBlock = useMemo(
    () => blockAt(userPlace, nowDate),
    [userPlace, nowDate]
  );
  const blockGroup = useMemo(() => groupOf(currentBlock?.id), [currentBlock]);

  const prayerSoon =
    upcomingPrayer && !upcomingPrayer.tomorrow && upcomingPrayer.left <= 20;

  const linkedTask = useMemo(() => {
    if (!activeRun?.task) return null;
    return (state.tasks || []).find((t) => t.id === activeRun.task) || null;
  }, [activeRun, state.tasks]);

  const formatClock = (secs) => {
    const s = Math.max(0, Math.round(secs));
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  };

  // تحديث عنوان المتصفح وشاشة القفل (Live Activity Title) أثناء التركيز أو اقتراب الصلاة
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (hasActiveSession) {
      const label = activeRun?.phase === "focus" ? "تركيز عميق" : "استراحة";
      document.title = `⏱️ ${formatClock(leftSecs)} · ${label} | أثر 2030`;
    } else if (prayerSoon && upcomingPrayer) {
      document.title = `🕌 بعد ${upcomingPrayer.left} د · صلاة ${upcomingPrayer.label} | أثر 2030`;
    } else {
      document.title = "2027 Life OS — أثر 2030";
    }
  }, [hasActiveSession, leftSecs, activeRun, prayerSoon, upcomingPrayer]);

  const handleToggleRun = (e) => {
    e.stopPropagation();
    const now = Date.now();
    setState((prev) => {
      const f = focusShape(prev.focus);
      const nextR = runRunning(f.run) ? pauseRun(f.run, now) : startRun(f.run, now);
      return { ...prev, focus: { ...f, run: nextR } };
    });
  };

  const handleCompleteRun = (e) => {
    e.stopPropagation();
    const now = Date.now();
    setState((prev) => {
      const f = focusShape(prev.focus);
      const sess = sessionOf(f.run, now, true);
      const nextR = armRun(f, "focus", f.run?.preset);
      return {
        ...prev,
        focus: { ...f, run: nextR },
        sessions: sess ? addSession(prev.sessions, sess) : prev.sessions,
      };
    });
  };

  const handleQuickStartFocus = (mins = 25) => {
    const now = Date.now();
    setState((prev) => {
      const f = focusShape(prev.focus);
      const armed = {
        ...armRun(f, "focus", f.run?.preset),
        minutes: mins,
        left: mins * 60,
      };
      const started = startRun(armed, now);
      return { ...prev, focus: { ...f, run: started } };
    });
  };

  const openHabitsInBlock = useMemo(() => {
    return (state.habits || []).filter(
      (h) => h.group === currentBlock?.id && !h.done
    ).length;
  }, [state.habits, currentBlock]);

  const BlockIcon = blockGroup?.icon || MoonStar;

  return (
    <div className="sticky top-3 z-40 mx-auto flex w-full max-w-4xl justify-center px-4 pointer-events-none">
      <div
        className="pointer-events-auto flex flex-wrap items-center justify-between gap-2.5 rounded-full border px-3.5 py-2 shadow-2xl transition-all duration-300"
        style={{
          backgroundColor: "rgba(10, 14, 24, 0.88)",
          backdropFilter: "blur(24px) saturate(160%)",
          borderColor: hasActiveSession
            ? `${T.cta}66`
            : prayerSoon
              ? `${T.primary}66`
              : "rgba(255, 255, 255, 0.14)",
          boxShadow: hasActiveSession
            ? `0 10px 35px -10px ${T.cta}55, inset 0 1px 0 rgba(255,255,255,0.2)`
            : prayerSoon
              ? `0 10px 35px -10px ${T.primary}55, inset 0 1px 0 rgba(255,255,255,0.2)`
              : "0 12px 32px -12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.15)",
        }}
      >
        {/* القسم الأيمن: حالة العمل العميق أو تنبيه الصلاة أو الفترة الحالية */}
        {hasActiveSession ? (
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              {isRunning && (
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                  style={{ backgroundColor: T.cta }}
                />
              )}
              <span
                className="relative inline-flex h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: isRunning ? T.cta : T.accent }}
              />
            </span>

            <button
              onClick={() => onGo("deep")}
              className="flex items-center gap-2 text-right transition-opacity hover:opacity-80"
              title="افتح شاشة العمل العميق"
            >
              <Timer size={14} style={{ color: T.ctaLift }} />
              <span className="text-[12px] font-extrabold text-white">
                {activeRun.phase === "focus" ? "تركيز عميق" : "استراحة"}
              </span>
              {linkedTask && (
                <span className="hidden max-w-[140px] truncate text-[11px] text-white/60 sm:inline">
                  · {linkedTask.text}
                </span>
              )}
            </button>

            <span
              dir="ltr"
              className="rounded-lg px-2 py-0.5 font-mono text-[13px] font-black tabular-nums"
              style={{
                backgroundColor: `${T.cta}22`,
                color: T.ctaLift,
              }}
            >
              {formatClock(leftSecs)}
            </span>

            <div className="flex items-center gap-1 border-r border-white/10 pr-2">
              <button
                onClick={handleToggleRun}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                title={isRunning ? "إيقاف مؤقت" : "استئناف"}
              >
                {isRunning ? <Pause size={12} /> : <Play size={12} />}
              </button>
              <button
                onClick={handleCompleteRun}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 transition-colors hover:bg-emerald-500/30"
                title="إنهاء وحفظ الجلسة"
              >
                <Check size={12} />
              </button>
            </div>
          </div>
        ) : prayerSoon ? (
          <button
            onClick={() => onGo("today")}
            className="flex items-center gap-2 text-right"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <MoonStar size={14} className="text-emerald-400" />
            <span className="text-[12px] font-extrabold text-emerald-300">
              اقتربت صلاة {upcomingPrayer.label}
            </span>
            <span
              dir="ltr"
              className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[11px] font-black tabular-nums text-emerald-200"
            >
              بعد {upcomingPrayer.left} د ({clockAt(upcomingPrayer.at / 60)})
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onGo("routine")}
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-bold transition-colors hover:bg-white/5"
              style={{ color: blockGroup?.tint || T.accent }}
              title="الفترة الحالية من اليوم"
            >
              <BlockIcon size={13} />
              <span>{blockGroup?.label || "اليوم"}</span>
              {openHabitsInBlock > 0 && (
                <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[10px] text-white/80">
                  {openHabitsInBlock} متبقية
                </span>
              )}
            </button>

            {upcomingPrayer && (
              <span className="hidden items-center gap-1 text-[11px] text-white/45 md:inline-flex">
                · {upcomingPrayer.tomorrow ? "فجر غدٍ" : upcomingPrayer.label}{" "}
                <strong dir="ltr" className="text-white/75 tabular-nums">
                  {clockAt(upcomingPrayer.at / 60)}
                </strong>
              </span>
            )}
          </div>
        )}

        {/* القسم الأيسر: أزرار الوصول الخاطف (تركيز سريع + تثبيت PWA + لوحة الأوامر Ctrl+K) */}
        <div className="flex items-center gap-1.5">
          {pwaPrompt && (
            <button
              onClick={handleInstallPwa}
              className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-300 transition-all hover:bg-emerald-500/25"
              title="تثبيت أثر 2030 كتطبيق هاتف أو سطح مكتب مستقل (PWA)"
            >
              <span>📲 تثبيت التطبيق</span>
            </button>
          )}
          {!hasActiveSession && (
            <button
              onClick={() => handleQuickStartFocus(25)}
              className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-bold text-white/75 transition-all hover:border-orange-400/40 hover:bg-orange-500/10 hover:text-orange-200 sm:inline-flex"
              title="ابدأ جلسة تركيز 25 دقيقة فوراً"
            >
              <Zap size={11} className="text-orange-400" />
              <span>تركيز 25د</span>
            </button>
          )}

          <button
            onClick={() => setScratchpadOpen((v) => !v)}
            className="inline-flex items-center gap-1 rounded-full border border-amber-400/35 bg-amber-500/15 px-2.5 py-1 text-[11px] font-extrabold text-amber-300 transition-all hover:bg-amber-500/25"
            title="المفكرة الخاطفة العائمة (Alt + N)"
          >
            <span>📝 مفكرة</span>
          </button>

          <button
            onClick={() => setAmbientOpen(true)}
            className="inline-flex items-center gap-1 rounded-full border border-sky-400/35 bg-sky-500/15 px-2.5 py-1 text-[11px] font-extrabold text-sky-300 transition-all hover:bg-sky-500/25"
            title="وضع القيادة المكتبي والتركيز الصوتي (Alt + Z)"
          >
            <span>🖥️ وضع القيادة</span>
          </button>

          <button
            onClick={() => setExpanded((x) => !x)}
            className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-extrabold tabular-nums text-white/75 transition-colors hover:bg-white/10 md:inline-flex"
            title="الانضباط اليومي وسلسلة الالتزام"
          >
            <Flame
              size={11}
              style={{ color: streak > 0 ? T.ember : "rgba(255,255,255,0.3)" }}
            />
            <span>{discipline}%</span>
          </button>

          <button
            onClick={onOpenCommand}
            className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11.5px] font-extrabold transition-all hover:scale-[1.02]"
            style={{
              borderColor: `${T.cta}4D`,
              background: `linear-gradient(135deg, ${T.cta}26, rgba(255,255,255,0.05))`,
              color: T.ctaLift,
            }}
            title="افتح لوحة الأوامر الخاطفة (Ctrl + K)"
          >
            <Search size={12} />
            <span className="hidden sm:inline">أوامر سريعة</span>
            <kbd
              dir="ltr"
              className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[10px] text-white/70 border border-white/10"
            >
              Ctrl+K
            </kbd>
          </button>
        </div>
      </div>

      {/* الميزة #3: غرفة القيادة المركزية ونمط المكتب الحي */}
      <AmbientDeskModal
        open={ambientOpen}
        onClose={() => setAmbientOpen(false)}
        state={state}
        setState={setState}
        discipline={discipline}
        streak={streak}
        hasActiveSession={hasActiveSession}
        isRunning={isRunning}
        leftSecs={leftSecs}
        activeRun={activeRun}
        linkedTask={linkedTask}
        upcomingPrayer={upcomingPrayer}
        userPlace={userPlace}
        nowDate={nowDate}
        onToggleRun={handleToggleRun}
        onCompleteRun={handleCompleteRun}
        onQuickStartFocus={handleQuickStartFocus}
        formatClock={formatClock}
      />

      {/* الميزة #5: شريط الحفظ السريع العائم والملاحظات الخاطفة */}
      <QuickScratchpadModal
        open={scratchpadOpen}
        onClose={() => setScratchpadOpen(false)}
        state={state}
        setState={setState}
        onGo={onGo}
      />
    </div>
  );
}

/* ============================================================================
 * 2) لوحة الأوامر الخاطفة (Command Palette Ctrl+K — Feature #1)
 * ============================================================================ */
export function CommandPalette({
  open,
  onClose,
  state,
  setState,
  onGo,
}) {
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIdx(0);
      setAiFeedback(null);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  // تحليل الأوامر النصية المباشرة (مثل: ص 45 غداء | دخل 500 | تركيز 50 | مهمة ...)
  const parsedInstantCommands = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    const list = [];

    // 1. أمر مصروف سريع: "ص 45 غداء" أو "مصروف 45 غداء"
    const expMatch = q.match(/^(?:ص|مصروف|صرف)\s+(\d+(?:\.\d+)?)\s*(.*)$/);
    if (expMatch) {
      const amount = Number(expMatch[1]);
      const label = (expMatch[2] || "مصروف سريع").trim();
      list.push({
        id: "instant-exp-need",
        title: `تسجيل مصروف (حاجة): ${amount} ر.س — ${label}`,
        sub: "يُضاف فوراً في سجل المصاريف اليومية",
        badge: "مصروف فوري",
        tint: T.primary,
        icon: Wallet,
        run: () => {
          setState((prev) => ({
            ...prev,
            expenses: [
              expenseShape({ label, amount, kind: "need", date: dayKey() }),
              ...(prev.expenses || []),
            ],
          }));
          onClose();
        },
      });
      list.push({
        id: "instant-exp-want",
        title: `تسجيل مصروف (رغبة): ${amount} ر.س — ${label}`,
        sub: "يُصنّف كرغبة ثانوية في ميزانية الشهر",
        badge: "رغبة",
        tint: T.accent,
        icon: Wallet,
        run: () => {
          setState((prev) => ({
            ...prev,
            expenses: [
              expenseShape({ label, amount, kind: "want", date: dayKey() }),
              ...(prev.expenses || []),
            ],
          }));
          onClose();
        },
      });
    }

    // 2. أمر دخل سريع: "دخل 1200 مشروع"
    const incMatch = q.match(/^(?:د|دخل|إيراد)\s+(\d+(?:\.\d+)?)\s*(.*)$/);
    if (incMatch) {
      const amount = Number(incMatch[1]);
      const source = (incMatch[2] || "دخل إضافي").trim();
      list.push({
        id: "instant-inc",
        title: `تسجيل دخل: +${amount} ر.س — ${source}`,
        sub: "يُضاف فوراً إلى إجمالي الدخل",
        badge: "دخل فوري",
        tint: T.primary,
        icon: Coins,
        run: () => {
          setState((prev) => ({
            ...prev,
            income: [
              incomeShape({ source, amount, date: dayKey() }),
              ...(prev.income || []),
            ],
          }));
          onClose();
        },
      });
    }

    // 3. أمر جلسة تركيز: "تركيز 45" أو "بومودورو 50"
    const focusMatch = q.match(/^(?:تركيز|بومودورو|عميق)\s*(\d+)?$/);
    if (focusMatch) {
      const mins = Math.max(5, Math.min(180, Number(focusMatch[1] || 25)));
      list.push({
        id: "instant-focus",
        title: `بدء جلسة عمل عميق لمدة ${mins} دقيقة`,
        sub: "يشغّل مؤقت التركيز في الشريط العائم فوراً",
        badge: "عمل عميق",
        tint: T.cta,
        icon: Timer,
        run: () => {
          const now = Date.now();
          setState((prev) => {
            const f = focusShape(prev.focus);
            const armed = {
              ...armRun(f, "focus", f.run?.preset),
              minutes: mins,
              left: mins * 60,
            };
            return { ...prev, focus: { ...f, run: startRun(armed, now) } };
          });
          onClose();
        },
      });
    }

    // 4. أمر مهمة سريعة: "مهمة ..."
    const taskMatch = q.match(/^(?:مهمة|م)\s+(.+)$/);
    if (taskMatch) {
      const text = taskMatch[1].trim();
      list.push({
        id: "instant-task",
        title: `إضافة مهمة لأهم الثلاث اليوم: «${text}»`,
        sub: "تُضاف في مصفوفة المهام وتظهر في شاشة اليوم",
        badge: "مهمة جديدة",
        tint: T.ctaLift,
        icon: Zap,
        run: () => {
          setState((prev) => ({
            ...prev,
            tasks: [
              taskShape({ text, quadrant: "q1", top: true, done: false }),
              ...(prev.tasks || []),
            ],
          }));
          onClose();
        },
      });
    }

    // 5. أمر فكرة في صندوق الوارد: "وارد ..." أو "فكرة ..."
    const inboxMatch = q.match(/^(?:وارد|فكرة)\s+(.+)$/);
    if (inboxMatch) {
      const text = inboxMatch[1].trim();
      list.push({
        id: "instant-inbox",
        title: `حفظ في صندوق الوارد: «${text}»`,
        sub: "تُحفظ لتصنيفها لاحقاً بالذكاء الاصطناعي",
        badge: "صندوق الوارد",
        tint: T.sky,
        icon: Inbox,
        run: () => {
          setState((prev) => ({
            ...prev,
            inbox: [
              { id: uid(), text, createdAt: new Date().toISOString() },
              ...(prev.inbox || []),
            ],
          }));
          onClose();
        },
      });
    }

    return list;
  }, [query, setState, onClose]);

  // قائمة الأوامر المدمجة (عادات + إجراءات سريعة + تنقل بين الشاشات)
  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = [...parsedInstantCommands];

    // الإجراءات السريعة الافتراضية
    const quickActions = [
      {
        id: "act-water",
        title: `شرب كوب ماء (+1) · الحالي: ${state.water || 0}/${clampGoal(state.waterGoal)}`,
        sub: "يزيد عداد الماء اليومي كوباً واحداً",
        badge: "سريع",
        tint: T.sky,
        icon: Droplets,
        keywords: "ماء شرب كوب ترطيب water",
        run: () => {
          setState((prev) => ({
            ...prev,
            water: Math.min(clampGoal(prev.waterGoal), (prev.water || 0) + 1),
          }));
          onClose();
        },
      },
      {
        id: "act-focus-25",
        title: "بدء جلسة تركيز عميق (25 دقيقة)",
        sub: "يشغّل مؤقت العمل العميق فوراً",
        badge: "بومودورو",
        tint: T.cta,
        icon: Timer,
        keywords: "تركيز بومودورو عميق مؤقت focus",
        run: () => {
          const now = Date.now();
          setState((prev) => {
            const f = focusShape(prev.focus);
            const armed = { ...armRun(f, "focus", f.run?.preset), minutes: 25, left: 25 * 60 };
            return { ...prev, focus: { ...f, run: startRun(armed, now) } };
          });
          onClose();
        },
      },
      {
        id: "act-focus-50",
        title: "بدء جلسة تركيز عميق (50 دقيقة)",
        sub: "جلسة عمل عميق طويلة للإنجاز الثقيل",
        badge: "عمل عميق",
        tint: T.accent,
        icon: Timer,
        keywords: "تركيز 50 عميق جلسة طويلة",
        run: () => {
          const now = Date.now();
          setState((prev) => {
            const f = focusShape(prev.focus);
            const armed = { ...armRun(f, "focus", f.run?.preset), minutes: 50, left: 50 * 60 };
            return { ...prev, focus: { ...f, run: startRun(armed, now) } };
          });
          onClose();
        },
      },
    ];

    for (const act of quickActions) {
      if (!q || act.title.toLowerCase().includes(q) || act.keywords.includes(q)) {
        out.push(act);
      }
    }

    // العادات اليومية (تأشير فوري)
    const habits = state.habits || [];
    for (const h of habits) {
      if (!q ? !h.done : h.label.toLowerCase().includes(q)) {
        out.push({
          id: `hab-${h.id}`,
          title: `${h.done ? "إلغاء تأشير" : "إنجاز عادة"}: ${h.label}`,
          sub: h.min ? `النسخة الصغيرة: ${h.min}` : "عادة يومية",
          badge: h.done ? "مُنجزة ✓" : "عادة اليوم",
          tint: h.done ? T.primary : T.ctaLift,
          icon: ListChecks,
          run: () => {
            const today = dayKey();
            setState((prev) => {
              const nextHabits = (prev.habits || []).map((x) =>
                x.id === h.id ? { ...x, done: !x.done, tiny: false } : x
              );
              return setDayDone(
                { ...prev, habits: nextHabits },
                today,
                h.id,
                !h.done,
                false
              );
            });
            onClose();
          },
        });
      }
    }

    // التنقل بين شاشات النظام
    for (const nav of NAV) {
      if (!q || nav.label.toLowerCase().includes(q) || nav.id.toLowerCase().includes(q)) {
        out.push({
          id: `nav-${nav.id}`,
          title: `الانتقال إلى: ${nav.label}`,
          sub: "فتح الشاشة مباشرة",
          badge: "شاشة",
          tint: T.muted,
          icon: nav.icon || Command,
          run: () => {
            onGo(nav.id);
            onClose();
          },
        });
      }
    }

    // إذا كتب المستخدم أمراً نصياً، نتيح له تنفيذه عبر الوكيل الذكي مباشرة
    if (q.length >= 2) {
      out.push({
        id: "ask-ai-agent",
        title: `اطلب من الوكيل الذكي: «${query.trim()}»`,
        sub: "ينفّذ الأمر بأدوات الوكيل (إضافة مهام، مصاريف، جدول، تحليل...)",
        badge: "ذكاء اصطناعي ✨",
        tint: T.violet,
        icon: Bot,
        run: async () => {
          setAiBusy(true);
          setAiFeedback(null);
          try {
            const res = await runLifeAgent(query.trim(), [], state, setState);
            setAiFeedback({
              reply: typeof res === "string" ? res : res?.text || "تم التنفيذ.",
              executedTools: (res?.toolCalls || []).map((tc) => tc.name || tc),
              before: res?.before || null,
            });
          } catch (err) {
            setAiFeedback({
              reply: "تعذر الاتصال بالوكيل: " + err.message,
              executedTools: [],
              before: null,
            });
          } finally {
            setAiBusy(false);
          }
        },
      });
    }

    return out.slice(0, 14);
  }, [query, parsedInstantCommands, state, setState, onGo, onClose]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => (items.length ? (i + 1) % items.length : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) =>
          items.length ? (i - 1 + items.length) % items.length : 0
        );
      } else if (e.key === "Enter" && items[selectedIdx] && !aiBusy) {
        e.preventDefault();
        items[selectedIdx].run();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, items, selectedIdx, onClose, aiBusy]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center bg-black/75 px-4 pt-16 sm:pt-24 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-3xl border shadow-2xl"
        style={{
          backgroundColor: "rgba(13, 18, 30, 0.96)",
          borderColor: "rgba(255, 255, 255, 0.16)",
          boxShadow: "0 25px 70px -15px rgba(0, 0, 0, 0.85)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* شريط البحث والأوامر */}
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <Search size={18} style={{ color: T.ctaLift }} className="shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="اكتب أمراً خاطفاً: «ص 45 غداء»، «تركيز 50»، «مهمة مراجعة»، أو اسم عادة/شاشة..."
            className="w-full bg-transparent text-[14px] font-bold text-white placeholder-white/35 outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="rounded-lg p-1 text-white/40 hover:bg-white/10 hover:text-white"
            >
              <X size={15} />
            </button>
          )}
          <kbd
            dir="ltr"
            className="hidden shrink-0 rounded-lg border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] text-white/50 sm:inline-block"
          >
            ESC
          </kbd>
        </div>

        {/* شريط تلميحات الاختصارات */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/5 bg-white/[0.02] px-5 py-2 text-[10.5px] text-white/45">
          <span className="font-bold text-white/60">اختصارات فورية:</span>
          <button
            onClick={() => setQuery("ص 35 قهوة")}
            className="rounded-md bg-white/5 px-2 py-0.5 hover:bg-white/10 hover:text-white"
          >
            ص 35 قهوة
          </button>
          <button
            onClick={() => setQuery("دخل 500 مشروع")}
            className="rounded-md bg-white/5 px-2 py-0.5 hover:bg-white/10 hover:text-white"
          >
            دخل 500 مشروع
          </button>
          <button
            onClick={() => setQuery("تركيز 45")}
            className="rounded-md bg-white/5 px-2 py-0.5 hover:bg-white/10 hover:text-white"
          >
            تركيز 45
          </button>
          <button
            onClick={() => setQuery("مهمة ")}
            className="rounded-md bg-white/5 px-2 py-0.5 hover:bg-white/10 hover:text-white"
          >
            مهمة ...
          </button>
        </div>

        {/* عرض رد الوكيل الذكي إن تم استدعاؤه من اللوحة */}
        {aiBusy && (
          <div className="flex items-center gap-3 border-b border-indigo-500/20 bg-indigo-500/10 px-5 py-4 text-indigo-200">
            <Loader2 size={18} className="animate-spin text-indigo-400" />
            <span className="text-[13px] font-bold">
              الوكيل الذكي ينفّذ أمرك الآن...
            </span>
          </div>
        )}

        {aiFeedback && (
          <div className="space-y-3 border-b border-emerald-500/20 bg-emerald-500/10 px-5 py-4">
            <p className="text-[13px] font-bold leading-relaxed text-white">
              {aiFeedback.reply}
            </p>
            {aiFeedback.executedTools?.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {aiFeedback.executedTools.map((t, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-300"
                  >
                    <CheckCircle2 size={12} />
                    {TOOL_LABELS[t] || t}
                  </span>
                ))}
                {aiFeedback.before && (
                  <button
                    onClick={() => {
                      undoAgentChanges(aiFeedback.before, state, setState);
                      setAiFeedback(null);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-amber-500/20 px-2.5 py-1 text-[11px] font-bold text-amber-300 hover:bg-amber-500/30"
                  >
                    <RotateCcw size={12} /> تراجع
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* قائمة النتائج */}
        <div className="max-h-[370px] overflow-y-auto p-2.5 space-y-1">
          {items.map((item, idx) => {
            const active = idx === selectedIdx;
            const Icon = item.icon || Zap;
            return (
              <button
                key={item.id}
                onMouseEnter={() => setSelectedIdx(idx)}
                onClick={() => item.run()}
                className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-right transition-all ${
                  active ? "bg-white/10 shadow-md" : "hover:bg-white/5"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
                    style={{
                      borderColor: `${item.tint || T.cta}40`,
                      backgroundColor: `${item.tint || T.cta}18`,
                      color: item.tint || T.ctaLift,
                    }}
                  >
                    <Icon size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-extrabold text-white">
                      {item.title}
                    </p>
                    {item.sub && (
                      <p className="truncate text-[11px] text-white/45">
                        {item.sub}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {item.badge && (
                    <span
                      className="rounded-lg px-2 py-0.5 text-[10.5px] font-extrabold"
                      style={{
                        backgroundColor: `${item.tint || T.cta}20`,
                        color: item.tint || T.ctaLift,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                  <ArrowLeft
                    size={14}
                    className={active ? "text-white" : "text-white/20"}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * 3) الجسر التلقائي مع النادي (Life OS × Iron-Log Bridge — Feature #3)
 * ============================================================================ */

function getSaturdayWeekStart(dateObj = new Date()) {
  const d = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  const dow = d.getDay(); // 0 Sun .. 6 Sat
  const diff = dow === 6 ? 0 : dow + 1;
  d.setDate(d.getDate() - diff);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function parseIronLogDb(rawPayload) {
  if (!rawPayload || typeof rawPayload !== "object") return null;
  if (Array.isArray(rawPayload.sessions) && Array.isArray(rawPayload.setEntries)) {
    return rawPayload;
  }
  if (rawPayload[GYM_STORAGE_KEY]) {
    const inner = rawPayload[GYM_STORAGE_KEY];
    if (typeof inner === "string") {
      try {
        return JSON.parse(inner);
      } catch {
        return null;
      }
    }
    return inner;
  }
  return null;
}

function summarizeIronLog(db) {
  const today = dayKey();
  const weekStart = getSaturdayWeekStart(new Date());
  const sessions = Array.isArray(db?.sessions) ? db.sessions : [];
  const setEntries = Array.isArray(db?.setEntries) ? db.setEntries : [];
  const attendance =
    db?.attendance && typeof db.attendance === "object" ? db.attendance : {};
  const bodyMetrics =
    db?.bodyMetrics && typeof db.bodyMetrics === "object" ? db.bodyMetrics : {};
  const weeklyGoal = Number(db?.settings?.weeklyGoal) || 4;

  const weekSessions = sessions.filter((s) => s && s.date >= weekStart);
  const weekAttendedDays = new Set([
    ...weekSessions.map((s) => s.date),
    ...Object.entries(attendance)
      .filter(([dt, on]) => on && dt >= weekStart)
      .map(([dt]) => dt),
  ]);

  const trainedToday =
    sessions.some((s) => s && s.date === today) || Boolean(attendance[today]);

  const workingSets = setEntries.filter((s) => s && !s.isWarmup);
  const totalVolumeKg = Math.round(
    workingSets.reduce(
      (sum, s) => sum + (Number(s.weightKg) || 0) * (Number(s.reps) || 0),
      0
    )
  );

  // استخراج آخر وزن مسجّل للجسم
  const metricDates = Object.keys(bodyMetrics).sort();
  let latestWeightKg = Number(db?.settings?.bodyWeightKg) || null;
  let latestWeightDate = null;
  for (let i = metricDates.length - 1; i >= 0; i--) {
    const m = bodyMetrics[metricDates[i]];
    if (m && Number(m.weightKg) > 0) {
      latestWeightKg = Number(m.weightKg);
      latestWeightDate = metricDates[i];
      break;
    }
  }

  const sortedSessions = [...sessions].sort((a, b) =>
    (b.date || "").localeCompare(a.date || "")
  );
  const lastSession = sortedSessions[0] || null;

  return {
    connected: true,
    weeklyGoal,
    weekCount: weekAttendedDays.size,
    totalSessions: sessions.length,
    totalSets: workingSets.length,
    totalVolumeKg,
    trainedToday,
    latestWeightKg,
    latestWeightDate,
    lastSessionDate: lastSession?.date || null,
    lastSessionNote: lastSession?.note || "",
  };
}

export function GymBridgeCard({ state, setState }) {
  const [gymSummary, setGymSummary] = useState(() => {
    try {
      const localDbRaw = localStorage.getItem(GYM_STORAGE_KEY);
      if (localDbRaw) {
        const parsed = parseIronLogDb(JSON.parse(localDbRaw));
        if (parsed) return summarizeIronLog(parsed);
      }
      const cached = localStorage.getItem(GYM_BRIDGE_CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {
      /* ignore */
    }
    return {
      connected: false,
      weeklyGoal: 4,
      weekCount: 0,
      totalSessions: 0,
      totalSets: 0,
      totalVolumeKg: 0,
      trainedToday: false,
      latestWeightKg: null,
      latestWeightDate: null,
      lastSessionDate: null,
      lastSessionNote: "",
    };
  });

  const [syncing, setSyncing] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [showWeightForm, setShowWeightForm] = useState(false);
  const [syncNotice, setSyncNotice] = useState("");

  // البحث عن عادة التمرين الرياضي في Life OS
  const gymHabit = useMemo(() => {
    const habits = state.habits || [];
    return (
      habits.find(
        (h) =>
          h.id === "h11" ||
          /مقاومة|نادي|تمارين|حديد|رياضة|gym/i.test(h.label || "")
      ) || null
    );
  }, [state.habits]);

  // البحث عن هدف الوزن أو الصحة في إرثي 2030
  const weightGoal = useMemo(() => {
    const goals = state.goals || [];
    return (
      goals.find(
        (g) =>
          g.pillar === "health" &&
          /وزن|68|كجم|عضل|نادي|صحة/i.test(g.text || "")
      ) || null
    );
  }, [state.goals]);

  const applyAutoHabitSync = useCallback(
    (summary) => {
      if (!summary?.trainedToday || !gymHabit || gymHabit.done) return;
      const today = dayKey();
      setState((prev) => {
        const currentH = (prev.habits || []).find((x) => x.id === gymHabit.id);
        if (!currentH || currentH.done) return prev;
        const nextHabits = (prev.habits || []).map((x) =>
          x.id === gymHabit.id ? { ...x, done: true, tiny: false } : x
        );
        return setDayDone(
          { ...prev, habits: nextHabits },
          today,
          gymHabit.id,
          true,
          false
        );
      });
      setSyncNotice("تم رصد تمرين اليوم في Iron-Log وتأشير عادة التمرين تلقائياً! 💪");
      setTimeout(() => setSyncNotice(""), 4500);
    },
    [gymHabit, setState]
  );

  const fetchGymData = useCallback(async () => {
    setSyncing(true);
    try {
      // 1. محاولة القراءة من خادم المزامنة المحلي لمشروع ironlog
      let db = null;
      try {
        const res = await fetch(SYNC_URL_IRONLOG, {
          headers: { "x-local-sync": "1" },
          cache: "no-store",
        });
        if (res.ok) {
          const payload = await res.json();
          db = parseIronLogDb(payload?.data || payload);
        }
      } catch {
        /* الخادم غير مشغل حالياً، ننتقل للتخزين المحلي */
      }

      // 2. القراءة من localStorage إن وجد
      if (!db) {
        const raw = localStorage.getItem(GYM_STORAGE_KEY);
        if (raw) db = parseIronLogDb(JSON.parse(raw));
      }

      if (db) {
        const summary = summarizeIronLog(db);
        setGymSummary(summary);
        try {
          localStorage.setItem(GYM_BRIDGE_CACHE_KEY, JSON.stringify(summary));
        } catch {
          /* ignore */
        }
        applyAutoHabitSync(summary);
      }
    } catch {
      /* ignore */
    } finally {
      setSyncing(false);
    }
  }, [applyAutoHabitSync]);

  useEffect(() => {
    fetchGymData();
  }, [fetchGymData]);

  // تسجيل حضور التمرين اليوم + مزامنة مع Iron-Log و Life OS بضغطة واحدة
  const handleLogWorkoutToday = async () => {
    const today = dayKey();
    let db = null;
    try {
      const raw = localStorage.getItem(GYM_STORAGE_KEY);
      if (raw) db = parseIronLogDb(JSON.parse(raw));
    } catch {
      /* ignore */
    }

    if (!db || typeof db !== "object") {
      db = {
        version: 1,
        exercises: [],
        programDays: [],
        sessions: [],
        setEntries: [],
        attendance: {},
        nutrition: {},
        bodyMetrics: {},
        health: {},
        settings: { weeklyGoal: 4, bodyWeightKg: 74 },
        updatedAt: Date.now(),
      };
    }

    db.attendance = { ...(db.attendance || {}), [today]: true };
    if (!Array.isArray(db.sessions)) db.sessions = [];
    if (!db.sessions.some((s) => s && s.date === today)) {
      db.sessions.push({
        id: uid(),
        date: today,
        programDayId: null,
        note: "تم التسجيل عبر جسر أثر Life OS",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    const parsedWeight = Number(weightInput);
    if (parsedWeight > 25 && parsedWeight < 300) {
      db.bodyMetrics = {
        ...(db.bodyMetrics || {}),
        [today]: {
          date: today,
          weightKg: parsedWeight,
          waistCm: db.bodyMetrics?.[today]?.waistCm || null,
          note: "تحديث من Life OS",
        },
      };
      if (db.settings) db.settings.bodyWeightKg = parsedWeight;
    }

    db.updatedAt = Date.now();

    try {
      localStorage.setItem(GYM_STORAGE_KEY, JSON.stringify(db));
    } catch {
      /* ignore */
    }

    try {
      await fetch(SYNC_URL_IRONLOG, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-local-sync": "1",
        },
        body: JSON.stringify({ data: db }),
      });
    } catch {
      /* ignore offline sync server */
    }

    const nextSummary = summarizeIronLog(db);
    setGymSummary(nextSummary);
    try {
      localStorage.setItem(GYM_BRIDGE_CACHE_KEY, JSON.stringify(nextSummary));
    } catch {
      /* ignore */
    }

    // تأشير عادة التمرين في Life OS وتحديث ملاحظة هدف الوزن إن أدخل وزناً
    setState((prev) => {
      let nextState = { ...prev };
      if (gymHabit) {
        const nextHabits = (prev.habits || []).map((x) =>
          x.id === gymHabit.id ? { ...x, done: true, tiny: false } : x
        );
        nextState = setDayDone(
          { ...nextState, habits: nextHabits },
          today,
          gymHabit.id,
          true,
          false
        );
      }
      if (parsedWeight > 25 && weightGoal) {
        nextState.goals = (prev.goals || []).map((g) =>
          g.id === weightGoal.id
            ? {
                ...g,
                note: `آخر وزن مسجل من جسر النادي (${today}): ${parsedWeight} كجم`,
              }
            : g
        );
      }
      return nextState;
    });

    setShowWeightForm(false);
    setWeightInput("");
    setSyncNotice("تم تسجيل تمرين اليوم ومزامنته مع النادي (Iron-Log) والروتين بنجاح! 🏋️‍♂️");
    setTimeout(() => setSyncNotice(""), 4500);
  };

  const weekPct = Math.min(
    100,
    Math.round((gymSummary.weekCount / Math.max(1, gymSummary.weeklyGoal)) * 100)
  );
  const isTodayDone = gymSummary.trainedToday || Boolean(gymHabit?.done);

  return (
    <Card
      className="p-5 sm:p-6 relative overflow-hidden"
      style={{
        borderColor: isTodayDone ? `${T.primary}4D` : `${T.ember}3D`,
        background:
          "linear-gradient(135deg, rgba(249,115,22,0.06) 0%, rgba(16,185,129,0.04) 100%)",
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border"
            style={{
              borderColor: isTodayDone ? `${T.primary}50` : `${T.ember}50`,
              backgroundColor: isTodayDone ? `${T.primary}18` : `${T.ember}18`,
              color: isTodayDone ? T.primaryLift : T.ember,
            }}
          >
            <HeartPulse size={20} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[15.5px] font-extrabold text-white">
                جسر النادي (Iron-Log × أثر)
              </h3>
              <Badge tint={isTodayDone ? T.primary : T.ember}>
                {isTodayDone ? "تم تمرين اليوم 🏋️" : "بانتظار التمرين"}
              </Badge>
            </div>
            <p className="mt-0.5 text-[11.5px] text-white/50">
              يربط جلسات الحديد ووزن الجسم تلقائياً بعاداتك اليومية وهدف الـ 68 كجم
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowWeightForm((v) => !v)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[11.5px] font-bold text-white/80 transition-colors hover:bg-white/10"
          >
            {gymSummary.latestWeightKg
              ? `الوزن: ${gymSummary.latestWeightKg} كجم`
              : "تسجيل الوزن"}
          </button>
          <button
            onClick={fetchGymData}
            disabled={syncing}
            title="مزامنة الآن مع Iron-Log"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/65 transition-colors hover:bg-white/10 hover:text-white"
          >
            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {syncNotice && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-3.5 py-2 text-[12px] font-bold text-emerald-300">
          <CheckCircle2 size={15} />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* مؤشرات النادي */}
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
          <p className="text-[10.5px] text-white/45">التزام الأسبوع</p>
          <p
            dir="ltr"
            className="mt-1 text-[16px] font-black tabular-nums"
            style={{ color: weekPct >= 100 ? T.primaryLift : T.ctaLift }}
          >
            {gymSummary.weekCount} / {gymSummary.weeklyGoal}
          </p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${weekPct}%`,
                backgroundColor: weekPct >= 100 ? T.primary : T.cta,
              }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
          <p className="text-[10.5px] text-white/45">إجمالي الجلسات</p>
          <p
            dir="ltr"
            className="mt-1 text-[16px] font-black tabular-nums text-white"
          >
            {gymSummary.totalSessions} جلسة
          </p>
          <p className="mt-1 text-[10px] text-white/40">
            {gymSummary.lastSessionDate
              ? `آخرها: ${gymSummary.lastSessionDate.slice(5)}`
              : "لا جلسات بعد"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
          <p className="text-[10.5px] text-white/45">الحجم التدريبي</p>
          <p
            dir="ltr"
            className="mt-1 text-[16px] font-black tabular-nums"
            style={{ color: T.sky }}
          >
            {gymSummary.totalVolumeKg > 0
              ? `${(gymSummary.totalVolumeKg / 1000).toFixed(1)} طن`
              : `${gymSummary.totalSets} جولة`}
          </p>
          <p className="mt-1 text-[10px] text-white/40">مجموع الأوزان × التكرار</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
          <p className="text-[10.5px] text-white/45">الوزن نحو هدف 68 كجم</p>
          <p
            dir="ltr"
            className="mt-1 text-[16px] font-black tabular-nums"
            style={{ color: T.accent }}
          >
            {gymSummary.latestWeightKg
              ? `${gymSummary.latestWeightKg} kg`
              : "غير مسجل"}
          </p>
          <p className="mt-1 text-[10px] text-white/40">
            {gymSummary.latestWeightKg
              ? `الفرق للهدف: ${Math.abs(68 - gymSummary.latestWeightKg).toFixed(1)} كجم`
              : "اضغط تسجيل الوزن"}
          </p>
        </div>
      </div>

      {/* نافذة مصغرة لتحديث الوزن أو تسجيل تمرين اليوم */}
      {showWeightForm && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-black/30 p-3">
          <input
            type="number"
            step="0.1"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            placeholder="وزنك اليوم بالكيلوجرام (مثال: 66.5)"
            className="min-w-[200px] flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-[12.5px] text-white outline-none focus:border-white/35"
          />
          <Btn variant="default" size="sm" onClick={handleLogWorkoutToday}>
            <Check size={14} /> حفظ الوزن وتأشير التمرين
          </Btn>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
        <span className="text-[11px] text-white/45">
          العادة المرتبطة:{" "}
          <strong className="text-white/80">
            {gymHabit ? gymHabit.label : "تمارين مقاومة"}
          </strong>{" "}
          {gymHabit?.done ? "(مؤشّرة اليوم ✓)" : "(غير مؤشّرة بعد)"}
        </span>

        {!isTodayDone && (
          <Btn variant="default" size="sm" onClick={handleLogWorkoutToday}>
            <Check size={14} /> أنجزت تمرين النادي اليوم
          </Btn>
        )}
      </div>
    </Card>
  );
}
