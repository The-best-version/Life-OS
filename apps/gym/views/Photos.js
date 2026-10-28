import { h, T, Card, Btn, Field } from "/gym/lib/ui.js";
import { dayKey } from "/src/state/life-state.mjs";
import { uploadPhoto, deletePhotoFile, PhotoUploadError } from "/gym/lib/photos.js";

const { useState } = React;

const photoUrl = (p) => `/gym-photos/${p.filename}`;

function UploadRow({ onAdd }) {
  const [date, setDate] = useState(dayKey());
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = React.useRef(null);

  const pick = () => inputRef.current?.click();

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const { filename } = await uploadPhoto(date, file);
      onAdd({ date, filename, note });
      setNote("");
    } catch (err) {
      setError(err instanceof PhotoUploadError ? err.message : "حصل خطأ غير متوقّع.");
    } finally {
      setBusy(false);
    }
  };

  return h(
    Card,
    null,
    h("div", { style: { fontSize: 17, fontWeight: 700, marginBottom: 12 } }, "صور التقدّم"),
    error && h("p", { style: { fontSize: 12.5, color: T.danger, marginBottom: 10 } }, error),
    h(
      "div",
      { style: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" } },
      h("input", { ref: inputRef, type: "file", accept: "image/*", capture: "environment", style: { display: "none" }, onChange: onFile }),
      h(Field, { type: "date", dir: "ltr", value: date, onChange: (e) => setDate(e.target.value), style: { flex: 1, minWidth: 110 } }),
      h(Field, { value: note, onChange: (e) => setNote(e.target.value), placeholder: "ملاحظة (اختياري)", style: { flex: 2, minWidth: 140 } }),
      h(Btn, { disabled: busy, onClick: pick }, busy ? "جارٍ الرفع…" : "+ أضف صورة"),
    ),
    h("p", { style: { marginTop: 8, fontSize: 11, color: T.faint } }, "تُصغَّر الصورة في جهازك قبل الرفع — ما تُرسَل بحجمها الأصلي."),
  );
}

function PhotoThumb({ p, selected, onToggle, onDelete }) {
  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: 6 } },
    h(
      "button",
      {
        onClick: () => onToggle(p),
        style: {
          padding: 0,
          border: `2px solid ${selected ? T.cta : "rgba(255,255,255,0.1)"}`,
          borderRadius: 10,
          overflow: "hidden",
          background: "rgba(255,255,255,0.03)",
          cursor: "pointer",
        },
      },
      h("img", { src: photoUrl(p), alt: p.note || p.date, style: { display: "block", width: "100%", height: 150, objectFit: "cover" } }),
    ),
    h(
      "div",
      { style: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: T.faint } },
      h("span", { dir: "ltr" }, p.date),
      h("button", { onClick: () => onDelete(p), "aria-label": `احذف صورة ${p.date}`, style: { background: "none", border: "none", color: T.faint, fontSize: 14 } }, "✕"),
    ),
    p.note && h("div", { style: { fontSize: 11.5, color: T.muted } }, p.note),
  );
}

function CompareBar({ selected, onClear }) {
  if (selected.length !== 2) return null;
  const [a, b] = [...selected].sort((x, y) => (x.date < y.date ? -1 : 1));
  return h(
    Card,
    null,
    h(
      "div",
      { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } },
      h("div", { style: { fontSize: 17, fontWeight: 700 } }, "مقارنة"),
      h("button", { onClick: onClear, style: { background: "none", border: "none", color: T.cta, fontSize: 12.5, fontWeight: 700 } }, "إلغاء الاختيار"),
    ),
    h(
      "div",
      { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } },
      [a, b].map((p) =>
        h(
          "div",
          { key: p.id, style: { display: "flex", flexDirection: "column", gap: 6 } },
          h("img", { src: photoUrl(p), alt: p.date, style: { width: "100%", borderRadius: 10, display: "block" } }),
          h("div", { style: { fontSize: 12, fontWeight: 700, textAlign: "center" }, dir: "ltr" }, p.date),
        ),
      ),
    ),
  );
}

export function PhotosView({ gym, onAdd, onDelete }) {
  const [selected, setSelected] = useState([]);

  const toggle = (p) => {
    setSelected((cur) => {
      if (cur.some((x) => x.id === p.id)) return cur.filter((x) => x.id !== p.id);
      if (cur.length >= 2) return [cur[1], p];
      return [...cur, p];
    });
  };

  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: 20 } },
    h(UploadRow, { onAdd }),
    h(CompareBar, { selected, onClear: () => setSelected([]) }),
    h(
      Card,
      null,
      h("div", { style: { fontSize: 17, fontWeight: 700, marginBottom: 4 } }, `السجل (${gym.photos.length})`),
      h("p", { style: { fontSize: 11, color: T.faint, marginBottom: 14 } }, "اضغط صورتين لمقارنتهما جنباً إلى جنب."),
      !gym.photos.length
        ? h("p", { style: { fontSize: 13, color: T.faint, textAlign: "center", padding: "20px 0" } }, "لا صور بعد — أول صورة تبدأ الخط.")
        : h(
            "div",
            { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 14 } },
            gym.photos.map((p) =>
              h(PhotoThumb, {
                key: p.id,
                p,
                selected: selected.some((x) => x.id === p.id),
                onToggle: toggle,
                onDelete: (row) => {
                  setSelected((cur) => cur.filter((x) => x.id !== row.id));
                  onDelete(row);
                },
              }),
            ),
          ),
    ),
  );
}
