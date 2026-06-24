const GAME_SECONDS = 60;
const START_LIFE = 3;

const LEVELS = {
  basic: {
    name: '初級',
    scorePerCorrect: 60,
    streakStep: 6,
    generator: makeBasicProblem,
  },
  standard: {
    name: '中級',
    scorePerCorrect: 75,
    streakStep: 8,
    generator: makeStandardProblem,
  },
  advanced: {
    name: '上級',
    scorePerCorrect: 95,
    streakStep: 10,
    generator: makeAdvancedProblem,
  },
};

const maxScore = MathLabGame.getMaxScore(1000);
let selectedLevel = 'basic';
let currentLevel = LEVELS[selectedLevel];
let currentQuestion = null;
let questionNo = 0;
let correct = 0;
let wrong = 0;
let streak = 0;
let bestStreak = 0;
let life = START_LIFE;
let finalScore = 0;
let startedAt = 0;
let timerId = null;
let lastRunId = MathLabGame.createRunId();
let isPlaying = false;

const els = {
  setup: document.getElementById('setup'),
  playArea: document.getElementById('playArea'),
  resultPanel: document.getElementById('resultPanel'),
  score: document.getElementById('score'),
  timeLeft: document.getElementById('timeLeft'),
  life: document.getElementById('life'),
  correctCount: document.getElementById('correctCount'),
  questionNo: document.getElementById('questionNo'),
  questionLatex: document.getElementById('questionLatex'),
  templateLatex: document.getElementById('templateLatex'),
  progressFill: document.getElementById('progressFill'),
  form: document.getElementById('answerForm'),
  hInput: document.getElementById('hInput'),
  kInput: document.getElementById('kInput'),
  hLabel: document.getElementById('hLabel'),
  kLabel: document.getElementById('kLabel'),
  feedback: document.getElementById('feedback'),
  resultTitle: document.getElementById('resultTitle'),
  resultCorrect: document.getElementById('resultCorrect'),
  resultScore: document.getElementById('resultScore'),
  resultLife: document.getElementById('resultLife'),
};

document.querySelectorAll('.level-card').forEach((button) => {
  button.addEventListener('click', () => {
    selectedLevel = button.dataset.level;
    currentLevel = LEVELS[selectedLevel];
    document.querySelectorAll('.level-card').forEach((item) => item.classList.toggle('active', item === button));
  });
});

document.getElementById('startGame').addEventListener('click', start);
document.getElementById('retry').addEventListener('click', start);
document.getElementById('submitResult').addEventListener('click', () => {
  MathLabGame.submitResult({
    score: finalScore,
    maxScore,
    clear: correct >= 6,
    durationSec: MathLabGame.getDurationSec(),
    runId: lastRunId,
  });
});

els.form.addEventListener('submit', (event) => {
  event.preventDefault();
  judge();
});

function start() {
  currentLevel = LEVELS[selectedLevel];
  questionNo = 0;
  correct = 0;
  wrong = 0;
  streak = 0;
  bestStreak = 0;
  life = START_LIFE;
  finalScore = 0;
  startedAt = Date.now();
  lastRunId = MathLabGame.createRunId();
  isPlaying = true;
  els.setup.classList.add('hidden');
  els.resultPanel.classList.add('hidden');
  els.playArea.classList.remove('hidden');
  window.clearInterval(timerId);
  timerId = window.setInterval(tick, 250);
  updateStats();
  renderQuestion();
  tick();
}

function tick() {
  if (!isPlaying) return;
  const elapsed = Math.floor((Date.now() - startedAt) / 1000);
  const remaining = Math.max(0, GAME_SECONDS - elapsed);
  els.timeLeft.textContent = remaining;
  els.progressFill.style.width = `${Math.round((remaining / GAME_SECONDS) * 100)}%`;
  if (remaining <= 0) finish('時間切れ');
}

