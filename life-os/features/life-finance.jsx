import React, { useState } from "react";
import { Plus, Pencil, Trash2, TrendingUp, Wallet, Coins, Lightbulb } from "lucide-react";
import { T, Card, Btn, Field, Modal } from "../components/life-shared.jsx";
import { uid, dayKey } from "../state/life-state.mjs";

/* ==================================================================== *
 *  MODULE — flexible income & side ventures
 *
 *  One screen: the hours and the money that came in for them, and the
 *  cost-against-return of an idea before a riyal is spent on it. It reads
 *  `state.income` and `state.ventures` and nothing else, which is why it
 *  is the first module carved out of LifeOS.jsx — the seam crosses it in
 *  exactly one place, `FinanceModule`.
 * ==================================================================== */

/* `money` is deliberately NOT exported, and that is not tidiness. The
   split test asks, of every name a module exports, whether a file that
   uses it also imports it — and `money` is an object key in LifeOS.jsx
   five times over (`money: Wallet`, `costType: "money"`). A bare key is
   not preceded by a dot, so it reads as a use of the free variable, and
   exporting this would fail the seam test over something that is not a
   bug. An internal helper stays internal. */
const money = (n) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    Math.round(n || 0),
  );

export function FinanceModule({ state, setState }) {
  const [label, setLabel] = useState("");
  const [hours, setHours] = useState("");
  const [amount, setAmount] = useState("");
  const [venture, setVenture] = useState(null); // {id?, name, cost, revenue}

  const income = state.income || [];
  const ventures = state.ventures || [];

  const since = (days) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (days - 1));
    return income.filter((e) => new Date(e.date) >= d);
  };
  const week = since(7);
  const month = since(30);
  const sum = (list) => list.reduce((n, e) => n + (e.amount || 0), 0);
  const hoursOf = (list) => list.reduce((n, e) => n + (e.hours || 0), 0);
  const weekTotal = sum(week);
  const monthTotal = sum(month);
  const monthHours = hoursOf(month);
  const rate = monthHours ? monthTotal / monthHours : 0;

  const addIncome = () => {
    const amt = parseFloat(amount);
    if (!Number.isFinite(amt) || amt <= 0) return;
    const hrs = parseFloat(hours);
    setState((s) => ({
      ...s,
      income: [
        {
          id: uid(),
          date: dayKey(),
          label: label.trim() || "عمل مرن",
          hours: Number.isFinite(hrs) && hrs > 0 ? hrs : 0,
          amount: amt,
        },
        ...(s.income || []),
      ].slice(0, 500),
    }));
    setLabel("");
    setHours("");
    setAmount("");
  };

  const removeIncome = (id) =>
    setState((s) => ({ ...s, income: s.income.filter((e) => e.id !== id) }));

  const saveVenture = () => {
    const name = venture.name.trim();
    if (!name) return;
    const cost = parseFloat(venture.cost) || 0;
    const revenue = parseFloat(venture.revenue) || 0;
    setState((s) => ({
      ...s,
      ventures: venture.id
        ? s.ventures.map((v) =>
            v.id === venture.id ? { ...v, name, cost, revenue } : v,
          )
        : [...(s.ventures || []), { id: uid(), name, cost, revenue }],
    }));
    setVenture(null);
  };

  const stats = [
    { label: "هذا الأسبوع", value: weekTotal, tint: T.primary, icon: Coins },
    { label: "آخر ٣٠ يومًا", value: monthTotal, tint: T.accent, icon: Wallet },
    { label: "معدّل الساعة", value: rate, tint: T.sky, icon: TrendingUp },
  ];

  return (
    <div className="space-y-8">
      <Card className="p-6 sm:p-7">
        <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">
          الدخل والمشاريع
        </h2>
        <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/40">
          سجّل ساعاتك ودخلك المرن، واحسب كلفة أي فكرة قبل أن تبدأها. الأرقام
          بالريال.
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5 sm:p-6">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: `${s.tint}45`,
                    background: `${s.tint}16`,
                    color: s.tint,
                  }}
                >
                  <Icon size={16} strokeWidth={1.9} />
                </span>
                <span className="text-[11.5px]" style={{ color: T.faint }}>
                  {s.label}
                </span>
              </div>
              <p
                className="mt-3 text-2xl font-extrabold tabular-nums"
                dir="ltr"
                style={{ color: s.tint }}
              >
                {money(s.value)}
              </p>
            </Card>
          );
        })}
      </div>

      <Card className="p-6 sm:p-7">
        <h3 className="text-[17px] font-extrabold" style={{ color: T.ctaLift }}>
          تسجيل دخل
        </h3>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Field
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="المصدر — مثال: توصيل"
          />
          <Field
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            inputMode="decimal"
            placeholder="ساعات"
            className="sm:max-w-[130px]"
          />
          <Field
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addIncome()}
            inputMode="decimal"
            placeholder="المبلغ"
            className="sm:max-w-[150px]"
          />
          <Btn variant="default" onClick={addIncome} className="shrink-0">
            <Plus size={15} strokeWidth={3} /> إضافة
          </Btn>
        </div>

        <div className="mt-5 space-y-2">
          {income.length === 0 ? (
            <p
              className="rounded-xl border border-dashed py-8 text-center text-[11.5px]"
              style={{ borderColor: T.border, color: T.faint }}
            >
              لا دخل مسجّل بعد
            </p>
          ) : (
            income.slice(0, 12).map((e) => (
              <div
                key={e.id}
                className="group flex items-center gap-3 rounded-xl border px-4 py-2.5"
                style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
              >
                <span className="min-w-0 flex-1 truncate text-[13px]">{e.label}</span>
                {e.hours > 0 && (
                  <span
                    className="shrink-0 text-[10.5px] tabular-nums"
                    dir="ltr"
                    style={{ color: T.faint }}
                  >
                    {e.hours}h
                  </span>
                )}
                <span
                  className="shrink-0 text-[13px] font-extrabold tabular-nums"
                  dir="ltr"
                  style={{ color: T.primary }}
                >
                  {money(e.amount)}
                </span>
                <span className="shrink-0 text-[10px] tabular-nums" dir="ltr" style={{ color: T.faint }}>
                  {e.date.slice(5)}
                </span>
                <button
                  onClick={() => removeIncome(e.id)}
                  aria-label={`حذف ${e.label}`}
                  className="shrink-0 rounded p-1 text-white/25 opacity-40 transition-all hover:text-red-400 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-[17px] font-extrabold" style={{ color: T.ctaLift }}>
              أفكار ومشاريع
            </h3>
            <p className="mt-1.5 text-[11.5px]" style={{ color: T.faint }}>
              الكلفة مقابل العائد المتوقّع — قبل أن تصرف ريالًا.
            </p>
          </div>
          <Btn
            variant="default"
            size="sm"
            onClick={() => setVenture({ name: "", cost: "", revenue: "" })}
          >
            <Plus size={14} strokeWidth={3} /> فكرة جديدة
          </Btn>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {ventures.length === 0 ? (
            <p
              className="rounded-xl border border-dashed py-8 text-center text-[11.5px] lg:col-span-2"
              style={{ borderColor: T.border, color: T.faint }}
            >
              لا أفكار مسجّلة بعد
            </p>
          ) : (
            ventures.map((v) => {
              const profit = (v.revenue || 0) - (v.cost || 0);
              const good = profit >= 0;
              return (
                <div
                  key={v.id}
                  className="group rounded-2xl border p-4"
                  style={{
                    borderColor: good ? `${T.primary}3D` : `${T.danger}3D`,
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Lightbulb
                      size={15}
                      style={{ color: good ? T.primary : T.danger }}
                      className="shrink-0"
                    />
                    <span className="min-w-0 flex-1 truncate text-[14px] font-bold">
                      {v.name}
                    </span>
                    <button
                      onClick={() =>
                        setVenture({
                          id: v.id,
                          name: v.name,
                          cost: String(v.cost ?? ""),
                          revenue: String(v.revenue ?? ""),
                        })
                      }
                      aria-label={`تعديل ${v.name}`}
                      className="shrink-0 rounded p-1 text-white/25 transition-all hover:text-white/70"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() =>
                        setState((s) => ({
                          ...s,
                          ventures: s.ventures.filter((x) => x.id !== v.id),
                        }))
                      }
                      aria-label={`حذف ${v.name}`}
                      className="shrink-0 rounded p-1 text-white/25 transition-all hover:text-red-400"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    {[
                      { k: "الكلفة", v: v.cost, tint: T.faint },
                      { k: "العائد", v: v.revenue, tint: T.accent },
                      { k: "الربح", v: profit, tint: good ? T.primary : T.danger },
                    ].map((cell) => (
                      <div
                        key={cell.k}
                        className="rounded-xl py-2"
                        style={{ background: "rgba(255,255,255,0.04)" }}
                      >
                        <p className="text-[10px]" style={{ color: T.faint }}>
                          {cell.k}
                        </p>
                        <p
                          dir="ltr"
                          className="mt-0.5 text-[14px] font-extrabold tabular-nums"
                          style={{ color: cell.tint }}
                        >
                          {money(cell.v)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <Modal
        open={!!venture}
        onClose={() => setVenture(null)}
        title={venture?.id ? "تعديل الفكرة" : "فكرة جديدة"}
        footer={
          <>
            <Btn variant="default" className="flex-1" onClick={saveVenture}>
              حفظ
            </Btn>
            <Btn variant="outline" className="flex-1" onClick={() => setVenture(null)}>
              إلغاء
            </Btn>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="los-v-name" className="mb-1.5 block text-xs text-white/45">
              اسم الفكرة
            </label>
            <Field
              id="los-v-name"
              autoFocus
              value={venture?.name || ""}
              onChange={(e) => setVenture((s) => ({ ...s, name: e.target.value }))}
              placeholder="مثال: متجر إلكتروني صغير"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="los-v-cost" className="mb-1.5 block text-xs text-white/45">
                الكلفة المتوقّعة
              </label>
              <Field
                id="los-v-cost"
                inputMode="decimal"
                value={venture?.cost || ""}
                onChange={(e) => setVenture((s) => ({ ...s, cost: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div>
              <label htmlFor="los-v-rev" className="mb-1.5 block text-xs text-white/45">
                العائد المتوقّع
              </label>
              <Field
                id="los-v-rev"
                inputMode="decimal"
                value={venture?.revenue || ""}
                onChange={(e) => setVenture((s) => ({ ...s, revenue: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && saveVenture()}
                placeholder="0"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
