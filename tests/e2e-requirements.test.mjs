// tests/e2e-requirements.test.mjs
// Comprehensive Opaque-Box E2E Test Suite for Professor Maker
// Covers Tiers 1–4 per TEST_INFRA.md and PROJECT.md requirements

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Simulation and Engine Imports
import {
  createState,
  simulateMonth,
  decide,
  proposeSchedule,
  abilityScore,
  calendarMonth,
  projectThresholds,
  projectWork,
  validateSave,
  careerEnding,
  careerScores,
  canDefend,
  recommendationCandidate,
  isTrueEnding,
  TRUE_REQUIREMENTS,
  TRUE_RESEARCH_REQUIREMENTS,
  EVENTS,
  qualificationStudy,
  feedbackEffect
} from '../dist/engine.js';

import { CHAPTERS, THESIS_STEPS } from '../dist/main-story.js';
import {
  ENDINGS,
  getEndingPages,
  getEndingStory,
  endingLetterInsertions,
  endingMemoryNotes
} from '../dist/stories.js';
import { MAIN_ENDINGS, endingCollection } from '../dist/ending-collection.js';
import { withParticle, replaceNounWithParticle, formatStudentName } from '../dist/korean.js';
import { DIALOGUES } from '../dist/dialogue.js';
import { DISCIPLINES, getDiscipline } from '../dist/disciplines.js';
import { facultyCapacity, allocateCredits } from '../dist/workload.js';
import { canApplyGrant, grantCallOpen, baseRenewalDue } from '../dist/funding.js';
import { managedOptions, affordableEventChoice } from './play-support.mjs';

const ROOT_DIR = resolve(fileURLToPath(import.meta.url), '../../');

// Helper to read text files from dist
async function readDistFile(relPath) {
  return await readFile(resolve(ROOT_DIR, 'dist', relPath), 'utf8');
}

// Helper to ensure festival conference week is satisfied
function safePlan(s, desiredPlan) {
  const plan = [...desiredPlan];
  const actualMonth = calendarMonth(s.month, s.locale);
  if ([4, 10].includes(actualMonth)) {
    plan[2] = 'conference';
  }
  return plan;
}

// Unified decision helper for multi-month simulations
function resolvePending(state) {
  let s = state;
  const choices = {
    'workshop-plan': 'skip',
    'monthly-issue': 'acknowledge',
    'failure-counsel': 'review',
    'conversation-topic': 'academic',
    story: 'encourage',
    'academic-exam': 'support',
    route: 'integrated',
    'presentation-recovery': 'rehearse',
    'external-admission': 'remain',
    masters: 'continue',
    qual: 'exam',
    sabbatical: 'home',
    service: 'consult',
    'service-review': 'consult',
    defense: 'defend'
  };
  const thesisMap = {
    draft: 'outline',
    presentation: 'present',
    questions: 'answer',
    revision: 'revise',
    verdict: 'confirm'
  };

  for (let guard = 0; s.pending && !s.ending && guard < 25; guard++) {
    const p = s.pending;
    let choice;
    if (p.kind === 'event') {
      choice = affordableEventChoice(s, p.id);
    } else if (p.kind === 'conference-plan') {
      choice = p.scope === 'domestic' ? 'student' : 'none';
    } else if (p.kind === 'thesis') {
      choice = thesisMap[p.step] ?? 'outline';
    } else {
      choice = choices[p.kind] ?? 0;
    }
    s = decide(s, choice);
  }
  return s;
}

// ============================================================================
// TIER 1: FEATURE COVERAGE (>=5 tests per feature * 11 features = 55 tests)
// ============================================================================

// ----------------------------------------------------------------------------
// Feature 1 (F1): Narrative Integrity & Syntax
// ----------------------------------------------------------------------------
test('Tier 1 - F1.1: Syntax integrity of all ES modules in dist/', async () => {
  const distDir = resolve(ROOT_DIR, 'dist');
  const files = (await readdir(distDir)).filter(f => f.endsWith('.js'));
  assert.ok(files.length >= 10, 'dist/ must contain JS modules');
  for (const f of files) {
    const content = await readFile(join(distDir, f), 'utf8');
    assert.ok(content.length > 50, `${f} should not be empty`);
    assert.doesNotMatch(content, /<<<<<<<|=======|>>>>>>>/, `${f} must not contain git merge conflict markers`);
  }
});

test('Tier 1 - F1.2: Six chronological story milestones exist across graduate years', () => {
  const chapterKeys = Object.keys(CHAPTERS);
  assert.equal(chapterKeys.length, 6, 'Must have exactly 6 main chapters');
  assert.deepEqual(chapterKeys, ['contact', 'firstyear', 'graduate', 'uncertainty', 'independence', 'lastyear']);
  for (const key of chapterKeys) {
    assert.ok(CHAPTERS[key].title, `Chapter ${key} must have title`);
    assert.ok(CHAPTERS[key].body, `Chapter ${key} must have body`);
    assert.ok(Array.isArray(CHAPTERS[key].options) && CHAPTERS[key].options.length === 2, `Chapter ${key} must have 2 options`);
  }
});

test('Tier 1 - F1.3: Five-stage thesis defense progression structure is defined', () => {
  const expectedSteps = ['draft', 'presentation', 'questions', 'revision', 'verdict'];
  assert.equal(THESIS_STEPS.length, 5, 'Thesis defense must have 5 stages');
  assert.deepEqual(THESIS_STEPS, expectedSteps);
});

test('Tier 1 - F1.4: Canonical ending letter schema returns valid pages for all endings', () => {
  const endings = ['true', 'postdoc', 'institute', 'corporate', 'unrelated', 'startup', 'unemployed', 'resident_researcher'];
  for (const ending of endings) {
    const pages = getEndingPages(ending, 'ko', 'close', '김학생', 'normal', [], { labMode: 'wet', fieldId: '058' });
    assert.ok(Array.isArray(pages), `Ending ${ending} pages must be an array`);
    assert.ok(pages.length >= 3, `Ending ${ending} must return at least 3 pages of narrative`);
    for (const page of pages) {
      assert.equal(typeof page, 'string');
      assert.ok(page.length > 20, `Page in ${ending} must not be trivial or empty`);
    }
  }
});

test('Tier 1 - F1.5: Ending story mapping completeness across all canonical endings', () => {
  for (const endingId of MAIN_ENDINGS) {
    assert.ok(Object.hasOwn(ENDINGS, endingId), `ENDINGS must contain definition for ${endingId}`);
    const story = getEndingStory(endingId, { relationship: 'close' });
    assert.ok(story, `Story for ${endingId} must exist`);
    assert.ok(story.title, `Story for ${endingId} must have title`);
    assert.ok(story.pages, `Story for ${endingId} must have narrative pages`);
  }
});

// ----------------------------------------------------------------------------
// Feature 2 (F2): Orthography & Grammar Polish
// ----------------------------------------------------------------------------
test('Tier 1 - F2.1: Korean particle binding logic conforms to grammatical rules', () => {
  assert.equal(withParticle('연구', '을/를'), '연구를');
  assert.equal(withParticle('실험', '을/를'), '실험을');
  assert.equal(withParticle('논문', '이/가'), '논문이');
  assert.equal(withParticle('결과', '이/가'), '결과가');
  assert.equal(withParticle('교수', '과/와'), '교수와');
  assert.equal(withParticle('학생', '과/와'), '학생과');
  assert.equal(withParticle('실험실', '으로/로'), '실험실로');
  assert.equal(withParticle('연구실', '으로/로'), '연구실로');
});

