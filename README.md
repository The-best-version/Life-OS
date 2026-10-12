# 2027 Life OS — خريطة المشروع

مجلد عمل واحد يضم ثلاثة تطبيقات وخدمتين خلفيتين. القواعد الملزِمة للتعديل كلها في
[`CLAUDE.md`](CLAUDE.md)؛ هذا الملف للتشغيل والتوجّه فقط.

---

## التشغيل بنقرة واحدة

| ما تريده | من VS Code | من الطرفية |
|---|---|---|
| **فتح التطبيق** (بناء + خادم + Chrome) | `Ctrl+Shift+P` → `Tasks: Run Task` → **فتح 2027 Life OS في Chrome** | `npm run dev` |
| **بناء فقط** (يشغّل الاختبارات أولاً) | `Ctrl+Shift+B` | `npm run build` |
| **الاختبارات** | `Tasks: Run Task` → **الاختبارات** | `npm test` |
| **خادم تجريبي معزول** (منفذ 47699) | `Tasks: Run Task` → **خادم تجريبي** | `npm run serve:test` |
| **تحديث الرسوم البيانية** | `Tasks: Run Task` → **تحديث الرسوم** | `npm run report` |
| **بوت تيليجرام** | — | `npm run bot` |
| تثبيت حزمة البوت (مرة واحدة) | — | `npm run bot:install` |
| معرفة رقم محادثتك في تيليجرام | — | `npm run bot:whoami` |
| خادم الحفظ في الواجهة (للتشخيص) | — | `npm run serve` |
| تطوير Iron Log | — | `npm run iron-log` |

خارج VS Code: اختصار **`افتح 2027 Life OS.lnk`** في الجذر — يشغّل الخادم إن كان
متوقفاً، ينتظره، ثم يفتح التطبيق المثبّت في Chrome.

> **لا تفتح نسخة ثانية من التطبيق على المنفذ 47615 والنسخة الأصلية مفتوحة.** كل نسخة
> تكتب لقطتها كاملة على القرص بعد ثوانٍ من فتحها، فنسخة فُتحت للتحقّق عشرين ثانية قد
> تطمس عادة سجّلها في تلك الثواني. للتحقّق استخدم `npm run serve:test`.

## ماذا يعمل في الخلفية

| العملية | أين | كيف تبدأ | التكلفة |
|---|---|---|---|
| خادم الحفظ المحلي | `services/local-sync-server.js` | اختصار في `shell:startup` | ~1 ثانية معالج في اليوم |
| بوت تيليجرام | `services/telegram-bot/bot.js` | اختصار في `shell:startup` ✓ | Long polling + قراءة الجدول كل دقيقة |
| مراقب الرسوم (`--watch`) | `services/report-agent.js` | **موقوف** — نسخة معطّلة في `services/launchers/` | — |
| تحديث الرسوم عند كل commit | `.git/hooks/pre-commit` | تلقائي | ~110 مللي ثانية |

لا يوجد أي Polling في أي منهما: المؤقتات مربوطة بأوقات الأذان و`unref()`، والمراقبة
بالأحداث لا بالمسح الدوري. إن أحسست بتعليق، فالمشكلة في فهرسة المحرِّر لا هنا —
وهذا ما يعالجه [`.vscode/settings.json`](.vscode/settings.json).

## خريطة المجلدات

