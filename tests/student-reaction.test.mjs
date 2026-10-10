import test from 'node:test';
import assert from 'node:assert/strict';
import {createState} from '../dist/engine.js';
import {studentEmotion,EXPRESSIONS} from '../dist/student-reaction.js';
import {renderPortrait,studentAppearance} from '../dist/appearance.js';
import {roomScene} from '../dist/lab-scene.js';
test('weekly expression follows outcome, including partial failure and unsuccessful study',()=>{
 const s=createState('',6);for(const [rate,emotion]of [[0,'sad'],[.2,'worried'],[.4,'focused'],[.7,'happy'],[.9,'delighted'],[1,'delighted']])assert.equal(studentEmotion(s,{actual:'coursework',successRate:rate}),emotion);
 assert.equal(studentEmotion(s,{actual:'conference',outcome:'presentation_failed',successRate:1}),'sad');assert.equal(studentEmotion(s,{actual:'study',performed:false}),'sad');assert.equal(studentEmotion(s,{actual:'rest'}),'relieved');assert.equal(studentEmotion(s,{actual:'travel'}),'happy');assert.equal(studentEmotion(s,{actual:'conference',outcome:'presented'}),'delighted');
 s.hidden.stress=80;assert.equal(studentEmotion(s,{actual:'idle'},{idle:true}),'tired');s.pending={kind:'monthly-issue',id:'grant-selected'};assert.equal(studentEmotion(s,{actual:'idle'},{idle:true}),'surprised');s.pending={kind:'monthly-issue',id:'grant-rejected'};assert.equal(studentEmotion(s,{actual:'idle'},{idle:true}),'sad');s.pending={kind:'thesis'};assert.equal(studentEmotion(s,{actual:'idle'},{idle:true}),'worried');
});
test('nine accessible faces stay distinct and safely normalize unrecognized values',()=>{
 const a=studentAppearance(6,'female'),faces=new Set();for(const emotion of Object.keys(EXPRESSIONS)){const p=renderPortrait(a,'<student>',emotion);assert.match(p,new RegExp(`data-expression="${emotion}"`));assert.ok(p.includes(EXPRESSIONS[emotion]));assert.ok(!p.includes('<student>'));faces.add(p);}assert.equal(faces.size,9);
 assert.equal(renderPortrait(a,'학생','" onload="alert(1)'),renderPortrait(a,'학생','neutral'));
});
test('stars are behind the head in both projections; rendering does not change gameplay state',()=>{
 for(const labMode of ['wet','dry']){const s=createState('',6,{labMode}),before=JSON.stringify(s);for(const actual of ['experiment','conference','rest','travel']){const scene=roomScene(s,{actual,successRate:.99},2);assert.match(scene,/reaction-delighted/);assert.ok(scene.indexOf('class="student-reaction ')<scene.indexOf('class="portrait'));assert.match(scene,/variation-2/);assert.ok(!scene.includes('pixel-spark'));}const failed=roomScene(s,{actual:'coursework',successRate:0});assert.match(failed,/anime-gloom/);assert.match(failed,/expression-tear/);assert.equal(JSON.stringify(s),before);}
});
