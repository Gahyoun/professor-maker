import test from 'node:test';
import assert from 'node:assert/strict';
import {DIALOGUES,studentLine} from '../dist/dialogue.js';
import {ENDINGS,getEndingPages,endingRelationship} from '../dist/stories.js';
import {EVENTS,createState,HIDDEN_RANGES,validateSave,decide} from '../dist/engine.js';
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

test('every epilogue changes the letter distance without mutating the source',()=>{
  const before=JSON.stringify(ENDINGS);
  for(const id of Object.keys(ENDINGS))for(const lang of ['ko','en']) {
    const versions=['close','reserved','distant'].map(r=>getEndingPages(id,lang,r,'이유진'));
    assert.equal(new Set(versions.map(p=>JSON.stringify(p))).size,3,`${id}/${lang} needs three different letters`);
    for(const pages of versions){assert.equal(pages.length,ENDINGS[id].pages.length);assert.ok(pages.every(p=>typeof p==='string'&&p.length>0));assert.ok(!pages.join('').includes('{name}'));assert.ok(pages.join('').includes('이유진'));}
  }
  assert.equal(JSON.stringify(ENDINGS),before);
  assert.equal(endingRelationship(40),'close');assert.equal(endingRelationship(-30),'distant');assert.equal(endingRelationship(0),'reserved');
  assert.deepEqual(getEndingPages('not-an-ending'),[]);
  assert.ok(getEndingPages('true','ko','close','$&').join('').includes('$&'));
});

test('provided true and company stories retain their central scenes',()=>{
  for(const distance of ['close','reserved','distant']) {
    const happy=getEndingPages('true','ko',distance,'김지훈').join('\n');
    for(const scene of ['추천서','오래된 기계','Acknowledgements','좋은 소식','김지훈 교수'])assert.ok(happy.includes(scene));
    const company=getEndingPages('corporate','ko',distance,'김지훈').join('\n');
    for(const scene of ['결재가 3번','냉동고','라벨','김지훈'])assert.ok(company.includes(scene));
    assert.match(company,/논문[^\n]*인용/);
  }
  const normal=getEndingPages('corporate','ko','reserved').join('\n');
  assert.ok(normal.includes('커피는 정말로 한 잔뿐이었다'));assert.ok(normal.includes('사이와는 별개로'));
});

test('degree failures explain the unmet requirement separately from lab closure',()=>{
  const operation=getEndingPages('gameover','ko','reserved','학생').join('\n');
  assert.ok(operation.includes('행정과 면담'));
  for(const reason of ['graduation_requirements','time_limit','qual_failure']) {
    const pages=getEndingPages('gameover','ko','reserved','학생',reason);
    assert.notDeepEqual(pages,getEndingPages('gameover','ko','reserved','학생'));
    assert.ok(pages.join('').includes('학생'));
  }
  assert.ok(getEndingPages('gameover','ko','reserved','학생','graduation_requirements').join('').includes('필요한 연구와 학술발표'));
  assert.ok(getEndingPages('gameover','ko','reserved','학생','qual_failure').join('').includes('자격시험'));
});

test('optional gender-specific counseling is explicit and general support remains available',()=>{
  for(const id of ['family-career-consultation','women-stem-consultation']) {
    const event=EVENTS.find(e=>e.id===id);assert.ok(event);
    assert.ok([event.requires].flat().includes('female_pair'));
    assert.ok(event.options[1].label.ko.includes('연구')||event.options[1].label.ko.includes('상담'));
  }
  const support=EVENTS.find(e=>e.id==='support-without-assumptions');assert.equal(support.requires,'stress');
  assert.equal(EVENTS.find(e=>e.id==='new-pi-mistake').requires,'young_professor');
});

test('the engine rejects same-gender empathy events for other pairings and locales',()=>{
  for(const id of ['family-career-consultation','women-stem-consultation']) {
    for(const professorGender of ['female','male','other'])for(const gender of ['female','male','unspecified'])for(const locale of ['ko','en']) {
      const state=createState('학생',45,{gender,professorGender,locale});state.month=36;state.route='integrated';state.pending={kind:'event',id};
      const eligible=professorGender==='female'&&gender==='female'&&locale==='ko';
      assert.equal(validateSave(state),eligible,`${id}/${professorGender}/${gender}/${locale}`);
      if(eligible){const declined=decide(state,1);assert.ok(validateSave(declined));assert.equal(declined.history.at(-1).choice,1);}
      else assert.throws(()=>decide(state,0));
    }
  }
  for(const professorGender of ['female','male','other']) {
    const state=createState('학생',45,{gender:'female',professorGender});state.month=12;state.hidden.stress=60;state.pending={kind:'event',id:'support-without-assumptions'};
    assert.ok(validateSave(state));assert.ok(validateSave(decide(state,0)));
  }
});

test('initial contact can reflect differing tendencies without showing scores',()=>{
  let changed=0;
  for(let seed=1;seed<100;seed++) {
    const quiet=createState('학생',seed);quiet.hidden.social=-90;quiet.hidden.creativity=-80;quiet.temperament={curiosity:20,caution:90,expression:10};
    const outgoing=structuredClone(quiet);outgoing.hidden.social=90;outgoing.hidden.creativity=90;outgoing.temperament={curiosity:90,caution:10,expression:90};
    if(studentLine(quiet)!==studentLine(outgoing))changed++;
    assert.ok(!/\b(?:999|100|90)\b/.test(studentLine(quiet)));
  }
  assert.ok(changed>40,'different initial spectra should affect contact dialogue');
});
