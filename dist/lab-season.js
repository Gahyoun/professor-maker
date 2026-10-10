// Calendar-only room decoration. No gameplay RNG, state writes, or animation IDs.
const SEASONS={
 spring:{label:'봄',sky:'#cce3e7',ground:'#b7c9a8',leaves:['#c1cdad','#dfb8c5'],path:'#d6cfb8'},
 summer:{label:'여름',sky:'#badce6',ground:'#9cbb96',leaves:['#78a47d','#8eaf7f'],path:'#d0cbb2'},
 autumn:{label:'가을',sky:'#d5e0e3',ground:'#c5b28a',leaves:['#c99a64','#bd8168'],path:'#d8c7ab'},
 winter:{label:'겨울',sky:'#dce7e9',ground:'#e6e9e3',leaves:[],path:'#c5d2ce'}
};
export function labSeason(state,{idle=false}={}){
 const visual=Number.isFinite(state.visualMonth)?state.visualMonth:idle?state.month:Math.max(0,state.month-1);
 // The completed eight-year calendar remains on its last academic month.
 const displayed=Math.max(0,Math.min(95,Math.floor(visual)));
 const month=(displayed+(state.locale==='en'?8:2))%12+1;
 return month>=3&&month<=5?'spring':month>=6&&month<=8?'summer':month>=9&&month<=11?'autumn':'winter';
}
export function seasonalWindow(state,project,{idle=false}={}){
 const season=labSeason(state,{idle}),p=SEASONS[season],r=(x,y,w,h,fill)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
 // Local window pixels are projected onto the same wall plane as the frame.
 // The nested SVG clips the view without document-wide clipPath IDs (CV-safe).
 const [x,y]=project(.2,8.6,76),width=9.8*9,height=40;
 let art=r(0,0,width,height,p.sky);
 art+=r(4,6,15,2,'#edf1e9')+r(7,4,8,2,'#edf1e9')+r(63,8,18,2,'#ecf0e9')+r(68,6,8,2,'#ecf0e9');
 art+='<path d="M0 23h9v-2h10v-2h12v3h12v-2h12v-2h13v4h10v-1h12v19H0z" fill="#b2c5bd"/>';
 art+=r(32,17,25,16,'#c9cfbe')+r(30,16,29,2,'#a6b4af');
 for(const a of [35,42,49])for(const b of [20,26])art+=r(a,b,4,3,'#93b0b5');
 if(season==='winter')art+=r(30,15,29,2,'#f3f4ed');
 art+=r(0,32,width,8,p.ground)+r(21,35,49,3,p.path);
 for(const [i,cx] of [12,74].entries()){
  art+=r(cx,23,2,12,'#8f9280')+r(cx-4,25,4,1,'#8f9280')+r(cx+2,22,5,1,'#8f9280');
  if(season!=='winter'){
   const c=p.leaves[i%p.leaves.length];
   art+=r(cx-6,18,13,7,c)+r(cx-3,15,7,3,c)+r(cx-8,21,3,3,c)+r(cx+6,20,3,4,c);
   art+=r(cx-3,17,4,2,season==='spring'?'#f1d6dd':season==='autumn'?'#d7b581':'#a5be91');
   if(season==='spring')art+=r(cx-5,21,2,2,'#efd3db')+r(cx+3,19,2,2,'#edc5d1');
   if(season==='autumn')art+=r(cx-5,36,2,1,c)+r(cx+4,38,2,1,c)+r(cx+8,34,1,2,c);
  }else art+=r(cx-4,24,4,1,'#f1f3ed')+r(cx+2,21,5,1,'#f1f3ed')+r(cx-4,35,10,1,'#f6f6ef');
 }
 if(season==='winter')for(const [a,b] of [[9,10],[23,26],[62,12],[80,29],[42,7]])art+=r(a,b,1,1,'#f5f7f2');
 return `<g class="seasonal-window" data-season="${season}" aria-label="창밖의 ${p.label}" transform="matrix(-1 .5 0 1 ${x} ${y})"><svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" overflow="hidden" preserveAspectRatio="none" aria-hidden="true">${art}</svg></g>`;
}
