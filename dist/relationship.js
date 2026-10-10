// Compatibility for saved runs made before rapport and trust became one relationship.
// New games store only rapport; reading a legacy record does not mutate its source.
// Changes use normalized 0–100 scores, independently of each stored spectrum.
// Accumulated skills and rapport close a fraction of their remaining growth room above 50.
export function scoreAfterChange(score,gain){
 const current=Math.max(0,Math.min(100,score));
 if(gain<=0)return Math.max(0,current+gain);
 const linear=Math.min(gain,Math.max(0,50-current)),base=current+linear;
 return base+(100-base)*-Math.expm1(-(gain-linear)/50);
}
export const rapportAfterChange=scoreAfterChange;
export function mergeRelationship(hidden){
 if(!hidden||typeof hidden!=='object'||Array.isArray(hidden))return hidden;
 const out={...hidden};
 if(Object.hasOwn(out,'trust')&&Number.isFinite(out.trust)&&out.trust>=-100&&out.trust<=100&&Number.isFinite(out.rapport)&&out.rapport>=-100&&out.rapport<=100){out.rapport=(out.rapport+out.trust)/2;delete out.trust;}
 return out;
}
