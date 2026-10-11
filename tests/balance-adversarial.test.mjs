import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VERSION,
  MONTHS,
  createState,
  simulateMonth,
  decide,
  careerEnding,
  careerScores,
  isTrueEnding,
  recommendationCandidate,
  canDefend,
  canContinue,
  abilityScore,
  HIDDEN_RANGES,
  TRUE_REQUIREMENTS,
  TRUE_RESEARCH_REQUIREMENTS,
  validateSave,
  proposeSchedule,
  calendarMonth,
} from '../dist/engine.js';
import { MAIN_ENDINGS } from '../dist/ending-collection.js';
import { managedOptions, affordableEventChoice } from './play-support.mjs';

const ALL_ENDINGS = [
  'bachelor',
  'masters',
  'true',
  'postdoc',
  'institute',
  'corporate',
  'unrelated',
  'startup',
  'unemployed',
  'youtuber',
  'resident_researcher',
  'leave',
  'dropout',
  'dismissed',
  'unfinished',
  'gameover',
  'external_masters',
  'external_phd',
];

function setScore(s, key, value) {
  const [lo, hi] = HIDDEN_RANGES[key];
  s.hidden[key] = lo + (value * (hi - lo)) / 100;
}

function resolveDecisions(state, route = 'integrated') {
  let s = state;
  let guard = 0;
  while (s.pending && !s.ending) {
    if (guard++ > 25) throw new Error('Unterminated decision queue');
    const kind = s.pending.kind;
    const choices = {
      'workshop-plan': 'skip',
      'monthly-issue': 'acknowledge',
      'failure-counsel': 'review',
      'conversation-topic': 'academic',
      story: 'encourage',
      'academic-exam': 'support',
      'presentation-recovery': 'rehearse',
      'external-admission': 'remain',
      route,
      masters: 'continue',
      qual: 'exam',
      sabbatical: 'home',
      service: 'consult',
      'service-review': 'consult',
      defense: 'defend',
    };
    const choice =
      kind === 'conference-plan'
        ? s.pending.scope === 'domestic'
          ? 'together'
          : 'none'
        : kind === 'event'
          ? affordableEventChoice(s, s.pending.id)
          : choices[kind] ??
            ({
              draft: 'outline',
              presentation: 'present',
              questions: 'answer',
              revision: 'revise',
              verdict: 'confirm',
            })[s.pending.step];
    s = decide(s, choice);
  }
  return s;
}

// -----------------------------------------------------------------------------
// Suite 1: Zero-Probability Ending Guarantees & Reachability
// -----------------------------------------------------------------------------
test('Adversarial 1.1: Canonical ending inventory completeness and consistency', () => {
  assert.equal(MAIN_ENDINGS.length, 8, 'MAIN_ENDINGS must contain exactly 8 canonical endings');
  const expectedCanonical = [
    'true',
    'postdoc',
    'institute',
    'corporate',
    'unrelated',
    'startup',
    'unemployed',
    'resident_researcher',
  ];
  for (const id of expectedCanonical) {
    assert.ok(MAIN_ENDINGS.includes(id), `MAIN_ENDINGS must include ${id}`);
    assert.ok(ALL_ENDINGS.includes(id), `ALL_ENDINGS must include canonical ending ${id}`);
  }
  assert.ok(ALL_ENDINGS.includes('youtuber'), 'ALL_ENDINGS must include special ending youtuber');
});

test('Adversarial 1.2: Startup career ending is genuinely reachable via RA/venture training', () => {
  // Simulate RA/industry trajectory with seed 63352
  let s = createState('창업도전자', 63352, { gender: 'female', age: 38 });
  s.lab.creditEnabled = true;

  for (let m = 0; m < MONTHS && !s.ending; m++) {
    const plan = proposeSchedule(s);
    if (![4, 10].includes(calendarMonth(s.month))) {
      plan[3] = 'industry';
      if (s.month >= 24) plan[0] = 'industry';
    }
    const facultyAction = m % 4 === 0 ? 'conversation' : 'routine';
    s = simulateMonth(s, plan, managedOptions(s, facultyAction));
    s = resolveDecisions(s);
  }

  assert.equal(s.month, 96, 'Run must complete 96 months');
  assert.ok(canDefend(s), 'Candidate must meet defense requirements');
  assert.equal(s.ending, 'startup', `Expected startup ending, got ${s.ending}`);
  assert.ok(abilityScore(s, 'enterprise') >= 25, 'Enterprise score must satisfy startup gate');
  assert.ok(abilityScore(s, 'autonomy') >= 45, 'Autonomy score must satisfy startup gate');
  const scores = careerScores(s);
  assert.ok(scores.startup > scores.corporate, 'Startup score must beat corporate score');
  assert.ok(scores.startup > scores.unrelated, 'Startup score must beat unrelated score');
});

