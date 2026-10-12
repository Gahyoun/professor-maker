import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createState} from '../dist/engine.js';
import {roomScene} from '../dist/lab-scene.js';
import {miniRoomSeason, roomDecorations} from '../dist/mini-room.js';

test('Window scenery 3-tier perspective: far background, midground, and foreground with seasonal atmospheric depth', () => {
  const seasons = [
    {month: 0, season: 'spring', label: '봄'},
    {month: 4, season: 'summer', label: '여름'},
    {month: 7, season: 'autumn', label: '가을'},
    {month: 10, season: 'winter', label: '겨울'}
  ];

  for (const {month, season, label} of seasons) {
    const s = createState('정다은', 2026, {fieldId: '050', labMode: 'dry'});
    s.month = month;
    const scene = roomScene(s);

    // Root window container and season matching
    assert.match(scene, new RegExp(`class="window-scenery window-season-${season}"`));
    assert.match(scene, new RegExp(`data-season="${season}"`));
    assert.match(scene, new RegExp(`aria-label="창밖 ${label} 풍경"`));

    // 1. Far Background Layer (원경: 대기 원근법 산 능선, 지평선 그라데이션, 층운 픽셀 구름)
    assert.match(scene, /class="window-view-far" data-layer="far-background"/);
    assert.match(scene, /aria-label="원경 산 능선 및 지평선 층운"/);
    // Stratus pixel clouds
    assert.match(scene, /#ffffff/);
    assert.match(scene, /#f0f9ff/);
    // Far particle layer
    assert.match(scene, /class="window-particles-far" data-layer="far-particles"/);

    // 2. Midground Layer (중경: 캠퍼스 시계탑 건물, 아치형 창문 연구동, 가로수 및 언덕길)
    assert.match(scene, /class="window-view-mid" data-layer="midground"/);
    assert.match(scene, /aria-label="중경 캠퍼스 시계탑과 연구동"/);
    // Campus Clock Tower
    assert.match(scene, /class="campus-clock-tower" data-midground="clock-tower"/);
    assert.match(scene, /aria-label="캠퍼스 본관 시계탑 건물"/);
    assert.match(scene, /#f8fafc/); // clock face
    assert.match(scene, /#0f766e/); // copper finial/spire
    // Research Building Wing with arched windows
    assert.match(scene, /class="campus-research-wing" data-midground="research-building"/);
    assert.match(scene, /aria-label="아치형 창문의 연구동 건물 실루엣"/);
    assert.match(scene, /#fde68a/); // warm amber window glow
    // Midground campus trees
    assert.match(scene, /class="campus-midground-trees"/);

    // 3. Foreground Window View (근경: 섬세한 가로수 나뭇가지, 잎사귀, 자연스러운 창틀 그림자)
    assert.match(scene, /class="window-view-near" data-layer="foreground"/);
    assert.match(scene, /aria-label="근경 가로수 및 창틀 디테일"/);
    assert.match(scene, /#5c4033/); // delicate branch wood
    assert.match(scene, /class="window-frame-shadow"/);
    assert.match(scene, /#b8a994/); // window frame ambient shadow
    assert.match(scene, /#baa993/); // jamb shadow
    assert.match(scene, /#c4b59f/); // mullion shadow

    // Seasonal Far Particles & Multi-depth Foreground Layers
    if (season === 'spring') {
      assert.match(scene, /#fbcfe8|#fce7f3/); // cherry blossom far particles
      assert.match(scene, /data-effect="cherry-petals"/);
      assert.match(scene, /aria-label="흩날리는 벚꽃 꽃잎 픽셀"/);
      assert.match(scene, /class="spring-cherry-drifts" data-effect="cherry-drift"/);
      assert.match(scene, /aria-label="흩날리는 벚꽃 꽃잎 다층 픽셀"/);
    } else if (season === 'summer') {
      assert.match(scene, /#bae6fd|#e0f2fe/); // rain mist far particles
      assert.match(scene, /data-effect="cumulus-clouds"/);
      assert.match(scene, /class="summer-rain-streaks" data-effect="summer-shower"/);
      assert.match(scene, /aria-label="여름 소나기 빗살 픽셀"/);
    } else if (season === 'autumn') {
      assert.match(scene, /#fed7aa|#fde047/); // golden ginkgo & maple far particles
      assert.match(scene, /data-effect="autumn-leaves"/);
      assert.match(scene, /aria-label="낙엽 픽셀"/);
      assert.match(scene, /class="autumn-ginkgo-maple" data-effect="ginkgo-maple"/);
      assert.match(scene, /aria-label="가을 단풍과 은행잎 픽셀"/);
    } else if (season === 'winter') {
      assert.match(scene, /#ffffff/); // snow dust far particles
      assert.match(scene, /data-effect="pixel-snow"/);
      assert.match(scene, /aria-label="내리는 픽셀 눈송이"/);
      assert.match(scene, /class="winter-snowflakes-3d" data-effect="heavy-snow"/);
      assert.match(scene, /aria-label="펄펄 날리는 입체 함박눈 픽셀"/);
    }
  }
});

test('Laboratory realistic pixel objects: pantry, desk surroundings, board tray, calendar, post-its, and equipment details', () => {
  // Dry lab inspection
  const dryState = createState('최민지', 7919, {labMode: 'dry'});
  const dryScene = roomScene(dryState);

  // 1. Pantry & Break Details (탕비실 & 휴게 디테일)
  assert.match(dryScene, /class="capsule-coffee-machine" data-object="capsule-coffee-machine"/);
  assert.match(dryScene, /aria-label="캡슐 커피 머신"/);
  assert.match(dryScene, /#b91c1c/); // crimson body
  assert.match(dryScene, /#93c5fd/); // translucent water tank
  assert.match(dryScene, /class="lab-snack-box" data-object="lab-snack-box"/);
  assert.match(dryScene, /aria-label="연구실 탕비 간식 박스"/);
  assert.match(dryScene, /#16a34a/); // energy bar green
  assert.match(dryScene, /#2563eb/); // energy bar blue
  assert.match(dryScene, /#78350f/); // chocolate brown

  // 2. Desk Surroundings & Floor Details (책상 주변 & 바닥 디테일)
  assert.match(dryScene, /class="lab-cable-organizer" data-object="cable-organizer"/);
  assert.match(dryScene, /aria-label="책상 밑 멀티탭 전선 정리함"/);
  assert.match(dryScene, /#22c55e/); // green power LED dot
  assert.match(dryScene, /class="lab-bag-hanger" data-object="bag-hanger"/);
  assert.match(dryScene, /aria-label="연구원 가방 걸이와 백팩"/);
  assert.match(dryScene, /#cbd5e1/); // stainless water bottle in mesh pocket
  assert.match(dryScene, /class="lab-wastebasket" data-object="wastebasket"/);
  assert.match(dryScene, /aria-label="연구실 페이퍼 바스켓 휴지통"/);
  assert.match(dryScene, /#f8fafc/); // crumpled paper balls
  assert.match(dryScene, /#fef08a/); // crumpled yellow memo

  // 3. Board & Wall Details (칠판 & 벽면 디테일)
  assert.match(dryScene, /class="board-chalk-tray" data-object="board-tray"/);
  assert.match(dryScene, /aria-label="칠판 하단 트레이의 분필과 지우개"/);
  assert.match(dryScene, /#3f3f46/); // felt eraser base
  assert.match(dryScene, /#a16207/); // wooden eraser handle
  assert.match(dryScene, /class="wall-calendar" data-object="wall-calendar"/);
  assert.match(dryScene, /aria-label="연구 일정 벽걸이 달력"/);
  assert.match(dryScene, /#ef4444/); // D-day deadline red circle
  assert.match(dryScene, /#3b82f6/); // conference milestone blue circle
  assert.match(dryScene, /class="wall-postits" data-object="wall-postits"/);
  assert.match(dryScene, /aria-label="포스트잇과 자석 핀 메모"/);
  assert.match(dryScene, /#fef08a/); // yellow post-it
  assert.match(dryScene, /#bbf7d0/); // mint post-it
  assert.match(dryScene, /#fbcfe8/); // pink post-it

  // 4. Equipment Details (장비 디테일)
  // Dry lab server rack with real-time blinking LED indicators
  assert.match(dryScene, /class="dry-server-rack" data-equipment="server-rack"/);
  assert.match(dryScene, /aria-label="건식 랩 서버 랙과 실시간 LED 인디케이터"/);
  assert.match(dryScene, /class="server-led-indicator" aria-label="실시간 LED 인디케이터"/);
  assert.match(dryScene, /#22c55e/); // green power LED
  assert.match(dryScene, /#f59e0b/); // amber activity LED
  assert.match(dryScene, /#06b6d4/); // cyan storage IO LED
  assert.match(dryScene, /#3b82f6/); // blue status LED

  // Real-time blinking LED CSS animations
  const motionCss = readFileSync(new URL('../dist/activity-motion.css', import.meta.url), 'utf8');
  assert.match(motionCss, /\.server-led-indicator polygon:nth-child\(2\)\s*\{animation:server-led-blink/);
  assert.match(motionCss, /@keyframes server-led-blink/);

  // Wet lab inspection
  const wetState = createState('김민준', 8888, {labMode: 'wet'});
  const wetScene = roomScene(wetState);
  assert.match(wetScene, /class="wet-flask-drying-rack" data-equipment="flask-drying-rack"/);
  assert.match(wetScene, /aria-label="습식 랩 플라스크 건조대와 시약 선반"/);
  assert.match(wetScene, /#bae6fd/); // inverted drying Erlenmeyer flask
  assert.match(wetScene, /#b45309/); // amber chemical reagent bottle
  assert.match(wetScene, /#dc2626/); // GHS hazard warning red diamond
  assert.match(wetScene, /#fef08a/); // GHS hazard diamond center
});

test('Stacked plushies and mascot pyramid decorate the bookshelf with 5 distinct animal dolls', () => {
  for (const labMode of ['dry', 'wet']) {
    for (const seed of [1, 2, 3, 1004]) {
      const s = createState('한소희', seed, {labMode});
      const scene = roomScene(s);

      // Root stacked plushies container & data-props integrity
      assert.match(scene, /class="stacked-plushies" data-decor="plushie-pile"/);
      assert.match(scene, /aria-label="작은 동물 인형 더미와 인형 피라미드"/);
      assert.match(scene, /data-props="[^"]*\bplush\b[^"]*"/);
      assert.match(scene, /data-props="[^"]*\bplushPile\b[^"]*"/);

      // 1. 하얀 찹쌀떡 고양이 (White mochi cat)
      assert.match(scene, /class="plushie-mochi-cat" aria-label="하얀 찹쌀떡 고양이 인형"/);
      assert.match(scene, /fill="#f8fafc"/); // white body
      assert.match(scene, /fill="#fda4af"/); // blush cheeks

      // 2. 갈색 아기 곰 (Brown baby bear)
      assert.match(scene, /class="plushie-baby-bear" aria-label="갈색 아기 곰 인형"/);
      assert.match(scene, /fill="#c6a281"/); // bear body
      assert.match(scene, /fill="#e7d5b7"/); // bear muzzle

      // 3. 쫑긋한 귀의 분홍 토끼 (Pink bunny with upright ears)
      assert.match(scene, /class="plushie-pink-bunny" aria-label="쫑긋한 귀의 분홍 토끼 인형"/);
      assert.match(scene, /fill="#f472b6"/); // pink body and ears
      assert.match(scene, /fill="#fbcfe8"/); // white inner ear

      // 4. 민트 개구리 마스코트 (Mint frog mascot)
      assert.match(scene, /class="plushie-mint-frog" aria-label="민트 개구리 마스코트 인형"/);
      assert.match(scene, /fill="#86efac"/); // mint frog body
      assert.match(scene, /fill="#4ade80"/); // eye bumps

      // 5. 샛노란 병아리 (Bright yellow chick)
      assert.match(scene, /class="plushie-yellow-chick" aria-label="샛노란 병아리 인형"/);
      assert.match(scene, /fill="#facc15"/); // bright yellow body
      assert.match(scene, /fill="#f59e0b"/); // top feather tuft
      assert.match(scene, /fill="#ea580c"/); // orange beak
    }
  }
});

test('State immutability, RNG independence, and zero NaN/undefined errors', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const state = createState('테스터', seed, {labMode: seed % 2 ? 'dry' : 'wet'});
    const before = structuredClone(state);
    const html = roomScene(state);

    assert.doesNotMatch(html, /NaN|undefined|null/);
    assert.deepEqual(state, before, 'roomScene must never mutate state or consume RNG');
  }
});
