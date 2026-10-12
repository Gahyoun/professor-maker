import test from 'node:test';
import assert from 'node:assert/strict';
import {studentAppearance} from '../dist/appearance.js';
import {renderStudentPortrait,renderStudentHairDrape,STUDENT_MONITOR_LAYERS} from '../dist/student-pixel-art.js';

const base={...studentAppearance(25,'female'),hairLength:6,curly:false,glasses:true,labMode:'dry',hairStyle:'loose',locale:'en',hairPaletteKey:'naturalBlack',hair:'#292624',naturalHair:'#292624',hairTexture:'straight',twoTone:false,bleached:false,cosmeticHairStyle:'regular'};
const poses=[['standing','front'],['seated','monitor'],['lecturing','front'],['experiment','front'],['seated','front']];
const rects=svg=>[...svg.matchAll(/<rect x="(\d+)" y="(\d+)" width="(\d+)" height="1" fill="([^"]+)"\/>/g)].map(([,x,y,w,fill])=>({x:+x,y:+y,w:+w,fill}));
const part=(svg,id)=>svg.match(new RegExp(`<g data-avatar-part="${id}">([\\s\\S]*?)<\\/g>`))?.[1]??'';
const pixels=svg=>{const result=new Map();for(const {x,y,w,fill}of rects(svg))for(let offset=0;offset<w;offset++)result.set(`${x+offset},${y}`,fill);return result;};
const mix=(a,b,t)=>'#'+a.slice(1).match(/../g).map((v,i)=>Math.round(parseInt(v,16)*(1-t)+parseInt(b.slice(1+i*2,3+i*2),16)*t).toString(16).padStart(2,'0')).join('');

test('peekaboo hair uses the existing hair mask and leaves skin, eyes and both keyboard arms intact',()=>{
 const hair=mix(base.hair,'#766058',.14),edge=mix(hair,'#20202b',.58);
 const hairColors=[hair,mix(base.hair,'#19202d',.22),mix(hair,'#b4a09a',.18),mix(hair,'#cfb7a9',.35)];
 const permitted=new Set([...hairColors,...hairColors.map(color=>mix(color,edge,.65))]);
 for(const [pose,facing]of poses){
  const plain=renderStudentPortrait(base,'Student','neutral',pose,facing),dyed=renderStudentPortrait({...base,twoTone:true,hairAccent:'#ba8697'},'Student','neutral',pose,facing);
  assert.match(dyed,/data-two-tone="true"/);assert.match(dyed,/fill="#ba8697"/);
  const before=pixels(plain),after=pixels(dyed);assert.equal(before.size,after.size);
  let changes=0;for(const [point,color]of after)if(before.get(point)!==color){changes++;assert.ok(permitted.has(before.get(point)),`${pose}/${facing}: pigment changed a non-hair pixel at ${point}`);}
  assert.ok(changes>0);
  if(facing==='monitor')for(const id of ['far-arm','body','near-arm'])assert.equal(part(dyed,id),part(plain,id));
 }
 assert.doesNotMatch(renderStudentPortrait({...base,twoTone:true,hairAccent:'red'},'Student'),/data-two-tone/);
});

test('bleached pigment preserves the exact natural eye and skin pixels across every pose',()=>{
 const skin=mix(base.skin,'#fff0df',.25),skinD=mix(skin,'#b77968',.24),skinH=mix(skin,'#fff7e8',.4),iris=mix(base.naturalHair,'#405778',.55);
 const facialColors=new Set([skin,skinD,skinH,iris,'#303044','#514658','#fff0e3','#fff8ec']);
 for(const [pose,facing]of poses){
  const plain=pixels(renderStudentPortrait(base,'Student','neutral',pose,facing));
  const bleached=renderStudentPortrait({...base,hair:'#d8ceb1',bleached:true},'Student','neutral',pose,facing),dyed=pixels(bleached);
  assert.match(bleached,/data-bleached="true"/);
  for(const [point,color]of plain)if(facialColors.has(color))assert.equal(dyed.get(point),color,`${pose}/${facing}: facial color changed at ${point}`);
 }
});

