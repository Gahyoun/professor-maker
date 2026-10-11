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
 return '';
}

export function monitorMotion(project){
 const path=(points,cls,color,width=1)=>`<path class="${cls}" d="${points.map((p,i)=>`${i?'L':'M'}${project(...p).join(' ')}`).join('')}" stroke="${color}" stroke-width="${width}" fill="none"/>`;
 return `<g data-motion="analysis">`+
  path([[.14,.08],[.28,.3],[.42,.14],[.64,.63],[.81,.48]],'analysis-trace','#7d9eab',1.3)+
  path([[.68,.4],[.68,.18],[.83,.25],[.68,.4]],'analysis-cursor','#5e7d91',1.2)+
  path([[.1,.85],[.19,.85]],'analysis-status','#d1bd8e',1.8)+'</g>';
}
