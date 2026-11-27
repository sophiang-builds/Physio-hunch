/** Bind the case-file view. The game supplies the pass verdict. */
export function createCaseFile(root) {
  const play = root.querySelector(".case-file__play");
  const page = root.querySelector(".case-file__page");
  const photo = root.querySelector("[data-patient-photo]");
  const name = root.querySelector("[data-patient-name]");
  const background = root.querySelector("[data-case-background]");
  const history = root.querySelector("[data-case-history]");
  const answer = root.querySelector("[data-case-answer]");
  const diagnosis = root.querySelector("[data-case-diagnosis]");

  function setOpen(open) {
    root.toggleAttribute("data-open", open);
    play.setAttribute("aria-expanded", String(open));
    play.hidden = open;
    page.hidden = !open;
  }

  function setPassed(passed) {
    answer.hidden = !(passed === true && root.hasAttribute("data-open") && diagnosis.textContent);
  }

  function setCase(patient) {
    name.textContent = patient.name;
    photo.src = patient.photo;
    background.textContent = patient.background;
    history.textContent = patient.history;
    diagnosis.textContent = patient.diagnosis ?? "";
    setPassed(false);
    setOpen(false);
    play.disabled = false;
  }

  play.addEventListener("click", () => {
    setOpen(true);
    name.focus({ preventScroll: true });
  });

  return { setCase, setPassed };
}
