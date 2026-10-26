// src/state/agent-tools.js
// ============================================================================
// 🛠️ محرك أدوات الوكيل الذكي (Agent Tools Engine) — مربوط بالكامل مع Life OS
// ============================================================================
// هذا الملف يربط أوامر الذكاء الاصطناعي بهيكل البيانات الحقيقي في:
//   - life-state.mjs (المهام، العادات، الأهداف، المالية، الكتب، التركيز، الجامعة)
//   - prayer-times.mjs (أوقات الصلاة والبلوكات الزمنية)
// كل أداة هنا تُرجع الحالة الجديدة (nextState) ولقطة التراجع (before) لدعم Undo.
// ============================================================================

import {
  rows,
  uid,
  dayKey,
  addDays,
  clampGoal,
  stampToday,
  disciplineOf,
  taskShape,
  capToday,
  TOP_TASK_CAP,
  tomorrowKey,
  prepShape,
  prepPicks,
  prepPickAdd,
  syncHabitToGoals,
  syncTaskToGoal,
  goalShape,
  expenseShape,
  incomeShape,
  MONEY_CAP,
  netBalance,
  bookShape,
  activeBook,
  noteShape,
  NOTE_CAP,
  READ_GOAL_DEFAULT,
  sumPages,
  withdrawReading,
  focusShape,
  presetFor,
  armRun,
  startRun,
  manualSession,
  addSession,
  urgeShape,
  stamp,
  cleanDays,
  eventShape,
  uniShape,
  markShape,
  uniTaskShape,
} from "./life-state.mjs";
import { prayerTimes, clockAt } from "../utils/prayer-times.mjs";

