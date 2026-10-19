/* --- الإيجنت: عقل يقرأ حالتك ويتصرّف عبر أفعالك المختبرة ----------------
 *  كل ما في هذا البوت قبل هذا الملف قواعد مكتوبة بيد: `parse.js` يطابق
 *  كلمات مفتاحية، و`insight.js` يرتّب ملاحظات بعتبات رقمية ثابتة. هذا يغطّي
 *  أغلب اليوم، بلا تكلفة ولا شبكة ولا انتظار — ولهذا يبقى هو الطريق
 *  الافتراضي ولا يستبدله هذا الملف.
 *
 *  ما لا تستطيعه القواعد مهما عُقّدت شيئان: فهم صياغة حرّة لم يتوقّعها
 *  كاتبها، وقراءة نصّ غير مهيكل (تقييمات المساء، مراجعات الأهداف، فوائد
 *  الكتب) واستخراج نمط منه. هذان بالضبط ما يحسنه نموذج اللغة، وهذا كل
 *  ما وُجد هذا الملف له.
 *
 *  ── ثلاث قواعد تحكم التصميم كله ──
 *
 *  **١) الإيجنت عقل لا يدان.** لا يكتب في الحالة مباشرة أبدًا. كل تغيير
 *  يمرّ عبر نفس دوال `actions.js` المختبَرة التي تستعملها الأزرار والجمل
 *  — فالنموذج يقرّر *أيّ* فعل، والفعل نفسه يبقى الكود المختبر ذاته. هذا
 *  يعني أن شيئًا لا يستطيع النموذج فعله لم يكن مستطاعًا أصلًا من الأزرار.
 *
 *  **٢) كل كتابة قابلة للتراجع.** كل فعل يُرجع `before`، وهذه تُجمَّع عبر
 *  خطوات الدور كلها ثم تُسلَّم لنفس زر «تراجع» الموجود. «الأقدم يفوز» في
 *  الدمج (`keepBefore`): ثلاث كتابات في دور واحد تُرجِع الحالة لما قبل
 *  الدور كلّه، لا لما قبل آخر خطوة فيه.
 *
 *  **٣) مطفأ بلا مفتاح، ويقول ذلك.** نفس عقد `voice.js` بالحرف: بلا
 *  `ANTHROPIC_API_KEY` الميزة مغلقة ويُقال ذلك صراحة — رسالة تُبتلع بصمت
 *  أسوأ من رسالة تُرفض بوضوح.
 *
 *  ── ما يغادر هذا الجهاز ──
 *  موجز يومك (الأرقام والعناوين، لا الأرشيف كاملًا) يُرسل إلى Anthropic مع
 *  كل سؤال. هذا هو الثمن الحقيقي للميزة إلى جانب التوكنز، ومذكور في
 *  `.env.example` كي لا يكون مفاجأة.
 * --------------------------------------------------------------------- */
import { CONFIG } from "./config.js";
import * as act from "./actions.js";
import { fold } from "./parse.js";
import { rows } from "../../src/state/life-state.mjs";

export class AgentError extends Error {}

/* ـــ نداء المساعد بالاسم ــــــــــــــــــــــــــــــــــــــــــــــــــ
   مدخل صريح لا بديل صامت. `parse.js` يبقى أول من يرى كل رسالة ويلتقط
   المعتاد مجانًا وفورًا وبلا إنترنت؛ هذا يُستدعى بالاسم وحده، لأن كل نداء
   هنا يكلّف توكنز، ولأن معرفة «متى أتكلّم مع نموذج» حقٌّ للمستخدم لا
   تفصيلة داخلية.

   تُرجع ما بعد الكلمة — وقد يكون فارغًا — أو `null` إن لم تكن الرسالة
   نداءً أصلًا. الفارغ جوابٌ مختلف عن «ليست نداءً»، ولهذا ليسا قيمة واحدة. */
