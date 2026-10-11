import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT_DIR = resolve(fileURLToPath(import.meta.url), '../../');
async function readDistFile(relPath) {
  return await readFile(resolve(ROOT_DIR, 'dist', relPath), 'utf8');
}
import {createState, decide, EVENTS} from '../dist/engine.js';
import {endingLetterInsertions, getEndingStory, getEndingPages, ENDINGS} from '../dist/stories.js';
import {endingVoice} from '../dist/ending-voice.js';
import {counselingReaction} from '../dist/counseling.js';
import {counselingReaction as dialogReaction} from '../dist/dialogue.js';
import {isMuted, setMuted, toggleMute, playTypewriterClick, playPaperRustle, playChoiceClick, playTrueEndingChime, playClick, SOUND_MUTED_KEY} from '../dist/sound.js';

test('Feature 1: Fatigue avoidance in endingLetterInsertions and endingVoice prioritizes unseen passages', () => {
  const history = [
    {kind: 'event', id: 'counsel-small-question', choice: 0, month: 10},
    {kind: 'event', id: 'counsel-career-first', choice: 0, month: 15},
  ];
  const context = {
    statistics: {
      temperament: {caution: 75, curiosity: 50, diligence: 50, expression: 50},
      student: {research: 60, learning: 65, language: 50, social: 50, autonomy: 50, stamina: 60, stress: 20}
    }
  };

  // 1. Unseen passages are prioritized over seen ones in endingLetterInsertions
  const insertionsFresh = endingLetterInsertions('bachelor', 'close', history, context, 'ko');
  assert.ok(insertionsFresh.length > 0, 'Must produce insertions');
  const seenIds = insertionsFresh.map(x => x.id);

  // If the previous ones are in seenPassageIds, next call should pick different ones if available
  const insertionsSecondRun = endingLetterInsertions('bachelor', 'close', history, {
    ...context,
    seenPassageIds: seenIds
  }, 'ko');
  assert.ok(insertionsSecondRun.length > 0);
  // At least one chosen insertion should be fresh / not in seenIds (or have lower seen count)
  const hasFresh = insertionsSecondRun.some(x => !seenIds.includes(x.id));
  assert.ok(hasFresh, 'Second run must prioritize unseen passages to avoid player fatigue');

  // If memory candidate was seen multiple times, fresh skill/trait should be prioritized
  const heavilySeenMemories = ['memory.counsel-career-first.0', 'memory.counsel-small-question.0'];
  const insertionsAfterFatigue = endingLetterInsertions('bachelor', 'reserved', history, {
    ...context,
    seenPassageIds: heavilySeenMemories
  }, 'ko');
  assert.ok(insertionsAfterFatigue.length > 0);
  assert.notEqual(insertionsAfterFatigue[0].group, 'memory', 'Heavily seen memory should yield to fresh skills/traits');
  assert.notEqual(insertionsAfterFatigue[0].id, 'memory.counsel-small-question.0', 'Heavily seen memory should yield to fresh skills/traits');

  // 2. endingVoice prioritizes unseen voice lines
  const voiceContext = {
    ending: 'corporate',
    relationship: 'close',
    statistics: {
      temperament: {caution: 80, curiosity: 50, diligence: 50, expression: 50},
      student: {research: 70, learning: 70, language: 50, social: 50, autonomy: 50, stamina: 60, stress: 20}
    }
  };
  const voiceFresh = endingVoice(voiceContext, 'ko');
  assert.ok(voiceFresh.length > 0, 'endingVoice produces notes');

  // With seen passages
  const seenVoiceId = 'voice.caution.reread.v1';
  const voiceWithSeen = endingVoice({
    ...voiceContext,
    seenPassageIds: [seenVoiceId, seenVoiceId]
  }, 'ko');
  assert.ok(voiceWithSeen.length > 0);
  assert.ok(voiceWithSeen.every(text => !text.includes('보내기 전에 이 글을 한 번 더')), 'Seen voice passage must be avoided in favor of unseen passages');
});

