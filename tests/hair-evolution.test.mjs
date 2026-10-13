import test from 'node:test';
import assert from 'node:assert/strict';
import {studentAppearance,studentAppearanceForState,weeklyAppearance,labHairStyle} from '../dist/appearance.js';
import {campusHairAppearance,KOREAN_HAIR_PALETTE,NORTH_AMERICAN_HAIR_PALETTE,HAIR_ACCENTS,HAIR_COSMETIC_RULES} from '../dist/hair-evolution.js';
import {createState} from '../dist/engine.js';
import {buildEndingCV,renderCV,validateCVModel} from '../dist/cv.js';

const appearance=(seed=42,options={})=>campusHairAppearance({creationSeed:seed,seed:99,gender:'female',locale:'ko',month:0,route:null,...options},studentAppearance(seed,options.gender??'female'));
const graduate=(seed,stress=70)=>appearance(seed,{gender:'male',route:'integrated',month:48,hidden:{stress}});
const findSeed=predicate=>{for(let seed=0;seed<100000;seed++)if(predicate(seed))return seed;throw new Error('No cosmetic seed found');};
const peekabooSeed=findSeed(seed=>appearance(seed).twoTone);
const bleachedSeed=findSeed(seed=>appearance(seed).bleached);
const disheveledSeed=findSeed(seed=>graduate(seed).cosmeticHairStyle==='disheveled');
const rareBaldSeed=findSeed(seed=>graduate(seed,0).cosmeticHairStyle==='bald');
const severeBaldSeed=findSeed(seed=>graduate(seed,85).cosmeticHairStyle==='bald'&&graduate(seed,84.999).cosmeticHairStyle!=='bald');

test('campus palettes and texture channels are reproducible and independent of names, backgrounds, and skin',()=>{
 const paletteKeys={ko:new Set(),en:new Set()},textures=new Set();
 for(let seed=0;seed<500;seed++)for(const locale of ['ko','en']){
  const state={creationSeed:seed,seed:123,gender:'female',locale,month:25,route:'integrated'},base=studentAppearance(seed,'female');
  const result=campusHairAppearance(state,base),guarded={...state};
  for(const key of ['name','nationality','race','ethnicity','background','temperament','lab','career'])Object.defineProperty(guarded,key,{get(){throw new Error(`Forbidden cosmetic dependency: ${key}`);}});
  assert.deepEqual(campusHairAppearance(guarded,base),result);
  assert.equal(campusHairAppearance(state,{...base,skin:'#45291f'}).hair,result.hair);
  assert.equal(campusHairAppearance(state,{...base,skin:'#f4dfcf'}).hairTexture,result.hairTexture);
  assert.deepEqual(result,campusHairAppearance({...state,name:'Another name',seed:0xffffffff},base),'creation seed is independent of current simulation RNG');
  paletteKeys[locale].add(result.hairPaletteKey);if(locale==='en')textures.add(result.hairTexture);
  assert.equal(result.locale,locale);assert.equal(result.naturalHair,result.hair);assert.equal(result.curly,result.hairTexture!=='straight');
 }
 assert.deepEqual(paletteKeys.ko,new Set(KOREAN_HAIR_PALETTE.map(entry=>entry.key)));
 assert.deepEqual(paletteKeys.en,new Set(NORTH_AMERICAN_HAIR_PALETTE.map(entry=>entry.key)));
 assert.deepEqual(textures,new Set(['straight','wavy','coily']));
});

test('undergraduate dye ends at month 24 or accepted graduate admission, whichever is first',()=>{
 for(const [seed,flag] of [[peekabooSeed,'twoTone'],[bleachedSeed,'bleached']]){
  for(const month of [0,1,23,23.999])assert.equal(appearance(seed,{month})[flag],true);
  for(const month of [24,25,48,96]){
   const styled=appearance(seed,{month,route:null});assert.equal(styled.twoTone,false);assert.equal(styled.bleached,false);assert.equal(styled.hair,styled.naturalHair);assert.equal(styled.hairAccent,null);
  }
  for(const route of ['masters','integrated'])for(const month of [0,18,24]){
   const styled=appearance(seed,{month,route});assert.equal(styled.twoTone,false);assert.equal(styled.bleached,false);
  }
  assert.equal(appearance(seed,{month:24,visualMonth:23})[flag],true,'a completed undergraduate report uses its own visual month');
 }
 const peekaboo=appearance(peekabooSeed),bleached=appearance(bleachedSeed);
 assert.ok(HAIR_ACCENTS.includes(peekaboo.hairAccent));assert.equal(peekaboo.hair,peekaboo.naturalHair);
 assert.equal(bleached.hair,'#d8ceb1');assert.equal(bleached.hairAccent,null);assert.notEqual(bleached.naturalHair,bleached.hair);
});

