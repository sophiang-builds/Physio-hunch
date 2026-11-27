const element = id => document.getElementById(id);
const assets = "../assets/characters/expansion";
const status = element("status");

try {
  const response = await fetch("../cases/expansion/cases.psv");
  if (!response.ok) throw new Error(`Case roster returned ${response.status}`);
  const [header, ...rows] = (await response.text()).trim().split(/\r?\n/);
  const columns = header.split("|");
  const cases = rows.map(row => Object.fromEntries(row.split("|").map((value, index) => [columns[index], value])));
  const area = element("area");
  const search = element("search");
  const roster = element("roster");
  let selected = cases.find(patient => patient.id === new URLSearchParams(location.search).get("case")) ?? cases[0];
  let pose = 0;
  for (const name of new Set(cases.map(patient => patient.area))) area.add(new Option(name, name));

  function setPose(index) {
    pose = (index + 16) % 16;
    const panel = element("pose");
    const degrees = pose * 22.5;
    panel.style.backgroundPosition = `${(pose % 4) * 100 / 3}% ${Math.floor(pose / 4) * 100 / 3}%`;
    panel.setAttribute("aria-label", `${selected.name}, ${degrees} degree view`);
    element("angle").value = `${degrees}°`;
  }

  function showCase(patient) {
    const wasDifferent = selected.id !== patient.id;
    selected = patient;
    const atlas = `${assets}/atlases/${patient.id}.png`;
    element("pose").style.backgroundImage = `url("${atlas}")`;
    element("atlas").href = atlas;
    element("patient-name").textContent = patient.name;
    element("patient-meta").textContent = `${patient.age} years · ${patient.pronouns} · ${patient.area}`;
    for (const key of ["setting", "subjective", "assessment", "finding", "answer"]) {
      element(key).textContent = patient[key];
    }
    if (wasDifferent) element("debrief").open = false;
    setPose(0);
    element("viewer").hidden = false;
  }

  function renderRoster() {
    const query = search.value.toLocaleLowerCase().trim();
    const matches = cases.filter(patient =>
      (!area.value || patient.area === area.value) &&
      [patient.name, patient.setting, patient.subjective, patient.id].some(text => text.toLocaleLowerCase().includes(query))
    );
    status.textContent = `${matches.length} ${matches.length === 1 ? "patient" : "patients"}`;
    roster.replaceChildren();
    if (!matches.length) {
      element("viewer").hidden = true;
      return;
    }
    if (!matches.includes(selected)) showCase(matches[0]);
    else element("viewer").hidden = false;
    for (const patient of matches) {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-pressed", String(patient === selected));
      const image = document.createElement("img");
      image.src = `${assets}/portraits/${patient.id}.png`;
      image.alt = "";
      image.loading = "lazy";
      const label = document.createElement("span");
      const meta = document.createElement("small");
      meta.textContent = `${patient.age} · ${patient.area}`;
      label.append(patient.name, meta);
      button.append(image, label);
      button.addEventListener("click", () => {
        showCase(patient);
        for (const item of roster.querySelectorAll("button")) item.setAttribute("aria-pressed", String(item === button));
        element("patient-name").focus();
      });
      roster.append(button);
    }
  }

  showCase(selected);
  renderRoster();
  area.addEventListener("change", renderRoster);
  search.addEventListener("input", renderRoster);
  element("previous").addEventListener("click", () => setPose(pose - 1));
  element("next").addEventListener("click", () => setPose(pose + 1));
} catch (error) {
  console.error(error);
  status.textContent = "The case roster could not load. Open this page through GitHub Pages or a local web server.";
}
