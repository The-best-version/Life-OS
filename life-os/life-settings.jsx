import { NavOrderEditor } from "./life-nav.jsx";
import { Btn, Modal, NumStep, T, cupWord } from "./life-shared.jsx";
import { MORE_IDS, NAV_IDS, PLACES, PLACE_BY_ID, SCHEMA, WATER_GOAL_MAX, clampGoal, dayKey, migrate, placeShape, rollDay } from "./life-state.mjs";
import { DataHealth, RecoveryModal } from "./life-tools.jsx";
import { Archive, ChevronDown, ChevronUp, Download, Droplets, GripVertical, MapPin, Upload } from "lucide-react";
import { useRef, useState } from "react";

/* ==================================================================== *
 *  Backup — export / import the whole payload
 * ==================================================================== */
export function SettingsModal({
  open,
  onClose,
  state,
  setState,
  savedAt,
  diskAt,
  onGo,
  onEditYesterday,
}) {
  const fileRef = useRef(null);
  const [note, setNote] = useState(null); // {ok, text}
  const [ordering, setOrdering] = useState(false);
  const [recovering, setRecovering] = useState(false);

  const exportData = () => {
    try {
      const blob = new Blob([JSON.stringify(state, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `life-os-2027-${dayKey()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setNote({ ok: true, text: "تم تنزيل نسخة احتياطية." });
    } catch {
      setNote({ ok: false, text: "تعذّر التصدير." });
    }
  };

  const importData = async (file) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      /* A file can be anything — refuse a payload that is not this app's,
         rather than replacing good data with a half-valid object. */
      if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.habits)) {
        setNote({ ok: false, text: "الملف ليس نسخة صالحة من Life OS." });
        return;
      }
      /* Through rollDay, exactly as the load path does it. A backup taken
         yesterday carries yesterday's date and yesterday's ticks; without
         this the app wears them as today until the minute poll catches up —
         long enough for the archive effect to stamp today's history row with
         a day the user did not live. */
      /* An unversioned payload is an *old* payload, not a current one.
         Spreading it over freshState left SCHEMA standing, so a hand-edited
         or third-party file skipped every migration and arrived looking
         modern while carrying shapes this build stopped understanding
         versions ago. Unknown means oldest, and migrate stamps the current
         version on the way out, so the walk happens once and never again.

         A file from a *newer* build keeps its own number: no branch can run
         for a version this build has not been taught, and pretending
         otherwise would reshape data it does not understand. */
      const ver = Number(parsed.schema);
      const from = Number.isFinite(ver) && ver > 0 ? ver : 0;
      setState(rollDay(migrate({ ...freshState(), ...parsed, schema: from })));
      setNote({
        ok: true,
        text: !from
          ? "تم الاستيراد — الملف بلا رقم إصدار، فرُقّي من أقدم نسخة احتياطًا."
          : ver > SCHEMA
            ? "تم الاستيراد — الملف من إصدار أحدث من هذا البناء؛ راجع بياناتك."
            : "تم استيراد البيانات واستبدال الحالي.",
      });
    } catch {
      setNote({ ok: false, text: "تعذّرت قراءة الملف — تأكّد أنه JSON سليم." });
    }
  };

  const place = placeShape(state.place);

  const counts = [
    { k: "عادة", n: state.habits?.length || 0 },
    { k: "مهمة", n: state.tasks?.length || 0 },
    { k: "هدف", n: state.goals?.length || 0 },
    { k: "كتاب", n: state.books?.length || 0 },
    { k: "موعد", n: state.events?.length || 0 },
    { k: "مقرّر", n: state.uni?.courses?.length || 0 },
  ];

  return (
    <Modal open={open} onClose={onClose} title="الإعدادات والنسخ الاحتياطي">
      <div className="space-y-5">
        <div
          className="grid grid-cols-3 gap-2 rounded-2xl border p-3 text-center"
          style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
        >
          {counts.map((c) => (
            <div key={c.k}>
              <p
                dir="ltr"
                className="text-[17px] font-extrabold tabular-nums"
                style={{ color: T.accent }}
              >
                {c.n}
              </p>
              <p className="text-[10px]" style={{ color: T.faint }}>
                {c.k}
              </p>
            </div>
          ))}
        </div>

        {/* Prayer times and the water goal. Both belong to the routine
            screen, but neither is something you set more than once — so they
            live here rather than taking permanent room on a daily driver. */}
        <div
          className="space-y-3.5 rounded-2xl border p-3.5"
          style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
        >
          <div>
            <label
              htmlFor="los-place"
              className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-bold"
              style={{ color: T.violet }}
            >
              <MapPin size={13} /> مدينة أوقات الصلاة
            </label>
            <select
              id="los-place"
              value={place.id}
              onChange={(e) => {
                const seed = PLACE_BY_ID.get(e.target.value);
                if (!seed) return;
                /* The school is the user's, not the city's — carried across
                   so changing town does not quietly switch his Asr. */
                setState((s) => ({
                  ...s,
                  place: placeShape({ ...seed, asr: placeShape(s.place).asr }),
                }));
              }}
              className="w-full rounded-xl border bg-transparent px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-white/30"
              style={{ borderColor: T.border, color: T.muted }}
            >
              {PLACES.map((c) => (
                <option key={c.id} value={c.id} style={{ background: T.cardSolid }}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="mb-1.5 block text-[11px]" style={{ color: T.faint }}>
              مذهب العصر
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { n: 1, label: "الشافعي والجمهور" },
                { n: 2, label: "الحنفي" },
              ].map((o) => {
                const on = place.asr === o.n;
                return (
                  <button
                    key={o.n}
                    onClick={() =>
                      setState((s) => ({
                        ...s,
                        place: placeShape({ ...placeShape(s.place), asr: o.n }),
                      }))
                    }
                    aria-pressed={on}
                    className="rounded-xl border px-3 py-2 text-[11.5px] font-bold transition-all"
                    style={{
                      borderColor: on ? `${T.violet}80` : T.border,
                      background: on ? `${T.violet}1F` : "transparent",
                      color: on ? T.violet : T.muted,
                    }}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span
              className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-bold"
              style={{ color: T.sky }}
            >
              <Droplets size={13} /> هدف الماء اليومي
            </span>
            <NumStep
              value={clampGoal(state.waterGoal)}
              onChange={(n) =>
                /* Lowering the goal below today's count would render fewer
                   cups than are filled, so the count comes down with it. */
                setState((s) => ({
                  ...s,
                  waterGoal: n,
                  water: Math.min(n, s.water || 0),
                }))
              }
              min={1}
              max={WATER_GOAL_MAX}
              unit={cupWord(clampGoal(state.waterGoal))}
              tint={T.sky}
            />
          </div>
        </div>

        {/* The sidebar's own reorder toggle is desktop-only, so this is the
            single path a phone has to its tab order. */}
        <div
          className="rounded-2xl border p-3"
          style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
        >
          <button
            onClick={() => setOrdering((v) => !v)}
            aria-expanded={ordering}
            className="flex w-full items-center gap-2 text-right"
          >
            {ordering ? (
              <ChevronUp size={14} style={{ color: T.accent }} />
            ) : (
              <ChevronDown size={14} style={{ color: T.accent }} />
            )}
            <span className="flex-1 text-[12.5px] font-bold" style={{ color: T.accent }}>
              ترتيب التبويبات
            </span>
            <GripVertical size={13} style={{ color: T.faint }} />
          </button>
          {ordering && (
            <div className="los-in mt-3">
              <NavOrderEditor
                order={state.navOrder}
                more={state.navMore}
                onChange={(ids) => setState((s) => ({ ...s, navOrder: ids }))}
                onMore={(ids) => setState((s) => ({ ...s, navMore: ids }))}
                onReset={() =>
                  setState((s) => ({ ...s, navOrder: NAV_IDS, navMore: MORE_IDS }))
                }
              />
            </div>
          )}
        </div>

        <DataHealth
          open={open}
          state={state}
          savedAt={savedAt}
          diskAt={diskAt}
          onGo={onGo}
          onEditYesterday={onEditYesterday}
          onRecover={() => setRecovering(true)}
        />

        {/* The snapshots the server has been writing all along, finally
            reachable. Above export/import because it is the answer to the
            same worry and does not require him to have taken a backup
            himself. */}
        <Btn variant="outline" className="w-full" onClick={() => setRecovering(true)}>
          <Archive size={15} /> مركز الاسترجاع
        </Btn>

        <div className="space-y-2.5">
          <Btn variant="default" className="w-full" onClick={exportData}>
            <Download size={15} /> تصدير البيانات
          </Btn>
          <Btn
            variant="outline"
            className="w-full"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={15} /> استيراد البيانات
          </Btn>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => {
              importData(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>

        <p
          className="rounded-xl border px-3.5 py-2.5 text-[11px] leading-relaxed"
          style={{
            borderColor: `${T.accent}3D`,
            background: `${T.accent}12`,
            color: T.accent,
          }}
        >
          الاستيراد يستبدل كل بياناتك الحالية. صدّر نسخة أولًا إن لم تكن متأكّدًا.
        </p>

        {note && (
          <p
            className="los-in rounded-xl border px-3.5 py-2.5 text-center text-[11.5px] font-bold"
            style={{
              borderColor: note.ok ? `${T.primary}59` : `${T.danger}59`,
              background: note.ok ? `${T.primary}1A` : `${T.danger}1A`,
              color: note.ok ? T.primary : T.danger,
            }}
          >
            {note.text}
          </p>
        )}

        <RecoveryModal
          open={recovering}
          onClose={() => setRecovering(false)}
          state={state}
        />
      </div>
    </Modal>
  );
}