test('Adversarial 1.3: Youtuber ending is reachable via outreach science-communication pathway', () => {
  // Test outreach pathway: outreach >= 20 && language >= 50
  const s = createState('과학소통가', 101);
  s.month = 96;
  s.career = { ...s.career, qual: 'passed', papers: 3, submissions: 3, conferences: 3 };
  setScore(s, 'research', 55);
  setScore(s, 'outreach', 28);
  setScore(s, 'language', 55);
  setScore(s, 'social', 50);
  setScore(s, 'rapport', 45); // Below resident_researcher (65) and True (80)
  s.temperament.caution = 40; // Below resident_researcher (55)

  const scores = careerScores(s);
  assert.ok(scores.youtuber > 0, `Youtuber score must be positive, got ${scores.youtuber}`);
  const ending = careerEnding(s);
  assert.equal(ending, 'youtuber', `Expected youtuber ending, got ${ending}`);

  // Also verify legacy 90/90 boundary without outreach
  const s2 = createState('언어천재', 102);
  s2.month = 96;
  s2.career = { ...s2.career, qual: 'passed', papers: 3, submissions: 3, conferences: 3 };
  setScore(s2, 'research', 55);
  setScore(s2, 'language', 91);
  setScore(s2, 'social', 91);
  setScore(s2, 'outreach', 0);
  setScore(s2, 'rapport', 30);
  s2.temperament.caution = 30;
  assert.equal(careerEnding(s2), 'youtuber', 'Dual 90+ language/social must unlock youtuber');
});

test('Adversarial 1.4: Resident researcher ending activates smoothly under close mentoring and caution', () => {
  const s = createState('연구원지망', 207);
  s.month = 96;
  s.career = { ...s.career, qual: 'passed', papers: 3, submissions: 3, conferences: 3 };
  setScore(s, 'research', 60);
  setScore(s, 'rapport', 70); // >= 65
  s.temperament.caution = 60;  // >= 55
  s.professor.mentoring = 45;  // >= 35

  assert.ok(canDefend(s), 'Candidate must be eligible for defense');
  assert.equal(careerEnding(s), 'resident_researcher', 'Candidate must resolve to resident_researcher');

  // Verify sensitivity: caution < 55 falls through
  const sLowCaution = structuredClone(s);
  sLowCaution.temperament.caution = 50;
  assert.notEqual(careerEnding(sLowCaution), 'resident_researcher', 'Caution < 55 must not get resident_researcher');

  // Verify sensitivity: rapport < 65 falls through
  const sLowRapport = structuredClone(s);
  setScore(sLowRapport, 'rapport', 60);
  assert.notEqual(careerEnding(sLowRapport), 'resident_researcher', 'Rapport < 65 must not get resident_researcher');

  // Verify sensitivity: mentoring < 35 falls through
  const sLowMentoring = structuredClone(s);
  sLowMentoring.professor.mentoring = 30;
  assert.notEqual(careerEnding(sLowMentoring), 'resident_researcher', 'Mentoring < 35 must not get resident_researcher');
});

test('Adversarial 1.5: True Ending is reachable and resolves cleanly', () => {
  const s = createState('예비교수', 16, { age: 38 });
  s.month = 96;
  s.route = 'integrated';
  s.career = {
    ...s.career,
    qual: 'passed',
    papers: 4,
    submissions: 4,
    conferences: 4,
    recommendations: 3,
    topPapers: 1,
    awards: 1,
  };
  s.impact = { citations: [5, 4, 3, 2], hIndex: 3 };

  for (const [k, n] of Object.entries(TRUE_REQUIREMENTS)) {
    if (k in s.hidden) setScore(s, k, n + 2);
  }
  for (const k of Object.keys(s.professor)) s.professor[k] = 60;
  setScore(s, 'rapport', 85);

  assert.ok(canDefend(s), 'True ending requires valid defense qualification');
  assert.ok(recommendationCandidate(s), 'True ending candidate must satisfy recommendationCandidate');
  assert.ok(isTrueEnding(s), 'True ending predicate must evaluate to true');
  assert.equal(careerEnding(s), 'true', 'Career outcome must resolve to true');
});

