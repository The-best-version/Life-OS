import { Badge, Btn, Modal, NumStep, T, cupWord } from "../components/life-shared.jsx";
import {
  PLACES,
  PLACE_BY_ID,
  SCHEMA,
  WATER_GOAL_MAX,
  clampGoal,
  dayKey,
  freshState,
  migrate,
  placeShape,
  rollDay,
} from "../state/life-state.mjs";
import { DataHealth, RecoveryModal } from "./life-tools.jsx";
import {
  Archive,
  CheckCheck,
  Download,
  Droplets,
  Lock,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const E2EE_CONFIG_KEY = "los_e2ee_cloud_config_v1";
const DEFAULT_E2EE_ENDPOINT = "http://127.0.0.1:47615/state?project=lifeos_e2ee_vault";

function bytesToBase64(bytes) {
  let binary = "";
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < arr.byteLength; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary);
}

function base64ToBytes(b64) {
  const binary = atob(String(b64 || "").trim());
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

async function deriveAesGcmKey(passphrase, saltBytes) {
  const enc = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptStateEnvelope(stateObj, passphrase) {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesGcmKey(passphrase, salt);
  const plaintext = enc.encode(JSON.stringify(stateObj));
  const cipherBuf = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext
  );
  const hashBuf = await window.crypto.subtle.digest("SHA-256", cipherBuf);
  const fingerprint = Array.from(new Uint8Array(hashBuf).slice(0, 6))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(":")
    .toUpperCase();

  return {
    e2eeVersion: "1.0",
    alg: "AES-256-GCM",
    kdf: "PBKDF2-SHA256-100K",
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    cipher: bytesToBase64(cipherBuf),
    fingerprint,
    updatedAt: new Date().toISOString(),
    day: dayKey(),
  };
}

async function decryptStateEnvelope(envelope, passphrase) {
  if (!envelope || !envelope.cipher || !envelope.salt || !envelope.iv) {
    throw new Error("حزمة التشفير غير مكتملة أو غير صالحة.");
  }
  const salt = base64ToBytes(envelope.salt);
  const iv = base64ToBytes(envelope.iv);
  const cipher = base64ToBytes(envelope.cipher);
  const key = await deriveAesGcmKey(passphrase, salt);
  const plainBuf = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    cipher
  );
  const dec = new TextDecoder();
  return JSON.parse(dec.decode(plainBuf));
}

/* ==================================================================== *
 *  الميزة #1: المزامنة السحابية المشفرة صفرية المعرفة (E2EE Cloud Sync)
 * ==================================================================== */
