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
export const renderPortrait=renderStudentPortrait;

export function weeklyAppearance(state,index=0){
 const a=studentAppearance(state.creationSeed??state.seed,state.gender),month=state.visualMonth??state.month;
 const sequence=(a.outfit+Math.max(0,state.month-1)*5+index),outfit=state.professorProfile?.labMode==='dry'?1+sequence%5:sequence%6;
 return {...a,...(state.gender==='male'&&state.service?.trainingReturnMonth!==undefined&&(month>=state.service.trainingReturnMonth&&month<state.service.trainingReturnMonth+2||month===state.service.trainingStartMonth&&index>=3)?{hairLength:0}:{}),outfit,shirt:['#456c87','#597a68','#906b71','#6c6587','#ba8659','#548b98'][(a.outfit+index+state.month)%6]};
}
