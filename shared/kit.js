/* Shared shell for WigglePlay games: settings screen, camera preview, movement detection,
   start / pause / end, session timer, sound helpers and the end-of-session summary.

   A game calls createGame({...}) with:
     name, intro            text for the settings screen
     credit                 optional HTML line shown under the settings
     columns                optional number: also detect movement in this many side-by-side columns
     settings               optional list of { id, label, type: "select" | "checkbox", options, value, hint }
     background             CSS colour of the play screen
     onStart(api)           build the scene inside api.stage
     onFrame(api, dt, now)  called every frame while playing
     onAction(api)          optional: Space, Enter or a switch was pressed
     onPointer(api, x, y, target)  optional: the screen was touched or clicked
     summary(api)           returns [{ n, label }] for the end screen

     choose                 true for games where the child picks between things on screen (see below)

   api gives: stage, active (movement right now), cols[] (movement per column, left to right on screen),
   setting(id), note(freq, opts), pop(), tune(kind), say(text), hint(text), width, height

   Choosing: call api.setTargets([{ el, pick, tall }]) with the things that can be picked.
   Every target can be picked four ways:
     - camera: a ring follows the child's movement; holding it on a target fills the ring, then picks it
       (tall: true makes the whole column above and below the target count)
     - touch or click
     - keyboard: arrow keys move a dashed outline, Space or Enter picks
     - one switch: with "One-switch scanning" on, the outline steps along by itself and the switch picks
   Set api.busy = true to ignore picks for a moment (for example while a tune plays). */
