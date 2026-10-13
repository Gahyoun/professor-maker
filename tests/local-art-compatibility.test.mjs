import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {studentAppearance} from '../dist/appearance.js';
import {renderStudentPortrait,renderStudentHairDrape,STUDENT_MONITOR_LAYERS} from '../dist/student-pixel-art.js';

const base={...studentAppearance(25,'female'),hairLength:6,curly:false,glasses:true,labMode:'dry',hairStyle:'loose',locale:'en',hairPaletteKey:'naturalBlack',hair:'#292624',naturalHair:'#292624',hairTexture:'straight',twoTone:false,bleached:false,cosmeticHairStyle:'regular'};
const poses=[['standing','front'],['seated','monitor'],['lecturing','front'],['experiment','front'],['seated','front']];
const part=(svg,id)=>svg.match(new RegExp(`<g data-avatar-part="${id}">([\\s\\S]*?)<\\/g>`))?.[1]??'';
const rects=svg=>[...svg.matchAll(/<rect x="(\d+)" y="(\d+)" width="(\d+)" height="1" fill="([^"]+)"\/>/g)].map(([,x,y,w,fill])=>({x:+x,y:+y,w:+w,fill}));
const pixels=svg=>{const result=new Map();for(const {x,y,w,fill}of rects(svg))for(let offset=0;offset<w;offset++)result.set(`${x+offset},${y}`,fill);return result;};
const mix=(a,b,t)=>'#'+a.slice(1).match(/../g).map((v,i)=>Math.round(parseInt(v,16)*(1-t)+parseInt(b.slice(1+i*2,3+i*2),16)*t).toString(16).padStart(2,'0')).join('');

test('local optional headwear and afro art keep every pose, keyboard hand and remote layer contract',()=>{
 const ordinary=renderStudentPortrait(base,'Student','neutral','seated','monitor');
 for(const props of [{hijab:true,hijabColor:'#536b5c'},{headwear:'hijab',hijabColor:'#2d3b55'},{afro:true,hairLength:3},{hairStyle:'afro',hairLength:3}]){
  const appearance={...base,...props},before=structuredClone(appearance),style=props.afro||props.hairStyle==='afro'?'afro':'hijab';
  for(const [pose,facing]of poses){
   const svg=renderStudentPortrait(appearance,'Student','neutral',pose,facing);
   assert.match(svg,new RegExp(`data-hair-style="${style}"`));
   assert.doesNotMatch(svg,/NaN|undefined/);
   const label=svg.match(/aria-label="([^"]+)"/)?.[1]??'';
   assert.doesNotMatch(label,/[가-힣]|Fringe/);assert.equal(label.match(new RegExp(style,'ig'))?.length,1);
   if(style==='hijab')assert.match(svg,/data-headwear="hijab"/);
   if(pose==='lecturing')assert.match(svg,/class="ta-lecture-arm"/);
   if(facing==='monitor'){
    assert.deepEqual(STUDENT_MONITOR_LAYERS.map(id=>svg.indexOf(`data-avatar-part="${id}"`)).every((position,index,positions)=>position>=0&&(!index||position>positions[index-1])),true);
    for(const arm of ['far-arm','near-arm'])assert.equal(part(svg,arm),part(ordinary,arm));
    const face=pixels(part(svg,'face-fringe'));assert.ok([...face.values()].includes('#fff8ec'),'eye highlight remains visible');
   }
  }
  assert.deepEqual(appearance,before);assert.equal(renderStudentHairDrape(appearance),'');
 }
});

test('scarf fabric covers the rear ear and nape without an uncovered hair or neck stripe',()=>{
 const svg=renderStudentPortrait({...base,hijab:true},'Student','neutral','seated','monitor');
 const skinBase=mix(base.skin,'#fff0df',.25),face=pixels(part(svg,'face-fringe')),skin=new Set([skinBase,mix(skinBase,'#b77968',.24),mix(skinBase,'#fff7e8',.4),'#e79a9f','#edb0ac','#ffe0d5']);
 for(const point of ['84,70','84,76','82,87','84,90']){assert.ok(face.has(point));assert.equal(skin.has(face.get(point)),false);}
 assert.notEqual(svg,renderStudentPortrait({...base,hijab:true,hijabColor:'#aa6174'},'Student','neutral','seated','monitor'));
});

