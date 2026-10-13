import {renderLabScene} from './lab-scene.js';
import {DISCIPLINES} from './disciplines.js';

// A bounded, self-contained picture; imported markup is never inserted into the page.
export const MAX_CV_LAB_IMAGE_LENGTH=80000;
const PREFIX='data:image/svg+xml,';
const BASE64_PREFIX='data:image/svg+xml;base64,';
const SVG_NS='http://www.w3.org/2000/svg';
const tags=new Set(['svg','g','path','polygon','polyline','rect','circle','ellipse','line','text','title']);
const numbers=new Set(['x','y','width','height','cx','cy','r','rx','ry','x1','x2','y1','y2','stroke-width','opacity','fill-opacity','stroke-opacity','font-size']);
const enums={
 'shape-rendering':['crispEdges','geometricPrecision','auto'],
 'preserveAspectRatio':['xMidYMid meet','xMidYMid slice','none'],
 'stroke-linejoin':['miter','round','bevel'],'stroke-linecap':['butt','round','square'],
 'fill-rule':['nonzero','evenodd'],'overflow':['hidden','visible'],
 'font-family':['sans-serif','serif','monospace'],'font-weight':['normal','bold','400','600','700'],
 'text-anchor':['start','middle','end'],
};
const scalar=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
const numeric=value=>scalar.test(value)&&Number.isFinite(Number(value))&&Math.abs(Number(value))<=10000;
function vector(value){return value.trim().split(/[\s,]+/).every(numeric);}
function validAttribute(key,value){
 if(key==='xmlns')return value===SVG_NS;
 if(numbers.has(key))return numeric(value);
 if(key==='fill'||key==='stroke')return value==='none'||/^#(?:[\da-f]{3}|[\da-f]{6}|[\da-f]{8})$/i.test(value);
 if(key==='viewBox')return value.trim().split(/[\s,]+/).length===4&&vector(value);
 if(key==='points')return /^[\d\s.,eE+-]+$/.test(value)&&vector(value);
 if(key==='d')return /^[MmLlHhVvCcSsQqTtAaZz\d\s.,eE+-]+$/.test(value)&&[...value.matchAll(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/gi)].every(([n])=>numeric(n));
 if(key==='transform'){
  const parts=[...value.matchAll(/(translate|scale|rotate|matrix|skewX|skewY)\(([^()]*)\)/g)];
  return parts.length>0&&parts.every(part=>vector(part[2]))&&value.replace(/(translate|scale|rotate|matrix|skewX|skewY)\([^()]*\)/g,'').trim()==='';
 }
 return enums[key]?.includes(value)??false;
}
function safeText(text){return !/[<>]/.test(text)&&!/&(?!(?:amp|lt|gt|quot|apos|#\d{1,7}|#x[\da-fA-F]{1,6});)/.test(text)&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/.test(text)&&[...text.matchAll(/&#(x[\da-fA-F]+|\d+);/g)].every(([,s])=>{const n=s[0]==='x'?parseInt(s.slice(1),16):Number(s);return [9,10,13].includes(n)||n>=32&&n<=0x10ffff&&!(n>=0xd800&&n<=0xdfff)&&n!==0xfffe&&n!==0xffff;});}

// This accepts only static SVG geometry, a single XML namespace, and plain text.
// No URL-bearing attributes, CSS, entities, processing instructions or active elements.
function validSVG(svg){
 if(typeof svg!=='string'||svg.length>60000||!svg.startsWith('<svg ')||!svg.endsWith('</svg>'))return false;
 const stack=[];let position=0,count=0;
 while(position<svg.length){
  const at=svg.indexOf('<',position);
  if(at<0)return false;
  if(!safeText(svg.slice(position,at))||!stack.length&&svg.slice(position,at).trim())return false;
  const end=svg.indexOf('>',at);if(end<0)return false;
  const token=svg.slice(at,end+1),close=/^<\/([A-Za-z][\w-]*)\s*>$/.exec(token);
  if(close){if(stack.pop()!==close[1])return false;}
  else{
   const open=/^<([A-Za-z][\w-]*)([\s\S]*?)\s*(\/?)>$/.exec(token);if(!open||!tags.has(open[1])||++count>3000)return false;
   if(!stack.length&&open[1]!=='svg')return false;
   const body=open[2],attributes=new Map();let consumed=0;
   for(const match of body.matchAll(/\s+([A-Za-z][\w-]*)=(["'])([^"'<>]*)\2/g)){
    if(match.index!==consumed||attributes.has(match[1])||!validAttribute(match[1],match[3]))return false;
    consumed=match.index+match[0].length;attributes.set(match[1],match[3]);
   }
   if(body.slice(consumed).trim()||!stack.length&&!attributes.has('xmlns'))return false;
   if(!stack.length&&(attributes.get('width')!=='600'||attributes.get('height')!=='360'||attributes.get('viewBox')!=='0 0 600 360'))return false;
   if(!open[3])stack.push(open[1]);if(stack.length>32)return false;
  }
  position=end+1;
  if(!stack.length&&position!==svg.length)return false;
 }
 return stack.length===0;
}
// Image URLs accept XML text. Escape URL delimiters without the 33% base64
// overhead; the HTML renderer separately escapes the whole src attribute.
const encodeSVG=svg=>svg.replace(/[%#\r\n\t]/g,c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0').toUpperCase());
function decodeImage(image){
 if(typeof image!=='string'||image.length>MAX_CV_LAB_IMAGE_LENGTH)return null;
 try{
  if(image.startsWith(PREFIX)){
   const data=image.slice(PREFIX.length),svg=decodeURIComponent(data);
   if(new TextDecoder('utf-8',{fatal:true}).decode(new TextEncoder().encode(svg))!==svg)return null;
   return data&&encodeSVG(svg)===data?svg:null;
  }
  if(!image.startsWith(BASE64_PREFIX))return null;
  const data=image.slice(BASE64_PREFIX.length);if(!data||data.length%4!==0||!/^[A-Za-z0-9+/]*={0,2}$/.test(data))return null;
  const binary=atob(data);if(btoa(binary)!==data)return null;
  return new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(binary,c=>c.charCodeAt(0)));
 }catch{return null;}
}
function inheritPaint(svg){
 const stack=[];
 return svg.replace(/<[^<>]+>/g,tag=>{
  if(tag.startsWith('</')){stack.pop();return tag;}
  const name=/^<([\w-]+)/.exec(tag)?.[1],parent=stack.at(-1)??{before:1,after:1,stroke:'none',fillBefore:'#000',fillAfter:'#000'};
  const explicit=tag.match(/ stroke-width="([^"]*)"/),before=explicit?Number(explicit[1]):parent.before;
  const fill=tag.match(/ fill="([^"]*)"/),fillBefore=fill?.[1]??parent.fillBefore;
  const stroke=tag.match(/ stroke="([^"]*)"/)?.[1]??parent.stroke;
  let after=explicit?Number(explicit[1]):parent.after,fillAfter=fill?.[1]??parent.fillAfter;
  if(!stack.length){tag=tag.replace(/>$/,' stroke-width=".8" fill="none">');after=.8;fillAfter='none';}
  else if(explicit&&before===parent.after){tag=tag.replace(explicit[0],'');after=parent.after;}
  if(stack.length&&fill&&fillBefore===parent.fillAfter){tag=tag.replace(fill[0],'');fillAfter=parent.fillAfter;}
  if(!explicit&&stroke!=='none'&&['path','rect','circle','ellipse','line','polyline','text'].includes(name)&&before!==after){tag=tag.replace(/\/?\>$/,end=>` stroke-width="${before}"${end}`);after=before;}
  if(!fill&&['path','rect','circle','ellipse','line','polyline','text'].includes(name)&&fillBefore!==fillAfter){tag=tag.replace(/\/?\>$/,end=>` fill="${fillBefore}"${end}`);fillAfter=fillBefore;}
  if(!tag.endsWith('/>'))stack.push({before,after,stroke,fillBefore,fillAfter});
  return tag;
 });
}
function unwrapGroups(svg){
 const stack=[];
 return svg.replace(/<[^<>]+>/g,tag=>{
  if(tag.startsWith('</'))return stack.pop()?tag:'';
  const keep=tag!=='<g>';
  if(!tag.endsWith('/>'))stack.push(keep);
  return keep?tag:'';
 });
}
function polygonPath(points){
 const pairs=points.trim().split(/\s+/).map(pair=>pair.split(',').map(Number));
 let shortest=`M${points}z`;
 // A closed polygon has no visible starting corner or direction. Neither fill
 // rule changes when its whole boundary is reversed; there are no dash/markers.
 for(const vertices of [pairs,[...pairs].reverse()])for(let start=0;start<vertices.length;start++){
  const ordered=[...vertices.slice(start),...vertices.slice(0,start)];let relative=`M${ordered[0].join(' ')}`,last='M';
  for(let i=1;i<ordered.length;i++){
   const dx=Number((ordered[i][0]-ordered[i-1][0]).toFixed(3)),dy=Number((ordered[i][1]-ordered[i-1][1]).toFixed(3));
   const command=dx===0?'v':dy===0?'h':'l',arguments_=dx===0?String(dy):dy===0?String(dx):`${dx} ${dy}`;
   relative+=(command===last?(arguments_[0]==='-'?'':' '):command)+arguments_;last=command;
  }
  relative=minifyPath(relative+'z');if(relative.length<shortest.length)shortest=relative;
 }
 return shortest;
}
const minifyPath=d=>d.replace(/(\d)\s+([+-])/g,'$1$2').replace(/(^|[^\d.])(-?)0\./g,'$1$2.');

function pixelBoundaryPath(cells){
 // A colour's disjoint grid cells have an exact integer boundary. Clockwise
 // outer loops and counterclockwise holes keep the original nonzero fill.
 const occupied=new Set(cells),edges=[],outgoing=new Map(),has=(x,y)=>occupied.has(`${x},${y}`);
 const edge=(x,y,d)=>{const e={x,y,d,used:false};edges.push(e);const key=`${x},${y}`;if(!outgoing.has(key))outgoing.set(key,[]);outgoing.get(key).push(e);};
 for(const cell of occupied){const [x,y]=cell.split(',').map(Number);if(!has(x,y-1))edge(x,y,0);if(!has(x+1,y))edge(x+1,y,1);if(!has(x,y+1))edge(x+1,y+1,2);if(!has(x-1,y))edge(x,y+1,3);}
 const dx=[1,0,-1,0],dy=[0,1,0,-1];let path='',previousStart=null;
 for(const first of edges){
  if(first.used)continue;let current=first,x=first.x,y=first.y,segments=[],direction=null,length=0;
  do{
   current.used=true;if(current.d===direction)length++;else{if(length)segments.push([direction,length]);direction=current.d;length=1;}
   x+=dx[current.d];y+=dy[current.d];
   const next=(outgoing.get(`${x},${y}`)||[]).filter(e=>!e.used);
   if(x===first.x&&y===first.y)break;
   // At a corner shared by diagonal cells, turn right so separate islands do
   // not join through a single vertex or change their holes.
   current=next.sort((a,b)=>[1,0,3,2].indexOf((a.d-current.d+4)%4)-[1,0,3,2].indexOf((b.d-current.d+4)%4))[0];
   if(!current)throw new Error('Open portrait boundary.');
  }while(current);
  if(length)segments.push([direction,length]);
  const absolute=`M${first.x} ${first.y}`,relative=previousStart?minifyPath(`m${first.x-previousStart[0]} ${first.y-previousStart[1]}`):absolute;
  path+=(relative.length<absolute.length?relative:absolute)+segments.slice(0,-1).map(([d,n])=>`${d%2?'v':'h'}${(d===2||d===3)?-n:n}`).join('')+'z';
  previousStart=[first.x,first.y];
 }
 return path;
}
function compactClosedMoves(path){
 // A closed subpath returns to its starting point, so the next absolute move
 // can use the exact integer delta instead. Only our closed grid paths use it.
 let previous=null;
 return path.replace(/(^|z)M([+-]?[\d.]+)[ ,]([+-]?[\d.]+)/g,(whole,prefix,xs,ys)=>{
  const x=Number(xs),y=Number(ys),absolute=`M${xs} ${ys}`,relative=previous?minifyPath(`m${x-previous[0]} ${y-previous[1]}`):absolute;
  previous=[x,y];return prefix+(relative.length<absolute.length?relative:absolute);
 });
}
function compactFloorTiles(svg){
 // Only the49 known, nonoverlapping4×4 floor tiles can be batched. Their
 // shared edges all have the same grout colour and width, so their order cannot
 // affect another object; the room's base and every later object stay in place.
 const point=(u,v)=>`${300+(u-v)*9},${96+(u+v)*4.5}`,expected=new Set();
 for(let u=0;u<28;u+=4)for(let v=0;v<28;v+=4)expected.add([[u,v],[u+4,v],[u+4,v+4],[u,v+4]].map(p=>point(...p)).join(' '));
 return svg.replace(/(<g shape-rendering="crispEdges">)(<polygon points="300,96 552,222 300,348 48,222"[^<>]*\/>)([\s\S]*)/,(whole,open,base,tail)=>{
  const run=/^(?:<polygon[^<>]*\/>){49}/.exec(tail)?.[0];if(!run)return whole;
  const tiles=[...run.matchAll(/<polygon points="([^"]+)" fill="(#[\da-fA-F]{6})" stroke="(#[\da-fA-F]{6})" stroke-width="\.8" stroke-linejoin="miter"\/>/g)];
  if(tiles.length!==49||tiles.map(([tag])=>tag).join('')!==run||new Set(tiles.map(t=>t[3])).size!==1||new Set(tiles.map(t=>t[2])).size!==2||!tiles.every(t=>expected.delete(t[1]))||expected.size)return whole;
  const colours=new Map();for(const [,points,fill]of tiles)colours.set(fill,(colours.get(fill)||'')+polygonPath(points));
  return open+base+`<g stroke="${tiles[0][3]}" stroke-width=".8" stroke-linejoin="miter">`+[...colours].map(([fill,d])=>`<path fill="${fill}" d="${compactClosedMoves(d)}"/>`).join('')+'</g>'+tail.slice(run.length);
 });
}
function compactPortraitPixels(svg){
 // Only the already-resolved portrait has a disjoint pixel grid. Room polygons
 // keep their painter order, and no palette or saved appearance is changed.
 return svg.replace(/(<g class="hair-fringe[^"<>]*"[^<>]*>)([\s\S]*?)(<\/g>)/g,(whole,open,body,close)=>{
  const cells=[...body.matchAll(/<rect x="(\d+)" y="(\d+)" width="(\d+)" height="1" fill="(#[\da-fA-F]{6})"\/>/g)];
  if(!cells.length||cells.map(([cell])=>cell).join('')!==body)return whole;
  const colours=new Map(),last=new Map(),runs=new Map();
  for(const [,xs,ys,ws,fill]of cells){
   if(!colours.has(fill)){colours.set(fill,[]);runs.set(fill,[]);}
   const x=Number(xs),y=Number(ys),w=Number(ws),key=`${fill}:${x}:${w}`,previous=last.get(key);
   for(let px=x;px<x+w;px++)colours.get(fill).push(`${px},${y}`);
   if(previous&&previous.y+previous.h===y)previous.h++;else{const run={x,y,w,h:1};runs.get(fill).push(run);last.set(key,run);}
  }
  return open+[...colours].map(([fill,pixels])=>{
   const boundary=minifyPath(pixelBoundaryPath(pixels)),rectangles=compactClosedMoves(runs.get(fill).map(({x,y,w,h})=>`M${x} ${y}h${w}v${h}h${-w}z`).join(''));
   return `<path fill="${fill}" d="${rectangles.length<boundary.length?rectangles:boundary}"/>`;
  }).join('')+close;
 });
}

function compactSVG(svg){
 // These labels and classes affect accessibility or animation in the game, not pixels.
 return unwrapGroups(inheritPaint(compactPortraitPixels(compactFloorTiles(svg)).replace(/\s(?:class|data-[\w-]+|role|aria-[\w-]+)="[^"]*"/g,'')
  .replace(/\sstyle="width:[\d.]+px;height:[\d.]+px"/g,'')
  .replace(/\spreserveAspectRatio="xMidYMid meet"/g,'')
  .replace(/<svg [^<>]*>/g,tag=>{
   if(tag.includes('xmlns=')||!tag.includes('preserveAspectRatio="none"'))return tag;
   const width=tag.match(/ width="([\d.]+)"/)?.[1],height=tag.match(/ height="([\d.]+)"/)?.[1],viewBox=tag.match(/ viewBox="([^"]+)"/);
   // A window viewport already uses the same unscaled local coordinates.
   return viewBox&&viewBox[1]===`0 0 ${width} ${height}`?tag.replace(viewBox[0],'').replace(' preserveAspectRatio="none"',''):tag;
  })
  // Projection arithmetic has long binary-float tails. Subpixel precision is enough
  // for the fixed 600px image; the maximum coordinate adjustment is 0.005px.
  .replace(/\s([\w-]+)="([^"]*)"/g,(attribute,key,value)=>numbers.has(key)||['points','d','transform','viewBox'].includes(key)?` ${key}="${value.replace(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/gi,n=>String(Number(Number(n).toFixed(key==='transform'?3:2))).replace(/^(-?)0\./,'$1.'))}"`:attribute)
  .replace(/scale\(([+-]?[\d.]+) \1\)/g,'scale($1)')
  .replace(/\sstroke-linejoin="miter"/g,'') // The SVG default is miter.
  // The unsplit leaf has one simple boundary. Its evenodd flag adds no holes;
  // split Monstera leaves keep their two cutouts and their fill rule.
  .replace(/(<path d="M0 0h4v1h3v2h2v2h2v4H9v2H5V9H3V7H1V4H0z"[^<>]*?) fill-rule="evenodd"/g,'$1')
  .replace(/<polygon points="([^"]*)"([^<>]*)\/>/g,(_,points,attributes)=>`<path d="${polygonPath(points)}"${attributes}/>`)
  .replace(/ d="([^"]*)"/g,(_,d)=>` d="${minifyPath(d)}"`)
  .replace(/(?:<(?:path|rect|circle|ellipse|line|polyline)\b[^<>]*\/>)+/g,run=>{
   // Hoist only explicitly identical attributes on adjacent leaf siblings. This
   // preserves both the painter's order and any inherited attributes outside a run.
   let output='',previous=null,leaves=[];
   const flush=()=>{
    if(leaves.length>1&&previous){const attrs=previous.split('|');output+=`<g${attrs.filter(Boolean).join('')}>${leaves.map(leaf=>attrs.filter(Boolean).reduce((s,a)=>s.replace(a,''),leaf)).join('')}</g>`;}
    else output+=leaves.join('');
   };
   for(const [leaf]of run.matchAll(/<(?:path|rect|circle|ellipse|line|polyline)\b[^<>]*\/>/g)){
    const attrs=['stroke','stroke-width'].map(key=>leaf.match(new RegExp(` ${key}="[^"]*"`))?.[0]??''),key=attrs.some(Boolean)?attrs.join('|'):null;
    if(key!==previous){flush();leaves=[];previous=key;}leaves.push(leaf);
   }
   flush();return output;
  })
  .replace(/(?:<rect x="[^"<>]+" y="[^"<>]+" width="[^"<>]+" height="[^"<>]+" fill="#[\da-fA-F]{6}"\/>)+/g,run=>{
   let output='',fill=null,path='';
   const flush=()=>{if(path)output+=`<path fill="${fill}" d="${path}"/>`;};
   for(const [,x,y,w,h,next]of run.matchAll(/<rect x="([^"<>]+)" y="([^"<>]+)" width="([^"<>]+)" height="([^"<>]+)" fill="(#[\da-fA-F]{6})"\/>/g)){
    if(fill!==next){flush();fill=next;path='';}
    path+=`M${x} ${y}h${w}v${h}h${-Number(w)}z`;
   }
   flush();return output;
  }))).replace(/\s([\w-]+)="([^"]*)"/g,(_,key,value)=>` ${key}='${value}'`);
}
export function createCVLabScene(state){
 const month=Math.max(0,state.month-1),fieldId=state.professorProfile.fieldId,labMode=state.professorProfile.labMode;
 const svg=compactSVG(renderLabScene({...state,month,visualMonth:month,pending:null},{actual:'idle'},0,{idle:true,student:true}));
 const scene={version:1,month,fieldId,labMode,image:PREFIX+encodeSVG(svg)};
 if(!validateCVLabScene(scene,state.month))throw new Error('Invalid lab scene snapshot.');
 return scene;
}
export function validateCVLabScene(scene,months){
 if(!scene||typeof scene!=='object'||Array.isArray(scene)||Object.keys(scene).length!==5||!['version','month','fieldId','labMode','image'].every(key=>Object.hasOwn(scene,key)))return false;
 const field=DISCIPLINES.find(d=>d.id===scene.fieldId);
 if(scene.version!==1||!Number.isInteger(scene.month)||scene.month!==Math.max(0,months-1)||!field?.labModes.includes(scene.labMode))return false;
 const svg=decodeImage(scene.image);return svg!==null&&validSVG(svg);
}
