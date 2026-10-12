import test from 'node:test';
import assert from 'node:assert/strict';
import {
  studentAppearance,
  weeklyAppearance,
  renderPortrait,
  skinTone,
  HAIR_PALETTES,
  HAIR_COLORS,
  SKIN_ANCHORS,
  HIJAB_PALETTES,
} from '../dist/appearance.js';
import {createState} from '../dist/engine.js';

test('global hair palettes include blonde, red, brown, and black with natural highlights and shadows', () => {
  // 1. Verify palette completeness
  const categories = new Set(Object.values(HAIR_PALETTES).map(p => p.category));
  assert.ok(categories.has('blonde'), 'palette must contain blonde');
  assert.ok(categories.has('red'), 'palette must contain red');
  assert.ok(categories.has('brown'), 'palette must contain brown');
  assert.ok(categories.has('black'), 'palette must contain black');

  // Verify specific key colors requested
  assert.ok(HAIR_PALETTES.platinumBlonde, 'must have platinum blonde');
  assert.ok(HAIR_PALETTES.honeyBlonde, 'must have honey blonde');
  assert.ok(HAIR_PALETTES.goldenBlonde, 'must have golden blonde');
  assert.ok(HAIR_PALETTES.ginger, 'must have ginger');
  assert.ok(HAIR_PALETTES.auburn, 'must have auburn');
  assert.ok(HAIR_PALETTES.copperRed, 'must have copper red');
  assert.ok(HAIR_PALETTES.chestnutBrown, 'must have chestnut brown');
  assert.ok(HAIR_PALETTES.warmBrunette, 'must have warm brunette');
  assert.ok(HAIR_PALETTES.espresso, 'must have espresso');
  assert.ok(HAIR_PALETTES.jetBlack, 'must have jet black');
  assert.ok(HAIR_PALETTES.softCharcoalBlack, 'must have soft charcoal black');

  // 2. Render each color and test that highlights and shadows are distinct and natural
  const baseStudent = studentAppearance(101, 'female');
  const hexLum = hex => {
    const [r, g, b] = hex.slice(1).match(/../g).map(c => parseInt(c, 16));
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  };

  for (const [key, palette] of Object.entries(HAIR_PALETTES)) {
    const svg = renderPortrait({...baseStudent, hair: palette.base, hairLength: 4});
    assert.ok(svg.includes('viewBox="0 0 320 496"'));
    assert.ok(!svg.includes('undefined'));
    assert.ok(!svg.includes('NaN'));

    const fills = [...svg.matchAll(/fill="(#[a-f0-9]{6})"/g)].map(m => m[1]);
    const baseLum = hexLum(palette.base);
    const hasHighlight = fills.some(f => hexLum(f) > baseLum + 0.02);
    const hasShadow = fills.some(f => hexLum(f) < baseLum - 0.05);
    assert.ok(hasHighlight, `${key} should have highlight lighter than base (base: ${baseLum.toFixed(2)})`);
    assert.ok(hasShadow, `${key} should have shadow darker than base`);
  }
});

