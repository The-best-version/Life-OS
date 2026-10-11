const fs = require('fs');
const path = require('path');
// Paths are resolved from this file's place in scripts/step/, never typed out:
// the project moved once and every hardcoded 'e:/claude code/...' in here
// broke silently, writing nothing and reporting success.
const ROOT = path.join(__dirname, '..', '..');
const bankPath = path.join(ROOT, 'apps/step-arena/bank-grammar.js');
let bank = fs.readFileSync(bankPath, 'utf8');

const newQs = [
  // Inversion (5)
  { id: 'bg_141', sec: 'Grammar', sub: 'inversion', diff: 2, q: "Scarcely ___ the door when the phone rang.", opts: ["he had opened", "he opened", "had he opened", "did he open"], ans: 2, exp: 'عند البدء بظرف زماني يدل على الندرة أو النفي (مثل Scarcely) يجب تقديم الفعل المساعد على الفاعل.' },
  { id: 'bg_142', sec: 'Grammar', sub: 'inversion', diff: 3, q: "Under no circumstances ___ allowed to leave early.", opts: ["employees are", "are employees", "employees have", "have employees"], ans: 1, exp: 'العبارات النافية في بداية الجملة (Under no circumstances) تتطلب قلب الفعل المساعد والفاعل.' },
  { id: 'bg_143', sec: 'Grammar', sub: 'inversion', diff: 2, q: "Not until the rain stopped ___ the game.", opts: ["did they resume", "they resumed", "they did resume", "had they resumed"], ans: 0, exp: 'بعد العبارة (Not until) والجملة التابعة لها، نقوم بعملية القلب في الجملة الرئيسية بتقديم الفعل المساعد.' },
  { id: 'bg_144', sec: 'Grammar', sub: 'inversion', diff: 3, q: "Little ___ that his life was about to change.", opts: ["did he know", "he knew", "he did know", "knew he"], ans: 0, exp: 'كلمة (Little) في بداية الجملة تفيد النفي وتتطلب وضع الفعل المساعد قبل الفاعل.' },
  { id: 'bg_145', sec: 'Grammar', sub: 'inversion', diff: 2, q: "On no account ___ open this box.", opts: ["you should", "you must", "must you", "you can"], ans: 2, exp: 'عبارة النفي (On no account) تتطلب تقديم الفعل المساعد أو الناقص على الفاعل.' },

  // Participles (5)
  { id: 'bg_146', sec: 'Grammar', sub: 'participles', diff: 2, q: "___ by the loud noise, the baby woke up crying.", opts: ["Frightening", "Frighten", "Frightened", "To frighten"], ans: 2, exp: 'نستخدم اسم المفعول للتعبير عن التأثر بالحدث (أن الطفل قد أُفزع).' },
  { id: 'bg_147', sec: 'Grammar', sub: 'participles', diff: 3, q: "___ my keys, I couldn't enter the house.", opts: ["Having lost", "Lost", "Losing", "Have lost"], ans: 0, exp: 'للتعبير عن حدث اكتمل قبل حدث آخر في أشباه الجمل، نستخدم (Having + التصريف الثالث).' },
  { id: 'bg_148', sec: 'Grammar', sub: 'participles', diff: 1, q: "The boy ___ in the corner is my cousin.", opts: ["stands", "standing", "stood", "is standing"], ans: 1, exp: 'نستخدم اسم الفاعل كوصف مختصر بدلاً من عبارة الوصل المباشرة (الولد الواقف).' },
  { id: 'bg_149', sec: 'Grammar', sub: 'participles', diff: 2, q: "___ tired, she decided to go to bed early.", opts: ["Feel", "Felt", "Feeling", "To feel"], ans: 2, exp: 'يُستخدم اسم الفاعل لربط سببين ببعضهما (بسبب شعورها بالتعب).' },
  { id: 'bg_150', sec: 'Grammar', sub: 'participles', diff: 3, q: "___ in 1990, the building is now a historical monument.", opts: ["Building", "Built", "Build", "Having building"], ans: 1, exp: 'نبدأ شبه الجملة الوصفية باسم المفعول (Built) لأن المبنى وقع عليه فعل البناء.' },

  // Subjunctive (5)
  { id: 'bg_151', sec: 'Grammar', sub: 'subjunctive', diff: 2, q: "It is crucial that she ___ on time.", opts: ["arrives", "arrived", "arrive", "will arrive"], ans: 2, exp: 'بعد الصفات الدالة على الأهمية (crucial, important) نستخدم الفعل في صيغة المصدر المجرد مع كل الضمائر.' },
  { id: 'bg_152', sec: 'Grammar', sub: 'subjunctive', diff: 3, q: "The doctor suggested that he ___ smoking immediately.", opts: ["stops", "stop", "stopped", "would stop"], ans: 1, exp: 'الأفعال التي تفيد الاقتراح أو الطلب يتبعها فعل مصدر مجرد بدون أي إضافات.' },
  { id: 'bg_153', sec: 'Grammar', sub: 'subjunctive', diff: 2, q: "I wish I ___ a million dollars.", opts: ["have", "had", "would have", "will have"], ans: 1, exp: 'بعد فعل التمني للتعبير عن أمنية غير حقيقية في الحاضر نستخدم الماضي البسيط.' },
  { id: 'bg_154', sec: 'Grammar', sub: 'subjunctive', diff: 3, q: "It's high time you ___ studying for the exam.", opts: ["start", "started", "have started", "will start"], ans: 1, exp: 'عبارة (high time) يتبعها دائماً فعل في الماضي البسيط للتعبير عن ضرورة البدء بعمل ما.' },
  { id: 'bg_155', sec: 'Grammar', sub: 'subjunctive', diff: 2, q: "He acts as if he ___ the boss.", opts: ["is", "was", "were", "has been"], ans: 2, exp: 'بعد (as if) في الحالات التخيلية نستخدم (were) مع جميع الضمائر.' },

  // Causative (5)
  { id: 'bg_156', sec: 'Grammar', sub: 'causative', diff: 1, q: "I am going to have my hair ___ tomorrow.", opts: ["cut", "cutting", "cuts", "to cut"], ans: 0, exp: 'الصيغة السببية تتكون من (have + شيء + التصريف الثالث) لتدل على أن شخصاً آخر سيقوم بالفعل لك.' },
  { id: 'bg_157', sec: 'Grammar', sub: 'causative', diff: 2, q: "She got her brother ___ her with the luggage.", opts: ["help", "helped", "to help", "helping"], ans: 2, exp: 'الفعل السببي (get + شخص) يتبعه (to + المصدر).' },
  { id: 'bg_158', sec: 'Grammar', sub: 'causative', diff: 2, q: "We had the plumber ___ the leaking pipe.", opts: ["fix", "fixed", "to fix", "fixing"], ans: 0, exp: 'الفعل السببي (have + شخص) يتبعه المصدر المجرد بدون to.' },
  { id: 'bg_159', sec: 'Grammar', sub: 'causative', diff: 3, q: "He made his son ___ the car.", opts: ["wash", "to wash", "washed", "washing"], ans: 0, exp: 'الفعل (make) في المعلوم يتبعه مفعول به ثم المصدر المجرد بدون إضافات.' },
  { id: 'bg_160', sec: 'Grammar', sub: 'causative', diff: 2, q: "I need to get my watch ___.", opts: ["repair", "repairing", "repaired", "to repair"], ans: 2, exp: 'مثل فعل have، عندما نستخدم (get + شيء) نضع بعده الفعل في التصريف الثالث.' },

  // Reported Speech (5)
  { id: 'bg_161', sec: 'Grammar', sub: 'reported_speech', diff: 1, q: "He said, 'I am tired.' -> He said that he ___ tired.", opts: ["is", "was", "has been", "had been"], ans: 1, exp: 'المضارع البسيط في الكلام المباشر يتحول إلى ماضٍ بسيط في الكلام المنقول.' },
  { id: 'bg_162', sec: 'Grammar', sub: 'reported_speech', diff: 2, q: "She asked me where I ___ going.", opts: ["am", "was", "were", "have been"], ans: 1, exp: 'في الأسئلة المنقولة، يتم تحويل زمن الفعل إلى الماضي (was) ويوضع بعد الفاعل.' },
  { id: 'bg_163', sec: 'Grammar', sub: 'reported_speech', diff: 3, q: "He said he ___ his keys the previous day.", opts: ["lost", "has lost", "had lost", "would lose"], ans: 2, exp: 'الماضي البسيط في الكلام المباشر (أمس) يتحول إلى الماضي التام (had lost).' },
  { id: 'bg_164', sec: 'Grammar', sub: 'reported_speech', diff: 2, q: "She told me ___ the door.", opts: ["to close", "close", "closing", "closed"], ans: 0, exp: 'صيغة الأمر في الكلام المنقول تأخذ (to + المصدر).' },
  { id: 'bg_165', sec: 'Grammar', sub: 'reported_speech', diff: 3, q: "He asked if I ___ to the party tonight.", opts: ["will come", "come", "would come", "came"], ans: 2, exp: 'المستقبل باستخدام (will) في الكلام المباشر يتحول إلى (would) في الكلام المنقول.' },

  // Conjunctions (5)
  { id: 'bg_166', sec: 'Grammar', sub: 'conjunctions', diff: 1, q: "I wanted to go out, ___ it was raining heavily.", opts: ["so", "because", "but", "or"], ans: 2, exp: 'للربط بين فكرتين متعارضتين (الرغبة في الخروج والمطر) نستخدم but.' },
  { id: 'bg_167', sec: 'Grammar', sub: 'conjunctions', diff: 2, q: "___ it was cold, she didn't wear a coat.", opts: ["Because", "Although", "Despite", "In spite of"], ans: 1, exp: 'نستخدم Although لأن ما بعدها جملة كاملة (فاعل وفعل) للتعبير عن التناقض.' },
  { id: 'bg_168', sec: 'Grammar', sub: 'conjunctions', diff: 3, q: "___ his illness, he managed to finish the report.", opts: ["Because", "Although", "Despite", "However"], ans: 2, exp: 'نستخدم Despite لأن ما بعدها اسم (مرضه) وليس جملة كاملة.' },
  { id: 'bg_169', sec: 'Grammar', sub: 'conjunctions', diff: 2, q: "He was very tired; ___, he kept working.", opts: ["therefore", "moreover", "however", "because"], ans: 2, exp: 'للربط بين جملتين منفصلتين مع إظهار تناقض مفاجئ نستخدم however.' },
  { id: 'bg_170', sec: 'Grammar', sub: 'conjunctions', diff: 2, q: "Either you study hard ___ you will fail.", opts: ["nor", "and", "or", "but"], ans: 2, exp: 'كلمة Either ترتبط دائماً بكلمة or لتقديم خيارين.' },

  // Gerunds & Infinitives (5)
  { id: 'bg_171', sec: 'Grammar', sub: 'gerunds_infinitives', diff: 1, q: "She enjoys ___ books in the evening.", opts: ["read", "to read", "reading", "reads"], ans: 2, exp: 'الفعل يستمتع يُتبع دائماً بالفعل مضافاً له ing.' },
  { id: 'bg_172', sec: 'Grammar', sub: 'gerunds_infinitives', diff: 2, q: "He decided ___ a new car.", opts: ["buying", "buy", "bought", "to buy"], ans: 3, exp: 'الفعل قرر يتبعه المصدر المسبوق بحرف الجر (to).' },
  { id: 'bg_173', sec: 'Grammar', sub: 'gerunds_infinitives', diff: 3, q: "I regret ___ you that the flight is cancelled.", opts: ["to inform", "informing", "inform", "informed"], ans: 0, exp: 'الفعل يأسف يأخذ (to) عند الإعلان عن أخبار سيئة في المستقبل أو الحاضر، ويأخذ (ing) للندم على الماضي.' },
  { id: 'bg_174', sec: 'Grammar', sub: 'gerunds_infinitives', diff: 2, q: "Would you mind ___ the window?", opts: ["to close", "close", "closing", "closed"], ans: 2, exp: 'عبارة الطلب المهذب (هل تمانع) يتبعها الفعل مضافاً له ing.' },
  { id: 'bg_175', sec: 'Grammar', sub: 'gerunds_infinitives', diff: 3, q: "He stopped ___ a quick lunch before driving again.", opts: ["eating", "to eat", "eat", "eaten"], ans: 1, exp: 'الفعل توقف إذا تبعه (to) يعني أنه توقف لكي يفعل شيئاً جديداً (الأكل).' },

  // Adjectives & Adverbs (5)
  { id: 'bg_176', sec: 'Grammar', sub: 'adjectives_adverbs', diff: 1, q: "He drives very ___.", opts: ["careful", "carefully", "care", "caring"], ans: 1, exp: 'لوصف فعل القيادة نحتاج إلى ظرف (carefully) وليس صفة.' },
  { id: 'bg_177', sec: 'Grammar', sub: 'adjectives_adverbs', diff: 2, q: "This soup smells ___.", opts: ["good", "well", "nicely", "terribly"], ans: 0, exp: 'أفعال الحواس (مثل يشم أو يبدو) تُتبع دائماً بصفة (good) وليس ظرف.' },
  { id: 'bg_178', sec: 'Grammar', sub: 'adjectives_adverbs', diff: 3, q: "He is ___ tired to go out tonight.", opts: ["very", "so", "too", "enough"], ans: 2, exp: 'وجود حرف الجر to بعد الصفة يتطلب استخدام (too) لبيان المبالغة التي تمنع حدوث الفعل.' },
  { id: 'bg_179', sec: 'Grammar', sub: 'adjectives_adverbs', diff: 1, q: "She is a ___ worker.", opts: ["hardly", "hard", "harder", "hardest"], ans: 1, exp: 'الكلمة (hard) تعمل كصفة وظرف بنفس الشكل، بينما (hardly) تعني بالكاد.' },
  { id: 'bg_180', sec: 'Grammar', sub: 'adjectives_adverbs', diff: 2, q: "The test was surprisingly ___.", opts: ["easy", "easily", "ease", "eased"], ans: 0, exp: 'الظرف يأتي قبل الصفة ليقويها، وما نحتاجه لوصف الاختبار هو الصفة نفسها (easy).' },

  // Word Order (5)
  { id: 'bg_181', sec: 'Grammar', sub: 'word_order', diff: 2, q: "I don't know ___.", opts: ["who is he", "who he is", "he is who", "is who he"], ans: 1, exp: 'في الجمل التي تحتوي على سؤال مدمج، نعيد ترتيب الفاعل والفعل ليكون الترتيب اعتيادياً.' },
  { id: 'bg_182', sec: 'Grammar', sub: 'word_order', diff: 1, q: "She always goes to bed ___.", opts: ["late", "lately", "latelier", "latest"], ans: 0, exp: 'الظرف الخاص بالوقت (متأخراً) هو late دون إضافة.' },
  { id: 'bg_183', sec: 'Grammar', sub: 'word_order', diff: 2, q: "He gave the money ___.", opts: ["his friend", "to his friend", "for his friend", "his friend to"], ans: 1, exp: 'إذا جاء المفعول غير العاقل أولاً، يجب استخدام حرف جر (to) قبل المفعول العاقل.' },
  { id: 'bg_184', sec: 'Grammar', sub: 'word_order', diff: 3, q: "Only after the meeting ___ the truth.", opts: ["did I realize", "I realized", "I did realize", "realize I"], ans: 0, exp: 'عند البدء بعبارة مقيدة (Only after) نقوم بتقديم الفعل المساعد على الفاعل.' },
  { id: 'bg_185', sec: 'Grammar', sub: 'word_order', diff: 1, q: "We ___ have lunch at 2 PM.", opts: ["usually", "usual", "are usually", "usually are"], ans: 0, exp: 'ظروف التكرار توضع قبل الفعل الأساسي مباشرة.' },

  // Comparatives (5)
  { id: 'bg_186', sec: 'Grammar', sub: 'comparatives', diff: 1, q: "My car is ___ than yours.", opts: ["fast", "faster", "fastest", "more fast"], ans: 1, exp: 'مع الصفات القصيرة تُضاف اللاحقة المناسبة للمقارنة.' },
  { id: 'bg_187', sec: 'Grammar', sub: 'comparatives', diff: 2, q: "This is the ___ building in the city.", opts: ["tall", "taller", "tallest", "most tall"], ans: 2, exp: 'للتفضيل الأقصى مع الصفات القصيرة نستخدم اللاحقة (est).' },
  { id: 'bg_188', sec: 'Grammar', sub: 'comparatives', diff: 3, q: "She is slightly ___ than her sister.", opts: ["taller", "more taller", "most tall", "tall"], ans: 0, exp: 'الظرف (slightly) يقوي أو يخفف المقارنة ولكنه لا يغير قاعدة الصفة نفسها.' },
  { id: 'bg_189', sec: 'Grammar', sub: 'comparatives', diff: 1, q: "Gold is ___ expensive than silver.", opts: ["more", "much", "very", "most"], ans: 0, exp: 'للمقارنة في الصفات الطويلة نستخدم كلمة (أكثر) قبل الصفة.' },
  { id: 'bg_190', sec: 'Grammar', sub: 'comparatives', diff: 2, q: "He runs as ___ as a cheetah.", opts: ["fast", "faster", "fastest", "fastly"], ans: 0, exp: 'في تركيب التشبيه (as ... as) نستخدم الصفة بصيغتها الأصلية.' }
];

const lastBracketIndex = bank.lastIndexOf(']');
if (lastBracketIndex > -1) {
  let content = bank.substring(0, lastBracketIndex);
  content += ',\n' + newQs.map(q => '  ' + JSON.stringify(q)).join(',\n') + '\n];';
  fs.writeFileSync(bankPath, content);
  console.log('Appended 50 questions successfully.');
} else {
  console.error('Could not find end of array in bank-grammar.js');
}
