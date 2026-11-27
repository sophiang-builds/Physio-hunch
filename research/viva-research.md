# Practical viva research notes

These notes are the evidence base for the cases. They mark which parts are confirmed and which are inferred, so that nothing passes for official when it isn't.

## Access problem

The official course outlines on newcastle.edu.au sit behind a Cloudflare bot check. Automated fetches from the build environment return 403. Everything marked "confirmed" below comes from search engine snippets of those official PDFs. Anything from Studocu or similar is student-uploaded and only counts as a lead. To firm this up, download the current outlines below and add the PDFs to `research/outlines/`.

## What is confirmed about the Newcastle vivas

The program is the Bachelor of Physiotherapy (Honours), program 12337, and the courses use the PHTY prefix.

PHTY1040 (2024 S1) has two practical vivas: Viva A in week 5 (15%) and Viva B in week 13 (45%). Viva A is station-based, and you perform practical skills on another student acting as the model. To pass, you need at least 50% and must pass the safety requirement of Viva B.

PHTY2020 Musculoskeletal Physiotherapy I (2024 S1) has a must-pass practical viva worth 40%, again performed on a student model. The course covers assessment and management of common musculoskeletal disorders, manual therapy, orthopaedic physiotherapy and electrophysical agents.

PHTY2030 Neurological Physiotherapy I (2023 S2; 2025 manual) has a compulsory practical viva that must be passed to pass the course. The 2025 manual puts it in week 9 with three stations, mixing manned and unmanned stations that examine assessment skills and treatment techniques. The rule is again at least 50% plus passing the safety requirement, with supplementary assessment capped at 50%.

PHTY3070 Advanced Neurological Physiotherapy also has a viva (student material only). PHTY3020 Cardiopulmonary Physiotherapy II has viva practice material in student uploads, covering scenario-based oral defence, sterile tracheal suction, respiratory values and COPD exercise programs (unverified).

One student-uploaded neuro practice question matches the stroke case almost exactly: a patient a few days after a stroke who can't take weight through one leg in standing because it collapses.

## Marking model used in the game

A safety hurdle sits on top of a percentage score in every Newcastle viva I could see, so exam mode passes only at 50% or more with zero safety flags. A safety flag comes from any of these:

- Starting a physical test before consent
- Mobilising before checking medical clearance, obs or lines (neuro and cardiorespiratory)
- Handling the hemiplegic arm unsafely
- Treating when red flags point to a non-musculoskeletal cause

The categories (introduction and consent, history, safety and red flags, physical examination, clinical reasoning) follow the Assessment of Physiotherapy Practice (APP) domains: professional behaviour, communication, assessment, analysis and planning, intervention, evidence-based practice and risk management. Australian programs use the APP for placement assessment, and its four professional items plus sixteen clinical items line up with how viva stations are usually marked.

The exam-mode opening items (introduce yourself, confirm name and date of birth, hand hygiene, explain, consent, consent before touching, privacy, draping or chaperone, permission to stop) are standard OSCE checklist content. They aren't copied from a Newcastle marking sheet, because I couldn't access one.

## Case catalogue

The first five are built (`js/cases.js`). The rest are candidates for the 200-case bank, grouped by the viva area they'd come from.

### Musculoskeletal (PHTY1040, PHTY2020 and later MSK)
1. Lateral ankle sprain, ATFL (built)
2. S1 radiculopathy, L5/S1 disc (built)
3. Rotator cuff related shoulder pain
4. Frozen shoulder (adhesive capsulitis)
5. ACL rupture, acute
6. Patellofemoral pain
7. Knee osteoarthritis
8. Total knee replacement, day 2
9. Total hip replacement with hip precautions
10. Lateral elbow tendinopathy
11. Carpal tunnel syndrome (median nerve)
12. Mechanical neck pain with cervicogenic headache
13. Whiplash associated disorder
14. Achilles tendinopathy
15. Plantar heel pain
16. Distal radius fracture post cast
17. Hamstring strain
18. Non-specific low back pain with yellow flags
19. Hip osteoarthritis
20. Medial collateral ligament sprain

### Neurological (PHTY2030, PHTY3070)
21. Right MCA stroke, left knee instability (built)
22. Left MCA stroke with aphasia (consent via communication aids)
23. Parkinson's disease with freezing of gait
24. Multiple sclerosis with fatigue and heat sensitivity
25. Incomplete spinal cord injury (C6), transfers
26. Traumatic brain injury, agitation
27. Guillain-Barré syndrome, recovering
28. Vestibular: BPPV (Dix-Hallpike)
29. Peripheral neuropathy with falls
30. Cerebellar stroke with ataxia

### Cardiorespiratory (PHTY3020 and related)
31. Post-op bibasal atelectasis (built)
32. COPD exacerbation, sputum clearance
33. Community acquired pneumonia
34. Post CABG, sternal precautions
35. Cystic fibrosis airway clearance
36. Ventilated ICU patient, suction (sterile technique)
37. Heart failure, exercise tolerance
38. Pulmonary rehab assessment (6MWT)

### Red flags and mixed
39. Cardiac pain presenting as shoulder pain (built)
40. Cauda equina syndrome
41. Spinal malignancy (night pain, history of cancer)
42. Vertebral fracture in osteoporosis
43. DVT after knee surgery
44. Septic arthritis
45. Cervical arterial dysfunction (5 Ds and 3 Ns)
46. Slipped upper femoral epiphysis in an adolescent

## Sources

- [Bachelor of Physiotherapy (Honours), program 12337](https://www.newcastle.edu.au/program/12337)
- [PHTY1040 2024 S1 outline](https://www.newcastle.edu.au/course/course-outlines/2024/PHTY1040-2024-S1-CALLAGHAN.pdf)
- [PHTY2020 2024 S1 outline](https://www.newcastle.edu.au/course/course-outlines/2024/PHTY2020-2024-S1-CALLAGHAN.pdf)
- [PHTY2030 2023 S2 outline](https://www.newcastle.edu.au/course/course-outlines/2023/PHTY2030-2023-S2-CALLAGHAN.pdf)
- [PHTY2030 course manual S2 2025 (Studocu, student upload)](https://www.studocu.com/en-au/document/university-of-newcastle-australia/neurological-physiotherapy-i/phty2030-neurological-physiotherapy-course-manual-semester-2-2025/139376170)
- [Neuro viva practice questions (Studocu, student upload)](https://www.studocu.com/en-au/document/university-of-newcastle-australia/neurological-physiotherapy-i/viva-practice-qs-questions/96836463)
- [PHTY3020 Cardiopulmonary Physiotherapy II (Studocu listing)](https://www.studocu.com/en-au/course/university-of-newcastle-australia/cardiopulmonary-physiotherapy-ii/210114)
- [APP reliability and validity study (PMC)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12007712/)
- [APP resource manual (Bond)](https://bond.edu.au/system/files/filedepot/58/FINAL%202011_APP%20resource%20%20manual%20with%20front%20cover.pdf)
- [City St George's MSc Physiotherapy scheme of assessment (safety auto-fail model)](https://studenthub.citystgeorges.ac.uk/__data/assets/pdf_file/0004/923566/MSc-Physiotherapy-Scheme-of-Assessment-march-2025.pdf)
