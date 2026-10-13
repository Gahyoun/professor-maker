import {CONTENT_EN,localizeArtworkLabels} from './content-en.js';
import {studentEmotion,reactionEffects} from './student-reaction.js';
import {weeklyAppearance,renderPortrait} from './appearance.js';
import {renderStudentHairDrape} from './student-pixel-art.js';
import {activityProps,monitorMotion} from './activity-motion.js';
import {equipmentProfile,roomEquipment} from './lab-equipment.js';
import {labSeason} from './lab-season.js';
import {getDiscipline} from './disciplines.js';
// One shared axonometric projection for walls, floor, furniture and props.
// Seeded cosmetics never consume simulation RNG or affect research outcomes.
export const WALLPAPERS=['#faf8f2','#f3efe5','#eee5d7','#f7f4ec','#e8dfd0'];
export const FLOOR_TILES=[['#d5d7d6','#c9cdcd','#aeb5b5'],['#e1d3bc','#d6c6ac','#bcad94'],['#e9e3d6','#ded6c5','#c5bba8'],['#c8cbc9','#bfc4c1','#a5ada8']];
export const WINDOW_SEASONS=Object.freeze({
 spring:Object.freeze({
  season:'spring',
  label:'봄',
  sky:'#dbeafe',
  trees:Object.freeze(['#fbcfe8','#f472b6','#f9a8d4']),
  effectClass:'window-petals cherry-petals',
  effectAttr:'cherry-petals',
  effectLabel:'흩날리는 벚꽃 꽃잎 픽셀',
  particles:Object.freeze([
   [10.2,68,.35,.7,'#fbcfe8'],
   [11.8,62,.30,.6,'#f472b6'],
   [14.5,71,.35,.8,'#f9a8d4'],
   [16.2,65,.30,.6,'#fbcfe8'],
   [9.8,56,.35,.7,'#f472b6'],
   [12.4,50,.40,.8,'#f9a8d4'],
   [15.1,48,.30,.7,'#fbcfe8'],
   [17.0,53,.35,.6,'#f472b6'],
   [10.8,42,.30,.7,'#f9a8d4'],
   [14.2,39,.35,.8,'#fbcfe8']
  ])
 }),
 summer:Object.freeze({
  season:'summer',
  label:'여름',
  sky:'#93c5fd',
  trees:Object.freeze(['#15803d','#16a34a','#22c55e']),
  effectClass:'window-clouds cumulus-clouds',
  effectAttr:'cumulus-clouds',
  effectLabel:'뭉게구름 픽셀',
  particles:Object.freeze([
   [9.8,66,2.2,3.2,'#ffffff'],
   [9.5,64,2.8,2.5,'#f0f9ff'],
   [10.2,69,1.4,2.0,'#ffffff'],
   [11.6,65,1.2,2.2,'#e0f2fe'],
   [14.2,68,2.4,3.0,'#ffffff'],
   [13.8,66,3.2,2.4,'#f0f9ff'],
   [14.6,71,1.6,1.8,'#ffffff'],
   [16.2,67,1.4,2.0,'#e0f2fe']
  ])
 }),
 autumn:Object.freeze({
  season:'autumn',
  label:'가을',
  sky:'#fed7aa',
  trees:Object.freeze(['#facc15','#eab308','#dc2626']),
  effectClass:'window-leaves autumn-leaves',
  effectAttr:'autumn-leaves',
  effectLabel:'낙엽 픽셀',
  particles:Object.freeze([
   [10.5,69,.35,.8,'#facc15'],
   [12.0,63,.30,.7,'#dc2626'],
   [14.8,70,.40,.8,'#eab308'],
   [16.4,64,.35,.7,'#dc2626'],
   [9.9,55,.30,.8,'#eab308'],
   [12.2,51,.35,.7,'#facc15'],
   [15.0,49,.40,.8,'#dc2626'],
   [16.8,54,.30,.7,'#eab308'],
   [10.6,43,.35,.8,'#dc2626'],
   [13.8,40,.30,.7,'#facc15']
  ])
 }),
 winter:Object.freeze({
  season:'winter',
  label:'겨울',
  sky:'#cbd5e1',
  trees:Object.freeze(['#e2e8f0','#f1f5f9','#94a3b8']),
  effectClass:'window-snow pixel-snow',
  effectAttr:'pixel-snow',
  effectLabel:'내리는 픽셀 눈송이',
  particles:Object.freeze([
   [10.0,71,.30,.7,'#ffffff'],
   [11.5,65,.25,.6,'#f8fafc'],
   [13.0,69,.30,.7,'#ffffff'],
   [14.8,73,.25,.6,'#ffffff'],
   [16.2,67,.30,.7,'#f8fafc'],
   [9.6,58,.25,.6,'#ffffff'],
   [12.1,54,.30,.7,'#f8fafc'],
   [14.2,51,.25,.6,'#ffffff'],
   [16.0,56,.30,.7,'#ffffff'],
   [17.2,48,.25,.6,'#f8fafc'],
   [10.8,44,.30,.7,'#ffffff'],
   [13.5,41,.25,.6,'#ffffff'],
   [15.4,43,.30,.7,'#f8fafc']
  ])
 })
});
// Preserve the displayed academic month and the finished-calendar boundary.
export const miniRoomSeason=(state,options={idle:true})=>labSeason(state,options);
const shade=(hex,amount)=>'#'+hex.slice(1).match(/../g).map(c=>Math.max(0,Math.min(255,parseInt(c,16)+amount)).toString(16).padStart(2,'0')).join('');
export function projectRoom(u,v,z=0){return [300+(u-v)*9,96+(u+v)*4.5-z];}
const polygon=(points,fill,stroke)=>`<polygon points="${points.map(p=>p.join(',')).join(' ')}" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width=".8" stroke-linejoin="miter"`:''}/>`;
const plane=(points,fill,stroke)=>polygon(points.map(p=>projectRoom(...p)),fill,stroke);
function box(u,v,w,d,h,color,z=0){return plane([[u,v,z+h],[u+w,v,z+h],[u+w,v+d,z+h],[u,v+d,z+h]],shade(color,17),shade(color,-22))+plane([[u,v+d,z],[u+w,v+d,z],[u+w,v+d,z+h],[u,v+d,z+h]],color,shade(color,-22))+plane([[u+w,v,z],[u+w,v+d,z],[u+w,v+d,z+h],[u+w,v,z+h]],shade(color,-18),shade(color,-22));}
const line=(a,b,color,width=1)=>{const [x,y]=projectRoom(...a),[xx,yy]=projectRoom(...b);return `<path d="M${x} ${y}L${xx} ${yy}" stroke="${color}" stroke-width="${width}" fill="none"/>`;};
const front=(u,v,z,w,h,color)=>plane([[u,v,z],[u+w,v,z],[u+w,v,z+h],[u,v,z+h]],color);
const left=(u,v,z,d,h,color)=>plane([[u,v,z],[u,v+d,z],[u,v+d,z+h],[u,v,z+h]],color);
const isLecturing=(result,idle)=>!idle&&result.actual==='teach'&&result.performed===true&&result.outcome!=='training';
export const ROOM_ANCHORS=Object.freeze({standing:Object.freeze([23,14]),deskSeat:Object.freeze([13.5,23.5]),deskOccupant:Object.freeze([13.8,24.3]),plant:Object.freeze([24,19]),sofa:Object.freeze([20,5]),cot:Object.freeze([20,5]),spareCot:Object.freeze([19,24])});
function lectureDiagram(type,ink){
 const stroke=points=>`<path class="ta-board-stroke" pathLength="1" d="${points.map((p,i)=>`${i?'L':'M'}${projectRoom(...p).join(' ')}`).join('')}" fill="none" stroke="${ink}" stroke-width="1.3"/>`;
 return `<g class="ta-board-annotation" data-board-kind="${type}" aria-label="강의 개념 도표">`+
 stroke([[17.5,.26,47],[19.2,.26,47],[19.2,.26,40],[17.5,.26,40],[17.5,.26,47]])+
 stroke([[19.5,.26,43.5],[21.4,.26,43.5],[20.9,.26,45],[21.4,.26,43.5],[20.9,.26,42]])+
 stroke([[21.8,.26,47],[23.5,.26,47],[23.5,.26,40],[21.8,.26,40],[21.8,.26,47]])+
 stroke([[17.9,.26,43.5],[18.4,.26,43.5],[18.4,.26,45]])+
 stroke([[22.2,.26,43],[22.6,.26,42],[23.1,.26,45]])+'</g>';
}
export function roomDecorations(state){const seed=state.creationSeed??state.seed,draw=i=>(Math.imul(seed^(i*7919),2654435761)>>>0)/4294967296;return {fridge:draw(1)>.25,kettle:draw(2)>.2,plush:true,plushPile:true,cot:draw(4)>.65,board:true,boardType:Math.floor(draw(12)*4),chairType:Math.floor(draw(13)*4),restType:Math.floor(draw(14)*4),sofa:draw(6)>.5,server:state.professorProfile.labMode==='dry',palette:Math.floor(draw(5)*3),wallpaper:Math.floor(draw(7)*WALLPAPERS.length),floor:Math.floor(draw(8)*FLOOR_TILES.length),printer:draw(9)>.25,plant:true,plantType:Math.floor(draw(15)*4),windowPlants:1+Math.floor(draw(16)*3),shelfPlant:draw(17)>.4,bag:draw(10)>.35,deskLamp:true,clock:true,noticeboard:draw(11)>.3,coffeeMaker:true,snackBox:true,cableOrganizer:true,wastebasket:true,calendar:true,boardTray:true,wallPostits:true};}
function desk(u,v,w,d,color='#c5ab8e'){let art='';for(const [a,b] of [[u+.5,v+.5],[u+w-1,v+.5],[u+.5,v+d-1],[u+w-1,v+d-1]])art+=box(a,b,.65,.65,23,'#a58c73');art+=box(u,v,w,d,3,color,23);return art;}
function workstationDesk(u,v,w,d,color){
 const legs=[[u+.5,v+.5],[u+w-1,v+.5],[u+.5,v+d-1],[u+w-1,v+d-1]];
 const leg=([a,b])=>box(a,b,.65,.65,23,'#a58c73');
 // The top stays behind the hands. Only the near slab edges and their two
 // supports can occlude knees; repainting the whole desk would cover the face.
 return {back:legs.slice(0,2).map(leg).join('')+plane([[u,v,26],[u+w,v,26],[u+w,v+d,26],[u,v+d,26]],shade(color,17),shade(color,-22)),
  front:`<g class="desk-foreground" data-room-part="near-desk">${legs.slice(2).map(leg).join('')}${plane([[u,v+d,23],[u+w,v+d,23],[u+w,v+d,26],[u,v+d,26]],color,shade(color,-22))}${plane([[u+w,v,23],[u+w,v+d,23],[u+w,v+d,26],[u+w,v,26]],shade(color,-18),shade(color,-22))}</g>`};
}
export function chairGeometry(u,v,type=0){
 const center=[u+1.5,v+1.5],seat={u:u+.4,v:v+.4,w:2.2,d:2.2,bottom:17,top:20};
 const casters=type>=2?Array.from({length:5},(_,i)=>{const angle=-Math.PI/2+i*Math.PI*2/5;return [center[0]+Math.cos(angle)*1.85,center[1]+Math.sin(angle)*1.85];}):[];
 return {center,seat,casters};
}
function chairParts(u,v,color,type=0,facing='front'){
 const labels=['목재 의자','플라스틱 의자','사무용 의자','고급 등받이 의자'];
 const {center:[cu,cv],seat,casters}=chairGeometry(u,v,type),near=facing==='monitor';
 const backV=near?seat.v+seat.d-.35:seat.v;
 const backrest=`<g data-chair-part="near-backrest">${box(seat.u+.1,backV,2,.35,type===3?26:type===2?22:17,shade(color,9),seat.top)}</g>`;
 let base=`<g class="chair-floor-shadow" opacity=".18">${plane([[cu-1.8,cv-1.8,0],[cu+1.8,cv-1.8,0],[cu+1.8,cv+1.8,0],[cu-1.8,cv+1.8,0]],'#727c78')}</g>`,farArm='',nearArm='';
 if(type>=2){
  // Each wheel touches z=0 and connects to the same hub. A taller, narrower
  // seat leaves the support pole visible below the front edge in this projection.
  base+='<g class="chair-wheelbase">';
  for(const [a,b] of [...casters].sort((a,b)=>a[0]+a[1]-b[0]-b[1]))base+=`<g class="chair-spoke" data-floor="${a},${b}">`+line([cu,cv,3],[a,b,2],'#586873',2.8)+line([cu,cv,3.6],[a,b,2.6],'#9aadb1',1)+box(a-.22,b-.2,.44,.4,2,'#52606b')+'</g>';
  base+='</g>'+`<g class="chair-support-pole">${box(cu-.2,cv-.2,.4,.4,seat.bottom-3,'#84979f',3)}${box(cu-.3,cv-.3,.6,.6,3,'#586873',2)}</g>`;
  for(const [i,a] of [seat.u,seat.u+seat.w-.25].entries()){
   const arm=`<g class="chair-armrest" data-chair-part="${i?'near':'far'}-armrest">`+box(a,seat.v+.8,.25,.25,9,'#71838c',seat.top)+box(a,seat.v+.6,.3,1.3,1,color,seat.top+9)+'</g>';
   if(i)nearArm=arm;else farArm=arm;
  }
 }else for(const[a,b]of [[seat.u+.15,seat.v+.15],[seat.u+seat.w-.4,seat.v+.15],[seat.u+.15,seat.v+seat.d-.4],[seat.u+seat.w-.4,seat.v+seat.d-.4]])base+=box(a,b,.25,.25,seat.bottom,'#92958b');
 base+=box(seat.u,seat.v,seat.w,seat.d,3,color,seat.bottom);
 return {base:`<g data-chair="${type}" data-chair-facing="${facing}" aria-label="${labels[type]}">${base}${near?farArm:backrest+farArm+nearArm}</g>`,front:near?`<g class="chair-foreground" aria-hidden="true">${backrest}${nearArm}</g>`:'',backrest:near?backrest:'',nearArm:near?nearArm:''};
}
function chair(...args){const parts=chairParts(...args);return parts.base+parts.front;}
function restFurniture(u,v,type){if(type===0){const parts=sofaParts(u,v);return `<g data-rest="sofa">${parts.back}${parts.front}</g>`;}if(type===1)return `<g data-rest="cot">${cot(u,v)}</g>`;if(type===2)return `<g data-rest="beanbag">${box(u+.4,v+.4,4,4,6,'#c3b49b')+box(u+1,v+1,3,3,6,'#d7c8af',6)+box(u+1.6,v+.3,2,2,13,'#cabbab',6)}</g>`;return `<g data-rest="camp-chair">${campChair(u,v)}</g>`;}
// A folding camp chair: the X frames stay inside the seat's two side faces, a sling seat
// hangs between them and a fabric back rises from the far edge (the occupant faces the viewer).
function campChair(u,v){
 const frame='#6f8379',fabric='#a2b4a9',seat={u:u+.5,v:v+.5,w:2,d:2,z:16},x=(side,width)=>line([side,seat.v,0],[side,seat.v+seat.d,seat.z],frame,width)+line([side,seat.v+seat.d,0],[side,seat.v,seat.z],frame,width);
 return `<g data-chair="camp" aria-label="접이식 의자"><g class="chair-floor-shadow" opacity=".18">${plane([[u+.3,v+.3,0],[u+2.7,v+.3,0],[u+2.7,v+2.7,0],[u+.3,v+2.7,0]],'#727c78')}</g>`+
  `<g data-chair-part="far-frame">${x(seat.u,1.6)}</g>`+line([seat.u,seat.v,seat.z+12],[seat.u,seat.v,seat.z],frame,1.6)+line([seat.u+seat.w,seat.v,seat.z+12],[seat.u+seat.w,seat.v,seat.z],frame,1.6)+
  box(seat.u,seat.v,seat.w,.25,10,shade(fabric,6),seat.z+1.5)+box(seat.u,seat.v,seat.w,seat.d,1.5,fabric,seat.z)+
  `<g data-chair-part="near-frame">${x(seat.u+seat.w,1.8)}</g></g>`;
}
export const PLANT_SPECIES=Object.freeze(['몬스테라','고무나무','스킨답서스','산세베리아']);
function pixelLeaf(x,y,size,color,flip=false,split=false){
 const cut=split?'M3 3h3v2H3zM7 7h3v2H7z':'';
 return `<g transform="translate(${Math.round(x)} ${Math.round(y)}) scale(${flip?-size:size} ${size})"><path d="M0 0h4v1h3v2h2v2h2v4H9v2H5V9H3V7H1V4H0z${cut}" fill="${shade(color,-17)}" fill-rule="evenodd"/><path d="M2 1h3v1h2v2h1v2H6V5H4V3H2z" fill="${shade(color,20)}"/><path d="M1 1l7 7" stroke="${color}" stroke-width=".7"/></g>`;
}
function plant(u,v,type=0,{z=0,small=false}={}){
 const w=small?.85:2,potH=small?5:10,cu=u+w/2,cv=v+w/2,base=z+potH;
 const colors=['#b6977e','#a2aaa0','#c6b391','#a7b7ba'];
 let art=z===0?plane([[u-.15,v-.15,0],[u+w+.25,v-.15,0],[u+w+.25,v+w+.25,0],[u-.15,v+w+.25,0]],'#adb5a5'):'';
 art+=box(u,v,w,w,potH,colors[type],z)+box(u+.08,v+.08,w-.16,w-.16,1.5,shade(colors[type],11),base-.5)+plane([[u+.15,v+.15,base+1],[u+w-.15,v+.15,base+1],[u+w-.15,v+w-.15,base+1],[u+.15,v+w-.15,base+1]],'#626e53');
 const scale=small?.48:1;
 if(type===3){
  for(const [i,offset] of [-.45,0,.5].entries()){
   const [x,y]=projectRoom(cu+offset*scale,cv,base),h=(small?14:25)+i*3;
   art+=`<path d="M${Math.round(x)-2} ${Math.round(y)}v-${h-5}h1v-5h2v5h1v${h-5}z" fill="${['#557460','#6e8c61','#4d735a'][i]}"/><path d="M${Math.round(x)} ${Math.round(y)-1}v-${h-7}" stroke="#a4b27b" stroke-width="1"/>`;
  }
 }else{
  const h=(type===1?32:type===0?27:20)*scale;
  art+=line([cu,cv,base],[cu,cv,base+h],'#698368',small?1:1.5);
  const leaves=type===1?[[0,-.8,h],[-.65,.3,h*.82],[.8,.25,h*.65],[-.5,.7,h*.42]]:type===0?[[0,-.9,h],[-.8,.1,h*.7],[.75,.1,h*.65],[-.3,.9,h*.4]]:[[0,-.6,h],[-.65,.1,h*.75],[.65,.1,h*.6],[-.15,.8,h*.4]];
  for(const [a,b,level] of leaves){
   const end=[cu+a*scale,cv+b*scale,base+level];art+=line([cu,cv,base+level*.65],end,'#6d876a',small?.8:1.2);
   const [x,y]=projectRoom(...end);art+=pixelLeaf(x,y,(type===0?1.1:type===1?.9:.8)*scale,['#6f946c','#6e8b67','#80986b'][type],a<0,type===0);
  }
  if(type===2){
   const [x,y]=projectRoom(cu,cv+w/2,base);art+=`<path d="M${x} ${y}v8h-3v6h2v5" fill="none" stroke="#718764" stroke-width="1"/>`;
   art+=pixelLeaf(x-3,y+7,.5*scale,'#8da373',true)+pixelLeaf(x-1,y+14,.45*scale,'#769464');
  }
 }
 return `<g data-plant-species="${type}" aria-label="${PLANT_SPECIES[type]} 화분">${art}</g>`;
}
function bookshelf(u,v,wet,stock,state){
 let art=`<g class="lab-bookshelf antique-bookshelf" data-shelf="academic-library" aria-label="학술 저널과 학위논문 바인더 서가">`+box(u,v,5.5,2,60,'#6d492b');
 for(const z of [4,22,40])art+=front(u+.4,v+2.02,z,4.7,17,'#e6ddcc');
 art+='<g class="shelf-thesis-binders" data-shelf-tier="theses" aria-label="학위논문 하드커버 바인더 서가">';
 for(const[i,c]of ['#0f224a','#3b1016','#151921'].entries())art+=front(u+.55+i*.8,v+2.08,5,.65,14,c);
 art+='</g><g class="shelf-textbooks" data-shelf-tier="textbooks" aria-label="전공 원서 및 학술 레퍼런스">';
 for(const[i,c]of ['#8b1e28','#1b4332','#1e3a8a'].entries())art+=front(u+.55+i*.9,v+2.08,23,.75,12+i,c);
 art+='</g><g class="shelf-journals" data-shelf-tier="journals" aria-label="알록달록한 학술 저널 컬렉션">';
 for(const[i,c]of ['#dc2626','#0284c7','#16a34a','#7c3aed'].entries())art+=front(u+.55+i*.65,v+2.08,41,.5,12,c);
 art+='</g>';
 const bottles=wet?({sparse:1,balanced:3,rich:5})[stock]:0;
 for(let i=0;i<bottles;i++)art+=front(u+3.7+(i%3)*.32,v+2.09,i<3?41:23,.25,8,['#a7c5c9','#c8b2c2','#b6c9a6'][i%3]);
 return art+'</g>';
}
function fridge(u,v){return box(u,v,3.5,3,45,'#d3d9d5')+front(u+.25,v+3.03,2,3,24,'#e7eae3')+front(u+.25,v+3.03,28,3,15,'#e7eae3')+front(u+.55,v+3.1,18,.25,5,'#96a4a1')+front(u+.55,v+3.1,33,.25,5,'#96a4a1')+front(u+2,v+3.1,36,.6,2,'#c6b6a0');}
function server(u,v){
 let art=`<g class="dry-server-rack" data-equipment="server-rack" aria-label="건식 랩 서버 랙과 실시간 LED 인디케이터">`;
 art+=box(u,v,3,2.6,48,'#64748b');
 for(let i=0;i<4;i++){
  const unitZ=4+i*10;
  art+=front(u+.25,v+2.63,unitZ,2.5,7.2,'#334155');
  art+=`<g class="server-led-indicator" aria-label="실시간 LED 인디케이터">`+
   front(u+.5,v+2.66,unitZ+5.2,.25,1.2,'#22c55e')+
   front(u+.8,v+2.66,unitZ+5.2,.2,1.0,'#f59e0b')+
   front(u+1.05,v+2.66,unitZ+5.2,.2,1.0,'#06b6d4')+
   front(u+1.3,v+2.66,unitZ+5.2,.2,1.0,'#3b82f6')+
   '</g>';
  for(let j=0;j<2;j++)art+=front(u+1.6+j*.45,v+2.65,unitZ+2.5,.18,3.2,'#64748b');
 }
 return art+'</g>';
}
// Small decorative tools use one projected front canvas. Their room anchors and
// heights remain physical, while pixel silhouettes avoid storing repeated box faces.
function decorIcon(u,v,z,body){const[x,y]=projectRoom(u,v,z);return `<g transform="matrix(1 .5 0 1 ${x} ${y})">${body}</g>`;}
function capsuleCoffeeMachine(u,v,z=26){return `<g class="capsule-coffee-machine" data-object="capsule-coffee-machine" aria-label="캡슐 커피 머신">`+decorIcon(u,v+1.2,z,'<path d="M0 0v-10h11V0z" fill="#b91c1c"/><path d="M2 0v-7h7V0zM0-1h12v2H0z" fill="#1e293b"/><path d="M3-2v-3h5v3z" fill="#f8fafc"/>')+'</g>';}
function labSnackBox(u,v,z=26){return `<g class="lab-snack-box" data-object="lab-snack-box" aria-label="연구실 탕비 간식 박스">`+decorIcon(u,v+1.2,z,'<path d="M0 0v-3h12V0z" fill="#b45309"/><path d="M2-3v-4h3v4z" fill="#16a34a"/><path d="M6-3v-5h3v5z" fill="#2563eb"/>')+'</g>';}
function cableOrganizer(u,v,z=0){return `<g class="lab-cable-organizer" data-object="cable-organizer" aria-label="책상 밑 멀티탭 전선 정리함">`+decorIcon(u,v+1,z,'<path d="M0 0v-2h18V0z" fill="#e2e8f0"/><path d="M3 0l-3 3h3M8 0l-2 2h4" fill="none" stroke="#334155"/><path d="M14-2h2v1h-2z" fill="#22c55e"/>')+'</g>';}
function bagHanger(u,v){return `<g class="lab-bag-hanger" data-object="bag-hanger" aria-label="연구원 가방 걸이와 백팩">`+decorIcon(u,v+1.5,7,'<path d="M1 0v-9h12V0z" fill="#1e293b"/><path d="M3-1v-4h8v4z" fill="#334155"/><path d="M13-1v-6h2v6z" fill="#cbd5e1"/><path d="M6-9v-8h3" fill="none" stroke="#64748b"/>')+'</g>';}
function wastebasket(u,v,z=0){return `<g class="lab-wastebasket" data-object="wastebasket" aria-label="연구실 페이퍼 바스켓 휴지통">`+decorIcon(u,v+1.4,z,'<path d="M0 0v-5h12V0z" fill="#475569"/><path d="M2-4v-2h4v2zM7-3v-2h3v2z" fill="#f8fafc"/>')+'</g>';}
function boardTray(u=16.2,v=.22,z=34.5,boardType=0){return `<g class="board-chalk-tray" data-object="board-tray" aria-label="칠판 하단 트레이의 분필과 지우개">`+front(u,v,z,8.6,.8,'#78716c')+front(u+.6,v+.05,z+.3,1.5,1.2,'#a16207')+'</g>';}
function wallCalendar(u=25.4,v=.2,z=46){return `<g class="wall-calendar" data-object="wall-calendar" aria-label="연구 일정 벽걸이 달력">`+decorIcon(u,v,z,'<path d="M0 0v-16h20V0z" fill="#fdfbf7"/><path d="M0-16v-2h20v2z" fill="#1e3a8a"/><path d="M4-4h3v2H4zM12-8h3v2h-3z" fill="#ef4444"/>')+'</g>';}
function wallPostIts(u=25.4,v=.2,z=32){return `<g class="wall-postits" data-object="wall-postits" aria-label="포스트잇과 자석 핀 메모">`+front(u,v,z+7,1.1,3.2,'#fef08a')+front(u+1.2,v,z+6.5,1,3,'#bbf7d0')+front(u+.2,v,z+1.5,1.2,3.4,'#fbcfe8')+'</g>';}
function wetLabFixtures(u=3.6,v=10.1,stock='balanced'){
 let art=`<g class="wet-flask-drying-rack" data-equipment="flask-drying-rack" aria-label="습식 랩 플라스크 건조대와 시약 선반">`+front(u,v+.3,27,2.5,15,'#334155');
 for(let i=0;i<3;i++)art+=front(u+.25+i*.75,v+.66,31,.4,5,'#bae6fd');
 art+=front(u+2.7,v+.5,27,3.4,1,'#64748b')+front(u+2.7,v+.5,36,3.4,1,'#64748b');
 for(let i=0;i<({sparse:1,balanced:3,rich:5})[stock];i++)art+=front(u+3.1+(i%3)*.8,v+.46,i<3?28:37,.5,5.5,['#b45309','#0284c7','#15803d'][i%3]);
 return art+'</g>';
}
// A sofa has a far backrest and two short arms; its long front edge is open.
// All heights use the room floor, and every horizontal face uses its tile axes.
export function sofaGeometry(u,v){
 const width=7,depth=3,legSize=.35,inset=.3,seat={u:u+.75,v:v+.7,width:5.5,depth:2,bottom:11,top:17};
 const legs=[[u+inset,v+inset],[u+width-inset-legSize,v+inset],[u+inset,v+depth-inset-legSize],[u+width-inset-legSize,v+depth-inset-legSize]];
 // actor() places the front-facing seated hip this far above its foot baseline.
 const hipOffset=96.72*(1-376/496)-7;
 return {u,v,width,depth,legs,legSize,legHeight:6,seat,backrest:{u,v:v+.1,width,depth:.55,bottom:11,top:36},arms:[{u,v,width:.65,depth,bottom:10,top:25},{u:u+width-.65,v,width:.65,depth,bottom:10,top:25}],occupant:{u:u+width/2,v:v+2.2,lift:seat.top-hipOffset,hipOffset},footprint:[[u,v],[u+width,v],[u+width,v+depth],[u,v+depth]]};
}
export function sofaParts(u,v){
 const g=sofaGeometry(u,v),b=g.backrest,arm=a=>box(a.u,a.v,a.width,a.depth,a.top-a.bottom,'#afbdc6',a.bottom),part=(name,art)=>`<g data-sofa-part="${name}">${art}</g>`;
 let back=part('floor-supports',g.legs.slice().sort((a,b)=>a[0]+a[1]-b[0]-b[1]).map(([a,b])=>`<g class="sofa-leg" data-floor="${a},${b}">${box(a,b,g.legSize,g.legSize,g.legHeight,'#7c8c8c')}</g>`).join(''));
 back+=part('base',box(u+.1,v+.1,g.width-.2,g.depth-.2,5,'#a5b3bf',6));
 back+=part('far-backrest',box(b.u,b.v,b.width,b.depth,b.top-b.bottom,'#adbdc7',b.bottom));
 back+=part('far-arm',arm(g.arms[0]));
 const seat=g.seat,cushionWidth=(seat.width-.12)/2;
 back+=part('seat-cushions',[0,1].map(i=>box(seat.u+i*(cushionWidth+.12),seat.v,cushionWidth,seat.depth,seat.top-seat.bottom,'#c9d2d5',seat.bottom)).join(''));
 back+=part('pillow',box(u+1,v+.72,1.1,1.05,5,'#e0c9b4',seat.top));
 return {geometry:g,back:`<g class="room-sofa" data-floor="${u},${v}" data-size="${g.width},${g.depth}" aria-label="소파">${back}</g>`,front:part('near-arm',arm(g.arms[1]))};
}
export function cotGeometry(u,v){
 const width=7,depth=3,legSize=.5,inset=.3;
 const legs=[[u+inset,v+inset],[u+width-inset-legSize,v+inset],[u+inset,v+depth-inset-legSize],[u+width-inset-legSize,v+depth-inset-legSize]];
 return {u,v,width,depth,legs,legSize,legHeight:12,footprint:[[u,v],[u+width,v],[u+width,v+depth],[u,v+depth]]};
}
function cot(u,v){
 const geometry=cotGeometry(u,v);
 // All supports start at the same floor plane; the footprint, not the mattress
 // silhouette, determines whether the folding bed fits inside the room.
 let art=geometry.legs.slice().sort((a,b)=>a[0]+a[1]-b[0]-b[1]).map(([a,b])=>`<g class="cot-leg" data-floor="${a},${b}">${box(a,b,geometry.legSize,geometry.legSize,geometry.legHeight,'#829594')}</g>`).join('');
 art+=box(u,v,geometry.width,geometry.depth,3,'#a9b7b3',12)+box(u+.2,v+.2,6.6,2.6,4,'#dbe1d8',15)+box(u+.4,v+.4,1.4,2.2,3,'#f7f0df',19)+box(u+2.4,v+.3,4,2.4,2,'#b8c9bf',19);
 return `<g class="room-cot" data-floor="${u},${v}" data-size="${geometry.width},${geometry.depth}" aria-label="접이식 침대">${art}</g>`;
}
function printer(u,v,z=0){return box(u,v,2.6,2,8,'#bac5c6',z)+box(u+.3,v+.1,2,1.4,2,'#dee2db',z+8)+front(u+.4,v+2.04,z+2,1.9,1.3,'#71868d')+box(u+.5,v-.1,1.8,.8,1,'#f8f4e8',z+10);}
function kettle(u,v,z=0){return box(u,v,1.2,1.2,1,'#8a9b9c',z)+box(u+.2,v+.2,.8,.8,8,'#e9e3d3',z+1)+box(u+.3,v+.3,.6,.6,1,'#96a4a3',z+9)+line([u+1,v+.5,z+3],[u+1.6,v+.5,z+4],'#829996',2)+line([u+1.6,v+.5,z+4],[u+1.6,v+.5,z+8],'#829996',2);}
function plush(u,v,z){
 const [x,y]=projectRoom(u,v,z),toy=(name,label,a,b,c,ears,face)=>`<g class="plushie-${name}" aria-label="${label}"><path d="M${x+a} ${y+b}h10v7h-10z${ears}" fill="${c}"/><path d="${face}" fill="#334155"/></g>`;
 return `<g class="stacked-plushies" data-decor="plushie-pile" aria-label="작은 동물 인형 더미와 인형 피라미드">`+
 toy('mochi-cat','하얀 찹쌀떡 고양이 인형',-15,-4,'#f8fafc',`M${x-14} ${y-7}h2v3h-2zM${x-8} ${y-7}h2v3h-2z`,`M${x-13} ${y-2}h1v1h-1zM${x-8} ${y-2}h1v1h-1z`)+
 toy('baby-bear','갈색 아기 곰 인형',1,-4,'#c6a281',`M${x+1} ${y-7}h3v3h-3zM${x+8} ${y-7}h3v3h-3z`,`M${x+3} ${y-2}h1v1h-1zM${x+8} ${y-2}h1v1h-1zM${x+5} ${y}h2v1h-2z`)+
 toy('pink-bunny','쫑긋한 귀의 분홍 토끼 인형',-9,-14,'#f472b6',`M${x-8} ${y-21}h2v7h-2zM${x-3} ${y-21}h2v7h-2z`,`M${x-7} ${y-12}h1v1h-1zM${x-3} ${y-12}h1v1h-1z`)+
 toy('mint-frog','민트 개구리 마스코트 인형',3,-14,'#86efac',`M${x+4} ${y-16}h2v2h-2zM${x+9} ${y-16}h2v2h-2z`,`M${x+5} ${y-14}h1v1h-1zM${x+10} ${y-14}h1v1h-1zM${x+6} ${y-10}h4v1h-4z`)+
 toy('yellow-chick','샛노란 병아리 인형',-3,-23,'#facc15',`M${x} ${y-25}h2v2h-2z`,`M${x-1} ${y-21}h1v1h-1zM${x+3} ${y-21}h1v1h-1z`)+
 `<path d="M${x} ${y-19}h2v1h-2z" fill="#ea580c"/></g>`;
}
// Draw a 16:9 screen before projecting it. The monitor turns towards the room
// camera, independently of the desk axes, so it still reads as a widescreen.
export const MONITOR_DISPLAY=Object.freeze({width:48,height:27,aspectRatio:16/9,tilt:.18});
export function monitorGeometry(u,v,z){
 const center=projectRoom(u+1.7,v+.3,z+7),display={x:-24,y:1.5,width:MONITOR_DISPLAY.width,height:MONITOR_DISPLAY.height};
 return {center,display,frame:{x:-27,y:0,width:54,height:30.3},point:(x,y)=>[center[0]+x,center[1]+x*MONITOR_DISPLAY.tilt-y]};
}
function monitor(u,v,z,active=false){
 const {display,frame,point}=monitorGeometry(u,v,z);
 const surface=(rect,color)=>polygon([[rect.x,rect.y],[rect.x+rect.width,rect.y],[rect.x+rect.width,rect.y+rect.height],[rect.x,rect.y+rect.height]].map(p=>point(...p)),color);
 const screenPoint=(x,y)=>point(display.x+x*display.width,display.y+y*display.height);
 const textLine=(x1,x2,y)=>{const a=screenPoint(x1,y),b=screenPoint(x2,y);return `<path d="M${a.join(' ')}L${b.join(' ')}" stroke="#9cb9ac" stroke-width="1.4" fill="none"/>`;};
 return `<g class="lab-monitor" data-display-width="48" data-display-height="27" data-display-tilt=".18">`+
  box(u+1.5,v,.4,.6,7,'#7e909c',z)+box(u+.7,v-.2,2.2,1,1,'#9daeb1',z)+`<g class="monitor-frame">${surface(frame,'#788f9c')}</g>`+
  `<g class="monitor-display" data-display-aspect="16:9">${surface(display,'#d9e6de')}</g>`+
  `<g class="monitor-content">${textLine(.09,.84,.73)}${textLine(.09,.74,.48)}${textLine(.09,.52,.23)}${active?monitorMotion(screenPoint):''}</g></g>`;
}
function microscope(u,v,z){return box(u,v,2.3,2,2,'#d9dfd5',z)+box(u+1.5,v+.2,.55,.8,17,'#9eafb5',z+2)+box(u+.7,v+.2,1.8,.7,3,'#8e9fa8',z+19)+box(u+.6,v+.3,.4,.4,6,'#8395a0',z+13)+box(u+.4,v+.3,1.4,1.2,1,'#bdcbd0',z+7);}
function actor(state,result,index,u,v,idle,lift=0,facing='front',hairOnly=false){
 const [x,y]=projectRoom(u,v,lift),w=62.4,h=96.72,activity=String(result.actual),wet=state.professorProfile.labMode==='wet';
 const executing=!idle&&result.performed!==false&&!['idle','training','unfinished'].includes(activity),relaxing=!idle&&['rest','coffee'].includes(activity);
 const pose=isLecturing(result,idle)?'lecturing':relaxing||!idle&&['study','coursework','analysis','language','paper','free'].includes(activity)||!idle&&activity==='experiment'&&!wet?'seated':!idle&&['experiment','research'].includes(activity)&&wet?'experiment':'standing';
 const expression=studentEmotion(state,result,{idle}),appearance={...weeklyAppearance({...state,visualMonth:idle?state.month:Math.max(0,state.month-1)},index),...(pose==='experiment'?{outfit:0}:{})};
 const portraitTop=y-h+(pose==='seated'?7:2),headCenter=portraitTop+(pose==='seated'?152:120)*h/496;
 if(hairOnly){const hair=renderStudentHairDrape(appearance,expression);return hair?hair.replace('class="student-hair-drape"',`class="student-hair-drape room-hair-drape" x="${x-w/2}" y="${portraitTop}" width="${w}" height="${h}" style="width:${w}px;height:${h}px"`):'';}
 const portrait=renderPortrait(appearance,state.locale==='en'?'Pixel portrait of the student':'학생 도트 초상화',expression,pose,facing).replace('class="portrait"',`class="portrait room-portrait" x="${x-w/2}" y="${portraitTop}" width="${w}" height="${h}" style="width:${w}px;height:${h}px"`);
 const props=executing||relaxing?`<g transform="translate(${x} ${y}) scale(.8)">${activityProps(activity,{wet,index,kind:equipmentProfile(state),facing})}</g>`:'';
 return `<g class="mini-student pose-${pose} expression-${expression} ${idle?'mini-idle':'mini-working'} action-${activity.replace(/[^a-z_-]/g,'')}" data-floor="${u},${v}"><g class="room-reaction" transform="translate(${x} ${headCenter}) scale(.7)">${reactionEffects(expression,index)}</g>${portrait}${props}</g>`;
}
function campusSeasonalWindow(state,{idle=false}={}){
 const season=labSeason(state,{idle}),p=WINDOW_SEASONS[season],[x,y]=projectRoom(.2,8.6,76),width=9.8*9,height=40;
 // Intrinsic window pixels share one wall transform. Compact silhouettes retain
 // atmospheric depth without storing dozens of near-identical flecks in every CV.
 const r=(a,b,w,h,c)=>`<rect x="${a}" y="${b}" width="${w}" height="${h}" fill="${c}"/>`,path=(d,c)=>`<path d="${d}" fill="${c}"/>`;
 const mountains={spring:['#8da2b6','#73899e'],summer:['#628aa5','#4a728e'],autumn:['#9b8796','#846c7b'],winter:['#96a2b0','#7d8c9e']}[season];
 let art=`<g class="window-scenery window-season-${season}" data-season="${season}" aria-label="창밖 ${p.label} 풍경">`;
 art+='<g class="window-view-far" data-layer="far-background" aria-label="원경 산 능선 및 지평선 층운">'+r(0,0,width,height,p.sky)+
 path('M0 29h12v-4h16v-3h18v4h13v-5h13v4h17v15H0z',mountains[0])+path('M0 33h17v-3h12v-4h14v5h20v-3h25v12H0z',mountains[1])+
 path('M8 7h5V5h8v2h6v2H8zM55 11h6V9h10v2h8v2H55z','#f0f9ff');
 art+='<g class="window-particles-far" data-layer="far-particles" aria-label="원경 원근 파티클">'+path('M33 7h1v1h-1zM75 20h1v1h-1z',p.trees[0])+'</g></g>';
 art+='<g class="window-view-mid" data-layer="midground" aria-label="중경 캠퍼스 시계탑과 연구동">'+r(0,34,width,6,season==='winter'?'#e2e8f0':p.trees[1])+r(15,37,59,2,season==='winter'?'#cbd5e1':'#d6cbbe');
 art+='<g class="campus-clock-tower" data-midground="clock-tower" aria-label="캠퍼스 본관 시계탑 건물">'+r(52,20,11,15,'#64748b')+
 path('M51 20h13v-2h-3v-2h-3v-3h-2v3h-2v2h-3z','#334155')+r(57,10,1,5,'#0f766e')+r(55,23,5,4,'#f8fafc')+
 path('M57 23v3h3v1h-4v-4z','#0f172a')+'</g>';
 art+='<g class="campus-research-wing" data-midground="research-building" aria-label="아치형 창문의 연구동 건물 실루엣">'+r(25,27,23,9,'#6b7280')+r(24,26,25,1,'#4b5563')+
 path('M28 30h3v5h-3zM35 30h3v5h-3zM42 30h3v5h-3z','#fde68a')+'</g><g class="campus-midground-trees" aria-label="캠퍼스 중경 가로수">'+
 path('M10 35h4v-5h-1v-2h-2v2h-1zM71 36h5v-5h-1v-2h-3v2h-1z',p.trees[1])+'</g></g>';
 art+='<g class="window-view-near" data-layer="foreground" aria-label="근경 가로수 및 창틀 디테일">';
 for(const [i,a]of [7,78].entries()){
  art+=path(`M${a} 40v-13h2v5h4v1h-4v7z`,'#5c4033')+path(`M${a-5} 27h2v-4h7v2h3v5h-12z`,p.trees[i*2]);
  if(season==='winter')art+=r(a-4,25,9,1,'#ffffff');
 }
 art+='<g class="window-frame-shadow" aria-label="창틀 그림자">'+r(0,39,width,1,'#b8a994')+r(0,0,1,height,'#baa993')+'</g></g>';
 art+=`<g class="${p.effectClass}" data-effect="${p.effectAttr}" aria-label="${p.effectLabel}">`;
 art+=path('M19 15h2v1h-2zM66 6h2v1h-2z',p.particles[0][4]);
 const effects={spring:['spring-cherry-drifts','cherry-drift','흩날리는 벚꽃 꽃잎 다층 픽셀'],summer:['summer-rain-streaks','summer-shower','여름 소나기 빗살 픽셀'],autumn:['autumn-ginkgo-maple','ginkgo-maple','가을 단풍과 은행잎 픽셀'],winter:['winter-snowflakes-3d','heavy-snow','펄펄 날리는 입체 함박눈 픽셀']}[season];
 art+=`<g class="${effects[0]}" data-effect="${effects[1]}" aria-label="${effects[2]}">`+path('M23 20h2v1h-2zM61 30h2v1h-2z',p.trees[0])+'</g></g></g>';
 return `<g class="seasonal-window" data-season="${season}" aria-label="창밖의 ${p.label}" transform="matrix(-1 .5 0 1 ${x} ${y})"><svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" overflow="hidden" preserveAspectRatio="none" aria-hidden="true">${art}</svg></g>`;
}
function miniRoomArtSource(state,kind,result,index,{idle=false,stock='balanced',student=true}={}){
 const d=roomDecorations(state),wall=WALLPAPERS[d.wallpaper],[tile,tileAlt,grout]=FLOOR_TILES[d.floor],wet=state.professorProfile.labMode==='wet';
 let art=plane([[0,0,0],[28,0,0],[28,28,0],[0,28,0]],tile);
 for(let u=0;u<28;u+=4)for(let v=0;v<28;v+=4)art+=plane([[u,v,0],[u+4,v,0],[u+4,v+4,0],[u,v+4,0]],(u/4+v/4)%2?tileAlt:tile,grout);
 art+=plane([[0,0,0],[0,28,0],[0,28,90],[0,0,90]],shade(wall,-11),'#cbc5b8')+plane([[0,0,0],[28,0,0],[28,0,90],[0,0,90]],wall,'#cbc5b8');
 art+=left(.08,0,0,28,4,'#c5baa7')+front(0,.08,0,28,4,'#d0c5b1');
 // Window, writing board and pinned papers sit on their respective wall planes.
 art+=left(.15,8,33,11,47,'#d0c5af')+campusSeasonalWindow(state,{idle})+left(.24,13.2,36,.45,40,'#f4f0e4')+left(.24,8.6,54,9.8,.8,'#f4f0e4');
 art+=`<g class="window-plant-shelf" aria-label="창가 화분 선반">${box(.3,8.2,1.2,10.6,1.5,'#c7b49a',34)}`;
 for(let i=0;i<d.windowPlants;i++)art+=plant(.45,9.4+i*3.4,(d.plantType+i+1)%4,{z:35.5,small:true});
 art+='</g>';
 const lecturing=isLecturing(result,idle),boardColors=['#526762','#faf8ee','#d7e5e0','#293e50'],boardInk=['#e4e6d6','#738781','#78948e','#afd5db'];art+=`<g data-board="${d.boardType}" aria-label="${['블랙보드','화이트보드','유리 벽면','전자칠판'][d.boardType]}">`+front(16,.15,33,9,39,d.boardType===2?'#b9cbc6':'#c6b194')+front(16.5,.2,36,8,33,boardColors[d.boardType]);for(let i=0;i<(lecturing?2:4);i++)art+=line([17.2,.24,63-i*6],[23-(i%2)*2,.24,63-i*6],boardInk[d.boardType],1.3);if(lecturing)art+=lectureDiagram(d.boardType,boardInk[d.boardType]);art+='</g>';
 art+=boardTray(16.2,.22,34.5,d.boardType)+wallCalendar(25.4,.2,46)+wallPostIts(25.4,.2,32);
 // The game emblem doubles as the lab's wall sign.
 art+='<g class="lab-logo-plaque" aria-label="연구실 로고">'+left(.2,2,55,4,20,'#f6f1e6');for(const [a,b]of [[[.28,2.8,61],[.28,5,70]],[[.28,5,70],[.28,5.4,60]],[[.28,2.8,61],[.28,5.4,60]]])art+=line(a,b,'#9ab7c8',1.5);for(const [v,z,color]of [[2.8,61,'#19384b'],[5,70,'#00a3d2']]){const[x,y]=projectRoom(.3,v,z);art+=`<circle cx="${x}" cy="${y}" r="3.5" fill="${color}"/>`;}art+='</g>';
 const certCount=Math.min(4,state?.career?.awards??0);
 const awardSpecs=[
  {type:'best-paper',label:'학회 우수논문상 상장',frame:'#5d3c26',gold:'#d4af37',paper:'#faf7ee',seal:'#b71c1c',sealCore:'#ffd700',ribbon:'#c62828',ink1:'#3e352b',ink2:'#807769'},
  {type:'foundation-citation',label:'연구재단 우수연구 표창장',frame:'#442b1d',gold:'#e6c35c',paper:'#fdfcf7',seal:'#1565c0',sealCore:'#ffea00',ribbon:'#0d47a1',ink1:'#2e3748',ink2:'#64748b'},
  {type:'presentation-award',label:'학술대회 최우수 발표상 상장',frame:'#4b382a',gold:'#c5a059',paper:'#f8f5ea',seal:'#2e7d32',sealCore:'#f5ee9e',ribbon:'#1b5e20',ink1:'#354238',ink2:'#6b7a6e'},
  {type:'innovation-award',label:'학술연구 혁신 표창장',frame:'#3e2418',gold:'#dfb842',paper:'#fbf7f0',seal:'#6a1b9a',sealCore:'#ffd54f',ribbon:'#4a148c',ink1:'#423245',ink2:'#7a677d'}
 ];
 for(let i=0;i<certCount;i++){
  const spec=awardSpecs[i%awardSpecs.length];
  const u=5.8+i*1.55;
  const corners=[[u+.07,78.2],[u+1.13,78.2],[u+.07,66],[u+1.13,66]].map(([a,z])=>{const points=[[a,.23,z],[a+.2,.23,z],[a+.2,.23,z+.2],[a,.23,z+.2]].map(p=>projectRoom(...p));return `M${points.map(p=>p.join(' ')).join('L')}z`;}).join('');
  art+=`<g class="award-certificate" data-certificate="${spec.type}" aria-label="${spec.label}">`+front(u,.2,65.5,1.4,13.5,spec.gold)+front(u+.14,.24,66.4,1.12,11.7,spec.paper)+`<path d="${corners}" fill="#fff0a6"/>`;
  const [sx,sy]=projectRoom(u+.7,.28,68.2);art+=`<circle cx="${sx}" cy="${sy}" r="1.6" fill="${spec.seal}"/></g>`;
 }
 if(d.clock){art+=front(12,.2,63,2.8,16,'#b7b7a7')+front(12.3,.22,65,2.2,12,'#f9f4e7')+line([13.3,.24,71],[13.3,.24,76],'#82918d',1.4)+line([13.3,.24,71],[14,.24,70],'#82918d',1.4);}
 if(d.noticeboard){art+=left(.2,21,39,4.5,24,'#cdb597')+left(.25,21.4,42,1.5,15,'#f7efda')+left(.25,23.4,46,1.3,13,'#e6d6c8');}
 const objects=[],add=(u,v,w,depth,art)=>objects.push({depth:u+v+w+depth,art});
 add(4,1,5.5,2,bookshelf(4,1,wet,stock,state)+(d.plush?plush(5.5,2.3,60):'')+(d.shelfPlant?`<g class="bookshelf-plant">${plant(8,1.5,(d.plantType+2)%4,{z:60,small:true})}</g>`:''));
 if(d.server)add(10,1,3,2.6,server(10,1));
 if(wet)add(3.6,10.1,5.5,.5,wetLabFixtures(3.6,10.1,stock));
 if(d.fridge)add(1,5,3.5,3,fridge(1,5));
 let tea=desk(1.5,21,3.8,3);
 tea+=capsuleCoffeeMachine(1.7,21.3,26);
 if(d.kettle)tea+=kettle(2.8,22.0,26);
 tea+=labSnackBox(3.9,21.4,26);
 tea+=box(3.7,22.8,.6,.6,4,'#c9ad92',26);
 add(1.5,21,3.8,3,tea);
 add(10.2,17.2,2.2,1.0,cableOrganizer(10.2,17.2,0));
 add(8.6,21.5,1.6,1.5,bagHanger(8.6,21.5,0));
 add(8.8,22.8,1.4,1.4,wastebasket(8.8,22.8,0));
 const resting=!idle&&(kind==='rest'||result.actual==='coffee')&&result.outcome!=='training';
 // Keep each seat and its occupant together. Sorting by the chair's far
 // corner alone used to paint the backrest over the student's face.
 const [cotU,cotV]=ROOM_ANCHORS.cot,sofa=sofaParts(...ROOM_ANCHORS.sofa),sofaSeat=sofa.geometry.occupant;
 const restSeats=[[sofaSeat.u,sofaSeat.v,sofaSeat.lift],[cotU+4,cotV+1.5,7],[24.1,7.5,1],[23.5,6.5,2]];
 const seat=restSeats[d.restType],restActor=resting&&student?actor(state,result,index,seat[0],seat[1],false,seat[2]):'';
 const restPlacement=d.restType===0?[...ROOM_ANCHORS.sofa,sofa.geometry.width,sofa.geometry.depth]:d.restType===1?[cotU,cotV,7,3]:[22,5,4,8];
 const restArt=d.restType===0?`<g data-rest="sofa" data-layer-order="sofa-rear student near-arm">${sofa.back}${restActor}${sofa.front}</g>`:restFurniture(restPlacement[0],restPlacement[1],d.restType)+restActor;
 add(...restPlacement,`<g class="rest-seat-layer" data-seat-type="${d.restType}">${restArt}</g>`);
 if(d.cot&&d.restType!==1)add(...ROOM_ANCHORS.spareCot,7,3,cot(...ROOM_ANCHORS.spareCot));
 if(d.printer)add(15,1,3.5,3,desk(15,1,3.5,3)+printer(15.5,1.7,26));
 const working=!idle&&['study','coursework','analysis','language','experiment','paper','free'].includes(result.actual),deskWorking=working&&!(result.actual==='experiment'&&wet)&&result.outcome!=='training';
 const equipment=roomEquipment(state,{box,front,line,desk,microscope,monitor,project:projectRoom},!idle&&result.performed===true&&['analysis','experiment','industry','startup','video','paper'].includes(result.actual));
 add(3.5,10,6.2,3.5,equipment.bench);
 const deskLayers=workstationDesk(9,16,10,6,wet?'#bac9c5':'#c5ab8e');
 let stockArt='';
 if(wet){const count=({sparse:1,balanced:3,rich:5})[stock];for(let i=0;i<count;i++)stockArt+=box(14+i*.5,17.5,.25,.4,5,'#b5cecb',26)+box(14+i*.5,17.5,.25,.4,1,'#899ca3',31);if(stock==='rich')stockArt+=box(17,18.2,1.3,1.2,7,'#c8d2cc',26);}
 // Samples behind the computer must not be painted over its display.
 let work=deskLayers.back;
 if(!idle&&result.actual==='free'&&result.performed!==false)work+=`<g class="free-desk-lamp-light" aria-label="따뜻한 스탠드 조명 빛">${plane([[15.4,16.3,26.04],[18.6,16.3,26.04],[18.6,19.2,26.04],[15.4,19.2,26.04]],'#fef9c3')}</g>`;
 work+=wet&&deskWorking?equipment.accessories+stockArt:'';
 const fieldId=state?.professorProfile?.fieldId??'050';
 const discipline=getDiscipline(fieldId),fieldLabel=(state.locale==='en'?discipline?.labelEn:discipline?.label)??(state.locale==='en'?'Academic research':'학술 연구');
 let monuments=box(9.2,16.1,4,.8,3.2,wet?'#8fa49f':'#a38e75',26);
 monuments+=`<g class="desk-thesis-binder" data-binder="thesis-draft" aria-label="학위논문 초안 및 연구 바인더">`+front(9.4,16.85,29.2,.7,3.2,'#1e3a8a')+'</g>';
 monuments+=`<g class="lab-founding-plaque" data-monument="lab-plaque" aria-label="${fieldLabel} 연구실 현판">`+front(10.25,16.51,29.2,1.15,2.8,'#b48c48')+'</g>';
 if((state?.career?.awards??0)>=1)monuments+=`<g class="trophy-plaque crystal-plaque" data-monument="crystal-trophy" aria-label="학술대회 Best Paper Award 크리스털 기념패">`+front(11.62,16.67,29.7,.72,4,'#bae6fd')+'</g>';
 if((state?.career?.awards??0)>=2||(state?.career?.completedProjects??0)>=1||(state?.career?.papers??0)>=1)monuments+=`<g class="trophy-plaque championship-trophy" data-monument="championship-trophy" aria-label="연구 우승 팻말 및 챔피언십 기념패">`+front(12.57,16.52,29.8,.66,2.9,'#ffd700')+'</g>';
 work+=monuments;

 work+=wet&&deskWorking?`<g class="desk-monitor" data-floor="14.2,18.3">${monitor(14.2,18.3,26,result.performed===true&&result.actual==='analysis')}</g>`:equipment.primary+equipment.accessories;
 // Notebook, pencil, keyboard, task lamp and cups share the desk's top plane.
 work+=box(10.1,19.8,1.6,1.7,.6,'#f2ecdd',26)+line([10.6,19.8,27],[11.1,21.2,27],'#82949b',1.2)+`<g class="desk-keyboard" data-floor="13.5,21.3">`+box(13.5,21.3,2.4,.55,.5,'#d4ddda',26)+line([13.7,21.45,26.7],[15.6,21.45,26.7],'#9db0b1',.7)+'</g>';
 work+=box(17.9,16,1,1,1,'#abb9b1',26)+box(18.2,16.2,.25,.25,15,'#91a39e',27)+box(17.5,15.9,1.4,1.3,2,'#b7c4b3',42);
 if(!(wet&&deskWorking))work+=stockArt;
 add(9,16,10,6,work+deskLayers.front);
 add(...ROOM_ANCHORS.plant,2,2,`<g class="room-plant" data-floor="${ROOM_ANCHORS.plant.join(',')}">${plant(...ROOM_ANCHORS.plant,d.plantType)}</g>`);
 if(d.bag)add(6,23,2.2,1.7,box(6,23,2.2,1.7,9,'#b49a8c')+line([6.4,23.2,10],[7.7,23.2,10],'#85786d',2));
 const deskSeat=chairParts(12,22,['#b5b9b0','#a1b7bf','#879ba8','#777f99'][d.chairType],d.chairType,'monitor');
 // The occupant sits between the seat and the near backrest/armrests, its hips set back from the
 // hub (deskSeat) towards the backrest so the body rests in the chair instead of on its front edge. Painting
 // the whole chair first made the taller student's body pass through the chair.
 // The desk is already complete behind the occupant. Its near geometry only
 // occludes the lower body: an unclipped replay would stripe the upper torso.
 const hipY=projectRoom(...ROOM_ANCHORS.deskOccupant,20)[1],lowerDesk=deskWorking?`<svg class="desk-lower-occlusion" x="0" y="${hipY}" width="600" height="${360-hipY}" viewBox="0 ${hipY} 600 ${360-hipY}" overflow="hidden" aria-hidden="true">${deskLayers.front}</svg>`:'';
 // The hub, casters and seat skirt stand between the viewer and the calves hanging at the seat's
 // desk-side edge, so they repaint over the legs below the seat — never over the thighs or torso.
 const seatBottomY=Math.round(projectRoom(...ROOM_ANCHORS.deskOccupant,16)[1]),chairUnder=student&&deskWorking?`<svg class="chair-leg-occlusion" x="0" y="${seatBottomY}" width="600" height="${360-seatBottomY}" viewBox="0 ${seatBottomY} 600 ${360-seatBottomY}" overflow="hidden" aria-hidden="true">${deskSeat.base.replace(/<g class="chair-floor-shadow"[^]*?<\/g>/,'').replaceAll('class="chair-','class="replay-chair-').replaceAll('data-chair','data-replay-chair').replace(/ aria-label="[^"]*"/,'')}</svg>`:'';
 // Loose long hair and a ponytail fall outside the backrest. Replay hair only
 // between the backrest and near armrest; the seated body remains behind both.
 const hairDrape=student&&deskWorking?actor(state,result,index,...ROOM_ANCHORS.deskOccupant,false,0,'monitor',true):'';
 const chairFront=hairDrape?`<g class="chair-foreground" aria-hidden="true">${deskSeat.backrest}${hairDrape}${deskSeat.nearArm}</g>`:deskSeat.front;
 objects.push({depth:44,art:`<g class="desk-seat-layer" data-layer-order="chair-rear student chair-front desk-front">${deskSeat.base}${student&&deskWorking?actor(state,result,index,...ROOM_ANCHORS.deskOccupant,false,0,'monitor'):''}${chairUnder}${chairFront}${lowerDesk}</g>`});
 const pos=lecturing?[24,3]:result.actual==='presentation'&&!idle?[24,4]:working?[17,15]:ROOM_ANCHORS.standing;if(student&&result.outcome!=='training'&&!resting&&!deskWorking)add(...pos,1,1,actor(state,result,index,...pos,idle));
 objects.sort((a,b)=>a.depth-b.depth);art+=objects.map(o=>o.art).join('');
 // Front rim has the same two floor axes as the tiles, never an unrelated angle.
 art+=plane([[0,28,0],[28,28,0],[28,28,-3],[0,28,-3]],shade(tile,-18))+plane([[28,0,0],[28,28,0],[28,28,-3],[28,0,-3]],shade(tile,-28));
 return `<svg class="pixel-room-art mini-room-art" viewBox="0 0 600 360" role="img" aria-label="도트로 표현한 작은 ${wet?'Wet':'Dry'} lab 연구실" preserveAspectRatio="xMidYMid meet" data-wallpaper="${d.wallpaper}" data-floor-tile="${d.floor}" data-equipment-profile="${equipment.kind}" data-field-kit="${equipment.specialty}" data-season="${labSeason(state,{idle})}"><g shape-rendering="crispEdges">${art}</g></svg>`;
}

