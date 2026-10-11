// Small local props keep the feet, chair and desk anchored to the room projection.
// These motions follow the executed activity and never draw from gameplay RNG.
export function activityProps(activity,{wet=false,index=0,kind,facing='front'}={}){
 const paper=['study','coursework','language','paper'].includes(activity);
 if(paper&&facing==='monitor')return `<g data-motion="reading" transform="translate(34 -39) rotate(26)"><g class="mini-activity-prop"><path d="M-13 -3h12v8h-12zM0 -3h12v8H0z" fill="#f4ecdd" stroke="#b9ab95"/><path d="M-10 0h6m7 0h6" stroke="#a8b2a6"/><path class="study-page" d="M0 -3h9v8H0z" fill="#fff7e8"/><g class="study-pencil"><path d="M4 0l7-5 1 2-7 5z" fill="#c59862"/><path d="M4 0l1 2-3 1z" fill="#56676d"/></g></g></g>`;
 if(paper)return `<g data-motion="reading"><g class="mini-activity-prop"><path d="M-14 -30h13v7h-13zM0 -30h13v7h-13z" fill="#f4ecdd" stroke="#b9ab95"/><path d="M-11 -27h7m7 0h7" stroke="#a8b2a6"/><path class="study-page" d="M0 -30h8v7H0z" fill="#fff7e8"/><g class="study-pencil"><path d="M4 -27l7-5 1 2-7 5z" fill="#c59862"/><path d="M4 -27l1 2-3 1z" fill="#56676d"/></g></g></g>`;
 if(wet&&kind==='measurement'&&['experiment','research'].includes(activity))return `<g data-motion="measuring"><g class="lab-pipette"><path d="M23 -37h9v3h-9zM31 -37h4v6h-4z" fill="#95acb6" stroke="#6b8392"/><path d="M35 -33l6 4v5" fill="none" stroke="#8b9d9f"/><path d="M26 -36h3v2h-3z" fill="#c4d8c8"/></g></g>`;
 if(wet&&['experiment','research'].includes(activity))return `<g data-motion="pipetting"><g class="mini-activity-prop"><path d="M27 -36h4v13h-4z" fill="#d6e7e8" stroke="#96aeb2"/><path d="M27 -27h4v4h-4z" fill="#b8c5a6"/><g class="lab-pipette"><path d="M27 -49h2v12h-2z" fill="#819da5"/><path d="M27 -38h2v4h-2z" fill="#e6eeea"/></g><path class="lab-droplet" d="M28 -34h1v3h-1z" fill="#89bcca"/></g></g>`;
 if(['rest','coffee'].includes(activity)){
  const music=index%2===0?'<g class="rest-note"><path d="M-21 -63v-5l4-1v5m-5 1h2v2h-2zm4-1h2v2h-2z" fill="#9b93b3"/></g>':'';
  return `<g data-motion="resting"><path d="M-9 -29h7v6h-7zM-2 -28h3v4h-3z" fill="#f2e6d4" stroke="#b79d86"/><g class="cup-steam"><path d="M-7 -31v-3h1v-3m3 6v-2h1v-3" fill="none" stroke="#c8d8d3" stroke-width="1"/></g>${music}</g>`;
 }
 if(activity==='presentation')return `<g data-motion="rehearsing"><path d="M-16 -32h9v7h-9z" fill="#f6edd8" stroke="#a7b7bb"/><path d="M-14 -29h5m-5 2h3" stroke="#819da7"/><g class="rehearsal-words"><path d="M27 -65h10v2H27zm0 5h15v2H27zm0 5h8v2h-8z" fill="#8facb1"/></g></g>`;
 if(activity==='free'){
  const isMonitor=facing==='monitor',yOff=isMonitor?0:-28;
  const transform=isMonitor?' transform="translate(34 -39) rotate(26)"':'';
  return `<g data-motion="free-thought"${transform}>`+
   `<g class="free-lamp-glow" aria-label="따뜻한 스탠드 조명 빛">`+
    `<polygon points="-28,${yOff-14} 28,${yOff-12} 24,${yOff+14} -32,${yOff+12}" fill="#fef08a" opacity=".22"/>`+
    `<path d="M-16 ${yOff-10}l12 8m-6-10l12 8" stroke="#fef9c3" stroke-width="1" opacity=".4"/>`+
   `</g>`+
   `<g class="mini-activity-prop">`+
    `<g class="free-sketchbook" aria-label="아이디어 스케치북">`+
     `<path class="idea-sketchbook" d="M-14 ${yOff-4}h13v9h-13zM1 ${yOff-4}h13v9H1z" fill="#fdfbf7" stroke="#d5c7b3"/>`+
     `<path d="M-11 ${yOff-1}h8m-8 3h6m8-3h8m-8 3h6" stroke="#b8c2b7"/>`+
     `<path class="sketchbook-spine" d="M-1 ${yOff-4}h2v9h-2z" fill="#e8ded0"/>`+
    `</g>`+
    `<g class="free-postits" aria-label="컬러 포스트잇">`+
     `<path class="postit-yellow" d="M16 ${yOff-5}h5v5h-5z" fill="#fef08a"/>`+
     `<path class="postit-green" d="M22 ${yOff-2}h5v5h-5z" fill="#bbf7d0"/>`+
    `</g>`+
    `<g class="free-mug" aria-label="김이 나는 머그컵">`+
     `<path d="M-22 ${yOff-4}h6v7h-6zM-24 ${yOff-2}h2v4h-2z" fill="#f5ede0" stroke="#c2a893"/>`+
     `<g class="cup-steam"><path d="M-20 ${yOff-6}v-3h1v-3m3 6v-2h1v-3" fill="none" stroke="#c8d8d3" stroke-width="1"/></g>`+
    `</g>`+
   `</g>`+
  `</g>`;
 }
 return '';
}

export function monitorMotion(project,u,v,z){
 const path=(points,cls,color,width=1)=>`<path class="${cls}" d="${points.map((p,i)=>`${i?'L':'M'}${project(...p).join(' ')}`).join('')}" stroke="${color}" stroke-width="${width}" fill="none"/>`;
 return `<g data-motion="analysis">`+
  path([[u+.9,v+.36,z+10],[u+1.5,v+.36,z+14],[u+2,v+.36,z+11],[u+2.9,v+.36,z+19],[u+3.6,v+.36,z+16]],'analysis-trace','#7d9eab',1.3)+
  path([[u+2.8,v+.39,z+15],[u+2.8,v+.39,z+11],[u+3.4,v+.39,z+12],[u+2.8,v+.39,z+15]],'analysis-cursor','#5e7d91',1.2)+
  path([[u+.6,v+.37,z+24],[u+1,v+.37,z+24]],'analysis-status','#d1bd8e',1.8)+'</g>';
}
