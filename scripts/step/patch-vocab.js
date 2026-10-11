const fs = require('fs');
const path = require('path');
// Paths are resolved from this file's place in scripts/step/, never typed out:
// the project moved once and every hardcoded 'e:/claude code/...' in here
// broke silently, writing nothing and reporting success.
const ROOT = path.join(__dirname, '..', '..');

const file = path.join(ROOT, 'apps/step-arena/step-arena.html');
let html = fs.readFileSync(file, 'utf8');

const vocabVaultCode = `    /* ═══ Vocabulary Vault (SM-2 Spaced Repetition) ═══ */
    const ST_COLOR = { new: 'amber', reviewing: 'indigo', mastered: 'emerald' };
    const ST_LABEL = { new: 'جديد', reviewing: 'مراجعة', mastered: 'متقن' };

    function VocabVault({ words, setWords }) {
      const [view, setView] = useState('cards');
      const [flip, setFlip] = useState(false);
      const [q, setQ] = useState('');
      const [f, setF] = useState({ word: '', ar: '', ex: '', cat: 'Vocabulary' });

      const now = Date.now();
      const dueQueue = useMemo(() => {
        return words.filter(w => !w.nextReview || w.nextReview <= now)
          .sort((a,b) => (a.nextReview || 0) - (b.nextReview || 0));
      }, [words, now]);

      const list = useMemo(() => {
        const t = q.trim().toLowerCase();
        if (!t) return words;
        return words.filter(w => (w.word || '').toLowerCase().includes(t) || (w.ar || '').includes(q.trim()) || (w.cat || '').toLowerCase().includes(t));
      }, [words, q]);

      const persist = next => { setWords(next); S.set('vocab', next); };
      
      const add = () => {
        if (!f.word.trim() || !f.ar.trim()) return;
        persist([{ id: 'custom_' + Date.now(), word: f.word.trim(), ar: f.ar.trim(), ex: f.ex.trim(), cat: f.cat, status: 'new', interval: 0, repetition: 0, efactor: 2.5, nextReview: Date.now() }, ...words]);
        setF({ word: '', ar: '', ex: '', cat: 'Vocabulary' });
      };

      const remove = id => persist(words.filter(w => w.id !== id));

      const gradeWord = (id, qGrade) => {
        const w = words.find(x => x.id === id);
        if (!w) return;
        let { interval = 0, repetition = 0, efactor = 2.5 } = w;

        if (qGrade >= 3) {
          if (repetition === 0) interval = 1;
          else if (repetition === 1) interval = 6;
          else interval = Math.round(interval * efactor);
          repetition++;
        } else {
          repetition = 0;
          interval = 0; // Show again today
        }

        efactor = efactor + (0.1 - (5 - qGrade) * (0.08 + (5 - qGrade) * 0.02));
        if (efactor < 1.3) efactor = 1.3;

        let status = 'reviewing';
        if (interval > 21) status = 'mastered';
        else if (interval === 0 && repetition === 0) status = 'new';

        const nextReview = Date.now() + (interval === 0 ? 0 : interval * 24 * 60 * 60 * 1000);

        if (w.status !== 'mastered' && status === 'mastered') logAct('vocab');

        persist(words.map(x => x.id === id ? { ...x, interval, repetition, efactor, status, nextReview } : x));
        setFlip(false);
      };

      const cur = dueQueue[0];
      const stats = { new: 0, reviewing: 0, mastered: 0 };
      words.forEach(w => { stats[w.status || 'new'] = (stats[w.status || 'new'] || 0) + 1; });

      return (
        <div>
          <div className="page-head">
            <h1 className="page-title">بنك المفردات</h1>
            <div className="page-sub">احفظ الكلمات بذكاء! نظام التكرار المتباعد يعرض لك الكلمات بالوقت المناسب لترسيخها في الذاكرة.</div>
          </div>

          <div className="grid-3 mb20">
            {['new', 'reviewing', 'mastered'].map(s => (
              <div key={s} className="stat">
                <div className="stat-glow" style={{ background: 'radial-gradient(circle, ' + CVAR[ST_COLOR[s]] + ', transparent 70%)' }} />
                <div className="stat-num nums" style={{ color: CVAR[ST_COLOR[s]] }}>{stats[s]}</div>
                <div className="stat-lbl rtl" style={{ textAlign: 'left' }}>{ST_LABEL[s]}</div>
              </div>
            ))}
          </div>

          <div className="card mb20">
            <h2 className="card-title mb16">إضافة مفردة جديدة</h2>
            <div className="grid-2 mb12">
              <div>
                <label className="label" htmlFor="v-word">الكلمة (English)</label>
                <input id="v-word" className="input" value={f.word} onChange={e => setF(s => ({ ...s, word: e.target.value }))} placeholder="Ubiquitous" />
              </div>
              <div>
                <label className="label" htmlFor="v-ar">المعنى بالعربية</label>
                <input id="v-ar" className="input rtl" value={f.ar} onChange={e => setF(s => ({ ...s, ar: e.target.value }))} placeholder="منتشر في كل مكان" />
              </div>
            </div>
            <div className="grid-2 mb16">
              <div>
                <label className="label" htmlFor="v-ex">جملة مثال</label>
                <input id="v-ex" className="input" value={f.ex} onChange={e => setF(s => ({ ...s, ex: e.target.value }))} placeholder="Smartphones are ubiquitous today." />
              </div>
              <div>
                <label className="label" htmlFor="v-cat">الفئة</label>
                <select id="v-cat" className="input" value={f.cat} onChange={e => setF(s => ({ ...s, cat: e.target.value }))}>
                  {['Vocabulary', 'Grammar', 'Reading', 'Academic'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <button className="btn btn-primary" onClick={add} disabled={!f.word.trim() || !f.ar.trim()}><I.Plus size={15} /> أضف للطابور</button>
          </div>

          <div className="row between wrap g12 mb16">
            <div className="tabs">
              <button className={'tab' + (view === 'cards' ? ' active' : '')} onClick={() => setView('cards')}>طابور اليوم ({dueQueue.length})</button>
              <button className={'tab' + (view === 'table' ? ' active' : '')} onClick={() => setView('table')}>كل الكلمات ({words.length})</button>
            </div>
            {view === 'table' && (
              <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 300 }}>
                <I.Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                <input className="input" style={{ paddingLeft: 34 }} value={q} onChange={e => setQ(e.target.value)} placeholder="ابحث..." aria-label="بحث" />
              </div>
            )}
          </div>

          {view === 'cards' ? (
            dueQueue.length === 0 ? (
              <div className="card empty" style={{ padding: '60px 20px', textAlign: 'center' }}>
                <I.Award size={48} style={{ color: 'var(--emerald)', margin: '0 auto 16px' }} />
                <div style={{ fontSize: 18, fontWeight: 800 }}>أنجزت مراجعة اليوم!</div>
                <div style={{ color: 'var(--text-3)', marginTop: 8 }}>لقد صفّرت طابور الكلمات المستحقة لهذا اليوم. عد غداً لمراجعة المزيد.</div>
              </div>
            ) : (
              <div style={{ maxWidth: 480, margin: '0 auto' }}>
                <div className="row between mb12" style={{ color: 'var(--text-3)', fontSize: 13, fontWeight: 700 }}>
                  <span>كلمات باقية اليوم: <span className="nums" style={{ color: 'var(--text)' }}>{dueQueue.length}</span></span>
                  <span className={'badge badge-' + ST_COLOR[cur.status || 'new']}>{ST_LABEL[cur.status || 'new']}</span>
                </div>
                
                <div className="fc-wrap" onClick={() => setFlip(true)} role="button" tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlip(true); } }}>
                  <div className={'fc' + (flip ? ' flipped' : '')}>
                    <div className="fc-face fc-front">
                      <div className="fc-word">{cur.word}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 11, fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase' }}>{cur.cat || cur.type}</div>
                      {!flip && <div className="fc-hint mt24"><I.Redo size={12} /> اضغط للكشف عن المعنى</div>}
                    </div>
                    <div className="fc-face fc-back">
                      <div className="fc-word rtl">{cur.ar}</div>
                      {cur.en && <div style={{ fontSize: 13.5, opacity: .9, marginTop: 14 }}>{cur.en}</div>}
                      {cur.ex || cur.eg ? <div style={{ fontSize: 12.5, opacity: .8, marginTop: 18, textAlign: 'center', lineHeight: 1.8, fontStyle: 'italic', maxWidth: 330, borderTop: '1px solid rgba(255,255,255,.28)', paddingTop: 16 }}>“{cur.ex || cur.eg}”</div> : null}
                      {cur.syn_ant && <div style={{ fontSize: 11.5, opacity: .7, marginTop: 10 }}>{cur.syn_ant}</div>}
                    </div>
                  </div>
                </div>

                {flip && (
                  <div className="row g10 mt24" style={{ justifyContent: 'center' }}>
                    <button className="btn btn-ghost" onClick={() => gradeWord(cur.id, 2)} style={{ color: 'var(--rose)', flex: 1, borderColor: 'rgba(255, 92, 122, .3)' }}>صعب / نسيتها</button>
                    <button className="btn btn-ghost" onClick={() => gradeWord(cur.id, 4)} style={{ color: 'var(--amber)', flex: 1, borderColor: 'rgba(255, 194, 75, .3)' }}>متوسط</button>
                    <button className="btn btn-ghost" onClick={() => gradeWord(cur.id, 5)} style={{ color: 'var(--emerald)', flex: 1, borderColor: 'rgba(47, 227, 168, .3)' }}>سهل جداً</button>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="tbl">
                  <thead><tr><th>الكلمة</th><th>المعنى</th><th>الفئة</th><th>المراجعة القادمة</th><th>الحالة</th><th></th></tr></thead>
                  <tbody>
                    {list.map(w => {
                      const isDue = !w.nextReview || w.nextReview <= now;
                      const next = w.nextReview ? new Date(w.nextReview).toLocaleDateString() : 'الآن';
                      return (
                        <tr key={w.id}>
                          <td style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, whiteSpace: 'nowrap' }}>{w.word}</td>
                          <td className="rtl" style={{ whiteSpace: 'nowrap' }}>{w.ar}</td>
                          <td><span className="badge badge-indigo">{w.cat || w.type || 'Vocab'}</span></td>
                          <td className="nums" style={{ color: isDue ? 'var(--amber)' : 'var(--text-3)' }}>{isDue ? 'مستحقة' : next}</td>
                          <td><span className={'badge badge-' + ST_COLOR[w.status || 'new']}>{ST_LABEL[w.status || 'new']}</span></td>
                          <td><button className="btn btn-ghost btn-icon btn-sm" onClick={() => remove(w.id)} aria-label={'حذف ' + w.word}><I.Trash size={14} /></button></td>
                        </tr>
                      );
                    })}
                    {list.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: 24 }}>لا توجد كلمات مطابقة</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      );
    }`;

