import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Bot,
  Plus,
  Trash2,
  Send,
  Clock,
  Droplets,
  ListChecks,
  MessageSquare,
  Sunrise,
  Moon,
  Power,
  Sparkles,
  CalendarRange,
  CalendarClock,
  AlarmClock,
  Repeat,
  Filter,
  BellOff,
  Lightbulb,
  BookOpen,
  X,
} from "lucide-react";
import {
  T,
  Card,
  Btn,
  Field,
  Badge,
  Checkbox,
  TimeField,
  NumStep,
  DOW_AR,
  AR_MONTHS,
  arCount,
  minWord,
  prettyTime,
  whenWord,
  useUndo,
} from "../components/life-shared.jsx";
import {
  botShape,
  reminderShape,
  REMINDER_REPEATS,
  repeatMeta,
  DOM_MIN,
  DOM_MAX,
  GATES,
  gateMeta,
  gateOf,
  nextFireOf,
  REMINDER_IDEAS,
  planDay,
  nextInPlan,
  onDay,
  rows,
  REMINDER_CAP,
  REMINDER_MAX,
  WATER_EVERY_MIN,
  WATER_EVERY_MAX,
  PRAYER_BEFORE_MIN,
  PRAYER_BEFORE_MAX,
  BLOCK_AFTER_MIN,
  BLOCK_AFTER_MAX,
  EVENT_BEFORE_MIN,
  EVENT_BEFORE_MAX,
  SNOOZE_MIN,
  SNOOZE_MAX,
  eventsIn,
  minsIn,
  logicalNow,
  dayKey,
  BOT_API,
  BOT_PORT,
  dueNotes,
  countNotes,
  REVIEW_STEPS,
} from "../state/life-state.mjs";
import { prayerTimes, PRAYER_ROWS, blockTimes, BLOCK_ANCHORS } from "../utils/prayer-times.mjs";
import { api } from "../utils/life-storage.mjs";

/* ==================================================================== *
 *  MODULE — the Telegram bot's control hub
 *
 *  The bot is a separate process. This screen is not a remote control for
 *  it and must not become one: everything it changes is `state.bot`, saved
 *  the way every other screen saves, and the bot reads that off the disk and
 *  re-arms itself. There is no command channel, no queue and no second copy
 *  of the schedule — which is why a schedule edited here while the bot is
 *  switched off is still the schedule when it comes back up.
 *
 *  The one thing that *is* live is the health strip, and it is live because
 *  it cannot be anything else: «هل البوت شغّال الآن؟» is a question about a
 *  process, and no amount of state on disk can answer it. So the bot opens a
 *  loopback listener of its own and this polls it — read-only, except for
 *  the test ping, which exists so the whole chain can be proved in one tap.
 *
 *  Every block below takes what it draws as props and keeps nothing, so
 *  reordering the screen is moving a line.
 * ==================================================================== */

/* How often the health strip asks. Ten seconds is slow enough to be free and
   fast enough that «شغّلته للتو» shows up before you go looking for why it
   did not. It stops entirely while the tab is hidden: a background tab
   polling a local server forever is the kind of thing that makes a laptop
   warm for no reason. */
const HEALTH_EVERY = 10000;

/* --- the live strip ---------------------------------------------------- */
export function BotStatusCard({ health, checking, onPing, pinging, pinged }) {
  const up = health && health.ok;
  const tint = up ? T.primary : checking ? T.faint : T.danger;
  return (
    <Card className="p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-2xl border"
            style={{ borderColor: `${tint}45`, background: `${tint}16`, color: tint }}
          >
            <Bot size={20} strokeWidth={1.9} />
          </span>
          <div>
            <h3 className="text-[17px] font-extrabold" style={{ color: T.ctaLift }}>
              حالة البوت
            </h3>
            <p className="mt-1 text-[12.5px] font-bold" style={{ color: tint }}>
              {up
                ? "متصل ويستقبل"
                : checking
                  ? "أتحقّق…"
                  : "متوقّف — شغّله من الحاسب"}
            </p>
          </div>
        </div>

        <Btn
          variant="default"
          size="sm"
          onClick={onPing}
          disabled={!up || pinging}
          className="shrink-0"
        >
          <Send size={14} strokeWidth={2.4} />
          {pinging ? "أرسل…" : "رسالة تجريبية"}
        </Btn>
      </div>

      {/* The facts, flat. Each one is the answer to a different «لماذا لا
          يعمل؟», which is why they are listed rather than summarised. */}
      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Fact label="المنفذ" value={String(BOT_PORT)} ltr />
        <Fact label="الحساب المعتمد" value={up ? health.chat : "—"} ltr />
        <Fact
          label="تذكيرات مسلّحة اليوم"
          value={up ? String(health.armed ?? 0) : "—"}
        />
        <Fact
          label="يعمل منذ"
          value={up && health.since ? prettyTime(clockOf(health.since)) : "—"}
        />
      </div>

      {pinged && (
        <p
          className="mt-4 rounded-xl border px-4 py-2.5 text-[12px]"
          style={{ borderColor: `${T.primary}45`, background: `${T.primary}12`, color: T.primary }}
        >
          {pinged === true ? "وصلت — افتح تيليجرام." : pinged}
        </p>
      )}

      {!up && !checking && (
        <p className="mt-4 text-[11.5px] leading-relaxed" style={{ color: T.faint }}>
          البوت خدمة مستقلّة تعمل على هذا الجهاز. شغّلها بـ{" "}
          <span dir="ltr" className="font-mono">
            npm run bot
          </span>{" "}
          أو أعد تشغيل الحاسب — لها اختصار في بدء التشغيل. تعديلاتك هنا محفوظة
          وتُطبَّق أول ما يعود.
        </p>
      )}
    </Card>
  );
}

/* --- the second live thing --------------------------------------------- *
 *  The health strip above is "the one live thing" this screen was built
 *  with, because the question it answers — «هل البوت شغّال؟» — is about a
 *  process, and nothing on disk can answer it. A live conversation is a
 *  second question of the same shape: «ماذا سيفعل النموذج بهذه الجملة؟» is
 *  not a fact `state.bot` can hold either, and it still refuses to become a
 *  command channel for the schedule above — it goes through
 *  `local-sync-server.js`'s own `/ai`, which writes through `/sync` like
 *  every other change in this app, not through a wire to the bot process.
 *
 *  Nothing here is `state`. The transcript lives in this component's own
 *  memory — leaving the screen loses it, exactly like the data-health
 *  panel's own scratch state — because a dialogue is not a fact about the
 *  day the way a habit or a task is.
 * ------------------------------------------------------------------------ */
const AI_TRANSCRIPT_MAX = 60;

