/* Contribute a case: type, or dictate with the browser's speech recognition. */
(() => {
  const $ = (id) => document.getElementById(id);
  const text = $("text"), ok = $("ok"), send = $("send"), mic = $("mic"), note = $("micNote");
  const ISSUES = "https://github.com/sophiang-builds/Physio-hunch/issues/new";

  const update = () => { send.disabled = !(text.value.trim().length > 20 && ok.checked); };
  text.addEventListener("input", update);
  ok.addEventListener("change", update);

  // Voice: Web Speech API (Chrome, Edge, Safari on iPhone and Mac). Falls back to typing.
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null, listening = false, base = "";
  if (!Recognition) {
    mic.hidden = true;
    note.textContent = "Voice isn't available in this browser. Your phone keyboard's microphone button works too.";
  } else {
    rec = new Recognition();
    rec.lang = "en-AU";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let finalText = "", interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t; else interim += t;
      }
      if (finalText) base = (base + " " + finalText).replace(/\s+/g, " ").trim();
      text.value = (base + " " + interim).trim();
      update();
    };
    rec.onerror = (e) => {
      note.textContent = e.error === "not-allowed" ? "Microphone access was blocked. You can allow it in your browser settings, or just type." : "Voice stopped. Tap to try again.";
      stop();
    };
    rec.onend = () => { if (listening) rec.start(); };
  }
  function start() {
    base = text.value.trim(); listening = true; rec.start();
    mic.setAttribute("aria-pressed", "true"); $("micLabel").textContent = "Stop";
    note.textContent = "Listening… talk it through. Tap Stop when you're done.";
  }
  function stop() {
    listening = false; try { rec.stop(); } catch (e) {}
    mic.setAttribute("aria-pressed", "false"); $("micLabel").textContent = "Talk it out";
    if (note.textContent.startsWith("Listening")) note.textContent = "Got it. Read it over and fix anything that came out wrong.";
  }
  mic.addEventListener("click", () => (listening ? stop() : start()));

  $("copy").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(text.value); note.textContent = "Copied."; }
    catch (e) { text.select(); note.textContent = "Select all and copy the text."; }
  });

  $("story").addEventListener("submit", (e) => {
    e.preventDefault();
    if (listening) stop();
    const body = `**Case idea**\n\n${text.value.trim()}\n\n---\nNo real names or identifying details: confirmed.`;
    const url = `${ISSUES}?title=${encodeURIComponent("New case idea")}&labels=case-idea&body=${encodeURIComponent(body)}`;
    window.open(url, "_blank", "noopener");
  });
})();
