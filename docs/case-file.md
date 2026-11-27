# Case file opening and answer reveal

Open the [interactive case file demo](../demo/case-file.html) through GitHub Pages or a local server. The preview opens Mia’s file. Use `?case=ankle`, `sciatica`, `stroke`, `postop` or `cardiac` to load a different patient. **Preview pass** tests the answer reveal outside the game.

## Reusable layers

| Asset | Use |
| --- | --- |
| [cover.svg](../assets/case-file/cover.svg) | Closed yellow folder and reverse face of the hinged cover |
| [inside.svg](../assets/case-file/inside.svg) | Right-hand panel and spine behind the content |
| [paper.svg](../assets/case-file/paper.svg) | Blank sheet with a folded corner, scalable to the text |
| [photo-frame.svg](../assets/case-file/photo-frame.svg) | Blank pixel-edged photo mount with a square photo opening |
| [paperclip.svg](../assets/case-file/paperclip.svg) | Transparent foreground layer above the mount and portrait |
| [case-file.css](../assets/case-file/case-file.css) | Framing, left-hinged flip, responsive layout and reduced motion |
| [case-file.js](../assets/case-file/case-file.js) | Case data and pass state bindings for the web markup |

The folder and stationery use hard pixel edges. The patient image and paper text are independent layers. Use the patient’s front pose, Bricolage Grotesque for the title and labels, and Atkinson Hyperlegible Next for the body. The [brand stylesheet](../assets/brand.css) already provides both fonts.

## States and placement

1. **Closed.** Show the yellow cover and place **Play** on the right. Keep the case details hidden.
2. **Open.** Rotate the cover around its left hinge to `-180deg` over 720 ms. Crop the left cover at the screen edge and position the right panel slightly left of the viewport centre. Place the clipped photo at the top-left of the right panel. Put the paper below it with the background and history.
3. **Answer.** After every patient, right or wrong, lay a second sheet of paper over the case page with the verdict, what was going on, the story and the checks that would have found it. It is part of the folder, not a popup. The clock pauses while it is up, and **Next patient** in the dock moves on. On a phone the same sheet takes the place of the case notes. With reduced motion, skip the slide-in.

The [demo markup](../demo/case-file.html) supplies the required class and data selectors. Call `createCaseFile(root)`, then `setCase({ name, photo, background, history, diagnosis })` to fill the paper and reset the folder. After the player opens the folder, call `setPassed(result.passed)` with the actual boolean verdict. The demo binds the case’s `situation` and `findings.hpc` from the shared case bank. Keep storyline summaries reserved for the debrief because they can contain the diagnosis. Native code can use the same SVG layers and state rules with its own game verdict.
