const fs = require('fs');

const html = fs.readFileSync('e:/claude code/step-arena.html', 'utf8');
const bank = fs.readFileSync('e:/claude code/bank-grammar.js', 'utf8');

const quizMatch = html.match(/const QUIZ = (\[[\s\S]*?\]);/);

const extracted = `
  const QUIZ = ` + quizMatch[1] + `;
  ` + bank.replace('window.STEP_BANK_GRAMMAR = ', 'const BANK = ') + `
  
  QUIZ.forEach((q, i) => {
    q.id = q.id || ('quiz_' + i);
    q.sec = q.sec || q.cat || 'Grammar';
    q.sub = q.sub || (q.sec === 'Grammar' ? 'general_grammar' : q.sec === 'Reading' ? 'general_reading' : 'general_vocab');
  });
  if (typeof BANK !== 'undefined') {
    BANK.forEach(q => {
      q.cat = q.sec;
      QUIZ.push(q);
    });
  }
  
  const grammarQs = QUIZ.filter(q => q.sec === 'Grammar');
  const counts = {};
  grammarQs.forEach(q => {
    counts[q.sub] = (counts[q.sub] || 0) + 1;
  });
  console.log('--- Distribution ---');
  Object.keys(counts).sort((a, b) => counts[a] - counts[b]).forEach(k => {
    console.log(k + ': ' + counts[k]);
  });
`;

eval(extracted);
