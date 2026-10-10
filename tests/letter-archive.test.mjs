import test from 'node:test';
import assert from 'node:assert/strict';
import {createState} from '../dist/engine.js';
import {endingStatistics} from '../dist/statistics.js';
import {getEndingPages,validPassageIds} from '../dist/stories.js';
import {keepGallery} from '../dist/ending-collection.js';
import {LETTER_PASSAGES_KEY,validLetterPassages,prepareLetterPassages,collectSeenPassageIds,migrateLetterGallery,mergeLetterArchives} from '../dist/letter-archive.js';

function fixture(id='old',ending='institute',relationship='close'){
  const state=createState('김유진',123,{professorProfile:{fieldId:'056',labMode:'wet'}});
  state.ending=ending;state.month=96;
  Object.assign(state.hidden,{research:820,learning:810,language:800,teaching:80,industry:80,autonomy:80,social:80,stress:20});
  return {id,ending,relationship,name:state.name,date:'2026-10-10',month:96,fieldId:state.professorProfile.fieldId,labMode:'wet',statistics:endingStatistics(state),memories:[{kind:'event',id:'counsel-results',choice:0,month:42},{kind:'event',id:'counsel-independent',choice:0,month:70}]};
}
function pages(record){return getEndingPages(record.ending,'ko',record.relationship,record.name,record.endingReason,record.memories,{statistics:record.statistics,fieldId:record.fieldId,labMode:record.labMode,passageIds:record.passageIds});}

test('archived passage IDs freeze a letter across later collection and rereading',()=>{
  const input=fixture(),before=structuredClone(input),record=prepareLetterPassages(input);
  assert.ok(record.passageIds.length>0);assert.ok(validPassageIds(record.passageIds));
  assert.deepEqual(input,before);assert.notEqual(record,input);
  const initial=pages(record),seen=collectSeenPassageIds([record]);
  const second=prepareLetterPassages(fixture('second'),seen);
  const reread=prepareLetterPassages(record,collectSeenPassageIds([second],seen));
  assert.deepEqual(reread,record);assert.deepEqual(pages(reread),initial);
  record.statistics.student.research=0;
  assert.equal(input.statistics.student.research,before.statistics.student.research);
});

test('frozen empty IDs remain empty for distant, recovery, withdrawal and comedy letters',()=>{
  for(const input of [fixture('distant','institute','distant'),...['leave','dropout','gameover','unfinished','youtuber'].map(ending=>fixture(ending,ending,'close'))]){
    const record=prepareLetterPassages(input);
    assert.deepEqual(record.passageIds,[]);
    const reread=prepareLetterPassages({...record,relationship:'close'},[]);
    assert.deepEqual(reread.passageIds,[]);
  }
});

test('a legacy dry archive cannot reintroduce a wet equipment recollection on reread',()=>{
  const input={...fixture('legacy-dry','postdoc'),fieldId:'048',labMode:'dry',memories:[{kind:'event',id:'equipment',choice:0,month:20}],passageIds:['memory.equipment.0']},before=structuredClone(input);
  assert.ok(validLetterPassages(input),'the ID is known even though its setting is no longer eligible');
  const record=prepareLetterPassages(input);
  assert.deepEqual(record.passageIds,input.passageIds,'archive identity remains intact while rendering applies the current content contract');
  assert.doesNotMatch(pages(record).join('\n'),/장비가 멈춘 날|공동기기실에서 다시 배운/,'the dry letter excludes a previously selected wet memory');
  assert.deepEqual(input,before);
});

test('legacy letters migrate oldest first without mutating their stored order or values',()=>{
  const oldest=fixture('oldest'),newest=fixture('newest'),input=[newest,oldest],before=structuredClone(input);
  const expectedOld=prepareLetterPassages(oldest),expectedSeen=collectSeenPassageIds([expectedOld]);
  const expectedNew=prepareLetterPassages(newest,expectedSeen),migrated=migrateLetterGallery(input);
  assert.deepEqual(migrated.gallery,[expectedNew,expectedOld]);
  assert.deepEqual(input,before);
  assert.deepEqual(migrated.seenPassageIds,collectSeenPassageIds(migrated.gallery,expectedSeen));
  assert.deepEqual(migrateLetterGallery(migrated.gallery,migrated.seenPassageIds),migrated);
  assert.ok(expectedNew.passageIds.some(id=>!expectedOld.passageIds.includes(id)),'a later letter should prefer an unread eligible passage');
});

test('optional legacy fields are accepted while unknown or malformed passage IDs are rejected',()=>{
  assert.equal(validLetterPassages(fixture()),true);
  assert.equal(validLetterPassages({...fixture(),passageIds:[]}),true);
  const invalid=[null,undefined,'research',['not-a-passage'],['<script>alert(1)</script>'],[1],Array.from({length:1001},()=> 'not-a-passage')];
  const known=prepareLetterPassages(fixture()).passageIds[0];
  invalid.push([known,known]);
  for(const passageIds of invalid){
    const record={...fixture(),passageIds};
    assert.equal(validLetterPassages(record),false);
    assert.throws(()=>prepareLetterPassages(record),TypeError);
    assert.throws(()=>collectSeenPassageIds([record]),TypeError);
  }
  for(const ids of [null,'invalid',['not-a-passage'],[known,known]])assert.throws(()=>migrateLetterGallery([],ids),TypeError);
});

test('cumulative seen IDs survive gallery pruning and a JSON export/import round trip',()=>{
  const oldest=prepareLetterPassages(fixture('oldest'));
  const gallery=[...Array.from({length:40},(_,i)=>({...fixture(`new-${i}`),passageIds:[]})),oldest];
  const seenPassageIds=collectSeenPassageIds(gallery),pruned=keepGallery(gallery);
  assert.equal(pruned.length,40);assert.ok(!pruned.some(record=>record.id==='oldest'));
  assert.deepEqual(collectSeenPassageIds(pruned,seenPassageIds),seenPassageIds);
  const exported=JSON.parse(JSON.stringify({gallery:pruned,seenPassageIds}));
  const imported=mergeLetterArchives([],exported.gallery,[],exported.seenPassageIds);
  assert.deepEqual(imported.gallery,pruned);assert.deepEqual(imported.seenPassageIds,seenPassageIds);
  assert.equal(LETTER_PASSAGES_KEY,'pm-letter-passages-v1');
});

test('import merges discoveries without replacing an existing frozen copy or altering inputs',()=>{
  const existing=prepareLetterPassages(fixture('duplicate'));
  const incoming=prepareLetterPassages(fixture('duplicate'),existing.passageIds);
  const current=[existing],imported=[incoming,fixture('legacy-import')],before=structuredClone({current,imported});
  const result=mergeLetterArchives(current,imported,existing.passageIds,incoming.passageIds);
  assert.equal(result.gallery.filter(record=>record.id==='duplicate').length,1);
  assert.deepEqual(result.gallery[0],existing);
  for(const id of [...existing.passageIds,...incoming.passageIds])assert.ok(result.seenPassageIds.includes(id));
  assert.ok(Array.isArray(result.gallery[1].passageIds));
  assert.deepEqual({current,imported},before);
  assert.throws(()=>mergeLetterArchives(current,imported,[],['unknown']),TypeError);
});

test('passage preparation is deterministic and leaves simulation RNG and state untouched',()=>{
  const state=createState('학생',9876);state.ending='institute';
  const before=JSON.stringify(state),record={...fixture(),statistics:endingStatistics(state)};
  const a=prepareLetterPassages(record),b=prepareLetterPassages(record);
  assert.deepEqual(a,b);assert.equal(JSON.stringify(state),before);
});