export const AGENT_WORDS = ["مساعد", "ai"];
export function agentCall(raw) {
  const s = String(raw || "").replace(/^\//, "").trim();
  const at = s.search(/\s/);
  const head = fold(at < 0 ? s : s.slice(0, at));
  if (!AGENT_WORDS.includes(head)) return null;
  return at < 0 ? "" : s.slice(at + 1).trim();
}

/* نداء واحد قد يحتاج خطوات: النموذج يطلب أداة، نُنفّذها، يقرأ النتيجة،
   ثم يردّ. السقف يمنع حلقة لا تنتهي لو علق النموذج يستدعي أداة تُرفض. */
export const MAX_STEPS = 6;

/* مهلة النداء. سؤال عادي يرجع في ثوانٍ؛ بعد هذا الحدّ شيء ما معطّل،
   ونداء بلا مهلة هو بوت توقّف عن الردّ على كل شيء آخر. */
export const AGENT_TIMEOUT_MS = 60_000;

/* كم رسالة من المحادثة نحتفظ بها. الذاكرة في الذاكرة لا على القرص — مثل
   ناقل التراجع وناقل التأجيل تمامًا: سياق محادثة لا شيء مكتوب عن اليوم. */
export const HISTORY_KEEP = 8;

/* ====================================================================== *
 *  ١) الأدوات — يدا الإيجنت
 *
 *  كل أداة هنا سطر واحد في جدول، ومقابلها الوحيد دالة موجودة في
 *  `actions.js`. لإضافة قدرة جديدة للإيجنت: أضف سطرًا هنا وسطرًا في
 *  `RUN` أسفله — ولا شيء ثالث.
 * ====================================================================== */
export const TOOLS = [
  {
    name: "tick_habit",
    description:
      "سجّل عادة من روتين اليوم كمُنجزة. استعمل المعرّف (id) الظاهر في موجز اليوم. " +
      "إن كانت العادة لها حدّ أدنى وأنجز المستخدم النسخة الصغرى منها فقط، مرّر tiny=true.",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string", description: "معرّف العادة من الموجز" },
        tiny: { type: "boolean", description: "أُنجز الحدّ الأدنى فقط" },
      },
      required: ["id"],
    },
  },
  {
    name: "add_task",
    description:
      "أضف مهمة جديدة. today=true يجعلها من مهام اليوم الثلاث (السقف ثلاث، والرابعة تُرفض).",
    input_schema: {
      type: "object",
      properties: {
        label: { type: "string", description: "نص المهمة" },
        today: { type: "boolean", description: "من مهام اليوم الثلاث" },
      },
      required: ["label"],
    },
  },
  {
    name: "finish_task",
    description: "علّم مهمة قائمة كمُنجزة، بمعرّفها من الموجز.",
    input_schema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
  {
    name: "log_expense",
    description: "سجّل مصروفًا. المبلغ بالريال. back=عدد الأيام للخلف (0=اليوم، بحد أقصى 3).",
    input_schema: {
      type: "object",
      properties: {
        label: { type: "string", description: "على ماذا صُرف" },
        amount: { type: "number" },
        back: { type: "number" },
      },
      required: ["label", "amount"],
    },
  },
  {
    name: "log_income",
    description: "سجّل دخلًا. hours اختيارية وتُستعمل لحساب معدّل الساعة.",
    input_schema: {
      type: "object",
      properties: {
        label: { type: "string" },
        amount: { type: "number" },
        hours: { type: "number" },
        back: { type: "number" },
      },
      required: ["label", "amount"],
    },
  },
  {
    name: "drink_water",
    description: "سجّل أكوابًا من الماء شُربت.",
    input_schema: {
      type: "object",
      properties: { count: { type: "number", description: "عدد الأكواب" } },
      required: ["count"],
    },
  },
  {
    name: "log_reading",
    description: "سجّل صفحات قُرئت. bookId اختياري؛ بدونه تُسجَّل على الكتاب المقروء حاليًا.",
    input_schema: {
      type: "object",
      properties: {
        pages: { type: "number" },
        bookId: { type: "string" },
        back: { type: "number" },
      },
      required: ["pages"],
    },
  },
  {
    name: "log_focus",
    description: "سجّل دقائق تركيز تمّت بعيدًا عن الشاشة (جولة انتهت ولم تُسجَّل وقتها).",
    input_schema: {
      type: "object",
      properties: {
        minutes: { type: "number" },
        label: { type: "string", description: "على ماذا كان التركيز" },
        back: { type: "number" },
      },
      required: ["minutes"],
    },
  },
  {
    name: "move_goal",
    description:
      "حرّك عدّاد هدف رقمي. add=true يزيد بالمقدار المذكور، add=false يضبط القيمة على value مباشرة.",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string", description: "معرّف الهدف من الموجز" },
        value: { type: "number" },
        add: { type: "boolean" },
      },
      required: ["id", "value"],
    },
  },
  {
    name: "add_note",
    description:
      "سجّل فائدة من القراءة على الكتاب المقروء حاليًا — الجملة التي يستحق أن يتذكّرها بعد أسبوع.",
    input_schema: {
      type: "object",
      properties: {
        body: { type: "string" },
        bookId: { type: "string" },
      },
      required: ["body"],
    },
  },
  {
    name: "add_event",
    description:
      "أضف موعدًا للتقويم. day إمّا 'today' أو 'tomorrow' أو 'after' (بعد غد) " +
      "أو رقم يوم الأسبوع 0-6 (0=الأحد) فيقع على أقرب يوم قادم يحمله. " +
      "time اختيارية بصيغة HH:MM. لا يقبل تاريخًا كاملًا — اختر أقرب صيغة من هذه.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        day: {
          type: "string",
          description: "today أو tomorrow أو after أو رقم 0-6",
        },
        time: { type: "string", description: "HH:MM" },
      },
      required: ["title", "day"],
    },
  },
  {
    name: "reflect",
    description:
      "اكتب تقييم المساء: field='distraction' لما شتّته اليوم، أو field='fix' لما سيغيّره غدًا.",
    input_schema: {
      type: "object",
      properties: {
        field: { type: "string", enum: ["distraction", "fix"] },
        note: { type: "string" },
      },
      required: ["field", "note"],
    },
  },
];