function judge() {
  if (!isPlaying || !currentQuestion) return;
  const hAnswer = normalizeAnswer(els.hInput.value);
  const kAnswer = normalizeAnswer(els.kInput.value);
  const hCorrect = hAnswer === normalizeAnswer(currentQuestion.hAnswer);
  const kCorrect = kAnswer === normalizeAnswer(currentQuestion.kAnswer);
  const isCorrect = hCorrect && kCorrect;

  els.feedback.className = `feedback ${isCorrect ? 'correct' : 'wrong'}`;
  if (isCorrect) {
    correct += 1;
    streak += 1;
    bestStreak = Math.max(bestStreak, streak);
    els.feedback.textContent = `正解。${currentQuestion.explain}`;
    updateStats();
    window.setTimeout(renderQuestion, 450);
    return;
  }

  wrong += 1;
  life -= 1;
  streak = 0;
  els.feedback.textContent = `ミス。正解は ${currentQuestion.hAnswer}, ${currentQuestion.kAnswer} です。${currentQuestion.explain}`;
  updateStats();
  if (life <= 0) {
    window.setTimeout(() => finish('体力切れ'), 900);
    return;
  }
  window.setTimeout(renderQuestion, 900);
}

function renderQuestion() {
  if (!isPlaying) return;
  currentQuestion = currentLevel.generator();
  questionNo += 1;
  els.questionNo.textContent = questionNo;
  els.questionLatex.textContent = `\\(${currentQuestion.expressionLatex}\\)`;
  els.templateLatex.textContent = `\\(${currentQuestion.templateLatex}\\)`;
  els.hLabel.textContent = currentQuestion.hLabel;
  els.kLabel.textContent = currentQuestion.kLabel;
  els.hInput.value = '';
  els.kInput.value = '';
  els.feedback.className = 'feedback';
  els.feedback.textContent = '2つの空欄に入る数を入力してください。';
  typesetMath();
  els.hInput.focus();
}

function updateStats() {
  const base = correct * currentLevel.scorePerCorrect;
  const streakBonus = Math.min(180, bestStreak * currentLevel.streakStep);
  const lifeBonus = life * 20;
  finalScore = MathLabGame.clampScore(base + streakBonus + lifeBonus, maxScore);
  els.score.textContent = finalScore;
  els.life.textContent = '♥'.repeat(Math.max(0, life)) || '0';
  els.correctCount.textContent = correct;
}

function finish(reason) {
  if (!isPlaying) return;
  isPlaying = false;
  window.clearInterval(timerId);
  updateStats();
  els.playArea.classList.add('hidden');
  els.resultPanel.classList.remove('hidden');
  els.resultTitle.textContent = reason;
  els.resultCorrect.textContent = correct;
  els.resultScore.textContent = finalScore;
  els.resultLife.textContent = life;
}

function makeBasicProblem() {
  return Math.random() < 0.55 ? makeBasicIntegerProblem() : makeBasicFractionProblem();
}

function makeStandardProblem() {
  return Math.random() < 0.45 ? makeBasicProblem() : makeFactoredIntegerProblem();
}

function makeAdvancedProblem() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const a = randomChoice([2, 3, 4, -2, -3]);
    const b = randomNonZero(-12, 12);
    const c = randomInt(-10, 10);
    const question = buildLeadingProblem(a, b, c);
    if (isFriendlyFraction(question.hValue, 7, 4) && isFriendlyFraction(question.kValue, 18, 4)) {
      return question;
    }
  }
  return makeFactoredIntegerProblem();
}

function makeBasicIntegerProblem() {
  const h = randomNonZero(-7, 7);
  const k = randomInt(-12, 12);
  return buildMonicProblem(h, k);
}

function makeBasicFractionProblem() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const b = randomOdd(-9, 9);
    const c = randomInt(-8, 10);
    const h = fraction(b, 2);
    const k = subtract(fraction(c, 1), multiply(h, h));
    const question = buildMonicProblem(h, k);
    if (isFriendlyFraction(question.hValue, 7, 2) && isFriendlyFraction(question.kValue, 18, 4)) {
      return question;
    }
  }
  return makeBasicIntegerProblem();
}

function makeFactoredIntegerProblem() {
  const a = randomChoice([2, 3, 4, -2]);
  const h = randomNonZero(-5, 5);
  const k = randomInt(-14, 14);
  const b = 2 * a * h;
  const c = a * h * h + k;
  return buildLeadingProblem(a, b, c);
}

function buildMonicProblem(h, k) {
  const b = multiply(fraction(2, 1), toFraction(h));
  const c = add(multiply(toFraction(h), toFraction(h)), toFraction(k));
  return {
    expressionLatex: `x^2${latexRationalTerm(b, 'x')}${latexRationalNumber(c)}`,
    templateLatex: `x^2${latexRationalTerm(b, 'x')}${latexRationalNumber(c)}=(x+\\square)^2+\\square`,
    hLabel: 'x の中',
    kLabel: '外の数',
    hValue: toFraction(h),
    kValue: toFraction(k),
    hAnswer: formatValue(h),
    kAnswer: formatValue(k),
    explain: `x の中は ${formatValue(h)}、外の数は ${formatValue(k)} です。`,
  };
}

