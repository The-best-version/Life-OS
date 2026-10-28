import { h, T, Card, Btn, Field, Stat, ar, sparkPoints } from "/gym/lib/ui.js";
import { dayKey, weighTrend, latestWeigh, weighMovingAverage, latestFat, fatTrend, measureDelta, MEASURE_FIELDS } from "/src/state/life-state.mjs";

const { useState, useMemo } = React;

function buildDualWeightChart(points, w = 560, hgt = 125) {
  if (!points || points.length < 2) return null;
  const allVals = points.flatMap((p) => [p.kg, p.ema]);
  const lo = Math.min(...allVals);
  const hi = Math.max(...allVals);
  const span = hi - lo || 1;
  const pad = 12;

  const coord = (val, i) => {
    const px = (i / (points.length - 1)) * w;
    const py = pad + (1 - (val - lo) / span) * (hgt - pad * 2);
    return [Math.round(px * 10) / 10, Math.round(py * 10) / 10];
  };

  const rawPts = points.map((p, i) => coord(p.kg, i).join(",")).join(" ");
  const emaPts = points.map((p, i) => coord(p.ema, i).join(",")).join(" ");
  const [lastX, lastEmaY] = coord(points[points.length - 1].ema, points.length - 1);

  return h(
    "svg",
    {
      width: "100%",
      height: hgt,
      viewBox: `0 0 ${w} ${hgt}`,
      preserveAspectRatio: "none",
      style: { marginBottom: 12, overflow: "visible" },
    },
    // خط قراءات الميزان اليومية (خافت متقطع)
    h("polyline", {
      points: rawPts,
      fill: "none",
      stroke: "rgba(253,248,246,0.28)",
      strokeWidth: 1.75,
      strokeDasharray: "4 4",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    }),
    // نقاط القراءات اليومية
    points.map((p, i) => {
      const [cx, cy] = coord(p.kg, i);
      return h("circle", {
        key: p.date,
        cx,
        cy,
        r: 2.5,
        fill: "rgba(253,248,246,0.45)",
      });
    }),
    // خط الاتجاه الحقيقي (7-Day EMA) عريض وواضح
    h("polyline", {
      points: emaPts,
      fill: "none",
      stroke: T.primary,
      strokeWidth: 3.2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
    }),
    h("circle", {
      cx: lastX,
      cy: lastEmaY,
      r: 4.5,
      fill: T.primary,
    })
  );
}

