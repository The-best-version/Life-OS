/* --- عامل الخدمة: يفتح الموقع ولو انقطعت الشبكة -----------------------------
 *  نفس فكرة `life-os/sw.js` بالحرف، بفارق واحد يستحق التعليق: نطاقه
 *  الافتراضي كان سيكون /gym/ فقط (مكان هذا الملف)، بينما الموقع يستورد
 *  منطقه الحقيقي من /src/state/*.mjs — خارج ذاك النطاق تماماً. الخادم
 *  (`local-sync-server.js`) يرسل ترويسة `Service-Worker-Allowed: /` عند
 *  تقديم هذا الملف تحديداً، فيتوسّع نطاقه للأصل كله ويقدر يرى /src/ أيضاً.
 *
 *  التخزين المؤقّت هنا **انتهازي**، لا قائمة ثابتة يجب تحديثها يدوياً:
 *  أي طلب GET ناجح داخل النطاق يُحفَظ تلقائياً بعد كل زيارة فعلية. يعني
 *  ملف شاشة جديد تضيفه بنفسك بـVS Code يصير متاحاً بلا اتصال من أول مرة
 *  تُحمَّل فيها الصفحة أونلاين — لا حاجة تعدّل قائمة هنا كل مرة تضيف شاشة.
 *
 *  ما يبقى خارج التخزين دائماً: `/state` و`/sync` — حالة اليوم لازم تُقرأ
 *  من القرص الحقيقي أو تُرفَض بوضوح، لا أن تُقرأ من نسخة بالأمس وتبدو
 *  جديدة. هذا نفس الاستثناء الذي يحمله sw.js الأصلي حرفياً.
 * --------------------------------------------------------------------- */
const CACHE_NAME = "life-os-gym-v1";

/* القشرة الدنيا التي يحتاجها أول فتح بلا شبكة إطلاقاً — صفحة فارغة بلا
   هذي القائمة لا تملك حتى الصفحة لترسم عليها خطأ. كل شيء غيرها (الشاشات،
   طبقة الحالة) يُحفَظ انتهازياً أول ما يُزار. */
const SHELL = [
  "./",
  "./index.html",
  "./gym-app.js",
  "./manifest.webmanifest",
  "./icon.svg",
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(SHELL).catch(() => {})));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  /* القراءة والكتابة الحقيقيتان تمران من هنا دائماً بلا تدخّل — لا تخزين،
     لا رد مؤجَّل. وغير GET (أي POST /sync) يمرّ كما هو لنفس السبب. */
  if (e.request.method !== "GET" || url.pathname === "/state" || url.pathname.startsWith("/sync")) {
    return;
  }
  /* خارج النطاق الذي يعنينا (مثل بقية Life OS على نفس الأصل) — لا داعي
     نتدخّل فيه، عامل الخدمة الخاص به إن وُجد هو المسؤول عنه. */
  if (!url.pathname.startsWith("/gym/") && !url.pathname.startsWith("/src/")) {
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match("./index.html"))),
  );
});