export function AssistantChatCard() {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setDraft("");
    setMessages((m) => [...m, { role: "user", text }].slice(-AI_TRANSCRIPT_MAX));
    setSending(true);
    try {
      const res = await fetch(api("/ai"), {
        method: "POST",
        headers: { "content-type": "application/json", "x-local-sync": "1" },
        body: JSON.stringify({ message: text }),
      });
      const body = await res.json().catch(() => null);
      const reply =
        body && typeof body.text === "string" && body.text
          ? body.text
          : "⚠️ جواب غير مفهوم من المساعد.";
      setMessages((m) => [...m, { role: "assistant", text: reply }].slice(-AI_TRANSCRIPT_MAX));
    } catch {
      setMessages((m) =>
        [...m, { role: "assistant", text: "⚠️ ما قدرت أصل للخادم المحلي." }].slice(
          -AI_TRANSCRIPT_MAX,
        ),
      );
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setMessages([]);
    fetch(api("/ai"), {
      method: "POST",
      headers: { "content-type": "application/json", "x-local-sync": "1" },
      body: JSON.stringify({ reset: true }),
    }).catch(() => {});
  };

  return (
    <Card className="p-6 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-2xl border"
            style={{ borderColor: `${T.ctaLift}45`, background: `${T.ctaLift}16`, color: T.ctaLift }}
          >
            <Sparkles size={19} strokeWidth={1.9} />
          </span>
          <div>
            <h3 className="text-[17px] font-extrabold" style={{ color: T.ctaLift }}>
              تحدّث مع المساعد
            </h3>
            <p className="mt-0.5 text-[11.5px] leading-relaxed" style={{ color: T.faint }}>
              يقرأ حالتك ويقدر يسجّل عنك — بلا مغادرة هذه الشاشة
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={reset}
            className="shrink-0 text-[11px] font-bold"
            style={{ color: T.faint }}
          >
            محادثة جديدة
          </button>
        )}
      </div>

      <div
        ref={listRef}
        className="los-scroll mt-4 max-h-72 space-y-2.5 overflow-y-auto rounded-xl border p-3"
        style={{ borderColor: T.border, background: "rgba(0,0,0,0.15)" }}
      >
        {messages.length === 0 ? (
          <p className="py-7 text-center text-[11.5px] leading-relaxed" style={{ color: T.faint }}>
            اكتب له أي شيء — «سجّل كوبين ماء» أو «وش باقي علي اليوم؟»
          </p>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
              <div
                className="max-w-[85%] whitespace-pre-wrap rounded-2xl border px-3.5 py-2.5 text-[12.5px] leading-relaxed"
                style={{
                  color: T.fg,
                  borderColor: m.role === "user" ? T.border : `${T.primary}33`,
                  background: m.role === "user" ? "rgba(255,255,255,0.05)" : `${T.primary}14`,
                }}
              >
                {m.text}
              </div>
            </div>
          ))
        )}
        {sending && (
          <div className="flex justify-end">
            <div
              className="rounded-2xl border px-3.5 py-2.5 text-[12px]"
              style={{ color: T.faint, borderColor: T.border }}
            >
              يكتب…
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <Field
          as="textarea"
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="اكتب رسالتك…"
          className="flex-1 resize-none"
        />
        <Btn variant="default" onClick={send} disabled={sending || !draft.trim()} className="shrink-0">
          <Send size={14} strokeWidth={2.4} />
        </Btn>
      </div>
    </Card>
  );
}

/* --- the one door to it, on every screen -------------------------------- *
 *  The chat itself has one home (`AssistantChatCard`, above) and this is
 *  the only place that renders it — a floating button mounted once in the
 *  shell, because asking the assistant something is not a fact that
 *  belongs to «بوت تيليجرام» any more than to «الجامعة» or «اليوم». Left
 *  side, clear of the phone tab bar and the desktop sidebar both, which
 *  sits at the opposite edge. Closed by default: a panel that reopens over
 *  every screen you land on is the nagging «اليوم» already refuses to be. */
export function AssistantFab() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "أغلق المساعد" : "افتح المساعد"}
        aria-expanded={open}
        className="los-raise fixed left-4 z-[61] flex h-14 w-14 items-center justify-center rounded-full border transition-transform active:scale-95"
        style={{
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 96px)",
          borderColor: `${T.cta}80`,
          backgroundImage: `linear-gradient(135deg, ${T.cta}, ${T.ctaLift})`,
          boxShadow: `0 10px 30px -8px ${T.cta}99`,
        }}
      >
        {open ? (
          <X size={22} color="#fff" strokeWidth={2.4} />
        ) : (
          <Sparkles size={22} color="#fff" strokeWidth={2.2} />
        )}
      </button>
      {open && (
        <div
          className="los-in fixed inset-x-3 z-[60] sm:inset-x-auto sm:left-4 sm:w-[380px]"
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 164px)",
            maxHeight: "min(70vh, 560px)",
            overflowY: "auto",
          }}
        >
          <AssistantChatCard />
        </div>
      )}
    </>
  );
}

function Fact({ label, value, ltr }) {
  return (
    <div
      className="rounded-xl border px-3.5 py-2.5"
      style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
    >
      <p className="text-[10.5px]" style={{ color: T.faint }}>
        {label}
      </p>
      <p
        className="mt-1 truncate text-[13px] font-extrabold tabular-nums"
        dir={ltr ? "ltr" : undefined}
        style={{ color: T.fg, textAlign: ltr ? "left" : undefined }}
      >
        {value}
      </p>
    </div>
  );
}

/* A moment as "HH:MM", so `prettyTime` can read it. Milliseconds or a
   `Date` — `new Date()` takes either, which is why the next-fire line uses
   this one instead of a second copy of the same two `padStart`s. */
