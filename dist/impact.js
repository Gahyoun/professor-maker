// Citation growth is fictional. h itself follows the citation-count definition.
export function hIndex(citations){const sorted=[...citations].sort((a,b)=>b-a);let h=0;for(let i=0;i<sorted.length&&sorted[i]>=i+1;i++)h=i+1;return h;}
export function initialImpact(){return {citations:[],hIndex:0};}
export function validImpact(value,papers){return value&&Array.isArray(value.citations)&&value.citations.length<=papers&&value.citations.every(n=>Number.isInteger(n)&&n>=0&&n<=100000)&&value.hIndex===hIndex(value.citations);}
export function advanceImpact(s){
 s.impact??=initialImpact();while(s.impact.citations.length<s.career.papers)s.impact.citations.push(0);
 const performance=Math.min(1,s.hidden.research/999*.5+s.hidden.language/999*.3+Math.min(1,s.career.awards/4)*.2),luck=(s.hidden.luck+100)/200;
 for(let i=0;i<s.impact.citations.length;i++){
  // An independent hash avoids changing academic-event RNG when citations are updated.
  const draw=((Math.imul((s.creationSeed??s.seed)^(s.month*7919)^(i*104729),2654435761)>>>0)/4294967296);
  const weight=.75*performance+.25*luck;
  if(draw<.15+.5*weight)s.impact.citations[i]=Math.min(100000,s.impact.citations[i]+1+(draw<.08*weight?1:0));
 }
 s.impact.hIndex=hIndex(s.impact.citations);
}
export function externalAdmissionEligible(s,level){return (s.impact?.hIndex??0)>=(level==='bachelor'?1:2);}
