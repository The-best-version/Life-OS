const DURATIONS = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
const LABELS = { focus: 'تركيز', short: 'استراحة قصيرة', long: 'استراحة طويلة' };
const RING_LENGTH = 678.58;
const STORE_KEY = 'focusflow.v1';

const state = loadState();
let mode = 'focus';
let remaining = DURATIONS[mode];
let endsAt = null;
let ticker = null;

const el = {
  time: document.getElementById('timeDisplay'),
  ring: document.getElementById('ringProgress'),
  activeTask: document.getElementById('activeTaskLabel'),
  start: document.getElementById('startBtn'),
  reset: document.getElementById('resetBtn'),
  skip: document.getElementById('skipBtn'),
  modes: document.querySelectorAll('.mode'),
  taskForm: document.getElementById('taskForm'),
  taskInput: document.getElementById('taskInput'),
  taskList: document.getElementById('taskList'),
  taskEmpty: document.getElementById('taskEmpty'),
  todaySessions: document.getElementById('todaySessions'),
  todayMinutes: document.getElementById('todayMinutes'),
  sparkline: document.getElementById('sparkline'),
  history: document.getElementById('history'),
  historyEmpty: document.getElementById('historyEmpty'),
  streakCount: document.getElementById('streakCount'),
  streakLabel: document.getElementById('streakLabel'),
  toast: document.getElementById('toast'),
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        tasks: parsed.tasks || [],
        sessions: parsed.sessions || [],
        selectedTaskId: parsed.selectedTaskId || null,
        focusCount: parsed.focusCount || 0,
      };
    }
  } catch (e) {
    console.warn('تعذّرت قراءة البيانات المحفوظة، سنبدأ من جديد.', e);
  }
  return { tasks: [], sessions: [], selectedTaskId: null, focusCount: 0 };
}

function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('تعذّر حفظ البيانات.', e);
  }
}

const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const selectedTask = () => state.tasks.find((t) => t.id === state.selectedTaskId) || null;

function newId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function arabicPlural(n, forms) {
  if (n === 0) return forms.few;
  if (n === 1) return forms.one;
  if (n === 2) return forms.two;
  if (n >= 3 && n <= 10) return forms.few;
  return forms.many;
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatClock(ts) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function toast(message) {
  el.toast.textContent = message;
  el.toast.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.toast.classList.remove('show'), 2600);
}

function chime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      const at = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.25, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + 0.55);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch (e) {
    // الصوت تحسين اختياري، ولا يجوز أن يعطّل المؤقت إن مُنع تشغيله.
  }
}

function renderTimer() {
  el.time.textContent = formatTime(remaining);
  const fraction = remaining / DURATIONS[mode];
  el.ring.style.strokeDashoffset = String(RING_LENGTH * (1 - fraction));
  el.start.textContent = endsAt ? 'إيقاف مؤقت' : (remaining === DURATIONS[mode] ? 'ابدأ' : 'استئناف');
  document.title = endsAt ? `${formatTime(remaining)} - ${LABELS[mode]}` : 'تدفّق التركيز';

  const task = selectedTask();
  el.activeTask.textContent = mode === 'focus'
    ? (task ? task.name : 'لم تُحدَّد مهمة')
    : 'ابتعد قليلًا عن الشاشة';
}

function setMode(next, { silent = false } = {}) {
  stop();
  mode = next;
  remaining = DURATIONS[mode];
  document.body.className = `mode-${mode}`;
  el.modes.forEach((b) => {
    const on = b.dataset.mode === mode;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', String(on));
  });
  renderTimer();
  if (!silent) toast(`${LABELS[mode]} - ${DURATIONS[mode] / 60} دقيقة`);
}

function tick() {
  remaining = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
  renderTimer();
  if (remaining === 0) complete();
}

function start() {
  if (endsAt) return;
  endsAt = Date.now() + remaining * 1000;
  ticker = setInterval(tick, 250);
  renderTimer();
}

function stop() {
  if (ticker) clearInterval(ticker);
  ticker = null;
  endsAt = null;
  renderTimer();
}

function reset() {
  stop();
  remaining = DURATIONS[mode];
  renderTimer();
}

function complete() {
  stop();
  chime();
  const finished = mode;

  if (finished === 'focus') {
    const task = selectedTask();
    state.focusCount += 1;
    state.sessions.push({
      at: Date.now(),
      minutes: DURATIONS.focus / 60,
      task: task ? task.name : 'جلسة بلا مهمة محددة',
    });
    if (task) task.poms = (task.poms || 0) + 1;
    save();
    renderTasks();
    renderStats();
  }

  const next = finished === 'focus'
    ? (state.focusCount % 4 === 0 ? 'long' : 'short')
    : 'focus';
  setMode(next, { silent: true });
  toast(finished === 'focus' ? `أحسنت، اكتملت الجلسة. التالي: ${LABELS[next]}.` : 'انتهت الاستراحة، لنعد إلى العمل.');
}

function skip() {
  stop();
  const next = mode === 'focus' ? 'short' : 'focus';
  setMode(next);
}