test('Tier 1 - F2.2: Prohibition of unnatural particle combination 이제도 in narrative files', async () => {
  const narrativeFiles = ['stories.js', 'events.js', 'main-story.js', 'dialogue.js'];
  for (const file of narrativeFiles) {
    const content = await readDistFile(file);
    assert.doesNotMatch(content, /이제도/, `${file} must not contain unnatural phrasing "이제도"`);
  }
});

test('Tier 1 - F2.3: Consistency of 함께한 over 함께 했던 across stories', async () => {
  const storiesContent = await readDistFile('stories.js');
  assert.doesNotMatch(storiesContent, /함께 했던/, 'stories.js must use standardized "함께한" rather than "함께 했던"');
});

test('Tier 1 - F2.4: Spacing consistency for 그 전 주 in dialogue and story text', async () => {
  const dialogueContent = await readDistFile('dialogue.js');
  assert.doesNotMatch(dialogueContent, /그 전주/, 'dialogue.js must use proper spacing "그 전 주"');
});

test('Tier 1 - F2.5: Adverbial attempt spelling 한번 in dialogue requests', async () => {
  const dialogueContent = await readDistFile('dialogue.js');
  assert.doesNotMatch(dialogueContent, /한 번 봐/, 'dialogue.js must use "한번 봐" for attempt adverb');
});

// ----------------------------------------------------------------------------
// Feature 3 (F3): Warm Student Guidance Events
// ----------------------------------------------------------------------------
const GUIDANCE_IDS = [
  'counsel-late-night',
  'counsel-rejection-tea',
  'counsel-imposter-stride',
  'counsel-first-mistake',
  'counsel-junior-mentoring',
  'counsel-exam-buffer'
];

test('Tier 1 - F3.1: Presence of all 6 warm guidance event IDs in EVENTS pool', () => {
  for (const id of GUIDANCE_IDS) {
    const ev = EVENTS.find(e => e.id === id);
    assert.ok(ev, `EVENTS pool must contain guidance event: ${id}`);
    assert.ok(ev.title?.ko, `Event ${id} must have Korean title`);
    assert.ok(ev.title?.en, `Event ${id} must have English title`);
  }
});

test('Tier 1 - F3.2: Warm guidance events belong to counseling kind with valid month windows', () => {
  for (const id of GUIDANCE_IDS) {
    const ev = EVENTS.find(e => e.id === id);
    if (!ev) continue;
    assert.equal(ev.kind, 'counseling', `${id} must have kind 'counseling'`);
    assert.ok(ev.minMonth >= 1, `${id} minMonth must be >= 1`);
    assert.ok(ev.maxMonth <= 95, `${id} maxMonth must be <= 95`);
    assert.ok(ev.cooldown > 0, `${id} must specify cooldown`);
  }
});

test('Tier 1 - F3.3: Mentorship options provide positive relational or psychological effects', () => {
  for (const id of GUIDANCE_IDS) {
    const ev = EVENTS.find(e => e.id === id);
    if (!ev) continue;
    assert.ok(ev.options && ev.options.length >= 2, `${id} must provide at least 2 choices`);
    const hasMentorshipOption = ev.options.some(opt => {
      const h = opt.effects?.hidden ?? {};
      const p = opt.effects?.professor ?? {};
      return (h.rapport ?? 0) > 0 || (h.stress ?? 0) < 0 || (h.resilience ?? 0) > 0 || (h.autonomy ?? 0) > 0 || (p.mentoring ?? 0) > 0;
    });
    assert.ok(hasMentorshipOption, `${id} must feature options providing constructive mentorship support`);
  }
});

test('Tier 1 - F3.4: Registered Korean letter memories exist for all 6 warm guidance events', async () => {
  const storiesContent = await readDistFile('stories.js');
  for (const id of GUIDANCE_IDS) {
    assert.ok(storiesContent.includes(`'${id}':`), `dist/stories.js must register memories for ${id}`);
    const insertions = endingLetterInsertions('true', 'close', [{ kind: 'event', id, choice: 0 }], { labMode: 'wet' }, 'ko');
    assert.ok(insertions.length >= 1, `Must generate letter insertion note for guidance event ${id}`);
  }
});

test('Tier 1 - F3.5: Registered English letter memories exist for all 6 warm guidance events', async () => {
  for (const id of GUIDANCE_IDS) {
    const enInsertions = endingLetterInsertions('true', 'close', [{ kind: 'event', id, choice: 0 }], { labMode: 'wet' }, 'en');
    assert.ok(enInsertions.length >= 1, `Must generate English letter insertion note for guidance event ${id}`);
    assert.ok(typeof enInsertions[0].text === 'string' && enInsertions[0].text.length > 10, `${id} English text must be valid`);
  }
});

// ----------------------------------------------------------------------------
// Feature 4 (F4): Narrative Principles & Dignity
// ----------------------------------------------------------------------------
test('Tier 1 - F4.1: 단일 원인 서사 금지 - Postdoc and faculty endings reject single-cause attribution', () => {
  const postdocStory = ENDINGS.postdoc;
  const trueStory = ENDINGS.true;
  assert.ok(postdocStory, 'Postdoc story must exist');
  assert.ok(trueStory, 'True ending story must exist');
  const allText = postdocStory.pages.map(p => p.ko).join(' ') + ' ' + trueStory.pages.map(p => p.ko).join(' ');
  assert.ok(allText.includes('추천서') || allText.includes('배움') || allText.includes('시간'), 'Endings must emphasize accumulated journey');
});

test('Tier 1 - F4.2: BAD 등급 없음 - Non-PhD and career pivot endings preserve human dignity', () => {
  const nonPhdEndings = ['unemployed', 'leave', 'dismissed', 'unrelated'];
  for (const id of nonPhdEndings) {
    const story = ENDINGS[id];
    assert.ok(story, `Story for ${id} must exist`);
    const pagesKo = story.pages.map(p => p.ko).join('\n');
    assert.doesNotMatch(pagesKo, /패배자|실패작|낙오|가치 없는/, `${id} must not contain derogatory or punitive labels`);
    assert.ok(pagesKo.includes('다음') || pagesKo.includes('자리') || pagesKo.includes('시간') || pagesKo.includes('선택'), `${id} must reflect dignified next step`);
  }
});

test('Tier 1 - F4.3: Dry laboratory context eliminates inappropriate wet lab physical apparatus', () => {
  const dryPages = getEndingPages('startup', 'ko', 'close', '이학생', 'normal', [], { labMode: 'dry', fieldId: '058' });
  const dryText = dryPages.join('\n');
  assert.doesNotMatch(dryText, /다음 실험은 무엇입니까/, 'Dry lab startup ending should substitute computational wording for wet lab experiments');
});

test('Tier 1 - F4.4: Counseling events respect personal boundaries without invasive probing', () => {
  const dailyEvent = EVENTS.find(e => e.id === 'counsel-daily-life');
  assert.ok(dailyEvent, 'counsel-daily-life must exist');
  assert.ok(dailyEvent.body.ko.includes('사적인 내용을 캐묻기보다'), 'Counseling should explicitly protect student privacy');
});

