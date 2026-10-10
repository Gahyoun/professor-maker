# Project: Professor Maker Comprehensive Inspection & Enhancement

## Architecture
Professor Maker is an academic lab simulation game modeling 8 years (96 months) of student guidance, academic research, and lab management.
- **Frontend / Presentation Layer**: Pure ES modules (`dist/app.js`, `dist/style.css`, `dist/campus-ui.css`, `dist/mobile.css`). Hash-based SPA routing (`#home`, `#lab`, `#journal`, `#letters`), pixel-art rendering (`dist/student-pixel-art.js`, `dist/lab-scene.js`), and academic CV generation (`dist/cv.js`).
- **Simulation Core Engine**: `dist/engine.js` handles monthly progression, weekly 4-slot activity planning, stat growth (hidden 0–999 / 0–100 mapped to normalized abilityScore 0–100 with exponential saturation), faculty workload, stress/stamina dynamics, and final career ending resolution.
- **Narrative & Event Systems**:
  - `dist/main-story.js`: 6 chronological chapter milestones (months 1, 12, 25, 42, 72, 85) and 5-stage thesis defense.
  - `dist/events.js`: 35+ triggerable narrative events with Wet/Dry laboratory differentiation.
  - `dist/counseling.js`: Student observation, mentoring follow-ups, and advising habits.
  - `dist/dialogue.js`: 24 student emotional/temperament dialogue pools.
  - `dist/stories.js`: 17 ending scenarios, dynamic 6-layer graduation letter assembly with past event memories.
- **Simulation Worker & Auditing Harness**: `dist/simulation-worker.js` and `scripts/ending-balance-audit.mjs` enable multi-threaded 10,000-run deterministic simulation across 12 policies, 73 academic disciplines, and 3 institution types.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Syntax & Core Compilation Fix | Close unclosed `else if (id === 'true' && distance !== 'close')` in `dist/stories.js:360` to unblock 17 failing tests and SPA booting. | M1 | Survey (E1, E2, E3) |
| 2 | Story & Orthography Polish | Correct Korean spelling, particle bindings ("이제도" → "지금도", "함께 했던" → "함께한", "한 번" → "한번", "그 전주" → "그 전 주") across narrative files. | M1 | Survey (E1) |
| 3 | Warm Student Guidance Events | Add 6 new warm guidance scenarios (`counsel-late-night`, `counsel-rejection-tea`, `counsel-imposter-stride`, `counsel-first-mistake`, `counsel-junior-mentoring`, `counsel-exam-buffer`) with choices, effects, and letter memories. | M1 | Survey (E1) |
| 4 | Narrative Principle Compliance | Enforce '단일 원인 서사 금지' (no single-cause narrative), 'BAD 등급 없음' (dignified outcomes for leave/unemployed/dropout), Wet/Dry separation, and letter audit constraints. | M1 | Survey (E1) |
| 5 | Activity Stat Growth Tuning | Add `enterprise` gain to `industry` (RA) and `outreach` gain to `presentation` in `dist/engine.js`. | M2 | Survey (E2) |
| 6 | Ending Thresholds & Career Scoring | Adjust entry thresholds and scores for `startup` (+18 score, req 25 ent / 45 aut) and `youtuber` (+20 score, req 20 out / 50 lang); soften `resident_researcher` gates (caution 55, rapport 65). | M2 | Survey (E2) |
| 7 | 10,000-Run Non-Zero Ending Balance | Eliminate all 0% endings (`startup` 0% → ~1.8%, `youtuber` 0% → ~5.2%) in 10,000 simulation runs. | M2 | Survey (E2) |
| 8 | Mobile Typography & Readability | Elevate sub-10px fonts (8px–9px on `.week-heading span`, `.room-label`, `.defense-step`, `.progress-label`) to a legible minimum (≥10px–11px). | M3 | Survey (E3) |
| 9 | Touch Target Accessibility | Expand faculty credit allocation buttons (`.credit-blocks button`) from 30px to ≥38px–44px for touch usability. | M3 | Survey (E3) |
| 10 | DOM Rendering Safety | Eliminate double `innerHTML` serialization and regex replacement hazard in `dist/app.js:164`. | M3 | Survey (E3) |
| 11 | Sticky Stage Mobile Layout | Prevent sticky `#live-stage` and `.faculty-scroll-summary` from occluding interactive controls on small mobile viewports. | M3 | Survey (E3) |
| 12 | Test Suite & Browser Stability | Verify 100% pass on `npm test` (>=88 tests, currently 168 tests) with clean execution and zero console errors. | M4 | Survey (E3) |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Storyline & Guidance Narrative (R1) | Fix `dist/stories.js` syntax, polish spelling/phrasing, implement 6 new guidance events and memories. | none | IN_PROGRESS (worker: 16847db0-9463-448f-8245-a292517a6b43) |
| M2 | Stat & Difficulty Balance Tuning (R2) | Update activity gains (`enterprise`, `outreach`), adjust ending thresholds and career scores, verify 10,000-run simulation has no 0% endings. | M1 | PLANNED |
| M3 | UI/UX Usability & Accessibility (R3) | Mobile font legibility (≥10px), touch targets (≥38px–44px), clean DOM rendering in `app.js`, sticky stage spacing. | none | DONE (worker: a2bb436f-d223-45c8-814d-ef6b173d87af) |
| M4 | Final E2E Verification & Adversarial Hardening | Pass 100% E2E test suite (Tiers 1–4), adversarial testing (Tier 5), Forensic Integrity Audit. | M1, M2, M3, TEST_READY | PLANNED |

---

## Interface Contracts
### `dist/events.js` ↔ `dist/stories.js`
- Event IDs: `counsel-late-night`, `counsel-rejection-tea`, `counsel-imposter-stride`, `counsel-first-mistake`, `counsel-junior-mentoring`, `counsel-exam-buffer`.
- In `events.js`, each event conforms to `{id, title, body, kind: 'counseling', options, minMonth, maxMonth, cooldown}`.
- In `stories.js`, each event has registered memories in `eventMemories[id] = [memory0, memory1]` and `englishMemories[id] = [en0, en1]`.
- All letter memory sentences must include at most 1 `'기억합니다'` and meet `scripts/letter-content-audit.mjs` rules.

### `dist/engine.js` ↔ `scripts/ending-balance-audit.mjs`
- `engine.js:careerEnding(s)` evaluates career outcomes using `careerScores(s)`.
- `careerScores` must compute numerical scores for `startup`, `youtuber`, `institute`, `corporate`, `unrelated`, `unemployed`, `resident_researcher`.
- 10,000 runs in `ending-balance-audit.mjs` must yield `count > 0` for all canonical endings.

---

## Code Layout
- `dist/stories.js`: Owned by M1 Worker.
- `dist/events.js`: Owned by M1 Worker.
- `dist/main-story.js`: Owned by M1 Worker.
- `dist/dialogue.js`: Owned by M1 Worker.
- `dist/engine.js`: Owned by M2 Worker.
- `dist/style.css`, `dist/campus-ui.css`, `dist/mobile.css`: Owned by M3 Worker.
- `dist/app.js`: Owned by M3 Worker.
- `tests/e2e-*.test.mjs`: Owned by E2E Testing Track.
