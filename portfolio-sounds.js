/**
 * <!-- © 2026 Vijeth Shetty. Do not copy without permission -->
 * ============================================================
 *  VIJETH SHETTY — PORTFOLIO SOUND SYSTEM
 *  Drop this file next to your HTML and add:
 *  <script src="portfolio-sounds.js"></script>
 *  just before </body>
 * ============================================================
 *
 *  FEATURES
 *  ─────────────────────────────────────────────────────────
 *  ✦ Procedurally-generated "Hotham to the Stars" ambient BGM
 *    (deep synth pad + arpeggiated melody + slow bass pulse)
 *  ✦ Hover tones on every interactive element
 *  ✦ Click SFX – each element family has its own unique sound:
 *      • CTA buttons    → rising laser zap
 *      • Nav links      → soft digital tick
 *      • Contact rows   → confirmation chime
 *      • Skill pills    → short glitch burst
 *      • Stat items     → low bass tap
 *  ✦ "Engine on" boot sound on first user interaction
 *  ✦ Mute / Unmute toggle button (bottom-right corner)
 * ============================================================
 */

(function () {
  "use strict";

  /* ── Audio context (lazy-created on first interaction) ───── */
  let ctx = null;
  let masterGain = null;
  let bgmPlaying = false;
  let muted = false;

  function getCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.55;
      masterGain.connect(ctx.destination);
    }
    return ctx;
  }

  /* ── Utility ─────────────────────────────────────────────── */
  function now() { return getCtx().currentTime; }

  function osc(type, freq, start, duration, gainVal, destination) {
    const ac = getCtx();
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(gainVal, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    o.connect(g);
    g.connect(destination || masterGain);
    o.start(start);
    o.stop(start + duration + 0.05);
    return { osc: o, gain: g };
  }

  function noise(start, duration, gainVal, lowFreq, highFreq, destination) {
    const ac = getCtx();
    const bufSize = ac.sampleRate * duration;
    const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    const src = ac.createBufferSource();
    src.buffer = buf;

    const filter = ac.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = (lowFreq + highFreq) / 2;
    filter.Q.value = 2;

    const g = ac.createGain();
    g.gain.setValueAtTime(gainVal, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    src.connect(filter);
    filter.connect(g);
    g.connect(destination || masterGain);
    src.start(start);
    src.stop(start + duration + 0.05);
  }

  /* ── Boot SFX – played once on first interaction ─────────── */
  function playBoot() {
    const t = now();
    // Rising sweep
    const ac = getCtx();
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(80, t);
    o.frequency.exponentialRampToValueAtTime(880, t + 0.6);
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);
    o.connect(g); g.connect(masterGain);
    o.start(t); o.stop(t + 0.7);

    // Confirmation ding
    osc("sine", 1320, t + 0.55, 0.4, 0.12);
    osc("sine", 1760, t + 0.65, 0.3, 0.08);
  }

  /* ── Hover SFX ────────────────────────────────────────────── */
  function playHover(flavor) {
    if (muted) return;
    const t = now();
    const flavors = {
      cta:     () => osc("sine", 660,  t, 0.08, 0.04),
      nav:     () => osc("sine", 880,  t, 0.05, 0.03),
      contact: () => osc("triangle", 540, t, 0.07, 0.035),
      skill:   () => osc("square", 1200, t, 0.04, 0.02),
      stat:    () => osc("sine", 330,  t, 0.06, 0.04),
      pill:    () => osc("sine", 1480, t, 0.03, 0.015),
    };
    (flavors[flavor] || flavors.nav)();
  }

  /* ── Click SFX ────────────────────────────────────────────── */
  function playClick(flavor) {
    if (muted) return;
    const t = now();

    if (flavor === "cta") {
      // Rising laser zap
      const ac = getCtx();
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(220, t);
      o.frequency.exponentialRampToValueAtTime(1760, t + 0.15);
      g.gain.setValueAtTime(0.25, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g); g.connect(masterGain);
      o.start(t); o.stop(t + 0.2);
      osc("sine", 1760, t + 0.12, 0.2, 0.1);
    }

    else if (flavor === "nav") {
      // Soft digital tick
      osc("square", 880, t, 0.06, 0.08);
      osc("square", 1100, t + 0.03, 0.05, 0.06);
    }

    else if (flavor === "contact") {
      // Confirmation chime (three notes)
      osc("sine", 660,  t,        0.3, 0.1);
      osc("sine", 880,  t + 0.08, 0.3, 0.09);
      osc("sine", 1100, t + 0.16, 0.4, 0.08);
    }

    else if (flavor === "skill") {
      // Glitch burst
      noise(t,        0.04, 0.15, 2000, 6000);
      noise(t + 0.05, 0.03, 0.10, 4000, 8000);
      osc("square", 1320, t, 0.05, 0.06);
    }

    else if (flavor === "stat") {
      // Bass tap
      const ac = getCtx();
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(180, t);
      o.frequency.exponentialRampToValueAtTime(60, t + 0.12);
      g.gain.setValueAtTime(0.3, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
      o.connect(g); g.connect(masterGain);
      o.start(t); o.stop(t + 0.18);
    }

    else if (flavor === "pill") {
      // Short blip
      osc("sine", 1760, t, 0.06, 0.04);
      osc("sine", 2200, t + 0.04, 0.04, 0.025);
    }
  }

  /* ═══════════════════════════════════════════════════════════
   *  PROCEDURAL BGM — "Hotham to the Stars"
   *  ──────────────────────────────────────────────────────────
   *  Three layers:
   *    1. Deep pad  – sustained sine clusters (slow attack/release)
   *    2. Arp       – rising pentatonic arpeggios in upper register
   *    3. Bass      – slow pulsing sub-bass
   * ═══════════════════════════════════════════════════════════ */

  let bgmTimerIds = [];

  function startBGM() {
    if (bgmPlaying) return;
    bgmPlaying = true;

    const ac = getCtx();

    /* ── Reverb impulse (simple feedback comb) ─────────────── */
    function makeReverb() {
      const len = ac.sampleRate * 2.5;
      const buf = ac.createBuffer(2, len, ac.sampleRate);
      for (let c = 0; c < 2; c++) {
        const d = buf.getChannelData(c);
        for (let i = 0; i < len; i++)
          d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
      }
      const conv = ac.createConvolver();
      conv.buffer = buf;
      return conv;
    }

    const reverb = makeReverb();
    const reverbGain = ac.createGain();
    reverbGain.gain.value = 0.38;
    reverb.connect(reverbGain);
    reverbGain.connect(masterGain);

    const dryGain = ac.createGain();
    dryGain.gain.value = 0.62;
    dryGain.connect(masterGain);

    /* ── Low-pass filter for warmth ─────────────────────────── */
    const lpf = ac.createBiquadFilter();
    lpf.type = "lowpass";
    lpf.frequency.value = 3400;
    lpf.Q.value = 0.7;
    lpf.connect(dryGain);
    lpf.connect(reverb);

    /* ── Pentatonic scale (A minor penta, octaves 2-5) ──────── */
    const penta = [
      110, 130.81, 164.81, 196, 220,
      261.63, 329.63, 392, 440,
      523.25, 659.25, 784, 880
    ];

    /* ═══════════ LAYER 1 : PAD ═════════════════════════════ */
    function schedulePad(startTime, duration) {
      // Two-note clusters – a 5th apart
      const root = penta[Math.floor(Math.random() * 5)]; // low octave
      const fifth = root * 1.5;
      [root, fifth, root * 2].forEach((f, i) => {
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.type = "sine";
        o.frequency.value = f;
        // Gentle detune for richness
        o.detune.value = (i - 1) * 4;
        const att = 1.2, rel = 1.8;
        g.gain.setValueAtTime(0, startTime);
        g.gain.linearRampToValueAtTime(0.055 - i * 0.01, startTime + att);
        g.gain.setValueAtTime(0.055 - i * 0.01, startTime + duration - rel);
        g.gain.linearRampToValueAtTime(0, startTime + duration);
        o.connect(g); g.connect(lpf);
        o.start(startTime); o.stop(startTime + duration + 0.1);
      });
    }

    /* ═══════════ LAYER 2 : ARPEGGIO ════════════════════════ */
    let arpStep = 0;
    const arpNotes = [440, 523.25, 659.25, 784, 880, 1046.5, 784, 659.25];

    function scheduleArp(startTime) {
      const f = arpNotes[arpStep % arpNotes.length];
      arpStep++;
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = "triangle";
      o.frequency.value = f;
      const dur = 0.18;
      g.gain.setValueAtTime(0, startTime);
      g.gain.linearRampToValueAtTime(0.04, startTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);
      o.connect(g); g.connect(lpf);
      o.start(startTime); o.stop(startTime + dur + 0.05);
    }

    /* ═══════════ LAYER 3 : SUB BASS PULSE ══════════════════ */
    function scheduleBass(startTime) {
      const bassNotes = [55, 65.41, 82.41, 98, 110];
      const f = bassNotes[Math.floor(Math.random() * bassNotes.length)];
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = "sine";
      o.frequency.value = f;
      const dur = 1.8;
      g.gain.setValueAtTime(0, startTime);
      g.gain.linearRampToValueAtTime(0.18, startTime + 0.1);
      g.gain.setValueAtTime(0.18, startTime + dur - 0.3);
      g.gain.linearRampToValueAtTime(0, startTime + dur);
      o.connect(g); g.connect(lpf);
      o.start(startTime); o.stop(startTime + dur + 0.1);
    }

    /* ── Scheduler loop ─────────────────────────────────────── */
    const PAD_INTERVAL  = 5.5;   // seconds between pads
    const ARP_INTERVAL  = 0.22;  // seconds between arp notes
    const BASS_INTERVAL = 2.0;   // seconds between bass pulses
    const LOOKAHEAD     = 2.0;   // schedule this far ahead

    let nextPad  = ac.currentTime + 0.1;
    let nextArp  = ac.currentTime + 0.5;
    let nextBass = ac.currentTime + 0.3;

    function tick() {
      if (!bgmPlaying) return;
      const horizon = ac.currentTime + LOOKAHEAD;

      while (nextPad < horizon) {
        schedulePad(nextPad, PAD_INTERVAL * 1.3);
        nextPad += PAD_INTERVAL;
      }
      while (nextArp < horizon) {
        scheduleArp(nextArp);
        nextArp += ARP_INTERVAL;
      }
      while (nextBass < horizon) {
        scheduleBass(nextBass);
        nextBass += BASS_INTERVAL;
      }

      const id = setTimeout(tick, 100);
      bgmTimerIds.push(id);
    }

    tick();
  }

  function stopBGM() {
    bgmPlaying = false;
    bgmTimerIds.forEach(id => clearTimeout(id));
    bgmTimerIds = [];
  }

  /* ── Mute/unmute ─────────────────────────────────────────── */
  function setMute(val) {
    muted = val;
    if (masterGain) {
      masterGain.gain.cancelScheduledValues(now());
      masterGain.gain.setTargetAtTime(muted ? 0 : 0.55, now(), 0.2);
    }
  }

  /* ── Mute button ─────────────────────────────────────────── */
  function createMuteButton() {
    const btn = document.createElement("button");
    btn.id = "sfx-mute-btn";
    btn.innerHTML = "♪";
    btn.title = "Toggle Sound";
    Object.assign(btn.style, {
      position:     "fixed",
      bottom:       "24px",
      right:        "24px",
      zIndex:       "9999",
      width:        "44px",
      height:       "44px",
      borderRadius: "50%",
      border:       "1px solid rgba(0,245,196,0.4)",
      background:   "rgba(5,5,8,0.85)",
      color:        "#00f5c4",
      fontSize:     "18px",
      cursor:       "pointer",
      backdropFilter: "blur(8px)",
      transition:   "all 0.2s",
      display:      "flex",
      alignItems:   "center",
      justifyContent: "center",
      boxShadow:    "0 0 12px rgba(0,245,196,0.2)",
    });

    btn.addEventListener("mouseenter", () => {
      btn.style.background = "rgba(0,245,196,0.12)";
      btn.style.boxShadow  = "0 0 20px rgba(0,245,196,0.4)";
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.background = "rgba(5,5,8,0.85)";
      btn.style.boxShadow  = "0 0 12px rgba(0,245,196,0.2)";
    });

    btn.addEventListener("click", () => {
      setMute(!muted);
      btn.innerHTML = muted ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
  <ellipse cx="8" cy="18" rx="4" ry="3" stroke="#ff6b6b" stroke-width="1.5" fill="none" opacity="0.5"/>
  <line x1="12" y1="18" x2="12" y2="6" stroke="#ff6b6b" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
  <line x1="12" y1="6" x2="19" y2="8" stroke="#ff6b6b" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
  <line x1="4" y1="4" x2="20" y2="20" stroke="#ff6b6b" stroke-width="1.5" stroke-linecap="round" opacity="0.9"/>
</svg>` : "♪";
btn.style.color = muted ? "#ff6b6b" : "#00f5c4";
btn.style.borderColor = muted ? "rgba(255,107,107,0.4)" : "rgba(0,245,196,0.4)";
btn.style.background = muted ? "rgba(255,107,107,0.06)" : "rgba(5,5,8,0.85)";
    });

    document.body.appendChild(btn);
  }

  /* ── Selector helpers ────────────────────────────────────── */
  function attachSound(selector, hoverFlavor, clickFlavor) {
    document.querySelectorAll(selector).forEach(el => {
      el.addEventListener("mouseenter", () => playHover(hoverFlavor));
      el.addEventListener("click",      () => playClick(clickFlavor));
    });
  }

 /* ── Wire everything once DOM is ready ───────────────────── */
  function init() {
    createMuteButton();

    /* First interaction → boot sound + BGM */
    let booted = false;
    function onFirstTouch() {
      if (booted) return;
      booted = true;
      getCtx();
      ctx.resume().then(() => {
        playBoot();
        setTimeout(startBGM, 800);
      });
      document.removeEventListener("click",     onFirstTouch);
      document.removeEventListener("keydown",   onFirstTouch);
      document.removeEventListener("touchstart",onFirstTouch);
    }
    document.addEventListener("click",     onFirstTouch, { capture: true });
    document.addEventListener("keydown",   onFirstTouch, { capture: true });
    document.addEventListener("touchstart",onFirstTouch, { capture: true });

    /* ── CTA buttons: "View Work" / "Get in Touch" ─────────── */
    attachSound(".btn-outline, .btn-ghost", "cta", "cta");
    /* ── Nav links ─────────────────────────────────────────── */
    attachSound(".nav-links a", "nav", "nav");

    /* ── Contact rows ──────────────────────────────────────── */
    attachSound(".contact-row", "contact", "contact");

    /* ── Skill pills ───────────────────────────────────────── */
    attachSound(".skill-pill", "pill", "skill");

    /* ── Skill blocks (headers) ────────────────────────────── */
    attachSound(".skill-block", "skill", "skill");

    /* ── Stat items ────────────────────────────────────────── */
    attachSound(".stat-item", "stat", "stat");

    /* ── Project rows ──────────────────────────────────────── */
    attachSound(".project-row", "nav", "nav");

    /* ── Nav logo ──────────────────────────────────────────── */
    attachSound(".nav-logo", "cta", "cta");

    /* ── Section headers / links ───────────────────────────── */
    attachSound("a[href]", "nav", "nav");

    console.log(
      "%c♪ Portfolio Sound System loaded. Click anywhere to activate.",
      "color:#00f5c4; font-family:monospace; font-size:13px;"
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();