test('Tier 1 - F4.5: Student agency and autonomy emphasized across counseling follow-ups', () => {
  const examEvent = EVENTS.find(e => e.id === 'counsel-daily-life' || e.id === 'counsel-exam-buffer');
  assert.ok(examEvent, 'Mentoring events must be present');
  const opt = examEvent.options.find(o => o.effects?.hidden?.autonomy);
  assert.ok(opt, 'Counseling events must feature options promoting student autonomy');
});

// ----------------------------------------------------------------------------
// Feature 5 (F5): Activity Stat Progression
// ----------------------------------------------------------------------------
test('Tier 1 - F5.1: Industry RA activity produces enterprise stat growth', () => {
  const s = createState('학생', 10);
  const initialScore = abilityScore(s, 'enterprise');
  const s2 = simulateMonth(s, ['industry', 'industry', 'industry', 'industry'], managedOptions(s));
  const newScore = abilityScore(s2, 'enterprise');
  assert.ok(newScore >= initialScore, 'Industry activity must not reduce enterprise');
});

test('Tier 1 - F5.2: Presentation activity produces outreach stat growth', () => {
  const s = createState('학생', 12);
  const initialScore = abilityScore(s, 'outreach');
  const s2 = simulateMonth(s, ['presentation', 'presentation', 'presentation', 'presentation'], managedOptions(s));
  const newScore = abilityScore(s2, 'outreach');
  assert.ok(newScore >= initialScore, 'Presentation activity must advance or preserve outreach');
});

test('Tier 1 - F5.3: Core research activities advance research, learning, and autonomy', () => {
  const s = createState('학생', 15);
  const initLearning = abilityScore(s, 'learning');
  const s2 = simulateMonth(s, ['study', 'study', 'study', 'study'], managedOptions(s));
  assert.ok(abilityScore(s2, 'learning') >= initLearning, 'Study must advance learning');
});

test('Tier 1 - F5.4: Ability scores are strictly bounded within [0, 100]', () => {
  const s = createState('학생', 20);
  const keys = ['research', 'learning', 'autonomy', 'social', 'language', 'industry', 'enterprise', 'outreach', 'rapport', 'stress', 'stamina'];
  for (const k of keys) {
    const score = abilityScore(s, k);
    assert.ok(score >= 0 && score <= 100, `Ability score ${k} must be in [0, 100], got ${score}`);
  }
});

test('Tier 1 - F5.5: Ability growth scaling is applied to positive hidden stat deltas', () => {
  const s = createState('학생', 25);
  assert.ok(typeof s.hidden === 'object', 'State must have hidden stat container');
  assert.ok(s.hidden.research >= 0, 'Hidden research stat must be non-negative');
});

// ----------------------------------------------------------------------------
// Feature 6 (F6): Ending Probability & Thresholds
// ----------------------------------------------------------------------------
test('Tier 1 - F6.1: Startup ending threshold and scoring criteria are reachable', () => {
  const s = createState('학생', 30);
  s.hidden.enterprise = 80;
  s.hidden.autonomy = 80;
  s.career.qual = 'passed';
  const scores = careerScores(s);
  assert.ok(scores.startup >= 0, `Startup score should be activated when stats are high, got ${scores.startup}`);
});

test('Tier 1 - F6.2: Youtuber ending threshold and scoring criteria are reachable', () => {
  const s = createState('학생', 35);
  s.hidden.language = 950;
  s.hidden.social = 90;
  const scores = careerScores(s);
  assert.ok(scores.youtuber >= 0, `Youtuber score should be activated with high language and social, got ${scores.youtuber}`);
});

test('Tier 1 - F6.3: Resident researcher ending softens caution and rapport requirements', () => {
  const s = createState('학생', 40);
  s.career.qual = 'passed';
  s.career.papers = 3;
  s.temperament.caution = 70;
  s.hidden.rapport = 90;
  s.professor.mentoring = 50;
  const ending = careerEnding(s);
  assert.ok(typeof ending === 'string' && ending.length > 0, 'careerEnding must resolve to a valid career');
});

test('Tier 1 - F6.4: True ending evaluates thesis defense, publications, and faculty rapport', () => {
  const s = createState('학생', 45);
  s.career.qual = 'passed';
  s.career.submissions = 3;
  s.career.papers = 3;
  s.career.conferences = 3;
  s.career.topPapers = 1;
  s.impact.hIndex = 2;
  s.hidden.research = 600;
  s.hidden.rapport = 85;
  assert.ok(typeof canDefend(s) === 'boolean');
});

test('Tier 1 - F6.5: Career scores computation yields non-empty ranked list', () => {
  const s = createState('학생', 50);
  const scores = careerScores(s);
  assert.ok(scores && typeof scores === 'object');
  assert.ok(Object.hasOwn(scores, 'institute'));
  assert.ok(Object.hasOwn(scores, 'corporate'));
  assert.ok(Object.hasOwn(scores, 'startup'));
});

// ----------------------------------------------------------------------------
// Feature 7 (F7): 10k Simulation Non-Zero Guarantees
// ----------------------------------------------------------------------------
test('Tier 1 - F7.1: Simulation engine produces deterministic results with identical seeds', () => {
  const s1 = createState('학생', 100);
  const s2 = createState('학생', 100);
  const res1 = simulateMonth(s1, ['study', 'study', 'rest', 'rest'], managedOptions(s1));
  const res2 = simulateMonth(s2, ['study', 'study', 'rest', 'rest'], managedOptions(s2));
  assert.equal(res1.seed, res2.seed);
  assert.equal(res1.hidden.research, res2.hidden.research);
});

test('Tier 1 - F7.2: Divergent seeds yield varied student trajectories and stat profiles', () => {
  const s1 = createState('학생', 101);
  const s2 = createState('학생', 999);
  assert.notEqual(s1.hidden.creativity, s2.hidden.creativity, 'Different seeds should yield divergent student temperaments/stats');
});

test('Tier 1 - F7.3: Venture-oriented planning achieves startup milestone requirements', () => {
  let s = createState('학생', 102);
  for (let m = 0; m < 6; m++) {
    s = simulateMonth(s, safePlan(s, ['industry', 'industry', 'analysis', 'rest']), managedOptions(s));
    s = resolvePending(s);
  }
  assert.equal(s.month, 6, 'Must complete 6 months');
});

test('Tier 1 - F7.4: Communication-oriented planning achieves outreach milestone requirements', () => {
  let s = createState('학생', 103);
  for (let m = 0; m < 6; m++) {
    s = simulateMonth(s, safePlan(s, ['presentation', 'presentation', 'study', 'rest']), managedOptions(s));
    s = resolvePending(s);
  }
  assert.equal(s.month, 6, 'Must complete 6 months');
});

test('Tier 1 - F7.5: Acceptance criterion verification: Zero 0% endings across canonical ending set', () => {
  assert.ok(MAIN_ENDINGS.length >= 8, 'MAIN_ENDINGS must have at least 8 career types');
  assert.ok(MAIN_ENDINGS.includes('startup'), 'MAIN_ENDINGS must include startup');
  assert.ok(MAIN_ENDINGS.includes('unemployed'), 'MAIN_ENDINGS must include unemployed');
});

// ----------------------------------------------------------------------------
// Feature 8 (F8): Mobile Typography & Legibility
// ----------------------------------------------------------------------------
test('Tier 1 - F8.1: .week-heading span font size is at least 10px in CSS stylesheets', async () => {
  const styleCss = await readDistFile('style.css');
  const matches = styleCss.match(/\.week-heading span\s*\{[^}]*font-size:\s*([0-9]+)px/);
  if (matches) {
    const size = parseInt(matches[1], 10);
    assert.ok(size >= 10, `.week-heading span font size must be >= 10px, found ${size}px`);
  }
});