function renderTasks() {
  el.taskList.innerHTML = '';
  el.taskEmpty.hidden = state.tasks.length > 0;

  state.tasks.forEach((task) => {
    const li = document.createElement('li');
    li.className = 'task';
    if (task.id === state.selectedTaskId) li.classList.add('selected');
    if (task.done) li.classList.add('done');

    const check = document.createElement('button');
    check.className = 'task-check';
    check.title = task.done ? 'إلغاء تعليم الإنجاز' : 'تعليم المهمة كمنجزة';
    check.textContent = task.done ? '✓' : '';
    check.addEventListener('click', (e) => {
      e.stopPropagation();
      task.done = !task.done;
      save();
      renderTasks();
    });

    const name = document.createElement('span');
    name.className = 'task-name';
    name.textContent = task.name;

    const poms = document.createElement('span');
    poms.className = 'task-poms';
    poms.textContent = task.poms ? `${task.poms} ×` : '';
    if (task.poms) {
      poms.title = `${task.poms} ${arabicPlural(task.poms, { one: 'جلسة', two: 'جلستان', few: 'جلسات', many: 'جلسة' })}`;
    }

    const del = document.createElement('button');
    del.className = 'task-del';
    del.title = 'حذف المهمة';
    del.textContent = '×';
    del.addEventListener('click', (e) => {
      e.stopPropagation();
      state.tasks = state.tasks.filter((t) => t.id !== task.id);
      if (state.selectedTaskId === task.id) state.selectedTaskId = null;
      save();
      renderTasks();
      renderTimer();
    });

    li.addEventListener('click', () => {
      state.selectedTaskId = state.selectedTaskId === task.id ? null : task.id;
      save();
      renderTasks();
      renderTimer();
    });

    li.append(check, name, poms, del);
    el.taskList.appendChild(li);
  });
}

function renderStats() {
  const today = dayKey(new Date());
  const todays = state.sessions.filter((s) => dayKey(new Date(s.at)) === today);
  el.todaySessions.textContent = String(todays.length);
  el.todayMinutes.textContent = String(todays.reduce((sum, s) => sum + s.minutes, 0));

  const byDay = new Map();
  state.sessions.forEach((s) => {
    const key = dayKey(new Date(s.at));
    byDay.set(key, (byDay.get(key) || 0) + 1);
  });

  el.sparkline.innerHTML = '';
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({ date: d, count: byDay.get(dayKey(d)) || 0 });
  }
  const peak = Math.max(1, ...days.map((d) => d.count));
  days.forEach(({ date, count }) => {
    const col = document.createElement('div');
    col.className = 'spark-col';
    const bar = document.createElement('div');
    bar.className = count ? 'spark-bar' : 'spark-bar zero';
    bar.style.height = `${Math.max(3, (count / peak) * 48)}px`;
    bar.title = `${count} ${arabicPlural(count, { one: 'جلسة', two: 'جلستان', few: 'جلسات', many: 'جلسة' })}`;
    const label = document.createElement('div');
    label.className = 'spark-day';
    label.textContent = date.toLocaleDateString('ar', { weekday: 'narrow' });
    col.append(bar, label);
    el.sparkline.appendChild(col);
  });

  let streak = 0;
  const cursor = new Date();
  if (!byDay.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (byDay.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  el.streakCount.textContent = String(streak);
  el.streakLabel.textContent = arabicPlural(streak, {
    one: 'يوم متتالٍ', two: 'يومان متتاليان', few: 'أيام متتالية', many: 'يومًا متتاليًا',
  });

  el.history.innerHTML = '';
  el.historyEmpty.hidden = state.sessions.length > 0;
  state.sessions.slice(-20).reverse().forEach((s) => {
    const li = document.createElement('li');
    const time = document.createElement('span');
    time.className = 'hist-time';
    time.dir = 'ltr';
    time.textContent = formatClock(s.at);
    const name = document.createElement('span');
    name.className = 'hist-name';
    name.textContent = s.task;
    const len = document.createElement('span');
    len.className = 'hist-len';
    len.textContent = `${s.minutes} د`;
    li.append(time, name, len);
    el.history.appendChild(li);
  });
}

el.start.addEventListener('click', () => (endsAt ? stop() : start()));
el.reset.addEventListener('click', reset);
el.skip.addEventListener('click', skip);
el.modes.forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));

el.taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = el.taskInput.value.trim();
  if (!name) return;
  const task = { id: newId(), name, done: false, poms: 0 };
  state.tasks.push(task);
  if (!state.selectedTaskId) state.selectedTaskId = task.id;
  el.taskInput.value = '';
  save();
  renderTasks();
  renderTimer();
});

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  const key = e.key.toLowerCase();
  if (e.code === 'Space') { e.preventDefault(); endsAt ? stop() : start(); }
  else if (key === 'r' || key === 'ق') reset();
  else if (key === 's' || key === 'س') skip();
});

setMode('focus', { silent: true });
renderTasks();
renderStats();
