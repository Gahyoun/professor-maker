import {renderStudentPortrait} from './student-pixel-art.js';
// Foundation-inspired light-to-medium spectrum; these are art colors, not product shade measurements.
export function skinTone(sample){
 const anchors=['#f2d8c2','#eed0b7','#e8c6ab','#e1bda0','#d8b194','#cfa588','#c2987c'],position=Math.max(0,Math.min(1,sample))*6,index=Math.min(5,Math.floor(position)),fraction=position-index;
 return '#'+anchors[index].slice(1).match(/../g).map((v,i)=>Math.round(parseInt(v,16)*(1-fraction)+parseInt(anchors[index+1].slice(1+i*2,3+i*2),16)*fraction).toString(16).padStart(2,'0')).join('');
}
// Independent cosmetic RNG: appearance never changes ability or simulation rolls.
export function studentAppearance(seed,gender){
 let n=Number(seed)>>>0;const rand=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return (n+.5)/4294967296;};
 const mean=gender==='male'?2:gender==='female'?3.5:3.5;
 const gaussian=Math.sqrt(-2*Math.log(rand()))*Math.cos(2*Math.PI*rand());
 const rare=rand();return {hairLength:rare<(gender==='male'?.006:0)?0:Math.max(1,Math.min(6,gender==='female'?1+Math.floor(rare*6):Math.round(mean+gaussian*.85))),hair:['#282827','#3b302b','#49392f','#242836','#675046','#352e2d'][Math.floor(rand()*6)],skin:skinTone(rand()),shirt:['#456c87','#597a68','#906b71','#6c6587'][Math.floor(rand()*4)],glasses:rand()<.3,eyes:Math.floor(rand()*3),face:Math.floor(rand()*3),outfit:Math.floor(rand()*6),fringe:Math.floor(rand()*16),brows:Math.floor(rand()*3),glassesShape:Math.floor(rand()*2),curly:((Math.imul(Number(seed)^0x37ac,2654435761)>>>0)%5)===0};
}
// Versioned, independent cosmetic channels for new North American intakes.
// Every name and self-described journey can receive every tone or hair color.
export const US_SKIN_TONES=Object.freeze(['#f4dfcf','#efd1b8','#e6bf9e','#d9ac82','#c79569','#b68055','#a56c47','#925b3b','#7e4d32','#6a3f2b','#573326','#45291f','#35211b']);
function cosmeticDraw(seed,namespace){let value=2166136261;for(const character of `${Number(seed)>>>0}:us-appearance-v1:${namespace}`)value=Math.imul(value^character.charCodeAt(0),16777619);value^=value>>>16;value=Math.imul(value,0x7feb352d);value^=value>>>15;value=Math.imul(value,0x846ca68b);value^=value>>>16;return(value>>>0)/4294967296;}
export function skinToneUS(sample){const position=Math.max(0,Math.min(1,sample))*(US_SKIN_TONES.length-1),index=Math.min(US_SKIN_TONES.length-2,Math.floor(position)),fraction=position-index;return '#'+US_SKIN_TONES[index].slice(1).match(/../g).map((value,i)=>Math.round(parseInt(value,16)*(1-fraction)+parseInt(US_SKIN_TONES[index+1].slice(1+i*2,3+i*2),16)*fraction).toString(16).padStart(2,'0')).join('');}
export function studentAppearanceForState(state){
 const seed=state.creationSeed??state.seed,base=studentAppearance(seed,state.gender);
 if(state.locale!=='en'||state.admission?.namingVersion!==3)return base;
 const hairColors=['#201d1b','#2b241f','#3d2c21','#59402d','#735135','#997647','#b69a63','#985d3c'];
 return {...base,skin:skinToneUS(cosmeticDraw(seed,'skin')),skinPaletteVersion:2,hair:hairColors[Math.floor(cosmeticDraw(seed,'hair-color')*hairColors.length)],curly:cosmeticDraw(seed,'hair-texture')<.35};
}

export const renderPortrait=renderStudentPortrait;
// A render-only choice: the original saved hair length remains unchanged.
export function labHairStyle(seed,hairLength,labMode){
 if(labMode!=='wet'||hairLength<5)return 'loose';
 return (Math.imul((Number(seed)^0x7b3d)>>>0,2654435761)>>>0)%2?'ponytail':'braided-bun';
}

export function weeklyAppearance(state,index=0){
 const a=studentAppearanceForState(state),month=state.visualMonth??state.month;
 const sequence=(a.outfit+Math.max(0,state.month-1)*5+index),outfit=state.professorProfile?.labMode==='dry'?1+sequence%5:sequence%6;
 const haircut=state.gender==='male'&&state.service?.trainingReturnMonth!==undefined&&(month>=state.service.trainingReturnMonth&&month<state.service.trainingReturnMonth+2||month===state.service.trainingStartMonth&&index>=3),hairLength=haircut?0:a.hairLength,labMode=state.professorProfile?.labMode;
 return {...a,hairLength,labMode,hairStyle:labHairStyle(state.creationSeed??state.seed,hairLength,labMode),outfit,shirt:['#456c87','#597a68','#906b71','#6c6587','#ba8659','#548b98'][(a.outfit+index+state.month)%6]};
}
