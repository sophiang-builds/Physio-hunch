<p align="center"><img src="assets/logo.svg" width="320" alt="Physio Hunch"></p>

A practice game for physiotherapy practical vivas. Question a simulated patient, run your tests, and work out what's going on. As you uncover the case, the patient fills in from greyscale to full colour.

![Physio Hunch](assets/social-preview.png)

## Modes

Exam mode runs the full station. You introduce yourself, confirm identity, gain consent and handle privacy before you assess. To pass you need 50% or more and a clear safety hurdle. Touching before consent or doing something unsafe fails the hurdle, the same way the viva safety requirement does.

Practical mode drops you straight into the case. Type `hint` if you're stuck.

In either mode, type `end` or press End to see the debrief.

## Run it

It's a static site with no build step. Open `index.html`, or publish with GitHub Pages: go to Settings → Pages, choose Deploy from a branch, then select the branch and `/ (root)`.

## Files

- `js/cases.js` holds the case bank. Each finding has the patterns that trigger it, a reply, a category and a weight. The pattern syntax is explained at the top of the file.
- `js/character.js` generates the vector patient portraits.
- `js/app.js` is the game engine.
- `research/viva-research.md` has the evidence base, the marking model and the case catalogue.
- `assets/` holds the logo, favicon (SVG plus 32px PNG), apple touch icon, a 512px icon and `social-preview.png`, sized 1280×640 for GitHub's social preview setting.

The cases are for study practice and aren't official University of Newcastle material.
