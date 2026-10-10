import test from 'node:test';
import assert from 'node:assert/strict';
import {studentAppearance,weeklyAppearance} from '../dist/appearance.js';
import {renderStudentPortrait} from '../dist/student-pixel-art.js';
import {createState} from '../dist/engine.js';
const rects=svg=>[...svg.matchAll(/<rect x="(\d+)" y="(\d+)" width="(\d+)" height="1" fill="([^"]+)"\/>/g)].map(([,x,y,w,fill])=>({x:+x,y:+y,w:+w,fill}));
const part=(svg,id)=>svg.match(new RegExp(`<g data-avatar-part="${id}">([\\s\\S]*?)<\\/g>`))?.[1]??'';
const mix=(a,b,t)=>'#'+a.slice(1).match(/../g).map((v,i)=>Math.round(parseInt(v,16)*(1-t)+parseInt(b.slice(1+i*2,3+i*2),16)*t).toString(16).padStart(2,'0')).join('');

test('six saved wardrobe slots retain distinct casual silhouettes and trousers in every activity pose',()=>{
  const a={...studentAppearance(7919,'male'),hairLength:1,curly:false,glasses:false},before=structuredClone(a);
  for(const [pose,facing] of [['standing','front'],['seated','front'],['seated','monitor'],['lecturing','front']]){
    const torsos=new Set(),trousers=new Set();
    for(let outfit=0;outfit<6;outfit++){
      const svg=renderStudentPortrait({...a,outfit},'학생','neutral',pose,facing),pixels=rects(svg);
      torsos.add(JSON.stringify(pixels.filter(p=>p.y>=108&&p.y<=146)));
      trousers.add(JSON.stringify(pixels.filter(p=>p.y>=185&&p.y<=211)));
      assert.match(svg,/data-body-proportion="3.5"/);assert.match(svg,/viewBox="0 0 320 496"/);
      assert.ok(pixels.some(p=>p.fill==='#f6f0e2'&&p.y>=210),'sneaker soles remain visible');
      assert.ok(!svg.includes('#ad5f6b'),'casual layered shirts do not keep the former necktie');
    }
    assert.equal(torsos.size,6,`${pose}/${facing} preserves all saved wardrobe shapes`);
    assert.equal(trousers.size,6,`${pose}/${facing} varies denim and cotton trousers`);
  }
  assert.deepEqual(a,before);
});
test('changing clothing keeps both keyboard hands at the same coordinates and behind the same layers',()=>{
  const a={...studentAppearance(7919,'male'),hairLength:1,curly:false},skin=mix(a.skin,'#fff0df',.25),skinD=mix(skin,'#b77968',.24);
  const hands=outfit=>{
    const svg=renderStudentPortrait({...a,outfit},'학생','focused','seated','monitor');
    return ['far-arm','near-arm'].map(id=>rects(part(svg,id)).filter(p=>[skin,skinD].includes(p.fill)));
  };
  const expected=hands(0);assert.ok(expected.every(hand=>hand.length>0));
  for(let outfit=1;outfit<6;outfit++)assert.deepEqual(hands(outfit),expected);
});
test('wet experiments retain protective coats and dry students retain their five daily clothing slots',()=>{
  const s=createState('학생',7919,{labMode:'dry'}),before=structuredClone(s),outfits=new Set();
  for(let week=0;week<5;week++)outfits.add(weeklyAppearance(s,week).outfit);
  assert.deepEqual([...outfits].sort(),[1,2,3,4,5]);assert.deepEqual(s,before);
  const wet={...s,professorProfile:{...s.professorProfile,labMode:'wet'}},appearance=weeklyAppearance(wet);
  const coat=renderStudentPortrait({...appearance,outfit:0},'학생','focused','experiment');
  assert.match(coat,/data-pose="experiment" data-outfit="0"/);
  assert.ok(coat.includes('#c4ceca'),'protective coat opening is retained');
});