test('a bald scalp is distinct from military stubble, with a small white highlight confined to the skull',()=>{
 for(const [pose,facing]of poses){
  const a={...base,hairLength:0,cosmeticHairStyle:'bald',twoTone:true,hairAccent:'#ba8697',bleached:true};
  const bald=renderStudentPortrait(a,'Student','neutral',pose,facing),buzz=renderStudentPortrait({...a,cosmeticHairStyle:'regular',twoTone:false,bleached:false},'Student','neutral',pose,facing);
  assert.match(bald,/data-hair-style="bald"/);assert.match(bald,/Bald scalp/);
  assert.doesNotMatch(bald,/data-two-tone|data-bleached|Buzz cut|폐인|탈모/);
  const shine=rects(bald).filter(rect=>rect.fill==='#ffffff');assert.ok(shine.length>=2&&shine.length<=5);
  for(const rect of shine){assert.ok(rect.y<55,`${pose}: scalp shine is below the head`);assert.ok(rect.x>45&&rect.x+rect.w<90);}
  assert.doesNotMatch(buzz,/data-hair-style="bald"|fill="#ffffff"/);assert.notEqual(bald,buzz);
  assert.equal(renderStudentHairDrape({...a,hairLength:6}),'');
 }
});

test('long textured and informal silhouettes cover the rear nape and preserve wet ties and chair layers',()=>{
 for(const hairLength of [5,6])for(const hairTexture of ['straight','wavy','coily'])for(const cosmeticHairStyle of ['regular','disheveled'])for(const [labMode,hairStyle]of [['dry','loose'],['wet','ponytail'],['wet','braided-bun']]){
  const a={...base,hairLength,hairTexture,curly:hairTexture!=='straight',cosmeticHairStyle,labMode,hairStyle,twoTone:true,hairAccent:'#9786b5'},before=structuredClone(a);
  const svg=renderStudentPortrait(a,'Student','neutral','seated','monitor'),hair=pixels(part(svg,'back-hair'));
  for(const point of ['72,82','76,83','80,84','82,87','84,90','86,96'])assert.ok(hair.has(point),`${hairTexture}/${cosmeticHairStyle}/${hairStyle}: uncovered nape ${point}`);
  let position=-1;for(const id of STUDENT_MONITOR_LAYERS){const next=svg.indexOf(`data-avatar-part="${id}"`);assert.ok(next>position);position=next;}
  if(labMode==='wet')assert.match(svg,new RegExp(`data-hair-style="${hairStyle}"`));
  else if(cosmeticHairStyle==='disheveled')assert.match(svg,/data-hair-style="disheveled"/);
  if(cosmeticHairStyle==='disheveled')assert.match(svg,/data-hair-variant="disheveled"/);
  assert.deepEqual(a,before);assert.match(svg,/viewBox="0 0 320 496"/);assert.match(svg,/data-body-proportion="3.5"/);
  const drape=renderStudentHairDrape(a);assert.equal(Boolean(drape),hairStyle!=='braided-bun');
  if(drape)assert.match(drape,/data-avatar-part="back-hair"/);
 }
});

test('new texture channels have visibly different grouped curls and English hair descriptions',()=>{
 for(const [pose,facing]of poses){
  const straight=renderStudentPortrait(base,'Student','neutral',pose,facing),wavy=renderStudentPortrait({...base,hairTexture:'wavy',curly:true},'Student','neutral',pose,facing),coily=renderStudentPortrait({...base,hairTexture:'coily',curly:true},'Student','neutral',pose,facing);
  assert.notEqual(straight,wavy);assert.notEqual(wavy,coily);
  for(const svg of [straight,wavy,coily])assert.doesNotMatch(svg.match(/aria-label="([^"]+)"/)?.[1]??'',/[가-힣]/);
 }
});
