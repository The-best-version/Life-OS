const fs = require('fs');

const words = [
  { w: "Abolish", t: "verb", ar: "يلغي / يبطل", en: "To officially end a law, system, or institution", eg: "The government decided to abolish the tax.", sa: "Syn: Eliminate / Ant: Establish" },
  { w: "Abundant", t: "adj", ar: "وفير / غني", en: "Existing or available in large quantities", eg: "There is abundant evidence to support the theory.", sa: "Syn: Plentiful / Ant: Scarce" },
  { w: "Accommodate", t: "verb", ar: "يستوعب / يلائم", en: "To provide enough space for or to adapt to", eg: "The hotel can accommodate up to 500 guests.", sa: "Syn: House / Ant: Reject" },
  { w: "Accumulate", t: "verb", ar: "يتراكم / يجمع", en: "To gather or acquire an increasing number or quantity of", eg: "Dust tends to accumulate on top of the bookshelves.", sa: "Syn: Gather / Ant: Disperse" },
  { w: "Accurate", t: "adj", ar: "دقيق", en: "Correct in all details; exact", eg: "We need accurate measurements to build the table.", sa: "Syn: Precise / Ant: Inaccurate" },
  { w: "Acquire", t: "verb", ar: "يكتسب / يحصل على", en: "To buy or obtain for oneself", eg: "He managed to acquire a valuable painting.", sa: "Syn: Obtain / Ant: Lose" },
  { w: "Adapt", t: "verb", ar: "يتكيف / يتأقلم", en: "To become adjusted to new conditions", eg: "Animals have to adapt to their environments to survive.", sa: "Syn: Adjust" },
  { w: "Adequate", t: "adj", ar: "كافٍ / مناسب", en: "Satisfactory or acceptable in quality or quantity", eg: "The room was small but adequate for our needs.", sa: "Syn: Sufficient / Ant: Inadequate" },
  { w: "Adjacent", t: "adj", ar: "مجاور / ملاصق", en: "Next to or adjoining something else", eg: "They live in a house adjacent to the railway.", sa: "Syn: Neighboring / Ant: Distant" },
  { w: "Advocate", t: "verb", ar: "يدعم / يؤيد", en: "To publicly recommend or support", eg: "Many experts advocate rewarding children for good behavior.", sa: "Syn: Support / Ant: Oppose" },
  { w: "Alleviate", t: "verb", ar: "يخفف / يسكن", en: "To make suffering, deficiency, or a problem less severe", eg: "The medicine did nothing to alleviate her discomfort.", sa: "Syn: Relieve / Ant: Aggravate" },
  { w: "Allocate", t: "verb", ar: "يخصص / يوزع", en: "To distribute resources or duties for a particular purpose", eg: "The council will allocate funds for the new school.", sa: "Syn: Assign" },
  { w: "Alter", t: "verb", ar: "يعدل / يغير", en: "To change or cause to change in character or composition", eg: "We had to alter some of our plans.", sa: "Syn: Modify / Ant: Preserve" },
  { w: "Ambiguous", t: "adj", ar: "غامض / مبهم", en: "Open to more than one interpretation", eg: "His reply to my question was somewhat ambiguous.", sa: "Syn: Vague / Ant: Clear" },
  { w: "Analyze", t: "verb", ar: "يحلل", en: "To examine methodically and in detail", eg: "Researchers will analyze the data collected from the survey.", sa: "Syn: Examine" },
  { w: "Anticipate", t: "verb", ar: "يتوقع / يترقب", en: "To regard as probable; expect or predict", eg: "We don't anticipate any major problems.", sa: "Syn: Expect" },
  { w: "Apparent", t: "adj", ar: "واضح / ظاهر", en: "Clearly visible or understood; obvious", eg: "It became apparent that he was not going to show up.", sa: "Syn: Obvious / Ant: Hidden" },
  { w: "Approach", t: "noun", ar: "نهج / طريقة", en: "A way of dealing with something", eg: "We need a new approach to the problem.", sa: "Syn: Method" },
  { w: "Appropriate", t: "adj", ar: "مناسب / ملائم", en: "Suitable or proper in the circumstances", eg: "Jeans are not appropriate for a formal wedding.", sa: "Syn: Suitable / Ant: Inappropriate" },
  { w: "Arbitrary", t: "adj", ar: "عشوائي / تعسفي", en: "Based on random choice or personal whim", eg: "The decision to close the road seemed completely arbitrary.", sa: "Syn: Random / Ant: Logical" },
  { w: "Assess", t: "verb", ar: "يُقيّم / يقدّر", en: "To evaluate or estimate the nature, ability, or quality of", eg: "The committee must assess the relative importance of the issues.", sa: "Syn: Evaluate" },
  { w: "Assign", t: "verb", ar: "يعين / يكلف", en: "To allocate a job or duty", eg: "The teacher will assign a different topic to each student.", sa: "Syn: Allocate" },
  { w: "Assist", t: "verb", ar: "يساعد", en: "To help someone, typically by doing a share of the work", eg: "We are looking for someone to assist the manager.", sa: "Syn: Help / Ant: Hinder" },
  { w: "Assume", t: "verb", ar: "يفترض / يظن", en: "To suppose to be the case, without proof", eg: "I assume that you have already read the report.", sa: "Syn: Presume" },
  { w: "Attain", t: "verb", ar: "يحقق / يبلغ", en: "To succeed in achieving something", eg: "He has attained the highest grade in his music exams.", sa: "Syn: Achieve / Ant: Fail" },
  { w: "Attitude", t: "noun", ar: "موقف / توجه", en: "A settled way of thinking or feeling about someone or something", eg: "He has a very positive attitude towards his work.", sa: "Syn: Perspective" },
  { w: "Attribute", t: "verb", ar: "ينسب إلى", en: "To regard something as being caused by someone or something", eg: "He attributed his success to hard work.", sa: "Syn: Credit" },
  { w: "Authentic", t: "adj", ar: "أصيل / حقيقي", en: "Of undisputed origin; genuine", eg: "The restaurant serves authentic Italian food.", sa: "Syn: Genuine / Ant: Fake" },
  { w: "Available", t: "adj", ar: "متاح / متوفر", en: "Able to be used or obtained", eg: "Fresh fruit is available throughout the year.", sa: "Syn: Accessible / Ant: Unavailable" },
  { w: "Benefit", t: "noun", ar: "فائدة / منفعة", en: "An advantage or profit gained from something", eg: "The new bridge will be of great benefit to the community.", sa: "Syn: Advantage / Ant: Drawback" },
  { w: "Brief", t: "adj", ar: "موجز / قصير", en: "Of short duration", eg: "We had a brief meeting before the presentation.", sa: "Syn: Short / Ant: Lengthy" },
  { w: "Capable", t: "adj", ar: "قادر / كفء", en: "Having the ability, fitness, or quality necessary to do or achieve a specified thing", eg: "She is capable of handling the pressure.", sa: "Syn: Competent / Ant: Incapable" },
  { w: "Capacity", t: "noun", ar: "سعة / قدرة", en: "The maximum amount that something can contain or produce", eg: "The stadium has a seating capacity of 50,000.", sa: "Syn: Volume" },
  { w: "Cease", t: "verb", ar: "يتوقف / ينقطع", en: "To bring or come to an end", eg: "The company has decided to cease all operations.", sa: "Syn: Stop / Ant: Continue" },
  { w: "Circumstance", t: "noun", ar: "ظرف / حالة", en: "A fact or condition connected with or relevant to an event or action", eg: "I can't imagine a circumstance in which I would do that.", sa: "Syn: Situation" },
  { w: "Cite", t: "verb", ar: "يستشهد / يقتبس", en: "To quote a passage, book, or author as evidence", eg: "He cited several experts to support his argument.", sa: "Syn: Quote" },
  { w: "Clarify", t: "verb", ar: "يوضح", en: "To make a statement or situation less confused and more comprehensible", eg: "Could you clarify the first point you made?", sa: "Syn: Explain / Ant: Confuse" },
  { w: "Coherent", t: "adj", ar: "متماسك / مترابط", en: "Logical and consistent", eg: "They failed to develop a coherent strategy.", sa: "Syn: Logical / Ant: Incoherent" },
  { w: "Coincide", t: "verb", ar: "يتزامن / يتوافق", en: "To occur at or during the same time", eg: "Her return will coincide with the publication of her new book.", sa: "Syn: Sync" },
  { w: "Collapse", t: "verb", ar: "ينهار", en: "To fall down or give way suddenly", eg: "The bridge is in danger of collapsing.", sa: "Syn: Fall / Ant: Stand" },
  { w: "Commence", t: "verb", ar: "يبدأ / يشرع", en: "To begin or start", eg: "The meeting will commence at noon.", sa: "Syn: Start / Ant: Finish" },
  { w: "Commission", t: "noun", ar: "لجنة / عمولة", en: "An instruction, command, or duty given to a person or group of people", eg: "He received a commission to design the new museum.", sa: "Syn: Assignment" },
  { w: "Commit", t: "verb", ar: "يلتزم / يرتكب", en: "To pledge or bind a person or an organization to a certain course or policy", eg: "They committed themselves to the project.", sa: "Syn: Dedicate" },
  { w: "Commodity", t: "noun", ar: "سلعة / بضاعة", en: "A raw material or primary agricultural product that can be bought and sold", eg: "Water is a precious commodity in the desert.", sa: "Syn: Product" },
  { w: "Communicate", t: "verb", ar: "يتواصل", en: "To share or exchange information, news, or ideas", eg: "Unable to speak, she communicated with sign language.", sa: "Syn: Convey" },
  { w: "Compatible", t: "adj", ar: "متوافق", en: "Able to exist or occur together without conflict", eg: "The new software is not compatible with older systems.", sa: "Syn: Well-matched / Ant: Incompatible" },
  { w: "Compensate", t: "verb", ar: "يعوض", en: "To give someone something, typically money, in recognition of loss or suffering", eg: "The company will compensate workers for their extra hours.", sa: "Syn: Recompense" },
  { w: "Compile", t: "verb", ar: "يجمع / يؤلف", en: "To produce something by assembling information collected from other sources", eg: "We are trying to compile a list of suitable candidates.", sa: "Syn: Assemble" },
  { w: "Complement", t: "verb", ar: "يكمل", en: "To add to something in a way that enhances or improves it", eg: "The excellent wine perfectly complemented the meal.", sa: "Syn: Enhance / Ant: Clash" },
  { w: "Complex", t: "adj", ar: "معقد", en: "Consisting of many different and connected parts", eg: "The human brain is a highly complex organ.", sa: "Syn: Complicated / Ant: Simple" },
  { w: "Component", t: "noun", ar: "مكون / جزء", en: "A part or element of a larger whole", eg: "Trust is a vital component of any relationship.", sa: "Syn: Part" },
  { w: "Compound", t: "noun", ar: "مركب", en: "A thing that is composed of two or more separate elements", eg: "Water is a compound of hydrogen and oxygen.", sa: "Syn: Mixture" },
  { w: "Comprehensive", t: "adj", ar: "شامل", en: "Complete; including all or nearly all elements or aspects", eg: "The school offers a comprehensive range of courses.", sa: "Syn: Thorough / Ant: Incomplete" },
  { w: "Comprise", t: "verb", ar: "يضم / يتألف من", en: "To consist of; be made up of", eg: "The country comprises 50 states.", sa: "Syn: Contain" },
  { w: "Conceive", t: "verb", ar: "يتصور / يبتكر", en: "To form or devise a plan or idea in the mind", eg: "He conceived the idea of a smart home long ago.", sa: "Syn: Imagine" },
  { w: "Concentrate", t: "verb", ar: "يركز", en: "To focus one's attention or mental effort on a particular object or activity", eg: "I can't concentrate with all that noise.", sa: "Syn: Focus / Ant: Distract" },
  { w: "Concept", t: "noun", ar: "مفهوم", en: "An abstract idea; a general notion", eg: "The concept of infinity is difficult for many to grasp.", sa: "Syn: Idea" },
  { w: "Conclude", t: "verb", ar: "يستنتج / يختتم", en: "To bring something to an end; to arrive at a judgment or reasoning", eg: "The investigation concluded that the fire was accidental.", sa: "Syn: Finish / Ant: Begin" },
  { w: "Concurrent", t: "adj", ar: "متزامن", en: "Existing, happening, or done at the same time", eg: "He was given two concurrent sentences of 10 months.", sa: "Syn: Simultaneous" },
  { w: "Conduct", t: "verb", ar: "يجري / يدير", en: "To organize and carry out", eg: "They are conducting a survey to find out what people think.", sa: "Syn: Perform" },
  { w: "Confer", t: "verb", ar: "يتشاور / يمنح", en: "To grant or bestow; to have discussions", eg: "I should confer with my lawyer before signing.", sa: "Syn: Consult" },
  { w: "Confine", t: "verb", ar: "يقيد / يحصر", en: "To keep or restrict someone or something within certain limits", eg: "Please confine your remarks to the subject under discussion.", sa: "Syn: Restrict" },
  { w: "Confirm", t: "verb", ar: "يؤكد", en: "To establish the truth or correctness of", eg: "Please write to confirm your reservation.", sa: "Syn: Verify / Ant: Deny" },
  { w: "Conflict", t: "noun", ar: "صراع / تعارض", en: "A serious disagreement or argument", eg: "The conflict between the two countries lasted for years.", sa: "Syn: Dispute / Ant: Peace" },
  { w: "Conform", t: "verb", ar: "يطابق / يمتثل", en: "To comply with rules, standards, or laws", eg: "The kitchen does not conform to hygiene regulations.", sa: "Syn: Comply" },
  { w: "Consent", t: "noun", ar: "موافقة", en: "Permission for something to happen or agreement to do something", eg: "No action can be taken without their consent.", sa: "Syn: Approval / Ant: Refusal" },
  { w: "Consequent", t: "adj", ar: "مترتب على / ناتج", en: "Following as a result or effect", eg: "The consequent loss of revenue was a blow to the business.", sa: "Syn: Resulting" },
  { w: "Considerable", t: "adj", ar: "كبير / ملحوظ", en: "Notably large in size, amount, or extent", eg: "He took a considerable amount of time to answer.", sa: "Syn: Significant / Ant: Insignificant" },
  { w: "Consist", t: "verb", ar: "يتكون من", en: "To be composed or made up of", eg: "The team consists of four Europeans and two Americans.", sa: "Syn: Comprise" },
  { w: "Constant", t: "adj", ar: "ثابت / مستمر", en: "Occurring continuously over a period of time", eg: "The machine requires constant maintenance.", sa: "Syn: Continuous / Ant: Variable" },
  { w: "Constitute", t: "verb", ar: "يشكل / يمثل", en: "To be a part of a whole", eg: "Women constitute 70% of the student population here.", sa: "Syn: Form" },
  { w: "Constrain", t: "verb", ar: "يجبر / يقيد", en: "To severely restrict the scope, extent, or activity of", eg: "Financial factors constrain our ability to hire more staff.", sa: "Syn: Restrict / Ant: Release" },
  { w: "Construct", t: "verb", ar: "يبني", en: "To build or erect something, typically a building, road, or machine", eg: "The city plans to construct a new hospital.", sa: "Syn: Build / Ant: Destroy" },
  { w: "Consult", t: "verb", ar: "يستشير", en: "To seek information or advice from someone with expertise", eg: "If the symptoms persist, consult your doctor.", sa: "Syn: Ask" },
  { w: "Consume", t: "verb", ar: "يستهلك", en: "To use up a resource", eg: "These machines consume a lot of electricity.", sa: "Syn: Deplete" },
  { w: "Contact", t: "noun", ar: "اتصال", en: "The state or condition of physical touching; communicating", eg: "I've been trying to make contact with him all day.", sa: "Syn: Connection" },
  { w: "Contemporary", t: "adj", ar: "معاصر", en: "Living or occurring at the same time; modern", eg: "She is a student of contemporary art.", sa: "Syn: Modern / Ant: Old-fashioned" },
  { w: "Context", t: "noun", ar: "سياق", en: "The circumstances that form the setting for an event, statement, or idea", eg: "This quote has been taken out of context.", sa: "Syn: Situation" },
  { w: "Contract", t: "noun", ar: "عقد / اتفاقية", en: "A written or spoken agreement that is intended to be enforceable by law", eg: "He signed a two-year contract with the team.", sa: "Syn: Agreement" },
  { w: "Contradict", t: "verb", ar: "يناقض", en: "To deny the truth of a statement by asserting the opposite", eg: "The witness statements contradict each other.", sa: "Syn: Oppose / Ant: Confirm" },
  { w: "Contrary", t: "adj", ar: "معاكس / مناقض", en: "Opposite in nature, direction, or meaning", eg: "He ignored contrary advice and did it his own way.", sa: "Syn: Opposite" },
  { w: "Contrast", t: "noun", ar: "تباين / اختلاف", en: "The state of being strikingly different from something else", eg: "The contrast between their lifestyles is huge.", sa: "Syn: Difference / Ant: Similarity" },
  { w: "Contribute", t: "verb", ar: "يساهم", en: "To give in order to help achieve or provide something", eg: "Many people contributed money to the relief fund.", sa: "Syn: Donate" },
  { w: "Controversy", t: "noun", ar: "جدل / خلاف", en: "Disagreement, typically when prolonged, public, and heated", eg: "The new movie caused a lot of controversy.", sa: "Syn: Debate / Ant: Agreement" },
  { w: "Convene", t: "verb", ar: "يجتمع / يعقد", en: "To come or bring together for a meeting or activity", eg: "The council will convene next week to discuss the issue.", sa: "Syn: Assemble / Ant: Disperse" },
  { w: "Converse", t: "verb", ar: "يتحادث", en: "To engage in conversation", eg: "They conversed quietly in the corner of the room.", sa: "Syn: Talk" },
  { w: "Convert", t: "verb", ar: "يحول", en: "To cause to change in form, character, or function", eg: "The old factory was converted into apartments.", sa: "Syn: Transform" },
  { w: "Convince", t: "verb", ar: "يقنع", en: "To cause someone to believe firmly in the truth of something", eg: "I tried to convince him that I was right.", sa: "Syn: Persuade" },
  { w: "Cooperate", t: "verb", ar: "يتعاون", en: "To work jointly toward the same end", eg: "The two countries agreed to cooperate on environmental issues.", sa: "Syn: Collaborate" },
  { w: "Coordinate", t: "verb", ar: "ينسق", en: "To bring the different elements of a complex activity into a relationship that will ensure efficiency or harmony", eg: "She will coordinate the relief efforts.", sa: "Syn: Organize" },
  { w: "Core", t: "noun", ar: "جوهر / صميم", en: "The tough central part; the central or most important part", eg: "The core of the problem lies in their lack of communication.", sa: "Syn: Center / Ant: Surface" },
  { w: "Corporate", t: "adj", ar: "خاص بالشركات / مؤسسي", en: "Relating to a corporation, especially a large company or group", eg: "He enjoys the benefits of a corporate job.", sa: "Syn: Business" },
  { w: "Correspond", t: "verb", ar: "يتوافق / يراسل", en: "To have a close similarity; match or agree almost exactly", eg: "The goods do not correspond to the description.", sa: "Syn: Match / Ant: Differ" },
  { w: "Couple", t: "noun", ar: "زوج / اثنان", en: "Two individuals of the same sort considered together", eg: "We are going away for a couple of days.", sa: "Syn: Pair" },
  { w: "Create", t: "verb", ar: "يصنع / ينشئ", en: "To bring something into existence", eg: "The company aims to create 500 new jobs.", sa: "Syn: Generate / Ant: Destroy" },
  { w: "Credit", t: "noun", ar: "ائتمان / تقدير", en: "The ability of a customer to obtain goods or services before payment, based on the trust that payment will be made in the future", eg: "I have good credit so I got the loan easily.", sa: "Syn: Recognition" },
  { w: "Criteria", t: "noun", ar: "معايير", en: "A principle or standard by which something may be judged or decided", eg: "What criteria do you use to select the winner?", sa: "Syn: Standards" },
  { w: "Crucial", t: "adj", ar: "حاسم / مهم جداً", en: "Decisive or critical, especially in the success or failure of something", eg: "Vitamins are crucial for maintaining good health.", sa: "Syn: Vital / Ant: Unimportant" },
  { w: "Culture", t: "noun", ar: "ثقافة", en: "The arts and other manifestations of human intellectual achievement regarded collectively", eg: "We are studying the ancient culture of Egypt.", sa: "Syn: Society" },
  { w: "Currency", t: "noun", ar: "عملة", en: "A system of money in general use in a particular country", eg: "You can exchange your currency at the airport.", sa: "Syn: Money" }
];

const mappedWords = words.map((w, i) => {
  return {
    id: 'bv_' + (i + 1),
    word: w.w,
    type: w.t,
    ar: w.ar,
    en: w.en,
    eg: w.eg,
    syn_ant: w.sa
  };
});

const content = '// Vocabulary Bank - Batch 1 (100 words)\nwindow.STEP_BANK_VOCAB = ' + JSON.stringify(mappedWords, null, 2) + ';\n';

fs.writeFileSync('e:/claude code/bank-vocab.js', content, 'utf8');
console.log('Successfully wrote 100 words to bank-vocab.js');

// Duplicate check
const uniqueWords = new Set();
let duplicates = 0;
mappedWords.forEach(w => {
  const lw = w.word.toLowerCase();
  if (uniqueWords.has(lw)) duplicates++;
  uniqueWords.add(lw);
});
console.log('Duplicates found: ' + duplicates);
