import test from 'node:test';
import assert from 'node:assert/strict';
import {studentAppearance} from '../dist/appearance.js';
import {renderStudentPortrait,STUDENT_MONITOR_LAYERS} from '../dist/student-pixel-art.js';
const part=(svg,id)=>svg.match(new RegExp(`<g data-avatar-part="${id}">([\\s\\S]*?)<\\/g>`))?.[1]??'';
const pixels=markup=>[...markup.matchAll(/<rect x="(\d+)" y="(\d+)" width="(\d+)" height="1" fill="([^"]+)"\/>/g)].map(([,x,y,w,fill])=>({x:Number(x),y:Number(y),w:Number(w),fill}));

test('rear seated avatars paint far arm, body, back hair, face and near arm in physical order',()=>{
 for(const [hairLength,curly,glasses]of [[0,false,false],[1,false,false],[2,true,true],[3,false,true],[4,false,false],[5,true,false],[6,false,true]]){
  const a={...studentAppearance(23,'female'),hairLength,curly,glasses,outfit:2},saved=structuredClone(a);
  const svg=renderStudentPortrait(a,'학생','neutral','seated','monitor');
  assert.deepEqual(a,saved);assert.equal(svg,renderStudentPortrait(a,'학생','neutral','seated','monitor'));
  const positions=STUDENT_MONITOR_LAYERS.map(id=>svg.indexOf(`data-avatar-part="${id}"`));
  assert.ok(positions.every((p,i)=>p>=0&&(!i||p>positions[i-1])));
  assert.ok(pixels(part(svg,'far-arm')).length>0);assert.ok(pixels(part(svg,'near-arm')).length>0);
  assert.match(svg,/viewBox="0 0 320 496"/);assert.match(svg,/data-body-proportion="3.5"/);
  for(const p of pixels(svg))assert.ok(p.x>=0&&p.x+p.w<=160&&p.y>=0&&p.y<236,'each dot stays on the integer raster frame');
 }
});

test('long rear hair covers the back and follows saved length without becoming a front cheek stripe',()=>{
 const a={...studentAppearance(13,'female'),fringe:2,curly:false,glasses:false};
 const buzz=renderStudentPortrait({...a,hairLength:0},'학생','neutral','seated','monitor');
 assert.equal(pixels(part(buzz,'back-hair')).length,0,'training/buzz hair must not acquire a hanging tail');
 const short=pixels(part(renderStudentPortrait({...a,hairLength:2},'학생','neutral','seated','monitor'),'back-hair'));
 const long=pixels(part(renderStudentPortrait({...a,hairLength:6},'학생','neutral','seated','monitor'),'back-hair'));
 assert.ok(Math.max(...long.map(p=>p.y))>Math.max(...short.map(p=>p.y))+30);
 assert.ok(Math.max(...long.map(p=>p.y))<=165,'waist-length rear hair ends near the seated hip, not the floor');
 assert.ok(long.some(p=>p.y>=110&&p.x<=75&&p.x+p.w>=80),'the long hair has a visible central back surface');
});

test('profile fringe variants keep the open eye and spectacle lens visible',()=>{
 const a={...studentAppearance(23,'female'),glasses:true};
 for(const hairLength of [1,2,3,4,5,6])for(const curly of [false,true])for(const hairStyle of ['loose','ponytail','braided-bun']){
  const labMode=hairStyle==='loose'?'dry':'wet';
  const brightEyeCount=fringe=>pixels(part(renderStudentPortrait({...a,hairLength,curly,labMode,hairStyle,fringe},'학생','neutral','seated','monitor'),'face-fringe')).filter(p=>p.fill==='#fff8ec').reduce((n,p)=>n+p.w,0);
  const baseline=brightEyeCount(0);assert.ok(baseline>0);
  for(let fringe=1;fringe<16;fringe++)assert.equal(brightEyeCount(fringe),baseline,'fringe cannot overwrite the eye highlight');
 }
});

test('a bob ends at the jaw and nape rather than hanging over the seated back',()=>{
 const a={...studentAppearance(13,'female'),hairLength:4,fringe:2,glasses:true};
 for(const curly of [false,true]){
  const bob={...a,curly},saved=structuredClone(bob);
  const svg=renderStudentPortrait(bob,'학생','neutral','seated','monitor'),hair=pixels(part(svg,'back-hair'));
  assert.deepEqual(bob,saved);
  const hemRows=new Map;for(const p of hair.filter(p=>p.y>=88))hemRows.set(p.y,(hemRows.get(p.y)??0)+p.w);
  assert.ok([...hemRows.values()].some(width=>width>=12),'the hem forms a broad volume behind the jaw');
  assert.ok(Math.max(...hair.map(p=>p.y))<=100,'the bob ends near the neck and never becomes a shoulder-length curtain');
  for(const pose of ['standing','seated','experiment','lecturing']){
   assert.equal(renderStudentPortrait({...bob,labMode:'wet'},'학생','neutral',pose),renderStudentPortrait({...bob,labMode:'dry'},'학생','neutral',pose),'a bob does not acquire the long-hair tie rule');
  }
 }
});
