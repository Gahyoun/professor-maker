const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
// Independent cosmetic RNG: appearance never changes ability or simulation rolls.
export function studentAppearance(seed,gender){
 let n=Number(seed)>>>0;const rand=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return (n+.5)/4294967296;};
 const mean=gender==='male'?2.8:gender==='female'?4.4:3.5;
 const gaussian=Math.sqrt(-2*Math.log(rand()))*Math.cos(2*Math.PI*rand());
 return {hairLength:rand()<.006?0:Math.max(1,Math.min(6,Math.round(mean+gaussian*1.15))),hair:['#282827','#3b302b','#49392f','#242836','#675046','#352e2d'][Math.floor(rand()*6)],skin:['#f0c8a7','#e6b99a','#d6a383','#edc2a1','#cba080'][Math.floor(rand()*5)],shirt:['#456c87','#597a68','#906b71','#6c6587'][Math.floor(rand()*4)],glasses:rand()<.3,eyes:Math.floor(rand()*3),face:Math.floor(rand()*3),outfit:Math.floor(rand()*6),fringe:Math.floor(rand()*16),brows:Math.floor(rand()*3),glassesShape:Math.floor(rand()*2)};
}
export function renderPortrait(appearance,label='학생 도트 초상화'){
 label=escape(label);
 const a=appearance,l=a.hairLength,styles=['대머리','크롭컷','짧은 머리','중간 길이 머리','단발','어깨 길이 머리','긴 머리'];
 const texture=(a.fringe??0)%3;
 const back=l>=4?`<path d="M17 20h46v${l===4?45:l===5?55:64}H17z" fill="${a.hair}"/>${texture===1?`<path d="M15 48h5v8h-5zm0 13h5v8h-5zm46-10h5v9h-5zm0 13h5v9h-5z" fill="${a.hair}"/>`:texture===2&&l>=5?`<path d="M61 39h9v10h-3v18h-5v10h-4V45z" fill="${a.hair}"/>`:''}`:'';
 const top=l===0?'':l===1?`<path d="M24 22h32v6H24zM20 28h6v6h-6zm36 0h5v6h-5z" fill="${a.hair}"/>`:l===2?`<path d="M20 24v17h6V29h12v-7h12v7h8v12h5V21h-7v-7H30v5H20z" fill="${a.hair}"/>`:`<path d="M19 23v24h7V31h8v-9h13v7h10v18h6V20h-8v-8H28v6h-9z" fill="${a.hair}"/>`;
 const crown=l<2?'':`<g fill="${a.hair}" class="hair-crown">${texture===0?'<path d="M23 19h3v-3h4v-2h5v-3h10v1h5v2h5v2h4v3H23z"/>':texture===1?'<path d="M19 21h3v-3h4v-3h7v-2h4v-3h10v2h7v3h4v3h3v3H19z"/>':'<path d="M21 21h3v-4h4v-2h5v-4h9v1h6v2h6v3h4v4h3v3H21z"/>'}</g>`;
 const fringes=[
  [5,6,6,5,4,3,5,6,7,6,5,3,4,5,6,5,4,3,5,6,7,6,4,3,4,5,6,6,5,4],
  [8,8,7,7,6,6,5,5,4,4,3,3,2,2,1,1,0,0,0,1,1,2,2,3,4,5,6,7,8,8],
  [6,6,6,7,7,6,6,6,7,7,6,6,6,7,7,6,6,6,7,7,6,6,6,7,7,6,6,6,7,7],
  [8,8,7,7,6,5,5,4,3,2,1,0,0,0,0,0,0,0,0,0,0,1,2,3,4,5,6,7,8,8],
  [8,7,6,5,4,3,4,5,6,7,6,5,4,3,4,5,6,7,6,5,4,3,4,5,6,7,8,7,6,5],
  [8,8,7,6,5,4,3,2,1,0,0,0,0,0,0,0,0,0,0,0,0,1,2,3,4,5,6,7,8,8],
  [4,5,6,5,4,3,4,5,6,7,6,5,4,3,4,5,6,5,4,3,4,5,6,7,6,5,4,3,4,5],
  [1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,7,7,6,6,5,5,4,4,3,3,4,5,6,7],
  [8,8,8,7,7,6,6,5,5,4,4,3,3,2,2,1,1,0,0,0,1,1,2,3,4,5,6,7,8,8],
  [7,7,7,6,6,6,5,5,5,4,4,4,6,6,6,7,7,7,5,5,5,4,4,4,6,6,6,7,7,7],
  [7,7,6,5,4,3,2,1,0,0,0,1,2,3,4,5,6,7,8,7,6,5,4,3,4,5,6,7,8,8],
  [6,7,7,6,5,4,5,6,6,5,4,3,4,5,6,6,5,4,3,4,5,6,7,7,6,5,4,5,6,7],
  [5,6,7,6,5,4,3,2,1,0,1,2,3,4,5,6,7,6,5,4,3,4,5,6,7,8,7,6,5,4],
  [8,8,7,7,6,5,4,3,2,1,0,0,0,0,0,0,0,0,0,0,1,2,3,4,5,6,7,7,8,8],
  [5,5,5,4,5,5,5,4,5,5,5,4,5,5,5,4,5,5,5,4,5,5,5,4,5,5,5,4,5,5],
  [8,8,7,7,6,6,5,5,4,4,3,3,2,2,1,1,1,2,3,4,5,6,7,8,8,7,6,5,4,3]
 ];
 const fringeIndex=(a.fringe??0)%fringes.length,locks=fringes[fringeIndex];
 // Hair uses a half-unit detail grid (one source pixel after the scale below).
 // Narrow locks and offset ends replace the former large rectangular fringe.
 const fringe=l===0?'':`<g class="hair-fringe" fill="${a.hair}"><path d="M25 21h30v8H25z"/>${locks.map((height,i)=>height?`<rect x="${25+i}" y="29" width="1" height="${l===1?Math.min(height,4):height}"/>`:'').join('')}<g fill="#fff" opacity=".16">${locks.map((height,i)=>height>2&&i%4===1?`<path d="M${25+i} 28h.5v${Math.max(1,height-2)}h-.5z"/>`:'').join('')}</g><g fill="#111" opacity=".16">${locks.map((height,i)=>height>3&&i%4===3?`<path d="M${25+i} ${28+height}h1v.5h-1z"/>`:'').join('')}</g></g>`;
 const detail=l===0?'':`<g class="hair-detail" fill="#fff" opacity=".2"><path d="M28 17h4v1h-4zm5-2h5v1h-5zm7 0h4v1h-4zm5 2h5v1h-5zm6 3h4v1h-4zM24 22h2v2h-2zm3-2h4v1h-4zm5-1h7v1h-7zm9 1h6v1h-6zm8 2h4v1h-4zM21 29h.5v9H21zm38-2h.5v12H59zM23 23h.5v4H23zm33-4h.5v5H56z${l>=4?'M18 44h.5v13H18zm2 15h.5v7H20zM60 45h.5v16H60zm2 18h.5v6H62z':''}"/></g>`;
 return `<svg class="portrait" viewBox="0 0 160 248" role="img" aria-label="${label} · ${styles[l]}${l?` · 앞머리 ${fringeIndex+1}`:``}"><title>${label} · ${styles[l]}${l?` · 앞머리 ${fringeIndex+1}`:``}</title><g shape-rendering="crispEdges" transform="scale(2)">${back}<path d="M26 92h28v14H26zM27 105h9v12h-9zm17 0h9v12h-9z" fill="#344963"/><path d="M24 116h14v7H24zm18 0h14v7H42z" fill="#283440"/><path d="M15 74h9v22h-9zm41 0h9v22h-9z" fill="${a.skin}"/><path d="M14 96V70h12V65h28v5h12v26H14z" fill="${a.shirt}"/><path d="M30 55h20v14H30z" fill="${a.skin}"/><path d="M24 23h32v9h5v25h-7v${a.face+6}H28v-${a.face+6}h-7V32h3z" fill="${a.skin}"/>${top}${crown}${fringe}${detail}<path d="M28 35h9v${a.brows===2?3:2}h-9zm16 0h9v${a.brows===2?3:2}h-9" fill="${a.hair}"/><path d="M28 39h9v10h-9zm16 0h9v10h-9" fill="#fbf9ec"/><path d="M31 40h6v8h-6zm13 0h6v8h-6z" fill="${['#27374a','#49372f','#2b333b'][a.eyes??0]}"/><path d="M32 40h2v3h-2zm13 0h2v3h-2z" fill="white"/><path d="M25 50h7v3h-7zm23 0h7v3h-7z" fill="#d9918e" opacity=".7"/>${a.glasses?(a.glassesShape===1?'<rect x="26" y="37" width="12" height="12" rx="3" stroke="#44525d" stroke-width="2" fill="none"/><rect x="42" y="37" width="12" height="12" rx="3" stroke="#44525d" stroke-width="2" fill="none"/><path d="M38 40h4" stroke="#44525d" stroke-width="2"/>':'<path d="M26 38h12v9H26zm16 0h12v9H42zM38 40h4" stroke="#44525d" stroke-width="2" fill="none"/>'):''}<path d="M34 54h3v2h7v-2h3v4H34z" fill="#995d50"/>${[
 `<path d="M14 70h12v-5h7l7 13 7-13h7v5h12v26H14z" fill="#f7f7f4"/><path d="M38 78h4v18h-4z" fill="#d1d9df"/>`,
 `<path d="M14 70h12v-5h28v5h12v26H14z" fill="${a.shirt}"/><path d="M36 79h8v7h-8" fill="#eee3cf"/>`,
 `<path d="M14 70h12v-5h28v5h12v26H14z" fill="#edf0e9"/><path d="M39 70h2v26" fill="#a5b4be"/>`,
 `<path d="M14 70h12v-5h7l7 10 7-10h7v5h12v26H14z" fill="#f6f5ec"/><path d="M38 76h4v20h-4z" fill="${a.shirt}"/><path d="M23 79h8v5h-8z" fill="#8aa2b4"/>`,
 `<path d="M26 67h28v4H26zM14 78h52v4H14zM14 88h52v4H14z" fill="#e7ded0"/>`,
 `<path d="M26 66h28v8H26z" fill="#2d3c50"/><path d="M38 74h4v16h-4z" fill="#b2a77e"/>`
][a.outfit??0]}<g class="sprite-detail" fill="#ffffff" opacity=".17"><path d="M15 72h.5v21H15zM64 73h.5v19H64zM29 96h5v1.5h-5zm17 0h5v1.5h-5zM26 117h9v1h-9zm18 0h9v1h-9z"/></g><g class="clothing-seams" fill="#263c4c" opacity=".2"><path d="M22 73h.5v19H22zm35 0h.5v19H57zM26 92h9v.5h-9zm19 0h9v.5h-9zM27 98h7v.5h-7zm19 0h7v.5h-7zM34 105h.5v11H34zm11 0h.5v11H45z"/></g><g fill="#fff" opacity=".28"><path d="M28 107h.5v8H28zm22 0h.5v8H50zM25 119h10v.5H25zm19 0h10v.5H44z"/></g><path d="M39 48h1v2h1v1h-2z" fill="#b98266" opacity=".5"/></g></svg>`;
}

export function weeklyAppearance(state,index=0){const a=studentAppearance(state.creationSeed??state.seed,state.gender);return {...a,outfit:(a.outfit+Math.max(0,state.month-1)*5+index)%6,shirt:['#456c87','#597a68','#906b71','#6c6587','#ba8659','#548b98'][(a.outfit+index+state.month)%6]};}