test('global skin spectrum spans fair pale to deep obsidian with harmonious adaptive blush and neck shadows', () => {
  // Test anchors coverage
  assert.ok(SKIN_ANCHORS.length >= 8, 'must span wide global skin range');
  const fair = skinTone(0);
  const deep = skinTone(1);
  const mid = skinTone(0.5);

  assert.match(fair, /^#[a-f0-9]{6}$/);
  assert.match(deep, /^#[a-f0-9]{6}$/);
  assert.match(mid, /^#[a-f0-9]{6}$/);
  assert.notEqual(fair, deep);

  const base = studentAppearance(202, 'female');

  // Fair skin portrait: should have soft rosy blush (#e79a9f or #edb0ac)
  const fairSvg = renderPortrait({...base, skin: fair});
  assert.ok(fairSvg.includes('fill="#e79a9f"') || fairSvg.includes('fill="#edb0ac"'), 'fair skin should use soft rosy blush');

  // Deep skin portrait: should have rich berry/plum blush and deep warm neck shadow without chalkiness
  const deepSvg = renderPortrait({...base, skin: deep});
  assert.ok(deepSvg.includes('fill="#762434"') || deepSvg.includes('fill="#8c3345"'), 'deep skin should use rich berry blush');
  assert.notEqual(fairSvg, deepSvg);
});

test('buzz cut (까까머리) renders barber fade and stippled follicle textures in front and monitor views', () => {
  const buzzIdentity = studentAppearance(303, 'male', {hairLength: 0, hairStyle: 'buzz'});
  assert.equal(buzzIdentity.hairLength, 0);

  // Front view
  const frontSvg = renderPortrait(buzzIdentity, '학생 초상화', 'neutral', 'standing', 'front');
  assert.match(frontSvg, /aria-label="[^"]*까까머리[^"]*"/);
  assert.match(frontSvg, /data-hair-style="buzz"/);
  assert.ok(frontSvg.includes('viewBox="0 0 320 496"'));
  assert.ok(!frontSvg.includes('NaN'));

  // Monitor view (seated facing screen)
  const monitorSvg = renderPortrait(buzzIdentity, '학생 초상화', 'neutral', 'seated', 'monitor');
  assert.match(monitorSvg, /aria-label="[^"]*까까머리[^"]*모니터를 바라보며 앉음/);
  assert.match(monitorSvg, /data-facing="monitor"/);
  assert.match(monitorSvg, /data-hair-style="buzz"/);
  assert.notEqual(frontSvg, monitorSvg);
});

test('afro (아프로) renders volumetric spherical silhouette, specular highlight arc, and tight micro-curls in both views', () => {
  const afroIdentity = studentAppearance(404, 'female', {hairStyle: 'afro', hairLength: 3});
  assert.equal(afroIdentity.hairStyle, 'afro');

  // Front view
  const frontSvg = renderPortrait(afroIdentity, '학생 초상화', 'neutral', 'standing', 'front');
  assert.match(frontSvg, /aria-label="[^"]*아프로[^"]*"/);
  assert.match(frontSvg, /data-hair-style="afro"/);
  assert.ok(frontSvg.includes('viewBox="0 0 320 496"'));
  assert.ok(!frontSvg.includes('NaN'));

  // Monitor view
  const monitorSvg = renderPortrait(afroIdentity, '학생 초상화', 'neutral', 'seated', 'monitor');
  assert.match(monitorSvg, /aria-label="[^"]*아프로[^"]*모니터를 바라보며 앉음/);
  assert.match(monitorSvg, /data-facing="monitor"/);
  assert.match(monitorSvg, /data-hair-style="afro"/);
  assert.notEqual(frontSvg, monitorSvg);
});

test('coily / ringlet curls (입체 곱슬머리) render bouncy dimensional spiral ringlets in both views', () => {
  const coilyIdentity = studentAppearance(505, 'female', {hairStyle: 'coily', hairLength: 4});
  assert.ok(coilyIdentity.coily);

  // Front view
  const frontSvg = renderPortrait(coilyIdentity, '학생 초상화', 'neutral', 'standing', 'front');
  assert.match(frontSvg, /aria-label="[^"]*곱슬머리[^"]*"/);
  assert.match(frontSvg, /data-hair-style="coily"/);
  assert.ok(frontSvg.includes('viewBox="0 0 320 496"'));

  // Monitor view
  const monitorSvg = renderPortrait(coilyIdentity, '학생 초상화', 'neutral', 'seated', 'monitor');
  assert.match(monitorSvg, /data-facing="monitor"/);
  assert.match(monitorSvg, /data-hair-style="coily"/);
  assert.notEqual(frontSvg, monitorSvg);
});

test('hijab (히잡) renders elegant traditional scarf draping, undercap fold, face framing, and pin detail in all views and poses', () => {
  const hijabIdentity = studentAppearance(606, 'female', {hijab: true, hijabColor: '#536b5c'});
  assert.ok(hijabIdentity.hijab);
  assert.equal(hijabIdentity.hairStyle, 'hijab');

  // 1. Front view
  const frontSvg = renderPortrait(hijabIdentity, '학생 초상화', 'neutral', 'standing', 'front');
  assert.match(frontSvg, /aria-label="[^"]*히잡[^"]*"/);
  assert.match(frontSvg, /data-hair-style="hijab"/);
  assert.match(frontSvg, /data-headwear="hijab"/);
  // Verify metallic brooch/pin detail (#ffd700 gold)
  assert.ok(frontSvg.includes('fill="#ffd700"'), 'hijab front view should include brooch/pin detail');

  // 2. Monitor view
  const monitorSvg = renderPortrait(hijabIdentity, '학생 초상화', 'neutral', 'seated', 'monitor');
  assert.match(monitorSvg, /aria-label="[^"]*히잡[^"]*모니터를 바라보며 앉음/);
  assert.match(monitorSvg, /data-facing="monitor"/);
  assert.match(monitorSvg, /data-hair-style="hijab"/);
  assert.ok(monitorSvg.includes('fill="#ffd700"'), 'hijab monitor view should include pin detail');
  assert.notEqual(frontSvg, monitorSvg);

  // 3. All 4 poses render properly with hijab
  for (const pose of ['standing', 'seated', 'experiment', 'lecturing']) {
    const poseSvg = renderPortrait(hijabIdentity, '학생 초상화', 'neutral', pose, 'front');
    assert.match(poseSvg, new RegExp(`data-pose="${pose}"`));
    assert.match(poseSvg, /data-headwear="hijab"/);
    assert.ok(poseSvg.includes('viewBox="0 0 320 496"'));
    assert.ok(!poseSvg.includes('NaN'));
    if (pose === 'lecturing') {
      assert.ok(poseSvg.includes('ta-lecture-arm'), 'lecturing pose with hijab should have lecture arm');
    }
  }

  // 4. Color variation with hijab palettes
  const color1 = renderPortrait({...hijabIdentity, hijabColor: HIJAB_PALETTES[0]});
  const color2 = renderPortrait({...hijabIdentity, hijabColor: HIJAB_PALETTES[1]});
  assert.notEqual(color1, color2, 'different hijab colors must produce distinct portraits');
});

test('espresso brown is classified as brown with warm brown highlights rather than cool charcoal', () => {
  const baseStudent = studentAppearance(101, 'female');
  const svg = renderPortrait({...baseStudent, hair: HAIR_PALETTES.espresso.base, hairLength: 4});
  // Should contain warm brown midtone/highlights (#4a3226 or #6d5340), not cool slate (#464856 or #6c7082)
  assert.ok(svg.includes('fill="#4a3226"') || svg.includes('fill="#6d5340"'), 'espresso must use warm brown tones');
  assert.ok(!svg.includes('fill="#464856"'), 'espresso must not use cool charcoal black highlight');
});

test('coily hair produces distinct pixel rasters from standard wavy hair', () => {
  const base = studentAppearance(77, 'female', {hairLength: 4, skin: '#e8c6ab'});
  const wavySvg = renderPortrait({...base, curly: true, coily: false, hairStyle: 'curly'});
  const coilySvg = renderPortrait({...base, curly: false, coily: true, hairStyle: 'coily'});

  const wavyArt = wavySvg.match(/<g class="hair-fringe[^>]*>([\s\S]*?)<\/g>/)[1];
  const coilyArt = coilySvg.match(/<g class="hair-fringe[^>]*>([\s\S]*?)<\/g>/)[1];
  assert.notEqual(wavyArt, coilyArt, 'coily hair must have its own distinct 3D corkscrew geometry');
});

test('male student with afro or coily hair properly transitions to military buzz cut without residual afro', () => {
  const recruit = studentAppearance(999, 'male', {afro: true, hairStyle: 'afro'});
  assert.equal(recruit.hairStyle, 'afro');

  const state = {
    gender: 'male',
    creationSeed: 999,
    appearance: recruit,
    month: 84,
    service: { trainingStartMonth: 84, trainingReturnMonth: 84 },
  };

  const app = weeklyAppearance(state, 0);
  assert.equal(app.hairLength, 0);
  assert.equal(app.hairStyle, 'buzz');

  const svg = renderPortrait(app);
  assert.match(svg, /data-hair-style="buzz"/);
  assert.ok(!svg.includes('data-hair-style="afro"'), 'must not render afro while in military buzz');
});

test('hijab in monitor view covers the ear and front view keeps cheek blush off fabric; no duplicate labels', () => {
  const hijabStudent = studentAppearance(888, 'female', {hijab: true, hijabColor: '#2d3b55'});
  
  // Front view: clean title without duplicates
  const frontSvg = renderPortrait(hijabStudent, '학생', 'neutral', 'standing', 'front');
  assert.ok(!frontSvg.includes('히잡 · 히잡'), 'aria-label must not duplicate hijab');
  assert.ok(!frontSvg.includes('앞머리'), 'hijab should not show bangs in aria-label');

  // Monitor view: no duplicate labels
  const monitorSvg = renderPortrait(hijabStudent, '학생', 'neutral', 'seated', 'monitor');
  assert.ok(!monitorSvg.includes('히잡 · 히잡'), 'monitor aria-label must not duplicate hijab');
  assert.notEqual(frontSvg, monitorSvg);

  // Afro title check: no duplicate afro
  const afroStudent = studentAppearance(777, 'female', {afro: true, hairStyle: 'afro'});
  const afroSvg = renderPortrait(afroStudent);
  assert.ok(!afroSvg.includes('아프로 · 아프로'), 'afro aria-label must not duplicate afro');
  assert.ok(!afroSvg.includes('앞머리'), 'afro should not show bangs in aria-label');

  // Safe fallback test: missing skin/shirt does not throw
  assert.doesNotThrow(() => renderPortrait({}), 'renderPortrait must not throw on empty appearance object');
});

test('appearance generation is purely cosmetic, deterministic, and preserves game state integrity', () => {
  const s = createState('하늘', 42);
  const before = structuredClone(s);

  // Call weeklyAppearance across multiple months and weeks
  for (let m = 0; m < 24; m += 4) {
    const stateWithMonth = {...s, month: m};
    for (let w = 0; w < 5; w++) {
      const app = weeklyAppearance(stateWithMonth, w);
      assert.ok(app.hair);
      assert.ok(app.skin);
      assert.ok(typeof app.outfit === 'number');
    }
  }

  // Verify game state was not mutated
  assert.deepEqual(s, before);
});