function CloudSyncVaultCard({ state, setState, onNotice }) {
  const vaultFileRef = useRef(null);
  const [config, setConfig] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(E2EE_CONFIG_KEY) || "{}");
      return {
        endpoint: saved.endpoint || DEFAULT_E2EE_ENDPOINT,
        apiKey: saved.apiKey || "",
        passphrase: saved.passphrase || "",
        autoSync: Boolean(saved.autoSync),
        lastSyncAt: saved.lastSyncAt || null,
        lastFingerprint: saved.lastFingerprint || null,
      };
    } catch {
      return {
        endpoint: DEFAULT_E2EE_ENDPOINT,
        apiKey: "",
        passphrase: "",
        autoSync: false,
        lastSyncAt: null,
        lastFingerprint: null,
      };
    }
  });
  const [busy, setBusy] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const saveConfig = (patch) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(E2EE_CONFIG_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const applyDecryptedState = (parsed) => {
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.habits)) {
      throw new Error("البيانات المسترجعة ليست نسخة صالحة من أثر Life OS.");
    }
    const ver = Number(parsed.schema);
    const from = Number.isFinite(ver) && ver > 0 ? ver : 0;
    setState(rollDay(migrate({ ...freshState(), ...parsed, schema: from })));
  };

  const handlePushCloud = async () => {
    if (!config.passphrase || config.passphrase.trim().length < 4) {
      onNotice?.({
        ok: false,
        text: "أدخل كلمة سر التشفير (4 أحرف على الأقل) لحماية بياناتك قبل الرفع.",
      });
      return;
    }
    setBusy(true);
    try {
      const envelope = await encryptStateEnvelope(state, config.passphrase.trim());
      const headers = {
        "content-type": "application/json",
        "x-local-sync": "1",
      };
      if (config.apiKey.trim()) {
        headers.Authorization = config.apiKey.trim().startsWith("Bearer ")
          ? config.apiKey.trim()
          : `Bearer ${config.apiKey.trim()}`;
      }

      const res = await fetch(config.endpoint.trim() || DEFAULT_E2EE_ENDPOINT, {
        method: "POST",
        headers,
        body: JSON.stringify({ data: envelope, envelope }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const stampNow = new Date().toLocaleTimeString("ar-SA", {
        hour: "2-digit",
        minute: "2-digit",
      });
      saveConfig({
        lastSyncAt: stampNow,
        lastFingerprint: envelope.fingerprint,
      });
      onNotice?.({
        ok: true,
        text: `🔒 تم تشفير البيانات (AES-256-GCM) ورفعها للسحابة بنجاح! البصمة: ${envelope.fingerprint}`,
      });
    } catch (err) {
      onNotice?.({
        ok: false,
        text: `تعذّر الرفع للسحابة (${err?.message || "تأكد من الرابط"}). يمكنك أيضاً تنزيل ملف خزنة مشفر (.losvault).`,
      });
    } finally {
      setBusy(false);
    }
  };

  const handlePullCloud = async () => {
    if (!config.passphrase || config.passphrase.trim().length < 4) {
      onNotice?.({
        ok: false,
        text: "أدخل كلمة سر التشفير لفك قفل الخزنة السحابية.",
      });
      return;
    }
    setBusy(true);
    try {
      const headers = {};
      if (config.apiKey.trim()) {
        headers.Authorization = config.apiKey.trim().startsWith("Bearer ")
          ? config.apiKey.trim()
          : `Bearer ${config.apiKey.trim()}`;
      }
      const res = await fetch(config.endpoint.trim() || DEFAULT_E2EE_ENDPOINT, {
        method: "GET",
        headers,
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const raw = await res.json();
      const envelope =
        raw?.cipher
          ? raw
          : raw?.envelope?.cipher
            ? raw.envelope
            : raw?.data?.cipher
              ? raw.data
              : raw?.record?.envelope || raw?.record || null;

      const decrypted = await decryptStateEnvelope(envelope, config.passphrase.trim());
      applyDecryptedState(decrypted);
      const stampNow = new Date().toLocaleTimeString("ar-SA", {
        hour: "2-digit",
        minute: "2-digit",
      });
      saveConfig({
        lastSyncAt: stampNow,
        lastFingerprint: envelope.fingerprint || "VERIFIED",
      });
      onNotice?.({
        ok: true,
        text: "🔓 تم جلب الخزنة السحابية وفك تشفيرها (Zero-Knowledge) وتحديث بياناتك بنجاح!",
      });
    } catch {
      onNotice?.({
        ok: false,
        text: "تعذّر فك التشفير أو الجلب — تأكّد من مطابقة كلمة سر التشفير أو وجود نسخة مرفوعة.",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleExportEncryptedVault = async () => {
    if (!config.passphrase || config.passphrase.trim().length < 4) {
      onNotice?.({
        ok: false,
        text: "أدخل كلمة سر التشفير أولاً لتصدير خزنة مشفرة (.losvault).",
      });
      return;
    }
    setBusy(true);
    try {
      const envelope = await encryptStateEnvelope(state, config.passphrase.trim());
      const blob = new Blob([JSON.stringify(envelope, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `athar-vault-e2ee-${dayKey()}.losvault.json`;
      a.click();
      URL.revokeObjectURL(url);
      saveConfig({
        lastFingerprint: envelope.fingerprint,
      });
      onNotice?.({
        ok: true,
        text: `🔒 تم تنزيل ملف الخزنة المشفر (AES-256) ببصمة ${envelope.fingerprint}`,
      });
    } catch {
      onNotice?.({ ok: false, text: "تعذّر إنشاء الخزنة المشفرة." });
    } finally {
      setBusy(false);
    }
  };

  const handleImportEncryptedVault = async (file) => {
    if (!file) return;
    if (!config.passphrase || config.passphrase.trim().length < 4) {
      onNotice?.({
        ok: false,
        text: "أدخل كلمة سر التشفير أولاً قبل اختيار ملف الخزنة المشفر.",
      });
      return;
    }
    setBusy(true);
    try {
      const raw = JSON.parse(await file.text());
      const envelope = raw?.cipher ? raw : raw?.envelope || raw?.data;
      const decrypted = await decryptStateEnvelope(envelope, config.passphrase.trim());
      applyDecryptedState(decrypted);
      onNotice?.({
        ok: true,
        text: "🔓 تم فك تشفير ملف الخزنة (.losvault) واستعادة بياناتك بالكامل!",
      });
    } catch {
      onNotice?.({
        ok: false,
        text: "فشل فك التشفير — كلمة السر غير صحيحة أو الملف تالف.",
      });
    } finally {
      setBusy(false);
    }
  };

  // مزامنة تلقائية عند تفعيل الخيار وتوفر كلمة السر
  useEffect(() => {
    if (!config.autoSync || !config.passphrase || config.passphrase.trim().length < 4) {
      return;
    }
    const timer = setTimeout(() => {
      encryptStateEnvelope(state, config.passphrase.trim())
        .then((envelope) =>
          fetch(config.endpoint.trim() || DEFAULT_E2EE_ENDPOINT, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-local-sync": "1",
            },
            body: JSON.stringify({ data: envelope, envelope }),
          }).then((res) => {
            if (res.ok) {
              saveConfig({
                lastSyncAt: new Date().toLocaleTimeString("ar-SA", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                lastFingerprint: envelope.fingerprint,
              });
            }
          })
        )
        .catch(() => {});
    }, 3500);
    return () => clearTimeout(timer);
  }, [state, config.autoSync, config.passphrase, config.endpoint]);

  return (
    <div
      className="space-y-3.5 rounded-2xl border p-4"
      style={{
        borderColor: `${T.primary}45`,
        background:
          "linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(15,23,42,0.5) 100%)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-xl border"
            style={{
              borderColor: `${T.primary}55`,
              background: `${T.primary}20`,
              color: T.primaryLift,
            }}
          >
            <ShieldCheck size={16} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-[13px] font-extrabold text-white">
                المزامنة السحابية المشفرة (Zero-Knowledge E2EE)
              </h4>
              <Badge tint={T.primary}>AES-256-GCM</Badge>
            </div>
            <p className="text-[10.5px] text-white/50">
              تُشفّر بياناتك داخل جهازك بكلمة سرك الخاصة قبل مغادرته لأي سحابة أو ملف
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10.5px] font-bold text-white/70 hover:bg-white/10"
        >
          {showAdvanced ? "إخفاء الخادم" : "إعدادات الخادم ⚙️"}
        </button>
      </div>

      {/* كلمة سر التشفير */}
      <div>
        <label className="mb-1 flex items-center justify-between text-[11px] font-bold text-white/70">
          <span className="flex items-center gap-1">
            <Lock size={12} style={{ color: T.accent }} /> مفتاح التشفير السري (Passphrase)
          </span>
          {config.lastFingerprint && (
            <span dir="ltr" className="font-mono text-[10px] text-emerald-300/80">
              SHA-256: {config.lastFingerprint}
            </span>
          )}
        </label>
        <input
          type="password"
          value={config.passphrase}
          onChange={(e) => saveConfig({ passphrase: e.target.value })}
          placeholder="أدخل كلمة سر قوية لتشفير وفك تشفير خزنتك..."
          className="w-full rounded-xl border border-white/15 bg-black/35 px-3.5 py-2 text-[12.5px] text-white outline-none focus:border-emerald-400/60"
        />
      </div>

      {showAdvanced && (
        <div className="space-y-2.5 rounded-xl border border-white/10 bg-black/30 p-3">
          <div>
            <label className="mb-1 block text-[10.5px] font-bold text-white/60">
              رابط خادم المزامنة السحابية (REST / Supabase / JSONBin / Local Relay)
            </label>
            <input
              dir="ltr"
              type="text"
              value={config.endpoint}
              onChange={(e) => saveConfig({ endpoint: e.target.value })}
              placeholder={DEFAULT_E2EE_ENDPOINT}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 font-mono text-[11.5px] text-white/90 outline-none focus:border-white/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10.5px] font-bold text-white/60">
              مفتاح المصادقة الاختياري (Bearer Token / API Key)
            </label>
            <input
              dir="ltr"
              type="password"
              value={config.apiKey}
              onChange={(e) => saveConfig({ apiKey: e.target.value })}
              placeholder="Bearer eyJhbGci..."
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 font-mono text-[11.5px] text-white/90 outline-none focus:border-white/30"
            />
          </div>
          <label className="flex cursor-pointer items-center justify-between pt-1 text-[11.5px] font-bold text-white/75">
            <span>مزامنة مشفرة تلقائية عند تعديل البيانات</span>
            <input
              type="checkbox"
              checked={config.autoSync}
              onChange={(e) => saveConfig({ autoSync: e.target.checked })}
              className="h-4 w-4 accent-emerald-500"
            />
          </label>
        </div>
      )}

      {/* أزرار الرفع والجلب المشفر */}
      <div className="grid grid-cols-2 gap-2">
        <Btn
          variant="default"
          size="sm"
          disabled={busy}
          onClick={handlePushCloud}
          className="w-full justify-center"
        >
          {busy ? <RefreshCw size={14} className="animate-spin" /> : <Lock size={14} />}
          تشفير ورفع للسحابة
        </Btn>
        <Btn
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={handlePullCloud}
          className="w-full justify-center"
        >
          <RefreshCw size={14} />
          جلب وفك التشفير
        </Btn>
      </div>

      {/* أزرار ملفات الخزنة المشفرة المحمولة (.losvault) */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          disabled={busy}
          onClick={handleExportEncryptedVault}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-white/80 transition-colors hover:bg-white/10"
        >
          <Download size={13} /> تصدير خزنة مشفرة (.losvault)
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => vaultFileRef.current?.click()}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-white/80 transition-colors hover:bg-white/10"
        >
          <Upload size={13} /> استيراد خزنة مشفرة
        </button>
        <input
          ref={vaultFileRef}
          type="file"
          accept=".json,.losvault"
          className="sr-only"
          onChange={(e) => {
            handleImportEncryptedVault(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>

      {config.lastSyncAt && (
        <div className="flex items-center justify-between border-t border-white/10 pt-2 text-[10.5px] text-emerald-300/80">
          <span className="flex items-center gap-1">
            <CheckCheck size={12} /> آخر مزامنة مشفرة: {config.lastSyncAt}
          </span>
          <span>PBKDF2 100K · صفرية المعرفة</span>
        </div>
      )}
    </div>
  );
}

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

        {/* الميزة #1: المزامنة السحابية المشفرة صفرية المعرفة (E2EE Cloud Sync) */}
        <CloudSyncVaultCard state={state} setState={setState} onNotice={setNote} />

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