const ROOM_ART_EN={"학술 저널과 학위논문 바인더 서가":"Academic journals and dissertation bookshelf","학위논문 하드커버 바인더 서가":"Hardcover dissertation volumes","전공 원서 및 학술 레퍼런스":"Textbooks and academic references","알록달록한 학술 저널 컬렉션":"Academic journal collection","건식 랩 서버 랙과 실시간 LED 인디케이터":"Dry-lab server rack and status LEDs","실시간 LED 인디케이터":"Server status LEDs","캡슐 커피 머신":"Capsule coffee machine","연구실 탕비 간식 박스":"Break-area snack basket","책상 밑 멀티탭 전선 정리함":"Under-desk cable organizer","연구원 가방 걸이와 백팩":"Bag hook and backpack","연구실 페이퍼 바스켓 휴지통":"Paper wastebasket","칠판 하단 트레이의 분필과 지우개":"Board tray with chalk and eraser","연구 일정 벽걸이 달력":"Research calendar","포스트잇과 자석 핀 메모":"Sticky notes and magnetic memo pins","습식 랩 플라스크 건조대와 시약 선반":"Wet-lab flask drying rack and reagent shelf","작은 동물 인형 더미와 인형 피라미드":"Stacked animal plush toys","하얀 찹쌀떡 고양이 인형":"White cat plush toy","갈색 아기 곰 인형":"Brown bear plush toy","쫑긋한 귀의 분홍 토끼 인형":"Pink rabbit plush toy","민트 개구리 마스코트 인형":"Mint frog plush toy","샛노란 병아리 인형":"Yellow chick plush toy","학회 우수논문상 상장":"Conference best-paper award certificate","연구재단 우수연구 표창장":"Research foundation citation","학술대회 최우수 발표상 상장":"Conference presentation award certificate","학술연구 혁신 표창장":"Research innovation certificate","학위논문 초안 및 연구 바인더":"Dissertation draft and research binder","학술대회 Best Paper Award 크리스털 기념패":"Conference best-paper crystal plaque","연구 우승 팻말 및 챔피언십 기념패":"Research achievement plaque","따뜻한 스탠드 조명 빛":"Warm desk lamp light","원경 산 능선 및 지평선 층운":"Distant mountain ridge and clouds","원경 원근 파티클":"Distant seasonal particles","중경 캠퍼스 시계탑과 연구동":"Campus clock tower and research building","캠퍼스 본관 시계탑 건물":"Campus clock tower","아치형 창문의 연구동 건물 실루엣":"Research building with arched windows","캠퍼스 중경 가로수":"Campus trees","근경 가로수 및 창틀 디테일":"Nearby trees and window frame","창틀 그림자":"Window frame shading","흩날리는 벚꽃 꽃잎 다층 픽셀":"Cherry blossom petals at different depths","여름 소나기 빗살 픽셀":"Summer rain","가을 단풍과 은행잎 픽셀":"Autumn maple and ginkgo leaves","펄펄 날리는 입체 함박눈 픽셀":"Winter snowflakes","흩날리는 벚꽃 꽃잎 픽셀":"Cherry blossom petals","뭉게구름 픽셀":"Summer clouds","낙엽 픽셀":"Autumn leaves","내리는 픽셀 눈송이":"Winter snowflakes","창밖 봄 풍경":"Spring outside the window","창밖 여름 풍경":"Summer outside the window","창밖 가을 풍경":"Autumn outside the window","창밖 겨울 풍경":"Winter outside the window"};
export function miniRoomArt(state,...args){const art=miniRoomArtSource(state,...args),localized=state.locale==='en'?art.replace(/aria-label="([^"]*)"/g,(_,label)=>`aria-label="${ROOM_ART_EN[label]??(label.endsWith(' 연구실 현판')?label.replace(' 연구실 현판',' lab plaque'):label)}"`):art;return state.locale==='en'?localizeArtworkLabels(localized).replace(/aria-label="([^"]*)"/g,(_,label)=>`aria-label="${CONTENT_EN[label]??(label.endsWith(' 화분')?`${CONTENT_EN[label.slice(0,-3)]??'Indoor plant'} pot`:label.startsWith('도트로 표현한 작은')?'Pixel-art research laboratory':label)}"`):art;}
