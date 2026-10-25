// src/features/life-agent.jsx
// ============================================================================
// 🤖 مركز القيادة الذكي (AI Executive Command Center) — صفحة الوكيل الرئيسية
// ============================================================================

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Sparkles,
  Send,
  Bot,
  User,
  Zap,
  CheckCircle2,
  Trash2,
  RotateCcw,
  Paperclip,
  Mic,
  MicOff,
  Brain,
  SlidersHorizontal,
  X,
  CalendarClock,
  Moon,
  Target,
  GraduationCap,
  Droplets,
  Wallet,
  Flame,
  Loader2,
  AlertCircle,
  Volume2,
  VolumeX,
  Feather,
  CalendarDays,
} from "lucide-react";
import { Card, Btn, T } from "../components/life-shared.jsx";
import {
  rows,
  clampGoal,
  disciplineOf,
  netBalance,
} from "../state/life-state.mjs";
import {
  runLifeAgent,
  getLocalBriefing,
  getTimeContext,
  detectPatterns,
  getAgentMemory,
  updateAgentProfile,
  getAgentConfig,
  saveAgentConfig,
  undoAgentChanges,
  AGENT_PERSONAS,
  TOOL_LABELS,
} from "../utils/life-agent.js";

const CHAT_STORAGE_KEY = "lifeOS.agentChatHistory.v2";