test('female hair grows one length step each 24 months with a six-step cap',()=>{
 const base={...studentAppearance(42,'female'),hairLength:3};
 for(const [month,length] of [[0,3],[23,3],[24,4],[47,4],[48,5],[71,5],[72,6],[96,6],[500,6]]){
  const state={creationSeed:42,gender:'female',locale:'ko',month};assert.equal(campusHairAppearance(state,base).hairLength,length);
 }
 assert.equal(campusHairAppearance({creationSeed:42,gender:'female',locale:'ko',month:49,visualMonth:47},base).hairLength,4);
 for(const [month,length] of [[0,3],[24,4],[48,5],[72,6],[95,6]])assert.equal(campusHairAppearance({creationSeed:42,gender:'female',month},{...base,hairLength:1}).hairLength,length,'growth starts at a render-only bob without changing the base');
 assert.equal(base.hairLength,3);
 for(const gender of ['male','unspecified'])assert.equal(campusHairAppearance({creationSeed:42,gender,month:96,route:null},base).hairLength,3);
 const state=createState('',42,{gender:'female',labMode:'dry'});state.month=48;state.route='integrated';
 for(let week=0;week<5;week++)assert.equal(weeklyAppearance(state,week).hairLength,Math.min(6,Math.max(3,studentAppearance(42,'female').hairLength)+2));
});

test('disheveled long hair requires a rare cosmetic seed, actual graduate route, month 24, and stress 70',()=>{
 assert.equal(graduate(disheveledSeed,70).cosmeticHairStyle,'disheveled');
 assert.ok([5,6].includes(graduate(disheveledSeed,70).hairLength));
 for(const options of [{month:23,route:'integrated',hidden:{stress:100}},{month:24,route:null,hidden:{stress:100}},{month:96,route:null,hidden:{stress:100}},{month:24,route:'integrated',hidden:{stress:69.999}}]){
  assert.equal(appearance(disheveledSeed,{gender:'male',...options}).cosmeticHairStyle,'regular');
 }
 assert.equal(appearance(disheveledSeed,{gender:'male',month:24,route:'masters',hidden:{stress:70}}).cosmeticHairStyle,'disheveled');
 for(const gender of ['female','unspecified'])assert.equal(appearance(disheveledSeed,{gender,month:96,route:'integrated',hidden:{stress:100}}).cosmeticHairStyle,'regular');
});

test('smooth bald cosmetics are rare and distinct from a buzzcut, with strict severe-stress eligibility',()=>{
 const rare=graduate(rareBaldSeed,0),severe=graduate(severeBaldSeed,85);
 for(const styled of [rare,severe]){assert.equal(styled.cosmeticHairStyle,'bald');assert.equal(styled.hairLength,0);assert.equal(styled.curly,false);assert.equal(styled.hairTexture,'straight');}
 assert.notEqual(graduate(severeBaldSeed,84.999).cosmeticHairStyle,'bald');
 for(const seed of [rareBaldSeed,severeBaldSeed]){
  assert.equal(appearance(seed,{gender:'male',month:23,route:'integrated',hidden:{stress:100}}).cosmeticHairStyle,'regular');
  assert.equal(appearance(seed,{gender:'male',month:48,route:null,hidden:{stress:100}}).cosmeticHairStyle,'regular');
  assert.equal(appearance(seed,{gender:'female',month:48,route:'integrated',hidden:{stress:100}}).cosmeticHairStyle,'regular');
 }
 assert.equal(campusHairAppearance({creationSeed:42,gender:'male',month:0},{...studentAppearance(42,'male'),hairLength:0}).cosmeticHairStyle,'regular');
});

