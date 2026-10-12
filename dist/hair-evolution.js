// Render-only campus styling. These authored probabilities describe fictional
// cosmetics, not demographic frequencies or medical outcomes. The channels are
// independent of the simulation RNG, names, background, and skin tone.
export const KOREAN_HAIR_PALETTE=Object.freeze([
 Object.freeze({key:'naturalBlack',color:'#292624'}),
 Object.freeze({key:'darkBrown',color:'#3b302b'}),
 Object.freeze({key:'ashBlack',color:'#303137'}),
]);
export const NORTH_AMERICAN_HAIR_PALETTE=Object.freeze([
 Object.freeze({key:'naturalBlack',color:'#201d1b'}),
 Object.freeze({key:'softBlack',color:'#2b241f'}),
 Object.freeze({key:'darkBrown',color:'#3d2c21'}),
 Object.freeze({key:'mediumBrown',color:'#59402d'}),
 Object.freeze({key:'chestnut',color:'#735135'}),
 Object.freeze({key:'darkBlond',color:'#997647'}),
 Object.freeze({key:'goldenBlond',color:'#b69a63'}),
 Object.freeze({key:'auburn',color:'#985d3c'}),
]);
export const HAIR_ACCENTS=Object.freeze(['#ba8697','#9786b5','#c1b48d']);
export const HAIR_COSMETIC_RULES=Object.freeze({
 growthMonths:24,maxLength:6,peekabooRate:.12,bleachedRate:.07,
 disheveledRate:.035,disheveledStress:70,baldRate:.001,
 severeBaldRate:.009,baldStress:85,graduateStartMonth:24,
});

function draw(seed,channel){
 let value=2166136261;
 for(const character of `${Number(seed)>>>0}:campus-hair-v1:${channel}`)value=Math.imul(value^character.charCodeAt(0),16777619);
 value^=value>>>16;value=Math.imul(value,0x7feb352d);value^=value>>>15;value=Math.imul(value,0x846ca68b);value^=value>>>16;
 return (value>>>0)/4294967296;
}
const elapsedMonth=value=>Number.isFinite(value)?Math.max(0,Math.floor(value)):0;
const pick=(values,sample)=>values[Math.min(values.length-1,Math.floor(sample*values.length))];

// Admission is a choice recorded in route; the calendar alone does not turn a
// pending undergraduate into a graduate. Undergraduate dye ends after the first
// 24 elapsed months, or earlier if a graduate route has actually been accepted.
export function campusHairAppearance(state,base,visualMonth=state.visualMonth??state.month){
 const seed=state.creationSeed??state.seed,month=elapsedMonth(visualMonth),locale=state.locale==='en'?'en':'ko';
 const graduateAccepted=['masters','integrated'].includes(state.route),graduate=month>=HAIR_COSMETIC_RULES.graduateStartMonth&&graduateAccepted;
 const undergradStyle=!graduateAccepted&&month<24;
 const palette=locale==='en'?NORTH_AMERICAN_HAIR_PALETTE:KOREAN_HAIR_PALETTE;
 const natural=pick(palette,draw(seed,`palette:${locale}`));
 const textureDraw=draw(seed,'texture'),hairTexture=locale==='en'?(textureDraw<.55?'straight':textureDraw<.8?'wavy':'coily'):(base.curly?'wavy':'straight');
 const dyeDraw=draw(seed,'undergraduate-dye'),twoTone=undergradStyle&&dyeDraw<HAIR_COSMETIC_RULES.peekabooRate;
 const bleached=undergradStyle&&dyeDraw>=HAIR_COSMETIC_RULES.peekabooRate&&dyeDraw<HAIR_COSMETIC_RULES.peekabooRate+HAIR_COSMETIC_RULES.bleachedRate;
 const originalLength=Math.max(0,Math.min(HAIR_COSMETIC_RULES.maxLength,base.hairLength??3));
 // Keep an existing longer style; the short-to-long growth path starts at a
 // render-only bob length, without rewriting the original cosmetic identity.
 let hairLength=state.gender==='female'?Math.min(HAIR_COSMETIC_RULES.maxLength,Math.max(3,originalLength)+Math.floor(month/HAIR_COSMETIC_RULES.growthMonths)):originalLength;
 let cosmeticHairStyle='regular';
 if(state.gender==='male'&&graduate){
  const stress=Number.isFinite(state.hidden?.stress)?state.hidden.stress:0,baldDraw=draw(seed,'bald');
  if(baldDraw<HAIR_COSMETIC_RULES.baldRate||stress>=HAIR_COSMETIC_RULES.baldStress&&baldDraw<HAIR_COSMETIC_RULES.severeBaldRate){cosmeticHairStyle='bald';hairLength=0;}
  else if(stress>=HAIR_COSMETIC_RULES.disheveledStress&&draw(seed,'disheveled')<HAIR_COSMETIC_RULES.disheveledRate){cosmeticHairStyle='disheveled';hairLength=5+Math.floor(draw(seed,'disheveled-length')*2);}
 }
 return {...base,locale,hair:natural.color,naturalHair:natural.color,hairPaletteKey:natural.key,hairTexture,curly:hairTexture!=='straight',hairLength,cosmeticHairStyle,twoTone,bleached,hairAccent:twoTone?pick(HAIR_ACCENTS,draw(seed,'accent')):null,...(bleached?{hair:'#d8ceb1'}:{}),...(cosmeticHairStyle==='bald'?{curly:false,hairTexture:'straight'}:{})};
}