// ============================================================================
// 1) تعريف الأدوات (Tools Schema) التي يراها النموذج (Claude)
// ============================================================================
export const AGENT_TOOLS = [
  {
    name: "add_task",
    description:
      "إضافة مهمة جديدة إلى النظام. يمكن وضعها ضمن أهم 3 مهام لليوم (is_top=true) وتحديد مربع مصفوفة أيزنهاور (q1: عاجل ومهم، q2: مهم غير عاجل، q3: عاجل غير مهم، q4: غير عاجل وغير مهم) والخطوة الأولى.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "عنوان المهمة بوضوح" },
        is_urgent: { type: "boolean", description: "هل هي عاجلة؟ (تضعها في q1)" },
        is_top: { type: "boolean", description: "هل هي من أهم 3 مهام لليوم؟" },
        quadrant: {
          type: "string",
          enum: ["q1", "q2", "q3", "q4"],
          description: "مربع المصفوفة (الافتراضي q2 أو q1 إذا كانت عاجلة)",
        },
        first_step: { type: "string", description: "أول خطوة عملية صغيرة للبدء (اختياري)" },
        estimate_mins: { type: "number", description: "الوقت المقدر بالدقائق (اختياري)" },
      },
      required: ["title"],
    },
  },
  {
    name: "complete_task",
    description: "تأشير مهمة حالية كمُنجزة (بالبحث عن جزء من عنوانها أو معرّفها).",
    input_schema: {
      type: "object",
      properties: {
        task_query: { type: "string", description: "اسم المهمة أو جزء منه أو معرّفها" },
      },
      required: ["task_query"],
    },
  },
  {
    name: "delete_task",
    description: "حذف مهمة موجودة من قائمة المهام.",
    input_schema: {
      type: "object",
      properties: {
        task_title: { type: "string", description: "اسم المهمة المراد حذفها" },
      },
      required: ["task_title"],
    },
  },
  {
    name: "pick_tomorrow_tasks",
    description:
      "اختيار مهمة أو أكثر لتكون ضمن أهم 3 مهام ليوم الغد (تجهيز الغد في إقفال المساء). إذا لم تكن المهمة موجودة سيتم إنشاؤها واختيارها للغد.",
    input_schema: {
      type: "object",
      properties: {
        task_titles: {
          type: "array",
          items: { type: "string" },
          description: "قائمة عناوين مهام الغد (بحد أقصى 3 مهام)",
        },
      },
      required: ["task_titles"],
    },
  },
  {
    name: "complete_habit",
    description:
      "تسجيل إنجاز عادة يومية من الروتين (مثل: صلاة الفجر، أذكار، قراءة، رياضة، سنن...). يرفع مؤشر الانضباط ويحدث أهداف 2030 المرتبطة بها تلقائياً.",
    input_schema: {
      type: "object",
      properties: {
        habit_title: { type: "string", description: "اسم العادة أو معرّفها" },
        tiny: {
          type: "boolean",
          description: "مرّر true إذا أنجز المستخدم الحدّ الأدنى فقط من العادة",
        },
      },
      required: ["habit_title"],
    },
  },
  {
    name: "uncomplete_habit",
    description: "إلغاء تأشير عادة يومية إذا تم تسجيلها بالخطأ.",
    input_schema: {
      type: "object",
      properties: {
        habit_title: { type: "string", description: "اسم العادة أو معرّفها" },
      },
      required: ["habit_title"],
    },
  },
  {
    name: "log_water",
    description: "تسجيل شرب كوب ماء أو أكثر في عدّاد اليوم.",
    input_schema: {
      type: "object",
      properties: {
        amount: { type: "number", description: "عدد الأكواب التي شربها (الافتراضي 1)" },
      },
      required: ["amount"],
    },
  },
  {
    name: "log_expense",
    description:
      "تسجيل مصروف مالي في سجل المصاريف الفعلي وتحديث الرصيد. حدد الفئة ونوع الصرف (need: أساسي، want: رغبة، invest: استثمار، leak: تسريب/هدر).",
    input_schema: {
      type: "object",
      properties: {
        amount: { type: "number", description: "المبلغ بالريال" },
        category: { type: "string", description: "وصف المصروف أو الفئة (مثال: غداء، قهوة، وقود)" },
        cost_kind: {
          type: "string",
          enum: ["need", "want", "invest", "leak"],
          description: "نوع المصروف (need أساسي، want رغبة، invest استثمار، leak تسريب)",
        },
        days_back: { type: "number", description: "0 لليوم، 1 لأمس، 2 لقبل أمس (اختياري)" },
      },
      required: ["amount", "category"],
    },
  },
  {
    name: "log_income",
    description: "تسجيل دخل مالي جديد أو عائد مشروع في سجل الدخل وتحديث الرصيد.",
    input_schema: {
      type: "object",
      properties: {
        amount: { type: "number", description: "المبلغ بالريال" },
        source: { type: "string", description: "مصدر الدخل (مثال: استشارة، مشروع، مكافأة)" },
        hours: { type: "number", description: "عدد ساعات العمل لحساب قيمة الساعة (اختياري)" },
      },
      required: ["amount", "source"],
    },
  },
  {
    name: "log_reading",
    description:
      "تسجيل عدد صفحات القراءة المنجزة. يحدّث تقدم الكتاب الحالي على الرف أو يضيف الكتاب إذا ذكر المستخدم اسمه.",
    input_schema: {
      type: "object",
      properties: {
        pages: { type: "number", description: "عدد الصفحات المقروءة" },
        book_name: { type: "string", description: "اسم الكتاب (اختياري — بدونه يسجل على الكتاب النشط)" },
      },
      required: ["pages"],
    },
  },
  {
    name: "add_book",
    description:
      "إضافة كتاب جديد متكامل إلى مكتبة الإنجازات ببياناته الكاملة: المؤلف، التصنيف، الهوية، عدد الصفحات، أهم درس، الملخص، والفوائد المستخرجة.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "عنوان أو اسم الكتاب" },
        author: { type: "string", description: "اسم المؤلف (اختياري)" },
        category: {
          type: "string",
          enum: ["self", "faith", "business", "knowledge", "health"],
          description: "تصنيف الكتاب (self: تطوير الذات, faith: الدين والروح, business: المال والأعمال, knowledge: الفكر والعلوم, health: الصحة)",
        },
        identity: {
          type: "string",
          enum: ["scholar", "athlete", "executor", "mindful", "general"],
          description: "هوية الكتاب (scholar: المفكر والباحث, executor: المنجز, athlete: الرياضي, mindful: الروحاني, general: عام)",
        },
        pages: { type: "number", description: "إجمالي عدد صفحات الكتاب التقريبي" },
        lesson: { type: "string", description: "أهم درس يغيّر الحياة من هذا الكتاب" },
        summary: { type: "string", description: "ملخص عميق ومكثف لمحتوى الكتاب" },
        notes: {
          type: "array",
          items: { type: "string" },
          description: "أهم 3 إلى 5 فوائد ونقاط مستخرجة من الكتاب لتوضع في دفتره وتدخل نظام التكرار المتباعد",
        },
        status: {
          type: "string",
          enum: ["planned", "reading", "finished"],
          description: "حالة الكتاب (افتراضياً reading إذا كان يبدأ بقراءته أو planned)",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "add_book_note",
    description:
      "حفظ فائدة أو اقتباس أو درس من كتاب في مكتبة الإنجازات ليتم جدولته في نظام المراجعة والتكرار المتباعد.",
    input_schema: {
      type: "object",
      properties: {
        note_text: { type: "string", description: "نص الفائدة أو الاقتباس" },
        book_name: { type: "string", description: "اسم الكتاب (اختياري)" },
      },
      required: ["note_text"],
    },
  },
  {
    name: "start_focus_session",
    description:
      "بدء جلسة عمل عميق (بومودورو) حية على مكتب التركيز، أو تسجيل جلسة تركيز مكتملة.",
    input_schema: {
      type: "object",
      properties: {
        minutes: { type: "number", description: "مدة الجلسة بالدقائق (مثال: 25 أو 50)" },
        task_name: { type: "string", description: "عنوان المهمة أو موضوع التركيز" },
        already_completed: {
          type: "boolean",
          description: "مرّر true إذا كان المستخدم يخبرك أنه أنهى جلسة تركيز بالفعل ويريد توثيقها",
        },
      },
      required: ["minutes"],
    },
  },
  {
    name: "schedule_time_block",
    description:
      "جدولة مهمة أو موعد أو فترة تركيز في وقت محدد بالتقويم (Time Blocking).",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "اسم المهمة أو الموعد" },
        date: { type: "string", description: "التاريخ بصيغة YYYY-MM-DD" },
        start_time: { type: "string", description: "وقت البداية بصيغة HH:MM (مثال: 09:00)" },
        end_time: { type: "string", description: "وقت النهاية بصيغة HH:MM (اختياري)" },
        event_kind: {
          type: "string",
          enum: ["focus", "meet", "deadline", "note"],
          description: "نوع الموعد (focus عمل عميق، meet اجتماع/موعد، deadline تسليم، note تذكير)",
        },
      },
      required: ["title", "date", "start_time"],
    },
  },
  {
    name: "auto_plan_day",
    description:
      "مهندس اليوم الذكي: يقرأ أوقات الصلاة لليوم والمواعيد الحالية، ويوزع أهم المهام تلقائياً على الفترات الذهبية بين الصلوات (الضحى، بعد الظهر، بعد العصر، بعد المغرب، بعد العشاء) ويرتب أهم 3 مهام لليوم.",
    input_schema: {
      type: "object",
      properties: {
        focus_intensity: {
          type: "string",
          enum: ["light", "balanced", "intense"],
          description: "كثافة التخطيط (light خفيف، balanced متوازن، intense مكثف)",
        },
      },
    },
  },
  {
    name: "update_goal_progress",
    description:
      "تحريك عدّاد هدف رقمي في قسم أهداف 2030 / الربع الحالي، أو إضافة تقدم عليه.",
    input_schema: {
      type: "object",
      properties: {
        goal_query: { type: "string", description: "جزء من نص الهدف أو معرّفه" },
        value: { type: "number", description: "القيمة الرقمية" },
        increment: {
          type: "boolean",
          description: "true لزيادة القيمة على التقدم الحالي، false لضبط العدّاد على القيمة مباشرة",
        },
      },
      required: ["goal_query", "value"],
    },
  },
  {
    name: "uni_action",
    description:
      "إدارة قسم الجامعة: تسجيل غياب في مادة (absence)، أو تسجيل درجة اختبار/كويز (mark)، أو إضافة تكليف/اختبار قادم (task).",
    input_schema: {
      type: "object",
      properties: {
        action_type: {
          type: "string",
          enum: ["absence", "mark", "task"],
          description: "نوع الإجراء الأكاديمي",
        },
        course_query: { type: "string", description: "اسم المادة أو رمزها أو معرّفها" },
        label: { type: "string", description: "عنوان الاختبار/التكليف (مثال: كويز 1، ميدتيرم)" },
        score: { type: "number", description: "الدرجة المحصلة (في حال تسجيل درجة)" },
        max_score: { type: "number", description: "الدرجة العظمى (في حال تسجيل درجة)" },
        due_date: { type: "string", description: "تاريخ التسليم/الاختبار YYYY-MM-DD (في حال إضافة تكليف)" },
      },
      required: ["action_type", "course_query"],
    },
  },
  {
    name: "log_urge",
    description:
      "تفعيل درع كاسر العادات: تسجيل صمود (hold) أمام رغبة ملحة أو تسجيل زلّة (fall) مع تحديد المحفز والمزاج.",
    input_schema: {
      type: "object",
      properties: {
        habit_name: { type: "string", description: "اسم العادة السيئة (مثال: السكرول، السهر، السكر)" },
        outcome: {
          type: "string",
          enum: ["hold", "fall"],
          description: "hold إذا صمد وانتصر على الرغبة (الافتراضي)، fall إذا وقع فيها",
        },
        trigger: { type: "string", description: "المحفز أو السبب (مثال: ملل، توتر، إرهاق)" },
      },
      required: ["habit_name"],
    },
  },
  {
    name: "evening_reflection",
    description:
      "تسجيل تقييم المساء ومرآة اليوم في سجل التاريخ: ما الذي شتت المستخدم اليوم، وما الذي سيصلحه غداً، أو ملاحظة تأملية.",
    input_schema: {
      type: "object",
      properties: {
        distraction: { type: "string", description: "أكبر مشتت اليوم" },
        fix: { type: "string", description: "الإجراء العملي لإصلاحه غداً" },
        mirror: { type: "string", description: "تأمل المساء أو رسالة للنفس" },
      },
    },
  },
  {
    name: "trigger_emergency_mode",
    description:
      "تفعيل وضع الطوارئ والحد الأدنى لليوم (لحماية السلسلة عند المرض أو الإرهاق الشديد أو ضغط الاختبارات). يفعّل وضع الطوارئ لشاشة اليوم، ويمكنه اختيارياً إنجاز النسخة الخفيفة (🪶) من كل العادات الأساسية المتبقية فوراً لإنقاذ اليوم وعدم السقوط للصفر.",
    input_schema: {
      type: "object",
      properties: {
        active: {
          type: "boolean",
          description: "true لتفعيل وضع الطوارئ، false لإيقافه والعودة للوضع الكامل (الافتراضي true)",
        },
        complete_tiny_core: {
          type: "boolean",
          description: "true لإنجاز النسخة الخفيفة (🪶) فوراً لكل العادات الأساسية المتبقية لإنقاذ السلسلة",
        },
      },
    },
  },
  {
    name: "save_weekly_review",
    description:
      "اعتماد وتوثيق مراجعة وتخطيط الأسبوع (ورشة التخطيط الأسبوعي). يحفظ أبرز انتصار في الأسبوع الماضي، والعائق الأكبر وكيفية تجنبه، والعادة المحورية (Keystone Habit)، والهدف الاستراتيجي من إرث 2030 للتركيز عليه، مع إمكانية إضافة مهام أسبوعية ذات أولوية.",
    input_schema: {
      type: "object",
      properties: {
        weekly_win: { type: "string", description: "أبرز انتصار أو إنجاز تحقق في الأسبوع الماضي" },
        weekly_lesson: { type: "string", description: "العائق الأكبر وكيفية تجنبه هذا الأسبوع" },
        keystone_habit: { type: "string", description: "اسم أو معرّف العادة المحورية لهذا الأسبوع" },
        focus_goal: { type: "string", description: "اسم أو معرّف هدف 2030 للتركيز عليه هذا الأسبوع" },
        priority_tasks: {
          type: "array",
          items: { type: "string" },
          description: "مهام أسبوعية ذات أولوية تخدم هذا الهدف (اختياري)",
        },
      },
      required: ["weekly_win"],
    },
  },
  {
    name: "breakdown_task",
    description:
      "مفكك التسويف والمهام العالقة (Procrastination Buster): يأخذ مهمة مؤجلة أو ثقيلة ويقسمها إلى خطوة مادية أولى صغيرة جداً (5-10 دقائق)، مع إمكانية تثبيتها كأهم مهمة لليوم للبدء الفوري بلا مقاومة.",
    input_schema: {
      type: "object",
      properties: {
        task_query: { type: "string", description: "اسم المهمة العالقة أو جزء منه" },
        first_micro_step: { type: "string", description: "الخطوة الأولى المادية الصغيرة جداً (أقل من 10 دقائق)" },
        send_to_today: { type: "boolean", description: "هل نجعلها ضمن أهم 3 مهام لليوم فوراً؟ (الافتراضي true)" },
      },
      required: ["task_query", "first_micro_step"],
    },
  },
];

