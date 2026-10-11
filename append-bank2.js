const fs = require('fs');
const bankPath = 'e:/claude code/bank-grammar.js';
let bank = fs.readFileSync(bankPath, 'utf8');

const newQs = [
  // Tenses (5)
  { id: 'bg_91', sec: 'Grammar', sub: 'tenses', diff: 1, q: "I ___ to the radio when I heard a loud noise outside.", opts: ["listened", "was listening", "am listening", "listen"], ans: 1, exp: 'حدث كان مستمراً في الماضي (was listening) فقطعه حدث آخر في الماضي البسيط.' },
  { id: 'bg_92', sec: 'Grammar', sub: 'tenses', diff: 2, q: "By this time tomorrow, we ___ our final exam.", opts: ["will finish", "will have finished", "finish", "are finishing"], ans: 1, exp: 'مع تحديد وقت في المستقبل (By this time tomorrow)، نستخدم المستقبل التام للإشارة لحدث سيكون قد اكتمل.' },
  { id: 'bg_93', sec: 'Grammar', sub: 'tenses', diff: 3, q: "He was exhausted because he ___ all day in the garden.", opts: ["worked", "was working", "has worked", "had been working"], ans: 3, exp: 'تفسير حالة في الماضي (was exhausted) بسبب حدث كان مستمراً قبلها، يتطلب الماضي التام المستمر.' },
  { id: 'bg_94', sec: 'Grammar', sub: 'tenses', diff: 1, q: "Look! The bus ___.", opts: ["comes", "came", "is coming", "has come"], ans: 2, exp: 'استخدام كلمات الانتباه مثل Look يدل على أن الحدث يقع الآن وقت الكلام، لذا نستخدم المضارع المستمر.' },
  { id: 'bg_95', sec: 'Grammar', sub: 'tenses', diff: 2, q: "I ___ him since we graduated from college.", opts: ["didn't see", "don't see", "haven't seen", "hadn't seen"], ans: 2, exp: 'كلمة since تربط نقطة في الماضي بالحاضر، مما يستلزم استخدام المضارع التام.' },

  // Prepositions (5)
  { id: 'bg_96', sec: 'Grammar', sub: 'prepositions', diff: 1, q: "She was born ___ 1995.", opts: ["at", "on", "in", "by"], ans: 2, exp: 'السنوات والشهور والفصول تأخذ دائماً حرف الجر in.' },
  { id: 'bg_97', sec: 'Grammar', sub: 'prepositions', diff: 2, q: "Are you interested ___ learning a new language?", opts: ["on", "in", "at", "with"], ans: 1, exp: 'الصفة مهتم تأخذ دائماً حرف الجر in.' },
  { id: 'bg_98', sec: 'Grammar', sub: 'prepositions', diff: 3, q: "The manager is in charge ___ the marketing department.", opts: ["for", "with", "of", "on"], ans: 2, exp: 'العبارة in charge of تعني مسؤول عن، وهي صيغة ثابتة.' },
  { id: 'bg_99', sec: 'Grammar', sub: 'prepositions', diff: 1, q: "I will see you ___ the weekend.", opts: ["at", "in", "by", "with"], ans: 0, exp: 'في الإنجليزية البريطانية، عطلة نهاية الأسبوع تأخذ at، بينما في الأمريكية يمكن استخدام on. الخيار الصحيح هنا هو at.' },
  { id: 'bg_100', sec: 'Grammar', sub: 'prepositions', diff: 2, q: "He succeeded ___ passing the difficult exam.", opts: ["in", "on", "at", "with"], ans: 0, exp: 'الفعل نجح يتبعه حرف الجر in ثم الفعل مضافاً له ing.' },

  // Articles (5)
  { id: 'bg_101', sec: 'Grammar', sub: 'articles', diff: 1, q: "My brother is ___ engineer.", opts: ["a", "an", "the", "no article"], ans: 1, exp: 'المهن تأخذ أدوات نكرة، وبما أن الكلمة تبدأ بصوت متحرك نستخدم an.' },
  { id: 'bg_102', sec: 'Grammar', sub: 'articles', diff: 2, q: "We visited ___ United Kingdom last summer.", opts: ["a", "an", "the", "no article"], ans: 2, exp: 'أسماء الدول التي تتكون من كلمات تدل على اتحاد أو جمهورية أو ولايات تأخذ أداة التعريف.' },
  { id: 'bg_103', sec: 'Grammar', sub: 'articles', diff: 3, q: "Love is ___ wonderful feeling.", opts: ["a", "an", "the", "no article"], ans: 0, exp: 'كلمة شعور مفردة وتتطلب أداة نكرة رغم أن المعنى العام يتحدث عن الحب.' },
  { id: 'bg_104', sec: 'Grammar', sub: 'articles', diff: 1, q: "Can you pass me ___ salt, please?", opts: ["a", "an", "the", "no article"], ans: 2, exp: 'عند طلب شيء محدد وموجود أمام المتحدثين على الطاولة، نستخدم أداة التعريف.' },
  { id: 'bg_105', sec: 'Grammar', sub: 'articles', diff: 2, q: "She goes to ___ university to study physics.", opts: ["a", "an", "the", "no article"], ans: 3, exp: 'عند الحديث عن الذهاب لمؤسسة (مثل الجامعة) للغرض الذي أُنشئت من أجله، لا نستخدم أداة تعريف.' },

  // Subject-Verb Agreement (5)
  { id: 'bg_106', sec: 'Grammar', sub: 'subject_verb_agreement', diff: 1, q: "One of the boxes ___ open.", opts: ["is", "are", "were", "have been"], ans: 0, exp: 'العبارة One of يتبعها اسم جمع ولكن الفعل يجب أن يكون مفرداً ليعود على One.' },
  { id: 'bg_107', sec: 'Grammar', sub: 'subject_verb_agreement', diff: 2, q: "Not only the teacher but also the students ___ laughing.", opts: ["was", "is", "were", "has been"], ans: 2, exp: 'في هذه القاعدة، الفعل يتبع الفاعل الأقرب له، وهو هنا جمع.' },
  { id: 'bg_108', sec: 'Grammar', sub: 'subject_verb_agreement', diff: 3, q: "A number of people ___ waiting outside.", opts: ["is", "are", "was", "has been"], ans: 1, exp: 'العبارة A number of تعني (العديد من) وتعامل معاملة الجمع، بعكس The number of.' },
  { id: 'bg_109', sec: 'Grammar', sub: 'subject_verb_agreement', diff: 1, q: "Everyone ___ to be happy.", opts: ["want", "wants", "wanting", "are wanting"], ans: 1, exp: 'الضمائر غير المحددة مثل Everyone تُعامل دائماً معاملة المفرد.' },
  { id: 'bg_110', sec: 'Grammar', sub: 'subject_verb_agreement', diff: 2, q: "The news ___ on TV at 9 PM.", opts: ["are", "is", "were", "have been"], ans: 1, exp: 'كلمة news تعامل دائماً معاملة المفرد رغم انتهائها بحرف الجمع.' },

  // Conditionals (5)
  { id: 'bg_111', sec: 'Grammar', sub: 'conditionals', diff: 1, q: "If you heat water to 100 degrees, it ___.", opts: ["boils", "will boil", "would boil", "boiled"], ans: 0, exp: 'الحالة الشرطية الصفرية التي تعبر عن الحقائق العلمية تأخذ المضارع البسيط في الطرفين.' },
  { id: 'bg_112', sec: 'Grammar', sub: 'conditionals', diff: 2, q: "If I knew her number, I ___ her.", opts: ["will call", "would call", "called", "would have called"], ans: 1, exp: 'الحالة الشرطية الثانية (الماضي البسيط) تأخذ في الجواب would والفعل المجرد.' },
  { id: 'bg_113', sec: 'Grammar', sub: 'conditionals', diff: 3, q: "Had I studied harder, I ___ the exam.", opts: ["would pass", "will pass", "would have passed", "passed"], ans: 2, exp: 'هذه الصيغة هي قلب للحالة الثالثة (If I had studied)، وجوابها يجب أن يكون تاماً.' },
  { id: 'bg_114', sec: 'Grammar', sub: 'conditionals', diff: 1, q: "We will stay at home if it ___ tomorrow.", opts: ["rains", "will rain", "rained", "is raining"], ans: 0, exp: 'في جملة الشرط للحالة الأولى نستخدم المضارع البسيط بعد if.' },
  { id: 'bg_115', sec: 'Grammar', sub: 'conditionals', diff: 2, q: "If you ___ earlier, you wouldn't have missed the flight.", opts: ["woke up", "wake up", "had woken up", "would wake up"], ans: 2, exp: 'النتيجة في الماضي التام، مما يعني أن جملة الشرط يجب أن تكون في الماضي التام (الحالة الثالثة).' },

  // Relative Clauses (5)
  { id: 'bg_116', sec: 'Grammar', sub: 'relative_clauses', diff: 1, q: "The car ___ he bought is very expensive.", opts: ["who", "whom", "which", "whose"], ans: 2, exp: 'نستخدم أداة الوصل الخاصة بغير العاقل (السيارة).' },
  { id: 'bg_117', sec: 'Grammar', sub: 'relative_clauses', diff: 2, q: "The woman ___ bag was stolen reported it to the police.", opts: ["who", "which", "whose", "whom"], ans: 2, exp: 'عندما نعبر عن ملكية بين اسمين (المرأة والحقيبة) نستخدم هذه الأداة.' },
  { id: 'bg_118', sec: 'Grammar', sub: 'relative_clauses', diff: 3, q: "My grandfather, ___ is 80 years old, goes swimming every day.", opts: ["that", "who", "whom", "which"], ans: 1, exp: 'في الجمل الوصفية الإضافية (بين الفواصل)، لا يمكن استخدام that مع العاقل، بل يجب استخدام who.' },
  { id: 'bg_119', sec: 'Grammar', sub: 'relative_clauses', diff: 1, q: "I remember the day ___ we first met.", opts: ["where", "which", "when", "who"], ans: 2, exp: 'للإشارة إلى الزمان نستخدم أداة الوصل الخاصة بالوقت.' },
  { id: 'bg_120', sec: 'Grammar', sub: 'relative_clauses', diff: 2, q: "The student to ___ I gave the book is absent today.", opts: ["who", "whom", "which", "whose"], ans: 1, exp: 'بعد حرف الجر، نستخدم ضمير المفعول العاقل حصراً.' },

  // Passive Voice (5)
  { id: 'bg_121', sec: 'Grammar', sub: 'passive_voice', diff: 1, q: "English ___ all over the world.", opts: ["speaks", "is speaking", "is spoken", "has spoken"], ans: 2, exp: 'الجملة مبنية للمجهول في المضارع البسيط، لذا نستخدم فعل الكون مع التصريف الثالث.' },
  { id: 'bg_122', sec: 'Grammar', sub: 'passive_voice', diff: 2, q: "The house ___ painted when we arrived.", opts: ["was", "was being", "has been", "is being"], ans: 1, exp: 'الحدث كان مستمراً وقت وصولنا، لذا نستخدم الماضي المستمر المبني للمجهول.' },
  { id: 'bg_123', sec: 'Grammar', sub: 'passive_voice', diff: 3, q: "The problem is expected ___ soon.", opts: ["to solve", "solving", "to be solved", "having solved"], ans: 2, exp: 'الفعل المتوقع يأخذ بعده مصدر، ولأن المشكلة لا تحل نفسها، يجب أن يكون المصدر مبنياً للمجهول.' },
  { id: 'bg_124', sec: 'Grammar', sub: 'passive_voice', diff: 1, q: "My car ___ stolen last night.", opts: ["was", "were", "is", "has been"], ans: 0, exp: 'حدث مكتمل في الماضي لفاعل مفرد في المبني للمجهول يأخذ فعل الكون في الماضي.' },
  { id: 'bg_125', sec: 'Grammar', sub: 'passive_voice', diff: 2, q: "A new mall ___ built next year.", opts: ["will", "is", "will be", "has been"], ans: 2, exp: 'المبني للمجهول في المستقبل يتطلب الفعل المساعد للمستقبل متبوعاً بفعل الكون مجرداً.' },

  // Word Order (5)
  { id: 'bg_126', sec: 'Grammar', sub: 'word_order', diff: 1, q: "He speaks ___.", opts: ["fluently English", "English fluently", "English fluent", "fluent English fluently"], ans: 1, exp: 'الظرف الذي يصف الفعل (مثل بطلاقة) يأتي عادة بعد المفعول به وليس قبله.' },
  { id: 'bg_127', sec: 'Grammar', sub: 'word_order', diff: 2, q: "Could you tell me ___?", opts: ["what time is it", "what is the time", "what time it is", "what the time it is"], ans: 2, exp: 'في السؤال المدمج لا نقلب الفاعل والفعل بل نتبع الترتيب الطبيعي للجملة.' },
  { id: 'bg_128', sec: 'Grammar', sub: 'word_order', diff: 3, q: "Never before ___ such a beautiful sunset.", opts: ["I have seen", "have I seen", "did I see", "I saw"], ans: 1, exp: 'البدء بكلمة نفي يفيد التوكيد يتطلب تقديم الفعل المساعد على الفاعل.' },
  { id: 'bg_129', sec: 'Grammar', sub: 'word_order', diff: 1, q: "They have ___ finished the project.", opts: ["yet", "already", "soon", "tomorrow"], ans: 1, exp: 'الظرف المستخدم مع المضارع التام بين الفعل المساعد والأساسي للإشارة للانتهاء المبكر.' },
  { id: 'bg_130', sec: 'Grammar', sub: 'word_order', diff: 2, q: "He bought a ___ table.", opts: ["wooden round large", "large wooden round", "large round wooden", "round large wooden"], ans: 2, exp: 'ترتيب الصفات الصحيح هو: الحجم (large)، ثم الشكل (round)، ثم المادة (wooden).' },

  // Modals (5)
  { id: 'bg_131', sec: 'Grammar', sub: 'modals', diff: 1, q: "You ___ brush your teeth twice a day.", opts: ["might", "should", "can", "would"], ans: 1, exp: 'لإعطاء النصيحة نستخدم الفعل الناقص المعبر عن النصيحة.' },
  { id: 'bg_132', sec: 'Grammar', sub: 'modals', diff: 2, q: "You ___ tell anyone my secret; promise me!", opts: ["don't have to", "mustn't", "couldn't", "needn't"], ans: 1, exp: 'للتعبير عن المنع والنهي الصارم للحفاظ على السر نستخدم هذه الصيغة.' },
  { id: 'bg_133', sec: 'Grammar', sub: 'modals', diff: 3, q: "The ground is wet. It ___ last night.", opts: ["must rain", "must have rained", "should have rained", "could rain"], ans: 1, exp: 'للاستنتاج المنطقي المؤكد في الماضي بناءً على دليل حالي، نستخدم الفعل الناقص مع التام.' },
  { id: 'bg_134', sec: 'Grammar', sub: 'modals', diff: 1, q: "I ___ swim when I was five years old.", opts: ["can", "could", "might", "must"], ans: 1, exp: 'للتعبير عن القدرة في الماضي نستخدم الماضي من الفعل المعبر عن القدرة.' },
  { id: 'bg_135', sec: 'Grammar', sub: 'modals', diff: 2, q: "We ___ better leave now before it gets dark.", opts: ["would", "should", "had", "ought"], ans: 2, exp: 'صيغة إعطاء النصيحة القوية تتكون من هذا الفعل المتبوع بكلمة better.' },

  // Comparatives (5)
  { id: 'bg_136', sec: 'Grammar', sub: 'comparatives', diff: 1, q: "This test is ___ than the previous one.", opts: ["easy", "easier", "easiest", "more easy"], ans: 1, exp: 'عند مقارنة صفتين قصيرتين تتنهيان بحرف ساكن وقبله علة تقلب النهاية وتضاف علامة المقارنة.' },
  { id: 'bg_137', sec: 'Grammar', sub: 'comparatives', diff: 2, q: "He is the ___ person I know.", opts: ["most funny", "funnier", "funniest", "more funny"], ans: 2, exp: 'للتفضيل بين مجموعة باستخدام صفة قصيرة تنتهي بحرف واي نقوم بقلبه وإضافة لاحقة التفضيل.' },
  { id: 'bg_138', sec: 'Grammar', sub: 'comparatives', diff: 3, q: "It was ___ an expensive car that he couldn't afford it.", opts: ["so", "such", "very", "too"], ans: 1, exp: 'نستخدم هذه الكلمة قبل الصفة المتبوعة باسم، متبوعة بالنتيجة.' },
  { id: 'bg_139', sec: 'Grammar', sub: 'comparatives', diff: 1, q: "Your car is twice as ___ as mine.", opts: ["big", "bigger", "biggest", "more big"], ans: 0, exp: 'في تراكيب التشبيه مع التضعيف، تبقى الصفة مجردة دون إضافات.' },
  { id: 'bg_140', sec: 'Grammar', sub: 'comparatives', diff: 2, q: "He ran ___ fast that he won the race easily.", opts: ["such", "very", "so", "too"], ans: 2, exp: 'نستخدم هذه الكلمة قبل الظرف أو الصفة (بدون اسم) لبيان شدة أدت إلى نتيجة.' }
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
