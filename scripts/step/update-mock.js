const fs = require('fs');
const path = require('path');
// Paths are resolved from this file's place in scripts/step/, never typed out:
// the project moved once and every hardcoded 'e:/claude code/...' in here
// broke silently, writing nothing and reporting success.
const ROOT = path.join(__dirname, '..', '..');
const htmlPath = path.join(ROOT, 'apps/step-arena/step-arena.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const startStr = "function MockExam({ go }) {";
const endStr = "/* ═══ App ═══ */";

const startIdx = html.indexOf(startStr);
const endIdx = html.indexOf(endStr);

if (startIdx === -1 || endIdx === -1) {
  console.error("Could not find boundaries.");
  process.exit(1);
}

const newMockExam = `const MOCK_SEC_CFG = {
      Grammar: { q: 30, min: 25 },
      Reading: { q: 20, min: 30 },
      Vocabulary: { q: 10, min: 10 },
      Listening: { q: 10, min: 15 }
    };

    function MockExam({ go }) {
      const [phase, setPhase] = useState('intro');
      const [qs, setQs] = useState([]);
      const [secIdx, setSecIdx] = useState(0);
      const [i, setI] = useState(0);
      const [ans, setAns] = useState({});
      const [flags, setFlags] = useState({});
      const [times, setTimes] = useState({});
      const [startedAt, setStartedAt] = useState(0);
      const [endsAt, setEndsAt] = useState(0);
      const [result, setResult] = useState(null);
      const [openCtx, setOpenCtx] = useState(false);
      const [tts, setTts] = useState(false);
      const [showReview, setShowReview] = useState(false);

      const doneRef = useRef(false);
      const expireRef = useRef(null);
      const lastTRef = useRef(Date.now());
      const curIRef = useRef(0);

      const history = useMemo(() => S.get('mock', []), [phase]);
      const best = history.length ? Math.max.apply(null, history.map(r => r.score)) : null;

      const stopTts = () => { try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch { } };
      useEffect(() => () => { EXAM_LOCK = false; stopTts(); }, []);

      const secName = MOCK_SECTIONS[secIdx];
      const secStart = useMemo(() => {
        let count = 0;
        for (let j = 0; j < secIdx; j++) count += qs.filter(q => q.sec === MOCK_SECTIONS[j]).length;
        return count;
      }, [qs, secIdx]);

      const secQs = useMemo(() => qs.filter(q => q.sec === secName), [qs, secName]);
      const absI = secStart + i;

      const updateTime = () => {
        const now = Date.now();
        const diff = now - lastTRef.current;
        setTimes(prev => ({ ...prev, [curIRef.current]: (prev[curIRef.current] || 0) + diff }));
        lastTRef.current = now;
      };

      const finishExam = React.useCallback((allQs, auto) => {
        if (doneRef.current) return;
        doneRef.current = true;
        updateTime();
        EXAM_LOCK = false;
        stopTts(); setTts(false);

        const bySec = {};
        const bySub = {};
        MOCK_SECTIONS.forEach(s => { bySec[s] = { total: 0, correct: 0, answered: 0 }; });
        let correct = 0, answered = 0;

        const timeArr = [];
        const newMs = S.get('mistakes', {});
        
        // Compute final times locally since setTimes is async
        const finalTimes = { ...times };
        const now = Date.now();
        const diff = now - lastTRef.current;
        finalTimes[curIRef.current] = (finalTimes[curIRef.current] || 0) + diff;

        allQs.forEach((q, idx) => {
          const b = bySec[q.sec];
          if (b) b.total++;
          if (q.sub) {
            if (!bySub[q.sub]) bySub[q.sub] = { total: 0, correct: 0, answered: 0 };
            bySub[q.sub].total++;
          }

          const tMs = finalTimes[idx] || 0;
          timeArr.push({ q, tMs, ans: ans[idx], ok: ans[idx] === q.ans });

          if (ans[idx] != null) {
            if (b) b.answered++;
            answered++;
            if (q.sub) bySub[q.sub].answered++;
            if (ans[idx] === q.ans) {
              if (b) b.correct++;
              correct++;
              if (q.sub) bySub[q.sub].correct++;
            } else {
              if (!newMs[q.id]) newMs[q.id] = { attempts: 0, consecRight: 0, added: Date.now() };
              newMs[q.id].attempts++;
            }
          }
        });

        try { S.set('mistakes', newMs); } catch { }

        timeArr.sort((a, b) => b.tMs - a.tMs);
        const slowest = timeArr.slice(0, 5);

        const total = allQs.length || 1;
        const score = Math.round(correct / total * 100);
        let usedMs = 0;
        Object.values(finalTimes).forEach(t => usedMs += t);
        const used = Math.round(usedMs / 1000);

        if (answered > 0) { logAct('attempts', answered); logAct('correct', correct); }
        const rec = { score, correct, answered, total: allQs.length, bySec, bySub, slowest, used, auto: !!auto, at: Date.now() };
        try { S.set('mock', [rec].concat(S.get('mock', [])).slice(0, 10)); } catch { }
        setResult(rec); setPhase('done'); setShowReview(false);
      }, [ans, times]);

      expireRef.current = () => {
        updateTime();
        if (secIdx < MOCK_SECTIONS.length - 1) {
          startSection(secIdx + 1, qs);
        } else {
          finishExam(qs, true);
        }
      };

      const startSection = (idx, allQs) => {
        const sName = MOCK_SECTIONS[idx];
        const sLen = allQs.filter(q => q.sec === sName).length;
        if (sLen === 0) {
          if (idx < MOCK_SECTIONS.length - 1) startSection(idx + 1, allQs);
          else finishExam(allQs, false);
          return;
        }
        setSecIdx(idx);
        setI(0);

        let cCount = 0;
        for (let j = 0; j < idx; j++) cCount += allQs.filter(q => q.sec === MOCK_SECTIONS[j]).length;
        curIRef.current = cCount;

        const limitMins = MOCK_SEC_CFG[sName] ? MOCK_SEC_CFG[sName].min : 20;
        const t = Date.now();
        lastTRef.current = t;
        setEndsAt(t + limitMins * 60 * 1000);
        setPhase('running');
      };

      const start = () => {
        const seen = S.get('seen', {});
        const pool = MOCK_SECTIONS.reduce((out, s) => {
          let cQs = MOCK_POOL.filter(q => q.sec === s);
          cQs = shuffleArr(cQs);
          cQs.sort((a, b) => (seen[a.id] || 0) - (seen[b.id] || 0));
          const limit = MOCK_SEC_CFG[s]?.q || 20;
          cQs = cQs.slice(0, limit);
          return out.concat(cQs.map(q => shuffleOpts(q)));
        }, []);
        pool.forEach(q => { seen[q.id] = Date.now(); });
        try { S.set('seen', seen); } catch { }

        doneRef.current = false;
        setQs(pool); setAns({}); setFlags({}); setTimes({});
        setResult(null); setOpenCtx(false);
        EXAM_LOCK = true;
        startSection(0, pool);
      };

      const goQ = n => {
        updateTime();
        setI(n);
        curIRef.current = secStart + n;
        setOpenCtx(false); stopTts(); setTts(false);
      };

      const speakCtx = () => {
        if (!('speechSynthesis' in window)) return;
        const synth = window.speechSynthesis;
        if (tts) { synth.cancel(); setTts(false); return; }
        synth.cancel();
        const u = new SpeechSynthesisUtterance(LISTENING.transcript);
        u.lang = 'en-US'; u.rate = 1;
        u.onend = () => setTts(false); u.onerror = () => setTts(false);
        synth.speak(u); setTts(true);
      };

      const fmt = s => {
        const v = Math.max(0, Math.floor(s || 0));
        return String(Math.floor(v / 60)).padStart(2, '0') + ':' + String(v % 60).padStart(2, '0');
      };

      const askSubmitSec = () => {
        updateTime();
        setPhase('review');
      };

      /* ─── Intro ─── */
      if (phase === 'intro') {
        const counts = {};
        const mins = {};
        let totalQ = 0, totalM = 0;
        MOCK_SECTIONS.forEach(s => {
          counts[s] = MOCK_SEC_CFG[s]?.q || 20;
          mins[s] = MOCK_SEC_CFG[s]?.min || 20;
          totalQ += counts[s];
          totalM += mins[s];
        });
        
        // Graph data
        const graphData = history.slice(0, 10).reverse();

        return (
          <div>
            <div className="page-head">
              <h1 className="page-title">اختبار المحاكاة</h1>
              <div className="page-sub">محاكاة كاملة بتوقيت حقيقي لكل قسم — تدرّب على إدارة وقتك قبل القاعة</div>
            </div>

            <div style={{ maxWidth: 760, margin: '0 auto' }}>
              <div className="card mb20">
                <div className="row between wrap g16 mb20">
                  <div className="row g12">
                    <div className="tile-icon" style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--coral-bg)', color: 'var(--coral)' }}>
                      <I.Timer size={24} />
                    </div>
                    <div>
                      <div className="card-title" style={{ fontSize: 18 }}>Full STEP Mock Exam</div>
                      <div className="card-sub">4 أقسام · {totalQ} سؤال · {totalM} دقيقة كلياً</div>
                    </div>
                  </div>
                  {best != null && <span className="badge badge-emerald"><I.Award size={11} /> أفضل نتيجة: {best}%</span>}
                </div>

                <div className="grid-2 mb20" style={{ gap: 11 }}>
                  {MOCK_SECTIONS.map(s => (
                    <div key={s} className="row between g12" style={{
                      padding: '13px 16px', borderRadius: 13,
                      background: CBG[MOCK_SEC_C[s]], border: '1px solid ' + CVAR[MOCK_SEC_C[s]] + '3d'
                    }}>
                      <div className="col">
                         <span className="rtl" style={{ fontWeight: 800, fontSize: 13.5, color: CVAR[MOCK_SEC_C[s]] }}>{MOCK_SEC_AR[s]}</span>
                         <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{mins[s]} دقيقة</span>
                      </div>
                      <span className="nums" style={{ fontWeight: 800, fontSize: 13, color: CVAR[MOCK_SEC_C[s]] }}>{counts[s]} أسئلة</span>
                    </div>
                  ))}
                </div>

                <div className="rules">
                  <div className="rule"><span className="rule-n">1</span><span>المؤقّت منفصل <b>لكل قسم</b>. إذا انتهى وقت القسم تنتقل للقسم التالي فوراً دون إمكانية الرجوع.</span></div>
                  <div className="rule"><span className="rule-n">2</span><span>لا تظهر الإجابات الصحيحة أثناء الاختبار — فقط بعد الانتهاء التام يتم تحليل أدائك بدقة.</span></div>
                  <div className="rule"><span className="rule-n">3</span><span>تستطيع تمييز الأسئلة بعلامة <b>🚩</b> للرجوع إليها قبل تسليم القسم، وتوجد <b>شاشة مراجعة</b> قبل التسليم.</span></div>
                  <div className="rule"><span className="rule-n">4</span><span>تضاف أي أسئلة تخطئ فيها تلقائياً إلى <b>دفتر الأخطاء</b> لتتدرب عليها لاحقاً.</span></div>
                </div>

                <button type="button" className="start-cta" onClick={start}>
                  <I.Timer size={22} /> ابدأ الاختبار الآن
                </button>
              </div>

              {history.length > 0 && (
                <div className="card">
                  <h2 className="card-title mb16">محاولاتك السابقة وتطور النتيجة</h2>
                  {graphData.length > 1 && (
                    <div className="history-graph row g4 align-end mb24" style={{ height: 110, padding: 10, borderBottom: '1px solid var(--brd)' }}>
                      {graphData.map((h, k) => (
                        <div key={k} className="col center g4" style={{ flex: 1, minWidth: 30 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)' }}>{h.score}%</div>
                          <div style={{ width: '100%', maxWidth: 40, background: 'var(--coral)', borderRadius: '4px 4px 0 0', height: \`\${(h.score / 100) * 70}px\`, minHeight: 4 }} />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="col g8">
                    {history.slice(0, 5).map((h, k) => (
                      <div key={k} className="row between g12" style={{ padding: '11px 15px', borderRadius: 12, background: 'rgba(255,255,255,.03)', border: '1px solid var(--brd)' }}>
                        <span className="card-sub">{new Date(h.at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}</span>
                        <span className="card-sub nums">{h.correct}/{h.total} · {fmt(h.used)}</span>
                        <span className="nums" style={{ fontWeight: 800, fontSize: 15, color: h.score >= 70 ? 'var(--emerald)' : h.score >= 55 ? 'var(--amber)' : 'var(--rose)' }}>{h.score}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }

      /* ─── Review ─── */
      if (phase === 'review') {
        const isLastSec = secIdx === MOCK_SECTIONS.length - 1;
        return (
          <div>
            <div className="page-head">
              <h1 className="page-title">مراجعة قسم {MOCK_SEC_AR[secName]}</h1>
              <div className="page-sub">تأكد من الأسئلة المعلقة وغير المجابة قبل التسليم. الوقت ما زال يحسب.</div>
            </div>
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
              <div className="card mb20">
                <div className="col g8">
                  {secQs.map((q, j) => {
                    const aI = secStart + j;
                    const a = ans[aI];
                    const flg = flags[aI];
                    const st = a == null ? 'بدون إجابة' : 'مُجاب';
                    return (
                      <div key={j} className="row between g12" style={{ padding: '12px 16px', background: 'var(--bg)', borderRadius: 8, border: '1px solid ' + (flg ? 'var(--amber)' : 'var(--brd)') }}>
                        <div className="row g12 wrap">
                          <span style={{ fontWeight: 800, width: 24, textAlign: 'center' }} className="nums">{j + 1}</span>
                          <span className={"badge badge-" + (a == null ? 'rose' : 'emerald')}>{st}</span>
                          {flg && <span className="badge badge-amber"><I.Flag size={12} /> مُعلَّم</span>}
                        </div>
                        <button className="btn btn-sm btn-ghost" onClick={() => { setI(j); curIRef.current = aI; lastTRef.current = Date.now(); setPhase('running'); }}>الرجوع للسؤال</button>
                      </div>
                    )
                  })}
                </div>
                <div className="row g12 mt24" style={{ justifyContent: 'center' }}>
                  <button className="btn btn-primary" onClick={() => {
                    if (isLastSec) finishExam(qs, false);
                    else startSection(secIdx + 1, qs);
                  }}>
                    <I.Check size={16} /> {isLastSec ? 'تسليم الاختبار نهائياً' : 'تسليم والانتقال للقسم التالي'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      }

      /* ─── Report ─── */
      if (phase === 'done' && result) {
        const band = result.score >= 85 ? { t: 'ممتاز — جاهز للاختبار', c: 'emerald' }
          : result.score >= 70 ? { t: 'جيد جداً — ثبّت نقاط ضعفك', c: 'indigo' }
            : result.score >= 55 ? { t: 'جيد — يحتاج مراجعة مركّزة', c: 'amber' }
              : { t: 'يحتاج تدريباً مكثفاً', c: 'rose' };
        const blank = result.total - result.answered;
        const perQ = result.answered ? Math.round(result.used / result.answered) : 0;
        
        let totalM = 0;
        MOCK_SECTIONS.forEach(s => totalM += (MOCK_SEC_CFG[s]?.min || 20));

        return (
          <div>
            <div className="page-head">
              <h1 className="page-title">تقرير اختبار المحاكاة</h1>
              <div className="page-sub">{result.auto ? 'انتهى الوقت وتم التسليم تلقائياً' : 'تم التسليم يدوياً'}</div>
            </div>

            <div style={{ maxWidth: 780, margin: '0 auto' }}>
              <div className="score-hero">
                <div className="hero-label" style={{ color: 'var(--text-3)', justifyContent: 'center' }}>SIMULATED STEP SCORE</div>
                <div className="score-num">{result.score}<small> / 100</small></div>
                <div className="rtl" style={{ fontFamily: "'Cairo', sans-serif", fontSize: 19, fontWeight: 800, margin: '14px 0 8px', color: CVAR[band.c] }}>{band.t}</div>
                <div className="rtl nums" style={{ color: 'var(--text-2)', fontSize: 13.5 }}>
                  {result.correct} إجابة صحيحة من {result.total} · استغرقت {fmt(result.used)} من {fmt(totalM * 60)}
                </div>
              </div>

              <div className="grid-2 g16 mb24">
                <div className="card">
                  <h2 className="sec-head mb16"><span className="sec-bar" /> النتيجة حسب القسم</h2>
                  <div className="col g10">
                    {MOCK_SECTIONS.map(s => {
                      const b = result.bySec[s];
                      if (!b || b.total === 0) return null;
                      const p = Math.round(b.correct / b.total * 100);
                      return (
                        <div key={s} className="sec-row">
                          <span className="sec-name" style={{ color: CVAR[MOCK_SEC_C[s]] }}>{MOCK_SEC_AR[s]}</span>
                          <div className="track">
                            <div className="fill" style={{ width: p + '%', background: CVAR[MOCK_SEC_C[s]] }} />
                          </div>
                          <span className="sec-score nums" style={{ color: CVAR[MOCK_SEC_C[s]] }}>{b.correct}/{b.total}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="card">
                  <h2 className="sec-head mb16"><span className="sec-bar" /> تحليل المهارات الفرعية</h2>
                  <div className="col g10" style={{ maxHeight: 200, overflowY: 'auto', paddingRight: 5 }}>
                    {Object.keys(result.bySub || {}).sort((a,b) => result.bySub[a].correct/result.bySub[a].total - result.bySub[b].correct/result.bySub[b].total).map(sub => {
                       const b = result.bySub[sub];
                       if (!b || b.total === 0) return null;
                       const p = Math.round(b.correct / b.total * 100);
                       const color = p >= 70 ? 'var(--emerald)' : p >= 50 ? 'var(--amber)' : 'var(--rose)';
                       return (
                         <div key={sub} className="row between g12" style={{ fontSize: 12.5 }}>
                           <span style={{ color: 'var(--text-2)', flex: 1 }}>{sub}</span>
                           <div className="track grow" style={{ height: 6 }}><div className="fill" style={{ width: p+'%', background: color }}/></div>
                           <span className="nums" style={{ color, fontWeight: 700, width: 40, textAlign: 'left' }}>{p}%</span>
                         </div>
                       );
                    })}
                  </div>
                </div>
              </div>

              <div className="card mb24">
                <h2 className="sec-head mb16"><span className="sec-bar" /> أبطأ 5 أسئلة استغرقت وقتاً</h2>
                <div className="col g10">
                   {result.slowest && result.slowest.map((sl, k) => (
                     <div key={k} className="row between g12" style={{ padding: '12px 16px', background: 'rgba(255,255,255,.03)', borderRadius: 8, border: '1px solid var(--brd)' }}>
                        <div className="grow">
                           <div className="row g8 mb8">
                             <span className={"badge badge-"+MOCK_SEC_C[sl.q.sec]}>{sl.q.sec}</span>
                             <span className={"badge badge-"+(sl.ok ? "emerald" : "rose")}>{sl.ok ? "إجابة صحيحة" : "إجابة خاطئة"}</span>
                           </div>
                           <div style={{ fontSize: 13.5, fontWeight: 600 }}>{sl.q.q.substring(0, 80)}...</div>
                        </div>
                        <div className="col center g4">
                           <I.Clock size={16} color="var(--amber)" />
                           <span className="nums" style={{ color: 'var(--amber)', fontWeight: 800 }}>{Math.round(sl.tMs/1000)} ث</span>
                        </div>
                     </div>
                   ))}
                </div>
              </div>

              <h2 className="sec-head"><span className="sec-bar" /> تحليل إدارة الوقت</h2>
              <div className="grid-3 mb24">
                <div className="stat">
                  <div className="stat-glow" style={{ background: 'radial-gradient(circle, var(--indigo), transparent 70%)' }} />
                  <div className="stat-num nums" style={{ color: 'var(--indigo)' }}>{fmt(result.used)}</div>
                  <div className="stat-lbl">الوقت المستهلك الكلي</div>
                </div>
                <div className="stat">
                  <div className="stat-glow" style={{ background: 'radial-gradient(circle, var(--emerald), transparent 70%)' }} />
                  <div className="stat-num nums" style={{ color: 'var(--emerald)' }}>{perQ}<span style={{ fontSize: 16 }}>ث</span></div>
                  <div className="stat-lbl">متوسط الوقت لكل سؤال</div>
                </div>
                <div className="stat">
                  <div className="stat-glow" style={{ background: 'radial-gradient(circle, ' + (blank ? 'var(--rose)' : 'var(--emerald)') + ', transparent 70%)' }} />
                  <div className="stat-num nums" style={{ color: blank ? 'var(--rose)' : 'var(--emerald)' }}>{blank}</div>
                  <div className="stat-lbl">سؤال بدون إجابة</div>
                </div>
              </div>

              <div className={'explain ' + (blank > 0 || result.auto ? 'explain-bad' : 'explain-ok')} style={{ marginTop: 0 }}>
                {result.auto && blank > 0
                  ? 'انتهى الوقت قبل أن تكمل، وتُرك ' + blank + ' سؤال بدون إجابة. أسئلتك الخاطئة تمت إضافتها لدفتر الأخطاء.'
                  : blank > 0
                    ? 'سلّمت مبكراً وتركت ' + blank + ' سؤال فارغاً. أسئلتك الخاطئة في دفتر الأخطاء للتدريب.'
                    : 'أجبت على كل الأسئلة. تم ترحيل أي سؤال خاطئ لدفتر الأخطاء لتتدرّب عليه لاحقاً!'}
              </div>

              <div className="row g12 wrap mt20" style={{ justifyContent: 'center' }}>
                <button type="button" className="btn btn-primary" onClick={start}><I.Redo size={15} /> محاولة جديدة</button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowReview(v => !v)}>
                  <I.Eye size={15} /> {showReview ? 'إخفاء المراجعة' : 'مراجعة الإجابات'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => go('dashboard')}><I.Home size={15} /> لوحة التقدم</button>
              </div>

              {showReview && (
                <div className="col g10 mt20">
                  {qs.map((q, idx) => {
                    const a = ans[idx];
                    const ok = a != null && a === q.ans;
                    const st = a == null ? 'skip' : ok ? 'ok' : 'no';
                    return (
                      <div key={idx} className="review-row">
                        <span className={'review-n ' + st}>{idx + 1}</span>
                        <div className="grow">
                          <div className="row g8 mb8 wrap">
                            <span className={'badge badge-' + MOCK_SEC_C[q.sec]}>{MOCK_SEC_AR[q.sec]}</span>
                            <span className={'badge badge-' + (st === 'ok' ? 'emerald' : st === 'no' ? 'rose' : 'amber')}>
                              {st === 'ok' ? 'صحيح' : st === 'no' ? 'خطأ' : 'بدون إجابة'}
                            </span>
                            <span className="nums" style={{ fontSize: 11, color: 'var(--text-3)' }}>⏱️ {Math.round((times[idx]||0)/1000)} ث</span>
                          </div>
                          <div style={{ fontWeight: 700, marginBottom: 7 }}>{q.q}</div>
                          <div style={{ color: 'var(--emerald)', fontSize: 12.5, marginBottom: 3 }}>
                            الإجابة الصحيحة: {String.fromCharCode(65 + q.ans)} — {q.opts[q.ans]}
                          </div>
                          {a != null && !ok && (
                            <div style={{ color: 'var(--rose)', fontSize: 12.5, marginBottom: 3 }}>
                              إجابتك: {String.fromCharCode(65 + a)} — {q.opts[a]}
                            </div>
                          )}
                          <div className="rtl" style={{ color: 'var(--text-3)', fontSize: 12.5, lineHeight: 1.8, textAlign: 'left' }}>{q.exp}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      }

      /* ─── Running ─── */
      const q = secQs[i] || secQs[0];
      const chosen = ans[absI];
      
      const now = Date.now();
      const left = Math.max(0, Math.floor((endsAt - now) / 1000));
      const warn = left <= 300 && left > 60;
      const crit = left <= 60;

      return (
        <div>
          <div className="exam-bar">
            <ExamClock phase={phase} endsAt={endsAt} onExpire={() => expireRef.current(true)} />
            <div className="exam-meta">
              <span className="badge" style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--brd)' }}>{MOCK_SEC_AR[secName]}</span>
            </div>
            <div className="track grow" style={{ height: 7, minWidth: 90, maxWidth: 240 }}>
              <div className="fill" style={{ width: (secQs.length ? (i + 1) / secQs.length * 100 : 0) + '%', background: 'var(--grad-coral)', color: 'var(--coral)' }} />
            </div>
            <button type="button" className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={askSubmitSec}>
              <I.Check size={15} /> تسليم القسم
            </button>
          </div>

          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <div className="row between wrap g12 mb16">
              <div className="row g8 wrap">
                <span className={'badge badge-' + MOCK_SEC_C[secName]}>السؤال {i + 1} من {secQs.length}</span>
                <span className="card-sub nums" style={{ fontSize: 12 }}>رقم السؤال العام: {absI + 1} / {qs.length}</span>
              </div>
              <button type="button" className={'btn btn-sm ' + (flags[absI] ? 'btn-primary' : 'btn-ghost')}
                onClick={() => setFlags(f => ({ ...f, [absI]: !f[absI] }))}>
                <I.Flag size={14} /> {flags[absI] ? 'مُعلَّم للمراجعة' : 'علّم للمراجعة'}
              </button>
            </div>

            {q && q.ctx === 'reading' && (
              <div className="exam-ctx">
                <button type="button" className="exam-ctx-head" onClick={() => setOpenCtx(v => !v)}>
                  <I.Book size={15} /> <span className="grow">{PASSAGE.title}</span>
                  <span style={{ fontSize: 11.5 }}>{openCtx ? 'إخفاء النص' : 'عرض النص'}</span>
                </button>
                {openCtx && (
                  <div className="exam-ctx-body">
                    {PASSAGE.body.split('\\n\\n').map((p, k) => <p key={k}>{p}</p>)}
                  </div>
                )}
              </div>
            )}

            {q && q.ctx === 'listening' && (
              <div className="exam-ctx">
                <div className="exam-ctx-head" style={{ cursor: 'default' }}>
                  <I.Headphones size={15} /> <span className="grow">{LISTENING.title}</span>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={speakCtx}>
                    {tts ? <I.Pause size={13} /> : <I.Play size={13} />} {tts ? 'إيقاف' : 'استمع'}
                  </button>
                </div>
              </div>
            )}

            {q && (
              <div className="quiz-card">
                <div className="quiz-q">{q.q}</div>
                <div className="col g10">
                  {q.opts.map((o, oi) => (
                    <button type="button" key={oi} onClick={() => setAns(a => ({ ...a, [absI]: oi }))}
                      className={'opt' + (chosen === oi ? ' sel' : '')}>
                      <span className="opt-key">{String.fromCharCode(65 + oi)}</span>
                      <span className="grow">{o}</span>
                      {chosen === oi && <I.Check size={16} />}
                    </button>
                  ))}
                </div>
                {chosen != null && (
                  <button type="button" className="btn btn-ghost btn-sm mt16"
                    onClick={() => setAns(a => { const n = { ...a }; delete n[absI]; return n; })}>
                    <I.X size={13} /> إلغاء الاختيار
                  </button>
                )}
              </div>
            )}

            <div className="row between g12 mt16">
              <button type="button" className="btn btn-ghost btn-sm" disabled={i === 0} onClick={() => goQ(i - 1)}>← السابق</button>
              <ExamTimeLeft phase={phase} endsAt={endsAt} />
              <button type="button" className="btn btn-primary btn-sm" disabled={i >= secQs.length - 1} onClick={() => goQ(i + 1)}>التالي →</button>
            </div>

            <div className="card mt20">
              <div className="row between wrap g12 mb16">
                <div className="card-title" style={{ fontSize: 14 }}>خريطة أسئلة قسم {MOCK_SEC_AR[secName]}</div>
                <div className="row g12 wrap card-sub">
                  <span className="row g6"><i style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--indigo)', display: 'block' }} /> مُجاب</span>
                  <span className="row g6"><i style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--amber)', display: 'block' }} /> مُعلَّم</span>
                </div>
              </div>
              <div className="palette">
                {secQs.map((_, k) => {
                  const aI = secStart + k;
                  return (
                    <button type="button" key={k} onClick={() => goQ(k)} aria-label={'السؤال ' + (k + 1)}
                      className={'pal-btn' + (k === i ? ' at' : ans[aI] != null ? ' ans' : '') + (flags[aI] ? ' flag' : '')}>
                      {k + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      );
    }
`;

const newHtml = html.substring(0, startIdx) + newMockExam + '\n    ' + html.substring(endIdx);
fs.writeFileSync(htmlPath, newHtml);
console.log('MockExam component successfully replaced!');
