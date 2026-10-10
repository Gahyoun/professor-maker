import {EXPRESSIONS,normalizeExpression} from './student-reaction.js';

const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mix=(a,b,t)=>'#'+a.slice(1).match(/../g).map((v,i)=>Math.round(parseInt(v,16)*(1-t)+parseInt(b.slice(1+i*2,3+i*2),16)*t).toString(16).padStart(2,'0')).join('');
export const STUDENT_HEAD_SCALE=.5;
export const STUDENT_MONITOR_LAYERS=Object.freeze(['rear-head','far-arm','body','back-hair','face-fringe','near-arm']);

// Integer raster art: the public 320 × 496 frame is shared by every activity.
// Cosmetics are read from saved appearance fields and never consume game RNG.
export function renderStudentPortrait(a,label='학생 도트 초상화',expression='neutral',pose='standing',facing='front'){
 expression=normalizeExpression(expression);
 pose=['standing','seated','experiment','lecturing'].includes(pose)?pose:'standing';
 facing=pose==='seated'&&facing==='monitor'?'monitor':'front';
 const W=80,H=118,raster=()=>Array.from({length:H},()=>Array(W).fill(null));
 const backHead=raster(),body=raster(),frontHead=raster(),backHair=raster(),farArm=raster(),nearArm=raster();let pixels=backHead;
 const put=(x,y,c)=>{if(x>=0&&x<W&&y>=0&&y<H)pixels[y][x]=c;};
 const row=(y,x0,x1,c)=>{for(let x=x0;x<=x1;x++)put(x,y,c);};
 const box=(x0,y0,x1,y1,c)=>{for(let y=y0;y<=y1;y++)row(y,x0,x1,c);};
 const poly=(points,c)=>{
  const lo=Math.max(0,Math.floor(Math.min(...points.map(p=>p[1])))),hi=Math.min(H-1,Math.ceil(Math.max(...points.map(p=>p[1]))));
  for(let y=lo;y<=hi;y++){const xs=[];for(let i=0;i<points.length;i++){const [x1,y1]=points[i],[x2,y2]=points[(i+1)%points.length];if((y1>y+.5)!==(y2>y+.5))xs.push(x1+(y+.5-y1)*(x2-x1)/(y2-y1));}xs.sort((a,b)=>a-b);for(let i=0;i+1<xs.length;i+=2)row(y,Math.ceil(xs[i]),Math.floor(xs[i+1]),c);}
 };
 const oval=(cx,cy,rx,ry,c)=>{for(let y=Math.floor(cy-ry);y<=cy+ry;y++){const d=(y+.5-cy)/ry;if(Math.abs(d)>1)continue;const r=Math.floor(rx*Math.sqrt(1-d*d));row(y,cx-r,cx+r,c);}};
 const originalLength=Math.max(0,Math.min(6,a.hairLength??3));
 const hairStyle=a.labMode==='wet'&&originalLength>=5?(a.hairStyle==='braided-bun'?'braided-bun':'ponytail'):'loose';
 const l=hairStyle==='loose'?originalLength:2,fringe=(a.fringe??0)%16,outfit=a.outfit??0;
 const looseEnd=[0,0,0,67,68,89,100][l];
 const hair=mix(a.hair,'#766058',.14),hairD=mix(a.hair,'#19202d',.22),hairM=mix(hair,'#b4a09a',.18),hairH=mix(hair,'#cfb7a9',.35),edge=mix(hair,'#20202b',.58);
 const skin=mix(a.skin,'#fff0df',.25),skinD=mix(skin,'#b77968',.24),skinH=mix(skin,'#fff7e8',.4);
 const shirt=a.shirt,white='#f4f0eb';
 // Saved outfit slots: coat, knit cardigan, zip hoodie, layered shirt, striped
 // tee and casual jacket. Contemporary everyday clothes share the same anatomy.
 const pants=['#465871','#6e8aa4','#c8c1b3','#54728d','#b5a28a','#61666d'][outfit]??'#54728d';
 const pantsH=mix(pants,'#e2e4de',.22),pantsD=mix(pants,'#283448',.24);
 const top=[white,shirt,mix(shirt,'#77817e',.35),mix(shirt,'#f3eee7',.48),white,mix(shirt,'#5b6269',.4)][outfit]??shirt,topH=mix(top,'#fff4e9',.22),topD=mix(top,'#303244',.22);
 const rib=mix(top,topD,.52),stitch=mix(top,topH,.55),stripe=mix(shirt,'#526272',.2);
 const sneaker=(x,y,width=10)=>{box(x,y,x+width,y+3,'#e8e6dd');row(y,x+1,x+width-2,'#faf5e9');row(y+1,x+2,x+width-3,'#8d99a3');row(y+2,x+1,x+width,'#d1d5d2');row(y+3,x,x+width,'#f6f0e2');put(x+width,y+2,'#68788a');};
 const hairTie=mix(shirt,'#b79b8c',.25);
 const tiedHair=monitor=>{
  if(hairStyle==='loose')return;
  if(hairStyle==='braided-bun'){
   const cx=monitor?17:64,cy=monitor?23:19;
   oval(cx,cy,10,10,hairD);oval(cx,cy-1,8,8,hair);
   for(const [dx,dy]of [[-5,-4],[0,-6],[4,-3],[5,2],[0,5],[-5,2]])poly([[cx+dx-2,cy+dy],[cx+dx,cy+dy-2],[cx+dx+3,cy+dy],[cx+dx+1,cy+dy+2]],hairM);
   oval(cx,cy,3,3,hairD);row(cy+7,cx-4,cx+4,hairTie);
  }else{
   const end=originalLength===6?94:84;
   if(monitor){poly([[17,29],[11,33],[10,44],[15,52],[14,end-12],[20,end-2],[23,end],[26,end-5],[20,end-18],[22,56],[25,43],[23,35]],hairD);
    poly([[15,35],[13,44],[18,52],[18,end-12],[22,end-5],[23,end-10],[20,52],[22,43],[20,35]],hair);
    poly([[15,39],[14,44],[18,51],[17,end-17],[19,end-11],[20,end-16],[20,51],[18,44]],hairM);
    box(14,30,22,33,hairTie);row(31,15,21,mix(hairTie,'#eee2d4',.2));
   }else{poly([[61,19],[69,20],[73,28],[76,41],[73,54],[73,end-12],[66,end-3],[64,end],[61,end-5],[65,end-15],[65,53],[62,43],[64,31],[58,27]],hairD);
    poly([[65,28],[69,30],[72,42],[69,55],[70,end-14],[65,end-6],[66,end-15],[66,53],[65,44],[67,35]],hair);
    poly([[67,34],[70,42],[68,55],[69,end-18],[66,end-13],[67,54],[66,44]],hairM);
    box(59,22,68,25,hairTie);row(23,60,67,mix(hairTie,'#eee2d4',.2));
   }
   if(a.curly){const x=monitor?13:73;for(let y=43;y<end-8;y+=11){oval(x,y,4,5,hair);poly([[x-2,y-3],[x+2,y-2],[x+2,y],[x,y+2],[x-2,y]],hairM);}}
  }
 };

 // Rounded crown and tapered back locks, with long hair behind the sleeves.
 if(l){
  oval(40,32,27,25,hairD);
  if(l===4){
   // A chin-length bob has a broad cheek-level volume and an inward hem,
   // rather than the same straight curtain used for shoulder-length hair.
   poly([[14,29],[66,29],[70,40],[69,57],[65,65],[57,68],[23,68],[15,65],[11,57],[10,41]],hairD);
   poly([[13,35],[20,34],[23,55],[27,63],[22,66],[16,63],[13,57]],hair);
   poly([[60,33],[66,37],[67,54],[64,62],[58,66],[54,64],[61,55]],hair);
   poly([[14,41],[17,39],[18,55],[21,61],[18,61],[15,56]],hairM);
   poly([[63,41],[65,44],[65,54],[62,60],[60,61],[63,53]],hairM);
   row(66,21,27,hairD);row(66,54,60,hairD);
  }else if(l>=3){const end=looseEnd;poly([[14,32],[66,32],[67,end-8],[64,end-2],[60,end],[56,end-5],[53,end],[27,end],[24,end-4],[20,end],[16,end-2],[13,end-8]],hairD);
   for(const x of [17,22,57,62])poly([[x,40],[x+3,39],[x+2,end-5],[x,end-2]],hairM);
   poly([[14,42],[18,44],[17,end-4],[14,end-9]],hair);
   poly([[62,38],[65,35],[65,end-7],[62,end-2]],hair);
  }
 }
 tiedHair(false);
 // Soft jaw: warm shadow on the lower and right edges, no rectangular chin.
 oval(40,42,22,24,skinD);oval(39,40,22,23,skin);
 box(17,42,20,48,skin);box(59,42,62,48,skinD);box(18,43,19,46,skinD);box(59,43,60,46,skin);
 poly([[24,35],[27,29],[35,25],[43,25],[42,29],[30,31]],skinH);
 row(62,33,46,skinD);row(63,36,43,skinD);
 if(!l){oval(40,26,25,18,mix(hair,'#c0a295',.38));oval(39,24,23,16,mix(hair,'#c8b2a0',.5));for(let x=19;x<=60;x+=4)put(x,25+(x%3),hairM);}

 // Short torso, roomy shoulders and sleeves; two compact trouser legs.
 pixels=body;
 box(35,64,44,68,skinD);row(65,36,43,skin);
 poly([[31,68],[49,68],[54,71],[56,88],[54,94],[26,94],[24,88],[26,71]],top);
 poly([[26,71],[24,74],[22,86],[24,91],[30,90],[30,74]],top);
 poly([[54,71],[56,74],[58,86],[56,91],[50,90],[50,74]],topD);
 poly([[27,71],[29,70],[29,85],[26,87],[24,85]],topH);
 row(91,27,53,topD);row(92,29,52,topD);
 box(24,89,28,92,skin);box(52,89,56,92,skinD);put(25,89,skinH);put(53,89,skin);
 box(29,94,51,98,pants);box(28,99,38,106,pants);box(42,99,52,106,pants);
 row(94,31,49,pantsH);box(30,98,32,103,pantsH);box(44,98,46,103,pantsH);box(37,99,38,105,pantsD);box(51,99,52,105,pantsD);
 row(105,28,38,pantsD);row(105,42,52,pantsD);row(106,29,37,pantsH);row(106,43,51,pantsH);box(39,95,40,98,pantsD);put(40,95,'#b5aa91');
 sneaker(28,107);sneaker(43,107);
 if(outfit===0){
  poly([[31,68],[35,68],[40,77],[45,68],[49,69],[45,82],[42,85],[39,81],[35,82]],'#e0e6e1');
  poly([[36,69],[44,69],[41,78],[39,78]],shirt);box(40,80,41,94,'#c4ceca');
  row(86,28,34,'#b8c7c8');row(87,28,34,'#e3e8e4');row(86,47,52,'#b8c7c8');box(26,93,54,97,white);box(40,93,41,97,'#c4ceca');
  for(const y of [82,88,94])put(42,y,'#84969d');
 }else if(outfit===1){
  poly([[35,68],[45,68],[44,94],[36,94]],white);row(69,37,43,'#d5d9d2');
  poly([[30,69],[35,68],[35,73],[38,80],[36,94],[29,93]],topH);poly([[49,69],[45,68],[45,73],[42,80],[44,94],[51,93]],top);
  row(92,27,35,rib);row(92,45,53,rib);row(88,24,29,rib);row(88,51,56,rib);
  for(const y of [79,85,91]){put(43,y,'#d5c9b5');put(44,y,topD);}
  for(const x of [30,33,48,51])box(x,80,x,90,stitch);
  row(85,29,33,rib);row(85,47,51,rib);row(94,36,44,'#d7dcd4');
 }else if(outfit===2){
  poly([[31,68],[36,66],[44,66],[49,68],[47,73],[33,73]],topD);row(68,36,43,topH);
  poly([[36,68],[44,68],[42,74],[38,74]],white);box(39,74,40,93,'#a9b4b1');put(40,75,'#e3e5db');
  box(35,73,35,79,'#e5dfd3');box(45,73,45,79,'#e5dfd3');put(35,79,topD);put(45,79,topD);
  poly([[31,84],[37,84],[37,89],[29,89]],topD);poly([[43,84],[49,84],[51,89],[43,89]],topD);row(85,32,36,topH);row(85,44,48,topH);
  row(92,27,53,rib);row(88,24,29,rib);row(88,51,56,rib);row(94,29,51,white);
 }else if(outfit===3){
  poly([[35,69],[44,69],[43,94],[36,94]],white);row(69,37,42,'#d2d9d3');
  poly([[30,69],[35,67],[39,73],[35,75],[33,72]],topH);poly([[49,69],[45,67],[41,73],[45,75],[47,72]],topD);
  box(34,76,35,93,topD);box(44,76,45,93,topH);for(const y of [79,85,91])put(45,y,'#e1ded3');
  row(80,47,51,topD);box(47,81,47,84,topH);row(85,47,51,topH);
  for(const x of [29,32,48,51])box(x,75,x,90,stitch);
  row(88,24,29,topD);row(88,51,56,topD);row(89,24,29,topH);row(89,51,56,topH);row(94,36,43,'#d7dcd4');
 }else if(outfit===4){
  poly([[35,68],[45,68],[43,72],[37,72]],'#d7dcd4');row(69,37,43,white);
  for(const y of [76,82,88]){row(y,26,54,stripe);row(y+1,26,54,mix(stripe,white,.2));}
  row(87,23,28,stripe);row(87,52,57,stripe);row(92,27,53,'#d7dcd4');row(94,29,51,white);
 }else{
  poly([[35,68],[45,68],[44,94],[36,94]],white);row(69,37,43,'#d0d5d0');
  poly([[31,69],[35,68],[36,72],[35,91],[29,92]],topH);poly([[49,69],[45,68],[44,72],[45,91],[51,92]],top);
  box(35,74,35,93,topD);box(44,74,44,93,'#bac0b7');put(44,75,white);
  box(28,81,32,87,topD);row(81,28,32,stitch);box(48,81,52,87,topD);row(81,48,52,stitch);
  row(92,27,35,rib);row(92,45,53,rib);row(88,24,29,rib);row(88,51,56,rib);row(94,36,43,'#d7dcd4');
 }

 // Bent thighs and forward forearms: sitting is an anatomical pose.
 if(pose==='seated'){
  box(22,98,57,111,null);poly([[29,94],[50,94],[54,98],[51,102],[39,101],[34,104],[28,101]],pants);
  box(28,100,35,106,pants);box(48,99,55,107,pants);row(100,40,53,pantsH);box(29,102,31,106,pantsH);
  row(106,28,35,pantsD);row(107,48,55,pantsD);sneaker(27,107);sneaker(48,108,11);
  poly([[25,75],[30,76],[29,84],[36,85],[37,89],[27,89],[23,84]],topH);poly([[55,75],[50,76],[51,84],[44,85],[43,89],[53,89],[57,84]],top);
  row(85,32,35,outfit===0?topD:rib);row(85,44,47,outfit===0?topD:rib);
  box(35,86,39,89,skin);box(41,86,45,89,skin);row(89,35,39,skinD);row(89,41,45,skinD);
 }
 if(pose==='experiment'){
  poly([[25,75],[30,77],[29,84],[36,85],[37,89],[26,89],[22,84]],topH);box(35,86,41,89,skin);
  poly([[51,75],[56,76],[57,81],[65,82],[65,86],[54,87],[51,83]],top);box(64,81,68,84,skin);row(84,64,68,skinD);
  row(85,31,35,topD);box(62,82,63,85,topD);
 }
 if(pose==='lecturing')box(21,72,29,92,null);

 // Crown highlights follow grouped locks instead of straight horizontal bands.
 pixels=frontHead;
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
   const pts=points.map(([x,y])=>[x,Math.min(x>=24&&x<=54?41:43,y+shift+(y>=26?2:0))]);poly(pts,i%2?hair:hairM);
   const [x,y]=pts[0];poly([[x+3,y+1],[x+6,y],[x+7,y+3],[x+5,y+7],[x+3,y+8]],i%2?hairM:hair);
  }
  if(l===4){
   poly([[13,30],[21,29],[20,45],[23,56],[28,63],[22,65],[15,64],[11,58],[10,45]],hair);
   poly([[61,28],[67,31],[70,46],[69,58],[65,64],[58,66],[54,64],[60,56],[61,44]],hairD);
   poly([[14,35],[17,33],[17,52],[21,60],[19,61],[15,56]],hairM);
   poly([[64,37],[66,42],[66,53],[62,61],[60,62],[64,53]],hairM);
  }else if(l>=2){poly([[14,29],[20,28],[20,48],[23,55],[18,53],[16,57],[13,48]],hair);poly([[60,28],[65,31],[67,49],[64,55],[60,56],[58,51],[61,44]],hairD);poly([[15,33],[17,31],[17,49],[19,53],[16,51]],hairM);poly([[62,34],[64,36],[64,47],[62,51]],hairM);}
  if(a.curly){for(const [x,y]of [[17,20],[25,14],[36,11],[48,13],[58,20],[13,32],[63,33]]){oval(x,y,5,5,hair);poly([[x-2,y-3],[x+2,y-2],[x+3,y],[x,y+2],[x-2,y]],hairM);}
   for(const [x,y]of [[23,30],[34,29],[46,30],[57,33]]){oval(x,y,4,4,hair);poly([[x-2,y-2],[x+1,y-2],[x+2,y],[x,y+2]],hairM);}
   if(l>=3)for(let y=49;y<looseEnd-2;y+=9){oval(l===4?12:15,y,4,5,hair);oval(l===4?67:64,y+2,4,5,hairD);row(y-2,l===4?10:13,l===4?13:16,hairM);row(y,l===4?65:62,l===4?68:65,hairM);}
  }
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

 // Desk work needs a rear three-quarter view, rather than a mirrored front
 // portrait. The face and both forearms point towards the screen at upper right.
 if(facing==='monitor'){
  for(const layer of [backHead,body,frontHead])for(const r of layer)r.fill(null);
  // In a rear three-quarter view the hair lies on top of the shirt's back,
  // rather than being hidden behind it or dangling in front of the cheek.
  pixels=backHair;
  const end=[0,0,61,68,68,91,99][l];
  if(l===4){
   poly([[14,36],[53,35],[59,43],[58,58],[54,66],[48,68],[22,68],[16,64],[12,57],[10,45]],hairD);
   poly([[15,44],[22,42],[25,59],[30,64],[23,66],[17,63],[14,56]],hair);
   poly([[29,44],[41,41],[51,44],[53,57],[48,65],[42,66],[33,64]],hair);
   for(const x of [18,29,42,51])poly([[x,45],[x+2,44],[x+3,56],[x+1,62],[x-1,60]],hairM);
   if(a.curly)for(const [x,y]of [[13,49],[15,58],[22,64],[34,65],[47,65],[55,57]]){oval(x,y,4,4,hair);poly([[x-2,y-2],[x+1,y-2],[x+2,y],[x,y+2]],hairM);}
  }else if(l>=2){poly([[18,43],[54,40],[58,end-8],[55,end-2],[51,end],[47,end-3],[24,end],[20,end-3],[17,end-8]],hairD);
   poly([[21,46],[29,46],[28,end-4],[24,end-1],[20,end-5]],hair);
   poly([[31,45],[42,44],[46,end-3],[40,end],[32,end-2]],hair);
   for(const x of [23,31,47,52])poly([[x,47],[x+2,46],[x+2,end-6],[x,end-3]],hairM);
   if(a.curly)for(let y=53;y<end;y+=9){oval(19,y,3,4,hair);oval(54,y+1,3,4,hairD);row(y-2,18,20,hairM);}
  }
  tiedHair(true);
  // The pelvis rests on the chair; thighs reach forward before the calves drop.
  pixels=body;
  box(35,63,45,68,skinD);
  poly([[27,68],[39,65],[50,67],[54,74],[54,91],[49,96],[28,94],[24,87],[24,75]],top);
  poly([[27,70],[32,68],[31,88],[28,91],[25,86],[25,74]],topH);
  poly([[48,68],[54,72],[57,78],[53,83],[48,80]],topD);
  row(92,29,49,topD);row(93,30,48,topD);
  if(outfit===0){poly([[31,68],[38,66],[46,67],[50,71],[44,73],[34,73]],'#dbe3df');box(40,74,41,92,'#c4ceca');row(86,29,35,'#c5d2d0');box(28,94,50,97,white);}
  else if(outfit===1){for(const x of [29,33,47,51])box(x,77,x,90,stitch);row(91,28,50,rib);row(94,29,49,white);}
  else if(outfit===2){poly([[29,69],[34,65],[44,65],[50,69],[47,74],[43,77],[34,75]],topD);poly([[33,69],[37,68],[44,69],[46,72],[40,74],[35,73]],topH);row(91,28,50,rib);row(94,29,49,white);}
  else if(outfit===3){row(74,28,51,topD);for(const x of [29,33,47,51])box(x,76,x,90,stitch);row(92,29,49,topD);row(94,30,48,white);}
  else if(outfit===4){for(const y of [76,82,88]){row(y,27,51,stripe);row(y+1,27,51,mix(stripe,white,.2));}row(92,29,49,'#d7dcd4');}
  else if(outfit===5){poly([[30,68],[36,66],[45,68],[48,72],[34,73]],topH);row(77,29,51,topD);row(91,28,50,rib);row(94,29,49,white);}
  // Forearms reach the desktop, with the hands immediately above the keyboard.
  pixels=farArm;
  poly([[50,71],[55,72],[58,79],[68,82],[70,84],[66,87],[56,84],[52,77]],top);
  box(66,82,67,85,outfit===0?topD:rib);
  box(68,83,73,85,skin);row(85,68,73,skinD);
  pixels=nearArm;
  poly([[28,73],[32,72],[37,81],[42,84],[49,83],[58,81],[60,83],[49,87],[41,89],[31,84],[27,77]],topH);
  row(83,55,57,outfit===0?topD:rib);row(84,54,57,outfit===0?topD:rib);
  box(58,81,63,83,skin);row(83,58,63,skinD);
  pixels=body;
  poly([[43,94],[49,94],[69,95],[73,98],[72,102],[65,101],[57,98],[43,98]],pantsD);
  poly([[30,94],[43,94],[60,96],[64,98],[63,102],[57,102],[46,99],[32,99]],pants);
  poly([[71,99],[76,99],[76,107],[71,108],[69,104]],pantsD);
  poly([[58,99],[64,99],[63,107],[58,108],[56,104]],pants);
  poly([[34,94],[43,94],[59,96],[61,98],[55,98],[42,97]],pantsH);
  poly([[50,94],[57,94],[70,96],[72,98],[68,98],[57,97]],pantsH);
  box(58,101,60,106,pantsH);box(71,101,72,106,pantsH);
  row(107,57,63,pantsD);row(107,71,76,pantsD);sneaker(56,108,11);sneaker(70,108,8);
  // One eye and a stepped cheek silhouette make the viewing direction clear.
  pixels=frontHead;
  oval(43,40,21,23,skinD);poly([[45,24],[56,29],[61,35],[61,40],[66,43],[63,46],[63,54],[57,61],[47,63],[39,58],[37,39]],skin);
  row(59,49,58,skinD);put(65,44,skinH);box(60,51,63,54,'#edb0ac');put(61,51,'#ffe0d5');
  const closed=['happy','delighted','relieved'].includes(expression),eyeBottom=['tired','sad'].includes(expression)?47:50;
  if(closed){row(43,57,59,ink);row(44,56,57,ink);row(44,59,61,ink);}
  else{box(56,41,61,eyeBottom,'#fff0e3');box(57,41,60,eyeBottom,iris);box(58,42,60,eyeBottom-2,ink);row(40,55,61,ink);box(57,41,58,43,'#fff8ec');put(59,eyeBottom-1,'#8399ad');}
  row(37,55,60,hairD);row(56,58,61,mouth);
  if(a.glasses){row(39,54,62,'#514658');row(51,54,62,'#514658');box(53,40,54,50,'#514658');box(62,40,63,50,'#514658');row(42,47,54,'#514658');put(55,40,'#f9eeec');}
  // The rear crown retains the saved length, fringe family, curls and highlights.
  const rearHair=l?hair:mix(hair,'#c8b2a0',.5);
  oval(34,31,23,24,l?hairD:rearHair);
  poly([[13,31],[16,22],[21,16],[30,11],[41,10],[49,14],[54,22],[55,29],[52,37],[47,39],[46,31],[39,35],[39,49],[34,55],[21,52],[15,46]],rearHair);
  if(l){poly([[17,26],[24,19],[34,16],[43,17],[49,21],[43,22],[36,20],[27,22],[21,27]],hairM);poly([[22,21],[29,18],[36,18],[34,20],[27,23]],hairH);
   poly([[42,21],[53,25],[57,30],[57,37],[53,35],[51,40],[49,33],[46,30+(fringe%3)]],fringe%2?hair:hairM);
   if(l===4){poly([[14,42],[23,44],[25,57],[29,62],[25,66],[17,64],[12,57]],hair);poly([[15,45],[18,43],[20,55],[24,60],[21,62],[16,57]],hairM);}
   else if(l>=2)poly([[18,45],[24,48],[26,61],[22,65],[18,60]],hair);
   if(a.curly)for(const [x,y]of [[18,23],[27,16],[39,14],[49,20],[15,35],[49,33]]){oval(x,y,5,4,hair);poly([[x-2,y-2],[x+2,y-2],[x+3,y],[x,y+2]],hairM);}
   // Small stepped locks identify the saved fringe family in profile. They
   // stop above the eye and spectacle lens; a buzz cut has no fringe at all.
   const sideFringe=l===1?[[50,25],[57,27],[61,31],[61,34],[58,32],[57,35],[55,31],[52,32]]:
    fringe%4===0?[[49,24],[58,27],[61,31],[61,38],[58,35],[56,38],[55,32],[51,33],[50,29]]:
    fringe%4===1?[[49,25],[57,27],[61,31],[62,35],[60,34],[59,38],[57,36],[56,32],[53,35],[53,30]]:
    fringe%4===2?[[50,23],[56,25],[60,29],[60,33],[57,30],[55,33],[54,28],[51,29]]:
    [[48,25],[54,25],[58,28],[62,33],[62,36],[59,35],[59,39],[57,36],[55,34],[54,31],[51,32]];
   const fullerFringe=sideFringe.map(([x,y])=>[x,Math.min(x>=55?39:41,y+(y>=27?2:0))]);
   poly(fullerFringe,hair);poly([[52,28],[55,29],[57,32],[55,31],[53,31]],hairM);
  }else for(let x=18;x<52;x+=4)put(x,26+(x%3),hairM);
  oval(44,48,4,5,skinD);oval(45,47,3,4,skin);box(44,46,45,49,skinD);
 }

 // About 3.5 head heights when standing: a 30px skull, a 38px torso and 36px
 // legs. Seated hips stay on the chair; the hands still meet the desktop.
 // A finer integer output grid preserves eyes/glasses as the skull gets smaller.
 const seated=pose==='seated',neck=seated?45:37,hip=seated?(facing==='monitor'?82:88):75,foot=111,precision=2;
 const bodyY=y=>y<=94?neck+(y-66)*(hip-neck)/28:hip+(y-94)*(foot-hip)/17;
 const outputW=W*precision,outputH=H*precision,composite=Array.from({length:outputH},()=>Array(outputW).fill(null));
 const owners=Array.from({length:outputH},()=>Array(outputW).fill(0));
 const overlay=(source,head,part=0)=>{for(let y=0;y<outputH;y++)for(let x=0;x<outputW;x++){
  const px=x/precision,py=y/precision;
  const tail=py>neck;
  const headWidth=STUDENT_HEAD_SCALE+(tail?.15*Math.min(1,(py-neck)/8):0);
  const sx=Math.round(head?40+(px-40)/headWidth:px);
  const sy=Math.round(head?66+(py-neck)/(tail?(facing==='monitor'?1.1:1.5):STUDENT_HEAD_SCALE):py<=hip?66+(py-neck)*28/(hip-neck):94+(py-hip)*17/(foot-hip));
  const color=source[sy]?.[sx];if(color){composite[y][x]=color;owners[y][x]=part;}
 }};
 if(facing==='monitor'){overlay(backHead,true,0);overlay(farArm,false,1);overlay(body,false,2);overlay(backHair,true,3);overlay(frontHead,true,4);overlay(nearArm,false,5);}
 else{overlay(backHead,true);overlay(body,false);overlay(frontHead,true);}
 pixels=composite;

 // A single pixel coloured contour keeps the delicate edges readable at 80%.
 const outlined=pixels.map(r=>r.slice()),outlinedOwners=owners.map(r=>r.slice());
 for(let y=0;y<outputH;y++)for(let x=0;x<outputW;x++)if(!pixels[y][x]){const neighbor=[[x,y-1],[x,y+1],[x-1,y],[x+1,y]].find(([xx,yy])=>pixels[yy]?.[xx]);if(neighbor){const[xx,yy]=neighbor;outlined[y][x]=mix(pixels[yy][xx],edge,.65);outlinedOwners[y][x]=owners[yy][xx];}}
 const parts=STUDENT_MONITOR_LAYERS.map(()=>[]);let rects='';for(let y=0;y<outputH;y++){let x=0;while(x<outputW){const c=outlined[y][x];if(!c){x++;continue;}const owner=outlinedOwners[y][x];let end=x;while(end+1<outputW&&outlined[y][end+1]===c&&(facing!=='monitor'||outlinedOwners[y][end+1]===owner))end++;const rect=`<rect x="${x}" y="${y}" width="${end-x+1}" height="1" fill="${c}"/>`;if(facing==='monitor')parts[owner].push(rect);else rects+=rect;x=end+1;}}
 if(facing==='monitor')rects=parts.map((part,i)=>`<g data-avatar-part="${STUDENT_MONITOR_LAYERS[i]}">${part.join('')}</g>`).join('');
 const styles=['까까머리','크롭컷','짧은 머리','중간 길이 머리','단발','어깨 길이 머리','긴 머리'];
 const title=escape(`${label} · ${EXPRESSIONS[expression]} · ${styles[originalLength]}${hairStyle==='ponytail'?' · 포니테일':hairStyle==='braided-bun'?' · 땋아올린 번':''}${a.curly&&l?' · 곱슬머리':''}${a.glasses?' · 안경':''}${l?` · 앞머리 ${fringe+1}`:''}${pose==='lecturing'?' · 칠판 앞에서 강의':''}${facing==='monitor'?' · 모니터를 바라보며 앉음':''}`);
 // The raised TA arm shares the new torso coordinates; the pointer is shortened
 // independently so stretching the torso cannot pull its tip outside the frame.
 const armPoints=[[13,36],[16,36],[16,41],[12,41],[12,38],[10,38],[10,35],[8,35],[8,30],[11,30],[11,33],[13,33]].map(([x,y])=>[x*2,Math.round(bodyY(y*2))]);
 const palmTop=Math.round(bodyY(58)),palmBottom=Math.round(bodyY(64)),grip=Math.round(bodyY(60));
 const arm=pose==='lecturing'?`<g transform="translate(0 24) scale(4)" shape-rendering="crispEdges"><g class="ta-lecture-arm"><path d="M${armPoints.map(([x,y])=>`${x} ${y}`).join('L')}z" fill="${top}" stroke="${topD}" stroke-width="1.2"/><path d="M18 ${grip}V${grip-6}H16V7" fill="none" stroke="#756353" stroke-width="2" class="ta-pointer"/><path d="M16 7v2" stroke="#e9e5d8" stroke-width="2"/><path d="M16 ${palmTop}h6v${palmBottom-palmTop}h-6z" fill="${skin}" stroke="${skinD}" stroke-width="1"/></g></g>`:'';
 return `<svg class="portrait" data-expression="${expression}" data-pose="${pose}" data-outfit="${outfit}"${facing==='monitor'?' data-facing="monitor"':''} data-head-scale="${STUDENT_HEAD_SCALE}" data-body-proportion="3.5"${hairStyle!=='loose'?` data-hair-style="${hairStyle}"`:''} viewBox="0 0 320 496" role="img" aria-label="${title}"><title>${title}</title><g class="hair-fringe chibi-grid ${expression==='sad'?'expression-tear':''}" shape-rendering="crispEdges" transform="translate(0 24) scale(2)">${rects}</g>${arm}</svg>`;
}
