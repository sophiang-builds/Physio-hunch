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

The UTF-8 pipe-delimited file has one row per case. Use `name`, `age`, `pronouns`, `setting` and `subjective` for the [opening folder](case-file.md). The `assessment`, `finding` and `answer` fields are author notes for building the debrief. Some targets are impairments, functional needs or escalation decisions. Keep those outcomes available alongside diagnosis in any case engine. For the urgent cases, prioritise recognising and escalating the concern in the scoring.

The entries are case briefs for expansion authoring. They need clinical educator review and full interactive assessment findings, scoring and acceptable answers before being enrolled in the playable case bank.

## Character files

[See all 100 patients together](../assets/characters/expansion/contact-sheet.png). The rows follow the practice area order above.

Use [portraits](../assets/characters/expansion/portraits) for case folders and [atlases](../assets/characters/expansion/atlases) for turning. In both folders, use `<id>.png`. The 100 transparent atlases follow the original production layout: 1024 × 1024 with a 4 × 4 grid of 256 × 256 cells, row-major from front (0), right (4), back (8), and left (12), with a 22.5° step between cells. Use nearest-neighbour scaling. The portrait is the front view rendered at its 96 × 96 native pixel grid.

The expansion uses procedural pixel art with consistent geometry through the turn, plum outlines and stepped lighting. The treatment is simpler than the original illustrated five. Each character has an explicit combination of skin tone, hairstyle, outfit colour, build and facial detail in the `character` field. The renderer takes age and character settings directly from the row and never infers appearance from a person's name.

Regenerate the files with `python3 tools/make_expansion_atlases.py` (Pillow and NumPy). Pass one or more case IDs to regenerate only those characters.
