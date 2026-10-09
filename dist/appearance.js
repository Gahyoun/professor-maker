// Independent cosmetic RNG: appearance never changes ability or simulation rolls.
export function studentAppearance(seed,gender){
 let n=Number(seed)>>>0;const rand=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return (n+.5)/4294967296;};
 const mean=gender==='male'?1.9:gender==='female'?4.3:3.1;
 const gaussian=Math.sqrt(-2*Math.log(rand()))*Math.cos(2*Math.PI*rand());
 return {hairLength:Math.max(0,Math.min(6,Math.round(mean+gaussian*1.65))),hair:['#282827','#3b302b','#49392f','#242836'][Math.floor(rand()*4)],skin:['#f0c8a7','#e6b99a','#d6a383'][Math.floor(rand()*3)],shirt:['#456c87','#597a68','#906b71','#6c6587'][Math.floor(rand()*4)],glasses:rand()<.3,eyes:Math.floor(rand()*3),face:Math.floor(rand()*3)};
}
export function renderPortrait(appearance,label='학생 도트 초상화'){
 const a=appearance,l=a.hairLength,styles=['대머리','삭발','짧은 머리','중간 길이 머리','단발','어깨 길이 머리','긴 머리'];
 const back=l>=4?`<path d="M17 20h46v${l===4?45:l===5?55:64}H17z" fill="${a.hair}"/>`:'';
 const top=l===0?'':l===1?`<path d="M24 22h32v6H24zM20 28h6v6h-6zm36 0h5v6h-5z" fill="${a.hair}"/>`:l===2?`<path d="M20 24v17h6V29h12v-7h12v7h8v12h5V21h-7v-7H30v5H20z" fill="${a.hair}"/>`:`<path d="M19 23v24h7V31h8v-9h13v7h10v18h6V20h-8v-8H28v6h-9z" fill="${a.hair}"/>`;
 return `<svg class="portrait" viewBox="0 0 80 90" role="img" aria-label="${label} · ${styles[l]}"><title>${label} · ${styles[l]}</title><rect width="80" height="90" fill="#e9edf0"/><g shape-rendering="crispEdges">${back}<path d="M14 90V70h9V60h34v10h9v20" fill="${a.shirt}"/><path d="M30 55h20v14H30z" fill="${a.skin}"/><path d="M24 23h32v9h5v25h-7v${a.face+6}H28v-${a.face+6}h-7V32h3z" fill="${a.skin}"/>${top}<path d="M29 40h${a.eyes+3}v4h-${a.eyes+3}zm17 0h${a.eyes+3}v4h-${a.eyes+3}" fill="#292e33"/>${a.glasses?'<path d="M26 38h12v9H26zm16 0h12v9H42zM38 40h4" stroke="#44525d" stroke-width="2" fill="none"/>':''}<path d="M35 53h10v2H35z" fill="#995d50"/><path d="M23 68h10l7 10 7-10h10v22H23z" fill="#f7f7f4"/><path d="M38 78h4v12h-4z" fill="#d1d9df"/></g></svg>`;
}
