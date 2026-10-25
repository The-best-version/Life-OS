// src/components/life-inbox.jsx
// ============================================================================
// 📥 صندوق الوارد المتكامل + بنك الأفكار + اليوميات المقفلة برمز سري
// الميزات الإضافية: إملاء صوتي، أسئلة تأمل ذكية، فلاش باك "في مثل هذا اليوم"، قفل تلقائي عند الخمول، نسخ احتياطي وتصدير
// ============================================================================

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Inbox,
  Plus,
  Trash2,
  Brain,
  Wallet,
  CheckSquare,
  Sparkles,
  Filter,
  CheckCircle2,
  Lightbulb,
  Loader2,
  Send,
  RefreshCw,
  Link2,
  Copy,
  Check,
  Smartphone,
  Lock,
  Unlock,
  BookOpen,
  Calendar,
  Smile,
  Heart,
  Zap,
  Coffee,
  Frown,
  Meh,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  Search,
  Tag,
  ArrowRight,
  Maximize2,
  Minimize2,
  Clock,
  Mic,
  MicOff,
  Download,
  Upload,
  History,
  HelpCircle,
  FileText,
} from "lucide-react";
import { Card, Badge, T } from "./life-shared.jsx";
import {
  rows,
  taskShape,
  expenseShape,
  MONEY_CAP,
  uid,
  dayKey,
} from "../state/life-state.mjs";
import { runLifeAgent } from "../utils/life-agent.js";

// مفاتيح التخزين المحلي المنفصلة والمنظمة
const OMNI_BRIDGE_CONFIG_KEY = "los_omni_telegram_bridge_v1";
const INBOX_ITEMS_KEY = "life_os_inbox_items";
const IDEAS_ITEMS_KEY = "life_os_incubator_ideas_v1";
const JOURNAL_ENTRIES_KEY = "life_os_private_journal_v1";
const JOURNAL_PIN_KEY = "life_os_journal_pin_hash_v1";

// تصنيف النص التلقائي
function classifyCapturedText(rawText) {
  const text = String(rawText || "").trim();
  if (/ريال|درهم|دولار|دفعت|صرفت|راتب|قهوة|غداء|عشاء|فاتورة|بنزين|مقاضي/.test(text)) {
    return "finance";
  }
  if (/اشتري|راجع|أنجز|اتصل|احجز|مهمة|كويز|اختبار|موعد|سلم|أرسل|ارسل/.test(text)) {
    return "task";
  }
  return "idea";
}

// استخراج المصروف والمبلغ من النص
function parseExpenseFromText(rawText) {
  const text = String(rawText || "").trim();
  const normalized = text.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
  const numMatch = normalized.match(/(\d+(?:\.\d+)?)/);
  const amount = numMatch ? Number(numMatch[1]) : 0;
  const cleanLabel =
    text
      .replace(/[٠-٩\d]+/g, "")
      .replace(/ريال|درهم|دولار|صرفت|دفعت|على|في/g, "")
      .trim() || text;
  return { amount, cleanLabel };
}

// دالة تشفير بسيطة للرمز السري
function hashPin(pin) {
  let h = 0;
  const s = `life_os_salt_${pin}`;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return String(h);
}

// قائمة الحالات المزاجية لليوميات
const MOOD_OPTIONS = [
  { id: "awesome", label: "ممتن ومبتهج", icon: Heart, tint: "#ec4899", emoji: "✨" },
  { id: "productive", label: "إنجاز وطاقة", icon: Zap, tint: "#eab308", emoji: "⚡" },
  { id: "calm", label: "هادئ ومسترخٍ", icon: Coffee, tint: "#10b981", emoji: "☕" },
  { id: "neutral", label: "يوم اعتيادي", icon: Meh, tint: "#64748b", emoji: "🌱" },
  { id: "tired", label: "مجهد أو مشتت", icon: Frown, tint: "#f43f5e", emoji: "🌧️" },
];

// أسئلة ومحفزات التدوين اليومي الذكية
const DAILY_PROMPTS = [
  "ما هو أفضل موقف أو شعور عشته خلال يومك اليوم؟",
  "ما هو القرار أو التصرف الصغير الذي اتخذته اليوم وتشعر بالفخر به؟",
  "لو عاد بك الوقت إلى صباح اليوم، ما الشيء الوحيد الذي كنت ستفعله بشكل مختلف؟",
  "ما هي الفكرة أو المشروع الذي تكرر في ذهنك اليوم ويستحق الاهتمام؟",
  "من هو الشخص الذي أثر فيك إيجاباً اليوم أو يستحق منك كلمة شكر؟",
  "ما هو العائق الأكبر الذي واجهته اليوم وكيف تعاملت معه بحكمة؟",
  "ما هي النعمة البسيطة غير الملحوظة التي لفتت انتباهك اليوم؟",
  "كيف تقيم حضورك الذهني وهدوءك الداخلي على مدار ساعات اليوم؟",
];

