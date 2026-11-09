(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const STEPS = [
    { label: 'Ready', note: 'Fit, seal, volume and a quiet room are confirmed before any measurement.' },
    { label: 'Connection', note: 'The route and input rate are checked before the test.' },
    { label: 'Ear check', note: 'A left-only ping catches swapped earbuds; no microphone is used.' },
    { label: 'Microphone', note: 'The Settings path is inline; a scratch confirms the active microphone.' },
    { label: 'Measure', note: 'Both earbuds stay in; one microphone measures at a time.' },
    { label: 'Result', note: 'A categorical verdict first, then the measured evidence.' },
    { label: 'Clean and retest', note: 'Clean only the suspect ear, dry for two hours, then compare.' }
  ];
  const DOCK = ['4 checks', 'Route and rate', 'Playback only', 'Settings + scratch', 'One mic at a time', 'Measured evidence', '2-hour dry'];

  const readPref = (key, fallback) => {
    try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
  };
  const writePref = (key, value) => {
    try { localStorage.setItem(key, value); } catch { /* private mode */ }
  };

  const initialState = () => ({
    step: 0,
    ready: { inEars: false, fit: false, quiet: false, volume: false, skipped: false },
    ear: { played: false, choice: null, skipped: false },
    mic: { confirmed: false, skipped: false, busy: false, pathDone: false },
    measure: { side: 'left', phase: 0, captured: [false, false], done: false, busy: false, switching: false },
    recovery: { started: false, ready: false, finished: false },
    scenario: 'happy',
    variant: readPref('sc.variant', 'graphite'),
    motion: readPref('sc.motion', 'system'),
    walking: false
  });

  let state = initialState();
  let walkToken = 0;
  let accent = '#0A84FF';
  let spectrumPct = 6;
  const timers = {
    count: null, listen: null, hold: null, confirm: null,
    ping: null, scratch: null, scratchEnd: null, save: null
  };

  const els = {
    html: document.documentElement,
    meta: $('meta[name="theme-color"]'),
    appStep: $('#appStep'),
    progress: $$('#progress .seg'),
    chapters: $$('[data-step-choice]'),
    railNote: $('#railNote'),
    back: $('#back'),
    next: $('#next'),
    dockNote: $('#dockNote'),
    announcer: $('#announcer'),
    app: $('#app'),
    scene: (n) => $(`.scene[data-step="${n}"]`),
    measureScene: $('.measure-scene'),
    routeDot: $('#routeDot'),
    routeTitle: $('#routeTitle'),
    routeChip: $('#routeChip'),
    routePerm: $('#routePerm'),
    routeName: $('#routeName'),
    routeRate: $('#routeRate'),
    routeDevice: $('#routeDevice'),
    connectionLede: $('#connectionLede'),
    routeWarning: $('#routeWarning'),
    reconnect: $('#reconnect'),
    playPing: $('#playPing'),
    earStage: $('#earStage'),
    earChoices: $('#earChoices'),
    earFeedback: $('#earFeedback'),
    skipEar: $('#skipEar'),
    pathPanel: $('#pathPanel'),
    scratchPanel: $('#scratchPanel'),
    pathDone: $('#pathDone'),
    scratchBtn: $('#scratchBtn'),
    scratchFeedback: $('#scratchFeedback'),
    miniWave: $$('#miniWave span'),
    skipMic: $('#skipMic'),
    leftTile: $('#leftTile'),
    rightTile: $('#rightTile'),
    holdBtn: $('#holdBtn'),
    seeResult: $('#seeResult'),
    measureError: $('#measureError'),
    retryHold: $('#retryHold'),
    goodSignal: $('#goodSignal'),
    switchPanel: $('#switchPanel'),
    confirmRight: $('#confirmRight'),
    rightFeedback: $('#rightFeedback'),
    ringLive: $('.ring-live'),
    ringLabel: $('#ringLabel'),
    dbValue: $('#dbValue'),
    phaseChip: $('#phaseChip'),
    prompt: $('#prompt'),
    hint: $('#hint'),
    sideRead: $('#sideRead'),
    spectrum: $('#spectrum'),
    testAgain: $('#testAgain'),
    saveResult: $('#saveResult'),
    saveNote: $('#saveNote'),
    startTimer: $('#startTimer'),
    demoUnlock: $('#demoUnlock'),
    retest: $('#retest'),
    timerValue: $('#timerValue'),
    timerFill: $('#timerFill'),
    timerPanel: $('#timerPanel'),
    finish: $('#finish'),
    startOver: $('#startOver'),
    skipSetup: $('#skipSetup'),
    skipSetupConfirm: $('#skipSetupConfirm'),
    skipSetupYes: $('#skipSetupYes'),
    skipSetupNo: $('#skipSetupNo'),
    setupSkipped: $('#setupSkipped'),
    openStudio: $('#openStudio'),
    closeStudio: $('#closeStudio'),
    sheet: $('#studioSheet'),
    walkBanner: $('#walkBanner'),
    walkFill: $('#walkFill')
  };

  const ctx = els.spectrum.getContext('2d');
  const CIRC = 2 * Math.PI * 100;

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const isReduced = () => state.motion === 'reduced' || (state.motion === 'system' && matchMedia('(prefers-reduced-motion: reduce)').matches);

  function accentColor() {
    const value = getComputedStyle(els.html).getPropertyValue('--accent').trim();
    return value || '#0A84FF';
  }

  function canNext() {
    switch (state.step) {
      case 0: return state.ready.skipped || ['inEars', 'fit', 'quiet', 'volume'].every(key => state.ready[key]);
      case 1: return state.scenario !== 'route';
      case 2: return state.ear.choice === 'left' || state.ear.skipped;
      case 3: return state.mic.confirmed || state.mic.skipped;
      case 4: return false;
      case 5: return true;
      case 6: return !state.recovery.finished;
      default: return false;
    }
  }

  function syncControls() {
    $$('[data-variant-choice]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.variantChoice === state.variant)));
    $$('[data-motion-choice]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.motionChoice === state.motion)));
    $$('select[data-simulate]').forEach(s => { s.value = state.scenario; });
    $$('[data-action="walkthrough"]').forEach(b => {
      const label = b.querySelector('span:not(.mono)');
      const use = b.querySelector('use');
      if (label) label.textContent = state.walking ? 'Stop walkthrough' : 'Play walkthrough';
      if (use) use.setAttribute('href', state.walking ? '#i-stop' : '#i-play');
    });
  }

  function syncReady() {
    $$('.check-item').forEach(b => b.setAttribute('aria-pressed', String(!!state.ready[b.dataset.check])));
    els.setupSkipped.hidden = !state.ready.skipped;
  }

  function syncEar() {
    els.earChoices.hidden = !state.ear.played;
    $$('.choices button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ear === state.ear.choice)));
  }

  function syncMic() {
    els.pathPanel.hidden = state.mic.pathDone;
    els.scratchPanel.hidden = !state.mic.pathDone;
    els.scratchBtn.disabled = state.mic.busy;
  }

  function syncRecovery() {
    const r = state.recovery;
    els.timerValue.textContent = r.ready ? 'Ready' : r.started ? '1:59:59' : '2:00:00';
    els.timerFill.style.width = r.ready ? '100%' : r.started ? '6%' : '0%';
    els.startTimer.hidden = r.started;
    els.startTimer.disabled = r.started;
    els.startTimer.textContent = 'Start 2-hour timer';
    els.demoUnlock.hidden = !r.started || r.ready;
    els.retest.hidden = !r.ready;
    els.finish.hidden = !r.finished;
  }

  function sync() {
    els.html.dataset.variant = state.variant;
    els.html.dataset.motion = state.motion;
    if (els.meta) els.meta.setAttribute('content', state.variant === 'porcelain' ? '#F5F1E8' : '#070709');

    $$('.scene').forEach((scene, i) => scene.classList.toggle('active', i === state.step));
    els.progress.forEach((seg, i) => {
      seg.classList.toggle('active', i === state.step);
      seg.classList.toggle('done', i < state.step);
    });
    els.chapters.forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.stepChoice) === state.step)));
    els.appStep.textContent = `${state.step + 1} / 7`;
    els.railNote.textContent = STEPS[state.step].note;
    els.dockNote.hidden = state.step === 5;
    els.dockNote.textContent = DOCK[state.step];
    els.back.disabled = state.step === 0;
    els.next.hidden = state.step === 4;
    els.next.disabled = !canNext();
    els.next.textContent = state.step === 5 ? 'Clean the right mesh' : state.step === 6 ? 'Done' : 'Continue';

    syncReady();
    syncEar();
    syncMic();
    syncRecovery();
    syncControls();
  }

  function go(step, opts = {}) {
    const nextStep = clamp(step, 0, 6);
    if (state.step === 4 && nextStep !== 4) cancelMeasure();
    state.step = nextStep;
    sync();
    if (nextStep === 1) renderRoute();
    if (nextStep === 4) renderMeasure();
    const scene = els.scene(nextStep);
    if (scene) scene.scrollTop = 0;
    if (opts.focus !== false) {
      const h = scene && scene.querySelector('h1');
      if (h) setTimeout(() => h.focus({ preventScroll: true }), 70);
    }
    els.announcer.textContent = `Step ${nextStep + 1} of 7. ${STEPS[nextStep].label}.`;
  }

  function renderRoute() {
    const bad = state.scenario === 'route';
    els.routeDot.className = `status-dot ${bad ? 'warn' : 'good'}`;
    els.routeTitle.textContent = bad ? 'iPhone microphone' : 'AirPods Pro · Connected';
    els.routeChip.textContent = bad ? 'Built-in' : 'HFP';
    els.routeChip.className = `chip ${bad ? 'warn' : 'good'}`;
    els.routePerm.textContent = 'Granted';
    els.routeName.textContent = bad ? 'Built-in Mic' : 'Bluetooth HFP';
    els.routeRate.textContent = '48 kHz';
    els.routeDevice.textContent = bad ? 'iPhone' : 'AirPods Pro';
    if (els.connectionLede) {
      els.connectionLede.textContent = bad
        ? 'iOS is using the iPhone microphone. Reconnect the AirPods to run the check.'
        : 'iOS is using your AirPods. The input rate is reported by the audio engine.';
    }
    els.routeWarning.hidden = !bad;
  }

  function setReady(key, value) {
    if (!(key in state.ready)) return;
    state.ready[key] = Boolean(value);
    sync();
  }

  function toggleReady(key) {
    setReady(key, !state.ready[key]);
  }

  function playPing() {
    state.ear.played = true;
    state.ear.choice = null;
    state.ear.skipped = false;
    els.earChoices.hidden = true;
    els.earFeedback.textContent = '';
    els.earFeedback.className = 'feedback';
    $$('.choices button').forEach(b => b.setAttribute('aria-pressed', 'false'));
    els.earStage.classList.remove('ping');
    void els.earStage.offsetWidth;
    els.earStage.classList.add('ping');
    els.playPing.disabled = true;
    clearTimeout(timers.ping);
    timers.ping = setTimeout(() => {
      els.earStage.classList.remove('ping');
      els.playPing.disabled = false;
      els.earChoices.hidden = false;
      sync();
    }, 1200);
    sync();
  }

  function selectEar(value) {
    if (!state.ear.played) return;
    state.ear.choice = value;
    state.ear.skipped = false;
    $$('.choices button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ear === value)));
    const fb = els.earFeedback;
    if (value === 'left') {
      fb.className = 'feedback success';
      fb.textContent = 'Left earbud confirmed.';
    } else if (value === 'right') {
      fb.className = 'feedback warning';
      fb.textContent = 'The earbuds are swapped. Swap them, then play the left ping again.';
    } else if (value === 'both') {
      fb.className = 'feedback warning';
      fb.textContent = 'You heard it in both ears. Check the fit and connection, then try again.';
    } else {
      fb.className = 'feedback warning';
      fb.textContent = 'No tone. Check the connection, then try again.';
    }
    sync();
  }

  function pathDone() {
    if (state.mic.pathDone) return;
    state.mic.pathDone = true;
    sync();
    setTimeout(() => els.scratchBtn.focus(), 50);
  }

  function startScratch() {
    if (state.mic.busy) return;
    state.mic.busy = true;
    els.scratchBtn.disabled = true;
    els.scratchPanel.classList.add('scratching');
    const fb = els.scratchFeedback;
    fb.className = 'feedback';
    fb.textContent = 'Listening for the scratch…';
    let n = 0;
    clearInterval(timers.scratch);
    timers.scratch = setInterval(() => {
      els.miniWave.forEach((bar, i) => {
        const h = i === 5 + (n % 2) ? 62 + Math.random() * 32 : 5 + Math.random() * 11;
        bar.style.height = `${h}%`;
      });
      n += 1;
    }, 80);
    clearTimeout(timers.scratchEnd);
    timers.scratchEnd = setTimeout(() => {
      clearInterval(timers.scratch);
      timers.scratch = null;
      els.scratchPanel.classList.remove('scratching');
      els.miniWave.forEach(bar => { bar.style.height = '5%'; });
      state.mic.busy = false;
      state.mic.confirmed = true;
      els.scratchBtn.disabled = false;
      fb.className = 'feedback success';
      fb.textContent = 'Left microphone confirmed.';
      sync();
    }, 1300);
  }

  function skipMic() {
    state.mic.skipped = true;
    const fb = els.scratchFeedback;
    fb.className = 'feedback';
    fb.textContent = 'Side check skipped. The comparison will show as Not tested.';
    sync();
  }

  function resizeSpectrum() {
    const rect = els.spectrum.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    if (els.spectrum.width !== Math.round(w * dpr) || els.spectrum.height !== Math.round(h * dpr)) {
      els.spectrum.width = Math.round(w * dpr);
      els.spectrum.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    drawSpectrum(spectrumPct, state.scenario === 'low');
  }

  function drawSpectrum(pct, low = false) {
    const rect = els.spectrum.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const w = rect.width;
    const h = rect.height;
    const n = 30;
    const gap = 2;
    const bw = (w - (n - 1) * gap) / n;
    const base = clamp(pct, 2, 96);
    ctx.clearRect(0, 0, w, h);
    if (pct <= 8) {
      ctx.fillStyle = getComputedStyle(els.html).getPropertyValue('--line-strong').trim() || 'rgba(255,255,255,.15)';
      ctx.globalAlpha = 0.8;
      ctx.fillRect(0, h - 1, w, 1);
      ctx.globalAlpha = 1;
      return;
    }
    ctx.fillStyle = accentColor();
    ctx.globalAlpha = 0.82;
    for (let i = 0; i < n; i += 1) {
      const wobble = low ? 0.2 : 0.5 + 0.5 * Math.abs(Math.sin(i * 0.9 + pct * 0.06));
      const bh = Math.max(2, (base / 100) * h * (0.32 + wobble * 0.68) + (low ? 0 : Math.random() * 3));
      const x = i * (bw + gap);
      const y = h - bh;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, y, bw, bh, 1.4);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, bw, bh);
      }
    }
    ctx.globalAlpha = 1;
  }

  function setRing(pct) {
    els.ringLive.style.strokeDashoffset = String(CIRC * (1 - clamp(pct, 0, 100) / 100));
  }

  function setDb(value) {
    els.dbValue.textContent = value;
  }

  function setTiles(left, right) {
    const pairs = [[els.leftTile, left], [els.rightTile, right]];
    pairs.forEach(([tile, value]) => {
      tile.classList.toggle('active', value === 'live');
      tile.classList.toggle('done', value === 'done');
      tile.querySelector('strong').textContent = value === 'done' ? 'Done' : value === 'live' ? 'Live' : 'Next';
    });
  }

  function cancelMeasure() {
    clearInterval(timers.count);
    clearInterval(timers.listen);
    clearTimeout(timers.hold);
    clearTimeout(timers.confirm);
    timers.count = null;
    timers.listen = null;
    timers.hold = null;
    timers.confirm = null;
    state.measure.busy = false;
    els.holdBtn.disabled = false;
    els.holdBtn.textContent = 'Start hold';
  }

  function completeSide() {
    const m = state.measure;
    if (m.side === 'left') {
      m.switching = true;
      m.busy = false;
      setTiles('done', 'next');
      renderMeasure();
      sync();
      const scene = els.measureScene;
      if (scene) scene.scrollTop = 0;
      return;
    }
    m.done = true;
    m.busy = false;
    els.holdBtn.hidden = true;
    els.seeResult.hidden = false;
    els.prompt.textContent = 'Right ear captured';
    els.hint.textContent = 'Both ears are measured. See the result.';
    els.phaseChip.textContent = 'RIGHT EAR · DONE';
    els.ringLabel.textContent = 'RIGHT DONE';
    els.sideRead.textContent = 'RIGHT · captured';
    setRing(58);
    setDb('−19.1');
    spectrumPct = 58;
    drawSpectrum(58);
    setTiles('done', 'done');
    sync();
  }

  function capturePhase() {
    const m = state.measure;
    const phase = m.phase;
    m.captured[phase] = true;
    m.busy = false;
    setRing(58);
    setDb(phase === 0 ? '−18.4' : '−19.1');
    spectrumPct = 58;
    drawSpectrum(58);
    els.ringLabel.textContent = 'CAPTURED';
    if (phase === 0) {
      m.phase = 1;
      const side = m.side === 'left' ? 'LEFT' : 'RIGHT';
      els.phaseChip.textContent = `${side} · PHASE B · 3–6.5 kHz`;
      els.prompt.textContent = 'Say "Ssss" for three seconds';
      els.hint.textContent = 'Hold a steady, comfortable voice. We listen to one microphone at a time.';
      els.sideRead.textContent = `${side} · LF captured`;
      els.holdBtn.disabled = false;
      els.holdBtn.textContent = 'Start hold';
      sync();
      return;
    }
    completeSide();
  }

  function listen() {
    if (!state.measure.busy) return;
    const low = state.scenario === 'low';
    els.holdBtn.textContent = 'Listening…';
    els.ringLabel.textContent = 'LISTENING';
    const start = Date.now();
    clearInterval(timers.listen);
    timers.listen = setInterval(() => {
      const t = (Date.now() - start) / 3000;
      let pct;
      let db;
      if (low) {
        pct = 8 + Math.random() * 6;
        db = -56 + Math.random() * 7;
      } else {
        pct = 50 + Math.sin(t * Math.PI * 4) * 9 + Math.random() * 6;
        db = -23 + pct * 0.12;
      }
      spectrumPct = pct;
      setRing(pct);
      setDb(db.toFixed(1));
      drawSpectrum(pct, low);
    }, 90);
    clearTimeout(timers.hold);
    timers.hold = setTimeout(() => {
      clearInterval(timers.listen);
      timers.listen = null;
      if (low) {
        state.measure.busy = false;
        els.holdBtn.disabled = false;
        els.holdBtn.textContent = 'Start hold';
        els.ringLabel.textContent = 'NO SIGNAL';
        setRing(10);
        spectrumPct = 8;
        drawSpectrum(8, true);
        setDb('−52.0');
        els.measureError.hidden = false;
        sync();
        setTimeout(() => els.measureError.scrollIntoView({ block: 'nearest', behavior: isReduced() ? 'auto' : 'smooth' }), 40);
        return;
      }
      capturePhase();
    }, 3000);
  }

  function startHold() {
    if (state.measure.busy || state.measure.done) return;
    els.measureError.hidden = true;
    state.measure.busy = true;
    els.holdBtn.disabled = true;
    els.holdBtn.textContent = 'Get ready…';
    els.ringLabel.textContent = '3';
    setRing(0);
    clearInterval(timers.count);
    let n = 3;
    timers.count = setInterval(() => {
      n -= 1;
      if (n > 0) {
        els.ringLabel.textContent = String(n);
      } else {
        clearInterval(timers.count);
        timers.count = null;
        listen();
      }
    }, 500);
  }

  function renderMeasure() {
    const m = state.measure;
    els.measureScene.classList.toggle('switching', m.switching);
    els.switchPanel.hidden = !m.switching;
    els.measureError.hidden = true;
    if (m.switching) {
      setTiles('done', 'next');
      return;
    }
    if (m.done) {
      els.holdBtn.hidden = true;
      els.seeResult.hidden = false;
      els.prompt.textContent = 'Right ear captured';
      els.hint.textContent = 'Both ears are measured. See the result.';
      els.phaseChip.textContent = 'RIGHT EAR · DONE';
      els.ringLabel.textContent = 'RIGHT DONE';
      els.sideRead.textContent = 'RIGHT · captured';
      setRing(58);
      setDb('−19.1');
      spectrumPct = 58;
      setTiles('done', 'done');
      setTimeout(resizeSpectrum, 40);
      return;
    }
    els.holdBtn.hidden = false;
    els.seeResult.hidden = true;
    els.holdBtn.disabled = false;
    els.holdBtn.textContent = 'Start hold';
    const side = m.side === 'left' ? 'LEFT' : 'RIGHT';
    const phase = m.phase;
    els.phaseChip.textContent = `${side} · ${phase === 0 ? 'PHASE A · 150–800 Hz' : 'PHASE B · 3–6.5 kHz'}`;
    els.prompt.textContent = phase === 0 ? 'Say "Ahhh" for three seconds' : 'Say "Ssss" for three seconds';
    els.hint.textContent = 'Hold a steady, comfortable voice. We listen to one microphone at a time.';
    els.sideRead.textContent = `${side} · ${phase === 1 ? 'LF captured' : '—'}`;
    if (m.side === 'left') setTiles('live', 'next');
    else setTiles('done', 'live');
    if (m.captured[phase]) {
      els.ringLabel.textContent = 'CAPTURED';
      setRing(58);
      setDb(phase === 0 ? '−18.4' : '−19.1');
      spectrumPct = 58;
    } else {
      els.ringLabel.textContent = 'READY';
      setRing(0);
      setDb('—');
      spectrumPct = 6;
    }
    setTimeout(resizeSpectrum, 40);
  }

  function resetMeasure() {
    cancelMeasure();
    state.measure = { side: 'left', phase: 0, captured: [false, false], done: false, busy: false, switching: false };
    els.measureScene.classList.remove('switching');
    els.switchPanel.hidden = true;
    els.measureError.hidden = true;
    els.rightFeedback.textContent = '';
    els.confirmRight.disabled = false;
    els.confirmRight.textContent = 'Confirm right microphone';
    spectrumPct = 6;
    renderMeasure();
  }

  function confirmRight() {
    if (state.measure.busy) return;
    state.measure.busy = true;
    els.confirmRight.disabled = true;
    els.confirmRight.textContent = 'Listening…';
    els.rightFeedback.className = 'feedback';
    els.rightFeedback.textContent = 'Listening for the scratch…';
    clearTimeout(timers.confirm);
    timers.confirm = setTimeout(() => {
      state.measure = { side: 'right', phase: 0, captured: [false, false], done: false, busy: false, switching: false };
      els.confirmRight.disabled = false;
      els.confirmRight.textContent = 'Confirm right microphone';
      els.rightFeedback.className = 'feedback success';
      els.rightFeedback.textContent = 'Right microphone confirmed.';
      spectrumPct = 6;
      renderMeasure();
      sync();
    }, 1200);
  }

  function setScenario(value) {
    state.scenario = value;
    if (value === 'low') {
      resetMeasure();
    }
    if (value === 'happy') {
      els.measureError.hidden = true;
    }
    renderRoute();
    sync();
    if (state.step === 4) renderMeasure();
  }

  function setVariant(value) {
    state.variant = value;
    writePref('sc.variant', value);
    els.html.dataset.variant = value;
    document.body.classList.add('theme-anim');
    setTimeout(() => document.body.classList.remove('theme-anim'), 420);
    accent = accentColor();
    sync();
    if (state.step === 4) {
      setTimeout(() => { drawSpectrum(spectrumPct, state.scenario === 'low'); }, 380);
    }
  }

  function setMotion(value) {
    state.motion = value;
    writePref('sc.motion', value);
    els.html.dataset.motion = value;
    syncControls();
  }

  function startRecoveryTimer() {
    state.recovery.started = true;
    sync();
  }

  function finish() {
    state.recovery.finished = true;
    sync();
  }

  function resetFlow() {
    clearInterval(timers.scratch);
    clearTimeout(timers.scratchEnd);
    clearTimeout(timers.ping);
    clearTimeout(timers.save);
    timers.scratch = null;
    timers.scratchEnd = null;
    timers.ping = null;
    timers.save = null;
    cancelMeasure();
    const variant = state.variant;
    const motion = state.motion;
    state = initialState();
    state.variant = variant;
    state.motion = motion;
    state.walking = false;
    walkToken += 1;

    els.walkBanner.hidden = true;
    els.walkBanner.classList.remove('playing');
    els.pathPanel.hidden = false;
    els.scratchPanel.hidden = true;
    els.scratchPanel.classList.remove('scratching');
    els.scratchBtn.disabled = false;
    els.scratchFeedback.textContent = '';
    els.scratchFeedback.className = 'feedback';
    els.miniWave.forEach(bar => { bar.style.height = '5%'; });
    els.earStage.classList.remove('ping');
    els.earChoices.hidden = true;
    els.earFeedback.textContent = '';
    els.earFeedback.className = 'feedback';
    els.playPing.disabled = false;
    els.skipSetupConfirm.hidden = true;
    els.saveNote.hidden = true;
    els.finish.hidden = true;
    els.measureError.hidden = true;
    els.switchPanel.hidden = true;
    els.measureScene.classList.remove('switching');
    els.rightFeedback.textContent = '';
    els.confirmRight.disabled = false;
    els.confirmRight.textContent = 'Confirm right microphone';
    spectrumPct = 6;

    sync();
    go(0);
    renderRoute();
    renderMeasure();
  }

  function stopWalkthrough() {
    if (!state.walking) return;
    state.walking = false;
    walkToken += 1;
    els.walkBanner.hidden = true;
    els.walkBanner.classList.remove('playing');
    cancelMeasure();
    if (state.step === 4) renderMeasure();
    sync();
  }

  async function playWalkthrough() {
    if (state.walking) {
      stopWalkthrough();
      return;
    }
    closeStudio();
    resetFlow();
    setScenario('happy');
    state.walking = true;
    const token = ++walkToken;
    els.walkBanner.hidden = false;
    els.walkBanner.classList.add('playing');
    sync();
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const alive = () => state.walking && token === walkToken;
    try {
      await wait(600);
      if (!alive()) return;
      for (const key of ['inEars', 'fit', 'quiet', 'volume']) {
        if (!alive()) return;
        setReady(key, true);
        await wait(260);
      }
      await wait(600);
      if (!alive()) return;
      go(1);
      await wait(900);
      if (!alive()) return;
      go(2);
      await wait(350);
      if (!alive()) return;
      playPing();
      await wait(1300);
      if (!alive()) return;
      selectEar('left');
      await wait(700);
      if (!alive()) return;
      go(3);
      await wait(350);
      if (!alive()) return;
      pathDone();
      await wait(600);
      if (!alive()) return;
      startScratch();
      await wait(1600);
      if (!alive()) return;
      go(4);
      await wait(500);
      if (!alive()) return;
      startHold();
      await wait(5100);
      if (!alive()) return;
      startHold();
      await wait(5100);
      if (!alive()) return;
      await wait(450);
      if (!alive()) return;
      confirmRight();
      await wait(1500);
      if (!alive()) return;
      startHold();
      await wait(5100);
      if (!alive()) return;
      startHold();
      await wait(5100);
      if (!alive()) return;
      await wait(450);
      if (!alive()) return;
      go(5);
      await wait(2200);
      if (!alive()) return;
      go(6);
      await wait(600);
      if (!alive()) return;
      startRecoveryTimer();
      await wait(1600);
    } finally {
      if (token === walkToken) stopWalkthrough();
    }
  }

  function openStudio() {
    if (els.sheet.open) return;
    els.sheet.showModal();
    syncControls();
    els.closeStudio.focus();
  }

  function closeStudio() {
    if (els.sheet.open) els.sheet.close();
  }

  /* Bind */
  els.chapters.forEach(button => button.addEventListener('click', () => {
    closeStudio();
    go(Number(button.dataset.stepChoice));
  }));
  $$('[data-variant-choice]').forEach(b => b.addEventListener('click', () => setVariant(b.dataset.variantChoice)));
  $$('[data-motion-choice]').forEach(b => b.addEventListener('click', () => setMotion(b.dataset.motionChoice)));
  $$('select[data-simulate]').forEach(select => select.addEventListener('change', () => setScenario(select.value)));
  $$('[data-action="walkthrough"]').forEach(b => b.addEventListener('click', playWalkthrough));
  $$('[data-action="reset"]').forEach(b => b.addEventListener('click', () => { closeStudio(); resetFlow(); }));
  els.openStudio.addEventListener('click', openStudio);
  els.closeStudio.addEventListener('click', closeStudio);
  els.sheet.addEventListener('click', (event) => { if (event.target === els.sheet) closeStudio(); });

  els.back.addEventListener('click', () => go(state.step - 1));
  els.next.addEventListener('click', () => {
    if (!canNext()) return;
    if (state.step === 5) go(6);
    else if (state.step === 6) finish();
    else go(state.step + 1);
  });

  $$('.check-item').forEach(b => b.addEventListener('click', () => toggleReady(b.dataset.check)));
  els.skipSetup.addEventListener('click', () => { els.skipSetupConfirm.hidden = false; });
  els.skipSetupYes.addEventListener('click', () => {
    state.ready.skipped = true;
    els.skipSetupConfirm.hidden = true;
    sync();
  });
  els.skipSetupNo.addEventListener('click', () => { els.skipSetupConfirm.hidden = true; });

  els.reconnect.addEventListener('click', () => setScenario('happy'));
  els.playPing.addEventListener('click', playPing);
  $$('.choices button').forEach(b => b.addEventListener('click', () => selectEar(b.dataset.ear)));
  els.skipEar.addEventListener('click', () => {
    state.ear.skipped = true;
    state.ear.choice = null;
    $$('.choices button').forEach(b => b.setAttribute('aria-pressed', 'false'));
    els.earFeedback.className = 'feedback';
    els.earFeedback.textContent = 'Ear side not tested. The result will say so.';
    sync();
  });

  els.pathDone.addEventListener('click', pathDone);
  els.scratchBtn.addEventListener('click', startScratch);
  els.skipMic.addEventListener('click', skipMic);

  els.holdBtn.addEventListener('click', startHold);
  els.seeResult.addEventListener('click', () => go(5));
  els.retryHold.addEventListener('click', () => { els.measureError.hidden = true; startHold(); });
  els.goodSignal.addEventListener('click', () => { setScenario('happy'); els.measureError.hidden = true; startHold(); });
  els.confirmRight.addEventListener('click', confirmRight);

  els.testAgain.addEventListener('click', () => { resetMeasure(); go(4); });
  els.saveResult.addEventListener('click', () => {
    els.saveNote.hidden = false;
    clearTimeout(timers.save);
    timers.save = setTimeout(() => { els.saveNote.hidden = true; }, 3200);
  });

  els.startTimer.addEventListener('click', startRecoveryTimer);
  els.demoUnlock.addEventListener('click', () => { state.recovery.ready = true; sync(); });
  els.retest.addEventListener('click', () => { resetMeasure(); go(4); });
  els.startOver.addEventListener('click', () => { resetFlow(); go(0); });

  els.walkBanner.addEventListener('click', stopWalkthrough);
  document.addEventListener('pointerdown', (event) => {
    if (state.walking && !event.target.closest('#walkBanner')) stopWalkthrough();
  }, true);

  window.addEventListener('resize', () => {
    if (state.step === 4) resizeSpectrum();
  });

  if (new URLSearchParams(location.search).has('film')) document.body.classList.add('film');
  accent = accentColor();
  sync();
  renderRoute();
  renderMeasure();
})();
