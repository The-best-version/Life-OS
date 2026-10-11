import React, { useState, useEffect, useMemo } from "react";
import { GitCompare, RotateCcw, ShieldCheck } from "lucide-react";
import { T, Btn, Badge, Modal, dayWord, daysPhrase } from "./life-shared.jsx";
import {
  SCHEMA,
  addDays,
  coreOf,
  dayKey,
  isGap,
  migrate,
  northStarShape,
  rows,
} from "./life-state.mjs";
import {
  STORAGE_KEY,
  api,
  postSync,
  readRev,
  served,
  writeRev,
} from "./life-storage.mjs";

/* ==================================================================== *
 *  THE TOOLS — the two screens he opens when he is worried about the data
 *
 *  `DataHealth` answers "is the year safe": the origin, the disk copy,
 *  persistence, offline, the schema, the revision, the two save times, the
 *  quota, the row counts — and a button beside every line that is wrong,
 *  because an alert with no route to the fix is a second thing to feel bad
 *  about. `RecoveryModal` answers "give me back Tuesday afternoon": it
 *  lists all five kinds of snapshot the server keeps and restores one.
 *
 *  Both are rendered by `SettingsModal`, which stays in LifeOS.jsx — it
 *  reads `NavOrderEditor` and `cupWord`, and both of those are read by the
 *  root as well, so moving them here would be an import cycle. That is why
 *  the seam runs between the settings sheet and the two screens it opens
 *  rather than around all three: these two reach for nothing LifeOS.jsx
 *  owns, and that is the whole test of where a seam can go.
 *
 *  Every name this file reads off life-storage.mjs — `api`, `served`,
 *  `readRev`, `writeRev`, `postSync`, `STORAGE_KEY` —
 *  is used inside a try/catch, which is exactly the shape of the bug
 *  tests/split.test.mjs exists to catch: a missing import there throws
 *  where nobody can see it, and the screen renders perfectly while the
 *  recovery centre lists nothing. The import above is checked by that
 *  test, not by esbuild.
 * ==================================================================== */

/* ==================================================================== *
 *  Where the data actually lives
 *
 *  Four promises get made about this app's data and none of them are
 *  visible from the screen: it is served from an origin of its own, there
 *  is a copy on disk, the browser has been asked not to evict it, and the
 *  page opens without the server. A promise you cannot check is one you
 *  end up re-exporting by hand every week just in case — so each one is
 *  stated here with whether it currently holds.
 * ==================================================================== */
/* --- the data health screen ------------------------------------------- *
 *  Everything the app knows about its own data, on one card, in the one
 *  place he goes when he is worried about it. Three kinds of line, and they
 *  are three different questions:
 *
 *  - Is the data *safe* — the origin, the disk copy, persistence, offline.
 *  - What *is* the data — the schema, the revision, the two save times, how
 *    much of the browser's quota it takes, how many rows in each section.
 *  - What is *missing* — and every one of those lines carries the button
 *    that fixes it, because an alert with no route to the fix is a second
 *    thing to feel bad about.
 * ---------------------------------------------------------------------- */
