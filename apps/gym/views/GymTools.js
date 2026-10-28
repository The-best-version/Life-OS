import { h, T, Card, Btn, Field, playBeep, calculatePlates, AVAILABLE_PLATES, PLATE_COLORS, ar } from "/gym/lib/ui.js";

const { useState, useEffect, useRef } = React;

/* --- حاسبة أوزان البار والصفائح (Plate Calculator Modal) ---------------- */
export function PlateCalcModal({ open, onClose }) {
  if (!open) return null;

  const [target, setTarget] = useState(60);
  const [bar, setBar] = useState(20);

  const { perSide, totalOnBar, remainder } = calculatePlates(target, bar);

  const add = (v) => setTarget((t) => Math.max(0, (Number(t) || 0) + v));

  return h(
    "div",
    { className: "modal-overlay", onClick: onClose },
    h(
      "div",
      {
        className: "card",
        onClick: (e) => e.stopPropagation(),
        style: { width: "100%", maxWidth: 440, background: "#10162F", border: "1px solid rgba(255,255,255,0.2)" },
      },
      h(
        "div",
        { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } },
        h("div", { style: { fontSize: 17, fontWeight: 800 } }, "🏋️‍♂️ حاسبة أوزان البار والصفائح"),
        h("button", { onClick: onClose, style: { background: "none", border: "none", color: T.muted, fontSize: 18 } }, "✕"),
      ),
      h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: 14 } },
        h(
          "div",
          null,
          h("label", { style: { fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 6, display: "block" } }, "نوع البار (كجم)"),
          h(
            "div",
            { style: { display: "flex", gap: 8 } },
            [
              { w: 20, l: "أولمبي (20 كجم)" },
              { w: 15, l: "خفيف (15 كجم)" },
              { w: 10, l: "صغير (10 كجم)" },
            ].map((b) =>
              h(
                "button",
                {
                  key: b.w,
                  onClick: () => setBar(b.w),
                  style: {
                    flex: 1,
                    padding: "8px 4px",
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 700,
                    border: bar === b.w ? `1px solid ${T.cta}` : "1px solid rgba(255,255,255,0.12)",
                    background: bar === b.w ? `${T.cta}22` : "rgba(255,255,255,0.03)",
                    color: bar === b.w ? T.cta : T.muted,
                  },
                },
                b.l,
              ),
            ),
          ),
        ),
        h(
          "div",
          null,
          h("label", { style: { fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 6, display: "block" } }, "الوزن الإجمالي المستهدف (كجم)"),
          h(
            "div",
            { style: { display: "flex", gap: 8, alignItems: "center" } },
            h(Field, {
              type: "number",
              step: "2.5",
              min: bar,
              dir: "ltr",
              value: target,
              onChange: (e) => setTarget(e.target.value),
              style: { fontSize: 18, fontWeight: 800, textAlign: "center" },
            }),
          ),
          h(
            "div",
            { style: { display: "flex", gap: 6, marginTop: 8, justifyContent: "center" } },
            [-5, -2.5, +2.5, +5, +10].map((step) =>
              h(
                "button",
                {
                  key: step,
                  onClick: () => add(step),
                  style: {
                    padding: "4px 10px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(255,255,255,0.04)",
                    color: T.fg,
                  },
                },
                step > 0 ? `+${step}` : step,
              ),
            ),
          ),
        ),
        h(
          "div",
          {
            style: {
              background: "rgba(255,255,255,0.04)",
              borderRadius: 14,
              padding: "16px 14px",
              border: "1px solid rgba(255,255,255,0.08)",
              textAlign: "center",
            },
          },
          h("div", { style: { fontSize: 12, fontWeight: 700, color: T.faint } }, "الصفائح المطلوبة لكل جهة:"),
          perSide.length === 0
            ? h("div", { style: { margin: "14px 0", fontSize: 14, color: T.muted } }, "فقط البار وحده (بدون صفائح)")
            : h(
                "div",
                {
                  style: {
                    display: "flex",
                    gap: 6,
                    alignItems: "center",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    margin: "12px 0",
                  },
                },
                perSide.map((p, idx) =>
                  h(
                    "div",
                    {
                      key: idx,
                      style: {
                        background: PLATE_COLORS[p] || "#888",
                        color: p === 5 ? "#111" : "#fff",
                        padding: "8px 10px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 900,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
                        border: "1px solid rgba(255,255,255,0.2)",
                      },
                    },
                    `${p}k`,
                  ),
                ),
              ),
          h(
            "div",
            { style: { fontSize: 13, fontWeight: 700, color: T.ctaLift, marginTop: 6 } },
            `المجموع على البار: ${totalOnBar} كجم`,
            remainder > 0 ? ` (يتبقى ${remainder} كجم)` : "",
          ),
        ),
        h(Btn, { onClick: onClose, style: { width: "100%", marginTop: 4 } }, "إغلاق"),
      ),
    ),
  );
}