test('a hijab replaces all long-hair rasters and its fabric contour does not depend on covered hair color',()=>{
 const hair=mix(base.hair,'#766058',.14),hairColors=new Set([hair,mix(base.hair,'#19202d',.22),mix(hair,'#b4a09a',.18),mix(hair,'#cfb7a9',.35)]);
 const fabric=mix('#536b5c','#10151f',.08),edge=mix(fabric,'#10151f',.38),fabricTones=[fabric,mix(fabric,'#04060b',.38),mix(fabric,'#ffffff',.16),mix(fabric,'#ffffff',.3)];
 const scarfColors=new Set([...fabricTones,...fabricTones.map(color=>mix(color,edge,.65))]);
 for(const [pose,facing]of poses){
  const appearance={...base,hijab:true,hijabColor:'#536b5c',hairTexture:'coily',curly:true,twoTone:true,hairAccent:'#ba8697'};
  const svg=renderStudentPortrait(appearance,'Student','neutral',pose,facing),hairDots=rects(svg).filter(pixel=>hairColors.has(pixel.fill));
  // The sole hair pigment still exposed belongs to eyebrows above the eyes.
  for(const pixel of hairDots)assert.ok(pixel.y>= (pose==='seated'?60:44)&&pixel.y<=(pose==='seated'?63:48));
  assert.doesNotMatch(svg,/data-two-tone|data-bleached|fill="#ba8697"/);
  const recolored=renderStudentPortrait({...appearance,hair:'#b69a63'},'Student','neutral',pose,facing),before=pixels(svg),after=pixels(recolored);
  for(const [point,color]of before)if(scarfColors.has(color))assert.equal(after.get(point),color,`covered scarf changed with hair color at ${point}`);
 }
});

test('local coily aliases do not reintroduce a tail into a buzz cut or bypass wet tie rules',()=>{
 for(const props of [{coily:true},{hairTexture:'coily',curly:true}]){
  for(const [pose,facing]of poses){
   const coily=renderStudentPortrait({...base,...props},'Student','neutral',pose,facing);
   assert.notEqual(coily,renderStudentPortrait({...base,hairTexture:'wavy',curly:true},'Student','neutral',pose,facing));
  }
  const buzz=renderStudentPortrait({...base,...props,hairLength:0,afro:true},'Student','neutral','seated','monitor');
  assert.doesNotMatch(buzz,/data-hair-style="afro"/);assert.equal(part(buzz,'back-hair'), '');
  for(const hairStyle of ['ponytail','braided-bun']){
   const tied={...base,...props,afro:true,labMode:'wet',hairStyle},svg=renderStudentPortrait(tied,'Student','neutral','seated','monitor');
   assert.match(svg,new RegExp(`data-hair-style="${hairStyle}"`));assert.doesNotMatch(svg,/data-hair-style="afro"/);
   assert.equal(Boolean(renderStudentHairDrape(tied)),hairStyle==='ponytail');
  }
 }
});

test('modern long-hair cascade has a tapered back surface and its drape contains only the resolved rear locks',()=>{
 for(const hairTexture of ['straight','wavy','coily']){
  const appearance={...base,hairTexture,curly:hairTexture!=='straight'};
  const svg=renderStudentPortrait(appearance,'Student','neutral','seated','monitor'),rear=pixels(part(svg,'back-hair'));
  const width=y=>[...rear.keys()].filter(point=>point.endsWith(`,${y}`)).length;
  assert.ok(width(115)>width(151),'layered ends narrow above the hip');
  const drape=renderStudentHairDrape(appearance);
  assert.equal(part(drape,'back-hair'),part(svg,'back-hair'));
  for(const point of ['72,82','76,83','80,84','82,87','84,90','86,96'])assert.ok(rear.has(point));
 }
});

test('adaptive deep-skin blush and warm blond shading preserve natural eye details',()=>{
 for(const [pose,facing]of poses){
  const dark=renderStudentPortrait({...base,skin:'#45291f',skinPaletteVersion:2},'Student','neutral',pose,facing);
  assert.doesNotMatch(dark,/fill="#e79a9f"|fill="#edb0ac"|fill="#ffe0d5"/);
  assert.match(dark,/fill="#fff8ec"/);
  const blond=renderStudentPortrait({...base,hair:'#b69a63',hairPaletteKey:'goldenBlond'},'Student','neutral',pose,facing);
  assert.match(blond,/fill="#fff8ec"/);
  assert.notEqual(blond,renderStudentPortrait({...base,hair:'#b69a63',hairPaletteKey:undefined},'Student','neutral',pose,facing));
 }
});

test('renderer ignores protected identity fields, does not mutate input, and retains archived legacy portraits',()=>{
 const guarded={...base};for(const key of ['name','race','ethnicity','nationality','background','stress','seed'])Object.defineProperty(guarded,key,{enumerable:true,get(){throw new Error(`Forbidden renderer dependency: ${key}`);}});
 for(const [pose,facing]of poses)assert.equal(renderStudentPortrait(guarded,'Student','neutral',pose,facing),renderStudentPortrait(base,'Student','neutral',pose,facing));
 assert.doesNotThrow(()=>renderStudentPortrait({}));
 const digest=value=>createHash('sha256').update(value).digest('hex');
 assert.equal(digest(renderStudentPortrait(studentAppearance(42,'female'))),'7f707baa52da256fde616df812ded56e7417d2ebb03b8bfcb53e81df173ab7ef');
});