/* المقابل الفعلي لكل أداة. لا منطق هنا — توجيه فقط، فالمنطق كله في
   `actions.js` حيث تختبره `tests/bot*.test.mjs` أصلًا. */
const RUN = {
  tick_habit: (s, a) => act.tickHabit(s, a.id, !!a.tiny),
  add_task: (s, a) => act.addTask(s, { label: a.label, today: !!a.today }),
  finish_task: (s, a) => act.finishTask(s, a.id),
  log_expense: (s, a) => act.addExpense(s, { label: a.label, amount: a.amount, back: a.back || 0 }),
  log_income: (s, a) =>
    act.addIncome(s, { label: a.label, amount: a.amount, hours: a.hours, back: a.back || 0 }),
  drink_water: (s, a) => act.drinkWater(s, a.count || 1),
  log_reading: (s, a) =>
    act.logReading(s, { pages: a.pages, bookId: a.bookId || null, back: a.back || 0 }),
  log_focus: (s, a) =>
    act.logFocus(s, { minutes: a.minutes, label: a.label || "", back: a.back || 0 }),
  move_goal: (s, a) => act.moveGoal(s, a.id, { value: a.value, add: !!a.add }),
  add_note: (s, a) => act.addNote(s, { body: a.body, bookId: a.bookId || null }),
  add_event: (s, a) => act.addEvent(s, { title: a.title, day: a.day, time: a.time || "" }),
  reflect: (s, a) => act.reflect(s, { field: a.field, note: a.note }),
};

/* تنفيذ أداة واحدة على حالة. يُرجع ما تُرجعه الدالة نفسها بالضبط — بما
   فيها `refused`، لأن الرفض جواب يستحق أن يصل للنموذج كي يشرحه للمستخدم
   بدل أن يدّعي نجاحًا لم يحدث. */
export function runTool(state, name, input) {
  const fn = RUN[name];
  if (!fn) return { refused: `أداة غير معروفة: ${name}` };
  try {
    return fn(state, input || {});
  } catch (e) {
    return { refused: `تعذّر تنفيذ ${name}: ${e?.message || e}` };
  }
}

/* دمج «ما قبل» عبر خطوات الدور. الأقدم يفوز: مفتاح كُتب في الخطوة الأولى
   لا تدهسه الخطوة الثالثة، وإلا أرجع التراجع الحالة لمنتصف الدور. */
export function keepBefore(acc, before) {
  const out = { ...acc };
  for (const [k, v] of Object.entries(before || {})) {
    if (!(k in out)) out[k] = v;
  }
  return out;
}

/* ====================================================================== *
 *  ٢) الموجز — عينا الإيجنت
 *
 *  ما يراه النموذج عن اليوم. مختصر عمدًا: كل سطر هنا توكنز تُدفع في كل
 *  رسالة، والأرشيف كاملًا ليس أذكى — هو أغلى فقط. المعرّفات مذكورة لأن
 *  الأدوات تحتاجها، وبدونها يصير النموذج قادرًا على الكلام لا على الفعل.
 * ====================================================================== */
