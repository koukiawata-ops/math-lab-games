(function () {
  const params = new URLSearchParams(window.location.search);
  const startedAt = Date.now();

  function getParam(name, fallback) {
    const value = params.get(name);
    return value === null || value === '' ? fallback : value;
  }

  function getMaxScore(fallback) {
    const value = Number(getParam('max_score', fallback || 1000));
    return Number.isFinite(value) && value > 0 ? value : fallback || 1000;
  }

  function getDurationSec() {
    return Math.max(1, Math.round((Date.now() - startedAt) / 1000));
  }

  function createRunId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function clampScore(score, maxScore) {
    const n = Number(score);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(Math.round(n), maxScore));
  }

  function submitResult(result) {
    const returnUrl = getParam('return_url', '');
    if (!returnUrl) {
      alert('このゲームはMath Labポータルから起動してください。');
      return;
    }

    const maxScore = getMaxScore(result.maxScore || 1000);
    const score = clampScore(result.score, maxScore);
    const url = new URL(returnUrl);
    url.searchParams.set('action', 'submit');
    url.searchParams.set('game_id', getParam('game_id', result.gameId || ''));
    url.searchParams.set('token', getParam('token', ''));
    url.searchParams.set('score', String(score));
    url.searchParams.set('max_score', String(maxScore));
    url.searchParams.set('clear', result.clear ? 'true' : 'false');
    url.searchParams.set('duration_sec', String(result.durationSec || getDurationSec()));
    url.searchParams.set('run_id', result.runId || createRunId());
    window.location.href = url.toString();
  }

  window.MathLabGame = {
    params,
    getParam,
    getMaxScore,
    getDurationSec,
    createRunId,
    clampScore,
    submitResult,
  };
})();