test('Feature 2: Pure Web Audio API module works in headless/node and manages mute state', () => {
  // Key verification
  assert.equal(SOUND_MUTED_KEY, 'pm-sound-muted');

  // Audio synthesis functions must be safe in Node / headless
  assert.doesNotThrow(() => playTypewriterClick());
  assert.doesNotThrow(() => playPaperRustle());
  assert.doesNotThrow(() => playChoiceClick());
  assert.doesNotThrow(() => playTrueEndingChime());
  assert.doesNotThrow(() => playClick());

  // Mute state management
  const initial = isMuted();
  assert.equal(typeof initial, 'boolean');

  // Toggle mute
  const toggled = toggleMute();
  assert.equal(typeof toggled, 'boolean');
  assert.equal(toggled, isMuted());

  // Set explicit mute
  setMuted(true);
  assert.equal(isMuted(), true);
  setMuted(false);
  assert.equal(isMuted(), false);

  // Even when muted or unmuted, playback does not throw
  assert.doesNotThrow(() => playTypewriterClick());
  setMuted(true);
  assert.doesNotThrow(() => playTypewriterClick());
  setMuted(false);
});

test('Feature 3: Student counseling reactions provide real-time expressions and nuanced dialogue', () => {
  const s = createState('', 42);
  s.hidden.rapport = 50; // high rapport
  s.temperament.caution = 75; // high caution

  // Re-export check
  assert.equal(counselingReaction, dialogReaction, 'counselingReaction must be re-exported by dialogue.js');

  const reaction = counselingReaction(s, 'counsel-small-question', 0, 'ko');
  assert.ok(reaction, 'Reaction must exist');
  assert.ok(typeof reaction.response === 'string' && reaction.response.length > 0, 'Response dialogue must be non-empty string');
  assert.ok(['relieved', 'happy', 'focused', 'surprised', 'worried', 'sad', 'delighted'].includes(reaction.expression), `Expression must be valid: got ${reaction.expression}`);

  // Low rapport vs high rapport nuanced dialogue
  const lowRapportState = createState('', 42);
  lowRapportState.hidden.rapport = -30;
  const lowReaction = counselingReaction(lowRapportState, 'counsel-small-question', 0, 'ko');
  assert.notEqual(reaction.response, lowReaction.response, 'Low rapport response must differ from high rapport response');

  // Different temperaments yield distinct reactions
  const cautiousState = createState('', 42);
  cautiousState.hidden.rapport = 25;
  cautiousState.temperament = {caution: 80, curiosity: 40, diligence: 40, expression: 40};

  const normalState = createState('', 42);
  normalState.hidden.rapport = 25;
  normalState.temperament = {caution: 40, curiosity: 40, diligence: 40, expression: 40};

  const cautiousReaction = counselingReaction(cautiousState, 'counsel-daily-life', 0, 'ko');
  const normalReaction = counselingReaction(normalState, 'counsel-daily-life', 0, 'ko');
  assert.notEqual(cautiousReaction.response, normalReaction.response, 'Caution temperament must influence student reaction dialogue');
  assert.equal(cautiousReaction.expression, 'focused');
  assert.equal(normalReaction.expression, 'relieved');

  const curiousState = createState('', 42);
  curiousState.hidden.rapport = 25;
  curiousState.temperament = {caution: 40, curiosity: 80, diligence: 40, expression: 40};
  const curiousReaction = counselingReaction(curiousState, 'counsel-coursework', 1, 'ko');
  const normalCourseworkReaction = counselingReaction(normalState, 'counsel-coursework', 1, 'ko');
  assert.notEqual(curiousReaction.response, normalCourseworkReaction.response, 'Curiosity temperament must influence student reaction dialogue');

  // Integration in engine decide: logged event record has response and expression
  s.month = 10;
  s.pending = {kind: 'event', id: 'counsel-small-question'};
  const next = decide(s, 0);
  const loggedEvent = next.history.findLast(h => h.kind === 'event' && h.id === 'counsel-small-question');
  assert.ok(loggedEvent, 'Event must be recorded in history');
  assert.equal(loggedEvent.response, reaction.response, 'History entry must record counseling response');
  assert.equal(loggedEvent.expression, reaction.expression, 'History entry must record counseling expression');
});