export function stateBrief(state) {
  const day = act.dayAt(state);
  const L = [];
  const put = (s) => L.push(s);

  put(`اليوم: ${day.date}`);
  put(`الانضباط: ${day.pct}٪ (${day.habitsDone} من ${day.habitsAll} عادة)`);
  put(`الماء: ${day.water} من ${day.waterGoal} أكواب`);

  const open = day.openScored.slice(0, 12);
  put(
    open.length
      ? `عادات أساسية مفتوحة:\n${open
          .map((h) => `  - ${h.id} · ${h.label}${h.min ? ` (حدّ أدنى: ${h.min})` : ""}`)
          .join("\n")}`
      : "كل العادات الأساسية مسجّلة اليوم.",
  );

  const tasks = day.tasks.slice(0, 6);
  put(
    tasks.length
      ? `مهام اليوم:\n${tasks
          .map((t) => `  - ${t.id} · ${t.text}${t.done ? " [منجزة]" : ""}`)
          .join("\n")}`
      : "ما فيه مهام مختارة لليوم.",
  );

  put(`المال هذا الأسبوع: صُرف ${day.spentWeek} · دخل ${day.earnedWeek} · الرصيد ${day.balance}`);

  if (day.book) {
    put(`يقرأ الآن: ${day.book.title} (صفحة ${day.book.page || 0}) · اليوم ${day.readToday} صفحة من هدف ${day.readGoal}`);
  }
  if (day.notesDue) put(`فوائد تنتظر المراجعة: ${day.notesDue}`);

  /* أهداف الربع المفتوحة التي لها عدّاد رقمي — هي وحدها ما تستطيع
     `move_goal` تحريكه، فذكر غيرها يغري النموذج بأداة لا تنفع معه. */
  const goals = rows(state.goals)
    .filter((g) => !g.done && g.horizon === "quarter" && g.target > 0)
    .slice(0, 10);
  if (goals.length) {
    put(
      `أهداف الربع (عدّاد رقمي):\n${goals
        .map((g) => `  - ${g.id} · ${g.text} — ${g.current}/${g.target} ${g.unit || ""}`)
        .join("\n")}`,
    );
  }

  const run = state.focus?.run;
  if (run) put(`جولة تركيز قائمة الآن: ${run.phase} · ${run.planned} دقيقة`);

  return L.join("\n");
}

/* التعليمات. نبرة محدّدة عمدًا: هذا ليس مساعدًا عامًّا، هو مساعد رجل له
   نظام قائم — فالمطلوب منه الدقّة في أرقام النظام لا النصائح العامة. */
export function systemPrompt(state) {
  return [
    "أنت مساعد شخصي داخل تطبيق «2027 Life OS» — نظام إدارة حياة عربي يملكه مستخدم واحد.",
    "تتكلّم العربية دائمًا، بإيجاز ووضوح، بلا مقدمات ولا عبارات تحفيزية عامة.",
    "",
    "قواعد لا تُخالَف:",
    "- لا تدّعِ أنك سجّلت شيئًا إلا إذا استدعيت الأداة فعلًا ونجحت. إن رُفض الفعل، قل سبب الرفض كما جاءك.",
    "- لا تخترع رقمًا. كل رقم تقوله يجب أن يكون من الموجز أو من نتيجة أداة.",
    "- لا تستدعِ أداة كتابة إلا إذا طلب المستخدم ذلك صراحةً أو كان المقصود واضحًا بلا لبس. السؤال ليس أمرًا.",
    "- إن كان الطلب غامضًا (عادتان تشبهان ما ذكره مثلًا) اسأل سؤالًا واحدًا قصيرًا بدل التخمين.",
    "- السقوف جزء من النظام لا عقبة: ثلاث مهام لليوم، والرابعة تُرفض بسبب.",
    "",
    "موجز اليوم (مصدر كل رقم عندك):",
    stateBrief(state),
  ].join("\n");
}

/* ====================================================================== *
 *  ٣) النداء — الشيء الوحيد هنا الذي يغادر هذا الجهاز
 * ====================================================================== */
export function agentReady() {
  return !!CONFIG.aiKey;
}