export function AgentModule({ state, setState }) {
  const cfg = useMemo(() => getAgentConfig(), []);
  const [mode, setMode] = useState(cfg.defaultPersona || "executive");
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    const brief = getLocalBriefing(state);
    return [
      {
        id: "init-brief",
        role: "assistant",
        text:
          brief?.text ||
          "مرحباً بك في مركز القيادة التنفيذي. أنا وكيلك الذكي المتصل بجميع أقسام Life OS.",
        chips: brief?.chips || [],
        isBriefing: true,
      },
    ];
  });

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeStep, setActiveStep] = useState(null);

  // حالات الصور (Vision)
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // حالة الإملاء الصوتي (Voice Input) والرد الصوتي (Hands-Free Voice Companion)
  const [listening, setListening] = useState(false);
  const [handsFreeMode, setHandsFreeMode] = useState(false);
  const [voiceReplyOn, setVoiceReplyOn] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const recognitionRef = useRef(null);

  // دالة النطق الصوتي الطبيعي بالعربية (Web Speech Synthesis)
  const speakArabic = (rawText) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const cleanText = String(rawText || "")
        .replace(/[*#_`~>-]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 450);
      if (!cleanText) return;
      const utter = new window.SpeechSynthesisUtterance(cleanText);
      utter.lang = "ar-SA";
      utter.rate = 1.05;
      const voices = window.speechSynthesis.getVoices?.() || [];
      const arVoice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith("ar"));
      if (arVoice) utter.voice = arVoice;
      utter.onstart = () => setSpeaking(true);
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utter);
    } catch {
      setSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    try {
      window.speechSynthesis?.cancel();
    } catch {}
    setSpeaking(false);
  };

  // لوحة الأنماط والإعدادات
  const [showInsights, setShowInsights] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [profileName, setProfileName] = useState(() => getAgentMemory().profile?.name || "");
  const [profileFocus, setProfileFocus] = useState(
    () => (getAgentMemory().profile?.goals || []).join("، ")
  );
  const [apiModel, setApiModel] = useState(() => getAgentConfig().model);
  const [apiKeyInput, setApiKeyInput] = useState(() => getAgentConfig().apiKey);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // حفظ المحادثة محلياً
  useEffect(() => {
    try {
      const clean = messages.slice(-40).map((m) => ({
        ...m,
        image: undefined, // لا نخزن الصور الثقيلة في localStorage
        before: undefined,
      }));
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(clean));
    } catch {}
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, activeStep, imagePreview]);

  // مؤشرات حية لأعلى الصفحة
  const telemetry = useMemo(() => {
    const safe = state || {};
    const time = getTimeContext(safe);
    const habits = rows(safe.habits);
    const pct = disciplineOf(habits);
    const water =
      typeof safe.water === "number"
        ? safe.water
        : Number(safe.water?.today ?? 0);
    const waterGoal = clampGoal(safe.waterGoal);
    const balance = netBalance(safe.income, safe.expenses);
    const openTopTasks = rows(safe.tasks).filter((t) => t.today && !t.done).length;
    const patterns = detectPatterns(safe, getAgentMemory());

    // توليد مبادرة استباقية ذكية حسب اللحظة الحالية (Proactive Autonomy Nudge)
    let proactiveNudge = null;
    const openInBlock = habits.filter(
      (h) => h.group === time.blockId && !h.done
    );
    const topTask = rows(safe.tasks).find((t) => t.today && !t.done);
    if (openInBlock.length > 0) {
      proactiveNudge = {
        title: `مبادرة استباقية لفترة «${time.currentBlock}»`,
        desc: `بقي لديك ${openInBlock.length} عادات في هذه الفترة (أولها: «${openInBlock[0].label}»). هل نؤشرها الآن أو نرتب ما تبقى من الفترة؟`,
        prompt: `أنجزت عادة «${openInBlock[0].label}» الآن، حدث حالتي وأخبرني بما تبقى في فترة ${time.currentBlock}.`,
        cta: `تأشير «${openInBlock[0].label}» ⚡`,
      };
    } else if (topTask) {
      proactiveNudge = {
        title: "مبادرة التركيز العميق",
        desc: `مهمتك الأهم اليوم «${topTask.text}» بانتظارك. هل نبدأ جلسة عمل عميق لمدة ٢٥ دقيقة لإنجازها؟`,
        prompt: `ابدأ جلسة عمل عميق لمدة 25 دقيقة على مهمة «${topTask.text}» وشجعني باختصار.`,
        cta: "ابدأ جلسة تركيز ٢٥د 🎯",
      };
    } else if (water < Math.ceil(waterGoal / 2)) {
      proactiveNudge = {
        title: "تنبيه الترطيب والطاقة الحيوية",
        desc: `شربت ${water} من ${waterGoal} أكواب ماء اليوم. كوب ماء الآن يرفع تركيزك الذهني فوراً.`,
        prompt: "سجل لي شرب كوب ماء الآن وأعطني نصيحة سريعة للطاقة.",
        cta: "سجّل كوب ماء 💧",
      };
    }

    return {
      pct,
      water,
      waterGoal,
      balance,
      openTopTasks,
      currentBlock: time.currentBlock,
      upcomingPrayer: time.upcomingPrayer,
      patterns,
      proactiveNudge,
    };
  }, [state]);

  // البروتوكولات التنفيذية بضغطة زر
  const executiveProtocols = [
    {
      id: "plan_day",
      label: "هندسة اليوم بين الصلوات",
      icon: CalendarClock,
      tint: "#f59e0b",
      prompt:
        "خطّط يومي الآن: استخدم أداة auto_plan_day لتوزيع أهم مهامي على الفترات الذهبية بين الصلوات اليوم، ورتّب أهم 3 مهام لليوم، ثم اعرض لي الجدول الزمني المقترح بوضوح.",
    },
    {
      id: "emergency_mode",
      label: "وضع الطوارئ (الحد الأدنى)",
      icon: Feather,
      tint: "#f43f5e",
      prompt:
        "أنا اليوم مرهق جداً ومضغوط.. استخدم أداة trigger_emergency_mode لتفعيل وضع الطوارئ، وأنقذ عاداتي الأساسية بالنسخة الخفيفة (complete_tiny_core: true) لضمان عدم السقوط للصفر، وخفف عني ضغط اليوم.",
    },
    {
      id: "weekly_planning",
      label: "تخطيط الأسبوع والعادة المحورية",
      icon: CalendarDays,
      tint: "#38bdf8",
      prompt:
        "ساعدني أخطط أسبوعي: اسألني عن أبرز انتصار في الأسبوع الماضي، والعائق الأكبر، واقترح لي العادة المحورية (Keystone Habit) وهدف 2030 الذي سنركز عليه، واعتمد الخطة بأداة save_weekly_review.",
    },
    {
      id: "breakdown_stuck",
      label: "تفكيك مهمة عالقة (التسويف)",
      icon: Zap,
      tint: "#fbbf24",
      prompt:
        "ابحث في قائمة مهامي عن المهام المتراكمة أو الثقيلة، واقترح عليّ تفكيك المهمة الأكثر إلحاحاً إلى خطوة أولى مادية مدتها ٥ دقائق باستخدام أداة breakdown_task لتثبيتها في أهم مهام اليوم.",
    },
    {
      id: "evening_shutdown",
      label: "جلسة إقفال المساء",
      icon: Moon,
      tint: "#8b5cf6",
      prompt:
        "ابدأ معي جلسة إقفال المساء: اعرض لي العادات الأساسية المتبقية اليوم بإيجاز، ورشّح لي أهم 3 مهام ليوم الغد بناءً على مصفوفتي، واسألني عن مشتت اليوم وحل الغد لتسجيلها في مرآة المساء.",
    },
    {
      id: "goals_velocity",
      label: "تحليل أهداف 2030",
      icon: Target,
      tint: "#10b981",
      prompt:
        "حلّل تقدمي في أهداف الربع الحالي وإرث 2030: ما هي الأهداف المتقدمة والمتأخرة؟ وما هي الخطوة العملية التي يجب أن أفعلها اليوم لرفع سرعة الإنجاز؟",
    },
    {
      id: "uni_radar",
      label: "رادار الجامعة",
      icon: GraduationCap,
      tint: "#0ea5e9",
      prompt:
        "اعطني تقريراً أكاديمياً سريعاً عن موادي الجامعية، حالة الغيابات مقارنة بسقف الحرمان، وأقرب الاستحقاقات أو الاختبارات وكيف أستعد لها اليوم.",
    },
  ];

  // رفع صورة (فاتورة / جدول / ملاحظة)
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const resultStr = String(ev.target?.result || "");
      const base64 = resultStr.split(",")[1];
      setSelectedImage({ base64, mimeType: file.type });
      setImagePreview(resultStr);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // الإملاء الصوتي بالعربية + وضع المحادثة الصوتية الفورية بدون لمس (Hands-Free)
  const toggleVoiceInput = (autoSend = false) => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      setHandsFreeMode(false);
      return;
    }
    const SpeechRec =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;
    if (!SpeechRec) {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          role: "assistant",
          text: "⚠️ متصفحك الحالي لا يدعم الإملاء الصوتي المباشر. يمكنك كتابة رسالتك مباشرة.",
        },
      ]);
      return;
    }

    const rec = new SpeechRec();
    rec.lang = "ar-SA";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setListening(true);
      if (autoSend) {
        setHandsFreeMode(true);
        setVoiceReplyOn(true);
      }
    };
    rec.onend = () => {
      setListening(false);
      setHandsFreeMode(false);
    };
    rec.onerror = () => {
      setListening(false);
      setHandsFreeMode(false);
    };
    rec.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      if (transcript) {
        if (autoSend) {
          handleSend(transcript, true);
        } else {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
          inputRef.current?.focus();
        }
      }
    };

    recognitionRef.current = rec;
    rec.start();
  };

  // إرسال الرسالة للوكيل
  const handleSend = async (overrideText = null, forceSpeak = false) => {
    const textToSend = (
      typeof overrideText === "string" ? overrideText : input
    ).trim();
    if ((!textToSend && !selectedImage) || isTyping) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      text: textToSend || (selectedImage ? "📸 أرفقت صورة للتحليل" : ""),
      image: imagePreview,
    };

    const currentHistory = [...messages, userMsg];
    setMessages(currentHistory);
    setInput("");

    const imgBase64 = selectedImage?.base64;
    const imgMime = selectedImage?.mimeType;
    setSelectedImage(null);
    setImagePreview(null);
    setIsTyping(true);
    setActiveStep(null);

    try {
      const historyForApi = messages
        .slice(-16)
        .map((m) => ({
          role: m.role === "agent" ? "assistant" : m.role,
          content: m.text,
        }));

      const reply = await runLifeAgent(
        textToSend,
        historyForApi,
        state,
        setState,
        {
          mode,
          imageBase64: imgBase64,
          imageMimeType: imgMime,
          onStep: (step) => {
            if (step.type === "tool") setActiveStep(step.label || step.name);
          },
        }
      );

      const replyText =
        typeof reply === "string" ? reply : reply?.text || "تم التنفيذ بنجاح.";
      const toolCalls = Array.isArray(reply?.toolCalls) ? reply.toolCalls : [];

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: replyText,
          tools: toolCalls,
          before: reply?.before || null,
          undone: false,
        },
      ]);

      if (voiceReplyOn || forceSpeak) {
        speakArabic(replyText);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          text: `⚠️ عذراً، حدث خطأ أثناء التواصل مع الوكيل: ${error?.message || ""}`,
        },
      ]);
    } finally {
      setActiveStep(null);
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  // التراجع عن إجراءات دور معين (Undo)
  const handleUndoTurn = (msgId, beforeSnapshot) => {
    if (!beforeSnapshot) return;
    undoAgentChanges(beforeSnapshot, state, setState);
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, undone: true } : m))
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const clearChat = () => {
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch {}
    const brief = getLocalBriefing(state, true);
    setMessages([
      {
        id: `reset-${Date.now()}`,
        role: "assistant",
        text: brief?.text || "تم بدء جلسة جديدة. كيف نرتب يومك الآن؟",
        chips: brief?.chips || [],
        isBriefing: true,
      },
    ]);
  };

  const fillBrainDumpTemplate = () => {
    setInput(
      "تفريغ سريع لليوم:\n- أنجزت عادة: \n- صرفت: \n- مهام جديدة: \n- قراءة أو دراسة: "
    );
    inputRef.current?.focus();
  };

  const handleSaveSettings = () => {
    updateAgentProfile({
      name: profileName.trim(),
      goals: profileFocus
        .split(/[،,]/)
        .map((s) => s.trim())
        .filter(Boolean),
    });
    saveAgentConfig({
      model: apiModel.trim() || "claude-haiku-5-5",
      apiKey: apiKeyInput.trim(),
      defaultPersona: mode,
    });
    setShowConfig(false);
  };

  return (
    <div
      className="flex flex-col min-h-[calc(100vh-140px)] w-full max-w-5xl mx-auto pb-6 space-y-4"
      dir="rtl"
    >
      {/* 1. رأس مركز القيادة + شريط المؤشرات الحية */}
      <Card className="p-5 sm:p-6 border border-white/10 bg-[#0c0c14]/90 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-lg"
              style={{
                borderColor: `${T.cta}50`,
                background: `linear-gradient(135deg, ${T.cta}25, ${T.violet}20)`,
                color: T.ctaLift,
              }}
            >
              <Sparkles size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  الوكيل التنفيذي الذكي
                </h1>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10.5px] font-extrabold text-emerald-400">
                  18 أداة نشطة
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                متصل مباشرة بالروتين، أوقات الصلاة، مصفوفة المهام، أهداف 2030، المالية، والجامعة
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* زر وضع القيادة والمرافق الصوتي الفوري بدون لمس */}
            <button
              onClick={() => toggleVoiceInput(true)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                handsFreeMode
                  ? "border-rose-500 bg-rose-500/20 text-rose-300 animate-pulse"
                  : "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
              }`}
              title="تحدث مباشرة وسينفذ الوكيل أمرك ويرد عليك صوتياً بدون لمس الشاشة"
            >
              <Mic size={14} />
              {handsFreeMode ? "يستمع لأمرك الصوتي..." : "مرافق صوتي فوري 🎙️"}
            </button>

            <button
              onClick={() => {
                if (speaking) stopSpeaking();
                setVoiceReplyOn((v) => !v);
              }}
              className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all hover:bg-white/10"
              style={{
                borderColor: voiceReplyOn ? `${T.sky}60` : T.border,
                background: voiceReplyOn ? `${T.sky}15` : "rgba(255,255,255,0.04)",
                color: voiceReplyOn ? T.sky : T.muted,
              }}
              title="قراءة ردود الوكيل صوتياً بالعربية"
            >
              {voiceReplyOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
              {speaking ? "ينطق الآن..." : voiceReplyOn ? "الرد الصوتي مفعّل" : "الرد الصوتي"}
            </button>

            <button
              onClick={() => setShowInsights((v) => !v)}
              className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all hover:bg-white/10"
              style={{
                borderColor: showInsights ? `${T.primary}60` : T.border,
                background: showInsights ? `${T.primary}15` : "rgba(255,255,255,0.04)",
                color: showInsights ? T.primary : T.muted,
              }}
            >
              <Brain size={14} /> الأنماط ({telemetry.patterns.length})
            </button>
            <button
              onClick={() => setShowConfig((v) => !v)}
              className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all hover:bg-white/10"
              style={{
                borderColor: showConfig ? `${T.cta}60` : T.border,
                background: showConfig ? `${T.cta}15` : "rgba(255,255,255,0.04)",
                color: showConfig ? T.ctaLift : T.muted,
              }}
            >
              <SlidersHorizontal size={14} /> إعدادات الوكيل
            </button>
            <button
              onClick={clearChat}
              className="flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-2 text-xs font-bold text-white/50 hover:bg-white/10 hover:text-white transition-all"
              title="بدء محادثة جديدة"
            >
              <Trash2 size={14} /> جلسة جديدة
            </button>
          </div>
        </div>

        {/* شريط القياس الحي (Live Telemetry Strip) */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5">
            <Flame size={16} className="text-orange-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-white/40 font-bold">مؤشر الانضباط</p>
              <p className="text-sm font-black text-white tabular-nums">
                {telemetry.pct}%{" "}
                <span className="text-[10px] font-medium text-white/40">
                  ({telemetry.currentBlock})
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5">
            <Target size={16} className="text-violet-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-white/40 font-bold">مهام اليوم الثلاث</p>
              <p className="text-sm font-black text-white tabular-nums">
                {telemetry.openTopTasks > 0
                  ? `متبقي ${telemetry.openTopTasks}`
                  : "مكتملة / غير محددة"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5">
            <Droplets size={16} className="text-sky-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-white/40 font-bold">شرب الماء</p>
              <p className="text-sm font-black text-white tabular-nums">
                {telemetry.water} / {telemetry.waterGoal} أكواب
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5">
            <Wallet size={16} className="text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-white/40 font-bold">الرصيد الصافي</p>
              <p className="text-sm font-black text-white tabular-nums" dir="ltr">
                {telemetry.balance} SAR
              </p>
            </div>
          </div>
        </div>

        {/* شريط المبادرة الذكية الاستباقية (Proactive Autonomy Nudge) */}
        {telemetry.proactiveNudge && (
          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-emerald-300 flex items-center gap-1.5">
                <Zap size={13} /> {telemetry.proactiveNudge.title}
              </p>
              <p className="text-xs text-white/75 mt-0.5 leading-relaxed">
                {telemetry.proactiveNudge.desc}
              </p>
            </div>
            <button
              onClick={() => handleSend(telemetry.proactiveNudge.prompt)}
              disabled={isTyping}
              className="shrink-0 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-black text-black shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {telemetry.proactiveNudge.cta}
            </button>
          </div>
        )}

        {/* لوحة الأنماط المكتشفة (قابلة للطي) */}
        {showInsights && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-violet-300 flex items-center gap-1.5">
                <Brain size={14} /> الرادار الاستباقي والأنماط المكتشفة الآن
              </h3>
              <button
                onClick={() => setShowInsights(false)}
                className="text-white/40 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
            {telemetry.patterns.length === 0 ? (
              <p className="text-xs text-white/50">كل المؤشرات متوازنة حالياً.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {telemetry.patterns.map((p, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 text-xs text-white/85 leading-relaxed"
                  >
                    {p}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* لوحة إعدادات الوكيل والملف الشخصي (قابلة للطي) */}
        {showConfig && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                <SlidersHorizontal size={14} /> تخصيص الوكيل والذاكرة الشخصية
              </h3>
              <button
                onClick={() => setShowConfig(false)}
                className="text-white/40 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-white/50 mb-1 font-bold">
                  اسمك أو لقبك المفضل للوكيل
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="مثال: زياد / يا مهندس"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-white/50 mb-1 font-bold">
                  أولوياتك الكبرى (مفصولة بفاصلة)
                </label>
                <input
                  type="text"
                  value={profileFocus}
                  onChange={(e) => setProfileFocus(e.target.value)}
                  placeholder="مثال: صلاة الجماعة، تأسيس مشروعي، التفوق الجامعي"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-white/50 mb-1 font-bold">
                  نموذج الذكاء الاصطناعي (Claude Model)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={apiModel}
                  onChange={(e) => setApiModel(e.target.value)}
                  placeholder="claude-haiku-5-5"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-white/50 mb-1 font-bold">
                  مفتاح Anthropic API
                </label>
                <input
                  type="password"
                  dir="ltr"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-violet-500"
                />
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <Btn size="sm" onClick={handleSaveSettings}>
                حفظ الإعدادات
              </Btn>
            </div>
          </div>
        )}
      </Card>

      {/* 2. شريط البروتوكولات التنفيذية السريعة + اختيار الشخصية */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        {/* البروتوكولات التنفيذية */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {executiveProtocols.map((proto) => {
            const PIcon = proto.icon;
            return (
              <button
                key={proto.id}
                onClick={() => handleSend(proto.prompt)}
                disabled={isTyping}
                className="shrink-0 flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-extrabold transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                style={{
                  borderColor: `${proto.tint}45`,
                  background: `${proto.tint}14`,
                  color: proto.tint,
                }}
              >
                <PIcon size={14} />
                {proto.label}
              </button>
            );
          })}
          <button
            onClick={fillBrainDumpTemplate}
            disabled={isTyping}
            className="shrink-0 flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-white/80 hover:bg-white/10 transition-all"
          >
            <Zap size={14} className="text-amber-400" />
            تفريغ العقل (Brain-Dump)
          </button>
        </div>

        {/* اختيار الشخصية */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 custom-scrollbar">
          {AGENT_PERSONAS.map((p) => {
            const active = mode === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setMode(p.id)}
                title={p.desc}
                className="shrink-0 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all"
                style={{
                  backgroundColor: active ? `${p.color}22` : "rgba(255,255,255,0.03)",
                  color: active ? p.color : "rgba(255,255,255,0.5)",
                  borderColor: active ? `${p.color}60` : "transparent",
                }}
              >
                {p.icon} {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. منطقة المحادثة الرئيسية */}
      <Card className="flex-1 min-h-[460px] max-h-[65vh] overflow-hidden flex flex-col border border-white/10 bg-[#0a0a0f]/85 backdrop-blur-xl relative">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            const tools = Array.isArray(msg.tools) ? msg.tools : [];

            return (
              <div
                key={msg.id || idx}
                className={`flex gap-3.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* أيقونة المرسل */}
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-1 ${
                    isUser
                      ? "bg-white/10 text-white"
                      : "bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/30"
                  }`}
                >
                  {isUser ? <User size={16} /> : <Bot size={17} />}
                </div>

                {/* محتوى الرسالة + بطاقات الإجراءات */}
                <div
                  className={`flex flex-col max-w-[85%] ${
                    isUser ? "items-end" : "items-start"
                  }`}
                >
                  {!isUser && msg.isBriefing && (
                    <span className="text-[10.5px] text-amber-400/90 mb-1.5 flex items-center gap-1 font-bold">
                      <Sparkles size={11} /> إحاطة استباقية فورية (محلية بلا استهلاك توكنز)
                    </span>
                  )}

                  {isUser && msg.image && (
                    <img
                      src={msg.image}
                      alt="مرفق"
                      className="max-w-xs rounded-2xl mb-2 border border-white/20 max-h-48 object-cover"
                    />
                  )}

                  <div
                    className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? "bg-violet-600/25 border border-violet-500/30 text-white rounded-tl-sm"
                        : "bg-[#151522] border border-white/10 text-white/90 rounded-tr-sm shadow-lg"
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* بطاقات الأدوات المنفذة (Interactive Action Cards) + زر التراجع */}
                  {!isUser && tools.length > 0 && (
                    <div className="mt-2.5 w-full space-y-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {tools.map((t, tIdx) => (
                          <div
                            key={tIdx}
                            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11.5px] font-bold ${
                              t.ok !== false
                                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300"
                                : "bg-rose-500/10 border-rose-500/25 text-rose-300"
                            }`}
                          >
                            {t.ok !== false ? (
                              <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                            ) : (
                              <AlertCircle size={13} className="text-rose-400 shrink-0" />
                            )}
                            <span>{t.label || TOOL_LABELS[t.name] || t.name}</span>
                            {t.badge && (
                              <span className="rounded-md bg-black/40 px-1.5 py-0.5 text-[10px] text-white/90">
                                {t.badge}
                              </span>
                            )}
                          </div>
                        ))}

                        {msg.before && !msg.undone && (
                          <button
                            onClick={() => handleUndoTurn(msg.id, msg.before)}
                            className="inline-flex items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-bold text-amber-300 hover:bg-amber-500/20 transition-all"
                            title="التراجع عن كل التعديلات في هذه الرسالة"
                          >
                            <RotateCcw size={12} /> تراجع (Undo)
                          </button>
                        )}

                        {msg.undone && (
                          <span className="text-[11px] font-bold text-white/40 px-2">
                            ↩️ تم التراجع عن هذا الإجراء
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* أزرار الاقتراحات السريعة تحت الإحاطة */}
                  {!isUser && Array.isArray(msg.chips) && msg.chips.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {msg.chips.map((chip, cIdx) => (
                        <button
                          key={cIdx}
                          onClick={() => handleSend(chip)}
                          disabled={isTyping}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[11.5px] font-bold text-white/75 hover:bg-white/10 hover:text-white transition-all"
                        >
                          ⚡ {chip}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-3.5 flex-row">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-1 bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/30">
                <Bot size={17} />
              </div>
              <div className="flex items-center gap-2.5 rounded-2xl rounded-tr-sm bg-[#151522] border border-white/10 px-5 py-3.5 text-xs font-bold text-violet-300">
                <Loader2 size={15} className="animate-spin text-violet-400" />
                <span>
                  {activeStep
                    ? `جاري تنفيذ: ${activeStep}...`
                    : "العقل المدبر يحلل حالتك الآن..."}
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* معاينة الصورة المرفقة */}
        {imagePreview && (
          <div className="px-4 pt-2 flex items-center gap-3 border-t border-white/10 bg-black/40">
            <div className="relative h-14 w-14 rounded-xl overflow-hidden border border-white/20">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-full w-full object-cover"
              />
              <button
                onClick={() => {
                  setImagePreview(null);
                  setSelectedImage(null);
                }}
                className="absolute top-0.5 right-0.5 rounded-full bg-black/80 p-0.5 text-white"
              >
                <X size={11} />
              </button>
            </div>
            <p className="text-xs text-white/60">
              صورة جاهزة للتحليل البصري (فاتورة، جدول، أو مهام مكتوبة).
            </p>
          </div>
        )}

        {/* 4. منطقة الإدخال المتعدد (نص + صورة + صوت) */}
        <div className="p-3.5 sm:p-4 border-t border-white/10 bg-black/30 shrink-0">
          {/* كبسولات الأوامر السريعة الفورية فوق صندوق الكتابة */}
          <div className="mb-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {[
              {
                label: "⚡ هندس يومي بين الصلوات",
                prompt:
                  "خطّط يومي الآن: استخدم أداة auto_plan_day لتوزيع أهم مهامي على الفترات الذهبية بين الصلوات اليوم واعرض لي الجدول الزمني.",
              },
              {
                label: "🛡️ أنا مرهق.. فعّل وضع الطوارئ",
                prompt:
                  "أنا اليوم مرهق ومضغوط.. استخدم أداة trigger_emergency_mode لتفعيل وضع الطوارئ وأنقذ عاداتي الأساسية بالنسخة الخفيفة (complete_tiny_core: true).",
              },
              {
                label: "🗓️ ساعدني أخطط أسبوعي",
                prompt:
                  "ساعدني أخطط أسبوعي القادم: اسألني عن أبرز انتصار في الأسبوع الماضي، والعائق الأكبر، واقترح لي العادة المحورية وهدف 2030.",
              },
              {
                label: "🔍 فكك لي مهمة عالقة",
                prompt:
                  "ابحث في مهامي عن أكثر مهمة متراكمة ومؤجلة، وساعدني أفككها إلى خطوة أولى مدتها 5 دقائق بأداة breakdown_task.",
              },
              {
                label: "🎯 ما وضع أهداف 2030 اليوم؟",
                prompt:
                  "حلّل تقدمي في أهداف 2030 وما هي الخطوات العملية المجدولة اليوم التي تخدمها؟",
              },
              {
                label: "🌙 إقفال المساء وختم اليوم",
                prompt:
                  "ابدأ معي جلسة إقفال المساء: راجع العادات المتبقية، وسجل تأمل المساء في مرآة اليوم، وجهز مهام الغد.",
              },
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(chip.prompt)}
                disabled={isTyping}
                className="shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-bold text-white/70 hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-white transition-all disabled:opacity-40"
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="relative flex items-end gap-2 rounded-2xl bg-[#151522] p-2 ring-1 ring-white/10 focus-within:ring-violet-500/50 transition-all">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all"
              title="إرفاق صورة (فاتورة / جدول / ملاحظات)"
            >
              <Paperclip size={17} />
            </button>

            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all ${
                listening
                  ? "bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/50 animate-pulse"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
              title={listening ? "إيقاف التسجيل الصوتي" : "إملاء صوتي بالعربية"}
            >
              {listening ? <MicOff size={17} /> : <Mic size={17} />}
            </button>

            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب أمراً أو عدة أوامر معاً (مثال: صرفت 35 غداء، شربت كوبين ماء، أنجزت صلاة العصر، خطط يومي)..."
              className="w-full max-h-32 min-h-[42px] resize-none bg-transparent px-2 py-2.5 text-sm text-white placeholder-white/30 outline-none custom-scrollbar"
              rows={1}
            />

            <button
              type="button"
              onClick={() => handleSend(input)}
              disabled={(!input.trim() && !selectedImage) || isTyping}
              className="flex h-10 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-900/50 transition-all hover:bg-violet-500 active:scale-95 disabled:opacity-40"
            >
              <Send size={17} className={isTyping ? "animate-pulse" : ""} />
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between px-1 text-[10.5px] text-white/35">
            <span>
              💡 يدعم الأوامر المركبة (Multi-Tool) والصور وزر التراجع الفوري (Undo).
            </span>
            <span dir="ltr" className="hidden sm:inline font-mono">
              Ctrl + K للفتح السريع من أي شاشة
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
