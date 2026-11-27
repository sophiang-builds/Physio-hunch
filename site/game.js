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
  let ci = 0, st, view = 0, dir = 1, timer = null;
  try { ci = (+localStorage.getItem("ph-case") || 0) % C.length; } catch (e) {}
  const has = (id) => st.turns.some((t) => t.a.id === id);
  const hits = () => st.turns.filter((t) => t.finding).length;

  function suggestions() {
    const r = rng(seedOf(st.p.id, st.turns.length)), open = A.filter((a) => !has(a.id));
    const rel = shuffle(open.filter((a) => st.p.findings[a.id] != null), r).slice(0, 2);
    const oth = shuffle(open.filter((a) => st.p.findings[a.id] == null), r).slice(0, 6 - rel.length);
    return shuffle(rel.concat(oth), r);
  }

  function load(i) {
    ci = i; try { localStorage.setItem("ph-case", i); } catch (e) {}
    st = { p: C[i], limit: 5, turns: [], phase: "assessing", flags: [] };
    view = 0; dir = Math.random() < .5 ? 1 : -1; clearInterval(timer);
    $("pose").style.backgroundImage = `url(${ATLAS(st.p.id)})`;
    $("pose").setAttribute("aria-label", `${st.p.name}, ${st.p.age}`);
    setPose(0); camera(); $("ask").value = ""; $("sheet").hidden = true; render();
  }

  function submit(raw) {
    const text = (raw || "").trim(); if (!text || st.phase === "done") return; closeMenu();
    if (st.phase === "calling" || ["i think", "i reckon", "my diagnosis", "diagnosis", "my call"].some((x) => norm(text).startsWith(x))) return call(text);
    const a = resolve(text, st.p);
    if (!a) return toast("Not a test I know. Try a suggestion above.");
    if (has(a.id)) return toast("Already done. Its finding is in your list.");
    const t = { n: st.turns.length + 1, a, finding: st.p.findings[a.id] ?? null, flag: null };
    for (const r of st.p.safety) if (r.assessments.includes(a.id) && !r.requires.every(has)) t.flag = r.message;
    st.turns.push(t); if (t.flag && !st.flags.includes(t.flag)) st.flags.push(t.flag);
    if (st.turns.length >= st.limit) st.phase = "calling";
    $("ask").value = ""; render(); if (t.finding) turn();
    if (st.phase === "calling") $("ask").focus();
    const f = $("findings"); f.scrollTo({ top: f.scrollHeight, behavior: RM ? "auto" : "smooth" });
  }

  function call(text) {
    st.call = text; st.verdict = any(st.p.answers, text) ? "correct" : any(st.p.close, text) ? "close" : "wrong"; st.phase = "done";
    let pts = { correct: 60, close: 30 }[st.verdict] || 0; pts += 8 * st.p.key.filter(has).length; pts -= 20 * st.flags.length;
    st.score = Math.max(0, Math.min(100, pts)); $("ask").value = ""; $("ask").blur(); render(); setTimeout(result, 500);
  }

  // ---------- motion: 16-pose atlas, quarter turn per finding ----------
  function setPose(i) { $("pose").style.backgroundPosition = `${(i % 4) * 100 / 3}% ${Math.floor(i / 4) * 100 / 3}%`; }
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
    $("dots").innerHTML = Array.from({ length: st.limit }, (_, i) => { const t = st.turns[i]; return `<i class="${t ? (t.finding ? "hit" : "miss") : ""}"></i>`; }).join("");
    $("dots").setAttribute("aria-label", `${st.limit - st.turns.length} of ${st.limit} assessments left`);
    $("findings").innerHTML = st.turns.map((t) => `<li class="card ${t.finding ? "hit" : "miss"}"><h4>${t.n}. ${esc(t.a.name)}</h4><p>${esc(t.finding || "No response.")}</p>${t.flag ? `<p class="flag">⚠ ${esc(t.flag)}</p>` : ""}</li>`).join("");
    $("chips").hidden = !assessing;
    if (assessing) $("chips").innerHTML = suggestions().map((a) => `<button type="button" class="chip glass" data-t="${esc(a.name)}">${esc(a.name)}</button>`).join("");
    $("ask").placeholder = assessing ? `What test would you give ${p.name}?` : `What’s wrong with ${p.name}?`;
    $("ask").setAttribute("aria-label", assessing ? "Assessment" : "Diagnosis");
    $("go").textContent = assessing ? "Assess" : "Make your call"; $("go").disabled = !$("ask").value.trim();
    $("callNow").disabled = !assessing;
  }

  function toast(m) { const t = $("toast"); t.textContent = m; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => (t.hidden = true), 2600); }
  function openSheet(html) { $("sheetBody").innerHTML = html; $("sheet").hidden = false; $("sheetBody").querySelector("button")?.focus(); }

  function result() {
    const p = st.p, v = { correct: ["Spot on", "#543C86"], close: ["Close", "#24203C"], wrong: ["Not quite", "#9A3D38"] }[st.verdict];
    openSheet(`<div class="body">
      <div class="head"><h2 id="sheetTitle" style="color:${v[1]}">${v[0]}</h2><b>${st.score} pts</b></div>
      <p style="color:var(--muted)">Your call: “${esc(st.call)}”</p>
      <h5>It was</h5><p style="font-weight:700;font-size:17px">${esc(p.diagnosis)}</p>
      ${st.flags.length ? `<h5>Safety</h5>${st.flags.map((f) => `<p style="color:var(--safety);font-weight:700;font-size:14px">⚠ ${esc(f)}</p>`).join("")}` : ""}
      <h5>What was going on</h5><p>${esc(p.story)}</p>
      <h5>Most telling tests</h5><div class="keys">${p.key.map((id) => `<span style="color:${has(id) ? "#543C86" : "#5D586C"}">${has(id) ? "✓" : "○"} ${esc(A.find((a) => a.id === id).name)}</span>`).join("")}</div>
    </div><button class="go" id="next">Next patient</button>`);
    $("next").onclick = () => load((ci + 1) % C.length);
  }

  function howTo() {
    closeMenu();
    openSheet(`<div class="body"><h2 id="sheetTitle">How to play</h2><ol class="steps" style="margin-top:16px">
      <li><b>1</b><span>Read why the patient is here.</span></li>
      <li><b>2</b><span>Tap a suggested test, or type one. You get five. A useful test reveals a finding and the patient turns. A useless one gets no response.</span></li>
      <li><b>3</b><span>Open the arrow next to Assess and choose “Make your call now” when you're ready, or after your fifth test. Type what you think is wrong.</span></li>
      <li><b>4</b><span>The debrief shows what was really going on and which tests mattered most.</span></li></ol></div>
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
  $("nextCase").onclick = () => { closeMenu(); load((ci + 1) % C.length); };
  $("sheet").addEventListener("click", (e) => { if (e.target === $("sheet") && st.phase !== "done") $("sheet").hidden = true; });
  $("chips").addEventListener("click", (e) => { const b = e.target.closest("[data-t]"); if (b) submit(b.dataset.t); });
  $("dock").addEventListener("submit", (e) => { e.preventDefault(); submit($("ask").value); });
  $("ask").addEventListener("input", () => ($("go").disabled = !$("ask").value.trim()));
  $("ask").addEventListener("focus", () => $("game").classList.add("typing"));
  $("ask").addEventListener("blur", () => setTimeout(() => $("game").classList.remove("typing"), 80));

  load(ci);
})();
