/* --- صور التقدّم: التصغير والرفع والحذف -------------------------------------
 *  البايتات لا تدخل حالة Life OS أبداً — انظر تعليق `GYM_PHOTOS` في
 *  `local-sync-server.js` لسبب ذلك. هذا الملف يعيد ترميز الصورة إلى JPEG
 *  مصغّرة *قبل* إرسالها، ثم يرفعها إلى `/gym-photos` التي تردّ باسم ملف،
 *  والسطر الذي يشير إليه (`logPhoto`) هو وحده ما يدخل الحالة.
 *
 *  التصغير في المتصفح، لا على الخادم: صورة جوال خام ٨–١٢ ميجابكسل غير
 *  مصغَّرة تعني رفع ميجابايتات كل مرة فوق تيلسكيل، وخادم محلي يعيد ترميز
 *  صوراً ليس عمله الحقيقي.
 * --------------------------------------------------------------------- */

/* أطول ضلع ١٢٨٠ بكسل يكفي لمقارنة بصرية واضحة على أي شاشة، وأبعد من ذلك
   تفصيل لا يُرى عملياً مقابل حجم ملف أكبر بلا داعٍ. */
const MAX_DIM = 1280;
const QUALITY = 0.82;

/* يقرأ ملفاً (من input type="file" أو كاميرا الجوال مباشرة) ويعيده
   data URL من نوع JPEG مصغَّراً — الصيغة الوحيدة التي يقبلها `/gym-photos`. */
export async function shrinkToJPEG(file, maxDim = MAX_DIM, quality = QUALITY) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return canvas.toDataURL("image/jpeg", quality);
}

export class PhotoUploadError extends Error {}

/* يرفع ملفاً ويعيد `{ filename }` — لا يكتب شيئاً في حالة Life OS؛ تلك
   خطوة ثانية منفصلة (`logPhoto`) بعد أن يرجع هذا الرفع بنجاح، لأن سطر
   حالة يشير إلى ملف لم يُرفَع بعد أسوأ من عدم كتابة السطر أصلاً. */
export async function uploadPhoto(date, file) {
  let dataUrl;
  try {
    dataUrl = await shrinkToJPEG(file);
  } catch {
    throw new PhotoUploadError("ما قدرت أقرأ الصورة — جرّب ملفاً آخر.");
  }
  let res;
  try {
    res = await fetch("/gym-photos", {
      method: "POST",
      headers: { "content-type": "application/json", "x-local-sync": "1" },
      body: JSON.stringify({ date, dataUrl }),
    });
  } catch {
    throw new PhotoUploadError("الرفع ما وصل للخادم. تحقّق من الاتصال.");
  }
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new PhotoUploadError(msg || `الرفع رُفض (${res.status}).`);
  }
  return res.json();
}

export async function deletePhotoFile(filename) {
  try {
    await fetch("/gym-photos/delete", {
      method: "POST",
      headers: { "content-type": "application/json", "x-local-sync": "1" },
      body: JSON.stringify({ filename }),
    });
  } catch {
    /* لو ما وصل الحذف للخادم، سطر الحالة يُحذَف مع ذلك (الطبقة التي
       تنادي هذه الدالة لا تنتظرها لتحذف السطر) — ملف يتيم على القرص أهون
       من سطر حالة يشير لصورة اختفت من واجهته ولم يختفِ من القرص. */
  }
}
