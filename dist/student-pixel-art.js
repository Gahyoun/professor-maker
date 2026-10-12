import {EXPRESSIONS,normalizeExpression} from './student-reaction.js';

const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const STUDENT_HEAD_SCALE=.58;

function parseHex(hex){
 const m=String(hex||'#000000').replace('#','').match(/../g)||['00','00','00'];
 return m.map(c=>parseInt(c,16)||0);
}
function hexLum(hex){
 const [r,g,b]=parseHex(hex);
 return (0.299*r+0.587*g+0.114*b)/255;
}
const mix=(a,b,t)=>{
 const pA=parseHex(a),pB=parseHex(b);
 return '#'+pA.map((v,i)=>Math.round(v*(1-t)+pB[i]*t).toString(16).padStart(2,'0')).join('');
};

// Integer raster art: the public 320 × 496 frame is shared by every activity.
// Cosmetics are read from saved appearance fields and never consume game RNG.
export function renderStudentPortrait(a,label='학생 도트 초상화',expression='neutral',pose='standing',facing='front'){
 expression=normalizeExpression(expression);
 pose=['standing','seated','experiment','lecturing'].includes(pose)?pose:'standing';
 facing=pose==='seated'&&facing==='monitor'?'monitor':'front';
 const W=80,H=118,raster=()=>Array.from({length:H},()=>Array(W).fill(null));
 const backHead=raster(),body=raster(),frontHead=raster();let pixels=backHead;
 const put=(x,y,c)=>{if(x>=0&&x<W&&y>=0&&y<H)pixels[y][x]=c;};
 const row=(y,x0,x1,c)=>{for(let x=x0;x<=x1;x++)put(x,y,c);};
 const box=(x0,y0,x1,y1,c)=>{for(let y=y0;y<=y1;y++)row(y,x0,x1,c);};
 const poly=(points,c)=>{
  const lo=Math.max(0,Math.floor(Math.min(...points.map(p=>p[1])))),hi=Math.min(H-1,Math.ceil(Math.max(...points.map(p=>p[1]))));
  for(let y=lo;y<=hi;y++){const xs=[];for(let i=0;i<points.length;i++){const [x1,y1]=points[i],[x2,y2]=points[(i+1)%points.length];if((y1>y+.5)!==(y2>y+.5))xs.push(x1+(y+.5-y1)*(x2-x1)/(y2-y1));}xs.sort((a,b)=>a-b);for(let i=0;i+1<xs.length;i+=2)row(y,Math.ceil(xs[i]),Math.floor(xs[i+1]),c);}
 };
 const oval=(cx,cy,rx,ry,c)=>{for(let y=Math.floor(cy-ry);y<=cy+ry;y++){const d=(y+.5-cy)/ry;if(Math.abs(d)>1)continue;const r=Math.floor(rx*Math.sqrt(1-d*d));row(y,cx-r,cx+r,c);}};
 const l=Math.max(0,Math.min(6,a.hairLength??3)),fringe=(a.fringe??0)%16,outfit=a.outfit??0;

 // Global hair palette highlight & shadow derivation:
 const hairHex=a.hair??'#282827';
 const hairTones=(()=>{
  const [r,g,b]=parseHex(hairHex);
  const lum=(0.299*r+0.587*g+0.114*b)/255;
  const isBlonde=lum>=0.52||(r>=165&&g>=135&&b>=60&&r>b*1.3);
  const isRed=!isBlonde&&((r>=115&&r>g*1.25&&r>b*1.4)||(r>=130&&g<=95&&b<=75));
  const isBrown=!isBlonde&&!isRed&&(lum>=0.13?(r>b*1.25&&r>=g):(r>b*1.6));
  const isBlack=!isBlonde&&!isRed&&!isBrown;
  if(isBlonde){
   return {
    hair:hairHex,
    hairD:mix(hairHex,'#4a2c0c',0.42),
    hairM:mix(hairHex,'#fff7dd',0.22),
    hairH:mix(hairHex,'#fffdf2',0.45),
    edge:mix(hairHex,'#2d1804',0.65),
   };
  }
  if(isRed){
   return {
    hair:hairHex,
    hairD:mix(hairHex,'#2b0704',0.42),
    hairM:mix(hairHex,'#f88f58',0.22),
    hairH:mix(hairHex,'#ffdfc4',0.42),
    edge:mix(hairHex,'#1c0503',0.65),
   };
  }
  if(isBlack){
   return {
    hair:hairHex,
    hairD:mix(hairHex,'#07080c',0.45),
    hairM:mix(hairHex,'#464856',0.25),
    hairH:mix(hairHex,'#6c7082',0.48),
    edge:mix(hairHex,'#040407',0.65),
   };
  }
  // Brown (chestnut, warm brunette, espresso)
  return {
   hair:hairHex,
   hairD:mix(hairHex,'#120a06',0.42),
   hairM:mix(hairHex,'#a4704e',0.20),
   hairH:mix(hairHex,'#cca17c',0.38),
   edge:mix(hairHex,'#0d0705',0.65),
  };
 })();

 const hair=a.hairCustom??hairTones.hair;
 const hairD=a.hairD??hairTones.hairD;
 const hairM=a.hairM??hairTones.hairM;
 const hairH=a.hairH??hairTones.hairH;
 const edge=a.edge??hairTones.edge;

 // Global skin tone, neck shadow and blush derivation:
 const rawSkin=a.skin||'#e8c6ab';
 const skinTones=(()=>{
  const lum=hexLum(rawSkin);
  if(lum>=0.68){
   const s=mix(rawSkin,'#fff5ea',0.14);
   return {
    skin:s,
    skinD:mix(s,'#b77968',0.26),
    skinH:mix(s,'#fff9ee',0.42),
    blush1:'#e79a9f',blush2:'#edb0ac',blushH:'#ffe0d5',blushD:'#d68d92',
   };
  }
  if(lum>=0.46){
   const s=rawSkin;
   return {
    skin:s,
    skinD:mix(s,'#5a2a16',0.36),
    skinH:mix(s,'#ffdfbf',0.28),
    blush1:'#c76858',blush2:'#d87f70',blushH:'#e9a393',blushD:'#a4473b',
   };
  }
  // Deep brown / rich dark skin
  const s=rawSkin;
  return {
   skin:s,
   skinD:mix(s,'#140602',0.46),
   skinH:mix(s,'#ba744b',0.30),
   blush1:'#762434',blush2:'#8c3345',blushH:'#a1485b',blushD:'#581622',
  };
 })();

 const skin=a.skinCustom??skinTones.skin;
 const skinD=a.skinD??skinTones.skinD;
 const skinH=a.skinH??skinTones.skinH;
 const {blush1,blush2,blushH,blushD}=skinTones;

 const shirt=a.shirt||'#456c87',pants='#354359',pantsH='#4e5c75',pantsD='#293143',white='#f4f0eb';
 const top=[white,shirt,shirt,'#f0e9dd','#e2d0b5','#344056'][outfit]??shirt,topH=mix(top,'#fff4e9',.22),topD=mix(top,'#303244',.22);

 const isHijab=Boolean(a.hijab||a.headwear==='hijab'||a.hairStyle==='hijab');
 const isBald=!isHijab&&(a.hairStyle==='bald'||Boolean(a.bald));
 const isBuzz=!isHijab&&!isBald&&(a.hairStyle==='buzz'||Boolean(a.buzzCut)||(l===0&&!isBald));
 const isAfro=!isHijab&&!isBuzz&&!isBald&&Boolean(a.afro||a.hairStyle==='afro');
 const isCoily=!isHijab&&!isBuzz&&!isBald&&!isAfro&&Boolean(a.coily||a.hairStyle==='coily');
 const isCurly=!isHijab&&!isBuzz&&!isBald&&!isAfro&&(Boolean(a.curly)||isCoily);
 const isDisheveled=!isHijab&&!isBald&&!isBuzz&&!isAfro&&(a.hairStyle==='disheveled'||Boolean(a.disheveled));
 const isTwoTone=!isHijab&&!isBald&&!isBuzz&&(a.hairStyle==='twoTone'||Boolean(a.twoTone||a.secretTwoTone));
 const isBleached=!isHijab&&!isBald&&!isBuzz&&(a.hairStyle==='bleached'||Boolean(a.bleached));

 const scalpShine=mix(skinH,'#ffffff',0.48);
 const scalpShineBright=mix(skinH,'#ffffff',0.82);
 const twoToneAccent=a.twoToneColor??'#ede2c8';
 const twoToneAccentH=mix(twoToneAccent,'#ffffff',0.45);
 const twoToneAccentD=mix(twoToneAccent,'#523b18',0.45);

 // Traditional hijab fabric tones:
 const baseFabric=a.hijabColor??(a.shirt?mix(a.shirt,'#d0d8e0',0.22):'#536b5c');
 const fabric=mix(baseFabric,'#10151f',0.08);
 const fabricD=mix(fabric,'#04060b',0.38);
 const fabricM=mix(fabric,'#ffffff',0.16);
 const fabricH=mix(fabric,'#ffffff',0.38);
 const undercap=mix(fabric,'#ffffff',0.28);
 const pinGold='#ffd700',pinGoldH='#fff4cc',pinGoldD='#b38600';

 // Back hair / drapery:
 if(isHijab){
  poly([[16,32],[64,32],[66,52],[64,76],[58,80],[22,80],[16,76],[14,52]],fabricD);
  poly([[20,36],[60,36],[62,74],[56,78],[24,78],[18,74]],fabric);
  for(const x of [22,30,48,56]){
   poly([[x,42],[x+3,40],[x+2,76],[x,78]],fabricD);
   poly([[x+3,40],[x+5,40],[x+4,76],[x+2,76]],fabricM);
  }
 }else if(isAfro){
  oval(40,25,31,28,hairD);
  for(let deg=0;deg<360;deg+=12){
   const rad=deg*Math.PI/180;
   const bx=Math.round(40+30.5*Math.cos(rad));
   const by=Math.round(25+27.5*Math.sin(rad));
   if(by<54){put(bx,by,hairD);put(bx+(deg%2===0?1:-1),by,hair);}
  }
 }else if(!isBuzz&&!isBald&&l){
  oval(40,32,27,25,hairD);
  if(l>=3){const end=[0,0,0,67,77,89,100][l];poly([[14,32],[66,32],[67,end-8],[64,end-2],[60,end],[56,end-5],[53,end],[27,end],[24,end-4],[20,end],[16,end-2],[13,end-8]],hairD);
   for(const x of [17,22,57,62])poly([[x,40],[x+3,39],[x+2,end-5],[x,end-2]],hairM);
   poly([[14,42],[18,44],[17,end-4],[14,end-9]],hair);
   poly([[62,38],[65,35],[65,end-7],[62,end-2]],hair);
   if(isTwoTone){
    for(const x of [16,19,23,57,60,63]){
     put(x,end-4,twoToneAccent);put(x,end-3,twoToneAccentH);put(x+1,end-2,twoToneAccentD);
    }
   }
  }
  if(isDisheveled){
   for(const [x,y] of [[12,28],[11,36],[12,45],[67,27],[68,37],[67,46],[13,56],[66,57],[14,68],[65,69]]){
    put(x,y,hairD);put(x+(x<40?1:-1),y,hair);
   }
  }
 }

 // Soft jaw: warm shadow on the lower and right edges, no rectangular chin.
 oval(40,42,22,24,skinD);oval(39,40,22,23,skin);
 box(17,42,20,48,skin);box(59,42,62,48,skinD);box(18,43,19,46,skinD);box(59,43,60,46,skin);
 poly([[24,35],[27,29],[35,25],[43,25],[42,29],[30,31]],skinH);
 row(62,33,46,skinD);row(63,36,43,skinD);

 if(isBuzz){
  oval(40,26,24,18,hairD);
  oval(40,25,23,17,hair);
  oval(39,23,21,15,hairM);
  poly([[30,15],[50,15],[46,18],[34,18]],hairH);
  poly([[24,29],[56,29],[58,31],[60,36],[58,38],[56,31],[24,31],[22,38],[20,36],[22,31]],hairD);
  poly([[26,30],[54,30],[56,33],[24,33]],hair);
  for(let y=14;y<=29;y+=2){
   for(let x=22+(y%3);x<=58-(y%3);x+=3){
    put(x,y,(x+y)%2===0?hair:hairM);
   }
  }
  for(let y=32;y<=42;y++){
   put(19,y,hairD);put(20,y,hair);
   put(61,y,hairD);put(60,y,hair);
  }
 }else if(isBald){
  // Smooth bald cranium (완전 대머리/민머리): pure skin tones with no follicle dots
  oval(40,26,24,18,skinD);
  oval(39,25,23,17,skin);
  oval(39,22,21,14,skinH);
  poly([[26,28],[54,28],[56,31],[24,31]],skin);
  poly([[28,26],[52,26],[50,29],[30,29]],skinH);
  // Specular scalp shine on crown (정수리에 은은하게 맺히는 두상 반짝임 하이라이트):
  oval(37,16,7,3,scalpShine);
  poly([[33,16],[41,15],[43,16],[39,17],[33,17]],scalpShineBright);
  put(37,15,'#ffffff');put(38,15,'#ffffff');
  put(36,16,scalpShineBright);put(39,16,scalpShine);
 }

 // Short torso, roomy shoulders and sleeves; two compact trouser legs.
 pixels=body;
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

 // Headwear & hair front layer:
 pixels=frontHead;
 if(isHijab){
  oval(40,29,27,24,fabric);
  oval(40,27,25,22,fabricM);
  poly([[24,16],[32,12],[48,12],[56,16],[52,19],[40,15],[28,19]],fabricH);
  poly([[30,13],[36,11],[44,11],[50,13],[46,15],[40,14],[34,15]],fabricH);

  const capShift=(fringe%4)-1;
  poly([[25,29+capShift],[40,28+capShift],[55,29+capShift],[54,32+capShift],[40,31+capShift],[26,32+capShift]],undercap);
  row(32+capShift,27,53,fabricD);

  poly([[14,28],[24,28],[24,60],[28,64],[23,64],[14,56]],fabric);
  poly([[16,30],[22,30],[22,58],[16,54]],fabricM);
  poly([[66,28],[56,28],[56,60],[52,64],[57,64],[66,56]],fabricD);
  poly([[64,30],[58,30],[58,58],[64,54]],fabric);

  poly([[26,61],[54,61],[50,67],[40,68],[30,67]],fabric);
  poly([[28,62],[52,62],[48,66],[40,67],[32,66]],fabricM);
  row(67,34,46,fabricD);

  poly([[22,68],[34,66],[46,66],[58,68],[59,81],[53,85],[40,86],[27,85],[21,81]],fabric);
  poly([[35,67],[38,77],[36,84],[33,76]],fabricD);
  poly([[38,67],[42,78],[44,84],[40,77]],fabricM);
  poly([[43,67],[46,77],[49,84],[46,76]],fabricH);
  poly([[26,71],[31,80],[29,83]],fabricD);
  poly([[54,71],[49,81],[51,84]],fabricH);

  put(51,63,pinGold);put(52,63,pinGoldH);
  put(51,64,pinGoldD);put(52,64,pinGold);
 }else if(isAfro){
  oval(40,24,30,27,hair);
  oval(40,22,27,24,hairM);
  poly([[24,16],[32,11],[48,11],[56,16],[52,20],[40,16],[28,20]],hairH);
  poly([[28,14],[36,12],[44,12],[52,14],[48,17],[40,15],[32,17]],hairH);
  poly([[22,33],[30,28],[50,28],[58,33],[54,36],[40,31],[26,36]],hairD);
  poly([[24,32],[32,29],[48,29],[56,32],[52,34],[40,30],[28,34]],hair);
  for(let y=10;y<=40;y+=3){
   for(let x=15;x<=65;x+=3){
    const dx=(x-40)/30,dy=(y-25)/27;
    if(dx*dx+dy*dy<=0.88){
     if(y>=31&&x>=26&&x<=54)continue;
     const curlSeed=(x*17+y*31+fringe*7)%4;
     if(curlSeed===0){put(x,y,hairD);put(x+1,y,hairM);put(x,y+1,hair);}
     else if(curlSeed===1){put(x,y,hairM);put(x+1,y+1,hairH);}
     else if(curlSeed===2){put(x,y,hairD);put(x+1,y+1,hair);}
    }
   }
  }
 }else if(!isBuzz&&!isBald&&l){
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
  if(isCoily){
   for(const [cx,cy] of [[16,19],[24,13],[33,10],[40,9],[47,11],[56,17],[63,24],[13,30],[65,31]]){
    oval(cx,cy,5,5,hair);
    poly([[cx-2,cy-2],[cx+2,cy-1],[cx+3,cy+2],[cx,cy+2],[cx-2,cy]],hairM);
    put(cx,cy-2,hairH);put(cx+1,cy-1,hairH);
    put(cx-1,cy+1,hairD);put(cx+2,cy+1,hairD);
   }
   if(l>=2){
    const coilyEnd=[0,0,58,68,78,90,101][l];
    for(let y=42;y<coilyEnd-4;y+=6){
     const step=Math.floor((y-42)/6);
     const shiftL=(step%2===0)?-1:2;
     const shiftR=(step%2===0)?2:-1;
     oval(15+shiftL,y,4,5,hair);
     poly([[13+shiftL,y-2],[17+shiftL,y-1],[16+shiftL,y+2],[12+shiftL,y]],hairM);
     put(15+shiftL,y-2,hairH);put(16+shiftL,y-1,hairH);
     row(y+2,13+shiftL,16+shiftL,hairD);
     oval(64+shiftR,y,4,5,hairD);
     poly([[62+shiftR,y-2],[66+shiftR,y-1],[65+shiftR,y+2],[61+shiftR,y]],hair);
     put(63+shiftR,y-2,hairM);put(64+shiftR,y-1,hairH);
     row(y+2,62+shiftR,65+shiftR,edge);
    }
    oval(15,coilyEnd-2,4,4,hair);put(15,coilyEnd-3,hairH);put(16,coilyEnd-2,hairM);put(14,coilyEnd-1,hairD);
    oval(64,coilyEnd-2,4,4,hairD);put(64,coilyEnd-3,hairM);put(65,coilyEnd-2,hairH);
   }
  }else if(isCurly){
   for(const [x,y]of [[17,20],[25,14],[36,11],[48,13],[58,20],[13,32],[63,33]]){oval(x,y,5,4,hair);poly([[x-2,y-2],[x+2,y-2],[x+3,y],[x,y+1],[x-2,y]],hairM);put(x,y-1,hairH);}
   if(l>=2){
    for(let y=44;y<([0,0,58,67,77,89,100][l]);y+=8){
     oval(15,y,4,5,hair);oval(64,y+2,4,5,hairD);row(y-2,13,16,hairM);row(y,62,65,hairM);
     put(15,y-1,hairH);put(64,y+1,hairH);
    }
   }
  }
 }

 // Open eye styles for every neutral face; expressive closed eyes use broad arcs.
 const ink='#303044',iris=mix(hair,'#405778',.55),eyeY=42;
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
 // Adaptive blush clusters, light cheek accents and distinct mouths.
 if(isHijab){
  row(53,25,27,blush1);row(54,25,28,blush2);row(53,52,54,blush1);row(54,51,54,blush2);put(26,52,blushH);put(53,52,blushH);put(40,54,skinD);put(27,55,blushD);put(52,55,blushD);
 }else{
  row(53,21,27,blush1);row(54,22,27,blush2);row(53,52,58,blush1);row(54,52,57,blush2);put(22,52,blushH);put(56,52,blushH);put(40,54,skinD);put(24,55,blushD);put(54,55,blushD);
 }
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
  pixels=backHead;
  const end=[0,0,0,70,81,92,101][l];
  if(isHijab){
   poly([[14,30],[48,30],[52,48],[48,78],[40,82],[22,81],[14,74]],fabricD);
   poly([[18,34],[44,34],[46,76],[38,80],[24,79],[18,72]],fabric);
   for(const x of [22,32,40]){
    poly([[x,40],[x+3,38],[x+2,76],[x,78]],fabricD);
    poly([[x+3,38],[x+5,38],[x+4,76],[x+2,76]],fabricM);
   }
  }else if(isAfro){
   oval(34,26,30,28,hairD);
   for(let deg=0;deg<360;deg+=12){
    const rad=deg*Math.PI/180;
    const bx=Math.round(34+29.5*Math.cos(rad));
    const by=Math.round(26+27.5*Math.sin(rad));
    if(by<54){put(bx,by,hairD);put(bx+(deg%2===0?1:-1),by,hair);}
   }
  }else if(!isBuzz&&!isBald&&l>=3){
   poly([[13,32],[42,32],[44,46],[42,end-8],[38,end-2],[32,end],[24,end-2],[17,end-6],[13,end-10]],hairD);
   poly([[16,40],[22,38],[21,end-7],[16,end-3]],mix(hairD,hair,.3));
  }
  // The pelvis rests on the chair; thighs reach forward before the calves drop.
  pixels=body;
  box(35,63,45,68,skinD);
  poly([[27,68],[39,65],[50,67],[54,74],[54,91],[49,96],[28,94],[24,87],[24,75]],top);
  poly([[27,70],[32,68],[31,88],[28,91],[25,86],[25,74]],topH);
  poly([[48,68],[54,72],[57,78],[53,83],[48,80]],topD);
  row(92,29,49,topD);row(93,30,48,topD);
  if(outfit===0){poly([[31,68],[38,66],[46,67],[50,71],[44,73],[34,73]],'#dbe3df');box(40,74,41,92,'#c4ceca');row(86,29,35,'#c5d2d0');box(28,94,50,97,white);}
  else if(outfit===2){poly([[29,69],[34,65],[44,65],[50,69],[47,73],[33,73]],topD);poly([[32,83],[46,83],[48,88],[30,88]],topH);}
  else if(outfit===4){for(const y of [77,85]){row(y,27,51,shirt);row(y+1,27,51,shirt);}}
  else if(outfit===5){poly([[30,68],[36,66],[42,67],[43,72],[36,73]],topH);box(42,73,43,92,topD);}
  // Forearms reach the desktop, with the hands immediately above the keyboard.
  poly([[28,73],[32,72],[37,81],[42,84],[49,83],[58,81],[60,83],[49,87],[41,89],[31,84],[27,77]],topH);
  poly([[50,71],[55,72],[58,79],[68,82],[70,84],[66,87],[56,84],[52,77]],top);
  box(58,81,63,83,skin);row(83,58,63,skinD);box(68,83,73,85,skin);row(85,68,73,skinD);
  poly([[43,94],[49,94],[69,95],[73,98],[72,102],[65,101],[57,98],[43,98]],pantsD);
  poly([[30,94],[43,94],[60,96],[64,98],[63,102],[57,102],[46,99],[32,99]],pants);
  poly([[71,99],[76,99],[76,107],[71,108],[69,104]],pantsD);
  poly([[58,99],[64,99],[63,107],[58,108],[56,104]],pants);
  poly([[34,94],[43,94],[59,96],[61,98],[55,98],[42,97]],pantsH);
  poly([[50,94],[57,94],[70,96],[72,98],[68,98],[57,97]],pantsH);
  box(58,101,60,106,pantsH);box(71,101,72,106,pantsH);
  box(56,108,67,111,'#39303e');box(70,108,78,111,'#39303e');
  row(108,57,65,'#726174');row(108,71,77,'#726174');row(111,56,67,'#222432');row(111,70,78,'#222432');
  // One eye and a stepped cheek silhouette make the viewing direction clear.
  pixels=frontHead;
  oval(43,40,21,23,skinD);poly([[45,24],[56,29],[61,35],[61,40],[66,43],[63,46],[63,54],[57,61],[47,63],[39,58],[37,39]],skin);
  row(59,49,58,skinD);put(65,44,skinH);box(60,51,63,54,blush2);put(61,51,blushH);
  const closed=['happy','delighted','relieved'].includes(expression),eyeBottom=['tired','sad'].includes(expression)?47:50;
  if(closed){row(43,57,59,ink);row(44,56,57,ink);row(44,59,61,ink);}
  else{box(56,41,61,eyeBottom,'#fff0e3');box(57,41,60,eyeBottom,iris);box(58,42,60,eyeBottom-2,ink);row(40,55,61,ink);box(57,41,58,43,'#fff8ec');put(59,eyeBottom-1,'#8399ad');}
  row(37,55,60,hairD);row(56,58,61,mouth);
  if(a.glasses){row(39,54,62,'#514658');row(51,54,62,'#514658');box(53,40,54,50,'#514658');box(62,40,63,50,'#514658');row(42,47,54,'#514658');put(55,40,'#f9eeec');}

  // The rear crown / hijab / afro / buzz:
  if(isHijab){
   oval(35,30,24,24,fabricD);
   poly([[12,33],[14,22],[20,15],[30,10],[42,10],[52,16],[58,25],[58,36],[53,44],[46,52],[37,56],[24,55],[16,48],[12,39]],fabric);
   poly([[18,18],[26,14],[36,13],[46,17],[42,20],[32,17],[23,20]],fabricM);
   poly([[24,16],[32,15],[31,17],[24,18]],fabricH);
   poly([[43,24],[52,28],[55,34],[52,36],[45,30]],undercap);
   poly([[43,50],[48,52],[54,58],[48,62],[42,56]],fabric);
   poly([[34,54],[46,56],[48,66],[36,66]],fabricD);
   poly([[36,56],[44,57],[46,65],[38,65]],fabric);
   poly([[14,58],[34,55],[48,57],[52,75],[46,80],[32,82],[20,80],[14,72]],fabricD);
   poly([[18,60],[34,57],[44,59],[48,73],[42,78],[30,80],[22,78],[16,70]],fabric);
   for(const x of [22,30,38]){
    poly([[x,60],[x+3,59],[x+2,77],[x,78]],fabricD);
    poly([[x+3,59],[x+5,59],[x+4,76],[x+2,77]],fabricM);
   }
   put(47,53,pinGold);put(48,53,pinGoldH);put(47,54,pinGoldD);
  }else if(isAfro){
   oval(34,25,29,27,hair);
   oval(33,23,26,24,hairM);
   poly([[20,16],[28,12],[42,12],[48,16],[44,19],[34,16],[24,19]],hairH);
   for(let y=10;y<=42;y+=3){
    for(let x=10;x<=58;x+=3){
     const dx=(x-34)/29,dy=(y-25)/27;
     if(dx*dx+dy*dy<=0.88){
      const curlSeed=(x*19+y*29+fringe*5)%4;
      if(curlSeed===0){put(x,y,hairD);put(x+1,y,hairM);}
      else if(curlSeed===1){put(x,y,hairM);put(x+1,y+1,hairH);}
      else if(curlSeed===2){put(x,y,hairD);put(x+1,y+1,hair);}
     }
    }
   }
  }else if(isBuzz){
   oval(34,31,23,24,hairD);
   oval(34,29,22,23,hair);
   oval(33,27,19,20,hairM);
   poly([[26,17],[42,17],[39,20],[29,20]],hairH);
   for(let y=46;y<=54;y++){
    const w=Math.floor((54-y)*1.5);
    row(y,34-w,34+w,y>=51?hairD:hair);
   }
   for(let y=16;y<=44;y+=2){
    for(let x=16+(y%3);x<=50-(y%3);x+=3){
     put(x,y,(x+y)%2===0?hair:hairM);
    }
   }
  }else if(isBald){
   // Smooth bald scalp in monitor view facing screen:
   oval(34,31,23,24,skinD);
   oval(34,29,22,23,skin);
   oval(33,26,19,20,skinH);
   for(let y=46;y<=54;y++){
    const w=Math.floor((54-y)*1.5);
    row(y,34-w,34+w,y>=51?skinD:skin);
   }
   // Specular scalp shine on crown in monitor view:
   oval(32,17,7,3,scalpShine);
   poly([[28,17],[35,16],[37,17],[33,18],[28,18]],scalpShineBright);
   put(32,16,'#ffffff');put(33,16,'#ffffff');
   put(31,17,scalpShineBright);put(34,17,scalpShine);
  }else{
   oval(34,32,23,24,hairD);
   poly([[11,35],[12,26],[16,18],[24,13],[34,9],[45,10],[53,15],[58,23],[58,33],[54,39],[47,42],[45,33],[39,37],[39,51],[33,56],[22,54],[15,49],[11,41]],hair);
   poly([[15,23],[22,16],[32,13],[43,14],[51,18],[46,20],[35,16],[25,19],[18,25]],hairM);
   poly([[20,18],[27,14],[35,14],[34,17],[26,19]],hairH);poly([[38,16],[44,17],[48,20],[42,20]],hairH);
   poly([[13,31],[17,27],[23,26],[25,34],[20,41],[14,40]],hairM);poly([[16,33],[20,30],[21,35],[17,37]],hairH);
   poly([[16,47],[22,45],[33,48],[32,53],[22,52],[15,49]],hairD);
   const fringeShift=(fringe%4)+(fringe>=8?1:0);
   poly([[42,20],[53,24],[58,28],[58,37],[54,35],[52,41],[49,33],[46,30+fringeShift]],(fringe%2)?hair:hairM);
   poly([[42,40],[46,42],[47,50],[44,52],[42,46]],hairD);put(45,45,hairM);
   if(l===1){
    poly([[15,45],[21,48],[31,51],[34,54],[28,55],[19,53],[14,48]],hair);
    poly([[17,47],[23,50],[30,52],[28,54],[20,52]],hairD);row(51,20,26,hairM);
   }else if(l===2){
    poly([[13,44],[18,50],[21,58],[18,62],[15,57],[13,50]],hair);poly([[15,48],[19,53],[18,60],[16,56]],hairM);
    poly([[19,49],[25,51],[29,59],[26,63],[22,60],[18,53]],hair);poly([[22,52],[26,55],[25,61],[21,57]],hairM);
    poly([[27,51],[33,52],[35,58],[32,62],[28,59],[25,53]],hairD);poly([[29,53],[32,56],[31,60],[28,57]],hairM);
   }else if(l===3){
    poly([[13,44],[16,51],[19,59],[19,65],[17,69],[15,68],[14,63],[13,54]],hair);
    poly([[15,48],[17,56],[18,64],[16,67],[15,63]],hairM);
    poly([[17,48],[28,49],[38,49],[42,53],[42,61],[39,67],[35,70],[31,70],[27,68],[22,67],[19,63],[17,55]],hair);
    poly([[19,51],[21,60],[22,66],[20,66],[18,55]],hairD);
    poly([[24,50],[28,50],[29,64],[27,66],[25,54]],hairM);
    poly([[25,53],[28,53],[28,61],[26,63],[25,55]],hairH);
    poly([[31,51],[35,51],[36,62],[34,67],[32,67],[32,60]],hairD);
    poly([[34,52],[38,52],[38,61],[36,65],[34,62]],hairM);
    poly([[43,42],[49,41],[53,56],[50,60],[47,60],[45,52],[43,46]],hairD);
    poly([[46,44],[49,43],[51,55],[48,58]],hairM);
   }else{
    const leftTip=end-6,midTip=end,rightTip=end-4,waistY=Math.round(54+(end-54)*.45);
    poly([[13,44],[16,51],[18,60],[19,waistY],[18,leftTip-8],[19,leftTip-5],[17,leftTip],[15,leftTip-3],[14,leftTip-7],[13,55]],hair);
    poly([[15,48],[17,57],[18,waistY],[17,leftTip-7],[16,leftTip-4]],hairM);
    poly([[17,48],[27,49],[37,49],[42,53],[42,63],[40,waistY],[38,midTip-8],[36,midTip],[33,midTip-2],[30,rightTip],[27,rightTip-2],[24,end-8],[20,end-10],[18,waistY+4],[16,56]],hair);
    poly([[18,51],[21,62],[21,waistY],[22,leftTip-6],[20,leftTip-4],[19,waistY-2],[17,55]],hairD);
    poly([[24,50],[28,50],[29,Math.min(end-10,74)],[27,Math.min(end-8,76)],[25,54]],hairM);
    poly([[25,53],[28,53],[28,Math.min(end-14,69)],[26,Math.min(end-12,71)],[25,55]],hairH);
    poly([[31,51],[34,51],[35,waistY],[34,rightTip-6],[32,rightTip-3],[30,rightTip-5],[32,62]],hairD);
    poly([[34,52],[38,52],[38,waistY-2],[36,rightTip-7],[34,rightTip-4],[34,63]],hairM);
    const frontEnd=Math.min(60,end-7);
    poly([[43,42],[49,41],[53,frontEnd-5],[50,frontEnd],[47,frontEnd],[45,52],[43,46]],hairD);
    poly([[46,44],[49,43],[51,frontEnd-6],[48,frontEnd-2]],hairM);
    if(isTwoTone){
     for(const x of [16,20,25,31,36]){
      put(x,end-3,twoToneAccent);put(x,end-2,twoToneAccentH);
     }
    }
   }
   if(isDisheveled){
    for(const [x,y] of [[10,32],[9,40],[11,50],[12,62],[45,28],[48,34],[46,44]]){
     put(x,y,hairD);put(x+(x<34?1:-1),y,hair);
    }
   }
   if(isCoily){
    for(const [x,y]of [[15,23],[23,15],[36,13],[47,17],[12,34],[47,33]]){oval(x,y,4,4,hair);row(y-2,x-2,x+1,hairM);}
    if(l>=3){
     for(let y=48;y<end;y+=6){
      const phase=Math.floor(y/6)%2;
      const lx=15+(phase===0?0:3);
      oval(lx,y,4,4,hair);row(y-1,lx-1,lx+2,hairM);put(lx,y-2,hairH);row(y+1,lx-1,lx+2,hairD);
      const mx=26+(phase===0?3:-2);
      oval(mx,y+1,4,5,hairM);row(y,mx-1,mx+2,hairH);put(mx+1,y-1,hairH);row(y+2,mx-1,mx+2,hairD);
      const rx=35+(phase===0?-2:3);
      oval(rx,y,4,4,hairD);row(y-1,rx-1,rx+2,hair);put(rx,y-2,hairM);
     }
     oval(16,end-3,4,4,hair);put(16,end-4,hairH);
     oval(27,end-2,4,4,hairM);put(27,end-3,hairH);
     oval(35,end-3,4,4,hairD);put(35,end-4,hairM);
    }
   }else if(isCurly){
    for(const [x,y]of [[15,23],[23,15],[36,13],[47,17],[12,34],[47,33]]){oval(x,y,4,4,hair);row(y-2,x-2,x+1,hairM);}
    if(l>=3){
     for(let y=50;y<end-5;y+=8){
      const wavePhase=Math.floor(y/8)%2;
      const leftWaveX=wavePhase===0?14:16;
      oval(leftWaveX,y,3,4,hair);row(y-1,leftWaveX-1,leftWaveX+1,hairM);
      const midWaveX=25+(wavePhase===0?3:-2);
      oval(midWaveX,y,4,4,hairM);row(y,midWaveX-1,midWaveX+2,hairH);
      const rightWaveX=34+(wavePhase===0?-2:3);
      oval(rightWaveX,y+2,3,4,hairD);
     }
     oval(16,end-5,3,3,hair);put(15,end-6,hairM);
     oval(26,end-2,3,3,hairM);put(27,end-3,hairH);
     oval(34,end-3,3,3,hair);put(35,end-4,hairM);
    }
   }
  }
  if(!isHijab){oval(44,48,4,5,skinD);oval(45,47,3,4,skin);box(44,46,45,49,skinD);}
 }

 // About 3.5 head heights when standing: a 30px skull, a 38px torso and 36px
 // legs. Seated hips stay on the chair; the hands still meet the desktop.
 // A finer integer output grid preserves eyes/glasses as the skull gets smaller.
 const seated=pose==='seated',neck=seated?45:37,hip=seated?(facing==='monitor'?82:88):75,foot=111,precision=2;
 const bodyY=y=>y<=94?neck+(y-66)*(hip-neck)/28:hip+(y-94)*(foot-hip)/17;
 const outputW=W*precision,outputH=H*precision,composite=Array.from({length:outputH},()=>Array(outputW).fill(null));
 const overlay=(source,head)=>{for(let y=0;y<outputH;y++)for(let x=0;x<outputW;x++){
  const px=x/precision,py=y/precision;
  const tail=py>neck;
  const headWidth=STUDENT_HEAD_SCALE+(tail?.15*Math.min(1,(py-neck)/8):0);
  const sx=Math.round(head?40+(px-40)/headWidth:px);
  const sy=Math.round(head?66+(py-neck)/(tail?1.5:STUDENT_HEAD_SCALE):py<=hip?66+(py-neck)*28/(hip-neck):94+(py-hip)*17/(foot-hip));
  const color=source[sy]?.[sx];if(color)composite[y][x]=color;
 }};
 overlay(backHead,true);overlay(body,false);overlay(frontHead,true);pixels=composite;

 // A single pixel coloured contour keeps the delicate edges readable at 80%.
 const outlined=pixels.map(r=>r.slice());
 for(let y=0;y<outputH;y++)for(let x=0;x<outputW;x++)if(!pixels[y][x]){const n=[pixels[y-1]?.[x],pixels[y+1]?.[x],pixels[y][x-1],pixels[y][x+1]].find(Boolean);if(n)outlined[y][x]=mix(n,edge,.65);}
 let rects='';for(let y=0;y<outputH;y++){let x=0;while(x<outputW){const c=outlined[y][x];if(!c){x++;continue;}let end=x;while(end+1<outputW&&outlined[y][end+1]===c)end++;rects+=`<rect x="${x}" y="${y}" width="${end-x+1}" height="1" fill="${c}"/>`;x=end+1;}}
 const styles=['까까머리','크롭컷','짧은 머리','중간 길이 머리','단발','어깨 길이 머리','긴 머리'];
 const styleLabel=isHijab?'히잡':isAfro?'아프로':isBald?'대머리':isBuzz?'까까머리':isDisheveled?'폐인 장발':styles[l];
 const curlLabel=isHijab||isAfro||isBald?'':isCoily?' · 입체 곱슬머리':(isCurly&&l?' · 곱슬머리':'');
 const toneLabel=isTwoTone?' · 시크릿투톤':isBleached?' · 탈색모':'';
 const fringeLabel=(l&&!isHijab&&!isAfro&&!isBald)?` · 앞머리 ${fringe+1}`:'';
 const title=escape(`${label} · ${EXPRESSIONS[expression]} · ${styleLabel}${curlLabel}${toneLabel}${a.glasses?' · 안경':''}${fringeLabel}${pose==='lecturing'?' · 칠판 앞에서 강의':''}${facing==='monitor'?' · 모니터를 바라보며 앉음':''}`);
 // The raised TA arm shares the new torso coordinates; the pointer is shortened
 // independently so stretching the torso cannot pull its tip outside the frame.
 const armPoints=[[13,36],[16,36],[16,41],[12,41],[12,38],[10,38],[10,35],[8,35],[8,30],[11,30],[11,33],[13,33]].map(([x,y])=>[x*2,Math.round(bodyY(y*2))-1]);
 const palmTop=Math.round(bodyY(58)),palmBottom=Math.round(bodyY(64)),grip=Math.round(bodyY(60));
 const arm=pose==='lecturing'?`<g transform="translate(0 24) scale(4)" shape-rendering="crispEdges"><g class="ta-lecture-arm"><path d="M${armPoints.map(([x,y])=>`${x} ${y}`).join('L')}z" fill="${top}" stroke="${topD}" stroke-width="1.2"/><path d="M18 ${grip}V${grip-6}H16V7" fill="none" stroke="#756353" stroke-width="2" class="ta-pointer"/><path d="M16 7v2" stroke="#e9e5d8" stroke-width="2"/><path d="M16 ${palmTop}h6v${palmBottom-palmTop}h-6z" fill="${skin}" stroke="${skinD}" stroke-width="1"/></g></g>`:'';
 const hairStyleAttr=isHijab?'hijab':isAfro?'afro':isBald?'bald':isBuzz?'buzz':isDisheveled?'disheveled':isTwoTone?'twoTone':isBleached?'bleached':isCoily?'coily':isCurly?'curly':'standard';
 const twoToneAttr=isTwoTone?' data-two-tone="true"':'';
 const bleachedAttr=isBleached?' data-bleached="true"':'';
 return `<svg class="portrait" data-expression="${expression}" data-pose="${pose}" data-outfit="${outfit}"${facing==='monitor'?' data-facing="monitor"':''} data-hair-style="${hairStyleAttr}"${twoToneAttr}${bleachedAttr} data-headwear="${isHijab?'hijab':'none'}" data-head-scale="${STUDENT_HEAD_SCALE}" data-body-proportion="3.5" viewBox="0 0 320 496" role="img" aria-label="${title}"><title>${title}</title><g class="hair-fringe chibi-grid ${expression==='sad'?'expression-tear':''}" shape-rendering="crispEdges" transform="translate(0 24) scale(2)">${rects}</g>${arm}</svg>`;
}