const oldStart = html.indexOf('    /* ═══ Vocabulary Vault ═══ */');
const oldEnd = html.indexOf('    /* ═══ Quiz Arena ═══ */');
if (oldStart > -1 && oldEnd > -1) {
   html = html.substring(0, oldStart) + vocabVaultCode + '\n\n' + html.substring(oldEnd);
} else {
   throw new Error("Could not find VocabVault bounds!");
}

// Update the App initialization for words
// From: const [words, setWords] = useState(() => S.get('vocab', SEED_VOCAB));
// To the migrated version.
const oldAppInit = "const [words, setWords] = useState(() => S.get('vocab', SEED_VOCAB));";
const newAppInit = `const [words, setWords] = useState(() => {
        let saved = S.get('vocab', null);
        const base = typeof window.STEP_BANK_VOCAB !== 'undefined' ? window.STEP_BANK_VOCAB : [];
        if (!saved) {
           saved = SEED_VOCAB.concat(base).map(w => ({
              ...w,
              status: 'new', interval: 0, repetition: 0, efactor: 2.5, nextReview: Date.now()
           }));
           try { S.set('vocab', saved); } catch {}
        } else {
           let changed = false;
           const existingIds = new Set(saved.map(w => w.id));
           base.forEach(w => {
             if (!existingIds.has(w.id)) {
               saved.push({ ...w, status: 'new', interval: 0, repetition: 0, efactor: 2.5, nextReview: Date.now() });
               changed = true;
             }
           });
           if (changed) try { S.set('vocab', saved); } catch {}
        }
        return saved;
      });`;

html = html.replace(oldAppInit, newAppInit);

fs.writeFileSync(file, html, 'utf8');
console.log('Successfully updated VocabVault and App initialization.');
