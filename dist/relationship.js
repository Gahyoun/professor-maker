// Compatibility for saved runs made before rapport and trust became one relationship.
// New games store only rapport; reading a legacy record does not mutate its source.
export function mergeRelationship(hidden){
 if(!hidden||typeof hidden!=='object'||Array.isArray(hidden))return hidden;
 const out={...hidden};
 if(Object.hasOwn(out,'trust')&&Number.isFinite(out.trust)&&out.trust>=-100&&out.trust<=100&&Number.isFinite(out.rapport)&&out.rapport>=-100&&out.rapport<=100){out.rapport=(out.rapport+out.trust)/2;delete out.trust;}
 return out;
}
