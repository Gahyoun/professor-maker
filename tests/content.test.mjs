import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DIALOGUES,studentLine} from '../dist/dialogue.js';
import {ENDINGS,getEndingPages,endingRelationship,endingLetterInsertions,endingLetterAnchor} from '../dist/stories.js';
import {EVENTS,createState,HIDDEN_RANGES,validateSave,decide} from '../dist/engine.js';
import {generateKoreanName,generateNameRecord,KOREAN_NAME_POOLS} from '../dist/names.js';
import {endingStatistics} from '../dist/statistics.js';
import {reviewRecord,reviewPages} from '../dist/ending-review.js';
import {adaptResearchText} from '../dist/ending-context.js';
import {formatStudentName} from '../dist/korean.js';
import {letterClosing} from '../dist/ending-voice.js';

const richLetterHistory=['counsel-daily-life','counsel-results','counsel-independent','counsel-feedback','authorship','best-paper','data-loss','doctoral-lead'].map((id,month)=>({kind:'event',id,choice:0,month}));
function letterContext(id='true'){
  const state=createState('김민지',17,{fieldId:'056',labMode:'wet'});state.ending=id;state.month=96;
  const statistics=endingStatistics(state);statistics.temperament={caution:90,curiosity:90,expression:90};
  for(const key of ['learning','research','language','teaching','industry','social','autonomy']){const [lo,hi]=HIDDEN_RANGES[key];statistics.student[key]=lo+.9*(hi-lo);}
  return {statistics,fieldId:'056',labMode:'wet'};
}
const occurrences=(text,needle)=>text.split(needle).length-1;
const NO_AUTOMATIC_LETTER_ENDINGS=new Set(['leave','dropout','gameover','unfinished','youtuber','dismissed']);
const insertionLimit=(id,relationship)=>NO_AUTOMATIC_LETTER_ENDINGS.has(id)?0:({close:2,reserved:1,distant:0})[relationship];