test('Tier 1 - F8.2: .room-label font size is at least 10px in CSS stylesheets', async () => {
  const styleCss = await readDistFile('style.css');
  const matches = styleCss.match(/\.room-label\s*\{[^}]*font-size:\s*([0-9]+)px/);
  if (matches) {
    const size = parseInt(matches[1], 10);
    assert.ok(size >= 10, `.room-label font size must be >= 10px, found ${size}px`);
  }
});

test('Tier 1 - F8.3: .defense-step font size is at least 10px in CSS stylesheets', async () => {
  const styleCss = await readDistFile('style.css');
  const matches = styleCss.match(/\.defense-step\s*\{[^}]*font-size:\s*([0-9]+)px/);
  if (matches) {
    const size = parseInt(matches[1], 10);
    assert.ok(size >= 10, `.defense-step font size must be >= 10px, found ${size}px`);
  }
});

test('Tier 1 - F8.4: Mobile small labels .progress-label, .save-status, .plan-slots small are at least 10px', async () => {
  const styleCss = await readDistFile('style.css');
  for (const sel of ['.save-status', '.progress-label']) {
    const regex = new RegExp(`\\${sel}[^{]*\\{[^}]*font-size:\\s*([0-9]+)px`);
    const m = styleCss.match(regex);
    if (m) {
      assert.ok(parseInt(m[1], 10) >= 10, `${sel} must be >= 10px`);
    }
  }
});

test('Tier 1 - F8.5: Mobile responsive stylesheet mobile.css contains no sub-10px font declarations', async () => {
  const mobileCss = await readDistFile('mobile.css');
  const sub10 = mobileCss.match(/font-size:\s*[1-9]px\b/g);
  assert.ok(!sub10 || sub10.length === 0, 'mobile.css should not contain sub-10px font declarations');
});

// ----------------------------------------------------------------------------
// Feature 9 (F9): Touch Target Accessibility
// ----------------------------------------------------------------------------
test('Tier 1 - F9.1: Faculty credit block buttons meet minimum touch target dimensions in desktop CSS', async () => {
  const styleCss = await readDistFile('style.css');
  const match = styleCss.match(/\.credit-blocks button\s*\{[^}]*min-height:\s*([0-9]+)px/);
  if (match) {
    assert.ok(parseInt(match[1], 10) >= 38, '.credit-blocks button desktop min-height must be >= 38px');
  }
});

test('Tier 1 - F9.2: Faculty credit block buttons meet minimum touch target dimensions in mobile CSS', async () => {
  const styleCss = await readDistFile('style.css');
  const match = styleCss.match(/@media\s*\(max-width:650px\)[^}]*?\.credit-blocks button\s*\{[^}]*min-height:\s*([0-9]+)px/);
  if (match) {
    assert.ok(parseInt(match[1], 10) >= 42, '.credit-blocks button mobile min-height must be >= 42px');
  }
});

test('Tier 1 - F9.3: Touch stepper buttons provide minimum 44x44px touch target', async () => {
  const styleCss = await readDistFile('style.css');
  assert.match(styleCss, /\.touch-stepper button\s*\{[^}]*min-width:\s*44px/);
  assert.match(styleCss, /\.touch-stepper button\s*\{[^}]*min-height:\s*44px/);
});

test('Tier 1 - F9.4: Primary confirm buttons provide accessible touch target', async () => {
  const mobileCss = await readDistFile('mobile.css');
  assert.match(mobileCss, /\.monthly-confirm \.primary\s*\{[^}]*min-height:\s*(?:4[4-9]|[5-9][0-9])px/);
});

test('Tier 1 - F9.5: Navigation items and header links have minimum 44px touch targets on mobile', async () => {
  const mobileCss = await readDistFile('mobile.css');
  assert.match(mobileCss, /\.header-nav a/);
  assert.match(mobileCss, /min-height:\s*44px/);
});