test('exceptional hair remains a minority and North American textures cover ordinary campus styles',()=>{
 const total=10000,counts={peekaboo:0,bleached:0,disheveled:0,calmBald:0,severeBald:0,straight:0,wavy:0,coily:0};
 for(let seed=0;seed<total;seed++){
  const first=appearance(seed),normal=graduate(seed,0),stressed=graduate(seed,70),severe=graduate(seed,85),campus=appearance(seed,{locale:'en',month:25,route:'integrated'});
  counts.peekaboo+=first.twoTone;counts.bleached+=first.bleached;counts.disheveled+=stressed.cosmeticHairStyle==='disheveled';counts.calmBald+=normal.cosmeticHairStyle==='bald';counts.severeBald+=severe.cosmeticHairStyle==='bald';counts[campus.hairTexture]++;
  assert.equal(Boolean(first.twoTone&&first.bleached),false);
 }
 assert.ok(counts.peekaboo>1000&&counts.peekaboo<1400);assert.ok(counts.bleached>500&&counts.bleached<900);
 assert.ok(counts.disheveled>250&&counts.disheveled<450);assert.ok(counts.calmBald>0&&counts.calmBald<30);assert.ok(counts.severeBald>50&&counts.severeBald<140);
 assert.ok(counts.straight>5200&&counts.straight<5800);assert.ok(counts.wavy>2200&&counts.wavy<2800);assert.ok(counts.coily>1700&&counts.coily<2300);
 assert.equal(HAIR_COSMETIC_RULES.peekabooRate,.12);assert.equal(HAIR_COSMETIC_RULES.bleachedRate,.07);assert.equal(HAIR_COSMETIC_RULES.severeBaldRate,.009);
});

test('military training takes precedence over dyes and all rare cosmetics without changing the saved identity',()=>{
 for(const seed of [peekabooSeed,bleachedSeed,disheveledSeed,rareBaldSeed,severeBaldSeed]){
  const state=createState('',seed,{gender:'male',labMode:'wet'});state.month=40;state.route='integrated';state.hidden.stress=100;state.service={...state.service,trainingStartMonth:40,trainingReturnMonth:41};
  const saved=structuredClone(state);
  for(const [month,index] of [[40,3],[41,0],[42,4]]){
   const buzz=weeklyAppearance({...state,month},index);assert.equal(buzz.hairLength,0);assert.equal(buzz.hairStyle,'loose');assert.equal(buzz.cosmeticHairStyle,'regular');assert.equal(buzz.twoTone,false);assert.equal(buzz.bleached,false);assert.equal(buzz.hairAccent,null);assert.equal(buzz.hair,buzz.naturalHair);
  }
  const restored=weeklyAppearance({...state,month:43}),evolved=campusHairAppearance({...state,month:43},studentAppearanceForState(state));assert.equal(restored.hairLength,evolved.hairLength);assert.equal(restored.cosmeticHairStyle,evolved.cosmeticHairStyle);
  assert.deepEqual(state,saved);
 }
});

test('wet long hair still uses the stable ponytail or braided bun after growth and rare long-hair changes',()=>{
 const styles=new Set();
 for(let seed=0;seed<100;seed++)for(const gender of ['female','male']){
  const state=createState('',gender==='male'?disheveledSeed:seed,{gender,labMode:'wet'});state.month=96;state.route='integrated';state.hidden.stress=70;
  const styled=weeklyAppearance(state);assert.ok(styled.hairLength>=5);assert.equal(styled.hairStyle,labHairStyle(state.creationSeed,styled.hairLength,'wet'));styles.add(styled.hairStyle);
  assert.equal(weeklyAppearance({...state,professorProfile:{...state.professorProfile,labMode:'dry'}}).hairStyle,'loose');
 }
 assert.deepEqual(styles,new Set(['ponytail','braided-bun']));
});

test('render cosmetics never mutate engine state, RNG, or already frozen CV images',()=>{
 const state=createState('A student',severeBaldSeed,{gender:'male',locale:'en',labMode:'wet'});state.month=96;state.route='integrated';state.ending='institute';state.career.qual='passed';state.hidden.stress=85;
 const before=structuredClone(state);for(let index=0;index<5;index++)weeklyAppearance(state,index);assert.deepEqual(state,before);
 const cv=buildEndingCV(state).model,frozen=structuredClone(cv);assert.ok(validateCVModel(cv));
 const sourceImage=cv.labScene.image;state.hidden.stress=0;state.month=48;weeklyAppearance(state);renderCV(cv);
 assert.deepEqual(cv,frozen);assert.equal(cv.labScene.image,sourceImage);
});
