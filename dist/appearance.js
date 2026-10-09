const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
// Independent cosmetic RNG: appearance never changes ability or simulation rolls.
export function studentAppearance(seed,gender){
 let n=Number(seed)>>>0;const rand=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return (n+.5)/4294967296;};
 const mean=gender==='male'?2.8:gender==='female'?4.4:3.5;
 const gaussian=Math.sqrt(-2*Math.log(rand()))*Math.cos(2*Math.PI*rand());
 return {hairLength:rand()<.006?0:Math.max(1,Math.min(6,Math.round(mean+gaussian*1.15))),hair:['#282827','#3b302b','#49392f','#242836','#675046','#352e2d'][Math.floor(rand()*6)],skin:['#f0c8a7','#e6b99a','#d6a383','#edc2a1','#cba080'][Math.floor(rand()*5)],shirt:['#456c87','#597a68','#906b71','#6c6587'][Math.floor(rand()*4)],glasses:rand()<.3,eyes:Math.floor(rand()*3),face:Math.floor(rand()*3),outfit:Math.floor(rand()*6),fringe:Math.floor(rand()*8),brows:Math.floor(rand()*3),glassesShape:Math.floor(rand()*2)};
}
export function renderPortrait(appearance,label='학생 도트 초상화'){
 label=escape(label);
 const a=appearance,l=a.hairLength,styles=['대머리','삭발','짧은 머리','중간 길이 머리','단발','어깨 길이 머리','긴 머리'];
 const texture=(a.fringe??0)%3;
 const back=l>=4?`<path d="M17 20h46v${l===4?45:l===5?55:64}H17z" fill="${a.hair}"/>${texture===1?`<path d="M15 48h5v8h-5zm0 13h5v8h-5zm46-10h5v9h-5zm0 13h5v9h-5z" fill="${a.hair}"/>`:texture===2&&l>=5?`<path d="M61 39h9v10h-3v18h-5v10h-4V45z" fill="${a.hair}"/>`:''}`:'';
 const top=l===0?'':l===1?`<path d="M24 22h32v6H24zM20 28h6v6h-6zm36 0h5v6h-5z" fill="${a.hair}"/>`:l===2?`<path d="M20 24v17h6V29h12v-7h12v7h8v12h5V21h-7v-7H30v5H20z" fill="${a.hair}"/>`:`<path d="M19 23v24h7V31h8v-9h13v7h10v18h6V20h-8v-8H28v6h-9z" fill="${a.hair}"/>`;
 const crown=l<2?'':`<g fill="${a.hair}" class="hair-crown">${texture===0?'<path d="M25 16h8v-6h14v3h9v6H25z"/>':texture===1?'<path d="M19 19h7v-4h10v-5h15v5h9v6H19z"/>':'<path d="M23 17h9v-7h11v3h12v4h6v7H23z"/>'}</g>`;
 const fringe=l<2?'':`<g class="hair-fringe" fill="${a.hair}">${[
 '<path d="M25 27h30v6H25zM26 32h5v6h-5zm8 0h5v4h-5zm8 0h4v6h-4zm8 0h5v5h-5z"/>',
 '<path d="M25 27h29v4H25zM25 30h12v4H25zm0 4h9v4h-9zm1 4h5v4h-5zm25-8h5v7h-5z"/>',
 '<path d="M25 27h30v8H25zM25 35h5v3h-5zm8 0h5v2h-5zm8 0h4v3h-4zm9 0h5v2h-5z"/>',
 '<path d="M26 26h27v4H26zM26 30h8v5h-8zm2 5h4v5h-4zm21-5h6v6h-6z"/>',
 '<path d="M25 28h31v4H25zM25 32h6v7h-6zm8 0h5v5h-5zm9 0h5v6h-5zm8 0h6v7h-6z"/>',
 '<path d="M25 27h13v5H25zM25 32h8v5h-8zm18-5h12v5H43zm6 5h6v6h-6z"/>',
 '<path d="M25 27h31v4H25zM25 31h5v5h-5zm6 0h5v3h-5zm6 0h5v5h-5zm6 0h5v3h-5zm7 0h5v6h-5z"/>',
 '<path d="M25 27h30v4H25zM31 31h24v3H31zm6 3h18v3H37zm12 3h6v3h-6z"/>'
 ][a.fringe??0]}</g>`;
 const detail=l===0?'':`<g class="hair-detail" fill="#ffffff" opacity=".12"><path d="M28 19h4v1.5h-4zm6-2h9v1.5h-9zm11 2h7v1.5h-7zM21 29h1.5v9H21zm38-2h1.5v12H59z"/></g>`;
 return `<svg class="portrait" viewBox="0 0 160 248" role="img" aria-label="${label} · ${styles[l]}"><title>${label} · ${styles[l]}</title><g shape-rendering="crispEdges" transform="scale(2)">${back}<path d="M26 92h28v14H26zM27 105h9v12h-9zm17 0h9v12h-9z" fill="#344963"/><path d="M24 116h14v7H24zm18 0h14v7H42z" fill="#283440"/><path d="M15 74h9v22h-9zm41 0h9v22h-9z" fill="${a.skin}"/><path d="M17 94V70h9V65h28v5h9v24H17z" fill="${a.shirt}"/><path d="M30 55h20v14H30z" fill="${a.skin}"/><path d="M24 23h32v9h5v25h-7v${a.face+6}H28v-${a.face+6}h-7V32h3z" fill="${a.skin}"/>${top}${crown}${fringe}${detail}<path d="M28 35h9v${a.brows===2?3:2}h-9zm16 0h9v${a.brows===2?3:2}h-9" fill="${a.hair}"/><path d="M28 39h9v10h-9zm16 0h9v10h-9" fill="#fbf9ec"/><path d="M31 40h6v8h-6zm13 0h6v8h-6z" fill="${['#27374a','#49372f','#2b333b'][a.eyes??0]}"/><path d="M32 40h2v3h-2zm13 0h2v3h-2z" fill="white"/><path d="M25 50h7v3h-7zm23 0h7v3h-7z" fill="#d9918e" opacity=".7"/>${a.glasses?(a.glassesShape===1?'<rect x="26" y="37" width="12" height="12" rx="3" stroke="#44525d" stroke-width="2" fill="none"/><rect x="42" y="37" width="12" height="12" rx="3" stroke="#44525d" stroke-width="2" fill="none"/><path d="M38 40h4" stroke="#44525d" stroke-width="2"/>':'<path d="M26 38h12v9H26zm16 0h12v9H42zM38 40h4" stroke="#44525d" stroke-width="2" fill="none"/>'):''}<path d="M34 54h3v2h7v-2h3v4H34z" fill="#995d50"/>${[
 `<path d="M17 70h9v-5h7l7 13 7-13h7v5h9v24H17z" fill="#f7f7f4"/><path d="M38 78h4v16h-4z" fill="#d1d9df"/>`,
 `<path d="M17 70h9v-5h28v5h9v24H17z" fill="${a.shirt}"/><path d="M36 79h8v7h-8" fill="#eee3cf"/>`,
 `<path d="M17 70h9v-5h28v5h9v24H17z" fill="#edf0e9"/><path d="M39 70h2v24" fill="#a5b4be"/>`,
 `<path d="M17 70h9v-5h7l7 10 7-10h7v5h9v24H17z" fill="#f6f5ec"/><path d="M38 76h4v18h-4z" fill="${a.shirt}"/><path d="M23 79h8v5h-8z" fill="#8aa2b4"/>`,
 `<path d="M26 67h28v4H26zM17 78h46v4H17zM17 88h46v4H17z" fill="#e7ded0"/>`,
 `<path d="M26 66h28v8H26z" fill="#2d3c50"/><path d="M38 74h4v16h-4z" fill="#b2a77e"/>`
][a.outfit??0]}<g class="sprite-detail" fill="#ffffff" opacity=".17"><path d="M18 72h1.5v19H18zM60 73h1.5v17H60zM29 96h5v1.5h-5zm17 0h5v1.5h-5zM26 117h9v1h-9zm18 0h9v1h-9z"/></g><path d="M39 49h2v2h-2z" fill="#b98266" opacity=".5"/></g></svg>`;
}

export function weeklyAppearance(state,index=0){const a=studentAppearance(state.creationSeed??state.seed,state.gender);return {...a,outfit:(a.outfit+Math.max(0,state.month-1)*5+index)%6,shirt:['#456c87','#597a68','#906b71','#6c6587','#ba8659','#548b98'][(a.outfit+index+state.month)%6]};}