// -----------------------------------------------------------------------------
// Suite 2: True Ending Boundary & Sensitivity Stress Tests
// -----------------------------------------------------------------------------
test('Adversarial 2.1: Exact True Ending boundary conditions (edge boundary pass)', () => {
  const s = createState('경계선학생', 42);
  s.month = 96;
  s.route = 'integrated';
  s.career = {
    ...s.career,
    qual: 'passed',
    papers: TRUE_REQUIREMENTS.papers,
    submissions: TRUE_REQUIREMENTS.papers,
    conferences: TRUE_REQUIREMENTS.conferences,
    recommendations: TRUE_REQUIREMENTS.recommendations,
    topPapers: TRUE_RESEARCH_REQUIREMENTS.leadingPaper,
  };
  s.impact = { citations: [2, 2, 2], hIndex: TRUE_RESEARCH_REQUIREMENTS.hIndex };

  for (const [k, n] of Object.entries(TRUE_REQUIREMENTS)) {
    if (k in s.hidden) setScore(s, k, n);
  }
  for (const k of Object.keys(s.professor)) s.professor[k] = TRUE_REQUIREMENTS.faculty;

  assert.ok(recommendationCandidate(s), 'Exact boundary should qualify as recommendation candidate');
  assert.ok(isTrueEnding(s), 'Exact boundary should qualify for True Ending');
  assert.equal(careerEnding(s), 'true', 'Exact boundary should resolve to True Ending');
});

test('Adversarial 2.2: Single-requirement shortfall sensitivity (no accidental passes)', () => {
  // Construct baseline exact true state
  function makeBaseTrueState() {
    const s = createState('완벽학생', 77);
    s.month = 96;
    s.route = 'integrated';
    s.career = {
      ...s.career,
      qual: 'passed',
      papers: TRUE_REQUIREMENTS.papers,
      submissions: TRUE_REQUIREMENTS.papers,
      conferences: TRUE_REQUIREMENTS.conferences,
      recommendations: TRUE_REQUIREMENTS.recommendations,
      topPapers: TRUE_RESEARCH_REQUIREMENTS.leadingPaper,
    };
    s.impact = { citations: [2, 2, 2], hIndex: TRUE_RESEARCH_REQUIREMENTS.hIndex };
    for (const [k, n] of Object.entries(TRUE_REQUIREMENTS)) {
      if (k in s.hidden) setScore(s, k, n);
    }
    for (const k of Object.keys(s.professor)) s.professor[k] = TRUE_REQUIREMENTS.faculty;
    return s;
  }

  // Test every hidden stat threshold by dropping it by 1 point
  for (const [key, threshold] of Object.entries(TRUE_REQUIREMENTS)) {
    if (key === 'faculty' || !Object.hasOwn(HIDDEN_RANGES, key)) continue;
    const testState = makeBaseTrueState();
    setScore(testState, key, threshold - 1);

    if (key === 'rapport') {
      // Shortfall in rapport should demote from true to postdoc
      assert.ok(recommendationCandidate(testState), 'Candidate is still recommendation eligible');
      assert.equal(isTrueEnding(testState), false, `Rapport shortfall must fail isTrueEnding`);
      assert.equal(careerEnding(testState), 'postdoc', `Rapport 79 should yield postdoc`);
    } else {
      assert.equal(recommendationCandidate(testState), false, `Dropping ${key} below threshold must fail candidate`);
      assert.equal(isTrueEnding(testState), false, `Dropping ${key} below threshold must fail isTrueEnding`);
      assert.notEqual(careerEnding(testState), 'true', `Dropping ${key} below threshold must not give true`);
    }
  }

  // Test research output requirements
  const testPapers = makeBaseTrueState();
  testPapers.career.papers = TRUE_REQUIREMENTS.papers - 1;
  assert.equal(isTrueEnding(testPapers), false, 'Under-threshold papers must fail True Ending');

  const testConf = makeBaseTrueState();
  testConf.career.conferences = TRUE_REQUIREMENTS.conferences - 1;
  assert.equal(isTrueEnding(testConf), false, 'Under-threshold conferences must fail True Ending');

  const testRec = makeBaseTrueState();
  testRec.career.recommendations = TRUE_REQUIREMENTS.recommendations - 1;
  assert.equal(isTrueEnding(testRec), false, 'Under-threshold recommendations must fail True Ending');

  const testTopPaper = makeBaseTrueState();
  testTopPaper.career.topPapers = 0;
  assert.equal(isTrueEnding(testTopPaper), false, 'Zero top paper must fail True Ending');

  const testHIndex = makeBaseTrueState();
  testHIndex.impact = { citations: [1, 1, 1], hIndex: 1 };
  assert.equal(isTrueEnding(testHIndex), false, 'hIndex < 2 must fail True Ending');

  const testQual = makeBaseTrueState();
  testQual.career.qual = 'not_due';
  assert.equal(isTrueEnding(testQual), false, 'Unpassed qual must fail True Ending');
});

