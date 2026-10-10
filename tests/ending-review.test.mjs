import test from 'node:test';
import assert from 'node:assert/strict';
import {createState} from '../dist/engine.js';
import {reviewRecord,reviewPages,reviewMeta,reviewCollection} from '../dist/ending-review.js';
import {MAIN_ENDINGS} from '../dist/ending-collection.js';
function sample(ending='corporate',fieldId='090',labMode='dry'){
 const state=createState('김민지',17,{professorProfile:{fieldId,labMode}});state.started=true;state.month=96;state.ending=ending;state.hidden.rapport=70;
 return {endingId:ending,run:0,seed:17,policy:'fixture',state};
}
test('review refuses incomplete game states and records only the ended snapshot',()=>{
 const original=sample(),before=structuredClone(original),record=reviewRecord(original);
 assert.equal(record.name,'김민지');assert.equal(record.fieldId,'090');assert.equal(record.relationship,'close');assert.equal(record.labMode,'dry');assert.ok(!Object.hasOwn(record,'state'));assert.deepEqual(original,before);
 const incomplete=sample();incomplete.state.ending=null;assert.throws(()=>reviewRecord(incomplete),/completed simulation/);
});
test('review uses field-aware Korean ending pages and the distant outside-career title',()=>{
 const dry=reviewRecord(sample()),wet=reviewRecord(sample('corporate','056','wet'));
 assert.notDeepEqual(reviewPages(dry),reviewPages(wet));assert.ok(!/냉동고|배양|\{name\}|□/.test(reviewPages(dry).join('')));
 const distant=sample('unrelated');distant.state.hidden.rapport=-75;const record=reviewRecord(distant);
 assert.equal(reviewMeta(record).title,'연구실 밖의 길');assert.equal(reviewPages(record).length,9);assert.match(reviewPages(record).join(''),/김민지/);
});
test('retirement review derives unlock from observed main endings and excludes video',()=>{
 const records=MAIN_ENDINGS.map(id=>reviewRecord(sample(id))),video=reviewRecord(sample('youtuber'));
 assert.equal(reviewCollection([video]).count,0);assert.equal(reviewCollection(records.slice(0,4)).unlocked,false);assert.equal(reviewCollection(records.slice(0,5)).unlocked,true);
 const complete=reviewCollection([...records,video]);assert.equal(complete.complete,true);assert.equal(complete.count,8);assert.match(complete.pages.at(-1),/모든 주요 후일담/);assert.match(complete.pages.join(''),/카메라/);
});
