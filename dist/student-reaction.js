// Visual reactions are derived from the recorded outcome; never draw simulation RNG.
export const EXPRESSIONS=Object.freeze({neutral:'평온한 표정',happy:'미소 짓는 표정',delighted:'환하게 기뻐하는 표정',focused:'집중하는 표정',worried:'걱정하는 표정',sad:'속상한 표정',tired:'지친 표정',relieved:'안도하는 표정',surprised:'놀란 표정'});
export const normalizeExpression=value=>Object.hasOwn(EXPRESSIONS,value)?value:'neutral';
export function studentEmotion(state,result={}, {idle=false}={}){
 if(idle){if(state.pending?.kind==='monthly-issue'){if(state.pending.id==='grant-selected')return 'surprised';if(state.pending.id==='presentation-award')return 'delighted';if(state.pending.id==='grant-rejected')return 'sad';}if(['thesis','failure-counsel','presentation-recovery'].includes(state.pending?.kind))return 'worried';if(state.hidden?.stress>=70||state.hidden?.stamina<300)return 'tired';return 'neutral';}
 if(result.outcome==='presentation_failed'||result.performed===false)return 'sad';
 if(Number.isFinite(result.successRate)){const r=result.successRate;return r>=.9?'delighted':r>=.7?'happy':r>=.4?'focused':r>0?'worried':'sad';}
 if(result.outcome==='presented')return 'delighted';
 if(result.actual==='rest'||result.outcome==='recovered')return 'relieved';
 if(result.actual==='travel')return 'happy';
 if(result.outcome==='inconclusive'||result.outcome==='not_completed')return 'worried';
 if(result.outcome==='completed')return 'delighted';
 if(result.outcome==='explored')return 'surprised';
 return ['study','coursework','experiment','research','analysis','paper','language','teach','industry'].includes(result.actual)?'focused':'neutral';
}
export function expressionFace(a,expression){
 const e=normalizeExpression(expression),ink=['#27374a','#49372f','#2b333b'][a.eyes??0];
 const openEyes=`<path d="M28 40h8v8h-8zm16 0h8v8h-8z" fill="#fbf9ec"/><path d="M30 41h5v6h-5zm14 0h5v6h-5z" fill="${ink}"/><path d="M31 41h1.5v2h-1.5zm14 0h1.5v2h-1.5z" fill="#fff"/>`;
 const eyes=({happy:'M28 44v-1h1v-1h6v1h1v1h-2v-1h-4v1zM44 44v-1h1v-1h6v1h1v1h-2v-1h-4v1z',delighted:'M28 44v-2h1v-1h1v-1h4v1h1v1h1v2h-2v-1h-4v1zM44 44v-2h1v-1h1v-1h4v1h1v1h1v2h-2v-1h-4v1z',relieved:'M28 43h2v1h4v-1h2v2h-1v1h-6v-1h-1zM44 43h2v1h4v-1h2v2h-1v1h-6v-1h-1z',sad:'M28 44h2v1h4v-1h2v2h-1v1h-6v-1h-1zM44 44h2v1h4v-1h2v2h-1v1h-6v-1h-1z',tired:'M28 43h8v1h-2v3h-4v-3h-2zM44 43h8v1h-2v3h-4v-3h-2z'})[e];
 const brows=({sad:'M28 38h3v-1h3v-1h2v1h-1v1h-3v1h-4zM44 36h2v1h3v1h3v1h-4v-1h-3v-1h-1z',worried:'M28 37h3v-1h3v-1h2v1h-1v1h-3v1h-4zM44 35h2v1h3v1h3v1h-4v-1h-3v-1h-1z',focused:'M28 35h3v1h5v1h-6v-1h-2zM44 36h5v-1h3v1h-2v1h-6z',surprised:'M28 35h8v1h-8zM44 35h8v1h-8z'})[e]??'M28 36h1v-.5h7v.5h1v1h-9zM44 36h1v-.5h7v.5h1v1h-9z';
 const mouth=({neutral:'M35.5 54h1v1h7v-1h1v2h-1v1h-7v-1h-1z',happy:'M35 53h1v1h8v-1h1v2h-1v1h-8v-1h-1z',delighted:'M35 53h10v4h-1v2h-8v-2h-1z',focused:'M37 55h6v1h-6z',worried:'M36 56h1v-1h6v1h1v1h-2v-1h-4v1h-2z',sad:'M36 56h1v-1h6v1h1v1h-2v-1h-4v1h-2z',tired:'M36 55h8v1h-8z',relieved:'M36 54h2v1h4v-1h2v2h-1v1h-6v-1h-1z',surprised:'M38 53h4v1h1v4h-1v1h-4v-1h-1v-4h1z'})[e];
 const accent=e==='worried'?'<path class="expression-sweat" d="M58 36h1v2h1v3h-1v1h-2v-1h-1v-3h1v-2z" fill="#91c4d8"/><path d="M57 39h.5v1h-.5z" fill="#eaf8fc"/>':e==='sad'?'<path class="expression-tear" d="M30 48h1v3h1v3h-1v1h-2v-1h-1v-3h1v-3z" fill="#9fc6d8" opacity=".8"/>':e==='delighted'?'<path d="M37 57h6v1h-6z" fill="#e8a0a1"/>':'';
 return {eyes:`<path d="${brows}" fill="${a.hair}"/>${eyes?`<path d="${eyes}" fill="${ink}"/>`:openEyes}`,mouth:`<path d="${mouth}" fill="#ae7365"/>${accent}`};
}
const star='<path d="M0-6l2 4 4 2-4 2-2 4-2-4-4-2 4-2z"/>';
const diamond='<path d="M0-5l3 5-3 5-3-5z"/>';
// Local coordinates center on the head; the avatar is painted after these effects.
export function reactionEffects(expression,index=0){
 const e=normalizeExpression(expression),variant=((index%3)+3)%3;
 if(['neutral','focused','tired'].includes(e))return '';
 let body='';
 if(['happy','delighted','surprised'].includes(e)){
  const colors=['#f4d27a','#f8d7b4','#bddeda'],points=[[-38,-14],[-22,-39],[24,-37],[39,-8],[33,18],[-35,17]],count=e==='delighted'?6:3;
  body=`<circle class="anime-halo" r="29" fill="#fff0b8" opacity=".2"/>`;
  if(e==='delighted')body+=`<g class="anime-rays" fill="#efd191" opacity=".7"><path d="M-2-42h4v10h-4zM-2 32h4v10h-4zM32-2h10v4H32zM-42-2h10v4h-10z"/></g>`;
  body+=points.slice(0,count).map(([dx,dy],i)=>`<g class="anime-flight" style="--dx:${dx}px;--dy:${dy}px;--delay:${i*60}ms"><g fill="${colors[(i+variant)%3]}" class="anime-twinkle">${(i+variant)%3===1?diamond:star}</g></g>`).join('');
 }else if(e==='relieved')body='<g class="anime-relief" fill="none" stroke="#bddad2" stroke-width="1.5"><path d="M-34-9q-5 5 0 10m-5-13q-7 8 0 16M31-17q7-7 12 0q-5 7-12 0z"/></g>';
 else if(e==='sad'||e==='worried')body=`<g class="anime-gloom" fill="#7d90b0" opacity=".65"><path d="M-31-24h2v12h-2zM-26-29h2v15h-2zM-21-32h2v14h-2zM25-29h2v16h-2zM30-24h2v12h-2z"/></g>${e==='sad'?'<g class="anime-rain" fill="#a2b9d0"><path d="M-33 0h1v6h-1zM30 4h1v7h-1zM-26 12h1v4h-1z"/></g>':''}`;
 return `<g class="student-reaction reaction-${e} variation-${variant}" aria-hidden="true">${body}</g>`;
}