import "./motion.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function createGame(cfg) {
  const NC = cfg.columns || 0;
  document.title = cfg.name + " - WigglePlay";
  const custom = (cfg.settings || []).map((s) => {
    if (s.type === "checkbox") return `<label class="check"><input type="checkbox" id="set-${s.id}" ${s.value ? "checked" : ""}> ${esc(s.label)}</label>` + (s.hint ? `<div class="hint">${esc(s.hint)}</div>` : "");
    return `<label for="set-${s.id}">${esc(s.label)}</label><select id="set-${s.id}">` +
      s.options.map((o) => `<option value="${esc(o[0])}" ${String(o[0]) === String(s.value) ? "selected" : ""}>${esc(o[1])}</option>`).join("") +
      `</select>` + (s.hint ? `<div class="hint">${esc(s.hint)}</div>` : "");
  }).join("");
  const chooseSettings = !cfg.choose ? "" : `<label for="set-dwell">Hold time to choose</label><select id="set-dwell">
      <option value="1">1 second</option><option value="1.5" selected>1.5 seconds</option><option value="2.5">2.5 seconds</option></select>
    <div class="hint">Move so the ring sits on a choice, then hold it there.</div>
    <label class="check"><input type="checkbox" id="set-scan"> One-switch scanning</label>
    <div class="hint">The outline steps from choice to choice. Press the switch or Space to pick.</div>`;
  let lines = "";
  for (let i = 1; i < NC; i++) lines += `<div class="colline" style="left:${(100 * i / NC).toFixed(2)}%"></div>`;

  document.getElementById("app").innerHTML = `
  <div id="setup">
    <p style="margin:0 0 10px"><a href="../../">&larr; All games</a></p>
    <h1>${esc(cfg.name)}</h1>
    <p class="sub">${esc(cfg.intro)} Video stays on this device and is never saved.</p>
    <div class="grid">
      <div>
        <div class="camwrap"><video id="video" autoplay playsinline muted></video>${NC ? lines : '<div class="zone"></div>'}</div>
        <div class="barwrap"><div class="bar" id="bar"></div><div class="mark" id="mark"></div></div>
        <div class="hint">Green bar = movement now. White line = how much movement is needed.</div>
        <button class="ghost" id="calBtn">Calibrate at rest (10 s)</button>
        <div id="msg"></div>
      </div>
      <div>
        <label for="sens">Movement needed</label>
        <input type="range" id="sens" min="0" max="100" value="45">
        <div class="hint">Left = tiny movements count. Right = bigger movements needed.</div>
        ${custom}
        ${chooseSettings}
        <label for="vol">Maximum volume</label>
        <input type="range" id="vol" min="0" max="100" value="50">
        <label for="len">Session length</label>
        <select id="len">
          <option value="2">2 minutes</option><option value="3" selected>3 minutes</option>
          <option value="5">5 minutes</option><option value="10">10 minutes</option>
        </select>
        <button class="main" id="startBtn">Start</button>
        <div class="hint">${cfg.choose ? "Touch and arrow keys with Space also work. Esc pauses." : "Touching the screen, the Space key or a switch also plays. Esc pauses."}</div>
      </div>
    </div>
    ${cfg.credit ? `<p class="credit">${cfg.credit}</p>` : ""}
  </div>
  <div id="play">
    <div id="stage"></div>
    <div id="status"></div>
    <div id="hint"></div>
    <div id="cursor"><div id="cursorFill"></div></div>
    <button class="ghost" id="endBtn">End session</button>
    <button id="pauseBtn">Pause</button>
  </div>
  <div id="summary">
    <h1>Session finished</h1>
    <div class="row" id="sumRow"></div>
    <button class="main" id="againBtn" style="max-width:320px">Back to settings</button>
  </div>`;

  const $ = (id) => document.getElementById(id);
  const video = $("video");
  if (cfg.choose) $("hint").style.top = "50px";      // prompts sit in a band above the choices
  const motion = window.CameraMotion(video, { onError: (m) => { $("msg").textContent = m; }, columns: NC });
  const BAR_MAX = 12;
  let mode = "setup", score = 0, above = 0, colAbove = new Array(NC).fill(0);
  let lastT = performance.now(), lastProc = 0, cal = null, sessionEnd = 0, pausedLeft = 0, audio = null, wake = null;

  const threshold = () => 0.3 * Math.pow(10 / 0.3, $("sens").value / 100);        // 0.3% to 10% of pixels
  const setThreshold = (pct) => { $("sens").value = Math.round(Math.max(0, Math.min(1, Math.log(pct / 0.3) / Math.log(10 / 0.3))) * 100); };

  // ---------- sound (generated, no files) ----------
  function initAudio() {
    if (audio) { audio.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC(), master = ctx.createGain(), lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 2200;
    lp.connect(master); master.connect(ctx.destination);
    audio = { ctx, master, lp };
    setVolume();
  }
  function setVolume() { if (audio) audio.master.gain.value = 0.9 * ($("vol").value / 100); }
  function note(freq, o) {
    if (!audio) return;
    o = o || {};
    const t = audio.ctx.currentTime + (o.when || 0), osc = audio.ctx.createOscillator(), g = audio.ctx.createGain(), len = o.len || 1.2;
    osc.type = o.type || "triangle"; osc.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(o.peak || 0.15, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    osc.connect(g); g.connect(audio.lp); osc.start(t); osc.stop(t + len + 0.05);
  }
  function pop() {                       // a soft "pop": short burst of filtered noise plus a falling tone
    if (!audio) return;
    const ctx = audio.ctx, t = ctx.currentTime, n = Math.floor(ctx.sampleRate * 0.12);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.5);
    const src = ctx.createBufferSource(), g = ctx.createGain(), bp = ctx.createBiquadFilter();
    src.buffer = buf; bp.type = "bandpass"; bp.frequency.value = 900; bp.Q.value = 0.7; g.gain.value = 0.35;
    src.connect(bp); bp.connect(g); g.connect(audio.master); src.start(t);
    const osc = ctx.createOscillator(), og = ctx.createGain();
    osc.type = "sine"; osc.frequency.setValueAtTime(520, t); osc.frequency.exponentialRampToValueAtTime(180, t + 0.14);
    og.gain.setValueAtTime(0.18, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(og); og.connect(audio.master); osc.start(t); osc.stop(t + 0.2);
  }

  function tune(kind) {
    if (kind === "yes") { note(523.25, { peak: 0.15 }); note(659.25, { when: 0.16, peak: 0.15 }); note(783.99, { when: 0.32, peak: 0.17, len: 1.6 }); }
    else if (kind === "win") { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(f, { when: i * 0.16, peak: 0.16, len: 1.8 })); note(783.99, { when: 0.8, peak: 0.12, len: 2.2 }); }
    else if (kind === "no") { note(261.63, { peak: 0.10, len: 0.7, type: "sine" }); note(233.08, { when: 0.2, peak: 0.10, len: 0.9, type: "sine" }); }
    else if (kind === "tick") note(659.25, { peak: 0.08, len: 0.3 });
  }
  function say(text) {                   // spoken words, where the device has a voice
    try {
      if (!("speechSynthesis" in window)) return;
      const u = new SpeechSynthesisUtterance(String(text));
      u.volume = Math.min(1, $("vol").value / 100 + 0.2); u.rate = 0.85;
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
    } catch (e) {}
  }

  let timers = [];
  function runTimers(dt) {
    const due = [];
    timers = timers.filter((x) => { x.t -= dt; if (x.t <= 0) { due.push(x); return false; } return true; });
    due.forEach((x) => x.fn());
  }

  // ---------- choosing between targets ----------
  let targets = [], hi = -1, dwellOn = null, dwellT = 0, mustLeave = null, armed = false, scanT = 0;
  const cur = { x: 0.5, y: 0.5, seen: false };
  function clearMarks() { targets.forEach((t) => { t.el.classList.remove("wp-on", "wp-hi"); t.el.style.removeProperty("--dwell"); }); }
  function setTargets(list) {
    clearMarks();
    targets = list || []; hi = -1; dwellOn = null; dwellT = 0; mustLeave = null; armed = false; scanT = 0;
    targets.forEach((t) => t.el.classList.add("wp-target"));
  }
  function doPick(t) {
    if (!t || api.busy || mode !== "play") return;
    dwellT = 0; dwellOn = null; mustLeave = t.el; armed = false; scanT = 0;
    t.el.classList.remove("wp-on"); t.el.style.removeProperty("--dwell");
    t.pick(t);
  }
  function setHi(i) {
    if (hi >= 0 && targets[hi]) targets[hi].el.classList.remove("wp-hi");
    hi = i;
    if (hi >= 0 && targets[hi]) targets[hi].el.classList.add("wp-hi");
  }
  function chooseFrame(dt) {
    const need = Math.max(0.25, threshold() * 0.35), pt = motion.point, c = $("cursor");
    if (pt.n > need) {
      const tx = Math.max(0.02, Math.min(0.98, 0.5 + (pt.x - 0.5) * 1.35)), ty = Math.max(0.04, Math.min(0.96, 0.5 + (pt.y - 0.5) * 1.35));
      if (!cur.seen) { cur.x = tx; cur.y = ty; cur.seen = true; }
      cur.x += (tx - cur.x) * Math.min(1, dt * 9); cur.y += (ty - cur.y) * Math.min(1, dt * 9);
      armed = true;
    }
    c.style.display = cur.seen && targets.length ? "block" : "none";
    const px = cur.x * api.width, py = cur.y * api.height;
    c.style.transform = `translate(${px - 24}px, ${py - 24}px)`;
    let found = null;
    if (cur.seen && armed && !api.busy) {
      for (const t of targets) {
        const r = t.el.getBoundingClientRect(), m = 10;
        if (px >= r.left - m && px <= r.right + m && (t.tall || (py >= r.top - m && py <= r.bottom + m))) { found = t; break; }
      }
      // a row of tall choices shares out the whole width, so the ring is always on one of them
      if (!found && targets.length && targets.every((t) => t.tall)) {
        let best = 1e9;
        for (const t of targets) { const r = t.el.getBoundingClientRect(), d = Math.abs(px - (r.left + r.width / 2)); if (d < best) { best = d; found = t; } }
      }
    }
    if (mustLeave && (!found || found.el !== mustLeave)) mustLeave = null;
    if (found && found.el === mustLeave) found = null;
    if (found !== dwellOn) {
      if (dwellOn) { dwellOn.el.classList.remove("wp-on"); dwellOn.el.style.removeProperty("--dwell"); }
      dwellOn = found; dwellT = 0;
      if (found) found.el.classList.add("wp-on");
    }
    let k = 0;
    if (dwellOn) {
      dwellT += dt; k = Math.min(1, dwellT / (+api.setting("dwell")));
      dwellOn.el.style.setProperty("--dwell", k.toFixed(3));
      if (k >= 1) doPick(dwellOn);
    }
    $("cursorFill").style.transform = `scale(${k.toFixed(3)})`;
    if (targets.length && api.setting("scan") && !api.busy) {
      scanT += dt;
      if (scanT > 1.8 || hi < 0) { scanT = 0; setHi((hi + 1) % targets.length); }
    }
  }

  const api = {
    stage: $("stage"), active: false, cols: new Array(NC).fill(false), width: 0, height: 0, busy: false,
    setting: (id) => { const el = $("set-" + id); return el.type === "checkbox" ? el.checked : el.value; },
    note, pop, tune, say, setTargets,
    later: (seconds, fn) => { timers.push({ t: seconds, fn }); },      // like setTimeout, but it stops while paused
    hint: (text) => { $("hint").textContent = text || ""; }
  };

  function bars() {
    const thr = threshold(), shown = NC ? Math.max.apply(null, motion.cols) : score;
    $("bar").style.width = Math.min(100, 100 * shown / BAR_MAX) + "%";
    $("bar").classList.toggle("over", shown > thr);
    $("mark").style.left = Math.min(100, 100 * thr / BAR_MAX) + "%";
  }

  function loop(now) {
    const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
    if (now - lastProc > 33) {
      lastProc = now; score = motion.measure();
      const thr = threshold();
      above = score > thr ? above + 1 : 0;
      for (let c = 0; c < NC; c++) colAbove[c] = motion.cols[c] > thr ? colAbove[c] + 1 : 0;
    }
    if (cal) {
      cal.max = Math.max(cal.max, score, NC ? Math.max.apply(null, motion.cols) : 0);
      const left = Math.ceil((cal.end - now) / 1000);
      if (left <= 0) { setThreshold(Math.max(0.3, cal.max * 1.4 + 0.2)); $("msg").textContent = "Calibrated."; cal = null; }
      else $("msg").textContent = "Measuring resting movement... " + left + " s";
    }
    if (mode === "setup") bars();
    if (mode === "play") {
      api.active = above >= 3 || colAbove.some((c) => c >= 3);
      for (let c = 0; c < NC; c++) api.cols[c] = colAbove[c] >= 3;
      api.width = window.innerWidth; api.height = window.innerHeight;
      runTimers(dt);
      if (cfg.choose) chooseFrame(dt);
      if (cfg.onFrame) cfg.onFrame(api, dt, now);
      const left = Math.max(0, sessionEnd - now);
      $("status").textContent = Math.floor(left / 60000) + ":" + ("0" + Math.floor(left / 1000) % 60).slice(-2) + " left";
      if (left <= 0) finish();
    }
    requestAnimationFrame(loop);
  }

  function keepAwake() { if ("wakeLock" in navigator) navigator.wakeLock.request("screen").then((w) => { wake = w; }).catch(() => {}); }
  function letSleep() { if (wake) { try { wake.release(); } catch (e) {} wake = null; } }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && (mode === "play" || mode === "paused")) keepAwake();
  });

  function start() {
    initAudio(); setVolume(); keepAwake();
    api.stage.innerHTML = ""; api.hint(""); api.busy = false; setTargets([]); cur.seen = false; timers = [];
    $("play").style.background = cfg.background || "#10131c";
    $("summary").style.display = "none"; $("play").style.display = "block";
    document.body.style.overflow = "hidden"; window.scrollTo(0, 0);
    api.width = window.innerWidth; api.height = window.innerHeight; above = 0; colAbove.fill(0);
    sessionEnd = performance.now() + (+$("len").value) * 60000;
    $("pauseBtn").textContent = "Pause";
    cfg.onStart(api);
    mode = "play";
    if (video.paused) { const p = video.play(); if (p && p.catch) p.catch(() => {}); }
    try { const p = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
  }
  function togglePause() {
    if (mode === "play") { mode = "paused"; pausedLeft = sessionEnd - performance.now(); $("pauseBtn").textContent = "Resume"; $("status").textContent = "Paused"; }
    else if (mode === "paused") { sessionEnd = performance.now() + pausedLeft; above = 0; colAbove.fill(0); mode = "play"; $("pauseBtn").textContent = "Pause"; }
  }
  function finish() {
    mode = "done"; letSleep();
    $("sumRow").innerHTML = cfg.summary(api).map((r) => `<p><span class="n">${esc(r.n)}</span><br>${esc(r.label)}</p>`).join("");
    $("play").style.display = "none"; $("summary").style.display = "block";
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
  }

  $("startBtn").onclick = start;
  $("pauseBtn").onclick = togglePause;
  $("endBtn").onclick = () => { if (mode === "play" || mode === "paused") finish(); };
  $("againBtn").onclick = () => { mode = "setup"; $("summary").style.display = "none"; document.body.style.overflow = ""; };
  $("calBtn").onclick = () => { cal = { end: performance.now() + 10000, max: 0 }; };
  $("vol").oninput = setVolume;
  api.stage.addEventListener("pointerdown", (e) => {
    if (mode !== "play") return;
    const t = targets.find((x) => x.el === e.target || x.el.contains(e.target));
    if (t) { doPick(t); mustLeave = null; return; }
    if (cfg.onPointer) cfg.onPointer(api, e.clientX, e.clientY, e.target);
  });
  document.addEventListener("keydown", (e) => {
    if (mode !== "play" && mode !== "paused") return;
    if (e.code === "Escape" || e.code === "KeyP") { e.preventDefault(); togglePause(); }
    else if (mode === "play" && targets.length && ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Tab"].includes(e.code)) {
      e.preventDefault(); scanT = 0;
      const back = e.code === "ArrowLeft" || e.code === "ArrowUp" || (e.code === "Tab" && e.shiftKey);
      setHi(hi < 0 ? 0 : (hi + (back ? targets.length - 1 : 1)) % targets.length);
    }
    else if ((e.code === "Space" || e.code === "Enter") && mode === "play" && !e.repeat && document.activeElement !== $("pauseBtn") && document.activeElement !== $("endBtn")) {
      e.preventDefault();
      if (targets.length) { if (hi >= 0 && targets[hi]) { const t = targets[hi]; doPick(t); mustLeave = null; } }
      else if (cfg.onAction) cfg.onAction(api);
    } else if (mode === "play" && cfg.onKey) cfg.onKey(api, e);
  });
  window.__kit = () => ({ mode, score, cols: motion.cols.slice(), active: api.active, colsActive: api.cols.slice(), cursor: { x: cur.x, y: cur.y, seen: cur.seen }, targets: targets.length, hi, busy: api.busy });   // for automated checks

  if ("serviceWorker" in navigator) navigator.serviceWorker.register(new URL("../sw.js", import.meta.url)).catch(() => {});
  motion.start();
  requestAnimationFrame(loop);
  return api;
}