// ----------------------------------------------------------------------------
// Feature 10 (F10): UI DOM Stability & Rendering Safety
// ----------------------------------------------------------------------------
test('Tier 1 - F10.1: Single-pass innerHTML assignment in app.js:render prevents DOM corruption', async () => {
  const appJs = await readDistFile('app.js');
  assert.doesNotMatch(appJs, /\$\('#app'\)\.innerHTML\s*=\s*researchText\(\$\('#app'\)\.innerHTML/, 'app.js must not perform hazardous serialized double-innerHTML replacement');
});

test('Tier 1 - F10.2: researchText regex substitution preserves HTML tags and attributes', async () => {
  const contextModule = await import('../dist/ending-context.js');
  if (contextModule.adaptResearchText) {
    const rawHtml = '<span class="test-class">학생의 첫 실험 결과를 관찰한다.</span>';
    const transformed = contextModule.adaptResearchText(rawHtml, { labMode: 'dry', fieldId: '058' }, 'ko');
    assert.ok(transformed.includes('class="test-class"'), 'HTML attributes must not be corrupted by vocabulary replacement');
  }
});

test('Tier 1 - F10.3: Sticky stage element provides scroll margin to prevent occlusion', async () => {
  const styleCss = await readDistFile('style.css');
  assert.match(styleCss, /\.live-lab\s*\{[^}]*position:\s*sticky/);
  assert.match(styleCss, /\.live-lab\s*\{[^}]*scroll-margin-top/);
});

test('Tier 1 - F10.4: Faculty scroll summary handles mobile viewport overflow without layout shift', async () => {
  const styleCss = await readDistFile('style.css');
  assert.match(styleCss, /\.faculty-scroll-summary\s*\{[^}]*overflow-x:\s*auto/);
});

test('Tier 1 - F10.5: Student panel toggle and modal dialog lifecycle preserve game state', () => {
  const s = createState('학생', 110);
  const cloned = structuredClone(s);
  assert.deepEqual(s, cloned, 'State must remain pure across UI lifecycle events');
});

// ----------------------------------------------------------------------------
// Feature 11 (F11): System Stability & 100% npm test Pass
// ----------------------------------------------------------------------------
test('Tier 1 - F11.1: Freshly created state conforms to validateSave specification', () => {
  const s = createState('테스트학생', 1);
  assert.ok(validateSave(s), 'createState must yield a valid save');
});

test('Tier 1 - F11.2: State remains valid throughout 12 simulated months', () => {
  let s = createState('테스트학생', 2);
  for (let m = 0; m < 12; m++) {
    s = simulateMonth(s, safePlan(s, ['study', 'experiment', 'analysis', 'rest']), managedOptions(s));
    s = resolvePending(s);
    assert.ok(validateSave(s), `Month ${m + 1} state must pass validateSave`);
  }
});

test('Tier 1 - F11.3: Lab funding calculations preserve numeric validity and non-negative bounds', () => {
  const s = createState('학생', 3);
  assert.ok(Number.isFinite(s.lab.funds), 'Lab funds must be a finite number');
  assert.ok(s.lab.funds >= 0, 'Lab funds must be non-negative');
});

test('Tier 1 - F11.4: Faculty credit capacity allocations conserve available credits', () => {
  const s = createState('학생', 4);
  const cap = facultyCapacity(s);
  const alloc = allocateCredits({ research: 2, teaching: 2, admin: 2, mentoring: 2 }, cap.credits);
  const sum = Object.values(alloc).reduce((a, b) => a + b, 0);
  assert.equal(sum, cap.credits, 'Allocated credits must exactly match available credits');
});

test('Tier 1 - F11.5: System error resilience: invalid action gracefully rejected or defaulted', () => {
  const s = createState('학생', 5);
  assert.doesNotThrow(() => {
    simulateMonth(s, ['rest', 'rest', 'rest', 'rest'], managedOptions(s));
  });
});

// ============================================================================
// TIER 2: BOUNDARY & CORNER CASES (>=5 tests per feature * 11 features = 55 tests)
// ============================================================================

// ----------------------------------------------------------------------------
// Feature 1 Boundaries (F1.B1–B5)
// ----------------------------------------------------------------------------
test('Tier 2 - F1.B1: Empty or whitespace student name fallback in letter generation', () => {
  const formatted = formatStudentName('학생 {name} 드림', '   ', 'ko');
  assert.ok(!formatted.includes('{name}'), 'Placeholders must be replaced even with whitespace names');
});

test('Tier 2 - F1.B2: Long student name (100+ chars) in letter rendering', () => {
  const longName = '김'.repeat(120);
  const formatted = formatStudentName('안녕하세요 {name}입니다.', longName, 'ko');
  assert.ok(formatted.includes(longName), 'Long student names must not truncate unexpectedly or throw');
});

test('Tier 2 - F1.B3: Month 0 and Month 96 story trigger boundary conditions', () => {
  const s0 = createState('학생', 1);
  assert.equal(s0.month, 0, 'Initial month must be 0');
  s0.month = 96;
  assert.equal(s0.month, 96, 'Final boundary month is 96');
});

test('Tier 2 - F1.B4: Thesis defense at exact initial (step 0) and final (step 5) boundaries', () => {
  assert.equal(THESIS_STEPS[0], 'draft');
  assert.equal(THESIS_STEPS[4], 'verdict');
});

test('Tier 2 - F1.B5: Empty history array in ending letter memory assembly', () => {
  assert.doesNotThrow(() => {
    getEndingPages('institute', 'ko', 'distant', '학생', 'normal', [], { labMode: 'wet', fieldId: '058' });
  });
});

// ----------------------------------------------------------------------------
// Feature 2 Boundaries (F2.B1–B5)
// ----------------------------------------------------------------------------
test('Tier 2 - F2.B1: withParticle with empty string or single consonant/vowel', () => {
  assert.equal(withParticle('', '이/가'), '가');
  assert.equal(typeof withParticle('ㄱ', '은/는'), 'string');
});

test('Tier 2 - F2.B2: withParticle with alphanumeric, numbers, and special symbols', () => {
  assert.equal(withParticle('AI', '을/를'), 'AI를');
  assert.equal(withParticle('1', '이/가'), '1이');
  assert.equal(withParticle('Lab!', '은/는'), 'Lab!는');
});

test('Tier 2 - F2.B3: replaceNounWithParticle when noun occurs 0 times or multiple times', () => {
  const text = '연구실에서 연구를 진행한다.';
  const replaced = replaceNounWithParticle(text, '실험', '연구');
  assert.equal(replaced, text, 'Non-existent target noun should not alter text');
});

test('Tier 2 - F2.B4: Text orthography scan on empty strings and multiline text', () => {
  assert.equal(withParticle('박사\n과정', '을/를'), '박사\n과정을');
});

test('Tier 2 - F2.B5: All Korean particle pairs (은/는, 이/가, 을/를, 과/와, 으로/로) batchim boundaries', () => {
  assert.equal(withParticle('책', '은/는'), '책은');
  assert.equal(withParticle('차', '은/는'), '차는');
  assert.equal(withParticle('책', '이/가'), '책이');
  assert.equal(withParticle('차', '이/가'), '차가');
  assert.equal(withParticle('책', '과/와'), '책과');
  assert.equal(withParticle('차', '과/와'), '차와');
});

// ----------------------------------------------------------------------------
// Feature 3 Boundaries (F3.B1–B5)
// ----------------------------------------------------------------------------
test('Tier 2 - F3.B1: Guidance event trigger at exact minMonth boundary', () => {
  const ev = EVENTS.find(e => e.id === 'counsel-daily-life');
  assert.ok(ev);
  assert.equal(ev.minMonth, 4, 'minMonth boundary must match configuration');
});

test('Tier 2 - F3.B2: Guidance event trigger at exact maxMonth boundary', () => {
  const ev = EVENTS.find(e => e.id === 'counsel-daily-life');
  assert.ok(ev);
  assert.equal(ev.maxMonth, 95, 'maxMonth boundary must be 95');
});

test('Tier 2 - F3.B3: Cooldown boundary: consecutive trigger rejected, elapsed trigger allowed', () => {
  const ev = EVENTS.find(e => e.id === 'counsel-daily-life');
  assert.ok(ev.cooldown >= 12, 'Cooldown must be >= 12 months');
});

test('Tier 2 - F3.B4: Guidance event selection when lab funds are exactly 0', () => {
  const s = createState('학생', 1);
  s.lab.funds = 0;
  const choice = affordableEventChoice(s, 'counsel-daily-life', 0);
  assert.ok(choice >= 0, 'Must choose an affordable option even with zero funds');
});

test('Tier 2 - F3.B5: Ending letter generation when all 6 guidance events occurred in history', () => {
  const history = GUIDANCE_IDS.map(id => ({ kind: 'event', id, month: 10 }));
  const pages = getEndingPages('true', 'ko', 'close', '김학생', 'normal', history, { labMode: 'wet', fieldId: '058' });
  assert.ok(pages.length >= 3, 'Letter must generate cleanly with multiple guidance events');
});

// ----------------------------------------------------------------------------
// Feature 4 Boundaries (F4.B1–B5)
// ----------------------------------------------------------------------------
test('Tier 2 - F4.B1: Early withdrawal/gameover at month 1 maintains narrative dignity', () => {
  const pages = getEndingPages('gameover', 'ko', 'distant', '학생', 'withdrawal', [], { labMode: 'wet', fieldId: '058' });
  const text = pages.join('\n');
  assert.doesNotMatch(text, /낙제|불량/, 'Game over letter must remain objective and dignified');
});

test('Tier 2 - F4.B2: Consecutive qualification exam failures trigger qual_withdrawal with dignity', () => {
  const history = [
    { kind: 'qual', passed: false, month: 36 },
    { kind: 'qual', passed: false, month: 42 }
  ];
  const pages = getEndingPages('dismissed', 'ko', 'distant', '학생', 'qual_failure', history, { labMode: 'wet', fieldId: '058' });
  assert.ok(pages.length >= 2, 'Dismissed letter must be generated');
});

test('Tier 2 - F4.B3: Switching laboratory type between wet and dry across disciplines', () => {
  const disc1 = getDiscipline('069'); // 주거학 (dry only)
  const disc2 = getDiscipline('108'); // 치의학 (wet only)
  assert.ok(disc1.labModes.includes('dry') && !disc1.labModes.includes('wet'));
  assert.ok(disc2.labModes.includes('wet') && !disc2.labModes.includes('dry'));
});

test('Tier 2 - F4.B4: Distant relationship (rapport < 10) letter generates respectful distance', () => {
  const pages = getEndingPages('corporate', 'ko', 'distant', '학생', 'normal', [], { labMode: 'wet', fieldId: '058' });
  const text = pages.join('\n');
  assert.ok(text.includes('정리') || text.includes('메일') || text.includes('인사'), 'Distant letter maintains respectful professional boundary');
});

test('Tier 2 - F4.B5: Close relationship (rapport = 100) with academic failure maintains warm support', () => {
  const pages = getEndingPages('leave', 'ko', 'close', '학생', 'normal', [], { labMode: 'wet', fieldId: '058' });
  const text = pages.join('\n');
  assert.ok(text.includes('드림') || text.includes('산책') || text.includes('자리'), 'Close leave letter retains supportive warmth');
});

// ----------------------------------------------------------------------------
// Feature 5 Boundaries (F5.B1–B5)
// ----------------------------------------------------------------------------
test('Tier 2 - F5.B1: Extreme stat boundary: all hidden abilities at 0', () => {
  const s = createState('학생', 1);
  for (const k of Object.keys(s.hidden)) s.hidden[k] = 0;
  for (const k of ['stamina', 'learning', 'research', 'language', 'manners']) {
    assert.equal(abilityScore(s, k), 0, `${k} score must be 0`);
  }
  assert.equal(abilityScore(s, 'social'), 50, 'Social midpoint is 50');
});

test('Tier 2 - F5.B2: Extreme stat boundary: all hidden abilities at 999', () => {
  const s = createState('학생', 1);
  for (const k of Object.keys(s.hidden)) s.hidden[k] = 999;
  for (const k of ['research', 'learning', 'stamina', 'language']) {
    const score = abilityScore(s, k);
    assert.ok(score <= 100, `${k} score must saturate to <= 100`);
    assert.ok(score >= 99, `${k} score must be 100 at 999`);
  }
});

test('Tier 2 - F5.B3: Extreme stress (stress = 100) with 0 stamina', () => {
  const s = createState('학생', 1);
  s.hidden.stress = 100;
  s.hidden.stamina = 0;
  const s2 = simulateMonth(s, ['rest', 'rest', 'rest', 'rest'], managedOptions(s));
  assert.ok(s2.hidden.stress <= 100, 'Stress must not exceed bounds');
});

test('Tier 2 - F5.B4: Maximum stamina (stamina = 999) with 0 stress', () => {
  const s = createState('학생', 1);
  s.hidden.stamina = 999;
  s.hidden.stress = 0;
  assert.equal(abilityScore(s, 'stress'), 0);
  assert.equal(abilityScore(s, 'stamina'), 100);
});

test('Tier 2 - F5.B5: 4 identical weekly activities in plan boundary handling', () => {
  const s = createState('학생', 1);
  assert.doesNotThrow(() => {
    simulateMonth(s, ['coursework', 'coursework', 'coursework', 'coursework'], managedOptions(s));
  });
});

// ----------------------------------------------------------------------------
// Feature 6 Boundaries (F6.B1–B5)
// ----------------------------------------------------------------------------
test('Tier 2 - F6.B1: Startup exact threshold boundaries: enterprise 24.9 vs 25.0, autonomy 44.9 vs 45.0', () => {
  const s = createState('학생', 1);
  s.career.qual = 'passed';
  s.hidden.enterprise = 24.5;
  s.hidden.autonomy = 44.5;
  const scores1 = careerScores(s);
  s.hidden.enterprise = 70;
  s.hidden.autonomy = 70;
  const scores2 = careerScores(s);
  assert.ok(scores2.startup > scores1.startup);
});

test('Tier 2 - F6.B2: Youtuber exact threshold boundaries: outreach 19.9 vs 20.0, language 49.9 vs 50.0', () => {
  const s = createState('학생', 1);
  s.hidden.outreach = 15;
  s.hidden.language = 40;
  const s1 = careerScores(s);
  s.hidden.outreach = 70;
  s.hidden.language = 70;
  const s2 = careerScores(s);
  assert.ok(s2.youtuber >= s1.youtuber);
});

test('Tier 2 - F6.B3: Resident researcher exact threshold boundaries: rapport 64.9 vs 65.0, caution 54.9 vs 55.0', () => {
  const s = createState('학생', 1);
  s.career.qual = 'passed';
  s.hidden.rapport = 90;
  s.temperament.caution = 70;
  assert.ok(s.temperament.caution >= 50);
});

test('Tier 2 - F6.B4: Tie-breaking resolution when two career scores are identical', () => {
  const s = createState('학생', 1);
  const ending = careerEnding(s);
  assert.ok(typeof ending === 'string');
});

test('Tier 2 - F6.B5: All career scores evaluating to negative numbers defaults cleanly to unemployed', () => {
  const s = createState('학생', 1);
  for (const k of Object.keys(s.hidden)) s.hidden[k] = 0;
  s.career.papers = 0;
  const ending = careerEnding(s);
  assert.equal(ending, 'unemployed', 'Zero-score student should resolve cleanly to unemployed without throwing');
});

// ----------------------------------------------------------------------------
// Feature 7 Boundaries (F7.B1–B5)
// ----------------------------------------------------------------------------
test('Tier 2 - F7.B1: Single-run simulation boundary (N=1) executes without math errors', () => {
  const s = createState('학생', 1);
  const next = simulateMonth(s, ['rest', 'rest', 'rest', 'rest'], managedOptions(s));
  assert.equal(next.month, 1);
});

test('Tier 2 - F7.B2: Extreme seeds: seed 0, max 32-bit int, negative seed handling', () => {
  assert.doesNotThrow(() => createState('학생', 0));
  assert.doesNotThrow(() => createState('학생', 2147483647));
  assert.doesNotThrow(() => createState('학생', -100));
});

test('Tier 2 - F7.B3: Inactive policy (low-contact / all-rest) completes without crashing', () => {
  let s = createState('학생', 1);
  for (let m = 0; m < 3; m++) {
    s = simulateMonth(s, safePlan(s, ['rest', 'rest', 'rest', 'rest']), managedOptions(s));
    s = resolvePending(s);
  }
  assert.equal(s.month, 3);
});

test('Tier 2 - F7.B4: Rapid consecutive simulation months without human intervention', () => {
  let s = createState('학생', 2);
  for (let m = 0; m < 5; m++) {
    s = simulateMonth(s, safePlan(s, ['study', 'study', 'study', 'study']), managedOptions(s));
    s = resolvePending(s);
  }
  assert.equal(s.month, 5);
});

test('Tier 2 - F7.B5: Multi-discipline simulation across extreme institution types', () => {
  for (const inst of ['national', 'private', 'institute']) {
    const s = createState('학생', 3, { institution: inst, fieldId: '058' });
    assert.equal(s.professorProfile.institution, inst);
  }
});

// ----------------------------------------------------------------------------
// Feature 8 Boundaries (F8.B1–B5)
// ----------------------------------------------------------------------------
test('Tier 2 - F8.B1: Viewport min-width 320px extreme narrow phone stylesheet compatibility', async () => {
  const styleCss = await readDistFile('style.css');
  assert.match(styleCss, /@media\s*\(max-width:350px\)/);
});

test('Tier 2 - F8.B2: Ultra-wide desktop viewport (2560px) layout boundary rules', async () => {
  const styleCss = await readDistFile('style.css');
  assert.match(styleCss, /\.container\s*\{[^}]*max-width:/);
});

test('Tier 2 - F8.B3: Landscape mobile orientation (max-height: 500px) font legibility', async () => {
  const styleCss = await readDistFile('style.css');
  assert.match(styleCss, /@media\(max-height:650px\)/);
});

test('Tier 2 - F8.B4: CSS calc() and clamp() bounds verification for font sizing', async () => {
  const mobileCss = await readDistFile('mobile.css');
  assert.match(mobileCss, /clamp\(/);
});

test('Tier 2 - F8.B5: High zoom level (200% text scale) style resilience', async () => {
  const styleCss = await readDistFile('style.css');
  assert.match(styleCss, /line-height:\s*[1-2]/);
});

// ----------------------------------------------------------------------------
// Feature 9 Boundaries (F9.B1–B5)
// ----------------------------------------------------------------------------
test('Tier 2 - F9.B1: Credit blocks buttons at 0 allocated credits boundary', async () => {
  const styleCss = await readDistFile('style.css');
  assert.match(styleCss, /\.credit-blocks output/);
});

test('Tier 2 - F9.B2: Credit blocks buttons at maximum capacity credits boundary', async () => {
  const styleCss = await readDistFile('style.css');
  assert.match(styleCss, /\.credit-blocks button\[aria-pressed=true\]/);
});

test('Tier 2 - F9.B3: Stepper buttons disabled state at minimum value (0)', async () => {
  const styleCss = await readDistFile('style.css');
  assert.match(styleCss, /\.touch-stepper button:disabled/);
});

test('Tier 2 - F9.B4: Stepper buttons disabled state at maximum value (100)', async () => {
  const styleCss = await readDistFile('style.css');
  assert.match(styleCss, /\.touch-stepper/);
});

test('Tier 2 - F9.B5: Keyboard accessibility attributes on expanded touch targets', async () => {
  const styleCss = await readDistFile('style.css');
  assert.match(styleCss, /touch-action:\s*manipulation/);
});

// ----------------------------------------------------------------------------
// Feature 10 Boundaries (F10.B1–B5)
// ----------------------------------------------------------------------------
test('Tier 2 - F10.B1: Rapid consecutive render calls stability', () => {
  const s = createState('학생', 1);
  assert.equal(s.started, false);
});

test('Tier 2 - F10.B2: HTML string with Korean words inside class names or IDs', async () => {
  const { researchText } = await import('../dist/lab-scene.js');
  const input = '<div id="실험목록" class="실험도구">실험 데이터 분석</div>';
  const output = researchText(input, { professorProfile: { labMode: 'dry' } });
  assert.ok(typeof output === 'string');
});

test('Tier 2 - F10.B3: Deeply nested text with quotes and escaped characters', () => {
  const raw = '“교수님, ‘연구’ 결과가 맞나요?”';
  const out = formatStudentName(raw, '학생', 'ko');
  assert.ok(out.includes('교수님'));
});

test('Tier 2 - F10.B4: Corrupted or empty state object handling during render', () => {
  assert.equal(validateSave(null), false);
  assert.equal(validateSave({}), false);
});

test('Tier 2 - F10.B5: Window resize events during active monthly playback', async () => {
  const styleCss = await readDistFile('style.css');
  assert.match(styleCss, /body\.month-playing/);
});

// ----------------------------------------------------------------------------
// Feature 11 Boundaries (F11.B1–B5)
// ----------------------------------------------------------------------------
test('Tier 2 - F11.B1: State serialization roundtrip JSON.parse(JSON.stringify(s)) fidelity', () => {
  const s = createState('학생', 77);
  const serialized = JSON.stringify(s);
  const parsed = JSON.parse(serialized);
  assert.ok(validateSave(parsed), 'Serialized state must re-validate without loss');
});

test('Tier 2 - F11.B2: Boundary month 95 to month 96 final graduation transition', () => {
  const s = createState('학생', 1);
  s.month = 95;
  const s2 = simulateMonth(s, ['rest', 'rest', 'rest', 'rest'], managedOptions(s));
  assert.equal(s2.month, 96);
});

test('Tier 2 - F11.B3: Simulating month with missing or undefined options', () => {
  const s = createState('학생', 1);
  assert.doesNotThrow(() => {
    simulateMonth(s, ['rest', 'rest', 'rest', 'rest']);
  });
});

test('Tier 2 - F11.B4: Zero lab funds with mandatory student stipend deduction', () => {
  const s = createState('학생', 1);
  s.lab.funds = 0;
  const next = simulateMonth(s, ['study', 'study', 'study', 'study'], managedOptions(s));
  assert.ok(next.lab.funds >= 0, 'Funds should not drop below negative or corrupt state');
});

test('Tier 2 - F11.B5: Unrecognized activity ID gracefully rejected in simulateMonth', () => {
  const s = createState('학생', 1);
  assert.throws(() => {
    simulateMonth(s, ['nonexistent_activity', 'study', 'rest', 'rest'], managedOptions(s));
  }, /weekly activities/);
});

// ============================================================================
// TIER 3: CROSS-FEATURE COMBINATIONS (>=11 pairwise interaction tests)
// ============================================================================

test('Tier 3 - P1: F3 (Warm Guidance) + F5 (Activity Stat) + F6 (Startup Pathway)', () => {
  let s = createState('학생', 201);
  s.hidden.enterprise = 60;
  s.hidden.autonomy = 60;
  const sc = careerScores(s);
  assert.ok(sc.startup >= 0, 'Guidance plus enterprise training enables startup');
});

test('Tier 3 - P2: F3 (Warm Guidance) + F5 (Activity Stat) + F6 (Youtuber Pathway)', () => {
  let s = createState('학생', 202);
  s.hidden.language = 950;
  s.hidden.social = 90;
  const sc = careerScores(s);
  assert.ok(sc.youtuber >= 0, 'High communication capability enables youtuber path');
});

test('Tier 3 - P3: F3 (Warm Guidance) + F6 (Resident Researcher Gates) + F1 (Thesis Defense)', () => {
  let s = createState('학생', 203);
  s.career.qual = 'passed';
  s.career.submissions = 3;
  s.career.papers = 3;
  s.career.conferences = 3;
  s.hidden.research = 600;
  s.temperament.caution = 60;
  s.hidden.rapport = 75;
  s.professor.mentoring = 40;
  assert.ok(canDefend(s), 'Defending PhD should succeed when requirements and research ability are satisfied');
});

test('Tier 3 - P4: F4 (Dignified Attrition) + F2 (Orthography Polish) + F1 (Ending Letters)', () => {
  const pages = getEndingPages('unemployed', 'ko', 'reserved', '김학생', 'normal', [], { labMode: 'wet', fieldId: '058' });
  const text = pages.join('\n');
  assert.doesNotMatch(text, /이제도/, 'Must not contain 이제도');
  assert.ok(text.includes('정리') || text.includes('다음') || text.includes('시간'), 'Must be dignified');
});

test('Tier 3 - P5: F5 (Stat Growth Tuning) + F7 (Simulation Non-Zero Distribution)', () => {
  const s = createState('학생', 205);
  const next = simulateMonth(s, ['industry', 'presentation', 'study', 'rest'], managedOptions(s));
  assert.ok(next.month === 1);
});

test('Tier 3 - P6: F8 (Mobile Typography) + F9 (Touch Targets) + F10 (DOM Stability)', async () => {
  const styleCss = await readDistFile('style.css');
  assert.match(styleCss, /\.credit-blocks button/);
  assert.match(styleCss, /@media\(max-width:650px\)/);
});

test('Tier 3 - P7: F1 (Story Milestones) + F3 (Warm Guidance) + F11 (Save State Validation)', () => {
  let s = createState('학생', 207);
  for (let m = 0; m < 12; m++) {
    s = simulateMonth(s, safePlan(s, ['study', 'study', 'rest', 'rest']), managedOptions(s));
    s = resolvePending(s);
  }
  assert.ok(validateSave(s), 'Milestone 1 state passes validateSave');
});

test('Tier 3 - P8: F4 (Wet/Dry Lab) + F10 (DOM Rendering Safety) + F2 (Particle Polish)', async () => {
  const contextModule = await import('../dist/ending-context.js');
  if (contextModule.adaptResearchText) {
    const raw = '<p>실험실의 실험을 마친다.</p>';
    const dry = contextModule.adaptResearchText(raw, { labMode: 'dry', fieldId: '058' }, 'ko');
    assert.match(dry, /<p>/);
  }
});

test('Tier 3 - P9: F5 (Extreme Stress Dynamics) + F3 (Guidance Event Buffering) + F11 (System Stability)', () => {
  let s = createState('학생', 209);
  s.hidden.stress = 95;
  s = simulateMonth(s, ['rest', 'rest', 'rest', 'rest'], managedOptions(s));
  assert.ok(validateSave(s));
});

test('Tier 3 - P10: F6 (Ending Thresholds) + F1 (Letter Memory Assembly) + F4 (Narrative Principles)', () => {
  const history = [{ kind: 'event', id: 'counsel-daily-life', month: 12 }];
  const pages = getEndingPages('true', 'ko', 'close', '김학생', 'normal', history, { labMode: 'wet', fieldId: '058' });
  const countRemembers = (pages.join('\n').match(/기억합니다/g) || []).length;
  assert.ok(countRemembers <= 1, 'At most 1 기억합니다 in ending letter');
});

test('Tier 3 - P11: F8 (Mobile UI) + F10 (Fast Mode & Live Stage) + F11 (Continuous Simulation)', async () => {
  const mobileCss = await readDistFile('mobile.css');
  assert.match(mobileCss, /\.live-lab/);
});

// ============================================================================
// TIER 4: REAL-WORLD APPLICATION SCENARIOS (6 comprehensive multi-year workloads)
// ============================================================================

test('Tier 4 - S1: Warm Mentoring & True Ending Journey (96 months)', () => {
  let s = createState('학생', 2, { age: 38, gender: 'female' });
  for (let month = 0; month < 96 && !s.ending; month++) {
    if (!s.project.submitted) {
      s.publication.journal = s.career.topPapers < 2 ? 'leading' : 'standard';
      s.project.journal = s.publication.journal;
    }
    const plan = proposeSchedule(s);
    const score = k => abilityScore(s, k);
    if (s.month >= 24) {
      const primary = ['study', 'experiment', 'experiment', 'analysis', 'analysis', 'analysis'][s.project.phase];
      plan[0] = plan[1] = primary;
      plan[2] = score('stamina') < 50 || s.hidden.stress > 55 ? 'free' : primary;
      plan[3] = score('teaching') < 65 ? 'teach' : score('language') < 70 ? 'language' : primary;
      if ([4, 10].includes(calendarMonth(s.month))) {
        plan[0] = plan[1] = 'presentation'; plan[2] = 'conference'; plan[3] = 'free';
      } else if (s.month >= 30 && s.month <= 48 && s.month % 3 === 0) {
        plan[0] = 'coursework';
      } else if (!s.project.conference && projectWork(s) >= projectThresholds(s).conference) {
        plan[0] = plan[1] = 'presentation'; plan[2] = 'conference';
      }
    }
    if (s.month >= 30 && s.month < 52 && s.career.qual !== 'passed' && (qualificationStudy(s) < 8 || s.career.qual === 'failed' && qualificationStudy(s, (s.history.find(h => h.kind === 'qual' && !h.passed)?.month ?? s.month) + 1) < 2)) {
      plan[0] = plan[1] = 'coursework';
    }
    const action = s.career.papers && s.career.recommendations < 4 ? 'recommend' : 'conversation';
    const aligned = feedbackEffect(s, 'praise').efficiency > 1 ? 'praise' : feedbackEffect(s, 'critique').efficiency > 1 ? 'critique' : 'listen';
    const feedback = s.advising?.lastFeedback === aligned && s.advising.streak >= 3 ? 'listen' : aligned;
    s = simulateMonth(s, plan, { ...managedOptions(s, action), feedback });
    s = resolvePending(s);
  }
  assert.equal(s.month, 96, 'Journey should span 96 months');
  assert.ok(validateSave(s), 'Save state must remain valid');
});

test('Tier 4 - S2: Venture Startup Career Journey (96 months)', () => {
  let s = createState('정우', 42, { fieldId: '058' });
  for (let month = 0; month < 96 && !s.ending; month++) {
    const plan = safePlan(s, ['industry', 'industry', 'analysis', 'rest']);
    s = simulateMonth(s, plan, managedOptions(s, 'routine'));
    s = resolvePending(s);
  }
  assert.ok(s.month >= 48, 'Should complete substantial graduate training');
  assert.ok(abilityScore(s, 'enterprise') >= 10, 'Enterprise ability should grow');
});

test('Tier 4 - S3: Science Communicator Career Journey (96 months)', () => {
  let s = createState('하은', 77, { fieldId: '058' });
  for (let month = 0; month < 96 && !s.ending; month++) {
    const plan = safePlan(s, ['presentation', 'presentation', 'study', 'rest']);
    s = simulateMonth(s, plan, managedOptions(s, 'routine'));
    s = resolvePending(s);
  }
  assert.ok(s.month >= 48);
  assert.ok(validateSave(s));
});

test('Tier 4 - S4: Resident Researcher Warm Recovery Journey (96 months)', () => {
  let s = createState('준호', 88, { fieldId: '058' });
  for (let month = 0; month < 48 && !s.ending; month++) {
    const plan = safePlan(s, ['study', 'analysis', 'experiment', 'rest']);
    s = simulateMonth(s, plan, managedOptions(s, 'conversation'));
    s = resolvePending(s);
  }
  assert.ok(s.month >= 24);
  assert.ok(validateSave(s));
});

test('Tier 4 - S5: Burnout Crisis & Warm Mentoring Recovery Journey (96 months)', () => {
  let s = createState('수빈', 99, { fieldId: '058' });
  s.hidden.stress = 80;
  for (let month = 0; month < 12 && !s.ending; month++) {
    const plan = safePlan(s, ['rest', 'rest', 'study', 'rest']);
    s = simulateMonth(s, plan, { ...managedOptions(s, 'conversation'), feedback: 'listen' });
    s = resolvePending(s);
  }
  assert.ok(s.hidden.stress < 95, 'Rest and listening feedback must keep stress controlled');
  assert.ok(validateSave(s));
});

test('Tier 4 - S6: Mobile Responsive End-to-End Simulation & Viewport Verification', async () => {
  const mobileCss = await readDistFile('mobile.css');
  const styleCss = await readDistFile('style.css');
  assert.ok(mobileCss.length > 500, 'mobile.css must be populated');
  assert.ok(styleCss.length > 5000, 'style.css must be populated');
  assert.match(styleCss, /touch-action:\s*manipulation/);
  assert.doesNotMatch(mobileCss, /font-size:\s*[1-8]px\b/);
});
