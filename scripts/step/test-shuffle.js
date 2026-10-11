const fs = require('fs');
const path = require('path');
// Paths are resolved from this file's place in scripts/step/, never typed out:
// the project moved once and every hardcoded 'e:/claude code/...' in here
// broke silently, writing nothing and reporting success.
const ROOT = path.join(__dirname, '..', '..');

const html = fs.readFileSync(path.join(ROOT, 'apps/step-arena/step-arena.html'), 'utf8');
const bank = fs.readFileSync(path.join(ROOT, 'apps/step-arena/bank-grammar.js'), 'utf8');

const passageMatch = html.match(/const PASSAGE = ([\s\S]*?\]\n    \};)/);
const listMatch = html.match(/const LISTENING = ([\s\S]*?\]\n    \};)/);
const quizMatch = html.match(/const QUIZ = (\[[\s\S]*?\]);/);
const mockMatch = html.match(/const MOCK_EXTRA = (\[[\s\S]*?\]);/);

const extracted = `
  const PASSAGE = ` + passageMatch[1] + `
  const LISTENING = ` + listMatch[1] + `
  const QUIZ = ` + quizMatch[1] + `
  const MOCK_EXTRA = ` + mockMatch[1] + `
  const MOCK_SECTIONS = ['Grammar', 'Reading', 'Vocabulary', 'Listening'];
  const MOCK_POOL = [].concat(
    QUIZ.filter(x => x.cat === 'Grammar').map(x => ({ ...x, sec: 'Grammar' })),
    MOCK_EXTRA.filter(x => x.sec === 'Grammar'),
    QUIZ.filter(x => x.cat === 'Reading').map(x => ({ ...x, sec: 'Reading' })),
    PASSAGE.questions.map(x => ({ ...x, sec: 'Reading', ctx: 'reading' })),
    QUIZ.filter(x => x.cat === 'Vocabulary').map(x => ({ ...x, sec: 'Vocabulary' })),
    MOCK_EXTRA.filter(x => x.sec === 'Vocabulary'),
    LISTENING.questions.map(x => ({ ...x, sec: 'Listening', ctx: 'listening' })),
    MOCK_EXTRA.filter(x => x.sec === 'Listening')
  );
  
  ` + bank.replace('window.STEP_BANK_GRAMMAR = ', 'const BANK = ') + `
  
  QUIZ.forEach((q, i) => {
    q.id = q.id || ('quiz_' + i);
    q.sec = q.sec || q.cat || 'Grammar';
    q.sub = q.sub || (q.sec === 'Grammar' ? 'general_grammar' : q.sec === 'Reading' ? 'general_reading' : 'general_vocab');
    q.diff = q.diff || 2;
  });
  MOCK_POOL.forEach((q, i) => {
    q.id = q.id || ('mock_' + i);
    q.sec = q.sec || 'Grammar';
    q.sub = q.sub || (q.sec === 'Grammar' ? 'general_grammar' : q.sec === 'Listening' ? 'general_listening' : 'general_vocab');
    q.diff = q.diff || 2;
  });
  if (typeof BANK !== 'undefined') {
    BANK.forEach(q => {
      q.cat = q.sec;
      QUIZ.push(q);
    });
  }
  const ALL_QS = QUIZ.concat(MOCK_POOL);

  const shuffleArr = a => {
    const b = a.slice();
    for (let k = b.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      const t = b[k]; b[k] = b[j]; b[j] = t;
    }
    return b;
  };

  const shouldShuffleOpts = q => {
    const optsText = q.opts.join(' ').toLowerCase();
    if (/(all of the above|none of the above|both |a and b|جميع ما سبق|كل ما سبق|لا شيء مما سبق)/.test(optsText)) return false;
    if (q.exp && /(الخيار |الإجابة |option |كما في )[a-d1-4]\b/i.test(q.exp)) return false;
    if (q.opts.some(o => /^[a-d][.)]/i.test(o.trim()))) return false;
    return true;
  };

  const shuffleOpts = q => {
    if (!shouldShuffleOpts(q)) return { ...q };
    const newQ = { ...q };
    const ansStr = newQ.opts[newQ.ans];
    newQ.opts = shuffleArr([...newQ.opts]);
    newQ.ans = newQ.opts.indexOf(ansStr);
    return newQ;
  };

  let tested = 0;
  let failed = 0;
  ALL_QS.forEach(q => {
    const origAnsStr = q.opts[q.ans];
    const newQ = shuffleOpts(q);
    tested++;
    if (newQ.opts[newQ.ans] !== origAnsStr) {
      failed++;
    }
  });

  console.log('[Self-Check Result] Tested:', tested, 'Failed:', failed);
`;

eval(extracted);
