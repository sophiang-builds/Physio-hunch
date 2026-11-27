(function () {
  const $ = (s) => document.querySelector(s);
  const CONSENT_IDS = ["consent", "consent_touch"];
  const CAT_NAMES = { intro: "Introduction and consent", subjective: "History", redflag: "Safety and red flags", objective: "Physical examination", reasoning: "Clinical reasoning" };
  const FALLBACK = ["Sorry, I'm not sure what you mean.", "Hmm, could you ask that another way?", "I don't really know how to answer that.", "Sorry, what do you mean?"];
  const NORMAL_TEST = ["(Nothing remarkable on that test.)", "(That's within normal limits.)", "(No significant finding there.)"];

  let S = null; // session state

  // ---------- matching ----------
  const norm = (t) => " " + t.toLowerCase().replace(/[‘’]/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim() + " ";
  const esc = (s) => s.replace(/[.*+?^${}()[\]\\]/g, "\\$&");
  function compile(m) {
    return [].concat(m).map((p) => p.split("&").map((g) => new RegExp("(?:^|[^a-z0-9])(?:" + g.split("|").map((t) => { t = t.trim(); return esc(t) + (t.length <= 3 ? "(?![a-z0-9])" : ""); }).join("|") + ")")));
  }
  function score(item, text) {
    let best = 0;
    for (const groups of item._re) if (groups.every((r) => r.test(text))) best = Math.max(best, groups.length);
    return best;
  }
  function prep(list) { list.forEach((f) => { f._re = compile(f.m); }); return list; }

  // ---------- session ----------
  function start(mode, kase) {
    const intro = mode === "exam" ? window.INTRO.map((f) => Object.assign({}, f)) : [];
    const items = prep(intro.concat(kase.findings.map((f) => Object.assign({}, f))));
    S = { mode, kase, items, hazards: prep((kase.hazards || []).map((h) => Object.assign({}, h))), found: new Set(), flags: [], warned: new Set(), done: false, n: 0 };
    S.total = items.reduce((a, f) => a + f.w, 0);
    $("#portrait").innerHTML = window.renderCharacter(kase.look);
    show("game");
    setProgress();
    say(null, kase.brief, true);
    setTimeout(() => { if (S && S.n === 0) say(null, kase.greet); }, 1600);
    $("#ask").value = "";
    $("#ask").focus();
  }

  function fill(t) {
    return t.replace("{fullName}", S.kase.fullName).replace("{dob}", S.kase.dob).replace("{clothingReply}", S.kase.clothingReply);
  }

  function respond(raw) {
    const text = norm(raw);
    if (/^ (end|finish|done|end session|finish session) $/.test(text)) return finish();
    if (/^ (hint|help) $/.test(text)) return hint();
    S.n++;

    // hazards first
    for (const h of S.hazards) {
      if (score(h, text) && !h.unless.every((id) => S.found.has(id))) {
        if (!S.flags.includes(h.flag)) S.flags.push(h.flag);
        return reply(raw, h.reply, "warn");
      }
    }

    const hits = S.items.map((f) => ({ f, s: score(f, text) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s || b.f.w - a.f.w);
    const fresh = hits.filter((x) => !S.found.has(x.f.id));

    // consent findings in the same message count before any test
    fresh.filter((x) => CONSENT_IDS.includes(x.f.id)).forEach((x) => S.found.add(x.f.id));
    const consented = CONSENT_IDS.some((id) => S.found.has(id));

    let picks = fresh.filter((x) => CONSENT_IDS.includes(x.f.id)).concat(fresh.filter((x) => !CONSENT_IDS.includes(x.f.id)).slice(0, 1));
    if (S.mode === "exam" && !consented && picks.some((x) => x.f.cat === "objective")) {
      const flag = "Started a physical examination without gaining consent.";
      if (!S.flags.includes(flag)) S.flags.push(flag);
      picks = picks.filter((x) => x.f.cat !== "objective");
      if (!picks.length) return reply(raw, "Sorry, before you start, what exactly are you going to do? I wasn't asked about that.", "warn");
    }

    if (picks.length) {
      picks.forEach((x) => S.found.add(x.f.id));
      setProgress();
      reply(raw, picks.map((x) => fill(x.f.reply)).join(" "), "good");
      if (S.found.size && progress() >= 1) setTimeout(finish, 2600);
      return;
    }
    if (hits.length) return reply(raw, "Like I said, " + lower(fill(hits[0].f.reply)), "");
    if (/(^| )(test|check|assess|examin|measure|palpat|look at|feel)/.test(text)) {
      if (S.mode === "exam" && !consented) {
        const flag = "Started a physical examination without gaining consent.";
        if (!S.flags.includes(flag)) S.flags.push(flag);
        return reply(raw, "Sorry, before you start, what exactly are you going to do? I wasn't asked about that.", "warn");
      }
      return reply(raw, pick(NORMAL_TEST), "");
    }
    if (/(^| )(consent|ok if|okay if|is that ok|is that okay|mind if|hello|hi|my name)(?= )/.test(text)) return reply(raw, "Sure, go ahead.", "");
    if (/(^| )(how are you|how're you|hows it going|how is it going)/.test(text)) return reply(raw, S.kase.greet, "");
    reply(raw, pick(FALLBACK), "");
  }

  const lower = (s) => (s[0] === "(" ? s : s[0].toLowerCase() + s.slice(1));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  function hint() {
    if (S.mode === "exam") return reply("hint", "(Hints are off in exam mode.)", "");
    const missing = S.items.filter((f) => !S.found.has(f.id));
    if (!missing.length) return reply("hint", "(You've found everything.)", "");
    const order = ["subjective", "redflag", "objective", "reasoning"];
    missing.sort((a, b) => order.indexOf(a.cat) - order.indexOf(b.cat));
    reply("hint", "(Hint: " + missing[0].label.toLowerCase() + ".)", "");
  }

  // ---------- ui ----------
  function progress() {
    const got = S.items.filter((f) => S.found.has(f.id)).reduce((a, f) => a + f.w, 0);
    return Math.min(1, got / S.total);
  }
  function setProgress() {
    const p = progress();
    $("#bar-fill").style.height = (p * 100).toFixed(1) + "%";
    $("#bar-num").textContent = Math.round(p * 100) + "%";
    $("#portrait").style.filter = `grayscale(${(1 - p).toFixed(3)}) saturate(${(0.6 + p * 0.5).toFixed(2)})`;
    $("#bar").setAttribute("aria-valuenow", Math.round(p * 100));
  }
  function say(you, text, note) {
    $("#you").textContent = you || "";
    const r = $("#reply");
    r.className = "reply" + (note ? " note" : "");
    r.textContent = text;
    r.classList.remove("pop"); void r.offsetWidth; r.classList.add("pop");
  }
  function reply(you, text, tone) {
    say(you, text);
    if (tone) {
      const st = $("#stage");
      st.classList.remove("good", "warn"); void st.offsetWidth; st.classList.add(tone);
    }
  }

  function finish() {
    if (!S || S.done) return;
    S.done = true;
    const p = Math.round(progress() * 100);
    const passScore = p >= 50, safe = S.flags.length === 0;
    const groups = {};
    S.items.forEach((f) => { (groups[f.cat] = groups[f.cat] || []).push(f); });
    let html = `<h2>${S.kase.fullName}</h2><p class="dx">${S.kase.title} · ${S.kase.area}</p>`;
    html += `<div class="score"><span>${p}%</span>`;
    if (S.mode === "exam") html += `<b class="${passScore && safe ? "pass" : "fail"}">${passScore && safe ? "Pass" : "Not yet"}</b>`;
    html += `</div>`;
    if (S.mode === "exam") html += `<p class="rule">Pass needs 50% or more and a clear safety hurdle.</p>`;
    if (S.flags.length) html += `<div class="flags">${S.flags.map((f) => `<p>${f}</p>`).join("")}</div>`;
    html += `<p class="summary">${S.kase.summary}</p>`;
    ["intro", "subjective", "redflag", "objective", "reasoning"].forEach((c) => {
      if (!groups[c]) return;
      html += `<h3>${CAT_NAMES[c]}</h3><ul>` + groups[c].map((f) => `<li class="${S.found.has(f.id) ? "got" : "miss"}">${f.label}</li>`).join("") + `</ul>`;
    });
    $("#debrief-body").innerHTML = html;
    show("debrief", true);
  }

  function show(id, overlay) {
    if (!overlay) document.querySelectorAll(".screen").forEach((s) => s.hidden = s.id !== id);
    $("#debrief").hidden = id !== "debrief";
  }

  // ---------- menu ----------
  let mode = "exam";
  function buildMenu() {
    const list = $("#cases");
    list.innerHTML = "";
    window.CASES.forEach((c) => {
      const b = document.createElement("button");
      b.className = "case";
      b.innerHTML = `<span class="thumb">${window.renderCharacter(c.look)}</span><span><strong>${c.first}, ${c.age}</strong><em>${c.title}</em></span>`;
      b.onclick = () => start(mode, c);
      list.appendChild(b);
    });
  }
  document.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => {
    mode = b.dataset.mode;
    document.querySelectorAll("[data-mode]").forEach((x) => x.setAttribute("aria-pressed", x === b));
    $("#mode-note").textContent = mode === "exam" ? "Full station. Introduce yourself, confirm identity and gain consent before you touch." : "Straight into the case. Type hint if you get stuck.";
  }));

  $("#form").addEventListener("submit", (e) => {
    e.preventDefault();
    const v = $("#ask").value.trim();
    if (!v || !S || S.done) return;
    $("#ask").value = "";
    respond(v);
  });
  $("#end").onclick = finish;
  $("#back").onclick = () => { S = null; show("menu"); };
  $("#retry").onclick = () => start(S.mode, S.kase);
  $("#menu-btn").onclick = () => { S = null; show("menu"); };

  buildMenu();
  show("menu");
})();
