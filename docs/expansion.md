# Expansion art and clinical review

The [artwork manifest](../assets/characters/expansion/illustrated.json) indexes 100 illustrated patients. Each [atlas](../assets/characters/expansion/atlases) contains 16 views in a four-by-four grid. Each [portrait](../assets/characters/expansion/portraits) uses the front view. [View the contact sheet](../assets/characters/expansion/contact-sheet.png).

To replace an existing illustration, run `python3 tools/import_expansion_atlas.py <case-id> <source.png>` with a square four-by-four source sheet. The tool updates the atlas, portrait and contact sheet. Art registration has no effect on clinical eligibility.

The [review candidates](../review/candidates.json) and their [briefs](../review/candidate-briefs.psv) sit outside the web and native release banks. Both release banks are empty during clinical and scoring review.
