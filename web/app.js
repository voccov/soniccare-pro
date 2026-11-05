(() => {
  "use strict";

  const VERSION = "0.1.0-dev.3";
  const STORAGE_KEY = "soniccare.pwa.v1";
  const SCRATCH_THRESHOLD_DB = 18;
  const THRESHOLDS = {
    healthyMin: -6,
    healthyMax: 4,
    unilateralDelta: 6,
    bilateralMax: -10,
    bilateralSpread: 5,
    severe: -18,
  };

  const $ = (selector) => document.querySelector(selector);
  const els = {
    intro: $("#intro"),
    session: $("#session"),
    enable: $("#enable"),
    demo: $("#demo"),
    introError: $("#intro-error"),
    statusText: $("#status-text"),
    led: $("#led"),
    statusPill: $("#status-pill"),
    inputLabel: $("#input-label"),
    routeBadge: $("#route-badge"),
    sampleRate: $("#sample-rate"),
    routeNote: $("#route-note"),
    reconnect: $("#reconnect"),
    earLabel: $("#ear-label"),
    scratchBadge: $("#scratch-badge"),
    scratch: $("#scratch"),
    scratchMeter: $("#scratch-meter"),
    scratchResult: $("#scratch-result"),
    phaseBadge: $("#phase-badge"),
    liveDb: $("#live-db"),
    spectrum: $("#spectrum"),
    bandLabel: $("#band-label"),
    phaseLf: $("#phase-lf"),
    phaseHf: $("#phase-hf"),
    testStatus: $("#test-status"),
    category: $("#category"),
    leftSvr: $("#left-svr"),
    rightSvr: $("#right-svr"),
    verdict: $("#verdict"),
    export: $("#export"),
    copy: $("#copy"),
    reset: $("#reset"),
    version: $("#version"),
    footerVersion: $("#footer-version"),
  };

  const state = {
    activeEar: "left",
    captures: {},
    scratch: {},
    audio: null,
    busy: false,
    spectrumRAF: 0,
  };

  els.version.textContent = VERSION;
  els.footerVersion.textContent = VERSION;

  loadSaved();

  els.enable.addEventListener("click", () => enableMic(false));
  els.demo.addEventListener("click", () => enableMic(true));
  els.reconnect.addEventListener("click", async () => {
    stopAudio();
    await enableMic();
  });
  els.scratch.addEventListener("click", scratchCheck);
  els.phaseLf.addEventListener("click", () => measurePhase("lf"));
  els.phaseHf.addEventListener("click", () => measurePhase("hf"));
  els.export.addEventListener("click", exportJson);
  els.copy.addEventListener("click", copyJson);
  els.reset.addEventListener("click", resetSession);

  document.querySelectorAll("[data-ear]").forEach((button) => {
    button.addEventListener("click", () => selectEar(button.dataset.ear));
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    if (state.audio?.context?.state === "suspended") {
      state.audio.context.resume().catch(() => {});
    }
    if (state.audio?.track?.readyState === "ended") {
      setStatus("Input disconnected. Tap Reconnect input.", "bad");
    }
  });

  window.addEventListener("beforeunload", stopAudio);

  function selectEar(ear) {
    if (ear !== "left" && ear !== "right") return;
    state.activeEar = ear;
    document.querySelectorAll("[data-ear]").forEach((button) => {
      button.classList.toggle("selected", button.dataset.ear === ear);
    });
    els.earLabel.textContent = ear === "left" ? "Left" : "Right";
    updatePhaseBadge();
    updateScratchUi();
    saveState();
  }

  async function enableMic(demo = false) {
    els.introError.classList.add("hidden");
    els.enable.disabled = true;
    els.demo.disabled = true;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      let stream;
      let context;
      let label;
      let sampleRate;
      let demoOsc = null;

      if (demo) {
        context = new AudioContextClass();
        await context.resume();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const destination = context.createMediaStreamDestination();
        oscillator.type = "sine";
        oscillator.frequency.value = 220;
        gain.gain.value = 0.025;
        oscillator.connect(gain);
        gain.connect(destination);
        oscillator.start();
        stream = destination.stream;
        label = "Demo signal";
        sampleRate = context.sampleRate;
        demoOsc = oscillator;
      } else {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("This browser does not expose microphone access. Open the HTTPS GitHub Pages link in Safari.");
        }
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });
        context = new AudioContextClass();
        await context.resume();
        const track = stream.getAudioTracks()[0];
        const settings = typeof track.getSettings === "function" ? track.getSettings() : {};
        label = (track.label || "Default input").trim();
        sampleRate = Number(settings.sampleRate) || context.sampleRate;
      }

      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0;
      source.connect(analyser);

      const track = stream.getAudioTracks()[0];
      state.audio = {
        context,
        stream,
        source,
        analyser,
        track,
        osc: demoOsc,
        demo,
        label,
        sampleRate,
        contextRate: context.sampleRate,
      };
      track.onended = () => setStatus("Input disconnected. Tap Reconnect input.", "bad");

      els.intro.classList.add("hidden");
      els.session.classList.remove("hidden");
      updateInputUi();
      updateButtons();
      renderReport();
      startSpectrum();
      setStatus(demo ? "Demo signal" : "Microphone ready", demo ? "warn" : "live");
      els.testStatus.textContent = demo
        ? "Demo signal. Results are not your AirPods."
        : "Ready. Start with “Ahh”.";
    } catch (error) {
      const message = error?.name === "NotAllowedError"
        ? "Microphone access is off. Allow it in your browser, or open Settings → Safari → Microphone on iPhone."
        : error?.message || "Could not open the microphone.";
      els.introError.textContent = message;
      els.introError.classList.remove("hidden");
      els.enable.disabled = false;
      els.demo.disabled = false;
      setStatus("Microphone unavailable", "bad");
    }
  }

  function stopAudio() {
    cancelAnimationFrame(state.spectrumRAF);
    if (state.audio) {
      if (state.audio.osc) {
        try { state.audio.osc.stop(); } catch { /* already stopped */ }
      }
      if (state.audio.track) state.audio.track.onended = null;
      state.audio.stream.getTracks().forEach((track) => track.stop());
      state.audio.context.close().catch(() => {});
      state.audio = null;
    }
    els.liveDb.textContent = "—";
    setStatus("Not connected", "idle");
  }

  function updateInputUi() {
    if (!state.audio) return;
    const { label, sampleRate, contextRate, demo } = state.audio;
    if (demo) {
      els.inputLabel.textContent = "Demo signal";
      els.routeBadge.textContent = "Demo";
      els.routeBadge.className = "badge warn";
      els.sampleRate.textContent = `${formatRate(sampleRate)} Hz`;
      els.routeNote.textContent = "Synthetic 220 Hz tone. Results are not your AirPods.";
      els.bandLabel.textContent = `High band: ${highBandLabel()}`;
      setStatus("Demo signal", "warn");
      return;
    }
    const looksBluetooth = /airpods|bluetooth|headset|hands.?free|wireless/i.test(label);
    els.inputLabel.textContent = label;
    els.routeBadge.textContent = looksBluetooth ? "AirPods / Bluetooth" : "Check input";
    els.routeBadge.className = `badge ${looksBluetooth ? "good" : "warn"}`;
    els.sampleRate.textContent = `${formatRate(sampleRate)} Hz`;
    if (sampleRate <= 8000) {
      els.routeNote.textContent = "Limited bandwidth: the high band will use 2–3.5 kHz. Results will be conservative.";
    } else if (!looksBluetooth) {
      els.routeNote.textContent = "This may be the phone microphone. If you are testing AirPods, check Settings → Bluetooth → (i) → Microphone, then tap Reconnect input.";
    } else {
      els.routeNote.textContent = `Context ${formatRate(contextRate)} Hz. Use the scratch check to confirm the selected microphone.`;
    }
    els.bandLabel.textContent = `High band: ${highBandLabel()}`;
    setStatus(label, looksBluetooth ? "live" : "warn");
  }

  function formatRate(rate) {
    return Number.isFinite(rate) ? Math.round(rate).toLocaleString("en-US") : "—";
  }

  function highBand() {
    const rate = state.audio?.sampleRate || 48000;
    return rate <= 8000 ? [2000, 3500] : [3000, 6500];
  }

  function highBandLabel() {
    const [lo, hi] = highBand();
    return `${lo / 1000}–${hi / 1000} kHz`;
  }

  function setStatus(text, tone) {
    els.statusText.textContent = text;
    els.led.className = `led ${tone === "live" ? "live" : tone === "warn" ? "warn" : tone === "bad" ? "bad" : ""}`.trim();
    els.statusPill.querySelector(".dot").className = `dot ${tone === "live" ? "live" : tone === "warn" ? "warn" : tone === "bad" ? "bad" : ""}`.trim();
  }

  async function scratchCheck() {
    if (!state.audio || state.busy) return;
    state.busy = true;
    updateButtons();
    const ear = state.activeEar;
    const earName = ear === "left" ? "left" : "right";
    els.scratchBadge.textContent = "Listening";
    els.scratchBadge.className = "badge warn";
    els.scratchResult.textContent = "Wait for the cue, then scratch the bottom silver ring with a fingernail for one second.";
    els.scratchMeter.style.width = "0%";

    const data = new Float32Array(state.audio.analyser.fftSize);
    const started = performance.now();
    let baselineRms = 0;
    let baselineFrames = 0;
    let peakRms = 0;
    let peakDb = -100;

    while (performance.now() - started < 1700) {
      state.audio.analyser.getFloatTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i += 1) sum += data[i] * data[i];
      const rms = Math.sqrt(sum / data.length) + 1e-9;
      const elapsed = performance.now() - started;
      if (elapsed < 380) {
        baselineRms += rms;
        baselineFrames += 1;
      } else {
        if (rms > peakRms) peakRms = rms;
        peakDb = Math.max(peakDb, 20 * Math.log10(rms));
        const width = Math.max(0, Math.min(100, ((peakDb + 80) / 70) * 100));
        els.scratchMeter.style.width = `${width}%`;
      }
      if (elapsed >= 380 && elapsed < 500) {
        els.scratchResult.textContent = "Scratch now.";
      }
      await delay(20);
    }

    const baseline = baselineRms / Math.max(baselineFrames, 1);
    const delta = 20 * Math.log10((peakRms + 1e-9) / (baseline + 1e-9));
    const verified = delta >= SCRATCH_THRESHOLD_DB;
    state.scratch[ear] = { verified, deltaDb: Number.isFinite(delta) ? delta : null, at: new Date().toISOString() };
    els.scratchBadge.textContent = verified ? "Verified" : "No spike";
    els.scratchBadge.className = `badge ${verified ? "good" : "warn"}`;
    els.scratchResult.textContent = verified
      ? `Verified: the ${earName} microphone is live.`
      : `No spike. iOS is probably still using the other microphone. Check Settings, then tap Reconnect input.`;
    state.busy = false;
    updateButtons();
    saveState();
  }

  async function measurePhase(kind) {
    if (!state.audio || state.busy) return;
    state.busy = true;
    updateButtons();
    const isLf = kind === "lf";
    const [lo, hi] = isLf ? [150, 800] : highBand();
    const label = isLf ? "Ahh" : "Ssss";
    els.phaseBadge.textContent = "Get ready";
    els.phaseBadge.className = "badge warn";
    els.testStatus.textContent = `Get ready to say “${label}”.`;

    for (let i = 3; i >= 1; i -= 1) {
      els.testStatus.textContent = `${i}…`;
      await delay(500);
    }

    els.testStatus.textContent = `Say “${label}” now.`;
    els.phaseBadge.textContent = "Listening";
    const analyser = state.audio.analyser;
    const bins = analyser.frequencyBinCount;
    const data = new Float32Array(bins);
    const binHz = state.audio.contextRate / analyser.fftSize;
    const started = performance.now();
    let totalPower = 0;
    let frames = 0;

    while (performance.now() - started < 3000) {
      analyser.getFloatFrequencyData(data);
      let framePower = 0;
      for (let i = 0; i < bins; i += 1) {
        const frequency = i * binHz;
        if (frequency < lo || frequency > hi) continue;
        const db = data[i];
        if (Number.isFinite(db)) framePower += Math.pow(10, db / 10);
      }
      totalPower += framePower;
      frames += 1;
      await delay(20);
    }

    const averagePower = totalPower / Math.max(frames, 1);
    const db = 10 * Math.log10(averagePower + 1e-12);
    const ear = state.activeEar;
    const capture = state.captures[ear] || {
      ear,
      demo: Boolean(state.audio.demo),
      trackLabel: state.audio.label,
      trackSampleRate: state.audio.sampleRate,
      lfDb: null,
      hfDb: null,
      svrDb: null,
    };
    if (isLf) capture.lfDb = db;
    else capture.hfDb = db;
    if (Number.isFinite(capture.lfDb) && Number.isFinite(capture.hfDb)) {
      capture.svrDb = capture.hfDb - capture.lfDb;
    }
    capture.updatedAt = new Date().toISOString();
    capture.demo = Boolean(state.audio.demo);
    capture.trackLabel = state.audio.label;
    capture.trackSampleRate = state.audio.sampleRate;
    state.captures[ear] = capture;

    state.busy = false;
    updateButtons();
    updatePhaseBadge();
    renderReport();
    saveState();

    const complete = Number.isFinite(capture.lfDb) && Number.isFinite(capture.hfDb);
    els.testStatus.textContent = complete
      ? "Ear complete. Switch ears, or compare the two results."
      : `Captured. Next: ${isLf ? "“Ssss”" : "“Ahh”"}.`;
  }

  function updatePhaseBadge() {
    const capture = state.captures[state.activeEar];
    if (!capture) {
      els.phaseBadge.textContent = "Ready";
      els.phaseBadge.className = "badge";
      return;
    }
    const hasLf = Number.isFinite(capture.lfDb);
    const hasHf = Number.isFinite(capture.hfDb);
    if (hasLf && hasHf) {
      els.phaseBadge.textContent = "Ear complete";
      els.phaseBadge.className = "badge good";
    } else if (hasLf) {
      els.phaseBadge.textContent = "Ahh captured";
      els.phaseBadge.className = "badge warn";
    } else if (hasHf) {
      els.phaseBadge.textContent = "Ssss captured";
      els.phaseBadge.className = "badge warn";
    } else {
      els.phaseBadge.textContent = "Ready";
      els.phaseBadge.className = "badge";
    }
  }

  function updateScratchUi() {
    const result = state.scratch[state.activeEar];
    if (!result) {
      els.scratchBadge.textContent = "Unverified";
      els.scratchBadge.className = "badge";
      els.scratchResult.textContent = "Not checked yet. No spike means the other microphone is still active.";
      return;
    }
    els.scratchBadge.textContent = result.verified ? "Verified" : "No spike";
    els.scratchBadge.className = `badge ${result.verified ? "good" : "warn"}`;
    els.scratchResult.textContent = result.verified
      ? `Verified: the ${state.activeEar} microphone is live.`
      : "No spike on the last check. Check the selected microphone, then try again.";
  }

  function renderReport() {
    const left = state.captures.left;
    const right = state.captures.right;
    const demo = Boolean(left?.demo || right?.demo);
    els.leftSvr.textContent = left && Number.isFinite(left.svrDb) ? `${left.svrDb.toFixed(1)} dB` : "—";
    els.rightSvr.textContent = right && Number.isFinite(right.svrDb) ? `${right.svrDb.toFixed(1)} dB` : "—";

    if (!left || !right || !Number.isFinite(left.svrDb) || !Number.isFinite(right.svrDb)) {
      els.category.textContent = "Not enough data";
      els.category.className = "";
      els.verdict.textContent = `${demo ? "Demo signal. " : ""}Complete both ears to compare.`;
      updateButtons();
      return;
    }

    const l = left.svrDb;
    const r = right.svrDb;
    const spread = Math.abs(l - r);
    let category = "Inconclusive";
    let tone = "";

    if (l < THRESHOLDS.severe || r < THRESHOLDS.severe) {
      category = `${l < r ? "Left" : "Right"} severely blocked`;
      tone = "bad";
    } else if (l < THRESHOLDS.bilateralMax && r < THRESHOLDS.bilateralMax && spread < THRESHOLDS.bilateralSpread) {
      category = "Both high-frequency loss";
      tone = "warn";
    } else if (l <= r - THRESHOLDS.unilateralDelta) {
      category = "Left high-frequency loss";
      tone = "warn";
    } else if (r <= l - THRESHOLDS.unilateralDelta) {
      category = "Right high-frequency loss";
      tone = "warn";
    } else if (l >= THRESHOLDS.healthyMin && l <= THRESHOLDS.healthyMax && r >= THRESHOLDS.healthyMin && r <= THRESHOLDS.healthyMax) {
      category = "Balanced";
      tone = "good";
    }

    els.category.textContent = category;
    els.category.className = tone ? `status-${tone}` : "";
    els.verdict.textContent = `${demo ? "Demo signal. " : ""}Left SVR ${l.toFixed(1)} dB · Right SVR ${r.toFixed(1)} dB · Difference ${spread.toFixed(1)} dB.`;
    updateButtons();
  }

  function updateButtons() {
    const disabled = state.busy;
    els.scratch.disabled = disabled;
    els.phaseLf.disabled = disabled;
    els.phaseHf.disabled = disabled;
    els.reconnect.disabled = disabled;
    els.export.disabled = disabled || !hasAnyCapture();
    els.copy.disabled = disabled || !hasAnyCapture();
    els.reset.disabled = disabled;
  }

  function hasAnyCapture() {
    return Object.values(state.captures).some((capture) => Number.isFinite(capture?.lfDb) || Number.isFinite(capture?.hfDb));
  }

  function buildPayload() {
    return {
      app: "SonicCare PWA",
      version: VERSION,
      generatedAt: new Date().toISOString(),
      provisional: true,
      input: state.audio ? {
        label: state.audio.label,
        sampleRate: state.audio.sampleRate,
        contextRate: state.audio.contextRate,
        demo: Boolean(state.audio.demo),
      } : null,
      captures: state.captures,
      scratch: state.scratch,
      thresholds: THRESHOLDS,
      note: "Relative SVR check. Bluetooth speech audio is band-limited and uncalibrated. Not a medical diagnosis.",
    };
  }

  function exportJson() {
    const payload = buildPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `soniccare-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function copyJson() {
    const text = JSON.stringify(buildPayload(), null, 2);
    try {
      await navigator.clipboard.writeText(text);
      els.testStatus.textContent = "JSON copied. Paste it in the chat.";
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      try { document.execCommand("copy"); } catch { /* no clipboard */ }
      area.remove();
      els.testStatus.textContent = "JSON copied. Paste it in the chat.";
    }
  }

  function resetSession() {
    if (!window.confirm("Reset both ears and the scratch results?")) return;
    state.captures = {};
    state.scratch = {};
    saveState();
    updatePhaseBadge();
    updateScratchUi();
    renderReport();
    els.testStatus.textContent = "Ready. Start with “Ahh”.";
  }

  function loadSaved() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved && typeof saved === "object") {
        state.captures = saved.captures && typeof saved.captures === "object" ? saved.captures : {};
        state.scratch = saved.scratch && typeof saved.scratch === "object" ? saved.scratch : {};
        state.activeEar = saved.activeEar === "right" ? "right" : "left";
      }
    } catch {
      // A corrupt local record is ignored.
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        activeEar: state.activeEar,
        captures: state.captures,
        scratch: state.scratch,
        updatedAt: new Date().toISOString(),
      }));
    } catch {
      // Private mode or storage disabled: the session still works.
    }
  }

  function startSpectrum() {
    const canvas = els.spectrum;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssWidth = canvas.clientWidth || 320;
    const cssHeight = 110;
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const bars = 32;
    const data = new Float32Array(state.audio.analyser.frequencyBinCount);
    const time = new Float32Array(state.audio.analyser.fftSize);

    const draw = () => {
      if (!state.audio) return;
      const width = cssWidth;
      const height = cssHeight;
      ctx.clearRect(0, 0, width, height);

      state.audio.analyser.getFloatFrequencyData(data);
      const binHz = state.audio.contextRate / state.audio.analyser.fftSize;
      const minF = 80;
      const maxF = Math.min(9000, state.audio.contextRate / 2);
      const barWidth = width / bars;

      for (let bar = 0; bar < bars; bar += 1) {
        const f0 = minF * Math.pow(maxF / minF, bar / bars);
        const f1 = minF * Math.pow(maxF / minF, (bar + 1) / bars);
        let peak = -100;
        for (let i = 0; i < data.length; i += 1) {
          const f = i * binHz;
          if (f >= f0 && f <= f1 && Number.isFinite(data[i])) peak = Math.max(peak, data[i]);
        }
        const normalized = Math.max(0, Math.min(1, (peak + 90) / 70));
        const barHeight = Math.max(2, normalized * (height - 12));
        ctx.fillStyle = bar > bars * 0.62 ? "rgba(10,132,255,.95)" : "rgba(10,132,255,.55)";
        ctx.fillRect(bar * barWidth + 1, height - barHeight, Math.max(1, barWidth - 2), barHeight);
      }

      state.audio.analyser.getFloatTimeDomainData(time);
      let sum = 0;
      for (let i = 0; i < time.length; i += 1) sum += time[i] * time[i];
      const rms = Math.sqrt(sum / time.length);
      els.liveDb.textContent = Number.isFinite(rms) ? (20 * Math.log10(rms + 1e-9)).toFixed(1) : "—";

      state.spectrumRAF = requestAnimationFrame(draw);
    };

    cancelAnimationFrame(state.spectrumRAF);
    draw();
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Restore the last selected ear and badges after a reload.
  document.querySelectorAll("[data-ear]").forEach((button) => {
    button.classList.toggle("selected", button.dataset.ear === state.activeEar);
  });
  els.earLabel.textContent = state.activeEar === "left" ? "Left" : "Right";
  updatePhaseBadge();
  updateScratchUi();
  renderReport();
})();
