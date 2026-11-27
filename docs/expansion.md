# 100-patient case expansion

[Browse the expansion roster](../demo/expansion-roster.html), served from the repository root. Search by name or complaint, filter by practice area, and step through each patient’s 16 views. `?case=151` opens a specific patient in the preview.

The [case briefs](../cases/expansion/cases.psv) cover 100 fictional patients between 6 and 91 years old. There are ten cases per area.

| IDs | Practice area |
| --- | --- |
| 101–110 | Musculoskeletal |
| 111–120 | Sports and performance |
| 121–130 | Neurological |
| 131–140 | Cardiorespiratory and acute |
| 141–150 | Older adults and falls |
| 151–160 | Paediatric and adolescent |
| 161–170 | Pelvic health |
| 171–180 | Vestibular and headache |
| 181–190 | Occupational and community |
| 191–200 | Persistent pain and complex care |

## Case file and engine handoff

The UTF-8 pipe-delimited file has one row per case. Use `name`, `age`, `pronouns`, `setting` and `subjective` for the [opening folder](case-file.md). The `assessment`, `finding` and `answer` fields are author notes for building the debrief. Some targets are impairments, functional needs or escalation decisions. Keep those outcomes available alongside diagnosis in any case engine. The `setting` shows on the card before any checks, so it says who the patient is and where you're seeing them, never the answer. A known condition the referral would mention (like "after stroke") is fine: the website doesn't count words that are already in the setting towards the answer. For the urgent cases, prioritise recognising and escalating the concern in the scoring.

The entries are case briefs for expansion authoring. They need clinical educator review and full interactive assessment findings, scoring and acceptable answers before being enrolled in the playable case bank.

## Character files

[See all 100 patients together](../assets/characters/expansion/contact-sheet.png). The rows follow the practice area order above.

Use [portraits](../assets/characters/expansion/portraits) for case folders and [atlases](../assets/characters/expansion/atlases) for turning. In both folders, use `<id>.png`. The 100 transparent atlases follow the original production layout: 1024 × 1024 with a 4 × 4 grid of 256 × 256 cells, row-major from front (0), right (4), back (8), and left (12), with a 22.5° step between cells. Use nearest-neighbour scaling. The portrait is the front cell of the character’s atlas.

## Individual artwork

All 100 expansion patients (cases 101–200) have individually illustrated turnarounds and matching front portraits. The [artwork manifest](../assets/characters/expansion/illustrated.json) lists every registered case ID.

Use the [original five turnarounds](../assets/characters/pose-atlases) as the art reference for each new patient. Match their waist-up crop and believable proportions, crisp plum contours, separately drawn views and stepped shadow clusters. Carry the character’s hair and facial details through the turn, including when an ear or glasses arm becomes occluded. Give the garment its own folds and seams, and preserve those design details across the 16 angles. Review the first, right, back and left views and inspect the intervening angles for jumps in silhouette or changes in costume.

After reviewing one patient, register the square green-screen 4 × 4 source sheet with `python3 tools/import_expansion_atlas.py <case-id> <source.png>`. This updates the portrait, atlas, contact sheet and artwork status. `python3 tools/make_expansion_atlases.py` rebuilds draft assets (Pillow and NumPy) and skips the individually illustrated patients.

## How the website plays the briefs

The website (`site/game.js`) reads `cases/expansion/cases.psv` when the page loads and adds every row whose patient is listed in `assets/characters/expansion/illustrated.json` to the case bank. All 100 expansion patients are registered, giving a bank of 105 with the five original cases. Each day draws five random patients from the whole bank, which stay the same after a refresh and change the next day.

Until a brief gets full findings, it plays like this:

- The `subjective` text is shown up front as "What happened".
- The brief's key `assessment` reveals its `finding` when the player names a matching test from the assessment database, or uses a substantial word from the brief's assessment text. Every other test gets no response.
- The `answer` is marked on its core words (the part before a comma, "with", "plus" or "while"). A right answer needs most of those words, including the answer's most distinctive word across the bank. Naming a distinctive word from a different answer, such as "urgency" for stress incontinence, caps it at close. Common names such as frozen shoulder, tennis elbow, ACL and BPPV are translated to their clinical terms.

An audit with the game's own code accepts all 100 brief answers. Of the 9,900 cross-checks between briefs, 3 still mark another brief's answer as right: the two CRPS cases (160 and 197) share an answer, and patellar tendinopathy matches patellofemoral pain through the shared "patell" stem.

## Written cases

`ios/PhysioHunch/Resources/Data/expansion-cases.json` holds full cases for every patient with finished art, written the same way as the original five in `cases.json`. The background says who the person is and what they've noticed, in plain words. The history is in their own words. Each check has its own finding (the key ones point to the answer, the rest come back normal or unhelpful), and `answers` and `close` list the phrases that count. Nothing in `answers` or `close` appears in the background or history. The website plays the written case when there is one and falls back to the brief otherwise. When a new patient's art is finished, add a written case here as well as listing them in `illustrated.json`.
