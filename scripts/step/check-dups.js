const fs = require('fs');
const path = require('path');
// Paths are resolved from this file's place in scripts/step/, never typed out:
// the project moved once and every hardcoded 'e:/claude code/...' in here
// broke silently, writing nothing and reporting success.
const ROOT = path.join(__dirname, '..', '..');

const html = fs.readFileSync(path.join(ROOT, 'apps/step-arena/step-arena.html'), 'utf8');
const bank = fs.readFileSync(path.join(ROOT, 'apps/step-arena/bank-grammar.js'), 'utf8');

const quizMatch = html.match(/const QUIZ = (\[[\s\S]*?\]);/);
const extracted = `
  const QUIZ = ` + quizMatch[1] + `;
  ` + bank.replace('window.STEP_BANK_GRAMMAR = ', 'const BANK = ') + `
  
  if (typeof BANK !== 'undefined') {
    BANK.forEach(q => {
      QUIZ.push(q);
    });
  }

  // Find similarities
  const similar = [];
  for(let i=0; i<QUIZ.length; i++) {
    for(let j=i+1; j<QUIZ.length; j++) {
      const q1 = QUIZ[i].q.toLowerCase().replace(/[^a-z0-9]/g, '');
      const q2 = QUIZ[j].q.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (q1 === q2) {
        similar.push({ q1: QUIZ[i].q, q2: QUIZ[j].q });
      }
    }
  }

  console.log('Similar questions found:', similar.length);
  if (similar.length > 0) console.log(similar.slice(0, 5));
`;

eval(extracted);
