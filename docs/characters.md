# Physio Hunch patient designs

[View the five-patient turnaround sheet](../assets/characters/patient-turnarounds.png).

The sheet is the art reference for the current five-patient roster. See [the README](../README.md#characters) for the in-app sprites. It shows each patient front-on, facing screen-right, from behind, and facing screen-left. Use the crisp pixel edges, plum contours, limited tonal steps and shadows under the jaw and sleeves as the shared style. Preserve the same silhouette, costume and light direction across each patient's four views.

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

## Individual turn clips

The [turn clips](../assets/characters/turn-clips) use the [16-pose atlases](../assets/characters/pose-atlases). Each patient has eight one-shot GIFs. Each 90° clip uses five discrete drawings, including three in-between poses. The camera eases independently of those pose changes. The side views come in to **1.31×**, the back opens up to **0.84×**, and the front resets to **1.00×**. Each clip runs for **920 ms**, including the 280 ms end hold.

The transparent atlases are 1024 × 1024, with sixteen 256 × 256 cells in row-major order. Index 0 faces front, 4 faces screen-right, 8 faces back, and 12 faces screen-left. The in-between cells are spaced at approximately 22.5° intervals. For continuous playback, start and hold on the corresponding atlas cell or decoded GIF frame and reuse its camera framing. For sprite-based playback, advance through the same cells and ease the camera between endpoints.

| Patient | Asset folder | First turn preview |
| --- | --- | --- |
| Mia Tran | [ankle](../assets/characters/turn-clips/ankle) | [Front → right](../assets/characters/turn-clips/ankle/front-to-right.gif) |
| Daniel Okafor | [sciatica](../assets/characters/turn-clips/sciatica) | [Front → right](../assets/characters/turn-clips/sciatica/front-to-right.gif) |
| Margaret Collins | [stroke](../assets/characters/turn-clips/stroke) | [Front → right](../assets/characters/turn-clips/stroke/front-to-right.gif) |
| Robert Nguyen | [postop](../assets/characters/turn-clips/postop) | [Front → right](../assets/characters/turn-clips/postop/front-to-right.gif) |
| Gary Whitfield | [cardiac](../assets/characters/turn-clips/cardiac) | [Front → right](../assets/characters/turn-clips/cardiac/front-to-right.gif) |

Start in `front`. On each new finding, choose a destination from `patients[caseId][currentView]` in [manifest.json](../assets/characters/turn-clips/manifest.json). Resolve the returned file path relative to the manifest. Play that clip once, then hold its final frame and record the destination as the current view. Queue any new turn until playback finishes. With reduced motion, show the destination atlas cell directly using its camera setting from the manifest.

A five-finding sequence that reveals all four views is **front → right → back → left → front → right**. Randomise the initial direction and keep it for the first four turns if you want to guarantee that the player sees every angle. For freer variation, choose either valid destination each turn. The GIFs are optional playback assets alongside the app’s existing sprite renderer.

Regenerate the clips and manifest with `python3 tools/make_turn_clips.py` from the repository root (requires Pillow).
