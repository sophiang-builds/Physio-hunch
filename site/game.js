/*
  Physio Hunch web game. Same rules as the iOS engine (ios/PhysioHunch/Engine):
  deterministic resolver, five assessments, safety flags, verdict and scoring.
  Data comes from the app's JSON so web and iOS always share one case bank.
*/
(async () => {
  const DATA = "ios/PhysioHunch/Resources/Data/";
  const ATLAS = (id) => `assets/characters/pose-atlases/${id}.png`;
  const VIEWS = ["front", "right", "back", "left"];
  // zooms from assets/characters/turn-clips/manifest.json; push-ins centre on the face
  const CAMERA = { front: [1, .97], right: [1.31, .2], back: [.84, .97], left: [1.31, .2] };
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  let A, C;
  try {
    [A, C] = await Promise.all(["assessments.json", "cases.json"].map((f) => fetch(DATA + f).then((r) => r.json())));
  } catch (e) {
    $("situation").textContent = "Couldn't load the cases. Refresh to try again.";
    return;
  }

  // ---------- resolver ----------
  const norm = (s) => { let o = ""; for (const ch of s.toLowerCase()) { if (ch === "’" || ch === "'") o += "'"; else if (/[\p{L}\p{N}]/u.test(ch)) o += ch; else o += " "; } return o.split(" ").filter(Boolean).join(" "); };
  const contains = (a, t) => (" " + t + " ").includes(a.length <= 3 ? ` ${a} ` : ` ${a}`);
  const dist = (a, b) => { a = [...a]; b = [...b]; if (!a.length) return b.length; if (!b.length) return a.length; let p = [...Array(b.length + 1).keys()]; for (let i = 1; i <= a.length; i++) { const c = [i]; for (let j = 1; j <= b.length; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; } return p[b.length]; };
  const fuzzy = (a, t) => { const aw = a.split(" "), w = t.split(" "); if (!aw.every((x) => x.length >= 5)) return false; return aw.every((x) => { const tol = x.length >= 8 ? 2 : 1; return w.some((y) => { if (y.length < x.length - tol) return false; const L = [...new Set([x.length - 1, x.length, x.length + 1].filter((n) => n > 0 && n <= y.length))]; if (!L.length) return dist(x, y) <= tol; return L.some((n) => dist(x, y.slice(0, n)) <= tol); }); }); };
  const score = (al, t) => { const a = norm(al); if (!a) return 0; if (a === t) return 3000 + a.length; if (contains(a, t)) return 2000 + a.length; if (fuzzy(a, t)) return 1000 + a.length; return 0; };
  const resolve = (inp, p) => { const t = norm(inp); if (!t) return null; let b = { s: 0, i: [] }; for (const a of A) { const s = Math.max(...a.aliases.map((x) => score(x, t))); if (s > b.s) b = { s, i: [a] }; else if (s === b.s && s > 0) b.i.push(a); } return b.s ? (b.i.find((a) => p.findings[a.id] != null) || b.i[0]) : null; };
  const any = (ps, inp) => { const t = norm(inp); return ps.some((p) => contains(norm(p), t)); };
  const rng = (seed) => () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const shuffle = (arr, r) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const seedOf = (s, salt) => [...s].reduce((h, c) => (h * 33 + c.charCodeAt(0)) % 2147483647, 5381 + salt);

  // ---------- state ----------
  let ci = 0, st, view = 0, dir = 1, timer = null, clock = null;
  // Daily: 5 tries a day, running total. Stored in this browser only.
  const TRIES = 5, START_TIME = 45, BONUS = 5;
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  let daily = { date: today(), tries: 0, total: 0 };
  try { const saved = JSON.parse(localStorage.getItem("ph-daily") || "null"); if (saved && saved.date === today()) daily = saved; } catch (e) {}
  const saveDaily = () => { try { localStorage.setItem("ph-daily", JSON.stringify(daily)); } catch (e) {} };
  try { ci = (+localStorage.getItem("ph-case") || 0) % C.length; } catch (e) {}
  const has = (id) => st.turns.some((t) => t.a.id === id);
  const hits = () => st.turns.filter((t) => t.finding).length;

  function load(i) {
    ci = i; try { localStorage.setItem("ph-case", i); } catch (e) {}
    st = { p: C[i], limit: 5, turns: [], phase: "assessing", flags: [], time: START_TIME, started: false };
    clearInterval(clock); showTime();
    view = 0; dir = Math.random() < .5 ? 1 : -1; clearInterval(timer);
    document.querySelectorAll(".pose").forEach((el) => (el.style.backgroundImage = `url(${ATLAS(st.p.id)})`));
    // Desktop case file: fill the paper, close the folder, hide the answer.
    $("cfName").textContent = `${st.p.name}, ${st.p.age}`;
    $("cfBackground").textContent = st.p.situation;
    $("cfHistory").textContent = (st.p.given || []).map((id) => st.p.findings[id]).filter(Boolean).join(" ");
    $("cfDiagnosis").textContent = st.p.diagnosis;
    $("cfAnswer").hidden = true;
    setOpen(false);
    $("pose").setAttribute("aria-label", `${st.p.name}, ${st.p.age}`);
    setPose(0); camera(); $("ask").value = ""; $("sheet").hidden = true; render();
  }

  function submit(raw) {
    const text = (raw || "").trim(); if (!text || st.phase === "done" || daily.tries >= TRIES) return; closeMenu();
    if (!st.started) startClock();
    if (st.phase === "calling" || ["i think", "i reckon", "my diagnosis", "diagnosis", "my call"].some((x) => norm(text).startsWith(x))) return call(text);
    const a = resolve(text, st.p);
    if (!a) return toast("Hmm, I don\u2019t know that one. Try something like \u201cwhere does it hurt\u201d.");
    if ((st.p.given || []).includes(a.id)) return toast("That\u2019s already in the background under the patient.");
    if (has(a.id)) return toast("You\u2019ve already checked that. It\u2019s in your list.");
    const t = { n: st.turns.length + 1, a, finding: st.p.findings[a.id] ?? null, flag: null };
    for (const r of st.p.safety) if (r.assessments.includes(a.id) && !r.requires.every(has)) t.flag = r.message;
    st.turns.push(t); if (t.flag && !st.flags.includes(t.flag)) st.flags.push(t.flag);
    if (st.turns.length >= st.limit) st.phase = "calling";
    $("ask").value = ""; render();
    if (t.finding) { turn(); addTime(BONUS); } else addTime(-BONUS);
    if (st.time <= 0) return finish("timeout", "");
    if (st.phase === "calling") $("ask").focus();
    const f = $("findings"); f.scrollTo({ top: f.scrollHeight, behavior: RM ? "auto" : "smooth" });
  }

  function setOpen(open) {
    $("casefile").toggleAttribute("data-open", open);
    $("game").classList.toggle("open", open);
    $("play").setAttribute("aria-expanded", String(open));
  }

  function call(text) {
    finish(any(st.p.answers, text) ? "correct" : any(st.p.close, text) ? "close" : "wrong", text);
  }

  // ---------- clock ----------
  const fmt = (t) => { const v = Math.max(0, Math.ceil(t)); return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, "0")}`; };
  function showTime() {
    document.querySelectorAll(".hud-time-n").forEach((el) => { el.textContent = fmt(st.time); el.classList.toggle("low", st.time <= 10); });
  }
  function startClock() {
    if (st.started || st.phase === "done") return;
    st.started = true; clearInterval(clock);
    let last = performance.now();
    clock = setInterval(() => {
      const now = performance.now(); st.time -= (now - last) / 1000; last = now; showTime();
      if (st.time <= 0) finish("timeout", "");
    }, 100);
  }
  function addTime(sec) {
    st.time = Math.max(0, st.time + sec); showTime();
    document.querySelectorAll(".hud-delta").forEach((el) => {
      el.textContent = (sec > 0 ? "+" : "\u2212") + Math.abs(sec) + "s"; el.className = "hud-delta " + (sec > 0 ? "up" : "down");
      void el.offsetWidth; el.classList.add("show");
    });
  }

  // ---------- end of a case: add the score, then flip to the next patient ----------
  function finish(verdict, text) {
    if (st.phase === "done") return;
    clearInterval(clock); st.phase = "done"; st.verdict = verdict; st.call = text;
    // Fewer checks, more marks: 50 for a right call + 10 per unused check; close is half; -20 per safety flag.
    const unused = st.limit - st.turns.length, full = 50 + 10 * unused;
    let pts = { correct: full, close: Math.floor(full / 2) }[verdict] || 0; pts -= 20 * st.flags.length;
    st.score = Math.max(0, Math.min(100, pts));
    const before = daily.total;
    daily.tries += 1; daily.total += st.score; saveDaily();
    $("cfAnswer").hidden = verdict !== "correct";
    $("ask").value = ""; $("ask").blur(); render();
    countUp(before, daily.total, st.score);
    toast({ correct: `Spot on! +${st.score}`, close: `Close. +${st.score}`, wrong: "Not quite.", timeout: "Time's up." }[verdict] + (daily.tries < TRIES ? " Next patient\u2026" : ""));
    setTimeout(() => {
      if (daily.tries >= TRIES) return showDone();
      nextCase();
    }, verdict === "correct" ? 1900 : 1500);
  }
  function nextCase() {
    const n = (ci + 1) % C.length, desktop = matchMedia("(min-width: 821px)").matches;
    if (!desktop || RM) { load(n); setOpen(true); startClock(); return; }
    setOpen(false);                                   // the cover closes…
    setTimeout(() => { load(n); setTimeout(() => { setOpen(true); startClock(); }, 120); }, 760);   // …and flips open on the next patient
  }
  function countUp(from, to, gain) {
    document.querySelectorAll(".hud-gain").forEach((el) => { el.textContent = gain ? "+" + gain : ""; el.classList.remove("show"); void el.offsetWidth; if (gain) el.classList.add("show"); });
    const els = document.querySelectorAll(".hud-score-n");
    if (RM || from === to) { els.forEach((el) => (el.textContent = to)); return; }
    const t0 = performance.now(), D = 900;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / D), v = Math.round(from + (to - from) * (1 - (1 - k) ** 3));
      els.forEach((el) => (el.textContent = v));
      if (k < 1) requestAnimationFrame(step);
      else els.forEach((el) => { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); });
    };
    requestAnimationFrame(step);
  }
  function showTries() {
    const left = TRIES - daily.tries;
    document.querySelectorAll(".hud-tries").forEach((el) => (el.textContent = left > 0 ? `${left} ${left === 1 ? "try" : "tries"} left today` : "No tries left today"));
    document.querySelectorAll(".hud-score-n").forEach((el) => { if (!el.dataset.init) { el.textContent = daily.total; el.dataset.init = 1; } });
  }
  function showDone() {
    clearInterval(clock); setOpen(false);
    $("doneTotal").textContent = daily.total;
    $("donebox").hidden = false; $("game").classList.add("done");
    showTries();
  }

  // ---------- motion: 16-pose atlas, quarter turn per finding ----------
  function setPose(i) { document.querySelectorAll(".pose").forEach((el) => (el.style.backgroundPosition = `${(i % 4) * 100 / 3}% ${Math.floor(i / 4) * 100 / 3}%`)); }
  function camera(v = view) { const [z, a] = CAMERA[VIEWS[v]]; $("cam").style.transformOrigin = `50% ${a * 100}%`; $("cam").style.transform = `scale(${z})`; }
  function turn() {
    const start = view, target = (view + dir + 4) % 4; camera(target); view = target;
    if (RM) { setPose(target * 4); return; }
    let step = 0; clearInterval(timer);
    const next = () => setPose((start * 4 + dir * ++step + 16) % 16);
    setTimeout(() => { next(); timer = setInterval(() => { next(); if (step >= 4) clearInterval(timer); }, 160); }, 80);
  }

  // ---------- view ----------
  function render() {
    const p = st.p, reveal = st.phase === "done" ? 1 : hits() / st.limit, assessing = st.phase === "assessing";
    $("bloom").style.background = `linear-gradient(135deg,${p.palette.join(",")})`; $("bloom").style.opacity = reveal;
    $("situation").textContent = p.situation;
    $("history").textContent = (p.given || []).map((id) => p.findings[id]).filter(Boolean).join(" ");
    $("who").textContent = `${p.name}, ${p.age}`;
    $("dots").innerHTML = Array.from({ length: st.limit }, (_, i) => { const t = st.turns[i]; return `<i class="${t ? (t.finding ? "hit" : "miss") : ""}"></i>`; }).join("");
    $("dots").setAttribute("aria-label", `${st.limit - st.turns.length} of ${st.limit} assessments left`);
    $("findings").innerHTML = st.turns.map((t) => `<li class="card ${t.finding ? "hit" : "miss"}"><h4>${t.n}. ${esc(t.a.name)}</h4><p>${esc(t.finding || "No response.")}</p>${t.flag ? `<p class="flag">⚠ ${esc(t.flag)}</p>` : ""}</li>`).join("");
    $("ask").placeholder = assessing ? `What would you check on ${p.name}?` : `What do you think is wrong with ${p.name}?`;
    $("ask").setAttribute("aria-label", assessing ? "Assessment" : "Diagnosis");
    $("go").textContent = assessing ? "Assess" : "Make your call"; $("go").disabled = !$("ask").value.trim();
    $("callNow").disabled = !assessing;
    showTries();
  }

  function toast(m) { const t = $("toast"); t.textContent = m; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => (t.hidden = true), 2600); }
  function openSheet(html) { $("sheetBody").innerHTML = html; $("sheet").hidden = false; $("sheetBody").querySelector("button")?.focus(); }

  function howTo() {
    closeMenu();
    openSheet(`<div class="body"><h2 id="sheetTitle">How to play</h2><ol class="steps" style="margin-top:16px">
      <li><b>1</b><span>Read why the patient has come in.</span></li>
      <li><b>2</b><span>You get five chances to check them. Type what you want to check, like \u201cwhere does it hurt\u201d or \u201creflexes\u201d. Good checks give you a clue and the patient turns around. Unhelpful ones give you nothing.</span></li>
      <li><b>3</b><span>When you think you know, open the arrow next to Assess, choose \u201cMake your call now\u201d and type what you think is wrong.</span></li>
      <li><b>4</b><span>You've got 45 seconds. A useful check adds 5 seconds, an unhelpful one takes 5 away. The fewer checks you need, the more points you get, and you get five patients a day.</span></li></ol></div>
      <button class="go" id="gotit">Got it</button>`);
    $("gotit").onclick = () => ($("sheet").hidden = true);
  }

  // ---------- events ----------
  const menu = $("menu"), more = $("more");
  function closeMenu() { menu.hidden = true; more.setAttribute("aria-expanded", "false"); }
  more.onclick = () => { const open = menu.hidden; menu.hidden = !open; more.setAttribute("aria-expanded", open); };
  document.addEventListener("click", (e) => { if (!menu.hidden && !e.target.closest(".row")) closeMenu(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeMenu(); if (st.phase !== "done") $("sheet").hidden = true; } });
  $("callNow").onclick = () => { closeMenu(); if (st.phase === "assessing") { st.phase = "calling"; render(); $("ask").focus(); } };
  $("howTo").onclick = howTo;
  $("play").onclick = () => { if (daily.tries >= TRIES) return showDone(); setOpen(true); setTimeout(() => { startClock(); $("ask").focus({ preventScroll: true }); }, RM ? 0 : 720); };
  $("sheet").addEventListener("click", (e) => { if (e.target === $("sheet") && st.phase !== "done") $("sheet").hidden = true; });
  $("dock").addEventListener("submit", (e) => { e.preventDefault(); submit($("ask").value); });
  $("ask").addEventListener("input", () => ($("go").disabled = !$("ask").value.trim()));
  $("ask").addEventListener("focus", () => $("game").classList.add("typing"));
  $("ask").addEventListener("blur", () => setTimeout(() => $("game").classList.remove("typing"), 80));

  load(ci);
  showTries();
  if (daily.tries >= TRIES) showDone();
})();