test('Feature 4: Diversified ending subtitles and epilogues by rapport and temperament', () => {
  // Reference equality when context is empty
  assert.equal(getEndingStory('true'), ENDINGS.true, 'getEndingStory with no context must preserve reference equality');

  // Corporate ending titles & subtitles across rapport
  const closeCorporate = getEndingStory('corporate', {relationship: 'close'});
  const reservedCorporate = getEndingStory('corporate', {relationship: 'reserved'});
  const distantCorporate = getEndingStory('corporate', {relationship: 'distant'});

  assert.equal(closeCorporate.title.ko, '커피가 식을 때까지');
  assert.equal(reservedCorporate.title.ko, '딱 알맞은 거리');
  assert.equal(distantCorporate.title.ko, '서로의 자리에서');

  assert.equal(closeCorporate.subtitle.ko, '가까워진 거리');
  assert.equal(reservedCorporate.subtitle.ko, '딱 알맞은 거리');
  assert.equal(distantCorporate.subtitle.ko, '각자의 선을 지키며');

  // Subtitles exist for canonical endings
  const canonicalIds = ['true', 'institute', 'startup', 'resident_researcher', 'unrelated', 'bachelor', 'masters', 'leave', 'postdoc'];
  for (const id of canonicalIds) {
    const story = getEndingStory(id, {relationship: 'close'});
    assert.ok(story.subtitle, `${id} must have a subtitle when relationship is provided`);
    assert.ok(story.subtitle.ko && story.subtitle.en, `${id} subtitle must support ko and en`);
  }

  // Epilogue diversification in getEndingPages
  const baseContext = {
    statistics: {
      temperament: {caution: 75, curiosity: 40, diligence: 50, expression: 50},
      student: {research: 60, learning: 60, language: 50, social: 50, autonomy: 50, stamina: 60, stress: 20}
    }
  };
  const closePages = getEndingPages('corporate', 'ko', 'close', '김민지', null, [], baseContext);
  const distantPages = getEndingPages('corporate', 'ko', 'distant', '김민지', null, [], baseContext);
  assert.notEqual(closePages[closePages.length - 1], distantPages[distantPages.length - 1], 'Epilogue ending page must vary between close and distant rapport');

  // Check punctuation on epilogue paragraphs
  for (const p of closePages[closePages.length - 1].split('\n\n')) {
    assert.match(p.trim(), /([.?!]|다|요|림)$/, `Paragraph must end with appropriate punctuation: "${p}"`);
  }
});

test('Feature UI Integration: app.js contains toggle-audio button and audio wiring', async () => {
  const appJs = await readDistFile('app.js');
  assert.match(appJs, /data-ui="toggle-audio"/, 'app.js must include toggle-audio button in markup');
  assert.match(appJs, /toggleMute\(\)/, 'app.js click handler must call toggleMute');
  assert.match(appJs, /playPaperRustle\(\)/, 'app.js must invoke playPaperRustle on letter opening / paging');
  assert.match(appJs, /playChoiceClick\(\)/, 'app.js must invoke playChoiceClick on choice decisions');
  assert.match(appJs, /playTrueEndingChime\(\)/, 'app.js must invoke playTrueEndingChime on true ending');
  assert.match(appJs, /letter-subtitle/, 'app.js must render letter-subtitle in letter modal');
  assert.match(appJs, /ending-subtitle/, 'app.js must render ending-subtitle in lab summary');
  assert.match(appJs, /mail-subtitle/, 'app.js must render mail-subtitle in mail list');
});
