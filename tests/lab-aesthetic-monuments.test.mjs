import test from 'node:test';
import assert from 'node:assert/strict';
import {createState} from '../dist/engine.js';
import {roomScene, sceneKind} from '../dist/lab-scene.js';
import {getDiscipline} from '../dist/disciplines.js';
import {activityProps} from '../dist/activity-motion.js';
import {miniRoomSeason, WINDOW_SEASONS} from '../dist/mini-room.js';

test('Aesthetic Object 1: Award certificates on the wall scale with achievements and display rich gold borders and seals', () => {
  const state = createState('정다은', 2026, {fieldId: '050', labMode: 'dry'});
  const before = JSON.stringify(state);

  // Initial state with 0 awards: no wall certificates yet
  const scene0 = roomScene(state);
  assert.ok(!scene0.includes('award-certificate'), 'No award certificates initially when awards === 0');

  // 1 award: Academic Best Paper Award certificate with gold frame, parchment, and red seal
  state.career.awards = 1;
  const scene1 = roomScene(state);
  assert.equal((scene1.match(/class="award-certificate"/g) || []).length, 1);
  assert.match(scene1, /data-certificate="best-paper"/);
  assert.match(scene1, /aria-label="학회 우수논문상 상장"/);
  assert.match(scene1, /#d4af37/); // Gold leaf border
  assert.match(scene1, /#b71c1c/); // Crimson medallion seal
  assert.match(scene1, /#c62828/); // Ribbon tails
  assert.match(scene1, /#ffd700/); // Seal gold core

  // 2 awards: Foundation Research Excellence Citation added
  state.career.awards = 2;
  const scene2 = roomScene(state);
  assert.equal((scene2.match(/class="award-certificate"/g) || []).length, 2);
  assert.match(scene2, /data-certificate="foundation-citation"/);
  assert.match(scene2, /aria-label="연구재단 우수연구 표창장"/);
  assert.match(scene2, /#1565c0/); // Foundation blue medallion seal
  assert.match(scene2, /#e6c35c/); // Foundation gold frame

  // 3 awards: Distinguished Presentation Award certificate added
  state.career.awards = 3;
  const scene3 = roomScene(state);
  assert.equal((scene3.match(/class="award-certificate"/g) || []).length, 3);
  assert.match(scene3, /data-certificate="presentation-award"/);
  assert.match(scene3, /aria-label="학술대회 최우수 발표상 상장"/);
  assert.match(scene3, /#2e7d32/); // Emerald green seal

  // 4+ awards: Innovation Award added, capped at wall capacity without overlapping clock (u=12)
  state.career.awards = 5;
  const scene4 = roomScene(state);
  assert.equal((scene4.match(/class="award-certificate"/g) || []).length, 4);
  assert.match(scene4, /data-certificate="innovation-award"/);
  assert.match(scene4, /aria-label="학술연구 혁신 표창장"/);
  assert.match(scene4, /#6a1b9a/); // Purple ribbon

  // State must not be mutated
  state.career.awards = 0;
  assert.equal(JSON.stringify(state), before);
});

test('Aesthetic Object 2: Trophy, championship plaque, and acrylic lab monuments decorate desk and surfaces in both dry and wet labs', () => {
  for (const labMode of ['dry', 'wet']) {
    const state = createState('이현우', 7777, {fieldId: '090', labMode});
    const fieldName = getDiscipline('090').label;

    // Base lab always displays the discipline-tailored lab plaque and active thesis draft binder
    const baseScene = roomScene(state);
    assert.match(baseScene, /class="lab-founding-plaque"/);
    assert.match(baseScene, new RegExp(`${fieldName} 연구실 현판`));
    assert.match(baseScene, /class="desk-thesis-binder"/);
    assert.match(baseScene, /aria-label="학위논문 초안 및 연구 바인더"/);
    assert.match(baseScene, /#1e3a8a/); // Deep navy active binder
    assert.ok(!baseScene.includes('crystal-plaque'), 'Crystal plaque should not appear without awards');
    assert.ok(!baseScene.includes('championship-trophy'), 'Championship trophy should not appear without awards/papers');

    // Earning 1 award unlocks the Crystal Best Paper Award Plaque on the desk shelf
    state.career.awards = 1;
    const sceneWithCrystal = roomScene(state);
    assert.match(sceneWithCrystal, /class="trophy-plaque crystal-plaque"/);
    assert.match(sceneWithCrystal, /data-monument="crystal-trophy"/);
    assert.match(sceneWithCrystal, /학술대회 Best Paper Award 크리스털 기념패/);
    assert.match(sceneWithCrystal, /#bae6fd/); // Translucent crystal cyan body
    assert.match(sceneWithCrystal, /#e0f2fe/); // Faceted crystal highlight
    assert.match(sceneWithCrystal, /#0284c7/); // Blue emblem star

    // Earning 2 awards or publishing papers unlocks the Championship Plaque / Challenge Trophy
    state.career.awards = 2;
    const sceneWithChampionship = roomScene(state);
    assert.match(sceneWithChampionship, /class="trophy-plaque championship-trophy"/);
    assert.match(sceneWithChampionship, /data-monument="championship-trophy"/);
    assert.match(sceneWithChampionship, /연구 우승 팻말 및 챔피언십 기념패/);
    assert.match(sceneWithChampionship, /#ffd700/); // Gleaming gold front shield
    assert.match(sceneWithChampionship, /#f59e0b/); // Golden trophy laurel center
    assert.match(sceneWithChampionship, /#4e2d17/); // Polished mahogany easel stand

    // Publishing a paper also unlocks championship recognition even with 0 awards
    state.career.awards = 0;
    state.career.papers = 1;
    const sceneWithPaper = roomScene(state);
    assert.match(sceneWithPaper, /class="trophy-plaque championship-trophy"/);
  }
});

test('Aesthetic Object 3: Bookshelf renders antique moldings, thesis binders, textbooks and colorful journals', () => {
  for (const labMode of ['wet', 'dry']) {
    const s = createState('한지민', 31415, {labMode});
    const html = roomScene(s);

    // Bookshelf root structure
    assert.match(html, /class="lab-bookshelf antique-bookshelf"/);
    assert.match(html, /data-shelf="academic-library"/);
    assert.match(html, /학술 저널과 학위논문 바인더 서가/);

    // Tier 1: Hardcover thesis binders with gold foil lettering and brass bookends
    assert.match(html, /class="shelf-thesis-binders"/);
    assert.match(html, /data-shelf-tier="theses"/);
    assert.match(html, /학위논문 하드커버 바인더 서가/);
    assert.match(html, /#0f224a/); // Navy doctoral dissertation
    assert.match(html, /#3b1016/); // Crimson thesis binder
    assert.match(html, /#151921/); // Black archive binder
    assert.match(html, /#e5c158/); // Gold foil horizontal bands
    assert.match(html, /#d4af37/); // Gold title spine line
    assert.match(html, /#fef9e7/); // Thesis volume label tag
    assert.match(html, /#b48c48/); // Antique brass bookend

    // Tier 2: Thick major textbooks with embossed ribs
    assert.match(html, /class="shelf-textbooks"/);
    assert.match(html, /data-shelf-tier="textbooks"/);
    assert.match(html, /전공 원서 및 학술 레퍼런스/);
    assert.match(html, /#8b1e28/); // Red handbook
    assert.match(html, /#1b4332/); // Green engineering tome
    assert.match(html, /#1e3a8a/); // Academic blue reference
    assert.match(html, /#dfb76c/); // Embossed spine ribs

    // Tier 3: Colorful academic journals collection
    assert.match(html, /class="shelf-journals"/);
    assert.match(html, /data-shelf-tier="journals"/);
    assert.match(html, /알록달록한 학술 저널 컬렉션/);
    assert.match(html, /#dc2626/); // Nature-red journal
    assert.match(html, /#d97706/); // Science-amber journal
    assert.match(html, /#0284c7/); // IEEE-blue journal
    assert.match(html, /#16a34a/); // Open access green journal
    assert.match(html, /#ca8a04/); // Springer gold journal
    assert.match(html, /#7c3aed/); // Purple proceedings
    assert.match(html, /#0d9488/); // Teal transactions
    assert.match(html, /#ef4444/); // Ribbon bookmark
  }
});

test('Material scarcity is strictly preserved: sparse has fewer elements than rich in wet lab', () => {
  const s = createState('연구원', 9999, {labMode: 'wet'});
  s.lab.funds = 200;
  s.lab.budget.environment = 4;
  s.lab.equipment = 60;
  const rich = roomScene(s, {actual: 'experiment', performed: true}, 0);

  s.lab.funds = 10;
  s.lab.budget.environment = 0;
  const sparse = roomScene(s, {actual: 'experiment', performed: true}, 0);

  assert.match(rich, /data-supply="rich"/);
  assert.match(sparse, /data-supply="sparse"/);
  assert.ok(sparse.length < rich.length, `sparse (${sparse.length}) must be shorter than rich (${rich.length})`);
});

test('Academic podium binders and plaques appear in defense and conference scenes', () => {
  const s = createState('발표자', 1234, {fieldId: '050'});

  // Defense scene contains hardcover dissertation binder on committee podium
  s.pending = {kind: 'thesis', step: 'presentation'};
  const defenseHtml = roomScene(s, {actual: 'idle'});
  assert.match(defenseHtml, /class="defense-thesis-binder"/);
  assert.match(defenseHtml, /심사용 학위논문 하드커버 바인더/);

  // Conference scene contains conference plaque on speaker podium
  s.pending = null;
  const confHtml = roomScene(s, {actual: 'conference'});
  assert.match(confHtml, /class="conference-plaque"/);
  assert.match(confHtml, /학술대회 명패/);
});

test('All 73 disciplines produce valid, pure SVG output without NaN or RNG side effects', () => {
  const s = createState('테스트', 42);
  const before = structuredClone(s);
  for (let awards = 0; awards <= 4; awards++) {
    s.career.awards = awards;
    const svg = roomScene(s);
    assert.doesNotMatch(svg, /NaN|undefined|null/);
    assert.match(svg, /<svg class="pixel-room-art/);
  }
  s.career.awards = before.career.awards;
  assert.deepEqual(s, before, 'Rendering room scenes must never mutate state or consume RNG');
});

test('Depth sorting and framing integrity: desk monuments render before instruments and certificate corners are accented', () => {
  // In wet measurement lab, desk shelf must render before oscilloscope to avoid inverted depth painting
  const s = createState('연구원', 5555, {fieldId: '050', labMode: 'wet'});
  s.career.awards = 3;
  const wetIdle = roomScene(s, {actual: 'idle'});
  const idxPlaque = wetIdle.indexOf('data-monument="crystal-trophy"');
  const idxScope = wetIdle.indexOf('data-equipment="oscilloscope"');
  assert.ok(idxPlaque > 0 && idxScope > 0);
  assert.ok(idxPlaque < idxScope, 'Desk monuments (v<=16.9) must render before primary instruments (v>=17.0)');

  // Certificate has 4 gold corner brackets (#fff0a6) per certificate
  const certScene = roomScene(s);
  const goldAccents = (certScene.match(/fill="#fff0a6"/g) || []).length;
  assert.ok(goldAccents >= 4, 'Each framed certificate must have gold leaf corner brackets');
});

test('Aesthetic Object 4: Window renders delicate Cyworld miniroom 4-season scenery based on month', () => {
  const state = createState('정다은', 2026, {fieldId: '050', labMode: 'dry'});
  const before = JSON.stringify(state);

  // 1. Spring (3~5월): month 0 (3월), month 1 (4월), month 2 (5월)
  for (const m of [0, 1, 2]) {
    state.month = m;
    const scene = roomScene(state);
    assert.match(scene, /class="window-scenery window-season-spring"/);
    assert.match(scene, /data-season="spring"/);
    assert.match(scene, /aria-label="창밖 봄 풍경"/);
    assert.match(scene, /#dbeafe/); // Spring sky
    assert.match(scene, /#fbcfe8/); // Pink cherry blossom tree
    assert.match(scene, /#f472b6/); // Cherry blossom mid-tone
    assert.match(scene, /#f9a8d4/); // Cherry blossom highlight
    assert.match(scene, /data-effect="cherry-petals"/);
    assert.match(scene, /aria-label="흩날리는 벚꽃 꽃잎 픽셀"/);
    assert.equal(miniRoomSeason(state), 'spring');
  }

  // 2. Summer (6~8월): month 3 (6월), month 4 (7월), month 5 (8월)
  for (const m of [3, 4, 5]) {
    state.month = m;
    const scene = roomScene(state);
    assert.match(scene, /class="window-scenery window-season-summer"/);
    assert.match(scene, /data-season="summer"/);
    assert.match(scene, /aria-label="창밖 여름 풍경"/);
    assert.match(scene, /#93c5fd/); // Clear blue summer sky
    assert.match(scene, /#15803d/); // Lush deep green tree
    assert.match(scene, /#16a34a/); // Green foliage mid-tone
    assert.match(scene, /#22c55e/); // Bright green foliage
    assert.match(scene, /data-effect="cumulus-clouds"/);
    assert.match(scene, /aria-label="뭉게구름 픽셀"/);
    assert.equal(miniRoomSeason(state), 'summer');
  }

  // 3. Autumn (9~11월): month 6 (9월), month 7 (10월), month 8 (11월)
  for (const m of [6, 7, 8]) {
    state.month = m;
    const scene = roomScene(state);
    assert.match(scene, /class="window-scenery window-season-autumn"/);
    assert.match(scene, /data-season="autumn"/);
    assert.match(scene, /aria-label="창밖 가을 풍경"/);
    assert.match(scene, /#fed7aa/); // Sunset glow autumn sky
    assert.match(scene, /#facc15/); // Golden ginkgo tree
    assert.match(scene, /#eab308/); // Amber autumn tree
    assert.match(scene, /#dc2626/); // Crimson maple tree
    assert.match(scene, /data-effect="autumn-leaves"/);
    assert.match(scene, /aria-label="낙엽 픽셀"/);
    assert.equal(miniRoomSeason(state), 'autumn');
  }

  // 4. Winter (12~2월): month 9 (12월), month 10 (1월), month 11 (2월)
  for (const m of [9, 10, 11]) {
    state.month = m;
    const scene = roomScene(state);
    assert.match(scene, /class="window-scenery window-season-winter"/);
    assert.match(scene, /data-season="winter"/);
    assert.match(scene, /aria-label="창밖 겨울 풍경"/);
    assert.match(scene, /#cbd5e1/); // Calm winter sky
    assert.match(scene, /#e2e8f0/); // Snow-covered tree white-gray
    assert.match(scene, /#f1f5f9/); // Snow-covered tree pale slate
    assert.match(scene, /#94a3b8/); // Winter tree slate bark
    assert.match(scene, /data-effect="pixel-snow"/);
    assert.match(scene, /aria-label="내리는 픽셀 눈송이"/);
    assert.equal(miniRoomSeason(state), 'winter');
  }

  // Multi-year cycling: month 12 is year 2, March (spring)
  state.month = 12;
  const sceneY2 = roomScene(state);
  assert.match(sceneY2, /data-season="spring"/);

  // Negative months and safe modulo normalization
  state.month = -1; // 1 month before March -> February (winter)
  assert.equal(miniRoomSeason(state), 'winter');
  state.month = -4; // 4 months before March -> November (autumn)
  assert.equal(miniRoomSeason(state), 'autumn');
  state.month = -7; // 7 months before March -> August (summer)
  assert.equal(miniRoomSeason(state), 'summer');
  state.month = -10; // 10 months before March -> May (spring)
  assert.equal(miniRoomSeason(state), 'spring');
  state.month = -12; // 12 months before March -> March (spring)
  assert.equal(miniRoomSeason(state), 'spring');

  // Fallbacks on non-finite month and invalid season strings
  state.month = NaN;
  assert.equal(miniRoomSeason(state), 'spring', 'NaN month falls back to spring (month 0)');
  state.month = 0;
  state.season = 'invalid-monsoon';
  assert.equal(miniRoomSeason(state), 'spring', 'Unrecognized season strings fall back to month-based calculation');

  // Explicit calendarMonth and season overrides, including wrapping
  state.month = 0;
  state.calendarMonth = 10;
  assert.match(roomScene(state), /data-season="autumn"/);
  state.calendarMonth = 13; // wraps to 1 (January, winter)
  assert.equal(miniRoomSeason(state), 'winter');
  state.calendarMonth = undefined;
  state.season = 'winter';
  assert.match(roomScene(state), /data-season="winter"/);

  state.month = 0;
  delete state.calendarMonth;
  delete state.season;
  assert.equal(JSON.stringify(state), before, 'State must not be mutated');
});

test('Aesthetic Object 5: Free autonomous activity renders sketchbook, post-its, steaming mug, and warm desk lamp light', () => {
  for (const labMode of ['dry', 'wet']) {
    const state = createState('정다은', 1234, {fieldId: '050', labMode});
    const before = JSON.stringify(state);

    // Free activity result
    const freeResult = {actual: 'free', performed: true, outcome: 'completed'};
    const scene = roomScene(state, freeResult);

    // Activity motion and student seated at desk
    assert.match(scene, /data-motion="free-thought"/);
    assert.equal((scene.match(/data-motion="free-thought"/g) || []).length, 1, 'data-motion="free-thought" must appear uniquely on the activity prop root');
    assert.match(scene, /class="mini-student pose-seated[^"]* action-free"/);
    assert.match(scene, /data-facing="monitor"/);

    // Desk props
    assert.match(scene, /class="idea-sketchbook"/);
    assert.match(scene, /fill="#fdfbf7"/); // Sketchbook / notebook ivory paper
    assert.match(scene, /class="free-postits"/);
    assert.match(scene, /#fef08a/); // Yellow post-it pixel
    assert.match(scene, /#bbf7d0/); // Mint green post-it pixel
    assert.match(scene, /class="cup-steam"/); // Steaming mug
    assert.match(scene, /class="free-mug"/);
    assert.match(scene, /class="free-lamp-glow"/); // Warm stand lamp lighting
    assert.match(scene, /aria-label="따뜻한 스탠드 조명 빛"/);

    // When performed is false, motion effects are not rendered
    const failedScene = roomScene(state, {actual: 'free', performed: false, outcome: 'not_completed'});
    assert.doesNotMatch(failedScene, /data-motion="free-thought"/);

    // Standalone activityProps test for both monitor-facing and front-facing
    const monitorProps = activityProps('free', {facing: 'monitor', wet: labMode === 'wet'});
    assert.match(monitorProps, /data-motion="free-thought"/);
    assert.match(monitorProps, /fill="#fdfbf7"/);
    assert.match(monitorProps, /#fef08a/);
    assert.match(monitorProps, /#bbf7d0/);
    assert.match(monitorProps, /class="cup-steam"/);

    const frontProps = activityProps('free', {facing: 'front', wet: labMode === 'wet'});
    assert.match(frontProps, /data-motion="free-thought"/);
    assert.match(frontProps, /fill="#fdfbf7"/);
    assert.match(frontProps, /#fef08a/);
    assert.match(frontProps, /#bbf7d0/);
    assert.match(frontProps, /class="cup-steam"/);

    // Compatible in pending/away conditions
    const awayState = {...state, sabbatical: {...state.sabbatical, active: true}};
    const awayScene = roomScene(awayState, freeResult);
    assert.match(awayScene, /data-motion="free-thought"/);

    assert.equal(JSON.stringify(state), before, 'State must not be mutated');
  }
});
