import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {getPhysicsStoryScenes} from '../dist/physics-story.js';
import {openingMeeting} from '../dist/opening-meeting.js';
import {CHAPTERS,THESIS_STEPS,THESIS_SCENES} from '../dist/main-story.js';
import {physicsEndingRecord,physicsEndingPages} from '../dist/physics-ending-record.js';
import {physicsEndingRecord as legacyRecord,physicsEndingPages as legacyPages} from '../dist/physics-ending-viewer.js';
import {getPublicPhysicsEndingScenes} from '../dist/physics-story-viewer.js';
import {getEndingPages} from '../dist/stories.js';
import {researchText} from '../dist/lab-scene.js';

test('the current public page contains only the same ending paragraphs used by the playable game',()=>{
 const record=physicsEndingRecord,context={statistics:record.statistics,recommendation:record.recommendation,fieldId:'050',field:'물리학',labMode:'dry',passageIds:record.passageIds};
 const actualGamePages=getEndingPages('true','ko',record.relationship,record.name,null,record.memories,context).map(text=>researchText(text,{professorProfile:context}));
 const scenes=getPublicPhysicsEndingScenes();
 assert.equal(scenes.length,10);assert.ok(scenes.every(item=>item.phase==='ending'));
 assert.deepEqual(scenes.map(item=>item.paragraphs.join('\n\n')),actualGamePages);
 assert.doesNotMatch(scenes.flatMap(item=>item.paragraphs).join('\n'),/학생의 질문을 듣고, 함께 시도할 작은 다음 단계/);
});

test('the isolated physics reader goes from the first meeting through the complete true ending',()=>{
 const scenes=getPhysicsStoryScenes();
 assert.equal(scenes.length,22);
 assert.deepEqual(scenes.map(s=>s.id),[
  'opening',...Object.keys(CHAPTERS).map(id=>`chapter-${id}`),
  ...THESIS_STEPS.map(id=>`thesis-${id}`),
  ...Array.from({length:10},(_,i)=>`ending-${i+1}`)
 ]);
 assert.equal(new Set(scenes.map(s=>s.id)).size,22);
 assert.deepEqual(scenes[0].paragraphs,Object.values(openingMeeting('이지현')).slice(1));
 assert.equal(scenes[0].paragraphs[0],'이지현 학생은 어떻게 생각해요?');
 assert.equal(scenes.at(-1).paragraphs.at(-1),'“이지현 교수는 어떻게 생각해요?”');
 assert.ok(scenes.every(s=>s.title&&s.time&&s.paragraphs.length&&s.paragraphs.every(p=>typeof p==='string')));
});

test('main chapters and thesis scenes use the original authored prose without gameplay choices',()=>{
 const scenes=getPhysicsStoryScenes();
 for(const [id,chapter] of Object.entries(CHAPTERS)){
  const scene=scenes.find(s=>s.id===`chapter-${id}`);
  assert.equal(scene.title,chapter.title);
  assert.deepEqual(scene.paragraphs,[chapter.body]);
 }
 for(const id of THESIS_STEPS){
  const scene=scenes.find(s=>s.id===`thesis-${id}`);
  assert.equal(scene.title,THESIS_SCENES[id].title);
  assert.deepEqual(scene.paragraphs,[THESIS_SCENES[id].body]);
 }
 assert.ok(scenes.every(s=>!Object.hasOwn(s,'options')&&!Object.hasOwn(s,'choices')));
 assert.deepEqual(scenes.filter(s=>s.phase==='ending').map(s=>s.paragraphs.join('\n\n')),physicsEndingPages());
});

test('extracting the representative record preserves every existing ending paragraph',()=>{
 assert.equal(legacyRecord,physicsEndingRecord);
 assert.deepEqual(legacyPages(),physicsEndingPages());
 // Captured before the pure-data extraction: old unlisted reader must stay intact.
 const digest=createHash('sha256').update(JSON.stringify(legacyPages())).digest('hex');
 assert.equal(digest,'e25fd27cf2b85a915b60f032db4ca580b91e2e32d7f9637b0f95b4f36ecc52d0');
 assert.equal(physicsEndingPages().length,10);
});

test('reading and revisiting scenes cannot mutate the shared representative record',()=>{
 const before=JSON.stringify(physicsEndingRecord),first=getPhysicsStoryScenes();
 assert.throws(()=>{first[0].paragraphs[0]='changed';},TypeError);
 assert.throws(()=>{physicsEndingRecord.statistics.student.rapport=0;},TypeError);
 assert.throws(()=>{physicsEndingRecord.appearance.hair='changed';},TypeError);
 assert.deepEqual(getPhysicsStoryScenes(),first);
 assert.equal(JSON.stringify(physicsEndingRecord),before);
});

test('the source-only story data has no browser, analytics or game-progression dependency',async()=>{
 for(const name of ['physics-story.js','physics-ending-record.js']){
  const source=await readFile(new URL(`../dist/${name}`,import.meta.url),'utf8');
  assert.doesNotMatch(source,/\b(?:localStorage|sessionStorage|indexedDB|fetch|XMLHttpRequest|navigator|document|window)\b/);
  assert.doesNotMatch(source,/from\s*['"][^'"]*(?:engine|app|analytics|save)[^'"]*['"]/);
 }
 const scenes=getPhysicsStoryScenes('en');
 assert.equal(scenes.length,22);
 assert.equal(scenes[0].paragraphs[0],'What do you think, 이지현?');
 assert.equal(scenes.at(-1).paragraphs.at(-1),'“Professor 이지현, what do you think?”');
 assert.match(scenes[0].time,/September/);
 assert.deepEqual(scenes.filter(s=>s.phase==='ending').map(s=>s.paragraphs.join('\n\n')),physicsEndingPages('en'));
});