```
الجذر          package.json  README.md  CLAUDE.md  .gitignore
               .vscode/  .claude/  افتح 2027 Life OS.lnk  افتح Iron Log.lnk

src/           كود التطبيق — وحده. نقطة الدخول src/LifeOS.jsx
  components/  البدائل المشتركة بين شاشتين أو أكثر
  features/    الشاشات (اليوم، الروتين، الأهداف، الجامعة، …)
  layouts/     التنقّل والأرضية
  state/       الحِمل المحفوظ: المخطّط، الهجرات، البذور، الأشكال
  utils/       مسار الحفظ وحساب أوقات الصلاة

tests/         node --test — تُشغَّل تلقائياً قبل كل بناء
scripts/       build-life-os.mjs        ← الطريقة الوحيدة لإنتاج الموقع
  step/        أدوات بناء بنوك أسئلة STEP (تُشغَّل يدوياً، مرة كل حين)
services/      local-sync-server.js  report-agent.js
  telegram-bot/ بوت الإدخال السريع — الحزمة الوحيدة المثبّتة في المستودع
  launchers/   مشغّلات Windows (vbs/cmd) + الاختصار المعطّل
apps/
  step-arena/  step-arena.html + bank-grammar.js + bank-vocab.js (الثلاثة معاً)
  focus-flow/  صفحة ثابتة + serve.ps1 (تحسب جذرها من $PSScriptRoot)
  suhail-project/ أربع صفحات عرض لمشروع سهيل

life-os/       ناتج البناء المنشور — يُخدَم على http://127.0.0.1:47615/
graphify-out/  الرسوم البيانية و data/lifeos.json (حالتك على القرص)
backups/       auto (ساعة) · daily (يوم) · guard (قبل كل كتابة ناقصة) · manual
docs/          خطة الإصلاح، السيرة الذاتية
archive/       مسوّدات مُستبدَلة — لا تُحذف، تُستبدَل
iron-log/      تطبيق مستقل (Next.js) — ومنه يستعير البناء esbuild وTailwind
Businessman/   خزانة Obsidian
```

`iron-log/` و`Businessman/` بقيا في الجذر بقصد: الأول يستورد منه البناء حِزَمه
(`iron-log/node_modules`) ويفتحه اختصار بمسار مطلق، والثاني خزانة Obsidian يحفظ
البرنامج مسارها عنده — نقلهما يكسر أداة خارج هذا المستودع، لا ملفاً فيه.

### ثلاث قواعد لا تُكسَر عند النقل

1. **`apps/step-arena/` الثلاثة تتحرّك معاً.** الصفحة تحمّل البنكين بـ
   `<script src="bank-grammar.js">` نسبي؛ فصلهما يفتح الصفحة بلا أسئلة.
2. **كل ملف في `services/` و`scripts/` يحسب الجذر من `__dirname` ويصعد مستوى.** لا
   مسارات مكتوبة نصّاً: هذا بالضبط ما كسره النقل الأول (أحد عشر سكريبت كانت تحمل
   `e:/claude code/...`).
3. **لا `"type"` في `package.json` الجذر.** ملفات `.js` هنا CommonJS و`.mjs` ESM؛
   إعلان أيّ نوع يكسر النصف الآخر. الاستثناء الوحيد
   `services/telegram-bot/package.json` ومعه `"type": "module"` — وهو يسري على ذلك
   المجلد وحده، لأن Node يقرأ أقرب `package.json` للملف لا أعلاه.

## أين تعدّل ماذا

| تريد تعديل | الملف |
|---|---|
| شاشة في التطبيق | `src/features/life-<name>.jsx` |
| قائمة عادات/أهداف/كتب (بذور) | `src/state/life-state-<domain>.mjs` + ترقية `SCHEMA` |
| بطاقة أو زر مشترك | `src/components/life-shared.jsx` |
| ترتيب التبويبات أو الشريط | `src/layouts/life-nav.jsx` |
| حفظ القرص، النسخ، التعارض | `services/local-sync-server.js` |
| ما يفهمه البوت من رسالة | `services/telegram-bot/parse.js` |
| ما تفعله الرسالة بالحالة | `services/telegram-bot/actions.js` |
| ما يرسله البوت دون طلب | شاشة «بوت تيليجرام» في الموقع (تكتب `state.bot`) |
| نصّ التذكيرات وتسليح مؤقّتاتها | `services/telegram-bot/reminders.js` |
| تذكيرات Windows | `services/local-sync-server.js` + `src/utils/prayer-times.mjs` |
| خطوات البناء أو CSS المسحوب | `scripts/build-life-os.mjs` (المصفوفتان `scanned` و`shipped`) |

بعد **أي** تعديل تحت `src/`: `npm run build`. تعديل `life-os/index.html` بيدك هو
تعديل ناتج بناء — يُمحى في المرة القادمة.