export function DataHealth({ open, state, savedAt, diskAt, onGo, onEditYesterday, onRecover }) {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      const out = {
        origin: served(),
        persisted: false,
        offline: false,
        disk: null,
        rev: readRev(),
        used: null,
        quota: null,
        bytes: null,
      };
      try {
        out.persisted = !!(await navigator.storage?.persisted?.());
      } catch {}
      try {
        out.offline = ((await navigator.serviceWorker?.getRegistrations?.()) || []).length > 0;
      } catch {}
      /* What this one payload costs, and what the whole origin is allowed.
         `estimate()` answers for the origin — caches, the service worker and
         the state together — so the payload is measured separately: an
         oversized cue image is the one thing that can push a save over the
         edge, and it needs its own number. */
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        /* UTF-16 in the browser's accounting, so a character is two bytes —
           Arabic or not. This is the number the quota is spent against. */
        if (raw) out.bytes = raw.length * 2;
      } catch {}
      try {
        const est = await navigator.storage?.estimate?.();
        if (est) {
          out.used = Number(est.usage) || 0;
          out.quota = Number(est.quota) || 0;
        }
      } catch {}
      try {
        const stop = new AbortController();
        const t = setTimeout(() => stop.abort(), 2500);
        const res = await fetch(api("/state?project=lifeos"), {
          signal: stop.signal,
          cache: "no-store",
        });
        clearTimeout(t);
        if (res.ok) {
          const saved = await res.json();
          out.disk = Array.isArray(saved?.habits) ? saved.date || true : null;
        }
      } catch {
        /* server down — reported as such, not as an error */
      }
      if (alive) setInfo(out);
    })();
    return () => {
      alive = false;
    };
  }, [open]);

  const guards = info
    ? [
        [info.origin, "يعمل من الخادم المحلي", "يعمل من نسخة غير أساسية — لا يُحفظ على القرص"],
        [!!info.disk, "نسخة محفوظة على القرص", "لا توجد نسخة على القرص — الخادم متوقّف"],
        [info.persisted, "المتصفّح يحفظ البيانات دائمًا", "المتصفّح لم يثبّت الحفظ بعد"],
        [info.offline, "يفتح بلا إنترنت", "يحتاج الإنترنت في أول تشغيل"],
      ]
    : [];

  /* Days written down as unrecorded inside the last seven. Read off the same
     rows the calendar reads, so the two can never give different numbers. */
  const gapsThisWeek = useMemo(() => {
    const from = addDays(dayKey(), -7);
    return rows(state.history).filter((h) => isGap(h) && h.date > from).length;
  }, [state.history]);

  const core = coreOf(state.habits || []).length;
  const star = northStarShape(state.northStar);

  /* Each one names what is missing and carries the button that fixes it. */
  const todo = [
    core === 0 && {
      key: "core",
      text: "لم تحدّد العادات الأساسية الخمس — النسبة الآن تُقسم على كل عاداتك.",
      action: "حدّدها",
      run: () => onGo("routine"),
    },
    !(star.word || "").trim() && {
      key: "star",
      text: "الكلمة والرؤية فارغتان — لا شيء يربط أهداف ٢٠٢٧ ببعضها.",
      action: "اكتبهما",
      run: () => onGo("goals"),
    },
    gapsThisWeek > 0 && {
      key: "gaps",
      text:
        (daysPhrase(gapsThisWeek) || `${gapsThisWeek} ${dayWord(gapsThisWeek)}`) +
        " بدون تسجيل هذا الأسبوع.",
      action: "عدّل أمس",
      run: onEditYesterday,
    },
    info &&
      !info.disk && {
        key: "disk",
        text: "لا نسخة على القرص — بياناتك في المتصفح فقط الآن.",
        action: "النسخ",
        run: onRecover,
      },
  ].filter(Boolean);

  const sections = [
    ["عادة", state.habits],
    ["مهمة", state.tasks],
    ["هدف", state.goals],
    ["كتاب", state.books],
    ["صف سجل", state.history],
    ["موعد", state.events],
    ["اقتباس", state.quotes],
    ["جلسة قراءة", state.reading],
    ["عادة سيئة", state.badHabits],
    ["جلسة تركيز", state.sessions],
    ["دخل", state.income],
  ];

  const clock = (at) => {
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

  return (
    <div
      className="space-y-3.5 rounded-2xl border px-3.5 py-3"
      style={{ borderColor: T.border, backgroundColor: T.card }}
    >
      <p
        className="flex items-center gap-2 text-[12px] font-extrabold"
        style={{ color: T.accent }}
      >
        <ShieldCheck size={14} /> صحة البيانات
      </p>

      {!info ? (
        <p className="text-[11px] text-white/45">جارٍ الفحص…</p>
      ) : (
        <>
          <ul className="space-y-1.5">
            {guards.map(([ok, yes, no], i) => (
              <li key={i} className="flex items-start gap-2 text-[11.5px] leading-relaxed">
                <span
                  className="mt-[3px] inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor: ok ? T.primary : T.ember,
                    boxShadow: `0 0 8px ${ok ? T.primary : T.ember}`,
                  }}
                />
                <span style={{ color: ok ? "rgba(255,255,255,0.72)" : T.ember }}>
                  {ok ? yes : no}
                </span>
              </li>
            ))}
          </ul>

          {/* The numbers. Small and tabular on purpose: this is a readout, not
              a dashboard, and it is read once when something feels wrong. */}
          <div
            className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-t pt-3 text-[10.5px]"
            style={{ borderColor: T.border, color: T.faint }}
          >
            {[
              ["إصدار البيانات", String(state.schema ?? SCHEMA)],
              ["رقم الحفظة", String(info.rev)],
              ["آخر حفظ في المتصفّح", clock(savedAt)],
              ["آخر حفظ على القرص", clock(diskAt)],
              [
                "حجم نسختك",
                info.bytes === null ? "—" : kbWord(info.bytes),
              ],
              [
                "المستخدم من حصّة المتصفّح",
                info.quota
                  ? `${Math.max(1, Math.round((info.used / info.quota) * 100))}%`
                  : "—",
              ],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-2">
                <span className="min-w-0 truncate">{k}</span>
                <span dir="ltr" className="shrink-0 font-bold tabular-nums" style={{ color: T.muted }}>
                  {v}
                </span>
              </div>
            ))}
          </div>

          <div
            className="flex flex-wrap gap-1.5 border-t pt-3"
            style={{ borderColor: T.border }}
          >
            {sections.map(([label, list]) => (
              <span
                key={label}
                className="rounded-lg border px-2 py-0.5 text-[10px]"
                style={{
                  borderColor: T.border,
                  color: (list?.length || 0) > 0 ? T.muted : T.faint,
                }}
              >
                <span dir="ltr" className="font-bold tabular-nums">
                  {list?.length || 0}
                </span>{" "}
                {label}
              </span>
            ))}
          </div>

          {!!todo.length && (
            <div className="space-y-2 border-t pt-3" style={{ borderColor: T.border }}>
              {todo.map((t) => (
                <div
                  key={t.key}
                  className="flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2"
                  style={{ borderColor: `${T.cta}3D`, background: `${T.cta}0F` }}
                >
                  <p
                    className="min-w-0 flex-1 text-[11px] font-bold leading-relaxed"
                    style={{ color: T.ctaLift }}
                  >
                    {t.text}
                  </p>
                  <Btn size="sm" className="shrink-0" onClick={t.run}>
                    {t.action}
                  </Btn>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ==================================================================== *
 *  Recovery — the snapshots on disk, reachable from inside the app
 * ==================================================================== */

/* Which sections a snapshot and the live copy disagree about, as a list of
   signed differences. Counts only: the point of «قارن» is to answer "what
   would I be giving up", and "two habits fewer, one goal more" answers it
   faster than a diff of thirty thousand characters would. */
const RECOVER_SECTIONS = [
  ["habits", "عادة"],
  ["tasks", "مهمة"],
  ["goals", "هدف"],
  ["books", "كتاب"],
  ["history", "صف سجل"],
  ["events", "موعد"],
  ["quotes", "اقتباس"],
  ["reading", "جلسة قراءة"],
  ["badHabits", "عادة سيئة"],
  ["sessions", "جلسة تركيز"],
  ["income", "دخل"],
];

function compareCounts(snap, state) {
  const out = [];
  for (const [key, label] of RECOVER_SECTIONS) {
    const theirs = snap?.counts?.[key];
    if (theirs === null || theirs === undefined) continue;
    const mine = Array.isArray(state[key]) ? state[key].length : 0;
    if (theirs !== mine) out.push({ label, delta: theirs - mine });
  }
  return out;
}

const arClock = (ms) => {
  try {
    return new Date(ms).toLocaleString("ar-EG", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

const kbWord = (n) => `${Math.max(1, Math.round(n / 1024))} ك.ب`;

function SnapshotRow({ item, state, onRestore, busy }) {
  const [open, setOpen] = useState(false);
  const diff = useMemo(() => (open ? compareCounts(item, state) : []), [open, item, state]);

  return (
    <div
      className="rounded-xl border px-3 py-2.5"
      style={{ borderColor: T.border, backgroundColor: T.card }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11.5px] font-bold" style={{ color: T.fg }}>
            {arClock(item.at)}
          </p>
          <p className="text-[10px]" style={{ color: T.faint }}>
            {!item.ok ? (
              "ملف غير مقروء"
            ) : (
              <>
                <span dir="ltr" className="tabular-nums">
                  {item.date || "—"}
                </span>
                {" · "}
                <span dir="ltr" className="tabular-nums">
                  {item.pct === null ? "—" : `${item.pct}%`}
                </span>
                {" · "}
                <span dir="ltr" className="tabular-nums">
                  {item.counts.habits ?? 0}
                </span>
                {" عادة · "}
                <span dir="ltr" className="tabular-nums">
                  {item.counts.history ?? 0}
                </span>
                {" صف · "}
                {kbWord(item.size)}
              </>
            )}
          </p>
        </div>
        <Btn
          variant="ghost"
          size="sm"
          className="shrink-0"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          disabled={!item.ok}
        >
          <GitCompare size={13} /> قارن
        </Btn>
        <Btn
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => onRestore(item)}
          disabled={!item.ok || busy}
        >
          <RotateCcw size={13} /> استرجع
        </Btn>
      </div>

      {open && (
        <div className="los-in mt-2.5 border-t pt-2.5" style={{ borderColor: T.border }}>
          {!diff.length ? (
            <p className="text-[11px]" style={{ color: T.faint }}>
              نفس أعداد نسختك الحالية في كل قسم.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {diff.map((d) => (
                <Badge key={d.label} tint={d.delta > 0 ? T.primary : T.ember}>
                  <span dir="ltr" className="tabular-nums">
                    {d.delta > 0 ? `+${d.delta}` : d.delta}
                  </span>
                  {` ${d.label}`}
                </Badge>
              ))}
            </div>
          )}
          <p className="mt-2 text-[10.5px] leading-relaxed" style={{ color: T.faint }}>
            الأرقام بالمقارنة مع نسختك الحالية — الموجب يعني أن هذه النسخة فيها أكثر.
          </p>
        </div>
      )}
    </div>
  );
}

/* --- the recovery centre ---------------------------------------------- *
 *  Three directories of snapshots have been written since the save guard
 *  shipped and none of them was reachable from inside the app: knowing that
 *  a copy of Tuesday afternoon is on disk is no use to someone who would
 *  have to be told the path, open a file manager and paste JSON into an
 *  import box. This lists them, says what each one holds, and puts one back.
 *
 *  A restore is deliberately destructive, so it is also deliberately
 *  reversible: the server stows the file it is about to overwrite in
 *  `backups/guard/` (`X-Guard: 1`), which means the copy being replaced
 *  shows up in this very list a second later under «قبل تغيير ناقص».
 *  Undoing a restore is restoring that guard copy.
 * ---------------------------------------------------------------------- */
export function RecoveryModal({ open, onClose, state }) {
  const [data, setData] = useState(null); // null = loading, "error", or {kinds}
  const [kind, setKind] = useState("auto");
  const [busy, setBusy] = useState(false);
  const [ask, setAsk] = useState(null); // the snapshot awaiting confirmation
  const [note, setNote] = useState(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setData(null);
    setNote(null);
    (async () => {
      try {
        const res = await fetch(api("/snapshots"), { cache: "no-store" });
        if (!res.ok) throw new Error("snapshots " + res.status);
        const json = await res.json();
        if (alive) setData(json && Array.isArray(json.kinds) ? json : "error");
      } catch {
        if (alive) setData("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [open]);

  const kinds = data && data !== "error" ? data.kinds : [];
  const shown =
    kinds.find((k) => k.kind === kind) || kinds.find((k) => k.items.length) || null;

  /* The one path in, and it is the path a reload already takes: the payload
     goes to localStorage and the window reloads, so `loadState` does the
     migration and the day roll exactly once and in one place. Nothing is put
     into React state first — a re-render here would fire the save effect on
     the state being replaced and put it straight back. */
  const restore = async (item) => {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch(
        api(`/snapshots/${shown.kind}/${encodeURIComponent(item.name)}`),
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error("read " + res.status);
      const saved = await res.json();
      if (!saved || typeof saved !== "object" || !Array.isArray(saved.habits))
        throw new Error("not this app's state");
      /* Same rule as the import box: an unversioned payload is an *old* one,
         and a payload from a newer build keeps its own number because no
         branch exists for a version this build has not been taught. */
      const ver = Number(saved.schema);
      const from = Number.isFinite(ver) && ver > 0 ? ver : 0;
      const next = migrate({ ...freshState(), ...saved, schema: from });
      const rev = readRev() + 1;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      writeRev(rev);
      /* Forced, because a snapshot is older than the file by definition and
         the revision guard would refuse it — and guarded, so the file it
         lands on is stowed instead of lost. Awaited: the reload must not
         race the write it depends on. */
      await postSync(next, rev, { force: true, guard: true });
      window.location.reload();
    } catch {
      setBusy(false);
      setNote("تعذّر الاسترجاع — تأكّد أن خادم المزامنة يعمل، ثم أعد المحاولة.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onClose}
      title="مركز الاسترجاع"
      wide
      footer={
        <Btn variant="outline" className="flex-1" onClick={onClose} disabled={busy}>
          إغلاق
        </Btn>
      }
    >
      <div className="space-y-4">
        <p className="text-[11.5px] leading-relaxed" style={{ color: T.faint }}>
          كل نسخة هنا محفوظة على جهازك. «قارن» يقول لك الفرق بالأرقام، و«استرجع»
          يعيدها — ونسختك الحالية تُحفظ قبل ذلك في «قبل تغيير ناقص» حتى تقدر
          تتراجع.
        </p>

        {data === null && (
          <p className="text-[11.5px]" style={{ color: T.faint }}>
            جارٍ قراءة النسخ…
          </p>
        )}
        {data === "error" && (
          <p
            className="rounded-xl border px-3.5 py-2.5 text-[11.5px] leading-relaxed"
            style={{
              borderColor: `${T.ember}59`,
              background: `${T.ember}14`,
              color: T.ember,
            }}
          >
            تعذّر الوصول إلى النسخ — خادم المزامنة متوقّف، أو هذه ليست النسخة
            الأساسية.
          </p>
        )}

        {!!kinds.length && (
          <>
            <div className="flex flex-wrap gap-2">
              {kinds.map((k) => {
                const on = (shown?.kind || "") === k.kind;
                return (
                  <button
                    key={k.kind}
                    onClick={() => setKind(k.kind)}
                    aria-pressed={on}
                    disabled={!k.items.length}
                    className="rounded-xl border px-3 py-1.5 text-[11px] font-bold transition-all disabled:opacity-35"
                    style={{
                      borderColor: on ? `${T.accent}80` : T.border,
                      background: on ? `${T.accent}1F` : "transparent",
                      color: on ? T.accent : T.muted,
                    }}
                  >
                    {k.label}{" "}
                    <span dir="ltr" className="tabular-nums">
                      {k.items.length}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="max-h-[52vh] space-y-2 overflow-y-auto pl-0.5">
              {!shown || !shown.items.length ? (
                <p
                  className="rounded-xl border border-dashed px-3.5 py-5 text-center text-[11.5px]"
                  style={{ borderColor: T.border, color: T.faint }}
                >
                  لا نسخ في هذا القسم بعد.
                </p>
              ) : (
                shown.items.map((item) => (
                  <SnapshotRow
                    key={item.name}
                    item={item}
                    state={state}
                    busy={busy}
                    onRestore={setAsk}
                  />
                ))
              )}
            </div>
          </>
        )}

        {note && (
          <p
            className="los-in rounded-xl border px-3.5 py-2.5 text-center text-[11.5px] font-bold"
            style={{
              borderColor: `${T.danger}59`,
              background: `${T.danger}1A`,
              color: T.danger,
            }}
          >
            {note}
          </p>
        )}

        {/* The confirmation is a step of its own rather than a
            `window.confirm`: what is being replaced has to be named, and the
            time it was taken is the only thing that makes the question
            answerable. */}
        {ask && (
          <div
            className="los-in rounded-2xl border px-3.5 py-3"
            style={{ borderColor: `${T.danger}59`, background: `${T.danger}12` }}
          >
            <p className="text-[12px] font-bold leading-relaxed" style={{ color: T.fg }}>
              {`استرجاع نسخة ${arClock(ask.at)}؟`}
              <span className="block text-[11px] font-normal" style={{ color: T.muted }}>
                ستستبدل كل بياناتك الحالية، وستُحفظ النسخة الحالية في «قبل تغيير
                ناقص» قبل ذلك.
              </span>
            </p>
            <div className="mt-2.5 flex gap-2">
              <Btn
                variant="danger"
                size="sm"
                className="flex-1"
                disabled={busy}
                onClick={() => {
                  const target = ask;
                  setAsk(null);
                  restore(target);
                }}
              >
                <RotateCcw size={13} /> استرجع الآن
              </Btn>
              <Btn
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={busy}
                onClick={() => setAsk(null)}
              >
                إلغاء
              </Btn>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
