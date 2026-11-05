(() => {
  "use strict";

  const VERSION = "0.1.0-dev.4";
  const STORAGE_KEY = "soniccare.pwa.v1";
  const DRY_KEY = "soniccare.dryUntil";
  const SCRATCH_THRESHOLD_DB = 18;
  const GATE_MIN_DB = -45;
  const GATE_MAX_DB = -5;
  const THRESHOLDS = {
    healthyMin: -6,
    healthyMax: 4,
    unilateralDelta: 6,
    bilateralMax: -10,
    bilateralSpread: 5,
    severe: -18,
  };

  const $ = (selector) => document.querySelector(selector);
  const earButtons = document.querySelectorAll("[data-ear]");
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
    captureMeter: $("#capture-meter"),
    dryingBanner: $("#drying-banner"),
    dryTimer: $("#dry-timer"),
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
    reacquirePending: false,
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
  els.dryTimer.addEventListener("click", startDryTimer);

  document.querySelectorAll("[data-ear]").forEach((button) => {
    button.addEventListener("click", () => selectEar(button.dataset.ear));
  });

  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState === "hidden") {
      if (state.audio) state.reacquirePending = true;
      return;
    }
    if (!state.audio) return;
    if (state.audio.context.state === "suspended") {
      await state.audio.context.resume().catch(() => {});
    }
    if (state.reacquirePending) {
      state.reacquirePending = false;
      setStatus("Re-locking Bluetooth input…", "warn");
      els.testStatus.textContent = "Re-locking the input after Settings…";
      await delay(300);
      try {
        await reacquireAudio();
      } catch {
        els.testStatus.textContent = "Could not re-lock the input. Tap Reconnect input.";
        setStatus("Input not locked", "bad");
      }
    }
  });

  window.addEventListener("beforeunload", stopAudio);

  function selectEar(ear) {
    if (state.busy) return;
    if (ear !== "left" && ear !== "right") return;
    state.activeEar = ear;
    earButtons.forEach((button) => {
      button.classList.toggle("selected", button.dataset.ear === ear);
    });
    els.earLabel.textContent = ear === "left" ? "Left" : "Right";
    els.bandLabel.textContent = `High band: ${highBandLabel()}`;
    updatePhaseBadge();
    updateScratchUi();
    saveState();
  }

  async function enableMic(demo = false, silent = false) {
    els.introError.classList.add("hidden");
    els.enable.disabled = true;
    els.demo.disabled = true;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      let stream;
      let context;
      let label;
      let sampleRate;
      let demoOscs = [];

      if (demo) {
        context = new AudioContextClass();
        await context.resume();
        const destination = context.createMediaStreamDestination();

        // Two tones exercise both SVR bands. They are not a diagnosis.
        const lfOsc = context.createOscillator();
        const lfGain = context.createGain();
        lfOsc.type = "sine";
        lfOsc.frequency.value = 220;
        lfGain.gain.value = 0.03;
        lfOsc.connect(lfGain);
        lfGain.connect(destination);
        lfOsc.start();

        const hfOsc = context.createOscillator();
        const hfGain = context.createGain();
        hfOsc.type = "sine";
        hfOsc.frequency.value = 4500;
        hfGain.gain.value = 0.02;
        hfOsc.connect(hfGain);
        hfGain.connect(destination);
        hfOsc.start();

        demoOscs = [lfOsc, hfOsc];
        stream = destination.stream;
        label = "Demo signal";
        sampleRate = context.sampleRate;
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
        oscs: demoOscs,
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
      setStatus(demo ? "Demo signal" : silent ? "Input re-locked" : "Microphone ready", demo ? "warn" : "live");
      els.testStatus.textContent = demo
        ? "Demo signal. Results are not your AirPods."
        : silent
          ? "Input re-locked. Scratch the current ear, then run the test."
          : "Ready. Start with “Ahh”.";
    } catch (error) {
      const message = error?.name === "NotAllowedError"
        ? "Microphone access is off. Allow it in your browser, or open Settings → Safari → Microphone on iPhone."
        : error?.message || "Could not open the microphone.";
      if (silent) {
        els.testStatus.textContent = "Could not re-lock the input. Tap Reconnect input.";
        setStatus("Input not locked", "bad");
        els.enable.disabled = false;
        els.demo.disabled = false;
        return;
      }
      els.introError.textContent = message;
      els.introError.classList.remove("hidden");
      els.enable.disabled = false;
      els.demo.disabled = false;
      setStatus("Microphone unavailable", "bad");
    }
  }

  function stopAudio(silent = false) {
    cancelAnimationFrame(state.spectrumRAF);
    if (state.audio) {
      (state.audio.oscs || []).forEach((oscillator) => {
        try { oscillator.stop(); } catch { /* already stopped */ }
      });
      if (state.audio.track) state.audio.track.onended = null;
      state.audio.stream.getTracks().forEach((track) => track.stop());
      state.audio.context.close().catch(() => {});
      state.audio = null;
    }
    els.liveDb.textContent = "—";
    if (!silent) setStatus("Not connected", "idle");
  }

  async function reacquireAudio() {
    stopAudio(true);
    await enableMic(false, true);
  }

  function looksLikeBluetooth(label) {
    return /airpods|bluetooth|headset|hands.?free|wireless/i.test(label || "");
  }

  function inputSnapshot() {
    return {
      label: state.audio?.label || "",
      sampleRate: Number(state.audio?.sampleRate) || 0,
      contextRate: Number(state.audio?.contextRate) || 0,
      demo: Boolean(state.audio?.demo),
    };
  }

  function updateInputUi() {
    if (!state.audio) return;
    const { label, sampleRate, contextRate, demo } = state.audio;
    if (demo) {
      els.inputLabel.textContent = "Demo signal";
      els.routeBadge.textContent = "Demo";
      els.routeBadge.className = "badge warn";
      els.sampleRate.textContent = `${formatRate(sampleRate)} Hz`;
      els.routeNote.textContent = "Synthetic 220 Hz + 4.5 kHz tones. Results are not your AirPods.";
      els.bandLabel.textContent = `High band: ${highBandLabel()}`;
      setStatus("Demo signal", "warn");
      return;
    }
    const looksBluetooth = looksLikeBluetooth(label);
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

  function powerInBand(freqData, binHz, minHz, maxHz) {
    let sum = 0;
    const first = Math.max(0, Math.floor(minHz / binHz));
    const last = Math.min(freqData.length - 1, Math.ceil(maxHz / binHz));
    for (let i = first; i <= last; i += 1) {
      const db = freqData[i];
      if (Number.isFinite(db)) sum += Math.pow(10, db / 10);
    }
    return sum;
  }

  function dbFromPower(power) {
    return 10 * Math.log10(power + 1e-12);
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

    const analyser = state.audio.analyser;
    const timeData = new Float32Array(analyser.fftSize);
    const freqData = new Float32Array(analyser.frequencyBinCount);
    const binHz = state.audio.contextRate / analyser.fftSize;
    const started = performance.now();
    let baselineRms = 0;
    let baselineFrames = 0;
    let peakRms = 0;
    let peakDb = -100;
    const postBaseline = [];

    while (performance.now() - started < 1700) {
      analyser.getFloatTimeDomainData(timeData);
      analyser.getFloatFrequencyData(freqData);
      let sum = 0;
      for (let i = 0; i < timeData.length; i += 1) sum += timeData[i] * timeData[i];
      const rms = Math.sqrt(sum / timeData.length) + 1e-9;
      const elapsed = performance.now() - started;
      if (elapsed < 380) {
        baselineRms += rms;
        baselineFrames += 1;
      } else {
        const lowPower = powerInBand(freqData, binHz, 150, 800);
        const frictionPower = powerInBand(freqData, binHz, 2000, 6000);
        postBaseline.push({ rms, lowPower, frictionPower });
        if (rms > peakRms) {
          peakRms = rms;
          peakDb = 20 * Math.log10(rms);
          const width = Math.max(0, Math.min(100, ((peakDb + 80) / 70) * 100));
          els.scratchMeter.style.width = `${width}%`;
        }
      }
      if (elapsed >= 380 && elapsed < 500) {
        els.scratchResult.textContent = "Scratch now.";
      }
      await delay(20);
    }

    const baseline = baselineRms / Math.max(baselineFrames, 1);
    const baselineDb = 20 * Math.log10(baseline + 1e-9);
    const delta = 20 * Math.log10((peakRms + 1e-9) / (baseline + 1e-9));
    const loudFrames = postBaseline.filter((frame) => 20 * Math.log10(frame.rms + 1e-9) > baselineDb + 10);
    const framesForRatio = loudFrames.length ? loudFrames : postBaseline;
    const avgLow = framesForRatio.reduce((total, frame) => total + frame.lowPower, 0) / Math.max(framesForRatio.length, 1);
    const avgFriction = framesForRatio.reduce((total, frame) => total + frame.frictionPower, 0) / Math.max(framesForRatio.length, 1);
    const lowDb = dbFromPower(avgLow);
    const frictionDb = dbFromPower(avgFriction);
    const frictionRatioDb = frictionDb - lowDb;
    const ratioOk = frictionRatioDb >= -10;
    const verified = delta >= SCRATCH_THRESHOLD_DB && ratioOk;

    state.scratch[ear] = {
      verified,
      deltaDb: Number.isFinite(delta) ? delta : null,
      lowDb: Number.isFinite(lowDb) ? lowDb : null,
      frictionDb: Number.isFinite(frictionDb) ? frictionDb : null,
      ratioDb: Number.isFinite(frictionRatioDb) ? frictionRatioDb : null,
      at: new Date().toISOString(),
    };

    els.scratchBadge.textContent = verified ? "Verified" : delta >= SCRATCH_THRESHOLD_DB ? "Not mechanical" : "No spike";
    els.scratchBadge.className = `badge ${verified ? "good" : "warn"}`;
    if (verified) {
      els.scratchResult.textContent = `Verified: the ${earName} microphone is live.`;
    } else if (delta >= SCRATCH_THRESHOLD_DB) {
      els.scratchResult.textContent = "Loud, but not a stem scratch. A voice, cough or table thud does not count. Scratch the bottom silver ring with a fingernail.";
    } else {
      els.scratchResult.textContent = "No spike. iOS is probably still using the other microphone. Check Settings, then tap Reconnect input.";
    }
    state.busy = false;
    updateButtons();
    renderReport();
    saveState();
  }

  async function measurePhase(kind) {
    if (!state.audio || state.busy) return;
    state.busy = true;
    updateButtons();
    const isLf = kind === "lf";
    const ear = state.activeEar;
    const label = isLf ? "Ahh" : "Ssss";
    els.phaseBadge.textContent = "Get ready";
    els.phaseBadge.className = "badge warn";
    els.captureMeter.style.width = "0%";
    els.testStatus.textContent = `Get ready to say “${label}”.`;

    for (let i = 3; i >= 1; i -= 1) {
      els.testStatus.textContent = `${i}…`;
      await delay(500);
    }

    const input = inputSnapshot();
    if (!state.audio) {
      state.busy = false;
      updateButtons();
      els.phaseBadge.textContent = "Input lost";
      els.phaseBadge.className = "badge warn";
      els.testStatus.textContent = "The input disconnected. Tap Reconnect input.";
      return;
    }
    const analyser = state.audio.analyser;
    const timeData = new Float32Array(analyser.fftSize);
    const freqData = new Float32Array(analyser.frequencyBinCount);
    const binHz = state.audio.contextRate / analyser.fftSize;
    const bands = isLf
      ? { lf: [150, 800] }
      : { hfWide: [3000, 6500], mid: [2000, 3500], cliff: [4200, 7000] };
    const sums = {};
    Object.keys(bands).forEach((key) => { sums[key] = 0; });

    let activeMs = 0;
    let frames = 0;
    let last = performance.now();
    const started = performance.now();

    while (activeMs < 3000 && performance.now() - started < 10000) {
      if (!state.audio) break;
      const now = performance.now();
      const dt = Math.min(50, now - last);
      last = now;

      analyser.getFloatTimeDomainData(timeData);
      let sum = 0;
      for (let i = 0; i < timeData.length; i += 1) sum += timeData[i] * timeData[i];
      const rms = Math.sqrt(sum / timeData.length) + 1e-9;
      const rmsDb = 20 * Math.log10(rms);
      const gated = rmsDb >= GATE_MIN_DB && rmsDb <= GATE_MAX_DB;

      if (gated) {
        analyser.getFloatFrequencyData(freqData);
        Object.entries(bands).forEach(([key, [lo, hi]]) => {
          sums[key] += powerInBand(freqData, binHz, lo, hi);
        });
        activeMs += dt;
        frames += 1;
        els.captureMeter.style.width = `${Math.min(100, (activeMs / 3000) * 100)}%`;
        els.testStatus.textContent = `Keep holding “${label}”… ${Math.min(3, activeMs / 1000).toFixed(1)}s`;
      } else if (activeMs > 0) {
        els.testStatus.textContent = `Keep holding “${label}”…`;
      } else {
        els.testStatus.textContent = `Say “${label}” now.`;
      }

      await delay(20);
    }

    if (!state.audio) {
      state.busy = false;
      updateButtons();
      els.phaseBadge.textContent = "Input lost";
      els.phaseBadge.className = "badge warn";
      els.testStatus.textContent = "The input disconnected. Tap Reconnect input.";
      return;
    }

    if (activeMs < 2500 || frames === 0) {
      els.phaseBadge.textContent = "No signal";
      els.phaseBadge.className = "badge warn";
      els.testStatus.textContent = "We didn't hear enough. Move the phone closer or try again in a quieter room.";
      state.busy = false;
      updateButtons();
      return;
    }

    const dbFor = (key) => dbFromPower(sums[key] / frames);
    const capture = state.captures[ear] || {
      ear,
      demo: false,
      trackLabel: input.label,
      trackSampleRate: input.sampleRate,
      lfDb: null,
      hfDb: null,
      svrDb: null,
    };

    if (isLf) {
      capture.lfDb = dbFor("lf");
      capture.lfInput = input;
      capture.lfDemo = input.demo;
    } else {
      const hfWideDb = dbFor("hfWide");
      const midDb = dbFor("mid");
      const cliffDb = dbFor("cliff");
      const narrow = state.audio.sampleRate <= 8000 || (midDb > -50 && cliffDb < midDb - 18);
      capture.hfWideDb = hfWideDb;
      capture.midDb = midDb;
      capture.cliffDb = cliffDb;
      capture.hfDb = narrow ? midDb : hfWideDb;
      capture.hfBand = narrow ? "2–3.5 kHz" : "3–6.5 kHz";
      capture.bandwidth = narrow ? "8 kHz / narrow" : "wideband";
      capture.confidence = narrow ? "Low" : "Medium";
      capture.hfInput = input;
      capture.hfDemo = input.demo;
    }

    if (Number.isFinite(capture.lfDb) && Number.isFinite(capture.hfDb)) {
      capture.svrDb = capture.hfDb - capture.lfDb;
    }
    capture.updatedAt = new Date().toISOString();
    capture.demo = Boolean(capture.lfDemo || capture.hfDemo);
    capture.trackLabel = input.label;
    capture.trackSampleRate = input.sampleRate;
    state.captures[ear] = capture;

    state.busy = false;
    updateButtons();
    updatePhaseBadge();
    renderReport();
    saveState();
    if (!isLf) {
      els.bandLabel.textContent = `High band: ${capture.hfBand} · ${capture.confidence} confidence`;
    }

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
    const loud = Number.isFinite(result.deltaDb) && result.deltaDb >= SCRATCH_THRESHOLD_DB;
    els.scratchBadge.textContent = result.verified ? "Verified" : loud ? "Not mechanical" : "No spike";
    els.scratchBadge.className = `badge ${result.verified ? "good" : "warn"}`;
    els.scratchResult.textContent = result.verified
      ? `Verified: the ${state.activeEar} microphone is live.`
      : loud
        ? "Loud, but not a stem scratch. A voice, cough or table thud does not count. Scratch the bottom silver ring with a fingernail."
        : "No spike on the last check. Check the selected microphone, then try again.";
  }

  function inputConfirmed(capture) {
    if (!capture?.lfInput || !capture?.hfInput) return false;
    return looksLikeBluetooth(capture.lfInput.label) &&
      looksLikeBluetooth(capture.hfInput.label) &&
      !capture.lfInput.demo &&
      !capture.hfInput.demo;
  }

  function inputMismatch(capture) {
    if (!capture?.lfInput || !capture?.hfInput) return false;
    return capture.lfInput.label !== capture.hfInput.label ||
      Math.round(capture.lfInput.sampleRate) !== Math.round(capture.hfInput.sampleRate);
  }

  function crossEarInputMismatch(left, right) {
    if (!left?.lfInput || !right?.lfInput) return false;
    return left.lfInput.label !== right.lfInput.label ||
      Math.round(left.lfInput.sampleRate) !== Math.round(right.lfInput.sampleRate);
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
    const phaseMismatch = inputMismatch(left) || inputMismatch(right);
    const routeUnverified = !inputConfirmed(left) || !inputConfirmed(right);
    const crossEarMismatch = crossEarInputMismatch(left, right);
    const sideUnverified = !state.scratch.left?.verified || !state.scratch.right?.verified;
    const bandwidthMismatch = Boolean(left.bandwidth && right.bandwidth && left.bandwidth !== right.bandwidth);
    const narrow = left.bandwidth === "8 kHz / narrow" || right.bandwidth === "8 kHz / narrow";
    let category = "Inconclusive";
    let tone = "";

    if (demo) {
      category = "Demo only";
      tone = "warn";
    } else if (phaseMismatch || routeUnverified || crossEarMismatch || sideUnverified) {
      category = "Unverified";
      tone = "warn";
    } else if (bandwidthMismatch) {
      category = "Inconclusive";
      tone = "warn";
    } else if (l < THRESHOLDS.severe && r < THRESHOLDS.severe) {
      category = "Both severely blocked";
      tone = "bad";
    } else if (l < THRESHOLDS.severe) {
      category = "Left severely blocked";
      tone = "bad";
    } else if (r < THRESHOLDS.severe) {
      category = "Right severely blocked";
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

    const notes = [];
    if (!demo) {
      if (phaseMismatch) notes.push("The input changed between “Ahh” and “Ssss”; run this ear again.");
      else if (routeUnverified) notes.push("The input was not confirmed as AirPods in both phases.");
      if (crossEarMismatch) notes.push("Left and right used different inputs; run both ears again.");
      if (sideUnverified) notes.push("The scratch check was not verified for both ears.");
    }
    if (bandwidthMismatch) notes.push("Different input bandwidths; compare with caution.");
    else if (narrow && !demo) notes.push("8 kHz narrowband; low confidence.");

    const prefix = demo ? "Demo signal. " : category === "Unverified" ? "Unverified. " : "";
    els.category.textContent = category;
    els.category.className = tone ? `status-${tone}` : "";
    els.verdict.textContent = `${prefix}Left SVR ${l.toFixed(1)} dB · Right SVR ${r.toFixed(1)} dB · Difference ${spread.toFixed(1)} dB.${notes.length ? ` ${notes.join(" ")}` : ""}`;
    updateButtons();
  }

  function updateButtons() {
    const disabled = state.busy;
    const noInput = !state.audio;
    earButtons.forEach((button) => { button.disabled = disabled; });
    els.scratch.disabled = disabled || noInput;
    els.phaseLf.disabled = disabled || noInput;
    els.phaseHf.disabled = disabled || noInput;
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

  function startDryTimer() {
    const until = Date.now() + 2 * 60 * 60 * 1000;
    try { localStorage.setItem(DRY_KEY, String(until)); } catch { /* storage disabled */ }
    renderDryingBanner();
    els.testStatus.textContent = "2-hour drying timer started. Keep the AirPods out of the case until it ends.";
  }

  function renderDryingBanner() {
    if (!els.dryingBanner) return;
    let until = 0;
    try { until = Number(localStorage.getItem(DRY_KEY) || 0); } catch { until = 0; }
    const remaining = until - Date.now();
    if (!until || remaining <= 0) {
      els.dryingBanner.classList.add("hidden");
      els.dryingBanner.textContent = "";
      if (until) {
        try { localStorage.removeItem(DRY_KEY); } catch { /* storage disabled */ }
      }
      return;
    }
    const totalSeconds = Math.ceil(remaining / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    els.dryingBanner.textContent = `Drying in progress · ${hours}:${minutes}:${seconds} remaining · Keep the AirPods out of the case until dry before retesting.`;
    els.dryingBanner.classList.remove("hidden");
  }

  function resetSession() {
    if (!window.confirm("Reset both ears and the scratch results?")) return;
    state.captures = {};
    state.scratch = {};
    els.captureMeter.style.width = "0%";
    saveState();
    updatePhaseBadge();
    updateScratchUi();
    renderReport();
    els.testStatus.textContent = "Ready. Start with “Ahh”.";
  }

  function migrateCapture(capture) {
    if (!capture || typeof capture !== "object") return capture;
    if (!capture.lfInput && capture.trackLabel) {
      const input = {
        label: capture.trackLabel,
        sampleRate: Number(capture.trackSampleRate) || 0,
        contextRate: Number(capture.trackSampleRate) || 0,
        demo: Boolean(capture.demo),
      };
      capture.lfInput = { ...input };
      capture.hfInput = { ...input };
      capture.lfDemo = Boolean(capture.demo);
      capture.hfDemo = Boolean(capture.demo);
    }
    return capture;
  }

  function loadSaved() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved && typeof saved === "object") {
        state.captures = saved.captures && typeof saved.captures === "object" ? saved.captures : {};
        Object.values(state.captures).forEach(migrateCapture);
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
  earButtons.forEach((button) => {
    button.classList.toggle("selected", button.dataset.ear === state.activeEar);
  });
  els.earLabel.textContent = state.activeEar === "left" ? "Left" : "Right";
  updatePhaseBadge();
  updateScratchUi();
  renderReport();
  renderDryingBanner();
  setInterval(renderDryingBanner, 1000);
})();