export function InboxModule({ state, setState }) {
  // تبويب الواجهة الرئيسي: inbox (الوارد) | ideas (بنك الأفكار) | journal (اليوميات الخاصة)
  const [activeTab, setActiveTab] = useState("inbox");

  // ==========================================
  // 1. حالة صندوق الوارد وجسر تيليجرام
  // ==========================================
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState("all");
  const [triaging, setTriaging] = useState(false);
  const [triageSummary, setTriageSummary] = useState(null);
  const [bridgeOpen, setBridgeOpen] = useState(false);
  const [bridgeBusy, setBridgeBusy] = useState(false);
  const [bridgeNotice, setBridgeNotice] = useState(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // حالة الإملاء الصوتي (Voice Recognition)
  const [isListeningInput, setIsListeningInput] = useState(false);
  const [isListeningJournal, setIsListeningJournal] = useState(false);
  const recognitionRef = useRef(null);

  const startVoiceInput = (targetField) => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("عذراً، متصفحك لا يدعم الإملاء الصوتي المباشر. يُفضل استخدام متصفح Chrome أو Edge.");
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ar-SA";
    recognition.continuous = false;
    recognition.interimResults = false;

    if (targetField === "inbox") {
      setIsListeningInput(true);
    } else {
      setIsListeningJournal(true);
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        if (targetField === "inbox") {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        } else {
          setJournalContent((prev) => (prev ? `${prev}\n${transcript}` : transcript));
        }
      }
    };

    recognition.onerror = () => {
      setIsListeningInput(false);
      setIsListeningJournal(false);
    };

    recognition.onend = () => {
      setIsListeningInput(false);
      setIsListeningJournal(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListeningInput(false);
    setIsListeningJournal(false);
  };

  const [bridgeConfig, setBridgeConfig] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(OMNI_BRIDGE_CONFIG_KEY) || "{}");
      return {
        botToken: saved.botToken || "",
        allowedChatId: saved.allowedChatId || "",
        autoPoll: saved.autoPoll !== false,
        autoExecute: Boolean(saved.autoExecute),
        lastUpdateId: Number(saved.lastUpdateId) || 0,
        lastSyncTime: saved.lastSyncTime || null,
        totalCaptured: Number(saved.totalCaptured) || 0,
      };
    } catch {
      return {
        botToken: "",
        allowedChatId: "",
        autoPoll: true,
        autoExecute: false,
        lastUpdateId: 0,
        lastSyncTime: null,
        totalCaptured: 0,
      };
    }
  });

  const updateBridgeConfig = useCallback((patch) => {
    setBridgeConfig((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(OMNI_BRIDGE_CONFIG_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const [inbox, setInbox] = useState(() => {
    try {
      const saved = localStorage.getItem(INBOX_ITEMS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(INBOX_ITEMS_KEY, JSON.stringify(inbox));
    } catch {}
  }, [inbox]);

  // استقبال ?capture= من الروابط السريعة
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      const capturedParam = url.searchParams.get("capture");
      if (capturedParam && capturedParam.trim()) {
        const cleanText = capturedParam.trim();
        const type = classifyCapturedText(cleanText);
        const newItem = {
          id: `webhook-${Date.now()}`,
          text: cleanText,
          type,
          source: "رابط سريع ⚡",
          createdAt: new Date().toISOString(),
        };
        setInbox((prev) => [newItem, ...prev]);
        url.searchParams.delete("capture");
        window.history.replaceState({}, "", url.toString());
        setBridgeNotice({
          ok: true,
          text: `⚡ تم التقاط "${cleanText}" فوراً عبر الرابط السريع!`,
        });
      }
    } catch {}
  }, []);

  // سحب رسائل تيليجرام
  const syncTelegramMessages = useCallback(
    async (silent = false) => {
      const token = (bridgeConfig.botToken || "").trim();
      if (!token) {
        if (!silent) {
          setBridgeNotice({
            ok: false,
            text: "أدخل رمز البوت (Telegram Bot Token) من @BotFather أولاً.",
          });
        }
        return;
      }

      if (!silent) setBridgeBusy(true);
      try {
        const offset = (Number(bridgeConfig.lastUpdateId) || 0) + 1;
        const apiUrl = `https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=0`;
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error(`Telegram HTTP ${res.status}`);
        const data = await res.json();
        if (!data.ok || !Array.isArray(data.result)) {
          throw new Error("استجابة غير صالحة من تيليجرام");
        }

        const updates = data.result;
        if (updates.length === 0) {
          const nowTime = new Date().toLocaleTimeString("ar-SA", {
            hour: "2-digit",
            minute: "2-digit",
          });
          updateBridgeConfig({ lastSyncTime: nowTime });
          if (!silent) {
            setBridgeNotice({
              ok: true,
              text: "البوت متصل بنجاح ✅ — لا توجد رسائل جديدة في الانتظار.",
            });
          }
          return;
        }

        let maxUpdateId = Number(bridgeConfig.lastUpdateId) || 0;
        const capturedItems = [];
        let autoExecutedCount = 0;

        for (const u of updates) {
          if (u.update_id > maxUpdateId) maxUpdateId = u.update_id;
          const msg = u.message || u.edited_message;
          if (!msg) continue;

          const chatIdStr = String(msg.chat?.id || "");
          if (
            bridgeConfig.allowedChatId.trim() &&
            chatIdStr !== bridgeConfig.allowedChatId.trim()
          ) {
            continue;
          }

          const rawText = (msg.text || msg.caption || "").trim();
          if (!rawText || rawText === "/start") {
            if (rawText === "/start" && chatIdStr) {
              fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  chat_id: chatIdStr,
                  text: `مرحباً بك في جسر أثر 2030 الذكي 🚀\nمعرّف المحادثة الخاص بك (Chat ID): ${chatIdStr}\nأرسل أي فكرة أو مهمة أو مصروف ليتم التقاطه فوراً!`,
                }),
              }).catch(() => {});
            }
            continue;
          }

          const detectedType = classifyCapturedText(rawText);

          if (bridgeConfig.autoExecute && detectedType === "finance") {
            const { amount, cleanLabel } = parseExpenseFromText(rawText);
            if (amount > 0) {
              const expRow = expenseShape({
                label: cleanLabel,
                amount,
                type: "need",
                date: dayKey(),
              });
              setState((s) => ({
                ...s,
                expenses: [expRow, ...rows(s.expenses)].slice(0, MONEY_CAP),
              }));
              autoExecutedCount++;
              fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  chat_id: chatIdStr,
                  text: `💸 تم تسجيل مصروف (${amount} ر.س — ${cleanLabel}) مباشرة في مالية أثر 2030!`,
                }),
              }).catch(() => {});
              continue;
            }
          }

          if (bridgeConfig.autoExecute && detectedType === "task") {
            const newTask = taskShape({
              id: uid(),
              text: rawText,
              done: false,
              today: true,
              quadrant: "q2",
            });
            setState((s) => ({
              ...s,
              tasks: [...rows(s.tasks), newTask],
            }));
            autoExecutedCount++;
            fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                chat_id: chatIdStr,
                text: `✅ تم إضافة المهمة إلى مهام اليوم: "${rawText}"`,
              }),
            }).catch(() => {});
            continue;
          }

          capturedItems.push({
            id: `tg-${u.update_id}`,
            text: rawText,
            type: detectedType,
            source: "تيليجرام ✈️",
            createdAt: new Date().toISOString(),
          });

          if (chatIdStr) {
            fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                chat_id: chatIdStr,
                text: `📥 تم التقاط العنصر بنجاح (${
                  detectedType === "finance"
                    ? "مصروف"
                    : detectedType === "task"
                      ? "مهمة"
                      : "فكرة"
                }) ✨`,
              }),
            }).catch(() => {});
          }
        }

        if (capturedItems.length > 0) {
          setInbox((prev) => [...capturedItems.reverse(), ...prev]);
        }

        const nowTime = new Date().toLocaleTimeString("ar-SA", {
          hour: "2-digit",
          minute: "2-digit",
        });
        updateBridgeConfig({
          lastUpdateId: maxUpdateId,
          lastSyncTime: nowTime,
          totalCaptured:
            (Number(bridgeConfig.totalCaptured) || 0) +
            capturedItems.length +
            autoExecutedCount,
        });

        if (!silent || capturedItems.length > 0 || autoExecutedCount > 0) {
          setBridgeNotice({
            ok: true,
            text: `✈️ تم سحب ${
              capturedItems.length + autoExecutedCount
            } رسالة من تيليجرام بنجاح!`,
          });
        }
      } catch (err) {
        if (!silent) {
          setBridgeNotice({
            ok: false,
            text: `تعذّر الاتصال ببوت تيليجرام (${err?.message || "تحقق من الرمز أو الإنترنت"}).`,
          });
        }
      } finally {
        if (!silent) setBridgeBusy(false);
      }
    },
    [bridgeConfig, setState, updateBridgeConfig]
  );

  useEffect(() => {
    if (!bridgeConfig.botToken.trim() || !bridgeConfig.autoPoll) return;
    syncTelegramMessages(true);
    const id = setInterval(() => {
      syncTelegramMessages(true);
    }, 20000);
    return () => clearInterval(id);
  }, [bridgeConfig.botToken, bridgeConfig.autoPoll, syncTelegramMessages]);

  const handleCapture = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input.trim();
    const suggestedType = classifyCapturedText(text);
    const newItem = {
      id: Date.now().toString(),
      text,
      type: suggestedType,
      source: "مباشر",
      createdAt: new Date().toISOString(),
    };
    setInbox([newItem, ...inbox]);
    setInput("");
    setFilter("all");
  };

  const handleDeleteInboxItem = (id) => {
    setInbox((prev) => prev.filter((item) => item.id !== id));
  };

  const dispatchToTask = (item) => {
    setState((s) => ({
      ...s,
      tasks: [
        ...rows(s.tasks),
        taskShape({
          id: uid(),
          text: item.text,
          done: false,
          today: false,
          quadrant: "q2",
        }),
      ],
    }));
    handleDeleteInboxItem(item.id);
  };

  const dispatchToFinance = (item) => {
    const { amount, cleanLabel } = parseExpenseFromText(item.text);
    if (amount <= 0) {
      dispatchToTask(item);
      return;
    }
    const expRow = expenseShape({
      label: cleanLabel,
      amount,
      type: "need",
      date: dayKey(),
    });
    setState((s) => ({
      ...s,
      expenses: [expRow, ...rows(s.expenses)].slice(0, MONEY_CAP),
    }));
    handleDeleteInboxItem(item.id);
  };

  // تحويل من الوارد إلى بنك الأفكار
  const dispatchToIdeaBank = (item) => {
    const newIdea = {
      id: uid(),
      title: item.text,
      description: "",
      stage: "seed",
      tags: [],
      createdAt: new Date().toISOString(),
    };
    setIdeas((prev) => [newIdea, ...prev]);
    handleDeleteInboxItem(item.id);
    setActiveTab("ideas");
  };

  const handleSmartTriage = async () => {
    if (!inbox.length || triaging) return;
    setTriaging(true);
    setTriageSummary(null);

    try {
      const itemsList = inbox
        .map((item, idx) => `${idx + 1}. [${item.type}] ${item.text}`)
        .join("\n");

      const prompt = `قم بفرز وتفريغ عناصر صندوق الوارد التالية باستخدام الأدوات المناسبة لكل عنصر (المهام بأداة add_task، المصاريف بأداة log_expense، المواعيد بأداة schedule_time_block، العادات بأداة complete_habit):\n${itemsList}`;

      const reply = await runLifeAgent(prompt, [], state, setState, {
        mode: "executive",
      });

      if (!reply?.error) {
        setInbox([]);
        setTriageSummary({
          text: reply?.text || "تم فرز جميع عناصر صندوق الوارد بنجاح!",
          count: reply?.toolCalls?.length || inbox.length,
        });
      } else {
        setTriageSummary({
          text: reply.text,
          error: true,
        });
      }
    } catch (err) {
      setTriageSummary({
        text: `⚠️ تعذر الفرز الذكي: ${err?.message || ""}`,
        error: true,
      });
    } finally {
      setTriaging(false);
    }
  };

  const filteredInbox = useMemo(() => {
    if (filter === "all") return inbox;
    return inbox.filter((item) => item.type === filter);
  }, [inbox, filter]);

  const stats = useMemo(() => {
    return {
      total: inbox.length,
      tasks: inbox.filter((i) => i.type === "task").length,
      finance: inbox.filter((i) => i.type === "finance").length,
      ideas: inbox.filter((i) => i.type === "idea").length,
    };
  }, [inbox]);

  const quickWebhookUrl = useMemo(() => {
    if (typeof window === "undefined") return "http://127.0.0.1:47615/?capture=النص_هنا";
    const base = window.location.origin + window.location.pathname;
    return `${base}?capture=صرفت_45_قهوة`;
  }, []);

  const handleCopyWebhook = () => {
    try {
      navigator.clipboard.writeText(quickWebhookUrl);
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2500);
    } catch {}
  };

  // ==========================================
  // 2. حالة بنك الأفكار وتطويرها (Idea Incubator)
  // ==========================================
  const [ideas, setIdeas] = useState(() => {
    try {
      const saved = localStorage.getItem(IDEAS_ITEMS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(IDEAS_ITEMS_KEY, JSON.stringify(ideas));
    } catch {}
  }, [ideas]);

  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaDesc, setIdeaDesc] = useState("");
  const [ideaStage, setIdeaStage] = useState("seed");
  const [ideaTagInput, setIdeaTagInput] = useState("");
  const [editingIdeaId, setEditingIdeaId] = useState(null);
  const [ideasFilterStage, setIdeasFilterStage] = useState("all");
  const [ideasSearch, setIdeasSearch] = useState("");

  const handleSaveIdea = (e) => {
    e.preventDefault();
    if (!ideaTitle.trim()) return;

    const tagsArray = ideaTagInput
      .split(/[,،\s]+/)
      .map((t) => t.replace(/^#/, "").trim())
      .filter(Boolean);

    if (editingIdeaId) {
      setIdeas((prev) =>
        prev.map((i) =>
          i.id === editingIdeaId
            ? {
                ...i,
                title: ideaTitle.trim(),
                description: ideaDesc.trim(),
                stage: ideaStage,
                tags: tagsArray.length ? tagsArray : i.tags,
                updatedAt: new Date().toISOString(),
              }
            : i
        )
      );
      setEditingIdeaId(null);
    } else {
      const newIdea = {
        id: uid(),
        title: ideaTitle.trim(),
        description: ideaDesc.trim(),
        stage: ideaStage,
        tags: tagsArray,
        createdAt: new Date().toISOString(),
      };
      setIdeas([newIdea, ...ideas]);
    }

    setIdeaTitle("");
    setIdeaDesc("");
    setIdeaStage("seed");
    setIdeaTagInput("");
  };

  const handleEditIdea = (idea) => {
    setEditingIdeaId(idea.id);
    setIdeaTitle(idea.title);
    setIdeaDesc(idea.description || "");
    setIdeaStage(idea.stage || "seed");
    setIdeaTagInput(idea.tags ? idea.tags.join(" ") : "");
  };

  const handleDeleteIdea = (id) => {
    setIdeas((prev) => prev.filter((i) => i.id !== id));
    if (editingIdeaId === id) {
      setEditingIdeaId(null);
      setIdeaTitle("");
      setIdeaDesc("");
    }
  };

  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      const matchesStage = ideasFilterStage === "all" || idea.stage === ideasFilterStage;
      const q = ideasSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        idea.title.toLowerCase().includes(q) ||
        (idea.description && idea.description.toLowerCase().includes(q)) ||
        (idea.tags && idea.tags.some((t) => t.toLowerCase().includes(q)));
      return matchesStage && matchesSearch;
    });
  }, [ideas, ideasFilterStage, ideasSearch]);

  // ==========================================
  // 3. حالة قسم اليوميات والخصوصية برمز PIN
  // ==========================================
  const [storedPinHash, setStoredPinHash] = useState(() => {
    try {
      return localStorage.getItem(JOURNAL_PIN_KEY) || "";
    } catch {
      return "";
    }
  });

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPinChangeModal, setShowPinChangeModal] = useState(false);

  // مؤقت القفل التلقائي عند الخمول (Inactivity Auto-Lock)
  const inactivityTimerRef = useRef(null);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (isUnlocked && storedPinHash) {
      // قفل تلقائي بعد دقيقتين من عدم النشاط
      inactivityTimerRef.current = setTimeout(() => {
        setIsUnlocked(false);
        setPinInput("");
      }, 120000);
    }
  }, [isUnlocked, storedPinHash]);

  useEffect(() => {
    if (!isUnlocked) return;
    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((ev) => window.addEventListener(ev, resetInactivityTimer));
    resetInactivityTimer();

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, resetInactivityTimer));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [isUnlocked, resetInactivityTimer]);

  const [journals, setJournals] = useState(() => {
    try {
      const saved = localStorage.getItem(JOURNAL_ENTRIES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(JOURNAL_ENTRIES_KEY, JSON.stringify(journals));
    } catch {}
  }, [journals]);

  const todayDateStr = dayKey();
  const [currentJournalDate, setCurrentJournalDate] = useState(todayDateStr);
  const [journalContent, setJournalContent] = useState("");
  const [journalMood, setJournalMood] = useState("awesome");
  const [journalGratitude, setJournalGratitude] = useState("");
  const [zenMode, setZenMode] = useState(false);
  const [journalSaveNotice, setJournalSaveNotice] = useState(false);

  // تحميل تدوينة تاريخ محدد
  useEffect(() => {
    const entry = journals.find((j) => j.date === currentJournalDate);
    if (entry) {
      setJournalContent(entry.content || "");
      setJournalMood(entry.mood || "awesome");
      setJournalGratitude(entry.gratitude || "");
    } else {
      setJournalContent("");
      setJournalMood("awesome");
      setJournalGratitude("");
    }
  }, [currentJournalDate, journals]);

  // سؤال اليوم التأملي
  const dailyPromptQuestion = useMemo(() => {
    const dateNum = currentJournalDate
      .split("-")
      .reduce((acc, part) => acc + Number(part || 0), 0);
    return DAILY_PROMPTS[dateNum % DAILY_PROMPTS.length];
  }, [currentJournalDate]);

  const insertPromptToContent = () => {
    const promptText = `💡 سؤال تأملي: ${dailyPromptQuestion}\nالإجابة: `;
    setJournalContent((prev) => (prev ? `${prev}\n\n${promptText}` : promptText));
  };

  // ذكريات "في مثل هذا اليوم" (On This Day / Flashback)
  const memoryFlashback = useMemo(() => {
    if (!currentJournalDate) return null;
    const [y, m, d] = currentJournalDate.split("-");
    // البحث عن تدوينة تحمل نفس اليوم والشهر ولكن بسنة سابقة، أو قبل 30 يوماً
    const pastEntry = journals.find(
      (j) => j.date !== currentJournalDate && j.date.endsWith(`-${m}-${d}`)
    );
    return pastEntry || null;
  }, [currentJournalDate, journals]);

  const handleUnlockJournal = (e) => {
    e.preventDefault();
    if (!storedPinHash) {
      setIsUnlocked(true);
      return;
    }
    if (hashPin(pinInput) === storedPinHash) {
      setIsUnlocked(true);
      setPinError("");
      setPinInput("");
    } else {
      setPinError("رمز المرور غير صحيح. حاول مجدداً.");
      setPinInput("");
    }
  };

  const handleCreateOrChangePin = (e) => {
    e.preventDefault();
    if (newPin.length < 4) {
      setPinError("يجب أن يتكون الرمز من 4 أرقام على الأقل.");
      return;
    }
    if (newPin !== confirmPin) {
      setPinError("الرمزان غير متطابقين.");
      return;
    }
    const h = hashPin(newPin);
    try {
      localStorage.setItem(JOURNAL_PIN_KEY, h);
    } catch {}
    setStoredPinHash(h);
    setIsUnlocked(true);
    setShowPinChangeModal(false);
    setNewPin("");
    setConfirmPin("");
    setPinError("");
  };

  const handleSaveJournal = () => {
    if (!journalContent.trim() && !journalGratitude.trim()) return;

    const existingIndex = journals.findIndex((j) => j.date === currentJournalDate);
    const updatedEntry = {
      id: existingIndex >= 0 ? journals[existingIndex].id : uid(),
      date: currentJournalDate,
      content: journalContent.trim(),
      gratitude: journalGratitude.trim(),
      mood: journalMood,
      updatedAt: new Date().toISOString(),
    };

    let nextJournals;
    if (existingIndex >= 0) {
      nextJournals = journals.map((j, i) => (i === existingIndex ? updatedEntry : j));
    } else {
      nextJournals = [updatedEntry, ...journals];
    }

    setJournals(nextJournals);
    setJournalSaveNotice(true);
    setTimeout(() => setJournalSaveNotice(false), 2500);
  };

  const handleDeleteJournal = (dateToDelete) => {
    if (confirm("هل أنت متأكد من حذف تدوينة هذا اليوم نهائياً؟")) {
      setJournals((prev) => prev.filter((j) => j.date !== dateToDelete));
      if (currentJournalDate === dateToDelete) {
        setJournalContent("");
        setJournalGratitude("");
      }
    }
  };

  const handleLockJournal = () => {
    setIsUnlocked(false);
    setPinInput("");
    setZenMode(false);
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
  };

  // تصدير نسخة احتياطية من اليوميات والأفكار كملف JSON
  const handleExportData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      journals,
      ideas,
      inbox,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `life-os-journal-backup-${dayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto" dir="rtl">
      {/* 🚀 الرأس العام وشريط التبويبات الثلاثية */}
      <div className="relative overflow-hidden rounded-3xl bg-white/[0.02] p-6 sm:p-8 border border-white/10 backdrop-blur-xl">
        <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-rose-500/10 blur-[90px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-violet-500/10 blur-[90px] pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/20 to-violet-500/20 text-rose-300 border border-white/15 shadow-[0_0_20px_rgba(244,63,94,0.25)]">
                {activeTab === "inbox" ? (
                  <Inbox size={22} />
                ) : activeTab === "ideas" ? (
                  <Lightbulb size={22} className="text-amber-300" />
                ) : (
                  <BookOpen size={22} className="text-violet-300" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {activeTab === "inbox"
                    ? "صندوق الوارد الذكي"
                    : activeTab === "ideas"
                      ? "بنك الأفكار والمشاريع"
                      : "اليوميات الخاصة 🔒"}
                </h2>
                <p className="text-xs text-white/50 mt-0.5">
                  {activeTab === "inbox"
                    ? "التقاط فائق للخواطر والمهام والمصاريف مع ميزة الإملاء الصوتي"
                    : activeTab === "ideas"
                      ? "تطوير أفكارك ونقلها من بذرة أولى إلى خطط تنفيذية"
                      : "مساحة تدوين هادئة ومحمية برمز سري لخصوصيتك التامة"}
                </p>
              </div>
            </div>
          </div>

          {/* أزرار التبويبات الرئيسية الثلاثة */}
          <div className="flex items-center p-1.5 rounded-2xl bg-black/40 border border-white/10">
            <button
              onClick={() => setActiveTab("inbox")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === "inbox"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm"
                  : "text-white/50 hover:text-white"
              }`}
            >
              <Inbox size={15} />
              <span>الوارد</span>
              {inbox.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white">
                  {inbox.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("ideas")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === "ideas"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                  : "text-white/50 hover:text-white"
              }`}
            >
              <Lightbulb size={15} />
              <span>الأفكار</span>
              {ideas.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/40 text-[10px] font-black text-amber-200">
                  {ideas.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("journal")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === "journal"
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-sm"
                  : "text-white/50 hover:text-white"
              }`}
            >
              <Lock size={15} />
              <span>اليوميات</span>
              {isUnlocked && (
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📥 التبويب 1: صندوق الوارد الذكي (Inbox)                                 */}
      {/* ========================================================================= */}
      {activeTab === "inbox" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setBridgeOpen((v) => !v)}
              className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-extrabold transition-all ${
                bridgeOpen || bridgeConfig.botToken.trim()
                  ? "border-sky-500/40 bg-sky-500/15 text-sky-300"
                  : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10"
              }`}
            >
              <Send size={15} />
              جسر تيليجرام والاختصارات ⚡
              {bridgeConfig.botToken.trim() && (
                <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
              )}
            </button>

            {inbox.length > 0 && (
              <button
                onClick={handleSmartTriage}
                disabled={triaging}
                className="flex items-center gap-2 rounded-2xl border border-violet-500/40 bg-violet-600/20 px-4 py-2.5 text-xs font-extrabold text-violet-300 hover:bg-violet-600/30 transition-all shadow-lg disabled:opacity-50"
              >
                {triaging ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                {triaging ? "جاري الفرز بالوكيل..." : "فرز ذكي بالوكيل ✨"}
              </button>
            )}
          </div>

          {/* لوحة إعداد جسر تيليجرام */}
          {bridgeOpen && (
            <Card
              className="p-5 sm:p-6 border space-y-4"
              style={{
                borderColor: `${T.sky}45`,
                background:
                  "linear-gradient(135deg, rgba(14,165,233,0.09) 0%, rgba(15,23,42,0.75) 100%)",
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border"
                    style={{
                      borderColor: `${T.sky}55`,
                      background: `${T.sky}20`,
                      color: T.sky,
                    }}
                  >
                    <Smartphone size={20} />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] font-black text-white">
                        مساعد الالتقاط الفائق (تيليجرام + اختصارات الجوال)
                      </h3>
                      <Badge tint={T.sky}>Omni-Capture</Badge>
                    </div>
                    <p className="text-[11.5px] text-white/55 mt-0.5">
                      أرسل رسالة لبوتك في تيليجرام وأنت في الخارج (مثل: «صرفت 35 قهوة» أو «مهمة: مراجعة العقد») لتنزل فوراً
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => syncTelegramMessages(false)}
                  disabled={bridgeBusy}
                  className="flex items-center gap-1.5 rounded-xl border border-sky-400/40 bg-sky-500/20 px-3.5 py-2 text-[12px] font-extrabold text-sky-200 hover:bg-sky-500/30 transition-all"
                >
                  <RefreshCw size={14} className={bridgeBusy ? "animate-spin" : ""} />
                  سحب رسائل تيليجرام الآن
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-white/70">
                    رمز بوت تيليجرام (Bot Token من @BotFather)
                  </label>
                  <input
                    dir="ltr"
                    type="password"
                    value={bridgeConfig.botToken}
                    onChange={(e) => updateBridgeConfig({ botToken: e.target.value })}
                    placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 font-mono text-[12px] text-white outline-none focus:border-sky-400"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold text-white/70">
                    معرّف المحادثة المسموح (Chat ID اختياري للأمان)
                  </label>
                  <input
                    dir="ltr"
                    type="text"
                    value={bridgeConfig.allowedChatId}
                    onChange={(e) => updateBridgeConfig({ allowedChatId: e.target.value })}
                    placeholder="اتركه فارغاً أو أرسل /start للبوت لمعرفته"
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 font-mono text-[12px] text-white outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                <label className="flex cursor-pointer items-center gap-2 text-[12px] font-bold text-white/85">
                  <input
                    type="checkbox"
                    checked={bridgeConfig.autoPoll}
                    onChange={(e) => updateBridgeConfig({ autoPoll: e.target.checked })}
                    className="h-4 w-4 accent-sky-400"
                  />
                  <span>مزامنة تلقائية بالخلفية كل 20 ثانية</span>
                </label>

                <label className="flex cursor-pointer items-center gap-2 text-[12px] font-bold text-emerald-300">
                  <input
                    type="checkbox"
                    checked={bridgeConfig.autoExecute}
                    onChange={(e) => updateBridgeConfig({ autoExecute: e.target.checked })}
                    className="h-4 w-4 accent-emerald-400"
                  />
                  <span>تنفيذ فوري للمهام والمصاريف مباشرة بدون انتظار</span>
                </label>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/35 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <span className="flex items-center gap-1.5 text-[11.5px] font-extrabold text-white/80">
                    <Link2 size={14} style={{ color: T.accent }} /> رابط الإدخال السريع (Apple Shortcuts / Action Button)
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyWebhook}
                    className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10.5px] font-bold text-white/80 hover:bg-white/10"
                  >
                    {copiedWebhook ? <Check size={12} /> : <Copy size={12} />}
                    {copiedWebhook ? "تم النسخ!" : "نسخ الرابط"}
                  </button>
                </div>
                <p
                  dir="ltr"
                  className="truncate rounded-lg bg-black/50 px-3 py-1.5 font-mono text-[11px] text-sky-300/90"
                >
                  {quickWebhookUrl}
                </p>
              </div>

              {bridgeNotice && (
                <div
                  className={`rounded-xl border px-3.5 py-2 text-[12px] font-bold ${
                    bridgeNotice.ok
                      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                      : "border-rose-500/40 bg-rose-500/15 text-rose-300"
                  }`}
                >
                  {bridgeNotice.text}
                </div>
              )}
            </Card>
          )}

          {/* نتيجة الفرز الذكي */}
          {triageSummary && (
            <Card
              className={`p-4 border ${
                triageSummary.error
                  ? "border-rose-500/30 bg-rose-500/10"
                  : "border-emerald-500/30 bg-emerald-500/10"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-xs leading-relaxed text-white/90 whitespace-pre-wrap">
                  <p className="font-extrabold text-emerald-300 mb-1">
                    ✨ تقرير الفرز الذكي ({triageSummary.count || 0} إجراءات):
                  </p>
                  {triageSummary.text}
                </div>
                <button
                  onClick={() => setTriageSummary(null)}
                  className="text-xs text-white/40 hover:text-white"
                >
                  إغلاق
                </button>
              </div>
            </Card>
          )}

          {/* حقل الإدخال السريع مع الإملاء الصوتي 🎙️ */}
          <Card className="p-1.5 border border-white/10 shadow-2xl bg-[#0a0a0f]/80 backdrop-blur-xl">
            <form onSubmit={handleCapture} className="relative flex items-center group">
              <div className="absolute right-4 text-white/20 group-focus-within:text-rose-400 transition-colors">
                <Sparkles size={20} />
              </div>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  isListeningInput
                    ? "جاري الاستماع لصوتك الآن... تحدث براحة 🎙️"
                    : "اكتب أو أملِ بصوتك فكرة، مهمة، أو مصروف... (اضغط Enter)"
                }
                className="w-full rounded-2xl bg-transparent pr-12 pl-24 py-4 text-white placeholder-white/25 outline-none text-base font-medium"
                autoFocus
              />

              <div className="absolute left-2 flex items-center gap-1.5">
                {/* زر الميكروفون */}
                <button
                  type="button"
                  onClick={isListeningInput ? stopVoiceInput : () => startVoiceInput("inbox")}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                    isListeningInput
                      ? "bg-rose-500 text-white animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.6)]"
                      : "bg-white/5 text-white/50 hover:text-white hover:bg-white/10"
                  }`}
                  title={isListeningInput ? "إيقاف الاستماع" : "إملاء صوتي مباشر"}
                >
                  {isListeningInput ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                {/* زر الإضافة */}
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white hover:bg-rose-500 transition-all disabled:opacity-50 disabled:scale-95 shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                >
                  <Plus size={20} strokeWidth={3} />
                </button>
              </div>
            </form>
          </Card>

          {/* شريط الفلترة والأعداد */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
            <button
              onClick={() => setFilter("all")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filter === "all"
                  ? "bg-white/10 text-white ring-1 ring-white/20"
                  : "text-white/40 hover:text-white/80 hover:bg-white/5"
              }`}
            >
              <Filter size={14} /> الكل ({stats.total})
            </button>
            <button
              onClick={() => setFilter("task")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filter === "task"
                  ? "bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30"
                  : "text-white/40 hover:text-white/80 hover:bg-white/5"
              }`}
            >
              <CheckSquare size={14} /> مهام ({stats.tasks})
            </button>
            <button
              onClick={() => setFilter("finance")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filter === "finance"
                  ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30"
                  : "text-white/40 hover:text-white/80 hover:bg-white/5"
              }`}
            >
              <Wallet size={14} /> مالية ({stats.finance})
            </button>
            <button
              onClick={() => setFilter("idea")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filter === "idea"
                  ? "bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/30"
                  : "text-white/40 hover:text-white/80 hover:bg-white/5"
              }`}
            >
              <Lightbulb size={14} /> أفكار ({stats.ideas})
            </button>
          </div>

          {/* عناصر صندوق الوارد */}
          <div className="space-y-3">
            {filteredInbox.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center rounded-3xl border border-dashed border-white/10 bg-white/[0.01]">
                <div className="relative mb-5">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 size={32} className="text-emerald-400" />
                  </div>
                </div>
                <h3 className="text-lg font-black text-white mb-1.5">
                  عقلك صافٍ تماماً 🌿
                </h3>
                <p className="text-xs text-white/40 max-w-sm leading-relaxed">
                  لا توجد خواطر عالقة في صندوق الوارد. يمكنك تدوين أفكار جديدة بالأعلى أو استعراض بنك الأفكار واليوميات.
                </p>
              </div>
            ) : (
              filteredInbox.map((item) => {
                const isTask = item.type === "task";
                const isFinance = item.type === "finance";
                const Icon = isTask ? CheckSquare : isFinance ? Wallet : Lightbulb;
                const tintColor = isTask
                  ? T.sky
                  : isFinance
                    ? T.primary
                    : T.violet;

                return (
                  <Card
                    key={item.id}
                    className="group relative overflow-hidden p-4 sm:p-5 border border-white/5 hover:border-white/15 transition-all duration-300"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                          style={{
                            backgroundColor: `${tintColor}18`,
                            color: tintColor,
                          }}
                        >
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[14px] font-bold text-white/90 leading-relaxed break-words">
                              {item.text}
                            </p>
                            {item.source && item.source !== "مباشر" && (
                              <span className="rounded-md bg-sky-500/15 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                                {item.source}
                              </span>
                            )}
                          </div>
                          <p
                            className="text-[10px] text-white/30 mt-1 font-mono"
                            dir="ltr"
                          >
                            {new Date(item.createdAt).toLocaleTimeString("ar-EG", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0 sm:opacity-90 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => dispatchToTask(item)}
                          className="flex items-center gap-1.5 rounded-xl bg-blue-500/10 px-3 py-1.5 text-[11px] font-bold text-blue-400 hover:bg-blue-500/20 transition-all active:scale-95"
                          title="تحويل إلى مهمة في مصفوفة المهام"
                        >
                          <CheckSquare size={13} /> إلى المهام
                        </button>

                        <button
                          onClick={() => dispatchToFinance(item)}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-95"
                          title="تسجيل كمصروف في المالية"
                        >
                          <Wallet size={13} /> إلى المالية
                        </button>

                        <button
                          onClick={() => dispatchToIdeaBank(item)}
                          className="flex items-center gap-1.5 rounded-xl bg-amber-500/10 px-3 py-1.5 text-[11px] font-bold text-amber-400 hover:bg-amber-500/20 transition-all active:scale-95"
                          title="نقل وتطوير في بنك الأفكار"
                        >
                          <Lightbulb size={13} /> لبنك الأفكار
                        </button>

                        <div className="h-5 w-px bg-white/10 mx-1 hidden sm:block" />

                        <button
                          onClick={() => handleDeleteInboxItem(item.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-xl text-white/20 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="حذف نهائي"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 💡 التبويب 2: بنك الأفكار والمشاريع (Ideas Incubator)                     */}
      {/* ========================================================================= */}
      {activeTab === "ideas" && (
        <div className="space-y-6">
          <Card className="p-5 sm:p-6 border border-white/10 bg-white/[0.02]">
            <form onSubmit={handleSaveIdea} className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-300 flex items-center gap-2">
                  <Sparkles size={14} />
                  {editingIdeaId ? "تعديل الفكرة" : "إضافة فكرة أو مشروع جديد"}
                </span>
                {editingIdeaId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingIdeaId(null);
                      setIdeaTitle("");
                      setIdeaDesc("");
                      setIdeaTagInput("");
                    }}
                    className="text-[11px] text-white/40 hover:text-white"
                  >
                    إلغاء التعديل
                  </button>
                )}
              </div>

              <input
                type="text"
                value={ideaTitle}
                onChange={(e) => setIdeaTitle(e.target.value)}
                placeholder="عنوان الفكرة أو المشروع (مثال: تطبيق ذكي للقهوة المختصة)..."
                className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-amber-400/50"
              />

              <textarea
                value={ideaDesc}
                onChange={(e) => setIdeaDesc(e.target.value)}
                placeholder="تفاصيل الفكرة، لماذا هي مهمة، وكيف يمكن تنفيذها؟..."
                rows={3}
                className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-xs text-white placeholder-white/30 outline-none focus:border-amber-400/50 resize-y"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-white/60 mb-1">
                    مرحلة الفكرة
                  </label>
                  <select
                    value={ideaStage}
                    onChange={(e) => setIdeaStage(e.target.value)}
                    className="w-full rounded-xl bg-black/50 border border-white/15 px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                  >
                    <option value="seed">🌱 بذرة فكرة (تحت التفكير)</option>
                    <option value="exploring">🔍 قيد البحث والاستكشاف</option>
                    <option value="ready">🚀 جاهزة للتنفيذ كمشروع</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-white/60 mb-1">
                    الوسوم والتصنيفات (افصل بمسافة أو فاصلة)
                  </label>
                  <input
                    type="text"
                    value={ideaTagInput}
                    onChange={(e) => setIdeaTagInput(e.target.value)}
                    placeholder="تقنية، عمل، ابتكار..."
                    className="w-full rounded-xl bg-black/50 border border-white/15 px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={!ideaTitle.trim()}
                  className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-xs font-black text-slate-950 transition-all disabled:opacity-50"
                >
                  <Plus size={16} />
                  {editingIdeaId ? "حفظ التعديلات" : "حفظ في بنك الأفكار"}
                </button>
              </div>
            </form>
          </Card>

          {/* فلترة وبحث الأفكار */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute right-3.5 top-3 text-white/30" />
              <input
                type="text"
                value={ideasSearch}
                onChange={(e) => setIdeasSearch(e.target.value)}
                placeholder="بحث في الأفكار والوسوم..."
                className="w-full rounded-xl bg-white/5 border border-white/10 pr-10 pl-4 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-amber-400/40"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setIdeasFilterStage("all")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                  ideasFilterStage === "all"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "text-white/40 hover:text-white"
                }`}
              >
                الكل ({ideas.length})
              </button>
              <button
                onClick={() => setIdeasFilterStage("seed")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                  ideasFilterStage === "seed"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "text-white/40 hover:text-white"
                }`}
              >
                🌱 بذرة ({ideas.filter((i) => i.stage === "seed").length})
              </button>
              <button
                onClick={() => setIdeasFilterStage("exploring")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                  ideasFilterStage === "exploring"
                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                    : "text-white/40 hover:text-white"
                }`}
              >
                🔍 قيد البحث ({ideas.filter((i) => i.stage === "exploring").length})
              </button>
              <button
                onClick={() => setIdeasFilterStage("ready")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                  ideasFilterStage === "ready"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : "text-white/40 hover:text-white"
                }`}
              >
                🚀 جاهزة ({ideas.filter((i) => i.stage === "ready").length})
              </button>
            </div>
          </div>

          {/* قائمة كروت الأفكار */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredIdeas.length === 0 ? (
              <div className="col-span-full py-16 text-center rounded-3xl border border-dashed border-white/10 bg-white/[0.01]">
                <Lightbulb size={36} className="mx-auto text-amber-400/40 mb-3" />
                <p className="text-sm font-bold text-white/70">لا توجد أفكار مسجلة هنا حتى الآن</p>
                <p className="text-xs text-white/40 mt-1">
                  اكتب فكرتك في النموذج بالأعلى لتنميها وتتابع نضجها.
                </p>
              </div>
            ) : (
              filteredIdeas.map((idea) => {
                const stageBadge =
                  idea.stage === "ready"
                    ? { text: "🚀 جاهزة للتنفيذ", tint: T.rose }
                    : idea.stage === "exploring"
                      ? { text: "🔍 قيد البحث", tint: T.sky }
                      : { text: "🌱 بذرة فكرة", tint: T.primary };

                return (
                  <Card
                    key={idea.id}
                    className="p-5 border border-white/10 hover:border-amber-400/30 transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <Badge tint={stageBadge.tint}>{stageBadge.text}</Badge>
                        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditIdea(idea)}
                            className="p-1.5 text-white/40 hover:text-amber-300 transition-colors"
                            title="تعديل"
                          >
                            <Lightbulb size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteIdea(idea.id)}
                            className="p-1.5 text-white/40 hover:text-rose-400 transition-colors"
                            title="حذف"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-sm font-black text-white leading-snug mb-1.5">
                        {idea.title}
                      </h4>

                      {idea.description && (
                        <p className="text-xs text-white/60 leading-relaxed whitespace-pre-wrap">
                          {idea.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {idea.tags &&
                          idea.tags.map((tg, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-bold text-white/40 bg-white/5 px-2 py-0.5 rounded-md"
                            >
                              #{tg}
                            </span>
                          ))}
                      </div>

                      <button
                        onClick={() => {
                          setState((s) => ({
                            ...s,
                            tasks: [
                              ...rows(s.tasks),
                              taskShape({
                                id: uid(),
                                text: `بدء تنفيذ فكرة: ${idea.title}`,
                                done: false,
                                today: true,
                                quadrant: "q2",
                              }),
                            ],
                          }));
                          alert("تم تحويل الفكرة إلى مهمة نشطة في مهام اليوم بنجاح! 🚀");
                        }}
                        className="text-[11px] font-bold text-amber-300/80 hover:text-amber-300 flex items-center gap-1 transition-colors"
                      >
                        تحويل لمهمة عمل <ArrowRight size={12} />
                      </button>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔒 التبويب 3: قسم اليوميات والتدوين المقفل برمز سري                       */}
      {/* ========================================================================= */}
      {activeTab === "journal" && (
        <div>
          {!isUnlocked ? (
            /* شاشة القفل برمز PIN */
            <Card className="max-w-md mx-auto p-8 border border-white/10 bg-black/40 text-center space-y-6 shadow-2xl backdrop-blur-2xl my-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-600/20 text-violet-300 border border-violet-500/30 mx-auto shadow-[0_0_25px_rgba(139,92,246,0.3)]">
                <Lock size={28} />
              </div>

              <div>
                <h3 className="text-xl font-black text-white">اليوميات الخاصة مقفلة</h3>
                <p className="text-xs text-white/50 mt-1 leading-relaxed">
                  {storedPinHash
                    ? "أدخل رمز المرور السري للوصول إلى خواطرك ويومياتك"
                    : "لم يتم تعيين رمز مرور بعد. يمكنك الدخول أو تعيين رمز حماية الآن."}
                </p>
              </div>

              {storedPinHash ? (
                <form onSubmit={handleUnlockJournal} className="space-y-4">
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoFocus
                    maxLength={8}
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      setPinError("");
                    }}
                    placeholder="••••"
                    className="w-40 mx-auto text-center tracking-[0.5em] text-2xl font-black rounded-2xl bg-white/5 border border-white/20 py-3 text-white outline-none focus:border-violet-400"
                  />

                  {pinError && (
                    <p className="text-xs font-bold text-rose-400">{pinError}</p>
                  )}

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-violet-600 hover:bg-violet-500 py-3 text-xs font-black text-white transition-all shadow-lg active:scale-95"
                  >
                    <Unlock size={16} /> فتح اليوميات
                  </button>
                </form>
              ) : (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setIsUnlocked(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white/10 hover:bg-white/15 py-3 text-xs font-black text-white transition-all"
                  >
                    الدخول بدون رمز مؤقتاً
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPinChangeModal(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl border border-violet-500/40 bg-violet-600/20 py-3 text-xs font-black text-violet-300 hover:bg-violet-600/30 transition-all"
                  >
                    <KeyRound size={15} /> تعيين رمز سري جديد للخصوصية
                  </button>
                </div>
              )}
            </Card>
          ) : (
            /* مساحة التدوين اليومي المفتوحة */
            <div className="space-y-6">
              {/* شريط التحكم العلوي لليوميات */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-violet-400" />
                    <input
                      type="date"
                      value={currentJournalDate}
                      onChange={(e) => setCurrentJournalDate(e.target.value)}
                      className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-white outline-none focus:border-violet-400"
                    />
                  </div>

                  {currentJournalDate === todayDateStr && (
                    <Badge tint={T.primary}>تدوينة اليوم</Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* زر التصدير والنسخ الاحتياطي 💾 */}
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70 hover:bg-white/10 transition-all"
                    title="تصدير نسخة احتياطية من التدوينات والأفكار"
                  >
                    <Download size={14} />
                    <span className="hidden sm:inline">نسخ احتياطي</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setZenMode((z) => !z)}
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70 hover:bg-white/10 transition-all"
                    title="وضع التركيز الهادئ"
                  >
                    {zenMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    <span className="hidden sm:inline">
                      {zenMode ? "الوضع العادي" : "الوضع الهادئ"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPinChangeModal(true)}
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70 hover:bg-white/10 transition-all"
                    title="تغيير الرمز السري"
                  >
                    <KeyRound size={14} />
                    <span className="hidden sm:inline">تغيير الرمز</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLockJournal}
                    className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition-all"
                  >
                    <Lock size={14} />
                    <span>قفل</span>
                  </button>
                </div>
              </div>

              {/* بطاقة "في مثل هذا اليوم" (On This Day Flashback) ⏳ */}
              {memoryFlashback && (
                <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 shrink-0">
                    <History size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black text-amber-300">
                        في مثل هذا اليوم ({memoryFlashback.date})
                      </span>
                      <Badge tint={T.amber}>ذكرى سابقة ⏳</Badge>
                    </div>
                    <p className="text-xs text-white/80 leading-relaxed italic">
                      "{memoryFlashback.gratitude || memoryFlashback.content}"
                    </p>
                  </div>
                </div>
              )}

              {/* اختيار الحالة المزاجية لليوم */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-white/60">
                  كيف كانت طاقتك وشعورك اليوم؟
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {MOOD_OPTIONS.map((m) => {
                    const isSelected = journalMood === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setJournalMood(m.id)}
                        className={`flex items-center gap-2 p-3 rounded-2xl border transition-all text-right ${
                          isSelected
                            ? "border-violet-500 bg-violet-600/20 text-white shadow-lg"
                            : "border-white/5 bg-white/[0.02] text-white/50 hover:bg-white/5"
                        }`}
                      >
                        <span className="text-base">{m.emoji}</span>
                        <span className="text-[11.5px] font-bold">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* تدوين الامتنان وخواطر اليوم */}
              <Card className="p-5 sm:p-7 border border-white/10 bg-white/[0.02] space-y-5">
                <div>
                  <label className="block text-xs font-bold text-amber-300 mb-1.5 flex items-center gap-2">
                    <Heart size={14} /> ثلاثة أشياء ممتن لوجودها اليوم:
                  </label>
                  <input
                    type="text"
                    value={journalGratitude}
                    onChange={(e) => setJournalGratitude(e.target.value)}
                    placeholder="مثال: صحتي، إنجاز كود النظام، جلسة هادئة مع عائلتي..."
                    className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-xs text-white placeholder-white/25 outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <label className="text-xs font-bold text-white/80 flex items-center gap-2">
                      <BookOpen size={14} className="text-violet-400" />
                      تدوينة اليوم والخواطر العميقة:
                    </label>

                    <div className="flex items-center gap-2">
                      {/* زر إدراج سؤال تأملي ذكي 💡 */}
                      <button
                        type="button"
                        onClick={insertPromptToContent}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10 text-[11px] font-bold text-amber-300 hover:bg-amber-500/20 transition-all"
                        title="أضف سؤال اليوم التأملي إلى تدوينتك"
                      >
                        <Sparkles size={13} />
                        <span>سؤال تأملي اليوم</span>
                      </button>

                      {/* زر الإملاء الصوتي لليوميات 🎙️ */}
                      <button
                        type="button"
                        onClick={
                          isListeningJournal
                            ? stopVoiceInput
                            : () => startVoiceInput("journal")
                        }
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          isListeningJournal
                            ? "bg-rose-500 text-white animate-pulse"
                            : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10"
                        }`}
                        title="إملاء صوتي مباشر لليوميات"
                      >
                        {isListeningJournal ? <MicOff size={13} /> : <Mic size={13} />}
                        <span>{isListeningJournal ? "إيقاف الصوت" : "إملاء صوتي"}</span>
                      </button>

                      <span className="text-[10.5px] text-white/30 font-mono">
                        {journalContent.length} حرف
                      </span>
                    </div>
                  </div>

                  <textarea
                    rows={zenMode ? 18 : 10}
                    value={journalContent}
                    onChange={(e) => setJournalContent(e.target.value)}
                    placeholder="اكتب هنا كل ما يدور في خاطرك براحة وأمان... ماذا علمتك مواقف اليوم؟ ما هي مشاعرك وتطلعاتك للغد؟"
                    className="w-full rounded-2xl bg-black/40 border border-white/10 p-4 sm:p-5 text-sm sm:text-base text-white/90 placeholder-white/20 outline-none focus:border-violet-400 leading-relaxed font-sans resize-y"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    {journalSaveNotice && (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={14} /> تم الحفظ في يومياتك بنجاح!
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {journals.some((j) => j.date === currentJournalDate) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteJournal(currentJournalDate)}
                        className="px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                      >
                        حذف تدوينة هذا اليوم
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleSaveJournal}
                      className="flex items-center gap-2 rounded-2xl bg-violet-600 hover:bg-violet-500 px-6 py-2.5 text-xs font-black text-white shadow-lg transition-all active:scale-95"
                    >
                      <Check size={16} /> حفظ التدوينة
                    </button>
                  </div>
                </div>
              </Card>

              {/* سجل التدوينات السابقة */}
              {!zenMode && (
                <div className="space-y-4 pt-4">
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <Clock size={16} className="text-violet-400" />
                    سجل التدوينات السابقة ({journals.length})
                  </h4>

                  <div className="space-y-3">
                    {journals.length === 0 ? (
                      <p className="text-xs text-white/40 italic">لا توجد تدوينات سابقة بعد.</p>
                    ) : (
                      journals.map((entry) => {
                        const moodObj = MOOD_OPTIONS.find((m) => m.id === entry.mood);
                        const isCurrent = entry.date === currentJournalDate;

                        return (
                          <div
                            key={entry.id || entry.date}
                            onClick={() => setCurrentJournalDate(entry.date)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isCurrent
                                ? "bg-violet-600/15 border-violet-500/40 shadow-sm"
                                : "bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/10"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg">
                                {moodObj ? moodObj.emoji : "📝"}
                              </span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-white font-mono">
                                    {entry.date}
                                  </span>
                                  {moodObj && (
                                    <span className="text-[11px] font-bold text-white/50">
                                      • {moodObj.label}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-white/60 line-clamp-1 mt-0.5 max-w-lg">
                                  {entry.gratitude
                                    ? `✨ ${entry.gratitude}`
                                    : entry.content || "تدوينة بدون نص"}
                                </p>
                              </div>
                            </div>

                            <span className="text-[11px] font-bold text-violet-300/80">
                              {isCurrent ? "قيد العرض حالياً" : "فتح وقراءة ←"}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* نافذة تعيين أو تغيير الرمز السري */}
          {showPinChangeModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <Card className="max-w-sm w-full p-6 border border-white/15 bg-[#0f0f18] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <ShieldCheck size={16} className="text-violet-400" />
                    تعيين رمز الحماية (PIN)
                  </h4>
                  <button
                    onClick={() => {
                      setShowPinChangeModal(false);
                      setPinError("");
                    }}
                    className="text-white/40 hover:text-white text-xs"
                  >
                    إغلاق
                  </button>
                </div>

                <p className="text-xs text-white/50 leading-relaxed">
                  احفظ هذا الرمز جيداً. سيُطلب منك في كل مرة تريد فيها قراءة أو كتابة يومياتك الخاصة.
                </p>

                <form onSubmit={handleCreateOrChangePin} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-white/70 mb-1">
                      الرمز الجديد (4 أرقام أو أكثر):
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="••••"
                      className="w-full text-center tracking-[0.4em] font-mono rounded-xl bg-black/50 border border-white/15 py-2 text-white outline-none focus:border-violet-400 text-lg"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-white/70 mb-1">
                      تأكيد الرمز:
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      placeholder="••••"
                      className="w-full text-center tracking-[0.4em] font-mono rounded-xl bg-black/50 border border-white/15 py-2 text-white outline-none focus:border-violet-400 text-lg"
                    />
                  </div>

                  {pinError && (
                    <p className="text-xs font-bold text-rose-400">{pinError}</p>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowPinChangeModal(false)}
                      className="px-4 py-2 text-xs font-bold text-white/50 hover:text-white"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-black text-white shadow-lg"
                    >
                      حفظ الرمز
                    </button>
                  </div>
                </form>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
