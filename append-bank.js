const fs = require('fs');
const bankPath = 'e:/claude code/bank-grammar.js';
let bank = fs.readFileSync(bankPath, 'utf8');

const newQs = [
  // Tenses (5)
  { id: 'bg_41', sec: 'Grammar', sub: 'tenses', diff: 1, q: 'She usually ___ to the gym every morning.', opts: ['go', 'goes', 'going', 'is going'], ans: 1, exp: 'مع الكلمات الدالة على التكرار مثل usually نستخدم المضارع البسيط لأن الفاعل مفرد.' },
  { id: 'bg_42', sec: 'Grammar', sub: 'tenses', diff: 2, q: 'I ___ for this company since 2015.', opts: ['work', 'am working', 'have been working', 'was working'], ans: 2, exp: 'استخدام since مع فترة زمنية مستمرة يتطلب المضارع التام المستمر.' },
  { id: 'bg_43', sec: 'Grammar', sub: 'tenses', diff: 3, q: 'Hardly ___ the station when the train departed.', opts: ['he reached', 'he had reached', 'had he reached', 'did he reach'], ans: 2, exp: 'عندما تبدأ الجملة بـ Hardly في الماضي، نستخدم الماضي التام مع قلب الفعل المساعد والفاعل.' },
  { id: 'bg_44', sec: 'Grammar', sub: 'tenses', diff: 1, q: 'They ___ TV when the phone rang.', opts: ['watched', 'were watching', 'are watching', 'watch'], ans: 1, exp: 'حدث كان مستمراً في الماضي عندما قطعه حدث آخر.' },
  { id: 'bg_45', sec: 'Grammar', sub: 'tenses', diff: 2, q: 'By next year, she ___ her master\'s degree.', opts: ['will finish', 'would finish', 'will have finished', 'finishes'], ans: 2, exp: 'التركيب المعتمد على By والفترة الزمنية في المستقبل يتطلب استخدام المستقبل التام.' },
  
  // Prepositions (5)
  { id: 'bg_46', sec: 'Grammar', sub: 'prepositions', diff: 1, q: 'The cat is sleeping ___ the table.', opts: ['on', 'in', 'under', 'at'], ans: 2, exp: 'حرف الجر المناسب لوصف شيء يقع أسفل طاولة هو حرف تحت.' },
  { id: 'bg_47', sec: 'Grammar', sub: 'prepositions', diff: 2, q: 'He apologized ___ being late.', opts: ['for', 'to', 'with', 'about'], ans: 0, exp: 'الفعل يعتذر يأخذ حرف الجر for عندما يتبعه الفعل المسبب للاعتذار.' },
  { id: 'bg_48', sec: 'Grammar', sub: 'prepositions', diff: 3, q: 'She is completely devoid ___ any sense of humor.', opts: ['from', 'of', 'in', 'with'], ans: 1, exp: 'الصفة بمعنى خالٍ من تأخذ دائماً حرف الجر of.' },
  { id: 'bg_49', sec: 'Grammar', sub: 'prepositions', diff: 1, q: 'We will meet ___ Monday morning.', opts: ['in', 'at', 'on', 'by'], ans: 2, exp: 'أيام الأسبوع تأخذ دائماً حرف الجر on حتى لو تبعها تحديد.' },
  { id: 'bg_50', sec: 'Grammar', sub: 'prepositions', diff: 2, q: 'He insists ___ paying for the meal.', opts: ['in', 'to', 'on', 'for'], ans: 2, exp: 'الفعل يصر يأتي دائماً متبوعاً بحرف الجر on.' },

  // Articles (5)
  { id: 'bg_51', sec: 'Grammar', sub: 'articles', diff: 1, q: 'I bought ___ apple and a banana.', opts: ['a', 'an', 'the', 'no article'], ans: 1, exp: 'الكلمة مفردة نكرة وتبدأ بصوت متحرك، لذا نستخدم أداة النكرة المناسبة.' },
  { id: 'bg_52', sec: 'Grammar', sub: 'articles', diff: 2, q: '___ Nile is the longest river in the world.', opts: ['A', 'An', 'The', 'No article'], ans: 2, exp: 'أسماء الأنهار والبحار تأخذ دائماً أداة التعريف.' },
  { id: 'bg_53', sec: 'Grammar', sub: 'articles', diff: 3, q: 'He went to ___ bed early because he was tired.', opts: ['a', 'an', 'the', 'no article'], ans: 3, exp: 'عندما نذهب إلى السرير لغرض النوم، لا نستخدم أي أداة تعريف.' },
  { id: 'bg_54', sec: 'Grammar', sub: 'articles', diff: 1, q: 'Look at ___ moon; it is beautiful tonight.', opts: ['a', 'an', 'the', 'no article'], ans: 2, exp: 'الأشياء الفريدة التي لا يوجد منها إلا واحد تأخذ أداة التعريف.' },
  { id: 'bg_55', sec: 'Grammar', sub: 'articles', diff: 2, q: 'She speaks ___ French fluently.', opts: ['a', 'an', 'the', 'no article'], ans: 3, exp: 'أسماء اللغات لا تأخذ أدوات تعريف إلا إذا أُلحقت بكلمة لغة.' },

  // Subject-Verb Agreement (5)
  { id: 'bg_56', sec: 'Grammar', sub: 'subject_verb_agreement', diff: 1, q: 'The boy, along with his friends, ___ going to the park.', opts: ['are', 'is', 'were', 'have'], ans: 1, exp: 'عند استخدام هذه الصيغة، الفعل يتبع الفاعل الأول وهو مفرد.' },
  { id: 'bg_57', sec: 'Grammar', sub: 'subject_verb_agreement', diff: 2, q: 'Neither of the answers ___ correct.', opts: ['are', 'is', 'were', 'have'], ans: 1, exp: 'العبارة عندما تُتبع باسم جمع تعامل في الكتابة الرسمية معاملة المفرد.' },
  { id: 'bg_58', sec: 'Grammar', sub: 'subject_verb_agreement', diff: 3, q: 'The jury ___ finally reached a unanimous verdict.', opts: ['has', 'have', 'are', 'is'], ans: 0, exp: 'الكلمة هنا تعمل ككيان واحد فتأخذ فعلاً مفرداً.' },
  { id: 'bg_59', sec: 'Grammar', sub: 'subject_verb_agreement', diff: 1, q: 'Mathematics ___ my favorite subject.', opts: ['is', 'are', 'were', 'be'], ans: 0, exp: 'أسماء المواد الدراسية المنتهية بحرف الجمع تعامل معاملة المفرد.' },
  { id: 'bg_60', sec: 'Grammar', sub: 'subject_verb_agreement', diff: 2, q: 'Ten dollars ___ too much to pay for a coffee.', opts: ['are', 'is', 'were', 'have been'], ans: 1, exp: 'المبالغ المالية والمسافات تعامل ككتلة واحدة مفرده وتأخذ فعلاً مفرداً.' },

  // Conditionals (5)
  { id: 'bg_61', sec: 'Grammar', sub: 'conditionals', diff: 1, q: 'If it rains, we ___ the picnic.', opts: ['cancel', 'will cancel', 'would cancel', 'cancelled'], ans: 1, exp: 'الحالة الشرطية الأولى تستخدم المضارع البسيط مع المستقبل البسيط.' },
  { id: 'bg_62', sec: 'Grammar', sub: 'conditionals', diff: 2, q: 'If I ___ you, I would study harder.', opts: ['am', 'was', 'were', 'have been'], ans: 2, exp: 'في الحالة الشرطية الثانية للإشارة للنصيحة التخيلية نستخدم الفعل في صيغة الجمع مع جميع الضمائر.' },
  { id: 'bg_63', sec: 'Grammar', sub: 'conditionals', diff: 3, q: '___ you need any help, please let me know.', opts: ['Should', 'Would', 'Had', 'If only'], ans: 0, exp: 'يمكن استخدام هذا الفعل في بداية الجملة بدلاً من الشرط في الحالة الأولى للتعبير عن الاحتمالية.' },
  { id: 'bg_64', sec: 'Grammar', sub: 'conditionals', diff: 2, q: 'If they had left earlier, they ___ the train.', opts: ['would catch', 'caught', 'will catch', 'would have caught'], ans: 3, exp: 'الحالة الشرطية الثالثة تتطلب الماضي التام في جملة الشرط وصيغة التام في الجواب.' },
  { id: 'bg_65', sec: 'Grammar', sub: 'conditionals', diff: 3, q: 'I wouldn\'t be in this mess if I ___ to your advice yesterday.', opts: ['listen', 'listened', 'had listened', 'would listen'], ans: 2, exp: 'هذه حالة شرطية مختلطة تجمع بين نتيجة في الحاضر وشرط في الماضي.' },

  // Relative Clauses (5)
  { id: 'bg_66', sec: 'Grammar', sub: 'relative_clauses', diff: 1, q: 'The person ___ called you is my brother.', opts: ['which', 'who', 'whom', 'whose'], ans: 1, exp: 'نستخدم أداة الوصل الخاصة بالعاقل في محل الفاعل.' },
  { id: 'bg_67', sec: 'Grammar', sub: 'relative_clauses', diff: 2, q: 'The company, ___ CEO recently resigned, is facing bankruptcy.', opts: ['which', 'who', 'whom', 'whose'], ans: 3, exp: 'نستخدم أداة الوصل للإشارة إلى الملكية.' },
  { id: 'bg_68', sec: 'Grammar', sub: 'relative_clauses', diff: 3, q: 'He is the only student ___ passed the exam.', opts: ['which', 'that', 'whom', 'whose'], ans: 1, exp: 'بعد كلمات معينة يُفضل أو يجب استخدام هذه الأداة بدلاً من أدوات الوصل الأخرى.' },
  { id: 'bg_69', sec: 'Grammar', sub: 'relative_clauses', diff: 1, q: 'This is the house ___ I was born.', opts: ['which', 'when', 'where', 'that'], ans: 2, exp: 'نستخدم أداة الوصل الخاصة بالمكان.' },
  { id: 'bg_70', sec: 'Grammar', sub: 'relative_clauses', diff: 2, q: 'The reason ___ he left early is still unknown.', opts: ['which', 'why', 'where', 'when'], ans: 1, exp: 'الكلمة التي تعني السبب تتبعها دائماً أداة الوصل المعبرة عنه.' },

  // Passive Voice (5)
  { id: 'bg_71', sec: 'Grammar', sub: 'passive_voice', diff: 1, q: 'The window ___ by the boys playing football.', opts: ['broke', 'was broken', 'breaks', 'has broken'], ans: 1, exp: 'الجملة مبنية للمجهول في الماضي البسيط.' },
  { id: 'bg_72', sec: 'Grammar', sub: 'passive_voice', diff: 2, q: 'New roads ___ in our city right now.', opts: ['are built', 'built', 'are being built', 'have built'], ans: 2, exp: 'الحدث مستمر الآن ومبني للمجهول، لذا نستخدم المضارع المستمر المبني للمجهول.' },
  { id: 'bg_73', sec: 'Grammar', sub: 'passive_voice', diff: 3, q: 'He doesn\'t like ___ what to do.', opts: ['telling', 'to tell', 'being told', 'having told'], ans: 2, exp: 'الفعل يأخذ بعده صيغة اسم الفاعل، وحيث أن الجملة مبنية للمجهول لتلقي الأمر، نستخدم المبني للمجهول.' },
  { id: 'bg_74', sec: 'Grammar', sub: 'passive_voice', diff: 2, q: 'This letter must ___ immediately.', opts: ['send', 'be sent', 'sent', 'be sending'], ans: 1, exp: 'الأفعال الناقصة في المبني للمجهول يتبعها فعل الكون والتصريف الثالث.' },
  { id: 'bg_75', sec: 'Grammar', sub: 'passive_voice', diff: 3, q: 'It ___ that the suspect has fled the country.', opts: ['believes', 'believed', 'is believed', 'has believed'], ans: 2, exp: 'عند نقل الأخبار أو الاعتقادات بشكل غير شخصي نستخدم المبني للمجهول.' },

  // Word Order (5)
  { id: 'bg_76', sec: 'Grammar', sub: 'word_order', diff: 1, q: 'She bought a ___ dress.', opts: ['red beautiful cotton', 'beautiful red cotton', 'cotton beautiful red', 'red cotton beautiful'], ans: 1, exp: 'ترتيب الصفات في الإنجليزية يكون: الرأي ثم اللون ثم المادة.' },
  { id: 'bg_77', sec: 'Grammar', sub: 'word_order', diff: 2, q: 'I wonder ___.', opts: ['where is the station', 'where the station is', 'the station is where', 'is where the station'], ans: 1, exp: 'في الأسئلة المدمجة لا نقوم بقلب الفعل والفاعل. الفاعل يسبق الفعل.' },
  { id: 'bg_78', sec: 'Grammar', sub: 'word_order', diff: 3, q: 'Seldom ___ such a terrible mistake.', opts: ['I have seen', 'have I seen', 'saw I', 'I saw'], ans: 1, exp: 'عندما تبدأ الجملة بظرف منفي نقوم بقلب الفاعل والفعل المساعد.' },
  { id: 'bg_79', sec: 'Grammar', sub: 'word_order', diff: 1, q: 'They ___ go to the cinema on weekends.', opts: ['don\'t usually', 'usually don\'t', 'not usually', 'usually not'], ans: 0, exp: 'ظروف التكرار تأتي بعد الفعل المساعد وقبل الفعل الأساسي.' },
  { id: 'bg_80', sec: 'Grammar', sub: 'word_order', diff: 2, q: 'He gave ___.', opts: ['his mother a present', 'a present his mother', 'to his mother a present', 'a present for his mother'], ans: 0, exp: 'الفعل يمكن أن يأخذ مفعولين، وإذا بدأنا بالمفعول العاقل لا نستخدم حرف جر.' },

  // Modals (5)
  { id: 'bg_81', sec: 'Grammar', sub: 'modals', diff: 1, q: 'You ___ smoke in the hospital.', opts: ['needn\'t', 'mustn\'t', 'don\'t have to', 'can\'t'], ans: 1, exp: 'للتعبير عن المنع الصارم والقانوني نستخدم هذا الفعل الناقص.' },
  { id: 'bg_82', sec: 'Grammar', sub: 'modals', diff: 2, q: 'It\'s a holiday tomorrow, so we ___ wake up early.', opts: ['mustn\'t', 'can\'t', 'don\'t have to', 'shouldn\'t'], ans: 2, exp: 'للتعبير عن عدم الضرورة (ليس هناك داعٍ ولكنك تستطيع لو أردت) نستخدم هذه الصيغة.' },
  { id: 'bg_83', sec: 'Grammar', sub: 'modals', diff: 3, q: 'He ___ his keys at home; he has them in his hand!', opts: ['must have left', 'can\'t have left', 'might have left', 'should have left'], ans: 1, exp: 'للاستنتاج المنطقي في الماضي بأنه من المستحيل أن يكون قد حدث شيء نستخدم الفعل الناقص المنفي مع التام.' },
  { id: 'bg_84', sec: 'Grammar', sub: 'modals', diff: 1, q: '___ I borrow your pen, please?', opts: ['Must', 'May', 'Should', 'Will'], ans: 1, exp: 'لطلب الإذن بطريقة مهذبة نستخدم هذا الفعل.' },
  { id: 'bg_85', sec: 'Grammar', sub: 'modals', diff: 2, q: 'You ___ see a doctor about that cough.', opts: ['ought', 'had better', 'need', 'would'], ans: 1, exp: 'لإعطاء نصيحة قوية (وإلا ستكون هناك عواقب سلبية) نستخدم هذه الصيغة ويتبعها فعل مجرد.' },

  // Comparatives (5)
  { id: 'bg_86', sec: 'Grammar', sub: 'comparatives', diff: 1, q: 'This book is ___ than the one I read last week.', opts: ['interesting', 'more interesting', 'most interesting', 'the more interesting'], ans: 1, exp: 'للمقارنة بين شيئين في صفة طويلة نستخدم المقارنة القياسية.' },
  { id: 'bg_87', sec: 'Grammar', sub: 'comparatives', diff: 2, q: 'He is not as ___ as his older brother.', opts: ['tall', 'taller', 'tallest', 'more tall'], ans: 0, exp: 'في تركيب التشبيه، نستخدم الصفة في حالتها الأصلية بدون أي إضافات.' },
  { id: 'bg_88', sec: 'Grammar', sub: 'comparatives', diff: 3, q: 'The harder you study, ___ your grades will be.', opts: ['the good', 'better', 'the better', 'the best'], ans: 2, exp: 'هذه القاعدة تتطلب صيغة المقارنة في كلا الطرفين، مسبوقة بأداة التعريف.' },
  { id: 'bg_89', sec: 'Grammar', sub: 'comparatives', diff: 1, q: 'That was ___ movie I have ever seen.', opts: ['the worse', 'worst', 'the worst', 'worse'], ans: 2, exp: 'للتفضيل من هذه الصفة الشاذة، نستخدم الصيغة المخصصة لذلك.' },
  { id: 'bg_90', sec: 'Grammar', sub: 'comparatives', diff: 2, q: 'This task is ___ more difficult than I expected.', opts: ['much', 'very', 'too', 'so'], ans: 0, exp: 'لتقوية صفة المقارنة وتضخيمها يمكن استخدام كلمات معينة ولا نستخدم كلمة التوكيد العادية للمطلق.' }
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