function buildLeadingProblem(a, b, c) {
  const h = reduce(b, 2 * a);
  const k = subtract(fraction(c, 1), multiply(fraction(a, 1), multiply(h, h)));
  return {
    expressionLatex: `${latexTerm(a, 'x^2', true)}${latexTerm(b, 'x')}${latexNumber(c)}`,
    templateLatex: `${latexTerm(a, 'x^2', true)}${latexTerm(b, 'x')}${latexNumber(c)}=${latexCoeff(a)}(x+\\square)^2+\\square`,
    hLabel: 'x の中',
    kLabel: '外の数',
    hValue: h,
    kValue: k,
    hAnswer: formatValue(h),
    kAnswer: formatValue(k),
    explain: `${latexCoeff(a)}(x${signedPlain(h)})^2${signedPlain(k)} の形です。`,
  };
}

function isFriendlyFraction(value, maxNumerator, maxDenominator) {
  const f = toFraction(value);
  return Math.abs(f.n) <= maxNumerator && f.d <= maxDenominator;
}

function normalizeAnswer(value) {
  return String(value || '')
    .trim()
    .replace(/[ \t\r\n\u3000]/g, '')
    .replace(/[＋]/g, '+')
    .replace(/[−ー－]/g, '-')
    .replace(/^\+/, '');
}

function typesetMath() {
  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise([els.questionLatex, els.templateLatex]);
  }
}

function toFraction(value) {
  if (typeof value === 'object') return reduce(value.n, value.d);
  return reduce(value, 1);
}

function fraction(n, d) {
  return reduce(n, d);
}

function add(a, b) {
  const left = toFraction(a);
  const right = toFraction(b);
  return reduce(left.n * right.d + right.n * left.d, left.d * right.d);
}

function subtract(a, b) {
  const right = toFraction(b);
  return add(a, { n: -right.n, d: right.d });
}

function multiply(a, b) {
  const left = toFraction(a);
  const right = toFraction(b);
  return reduce(left.n * right.n, left.d * right.d);
}

function reduce(n, d) {
  if (d < 0) {
    n *= -1;
    d *= -1;
  }
  const g = gcd(Math.abs(n), Math.abs(d));
  return { n: n / g, d: d / g };
}

function gcd(a, b) {
  while (b) {
    const next = a % b;
    a = b;
    b = next;
  }
  return a || 1;
}

function formatValue(value) {
  const f = toFraction(value);
  if (f.d === 1) return String(f.n);
  return `${f.n}/${f.d}`;
}

function signedPlain(value) {
  const text = formatValue(value);
  return text.startsWith('-') ? text : `+${text}`;
}

function latexNumber(value) {
  return value < 0 ? `${value}` : `+${value}`;
}

function latexRationalNumber(value) {
  const f = toFraction(value);
  const text = f.d === 1 ? String(Math.abs(f.n)) : `\\frac{${Math.abs(f.n)}}{${f.d}}`;
  return f.n < 0 ? `-${text}` : `+${text}`;
}

function latexRationalTerm(value, variable) {
  const f = toFraction(value);
  if (f.n === 0) return '';
  const sign = f.n < 0 ? '-' : '+';
  const abs = Math.abs(f.n);
  const coeff = f.d === 1 ? (abs === 1 ? '' : String(abs)) : `\\frac{${abs}}{${f.d}}`;
  return `${sign}${coeff}${variable}`;
}

function latexTerm(coefficient, variable, first = false) {
  if (coefficient === 0) return '';
  const sign = coefficient < 0 ? '-' : first ? '' : '+';
  const abs = Math.abs(coefficient);
  const coeff = abs === 1 ? '' : String(abs);
  return `${sign}${coeff}${variable}`;
}

function latexCoeff(value) {
  if (value === 1) return '';
  if (value === -1) return '-';
  return String(value);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomNonZero(min, max) {
  let value = 0;
  while (value === 0) value = randomInt(min, max);
  return value;
}

function randomOdd(min, max) {
  let value = 0;
  while (value === 0 || value % 2 === 0) value = randomInt(min, max);
  return value;
}

function randomChoice(items) {
  return items[Math.floor(Math.random() * items.length)];
}