async function callClaude({ system, messages }) {
  if (!agentReady()) {
    throw new AgentError(
      "المساعد الذكي مطفأ. ضع ANTHROPIC_API_KEY في services/telegram-bot/.env لتشغيله.",
    );
  }
  const stop = AbortSignal.timeout ? AbortSignal.timeout(AGENT_TIMEOUT_MS) : undefined;
  let res;
  try {
    res = await fetch(`${CONFIG.aiUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": CONFIG.aiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CONFIG.aiModel,
        max_tokens: CONFIG.aiMaxTokens,
        system,
        messages,
        tools: TOOLS,
      }),
      signal: stop,
    });
  } catch (e) {
    throw new AgentError(
      e?.name === "TimeoutError" ? "المساعد ما ردّ في الوقت." : "ما قدرت أصل لخدمة المساعد.",
    );
  }
  if (res.status === 401 || res.status === 403) {
    throw new AgentError("خدمة المساعد رفضت المفتاح. راجع ANTHROPIC_API_KEY.");
  }
  if (res.status === 429) {
    throw new AgentError("تجاوزت حدّ الطلبات على خدمة المساعد. جرّب بعد قليل.");
  }
  if (!res.ok) {
    let why = "";
    try {
      const body = await res.json();
      why = body?.error?.message ? ` — ${body.error.message}` : "";
    } catch {
      /* الحالة هي الرسالة */
    }
    throw new AgentError(`خدمة المساعد ردّت ${res.status}${why}.`);
  }
  try {
    return await res.json();
  } catch {
    throw new AgentError("جواب المساعد غير مفهوم.");
  }
}

/* النصّ من ردّ النموذج — الكتل النصّية وحدها، مدموجة. */
export const textOf = (reply) =>
  (reply?.content || [])
    .filter((b) => b?.type === "text" && typeof b.text === "string")
    .map((b) => b.text.trim())
    .filter(Boolean)
    .join("\n")
    .trim();

export const toolsOf = (reply) => (reply?.content || []).filter((b) => b?.type === "tool_use");

/* ====================================================================== *
 *  ٤) الدور: تفكير ثم تطبيق — وفصلهما ليس تنظيمًا بل صحّة
 *
 *  `withState` في lifeos-client.js ينادي دالة التغيير **تزامنيًا** داخل
 *  قفل القراءة-التعديل-الكتابة. ودور الإيجنت غير متزامن بطبعه: كل خطوة
 *  نداء شبكة. تمرير دالة غير متزامنة هناك يعني أن `out.next` تكون
 *  `undefined` فلا يُستدعى `postSync` إطلاقًا — أي كتابة تختفي بصمت، وهو
 *  أسوأ أنواع الفشل في هذا المشروع.
 *
 *  فالدور مرحلتان:
 *
 *  **١) `runAgent`** — يفكّر على *نسخة عمل* من الحالة. ينفّذ الأدوات عليها
 *  فعلًا كي يرى النموذج نتائج حقيقية لا مُتخيَّلة، لكنه لا يكتب شيئًا على
 *  القرص. مخرجه الحقيقي هو `plan`: ما استُدعي فعلًا وبأي ترتيب.
 *
 *  **٢) `applyPlan`** — يُعاد تشغيل تلك الخطة، تزامنيًا، على الحالة الطازجة
 *  داخل القفل. فإن تغيّر القرص أثناء تفكير النموذج (عادة أُشّرت من
 *  التطبيق مثلًا) فالرفض يأتي من الفعل نفسه على الحالة الحقيقية، لا على
 *  لقطة قديمة. النموذج يقرّر، والقفل هو من يطبّق.
 *
 *  `ask` مُحقونة لتُستبدل في الاختبار: الحلقة والأدوات والخطة كلها منطق
 *  يستحق اختبارًا، والشبكة وحدها ما لا يُختبر.
 * ====================================================================== */
export async function runAgent(state, text, { history = [], ask = callClaude } = {}) {
  const said = String(text || "").trim();
  if (!said) return { refused: "اكتب سؤالك بعد الكلمة." };

  const system = systemPrompt(state);
  const messages = [...history, { role: "user", content: said }];

  /* نسخة عمل: الأدوات تُنفَّذ عليها ليرى النموذج أثر فعله، ولا تُكتب. */
  let working = state;
  const plan = [];

  for (let step = 0; step < MAX_STEPS; step += 1) {
    const reply = await ask({ system, messages });
    const calls = toolsOf(reply);
    const say = textOf(reply);

    if (!calls.length) {
      return {
        kind: "agent",
        text: say || "ما عندي جواب لهذا.",
        plan,
        messages: [...messages, { role: "assistant", content: reply.content }],
      };
    }

    const results = [];
    for (const call of calls) {
      const out = runTool(working, call.name, call.input);
      if (out.refused) {
        results.push({
          type: "tool_result",
          tool_use_id: call.id,
          is_error: true,
          content: out.refused,
        });
        continue;
      }
      working = out.next || working;
      plan.push({ name: call.name, input: call.input || {} });
      results.push({
        type: "tool_result",
        tool_use_id: call.id,
        content: summarize(out),
      });
    }

    messages.push({ role: "assistant", content: reply.content });
    messages.push({ role: "user", content: results });
  }

  /* استنفد الخطوات وهو ما زال يستدعي أدوات. ما خُطّط له يُطبَّق ويُقال —
     ابتلاعه أسوأ من قول إن الدور لم يكتمل. */
  return {
    kind: "agent",
    text: plan.length
      ? `نفّذت ${plan.length} خطوة ثم أوقفت الدور — طال أكثر من اللازم.`
      : "الدور طال بلا نتيجة. جرّب صياغة أوضح.",
    plan,
    messages,
  };
}

/* تطبيق الخطة على الحالة الحقيقية، تزامنيًا، داخل القفل. تُمرَّر كما هي
   إلى `withState` في bot.js.

   ما يُرفض هنا لا يُبتلع: يُجمَع ويُقال مع ما نجح، لأن «سجّلت لك ثلاثة»
   حين نجح اثنان فقط هي الكذبة الوحيدة التي لا يغفرها نظام محاسبة.

   **ما سقط من الخطة اسمه `skipped` لا `refused`، والفرق ليس تسمية.**
   `refused` في هذا البوت عقدٌ محدّد: سلسلة نصّية تعني «لم يحدث شيء، قُل
   هذا». و`apply()` يفحصها بـ `if (out.refused)` — ومصفوفة فارغة صادقة في
   جافاسكربت، فدورٌ نجح كاملًا كان يخرج ردًّا نصّه «⚠️ » وحدها بينما
   الكتابة قد وقعت على القرص فعلًا. اسمان مختلفان لمعنيين مختلفين. */
export function applyPlan(state, plan) {
  const steps = Array.isArray(plan) ? plan : [];
  if (!steps.length) return { refused: "ما فيه شي أنفّذه." };

  let next = state;
  let before = null;
  const done = [];
  const skipped = [];

  for (const step of steps) {
    const out = runTool(next, step.name, step.input);
    if (out.refused) {
      skipped.push(out.refused);
      continue;
    }
    next = out.next || next;
    if (out.before) before = keepBefore(before || {}, out.before);
    done.push(summarize(out));
  }

  /* لا شيء طُبّق: يُسلَّم كرفض نصّي واحد ليمرّ على نفس `apply()` بلا
     حالة خاصة — فالرفض في هذا البوت سلسلة نصّية دائمًا. */
  if (!done.length) {
    return { refused: skipped.join(" · ") || "ما نفّذت شيئًا." };
  }
  return { kind: "agent", next, before, done, skipped };
}

/* ما يُعاد للنموذج بعد كل فعل: سطر واحد يصف ما صار فعلًا، لا الحالة كلها.
   النموذج لا يحتاج الصفّ كاملًا ليقول «تم» — يحتاج أن يعرف أنه تم. */
function summarize(out) {
  const bits = [`تم: ${out.kind}`];
  if (out.row?.text) bits.push(out.row.text);
  if (out.row?.label) bits.push(out.row.label);
  if (out.habit?.label) bits.push(out.habit.label);
  if (typeof out.pct === "number") bits.push(`الانضباط صار ${out.pct}٪`);
  if (typeof out.count === "number") bits.push(`الأكواب صارت ${out.count}`);
  if (typeof out.balance === "number") bits.push(`الرصيد ${out.balance}`);
  if (out.capped) bits.push("السقف ثلاث مهام لليوم، فنزلت للمصفوفة بدلها");
  if (out.goal?.text) bits.push(`${out.goal.text}: ${out.goal.current}/${out.goal.target}`);
  return bits.join(" · ");
}