test('content covers the engine outcomes and both fields of each original letter',()=>{
  for(const id of ['true','institute','corporate','unrelated','startup','unemployed','youtuber','resident_researcher','leave','bachelor','masters','dropout','unfinished','gameover','external_masters','external_phd']) {
    const story=ENDINGS[id];assert.ok(story,`Missing epilogue: ${id}`);
    for(const field of [story.title,story.career,story.time,...story.pages])for(const lang of ['ko','en'])assert.ok(typeof field[lang]==='string'&&field[lang].trim());
  }
  assert.equal(new Set(EVENTS.map(e=>e.id)).size,EVENTS.length);
  for(const e of EVENTS){assert.ok(e.options.length>=2&&e.options.length<=4);for(const lang of ['ko','en']){assert.ok(e.title[lang]&&e.body[lang]);for(const o of e.options)assert.ok(o.label[lang]);}}
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

test('combined memory and ability insertions obey the relationship budget and fixed comedy tone',()=>{
  for(const id of Object.keys(ENDINGS))for(const relationship of ['close','reserved','distant'])for(const locale of ['ko','en']){
    const context=letterContext(id),before=JSON.stringify({context,history:richLetterHistory});
    const notes=endingLetterInsertions(id,relationship,richLetterHistory,context,locale),limit=insertionLimit(id,relationship);
    assert.ok(notes.length<=limit,`${id}/${relationship}/${locale}: ${notes.length} > ${limit}`);
    assert.equal(new Set(notes.map(note=>note.id)).size,notes.length);
    for(const note of notes){assert.ok(typeof note.id==='string'&&note.id);assert.ok(typeof note.text==='string'&&note.text);assert.ok(Array.isArray(note.tags));}
    assert.deepEqual(notes,endingLetterInsertions(id,relationship,richLetterHistory,context,locale));
    assert.equal(JSON.stringify({context,history:richLetterHistory}),before,'selection cannot change the run or event record');
    if(id==='youtuber'&&relationship==='reserved'&&locale==='ko'){
      const comedy=getEndingPages(id,locale,relationship,'김민지',null,richLetterHistory,context).join('\n');
      assert.match(comedy,/검토란을 세 칸/);assert.match(comedy,/6번 “응”은 편집으로 살릴 수 없습니다/,'the authored closing keeps its punchline');
    }
  }
});

test('letter insertions appear once immediately before the request, never after the closing or signature',()=>{
  for(const id of ['true','postdoc','institute','corporate','startup','unemployed','resident_researcher','bachelor','masters','external_masters','external_phd','leave','dropout','unfinished','gameover'])for(const relationship of ['close','reserved'])for(const locale of ['ko','en']){
    const context=letterContext(id),notes=endingLetterInsertions(id,relationship,richLetterHistory,context,locale);
    if(!notes.length)continue;
    const anchor=endingLetterAnchor(id,locale);assert.ok(anchor,`${id} needs an explicit insertion anchor`);
    const text=getEndingPages(id,locale,relationship,'김민지',null,richLetterHistory,context).join('\n\n');
    const renderedAnchor=formatStudentName(adaptResearchText(anchor,context,locale),'김민지',locale),at=text.indexOf(renderedAnchor);
    assert.ok(at>=0,`${id}/${relationship}/${locale}: request anchor is present`);
    const renderedNotes=notes.map(note=>formatStudentName(adaptResearchText(note.text,context,locale),'김민지',locale));
    for(const note of renderedNotes){assert.equal(occurrences(text,note),1,`${id}/${relationship}/${locale}: selected note rendered once`);assert.ok(text.indexOf(note)<at,`${id}/${relationship}/${locale}: note precedes request`);}
    assert.ok(text.slice(0,at).trimEnd().endsWith(renderedNotes.at(-1)),`${id}/${relationship}/${locale}: no core news or closing splits the insertion block from the request`);
    const signature=text.indexOf(locale==='en'?'— 김민지':'― 김민지');assert.ok(signature>at,`${id}/${relationship}/${locale}: request precedes signature`);
    const closing=letterClosing(id,relationship,context,locale),closingAt=closing?text.indexOf(closing):-1;
    if(closingAt>=0)assert.ok(renderedNotes.every(note=>text.indexOf(note)<closingAt),`${id}/${relationship}/${locale}: automatic prose stays before the closing`);
  }
});

test('advanced research letters exclude newcomer and recovery passages even under high stress',()=>{
  for(const id of ['true','postdoc','institute'])for(const relationship of ['close','reserved']){
    const context=letterContext(id);context.statistics.student.stress=90;context.statistics.student.stamina=1;context.statistics.temperament={caution:30,curiosity:30,expression:30};
    const notes=endingLetterInsertions(id,relationship,richLetterHistory,context);
    assert.ok(notes.every(note=>!note.tags.some(tag=>['newcomer','recovery'].includes(tag))),`${id}: career-appropriate insertion tags`);
    const text=getEndingPages(id,'ko',relationship,'김민지',null,richLetterHistory,context).join('\n');
    assert.doesNotMatch(text,/새 일을 배우면서 기초부터 다시|제 속도에 맞는 생활과 일하는 방식을/);
    assert.ok(occurrences(text,'기억합니다')<=1,`${id}: at most one repeated memory predicate`);
  }
});

test('leave and degree-ending letters omit automated achievements even with legacy selections',()=>{
  const eligible=endingLetterInsertions('institute','close',richLetterHistory,letterContext('institute'));
  assert.ok(eligible.length>0,'the fixture includes passages that an older archive could have selected');
  for(const id of ['leave','dropout','gameover','unfinished','youtuber'])for(const relationship of ['close','reserved','distant'])for(const locale of ['ko','en']){
    const context={...letterContext(id),passageIds:eligible.map(note=>note.id)},before=structuredClone(context);
    assert.deepEqual(endingLetterInsertions(id,relationship,richLetterHistory,context,locale),[],`${id}: fixed tone takes precedence over a legacy passage selection`);
    const text=getEndingPages(id,locale,relationship,'김민지',null,richLetterHistory,context).join('\n');
    for(const note of eligible)assert.ok(!text.includes(formatStudentName(note.text,'김민지',locale)),`${id}: automatic achievement is not rendered`);
    assert.deepEqual(context,before,'rereading a legacy record cannot rewrite its saved IDs');
  }
});

test('degree-ending variants retain their own next step with no automatic achievement passages',()=>{
  const variants=[
    {reason:'graduation_requirements',slot:'graduation_requirements',quals:[]},
    {reason:'time_limit',slot:'time_limit',quals:[]},
    {reason:'qual_failure',slot:'qual_failure',quals:[{kind:'qual',passed:false,month:48},{kind:'qual',passed:false,month:60}]},
    {reason:'qual_failure',slot:'qual_withdrawal',quals:[{kind:'qual',passed:false,month:48}]},
    {reason:'qual_failure',slot:'qual_withdrawal',quals:[]},
  ];
  for(const variant of variants)for(const relationship of ['close','reserved'])for(const locale of ['ko','en']){
    const context=letterContext('gameover'),history=[...richLetterHistory,...variant.quals],notes=endingLetterInsertions('gameover',relationship,history,context,locale);
    assert.deepEqual(notes,[],'academic endings keep their authored account without automatic achievements');
    const text=getEndingPages('gameover',locale,relationship,'김민지',variant.reason,history,context).join('\n\n');
    const anchor=endingLetterAnchor('gameover',locale,variant.slot);assert.ok(anchor,`${variant.slot} supplies its own slot`);
    const at=text.indexOf(formatStudentName(adaptResearchText(anchor,context,locale),'김민지',locale)),signature=text.indexOf(locale==='en'?'— 김민지':'― 김민지');
    assert.ok(at>=0&&at<signature,`${variant.slot}/${relationship}/${locale}: a next step precedes the signature`);
    assert.match(text,locale==='ko'?/서류|연구 기록|학위|박사과정/:/documents|research|degree|doctorate/i,`${variant.slot}: the reason-specific account remains substantive`);
  }
});

test('unseen passage IDs take priority while archived selections survive later collections and locale switches',()=>{
  const context=letterContext('corporate'),before=JSON.stringify(context);
  const first=endingLetterInsertions('corporate','close',richLetterHistory,context);
  assert.equal(first.length,2,'a rich close letter can use its full budget');
  const seenPassageIds=first.map(note=>note.id),next=endingLetterInsertions('corporate','close',richLetterHistory,{...context,seenPassageIds});
  assert.equal(next.length,2);assert.ok(next.every(note=>!seenPassageIds.includes(note.id)),'available unseen memories and voice variants precede repeats');
  const passageIds=first.map(note=>note.id),laterSeen=[...seenPassageIds,...next.map(note=>note.id)];
  for(const locale of ['ko','en']){
    const archived=endingLetterInsertions('corporate','close',richLetterHistory,{...context,passageIds,seenPassageIds:laterSeen},locale);
    assert.deepEqual(archived.map(note=>note.id),passageIds,'replay keeps the chosen IDs');
    if(locale==='en')assert.doesNotMatch(archived.map(note=>note.text).join('\n'),/[가-힣]/);
  }
  assert.equal(JSON.stringify(context),before);
});

test('all 29 actual ending samples respect insertion limits and avoid repeated predicates and handover wrappers',()=>{
  const audit=JSON.parse(readFileSync(new URL('../docs/ending-audit-samples.json',import.meta.url),'utf8'));
  assert.ok(audit.samples.length>=29,'the review covers the full observed sample set');
  for(const sample of audit.samples){
    const record=reviewRecord(sample),context={statistics:record.statistics,recommendation:record.evidence?.recommendation,fieldId:record.fieldId,field:record.field,labMode:record.labMode};
    const notes=endingLetterInsertions(record.ending,record.relationship,record.memories,context),limit=insertionLimit(record.ending,record.relationship);
    assert.ok(notes.length<=limit,`${record.ending}/${record.name}: insertion budget`);
    const text=reviewPages(record).join('\n');assert.ok(occurrences(text,'기억합니다')<=1,`${record.ending}/${record.name}: memory predicate cap`);
    assert.doesNotMatch(text,/인계 기록에는|바다 건너 타지에서 새로운 환경에서/,`${record.ending}/${record.name}`);
    if(record.ending==='youtuber')assert.doesNotMatch(text,/원자료부터 확인했던 시간을|생활 시간을 함께 확인하며|제 질문으로 시작한 작은 검증/,'fixed comedy contains no serious automated memories');
  }
});

test('all observed letters end each paragraph completely and make at most one next-meeting promise',()=>{
  const audit=JSON.parse(readFileSync(new URL('../docs/ending-audit-samples.json',import.meta.url),'utf8'));
  const published=JSON.parse(readFileSync(new URL('../dist/ending-review-data.json',import.meta.url),'utf8')).records;
  assert.equal(published.length,audit.samples.length,'the published viewer retains the complete sample set');
  for(const [source,records] of [['fresh',audit.samples.map(reviewRecord)],['archived',published]])for(const record of records){
    const pages=reviewPages(record),signed=pages.filter(page=>page.includes(`― ${record.name}`));
    for(const page of signed){
      const body=page.slice(0,page.indexOf(`― ${record.name}`)).trim();
      assert.doesNotMatch(body,/교수님도\s*(?:\n\n|$)/,`${source}/${record.ending}/${record.name}: a replaced closing cannot leave its subject behind`);
      for(const paragraph of body.split(/\n\n+/)){
        const text=paragraph.trim();if(/^(?:지도)?교수님께\.$/.test(text))continue;
        assert.match(text,/[다요]\.$|[?？]$/,`${source}/${record.ending}/${record.name}: complete final sentence in ${text.slice(-80)}`);
      }
    }
    const joined=pages.join('\n\n'),greeting=joined.indexOf('교수님께.'),signature=joined.indexOf(`― ${record.name}`);
    const body=greeting>=0&&signature>greeting?joined.slice(greeting,signature):'';
    const nextMeetingStarts=body.match(/(?:^|[.!?]\s+|\n)다음에(?:는|\s)/g)||[];
    assert.ok(nextMeetingStarts.length<=1,`${source}/${record.ending}/${record.name}: no repeated next-meeting closing`);
  }
});

test('short letter closings preserve whole sentences and do not repeat a return decision',()=>{
  for(const relationship of ['close','reserved','distant']){
    const bachelor=getEndingPages('bachelor','ko',relationship,'정지혜',null,richLetterHistory,letterContext('bachelor')).find(page=>page.includes('― 정지혜'));
    assert.match(bachelor,/다른 길에서 잘 지내고 있습니다\./);
    assert.doesNotMatch(bachelor,/교수님도\s*(?:\n\n|―)/);
    assert.match(bachelor.split('― 정지혜')[0].trim(),/[다요]\.$|[?？]$/);
    const leave=getEndingPages('leave','ko',relationship,'김민지',null,richLetterHistory,letterContext('leave')).find(page=>page.includes('― 김민지'));
    assert.match(leave,/돌아갈지는 아직 정하지 못했습니다\./);
    assert.ok(!/정하게 되면 먼저 말씀드리겠습니다/.test(leave)||!/복학 여부는 제가 정리한 뒤 먼저 연락드리겠습니다/.test(leave),'the core promise and the closing cannot make the same return notification twice');
    assert.doesNotMatch(leave,/회의를 제가 진행하기 시작했을 때부터/,'leave does not receive career-achievement memories');
    const postdoc=getEndingPages('postdoc','ko',relationship,'박은지',null,richLetterHistory,letterContext('postdoc')).find(page=>page.includes('― 박은지'));
    assert.ok((postdoc.match(/(?:^|[.!?]\s+|\n)다음에(?:는|\s)/g)||[]).length<=1,'a final promise needs no second next-time closing');
  }
});

test('wet memories remain available in wet labs and never enter dry field letters, including old frozen IDs',()=>{
  const wetEvents=[...Array.from({length:4},(_,choice)=>({kind:'event',id:'equipment',choice,month:20})),{kind:'event',id:'funding-cut',choice:1,month:21},{kind:'event',id:'undergrad-record',choice:1,month:2}];
  for(const event of wetEvents){
    const wet=letterContext('bachelor'),eligible=endingLetterInsertions('bachelor','close',[event],wet);
    assert.ok(eligible.some(note=>note.id===`memory.${event.id}.${event.choice}`),`${event.id}/${event.choice}: genuinely experienced wet events remain eligible`);
    for(const fieldId of ['048','072','090'])for(const id of ['bachelor','corporate','postdoc','resident_researcher'])for(const locale of ['ko','en']){
      const dry={...letterContext(id),fieldId,labMode:'dry'},frozen={...dry,passageIds:[`memory.${event.id}.${event.choice}`]};
      for(const ctx of [dry,frozen]){
        const notes=endingLetterInsertions(id,'close',[event],ctx,locale);
        assert.ok(!notes.some(note=>note.id===`memory.${event.id}.${event.choice}`),`${fieldId}/${id}/${locale}: a wet-only recollection is excluded`);
        const memories=notes.filter(note=>note.group==='memory').map(note=>note.text).join('\n');
        assert.doesNotMatch(memories,locale==='ko'?/장비|시료|배양/:/equipment|specimen|cultivat/i,`${fieldId}/${id}: dry memories keep an appropriate setting`);
      }
    }
  }
});

test('resident research staff can study new methods without an automatic newcomer identity',()=>{
  const context=letterContext('resident_researcher');context.statistics.temperament={caution:30,curiosity:30,expression:30};
  const [lo,hi]=HIDDEN_RANGES.learning;context.statistics.student.learning=lo+.99*(hi-lo);
  const legacy={...context,passageIds:['voice.learning.foundations.v1']};
  assert.deepEqual(endingLetterInsertions('resident_researcher','close',[],legacy),[],'an archived newcomer sentence is no longer eligible for an established researcher');
  const notes=endingLetterInsertions('resident_researcher','close',[],context);
  assert.ok(notes.every(note=>!note.tags.includes('newcomer')),'resident letters exclude newcomer candidates');
  const text=getEndingPages('resident_researcher','ko','close','최재현',null,[],legacy).join('\n');
  assert.match(text,/회의는 제가 맡아 진행하겠습니다/);
  assert.doesNotMatch(text,/새 일을 배우면서 기초부터 다시|새 일의 하루가 어떤지|익숙하지 않은 일은 작은 단계/);
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