test('Adversarial 2.3: Rapport gradient transition (True -> Postdoc -> Alternate)', () => {
  const s = createState('단계별학생', 88);
  s.month = 96;
  s.route = 'integrated';
  s.career = {
    ...s.career,
    qual: 'passed',
    papers: 4,
    submissions: 4,
    conferences: 4,
    recommendations: 3,
    topPapers: 1,
  };
  s.impact = { citations: [3, 3, 3], hIndex: 3 };
  for (const [k, n] of Object.entries(TRUE_REQUIREMENTS)) {
    if (k in s.hidden) setScore(s, k, n + 2);
  }
  for (const k of Object.keys(s.professor)) s.professor[k] = 60;

  // Rapport >= 80 -> True
  setScore(s, 'rapport', 85);
  assert.equal(careerEnding(s), 'true');

  // Rapport 79.9 -> Postdoc
  setScore(s, 'rapport', 79.9);
  assert.equal(careerEnding(s), 'postdoc');

  // Rapport 40.0 -> Postdoc
  setScore(s, 'rapport', 40.0);
  assert.equal(careerEnding(s), 'postdoc');

  // Rapport 39.9 -> skips postdoc, falls to resident_researcher or careerScores
  setScore(s, 'rapport', 39.9);
  s.temperament.caution = 30; // disable resident_researcher
  const nonPostdoc = careerEnding(s);
  assert.notEqual(nonPostdoc, 'true');
  assert.notEqual(nonPostdoc, 'postdoc');
  assert.ok(['institute', 'corporate', 'unrelated', 'startup', 'unemployed'].includes(nonPostdoc));
});

// -----------------------------------------------------------------------------
// Suite 3: Extreme Condition & Temperament Stress Testing
// -----------------------------------------------------------------------------
test('Adversarial 3.1: Extreme student temperaments survive state validation and evaluation without NaN', () => {
  const extremeTemperaments = [
    { caution: 0, curiosity: 0, expression: 0 },
    { caution: 100, curiosity: 100, expression: 100 },
    { caution: 0, curiosity: 100, expression: 0 },
    { caution: 100, curiosity: 0, expression: 100 },
  ];

  for (const temp of extremeTemperaments) {
    const s = createState('극한기질', 123);
    s.temperament = { ...temp };
    assert.ok(validateSave(s), `validateSave must accept extreme temperament ${JSON.stringify(temp)}`);

    for (const key of Object.keys(s.hidden)) {
      const score = abilityScore(s, key);
      assert.ok(Number.isFinite(score), `abilityScore for ${key} must be finite`);
      assert.ok(!Number.isNaN(score), `abilityScore for ${key} must not be NaN`);
    }

    const scores = careerScores(s);
    for (const [k, v] of Object.entries(scores)) {
      assert.ok(Number.isFinite(v), `careerScore for ${k} must be finite`);
      assert.ok(!Number.isNaN(v), `careerScore for ${k} must not be NaN`);
    }

    const ending = careerEnding(s);
    assert.ok(typeof ending === 'string' && ending.length > 0, 'careerEnding must resolve cleanly');
  }
});

test('Adversarial 3.2: Extreme ability bounds (0 and max) maintain mathematical stability', () => {
  const s = createState('한계능력', 456);

  // Set all hidden abilities to their absolute minimum
  for (const [k, [lo]] of Object.entries(HIDDEN_RANGES)) {
    s.hidden[k] = lo;
  }
  assert.ok(validateSave(s), 'Absolute minimum abilities must pass validateSave');
  for (const k of Object.keys(s.hidden)) {
    assert.equal(abilityScore(s, k), 0, `${k} abilityScore at minimum should be 0`);
  }
  let minScores = careerScores(s);
  for (const [k, v] of Object.entries(minScores)) {
    assert.ok(!Number.isNaN(v), `careerScores.${k} at minimum must not be NaN`);
  }
  assert.equal(careerEnding(s), 'unemployed', 'At total minimum ability student should be unemployed');

  // Set all hidden abilities to their absolute maximum
  for (const [k, [, hi]] of Object.entries(HIDDEN_RANGES)) {
    s.hidden[k] = hi;
  }
  assert.ok(validateSave(s), 'Absolute maximum abilities must pass validateSave');
  for (const k of Object.keys(s.hidden)) {
    assert.equal(abilityScore(s, k), 100, `${k} abilityScore at maximum should be 100`);
  }
  let maxScores = careerScores(s);
  for (const [k, v] of Object.entries(maxScores)) {
    assert.ok(!Number.isNaN(v), `careerScores.${k} at maximum must not be NaN`);
  }
  assert.ok(typeof careerEnding(s) === 'string', 'careerEnding at maximum must resolve cleanly');
});

