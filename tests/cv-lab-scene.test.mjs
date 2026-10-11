import test from 'node:test';
import assert from 'node:assert/strict';
import {createState} from '../dist/engine.js';
import {DISCIPLINES} from '../dist/disciplines.js';
import {buildEndingCV,renderCV,validateCVModel,upgradeCVModel} from '../dist/cv.js';
import {createCVLabScene,validateCVLabScene,MAX_CV_LAB_IMAGE_LENGTH} from '../dist/cv-lab-scene.js';

const prefix='data:image/svg+xml;base64,';
const textPrefix='data:image/svg+xml,';
const decode=image=>image.startsWith(textPrefix)?decodeURIComponent(image.slice(textPrefix.length)):Buffer.from(image.slice(prefix.length),'base64').toString('utf8');
const encode=svg=>prefix+Buffer.from(svg).toString('base64');
function completed(seed=42,fieldId='058',labMode='wet'){
 const state=createState('김하늘',seed,{professorProfile:{gender:'female',age:38,fieldId,labMode,institution:'national'}});
 state.started=true;state.month=96;state.route='integrated';state.ending='institute';state.career.qual='passed';
 state.history=[{month:24,kind:'route',route:'integrated'},{month:60,kind:'qual',passed:true},{month:96,kind:'ending',ending:'institute'}];
 return state;
}
test('lab snapshot freezes the last performed month and clears a pending defense without changing the save or RNG',()=>{
 for(const locale of ['ko','en']){
  const state=completed();state.locale=locale;state.pending={kind:'thesis',level:'doctorate',step:'verdict'};
  const before=structuredClone(state),first=createCVLabScene(state);
  assert.deepEqual(state,before);assert.deepEqual(first,createCVLabScene(state));
  assert.deepEqual({...first,image:undefined},{version:1,month:95,fieldId:'058',labMode:'wet',image:undefined});
  assert.ok(validateCVLabScene(first,96));assert.equal(validateCVLabScene(first,95),false);
  assert.ok(!decode(first.image).includes('THESIS DEFENSE'));assert.ok(decode(first.image).includes('학생 도트 초상화'));
  const cv=buildEndingCV(state);assert.ok(cv.html.indexOf('cv-lab-record')>cv.html.indexOf('</div><div class="cv-publication-catalog">'));
  assert.match(cv.html,locale==='en'?/Y8 · Aug/:/8년차 2월/);
 }
 const early=completed();early.month=15;early.ending='dropout';assert.equal(createCVLabScene(early).month,14);
});
test('every discipline/mode and four seasonal windows produce bounded standalone geometry',()=>{
 let max=0,cases=0;const images=new Set();
 for(const field of DISCIPLINES)for(const mode of field.labModes)for(const month of [1,4,7,10]){
  const state=completed(7919,field.id,mode);state.month=month;
  const scene=createCVLabScene(state),svg=decode(scene.image);cases++;
  assert.ok(validateCVLabScene(scene,month),`${field.id}/${mode}/${month}`);assert.ok(scene.image.length<=MAX_CV_LAB_IMAGE_LENGTH);
  assert.match(svg,/^<svg xmlns=["']http:\/\/www.w3.org\/2000\/svg["'] width=["']600["'] height=["']360["']/);
  assert.ok(!/\b(?:class|data-[\w-]+|style|href|onload)=/.test(svg));assert.ok(!/<(?:script|image|foreignObject|use)\b/.test(svg));
  max=Math.max(max,scene.image.length);images.add(scene.image);
 }
 assert.equal(cases,448);assert.ok(images.size>=8);assert.ok(max<70000,`largest scene ${max} bytes`);
});
test('image validation rejects active markup, external resources, broken XML and unbounded payloads',()=>{
 const scene=createCVLabScene(completed()),svg=decode(scene.image).replace(/(\s[\w-]+)='([^']*)'/g,'$1="$2"');
 assert.ok(validateCVLabScene({...scene,image:encode(svg)},96),'previous canonical base64 snapshots remain valid');
 const delimiters=svg.replace('</svg>','<title>50% #색\r\n\t기록</title></svg>');
 const canonical=textPrefix+delimiters.replace(/[%#\r\n\t]/g,c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0').toUpperCase());
 assert.ok(validateCVLabScene({...scene,image:canonical},96));assert.equal(decode(canonical),delimiters);
 for(const invalid of [canonical.replace('%0A','\n'),canonical.replace('%0D','\r'),canonical.replace('%09','\t'),canonical.replace('%23','#'),canonical.replace('%25','%'),canonical.replace('%0A','%0a'),canonical.replace('%23','%2523')])assert.equal(validateCVLabScene({...scene,image:invalid},96),false);
 const bad=[
  svg.replace('xmlns=', 'onload="alert(1)" xmlns='),svg.replace('</svg>','<script>alert(1)</script></svg>'),
  svg.replace('</svg>','<foreignObject><div>HTML</div></foreignObject></svg>'),
  svg.replace('</svg>','<image href="https://example.com/track"/></svg>'),
  svg.replace('</svg>','<use href="#arbitrary"/></svg>'),svg.replace('<g ', '<g style="fill:url(https://example.com/x)" '),
  svg.replace('<g ', '<g href="https://example.com/x" '),svg.replace('<g ', '<g xlink:href="https://example.com/x" '),
  '<!DOCTYPE svg [<!ENTITY x SYSTEM "https://example.com/x">]>'+svg,
  svg.replace('</svg>','<!-- comment --></svg>'),svg.replace('</svg>','<?xml version="1.0"?></svg>'),
  svg.replace('</svg>','<text>&#xD800;</text></svg>'),svg.replace('</svg>','<text>&#x110000;</text></svg>'),
  svg.replace('</svg>','<text>&AMP;</text></svg>'),svg.replace('</svg>','<text>&#X41;</text></svg>'),
  svg.replace('</svg>','<text>\ufffe\uffff</text></svg>'),
  svg.replace('width="600"','width="600" width="600"'),svg.replace('width="600"','width="0"'),
  svg.replace('</svg>','</g></svg>'),svg.replace('</svg>','<g></svg>'),svg.replace('</svg>','<path d="M1e999 0"/></svg>'),
  svg+'<svg xmlns="http://www.w3.org/2000/svg"></svg>',svg.replace('xmlns="http://www.w3.org/2000/svg"','xmlns="https://example.com"'),
 ];
 for(const markup of bad)assert.equal(validateCVLabScene({...scene,image:encode(markup)},96),false,markup.slice(-100));
 for(const image of ['https://example.com/image.svg','data:text/html;base64,PHNjcmlwdD4=',prefix+'@@@=',prefix+'a'.repeat(MAX_CV_LAB_IMAGE_LENGTH),prefix+Buffer.from([0xff,0xfe,0xff]).toString('base64'),textPrefix+'%zz',textPrefix+'%FF',textPrefix+svg,textPrefix+encodeURIComponent(svg),scene.image.replace('</svg>','<text>\ud800</text></svg>')])assert.equal(validateCVLabScene({...scene,image},96),false);
 for(const patch of [{month:96},{fieldId:'bad'},{labMode:'other'},{fieldId:'048',labMode:'wet'},{caption:'<img src=x>'},{version:2},{image:null}])assert.equal(validateCVLabScene({...scene,...patch},96),false);
 for(const key of Object.keys(scene)){const missing={...scene};delete missing[key];assert.equal(validateCVLabScene(missing,96),false);}
});
test('JSON round trips retain the same image and old v1–v3 CVs never gain a scene on render or upgrade',()=>{
 const state=completed(),cv=buildEndingCV(state),imported=JSON.parse(JSON.stringify(cv.model));
 assert.ok(validateCVModel(imported));assert.equal(renderCV(imported),cv.html);
 assert.equal(imported.labScene.image,cv.model.labScene.image);
 const mismatch=structuredClone(imported);mismatch.field='다른 전공';assert.equal(validateCVModel(mismatch),false);
 for(const version of [1,2,3]){
  const legacy=structuredClone(imported);delete legacy.labScene;legacy.version=version;
  if(version<3)for(const key of ['publications','milestones','growthVersion','growthLegacyThrough'])delete legacy[key];
  if(version===1)for(const key of ['advisor','statistics','impact'])delete legacy[key];
  assert.ok(validateCVModel(legacy));assert.ok(!renderCV(legacy).includes('cv-lab-image'));
  const supplemented=upgradeCVModel(legacy,state);assert.ok(!Object.hasOwn(supplemented,'labScene'));
  assert.ok(!renderCV(supplemented).includes('cv-lab-image'));
 }
});
test('forty representative archives including scenes fit comfortably within localStorage and export limits',()=>{
 const gallery=Array.from({length:40},(_,i)=>{
  const state=completed(i+1),cv=buildEndingCV(state).model;
  return {id:`${i+1}-96-institute`,ending:state.ending,fieldId:'058',labMode:'wet',name:state.name,date:'2026-10-10',month:96,relationship:'reserved',career:state.career,statistics:cv.statistics,memories:[],cv};
 });
 const json=JSON.stringify({format:'professor-maker',version:4,state:completed(),gallery,seenPassageIds:[]});
 assert.ok(Buffer.byteLength(json,'utf8')<4000000,`${Buffer.byteLength(json,'utf8')} bytes`);
 assert.ok(json.length*2<5000000,`${json.length*2} UTF-16 bytes`);
});

test('single-quoted snapshots keep strict matching delimiters and duplicate-attribute rejection',()=>{
 const scene=createCVLabScene(completed()),svg=decode(scene.image);
 assert.match(svg,/width='600'/);assert.ok(validateCVLabScene(scene,96));
 for(const bad of [svg.replace("width='600'","width='600\""),svg.replace("width='600'",'width="600\''),svg.replace("width='600'",'width=600'),svg.replace("width='600'",'width=\'600\' width="600"'),svg.replace("xmlns='http://www.w3.org/2000/svg'","xmlns='http://www.w3.org/2000/svg' onload='alert(1)'")]){
  assert.notEqual(bad,svg,'the attack fixture must alter the generated SVG');assert.equal(validateCVLabScene({...scene,image:encode(bad)},96),false);
 }
 const double=svg.replace(/(\s[\w-]+)='([^']*)'/g,'$1="$2"');assert.ok(validateCVLabScene({...scene,image:encode(double)},96));
});
