import test from 'node:test';
import assert from 'node:assert/strict';
import {DIALOGUES,studentLine} from '../dist/dialogue.js';
import {ENDINGS} from '../dist/stories.js';
import {EVENTS,createState,HIDDEN_RANGES,validateSave} from '../dist/engine.js';
import {generateKoreanName,generateNameRecord,KOREAN_NAME_POOLS} from '../dist/names.js';

test('content covers the engine outcomes and both fields of each original letter',()=>{
  for(const id of ['true','institute','corporate','unrelated','startup','unemployed','youtuber','resident_researcher','leave','bachelor','masters','dropout','unfinished','gameover']) {
    const story=ENDINGS[id];assert.ok(story,`Missing epilogue: ${id}`);
    for(const field of [story.title,story.career,story.time,...story.pages])for(const lang of ['ko','en'])assert.ok(typeof field[lang]==='string'&&field[lang].trim());
  }
  assert.equal(new Set(EVENTS.map(e=>e.id)).size,EVENTS.length);
  for(const e of EVENTS){assert.equal(e.options.length,2);for(const lang of ['ko','en']){assert.ok(e.title[lang]&&e.body[lang]);for(const o of e.options)assert.ok(o.label[lang]);}}
});
test('dialogue observes mixed spectra without changing simulation state or its RNG',()=>{
  assert.ok(Object.values(DIALOGUES).flat().length>=250);
  for(const edge of [0,1])for(let month=0;month<96;month++) {
    const s=createState('Test',42);s.month=month;
    for(const [key,[lo,hi]] of Object.entries(HIDDEN_RANGES))s.hidden[key]=edge?hi:lo;
    const before=JSON.stringify(s);
    for(const lang of ['ko','en']){const a=studentLine(s,lang);assert.ok(a);assert.equal(a,studentLine(s,lang));}
    assert.equal(JSON.stringify(s),before);
  }
});
test('name draws stay inside the documented source pool and do not alter abilities',()=>{
  for(const gender of ['male','female','unspecified'])for(let seed=1;seed<300;seed++) {
    const record=generateNameRecord(seed,gender);
    assert.equal(record.name,generateKoreanName(seed,gender));
    assert.equal(record.sourceCohort,1995);
    assert.ok(KOREAN_NAME_POOLS[record.poolGender].some(x=>x.name===record.givenName));
    const s=createState(record.name,seed,{gender}),before=JSON.stringify(s.hidden);
    generateNameRecord(seed,gender);assert.equal(JSON.stringify(s.hidden),before);assert.ok(validateSave(s));
  }
});
