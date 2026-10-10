import {EXPRESSIONS,normalizeExpression} from './student-reaction.js';

const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mix=(a,b,t)=>'#'+a.slice(1).match(/../g).map((v,i)=>Math.round(parseInt(v,16)*(1-t)+parseInt(b.slice(1+i*2,3+i*2),16)*t).toString(16).padStart(2,'0')).join('');

// Integer raster art: the public 320 × 496 frame is shared by every activity.
// Cosmetics are read from saved appearance fields and never consume game RNG.
export function renderStudentPortrait(a,label='학생 도트 초상화',expression='neutral',pose='standing'){
 expression=normalizeExpression(expression);
 pose=['standing','seated','experiment','lecturing'].includes(pose)?pose:'standing';
 const W=80,H=118,pixels=Array.from({length:H},()=>Array(W).fill(null));
 const put=(x,y,c)=>{if(x>=0&&x<W&&y>=0&&y<H)pixels[y][x]=c;};
 const row=(y,x0,x1,c)=>{for(let x=x0;x<=x1;x++)put(x,y,c);};
 const box=(x0,y0,x1,y1,c)=>{for(let y=y0;y<=y1;y++)row(y,x0,x1,c);};
 const poly=(points,c)=>{
  const lo=Math.max(0,Math.floor(Math.min(...points.map(p=>p[1])))),hi=Math.min(H-1,Math.ceil(Math.max(...points.map(p=>p[1]))));
  for(let y=lo;y<=hi;y++){const xs=[];for(let i=0;i<points.length;i++){const [x1,y1]=points[i],[x2,y2]=points[(i+1)%points.length];if((y1>y+.5)!==(y2>y+.5))xs.push(x1+(y+.5-y1)*(x2-x1)/(y2-y1));}xs.sort((a,b)=>a-b);for(let i=0;i+1<xs.length;i+=2)row(y,Math.ceil(xs[i]),Math.floor(xs[i+1]),c);}
 };
 const oval=(cx,cy,rx,ry,c)=>{for(let y=Math.floor(cy-ry);y<=cy+ry;y++){const d=(y+.5-cy)/ry;if(Math.abs(d)>1)continue;const r=Math.floor(rx*Math.sqrt(1-d*d));row(y,cx-r,cx+r,c);}};
 const l=Math.max(0,Math.min(6,a.hairLength??3)),fringe=(a.fringe??0)%16,outfit=a.outfit??0;
 const hair=mix(a.hair,'#766058',.14),hairD=mix(a.hair,'#19202d',.22),hairM=mix(hair,'#b4a09a',.18),hairH=mix(hair,'#cfb7a9',.35),edge=mix(hair,'#20202b',.58);
 const skin=mix(a.skin,'#fff0df',.25),skinD=mix(skin,'#b77968',.24),skinH=mix(skin,'#fff7e8',.4);
 const shirt=a.shirt,pants='#354359',pantsH='#4e5c75',pantsD='#293143',white='#f4f0eb';
 const top=[white,shirt,shirt,'#f0e9dd','#e2d0b5','#344056'][outfit]??shirt,topH=mix(top,'#fff4e9',.22),topD=mix(top,'#303244',.22);

 // Rounded crown and tapered back locks, with long hair behind the sleeves.
 if(l){
  oval(40,32,27,25,hairD);
  if(l>=3){const end=[0,0,0,67,77,89,100][l];poly([[14,32],[66,32],[67,end-8],[64,end-2],[60,end],[56,end-5],[53,end],[27,end],[24,end-4],[20,end],[16,end-2],[13,end-8]],hairD);
   for(const x of [17,22,57,62])poly([[x,40],[x+3,39],[x+2,end-5],[x,end-2]],hairM);
   poly([[14,42],[18,44],[17,end-4],[14,end-9]],hair);
   poly([[62,38],[65,35],[65,end-7],[62,end-2]],hair);
  }
 }
 // Soft jaw: warm shadow on the lower and right edges, no rectangular chin.
 oval(40,42,22,24,skinD);oval(39,40,22,23,skin);
 box(17,42,20,48,skin);box(59,42,62,48,skinD);box(18,43,19,46,skinD);box(59,43,60,46,skin);
 poly([[24,35],[27,29],[35,25],[43,25],[42,29],[30,31]],skinH);
 row(62,33,46,skinD);row(63,36,43,skinD);
 if(!l){oval(40,26,25,18,mix(hair,'#c0a295',.38));oval(39,24,23,16,mix(hair,'#c8b2a0',.5));for(let x=19;x<=60;x+=4)put(x,25+(x%3),hairM);}

 // Short torso, roomy shoulders and sleeves; two compact trouser legs.
 box(35,64,44,68,skinD);row(65,36,43,skin);
 poly([[31,68],[49,68],[54,71],[56,88],[54,94],[26,94],[24,88],[26,71]],top);
 poly([[26,71],[24,74],[22,86],[24,91],[30,90],[30,74]],top);
 poly([[54,71],[56,74],[58,86],[56,91],[50,90],[50,74]],topD);
 poly([[27,71],[29,70],[29,85],[26,87],[24,85]],topH);
 row(91,27,53,topD);row(92,29,52,topD);
 box(24,89,28,92,skin);box(52,89,56,92,skinD);put(25,89,skinH);put(53,89,skin);
 box(29,94,51,98,pants);box(29,99,37,106,pants);box(43,99,51,106,pants);
 row(94,31,49,pantsH);box(30,98,32,103,pantsH);box(44,98,46,103,pantsH);box(36,99,37,105,pantsD);box(50,99,51,105,pantsD);
 box(28,107,38,110,'#39303e');box(43,107,53,110,'#39303e');row(107,29,36,'#726174');row(107,44,51,'#726174');row(110,28,38,'#222432');row(110,43,53,'#222432');put(29,109,'#b8a9ad');put(44,109,'#b8a9ad');
 if(outfit===0){
  poly([[31,68],[35,68],[40,77],[45,68],[49,69],[45,82],[42,85],[39,81],[35,82]],'#e0e6e1');
  poly([[36,69],[44,69],[41,78],[39,78]],shirt);box(40,80,41,94,'#c4ceca');
  row(86,28,34,'#b8c7c8');row(87,28,34,'#e3e8e4');row(86,47,52,'#b8c7c8');box(26,93,54,97,white);box(40,93,41,97,'#c4ceca');
  for(const y of [82,88,94])put(42,y,'#84969d');
 }else if(outfit===1){
  poly([[35,68],[45,68],[44,91],[36,91]],'#f4ebdf');poly([[30,69],[35,68],[34,75],[31,76],[35,81],[33,91],[28,91]],topH);
  for(const y of [77,83,89])box(45,y,46,y+1,'#d3b882');row(87,28,32,topD);row(87,48,52,topD);
 }else if(outfit===2){
  poly([[31,68],[36,66],[44,66],[49,68],[47,73],[33,73]],topD);row(68,36,43,topH);
  box(36,73,36,79,'#e5dfd3');box(44,73,44,79,'#e5dfd3');poly([[32,84],[47,84],[49,89],[30,89]],topD);row(85,33,46,topH);
 }else if(outfit===3){
  poly([[30,69],[36,67],[40,73],[44,67],[50,69],[45,75],[40,74],[35,75]],shirt);box(39,72,41,79,'#ad5f6b');row(79,39,41,'#8d4a58');
  row(87,25,29,shirt);row(87,51,55,shirt);box(40,80,40,91,topD);
 }else if(outfit===4){
  poly([[35,68],[45,68],[43,72],[37,72]],white);for(const y of [78,86]){row(y,26,54,shirt);row(y+1,26,54,shirt);row(y+2,26,54,mix(shirt,top,.4));}
 }else{
  poly([[34,68],[46,68],[42,80],[38,80]],white);poly([[31,68],[35,69],[39,78],[34,76],[32,80]],topH);poly([[49,68],[45,69],[41,78],[46,76],[48,80]],topD);
  box(39,70,41,80,shirt);for(const y of [84,89])box(40,y,41,y+1,'#b9a777');row(85,47,51,topH);
 }

 // Bent thighs and forward forearms: sitting is an anatomical pose.
 if(pose==='seated'){
  box(22,98,57,111,null);poly([[29,94],[50,94],[54,98],[51,102],[39,101],[34,104],[28,101]],pants);
  box(28,100,35,106,pants);box(48,99,55,107,pants);row(100,40,53,pantsH);box(29,102,31,106,pantsH);
  box(27,107,37,110,'#39303e');box(48,108,59,111,'#39303e');row(107,28,35,'#726174');row(108,49,57,'#726174');
  poly([[25,75],[30,76],[29,84],[36,85],[37,89],[27,89],[23,84]],topH);poly([[55,75],[50,76],[51,84],[44,85],[43,89],[53,89],[57,84]],top);
  box(35,86,39,89,skin);box(41,86,45,89,skin);row(89,35,39,skinD);row(89,41,45,skinD);
 }
 if(pose==='experiment'){
  poly([[25,75],[30,77],[29,84],[36,85],[37,89],[26,89],[22,84]],topH);box(35,86,41,89,skin);
  poly([[51,75],[56,76],[57,81],[65,82],[65,86],[54,87],[51,83]],top);box(64,81,68,84,skin);row(84,64,68,skinD);
 }
 if(pose==='lecturing')box(21,72,29,92,null);

 // Crown highlights follow grouped locks instead of straight horizontal bands.
 if(l){
  const crown=fringe%4===0?[[14,30],[14,21],[19,16],[25,11],[36,9],[39,6],[45,10],[54,12],[61,19],[65,26],[65,34]]:
   fringe%4===1?[[13,31],[16,20],[23,14],[32,11],[46,10],[57,15],[63,22],[66,31],[64,36]]:
   fringe%4===2?[[14,32],[15,22],[22,16],[29,10],[38,10],[42,7],[46,11],[56,14],[62,21],[65,30],[64,35]]:
   [[13,33],[14,23],[20,17],[31,12],[42,9],[53,13],[61,20],[66,28],[65,36]];
  poly(crown,hair);
  poly([[18,23],[24,17],[35,13],[45,13],[54,17],[58,21],[51,20],[45,17],[32,17],[25,20]],hairM);
  poly([[23,20],[29,16],[37,15],[36,17],[28,20]],hairH);poly([[44,16],[52,18],[55,21],[48,20]],hairH);
  const clipped=l===1,style=fringe%8,shift=fringe>=8?2:0;
  const locks=clipped?[[[18,26],[26,24],[27,31],[23,29],[21,34]],[[25,24],[37,22],[38,30],[33,28],[31,33]],[[35,23],[49,23],[52,31],[47,29],[45,34]],[[48,25],[61,27],[60,34],[57,31],[55,35]]]:
   style===0?[[[16,27],[29,23],[30,32],[24,37],[23,33],[20,39]],[[27,24],[39,22],[42,28],[34,38],[34,33],[30,39]],[[38,24],[48,24],[51,34],[47,32],[45,39]],[[48,26],[61,29],[60,42],[55,37],[52,34]]]:
   style===1?[[[17,27],[35,23],[39,27],[26,40],[27,35],[21,40]],[[34,24],[49,25],[44,34],[36,39],[37,34]],[[47,26],[61,30],[61,42],[55,38],[54,33]]]:
   style===2?[[[17,26],[28,25],[29,36],[24,34],[22,39]],[[27,25],[39,24],[39,35],[35,35],[33,39]],[[38,24],[49,25],[49,38],[45,35],[43,39]],[[48,25],[61,28],[61,40],[56,36],[54,40]]]:
   style===3?[[[17,29],[36,23],[36,28],[29,36],[24,39],[23,34]],[[37,23],[43,23],[44,30],[39,27]],[[44,24],[61,30],[61,41],[57,36],[51,35],[48,30]]]:
   style===4?[[[16,28],[28,24],[30,30],[26,39],[23,35],[20,40]],[[27,25],[35,23],[40,28],[35,34],[32,31],[31,39]],[[36,25],[49,25],[52,33],[46,40],[43,36],[41,40]],[[48,26],[62,29],[61,41],[57,37],[53,39]]]:
   style===5?[[[16,29],[33,23],[34,29],[27,33],[26,40],[21,43]],[[32,23],[41,23],[40,28],[37,29]],[[42,24],[60,28],[63,39],[58,43],[55,34],[47,31]]]:
   style===6?[[[16,28],[29,24],[32,29],[27,34],[24,39],[23,34]],[[28,25],[39,23],[44,28],[37,37],[35,34],[32,40]],[[40,24],[53,26],[55,32],[51,39],[48,35]],[[52,28],[62,31],[61,43],[55,40]]]:
   [[[16,29],[29,24],[34,25],[30,34],[25,35],[23,42]],[[31,24],[43,23],[48,28],[39,36],[36,39],[37,33]],[[44,25],[61,29],[63,40],[58,39],[55,35],[52,40]]];
  for(const [i,points]of locks.entries()){
   const pts=points.map(([x,y])=>[x,y+shift]);poly(pts,i%2?hair:hairM);
   const [x,y]=pts[0];poly([[x+3,y+1],[x+6,y],[x+7,y+3],[x+5,y+7],[x+3,y+8]],i%2?hairM:hair);
  }
  if(l>=2){poly([[14,29],[20,28],[20,48],[23,55],[18,53],[16,57],[13,48]],hair);poly([[60,28],[65,31],[67,49],[64,55],[60,56],[58,51],[61,44]],hairD);poly([[15,33],[17,31],[17,49],[19,53],[16,51]],hairM);poly([[62,34],[64,36],[64,47],[62,51]],hairM);}
  if(a.curly){for(const [x,y]of [[17,20],[25,14],[36,11],[48,13],[58,20],[13,32],[63,33]]){oval(x,y,5,4,hair);poly([[x-2,y-2],[x+2,y-2],[x+3,y],[x,y+1],[x-2,y]],hairM);}if(l>=3)for(let y=49;y<([0,0,0,67,77,89,100][l]);y+=9){oval(15,y,4,5,hair);oval(64,y+2,4,5,hairD);row(y-2,13,16,hairM);row(y,62,65,hairM);}}
 }

 // Open eye styles for every neutral face; expressive closed eyes use broad arcs.
 const ink='#303044',iris=mix(a.hair,'#405778',.55),eyeY=42;
 for(const [x,right]of [[25,false],[47,true]]){
  const closed=['happy','delighted','relieved'].includes(expression),droop=['tired','sad'].includes(expression);
  if(closed){row(eyeY+4,x-1,x,ink);row(eyeY+2,x+1,x+4,ink);row(eyeY+3,x,x+1,ink);row(eyeY+3,x+4,x+5,ink);row(eyeY+4,x+5,x+6,ink);row(eyeY+5,x-1,x,ink);row(eyeY+5,x+5,x+6,ink);}
  else{
   const bottom=droop?eyeY+7:eyeY+10,y0=expression==='surprised'?eyeY-1:eyeY+1;
   box(x,y0,x+6,bottom,'#fff0e3');box(x+1,y0,x+5,bottom,iris);box(x+2,y0+1,x+5,bottom-2,ink);row(y0-1,x-1,x+6,ink);
   if((a.eyes??0)===1)put(right?x+6:x-1,y0-2,ink);
   if((a.eyes??0)===2){row(bottom,x+2,x+4,iris);put(x+1,bottom,'#fff0e3');put(x+5,bottom,'#fff0e3');}
   box(x+1,y0,x+2,y0+2,'#fff8ec');put(x+4,bottom-1,'#8399ad');row(bottom,x+1,x+5,iris);
   if(expression==='focused'){row(y0,x-1,x+6,ink);put(right?x:x+5,y0+1,ink);}
  }
  if(['sad','worried'].includes(expression))poly([[x,38],[x+3,37],[x+5,39],[x+5,40],[x+2,39],[x,40]],hairD);
  else if(expression==='focused'){row(38,right?x+2:x,right?x+5:x+3,hairD);row(39,right?x:x+3,right?x+2:x+5,hairD);}
  else row(38,x,x+5,hairD);
 }
 // Tiny blush clusters, light cheek accents and distinct mouths.
 row(53,21,27,'#e79a9f');row(54,22,27,'#edb0ac');row(53,52,58,'#e79a9f');row(54,52,57,'#edb0ac');put(22,52,'#ffe0d5');put(56,52,'#ffe0d5');put(40,54,skinD);
 const mouth='#a85d69';
 if(['surprised','delighted'].includes(expression)){row(57,37,42,mouth);box(36,58,43,60,mouth);row(61,38,41,mouth);row(60,38,41,'#df9598');}
 else if(['sad','worried','tired'].includes(expression)){row(58,37,42,mouth);put(36,59,mouth);put(43,59,mouth);if(expression==='sad'){box(28,50,29,55,'#a1c7e0');put(28,51,'#e7f6f5');}if(expression==='worried'){box(63,39,64,42,'#a1c7e0');put(63,39,'#e7f6f5');}}
 else if(expression==='focused'){row(58,38,42,mouth);}
 else if(expression==='relieved'){put(37,57,mouth);put(42,57,mouth);row(58,38,41,mouth);}
 else if(expression==='neutral'&&a.face===1){row(58,37,42,mouth);put(42,57,mouth);}
 else if(expression==='neutral'&&a.face===2){row(58,37,42,mouth);row(59,39,40,mouth);}
 else{put(35,57,mouth);put(44,57,mouth);row(58,36,43,mouth);row(59,38,41,mouth);}
 if(a.glasses){const frame='#514658';for(const [x,y]of [[21,41],[44,41]]){row(y,x+2,x+12,frame);row(y+12,x+2,x+12,frame);box(x,y+2,x+1,y+10,frame);box(x+13,y+2,x+14,y+10,frame);if(a.glassesShape!==1){put(x+1,y+1,frame);put(x+13,y+1,frame);put(x+1,y+11,frame);put(x+13,y+11,frame);}row(y+2,x+3,x+5,'#f9eeec');}row(45,35,44,frame);row(44,19,21,frame);row(44,58,61,frame);}

 // A single pixel coloured contour keeps the delicate edges readable at 80%.
 const outlined=pixels.map(r=>r.slice());
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(!pixels[y][x]){const n=[pixels[y-1]?.[x],pixels[y+1]?.[x],pixels[y][x-1],pixels[y][x+1]].find(Boolean);if(n)outlined[y][x]=mix(n,edge,.65);}
 let rects='';for(let y=0;y<H;y++){let x=0;while(x<W){const c=outlined[y][x];if(!c){x++;continue;}let end=x;while(end+1<W&&outlined[y][end+1]===c)end++;rects+=`<rect x="${x}" y="${y}" width="${end-x+1}" height="1" fill="${c}"/>`;x=end+1;}}
 const styles=['까까머리','크롭컷','짧은 머리','중간 길이 머리','단발','어깨 길이 머리','긴 머리'];
 const title=escape(`${label} · ${EXPRESSIONS[expression]} · ${styles[l]}${a.curly&&l?' · 곱슬머리':''}${a.glasses?' · 안경':''}${l?` · 앞머리 ${fringe+1}`:''}${pose==='lecturing'?' · 칠판 앞에서 강의':''}`);
 // Keep TA arm's animation coordinates in its established 40 × 62 grid.
 const arm=pose==='lecturing'?`<g transform="translate(0 24) scale(8)" shape-rendering="crispEdges"><g class="ta-lecture-arm"><path d="M13 36h3v5h-4v-3h-2v-3H8v-5h3v3h2z" fill="${top}" stroke="${topD}" stroke-width=".7"/><path d="M9 30V24H8V14" fill="none" stroke="#756353" stroke-width="1" class="ta-pointer"/><path d="M8 14v2" stroke="#e9e5d8" stroke-width="1"/><path d="M8 29h3v3H8z" fill="${skin}" stroke="${skinD}" stroke-width=".5"/></g></g>`:'';
 return `<svg class="portrait" data-expression="${expression}" data-pose="${pose}" data-outfit="${outfit}" viewBox="0 0 320 496" role="img" aria-label="${title}"><title>${title}</title><g class="hair-fringe chibi-grid ${expression==='sad'?'expression-tear':''}" shape-rendering="crispEdges" transform="translate(0 24) scale(4)">${rects}</g>${arm}</svg>`;
}
