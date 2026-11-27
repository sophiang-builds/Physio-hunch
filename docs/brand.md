# Physio Hunch brand guide

Physio Hunch is an illustrated consultation with the rhythm of a clue game. Put the patient at eye level and make each assessment reveal a finding the player can use. Use **Physio Hunch** in titles and accessible text.

## Identity files

| File | Use |
| --- | --- |
| [Light logo](../assets/logo.svg) | Full lockup for cream and white surfaces |
| [Dark logo](../assets/logo-dark.svg) | Full lockup for dark surfaces |
| [Mark](../assets/mark.svg) | Compact navigation, avatars and app icon source |
| [SVG favicon](../assets/favicon.svg), [16 px PNG](../assets/favicon-16.png), [32 px PNG](../assets/favicon-32.png) | Browser tabs |
| [180 px Apple touch icon](../assets/apple-touch-icon.png), [512 px icon](../assets/icon-512.png) | Home-screen and app icon inputs |
| [1280 × 640 social image](../assets/social-preview.png) | Social sharing and repository previews |
| [Brand CSS](../assets/brand.css) | Self-hosted font declarations and reusable light-theme tokens |

The mark combines a patient's silhouette and a speech tail. Its two-tone split carries forward the prototype's reveal. Keep the proportions and provide roughly one quarter of the mark's width as clear space in a header. When the logo is the only visible brand label, give it the accessible name “Physio Hunch.”

## Type and colour

Use **Bricolage Grotesque 650** for headings and **Atkinson Hyperlegible Next 400–700** for dialogue, controls and findings. Start with 16 px body text and 1.5 line-height. Use sentence case and allow text scaling.

The bundled variable WOFF2 files cover Latin and are from Fontsource 5.3.0. Copy the entire [fonts directory](../assets/fonts), including the [Bricolage licence](../assets/fonts/bricolage-OFL.txt) and [Atkinson licence](../assets/fonts/atkinson-OFL.txt), when redistributing. Both families use SIL OFL 1.1. For a native app, use the upstream TTFs and ship their licence notices. For other scripts, provide a suitable system fallback and test the layout. [Bricolage upstream](https://github.com/ateliertriay/bricolage) · [Atkinson upstream](https://github.com/google/fonts/tree/main/ofl/atkinsonhyperlegiblenext)

| CSS token | Value | Role |
| --- | --- | --- |
| `--ph-room` | `#F7F3EA` | Main background |
| `--ph-paper` | `#FFFFFF` | Dialogue and findings surfaces |
| `--ph-ink` | `#24203C` | Primary text and outlines |
| `--ph-muted` | `#5D586C` | Supporting text |
| `--ph-violet` | `#543C86` | Primary action and selected finding |
| `--ph-on-action` | `#FFFFFF` | Text on violet actions |
| `--ph-lilac` | `#D7C8F1` | Portrait backdrops and selected fills with dark text |
| `--ph-safety` | `#9A3D38` | Safety notices with a written label |

Light-theme contrast is 14.08:1 for ink on cream, 6.16:1 for supporting text on cream, 8.87:1 for white on violet, and 6.12:1 for brick on cream. Use visible focus rings and pair reveal and safety colours with labels or icons. Verify contrast again when adding a theme or changing a surface.

## Patient and interaction

- Keep one patient centred through the consultation. Use a waist-up or seated three-quarter portrait with distinct posture, brows, hair and everyday clothing. Mia Tran is the first reference case: a netball player with a loose ponytail and a slightly guarded seated pose. Keep the person's appearance consistent and use the backdrop and findings for the main colour reveal. Clinical gestures should reflect the authored case.
- Keep the latest dialogue near the portrait and the player's next action below it. Provide a readable transcript. Use brief expression changes if you animate the character, with an equivalent static state for reduced motion.
- **Exam** opens on the patient waiting. The player starts the conversation and handles history, safety and consent. **Practical** opens with the patient describing the chief complaint in their own words, for example “I landed awkwardly at netball yesterday. Now the outside of my ankle hurts.”
- Use distinct **Ask a question** and **Choose an assessment** actions. History, consent and safety screening sit outside the five assessment slots. A committed assessment fills a slot with a finding, even when the result is normal. Let the player reopen findings without spending another slot.
- Start with **5 assessments left** and five outlined slots. After the first assessment, show **4 assessments left** and an accessible button for the first finding. End with **Make your call**, including the option to stop and escalate when the case warrants it. The debrief connects the decision to the evidence and safety choices.

The patient screen and five-slot flow above are the target for the new app. The repository's static prototype uses its original percentage meter and conversation engine. For the first usability check, show Mia's Practical opening at mobile width for five seconds. Ask the player who they are talking to, what she complained of and how many assessments they can choose. Then ask them to choose one, reopen its finding and report how many remain.
