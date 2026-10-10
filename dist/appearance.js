const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const shade=(hex,amount)=>'#'+hex.slice(1).match(/../g).map(channel=>Math.max(0,Math.min(255,parseInt(channel,16)+amount)).toString(16).padStart(2,'0')).join('');
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
 const hairEnd=l===4?65:l===5?75:84;
 const back=l>=4?`<path d="M20 20h40v8h2v13h1v${hairEnd-46}h-1v3h-2v2h-3v-1h-4v-2H27v2h-4v1h-3v-2h-2v-3h-1V41h1V28h2z" fill="${shade(a.hair,-9)}"/>${texture===1?`<path d="M15 48h5v8h-5zm0 13h5v8h-5zm46-10h5v9h-5zm0 13h5v9h-5z" fill="${a.hair}"/>`:texture===2&&l>=5?`<path d="M61 39h6v3h3v7h-3v18h-2v6h-3v4h-4V45z" fill="${a.hair}"/>`:''}`:'';
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
 // Quarter-unit pixels add real detail; enlarging only the SVG canvas would not.
 const fineLocks=Array.from({length:60},(_,i)=>{const h=locks[Math.floor(i/2)],next=locks[Math.min(29,Math.floor(i/2)+1)];return Math.max(0,l===1?Math.min(4,h):i%2?Math.round((h+next)*2)/4:h);});
 const fringe=l===0?'':`<g class="hair-fringe" fill="${a.hair}"><path d="M25 21h30v8H25z"/>${fineLocks.map((height,i)=>height?`<path d="M${25+i*.5} 29h.5v${Math.max(.25,height-.25)}h-.25v.25h-.25z"/>`:'').join('')}<g fill="${shade(a.hair,22)}">${fineLocks.map((height,i)=>height>2&&i%5===1?`<path d="M${25+i*.5} 27.5h.25v${height-1.5}h-.25z"/>`:'').join('')}</g><g fill="${shade(a.hair,-16)}">${fineLocks.map((height,i)=>height>3&&i%5===3?`<path d="M${25+i*.5} ${28+height}h.25v.5h-.25z"/>`:'').join('')}</g></g>`;
 const detail=l===0?'':`<g class="hair-detail" fill="#fff" opacity=".2"><path d="M28 17h4v1h-4zm5-2h5v1h-5zm7 0h4v1h-4zm5 2h5v1h-5zm6 3h4v1h-4zM24 22h2v2h-2zm3-2h4v1h-4zm5-1h7v1h-7zm9 1h6v1h-6zm8 2h4v1h-4zM21 29h.5v9H21zm38-2h.5v12H59zM23 23h.5v4H23zm33-4h.5v5H56z${l>=4?'M18 44h.5v13H18zm2 15h.5v7H20zM60 45h.5v16H60zm2 18h.5v6H62z':''}"/></g>`;
 const faceDetails=`<g class="face-pixels"><g fill="${shade(a.skin,-18)}"><path d="M58 36h.75v12H58zM56.5 49h.75v5h-.75zM54 55h1v2h-1zM51 59h1v1h-1zM32 63h16v.75H32zM31 64h1v2h-1zM32 66h16v.75H32z"/></g><g fill="${shade(a.skin,16)}"><path d="M24 36h.5v10H24zM26 48h1v2h-1zM28 51h1v1h-1zM39 49h.5v1.5H39zM32 58h1v1h-1z"/></g><g fill="#b27e69"><path d="M28 38h8v.75h-8zM45 38h7v.75h-7zM30 49h6v.5h-6zM45 49h6v.5h-6z"/></g><g fill="#ecc6c1"><path d="M26 50.5h1v1h-1zm2.5 1h1v1h-1zm1.5-1h.5v.5h-.5zM49 50.5h1v1h-1zm2.5 1h1v1h-1zm1.5-1h.5v.5h-.5z"/></g><g fill="#ffffff"><path d="M35 46h.75v.75H35zM48 46h.75v.75H48z"/></g></g>`;
 const outfitDetails=`<g class="outfit-pixels"><g fill="#243344" opacity=".22"><path d="M16 72h1v22h-1zM63 72h1v22h-1zM17 89h5v.5h-5zm40 0h6v.5h-6zM25 70h.5v5H25zm29 0h.5v5H54zM16 94h48v.75H16zM36 98h1v4h-1zm1 4h6v.5h-6z"/></g><g fill="#fff" opacity=".4"><path d="M17 73h.5v9H17zM62 73h.5v9H62zM18 90h4v.5h-4zm40 0h4v.5h-4zM25 117h11v.5H25zm18 0h11v.5H43z"/></g>${[0,2,3].includes(a.outfit??0)?'<g fill="#7f939d"><path d="M39.5 81h1v1h-1zm0 5h1v1h-1zm0 5h1v1h-1z"/></g><path d="M23 79h8v6h-8z" fill="#9eaeb7" opacity=".25"/><path d="M23 79h8v.5h-8z" fill="#607c8d"/>':a.outfit===1?'<path d="M28 69h4v1h-4zm16 0h4v1h-4zM32 70h.5v6H32zm15 0h.5v6H47zM29 87h22v.5H29zM29 88h.5v4H29zm21 0h.5v4H50z" fill="#e9ddc9" opacity=".55"/>':a.outfit===5?'<path d="M39.5 77h.5v12h-.5zM22 81h10v.5H22zm0 .5h.5v6H22zm9.5 0h.5v6h-.5z" fill="#c1ba9d" opacity=".6"/>':''}</g>`;
 return `<svg class="portrait" viewBox="0 0 320 496" role="img" aria-label="${label} · ${styles[l]}${l?` · 앞머리 ${fringeIndex+1}`:``}"><title>${label} · ${styles[l]}${l?` · 앞머리 ${fringeIndex+1}`:``}</title><g shape-rendering="crispEdges" transform="scale(4)">${back}<path d="M26 92h28v14H26zM27 105h9v12h-9zm17 0h9v12h-9z" fill="#344963"/><path d="M24 116h14v7H24zm18 0h14v7H42z" fill="#283440"/><path d="M15 74h9v22h-9zm41 0h9v22h-9z" fill="${a.skin}"/><path d="M14 96V70h12V65h28v5h12v26H14z" fill="${a.shirt}"/><path d="M30 55h20v14H30z" fill="${a.skin}"/><path d="M26 23h28v2h2v7h3v3h2v17h-1v3h-2v3h-3v2h-3v2h-4v${a.face+1}H32v-${a.face+1}h-4v-2h-3v-2h-3v-3h-2v-3h-1V35h2v-3h3v-7h2z" fill="${a.skin}"/>${top}${crown}${fringe}${detail}<path d="M28 36h1v-.5h7v.5h1v${a.brows===2?1.5:1}h-9zM44 36h1v-.5h7v.5h1v${a.brows===2?1.5:1}h-9z" fill="${a.hair}"/><path d="M28 39h9v10h-9zm16 0h9v10h-9" fill="#fbf9ec"/><path d="M31 40h6v8h-6zm13 0h6v8h-6z" fill="${['#27374a','#49372f','#2b333b'][a.eyes??0]}"/><path d="M32 40h2v3h-2zm13 0h2v3h-2z" fill="white"/><path d="M25 50h7v3h-7zm23 0h7v3h-7z" fill="#d9918e" opacity=".7"/>${a.glasses?(a.glassesShape===1?'<rect x="26" y="37" width="12" height="12" rx="3" stroke="#44525d" stroke-width="2" fill="none"/><rect x="42" y="37" width="12" height="12" rx="3" stroke="#44525d" stroke-width="2" fill="none"/><path d="M38 40h4" stroke="#44525d" stroke-width="2"/>':'<path d="M26 38h12v9H26zm16 0h12v9H42zM38 40h4" stroke="#44525d" stroke-width="2" fill="none"/>'):''}${faceDetails}<path d="M34.5 54h1.5v1h1v1h7v-1h1v-1h1.5v3h-1v1h-10v-1h-1z" fill="#995d50"/>${[
 `<path d="M14 70h12v-5h7l7 13 7-13h7v5h12v26H14z" fill="#f7f7f4"/><path d="M38 78h4v18h-4z" fill="#d1d9df"/>`,
 `<path d="M14 70h12v-5h28v5h12v26H14z" fill="${a.shirt}"/><path d="M36 79h8v7h-8" fill="#eee3cf"/>`,
 `<path d="M14 70h12v-5h28v5h12v26H14z" fill="#edf0e9"/><path d="M39 70h2v26" fill="#a5b4be"/>`,
 `<path d="M14 70h12v-5h7l7 10 7-10h7v5h12v26H14z" fill="#f6f5ec"/><path d="M38 76h4v20h-4z" fill="${a.shirt}"/><path d="M23 79h8v5h-8z" fill="#8aa2b4"/>`,
 `<path d="M26 67h28v4H26zM14 78h52v4H14zM14 88h52v4H14z" fill="#e7ded0"/>`,
 `<path d="M26 66h28v8H26z" fill="#2d3c50"/><path d="M38 74h4v16h-4z" fill="#b2a77e"/>`
][a.outfit??0]}${outfitDetails}<g class="sprite-detail" fill="#ffffff" opacity=".17"><path d="M15 72h.5v21H15zM64 73h.5v19H64zM29 96h5v1.5h-5zm17 0h5v1.5h-5zM26 117h9v1h-9zm18 0h9v1h-9z"/></g><g class="clothing-seams" fill="#263c4c" opacity=".2"><path d="M22 73h.5v19H22zm35 0h.5v19H57zM26 92h9v.5h-9zm19 0h9v.5h-9zM27 98h7v.5h-7zm19 0h7v.5h-7zM34 105h.5v11H34zm11 0h.5v11H45z"/></g><g fill="#fff" opacity=".28"><path d="M28 107h.5v8H28zm22 0h.5v8H50zM25 119h10v.5H25zm19 0h10v.5H44z"/></g><path d="M39 48h1v2h1v1h-2z" fill="#b98266" opacity=".5"/></g></svg>`;
}

export function weeklyAppearance(state,index=0){const a=studentAppearance(state.creationSeed??state.seed,state.gender);return {...a,outfit:(a.outfit+Math.max(0,state.month-1)*5+index)%6,shirt:['#456c87','#597a68','#906b71','#6c6587','#ba8659','#548b98'][(a.outfit+index+state.month)%6]};}