/* --- مؤقت الراحة التفاعلي (Interactive Rest Timer) -------------------- */
export function RestTimerWidget({ initialSec = 90, onFinish }) {
  const [secondsLeft, setSecondsLeft] = useState(initialSec);
  const [totalSec, setTotalSec] = useState(initialSec);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  const startTimer = (sec) => {
    setTotalSec(sec);
    setSecondsLeft(sec);
    setRunning(true);
  };

  useEffect(() => {
    if (running && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            playBeep(980, 0.4);
            if (onFinish) onFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, secondsLeft]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  const pct = totalSec ? Math.round(((totalSec - secondsLeft) / totalSec) * 100) : 0;

  return h(
    Card,
    {
      style: {
        background: "linear-gradient(135deg, rgba(255,87,34,0.12), rgba(16,185,129,0.08))",
        borderColor: running ? T.cta : "rgba(255,255,255,0.12)",
      },
    },
    h(
      "div",
      { style: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 } },
      h(
        "div",
        null,
        h("div", { style: { fontSize: 12, fontWeight: 700, color: T.faint } }, "⏱️ مؤقت الراحة بين الجلسات"),
        h(
          "div",
          {
            style: {
              fontSize: 28,
              fontWeight: 900,
              color: running ? T.ctaLift : T.fg,
              fontFamily: "monospace",
              letterSpacing: 2,
              marginTop: 2,
            },
          },
          timeStr,
        ),
      ),
      h(
        "div",
        { style: { display: "flex", gap: 6, flexWrap: "wrap" } },
        [30, 60, 90, 120, 180].map((s) =>
          h(
            "button",
            {
              key: s,
              onClick: () => startTimer(s),
              style: {
                padding: "6px 10px",
                borderRadius: 8,
                fontSize: 11.5,
                fontWeight: 700,
                border: totalSec === s && running ? `1px solid ${T.cta}` : "1px solid rgba(255,255,255,0.1)",
                background: totalSec === s && running ? `${T.cta}33` : "rgba(255,255,255,0.04)",
                color: totalSec === s && running ? T.ctaLift : T.muted,
              },
            },
            `${s}ث`,
          ),
        ),
      ),
      h(
        "div",
        { style: { display: "flex", gap: 8 } },
        h(
          Btn,
          {
            onClick: () => setRunning((r) => !r),
            style: { padding: "8px 14px", fontSize: 12 },
          },
          running ? "إيقاف مؤقت" : secondsLeft === 0 ? "إعادة" : "ابدأ",
        ),
        h(
          Btn,
          {
            outline: true,
            onClick: () => setSecondsLeft((s) => s + 15),
            style: { padding: "8px 12px", fontSize: 12 },
          },
          "+15ث",
        ),
      ),
    ),
    h(
      "div",
      { style: { marginTop: 10, height: 4, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" } },
      h("div", {
        style: {
          height: "100%",
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${T.cta}, ${T.primary})`,
          transition: "width 0.3s ease",
        },
      }),
    ),
  );
}
