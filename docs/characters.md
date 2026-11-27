# Physio Hunch patient designs

[View the five-patient turnaround sheet](../assets/characters/patient-turnarounds.png).

The sheet is the art reference for the original web prototype’s roster. See [the README](../README.md#characters) for the native iOS roster and current assets. It shows each patient front-on, facing screen-right, from behind, and facing screen-left. Use the crisp pixel edges, plum contours, limited tonal steps and shadows under the jaw and sleeves as the shared style. Preserve the same silhouette, costume and light direction across each patient's four views.

| Patient | Age | Case | Visual identifiers |
| --- | ---: | --- | --- |
| Mia Tran | 19 | Ankle injury at netball | Dark loose ponytail, violet sports jersey, athletic build |
| Daniel Okafor | 42 | Back and leg pain after lifting | Close-cropped curls, beard, broad shoulders, orange work vest |
| Margaret Collins | 68 | Leg giving way | Silver bob, burgundy glasses, blue cardigan, narrow frame |
| Robert Nguyen | 71 | Postoperative care | Receding silver hair, jade hospital gown, nasal cannula |
| Gary Whitfield | 58 | Shoulder ache | Freckles, short grey-streaked hair, stubble, teal polo |

## Turn and zoom behaviour

On the first discovery of a scored finding, advance one view in the order front → facing screen-right → back → facing screen-left → front. Keep a single patient in place with a shared anchor across the views. An assessment result can spend a slot without revealing a new scored finding. Repeated questions, consent and safety acknowledgements can leave the portrait in place.

For a gradual reveal, keep zoom independent of the turn. Try `1.0×`, `1.05×`, `1.10×` and a cap of `1.15×`. Set the transform origin near the centre of the portrait and preserve room for the dialogue. Swap frames directly when reduced motion is requested. Use the front view for dialogue when a reply needs a visible expression, while keeping the discovered angle available to revisit.

For the code-drawn implementation, use the sheet to author four per-patient views on a shared logical pixel grid, with matching origins and restrained expression layers on the visible faces. Render at an integer scale with crisp pixel edges. Add diagonal views if the turn needs in-between frames. The PNG is a concept sheet. Its row labels, background and variable framing require cleanup or redrawing before use as individual game sprites.