// ============================================================================
// 2) دوال مساعدة للبحث الذكي وتطبيق التعديلات مع دعم التراجع (Undo)
// ============================================================================

const normText = (s) =>
  String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/^ال/, "")
    .replace(/\s+ال/g, " ");

const matchesText = (candidate, query) => {
  const a = normText(candidate);
  const b = normText(query);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
};

// دمج لقطات التراجع (الأقدم يفوز حتى يعود التراجع لما قبل الدور بالكامل)
export function mergeUndoSnapshots(acc, nextBefore) {
  const merged = { ...(acc || {}) };
  for (const [k, v] of Object.entries(nextBefore || {})) {
    if (!(k in merged)) merged[k] = v;
  }
  return merged;
}

// استرجاع الحالة من لقطة التراجع
export function undoAgentChanges(beforeSnapshot, currentState, setState) {
  if (!beforeSnapshot || typeof beforeSnapshot !== "object") return false;
  const restored = { ...(currentState || {}), ...beforeSnapshot };
  if (typeof setState === "function") {
    setState((prev) => ({ ...(prev || {}), ...beforeSnapshot }));
  }
  return restored;
}

// ============================================================================
// 3) الدالة التنفيذية الموحدة (executeTool)
// ============================================================================
export function executeTool(name, input = {}, currentState = {}, setState = null) {
  const safe = currentState || {};
  const commit = (nextState, before, message, extra = {}) => {
    if (typeof setState === "function" && nextState) {
      setState(() => nextState);
    }
    return {
      ok: true,
      message,
      nextState: nextState || safe,
      before: before || null,
      ...extra,
    };
  };

  try {
    switch (name) {
      // ----------------------------------------------------------------------
      // 1. إضافة مهمة جديدة
      // ----------------------------------------------------------------------
      case "add_task": {
        const text = String(input.title || "").trim();
        if (!text) return { ok: false, message: "عنوان المهمة فارغ." };

        const wantTop = Boolean(input.is_top);
        const quad =
          input.quadrant || (input.is_urgent ? "q1" : "q2");
        const row = taskShape({
          id: uid(),
          text,
          today: wantTop,
          quadrant: quad,
          step: String(input.first_step || "").trim(),
          estimate: Number(input.estimate_mins) > 0 ? Number(input.estimate_mins) : 0,
        });

        const existing = rows(safe.tasks);
        const appended = [...existing, row];
        const finalTasks = wantTop ? capToday(appended) : appended;
        const kept = finalTasks.find((t) => t.id === row.id);
        const capped = wantTop && (!kept || !kept.today);

        const nextState = { ...safe, tasks: finalTasks };
        const msg = capped
          ? `أضفت المهمة «${text}» في المصفوفة (مهام اليوم الثلاث مكتملة بـ ${TOP_TASK_CAP}).`
          : wantTop
            ? `أضفت «${text}» ضمن أهم 3 مهام لليوم.`
            : `أضفت المهمة «${text}» إلى مصفوفة المهام (${quad.toUpperCase()}).`;

        return commit(nextState, { tasks: safe.tasks }, msg, {
          badge: wantTop && !capped ? "أهم 3 مهام" : quad.toUpperCase(),
        });
      }

      // ----------------------------------------------------------------------
      // 2. إنجاز مهمة
      // ----------------------------------------------------------------------
      case "complete_task": {
        const query = String(input.task_query || "").trim();
        const list = rows(safe.tasks);
        const openTasks = list.filter((t) => !t.done);
        const target =
          openTasks.find((t) => t.id === query || matchesText(t.text || t.title, query)) ||
          list.find((t) => t.id === query || matchesText(t.text || t.title, query));

        if (!target) {
          return { ok: false, message: `لم أجد مهمة تطابق «${query}».` };
        }
        if (target.done) {
          return { ok: false, message: `المهمة «${target.text || target.title}» منجزة مسبقاً ✅` };
        }

        const updatedTasks = list.map((t) =>
          t.id === target.id ? { ...t, done: true, completedAt: dayKey() } : t
        );
        const updatedGoals = target.goalId
          ? syncTaskToGoal(safe.goals, target.goalId, updatedTasks)
          : safe.goals;

        const nextState = stampToday({
          ...safe,
          tasks: updatedTasks,
          goals: updatedGoals,
        });

        return commit(
          nextState,
          { tasks: safe.tasks, goals: safe.goals, history: safe.history },
          `تم إنجاز المهمة: «${target.text || target.title}» ✅`,
          { badge: "مهمة منجزة" }
        );
      }

      // ----------------------------------------------------------------------
      // 3. حذف مهمة
      // ----------------------------------------------------------------------
      case "delete_task": {
        const query = String(input.task_title || "").trim();
        const list = rows(safe.tasks);
        const target = list.find(
          (t) => t.id === query || matchesText(t.text || t.title, query)
        );
        if (!target) {
          return { ok: false, message: `لم أجد مهمة باسم «${query}».` };
        }

        const nextState = {
          ...safe,
          tasks: list.filter((t) => t.id !== target.id),
        };
        return commit(
          nextState,
          { tasks: safe.tasks },
          `تم حذف المهمة: «${target.text || target.title}»`,
          { badge: "حذف مهمة" }
        );
      }

      // ----------------------------------------------------------------------
      // 4. اختيار مهام الغد الثلاث (تجهيز الغد)
      // ----------------------------------------------------------------------
      case "pick_tomorrow_tasks": {
        const titles = Array.isArray(input.task_titles)
          ? input.task_titles.map((s) => String(s || "").trim()).filter(Boolean).slice(0, TOP_TASK_CAP)
          : [];
        if (!titles.length) {
          return { ok: false, message: "لم يتم تحديد مهام للغد." };
        }

        let currentTasks = [...rows(safe.tasks)];
        let currentPrep = prepShape(safe.prep);
        const tmrw = tomorrowKey();
        const pickedNames = [];

        for (const title of titles) {
          let found = currentTasks.find(
            (t) => !t.done && matchesText(t.text || t.title, title)
          );
          if (!found) {
            found = taskShape({ id: uid(), text: title, today: false, quadrant: "q2" });
            currentTasks.push(found);
          }
          currentPrep = prepPickAdd(currentPrep, found.id, tmrw);
          pickedNames.push(found.text || found.title);
        }

        const nextState = {
          ...safe,
          tasks: currentTasks,
          prep: currentPrep,
        };
        return commit(
          nextState,
          { tasks: safe.tasks, prep: safe.prep },
          `تم تجهيز مهام الغد (${prepPicks(currentPrep).length}/${TOP_TASK_CAP}): ${pickedNames.join("، ")}`,
          { badge: `غداً: ${pickedNames.length} مهام` }
        );
      }

      // ----------------------------------------------------------------------
      // 5. إنجاز عادة يومية + تحديث أهداف 2030 ومؤشر الانضباط
      // ----------------------------------------------------------------------
      case "complete_habit": {
        const query = String(input.habit_title || "").trim();
        const list = rows(safe.habits);
        const openHabits = list.filter((h) => !h.done);
        const target =
          openHabits.find((h) => h.id === query || matchesText(h.label || h.name || h.title, query)) ||
          list.find((h) => h.id === query || matchesText(h.label || h.name || h.title, query));

        if (!target) {
          return { ok: false, message: `لم أجد عادة تطابق «${query}» في روتينك.` };
        }
        if (target.done) {
          return {
            ok: false,
            message: `العادة «${target.label || target.name}» مسجلة كمنجزة اليوم بالفعل ✅`,
          };
        }

        const isTiny = Boolean(input.tiny);
        const updatedGoals = syncHabitToGoals(safe.goals, target.id, true);
        const nextHabits = list.map((h) =>
          h.id === target.id ? { ...h, done: true, tiny: isTiny } : h
        );
        const nextState = stampToday({
          ...safe,
          habits: nextHabits,
          goals: updatedGoals,
        });
        const newPct = disciplineOf(nextState.habits);

        return commit(
          nextState,
          { habits: safe.habits, goals: safe.goals, history: safe.history },
          `تم إنجاز عادة «${target.label || target.name}»${isTiny ? " (الحد الأدنى)" : ""} — الانضباط الآن ${newPct}% 🔥`,
          { badge: `الانضباط ${newPct}%` }
        );
      }

      // ----------------------------------------------------------------------
      // 6. إلغاء تأشير عادة يومية
      // ----------------------------------------------------------------------
      case "uncomplete_habit": {
        const query = String(input.habit_title || "").trim();
        const list = rows(safe.habits);
        const target = list.find(
          (h) => h.id === query || matchesText(h.label || h.name || h.title, query)
        );
        if (!target) {
          return { ok: false, message: `لم أجد عادة باسم «${query}».` };
        }
        if (!target.done) {
          return { ok: false, message: `العادة «${target.label || target.name}» غير مؤشرة أصلاً.` };
        }

        const backRead = withdrawReading(safe.reading, safe.books, target.id, dayKey());
        const updatedGoals = syncHabitToGoals(safe.goals, target.id, false);
        const nextState = stampToday({
          ...safe,
          habits: list.map((h) =>
            h.id === target.id ? { ...h, done: false, tiny: false } : h
          ),
          reading: backRead.reading,
          books: backRead.books,
          goals: updatedGoals,
        });
        const newPct = disciplineOf(nextState.habits);

        return commit(
          nextState,
          {
            habits: safe.habits,
            goals: safe.goals,
            history: safe.history,
            reading: safe.reading,
            books: safe.books,
          },
          `تم إلغاء تأشير «${target.label || target.name}» — الانضباط الآن ${newPct}%.`,
          { badge: `الانضباط ${newPct}%` }
        );
      }

      // ----------------------------------------------------------------------
      // 7. تسجيل شرب الماء
      // ----------------------------------------------------------------------
      case "log_water": {
        const cups = Math.max(1, Math.round(Number(input.amount) || 1));
        const goal = clampGoal(safe.waterGoal);
        const currentWater =
          typeof safe.water === "number"
            ? Math.max(0, Math.round(safe.water))
            : Number(safe.water?.today ?? 0);
        const nextWater = Math.min(goal + 4, currentWater + cups);

        const nextState = stampToday({
          ...safe,
          water: nextWater,
        });

        return commit(
          nextState,
          { water: safe.water, history: safe.history },
          `تم تسجيل ${cups} كوب ماء — الإجمالي اليوم: ${nextWater}/${goal} 💧`,
          { badge: `الماء ${nextWater}/${goal}` }
        );
      }

      // ----------------------------------------------------------------------
      // 8. تسجيل مصروف مالي
      // ----------------------------------------------------------------------
      case "log_expense": {
        const amount = Number(input.amount) || 0;
        if (amount <= 0) {
          return { ok: false, message: "المبلغ يجب أن يكون أكبر من صفر." };
        }
        const back = Math.max(0, Math.min(7, Math.round(Number(input.days_back) || 0)));
        const expDate = back > 0 ? addDays(dayKey(), -back) : dayKey();
        const label = String(input.category || "مصروف").trim();
        const row = expenseShape({
          label,
          amount,
          type: input.cost_kind || "need",
          date: expDate,
        });

        const nextExpenses = [row, ...rows(safe.expenses)].slice(0, MONEY_CAP);
        const balance = netBalance(safe.income, nextExpenses);
        const nextState = {
          ...safe,
          expenses: nextExpenses,
        };

        return commit(
          nextState,
          { expenses: safe.expenses },
          `تم تسجيل مصروف ${amount} ريال (${label}) — الرصيد الصافي: ${balance} ريال 💸`,
          { badge: `-${amount} ر.س` }
        );
      }

      // ----------------------------------------------------------------------
      // 9. تسجيل دخل مالي
      // ----------------------------------------------------------------------
      case "log_income": {
        const amount = Number(input.amount) || 0;
        if (amount <= 0) {
          return { ok: false, message: "مبلغ الدخل يجب أن يكون أكبر من صفر." };
        }
        const label = String(input.source || "دخل").trim();
        const row = incomeShape({
          label,
          amount,
          hours: Number(input.hours) > 0 ? Number(input.hours) : 0,
          date: dayKey(),
        });

        const nextIncome = [row, ...rows(safe.income)].slice(0, MONEY_CAP);
        const balance = netBalance(nextIncome, safe.expenses);
        const nextState = {
          ...safe,
          income: nextIncome,
        };

        return commit(
          nextState,
          { income: safe.income },
          `تم تسجيل دخل +${amount} ريال (${label}) — الرصيد الصافي: ${balance} ريال 💰`,
          { badge: `+${amount} ر.س` }
        );
      }

      // ----------------------------------------------------------------------
      // 10. تسجيل قراءة صفحات كتاب
      // ----------------------------------------------------------------------
      case "log_reading": {
        const pages = Math.max(1, Math.round(Number(input.pages) || 0));
        let books = [...rows(safe.books)];
        const bookQuery = String(input.book_name || "").trim();

        let targetBook = bookQuery
          ? books.find((b) => matchesText(b.title, bookQuery))
          : activeBook(books);

        // إذا ذكر المستخدم اسم كتاب غير موجود، نضيفه للرف ونفعّله تلقائياً
        if (!targetBook && bookQuery) {
          targetBook = bookShape({
            id: uid(),
            title: bookQuery,
            status: "reading",
            page: "0",
          });
          books = [targetBook, ...books];
        } else if (!targetBook && books.length > 0) {
          targetBook = books[0];
        }

        if (!targetBook) {
          targetBook = bookShape({
            id: uid(),
            title: "قراءة عامة",
            status: "reading",
            page: "0",
          });
          books = [targetBook];
        }

        const totalPages = parseInt(targetBook.pages, 10);
        const currentPage = parseInt(targetBook.page, 10) || 0;
        const nextPage =
          Number.isFinite(totalPages) && totalPages > 0
            ? Math.min(totalPages, currentPage + pages)
            : currentPage + pages;

        const readRow = {
          id: uid(),
          date: dayKey(),
          bookId: targetBook.id,
          habitId: null,
          pages,
        };
        const nextReading = [...rows(safe.reading), readRow];
        const updatedBook = {
          ...targetBook,
          page: String(nextPage),
          status: targetBook.status === "planned" ? "reading" : targetBook.status,
        };
        const nextBooks = [
          updatedBook,
          ...books.filter((b) => b.id !== targetBook.id),
        ];
        const todayTotal = sumPages(nextReading.filter((r) => r.date === dayKey()));
        const readGoal = Number.isFinite(+safe.readGoal) ? +safe.readGoal : READ_GOAL_DEFAULT;

        const nextState = {
          ...safe,
          books: nextBooks,
          reading: nextReading,
        };

        return commit(
          nextState,
          { books: safe.books, reading: safe.reading },
          `تم تسجيل قراءة ${pages} صفحة من «${updatedBook.title}» (وصلت لصفحة ${nextPage} · إجمالي اليوم ${todayTotal}/${readGoal}) 📖`,
          { badge: `+${pages} صفحة` }
        );
      }

      // ----------------------------------------------------------------------
      // 10.5 إضافة كتاب متكامل بكل تفاصيله بالذكاء الاصطناعي
      // ----------------------------------------------------------------------
      case "add_book": {
        const title = String(input.title || "").trim();
        if (!title) return { ok: false, message: "عنوان الكتاب مطلوب." };

        const books = [...rows(safe.books)];
        const already = books.find((b) => matchesText(b.title, title));
        if (already) {
          return {
            ok: true,
            message: `الكتاب «${already.title}» موجود بالفعل على الرف (الحالة: ${already.status || "قيد القراءة"}).`,
            nextState: safe,
          };
        }

        const notesArr = Array.isArray(input.notes)
          ? input.notes.map((txt) =>
              noteShape({
                text: String(txt).trim(),
                at: dayKey(),
                due: addDays(dayKey(), 1),
              })
            )
          : [];

        const row = bookShape({
          id: uid(),
          title,
          author: String(input.author || "").trim(),
          status: input.status || "reading",
          category: input.category || "self",
          identity: input.identity || "scholar",
          pages: input.pages ? String(input.pages) : "250",
          page: "0",
          lesson: String(input.lesson || "").trim(),
          summary: String(input.summary || "").trim(),
          notes: notesArr,
        });

        const nextBooks = [row, ...books];
        return commit(
          { ...safe, books: nextBooks },
          { books: safe.books },
          `✨ أضفت كتاب «${row.title}» بالكامل إلى مكتبتك (المؤلف: ${row.author || "—"} · ${row.pages} صفحة · ${notesArr.length} فوائد مستخرجة ومجدولة) 📚`,
          { badge: "كتاب جديد" }
        );
      }

      // ----------------------------------------------------------------------
      // 11. إضافة فائدة / اقتباس من كتاب (للتكرار المتباعد)
      // ----------------------------------------------------------------------
      case "add_book_note": {
        const text = String(input.note_text || "").trim();
        if (!text) return { ok: false, message: "نص الفائدة فارغ." };

        const books = rows(safe.books);
        const query = String(input.book_name || "").trim();
        const book =
          (query && books.find((b) => matchesText(b.title, query))) ||
          activeBook(books) ||
          books[0];

        if (!book) {
          return {
            ok: false,
            message: "لا يوجد كتاب في المكتبة لحفظ الفائدة عليه — أضف كتاباً أولاً.",
          };
        }

        const existingNotes = rows(book.notes);
        if (existingNotes.length >= NOTE_CAP) {
          return {
            ok: false,
            message: `الكتاب «${book.title}» وصل للحد الأقصى من الفوائد (${NOTE_CAP}).`,
          };
        }

        const note = noteShape({
          text,
          page: book.page ? String(book.page) : "",
          at: dayKey(),
          box: 0,
          due: addDays(dayKey(), 1),
        });
        const updatedBook = { ...book, notes: [...existingNotes, note] };
        const nextBooks = books.map((b) => (b.id === book.id ? updatedBook : b));

        return commit(
          { ...safe, books: nextBooks },
          { books: safe.books },
          `تم حفظ الفائدة على كتاب «${book.title}» وجدولتها للمراجعة غداً 💡`,
          { badge: "فائدة محفوظة" }
        );
      }

      // ----------------------------------------------------------------------
      // 12. بدء أو تسجيل جلسة عمل عميق (Focus Session)
      // ----------------------------------------------------------------------
      case "start_focus_session": {
        const mins = Math.max(5, Math.min(180, Math.round(Number(input.minutes) || 25)));
        const label = String(input.task_name || "عمل عميق").trim();
        const now = Date.now();

        if (input.already_completed) {
          const row = manualSession({ minutes: mins, label, taskId: null, at: now });
          const nextSessions = row ? addSession(safe.sessions, row) : rows(safe.sessions);
          return commit(
            { ...safe, sessions: nextSessions },
            { sessions: safe.sessions },
            `تم توثيق جلسة عمل عميق مكتملة: ${mins} دقيقة على «${label}» ⏱️`,
            { badge: `${mins} د تركيز` }
          );
        }

        const focus = focusShape(safe.focus);
        const preset = presetFor(focus, focus.pick);
        const run = startRun(
          armRun({
            phase: "focus",
            planned: mins,
            presetId: preset.id,
            taskId: null,
            label,
            round: focus.round,
            now,
          }),
          now
        );

        const nextState = {
          ...safe,
          focus: { ...focus, run },
        };
        return commit(
          nextState,
          { focus: safe.focus },
          `بدأت جلسة التركيز الآن لمدة ${mins} دقيقة على «${label}» 🎯`,
          { badge: `مؤقت ${mins} د` }
        );
      }

      // ----------------------------------------------------------------------
      // 13. جدولة موعد أو بلوك زمني في التقويم
      // ----------------------------------------------------------------------
      case "schedule_time_block": {
        const title = String(input.title || "").trim();
        if (!title) return { ok: false, message: "عنوان الموعد فارغ." };

        const date = /^\d{4}-\d{2}-\d{2}$/.test(String(input.date || ""))
          ? input.date
          : dayKey();
        const startTime = String(input.start_time || "09:00").trim();
        const endTime = String(input.end_time || "").trim();
        const fullTitle = endTime ? `${title} (حتى ${endTime})` : title;

        const row = eventShape({
          id: uid(),
          title: fullTitle,
          date,
          time: startTime,
          kind: input.event_kind || "focus",
        });

        const nextState = {
          ...safe,
          events: [...rows(safe.events), row],
        };

        return commit(
          nextState,
          { events: safe.events },
          `تمت جدولة «${title}» يوم ${date} الساعة ${startTime}${endTime ? ` - ${endTime}` : ""} 📅`,
          { badge: `${startTime}` }
        );
      }

      // ----------------------------------------------------------------------
      // 14. مهندس اليوم الذكي المرتبط بأوقات الصلاة (Auto-Plan Day)
      // ----------------------------------------------------------------------
      case "auto_plan_day": {
        const today = dayKey();
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();

        // حساب أوقات الصلاة الفعلية للمستخدم
        const place = safe.place && Number.isFinite(safe.place.lat)
          ? safe.place
          : { lat: 24.7136, lng: 46.6753, tz: 3, asr: 1 };
        const prayers = prayerTimes(place, now);

        const toMins = (decHour, fallbackMins) => {
          if (decHour === null || !Number.isFinite(decHour)) return fallbackMins;
          return Math.round(decHour * 60);
        };
        const fmtClock = (m) =>
          `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

        // الفترات الذهبية للعمل بين الصلوات (مع ترك 25 دقيقة للصلاة والسنن)
        const candidateSlots = [
          {
            label: "بزوغ الفجر والضحى",
            start: Math.max(toMins(prayers.fajr, 300) + 35, 360),
            duration: 60,
          },
          {
            label: "فترة الضحى الذهبية",
            start: 540, // 09:00
            duration: 90,
          },
          {
            label: "بعد صلاة الظهر",
            start: toMins(prayers.dhuhr, 720) + 30,
            duration: 60,
          },
          {
            label: "بعد صلاة العصر",
            start: toMins(prayers.asr, 930) + 30,
            duration: 60,
          },
          {
            label: "بين المغرب والعشاء",
            start: toMins(prayers.maghrib, 1080) + 25,
            duration: 45,
          },
          {
            label: "بعد صلاة العشاء",
            start: toMins(prayers.isha, 1170) + 30,
            duration: 60,
          },
        ].filter((slot) => slot.start + slot.duration > currentMins + 10);

        const allTasks = rows(safe.tasks);
        const openTasks = allTasks.filter((t) => !t.done);
        const quadRank = { q1: 0, q2: 1, q3: 2, q4: 3 };
        const sortedOpen = [...openTasks].sort((a, b) => {
          if (a.today !== b.today) return a.today ? -1 : 1;
          return (quadRank[a.quadrant] ?? 2) - (quadRank[b.quadrant] ?? 2);
        });

        const maxBlocks =
          input.focus_intensity === "light"
            ? 2
            : input.focus_intensity === "intense"
              ? 5
              : 3;

        const chosenTasks = sortedOpen.slice(0, Math.min(maxBlocks, candidateSlots.length));
        const existingEvents = rows(safe.events);
        const newEvents = [];
        const planSummary = [];

        chosenTasks.forEach((task, idx) => {
          const slot = candidateSlots[idx];
          if (!slot) return;
          const startStr = fmtClock(Math.max(slot.start, currentMins + 15 + idx * 75));
          const endStr = fmtClock(Math.max(slot.start, currentMins + 15 + idx * 75) + slot.duration);
          const evTitle = `🎯 ${task.text || task.title} (${slot.label})`;
          const alreadyScheduled = existingEvents.some(
            (e) => e.date === today && matchesText(e.title, task.text || task.title)
          );
          if (!alreadyScheduled) {
            newEvents.push(
              eventShape({
                id: uid(),
                title: `${evTitle} [حتى ${endStr}]`,
                date: today,
                time: startStr,
                kind: "focus",
              })
            );
          }
          planSummary.push(`${startStr} ← ${task.text || task.title} (${slot.label})`);
        });

        // ترقية أهم 3 مهام لليوم إن كان العدد أقل من 3
        let nextTasks = [...allTasks];
        const topIds = new Set(nextTasks.filter((t) => t.today && !t.done).map((t) => t.id));
        for (const t of sortedOpen) {
          if (topIds.size >= TOP_TASK_CAP) break;
          topIds.add(t.id);
        }
        nextTasks = capToday(
          nextTasks.map((t) => (topIds.has(t.id) ? { ...t, today: true } : t))
        );

        const nextState = {
          ...safe,
          tasks: nextTasks,
          events: [...existingEvents, ...newEvents],
        };

        const fajrStr = clockAt(prayers.fajr);
        const dhuhrStr = clockAt(prayers.dhuhr);
        const asrStr = clockAt(prayers.asr);
        const maghribStr = clockAt(prayers.maghrib);
        const ishaStr = clockAt(prayers.isha);

        const msg = planSummary.length
          ? `تمت هندسة يومك حول أوقات الصلاة (الفجر ${fajrStr} · الظهر ${dhuhrStr} · العصر ${asrStr} · المغرب ${maghribStr} · العشاء ${ishaStr}):\n` +
            planSummary.map((l) => `• ${l}`).join("\n")
          : `أوقات الصلاة اليوم (العصر ${asrStr} · المغرب ${maghribStr} · العشاء ${ishaStr}) — لا توجد مهام معلقة لجدولتها حالياً.`;

        return commit(
          nextState,
          { tasks: safe.tasks, events: safe.events },
          msg,
          { badge: `جدولة ${newEvents.length} فترات` }
        );
      }

      // ----------------------------------------------------------------------
      // 15. تحديث تقدم هدف من أهداف 2030 / الربع
      // ----------------------------------------------------------------------
      case "update_goal_progress": {
        const query = String(input.goal_query || "").trim();
        const allGoals = rows(safe.goals);
        const target = allGoals.find(
          (g) => !g.done && (g.id === query || matchesText(g.text, query))
        );
        if (!target) {
          return { ok: false, message: `لم أجد هدفاً نشطاً يطابق «${query}».` };
        }
        if (!(target.target > 0)) {
          return {
            ok: false,
            message: `الهدف «${target.text}» يُقاس بالعادات والمهام المرتبطة به وليس بعدّاد رقمي منفصل.`,
          };
        }

        const was = Number(target.current) || 0;
        const val = Number(input.value) || 0;
        const nextVal = Math.max(
          0,
          Math.min(target.target, input.increment ? was + val : val)
        );
        const nextGoals = allGoals.map((g) =>
          g.id === target.id
            ? goalShape({ ...g, current: nextVal, done: nextVal >= target.target ? true : g.done })
            : g
        );

        return commit(
          { ...safe, goals: nextGoals },
          { goals: safe.goals },
          `تم تحديث الهدف «${target.text}»: ${was} ← ${nextVal} من ${target.target} ${target.unit || ""} 🎯`,
          { badge: `${nextVal}/${target.target}` }
        );
      }

      // ----------------------------------------------------------------------
      // 16. المساعد الأكاديمي للجامعة (غياب / درجة / تكليف)
      // ----------------------------------------------------------------------
      case "uni_action": {
        const uni = uniShape(safe.uni);
        const courses = rows(uni.courses);
        const q = String(input.course_query || "").trim();
        const course = courses.find(
          (c) => c.id === q || matchesText(c.name, q) || matchesText(c.code, q)
        );

        if (!course) {
          return {
            ok: false,
            message: `لم أجد مادة جامعية تطابق «${q}». المواد المتاحة: ${courses.map((c) => c.name || c.code).join("، ") || "لا توجد مواد مسجلة"}.`,
          };
        }

        if (input.action_type === "absence") {
          const today = dayKey();
          const seen = Array.isArray(course.absentOn) ? course.absentOn : [];
          if (seen.includes(today)) {
            return {
              ok: false,
              message: `غياب «${course.name}» مسجل لهذا اليوم بالفعل.`,
            };
          }
          const nextCourses = courses.map((c) =>
            c.id === course.id
              ? { ...c, absences: (c.absences || 0) + 1, absentOn: [...seen, today] }
              : c
          );
          const newCount = (course.absences || 0) + 1;
          const cap = course.absenceCap || 0;
          const warn = cap > 0 && newCount >= cap - 1 ? " ⚠️ تنبيه: اقتربت من سقف الحرمان!" : "";

          return commit(
            { ...safe, uni: { ...uni, courses: nextCourses } },
            { uni: safe.uni },
            `سُجّل غياب في «${course.name}» (${newCount}${cap ? `/${cap}` : ""}).${warn}`,
            { badge: `غياب ${newCount}${cap ? `/${cap}` : ""}` }
          );
        }

        if (input.action_type === "mark") {
          const maxScore = Number(input.max_score) || 0;
          const score = Number(input.score) || 0;
          if (maxScore <= 0) {
            return { ok: false, message: "الدرجة العظمى يجب أن تكون أكبر من صفر." };
          }
          const markRow = markShape({
            label: String(input.label || "تقييم").trim(),
            score,
            max: maxScore,
          });
          const nextCourses = courses.map((c) =>
            c.id === course.id ? { ...c, marks: [...rows(c.marks), markRow] } : c
          );

          return commit(
            { ...safe, uni: { ...uni, courses: nextCourses } },
            { uni: safe.uni },
            `تم رصد درجة «${markRow.label}» في مادة «${course.name}»: ${score} من ${maxScore} 🎓`,
            { badge: `${score}/${maxScore}` }
          );
        }

        if (input.action_type === "task") {
          const taskRow = uniTaskShape({
            id: uid(),
            course: course.id,
            title: String(input.label || "تكليف جامعي").trim(),
            due: /^\d{4}-\d{2}-\d{2}$/.test(String(input.due_date || ""))
              ? input.due_date
              : addDays(dayKey(), 3),
            kind: "exam",
            done: false,
          });
          const nextUniTasks = [...rows(uni.tasks), taskRow];

          return commit(
            { ...safe, uni: { ...uni, tasks: nextUniTasks } },
            { uni: safe.uni },
            `تمت إضافة موعد جامعي «${taskRow.title}» لمادة «${course.name}» بتاريخ ${taskRow.due} 📚`,
            { badge: taskRow.due }
          );
        }

        return { ok: false, message: "نوع الإجراء الأكاديمي غير معروف." };
      }

      // ----------------------------------------------------------------------
      // 17. درع كاسر العادات (صمود أو زلّة)
      // ----------------------------------------------------------------------
      case "log_urge": {
        const q = String(input.habit_name || "").trim();
        const list = rows(safe.badHabits);
        const bad =
          list.find((b) => matchesText(b.title, q)) || list[0];

        if (!bad) {
          return {
            ok: false,
            message: "لا توجد عادة مسجلة في كاسر العادات حالياً.",
          };
        }

        const isFall = input.outcome === "fall";
        const daysClean = cleanDays(bad);
        const row = urgeShape(
          {
            ...stamp(),
            days: isFall ? daysClean : undefined,
            trigger: String(input.trigger || "").trim(),
          },
          isFall ? "fall" : "hold"
        );

        const nextBadHabits = list.map((b) => {
          if (b.id !== bad.id) return b;
          if (isFall) {
            return { ...b, logs: [...rows(b.logs), row], startDate: dayKey() };
          }
          return { ...b, urges: [...rows(b.urges), row] };
        });

        const nextState = stampToday({
          ...safe,
          badHabits: nextBadHabits,
        });

        const msg = isFall
          ? `تم تسجيل الكبوة في «${bad.title}» بعد ${daysClean} يوم نظيف. انهض فوراً ولا تسمح ليومين متتاليين!`
          : `بطل! تم تسجيل صمودك أمام «${bad.title}» — سلسلتك النظيفة ${daysClean} يوم 🛡️`;

        return commit(
          nextState,
          { badHabits: safe.badHabits, history: safe.history },
          msg,
          { badge: isFall ? "إعادة ضبط" : `صمود ${daysClean} يوم` }
        );
      }

      // ----------------------------------------------------------------------
      // 18. تقييم المساء ومرآة اليوم (Evening Reflection)
      // ----------------------------------------------------------------------
      case "evening_reflection": {
        const today = dayKey();
        const stamped = stampToday(safe);
        const distraction = String(input.distraction || "").trim().slice(0, 300);
        const fix = String(input.fix || "").trim().slice(0, 300);
        const mirror = String(input.mirror || "").trim().slice(0, 500);

        const nextHistory = rows(stamped.history).map((h) => {
          if (h.date !== today) return h;
          return {
            ...h,
            ...(distraction ? { distraction } : {}),
            ...(fix ? { fix } : {}),
            ...(mirror ? { mirror } : {}),
          };
        });

        const nextState = {
          ...stamped,
          history: nextHistory,
        };

        return commit(
          nextState,
          { history: safe.history },
          "تم حفظ تقييم المساء ومرآة اليوم في سجل تاريخك بنجاح 🌙",
          { badge: "مرآة المساء" }
        );
      }

      // ----------------------------------------------------------------------
      // 19. وضع الطوارئ والحد الأدنى
      // ----------------------------------------------------------------------
      case "trigger_emergency_mode": {
        const today = dayKey();
        const turnOn = input.active !== false;
        try {
          if (turnOn) localStorage.setItem("los-emergency-day", today);
          else localStorage.removeItem("los-emergency-day");
        } catch {}

        if (turnOn && input.complete_tiny_core) {
          const habits = rows(safe.habits);
          let rescuedCount = 0;
          const nextHabits = habits.map((h) => {
            if (h.core && !h.done) {
              rescuedCount++;
              return { ...h, done: true, tiny: true };
            }
            return h;
          });
          const nextState = stampToday({
            ...safe,
            habits: nextHabits,
          });
          return commit(
            nextState,
            { habits: safe.habits, history: safe.history },
            `🛡️ تم تفعيل وضع الطوارئ وإنقاذ ${rescuedCount} عادات أساسية بالنسخة الخفيفة (🪶)! سلسلتك في أمان، استرح الآن بلا قلق.`,
            { badge: "طوارئ + إنقاذ 🪶" }
          );
        }

        return commit(
          safe,
          null,
          turnOn
            ? "🛡️ تم تفعيل وضع الطوارئ لليوم — ركّز على الجذور الأساسية والنسخة الخفيفة فقط وتجاهل الكماليات."
            : "✅ تم إيقاف وضع الطوارئ والعودة إلى الروتين الكامل.",
          { badge: turnOn ? "وضع الطوارئ 🛡️" : "الروتين الكامل" }
        );
      }

      // ----------------------------------------------------------------------
      // 20. اعتماد مراجعة وتخطيط الأسبوع
      // ----------------------------------------------------------------------
      case "save_weekly_review": {
        const d = new Date();
        const day = d.getDay();
        const diffToSat = (day + 1) % 7;
        const sat = new Date(d);
        sat.setDate(d.getDate() - diffToSat);
        const weekKeyStr = dayKey(sat);

        const win = String(input.weekly_win || "").trim();
        if (!win) return { ok: false, message: "يرجى ذكر أبرز انتصار في الأسبوع الماضي." };
        const lesson = String(input.weekly_lesson || "").trim();

        // مطابقة العادة المحورية
        const habits = rows(safe.habits);
        let keystoneId = "";
        if (input.keystone_habit) {
          const matchedH = habits.find((h) => matchesText(h.label, input.keystone_habit));
          if (matchedH) keystoneId = matchedH.id;
        }

        // مطابقة هدف 2030
        const goals = rows(safe.goals);
        let focusGoalId = "";
        let focusGoalText = "";
        if (input.focus_goal) {
          const matchedG = goals.find((g) => matchesText(g.text, input.focus_goal));
          if (matchedG) {
            focusGoalId = matchedG.id;
            focusGoalText = matchedG.text;
          }
        }

        const nowTime = new Date().toLocaleDateString("ar-SA", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });

        const entry = {
          done: true,
          savedAt: nowTime,
          weeklyWin: win,
          weeklyLesson: lesson,
          keystoneHabitId: keystoneId,
          focusGoalId: focusGoalId,
          avgPct: disciplineOf(safe),
        };

        try {
          const raw = localStorage.getItem("los-weekly-reviews-v1");
          const map = raw ? JSON.parse(raw) : {};
          map[weekKeyStr] = entry;
          localStorage.setItem("los-weekly-reviews-v1", JSON.stringify(map));
        } catch {}

        // إذا تم تمرير مهام أولوية، نضيفها فوراً ونربطها بهدف 2030
        let nextTasks = rows(safe.tasks);
        if (Array.isArray(input.priority_tasks) && input.priority_tasks.length > 0) {
          const createdTasks = input.priority_tasks
            .map((txt) => String(txt || "").trim())
            .filter(Boolean)
            .map((text, idx) =>
              taskShape({
                id: uid(),
                text,
                quadrant: "q2",
                today: idx === 0,
                scheduled: idx > 0,
                done: false,
                linkedGoalId: focusGoalId || null,
                createdAt: dayKey(),
              })
            );
          nextTasks = capToday([...createdTasks, ...nextTasks]);
        }

        const nextState = {
          ...safe,
          tasks: nextTasks,
          weeklyReviews: {
            ...(safe.weeklyReviews && typeof safe.weeklyReviews === "object" ? safe.weeklyReviews : {}),
            [weekKeyStr]: entry,
          },
        };

        const goalMsg = focusGoalText ? `، ورُبط الأسبوع بهدفك «${focusGoalText}»` : "";
        return commit(
          nextState,
          { tasks: safe.tasks, weeklyReviews: safe.weeklyReviews },
          `🗓️ تم اعتماد خطة الأسبوع وتثبيت العادة المحورية بنجاح${goalMsg}! أسبوع مبارك وموجّه.`,
          { badge: "خطة الأسبوع معتمدة ✓" }
        );
      }

      // ----------------------------------------------------------------------
      // 21. تفكيك مهمة عالقة ومحاربة التسويف
      // ----------------------------------------------------------------------
      case "breakdown_task": {
        const query = String(input.task_query || "").trim();
        const microStep = String(input.first_micro_step || "").trim();
        if (!query || !microStep) {
          return { ok: false, message: "يرجى تحديد المهمة والخطوة الأولى الصغيرة." };
        }

        const list = rows(safe.tasks);
        const task = list.find((t) => matchesText(t.text, query));
        const wantToday = input.send_to_today !== false;

        let nextTasks;
        if (task) {
          nextTasks = list.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  step: microStep,
                  today: wantToday ? true : t.today,
                  scheduled: wantToday ? false : t.scheduled,
                }
              : t
          );
        } else {
          const newTask = taskShape({
            id: uid(),
            text: query,
            step: microStep,
            today: wantToday,
            scheduled: !wantToday,
            quadrant: "q1",
            createdAt: dayKey(),
          });
          nextTasks = [newTask, ...list];
        }

        const finalTasks = wantToday ? capToday(nextTasks) : nextTasks;
        const nextState = { ...safe, tasks: finalTasks };

        return commit(
          nextState,
          { tasks: safe.tasks },
          `⚡ تم تفكيك المهمة وتثبيت خطوة البدء: «${microStep}» — جاهزة الآن في أهم مهام اليوم للبدء الفوري!`,
          { badge: "تفكيك التسويف ⚡" }
        );
      }

      default:
        return { ok: false, message: `الأداة ${name} غير معروفة.` };
    }
  } catch (error) {
    console.error(`Error executing tool ${name}:`, error);
    return { ok: false, message: `حدث خطأ تقني أثناء تنفيذ ${name}: ${error?.message || error}` };
  }
}
