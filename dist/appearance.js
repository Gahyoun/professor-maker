import {EXPRESSIONS,normalizeExpression} from './student-reaction.js';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const shade=(hex,amount)=>'#'+hex.slice(1).match(/../g).map(channel=>Math.max(0,Math.min(255,parseInt(channel,16)+amount)).toString(16).padStart(2,'0')).join('');
// Independent cosmetic RNG: appearance never changes ability or simulation rolls.
export function studentAppearance(seed,gender){
 let n=Number(seed)>>>0;const rand=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return (n+.5)/4294967296;};
 const mean=gender==='male'?2:gender==='female'?3.5:3.5;
 const gaussian=Math.sqrt(-2*Math.log(rand()))*Math.cos(2*Math.PI*rand());
 const rare=rand();return {hairLength:rare<(gender==='male'?.006:0)?0:Math.max(1,Math.min(6,gender==='female'?1+Math.floor(rare*6):Math.round(mean+gaussian*.85))),hair:['#282827','#3b302b','#49392f','#242836','#675046','#352e2d'][Math.floor(rand()*6)],skin:['#f0c8a7','#e6b99a','#d6a383','#edc2a1','#cba080'][Math.floor(rand()*5)],shirt:['#456c87','#597a68','#906b71','#6c6587'][Math.floor(rand()*4)],glasses:rand()<.3,eyes:Math.floor(rand()*3),face:Math.floor(rand()*3),outfit:Math.floor(rand()*6),fringe:Math.floor(rand()*16),brows:Math.floor(rand()*3),glassesShape:Math.floor(rand()*2),curly:((Math.imul(Number(seed)^0x37ac,2654435761)>>>0)%5)===0};
}
const FRINGES=[
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
export function renderPortrait(appearance,label='학생 도트 초상화',expression='neutral',pose='standing'){
 expression=normalizeExpression(expression);pose=['standing','seated','experiment'].includes(pose)?pose:'standing';
 label=escape(label);
 const a=appearance,l=a.hairLength??3,styles=['까까머리','크롭컷','짧은 머리','중간 길이 머리','단발','어깨 길이 머리','긴 머리'];
 const fringeIndex=(a.fringe??0)%FRINGES.length,locks=FRINGES[fringeIndex];
 // Soft miniroom sprite on a 40×62 grid (8 viewBox units per dot), finished with a coloured outline pass.
 const W=40,H=62,OY=2,g=Array.from({length:H},()=>Array(W).fill(null));
 const put=(x,y,c)=>{y+=OY;if(x>=0&&x<W&&y>=0&&y<H)g[y][x]=c;};
 const get=(x,y)=>g[y+OY]?.[x];
 const row=(y,x0,x1,c)=>{for(let x=x0;x<=x1;x++)put(x,y,c);};
 const box=(x0,y0,x1,y1,c)=>{for(let y=y0;y<=y1;y++)row(y,x0,x1,c);};
 const ell=(rx,ry,y0,y1,c)=>{for(let y=y0;y<=y1;y++){const d=(y+.5-15)/ry;if(Math.abs(d)>1)continue;const k=Math.round(rx*Math.sqrt(1-d*d));row(y,20-k,19+k,c);}};
 const hair=shade(a.hair,22),hairDk=shade(a.hair,6),hairEdge=shade(a.hair,-8),hairHl=shade(a.hair,78),hairLine=shade(a.hair,4);
 const skin=shade(a.skin,10),skinSh=shade(skin,-24),skinHl=shade(skin,14);
 const shirt=a.shirt,pants='#3a4d6b',white='#f7f6f0';
 // back hair
 if(l>0){const endY={1:17,2:22,3:27,4:33,5:41,6:50}[l],x0=l>=4?6:7,x1=l>=4?33:32;
  ell(13.5,12.5,3,15,hairDk);
  for(let y=15;y<=endY;y++){if(y>=endY-1){for(let x=x0;x<=x1;x++)if((x+y)%(y===endY?3:2)===0)put(x,y,hairDk);}else row(y,x0,x1,hairDk);}
  for(let y=12;y<endY-1;y++){put(x0,y,hairEdge);put(x1,y,hairEdge);}}
 // ears + face
 box(8,19,8,22,skin);box(31,19,31,22,skin);put(8,21,skinSh);put(31,21,skinSh);
 [8,10,11,11,11,11,11,11,11,11,11,11,11,10,10,9,8,7,5,3].forEach((k,i)=>row(11+i,20-k,19+k,skin));
 for(let y=21;y<=28;y++){const k=[11,11,10,10,9,8,7,5][y-21];put(19+k,y,skinSh);}
 if(l===0){ell(11.5,11,4,13,shade(a.hair,55));for(let y=5;y<13;y++)for(let x=10;x<30;x++)if(get(x,y)&&((x+y)%3===0))put(x,y,shade(a.hair,75));}
 // body
 box(18,31,21,32,skin);row(31,18,21,skinSh);
 box(14,46,25,47,pants);box(15,48,18,54,pants);box(21,48,24,54,pants);put(18,50,shade(pants,-18));put(21,50,shade(pants,-18));
 row(55,15,18,'#f2efe8');row(55,21,24,'#f2efe8');
 box(14,56,18,58,'#4b3a42');box(21,56,25,58,'#4b3a42');row(56,15,17,'#76616b');row(56,22,24,'#76616b');
 const outfit=a.outfit??0,top=[white,shirt,shirt,'#f6f5ee','#e9dfcf','#2f3d55'][outfit];
 row(33,14,25,top);box(13,34,26,45,top);box(10,34,12,43,top);box(27,34,29,43,top);
 for(let y=35;y<=43;y++){put(12,y,shade(top,-20));put(27,y,shade(top,-20));}
 box(10,44,12,45,skin);box(27,44,29,45,skin);
 if(outfit===0){[[17,22],[18,21],[18,21],[19,20]].forEach(([p,q],i)=>row(33+i,p,q,shirt));for(let y=37;y<=48;y++)put(20,y,'#d3d9de');row(40,15,17,'#d3d9de');box(13,46,26,48,white);for(let y=46;y<=48;y++)put(20,y,'#d3d9de');}
 if(outfit===1){box(18,33,21,45,'#f6f3ea');[37,40,43].forEach(y=>{put(17,y,'#ead9a8');put(22,y,'#ead9a8');});}
 if(outfit===2){row(33,14,25,shade(shirt,-26));row(34,15,24,shade(shirt,-14));[35,36,37,38].forEach(y=>{put(18,y,'#f4f1ea');put(21,y,'#f4f1ea');});box(15,41,24,44,shade(shirt,-14));}
 if(outfit===3){row(33,13,26,shirt);row(34,13,26,shirt);row(35,13,16,shirt);row(35,23,26,shirt);row(34,18,21,'#f6f5ee');row(33,19,20,'#f6f5ee');box(18,35,21,36,'#d9606e');row(37,19,20,'#c24e5c');row(43,10,12,shirt);row(43,27,29,shirt);}
 if(outfit===4){[37,41].forEach(y=>{row(y,13,26,shirt);row(y,10,12,shirt);row(y,27,29,shirt);});row(33,16,23,'#f6f3ea');}
 if(outfit===5){[[17,22],[18,21],[18,21],[19,20],[19,20]].forEach(([p,q],i)=>row(33+i,p,q,'#f6f3ea'));box(19,34,20,40,shirt);put(17,41,'#cdb56e');put(17,44,'#cdb56e');}
 // front hair
 if(l>0){ell(13.5,12.5,3,12,hair);
  const max=l===1?2:5;
  row(11,9,30,hairDk);for(let x=8;x<=31;x++){const v=locks[Math.floor((x-8)*30/24)]??4,saw=[0,1,2,1][(x+fringeIndex)%4],len=Math.max(1,Math.min(max,Math.round(v*.35)+saw));for(let y=12;y<12+len;y++)put(x,y,y===11+len&&saw===2?hairEdge:((x+fringeIndex)%4===0&&y<11+len)?hairLine:hair);}
  if(l>=2){const e=l>=3?27:24;box(7,12,9,e-2,hair);row(e-1,8,9,hair);put(9,e,hair);box(30,12,32,e-2,hair);row(e-1,30,31,hair);put(30,e,hair);put(9,16,hairLine);put(30,16,hairLine);}
  row(8,10,12,hairHl);row(7,13,15,hairHl);row(8,18,21,hairHl);row(7,24,26,hairHl);row(8,27,28,hairHl);
  put(16,7,shade(hair,40));put(22,8,shade(hair,40));}
 // Soft curls follow the crown and sides instead of hiding the bangs.
 if(a.curly&&l>0){for(let x=8;x<=31;x+=4){box(x,7+(x%3),x+2,9+(x%3),hair);put(x+1,7+(x%3),hairHl);}for(let y=14;y<(l>=4?{4:33,5:41,6:50}[l]:25);y+=4){box(6,y,8,y+2,hair);box(31,y+1,33,y+3,hair);put(7,y,hairHl);put(32,y+1,hairHl);}}
 // brows only where the forehead shows
 [[12,15],[24,27]].forEach(([p,q])=>{for(let x=p;x<=q;x++)if(get(x,15)===skin)put(x,15,shade(a.hair,10));});
 // eyes: 0 dot · 1 line · 2 squint (simple, mini-hompy style)
 const ey=17,lash='#253247',kind=a.eyes??0;
 [[13,15],[24,26]].forEach(([x0,x1])=>{const c=x0+1;
  if(expression==='surprised'){box(c,ey+1,c,ey+4,lash);put(c-1,ey+2,lash);put(c+1,ey+2,lash);}
  else if(['happy','delighted','relieved'].includes(expression)){put(x0,ey+3,lash);put(c,ey+2,lash);put(x1,ey+3,lash);}
  else if(['focused','tired','sad'].includes(expression)){row(ey+3,x0,x1,lash);if(expression==='sad')put(x0,ey+2,lash);}
  else if(kind===0){box(x0,ey+2,x1,ey+6,lash);row(ey+1,x0,x1,shade(a.hair,2));put(x0,ey+2,'#fff8eb');put(x0+1,ey+2,'#fff8eb');put(x1,ey+6,'#465773');}
  else if(kind===1){box(c,ey+2,c+1,ey+5,lash);put(c,ey+2,'#fff8eb');}
  else{put(x0,ey+4,lash);put(c,ey+3,lash);put(x1,ey+4,lash);}});
 // cheeks, mouth
 row(24,10,12,'#f5b0b5');row(24,27,29,'#f5b0b5');row(25,10,13,'#ed919d');row(25,26,29,'#ed919d');put(11,24,'#ffe0da');put(28,24,'#ffe0da');
 put(20,24,skinSh);
 const mouth='#a24c55';
 if(expression==='surprised'||expression==='delighted'){box(19,26,21,28,mouth);put(20,28,'#e98a8a');}
 else if(['sad','worried','tired'].includes(expression)){row(26,19,21,mouth);put(18,27,mouth);put(22,27,mouth);if(expression==='sad')box(14,22,14,24,'#a4cedd');if(expression==='worried')box(31,17,31,19,'#a4cedd');}
 else if(['happy','relieved'].includes(expression)){put(18,26,mouth);put(21,26,mouth);row(27,19,20,mouth);}
 else if((a.face??0)===0){put(18,26,mouth);put(21,26,mouth);row(27,19,20,mouth);}
 else if(a.face===1){row(26,19,21,mouth);put(20,27,'#e98a8a');}
 else{put(18,26,mouth);put(21,26,mouth);put(19,27,mouth);put(20,27,mouth);}
 if(a.glasses){const f='#4b4560',sq=a.glassesShape===1;[[10,17],[22,29]].forEach(([p,q])=>{row(ey+1,sq?p+1:p+2,sq?q-1:q-2,f);row(ey+7,sq?p+1:p+2,sq?q-1:q-2,f);for(let y=ey+2;y<=ey+6;y++){put(p+1,y,f);put(q-1,y,f);}});row(ey+3,17,22,f);put(12,ey+2,'#ebeef3');put(24,ey+2,'#ebeef3');}
 // Bent knees, forward sleeves and hands form a real seated pose.
 if(pose==='seated'){for(let y=46;y<=58;y++)for(let x=10;x<=29;x++)put(x,y,null);
  box(13,46,26,49,pants);box(22,49,27,51,pants);box(24,51,27,54,pants);box(14,49,17,53,pants);box(14,54,18,56,'#4b3a42');box(24,55,29,57,'#4b3a42');
  box(9,36,12,41,top);box(27,36,30,41,top);box(9,41,16,43,top);box(23,41,30,43,top);box(15,42,17,43,skin);box(22,42,24,43,skin);}
 if(pose==='experiment'){box(27,36,30,41,top);box(29,39,34,41,top);box(33,39,35,40,skin);box(8,39,14,41,top);box(13,40,16,41,skin);}
 // coloured outline
 const rounded=Array.from({length:H},()=>Array(W).fill(null));for(let y=0;y<H;y++){const yy=y<=34?y:34+Math.round((y-34)*.86);for(let x=0;x<W;x++)if(g[y][x])rounded[yy][x]=g[y][x];}g.splice(0,H,...rounded);
 const out=g.map(r=>r.slice());
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(!g[y][x]){const n=[g[y-1]?.[x],g[y+1]?.[x],g[y][x-1],g[y][x+1]].find(Boolean);if(n)out[y][x]=shade(n,-58);}
 let rects='';
 for(let y=0;y<H;y++){let x=0;while(x<W){const c=out[y][x];if(!c){x++;continue;}let e=x;while(e+1<W&&out[y][e+1]===c)e++;rects+=`<rect x="${x}" y="${y}" width="${e-x+1}" height="1" fill="${c}"/>`;x=e+1;}}
 const title=`${label} · ${EXPRESSIONS[expression]} · ${styles[l]}${a.curly&&l?' · 곱슬머리':''}${a.glasses?' · 안경':''}${l?` · 앞머리 ${fringeIndex+1}`:''}`;
 return `<svg class="portrait" data-expression="${expression}" data-pose="${pose}" data-outfit="${outfit}" viewBox="0 0 320 496" role="img" aria-label="${title}"><title>${title}</title><g class="hair-fringe chibi-grid ${expression==='sad'?'expression-tear':''}" shape-rendering="crispEdges" transform="translate(0 24) scale(8)">${rects}</g></svg>`;
}

export function weeklyAppearance(state,index=0){
 const a=studentAppearance(state.creationSeed??state.seed,state.gender),month=state.visualMonth??state.month;
 const sequence=(a.outfit+Math.max(0,state.month-1)*5+index),outfit=state.professorProfile?.labMode==='dry'?1+sequence%5:sequence%6;
 return {...a,...(state.gender==='male'&&state.service?.trainingReturnMonth!==undefined&&month>=state.service.trainingReturnMonth&&month<state.service.trainingReturnMonth+2?{hairLength:0}:{}),outfit,shirt:['#456c87','#597a68','#906b71','#6c6587','#ba8659','#548b98'][(a.outfit+index+state.month)%6]};
}