const clockOf = (ms) => {
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

/* --- the two briefs ---------------------------------------------------- */
export function BriefTimesCard({ bot, onPatch }) {
  const briefs = [
    {
      key: "morning",
      icon: Sunrise,
      tint: T.accent,
      title: "موجز الصباح",
      line: "الصلوات، أهم ثلاث مهام، وعبارة اليوم.",
    },
    {
      key: "evening",
      icon: Moon,
      tint: T.violet,
      title: "إقفال المساء",
      line: "جرد ما أُنجز، وأزرار لما بقي.",
    },
  ];
  return (
    <Card className="p-6 sm:p-7">
      <h3 className="text-[17px] font-extrabold" style={{ color: T.ctaLift }}>
        الموجزان اليوميان
      </h3>
      <p className="mt-1.5 text-[11.5px]" style={{ color: T.faint }}>
        رسالتان في اليوم، بالساعة التي تختارها.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {briefs.map((b) => {
          const Icon = b.icon;
          const on = bot[`${b.key}On`];
          return (
            <div
              key={b.key}
              className="rounded-2xl border p-4"
              style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg border"
                  style={{
                    borderColor: `${b.tint}45`,
                    background: `${b.tint}16`,
                    color: b.tint,
                  }}
                >
                  <Icon size={15} strokeWidth={1.9} />
                </span>
                <span className="flex-1 text-[13.5px] font-bold">{b.title}</span>
                <Checkbox
                  checked={on}
                  onToggle={() => onPatch({ [`${b.key}On`]: !on })}
                  size="sm"
                />
              </div>
              <p className="mt-2 text-[11px] leading-relaxed" style={{ color: T.faint }}>
                {b.line}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <TimeField
                  value={bot[`${b.key}At`]}
                  onChange={(v) => onPatch({ [`${b.key}At`]: v })}
                  aria-label={`وقت ${b.title}`}
                  className="max-w-[140px]"
                />
                <span className="text-[11.5px]" style={{ color: T.faint }}>
                  {prettyTime(bot[`${b.key}At`])}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* --- the three the app already knows how to answer --------------------- *
 *  Water, prayer and the task sweep are built in rather than three custom
 *  rows, because the bot writes their text from the state — «باقي ٤ أكواب»
 *  and «العصر بعد ١٥ دقيقة» are facts it looks up, not sentences the user
 *  has to keep accurate by hand. A custom reminder is a sentence; these are
 *  questions.
 * ---------------------------------------------------------------------- */
export function PresetRemindersCard({ bot, onPatch, books = [] }) {
  return (
    <Card className="p-6 sm:p-7">
      <h3 className="text-[17px] font-extrabold" style={{ color: T.ctaLift }}>
        تذكيرات يكتبها البوت بنفسه
      </h3>
      <p className="mt-1.5 text-[11.5px] leading-relaxed" style={{ color: T.faint }}>
        نصّها يُبنى من حالة يومك لحظة الإرسال — تعرف كم كوبًا بقي وأي صلاة
        قادمة، فلا تقول «لا تنسَ» بل تقول ما بقي فعلًا.
      </p>

      <div className="mt-5 space-y-3">
        {/* الماء */}
        <Preset
          icon={Droplets}
          tint={T.sky}
          title="شرب الماء"
          on={bot.water.on}
          onToggle={() => onPatch({ water: { ...bot.water, on: !bot.water.on } })}
          note={
            bot.water.on
              ? `كل ${bot.water.every} ${minWord(bot.water.every)}، من ${prettyTime(
                  bot.water.from,
                )} إلى ${prettyTime(bot.water.to)}`
              : "مطفأ"
          }
        >
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-[11.5px]" style={{ color: T.faint }}>
              كل
              <NumStep
                value={bot.water.every}
                onChange={(v) => onPatch({ water: { ...bot.water, every: v } })}
                min={WATER_EVERY_MIN}
                max={WATER_EVERY_MAX}
                step={15}
                unit="دقيقة"
                tint={T.sky}
              />
            </label>
            <label className="flex items-center gap-2 text-[11.5px]" style={{ color: T.faint }}>
              من
              <TimeField
                value={bot.water.from}
                onChange={(v) => onPatch({ water: { ...bot.water, from: v } })}
                aria-label="بداية نافذة تذكير الماء"
                className="max-w-[120px]"
              />
            </label>
            <label className="flex items-center gap-2 text-[11.5px]" style={{ color: T.faint }}>
              إلى
              <TimeField
                value={bot.water.to}
                onChange={(v) => onPatch({ water: { ...bot.water, to: v } })}
                aria-label="نهاية نافذة تذكير الماء"
                className="max-w-[120px]"
              />
            </label>
          </div>
          {/* The window is a field and not a hidden rule. A reminder that
              mysteriously stops at some hour is one you stop trusting the
              rest of the day too. */}
          <p className="mt-2 text-[10.5px]" style={{ color: T.faint }}>
            خارج هذه النافذة لا يُرسَل شيء — التذكير الذي يرنّ الثالثة فجرًا هو
            التذكير الذي تُطفئه كلّه.
          </p>
        </Preset>

        {/* قبل الأذان */}
        <Preset
          icon={Clock}
          tint={T.indigo}
          title="قبل الأذان"
          on={bot.prayer.on}
          onToggle={() => onPatch({ prayer: { ...bot.prayer, on: !bot.prayer.on } })}
          note={
            bot.prayer.on
              ? `قبل كل صلاة بـ${bot.prayer.before} ${minWord(bot.prayer.before)}`
              : "مطفأ"
          }
        >
          <label className="flex items-center gap-2 text-[11.5px]" style={{ color: T.faint }}>
            قبل الأذان بـ
            <NumStep
              value={bot.prayer.before}
              onChange={(v) => onPatch({ prayer: { ...bot.prayer, before: v } })}
              min={PRAYER_BEFORE_MIN}
              max={PRAYER_BEFORE_MAX}
              step={5}
              unit="دقيقة"
              tint={T.indigo}
            />
          </label>
          <p className="mt-2 text-[10.5px]" style={{ color: T.faint }}>
            الأوقات من نفس حساب المدينة الذي تقرؤه الشاشات — الشروق ليس صلاة
            فلا تنبيه له.
          </p>
        </Preset>

        {/* جرد المهام */}
        <Preset
          icon={ListChecks}
          tint={T.ember}
          title="جرد المهام المعلّقة"
          on={bot.tasks.on}
          onToggle={() => onPatch({ tasks: { ...bot.tasks, on: !bot.tasks.on } })}
          note={bot.tasks.on ? `يوميًا ${prettyTime(bot.tasks.at)}` : "مطفأ"}
        >
          <label className="flex items-center gap-2 text-[11.5px]" style={{ color: T.faint }}>
            الساعة
            <TimeField
              value={bot.tasks.at}
              onChange={(v) => onPatch({ tasks: { ...bot.tasks, at: v } })}
              aria-label="وقت جرد المهام"
              className="max-w-[120px]"
            />
          </label>
          <p className="mt-2 text-[10.5px]" style={{ color: T.faint }}>
            صامت إن لم يبقَ شيء — التذكير الذي يرنّ ليقول «لا شيء» هو الذي
            يعلّمك تجاهل البقية.
          </p>
        </Preset>

        {/* عادات البلوك — anchored to the prayers, never to the clock */}
        <Preset
          icon={Sunrise}
          tint={T.ember}
          title="عادات البلوك عند فتحه"
          on={bot.blocks.on}
          onToggle={() => onPatch({ blocks: { ...bot.blocks, on: !bot.blocks.on } })}
          note={
            bot.blocks.on
              ? `بعد فتح كل بلوك بـ${bot.blocks.after} ${minWord(bot.blocks.after)}`
              : "مطفأ"
          }
        >
          <label className="flex items-center gap-2 text-[11.5px]" style={{ color: T.faint }}>
            بعد فتح البلوك بـ
            <NumStep
              value={bot.blocks.after}
              onChange={(v) => onPatch({ blocks: { ...bot.blocks, after: v } })}
              min={BLOCK_AFTER_MIN}
              max={BLOCK_AFTER_MAX}
              step={5}
              unit="دقيقة"
              tint={T.ember}
            />
          </label>
          <p className="mt-2 text-[10.5px]" style={{ color: T.faint }}>
            روتينك يمشي بالصلوات لا بالساعة، فتذكير «بعد العصر» الساعة ٥:٠٠
            ثابتة يخطئ بأربعين دقيقة في مارس وبساعة في يونيو. هذا يصل حين يفتح
            البلوك فعلًا، ويحمل عاداته المفتوحة أزرارًا — <strong>وصامت إن لم
            يبقَ منها شيء</strong>.
          </p>
        </Preset>

        {/* المواعيد — the hour half of a warning whose other half is in days */}
        <Preset
          icon={CalendarClock}
          tint={T.indigo}
          title="قبل مواعيد اليوم"
          on={bot.events.on}
          onToggle={() => onPatch({ events: { ...bot.events, on: !bot.events.on } })}
          note={
            bot.events.on
              ? `قبل كل موعد بـ${bot.events.before} ${minWord(bot.events.before)}`
              : "مطفأ"
          }
        >
          <label className="flex items-center gap-2 text-[11.5px]" style={{ color: T.faint }}>
            قبل الموعد بـ
            <NumStep
              value={bot.events.before}
              onChange={(v) => onPatch({ events: { ...bot.events, before: v } })}
              min={EVENT_BEFORE_MIN}
              max={EVENT_BEFORE_MAX}
              step={15}
              unit="دقيقة"
              tint={T.indigo}
            />
          </label>
          <p className="mt-2 text-[10.5px]" style={{ color: T.faint }}>
            «التنبيه المسبق» في التقويم بالأيام — صحيح لاختبار، بلا فائدة لموعد
            الرابعة عصرًا. هذا هو النصف الآخر: المواعيد المؤقّتة في مربّع اليوم.
            وبلا ساعة لا تنبيه، لأن ما لا ساعة له لا يمكن التبكير عليه.
          </p>
        </Preset>

        {/* المدرّب — the one entry whose content is a judgement */}
        <Preset
          icon={Sparkles}
          tint={T.rose}
          title="المدرّب"
          on={bot.coach.on}
          onToggle={() => onPatch({ coach: { ...bot.coach, on: !bot.coach.on } })}
          note={bot.coach.on ? `يفحص يومك ${prettyTime(bot.coach.at)}` : "مطفأ"}
        >
          <label className="flex items-center gap-2 text-[11.5px]" style={{ color: T.faint }}>
            الساعة
            <TimeField
              value={bot.coach.at}
              onChange={(v) => onPatch({ coach: { ...bot.coach, at: v } })}
              aria-label="وقت فحص المدرّب"
              className="max-w-[120px]"
            />
          </label>
          {/* The silence is the feature, and it has to be said here or the
              first quiet day reads as a broken reminder. */}
          <p className="mt-2 text-[10.5px]" style={{ color: T.faint }}>
            يقرأ اليوم كاملًا — السلسلة، ساعة السقوط، المستحقّ، الماء، القراءة —
            ويرسل أهم ثلاث ملاحظات <strong>مع أزرارها</strong>. وفي اليوم الذي
            لا شيء فيه يستحق القول، لا يرسل شيئًا: الإشعار الذي يرنّ ليقول «كل
            شي تمام» هو الذي يعلّمك تجاهل الذي بعده.
          </p>
          <p className="mt-1.5 text-[10.5px]" style={{ color: T.faint }}>
            واطلبه في أي وقت من المحادثة بكلمة «المدرّب».
          </p>
        </Preset>

        {/* مراجعة الأسبوع */}
        <Preset
          icon={CalendarRange}
          tint={T.accent}
          title="مراجعة الأسبوع"
          on={bot.weekly.on}
          onToggle={() => onPatch({ weekly: { ...bot.weekly, on: !bot.weekly.on } })}
          note={
            bot.weekly.on
              ? `${DOW_AR[bot.weekly.dow]} ${prettyTime(bot.weekly.at)}`
              : "مطفأ"
          }
        >
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-[11.5px]" style={{ color: T.faint }}>
              الساعة
              <TimeField
                value={bot.weekly.at}
                onChange={(v) => onPatch({ weekly: { ...bot.weekly, at: v } })}
                aria-label="وقت مراجعة الأسبوع"
                className="max-w-[120px]"
              />
            </label>
          </div>
          {/* One day, picked the same way a custom reminder's days are: seven
              small buttons, because picking a weekday out of a select is
              three interactions and this is one. */}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {DOW_AR.map((name, i) => {
              const picked = bot.weekly.dow === i;
              return (
                <button
                  key={name}
                  onClick={() => onPatch({ weekly: { ...bot.weekly, dow: i } })}
                  aria-label={`${name}${picked ? " — مفعّل" : ""}`}
                  aria-pressed={picked}
                  className="rounded-lg border px-2 py-1 text-[10.5px] transition-colors"
                  style={{
                    borderColor: picked ? `${T.accent}4D` : T.border,
                    background: picked ? `${T.accent}1A` : "transparent",
                    color: picked ? T.accent : T.faint,
                  }}
                >
                  {name.slice(0, 3)}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[10.5px]" style={{ color: T.faint }}>
            الرسالة الوحيدة التي لا تتكلّم عن الآن: متوسط الانتظام، الأيام بدون
            تسجيل <strong>معدودة لا مُذوّبة في المتوسط</strong>، أثبت عادة
            وأضعفها، الصفحات، دقائق التركيز، المال، والمستحقّ الأسبوع القادم.
          </p>
        </Preset>

        {/* مراجعة الفوائد — the only reminder here that is not about today */}
        <Preset
          icon={BookOpen}
          tint={T.indigo}
          title="مراجعة الفوائد"
          on={bot.review.on}
          onToggle={() => onPatch({ review: { ...bot.review, on: !bot.review.on } })}
          note={
            bot.review.on
              ? `${prettyTime(bot.review.at)} · ${pointPhrase(dueNotes(books).length)} مستحقّة`
              : "مطفأ"
          }
        >
          <label className="flex items-center gap-2 text-[11.5px]" style={{ color: T.faint }}>
            الساعة
            <TimeField
              value={bot.review.at}
              onChange={(v) => onPatch({ review: { ...bot.review, at: v } })}
              aria-label="وقت مراجعة الفوائد"
              className="max-w-[120px]"
            />
          </label>
          <p className="mt-2 text-[10.5px]" style={{ color: T.faint }}>
            نقطة واحدة من كتاب قرأته، بصفحتها، <strong>بإشارة أولًا ثم كشف</strong> —
            لأن إعادة القراءة ليست استدعاء، والاستدعاء هو الذي يُبقي. تذكّرتها
            فتتباعد: <span dir="ltr">{REVIEW_STEPS.join(" · ")}</span> يومًا؛
            نسيتها فتعود غدًا.
          </p>
          <p className="mt-1.5 text-[10.5px]" style={{ color: T.faint }}>
            وفي الليلة التي لا نقطة فيها مستحقّة لا يُرسل شيئًا — وفي مكتبتك الآن{" "}
            {pointPhrase(countNotes(books))}. واطلبها في أي وقت بكلمة «راجع».
          </p>
        </Preset>
      </div>

      {/* The one setting that belongs to all of them at once. A nudge that
          cannot be deferred is a nudge you mute, and a muted reminder takes
          the rest of the schedule down with it — so «لاحقًا» sits under every
          unprompted message, and this is how long it means. */}
      <div
        className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3.5"
        style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
      >
        <AlarmClock size={15} strokeWidth={1.9} style={{ color: T.faint }} />
        <span className="text-[12px] font-bold">زرّ «لاحقًا» يؤجّل</span>
        <NumStep
          value={bot.snooze}
          onChange={(v) => onPatch({ snooze: v })}
          min={SNOOZE_MIN}
          max={SNOOZE_MAX}
          step={15}
          unit="دقيقة"
          tint={T.faint}
        />
        <p className="w-full text-[10.5px]" style={{ color: T.faint }}>
          ويُعاد بناء النصّ لحظة عودته، لا لحظة تأجيله — تذكير ماء أجّلته
          الحادية عشرة يقول ما بقي عند الثانية عشرة.
        </p>
      </div>
    </Card>
  );
}

function Preset({ icon: Icon, tint, title, on, onToggle, note, children }) {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        borderColor: on ? `${tint}3D` : T.border,
        background: on ? `${tint}0D` : "rgba(255,255,255,0.03)",
      }}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
          style={{ borderColor: `${tint}45`, background: `${tint}16`, color: tint }}
        >
          <Icon size={15} strokeWidth={1.9} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-bold">{title}</p>
          <p className="truncate text-[11px]" style={{ color: on ? tint : T.faint }}>
            {note}
          </p>
        </div>
        <Checkbox checked={on} onToggle={onToggle} size="sm" />
      </div>
      {on && <div className="mt-3.5 border-t pt-3.5" style={{ borderColor: T.border }}>{children}</div>}
    </div>
  );
}

/* --- the ones he writes ------------------------------------------------ *
 *  A row says three things now that it could not before: how often it comes
 *  back, on which day of the month when that is the answer, and the
 *  condition that buys its silence. The add form still asks for two.
 *
 *  That is deliberate: a reminder is written in one breath — a sentence and
 *  an hour — and the rest is refined on the row itself, where the day chips
 *  already lived. An add form that asks five questions is a form he abandons
 *  and a list that stays empty.
 * ---------------------------------------------------------------------- */
export function CustomRemindersCard({ bot, state, onAdd, onPatchOne, onRemove }) {
  const [text, setText] = useState("");
  const [at, setAt] = useState("09:00");
  const list = bot.customs;
  const full = list.length >= REMINDER_CAP;

  const add = () => {
    const t = text.trim();
    if (!t || full) return;
    onAdd({ text: t, at });
    setText("");
  };

  return (
    <Card className="p-6 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[17px] font-extrabold" style={{ color: T.ctaLift }}>
            تذكيرات بنصّك
          </h3>
          <p className="mt-1.5 text-[11.5px]" style={{ color: T.faint }}>
            جملة وساعة، ثم اختر: كل يوم، أيامًا من الأسبوع، أو يومًا من الشهر —
            وبشرطٍ يُسكته إن كان الشي مُنجزًا أصلًا.
          </p>
        </div>
        <Badge tint={full ? T.danger : T.faint}>
          {list.length} / {REMINDER_CAP}
        </Badge>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Field
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, REMINDER_MAX))}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="نصّ التذكير — مثال: راجع مصروف اليوم"
          disabled={full}
        />
        <TimeField
          value={at}
          onChange={setAt}
          aria-label="وقت التذكير الجديد"
          className="sm:max-w-[140px]"
        />
        <Btn variant="default" onClick={add} disabled={full} className="shrink-0">
          <Plus size={15} strokeWidth={3} /> إضافة
        </Btn>
      </div>
      {full && (
        <p className="mt-2 text-[11px]" style={{ color: T.danger }}>
          بلغت {REMINDER_CAP} تذكيرات — والحد مقصود. احذف واحدًا قبل إضافة غيره.
        </p>
      )}

      <IdeaChips list={list} full={full} onAdd={onAdd} />

      <div className="mt-5 space-y-2.5">
        {list.length === 0 ? (
          <p
            className="rounded-xl border border-dashed py-8 text-center text-[11.5px]"
            style={{ borderColor: T.border, color: T.faint }}
          >
            لا تذكيرات بنصّك بعد
          </p>
        ) : (
          list.map((r) => (
            <ReminderRow
              key={r.id}
              r={r}
              state={state}
              onPatch={(part) => onPatchOne(r.id, part)}
              onRemove={() => onRemove(r.id)}
            />
          ))
        )}
      </div>
    </Card>
  );
}

/* --- one reminder, and everything it can be ---------------------------- */
export function ReminderRow({ r, state, onPatch, onRemove }) {
  const gate = gateOf(state, r.only);
  const next = nextFireOf(r);
  /* A condition already satisfied means this reminder would stay quiet if
     its hour arrived this minute. Said out loud, because a reminder that is
     silent for a good reason and one that is broken look identical from the
     outside — and the whole value of a condition is trusting it. */
  const quiet = r.on && r.only !== "always" && !gate.pass;

  return (
    <div
      className="group rounded-xl border px-4 py-3"
      style={{
        borderColor: r.on ? `${T.violet}33` : T.border,
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <div className="flex items-center gap-3">
        <Checkbox
          checked={r.on}
          onToggle={() => onPatch({ on: !r.on })}
          size="sm"
          tint={T.violet}
        />
        <span className="min-w-0 flex-1 truncate text-[13px]">{r.text}</span>
        <span
          className="shrink-0 text-[11.5px] font-bold tabular-nums"
          style={{ color: T.violet }}
        >
          {prettyTime(r.at)}
        </span>
        <button
          onClick={onRemove}
          aria-label={`حذف ${r.text}`}
          className="shrink-0 rounded p-1 text-white/25 opacity-40 transition-all hover:text-red-400 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* How often. Three buttons and not a select: this is the field that
          decides what the line under it even asks, so it has to be readable
          without opening anything. */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 ps-8">
        <Repeat size={12} strokeWidth={2} style={{ color: T.faint }} />
        {REMINDER_REPEATS.map((k) => {
          const picked = r.repeat === k.id;
          return (
            <button
              key={k.id}
              onClick={() => onPatch({ repeat: k.id })}
              aria-pressed={picked}
              title={k.note}
              className="rounded-lg border px-2.5 py-1 text-[10.5px] transition-colors"
              style={{
                borderColor: picked ? `${T.violet}4D` : T.border,
                background: picked ? `${T.violet}1A` : "transparent",
                color: picked ? T.violet : T.faint,
                fontWeight: picked ? 700 : 400,
              }}
            >
              {k.label}
            </button>
          );
        })}
      </div>

      {/* Seven small buttons rather than a dropdown: picking «الأحد
          والثلاثاء» out of a select is three interactions, and this is one
          each. Shown only for the repeat that reads them — a day chip beside
          a monthly reminder is a control that does nothing. */}
      {r.repeat === "week" && (
        <div className="mt-2 flex flex-wrap gap-1.5 ps-8">
          {DOW_AR.map((name, i) => {
            const picked = onDay(r, i);
            return (
              <button
                key={name}
                onClick={() => onPatch({ days: toggleDay(r.days, i) })}
                aria-label={`${name}${picked ? " — مفعّل" : ""}`}
                aria-pressed={picked}
                className="rounded-lg border px-2 py-1 text-[10.5px] transition-colors"
                style={{
                  borderColor: picked ? `${T.violet}4D` : T.border,
                  background: picked ? `${T.violet}1A` : "transparent",
                  color: picked ? T.violet : T.faint,
                }}
              >
                {/* The definite article dropped, not the word cut short:
                    three characters of «الأحد» and three of «الأربعاء» are
                    the same three, so the row carried two chips nobody
                    could tell apart. */}
                {name.replace(/^ال/, "")}
              </button>
            );
          })}
        </div>
      )}

      {r.repeat === "month" && (
        <div className="mt-2 flex flex-wrap items-center gap-3 ps-8">
          <span className="text-[11px]" style={{ color: T.faint }}>
            يوم من الشهر
          </span>
          <div className="w-[150px]">
            <NumStep
              value={r.dom}
              onChange={(n) => onPatch({ dom: n })}
              min={DOM_MIN}
              max={DOM_MAX}
              unit=""
              tint={T.violet}
            />
          </div>
          {r.dom > 28 && (
            <span className="text-[10.5px]" style={{ color: T.muted }}>
              الشهر الأقصر يأخذه في آخر يوم منه — لا يُتخطّى شهر.
            </span>
          )}
        </div>
      )}

      {/* The condition. A select here and buttons above because this one is
          six answers and is read far less often than it is set. */}
      <div className="mt-2.5 flex flex-wrap items-center gap-2 ps-8">
        <Filter size={12} strokeWidth={2} style={{ color: T.faint }} />
        {/* The options carry their own solid background: an option list
            inherits the page's transparent one and renders white-on-white in
            Chrome otherwise — the same note the focus desk's select keeps. */}
        <select
          value={r.only}
          onChange={(e) => onPatch({ only: e.target.value })}
          aria-label={`شرط إرسال: ${r.text}`}
          className="rounded-lg border bg-transparent px-2 py-1 text-[10.5px] outline-none transition-colors focus:border-white/30"
          style={{
            borderColor: r.only === "always" ? T.border : `${T.sky}4D`,
            color: r.only === "always" ? T.faint : T.sky,
          }}
        >
          {GATES.map((g) => (
            <option key={g.id} value={g.id} style={{ background: T.cardSolid }}>
              {g.label}
            </option>
          ))}
        </select>
        <span className="text-[10.5px]" style={{ color: T.faint }}>
          {gateMeta(r.only).note}
        </span>
      </div>

      {/* When it actually comes back. A monthly reminder whose next firing
          cannot be seen is one that cannot be trusted — «يوم ٣١» read in
          February says nothing about whether February was understood. */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 ps-8">
        <span className="text-[10.5px]" style={{ color: T.faint }}>
          {r.on
            ? next
              ? `القادم: ${nextWords(next)} · ${prettyTime(clockOf(next))}`
              : "لا موعد قادم"
            : "موقوف"}
        </span>
        {quiet && (
          <span
            className="inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px]"
            style={{ borderColor: `${T.primary}40`, background: `${T.primary}12`, color: T.primary }}
          >
            <BellOff size={10} strokeWidth={2.2} /> صامت الآن — الشرط مُستوفى
          </span>
        )}
      </div>
    </div>
  );
}

/* The near days in words and the far ones as a date. `whenWord` already owns
   «اليوم» and «غدًا», so they are not written a second time here — what it
   cannot do is the one thing a monthly reminder needs, which is to say
   «٢٨ أكتوبر» instead of «بعد ١٦ يومًا». A bill is checked against a date. */
export const nextWords = (when) => {
  const today = new Date();
  const days = Math.round(
    (new Date(when.getFullYear(), when.getMonth(), when.getDate()) -
      new Date(today.getFullYear(), today.getMonth(), today.getDate())) /
      86400000,
  );
  if (days <= 2) return whenWord(dayKey(when));
  if (days < 7) return DOW_AR[when.getDay()];
  return `${when.getDate()} ${AR_MONTHS[when.getMonth()]}`;
};

/* --- the ones worth having, offered rather than hidden ----------------- *
 *  An empty list with a text box above it tells nobody that a reminder can
 *  be monthly, or that it can be the kind that stays quiet when the thing is
 *  already done. One tap each, and an idea already taken drops out of the
 *  row — a suggestion still offered after it was accepted is a suggestion
 *  that duplicates itself.
 * ---------------------------------------------------------------------- */
export function IdeaChips({ list, full, onAdd }) {
  const taken = new Set(rows(list).map((r) => r.text));
  const left = REMINDER_IDEAS.filter((i) => !taken.has(i.text));
  if (full || !left.length) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center gap-1.5">
      <Lightbulb size={12} strokeWidth={2} style={{ color: T.faint }} />
      <span className="me-1 text-[10.5px]" style={{ color: T.faint }}>
        جاهزة بلمسة
      </span>
      {left.map((i) => (
        <button
          key={i.text}
          onClick={() => onAdd(i)}
          className="los-raise rounded-lg border px-2.5 py-1 text-[10.5px]"
          style={{ borderColor: T.border, background: "rgba(255,255,255,0.04)", color: T.muted }}
          title={`${repeatMeta(i.repeat).label} · ${prettyTime(i.at)}`}
        >
          + {i.text}
        </button>
      ))}
    </div>
  );
}

/* Flipping one day. An empty list means "every day", so the first click on a
   full week has to become the six that are left rather than the one that was
   pressed — and clearing the last one goes back to empty instead of leaving
   a reminder with no day it ever fires on. */
export function toggleDay(days, i) {
  const all = Array.isArray(days) && days.length ? days : [0, 1, 2, 3, 4, 5, 6];
  const next = all.includes(i) ? all.filter((d) => d !== i) : [...all, i].sort((a, b) => a - b);
  return next.length === 0 || next.length === 7 ? [] : next;
}

/* --- what the day will actually look like ------------------------------ *
 *  Every card above says what it set; this says what the sum of them does.
 *  It is the same `planDay` the bot arms from, which is the whole reason it
 *  lives in the state layer — a preview computed separately would eventually
 *  disagree with the evening it is previewing.
 * ---------------------------------------------------------------------- */
export function TodayPlanCard({ bot, state }) {
  const now = new Date();
  const prayers = state.place && Number.isFinite(state.place.lat)
    ? prayerTimes(state.place, now)
    : null;
  const hasTasks = rows(state.tasks).some((t) => t.today && !t.done);
  /* The blocks and today's timed entries, exactly as the bot computes them.
     Two readings of one schedule would eventually disagree about the same
     evening, which is the whole reason `planDay` lives in the state layer —
     so anything new it takes has to be passed from both sides. */
  const blocks = state.place && Number.isFinite(state.place.lat)
    ? blockTimes(state.place, now).map((b) => ({
        id: b.id,
        at: b.when.getHours() + b.when.getMinutes() / 60,
      }))
    : null;
  const today = dayKey(logicalNow(now));
  const events = [];
  for (const [, list] of eventsIn(rows(state.events), today, today)) {
    for (const { ev } of list) {
      const at = minsIn(ev.time);
      if (at !== null) events.push({ id: ev.id, at: at / 60 });
    }
  }
  /* The whole day, not its weekday alone — `planDay` reads the date and the
     length of the month out of it for the monthly reminders, and a preview
     that passed less than the bot does is a preview that disagrees with the
     evening it is previewing. */
  const plan = planDay(bot, { date: now, prayers, hasTasks, blocks, events });
  const mins = now.getHours() * 60 + now.getMinutes();
  const next = nextInPlan(plan, mins);

  return (
    <Card className="p-6 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[17px] font-extrabold" style={{ color: T.ctaLift }}>
          رسائل اليوم
        </h3>
        <Badge tint={plan.length ? T.primary : T.faint}>{msgPhrase(plan.length)}</Badge>
      </div>

      {next ? (
        <p className="mt-3 text-[12.5px]" style={{ color: T.muted }}>
          القادمة: <b style={{ color: T.primary }}>{kindName(next, state)}</b> —{" "}
          {prettyTime(minsToClock(next.at))}
        </p>
      ) : (
        <p className="mt-3 text-[12.5px]" style={{ color: T.faint }}>
          لا شيء متبقٍّ اليوم.
        </p>
      )}

      {plan.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {plan.map((p, i) => {
            const past = p.at <= mins;
            return (
              <span
                key={`${p.kind}-${p.at}-${i}`}
                className="rounded-lg border px-2.5 py-1 text-[10.5px] tabular-nums"
                style={{
                  borderColor: past ? T.border : `${T.primary}3D`,
                  background: past ? "transparent" : `${T.primary}12`,
                  color: past ? T.faint : T.primary,
                  textDecorationLine: past ? "line-through" : "none",
                }}
              >
                {prettyTime(minsToClock(p.at))} · {kindName(p, state)}
              </span>
            );
          })}
        </div>
      )}
    </Card>
  );
}

const minsToClock = (m) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/* The numeral is dropped for one and two, the same rule `daysPhrase` and
   `tasksPhrase` follow: Arabic's dual already carries the number, and
   «٢ رسالتان» reads as a translation rather than as a sentence. */
/* A book's points are «فوائد» and never «ملاحظات» — the bot's own wording,
   kept the same on the screen that schedules them. */
const POINT_FORMS = ["فائدة", "فائدتان", "فوائد", "فائدة"];
export const pointPhrase = (n) =>
  n === 0
    ? "لا فوائد"
    : n === 1
      ? "فائدة واحدة"
      : n === 2
        ? "فائدتان"
        : `${n} ${arCount(n, POINT_FORMS)}`;

const MSG_FORMS = ["رسالة", "رسالتان", "رسائل", "رسالة"];
export const msgPhrase = (n) =>
  n === 0 ? "لا رسائل" : n === 1 ? "رسالة واحدة" : n === 2 ? "رسالتان" : `${n} ${arCount(n, MSG_FORMS)}`;

function kindName(p, state) {
  if (p.kind === "morning") return "موجز الصباح";
  if (p.kind === "evening") return "إقفال المساء";
  if (p.kind === "water") return "الماء";
  if (p.kind === "tasks") return "جرد المهام";
  /* Named «فحص» and not «رسالة»: the timer fires, the day is read, and on a
     day with nothing wrong nothing is sent — so the plan below is a plan of
     checks, one of which may turn out to be silent. */
  if (p.kind === "coach") return "فحص المدرّب";
  if (p.kind === "weekly") return "مراجعة الأسبوع";
  /* «فحص» for the same reason the coach is: the timer fires, the shelf is
     read, and on an evening with nothing due nothing is sent. */
  if (p.kind === "review") return "فحص الفوائد";
  if (p.kind === "block") {
    const anchor = BLOCK_ANCHORS.find((b) => b.id === p.block);
    return anchor ? `عادات ${anchor.label}` : "عادات البلوك";
  }
  if (p.kind === "event") {
    const ev = rows(state.events).find((e) => e.id === p.id);
    return ev ? `موعد: ${ev.title.slice(0, 20)}` : "موعد";
  }
  if (p.kind === "prayer") {
    const row = PRAYER_ROWS.find((x) => x.id === p.prayer);
    return row ? `قبل ${row.label}` : "قبل الأذان";
  }
  const own = rows(state.bot?.customs).find((x) => x.id === p.id);
  if (!own) return "تذكير";
  /* A conditional reminder is armed like any other and may still say
     nothing, exactly as the coach's check may. The plan says so rather than
     promising a message that the condition will cancel. */
  return `${own.text.slice(0, 24)}${own.only && own.only !== "always" ? " · بشرط" : ""}`;
}

/* --- the vocabulary, on the desk --------------------------------------- *
 *  The grammar the bot understands is written in parse.js and nowhere a
 *  human looks. Printing it here is the difference between a feature he uses
 *  for a week and one he keeps — nobody remembers «دخل ٣٠٠ توصيل ٤ ساعات»
 *  without having read it once.
 * ---------------------------------------------------------------------- */
const PHRASES = [
  ["صرفت ٣٥ غداء", "مصروف، ويحدّث الرصيد"],
  ["دخل ١٥٠٠ استشارة", "دخل"],
  ["دخل ٣٠٠ توصيل ٤ ساعات", "دخل مع ساعاته، فيدخل في معدّل الساعة"],
  ["كاس ماء", "كوب على عدّاد اليوم"],
  ["تمت صلاة العصر", "تسجيل العادة التي تشبه الكلمات"],
  ["اليوم: راجع المحاسبة", "من مهام اليوم الثلاث"],
  ["قرأت ٢٠ صفحة", "يتقدّم الكتاب المعلَّم «أقرأه الآن»"],
  ["قرأت ١٠ صفحات من سيكولوجية المال", "الكتاب بالاسم — ولو ما كان على الرف يُضاف بضغطة"],
  ["فائدة المال حرية لا رفاهية", "تُحفظ على الكتاب بصفحتها، وترجع للمراجعة"],
  ["درس الكتاب …", "الجملة الواحدة التي يُلخّصه"],
  ["أضف كتاب … · ابدأ كتاب … · خلصت كتاب …", "الرف من الجوّال، مع النجوم بعد الإنهاء"],
  ["راجع", "نقطة واحدة مستحقّة — بإشارة ثم كشف"],
  ["مكتبتي", "أين وصل كل كتاب، وكم فائدة تنتظر"],
  ["ابدأ تركيز ٥٠ مراجعة", "جولة تعدّ فعلًا، والجرس يصلك هنا"],
  ["أوقف · وقفة · أكمل · استراحة", "إدارة الجولة من الجوّال"],
  ["ركزت ٤٥ دقيقة على المحاسبة", "جولة عُمِلت بعيدًا عن الشاشة"],
  ["صمدت · سقطت", "أمام عادة في كاسر العادات، ثم يسأل عن المحرّك"],
  ["شتتني الجوال", "يُكتب في تقييم اليوم، و«الحل …» يكمله"],
  ["موعد بكرة ٥ م الدكتور", "في التقويم، وينبّهك قبله"],
  ["غياب محاسبة", "غياب واحد، ويرفض الثاني في نفس اليوم"],
  ["درجة محاسبة الكويز ١٨ من ٢٠", "في كشف المادة"],
  ["هدف الحفظ ٣٠", "عدّاد الهدف — و«+٥» تزيده بدل أن تضبطه"],
  ["أمس صرفت ٣٥ غداء", "يُسجَّل في يوم أمس، ويقول لك أين نزل"],
  ["أمس تمت صلاة العصر", "يصحّح صفّ ذلك اليوم وحده"],
  ["ألغِ قراءة", "يزيل التأشير ويسحب صفحات اليوم معه"],
  ["ابحث عن التسويف", "في المهام والكتب والتقييمات والأهداف"],
  ["🎙️ مقطع صوتي", "يُفرَّغ ويُقرأ كأنك كتبته"],
  ["كم صرفت هذا الشهر؟", "سؤال — يُجاب ولا يُسجَّل شيء"],
  ["أي نصّ آخر", "صندوق الوارد — مربّع «مهم غير عاجل»"],
];

export function BotGrammarCard() {
  return (
    <Card className="p-6 sm:p-7">
      <div className="flex items-center gap-2.5">
        <MessageSquare size={16} strokeWidth={1.9} style={{ color: T.faint }} />
        <h3 className="text-[17px] font-extrabold" style={{ color: T.ctaLift }}>
          ماذا يفهم من رسائلك
        </h3>
      </div>
      <p className="mt-1.5 text-[11.5px]" style={{ color: T.faint }}>
        لا أوامر تُحفَظ. أرسل جملة.
      </p>
      <div className="mt-4 space-y-1.5">
        {PHRASES.map(([said, means]) => (
          <div
            key={said}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border px-4 py-2.5"
            style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
          >
            <span className="text-[12.5px] font-bold">«{said}»</span>
            <span className="text-[11.5px]" style={{ color: T.faint }}>
              ← {means}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* --- the screen -------------------------------------------------------- */
export function BotModule({ state, setState }) {
  const bot = botShape(state.bot);
  const arm = useUndo();
  const [health, setHealth] = useState(null);
  const [checking, setChecking] = useState(true);
  const [pinging, setPinging] = useState(false);
  const [pinged, setPinged] = useState(null);

  /* One patch function for the whole screen, and it goes through `botShape`
     so no card can write a field the shape would not. */
  const patch = useCallback(
    (part) => setState((s) => ({ ...s, bot: botShape({ ...botShape(s.bot), ...part }) })),
    [setState],
  );

  const addCustom = (row) =>
    setState((s) => {
      const b = botShape(s.bot);
      if (b.customs.length >= REMINDER_CAP) return s;
      return { ...s, bot: botShape({ ...b, customs: [...b.customs, reminderShape(row)] }) };
    });

  const patchOne = (id, part) =>
    setState((s) => {
      const b = botShape(s.bot);
      return {
        ...s,
        bot: botShape({
          ...b,
          customs: b.customs.map((r) => (r.id === id ? reminderShape({ ...r, ...part }) : r)),
        }),
      };
    });

  /* The whole list, never the row — a reminder put back at the end is one
     that moved, which is its own small loss. And as a function of the state
     rather than as a snapshot of `bot`: a reminder lives inside that object
     beside the water window and the two brief times, so putting the whole
     thing back would revert a toggle flipped in the same eight seconds. */
  const removeCustom = (id) => {
    const kept = botShape(state.bot).customs;
    arm("حُذف التذكير", (s) => ({ bot: botShape({ ...botShape(s.bot), customs: kept }) }));
    setState((s) => {
      const b = botShape(s.bot);
      return { ...s, bot: botShape({ ...b, customs: b.customs.filter((r) => r.id !== id) }) };
    });
  };

  /* --- the one live thing ---------------------------------------------- */
  const check = useCallback(async () => {
    try {
      const res = await fetch(`${BOT_API}/health`, { cache: "no-store" });
      const body = await res.json();
      setHealth(body && body.ok ? body : null);
    } catch {
      /* The bot is not running, or not reachable. Both read the same from
         here and both have the same answer on screen. */
      setHealth(null);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    let timer = null;
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      check();
    };
    tick();
    timer = setInterval(tick, HEALTH_EVERY);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [check]);

  const ping = async () => {
    setPinging(true);
    setPinged(null);
    try {
      const res = await fetch(`${BOT_API}/ping`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-local-sync": "1" },
        body: JSON.stringify({ from: "control-hub" }),
      });
      const body = await res.json().catch(() => null);
      setPinged(body && body.ok ? true : `لم تُرسَل: ${body?.error || res.status}`);
    } catch {
      setPinged("لم تُرسَل — البوت لا يستجيب.");
    } finally {
      setPinging(false);
      check();
    }
  };

  /* The order of this screen is this list. Moving a card is moving a line. */
  return (
    <div className="space-y-8">
      <Card className="p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">
              بوت تيليجرام
            </h2>
            <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/40">
              يدك على النظام وأنت خارج البيت: سجّل بجملة، واستقبل ما يستحقّ أن
              يُقاطعك. كل ما تضبطه هنا يُحفظ مع بقية حالتك، والبوت يقرؤه ويعيد
              تسليح نفسه.
            </p>
          </div>
          {/* The master switch. Off is mute, not uninstall: he still messages
              it and it still answers — it simply stops starting
              conversations. */}
          <button
            onClick={() => patch({ on: !bot.on })}
            aria-pressed={bot.on}
            className="los-raise flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-[12.5px] font-bold"
            style={{
              borderColor: bot.on ? `${T.primary}4D` : T.border,
              background: bot.on ? `${T.primary}14` : "rgba(255,255,255,0.03)",
              color: bot.on ? T.primary : T.faint,
            }}
          >
            <Power size={15} strokeWidth={2.2} />
            {bot.on ? "التذكيرات تعمل" : "التذكيرات موقوفة"}
          </button>
        </div>
      </Card>

      <BotStatusCard
        health={health}
        checking={checking}
        onPing={ping}
        pinging={pinging}
        pinged={pinged}
      />
      <TodayPlanCard bot={bot} state={state} />
      <BriefTimesCard bot={bot} onPatch={patch} />
      <PresetRemindersCard bot={bot} onPatch={patch} books={state.books} />
      {/* `state` and not `bot`: a condition is read against the whole day —
          the habits, the three tasks, the cups, the pages, the minutes — and
          the row says whether it would be silent right now. */}
      <CustomRemindersCard
        bot={bot}
        state={state}
        onAdd={addCustom}
        onPatchOne={patchOne}
        onRemove={removeCustom}
      />
      <BotGrammarCard />
    </div>
  );
}
