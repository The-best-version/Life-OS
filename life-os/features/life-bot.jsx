import React, { useCallback, useEffect, useState } from "react";
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
  arCount,
  minWord,
  prettyTime,
  useUndo,
} from "../components/life-shared.jsx";
import {
  botShape,
  reminderShape,
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
} from "../state/life-state.mjs";
import { prayerTimes, PRAYER_ROWS, blockTimes, BLOCK_ANCHORS } from "../utils/prayer-times.mjs";

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

/* A timestamp in milliseconds as "HH:MM", so `prettyTime` can read it. */
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
export function PresetRemindersCard({ bot, onPatch }) {
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

/* --- the ones he writes ------------------------------------------------ */
export function CustomRemindersCard({ bot, onAdd, onPatchOne, onRemove }) {
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
            جملة وساعة. والأيام اختيارية — بلا اختيار تعني كل يوم.
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
            <div
              key={r.id}
              className="group rounded-xl border px-4 py-3"
              style={{
                borderColor: r.on ? `${T.violet}33` : T.border,
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={r.on}
                  onToggle={() => onPatchOne(r.id, { on: !r.on })}
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
                  onClick={() => onRemove(r.id)}
                  aria-label={`حذف ${r.text}`}
                  className="shrink-0 rounded p-1 text-white/25 opacity-40 transition-all hover:text-red-400 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              {/* Seven small buttons rather than a dropdown: picking «الأحد
                  والثلاثاء» out of a select is three interactions, and this
                  is one each. */}
              <div className="mt-2.5 flex flex-wrap gap-1.5 ps-8">
                {DOW_AR.map((name, i) => {
                  const picked = onDay(r, i);
                  return (
                    <button
                      key={name}
                      onClick={() => onPatchOne(r.id, { days: toggleDay(r.days, i) })}
                      aria-label={`${name}${picked ? " — مفعّل" : ""}`}
                      aria-pressed={picked}
                      className="rounded-lg border px-2 py-1 text-[10.5px] transition-colors"
                      style={{
                        borderColor: picked ? `${T.violet}4D` : T.border,
                        background: picked ? `${T.violet}1A` : "transparent",
                        color: picked ? T.violet : T.faint,
                      }}
                    >
                      {name.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
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
  const plan = planDay(bot, { dow: now.getDay(), prayers, hasTasks, blocks, events });
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
  return own ? own.text.slice(0, 24) : "تذكير";
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
      <PresetRemindersCard bot={bot} onPatch={patch} />
      <CustomRemindersCard
        bot={bot}
        onAdd={addCustom}
        onPatchOne={patchOne}
        onRemove={removeCustom}
      />
      <BotGrammarCard />
    </div>
  );
}