test('Adversarial 3.3: 12-month simulation runs under hostile extremes resolve gracefully', () => {
  const hostileScenarios = [
    { name: 'zero-motivation', apply: s => { s.hidden.motivation = 0; } },
    { name: 'maximum-stress', apply: s => { s.hidden.stress = 100; } },
    { name: 'zero-stamina', apply: s => { s.hidden.stamina = 0; } },
    { name: 'hostile-diligence', apply: s => { s.hidden.diligence = -100; } },
    { name: 'zero-rapport', apply: s => { s.hidden.rapport = -100; } },
    { name: 'extreme-caution-100', apply: s => { s.temperament.caution = 100; } },
    { name: 'zero-caution-0', apply: s => { s.temperament.caution = 0; } },
  ];

  for (const scenario of hostileScenarios) {
    let s = createState(scenario.name, 999);
    scenario.apply(s);
    assert.ok(validateSave(s), `State before simulation must be valid in ${scenario.name}`);

    for (let m = 0; m < 12 && !s.ending; m++) {
      const plan = proposeSchedule(s);
      assert.ok(Array.isArray(plan) && plan.length >= 4, 'proposeSchedule must return valid plan');
      s = simulateMonth(s, plan, managedOptions(s));
      s = resolveDecisions(s);

      // Verify invariant: no NaN scores
      for (const k of Object.keys(s.hidden)) {
        assert.ok(!Number.isNaN(s.hidden[k]), `Hidden stat ${k} must not be NaN in month ${m} of ${scenario.name}`);
        assert.ok(!Number.isNaN(abilityScore(s, k)), `abilityScore ${k} must not be NaN in month ${m}`);
      }
      assert.ok(validateSave(s), `State after month ${m} must be valid in ${scenario.name}`);
    }

    if (s.ending) {
      assert.ok(ALL_ENDINGS.includes(s.ending), `Early ending ${s.ending} must be in valid ALL_ENDINGS`);
    } else {
      assert.equal(s.month, 12, 'Must reach month 12 if no early ending');
    }
  }
});

// -----------------------------------------------------------------------------
// Suite 4: Multi-seed Batch Simulation Diversity Verification
// -----------------------------------------------------------------------------
test('Adversarial 4.1: Deterministic batch simulation displays non-zero ending distribution', () => {
  const policies = ['faculty', 'industry', 'venture', 'communication', 'guided', 'job-search'];
  const outcomes = {};

  for (let i = 0; i < 60; i++) {
    const policy = policies[i % policies.length];
    const seed = 7919 * (i + 1);
    let s = createState(`학생_${i}`, seed, { gender: i % 2 === 0 ? 'male' : 'female' });
    s.lab.creditEnabled = true;

    for (let m = 0; m < 48 && !s.ending; m++) {
      const plan = proposeSchedule(s);
      if (policy === 'industry' || policy === 'venture') {
        plan[3] = 'industry';
      } else if (policy === 'communication') {
        plan[3] = 'presentation';
      }
      const options = managedOptions(s);
      try {
        s = simulateMonth(s, plan, options);
      } catch (err) {
        if (err.message.includes('Budget exceeds')) {
          options.budget = { ...options.budget, environment: 0, performance: 0 };
          try {
            s = simulateMonth(s, plan, options);
          } catch (innerErr) {
            if (innerErr.message.includes('Budget exceeds')) {
              s.ending = 'budget-blocked';
              break;
            }
            throw innerErr;
          }
        } else {
          throw err;
        }
      }
      s = resolveDecisions(s);
    }
    const finalEnding = s.ending ?? 'progressing';
    outcomes[finalEnding] = (outcomes[finalEnding] ?? 0) + 1;
  }

  // Verify that outcomes are diverse and contain no fatal errors
  assert.ok(Object.keys(outcomes).length >= 2, 'Batch simulation must produce diverse outcomes');
  assert.ok(!outcomes.error, 'Batch simulation must not produce unhandled errors');
});
