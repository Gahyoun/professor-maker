import test from 'node:test';
import assert from 'node:assert/strict';
import {createState} from '../dist/engine.js';
import {DISCIPLINES} from '../dist/disciplines.js';
import {equipmentProfile,roomEquipment} from '../dist/lab-equipment.js';
import {roomScene} from '../dist/lab-scene.js';

const cases=[
 ['056','wet','biology',['microscope','centrifuge','tube-rack','lab-counter']],
 ['055','wet','analytical',['balance','spectrometer','hotplate','lab-counter']],
 ['050','wet','measurement',['oscilloscope','optical-bench','sensor','lab-counter']],
 ['072','dry','design',['scale-model']],
 ['090','dry','computing',['workstation']],
];

test('major-specific room equipment and executed tools follow the research method',()=>{
 for(const [fieldId,labMode,kind,items] of cases){
  const s=createState('김민지',7919,{fieldId,labMode});
  const active={actual:labMode==='wet'?'experiment':'analysis',performed:true,outcome:'completed'};
  const html=roomScene(s,active,0);
  assert.equal(equipmentProfile(s),kind);
  assert.match(html,new RegExp(`data-equipment-profile="${kind}"`));
  for(const item of items)assert.match(html,new RegExp(`data-equipment="${item}"`),`${fieldId}/${item}`);
  if(labMode==='dry')assert.doesNotMatch(html,/data-equipment="(?:microscope|tube-rack|centrifuge|balance|spectrometer|hotplate)"|data-motion="(?:pipetting|measuring)"/);
  if(kind==='measurement'){
   assert.match(html,/data-motion="measuring"/);
   assert.doesNotMatch(html,/data-motion="pipetting"/);
  }
  if(kind==='biology')assert.match(html,/data-motion="pipetting"/);
 }
});

test('all 73 majors produce stable equipment without changing simulation state or RNG',()=>{
 const kinds=new Set();
 for(const d of DISCIPLINES)for(const labMode of d.labModes){
  const state=createState('김하늘',173,{fieldId:d.id,labMode}),before=structuredClone(state);
  const result={actual:labMode==='wet'?'experiment':'analysis',performed:true,outcome:'completed'};
  const once=roomScene(state,result,2),twice=roomScene(state,result,2);
  assert.equal(once,twice,d.label);
  assert.deepEqual(state,before,d.label);
  assert.doesNotMatch(once,/NaN|undefined|Infinity/);
  kinds.add(equipmentProfile(state));
 }
 assert.deepEqual([...kinds].sort(),['analytical','biology','computing','design','measurement']);
});

test('instruments stay within the shared floor plane and above supporting tabletops',()=>{
 for(const [fieldId,labMode] of cases){
  const s=createState('김민지',7919,{fieldId,labMode}),points=[];
  const record=(name,...coords)=>{points.push({name,coords});return `<g data-helper="${name}"/>`;};
  const helpers={
   box:(u,v,w,d,h,color,z=0)=>{assert.ok(w>0&&d>0&&h>0);assert.ok(u+w<=28&&v+d<=28);return record('box',u,v,z,z+h);},
   front:(u,v,z,w,h)=>record('front',u,v,z,z+h),
   line:(a,b)=>{record('line-start',...a);return record('line-end',...b);},
   desk:(u,v,w,d)=>{assert.ok(w>0&&d>0);return record('desk',u,v);},
   microscope:(u,v,z)=>record('microscope',u,v,z),
   monitor:(u,v,z)=>record('monitor',u,v,z),
   project:(u,v,z=0)=>[300+(u-v)*9,96+(u+v)*4.5-z],
  };
  const generated=roomEquipment(s,helpers,true);
  assert.ok(generated.primary&&generated.bench);
  assert.ok(points.length>5);
  for(const {name,coords} of points){
   assert.ok(coords.every(Number.isFinite),`${fieldId}/${name}`);
   assert.ok(coords[0]>=0&&coords[0]<=28&&coords[1]>=0&&coords[1]<=28,`${fieldId}/${name} left the room floor`);
   assert.ok(coords.slice(2).every(z=>z>=0&&z<=90),`${fieldId}/${name} left the wall-height bounds`);
  }
 }
});