export function WeightCard({ gym, onLog, busy }) {
  const trend = weighTrend(gym, 90);
  const weigh = latestWeigh(gym);
  const emaData = useMemo(() => weighMovingAverage(gym, 30), [gym]);
  const fatNow = latestFat(gym);
  const fatTr = fatTrend(gym, 90);
  const fatPoints = useMemo(() => sparkPoints(gym.weighs.slice(0, 30), 560, 70, "fat"), [gym.weighs]);
  const [kg, setKg] = useState("");
  const [fat, setFat] = useState("");
  const [date, setDate] = useState(dayKey());

  const chartEl = buildDualWeightChart(emaData.points);

  return h(
    Card,
    null,
    h(
      "div",
      { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 } },
      h(
        "div",
        null,
        h("div", { style: { fontSize: 17, fontWeight: 700 } }, "الوزن والاتجاه الحقيقي (Trend Weight)"),
        h("div", { style: { fontSize: 11.5, color: T.muted, marginTop: 2 } }, "يعزل تذبذب السوائل والأملاح اليومي عبر المتوسط المتحرك (7-Day EMA)")
      ),
      trend &&
        h(
          "div",
          {
            style: {
              fontSize: 12,
              fontWeight: 800,
              color: trend.delta <= 0 ? T.primary : T.accent,
              background: "rgba(255,255,255,0.04)",
              padding: "4px 10px",
              borderRadius: 8,
            },
            dir: "ltr",
          },
          `${trend.delta > 0 ? "+" : ""}${trend.delta} kg / ${trend.days}d`
        )
    ),
    weigh
      ? h(
          "div",
          {
            style: {
              display: "flex",
              gap: 24,
              flexWrap: "wrap",
              marginBottom: 14,
              padding: "12px 14px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            },
          },
          h(Stat, {
            label: "الوزن الحقيقي (EMA)",
            value: emaData.latestEma ?? weigh.kg,
            unit: "كجم",
            tint: T.primary,
            hint:
              emaData.emaDelta !== null
                ? `تغيّر الاتجاه: ${emaData.emaDelta > 0 ? "+" : ""}${emaData.emaDelta} كجم`
                : "خط الاتجاه الصافي",
          }),
          h(Stat, {
            label: "قراءة الميزان اليوم",
            value: weigh.kg,
            unit: "كجم",
            tint: T.fg,
            hint:
              emaData.latestEma !== null && weigh.kg !== emaData.latestEma
                ? `فرق السوائل: ${weigh.kg > emaData.latestEma ? "+" : ""}${Math.round((weigh.kg - emaData.latestEma) * 10) / 10} كجم`
                : `بتاريخ ${weigh.date}`,
          })
        )
      : h("p", { style: { fontSize: 13, color: T.faint, marginBottom: 10 } }, "لا قراءة بعد — رقم واحد يكفي ليبدأ الخط."),
    chartEl &&
      h(
        "div",
        null,
        h(
          "div",
          { style: { display: "flex", gap: 16, fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 6 } },
          h(
            "span",
            { style: { display: "flex", alignItems: "center", gap: 6 } },
            h("span", { style: { width: 12, height: 3, borderRadius: 2, background: T.primary, display: "inline-block" } }),
            "الاتجاه الحقيقي (EMA)"
          ),
          h(
            "span",
            { style: { display: "flex", alignItems: "center", gap: 6 } },
            h("span", { style: { width: 12, height: 2, background: "rgba(253,248,246,0.4)", display: "inline-block" } }),
            "قراءات الميزان اليومية"
          )
        ),
        chartEl
      ),
    fatNow &&
      h(
        "div",
        { style: { marginTop: chartEl ? 16 : 0, marginBottom: 14, padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" } },
        h(
          "div",
          { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 } },
          h(Stat, {
            label: "نسبة الدهون",
            value: fatNow.fat,
            unit: "٪",
            tint: T.accent,
            hint: fatNow.date !== weigh?.date ? `بتاريخ ${fatNow.date}` : null,
          }),
          fatTr &&
            h(
              "span",
              { style: { fontSize: 12, fontWeight: 800, color: fatTr.delta <= 0 ? T.primary : T.accent }, dir: "ltr" },
              `${fatTr.delta > 0 ? "+" : ""}${fatTr.delta}% / ${fatTr.days}d`,
            ),
        ),
        fatPoints &&
          h(
            "svg",
            { width: "100%", height: 50, viewBox: "0 0 560 50", preserveAspectRatio: "none", style: { marginTop: 10, overflow: "visible" } },
            h("polyline", { points: fatPoints, fill: "none", stroke: T.accent, strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round" }),
          ),
      ),
    h(
      "div",
      { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
      h(Field, { type: "number", step: "0.1", dir: "ltr", value: kg, onChange: (e) => setKg(e.target.value), placeholder: "الوزن 78.4", style: { flex: 1, minWidth: 80 } }),
      h(Field, { type: "number", step: "0.1", dir: "ltr", value: fat, onChange: (e) => setFat(e.target.value), placeholder: "الدهون ٪ (اختياري)", style: { flex: 1, minWidth: 100 } }),
      h(Field, { type: "date", dir: "ltr", value: date, onChange: (e) => setDate(e.target.value), style: { flex: 1, minWidth: 110 } }),
      h(
        Btn,
        {
          disabled: !Number(kg) || busy,
          onClick: () => {
            onLog({ date, kg, fat });
            setKg("");
            setFat("");
          },
        },
        "سجّل الوزن",
      ),
    ),
    h("p", { style: { marginTop: 8, fontSize: 11, color: T.faint } }, "قراءة واحدة لليوم — تسجيل ثانٍ يصحّح الأولى ولا يُضاف بجانبها. نسبة الدهون اختيارية.")
  );
}

export function MeasureGrid({ gym, onLog, busy }) {
  const delta = measureDelta(gym);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({});
  const [date, setDate] = useState(dayKey());

  return h(
    Card,
    null,
    h(
      "div",
      { style: { display: "flex", justifyContent: "space-between", marginBottom: 12 } },
      h("div", { style: { fontSize: 17, fontWeight: 700 } }, "القياسات"),
      h(Btn, { outline: true, onClick: () => setOpen((v) => !v) }, open ? "إغلاق" : "+ قياس")
    ),
    !delta
      ? h("p", { style: { fontSize: 13, color: T.faint } }, "لا قياس بعد — الميزان وحده لا يرى شكل الجسم.")
      : h(
          "div",
          { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10 } },
          delta.fields.map((f) =>
            h(
              "div",
              { key: f.id, style: { borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", padding: 10 } },
              h("div", { style: { fontSize: 11, fontWeight: 700, color: T.faint } }, f.label),
              h(
                "div",
                { style: { marginTop: 4, display: "flex", justifyContent: "space-between", alignItems: "baseline" } },
                h("span", { style: { fontSize: 16, fontWeight: 800 }, dir: "ltr" }, f.value === null ? "—" : f.value),
                f.delta !== null && h("span", { style: { fontSize: 10.5, fontWeight: 700, color: f.delta === 0 ? T.faint : f.delta < 0 ? T.primary : T.accent }, dir: "ltr" }, `${f.delta > 0 ? "+" : ""}${f.delta}`)
              )
            )
          )
        ),
    open &&
      h(
        "div",
        { style: { marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: 10 } },
        h(Field, { type: "date", dir: "ltr", value: date, onChange: (e) => setDate(e.target.value) }),
        h(
          "div",
          { style: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 } },
          MEASURE_FIELDS.map((f) =>
            h(Field, { key: f.id, type: "number", step: "0.1", dir: "ltr", placeholder: f.label, value: draft[f.id] || "", onChange: (e) => setDraft({ ...draft, [f.id]: e.target.value }) })
          )
        ),
        h("p", { style: { fontSize: 11, color: T.faint } }, "اترك ما لم تقسه فارغاً — الفراغ يعني «لم يُقس»، لا صفراً."),
        h(
          Btn,
          {
            disabled: !MEASURE_FIELDS.some((f) => Number(draft[f.id])) || busy,
            onClick: () => {
              onLog({ date, ...draft });
              setDraft({});
              setOpen(false);
            },
          },
          "حفظ القياس"
        )
      )
  );
}

export function MeasurementsView({ gym, busy, onWeigh, onMeasure }) {
  return h(
    "div",
    { style: { display: "grid", gridTemplateColumns: "1fr", gap: 20 } },
    h(WeightCard, { gym, busy, onLog: onWeigh }),
    h(MeasureGrid, { gym, busy, onLog: onMeasure })
  );
}
