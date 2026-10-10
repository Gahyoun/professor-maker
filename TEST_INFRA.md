# E2E Test Infra: Professor Maker Inspection & Enhancement

## Test Philosophy
- **Opaque-box & Requirement-driven**: Derived directly from `ORIGINAL_REQUEST.md` and user-facing specifications, rather than internal implementation details.
- **Progressive Testability**: Verification mechanisms must not presuppose or require features more complex than what is being tested.
- **Methodology**: Systematic 4-tier testing hierarchy (Category-Partition + Boundary Value Analysis + Pairwise Combinatorial Testing + Real-World Workload Testing).

---

## Feature Inventory & Tier Mapping
| # | Feature | Requirement Source | Tier 1 (Coverage) | Tier 2 (Boundary) | Tier 3 (Pairwise) | Tier 4 (Workload) |
|---|---------|-------------------|:-----------------:|:-----------------:|:-----------------:|:-----------------:|
| F1 | Narrative Integrity & Syntax | R1 Acceptance Criteria | 5 | 5 | ✓ | ✓ |
| F2 | Orthography & Grammar Polish | R1 Acceptance Criteria | 5 | 5 | ✓ | ✓ |
| F3 | Warm Student Guidance Events | R1 Core Directive | 5 | 5 | ✓ | ✓ |
| F4 | Narrative Principles & Dignity | R1 Core Directive | 5 | 5 | ✓ | ✓ |
| F5 | Activity Stat Progression | R2 Balance Req | 5 | 5 | ✓ | ✓ |
| F6 | Ending Probability & Thresholds | R2 Acceptance Criteria | 5 | 5 | ✓ | ✓ |
| F7 | 10k Simulation Non-Zero Guarantees | R2 Acceptance Criteria | 5 | 5 | ✓ | ✓ |
| F8 | Mobile Typography & Legibility | R3 UI/UX Req | 5 | 5 | ✓ | ✓ |
| F9 | Touch Target Accessibility | R3 UI/UX Req | 5 | 5 | ✓ | ✓ |
| F10 | UI DOM Stability & Rendering Safety | R3 UI/UX Req | 5 | 5 | ✓ | ✓ |
| F11 | System Stability & 100% npm test Pass | AC System Stability | 5 | 5 | ✓ | ✓ |

---

## Coverage Thresholds
Given N = 11 identified feature areas:
- **Tier 1 (Feature Coverage)**: ≥5 test cases per feature = **55 test cases minimum**.
- **Tier 2 (Boundary & Corner Cases)**: ≥5 test cases per feature = **55 test cases minimum**.
- **Tier 3 (Cross-Feature Combinations)**: ≥11 pairwise interaction test cases.
- **Tier 4 (Real-World Application Scenarios)**: max(5, 11 ÷ 2) = **6 realistic end-to-end multi-year student journeys**.
- **Total Minimum**: ~127 comprehensive opaque-box test cases.

---

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Description |
|---|----------|--------------------|-------------|
| S1 | Warm Mentoring & True Ending Journey | F1, F3, F4, F5, F6, F11 | 96-month student journey focusing on continuous advising, high rapport, and successful faculty appointment. |
| S2 | Venture/Startup Career Journey | F3, F5, F6, F7, F11 | RA industry-focused student who develops enterprise skill, overcomes setbacks with guidance, and launches an academic startup. |
| S3 | Science Communicator Journey | F3, F5, F6, F7, F11 | Presentation-heavy student who explores outreach, receives communication mentoring, and achieves science communicator ending. |
| S4 | Resident Researcher Warm Recovery | F1, F3, F4, F6, F7 | Cautious doctoral student who successfully defends dissertation with warm adviser rapport and continues research on campus. |
| S5 | Burnout Crisis & Recovery Journey | F3, F4, F5, F10, F11 | Student experiencing severe stress / late-night fatigue who recovers through warm guidance events and graduates safely. |
| S6 | Mobile Responsive End-to-End Play | F8, F9, F10, F11 | Complete UI play-through on mobile viewport (390px) verifying font readability, touch target sizing, and zero console errors. |

---

## Test Architecture & Runner
- **Runner**: Node.js native test runner (`node --test tests/e2e-suite.test.mjs`) and Playwright for UI tests.
- **Pass/Fail Semantics**: All assertions must pass with exit code 0. Zero console error outputs.
- **Output Artifact**: `TEST_READY.md` generated upon suite verification.
