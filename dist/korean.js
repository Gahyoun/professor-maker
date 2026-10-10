// Grammar for generated names and discipline labels. No simulation RNG.
function finalConsonant(word){
 // Ignore closing punctuation around names; keep decomposed Hangul equivalent.
 const last=Array.from(String(word).normalize('NFC').replace(/[\s\p{P}\p{S}]+$/gu,'')).at(-1),code=last?.codePointAt(0);
 if(code>=0xac00&&code<=0xd7a3)return (code-0xac00)%28;
 if(/[0-9]/.test(last??''))return [21,8,0,16,0,0,1,8,8,0][Number(last)];
 // Letter names are appropriate for the acronyms used in research records.
 if(/[a-z]/i.test(last??''))return ({l:8,m:16,n:4,r:8})[last.toLowerCase()]??0;
 return 0;
}
export function particle(word,pair){
 const final=finalConsonant(word),[closed,open]=pair.split('/');
 return pair==='으로/로'?(final&&final!==8?closed:open):(final?closed:open);
}
export function withParticle(word,pair){return String(word)+particle(word,pair);}
const pairs={'은':'은/는','는':'은/는','이':'이/가','가':'이/가','을':'을/를','를':'을/를','과':'과/와','와':'과/와','으로':'으로/로','로':'으로/로','이요':'이요/요','요':'이요/요'};
function suffixFor(word,suffix){
 if(['이었다','였다'].includes(suffix))return finalConsonant(word)?'이었다':'였다';
 if(['이라고','라고'].includes(suffix))return finalConsonant(word)?'이라고':'라고';
 if(['이라는','라는'].includes(suffix))return finalConsonant(word)?'이라는':'라는';
 return pairs[suffix]?particle(word,pairs[suffix]):suffix;
}
// Recompute attached particles when a field-specific noun replaces a template.
export function replaceNounWithParticle(text,source,target){
 const escaped=String(source).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 return String(text).replace(new RegExp(escaped+'(이었다|였다|이라고|라고|이라는|라는|으로|이요|로|은|는|이|가|을|를|과|와|요)?','g'),(_,suffix='')=>String(target)+suffixFor(target,suffix));
}
export function formatStudentName(text,name,locale='ko'){
 if(name==null)return String(text);
 if(locale!=='ko')return String(text).replaceAll('{name}',()=>String(name));
 return String(text).replace(/\{name\}(이었다|였다|이라고|라고|이라는|라는|으로|로|은|는|이|가|을|를|과|와)?/g,(_,suffix='')=>{
  return String(name)+suffixFor(name,suffix);
 });
}
