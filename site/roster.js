/* "Who you'll meet": the first five are in the HTML; the 100 expansion patients load by practice area. */
(async () => {
  const tabs = document.getElementById("caseTabs"), grid = document.getElementById("caseGrid");
  if (!tabs || !grid) return;
  const first = grid.innerHTML;
  let cases;
  try { cases = await fetch("ios/PhysioHunch/Resources/Data/expansion-cases.json").then((r) => r.json()); } catch (e) { return; }
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // "Aisha, 31, works in an office…" reads better on a card as "Works in an office…"
  const blurb = (c) => { const t = c.situation.replace(new RegExp(`^${c.name},\\s*${c.age},?\\s*`), ""); return t[0].toUpperCase() + t.slice(1); };
  const areas = [...new Set(cases.map((c) => c.area))];
  areas.forEach((a) => tabs.insertAdjacentHTML("beforeend", `<button class="chip glass" type="button" role="tab" aria-selected="false" data-area="${esc(a)}">${esc(a)}</button>`));
  const show = (area) => {
    tabs.querySelectorAll(".chip").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.area === area)));
    grid.innerHTML = !area ? first : cases.filter((c) => c.area === area).map((c) => `<article><img src="assets/characters/expansion/portraits/${esc(c.id)}.png" alt="" loading="lazy"><h3>${esc(c.name)}, ${c.age}</h3><p>${esc(blurb(c))}</p></article>`).join("");
  };
  tabs.addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (b) show(b.dataset.area); });
})();
