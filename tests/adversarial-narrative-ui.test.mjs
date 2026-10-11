import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ENDINGS, getEndingPages, endingRelationship, endingLetterInsertions } from '../dist/stories.js';
import { EVENTS } from '../dist/events.js';

const ROOT = new URL('../', import.meta.url);

// ============================================================================
// 1. ADVERSARIAL LETTER ASSEMBLY TESTING
// ============================================================================
test('Adversarial Letter Assembly: exhaustive valid boundary combinations never crash or violate prose invariants', () => {
  const endingIds = Object.keys(ENDINGS);
  const reasons = ['graduation_requirements', 'time_limit', 'qual_failure', undefined];
  const locales = ['ko', 'en'];
  const relationships = ['close', 'reserved', 'distant', -99999, -25, -21, -20, 0, 39, 40, 100, 99999];
  const studentName = '테스트학생';

  const emptyHistory = [];
  const singleHistory = [{ kind: 'event', id: 'counsel-late-night', choice: 0, month: 10 }];
  const counselingHistory = EVENTS.filter(e => e.id.startsWith('counsel-')).map((e, i) => ({
    kind: 'event', id: e.id, choice: i % 2, month: i * 2 + 1
  }));
  const allMemoriesHistory = [
    'counsel-daily-life', 'counsel-career-first', 'counsel-coursework', 'counsel-small-question',
    'counsel-results', 'counsel-master-career', 'counsel-qual', 'counsel-independent',
    'counsel-phd-career', 'counsel-feedback', 'counsel-late-night', 'counsel-rejection-tea',
    'counsel-imposter-stride', 'counsel-first-mistake', 'counsel-junior-mentoring', 'counsel-exam-buffer',
    'equipment', 'authorship', 'caregiving', 'best-paper', 'best-presentation',
    'data-loss', 'funding-cut', 'support-without-assumptions', 'undergrad-record', 'master-scope', 'doctoral-lead'
  ].map((id, i) => ({ kind: 'event', id, choice: i % 4, month: i * 2 + 1 }));

  const unusualHistory = [
    { kind: 'unknown', month: 1 },
    { kind: 'event', id: 'non-existent-id', choice: 99, month: 2 },
    { kind: 'event', id: 'equipment', choice: -1, month: 3 },
    { kind: 'qual', passed: false, month: 48 },
    { kind: 'qual', passed: false, month: 51 },
    { kind: 'event', id: 'counsel-late-night', choice: 0, month: 10 }
  ];

  const testHistories = [
    { label: 'empty', history: emptyHistory },
    { label: 'single', history: singleHistory },
    { label: 'counseling', history: counselingHistory },
    { label: 'all-memories', history: allMemoriesHistory },
    { label: 'unusual-valid-objects', history: unusualHistory }
  ];

  const labModes = ['wet', 'dry'];
  const recommendations = ['standard', 'alternate'];
  const zeroBudgetEndings = new Set(['leave', 'dropout', 'gameover', 'unfinished', 'youtuber', 'dismissed']);

  let runCount = 0;

  for (const id of endingIds) {
    for (const locale of locales) {
      for (const rel of relationships) {
        for (const th of testHistories) {
          for (const labMode of labModes) {
            for (const rec of recommendations) {
              const reasonList = id === 'gameover' ? reasons : [undefined];
              for (const reason of reasonList) {
                runCount++;
                const ctx = {
                  labMode,
                  fieldId: labMode === 'wet' ? '050' : '072',
                  recommendation: rec,
                  statistics: { student: { autonomy: 50, learning: 50, research: 50 } }
                };

                const pages = getEndingPages(id, locale, rel, studentName, reason, th.history, ctx);
                assert.ok(Array.isArray(pages), `Pages must be an array for ${id} ${locale} ${rel}`);
                assert.ok(pages.length > 0, `Pages must not be empty for ${id} ${locale} ${rel}`);

                const fullText = pages.join('\n\n');

                // 1. Placeholder check: Student name placeholder must be formatted
                assert.ok(!fullText.includes('{name}'), `Unreplaced {name} placeholder in ${id} ${locale} ${rel}`);
                assert.ok(!fullText.includes('undefined'), `Accidental "undefined" string in ${id} ${locale} ${rel}`);
                assert.ok(!fullText.includes('null'), `Accidental "null" string in ${id} ${locale} ${rel}`);

                // 2. Incomplete address check
                assert.ok(!/교수님도\s*(?:\n\n|$)/.test(fullText), `Incomplete address fragment in ${id} ${locale} ${rel}`);

                // 3. Duplicate paragraph check within each page
                for (let pIdx = 0; pIdx < pages.length; pIdx++) {
                  const paras = pages[pIdx].split('\n\n').map(s => s.trim()).filter(Boolean);
                  const longParas = paras.filter(p => p.length >= 25);
                  const pSet = new Set(longParas);
                  assert.equal(
                    pSet.size,
                    longParas.length,
                    `Duplicate paragraph found in page ${pIdx} of ${id} ${locale} ${rel}: ${JSON.stringify(longParas)}`
                  );
                }

                // 4. Memory budget compliance
                const dist = endingRelationship(rel, id);
                const maxBudget = zeroBudgetEndings.has(id) || dist === 'distant' ? 0 : (dist === 'reserved' ? 1 : 2);
                const insertions = endingLetterInsertions(id, dist, th.history, ctx, locale);
                assert.ok(
                  insertions.length <= maxBudget,
                  `Insertion budget exceeded: ${insertions.length} > ${maxBudget} in ${id} ${locale} ${dist}`
                );

                // 5. '기억합니다' count limit in Korean letters
                if (locale === 'ko') {
                  const remembers = (fullText.match(/기억합니다/g) || []).length;
                  assert.ok(
                    remembers <= 1,
                    `Excessive '기억합니다' (${remembers}) in ${id} ${rel} (history: ${th.label})`
                  );
                }

                // 6. Wet lab keyword leak check into Dry lab letters
                if (labMode === 'dry') {
                  for (const ins of insertions) {
                    if (ins.group === 'memory') {
                      assert.ok(
                        !/장비가 멈춘 날|공동기기실|시료|배양/.test(ins.text),
                        `Wet memory leak in dry lab (${id}): ${ins.text}`
                      );
                    }
                  }
                }

                // 7. Signed page sentence termination check
                const signedPages = pages.filter(page => /[―—]\s*[^\n]+(?:드림|올림)?\s*$/.test(page));
                for (const sp of signedPages) {
                  const sigMatch = sp.match(/\n[―—]\s*[^\n]+(?:드림|올림)?\s*$/);
                  if (sigMatch) {
                    const body = sp.slice(0, sigMatch.index).trimEnd();
                    assert.match(
                      body,
                      /[.?!。！？'"]$/,
                      `Incomplete sentence ending before signature in ${id} ${locale}: "${body.slice(-25)}"`
                    );
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  assert.ok(runCount >= 1000, `Must run at least 1000 boundary combinations (ran ${runCount})`);
});

test('Adversarial Letter Assembly Edge Case: sparse history containing null crashes in qual_failure branch', () => {
  // Document empirical vulnerability: history with null elements throws TypeError in qual_failure branch
  const sparseHistory = [null, { kind: 'event', id: 'counsel-late-night', choice: 0 }];
  
  // Non-gameover or non-qual branches handle null safely via memoryCandidates optional chaining
  assert.doesNotThrow(() => {
    getEndingPages('corporate', 'ko', 'close', '테스트', undefined, sparseHistory, { labMode: 'dry' });
  });

  // But qual_failure branch in lines 367/368/408 directly accesses h.kind without optional chaining
  assert.throws(() => {
    getEndingPages('gameover', 'ko', 'close', '테스트', 'qual_failure', sparseHistory, { labMode: 'dry' });
  }, /Cannot read properties of null/);
});

// ============================================================================
// 2. ADVERSARIAL GUIDANCE & PRINCIPLE TESTING
// ============================================================================
test('Adversarial Principle: no ending assigns BAD grade and all departures preserve dignity', () => {
  const endingIds = Object.keys(ENDINGS);

  for (const id of endingIds) {
    const ending = ENDINGS[id];
    // Check ending type: must be standard dignified taxonomy
    assert.ok(
      ['ENDING', 'EPILOGUE', 'CLOSING RECORD'].includes(ending.type),
      `Ending ${id} has non-standard or derogatory type: ${ending.type}`
    );

    // Title and career text must never contain BAD, rank letters, or punitive labels
    const titleKo = ending.title.ko;
    const titleEn = ending.title.en;
    const careerKo = ending.career.ko;
    const careerEn = ending.career.en;

    const pejorative = /BAD|FAILURE|LOOSER|낙오|실패자|패배|징벌|처벌/i;
    assert.ok(!pejorative.test(titleKo), `Pejorative found in ${id} titleKo: ${titleKo}`);
    assert.ok(!pejorative.test(titleEn), `Pejorative found in ${id} titleEn: ${titleEn}`);
    assert.ok(!pejorative.test(careerKo), `Pejorative found in ${id} careerKo: ${careerKo}`);
    assert.ok(!pejorative.test(careerEn), `Pejorative found in ${id} careerEn: ${careerEn}`);
  }

  // Specific dignity validations for departure & transition endings:
  // 1. Leave (휴학)
  const leavePages = getEndingPages('leave', 'ko', 'reserved', '테스트학생', undefined, [], { labMode: 'dry' });
  const leaveText = leavePages.join('\n\n');
  assert.match(leaveText, /결과가 없는 하루도 하루라는 걸 조금씩 배우고 있습니다/);
  assert.match(leaveText, /학생의 다음 선택을 기다리는 자리/);

  // 2. Dropout (학위과정 중단)
  const dropoutPages = getEndingPages('dropout', 'ko', 'reserved', '테스트학생', undefined, [], { labMode: 'dry' });
  const dropoutText = dropoutPages.join('\n\n');
  assert.match(dropoutText, /충분히 쉬었으면 합니다/);
  assert.doesNotMatch(dropoutText, /실패|낙오|부족/);

  // 3. Unemployed (구직 중)
  const unemployedPages = getEndingPages('unemployed', 'ko', 'reserved', '테스트학생', undefined, [], { labMode: 'dry' });
  const unemployedText = unemployedPages.join('\n\n');
  assert.match(unemployedText, /채용 결과만으로 이 사람이 보낸 시간이나 해 온 일을 설명할 수는 없었다/);
  assert.match(unemployedText, /다음 일을 찾는 동안에도, 우리는 안부를 나눌 수 있었다/);

  // 4. Gameover reasons (8년 시한 만료, 학위 요건, 퀄 미통과)
  for (const reason of ['graduation_requirements', 'time_limit', 'qual_failure']) {
    const goPages = getEndingPages('gameover', 'ko', 'reserved', '테스트학생', reason, [], { labMode: 'dry' });
    const goText = goPages.join('\n\n');
    assert.ok(!/폐쇄|무능|실패자|BAD/i.test(goText), `Harsh pejorative in gameover (${reason})`);
    if (reason === 'time_limit') {
      assert.match(goText, /끝난 것은 게임의 기간이지, 그동안의 연구를 없애는 일이 아니었다/);
    } else if (reason === 'graduation_requirements') {
      assert.match(goText, /성과표의 빈칸을 보고, 끝났다고 말할 수 없었던 시간을 생각했다/);
    } else if (reason === 'qual_failure') {
      assert.ok(
        /연구실 운영이 중단된 것은 아니었다|연구실을 운영하지 못해서 끝난 것은 아니었다/.test(goText),
        `Must distinguish qualification outcome from lab shutdown in ${reason}`
      );
      assert.ok(
        /학생이 해 온 일을 없던 것으로 기록하지는 않았다|어느 하나가 다른 하나를 지워서는 안 됐다/.test(goText),
        `Must acknowledge past work in ${reason}`
      );
    }
  }

  // 5. Dismissed (자격시험 제적)
  const dismissedPages = getEndingPages('dismissed', 'ko', 'reserved', '테스트학생', undefined, [], { labMode: 'dry' });
  const dismissedText = dismissedPages.join('\n\n');
  assert.match(dismissedText, /앞으로 어떤 일을 할지는 아직 정해지지 않았다/);
  assert.match(dismissedText, /시간을 두고 결정하기로 했다/);
});

test('Adversarial Guidance: all 16 counseling events offer student-centered guidance without single-cause blame', () => {
  const counselingEvents = EVENTS.filter(e => e.id.startsWith('counsel-'));
  assert.equal(counselingEvents.length, 16, 'Must include exactly 16 counseling events');

  for (const ev of counselingEvents) {
    assert.ok(ev.options && ev.options.length >= 2, `Counseling event ${ev.id} must offer at least 2 choices`);

    for (let optIdx = 0; optIdx < ev.options.length; optIdx++) {
      const opt = ev.options[optIdx];
      const optLabelKo = opt.label.ko;
      const optLabelEn = opt.label.en;

      // Verify no scolding or punitive phrasing
      assert.doesNotMatch(optLabelKo, /질책|야단|혼내|강요|비난|무시/, `Punitive tone in ${ev.id} opt ${optIdx}: ${optLabelKo}`);
      assert.doesNotMatch(optLabelEn, /reprimand|scold|punish|force|blame/i, `Punitive tone in ${ev.id} opt ${optIdx}: ${optLabelEn}`);

      // Primary supportive choices (options 0 and 1) must provide warm encouragement
      if (optIdx < 2) {
        const effects = opt.effects;
        if (effects.hidden?.rapport !== undefined) {
          assert.ok(effects.hidden.rapport >= 0, `Primary choice rapport penalty in ${ev.id} opt ${optIdx}`);
        }
        if (effects.professor?.mentoring !== undefined) {
          assert.ok(effects.professor.mentoring >= 0, `Primary choice mentoring penalty in ${ev.id} opt ${optIdx}`);
        }
      }
    }
  }
});

// ============================================================================
// 3. ADVERSARIAL UI LAYOUT TESTING
// ============================================================================
test('Adversarial UI Layout: font sizes, touch targets, and occlusion safeguards across mobile viewports', async () => {
  const styleCss = await readFile(new URL('dist/style.css', ROOT), 'utf8');
  const mobileCss = await readFile(new URL('dist/mobile.css', ROOT), 'utf8');
  const campusCss = await readFile(new URL('dist/campus-ui.css', ROOT), 'utf8');

  // 1. Audit core stylesheets for sub-10px fonts
  for (const [name, css] of [['style.css', styleCss], ['mobile.css', mobileCss], ['campus-ui.css', campusCss]]) {
    // Check font-size: Xpx declarations
    const pxMatches = [...css.matchAll(/(?:font-size:\s*|font:\s*[^;]*\b)([0-9]+(?:\.[0-9]+)?)px/g)];
    for (const m of pxMatches) {
      const px = parseFloat(m[1]);
      assert.ok(
        px >= 10,
        `Found sub-10px font declaration (${px}px) in core gameplay stylesheet ${name}: "${m[0]}"`
      );
    }
  }

  // 2. Touch target compliance: Verify >=38px-44px interactive controls
  // Faculty credit buttons (.credit-blocks button)
  const creditTouch = mobileCss.match(/\.credit-blocks button\s*\{[^}]*min-width:\s*([0-9]+)px;[^}]*min-height:\s*([0-9]+)px/);
  assert.ok(creditTouch, '.credit-blocks button touch rule missing in mobile.css');
  assert.ok(parseInt(creditTouch[1], 10) >= 38, 'Credit button min-width must be >= 38px');
  assert.ok(parseInt(creditTouch[2], 10) >= 42, 'Credit button min-height must be >= 42px');

  // Touch stepper buttons (.touch-stepper button)
  const stepperTouch = styleCss.match(/\.touch-stepper button\s*\{[^}]*min-width:\s*([0-9]+)px;[^}]*min-height:\s*([0-9]+)px/);
  assert.ok(stepperTouch, '.touch-stepper button touch rule missing in style.css');
  assert.ok(parseInt(stepperTouch[1], 10) >= 44, 'Touch stepper min-width must be >= 44px');
  assert.ok(parseInt(stepperTouch[2], 10) >= 44, 'Touch stepper min-height must be >= 44px');

  // Navigation and utility items
  assert.match(mobileCss, /\.header-nav a,\s*\.utility-bar button,\s*\.footer-contact a\s*\{[^}]*min-height:\s*44px/);

  // Monthly confirmation primary button
  const confirmPrimary = mobileCss.match(/\.monthly-confirm \.primary\s*\{[^}]*min-height:\s*([0-9]+)px/);
  assert.ok(confirmPrimary, '.monthly-confirm .primary missing in mobile.css');
  assert.ok(parseInt(confirmPrimary[1], 10) >= 48, '.monthly-confirm .primary must be >= 48px');

  // Interactive decision choices
  const choiceBtn = styleCss.match(/\.choice\s*\{[^}]*min-height:\s*([0-9]+)px/);
  assert.ok(choiceBtn, '.choice min-height missing in style.css');
  assert.ok(parseInt(choiceBtn[1], 10) >= 48, '.choice min-height must be >= 48px');

  // Feedback options
  const feedbackOption = mobileCss.match(/\.feedback-option\s*\{[^}]*min-height:\s*([0-9]+)px/);
  assert.ok(feedbackOption, '.feedback-option min-height missing in mobile.css');
  assert.ok(parseInt(feedbackOption[1], 10) >= 64, '.feedback-option min-height must be >= 64px');

  // 3. Occlusion safeguards
  // Verify sticky live-stage has scroll margin to prevent occlusion
  assert.match(styleCss, /\.live-lab\s*\{[^}]*position:\s*sticky/);
  assert.match(styleCss, /\.live-lab\s*\{[^}]*scroll-margin-top/);

  // Verify dynamic lab scroll offset variable is hooked in root
  assert.match(styleCss, /scroll-padding-top:\s*var\(--lab-scroll-offset,\s*20px\)/);

  // Verify faculty scroll summary allows mobile horizontal scrolling
  assert.match(styleCss, /\.faculty-scroll-summary\s*\{[^}]*overflow-x:\s*auto/);

  // Verify mobile dialog does not exceed viewport height
  assert.match(mobileCss, /dialog\s*\{[^}]*max-height:\s*calc\(100dvh\s*-\s*24px\)/);
});
